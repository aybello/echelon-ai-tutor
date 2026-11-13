import { createHash, randomUUID } from "node:crypto";
import { sql } from "drizzle-orm";
import type { Database } from "../stripe/eventLedger";

export function workKey(kind: string, identity: string) {
  return `${kind}:${createHash("sha256").update(identity).digest("hex")}`;
}
const affected = (result: any) =>
  Number(result?.[0]?.affectedRows ?? result?.affectedRows ?? 0);
export class WorkBusyError extends Error {}
export class DeliveryUncertainError extends Error {}

/** Database-time leases serialize replicas; completion survives process restarts. */
export async function claimWork(db: Database, key: string, retryable: boolean) {
  await db.execute(
    sql`INSERT IGNORE INTO scheduled_work (workKey, status) VALUES (${key}, 'pending')`
  );
  const token = randomUUID();
  const eligible = retryable
    ? sql`(status IN ('pending', 'failed') OR (status = 'processing' AND leaseUntil < CURRENT_TIMESTAMP))`
    : sql`status = 'pending'`;
  const result =
    await db.execute(sql`UPDATE scheduled_work SET status = 'processing', claimToken = ${token},
    leaseUntil = DATE_ADD(CURRENT_TIMESTAMP, INTERVAL 5 MINUTE), attempts = attempts + 1, lastError = NULL
    WHERE workKey = ${key} AND ${eligible}`);
  if (affected(result) !== 1) {
    const [rows] = (await db.execute(
      sql`SELECT status FROM scheduled_work WHERE workKey = ${key}`
    )) as any;
    if (rows[0]?.status === "completed") return null;
    if (!retryable)
      throw new DeliveryUncertainError(
        "Email delivery is pending or uncertain; inspect its delivery record before retrying"
      );
    throw new WorkBusyError("Scheduled work is already claimed");
  }
  const assertOwned = async () => {
    const result =
      await db.execute(sql`UPDATE scheduled_work SET leaseVersion = leaseVersion + 1, leaseUntil = DATE_ADD(CURRENT_TIMESTAMP, INTERVAL 5 MINUTE)
      WHERE workKey = ${key} AND status = 'processing' AND claimToken = ${token} AND leaseUntil >= CURRENT_TIMESTAMP`);
    if (affected(result) !== 1)
      throw new WorkBusyError("Scheduled work claim expired or changed");
  };
  const finish = async (
    status: "completed" | "failed" | "uncertain" | "pending",
    error?: unknown
  ) => {
    const result =
      await db.execute(sql`UPDATE scheduled_work SET status = ${status}, claimToken = NULL, leaseUntil = NULL,
      lastError = ${error ? (error instanceof Error ? error.message : String(error)).slice(0, 500) : null},
      completedAt = ${status === "completed" ? new Date() : null}
      WHERE workKey = ${key} AND status = 'processing' AND claimToken = ${token}`);
    if (affected(result) !== 1)
      throw new WorkBusyError("Scheduled work completion lost ownership");
  };
  return { assertOwned, finish };
}

/** SMTP cannot prove exactly-once delivery. Never automatically resend an ambiguous attempt. */
export async function deliverOnce(
  db: Database,
  key: string,
  send: () => Promise<unknown>
) {
  const claim = await claimWork(db, key, false);
  if (!claim) return false;
  try {
    await claim.assertOwned();
    await send();
    await claim.finish("completed");
    return true;
  } catch (error) {
    await claim.finish("uncertain", error);
    throw error;
  }
}
