import { and, desc, eq, gt, isNull, lt, sql } from "drizzle-orm";
import { dashboardOtps, emailOtpCodes, magicLinks } from "../../drizzle/schema";
import type { getDb } from "../db";

type Database = NonNullable<Awaited<ReturnType<typeof getDb>>>;
type OtpTable = typeof emailOtpCodes | typeof dashboardOtps;

export const OTP_MAX_ATTEMPTS = 5;
export type OtpVerificationResult =
  | { valid: true }
  | { valid: false; reason: "expired" | "too_many_attempts" }
  | { valid: false; reason: "wrong_code"; attemptsRemaining: number };

/**
 * Serialize verification on the latest code, including used/expired rows. Never
 * fall back to an older code after consuming the latest one. All state checks
 * happen after acquiring the lock, so expiry while waiting also fails closed.
 * Return failures rather than throwing inside the transaction: wrong attempts
 * must commit before the router reports an error. Sessions are issued by callers
 * only after this transaction has successfully committed its one-time claim.
 */
export async function verifyAndConsumeOtp(
  db: Database,
  table: OtpTable,
  email: string,
  incomingHash: string,
): Promise<OtpVerificationResult> {
  return db.transaction(async (tx) => {
    const [row] = await tx.select().from(table)
      .where(eq(table.email, email))
      .orderBy(desc(table.createdAt), desc(table.id))
      .limit(1)
      .for("update");
    const now = new Date();
    if (!row || row.usedAt || row.expiresAt.getTime() <= now.getTime()) {
      return { valid: false, reason: "expired" };
    }
    if (row.attempts >= OTP_MAX_ATTEMPTS) {
      return { valid: false, reason: "too_many_attempts" };
    }

    const claimable = and(
      eq(table.id, row.id),
      isNull(table.usedAt),
      gt(table.expiresAt, now),
      lt(table.attempts, OTP_MAX_ATTEMPTS),
    );
    if (row.codeHash !== incomingHash) {
      const [result] = await tx.update(table)
        .set({ attempts: sql`${table.attempts} + 1` })
        .where(claimable);
      if (result.affectedRows !== 1) return { valid: false, reason: "expired" };
      return {
        valid: false,
        reason: "wrong_code",
        attemptsRemaining: OTP_MAX_ATTEMPTS - row.attempts - 1,
      };
    }

    const [result] = await tx.update(table).set({ usedAt: now })
      .where(and(claimable, eq(table.codeHash, incomingHash)));
    return result.affectedRows === 1
      ? { valid: true }
      : { valid: false, reason: "expired" };
  });
}

/** Legacy links remain valid, but only the transaction that claims one may log in. */
export async function consumeMagicLinkAtomically(db: Database, incomingHash: string) {
  return db.transaction(async (tx) => {
    const [link] = await tx.select().from(magicLinks)
      .where(eq(magicLinks.tokenHash, incomingHash))
      .limit(1)
      .for("update");
    const now = new Date();
    if (!link || link.usedAt || link.expiresAt.getTime() <= now.getTime()) return null;

    const [result] = await tx.update(magicLinks).set({ usedAt: now }).where(and(
      eq(magicLinks.id, link.id),
      eq(magicLinks.tokenHash, incomingHash),
      isNull(magicLinks.usedAt),
      gt(magicLinks.expiresAt, now),
    ));
    return result.affectedRows === 1 ? link : null;
  });
}
