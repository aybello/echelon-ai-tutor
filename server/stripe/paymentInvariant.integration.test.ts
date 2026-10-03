import { randomUUID } from "node:crypto";
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import type { Request, Response } from "express";
import Stripe from "stripe";
import mysql from "mysql2/promise";
import { drizzle } from "drizzle-orm/mysql2";
import { and, eq, inArray, like } from "drizzle-orm";
import { productAnalyticsEvents, purchaseEmailOutbox, purchases, stripeEventLog } from "../../drizzle/schema";
import type { Database } from "./eventLedger";
import { assertAuditIntegrationDatabaseTarget } from "../auditIntegrationGuard";

const mocks = vi.hoisted(() => ({ getDb: vi.fn(), retrieve: vi.fn(), notify: vi.fn(), track: vi.fn() }));
vi.mock("../db", () => ({ getDb: mocks.getDb }));
vi.mock("../_core/notification", () => ({ notifyOwner: mocks.notify }));
vi.mock("../analytics", () => ({
  trackEvent: mocks.track,
  hashAnalyticsEmail: (email: string) => `synthetic_${email.length}`,
}));
vi.mock("../teams/flexRefundDisputeHandlers", () => ({
  handleFlexDisputeClosed: vi.fn().mockResolvedValue(false), handleFlexDisputeCreated: vi.fn().mockResolvedValue(false),
  handleFlexFullRefund: vi.fn().mockResolvedValue(false), handleFlexPartialRefund: vi.fn().mockResolvedValue(false),
  handleFlexUnallocatedRefund: vi.fn().mockResolvedValue(false),
}));
vi.mock("./stripe", async () => {
  const { default: StripeSDK } = await import("stripe");
  const sdk = new StripeSDK("sk_test_synthetic_no_requests");
  return { stripe: {
    webhooks: { constructEvent: sdk.webhooks.constructEvent.bind(sdk.webhooks) },
    paymentIntents: { retrieve: mocks.retrieve },
  } };
});

import { registerStripeWebhook } from "./webhook";
import { fulfilIndividualPurchase } from "./fulfilIndividualPurchase";
import { readPaymentState, paymentStateLedgerId, withPaymentState } from "./paymentState";
import * as paymentStateModule from "./paymentState";
import { INDIVIDUAL_EXAM_PASS_ENTITLEMENT_TYPE, INDIVIDUAL_EXAM_PASS_POLICY_VERSION } from "./individualExamPass";

// A test must never adopt a deployment database merely because DATABASE_URL exists.
const enabled = process.env.AUDIT_INTEGRATION_TEST_DB === "1";
const rawUrl = process.env.DATABASE_URL;
if (enabled) {
  assertAuditIntegrationDatabaseTarget(rawUrl,
    url => /^\/echelon_audit_[a-z0-9_]+$/.test(url.pathname));
}
const databaseSuite = describe.skipIf(!enabled);
const runId = `pay_${randomUUID().replaceAll("-", "")}`;
const sdk = new Stripe("sk_test_synthetic_no_requests");
const secret = "whsec_synthetic_payment_invariant";
const paidAt = Date.parse("2024-02-29T12:34:56.000Z") / 1000;
const expectedExpiry = new Date("2025-02-28T12:34:56.000Z");
let db: Database;
let pool: mysql.Pool;
let handler: (req: Request, res: Response) => Promise<unknown>;
const sessionIds: string[] = [];
const paymentIds: string[] = [];
const eventIds: string[] = [];

