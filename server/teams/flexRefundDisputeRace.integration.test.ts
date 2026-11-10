import { randomUUID } from "node:crypto";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import mysql from "mysql2/promise";
import { drizzle, type MySql2Database } from "drizzle-orm/mysql2";
import { eq, inArray } from "drizzle-orm";
import { teamFlexLicences, teamFlexOrderItems, teamFlexOrders } from "../../drizzle/schema";
import { assertAuditIntegrationDatabaseTarget } from "../auditIntegrationGuard";

const mocks = vi.hoisted(() => ({ getDb: vi.fn(), notifyOwner: vi.fn().mockResolvedValue(true) }));
vi.mock("../db", () => ({ getDb: mocks.getDb }));
vi.mock("../_core/notification", () => ({ notifyOwner: mocks.notifyOwner }));

import {
  handleFlexDisputeClosed,
  handleFlexDisputeCreated,
  handleFlexFullRefund,
  handleFlexPartialRefund,
  handleFlexUnallocatedRefund,
} from "./flexRefundDisputeHandlers";

// A test must never adopt a deployment database merely because DATABASE_URL exists.
const enabled = process.env.AUDIT_INTEGRATION_TEST_DB === "1";
const rawUrl = process.env.DATABASE_URL;
if (enabled) {
  assertAuditIntegrationDatabaseTarget(rawUrl, url => /^\/echelon_audit_[a-z0-9_]+$/.test(url.pathname));
}
const databaseSuite = describe.skipIf(!enabled);

let pool: mysql.Pool;
let db: MySql2Database;
const runId = randomUUID().replaceAll("-", "").slice(0, 12);
const orderIds: number[] = [];

type Fixture = { orderId: number; paymentIntentId: string; licenceIds: number[] };

async function createOrder(label: string, licenceCount: number, initialStatus = "active"): Promise<Fixture> {
  const paymentIntentId = `pi_${runId}_${label}`;
  const [order] = await db.insert(teamFlexOrders).values({
    organizationId: 9_800_000,
    managerEmail: `flex-race-${runId}@example.test`,
    totalLicences: licenceCount,
    subtotalCents: 5900 * licenceCount,
    totalBeforeTaxCents: 5900 * licenceCount,
    stripePaymentIntentId: paymentIntentId,
    status: "paid",
    paidAt: new Date(),
  }).$returningId();
  orderIds.push(order.id);
  const [item] = await db.insert(teamFlexOrderItems).values({
    orderId: order.id,
    courseKey: "class1-water",
    examFamily: "water",
    pricingBand: "ontario",
    termMonths: 6,
    quantity: licenceCount,
    listUnitPriceCents: 5900,
    discountedUnitPriceCents: 5900,
    lineTotalCents: 5900 * licenceCount,
  }).$returningId();
  const now = new Date();
  const licenceIds: number[] = [];
  for (let index = 0; index < licenceCount; index++) {
    const [licence] = await db.insert(teamFlexLicences).values({
      orderItemId: item.id,
      organizationId: 9_800_000,
      courseKey: "class1-water",
      termMonths: 6,
      status: initialStatus,
      operatorUserId: initialStatus === "active" ? 9_800_100 + index : null,
      activatedAt: initialStatus === "active" ? now : null,
      startsAt: initialStatus === "active" ? now : null,
      accessEndsAt: initialStatus === "active" ? new Date(now.getTime() + 180 * 86_400_000) : null,
      activationDeadline: new Date(now.getTime() + 365 * 86_400_000),
    }).$returningId();
    licenceIds.push(licence.id);
  }
  return { orderId: order.id, paymentIntentId, licenceIds };
}

async function licenceStates(ids: number[]) {
  const rows = await db.select({ id: teamFlexLicences.id, status: teamFlexLicences.status, revokeReason: teamFlexLicences.revokeReason, previousStatus: teamFlexLicences.previousStatus })
    .from(teamFlexLicences).where(inArray(teamFlexLicences.id, ids));
  return rows.sort((a, b) => a.id - b.id);
}
async function orderStatus(id: number) {
  const [row] = await db.select({ status: teamFlexOrders.status }).from(teamFlexOrders).where(eq(teamFlexOrders.id, id));
  return row?.status;
}

beforeAll(async () => {
  if (!enabled) return;
  pool = mysql.createPool({ uri: rawUrl!, connectionLimit: 12 });
  db = drizzle(pool) as unknown as MySql2Database;
  mocks.getDb.mockResolvedValue(db);
});

afterAll(async () => {
  if (!enabled) return;
  if (orderIds.length) {
    const items = await db.select({ id: teamFlexOrderItems.id }).from(teamFlexOrderItems).where(inArray(teamFlexOrderItems.orderId, orderIds));
    if (items.length) await db.delete(teamFlexLicences).where(inArray(teamFlexLicences.orderItemId, items.map(item => item.id)));
    await db.delete(teamFlexOrderItems).where(inArray(teamFlexOrderItems.orderId, orderIds));
    await db.delete(teamFlexOrders).where(inArray(teamFlexOrders.id, orderIds));
  }
  await pool.end();
});

