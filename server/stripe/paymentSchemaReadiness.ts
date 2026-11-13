import { sql } from "drizzle-orm";
import type { Database } from "./eventLedger";

/**
 * These are the exact durable writes required by a current Individual Exam Pass:
 * payment-state lock, access record, and confirmation delivery intent. A failed
 * probe means no Checkout Session is created, so a learner cannot pay into a
 * schema that the signed webhook cannot fulfil.
 */
const INDIVIDUAL_PAYMENT_SCHEMA_PROBES = [
  "SELECT `stripeEventId`, `status`, `dbProcessed`, `emailDelivered`, `analyticsProcessed`, `attemptCount`, `processingToken`, `processingStartedAt`, `lastError`, `completedAt` FROM `stripe_event_log` LIMIT 0",
  "SELECT `stripeSessionId`, `stripePaymentIntentId`, `email`, `productKey`, `productName`, `amountCAD`, `status`, `accessExpiresAt`, `refundedAt` FROM `purchases` LIMIT 0",
  "SELECT `stripeSessionId`, `payload`, `status`, `attempts`, `availableAt`, `leaseToken`, `sentAt` FROM `purchase_email_outbox` LIMIT 0",
] as const;

export class IndividualPaymentSchemaError extends Error {
  constructor() {
    super("Individual payment persistence schema is not ready");
    this.name = "IndividualPaymentSchemaError";
  }
}

export type ReadOnlySqlQuery = (statement: string) => Promise<unknown>;

/** Exported so a release preflight and live checkout use the same exact checks. */
export async function verifyIndividualPaymentSchema(query: ReadOnlySqlQuery): Promise<void> {
  try {
    for (const statement of INDIVIDUAL_PAYMENT_SCHEMA_PROBES) await query(statement);
  } catch {
    // Do not surface a database driver's table/column detail to a checkout visitor.
    throw new IndividualPaymentSchemaError();
  }
}

const successfulChecks = new WeakMap<object, number>();
const SUCCESS_TTL_MS = 30_000;

/** Successful results are short-lived only. Failure is never cached as success. */
export async function assertIndividualPaymentSchemaReady(db: Database, now = Date.now()): Promise<void> {
  const lastReadyAt = successfulChecks.get(db as object);
  if (lastReadyAt !== undefined && now - lastReadyAt < SUCCESS_TTL_MS) return;
  await verifyIndividualPaymentSchema(statement => db.execute(sql.raw(statement)));
  successfulChecks.set(db as object, now);
}

export function resetIndividualPaymentSchemaReadinessForTest() {
  // WeakMap cannot be cleared. Tests receive fresh synthetic DB objects instead.
}
