import { eq } from "drizzle-orm";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { hiringOrders, hiringPayments, hiringTerms, type HiringOrder, type HiringPayment, type HiringTerm } from "../../drizzle/schema";
import { createAuditSqlDatabase } from "../teams/auditSqlHarness";
import { hiringTermState, reconcileHiringPayment } from "./paymentLedger";
import { assertHiringGrant, InvalidHiringPayment, type HiringPaymentState } from "./policy";

const START = Date.parse("2026-01-01T00:00:00Z");
const END = Date.parse("2027-01-01T00:00:00Z");
const order = (changes: Partial<HiringOrder> = {}): HiringOrder => ({
  id: "order_hiring", orgId: 7, stripeCheckoutSessionId: null, stripeSubscriptionId: "sub_hiring",
  stripeCustomerId: "cus_hiring", amountCents: 100000, currency: "cad", status: "active",
  paymentState: "active", paymentChargeId: "ch_hiring", renewalCancelled: false,
  ownerEmail: "owner@example.test", createdAtMs: START, ...changes,
});
const payment = (changes: Partial<HiringPayment> = {}): HiringPayment => ({
  id: "ch_hiring", orgId: 7, orderId: "order_hiring", invoiceId: "in_hiring", subscriptionId: "sub_hiring",
  paymentIntentId: "pi_hiring", paymentState: "active", disputeIds: [], updatedAtMs: START, ...changes,
});
const term = (changes: Partial<HiringTerm> = {}): HiringTerm => ({
  id: "term_hiring", orgId: 7, basis: "stripe", sourceInvoiceId: "in_hiring", sourcePilotId: null,
  sourceSubscriptionId: "sub_hiring", sourcePaymentIntentId: "pi_hiring", sourceChargeId: "ch_hiring",
  startsAtMs: START, endsAtMs: END, quota: 100, used: 100, state: "active", paymentState: "active",
  createdByEmail: "owner@example.test", ...changes,
});
const charge = (changes: Record<string, unknown> = {}) => ({
  amount: 113000, amount_refunded: 0, refunded: false, disputed: false, ...changes,
});
const won = (id = "dp_hiring") => ({ id, status: "won" });
type ReconciliationInput = Parameters<typeof reconcileHiringPayment>[1];
let db: ReturnType<typeof createAuditSqlDatabase>["db"];
let close: () => void;
let locks: ReturnType<typeof vi.fn>;

beforeEach(async () => {
  ({ db, close } = createAuditSqlDatabase());
  locks = vi.fn();
  // mysql2 returns parsed JSON; the shared SQLite harness returns TEXT. Adapt
  // only the driver decoder so production reconciliation sees the same shape.
  vi.spyOn(hiringPayments.disputeIds, "mapFromDriverValue").mockImplementation(value =>
    typeof value === "string" ? JSON.parse(value) : value);
  const select = db.select.bind(db);
  // Reuse the existing SQLite SQL executor, not an imitation of ledger logic or
  // a scripted result queue. Only MySQL row-lock syntax is unavailable here;
  // record it while SQLite serializes the transaction. This is not InnoDB proof.
  (db as any).select = (...args: any[]) => {
    const query = (select as any)(...args);
    const from = query.from.bind(query);
    query.from = (table: any) => {
      const builder = from(table);
      builder.for = (mode: string) => {
        expect(mode).toBe("update");
        locks(table);
        return builder;
      };
      return builder;
    };
    return query;
  };
  await db.insert(hiringOrders).values(order());
});
afterEach(() => { close(); vi.restoreAllMocks(); });

async function reconcile(changes: Partial<ReconciliationInput> = {}) {
  return db.transaction(async tx => {
    const [lockedOrder] = await tx.select().from(hiringOrders).where(eq(hiringOrders.id, "order_hiring")).limit(1).for("update");
    return reconcileHiringPayment(tx, {
      order: lockedOrder, invoiceId: "in_hiring", subscriptionId: "sub_hiring", paymentIntentId: "pi_hiring",
      chargeId: "ch_hiring", charge: charge(), disputes: [], incomplete: false, allowDisputeRecovery: false,
      ...changes,
    });
  });
}
async function storedPayment() {
  const [stored] = await db.select().from(hiringPayments).where(eq(hiringPayments.id, "ch_hiring"));
  return stored;
}