function fixture(label: string) {
  const id = `${runId}_${label}`;
  const pi = `pi_${id}`;
  const session = `cs_${id}`;
  paymentIds.push(pi); sessionIds.push(session);
  return { pi, session, charge: `ch_${id}` };
}
function event(type: string, label: string, object: object) {
  const id = `evt_${runId}_${label}`;
  eventIds.push(id);
  return { id, object: "event", type, created: paidAt + 100, livemode: false, data: { object } };
}
function checkout(f: ReturnType<typeof fixture>, label: string, overrides: Record<string, unknown> = {}) {
  return event("checkout.session.completed", label, {
    id: f.session, mode: "payment", payment_status: "paid", currency: "cad", amount_total: 4900,
    payment_intent: f.pi, customer_details: { email: "synthetic-learner@example.test" },
    metadata: { product_key: "oit", product_name: "Synthetic OIT Pass", entitlement_type: INDIVIDUAL_EXAM_PASS_ENTITLEMENT_TYPE,
      individual_access_policy: INDIVIDUAL_EXAM_PASS_POLICY_VERSION }, ...overrides,
  });
}
function refund(f: ReturnType<typeof fixture>, label: string, amountRefunded = 4900) {
  return event("charge.refunded", label, {
    id: f.charge, payment_intent: f.pi, amount: 4900, amount_refunded: amountRefunded, refunded: amountRefunded === 4900,
  });
}
function successfulCharge(extra: Record<string, unknown> = {}) {
  return { status: "succeeded", latest_charge: { created: paidAt, paid: true, status: "succeeded", amount: 4900,
    amount_refunded: 0, refunded: false, disputed: false, ...extra } };
}
async function deliver(payload: ReturnType<typeof event>, validSignature = true) {
  const body = JSON.stringify(payload);
  const signature = sdk.webhooks.generateTestHeaderString({ payload: body, secret: validSignature ? secret : "whsec_wrong" });
  const response: any = { statusCode: 200, body: undefined };
  response.status = (code: number) => { response.statusCode = code; return response; };
  response.json = response.send = (value: unknown) => { response.body = value; return response; };
  await handler({ body: Buffer.from(body), headers: { "stripe-signature": signature } } as unknown as Request, response);
  return response;
}
async function rows(f: ReturnType<typeof fixture>) {
  const purchase = await db.select({ status: purchases.status, accessExpiresAt: purchases.accessExpiresAt, amountCAD: purchases.amountCAD })
    .from(purchases).where(eq(purchases.stripePaymentIntentId, f.pi));
  const outbox = await db.select().from(purchaseEmailOutbox).where(eq(purchaseEmailOutbox.stripeSessionId, f.session));
  const accounting = await db.select({ id: productAnalyticsEvents.id }).from(productAnalyticsEvents)
    .where(and(eq(productAnalyticsEvents.eventName, "purchase_refunded"), like(productAnalyticsEvents.metadata, `%${f.pi}%`)));
  return { purchase, outbox, accounting };
}
async function waitForClaim(id: string) {
  for (let i = 0; i < 100; i++) {
    const [row] = await db.select({ status: stripeEventLog.status }).from(stripeEventLog)
      .where(eq(stripeEventLog.stripeEventId, id));
    if (row?.status === "processing") return;
    await new Promise(resolve => setTimeout(resolve, 5));
  }
  throw new Error("Synthetic refund did not acquire its event claim");
}
function gate() {
  let open!: () => void;
  const promise = new Promise<void>(resolve => { open = resolve; });
  return { promise, open };
}

beforeAll(async () => {
  if (!enabled) return;
  pool = mysql.createPool({ uri: rawUrl!, connectionLimit: 8 });
  db = drizzle(pool) as Database;
  mocks.getDb.mockResolvedValue(db);
  const app = { post: (_path: string, _middleware: unknown, fn: typeof handler) => { handler = fn; } };
  registerStripeWebhook(app as any);
});
beforeEach(() => {
  vi.clearAllMocks();
  vi.spyOn(console, "log").mockImplementation(() => {});
  vi.spyOn(console, "warn").mockImplementation(() => {});
  vi.spyOn(console, "error").mockImplementation(() => {});
  process.env.STRIPE_WEBHOOK_SECRET = secret;
  mocks.retrieve.mockReset().mockResolvedValue(successfulCharge());
  mocks.notify.mockResolvedValue(true); mocks.track.mockResolvedValue(undefined);
});
afterAll(async () => {
  vi.restoreAllMocks();
  if (!enabled) return;
  if (sessionIds.length) {
    await db.delete(purchaseEmailOutbox).where(inArray(purchaseEmailOutbox.stripeSessionId, sessionIds));
    await db.delete(purchases).where(inArray(purchases.stripeSessionId, sessionIds));
  }
  await db.delete(productAnalyticsEvents).where(like(productAnalyticsEvents.metadata, `%${runId}%`));
  if (eventIds.length) await db.delete(stripeEventLog).where(inArray(stripeEventLog.stripeEventId, eventIds));
  if (paymentIds.length) await db.delete(stripeEventLog).where(inArray(stripeEventLog.stripeEventId, paymentIds.map(paymentStateLedgerId)));
  await pool.end();
});

