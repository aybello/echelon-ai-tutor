import { randomUUID } from "node:crypto";
import { and, eq, inArray, lte } from "drizzle-orm";
import { purchases, purchaseEmailOutbox, type InsertPurchase } from "../drizzle/schema";
import {
  createHeartbeatJob,
  listHeartbeatJobs,
  updateHeartbeatJob,
} from "./_core/heartbeat";
import { getDb } from "./db";
import { sendPurchaseConfirmationEmail, type PurchaseConfirmationPayload } from "./email";
import { PRODUCT_STUDY_PATHS } from "./stripe/products";

type Database = NonNullable<Awaited<ReturnType<typeof getDb>>>;

const PURCHASE_EMAIL_HEARTBEAT = {
  name: "echelon-purchase-email-delivery",
  cron: "0 * * * * *",
  path: "/api/scheduled/purchase-email-delivery",
  method: "POST" as const,
  description:
    "Deliver queued individual purchase confirmation emails every minute.",
};

/** Purchase and delivery intent commit together. No historical email backfill. */
export async function recordPurchaseWithConfirmation(db: Database, purchase: InsertPurchase) {
  const paths = PRODUCT_STUDY_PATHS[purchase.productKey] ?? { quizPath: "/quiz", mockPath: "/quiz" };
  const payload: PurchaseConfirmationPayload = {
    email: purchase.email, productKey: purchase.productKey, productName: purchase.productName,
    amountCAD: purchase.amountCAD, ...paths,
  };
  await db.transaction(async tx => {
    await tx.insert(purchases).values(purchase);
    await tx.insert(purchaseEmailOutbox).values({ stripeSessionId: purchase.stripeSessionId, payload: JSON.stringify(payload) });
  });
}

/** Bounded delivery batch with expiring claims. SMTP is at-least-once, not exactly-once. */
export async function deliverPurchaseEmails(db: Database, send = sendPurchaseConfirmationEmail, now = new Date(), onlySessionId?: string) {
  const ready = and(inArray(purchaseEmailOutbox.status, ["pending", "sending"]), lte(purchaseEmailOutbox.availableAt, now),
    onlySessionId ? eq(purchaseEmailOutbox.stripeSessionId, onlySessionId) : undefined);
  const rows = await db.select().from(purchaseEmailOutbox).where(ready).orderBy(purchaseEmailOutbox.id).limit(25);
  let sent = 0;
  for (const row of rows) {
    const leaseToken = randomUUID();
    const [claim] = await db.update(purchaseEmailOutbox).set({
      status: "sending", leaseToken, attempts: row.attempts + 1,
      availableAt: new Date(now.getTime() + 10 * 60_000),
    }).where(and(eq(purchaseEmailOutbox.id, row.id), ready));
    if (claim.affectedRows !== 1) continue;
    const owned = and(eq(purchaseEmailOutbox.id, row.id), eq(purchaseEmailOutbox.leaseToken, leaseToken));
    try {
      await send(JSON.parse(row.payload) as PurchaseConfirmationPayload);
      await db.update(purchaseEmailOutbox).set({ status: "sent", sentAt: new Date(), leaseToken: null }).where(owned);
      sent++;
    } catch {
      const attempts = row.attempts + 1;
      await db.update(purchaseEmailOutbox).set({
        status: attempts >= 8 ? "failed" : "pending", leaseToken: null,
        availableAt: new Date(now.getTime() + Math.min(360, 2 ** attempts) * 60_000),
      }).where(owned);
      console.error(`[purchase-email] Delivery failed for queue item ${row.id}, attempt ${attempts}`);
    }
  }
  return { sent };
}

type PurchaseEmailDeliveryDependencies = {
  getDatabase: typeof getDb;
  deliver: typeof deliverPurchaseEmails;
};

/** Run one bounded delivery batch from the protected scheduled endpoint. */
export async function runPurchaseEmailDelivery(
  dependencies: PurchaseEmailDeliveryDependencies = {
    getDatabase: getDb,
    deliver: deliverPurchaseEmails,
  }
) {
  const db = await dependencies.getDatabase();
  if (!db) throw new Error("Database unavailable for purchase email delivery");
  return dependencies.deliver(db);
}

type HeartbeatDependencies = {
  list: typeof listHeartbeatJobs;
  create: typeof createHeartbeatJob;
  update: typeof updateHeartbeatJob;
};

/**
 * Idempotently create or repair the platform-managed delivery schedule. The
 * schedule survives autoscale instance shutdown and never relies on a local
 * process timer.
 */
export async function ensurePurchaseEmailHeartbeat(
  dependencies: HeartbeatDependencies = {
    list: listHeartbeatJobs,
    create: createHeartbeatJob,
    update: updateHeartbeatJob,
  }
): Promise<"created" | "updated" | "unchanged"> {
  const { jobs } = await dependencies.list("", { page: 1, pageSize: 100 });
  const existing = jobs.find(job => job.name === PURCHASE_EMAIL_HEARTBEAT.name);
  if (!existing) {
    await dependencies.create(PURCHASE_EMAIL_HEARTBEAT, "");
    return "created";
  }

  const isCurrent =
    existing.cronExpression === PURCHASE_EMAIL_HEARTBEAT.cron &&
    existing.callbackPath === PURCHASE_EMAIL_HEARTBEAT.path &&
    existing.callbackMethod.toUpperCase() === PURCHASE_EMAIL_HEARTBEAT.method &&
    existing.description === PURCHASE_EMAIL_HEARTBEAT.description &&
    existing.isEnable;
  if (isCurrent) return "unchanged";

  await dependencies.update(
    existing.taskUid,
    {
      cron: PURCHASE_EMAIL_HEARTBEAT.cron,
      path: PURCHASE_EMAIL_HEARTBEAT.path,
      method: PURCHASE_EMAIL_HEARTBEAT.method,
      description: PURCHASE_EMAIL_HEARTBEAT.description,
      enable: true,
    },
    ""
  );
  return "updated";
}