// These tests call the production state mapper and access predicate. A settled
// invoice's payment remains active accounting evidence during delinquency, but
// only an actually active subscription may yield a usable term.
describe("Hiring subscription access state", () => {
  it.each(["past_due", "unpaid", "canceled", "incomplete", "incomplete_expired", "trialing", "paused", undefined])(
    "does not grant access for subscription status %s, even with cancellation scheduled", status => {
      for (const cancel_at_period_end of [false, true]) {
        const grant = term({ state: hiringTermState("active", { status, cancel_at_period_end }) });
        expect(grant.state).toBe("subscription_suspended");
        expect(() => assertHiringGrant(grant, START + 1)).toThrow(/Active Hiring access/);
      }
    },
  );

  it.each([false, true])("unpaid -> past_due -> active preserves exhausted quota and cancellation=%s", cancel_at_period_end => {
    const grant = term();
    for (const status of ["unpaid", "past_due", "active"]) {
      grant.state = hiringTermState(grant.paymentState, { status, cancel_at_period_end });
      expect(grant).toMatchObject({ used: 100, quota: 100, paymentState: "active" });
      if (status !== "active") {
        expect(grant.state).toBe("subscription_suspended");
        expect(() => assertHiringGrant(grant, START + 1)).toThrow(/Active Hiring access/);
      } else {
        expect(grant.state).toBe(cancel_at_period_end ? "cancel_at_period_end" : "active");
        expect(() => assertHiringGrant(grant, START + 1)).not.toThrow();
        expect(() => assertHiringGrant(grant, START + 1, true)).toThrow(/fully used/);
      }
    }
  });

  it.each(["disputed", "needs_review", "refunded", "dispute_lost"])(
    "subscription recovery never clears the %s payment hold", paymentState => {
      const grant = term({ paymentState, state: "suspended", used: 17 });
      for (const status of ["unpaid", "past_due", "active"]) {
        grant.state = hiringTermState(grant.paymentState, { status, cancel_at_period_end: true });
        expect(grant).toMatchObject({ state: "suspended", paymentState, used: 17, quota: 100 });
        expect(() => assertHiringGrant(grant, START + 1)).toThrow(/Active Hiring access/);
      }
    },
  );
});

describe("Hiring payment ledger evidence under incomplete dispute pagination", () => {
  it.each([
    { label: "full refund flag", liveCharge: charge({ refunded: true }), disputes: [{ id: "dp_hiring", status: "needs_response" }], expected: "refunded" },
    { label: "full refund amount", liveCharge: charge({ amount_refunded: 113000 }), disputes: [{ id: "dp_hiring", status: "lost" }], expected: "refunded" },
    { label: "visible lost dispute", liveCharge: charge(), disputes: [{ id: "dp_hiring", status: "lost" }], expected: "dispute_lost" },
    { label: "visible lost dispute and partial refund", liveCharge: charge({ amount_refunded: 1000 }), disputes: [{ id: "dp_hiring", status: "lost" }], expected: "dispute_lost" },
  ])("persists positive terminal $label despite has_more", async ({ liveCharge, disputes, expected }) => {
    await db.insert(hiringPayments).values(payment({ paymentState: "needs_review", disputeIds: ["dp_old"] }));
    expect(await reconcile({ charge: liveCharge, disputes, incomplete: true })).toBe(expected);
    expect(await storedPayment()).toMatchObject({ paymentState: expected, disputeIds: ["dp_hiring", "dp_old"] });
    expect(locks).toHaveBeenCalledWith(hiringPayments);
    // Neither a later clear paid replay nor a positively closed dispute may
    // erase terminal refund/loss evidence already persisted on this charge.
    expect(await reconcile({ disputes: [won("dp_old"), won()], allowDisputeRecovery: true })).toBe(expected);
  });

  it("incomplete open -> complete won recovers without touching quota or other charges", async () => {
    const exhaustedTerm = term();
    const unrelated = payment({ id: "ch_other", invoiceId: "in_other", paymentIntentId: "pi_other", paymentState: "needs_review", disputeIds: ["dp_other"] });
    await db.insert(hiringTerms).values(exhaustedTerm);
    await db.insert(hiringPayments).values(unrelated);
    const untouched = await db.select().from(hiringPayments);
    expect(await reconcile({ currentTerm: exhaustedTerm, charge: charge({ disputed: true }), incomplete: true,
      disputes: [{ id: "dp_second", status: "needs_response" }, { id: "dp_hiring", status: "needs_response" }, { id: "dp_second", status: "needs_response" }] })).toBe("disputed");
    expect(await storedPayment()).toMatchObject({ paymentState: "disputed", disputeIds: ["dp_hiring", "dp_second"] });
    expect(await reconcile({ currentTerm: exhaustedTerm, disputes: [won(), won("dp_second")], allowDisputeRecovery: true })).toBe("active");
    expect(await storedPayment()).toMatchObject({ paymentState: "active", disputeIds: ["dp_hiring", "dp_second"] });
    expect(await db.select().from(hiringTerms)).toEqual([exhaustedTerm]);
    expect(await db.select().from(hiringOrders)).toEqual([order()]);
    expect((await db.select().from(hiringPayments).where(eq(hiringPayments.id, "ch_other")))).toEqual(untouched);
    const recovered = { ...exhaustedTerm, state: hiringTermState("active", { status: "active", cancel_at_period_end: true }) };
    expect(recovered.state).toBe("cancel_at_period_end");
    expect(() => assertHiringGrant(recovered, START + 1, true)).toThrow(/fully used/);
  });

  it.each([
    { label: "truncated won list", liveCharge: charge(), disputes: [won()], incomplete: true },
    { label: "truncated empty list", liveCharge: charge(), disputes: [], incomplete: true },
    { label: "disputed charge without dispute details", liveCharge: charge({ disputed: true }), disputes: [], incomplete: false },
  ])("uses a retryable disputed hold, not manual review, for $label", async ({ liveCharge, disputes, incomplete }) => {
    expect(await reconcile({ charge: liveCharge, disputes, incomplete })).toBe("disputed");
    expect(await storedPayment()).toMatchObject({ paymentState: "disputed", disputeIds: disputes.map(dispute => dispute.id) });
  });

  it("an incomplete won list cannot become active on a paid replay before positive closure", async () => {
    expect(await reconcile({ disputes: [won()], incomplete: true })).toBe("disputed");
    expect(await reconcile({ disputes: [won()] })).toBe("disputed");
    expect(await reconcile({ disputes: [won()], allowDisputeRecovery: true })).toBe("active");
  });

  it.each([false, true])("a genuine partial refund remains a sticky manual hold with incomplete=%s", async incomplete => {
    expect(await reconcile({ charge: charge({ amount_refunded: 1000 }), disputes: [{ id: "dp_hiring", status: "needs_response" }], incomplete })).toBe("needs_review");
    expect(await reconcile({ disputes: [won()], allowDisputeRecovery: true })).toBe("needs_review");
    expect(await reconcile({ disputes: [won()] })).toBe("needs_review");
    expect(await storedPayment()).toMatchObject({ paymentState: "needs_review", disputeIds: ["dp_hiring"] });
  });

  it.each(["refunded", "dispute_lost", "needs_review"])("preserves an existing %s hold on incomplete evidence", async paymentState => {
    await db.insert(hiringPayments).values(payment({ paymentState }));
    expect(await reconcile({ disputes: [won()], incomplete: true, allowDisputeRecovery: true })).toBe(paymentState);
  });

  it.each([
    { label: "empty complete list", known: ["dp_hiring"], disputes: [], allowDisputeRecovery: true, incomplete: false },
    { label: "known ID absent", known: ["dp_hiring", "dp_second"], disputes: [won()], allowDisputeRecovery: true, incomplete: false },
    { label: "unrelated win", known: ["dp_hiring"], disputes: [won("dp_other")], allowDisputeRecovery: true, incomplete: false },
    { label: "one known dispute still open", known: ["dp_hiring", "dp_second"], disputes: [won(), { id: "dp_second", status: "needs_response" }], allowDisputeRecovery: true, incomplete: false },
    { label: "new dispute still open", known: ["dp_hiring"], disputes: [won(), { id: "dp_new", status: "needs_response" }], allowDisputeRecovery: true, incomplete: false },
    { label: "no previously known IDs", known: [], disputes: [won()], allowDisputeRecovery: true, incomplete: false },
    { label: "paid replay of all wins", known: ["dp_hiring"], disputes: [won()], allowDisputeRecovery: false, incomplete: false },
    { label: "all wins but incomplete page", known: ["dp_hiring"], disputes: [won()], allowDisputeRecovery: true, incomplete: true },
  ])("does not recover for $label", async ({ known, disputes, allowDisputeRecovery, incomplete }) => {
    await db.insert(hiringPayments).values(payment({ paymentState: "disputed", disputeIds: known }));
    expect(await reconcile({ disputes, allowDisputeRecovery, incomplete })).toBe("disputed");
    expect((await storedPayment()).disputeIds).toEqual([...new Set([...known, ...disputes.map(dispute => dispute.id)])].sort());
  });

  it("every known dispute may recover with positive won/warning_closed evidence", async () => {
    await db.insert(hiringPayments).values(payment({ paymentState: "disputed", disputeIds: ["dp_hiring", "dp_warning"] }));
    expect(await reconcile({ disputes: [{ id: "dp_warning", status: "warning_closed" }, won()], allowDisputeRecovery: true })).toBe("active");
  });
});

