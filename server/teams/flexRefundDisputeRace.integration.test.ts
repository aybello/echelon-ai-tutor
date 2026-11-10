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
  it("keeps licences revoked when a dispute is won after a full refund already landed", async () => {
    const order = await createOrder("refund_then_won", 2);
    expect(await handleFlexDisputeCreated(order.paymentIntentId)).toBe(true);
    expect((await licenceStates(order.licenceIds)).map(row => row.status)).toEqual(["suspended", "suspended"]);
    expect(await handleFlexFullRefund(order.paymentIntentId)).toBe(true);
    expect(await handleFlexDisputeClosed(order.paymentIntentId, "won")).toBe(true);
    const after = await licenceStates(order.licenceIds);
    expect(after.map(row => row.status)).toEqual(["revoked", "revoked"]);
    expect(after.map(row => row.revokeReason)).toEqual(["full_refund", "full_refund"]);
    expect(await orderStatus(order.orderId)).toBe("refunded");
  });

  it("does not let a dispute win restore licences from a partially refunded order", async () => {
    const order = await createOrder("partial_then_won", 3);
    await handleFlexDisputeCreated(order.paymentIntentId);
    expect(await handleFlexPartialRefund(order.paymentIntentId, [order.licenceIds[0]])).toBe(true);
    await handleFlexDisputeClosed(order.paymentIntentId, "won");
    const after = await licenceStates(order.licenceIds);
    expect(after[0]).toMatchObject({ status: "revoked", revokeReason: "partial_refund" });
    // The two unrefunded licences were suspended by the dispute; money for them was
    // partially returned on this order, so they are revoked rather than restored.
    expect(after[1]).toMatchObject({ status: "revoked", revokeReason: "refunded_before_dispute_closed" });
    expect(after[2]).toMatchObject({ status: "revoked", revokeReason: "refunded_before_dispute_closed" });
    expect(await orderStatus(order.orderId)).toBe("partially_refunded");
  });

  it("restores access on a clean dispute win and revokes on a loss", async () => {
    const won = await createOrder("clean_won", 2);
    await handleFlexDisputeCreated(won.paymentIntentId);
    await handleFlexDisputeClosed(won.paymentIntentId, "won");
    expect((await licenceStates(won.licenceIds)).map(row => row.status)).toEqual(["active", "active"]);
    expect(await orderStatus(won.orderId)).toBe("paid");
    const lost = await createOrder("clean_lost", 1);
    await handleFlexDisputeCreated(lost.paymentIntentId);
    await handleFlexDisputeClosed(lost.paymentIntentId, "lost");
    expect((await licenceStates(lost.licenceIds))[0]).toMatchObject({ status: "revoked", revokeReason: "dispute_lost" });
    expect(await orderStatus(lost.orderId)).toBe("refunded");
  });

  it("serializes a concurrent refund and dispute win so no licence ends up active", async () => {
    for (let round = 0; round < 4; round++) {
      const order = await createOrder(`race_${round}`, 3);
      await handleFlexDisputeCreated(order.paymentIntentId);
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