databaseSuite("Course Pass refund and dispute handlers hold the order lock", () => {
  const open = async () => "needs_response";

  it("keeps licences revoked when a dispute is won after a full refund already landed", async () => {
    const order = await createOrder("refund_then_won", 2);
    expect(await handleFlexDisputeCreated(order.paymentIntentId, open)).toEqual({ handled: true, action: "suspended" });
    expect((await licenceStates(order.licenceIds)).map(row => row.status)).toEqual(["suspended", "suspended"]);
    expect(await handleFlexFullRefund(order.paymentIntentId)).toBe(true);
    expect(await handleFlexDisputeClosed(order.paymentIntentId, "won")).toBe(true);
    const after = await licenceStates(order.licenceIds);
    expect(after.map(row => row.status)).toEqual(["revoked", "revoked"]);
    expect(after.map(row => row.revokeReason)).toEqual(["full_refund", "full_refund"]);
    expect(await orderStatus(order.orderId)).toBe("refunded");
  });

  it("restores the unrefunded licences when a dispute is won after a partial refund", async () => {
    const order = await createOrder("partial_then_won", 3);
    await handleFlexDisputeCreated(order.paymentIntentId, open);
    expect(await handleFlexPartialRefund(order.paymentIntentId, [order.licenceIds[0]])).toBe(true);
    await handleFlexDisputeClosed(order.paymentIntentId, "won");
    const after = await licenceStates(order.licenceIds);
    expect(after[0]).toMatchObject({ status: "revoked", revokeReason: "partial_refund" });
    // Only the refunded licence stays revoked. The other two were paid for and
    // the dispute was won, so access comes back.
    expect(after[1]).toMatchObject({ status: "active", previousStatus: null });
    expect(after[2]).toMatchObject({ status: "active", previousStatus: null });
    expect(await orderStatus(order.orderId)).toBe("partially_refunded");
  });

  it("restores access on a clean dispute win and revokes on a loss", async () => {
    const won = await createOrder("clean_won", 2);
    await handleFlexDisputeCreated(won.paymentIntentId, open);
    await handleFlexDisputeClosed(won.paymentIntentId, "won");
    expect((await licenceStates(won.licenceIds)).map(row => row.status)).toEqual(["active", "active"]);
    expect(await orderStatus(won.orderId)).toBe("paid");
    const lost = await createOrder("clean_lost", 1);
    await handleFlexDisputeCreated(lost.paymentIntentId, open);
    await handleFlexDisputeClosed(lost.paymentIntentId, "lost");
    expect((await licenceStates(lost.licenceIds))[0]).toMatchObject({ status: "revoked", revokeReason: "dispute_lost" });
    expect(await orderStatus(lost.orderId)).toBe("refunded");
  });

  it("never suspends or resurrects a cancelled licence through a dispute", async () => {
    const order = await createOrder("cancelled_licence", 2);
    await db.update(teamFlexLicences).set({ status: "cancelled" }).where(eq(teamFlexLicences.id, order.licenceIds[1]));
    await handleFlexDisputeCreated(order.paymentIntentId, open);
    expect((await licenceStates(order.licenceIds)).map(row => row.status)).toEqual(["suspended", "cancelled"]);
    await handleFlexDisputeClosed(order.paymentIntentId, "won");
    expect((await licenceStates(order.licenceIds)).map(row => row.status)).toEqual(["active", "cancelled"]);
  });

  it("re-reads the dispute after taking the order lock so a closure that lands first wins", async () => {
    // Sol's sequence: the creation handler has read "needs_response", then the
    // closure commits, then the creation handler proceeds. Because the read
    // happens under the lock, the fetcher below observes the closure instead.
    const order = await createOrder("stale_read", 2);
    let reads = 0;
    const fetcher = async () => {
      reads += 1;
      // The closure is applied while the creation handler holds the lock and
      // asks Stripe: by then Stripe reports the dispute as won.
      return "won";
    };
    const result = await handleFlexDisputeCreated(order.paymentIntentId, fetcher);
    expect(result).toEqual({ handled: true, action: "already_closed" });
    expect(reads).toBe(1);
    expect((await licenceStates(order.licenceIds)).map(row => row.status)).toEqual(["active", "active"]);
    expect(await orderStatus(order.orderId)).toBe("paid");
    // Stripe unreachable: the handler must throw so the webhook returns 503,
    // and must not have suspended anything.
    await expect(handleFlexDisputeCreated(order.paymentIntentId, async () => { throw new Error("stripe down"); })).rejects.toThrow("stripe down");
    expect((await licenceStates(order.licenceIds)).map(row => row.status)).toEqual(["active", "active"]);
  });

  it("treats a closed inquiry as a win and never rewrites a cancelled licence", async () => {
    const order = await createOrder("inquiry", 3);
    await db.update(teamFlexLicences).set({ status: "cancelled" }).where(eq(teamFlexLicences.id, order.licenceIds[2]));
    await handleFlexDisputeCreated(order.paymentIntentId, open);
    expect((await licenceStates(order.licenceIds)).map(row => row.status)).toEqual(["suspended", "suspended", "cancelled"]);
    // Late creation for an inquiry that closed in our favour.
    await handleFlexDisputeCreated(order.paymentIntentId, async () => "warning_closed");
    expect((await licenceStates(order.licenceIds)).map(row => row.status)).toEqual(["active", "active", "cancelled"]);
    expect(await orderStatus(order.orderId)).toBe("paid");
    // Refunding the two live licences is a full refund; the cancelled one is not "live".
    await handleFlexPartialRefund(order.paymentIntentId, [order.licenceIds[0], order.licenceIds[1]]);
    expect(await orderStatus(order.orderId)).toBe("refunded");
    expect((await licenceStates(order.licenceIds)).map(row => row.status)).toEqual(["revoked", "revoked", "cancelled"]);
    // A loss on another order with a cancelled licence leaves that licence's history alone.
    const lost = await createOrder("lost_with_cancelled", 2);
    await db.update(teamFlexLicences).set({ status: "cancelled" }).where(eq(teamFlexLicences.id, lost.licenceIds[1]));
    await handleFlexDisputeClosed(lost.paymentIntentId, "lost");
    expect((await licenceStates(lost.licenceIds)).map(row => row.status)).toEqual(["revoked", "cancelled"]);
  });

  it("applies the outcome when the creation event arrives after the dispute already closed", async () => {
    const won = await createOrder("reversed_won", 2);
    await handleFlexDisputeClosed(won.paymentIntentId, "won");
    // Late creation event; Stripe now reports the dispute as won.
    await handleFlexDisputeCreated(won.paymentIntentId, async () => "won");
    expect((await licenceStates(won.licenceIds)).map(row => row.status)).toEqual(["active", "active"]);
    expect(await orderStatus(won.orderId)).toBe("paid");
    const lost = await createOrder("reversed_lost", 2);
    await handleFlexDisputeClosed(lost.paymentIntentId, "lost");
    expect((await licenceStates(lost.licenceIds)).map(row => row.status)).toEqual(["revoked", "revoked"]);
    await handleFlexDisputeCreated(lost.paymentIntentId, async () => "lost");
    expect((await licenceStates(lost.licenceIds)).map(row => row.status)).toEqual(["revoked", "revoked"]);
    expect(await orderStatus(lost.orderId)).toBe("refunded");
  });

  it("keeps an unallocated refund flagged for a human through a dispute", async () => {
    const order = await createOrder("reconciliation_hold", 2);
    expect(await handleFlexUnallocatedRefund(order.paymentIntentId)).toBe(true);
    expect(await orderStatus(order.orderId)).toBe("reconciliation_needed");
    await handleFlexDisputeCreated(order.paymentIntentId, async () => "needs_response");
    expect(await orderStatus(order.orderId)).toBe("reconciliation_needed");
    expect((await licenceStates(order.licenceIds)).map(row => row.status)).toEqual(["suspended", "suspended"]);
    await handleFlexDisputeClosed(order.paymentIntentId, "won");
    expect((await licenceStates(order.licenceIds)).map(row => row.status)).toEqual(["active", "active"]);
    expect(await orderStatus(order.orderId)).toBe("reconciliation_needed");
    expect(mocks.notifyOwner).toHaveBeenCalled();
  });

  it("settles an order as refunded once every licence has been refunded one by one", async () => {
    const order = await createOrder("piecewise", 2);
    await handleFlexPartialRefund(order.paymentIntentId, [order.licenceIds[0]]);
    expect(await orderStatus(order.orderId)).toBe("partially_refunded");
    await handleFlexPartialRefund(order.paymentIntentId, [order.licenceIds[1]]);
    expect(await orderStatus(order.orderId)).toBe("refunded");
    // A later unallocated refund on a fully refunded order has nothing to allocate.
    mocks.notifyOwner.mockClear();
    await handleFlexUnallocatedRefund(order.paymentIntentId);
    expect(await orderStatus(order.orderId)).toBe("refunded");
    expect(mocks.notifyOwner).not.toHaveBeenCalled();
  });

  it("serializes a concurrent refund and dispute win so no licence ends up active", async () => {
    for (let round = 0; round < 4; round++) {
      const order = await createOrder(`race_${round}`, 3);
      await handleFlexDisputeCreated(order.paymentIntentId, open);
      await Promise.all([
        handleFlexFullRefund(order.paymentIntentId),
        handleFlexDisputeClosed(order.paymentIntentId, "won"),
      ]);
      const after = await licenceStates(order.licenceIds);
      // Whichever handler won the lock, the refund is the last word on the money:
      // either the refund ran second and revoked everything, or it ran first and
      // the dispute handler saw a refunded order and declined to restore.
      expect(after.every(row => row.status === "revoked")).toBe(true);
      expect(await orderStatus(order.orderId)).toBe("refunded");
    }
  });
});