describe("Hiring ledger immutable bindings", () => {
  it.each([
    { orgId: 8 }, { orderId: "order_other" }, { invoiceId: "in_other" },
    { subscriptionId: "sub_other" }, { paymentIntentId: "pi_other" },
  ])("rejects stored charge binding mismatch %j", async changes => {
    const stored = payment(changes);
    await db.insert(hiringPayments).values(stored);
    await expect(reconcile({ charge: charge({ refunded: true }), incomplete: true })).rejects.toBeInstanceOf(InvalidHiringPayment);
    expect(await storedPayment()).toEqual(stored);
  });

  it.each([
    { orgId: 8 }, { sourceInvoiceId: "in_other" }, { sourceSubscriptionId: "sub_other" },
    { sourceChargeId: "ch_other" }, { sourcePaymentIntentId: "pi_other" },
  ])("rejects current term binding mismatch %j", async changes => {
    await expect(reconcile({ currentTerm: term(changes) })).rejects.toBeInstanceOf(InvalidHiringPayment);
    expect(await db.select().from(hiringPayments)).toEqual([]);
  });

  it.each(["refunded", "dispute_lost", "needs_review", "disputed"] as HiringPaymentState[])(
    "does not lose a term's %s hold when creating its ledger row", async paymentState => {
      expect(await reconcile({ currentTerm: term({ paymentState, state: "suspended" }) })).toBe(paymentState);
      expect(await storedPayment()).toMatchObject({ paymentState });
    },
  );
});