databaseSuite("individual payment/refund invariant with signed webhooks and a real database", () => {
  it("refund-first and completed refund replays durably block stale checkout success", async () => {
    const f = fixture("refund_first"); const r = refund(f, "refund_first");
    expect((await deliver(r)).statusCode).toBe(200);
    expect(await readPaymentState(db, f.pi)).toBe("full_refund");
    const [logged] = await db.select().from(stripeEventLog).where(eq(stripeEventLog.stripeEventId, r.id));
    expect(logged.status).toBe("completed");
    expect((await deliver(checkout(f, "late_checkout"))).body).toEqual({ received: true, accessBlocked: "full_refund" });
    expect((await deliver(r)).statusCode).toBe(200);
    expect((await rows(f))).toEqual({ purchase: [], outbox: [], accounting: [] });
    expect(mocks.retrieve).not.toHaveBeenCalled();
  });

  it("checkout-first then duplicate and distinct refunds revoke once without changing the twelve-month term", async () => {
    const f = fixture("checkout_first"); const c = checkout(f, "checkout_first"); const r = refund(f, "checkout_first");
    expect((await deliver(c)).statusCode).toBe(200);
    const initial = await rows(f);
    expect(initial.purchase).toEqual([{ status: "active", amountCAD: 4900, accessExpiresAt: expectedExpiry }]);
    expect(initial.outbox).toHaveLength(1);
    await deliver(r); await deliver(r); await deliver(refund(f, "other_refund_event")); await deliver(c);
    const final = await rows(f);
    expect(final.purchase).toEqual([{ status: "refunded", amountCAD: 4900, accessExpiresAt: expectedExpiry }]);
    expect(final.accounting).toHaveLength(1);
    expect(final.outbox[0].status).toBe("failed");
  });

  it("a concurrent refund waits for checkout's payment lock and leaves no active access", async () => {
    const f = fixture("concurrent_checkout"); const entered = gate(); const release = gate();
    mocks.retrieve.mockImplementation(async () => { entered.open(); await release.promise; return successfulCharge(); });
    const paid = deliver(checkout(f, "concurrent_checkout"));
    await entered.promise;
    const r = refund(f, "concurrent_checkout"); let refundFinished = false;
    const refunded = deliver(r).then(value => { refundFinished = true; return value; });
    try {
      await waitForClaim(r.id);
      expect(refundFinished).toBe(false);
    } finally { release.open(); }
    expect((await paid).statusCode).toBe(200); expect((await refunded).statusCode).toBe(200);
    const final = await rows(f);
    expect(final.purchase[0].status).toBe("refunded"); expect(final.accounting).toHaveLength(1);
    expect(await readPaymentState(db, f.pi)).toBe("full_refund");
  });

  it("refund commits first while checkout is queued on the same payment lock", async () => {
    const f = fixture("concurrent_refund"); const entered = gate(); const release = gate();
    const originalGuard = withPaymentState;
    // Pause the actual refund transaction after it acquires the database row
    // lock. Its real revocation callback still executes before commit.
    const guard = vi.spyOn(paymentStateModule, "withPaymentState");
    guard.mockImplementationOnce((database, pi, work) => originalGuard(database, pi, async (tx, state) => {
      entered.open(); await release.promise; return work(tx, state);
    }));
    const refunded = deliver(refund(f, "queued_refund"));
    await entered.promise;
    let checkoutFinished = false;
    const paid = deliver(checkout(f, "queued_checkout")).then(value => { checkoutFinished = true; return value; });
    try {
      // A bounded wait lets the second connection attempt its upsert. No
      // provider requests are made while the refund transaction owns the row.
      await new Promise(resolve => setTimeout(resolve, 25));
      expect(checkoutFinished).toBe(false);
      expect(mocks.retrieve).not.toHaveBeenCalled();
    } finally { release.open(); }
    expect((await refunded).statusCode).toBe(200);
    expect((await paid).body.accessBlocked).toBe("full_refund");
    guard.mockRestore();
    expect((await rows(f)).purchase).toHaveLength(0);
  });

  it("concurrent signed checkout deliveries create one purchase and one confirmation", async () => {
    const f = fixture("duplicate_checkout"); const c = checkout(f, "duplicate_checkout");
    const responses = await Promise.all([deliver(c), deliver(c)]);
    expect(responses.map(r => r.statusCode)).toEqual([200, 200]);
    const final = await rows(f);
    expect(final.purchase).toHaveLength(1); expect(final.outbox).toHaveLength(1);
    expect(mocks.notify).toHaveBeenCalledTimes(1);
  });

  it("concurrent distinct refund events revoke and account only once", async () => {
    const f = fixture("duplicate_refund"); await deliver(checkout(f, "duplicate_refund"));
    const responses = await Promise.all([
      deliver(refund(f, "duplicate_refund_a")), deliver(refund(f, "duplicate_refund_b")),
    ]);
    expect(responses.map(r => r.statusCode)).toEqual([200, 200]);
    expect((await rows(f)).purchase[0].status).toBe("refunded");
    expect((await rows(f)).accounting).toHaveLength(1);
  });

  it("refund write failure rolls back entitlement, accounting and guard, then signed replay repairs it", async () => {
    const f = fixture("refund_rollback"); await deliver(checkout(f, "refund_rollback"));
    const r = refund(f, "refund_rollback");
    const realRevocation = paymentStateModule.revokeIndividualPurchases;
    const revoke = vi.spyOn(paymentStateModule, "revokeIndividualPurchases");
    revoke.mockImplementationOnce(async (...args) => {
      await realRevocation(...args);
      throw new Error("Synthetic transaction failure after refund writes");
    });
    expect((await deliver(r)).statusCode).toBe(503);
    revoke.mockRestore();
    const rolledBack = await rows(f);
    expect(rolledBack.purchase[0].status).toBe("active");
    expect(rolledBack.accounting).toHaveLength(0);
    expect(rolledBack.outbox[0].status).toBe("pending");
    expect(await readPaymentState(db, f.pi)).toBe("clear");
    const [failed] = await db.select().from(stripeEventLog).where(eq(stripeEventLog.stripeEventId, r.id));
    expect(failed.status).toBe("failed"); expect(failed.dbProcessed).toBe(false);
    expect((await deliver(r)).statusCode).toBe(200);
    const final = await rows(f);
    expect(final.purchase[0].status).toBe("refunded"); expect(final.accounting).toHaveLength(1);
    expect(await readPaymentState(db, f.pi)).toBe("full_refund");
  });

  it.each([
    ["full_refund", { refunded: true, amount_refunded: 4900 }],
    ["partial_refund", { amount_refunded: 1000 }],
    ["disputed", { disputed: true }],
  ])("authoritative %s charge blocks entitlement even before its event arrives", async (reason, state) => {
    const f = fixture(`live_${reason}`); mocks.retrieve.mockResolvedValue(successfulCharge(state));
    expect((await deliver(checkout(f, `live_${reason}`))).body.accessBlocked).toBe(reason);
    expect(await readPaymentState(db, f.pi)).toBe(reason);
    expect((await rows(f))).toEqual({ purchase: [], outbox: [], accounting: [] });
  });

  it("delayed async success remains blocked and partial-refund delivery cannot downgrade a full refund", async () => {
    const f = fixture("delayed"); await deliver(refund(f, "delayed_full"));
    await deliver(refund(f, "delayed_partial", 1000));
    const c = checkout(f, "delayed"); c.type = "checkout.session.async_payment_succeeded";
    expect((await deliver(c)).body.accessBlocked).toBe("full_refund");
    expect(await readPaymentState(db, f.pi)).toBe("full_refund");
    expect((await rows(f)).purchase).toHaveLength(0);
  });

  it("completed legacy unmatched refund replay repairs a later active row and remains idempotent", async () => {
    const f = fixture("legacy_replay"); const r = refund(f, "legacy_replay");
    await db.insert(stripeEventLog).values({ stripeEventId: r.id, stripeObjectId: f.charge, eventType: r.type,
      status: "completed", dbProcessed: true, emailDelivered: true });
    await deliver(checkout(f, "legacy_before_replay"));
    expect((await rows(f)).purchase[0].status).toBe("active");
    await deliver(r); await deliver(r);
    const final = await rows(f);
    expect(final.purchase[0].status).toBe("refunded"); expect(final.accounting).toHaveLength(1);
    expect(await readPaymentState(db, f.pi)).toBe("full_refund");
  });

  it("individual partial refunds retain revoke-on-refund policy and later full refund wins", async () => {
    const f = fixture("partial_policy"); await deliver(checkout(f, "partial_policy"));
    await deliver(refund(f, "partial_policy", 500));
    expect(await readPaymentState(db, f.pi)).toBe("partial_refund");
    expect((await rows(f)).purchase[0].status).toBe("refunded");
    await deliver(refund(f, "partial_then_full"));
    expect(await readPaymentState(db, f.pi)).toBe("full_refund");
    expect((await rows(f)).accounting).toHaveLength(1);
  });

  it("dispute-first blocks checkout and a delayed dispute never downgrades a refund", async () => {
    const f = fixture("dispute_first");
    const d = event("charge.dispute.created", "dispute_first", { payment_intent: f.pi });
    await deliver(d);
    expect((await deliver(checkout(f, "dispute_first"))).body.accessBlocked).toBe("disputed");
    await deliver(refund(f, "dispute_refunded")); await deliver(d);
    expect(await readPaymentState(db, f.pi)).toBe("full_refund");
    expect((await rows(f)).purchase).toHaveLength(0);
  });

  it("a live refunded charge revokes an existing active purchase on checkout replay", async () => {
    const f = fixture("live_replay"); const c = checkout(f, "live_replay"); await deliver(c);
    mocks.retrieve.mockResolvedValue(successfulCharge({ refunded: true, amount_refunded: 4900 }));
    expect((await deliver(c)).body.accessBlocked).toBe("full_refund");
    expect((await rows(f)).purchase[0].status).toBe("refunded");
    expect((await rows(f)).accounting).toHaveLength(1);
  });

  it("retains valid historical USD receipts and exactly twelve calendar months", async () => {
    const f = fixture("historical_usd");
    expect((await deliver(checkout(f, "historical_usd", { currency: "usd", amount_total: 17900 }))).statusCode).toBe(200);
    const final = await rows(f);
    expect(final.purchase).toEqual([{ status: "active", amountCAD: 17900, accessExpiresAt: expectedExpiry }]);
    expect(JSON.parse(final.outbox[0].payload).paymentCurrency).toBe("usd");
  });

  it("Stripe lookup failure rolls back and successful signed replay can retry", async () => {
    const f = fixture("lookup_failure"); const c = checkout(f, "lookup_failure");
    mocks.retrieve.mockRejectedValueOnce(new Error("Synthetic Stripe lookup unavailable"));
    expect((await deliver(c)).statusCode).toBe(503);
    expect((await rows(f))).toEqual({ purchase: [], outbox: [], accounting: [] });
    expect((await deliver(c)).statusCode).toBe(200);
    expect((await rows(f)).purchase).toHaveLength(1);
  });

  it("outbox insertion failure rolls back both purchase and payment guard", async () => {
    const f = fixture("outbox_rollback");
    await db.insert(purchaseEmailOutbox).values({ stripeSessionId: f.session, payload: "{}" });
    await expect(fulfilIndividualPurchase(db, {
      email: "synthetic-learner@example.test", productKey: "oit", productName: "Synthetic OIT Pass",
      amountCAD: 4900, stripeSessionId: f.session, stripePaymentIntentId: f.pi,
    }, mocks.retrieve)).rejects.toThrow();
    expect((await rows(f)).purchase).toHaveLength(0);
    const guards = await db.select().from(stripeEventLog).where(eq(stripeEventLog.stripeEventId, paymentStateLedgerId(f.pi)));
    expect(guards).toHaveLength(0);
  });

  it("invalid signature cannot persist a refund tombstone", async () => {
    const f = fixture("bad_signature");
    expect((await deliver(refund(f, "bad_signature"), false)).statusCode).toBe(400);
    expect(await readPaymentState(db, f.pi)).toBe("clear");
    expect((await rows(f))).toEqual({ purchase: [], outbox: [], accounting: [] });
  });
});
