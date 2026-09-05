import { randomUUID } from "node:crypto";
import { and, eq, inArray, lte } from "drizzle-orm";
import { purchases, purchaseEmailOutbox, type InsertPurchase } from "../drizzle/schema";
import { getDb } from "./db";
import { sendPurchaseConfirmationEmail, type PurchaseConfirmationPayload } from "./email";
import { PRODUCT_STUDY_PATHS } from "./stripe/products";

type Database = NonNullable<Awaited<ReturnType<typeof getDb>>>;

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

/** Bounded worker with expiring claims. SMTP is at-least-once, not exactly-once. */
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

export async function startPurchaseEmailJob() {
  const { default: cron } = await import("node-cron");
  cron.schedule("* * * * *", async () => {
    try { const db = await getDb(); if (db) await deliverPurchaseEmails(db); }
    catch (error) { console.error("[purchase-email] Worker failed", error); }
  });
}
