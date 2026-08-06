import { randomUUID } from "node:crypto";
import { eq, sql } from "drizzle-orm";
import { stripeEventLog } from "../../drizzle/schema";
import type { getDb } from "../db";

export type Database = NonNullable<Awaited<ReturnType<typeof getDb>>>;

export interface ClaimEventInput {
  stripeEventId: string;
  eventType: string;
  stripeObjectId?: string | null;
  orgId?: number | null;
}

export type ClaimEventResult =
  | { state: "claimed"; token: string; event: typeof stripeEventLog.$inferSelect }
  | { state: "completed"; event: typeof stripeEventLog.$inferSelect }
  | { state: "busy"; event: typeof stripeEventLog.$inferSelect };

function isDuplicateKey(error: unknown): boolean {
  const candidate = error as {
    code?: string;
    errno?: number;
    cause?: { code?: string; errno?: number };
  };
  return (
    candidate?.code === "ER_DUP_ENTRY" ||
    candidate?.errno === 1062 ||
    candidate?.cause?.code === "ER_DUP_ENTRY" ||
    candidate?.cause?.errno === 1062
  );
}

function affectedRows(result: unknown): number {
  const candidate = result as any;
  return Number(
    candidate?.[0]?.affectedRows ??
    candidate?.affectedRows ??
    0,
  );
}

export async function claimStripeEvent(
  db: Database,
  input: ClaimEventInput,
): Promise<ClaimEventResult> {
  // Register the event if it does not exist yet
  try {
    await db.insert(stripeEventLog).values({
      stripeEventId: input.stripeEventId,
      eventType: input.eventType,
      stripeObjectId: input.stripeObjectId ?? null,
      orgId: input.orgId ?? null,
      status: "pending",
      dbProcessed: false,
      emailDelivered: false,
      attemptCount: 0,
    });
  } catch (error) {
    if (!isDuplicateKey(error)) {
      throw error;
    }
    // Duplicate key = already registered, continue to claim
  }

  const token = randomUUID();

  // Only one request may move an eligible event into processing.
  // A processing event may be reclaimed after 10 minutes in case the previous
  // worker crashed while holding the claim.
  const updateResult = await db.execute(sql`
    UPDATE stripe_event_log
    SET
      status = 'processing',
      processingToken = ${token},
      processingStartedAt = CURRENT_TIMESTAMP,
      attemptCount = attemptCount + 1
    WHERE stripeEventId = ${input.stripeEventId}
      AND (
        status IN ('pending', 'failed', 'db_completed_email_pending')
        OR (
          status = 'processing'
          AND processingStartedAt < DATE_SUB(CURRENT_TIMESTAMP, INTERVAL 10 MINUTE)
        )
      )
  `);

  const rows = await db
    .select()
    .from(stripeEventLog)
    .where(eq(stripeEventLog.stripeEventId, input.stripeEventId))
    .limit(1);

  const event = rows[0];

  if (!event) {
    throw new Error(`Stripe event ${input.stripeEventId} disappeared after registration`);
  }

  if (affectedRows(updateResult) === 1) {
    return { state: "claimed", token, event };
  }

  if (event.status === "completed") {
    return { state: "completed", event };
  }

  return { state: "busy", event };
}

export async function markStripeEventFailed(
  db: Database,
  stripeEventId: string,
  token: string,
  error: unknown,
): Promise<void> {
  const message = error instanceof Error ? error.message : String(error);
  await db.execute(sql`
    UPDATE stripe_event_log
    SET
      status = CASE
        WHEN dbProcessed = true THEN 'db_completed_email_pending'
        ELSE 'failed'
      END,
      processingToken = NULL,
      processingStartedAt = NULL,
      lastError = ${message}
    WHERE stripeEventId = ${stripeEventId}
      AND processingToken = ${token}
  `);
}

export async function markStripeEventCompleted(
  db: Database,
  stripeEventId: string,
  token: string,
): Promise<void> {
  await db.execute(sql`
    UPDATE stripe_event_log
    SET
      status = 'completed',
      emailDelivered = true,
      processingToken = NULL,
      processingStartedAt = NULL,
      lastError = NULL,
      completedAt = CURRENT_TIMESTAMP
    WHERE stripeEventId = ${stripeEventId}
      AND processingToken = ${token}
  `);
}
