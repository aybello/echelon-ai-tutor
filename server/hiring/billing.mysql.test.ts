import { AsyncLocalStorage } from "node:async_hooks";
import { randomUUID } from "node:crypto";
import { eq, sql } from "drizzle-orm";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import {
  hiringEvents, hiringOrders, hiringPayments, hiringTerms,
  organizationMembers, organizations, subscriptions,
} from "../../drizzle/schema";
import type { TrpcContext } from "../_core/context";
import { getDb } from "../db";
import { HIRING_AMOUNT, HIRING_POLICY, HIRING_TYPE } from "./policy";
import { cancelHiringAtPeriodEnd, createHiringCheckout, getHiringStatus } from "./service";
import { dispatchHiringEvent } from "./webhook";

// The ONLY mocked module is Stripe's transport boundary. Production getDb,
// authorization, validators, Drizzle builders, mysql2 I/O, transactions, locks,
// rollback and commit are never replaced. This is not the memoryDb harness.
const transport = vi.hoisted(() => ({
  price: vi.fn(), customer: vi.fn(), checkout: vi.fn(), checkoutRetrieve: vi.fn(),
  invoice: vi.fn(), invoicePayments: vi.fn(), subscription: vi.fn(),
  updateSubscription: vi.fn(), charge: vi.fn(), disputes: vi.fn(),
}));
vi.mock("../stripe/stripe", () => ({ stripe: {
  prices: { retrieve: transport.price }, customers: { create: transport.customer },
  checkout: { sessions: { create: transport.checkout, retrieve: transport.checkoutRetrieve } },
  invoices: { retrieve: transport.invoice }, invoicePayments: { list: transport.invoicePayments },
  subscriptions: { retrieve: transport.subscription, update: transport.updateSubscription },
  charges: { retrieve: transport.charge }, disputes: { list: transport.disputes },
} }));

type Row = Record<string, any>;
type Db = NonNullable<Awaited<ReturnType<typeof getDb>>>;
const enabled = process.env.ECHELON_TEST_DATABASE === "I_UNDERSTAND_THIS_IS_A_DISPOSABLE_LOCAL_DATABASE";
const DAY = 86_400_000;
const PRICE = "price_hiring_mysql";
let db: Db;
const source = new AsyncLocalStorage<string>();
let observe: (label: string | undefined, query: string, params: unknown[]) => void = () => {};
const live = {
  invoices: new Map<string, Row>(), subscriptions: new Map<string, Row>(),
  charges: new Map<string, Row>(), disputes: new Map<string, Row[]>(), checkouts: new Map<string, Row>(),
};
function gate() {
  let release!: () => void;
  const promise = new Promise<void>(resolve => { release = resolve; });
  return { promise, release };
}
async function bounded<T>(promise: Promise<T>, label: string): Promise<T> {
  let timer!: ReturnType<typeof setTimeout>;
  try {
    return await Promise.race([promise, new Promise<never>((_, reject) => {
      timer = setTimeout(() => reject(new Error(`Timed out waiting for ${label}`)), 5_000);
    })]);
  } finally { clearTimeout(timer); }
}
function run<T>(label: string, work: () => Promise<T>) {
  const result = source.run(label, work);
  // Attach immediately so failures during a gate wait are never unhandled.
  void result.catch(() => {});
  return result;
}
function lockTable(query: string) {
  return /\bfor (?:share|update)\b/i.test(query) ? query.match(/\bfrom `([^`]+)`/i)?.[1] : undefined;
}
async function expectHeld(table: "organizations" | "hiring_orders", id: number | string) {
  // Independent pooled connection. The real server must reject an incompatible
  // NOWAIT row lock; seeing a builder call alone is not evidence of a held lock.
  await db.transaction(async tx => {
    await expect(tx.execute(sql`select id from ${sql.identifier(table)} where id = ${id} for update nowait`))
      .rejects.toMatchObject({ cause: { code: "ER_LOCK_NOWAIT" } });
  });
}
function required(map: Map<string, Row>, id: string, kind: string) {
  const row = map.get(id);
  if (!row) throw new Error(`Unexpected synthetic Stripe ${kind}: ${id}`);
  return structuredClone(row);
}
function price() {
  return { id: PRICE, active: true, currency: "cad", unit_amount: HIRING_AMOUNT, type: "recurring",
    recurring: { interval: "year", interval_count: 1, usage_type: "licensed" },
    tax_behavior: "exclusive", billing_scheme: "per_unit",
    product: { id: "prod_hiring_mysql", active: true, metadata: { type: HIRING_TYPE, policy: HIRING_POLICY } } };
}
function context(email: string) {
  return { user: null, studentEmail: email, assessmentOnlySession: null,
    req: { headers: {}, cookies: {} }, res: { cookie() {}, clearCookie() {} } } as unknown as TrpcContext;
}
async function fixture(options: { customer?: boolean; order?: boolean } = {}) {
  const token = randomUUID();
  const email = `owner-${token}@example.test`, customerId = `cus_${token}`, subId = `sub_${token}`, orderId = randomUUID();
  const [{ id: orgId }] = await db.insert(organizations).values({
    name: "Disposable synthetic Hiring billing organization", managerEmail: email,
    province: "ontario", tier: "all-access", status: "active", billingType: "invoice", seatsTotal: 5,
    termStart: new Date(Date.now() - DAY), termEnd: new Date(Date.now() + 10 * DAY),
    stripeCustomerId: options.customer === false ? null : customerId,
  }).$returningId();
  const metadata = { type: HIRING_TYPE, policy: HIRING_POLICY, orderId, orgId: String(orgId) };
  live.subscriptions.set(subId, { id: subId, customer: customerId, metadata, status: "active",
    cancel_at_period_end: false, collection_method: "charge_automatically",
    items: { has_more: false, data: [{ quantity: 1, price: price(), current_period_end: Date.parse("2028-01-01T00:00:00Z") / 1000 }] } });
  if (options.order !== false) await db.insert(hiringOrders).values({ id: orderId, orgId,
    stripeCustomerId: customerId, stripeSubscriptionId: subId, amountCents: HIRING_AMOUNT,
    currency: "cad", ownerEmail: email, status: "pending", createdAtMs: Date.now() });
  return { orgId, orderId, customerId, subId, metadata, ctx: context(email) };
}
type Fixture = Awaited<ReturnType<typeof fixture>>;
function annual(f: Fixture, year = 2027) {
  const token = randomUUID(), invoiceId = `in_${token}`, intentId = `pi_${token}`, chargeId = `ch_${token}`;
  const startsAtMs = Date.UTC(year, 0, 1), endsAtMs = Date.UTC(year + 1, 0, 1);
  live.invoices.set(invoiceId, { id: invoiceId, metadata: f.metadata, subscription: f.subId, customer: f.customerId,
    currency: "cad", status: "paid", paid: true, collection_method: "charge_automatically",
    billing_reason: "subscription_cycle", subtotal: HIRING_AMOUNT, total: 113_000, amount_paid: 113_000, amount_remaining: 0,
    lines: { has_more: false, data: [{ type: "subscription", proration: false, quantity: 1, amount: HIRING_AMOUNT,
      currency: "cad", price: PRICE, period: { start: startsAtMs / 1000, end: endsAtMs / 1000 } }] },
    payments: { has_more: false, data: [{ status: "paid", amount_paid: 113_000,
      payment: { payment_intent: { id: intentId, latest_charge: { id: chargeId } }, charge: { id: chargeId } } }] } });
  live.charges.set(chargeId, { id: chargeId, payment_intent: intentId, customer: f.customerId, status: "succeeded",
    paid: true, captured: true, currency: "cad", amount: 113_000, amount_captured: 113_000,
    refunded: false, amount_refunded: 0, disputed: false, metadata: {} });
  live.disputes.set(chargeId, []);
  return { invoiceId, intentId, chargeId, startsAtMs, endsAtMs };
}
type Annual = ReturnType<typeof annual>;
const event = (type: string, object: Row) => ({ id: `evt_${randomUUID()}`, type, data: { object } });
const paid = (f: Fixture, a: Annual) => event("invoice.paid", { id: a.invoiceId, metadata: f.metadata });
const reversal = (a: Annual, type = "charge.refunded", disputeId = `dp_${randomUUID()}`) => event(type,
  type === "charge.refunded" ? { id: a.chargeId, payment_intent: a.intentId, metadata: {} }
    : { id: disputeId, charge: a.chargeId, payment_intent: a.intentId, metadata: {} });
const terms = (f: Fixture) => db.select().from(hiringTerms).where(eq(hiringTerms.orgId, f.orgId));
const orders = (f: Fixture) => db.select().from(hiringOrders).where(eq(hiringOrders.orgId, f.orgId));
const payments = (f: Fixture) => db.select().from(hiringPayments).where(eq(hiringPayments.orgId, f.orgId));
async function unchangedLearners() {
  const members = await db.select().from(organizationMembers), learners = await db.select().from(subscriptions);
  return async () => {
    expect(await db.select().from(organizationMembers)).toEqual(members);
    expect(await db.select().from(subscriptions)).toEqual(learners);
  };
}

describe.skipIf(!enabled)("Hiring billing on fresh disposable real MySQL/InnoDB (Stripe-only synthetic transport)", () => {
  beforeAll(async () => {
    if (!(globalThis as Record<string, unknown>).__echelonTestSafetyInstalled
      || process.env.DATABASE_URL !== "mysql://recruitment_test:disposable-local-only@127.0.0.1:3306/echelon_ci") {
      throw new Error("Run only the safety-preloaded, network-isolated disposable billing MySQL runner.");
    }
    const value = await getDb();
    if (!value) throw new Error("Disposable MySQL unavailable");
    db = value;
    const [engines] = await db.execute(sql`select TABLE_NAME as name, ENGINE as engine from information_schema.TABLES
      where TABLE_SCHEMA = database() and TABLE_NAME in ('organizations', 'hiring_orders', 'hiring_terms', 'hiring_events', 'hiring_payments')`);
    expect(engines).toHaveLength(5);
    expect((engines as unknown as { engine: string }[]).every(row => row.engine === "InnoDB")).toBe(true);
    // Install a passive logger in the existing real session/options. New real
    // transactions inherit it; no transaction, driver or query is mocked.
    const session = (db as unknown as { session: { logger: { logQuery(query: string, params: unknown[]): void };
      options: { logger?: { logQuery(query: string, params: unknown[]): void } } } }).session;
    const logger = session.logger;
    const observer = { logQuery(query: string, params: unknown[]) {
      logger.logQuery(query, params); observe(source.getStore(), query, params);
    } };
    session.logger = observer; session.options.logger = observer;
  }, 10_000);
  beforeEach(() => {
    vi.resetAllMocks();
    for (const map of Object.values(live)) map.clear();
    transport.price.mockImplementation(async () => price());
    transport.customer.mockImplementation(async () => ({ id: `cus_checkout_${randomUUID()}` }));
    transport.checkout.mockImplementation(async (input: Row, options: Row) => {
      if (!live.checkouts.has(options.idempotencyKey)) live.checkouts.set(options.idempotencyKey,
        { id: `cs_${randomUUID()}`, status: "open", mode: "subscription", metadata: input.metadata,
          url: "https://checkout.example.test/synthetic", customer: input.customer, subscription: null });
      return required(live.checkouts, options.idempotencyKey, "idempotent checkout");
    });
    transport.checkoutRetrieve.mockImplementation(async (id: string) => {
      const row = [...live.checkouts.values()].find(row => row.id === id);
      if (!row) throw new Error("Unexpected synthetic checkout retrieve");
      return structuredClone(row);
    });
    transport.invoice.mockImplementation(async (id: string) => required(live.invoices, id, "invoice"));
    transport.subscription.mockImplementation(async (id: string) => required(live.subscriptions, id, "subscription"));
    transport.updateSubscription.mockImplementation(async (id: string, changes: Row) => {
      Object.assign(live.subscriptions.get(id)!, changes); return required(live.subscriptions, id, "subscription update");
    });
    transport.charge.mockImplementation(async (id: string) => required(live.charges, id, "charge"));
    transport.disputes.mockImplementation(async ({ charge }: Row) => ({ data: structuredClone(live.disputes.get(charge) ?? []), has_more: false }));
    transport.invoicePayments.mockImplementation(async ({ payment }: Row) => ({ has_more: false,
      data: [...live.invoices.values()].filter(row => row.payments.data[0].payment.payment_intent.id === payment.payment_intent)
        .map(row => ({ invoice: row.id })) }));
  });
  afterEach(() => { observe = () => {}; vi.restoreAllMocks(); });

  it("reserves one idempotent customer and one durable order for simultaneous owner checkouts with real organization serialization", async () => {
    const f = await fixture({ customer: false, order: false }), assertLearners = await unchangedLearners();
    const entered = gate(), release = gate(), bothLocks = gate(), holderLocked = gate(), releaseHolder = gate();
    let customers = 0, attempts = 0;
    // Both callers discover no local customer, then contend for the same Stripe
    // idempotency key outside SQL locks. One synthetic remote resource exists.
    transport.customer.mockImplementation(async () => {
      if (++customers === 2) entered.release();
      await release.promise; return { id: f.customerId };
    });
    const holder = db.transaction(async tx => {
      await tx.select().from(organizations).where(eq(organizations.id, f.orgId)).for("update");
      holderLocked.release(); await releaseHolder.promise;
    });
    await bounded(holderLocked.promise, "checkout organization holder");
    observe = (label, query) => {
      if (label?.startsWith("checkout-") && lockTable(query) === "organizations" && ++attempts === 2) bothLocks.release();
    };
    const first = run("checkout-first", () => createHiringCheckout(f.ctx, f.orgId));
    const second = run("checkout-second", () => createHiringCheckout(f.ctx, f.orgId));
    try {
      await bounded(bothLocks.promise, "both checkout organization lock attempts");
      await expectHeld("organizations", f.orgId);
      expect(transport.customer).not.toHaveBeenCalled();
      releaseHolder.release(); await bounded(holder, "checkout organization holder commit");
      await bounded(entered.promise, "both out-of-transaction Stripe customer requests");
      // Stripe latency must not retain the organization lock used by applicants.
      await db.transaction(async tx => {
        await tx.execute(sql`select id from organizations where id = ${f.orgId} for update nowait`);
      });
      release.release();
      const results = await bounded(Promise.all([first, second]), "both checkout reservations");
      expect(results[0]).toEqual(results[1]);
      const rows = await orders(f);
      expect(rows).toHaveLength(1);
      expect(rows[0]).toMatchObject({ id: results[0].orderId, status: "pending", stripeCustomerId: f.customerId });
      expect(rows[0].stripeCheckoutSessionId).toBeTruthy();
      expect(transport.customer).toHaveBeenCalledTimes(2);
      expect(transport.customer.mock.calls.every(call => call[1].idempotencyKey === `hiring-customer:${f.orgId}`)).toBe(true);
      expect(live.checkouts.size).toBe(1);
      expect(transport.checkout.mock.calls.every(call => call[1].idempotencyKey === `hiring-checkout:${rows[0].id}`)).toBe(true);
      expect(await terms(f)).toEqual([]);
      await assertLearners();
    } finally { release.release(); releaseHolder.release(); await Promise.allSettled([holder, first, second]); }
  }, 15_000);

  it.each(["cancellation-first", "renewal-first"] as const)("serializes owner cancellation versus a paid annual renewal: %s", async ordering => {
    const f = await fixture(), previous = annual(f, 2026), renewal = annual(f, 2027);
    await dispatchHiringEvent(paid(f, previous));
    await db.update(hiringTerms).set({ used: 19 }).where(eq(hiringTerms.sourceInvoiceId, previous.invoiceId));
    const before = (await terms(f))[0], assertLearners = await unchangedLearners();
    const entered = gate(), release = gate(), contender = gate();
    if (ordering === "cancellation-first") transport.subscription.mockImplementationOnce(async (id: string) => {
      entered.release(); await release.promise; return required(live.subscriptions, id, "held cancellation subscription");
    });
    else transport.invoice.mockImplementationOnce(async (id: string) => {
      entered.release(); await release.promise; return required(live.invoices, id, "held paid renewal invoice");
    });
    observe = (label, query) => { if (label === "contender" && lockTable(query) === "hiring_orders") contender.release(); };
    const cancel = () => cancelHiringAtPeriodEnd(f.ctx, { orgId: f.orgId,
      expectedBillingOrderId: f.orderId, expectedBillingSubscriptionId: f.subId });
    const renew = () => dispatchHiringEvent(paid(f, renewal));
    const first = run<unknown>("holder", ordering === "cancellation-first" ? cancel : renew);
    let second: Promise<unknown> | undefined;
    try {
      await bounded(entered.promise, "first lifecycle operation holding exact order");
      await expectHeld("hiring_orders", f.orderId);
      second = run<unknown>("contender", ordering === "cancellation-first" ? renew : cancel);
      await bounded(contender.promise, "competing lifecycle order lock attempt");
      release.release();
      await bounded(Promise.all([first, second]), "cancel/renew without deadlock");
      expect(await orders(f)).toMatchObject([{ id: f.orderId, status: "active", renewalCancelled: true }]);
      const rows = await terms(f), newest = rows.find(row => row.sourceInvoiceId === renewal.invoiceId)!;
      expect(rows).toHaveLength(2);
      expect(newest).toMatchObject({ state: "cancel_at_period_end", paymentState: "active", quota: 100, used: 0 });
      expect(rows.find(row => row.id === before.id)).toMatchObject({ used: 19, quota: 100, paymentState: "active" });
      expect(transport.updateSubscription).toHaveBeenCalledTimes(1);
      // Concurrent duplicate delivery must preserve both unique period and used quota.
      await Promise.all([dispatchHiringEvent(paid(f, renewal)), dispatchHiringEvent(paid(f, renewal))]);
      expect(await terms(f)).toHaveLength(2);
      expect((await terms(f)).find(row => row.id === before.id)?.used).toBe(19);
      await assertLearners();
    } finally { release.release(); await Promise.allSettled([first, ...(second ? [second] : [])]); }
  }, 15_000);

  it("rechecks metadata-free reversal discovery after fulfillment commits while the reversal waits on the real order lock", async () => {
    const f = await fixture(), a = annual(f), entered = gate(), release = gate(), contender = gate();
    const assertLearners = await unchangedLearners();
    transport.invoice.mockImplementationOnce(async (id: string) => {
      entered.release(); await release.promise; return required(live.invoices, id, "held fulfillment invoice");
    });
    observe = (label, query) => { if (label === "reversal" && lockTable(query) === "hiring_orders") contender.release(); };
    const fulfillment = run("fulfillment", () => dispatchHiringEvent(paid(f, a)));
    let reversalWork: Promise<unknown> | undefined;
    try {
      await bounded(entered.promise, "paid fulfillment holding exact order before term insertion");
      await expectHeld("hiring_orders", f.orderId);
      reversalWork = run("reversal", () => dispatchHiringEvent(reversal(a)));
      await bounded(contender.promise, "metadata-free reversal's post-discovery order lock attempt");
      expect(transport.invoicePayments).toHaveBeenCalledTimes(1);
      expect(await terms(f)).toEqual([]);
      // Let fulfillment read the original paid charge and commit. The reversal's
      // locked live retrieve alone returns a later full-refund snapshot.
      const defaultCharge = transport.charge.getMockImplementation()!;
      transport.charge.mockImplementation(async (id: string) => source.getStore() === "reversal"
        ? { ...required(live.charges, id, "reversal charge"), refunded: true, amount_refunded: 113_000 }
        : defaultCharge(id));
      release.release();
      await bounded(Promise.all([fulfillment, reversalWork]), "fulfillment/reversal serialization");
      const [term] = await terms(f);
      expect(term).toMatchObject({ sourceChargeId: a.chargeId, state: "suspended", paymentState: "refunded", used: 0, quota: 100 });
      expect(await payments(f)).toMatchObject([{ id: a.chargeId, paymentState: "refunded" }]);
      // Even stale all-clear transport cannot undo the committed terminal hold.
      await dispatchHiringEvent(paid(f, a));
      expect(await terms(f)).toEqual([term]);
      await assertLearners();
    } finally { release.release(); await Promise.allSettled([fulfillment, ...(reversalWork ? [reversalWork] : [])]); }
  }, 15_000);

  it("keeps two pre-fulfillment annual charge holds independently when the order's last-charge pointer changes", async () => {
    const f = await fixture(), older = annual(f, 2026), newer = annual(f, 2027);
    Object.assign(live.charges.get(older.chargeId)!, { refunded: true, amount_refunded: 113_000 });
    Object.assign(live.charges.get(newer.chargeId)!, { disputed: true });
    const disputeId = `dp_${randomUUID()}`;
    live.disputes.set(newer.chargeId, [{ id: disputeId, charge: newer.chargeId, status: "lost" }]);
    await dispatchHiringEvent(reversal(older));
    await dispatchHiringEvent(reversal(newer, "charge.dispute.closed", disputeId));
    const ledger = await payments(f);
    expect(ledger).toHaveLength(2);
    expect(ledger.find(row => row.id === older.chargeId)).toMatchObject({ paymentState: "refunded" });
    expect(ledger.find(row => row.id === newer.chargeId)).toMatchObject({ paymentState: "dispute_lost" });
    for (const a of [older, newer]) {
      Object.assign(live.charges.get(a.chargeId)!, { refunded: false, amount_refunded: 0, disputed: false });
      live.disputes.set(a.chargeId, []);
    }
    // Exercise both replay orders; a single mutable order payment field cannot
    // stand in for the durable per-charge ledger.
    for (const a of [older, newer, newer, older]) await dispatchHiringEvent(paid(f, a));
    expect(await terms(f)).toEqual([]);
    const withoutTimestamp = (rows: Awaited<ReturnType<typeof payments>>) => rows
      .map(({ updatedAtMs: _timestamp, ...row }) => row).sort((a, b) => a.id.localeCompare(b.id));
    expect(withoutTimestamp(await payments(f))).toEqual(withoutTimestamp(ledger));
    const reviews = await db.select().from(hiringEvents).where(eq(hiringEvents.orderId, f.orderId));
    expect(reviews).toHaveLength(6);
    expect(reviews.every(row => row.state === "review_required")).toBe(true);
  }, 10_000);

  it("requires the same recorded dispute's live win before recovering its own annual hold, without clearing another year's refund", async () => {
    const f = await fixture(), older = annual(f, 2026), newer = annual(f, 2027), disputeId = `dp_${randomUUID()}`;
    Object.assign(live.charges.get(older.chargeId)!, { refunded: true, amount_refunded: 113_000 });
    Object.assign(live.charges.get(newer.chargeId)!, { disputed: true });
    live.disputes.set(newer.chargeId, [{ id: disputeId, charge: newer.chargeId, status: "needs_response" }]);
    await dispatchHiringEvent(reversal(older));
    await dispatchHiringEvent(reversal(newer, "charge.dispute.created", disputeId));
    Object.assign(live.charges.get(newer.chargeId)!, { disputed: false });
    live.disputes.set(newer.chargeId, []);
    await dispatchHiringEvent(reversal(newer, "charge.dispute.closed", disputeId));
    await dispatchHiringEvent(paid(f, newer));
    expect(await terms(f)).toEqual([]);
    expect((await payments(f)).find(row => row.id === newer.chargeId)).toMatchObject({ paymentState: "disputed", disputeIds: [disputeId] });
    live.disputes.set(newer.chargeId, [{ id: disputeId, charge: newer.chargeId, status: "won" }]);
    await dispatchHiringEvent(reversal(newer, "charge.dispute.closed", disputeId));
    // The closed event must reconcile the paid invoice itself after committing
    // positive resolution; no extra invoice.paid delivery is needed.
    const rows = await terms(f);
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({ sourceInvoiceId: newer.invoiceId, paymentState: "active", state: "active", used: 0, quota: 100 });
    expect((await payments(f)).find(row => row.id === older.chargeId)).toMatchObject({ paymentState: "refunded" });
    await dispatchHiringEvent(paid(f, older));
    expect(await terms(f)).toEqual(rows);
  }, 10_000);

  it("suspends and recovers subscription delinquency independently from genuine payment holds", async () => {
    const f = await fixture(), a = annual(f, 2026);
    await dispatchHiringEvent(paid(f, a));
    await db.update(hiringTerms).set({ used: 23 }).where(eq(hiringTerms.sourceInvoiceId, a.invoiceId));
    const ledger = await payments(f);
    Object.assign(live.subscriptions.get(f.subId)!, { status: "unpaid" });
    await dispatchHiringEvent(event("customer.subscription.updated", required(live.subscriptions, f.subId, "unpaid update")));
    expect(await terms(f)).toMatchObject([{ state: "subscription_suspended", paymentState: "active", used: 23, quota: 100 }]);
    expect(await payments(f)).toEqual(ledger);
    expect(await getHiringStatus(f.ctx, f.orgId)).toMatchObject({ active: false, canCancelRenewal: true });
    Object.assign(live.subscriptions.get(f.subId)!, { status: "active" });
    await dispatchHiringEvent(event("customer.subscription.updated", required(live.subscriptions, f.subId, "active update")));
    expect(await terms(f)).toMatchObject([{ state: "active", paymentState: "active", used: 23 }]);
    Object.assign(live.charges.get(a.chargeId)!, { refunded: true, amount_refunded: 113_000 });
    await dispatchHiringEvent(reversal(a));
    for (const status of ["unpaid", "active"]) {
      Object.assign(live.subscriptions.get(f.subId)!, { status });
      await dispatchHiringEvent(event("customer.subscription.updated", required(live.subscriptions, f.subId, "held payment update")));
    }
    expect(await terms(f)).toMatchObject([{ state: "suspended", paymentState: "refunded", used: 23 }]);
  }, 10_000);

  it.each(["deletion-first", "renewal-first"] as const)("retains a settled renewal without granting access when subscription deletion races it: %s", async ordering => {
    const f = await fixture(), a = annual(f), entered = gate(), release = gate(), contender = gate();
    const previous = annual(f, 2026);
    await dispatchHiringEvent(paid(f, previous));
    const deleted = { ...required(live.subscriptions, f.subId, "deleted subscription"), status: "canceled" };
    if (ordering === "deletion-first") {
      // Deletion needs no remote request: an independently held existing term
      // pauses its real all-term lock read AFTER it has acquired the order.
      const [existing] = await terms(f);
      const holder = db.transaction(async tx => {
        await tx.select().from(hiringTerms).where(eq(hiringTerms.id, existing.id)).for("update");
        entered.release(); await release.promise;
      });
      await bounded(entered.promise, "deletion term holder");
      const deletionAttempt = gate();
      observe = (label, query) => {
        if (label === "delete-holder" && lockTable(query) === "hiring_terms") deletionAttempt.release();
        if (label === "paid-contender" && lockTable(query) === "hiring_orders") contender.release();
      };
      Object.assign(live.subscriptions.get(f.subId)!, { status: "canceled" });
      const deletion = run("delete-holder", () => dispatchHiringEvent(event("customer.subscription.deleted", deleted)));
      let renewal: Promise<unknown> | undefined;
      try {
        await bounded(deletionAttempt.promise, "deletion's term lock attempt after order lock");
        await expectHeld("hiring_orders", f.orderId);
        renewal = run("paid-contender", () => dispatchHiringEvent(paid(f, a)));
        await bounded(contender.promise, "fresh paid renewal waiting behind deletion");
        release.release();
        await bounded(Promise.all([holder, deletion, renewal]), "deletion then fresh settled invoice");
      } finally { release.release(); await Promise.allSettled([holder, deletion, ...(renewal ? [renewal] : [])]); }
    } else {
      transport.invoice.mockImplementationOnce(async (id: string) => {
        entered.release(); await release.promise; return required(live.invoices, id, "held renewal");
      });
      observe = (label, query) => { if (label === "delete-contender" && lockTable(query) === "hiring_orders") contender.release(); };
      const renewal = run("paid-holder", () => dispatchHiringEvent(paid(f, a)));
      let deletion: Promise<unknown> | undefined;
      try {
        await bounded(entered.promise, "renewal's order lock before deletion");
        await expectHeld("hiring_orders", f.orderId);
        deletion = run("delete-contender", () => dispatchHiringEvent(event("customer.subscription.deleted", deleted)));
        await bounded(contender.promise, "subscription deletion waiting behind renewal");
        release.release();
        await bounded(Promise.all([renewal, deletion]), "settled renewal then deletion");
      } finally { release.release(); await Promise.allSettled([renewal, ...(deletion ? [deletion] : [])]); }
    }
    expect(await orders(f)).toMatchObject([{ status: "cancelled", renewalCancelled: true }]);
    const rows = await terms(f);
    expect(rows).toHaveLength(2);
    expect(rows.every(row => row.state === "subscription_suspended" && row.paymentState === "active" && row.used === 0 && row.quota === 100)).toBe(true);
    expect((await payments(f)).find(row => row.id === a.chargeId)).toMatchObject({ paymentState: "active" });
    expect(await getHiringStatus(f.ctx, f.orgId)).toMatchObject({ active: false });
  }, 15_000);

  it("records a first settled invoice arriving after deletion as subscription-suspended, never an active quota grant", async () => {
    const f = await fixture(), a = annual(f);
    Object.assign(live.subscriptions.get(f.subId)!, { status: "canceled" });
    await dispatchHiringEvent(event("customer.subscription.deleted", required(live.subscriptions, f.subId, "deleted before payment")));
    expect(await terms(f)).toEqual([]);
    await dispatchHiringEvent(paid(f, a));
    expect(await terms(f)).toMatchObject([{ state: "subscription_suspended", paymentState: "active", sourceInvoiceId: a.invoiceId }]);
    expect(await orders(f)).toMatchObject([{ status: "cancelled", renewalCancelled: true }]);
    expect(await payments(f)).toMatchObject([{ id: a.chargeId, paymentState: "active" }]);
  }, 10_000);

  it("suspends every current and future paid term on deletion without contaminating per-charge payment evidence", async () => {
    const f = await fixture(), current = annual(f, 2026), future = annual(f, 2027);
    await dispatchHiringEvent(paid(f, current)); await dispatchHiringEvent(paid(f, future));
    await db.update(hiringTerms).set({ used: 31 }).where(eq(hiringTerms.sourceInvoiceId, current.invoiceId));
    const ledger = await payments(f);
    Object.assign(live.subscriptions.get(f.subId)!, { status: "canceled" });
    await dispatchHiringEvent(event("customer.subscription.deleted", required(live.subscriptions, f.subId, "all-term deletion")));
    const rows = await terms(f);
    expect(rows).toHaveLength(2);
    expect(rows.every(row => row.state === "subscription_suspended" && row.paymentState === "active")).toBe(true);
    expect(rows.find(row => row.sourceInvoiceId === current.invoiceId)?.used).toBe(31);
    expect(await payments(f)).toEqual(ledger);
  }, 10_000);

  it("rolls back real invoice ledger/term/order/event writes when MySQL rejects the final event insert, then safely retries", async () => {
    const f = await fixture(), a = annual(f), before = await orders(f), delivery = paid(f, a);
    // A real server-side trigger throws AFTER the transaction has inserted the
    // payment ledger/annual term and updated the order. No DB API is replaced.
    const trigger = `hiring_rollback_${randomUUID().replaceAll("-", "")}`;
    await db.execute(sql.raw(`CREATE TRIGGER \`${trigger}\` BEFORE INSERT ON hiring_events FOR EACH ROW SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'synthetic billing rollback probe'`));
    try {
      await expect(dispatchHiringEvent(delivery)).rejects.toMatchObject({ cause: { sqlState: "45000" } });
      expect(await orders(f)).toEqual(before);
      expect(await terms(f)).toEqual([]);
      expect(await payments(f)).toEqual([]);
      expect(await db.select().from(hiringEvents).where(eq(hiringEvents.orderId, f.orderId))).toEqual([]);
    } finally { await db.execute(sql.raw(`DROP TRIGGER \`${trigger}\``)); }
    await dispatchHiringEvent(delivery);
    await dispatchHiringEvent(delivery);
    expect(await terms(f)).toHaveLength(1);
    expect(await payments(f)).toHaveLength(1);
    expect(await db.select().from(hiringEvents).where(eq(hiringEvents.orderId, f.orderId))).toHaveLength(1);
  }, 10_000);

  it("persists a known refund despite mutable metadata loss and preserves the other year's immutable payment and usage", async () => {
    const f = await fixture(), older = annual(f, 2026), newer = annual(f, 2027);
    await dispatchHiringEvent(paid(f, older)); await dispatchHiringEvent(paid(f, newer));
    await db.update(hiringTerms).set({ used: 41 }).where(eq(hiringTerms.sourceInvoiceId, older.invoiceId));
    const beforeNewer = (await terms(f)).find(row => row.sourceInvoiceId === newer.invoiceId);
    Object.assign(live.subscriptions.get(f.subId)!, { metadata: {} });
    Object.assign(live.invoices.get(older.invoiceId)!, { metadata: {}, payments: { has_more: true, data: [] } });
    Object.assign(live.charges.get(older.chargeId)!, { refunded: true, amount_refunded: 113_000 });
    await dispatchHiringEvent(reversal(older));
    const rows = await terms(f);
    expect(rows.find(row => row.sourceInvoiceId === older.invoiceId)).toMatchObject({ state: "suspended", paymentState: "refunded", used: 41, quota: 100 });
    expect(rows.find(row => row.sourceInvoiceId === newer.invoiceId)).toEqual(beforeNewer);
    expect((await payments(f)).find(row => row.id === older.chargeId)).toMatchObject({ paymentState: "refunded" });
    expect((await payments(f)).find(row => row.id === newer.chargeId)).toMatchObject({ paymentState: "active" });
    await dispatchHiringEvent(event("customer.subscription.updated", required(live.subscriptions, f.subId, "metadata drift")));
    expect((await terms(f)).find(row => row.sourceInvoiceId === older.invoiceId)).toMatchObject({ state: "suspended", paymentState: "refunded", used: 41 });
  }, 10_000);

  it.each(["quantity", "monthly", "product-policy"])("does not restore a delinquent paid term after %s policy drift, and valid repair preserves used quota", async mutation => {
    const f = await fixture(), a = annual(f, 2026);
    await dispatchHiringEvent(paid(f, a));
    await db.update(hiringTerms).set({ used: 37 }).where(eq(hiringTerms.sourceInvoiceId, a.invoiceId));
    const ledger = await payments(f), valid = required(live.subscriptions, f.subId, "valid original subscription");
    Object.assign(live.subscriptions.get(f.subId)!, { status: "unpaid" });
    await dispatchHiringEvent(event("customer.subscription.updated", required(live.subscriptions, f.subId, "unpaid")));
    const bad = structuredClone(valid);
    if (mutation === "quantity") bad.items.data[0].quantity = 2;
    else if (mutation === "monthly") bad.items.data[0].price.recurring.interval = "month";
    else bad.items.data[0].price.product.metadata.policy = "unapproved";
    live.subscriptions.set(f.subId, bad);
    await expect(dispatchHiringEvent(event("customer.subscription.updated", bad))).resolves.toMatchObject({ handled: true, reviewRequired: true });
    expect(await terms(f)).toMatchObject([{ state: "subscription_suspended", paymentState: "active", used: 37, quota: 100 }]);
    expect(await payments(f)).toEqual(ledger);
    expect(await getHiringStatus(f.ctx, f.orgId)).toMatchObject({ active: false });
    live.subscriptions.set(f.subId, valid);
    await dispatchHiringEvent(event("customer.subscription.updated", valid));
    expect(await terms(f)).toHaveLength(1);
    expect(await terms(f)).toMatchObject([{ state: "active", paymentState: "active", used: 37, quota: 100 }]);
    expect(await payments(f)).toEqual(ledger);
  }, 10_000);

  it.each(["active", "past_due", "unpaid", "canceled", "incomplete_expired"])("owner cancellation observes %s and reconciles all current/future periods without changing payments or usage", async status => {
    const f = await fixture(), current = annual(f, 2026), future = annual(f, 2027);
    await dispatchHiringEvent(paid(f, current)); await dispatchHiringEvent(paid(f, future));
    await db.update(hiringTerms).set({ used: 53 }).where(eq(hiringTerms.sourceInvoiceId, current.invoiceId));
    const ledger = await payments(f), assertLearners = await unchangedLearners();
    Object.assign(live.subscriptions.get(f.subId)!, { status });
    await cancelHiringAtPeriodEnd(f.ctx, { orgId: f.orgId,
      expectedBillingOrderId: f.orderId, expectedBillingSubscriptionId: f.subId });
    const rows = await terms(f);
    expect(rows).toHaveLength(2);
    expect(rows.every(row => row.state === (status === "active" ? "cancel_at_period_end" : "subscription_suspended")
      && row.paymentState === "active" && row.quota === 100)).toBe(true);
    expect(rows.find(row => row.sourceInvoiceId === current.invoiceId)?.used).toBe(53);
    expect(rows.find(row => row.sourceInvoiceId === future.invoiceId)?.used).toBe(0);
    expect(await payments(f)).toEqual(ledger);
    expect(await orders(f)).toMatchObject([{ id: f.orderId, renewalCancelled: true,
      status: ["canceled", "incomplete_expired"].includes(status) ? "cancelled" : "active" }]);
    expect(transport.updateSubscription).toHaveBeenCalledTimes(["canceled", "incomplete_expired"].includes(status) ? 0 : 1);
    expect(await getHiringStatus(f.ctx, f.orgId)).toMatchObject({ active: status === "active" });
    await assertLearners();
  }, 10_000);

  it("commits the known dispute hold on transient closure evidence failure and recovers by retrying the same delivery", async () => {
    const f = await fixture(), a = annual(f, 2026), disputeId = `dp_${randomUUID()}`;
    await dispatchHiringEvent(paid(f, a));
    await db.update(hiringTerms).set({ used: 43 }).where(eq(hiringTerms.sourceInvoiceId, a.invoiceId));
    Object.assign(live.charges.get(a.chargeId)!, { disputed: true });
    live.disputes.set(a.chargeId, [{ id: disputeId, charge: a.chargeId, status: "needs_response" }]);
    await dispatchHiringEvent(reversal(a, "charge.dispute.created", disputeId));
    Object.assign(live.charges.get(a.chargeId)!, { disputed: false });
    live.disputes.set(a.chargeId, [{ id: disputeId, charge: a.chargeId, status: "won" }]);
    const closure = reversal(a, "charge.dispute.closed", disputeId);
    transport.invoice.mockRejectedValueOnce(new Error("Synthetic one-off positive evidence timeout"));
    await expect(dispatchHiringEvent(closure)).rejects.toThrow();
    expect(await terms(f)).toMatchObject([{ state: "suspended", paymentState: "disputed", used: 43, quota: 100 }]);
    expect(await payments(f)).toMatchObject([{ id: a.chargeId, paymentState: "disputed", disputeIds: [disputeId] }]);
    await dispatchHiringEvent(closure);
    expect(await terms(f)).toHaveLength(1);
    expect(await terms(f)).toMatchObject([{ state: "active", paymentState: "active", used: 43, quota: 100 }]);
    expect(await payments(f)).toMatchObject([{ id: a.chargeId, paymentState: "active", disputeIds: [disputeId] }]);
    const [receipt] = await db.select().from(hiringEvents).where(eq(hiringEvents.id, closure.id));
    expect(receipt).toMatchObject({ state: "claimed" });
  }, 10_000);
});
