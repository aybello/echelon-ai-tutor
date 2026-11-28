import { getTableName, sql, type SQL } from "drizzle-orm";
import { MySqlDialect } from "drizzle-orm/mysql-core";
import { beforeEach, describe, expect, it, vi } from "vitest";

const external = vi.hoisted(() => ({ getDb: vi.fn(), invoice: vi.fn(), invoicePayments: vi.fn(), subscription: vi.fn(), charge: vi.fn(), disputes: vi.fn(), checkout: vi.fn() }));
vi.mock("../db", () => ({ getDb: external.getDb }));
vi.mock("../stripe/stripe", () => ({ stripe: { invoices: { retrieve: external.invoice }, invoicePayments: { list: external.invoicePayments }, subscriptions: { retrieve: external.subscription }, charges: { retrieve: external.charge }, disputes: { list: external.disputes }, checkout: { sessions: { retrieve: external.checkout } } } }));
import { dispatchHiringEvent } from "./webhook";
import { assertHiringGrant, HIRING_AMOUNT, HIRING_POLICY, HIRING_TYPE, validateHiringCancellationSubscription } from "./policy";

type Row = Record<string, any>;
const EMAIL = "owner@example.test";
const START = Date.parse("2026-01-01T00:00:00Z");
const END = Date.parse("2027-01-01T00:00:00Z");
const metadata = { type: HIRING_TYPE, policy: HIRING_POLICY, orderId: "order_hiring", orgId: "7" };
const order = (changes: Row = {}) => ({ id: "order_hiring", orgId: 7, stripeSubscriptionId: "sub_hiring", stripeCustomerId: "cus_hiring", ownerEmail: EMAIL, amountCents: HIRING_AMOUNT, currency: "cad", status: "pending", paymentState: "active", ...changes });
const term = (changes: Row = {}) => ({ id: "term_hiring", orgId: 7, basis: "stripe", sourceInvoiceId: "in_hiring", sourceSubscriptionId: "sub_hiring", sourcePaymentIntentId: "pi_hiring", sourceChargeId: "ch_hiring", startsAtMs: START, endsAtMs: END, quota: 100, used: 6, state: "active", paymentState: "active", createdByEmail: EMAIL, ...changes });
const payment = (changes: Row = {}) => ({ id: "ch_hiring", orgId: 7, orderId: "order_hiring", invoiceId: "in_hiring", subscriptionId: "sub_hiring", paymentIntentId: "pi_hiring", paymentState: "active", disputeIds: [], updatedAtMs: 1, ...changes });
const checkout = (changes: Row = {}) => ({ id: "cs_hiring", mode: "subscription", customer: "cus_hiring", subscription: null, status: "expired", metadata, ...changes });
const subscription = (changes: Row = {}) => ({ id: "sub_hiring", customer: "cus_hiring", status: "active", cancel_at_period_end: false, metadata, collection_method: "charge_automatically", items: { data: [{ quantity: 1, price: { id: "price_hiring", currency: "cad", unit_amount: HIRING_AMOUNT, type: "recurring", recurring: { interval: "year", interval_count: 1, usage_type: "licensed" }, tax_behavior: "exclusive", billing_scheme: "per_unit", product: { id: "prod_hiring", metadata: { type: HIRING_TYPE, policy: HIRING_POLICY } } } }], has_more: false }, ...changes });
const invoice = (changes: Row = {}) => ({ id: "in_hiring", metadata, subscription: "sub_hiring", customer: "cus_hiring", currency: "cad", status: "paid", paid: true, collection_method: "charge_automatically", billing_reason: "subscription_create", subtotal: HIRING_AMOUNT, total: 113000, amount_paid: 113000, amount_remaining: 0, lines: { data: [{ type: "subscription", proration: false, quantity: 1, amount: HIRING_AMOUNT, currency: "cad", price: "price_hiring", period: { start: START / 1000, end: END / 1000 } }], has_more: false }, payments: { has_more: false, data: [{ status: "paid", amount_paid: 113000, payment: { payment_intent: { id: "pi_hiring", latest_charge: { id: "ch_hiring" } }, charge: { id: "ch_hiring" } } }] }, ...changes });
const charge = (changes: Row = {}) => ({ id: "ch_hiring", payment_intent: "pi_hiring", status: "succeeded", paid: true, captured: true, currency: "cad", customer: "cus_hiring", amount: 113000, amount_captured: 113000, refunded: false, amount_refunded: 0, disputed: false, metadata, ...changes });
const event = (type: string, object: Row, id = `evt_${type}`) => ({ id, type, data: { object } });
const paidEvent = (id = "evt_invoice_paid", type = "invoice.paid") => event(type, { id: "in_hiring", metadata }, id);
const reversalEvent = (type: string, overrides: Row = {}) => event(type, type === "charge.refunded" ? { id: "ch_hiring", payment_intent: "pi_hiring", metadata, ...overrides } : { id: "dp_hiring", charge: "ch_hiring", payment_intent: "pi_hiring", metadata, status: "needs_response", ...overrides });

/** Executes the real Drizzle query predicates and records awaited lock ordering.
 * Transactions snapshot mock state and restore on exceptions. No real DB, SQL
 * execution, Stripe SDK, sockets, email, or real MySQL isolation is involved. */
function memoryDb(options: { terms?: Row[]; orders?: Row[]; claims?: Row[]; payments?: Row[]; beforeTransaction?: (state: Record<string, Row[]>) => void; fail?: { table: string; kind: "insert" | "update" } } = {}) {
  const dialect = new MySqlDialect();
  const state: Record<string, Row[]> = { hiring_orders: structuredClone(options.orders ?? [order()]), hiring_terms: structuredClone(options.terms ?? []), hiring_events: structuredClone(options.claims ?? []), hiring_payments: structuredClone(options.payments ?? []) };
  const effects: { table: string; kind: "insert" | "update"; values: Row }[] = [];
  const locks: { transaction: number; table: string; ids: string[] }[] = [];
  const history: string[] = [];
  let nextTransaction = 0;
  function matches(predicate: SQL, row: Row) {
    const query = dialect.sqlToQuery(predicate); let index = 0;
    const expression = query.sql.replace(/`[^`]+`\.`([^`]+)`\s*(in\s*\(([^)]*)\)|=\s*\?)/g, (_match, column: string, _operator: string, placeholders: string | undefined) => {
      if (placeholders !== undefined) { const count = [...placeholders.matchAll(/\?/g)].length; const accepted = query.params.slice(index, index + count); index += count; return String(accepted.includes(row[column])); }
      return String(row[column] === query.params[index++]);
    });
    if (index !== query.params.length || /[^()\s]/.test(expression.replace(/true|false|and|or/gi, ""))) throw new Error(`Unsupported mocked SQL: ${query.sql}`);
    const tokens = expression.match(/true|false|and|or|\(|\)/gi) ?? []; let position = 0;
    function atom(): boolean {
      const token = tokens[position++];
      if (token === "(") { const value = disjunction(); if (tokens[position++] !== ")") throw new Error("Unbalanced mock SQL"); return value; }
      if (token !== "true" && token !== "false") throw new Error("Unsupported mock SQL token");
      return token === "true";
    }
    function conjunction(): boolean { let value = atom(); while (tokens[position] === "and") { position++; const next = atom(); value = value && next; } return value; }
    function disjunction(): boolean { let value = conjunction(); while (tokens[position] === "or") { position++; const next = conjunction(); value = value || next; } return value; }
    const result = disjunction(); if (position !== tokens.length) throw new Error("Unconsumed mock SQL tokens"); return result;
  }
  function tableRows(name: string) { if (!state[name]) throw new Error(`Forbidden learner/organization access: ${name}`); return state[name]; }
  function api(transaction: number) {
    return {
      select: vi.fn((selection?: Row) => ({ from: (table: any) => {
        const name = getTableName(table); tableRows(name);
        let predicate: SQL | undefined, count = Infinity, locked = false;
        const ordering: string[] = [];
        const builder: any = {
          where: (condition: SQL) => { predicate = condition; return builder; },
          orderBy: (...columns: any[]) => { ordering.push(...columns.map(column => dialect.sqlToQuery(sql`${column}`).sql)); return builder; },
          limit: (value: number) => { count = value; return builder; },
          for: (mode: string) => { if (mode !== "update") throw new Error(`Unexpected lock mode: ${mode}`); locked = true; return builder; },
          then: (resolve: any, reject: any) => Promise.resolve().then(() => {
            let rows = tableRows(name).filter(row => !predicate || matches(predicate, row));
            for (const expression of [...ordering].reverse()) {
              const column = expression.match(/`[^`]+`\.`([^`]+)`/)?.[1];
              if (!column) throw new Error(`Unsupported ordering: ${expression}`);
              rows = [...rows].sort((a, b) => (a[column] < b[column] ? -1 : a[column] > b[column] ? 1 : 0) * (/\bdesc\b/i.test(expression) ? -1 : 1));
            }
            rows = rows.slice(0, count);
            if (locked) { if (!transaction) throw new Error("Lock outside mock transaction"); locks.push({ transaction, table: name, ids: rows.map(row => row.id) }); history.push(`lock:${name}`); }
            return rows.map(row => selection ? Object.fromEntries(Object.entries(selection).map(([key, column]) => [key, row[(column as any).name]])) : structuredClone(row));
          }).then(resolve, reject),
        };
        return builder;
      } })),
      insert: vi.fn((table: any) => ({ values: async (values: Row) => {
        const name = getTableName(table); const rows = tableRows(name); effects.push({ table: name, kind: "insert", values: structuredClone(values) }); history.push(`insert:${name}`);
        if (options.fail?.table === name && options.fail?.kind === "insert") throw new Error(`mock insert failed: ${name}`);
        if (rows.some(row => row.id === values.id || (name === "hiring_terms" && row.sourceInvoiceId === values.sourceInvoiceId))) throw new Error("mock unique constraint violation");
        rows.push(structuredClone(name === "hiring_events" ? { state: "claimed", ...values } : values));
      } })),
      update: vi.fn((table: any) => ({ set: (values: Row) => ({ where: async (predicate: SQL) => {
        const name = getTableName(table); const rows = tableRows(name); effects.push({ table: name, kind: "update", values: structuredClone(values) }); history.push(`update:${name}`);
        if (options.fail?.table === name && options.fail?.kind === "update") throw new Error(`mock update failed: ${name}`);
        rows.filter(row => matches(predicate, row)).forEach(row => Object.assign(row, values));
      } }) })),
      delete: vi.fn(() => { throw new Error("Forbidden delete"); }),
    };
  }
  const db = { ...api(0), transaction: vi.fn(async (work: (tx: ReturnType<typeof api>) => Promise<any>) => {
    options.beforeTransaction?.(state);
    const transaction = ++nextTransaction; const snapshot = structuredClone(state); history.push("transaction");
    try { const result = await work(api(transaction)); history.push("commit"); return result; }
    catch (error) { for (const name of Object.keys(state)) state[name] = snapshot[name]; history.push("rollback"); throw error; }
  }) };
  external.getDb.mockResolvedValue(db);
  return { db, state, effects, locks, history };
}

/** Validation failures now have durable review records, not zero writes. Keep
 * the old security guarantee: absolutely no quota, payment binding or seats. */
function expectReviewOnly(store: ReturnType<typeof memoryDb>, id = "evt_invoice_paid", invoiceId: string | null = "in_hiring") {
  expect(store.state.hiring_terms).toEqual([]);
  expect(store.state.hiring_payments).toEqual([]);
  expect(store.state.hiring_orders).toEqual([order()]);
  expect(store.state.hiring_events).toEqual([expect.objectContaining({ id, orderId: "order_hiring", orgId: 7, invoiceId, state: "review_required" })]);
  expect(store.effects.map(effect => effect.table)).toEqual(["hiring_events"]);
}

beforeEach(() => {
  vi.resetAllMocks(); external.invoice.mockResolvedValue(invoice()); external.subscription.mockResolvedValue(subscription()); external.charge.mockResolvedValue(charge()); external.disputes.mockResolvedValue({ data: [] });
  external.checkout.mockResolvedValue(checkout());
  external.invoicePayments.mockImplementation(async (input: any) => ({ data: input.payment.payment_intent === "pi_hiring" ? [{ invoice: "in_hiring" }] : [], has_more: false }));
});

describe("real Hiring paid invoice fulfilment", () => {
  it("creates precisely one paid annual Hiring grant and never writes learner seats", async () => {
    const store = memoryDb();
    await expect(dispatchHiringEvent(paidEvent())).resolves.toEqual({ handled: true });
    expect(store.state.hiring_terms).toHaveLength(1);
    expect(store.state.hiring_terms[0]).toMatchObject({ orgId: 7, basis: "stripe", sourceInvoiceId: "in_hiring", sourceSubscriptionId: "sub_hiring", sourcePaymentIntentId: "pi_hiring", sourceChargeId: "ch_hiring", startsAtMs: START, endsAtMs: END, quota: 100, used: 0, state: "active", paymentState: "active" });
    expect(store.state.hiring_orders[0]).toMatchObject({ status: "active" });
    expect(store.state.hiring_payments).toEqual([expect.objectContaining({ ...payment(), updatedAtMs: expect.any(Number) })]);
    expect(store.effects.map(effect => effect.table)).toEqual(["hiring_payments", "hiring_terms", "hiring_orders", "hiring_events", "hiring_events"]);
    expect(external.invoice).toHaveBeenCalledWith("in_hiring", { expand: ["payments.data.payment.payment_intent", "payments.data.payment.charge"] });
  });

  it("deduplicates both identical event delivery and another paid event for the same invoice", async () => {
    const store = memoryDb();
    await dispatchHiringEvent(paidEvent()); store.state.hiring_terms[0].used = 11;
    await dispatchHiringEvent(paidEvent());
    await dispatchHiringEvent(paidEvent("evt_invoice_success", "invoice.payment_succeeded"));
    expect(store.state.hiring_terms).toHaveLength(1); expect(store.state.hiring_terms[0].used).toBe(11);
    expect(store.effects.filter(effect => effect.table === "hiring_terms" && effect.kind === "insert")).toHaveLength(1);
    expect(store.state.hiring_events.map(claim => claim.id)).toEqual(["evt_invoice_paid", "evt_invoice_success"]);
  });

  it("records checkout binding but does not grant quota on checkout completion", async () => {
    const store = memoryDb();
    await dispatchHiringEvent(event("checkout.session.completed", { id: "cs_hiring", mode: "subscription", customer: "cus_hiring", subscription: "sub_hiring", payment_status: "paid", metadata }));
    expect(store.state.hiring_terms).toEqual([]); expect(store.state.hiring_events).toEqual([]);
    expect(store.state.hiring_orders[0]).toMatchObject({ status: "pending", stripeCheckoutSessionId: "cs_hiring" });
    expect(external.invoice).not.toHaveBeenCalled();
  });

  it.each([
    ["full refund", { refunded: true, amount_refunded: 113000 }, [], "refunded"],
    ["partial refund", { amount_refunded: 1000 }, [], "needs_review"],
    ["open dispute", { disputed: true }, [{ id: "dp_hiring", status: "needs_response" }], "disputed"],
    ["lost dispute", { disputed: true }, [{ id: "dp_hiring", status: "lost" }], "dispute_lost"],
  ])("rejects %s live evidence before granting any invoice term", async (_label, change, disputes, paymentState) => {
    const store = memoryDb(); external.charge.mockResolvedValue(charge(change)); external.disputes.mockResolvedValue({ data: disputes });
    await expect(dispatchHiringEvent(paidEvent())).resolves.toEqual({ handled: true, reviewRequired: true });
    expect(store.state.hiring_terms).toEqual([]);
    expect(store.state.hiring_payments).toEqual([expect.objectContaining({ id: "ch_hiring", paymentState })]);
    expect(store.state.hiring_events).toEqual([expect.objectContaining({ id: "evt_invoice_paid", state: "review_required" })]);
    expect(store.effects.map(effect => effect.table)).toEqual(["hiring_payments", "hiring_orders", "hiring_events"]);
  });

  it("does not allocate another allowance for a different paid invoice in the same subscription period", async () => {
    const store = memoryDb();
    await dispatchHiringEvent(paidEvent());
    external.invoice.mockResolvedValue(invoice({ id: "in_duplicate_period" }));
    await expect(dispatchHiringEvent(paidEvent("evt_duplicate_period"))).resolves.toEqual({ handled: true, reviewRequired: true });
    expect(store.state.hiring_terms).toHaveLength(1);
    expect(store.state.hiring_terms[0]).toMatchObject({ quota: 100, sourceInvoiceId: "in_hiring" });
  });

  it("rejects invalid invoice policy using the real payment validators", async () => {
    const store = memoryDb(); external.invoice.mockResolvedValue(invoice({ subtotal: 99999 }));
    await expect(dispatchHiringEvent(paidEvent())).resolves.toEqual({ handled: true, reviewRequired: true });
    expectReviewOnly(store);
  });

  it.each([
    ["short capture", { amount_captured: 112999 }],
    ["short charge", { amount: 112999 }],
    ["uncaptured charge", { captured: false }],
    ["wrong currency", { currency: "usd" }],
    ["wrong customer", { customer: "cus_other" }],
    ["wrong payment intent", { payment_intent: "pi_other" }],
    ["wrong charge id", { id: "ch_other" }],
  ])("records review for %s charge evidence without grants, payment bindings, or learner writes", async (_label, changes) => {
    const store = memoryDb(); external.charge.mockResolvedValue(charge(changes));
    await expect(dispatchHiringEvent(paidEvent())).resolves.toEqual({ handled: true, reviewRequired: true });
    expectReviewOnly(store);
  });

  it.each([
    ["short allocation", { has_more: false, data: [{ status: "paid", amount_paid: 112999, payment: { charge: "ch_hiring", payment_intent: "pi_hiring" } }] }],
    ["incomplete pagination", { has_more: true, data: [{ status: "paid", amount_paid: 113000, payment: { charge: "ch_hiring", payment_intent: "pi_hiring" } }] }],
    ["multiple allocations", { has_more: false, data: [{ status: "paid", amount_paid: 113000, payment: { charge: "ch_hiring" } }, { status: "paid", amount_paid: 1, payment: { charge: "ch_other" } }] }],
  ])("rejects %s invoice payment evidence", async (_label, payments) => {
    const store = memoryDb(); external.invoice.mockResolvedValue(invoice({ payments }));
    await expect(dispatchHiringEvent(paidEvent())).resolves.toEqual({ handled: true, reviewRequired: true });
    expectReviewOnly(store);
  });

  it.each(["refunded", "dispute_lost"])("does not let paid replay restore a terminal %s order or create another term", async paymentState => {
    const held = term({ state: "suspended", paymentState });
    const store = memoryDb({ orders: [order({ status: "active", paymentState, paymentChargeId: "ch_hiring" })], terms: [held] });
    await expect(dispatchHiringEvent(paidEvent())).resolves.toEqual({ handled: true, reviewRequired: true });
    // Paid delivery must inspect live evidence (it can reveal a newer reversal),
    // but never weaken the already durable adverse payment state or reset usage.
    expect(store.state.hiring_terms).toEqual([held]);
    expect(store.state.hiring_orders[0]).toMatchObject({ paymentState, paymentChargeId: "ch_hiring" });
    expect(store.state.hiring_payments[0]).toMatchObject({ id: "ch_hiring", paymentState });
    expect(store.state.hiring_events[0]).toMatchObject({ id: "evt_invoice_paid", state: "review_required" });
    expect(external.charge).toHaveBeenCalled();
  });

  it("fails closed on charge-only invoice evidence without the required reconcilable payment intent", async () => {
    const store = memoryDb();
    external.invoice.mockResolvedValue(invoice({ payments: { has_more: false, data: [{ status: "paid", amount_paid: 113000, payment: { charge: { id: "ch_hiring" } } }] } }));
    await expect(dispatchHiringEvent(paidEvent())).resolves.toEqual({ handled: true, reviewRequired: true });
    expectReviewOnly(store);
  });

  it("stores exact charge binding and finds a metadata-free reversal even if its payment-intent field is absent", async () => {
    const store = memoryDb();
    await dispatchHiringEvent(paidEvent());
    expect(store.state.hiring_terms[0].sourceChargeId).toBe("ch_hiring");
    external.charge.mockResolvedValue(charge({ payment_intent: null, refunded: true, amount_refunded: 113000 }));
    await expect(dispatchHiringEvent(reversalEvent("charge.refunded", { metadata: {}, payment_intent: null }))).resolves.toEqual({ handled: true });
    expect(store.state.hiring_terms[0]).toMatchObject({ state: "suspended", paymentState: "refunded" });
  });

  it("does not let last year's refunded charge block a different fully paid annual invoice", async () => {
    const historical = term({ id: "term_old", sourceInvoiceId: "in_old", sourcePaymentIntentId: "pi_old", sourceChargeId: "ch_old", startsAtMs: Date.parse("2025-01-01T00:00:00Z"), endsAtMs: START, state: "suspended", paymentState: "refunded" });
    const store = memoryDb({ orders: [order({ status: "active", paymentState: "refunded", paymentChargeId: "ch_old" })], terms: [historical] });
    await expect(dispatchHiringEvent(paidEvent())).resolves.toEqual({ handled: true });
    expect(store.state.hiring_terms).toHaveLength(2); expect(store.state.hiring_terms[0]).toEqual(historical);
    expect(store.state.hiring_terms[1]).toMatchObject({ sourceInvoiceId: "in_hiring", paymentState: "active", quota: 100, used: 0 });
    expect(store.state.hiring_orders[0]).toMatchObject({ paymentState: "active", paymentChargeId: "ch_hiring" });
  });
});

describe("real Hiring refund/dispute ordering", () => {
  it.each([
    ["charge.refunded", { refunded: true, amount_refunded: 113000 }, "refunded"],
    ["charge.dispute.created", { disputed: true }, "disputed"],
  ])("durably blocks %s before invoice fulfilment", async (type, chargeChanges, paymentState) => {
    const store = memoryDb(); external.charge.mockResolvedValue(charge(chargeChanges));
    if (type === "charge.dispute.created") external.disputes.mockResolvedValue({ data: [{ id: "dp_hiring", status: "needs_response" }] });
    await expect(dispatchHiringEvent(reversalEvent(type))).resolves.toEqual({ handled: true, reviewRequired: true });
    expect(store.state.hiring_orders[0]).toMatchObject({ status: "pending", paymentState });
    // Even stale clear charge evidence cannot undo the durable pre-fulfilment block.
    external.charge.mockResolvedValue(charge());
    await expect(dispatchHiringEvent(paidEvent())).resolves.toEqual({ handled: true, reviewRequired: true });
    expect(store.state.hiring_terms).toEqual([]);
  });

  it("keeps a pre-fulfilment partial refund reviewable rather than misclassifying it as a terminal full refund", async () => {
    const store = memoryDb(); external.charge.mockResolvedValue(charge({ amount_refunded: 1000 }));
    await dispatchHiringEvent(reversalEvent("charge.refunded", { amount: 113000, amount_refunded: 1000, refunded: false }));
    expect(store.state.hiring_orders[0].paymentState).toBe("needs_review");
    expect(store.state.hiring_terms).toEqual([]);
  });

  it("records a lost dispute before fulfilment as terminal dispute_lost, not a generic open dispute", async () => {
    const store = memoryDb(); external.charge.mockResolvedValue(charge({ disputed: true })); external.disputes.mockResolvedValue({ data: [{ id: "dp_hiring", status: "lost" }] });
    await dispatchHiringEvent(reversalEvent("charge.dispute.closed", { status: "lost" }));
    expect(store.state.hiring_orders[0].paymentState).toBe("dispute_lost");
  });

  it.each([
    ["charge.refunded", { refunded: true, amount_refunded: 113000 }, [], "refunded"],
    ["charge.refunded", { amount_refunded: 1000 }, [], "needs_review"],
    ["charge.dispute.created", { disputed: true }, [{ id: "dp_hiring", status: "needs_response" }], "disputed"],
    ["charge.dispute.closed", { disputed: true }, [{ id: "dp_hiring", status: "lost" }], "dispute_lost"],
  ])("suspends fulfilled term for %s/%s based on live payment evidence", async (type, changes, disputes, paymentState) => {
    const store = memoryDb({ orders: [order({ status: "active" })], terms: [term()] }); external.charge.mockResolvedValue(charge(changes)); external.disputes.mockResolvedValue({ data: disputes });
    await expect(dispatchHiringEvent(reversalEvent(type, { metadata: {} }))).resolves.toEqual({ handled: true });
    expect(store.state.hiring_terms[0]).toMatchObject({ state: "suspended", paymentState, used: 6, quota: 100 });
    expect(store.state.hiring_orders[0].paymentState).toBe(paymentState);
    expect(store.effects.map(effect => effect.table)).toEqual(["hiring_payments", "hiring_terms", "hiring_orders", "hiring_events"]);
    // A late invoice delivery cannot restore quota or access.
    await expect(dispatchHiringEvent(paidEvent())).resolves.toEqual({ handled: true, reviewRequired: true });
    expect(store.state.hiring_terms).toHaveLength(1); expect(store.state.hiring_terms[0].used).toBe(6);
  });

  it.each(["refunded", "dispute_lost"])("never clears terminal %s after stale/won reversal or subscription update", async paymentState => {
    const store = memoryDb({ orders: [order({ status: "active", paymentState })], terms: [term({ state: "suspended", paymentState })] });
    external.disputes.mockResolvedValue({ data: [{ id: "dp_hiring", status: "won" }] });
    await dispatchHiringEvent(reversalEvent("charge.dispute.closed", { status: "won" }));
    await dispatchHiringEvent(event("customer.subscription.updated", subscription()));
    expect(store.state.hiring_terms[0]).toMatchObject({ state: "suspended", paymentState, used: 6 });
    expect(store.state.hiring_orders[0].paymentState).toBe(paymentState);
  });

  it("restores a nonterminal disputed term only on a live won dispute, never on paid replay", async () => {
    const store = memoryDb({ orders: [order({ status: "active", paymentState: "disputed", paymentChargeId: "ch_hiring" })], terms: [term({ state: "suspended", paymentState: "disputed" })], payments: [payment({ paymentState: "disputed", disputeIds: ["dp_hiring"] })] });
    await dispatchHiringEvent(paidEvent()); expect(store.state.hiring_terms[0].state).toBe("suspended");
    external.disputes.mockResolvedValue({ data: [{ id: "dp_hiring", status: "won" }] });
    await expect(dispatchHiringEvent(reversalEvent("charge.dispute.closed", { status: "won" }))).resolves.toEqual({ handled: true });
    expect(store.state.hiring_terms[0]).toMatchObject({ state: "active", paymentState: "active", used: 6, quota: 100 });
  });

  it("ignores a reversal for an unrelated payment with no Hiring metadata", async () => {
    const store = memoryDb();
    // The live charge, not untrusted event fields, drives allocation discovery.
    external.charge.mockResolvedValue(charge({ id: "ch_other", payment_intent: "pi_other", metadata: {} }));
    await expect(dispatchHiringEvent(reversalEvent("charge.refunded", { id: "ch_other", metadata: {}, payment_intent: "pi_other" }))).resolves.toEqual({ handled: false });
    expect(store.effects).toEqual([]);
  });

  it("fulfils the same pending order after a genuine pre-fulfilment dispute win", async () => {
    const store = memoryDb();
    external.charge.mockResolvedValue(charge({ disputed: true })); external.disputes.mockResolvedValue({ data: [{ id: "dp_hiring", status: "needs_response" }] });
    await dispatchHiringEvent(reversalEvent("charge.dispute.created"));
    expect(store.state.hiring_orders[0]).toMatchObject({ status: "pending", paymentState: "disputed" });
    external.charge.mockResolvedValue(charge()); external.disputes.mockResolvedValue({ data: [{ id: "dp_hiring", status: "won" }] });
    await dispatchHiringEvent(reversalEvent("charge.dispute.closed", { status: "won" }));
    await dispatchHiringEvent(paidEvent());
    expect(store.state.hiring_orders[0]).toMatchObject({ id: "order_hiring", status: "active", paymentState: "active" });
    expect(store.state.hiring_terms).toHaveLength(1);
  });

  it("rechecks a term committed after unlocked reversal discovery under order-before-term locks", async () => {
    const store = memoryDb({ beforeTransaction: state => { state.hiring_terms.push(term()); state.hiring_orders[0].status = "active"; } });
    external.charge.mockResolvedValue(charge({ refunded: true, amount_refunded: 113000 }));
    expect(await dispatchHiringEvent(reversalEvent("charge.refunded"))).toMatchObject({ handled: true });
    expect(store.state.hiring_terms[0]).toMatchObject({ state: "suspended", paymentState: "refunded" });
    expect(store.locks.map(lock => lock.table)).toEqual(["hiring_orders", "hiring_payments", "hiring_terms", "hiring_events"]);
  });

  it("does not restore a review-required partial-refund term merely because a later dispute won", async () => {
    const store = memoryDb({ orders: [order({ status: "active", paymentState: "needs_review" })], terms: [term({ state: "suspended", paymentState: "needs_review" })] });
    external.disputes.mockResolvedValue({ data: [{ id: "dp_hiring", status: "won" }] });
    await dispatchHiringEvent(reversalEvent("charge.dispute.closed", { status: "won" }));
    expect(store.state.hiring_terms[0].state).toBe("suspended");
    await dispatchHiringEvent(reversalEvent("charge.dispute.closed", { status: "won" }));
    expect(store.state.hiring_terms[0]).toMatchObject({ state: "suspended", paymentState: "needs_review" });
    expect(store.state.hiring_orders[0].paymentState).toBe("needs_review");
  });

  it("preserves live renewal cancellation when a won dispute restores access", async () => {
    const store = memoryDb({ orders: [order({ status: "active", paymentState: "disputed" })], terms: [term({ state: "suspended", paymentState: "disputed" })], payments: [payment({ paymentState: "disputed", disputeIds: ["dp_hiring"] })] });
    external.subscription.mockResolvedValue(subscription({ cancel_at_period_end: true })); external.disputes.mockResolvedValue({ data: [{ id: "dp_hiring", status: "won" }] });
    await dispatchHiringEvent(reversalEvent("charge.dispute.closed", { status: "won" }));
    expect(store.state.hiring_terms[0]).toMatchObject({ state: "cancel_at_period_end", paymentState: "active" });
  });

  it("finds a metadata-free pre-fulfilment refund via authoritative InvoicePayments rather than charge metadata", async () => {
    const store = memoryDb(); external.invoice.mockResolvedValue(invoice({ metadata }));
    external.charge.mockResolvedValue(charge({ metadata: {}, refunded: true, amount_refunded: 113000 }));
    await expect(dispatchHiringEvent(reversalEvent("charge.refunded", { metadata: {} }))).resolves.toEqual({ handled: true, reviewRequired: true });
    expect(store.state.hiring_orders[0]).toMatchObject({ paymentChargeId: "ch_hiring", paymentState: "refunded", status: "pending" });
    await dispatchHiringEvent(paidEvent()); expect(store.state.hiring_terms).toEqual([]);
  });

  it("does not let a metadata-tagged pre-fulfilment refund cross a customer binding", async () => {
    const store = memoryDb(); external.invoice.mockResolvedValue(invoice({ metadata, customer: "cus_other" }));
    external.charge.mockResolvedValue(charge({ refunded: true, amount_refunded: 113000 }));
    await expect(dispatchHiringEvent(reversalEvent("charge.refunded"))).resolves.toEqual({ handled: true, reviewRequired: true });
    expectReviewOnly(store, "evt_charge.refunded", null);
  });
});

describe("real Hiring transaction failure and locks", () => {
  it.each([
    ["hiring_payments", "insert"],
    ["hiring_terms", "insert"],
    ["hiring_orders", "update"],
    ["hiring_events", "insert"],
    ["hiring_events", "update"],
  ] as const)("rolls back invoice claim/term/order and throws when %s %s fails", async (table, kind) => {
    const store = memoryDb({ fail: { table, kind } }); const before = structuredClone(store.state);
    await expect(dispatchHiringEvent(paidEvent())).rejects.toThrow(`mock ${kind} failed: ${table}`);
    expect(store.state).toEqual(before); expect(store.history.at(-1)).toBe("rollback");
    expect(store.history).toContain("insert:hiring_payments");
  });

  it("rolls back reversal term update if order payment-state persistence fails", async () => {
    const store = memoryDb({ orders: [order({ status: "active" })], terms: [term()], fail: { table: "hiring_orders", kind: "update" } }); const before = structuredClone(store.state);
    external.charge.mockResolvedValue(charge({ refunded: true, amount_refunded: 113000 }));
    await expect(dispatchHiringEvent(reversalEvent("charge.refunded"))).rejects.toThrow("mock update failed: hiring_orders");
    expect(store.history).toContain("update:hiring_terms"); expect(store.state).toEqual(before); expect(store.history.at(-1)).toBe("rollback");
  });

  it("rolls back an existing payment-ledger update and leaves all terms unchanged on persistence failure", async () => {
    const store = memoryDb({ orders: [order({ status: "active" })], terms: [term()], payments: [payment()], fail: { table: "hiring_payments", kind: "update" } });
    const before = structuredClone(store.state);
    external.charge.mockResolvedValue(charge({ refunded: true, amount_refunded: 113000 }));
    await expect(dispatchHiringEvent(paidEvent())).rejects.toThrow("mock update failed: hiring_payments");
    expect(store.state).toEqual(before);
    expect(store.history).not.toContain("update:hiring_terms");
    expect(store.history.at(-1)).toBe("rollback");
  });

  it("rolls back subscription termination if order cancellation persistence fails", async () => {
    const store = memoryDb({ orders: [order({ status: "active" })], terms: [term()], fail: { table: "hiring_orders", kind: "update" } }); const before = structuredClone(store.state);
    await expect(dispatchHiringEvent(event("customer.subscription.deleted", subscription({ status: "canceled" })))).rejects.toThrow("mock update failed: hiring_orders");
    expect(store.state).toEqual(before); expect(store.history.at(-1)).toBe("rollback");
  });

  it("propagates live Stripe failures and leaves paid fulfilment unclaimed for retry", async () => {
    const store = memoryDb(); const before = structuredClone(store.state); external.invoice.mockRejectedValue(new Error("mock Stripe unavailable"));
    await expect(dispatchHiringEvent(paidEvent())).rejects.toThrow("mock Stripe unavailable");
    expect(store.state).toEqual(before); expect(store.history.at(-1)).toBe("rollback");
  });

  it("records a settled invoice after cancellation only as subscription-suspended accounting evidence", async () => {
    const store = memoryDb({ beforeTransaction: state => { state.hiring_orders[0].status = "cancelled"; } });
    external.subscription.mockResolvedValue(subscription({ status: "canceled" }));
    await expect(dispatchHiringEvent(paidEvent())).resolves.toEqual({ handled: true });
    expect(store.state.hiring_orders[0]).toMatchObject({ status: "cancelled", renewalCancelled: true });
    expect(store.state.hiring_terms).toEqual([expect.objectContaining({ state: "subscription_suspended", paymentState: "active", quota: 100, used: 0 })]);
    expect(() => assertHiringGrant(store.state.hiring_terms[0] as any, START + 1)).toThrow(/Active Hiring access/);
  });

  it("honors a live cancel-at-period-end flag during invoice grant creation", async () => {
    const store = memoryDb(); external.subscription.mockResolvedValue(subscription({ cancel_at_period_end: true }));
    await dispatchHiringEvent(paidEvent());
    expect(store.state.hiring_terms[0]).toMatchObject({ state: "cancel_at_period_end", paymentState: "active" });
  });

  it.each(["cancel_at_period_end", "deleted"])("records subscription %s even before any term exists", async path => {
    const store = memoryDb();
    external.subscription.mockResolvedValue(subscription({ cancel_at_period_end: true }));
    await dispatchHiringEvent(event(path === "deleted" ? "customer.subscription.deleted" : "customer.subscription.updated", subscription({ status: path === "deleted" ? "canceled" : "active" })));
    expect(store.state.hiring_orders[0]).toMatchObject({ renewalCancelled: true, status: path === "deleted" ? "cancelled" : "pending" });
    expect(store.state.hiring_terms).toEqual([]);
  });

  it("suspends access on unpaid subscription but retains a live order for verified owner cancellation", async () => {
    const store = memoryDb({ orders: [order({ status: "active" })], terms: [term()] });
    external.subscription.mockResolvedValue(subscription({ status: "unpaid" }));
    await dispatchHiringEvent(event("customer.subscription.updated", subscription({ status: "unpaid" })));
    expect(store.state.hiring_terms[0]).toMatchObject({ state: "subscription_suspended", paymentState: "active", used: 6, quota: 100 });
    expect(store.state.hiring_orders[0]).toMatchObject({ status: "active", renewalCancelled: false });
  });

  it.each(["invoice", "reversal"])("fails closed on incomplete live dispute pagination during %s", async path => {
    const store = memoryDb({ terms: path === "reversal" ? [term()] : [], orders: [order({ status: path === "reversal" ? "active" : "pending" })] });
    external.charge.mockResolvedValue(charge({ disputed: true })); external.disputes.mockResolvedValue({ data: [{ id: "dp_hiring", status: "won" }], has_more: true });
    if (path === "invoice") {
      await expect(dispatchHiringEvent(paidEvent())).resolves.toEqual({ handled: true, reviewRequired: true });
      expect(store.state.hiring_terms).toEqual([]);
    } else {
      await dispatchHiringEvent(reversalEvent("charge.dispute.closed", { status: "won" }));
      expect(store.state.hiring_terms[0]).toMatchObject({ state: "suspended", paymentState: "needs_review" });
    }
  });

  it.each(["invoice", "reversal", "subscription"])("uses order-before-term lock order on %s writes", async path => {
    const store = memoryDb({ orders: [order({ status: "active" })], terms: [term()] });
    if (path === "invoice") await dispatchHiringEvent(paidEvent());
    else if (path === "reversal") await dispatchHiringEvent(reversalEvent("charge.refunded"));
    else await dispatchHiringEvent(event("customer.subscription.updated", subscription({ cancel_at_period_end: true })));
    // Ignore event claim locks: all paths touching both order and term must use
    // the same relative order, otherwise O->T and T->O form a deadlock cycle.
    const relevant = store.locks.filter(lock => ["hiring_orders", "hiring_terms"].includes(lock.table));
    expect(relevant.map(lock => lock.table)).toEqual(["hiring_orders", "hiring_terms"]);
    expect(new Set(relevant.map(lock => lock.transaction)).size).toBe(1);
  });
});

/** These traces deliberately exercise the public dispatcher rather than a second
 * model of it. The memory DB rejects every table outside the four Hiring tables,
 * so an accidental seat/learner/organization write fails every affected test. */
describe("Hiring review regression traces", () => {
  it.each([false, true])("expands PI-backed invoice charge evidence for a full refund with existing term=%s", async existing => {
    const store = memoryDb({ orders: [order({ status: existing ? "active" : "pending" })],
      terms: existing ? [term({ used: 100 })] : [], payments: existing ? [payment()] : [] });
    external.invoice.mockImplementation(async (_id: string, options?: { expand?: string[] }) => invoice({ payments: {
      has_more: false, data: [{ status: "paid", amount_paid: 113000, payment: { type: "payment_intent",
        payment_intent: options?.expand?.includes("payments.data.payment.payment_intent")
          ? { id: "pi_hiring", latest_charge: "ch_hiring" } : "pi_hiring" } }],
    } }));
    external.charge.mockResolvedValue(charge({ refunded: true, amount_refunded: 113000, metadata: {} }));
    await dispatchHiringEvent(reversalEvent("charge.refunded", { metadata: {} }));
    expect(store.state.hiring_payments[0]).toMatchObject({ id: "ch_hiring", paymentState: "refunded" });
    if (existing) expect(store.state.hiring_terms[0]).toMatchObject({ state: "suspended", paymentState: "refunded", used: 100 });
    else expect(store.state.hiring_terms).toEqual([]);
    expect(external.invoice).toHaveBeenCalledWith("in_hiring", { expand: ["payments.data.payment.payment_intent", "payments.data.payment.charge"] });
  });

  it("closes earlier adverse review records when an existing term's recorded dispute is positively resolved", async () => {
    const store = memoryDb();
    await dispatchHiringEvent(paidEvent()); store.state.hiring_terms[0].used = 100;
    external.charge.mockResolvedValue(charge({ disputed: true }));
    external.disputes.mockResolvedValue({ data: [{ id: "dp_hiring", status: "needs_response" }], has_more: false });
    await dispatchHiringEvent(reversalEvent("charge.dispute.created")); await dispatchHiringEvent(paidEvent());
    expect(store.state.hiring_events.some(row => row.state === "review_required")).toBe(true);
    external.charge.mockResolvedValue(charge());
    external.disputes.mockResolvedValue({ data: [{ id: "dp_hiring", status: "won" }], has_more: false });
    await dispatchHiringEvent(reversalEvent("charge.dispute.closed", { status: "won" }));
    expect(store.state.hiring_terms[0]).toMatchObject({ paymentState: "active", state: "active", used: 100 });
    expect(store.state.hiring_events.every(row => row.state === "claimed")).toBe(true);
  });

  it.each([
    ["full refund", { refunded: true, amount_refunded: 113000 }, [], "refunded"],
    ["open dispute", { disputed: true }, [{ id: "dp_hiring", status: "needs_response" }], "disputed"],
  ])("paid replay observes a live %s and suspends an existing term without a reversal event", async (_label, changes, disputes, paymentState) => {
    const store = memoryDb();
    await dispatchHiringEvent(paidEvent());
    store.state.hiring_terms[0].used = 100;
    external.charge.mockResolvedValue(charge(changes));
    external.disputes.mockResolvedValue({ data: disputes, has_more: false });
    // Same event ID still re-reconciles: a durable claim is not a live-state cache.
    await expect(dispatchHiringEvent(paidEvent())).resolves.toEqual({ handled: true, reviewRequired: true });
    expect(store.state.hiring_terms).toHaveLength(1);
    expect(store.state.hiring_terms[0]).toMatchObject({ paymentState, state: "suspended", used: 100, quota: 100 });
    expect(store.state.hiring_payments[0]).toMatchObject({ paymentState });
    expect(store.state.hiring_events).toEqual([expect.objectContaining({ id: "evt_invoice_paid", state: "review_required" })]);
    expect(() => assertHiringGrant(store.state.hiring_terms[0] as any, START + 1)).toThrow(/Active Hiring access/);
  });

  it("cannot erase charge B's pre-term review hold when an older charge A dispute closes", async () => {
    const oldTerm = term({ state: "suspended", paymentState: "disputed" });
    const store = memoryDb({ orders: [order({ status: "active", paymentState: "disputed", paymentChargeId: "ch_hiring" })],
      terms: [oldTerm], payments: [payment({ paymentState: "disputed", disputeIds: ["dp_hiring"] })] });
    const nextInvoice = invoice({ id: "in_next", billing_reason: "subscription_cycle",
      lines: { has_more: false, data: [{ ...invoice().lines.data[0], period: { start: END / 1000, end: Date.parse("2028-01-01T00:00:00Z") / 1000 } }] },
      payments: { has_more: false, data: [{ status: "paid", amount_paid: 113000, payment: { payment_intent: "pi_next", charge: "ch_next" } }] } });
    external.invoice.mockImplementation(async (id: string) => id === "in_next" ? nextInvoice : invoice());
    external.invoicePayments.mockResolvedValue({ data: [{ id: "inpay_next", invoice: "in_next" }], has_more: false });
    external.charge.mockImplementation(async (id: string) => id === "ch_next"
      ? charge({ id: "ch_next", payment_intent: "pi_next", amount_refunded: 1000 }) : charge());
    external.disputes.mockImplementation(async ({ charge: id }: { charge: string }) => ({ data: id === "ch_hiring" ? [{ id: "dp_hiring", status: "won" }] : [], has_more: false }));
    await expect(dispatchHiringEvent(reversalEvent("charge.refunded", { id: "ch_next", payment_intent: "pi_next", metadata: {} }))).resolves.toEqual({ handled: true, reviewRequired: true });
    expect(store.state.hiring_payments.find(row => row.id === "ch_next")).toMatchObject({ invoiceId: "in_next", paymentState: "needs_review" });
    expect(store.state.hiring_terms).toEqual([oldTerm]);
    await expect(dispatchHiringEvent(event("invoice.paid", { id: "in_next", metadata }, "evt_paid_next"))).resolves.toEqual({ handled: true, reviewRequired: true });
    expect(store.state.hiring_orders[0]).toMatchObject({ paymentChargeId: "ch_next", paymentState: "needs_review" });
    await dispatchHiringEvent(reversalEvent("charge.dispute.closed", { status: "won" }));
    expect(store.state.hiring_terms[0]).toMatchObject({ paymentState: "active", used: 6 });
    expect(store.state.hiring_payments.find(row => row.id === "ch_next")).toMatchObject({ paymentState: "needs_review" });
    expect(store.state.hiring_orders[0]).toMatchObject({ paymentChargeId: "ch_next", paymentState: "needs_review" });
    // Even stale clear live evidence on B cannot override B's durable hold.
    external.charge.mockImplementation(async (id: string) => charge(id === "ch_next" ? { id, payment_intent: "pi_next" } : {}));
    await expect(dispatchHiringEvent(event("invoice.paid", { id: "in_next", metadata }, "evt_paid_next"))).resolves.toEqual({ handled: true, reviewRequired: true });
    expect(store.state.hiring_terms).toHaveLength(1);
    expect(store.state.hiring_payments.find(row => row.id === "ch_next")).toMatchObject({ paymentState: "needs_review" });
    expect(store.state.hiring_events.find(row => row.id === "evt_paid_next")).toMatchObject({ state: "review_required", invoiceId: "in_next" });
  });

  it.each([
    { label: "empty live list", known: ["dp_hiring"], live: [], incomplete: false, type: "charge.dispute.closed", expected: "disputed" },
    { label: "one known ID absent", known: ["dp_hiring", "dp_second"], live: [{ id: "dp_hiring", status: "won" }], incomplete: false, type: "charge.dispute.closed", expected: "disputed" },
    { label: "unrelated win", known: ["dp_hiring"], live: [{ id: "dp_other", status: "won" }], incomplete: false, type: "charge.dispute.closed", expected: "disputed" },
    { label: "one known ID still open", known: ["dp_hiring", "dp_second"], live: [{ id: "dp_hiring", status: "won" }, { id: "dp_second", status: "needs_response" }], incomplete: false, type: "charge.dispute.closed", expected: "disputed" },
    { label: "incomplete win listing", known: ["dp_hiring"], live: [{ id: "dp_hiring", status: "won" }], incomplete: true, type: "charge.dispute.closed", expected: "needs_review" },
    { label: "no previously known dispute ID", known: [], live: [{ id: "dp_hiring", status: "won" }], incomplete: false, type: "charge.dispute.closed", expected: "disputed" },
    { label: "paid event despite all known wins", known: ["dp_hiring", "dp_second"], live: [{ id: "dp_hiring", status: "won" }, { id: "dp_second", status: "won" }], incomplete: false, type: "invoice.paid", expected: "disputed" },
    { label: "closed with every known ID won", known: ["dp_hiring", "dp_second"], live: [{ id: "dp_second", status: "won" }, { id: "dp_hiring", status: "won" }], incomplete: false, type: "charge.dispute.closed", expected: "active" },
    { label: "closed with known warning closure", known: ["dp_hiring", "dp_second"], live: [{ id: "dp_hiring", status: "won" }, { id: "dp_second", status: "warning_closed" }], incomplete: false, type: "charge.dispute.closed", expected: "active" },
  ])("dispute recovery requires positive closed-event proof: $label", async ({ known, live, incomplete, type, expected }) => {
    const store = memoryDb({ orders: [order({ status: "active", paymentState: "disputed", paymentChargeId: "ch_hiring" })],
      terms: [term({ state: "suspended", paymentState: "disputed", used: 100 })],
      payments: [payment({ paymentState: "disputed", disputeIds: known })] });
    external.disputes.mockResolvedValue({ data: live, has_more: incomplete });
    await dispatchHiringEvent(type === "invoice.paid" ? paidEvent() : reversalEvent(type, { status: "won" }));
    expect(store.state.hiring_terms).toHaveLength(1);
    expect(store.state.hiring_terms[0]).toMatchObject({ state: expected === "active" ? "active" : "suspended", paymentState: expected, used: 100, quota: 100 });
    expect(store.state.hiring_payments[0]).toMatchObject({ paymentState: expected });
    expect(store.state.hiring_payments[0].disputeIds).toEqual([...new Set([...known, ...live.map(row => row.id)])].sort());
    if (expected !== "active") expect(() => assertHiringGrant(store.state.hiring_terms[0] as any, START + 1)).toThrow(/Active Hiring access/);
    else expect(() => assertHiringGrant(store.state.hiring_terms[0] as any, START + 1, true)).toThrow(/fully used/);
  });

  it("open -> paid -> won creates one term automatically without another paid event", async () => {
    const store = memoryDb({ orders: [order({ stripeSubscriptionId: null })] });
    external.charge.mockResolvedValue(charge({ disputed: true }));
    external.disputes.mockResolvedValue({ data: [{ id: "dp_hiring", status: "needs_response" }], has_more: false });
    await dispatchHiringEvent(reversalEvent("charge.dispute.created", { metadata: {} }));
    expect(store.state.hiring_orders[0]).toMatchObject({ stripeSubscriptionId: "sub_hiring", status: "pending", paymentState: "disputed" });
    await dispatchHiringEvent(paidEvent());
    expect(store.state.hiring_terms).toEqual([]);
    expect(store.state.hiring_events.filter(row => row.state === "review_required")).toHaveLength(2);
    external.charge.mockResolvedValue(charge());
    external.disputes.mockResolvedValue({ data: [{ id: "dp_hiring", status: "won" }], has_more: false });
    await expect(dispatchHiringEvent(reversalEvent("charge.dispute.closed", { status: "won", metadata: {} }))).resolves.toEqual({ handled: true });
    expect(store.state.hiring_terms).toEqual([expect.objectContaining({ sourceInvoiceId: "in_hiring", paymentState: "active", state: "active", quota: 100, used: 0 })]);
    expect(store.state.hiring_orders[0]).toMatchObject({ status: "active", paymentState: "active" });
    expect(store.state.hiring_events.every(row => row.state === "claimed")).toBe(true);
    expect(store.state.hiring_events.some(row => row.id === "reconcile:evt_charge.dispute.closed")).toBe(true);
    // Repeated closure is harmless and cannot allocate another term or quota.
    store.state.hiring_terms[0].used = 100;
    await dispatchHiringEvent(reversalEvent("charge.dispute.closed", { status: "won", metadata: {} }));
    expect(store.state.hiring_terms).toHaveLength(1);
    expect(store.state.hiring_terms[0]).toMatchObject({ used: 100, quota: 100 });
    expect(store.effects.filter(effect => effect.table === "hiring_terms" && effect.kind === "insert")).toHaveLength(1);
  });

  it.each([false, true])("partial -> full refund strengthens the durable hold with existing term=%s", async existing => {
    const store = memoryDb({ terms: existing ? [term()] : [], orders: [order({ status: existing ? "active" : "pending" })] });
    external.charge.mockResolvedValue(charge({ amount_refunded: 1000 }));
    await dispatchHiringEvent(reversalEvent("charge.refunded"));
    expect(store.state.hiring_payments[0].paymentState).toBe("needs_review");
    external.charge.mockResolvedValue(charge({ refunded: true, amount_refunded: 113000 }));
    await dispatchHiringEvent(reversalEvent("charge.refunded"));
    expect(store.state.hiring_payments[0].paymentState).toBe("refunded");
    expect(store.state.hiring_orders[0].paymentState).toBe("refunded");
    external.charge.mockResolvedValue(charge());
    await dispatchHiringEvent(paidEvent());
    expect(store.state.hiring_payments[0].paymentState).toBe("refunded");
    expect(store.state.hiring_terms).toHaveLength(existing ? 1 : 0);
    if (existing) expect(store.state.hiring_terms[0]).toMatchObject({ paymentState: "refunded", state: "suspended", used: 6, quota: 100 });
  });

  it("subscription deletion suspends current and future terms without poisoning their active payments", async () => {
    const future = term({ id: "term_future", sourceInvoiceId: "in_future", sourceChargeId: "ch_future", sourcePaymentIntentId: "pi_future", startsAtMs: END, endsAtMs: Date.parse("2028-01-01T00:00:00Z"), used: 0 });
    const held = term({ id: "term_refunded", sourceInvoiceId: "in_refunded", sourceChargeId: "ch_refunded", state: "suspended", paymentState: "refunded" });
    const store = memoryDb({ orders: [order({ status: "active" })], terms: [term({ used: 100 }), future, held] });
    await dispatchHiringEvent(event("customer.subscription.deleted", subscription({ status: "canceled" })));
    expect(store.state.hiring_orders[0]).toMatchObject({ status: "cancelled", renewalCancelled: true });
    expect(store.state.hiring_terms.slice(0, 2)).toEqual([
      expect.objectContaining({ id: "term_hiring", state: "subscription_suspended", paymentState: "active", used: 100, quota: 100 }),
      expect.objectContaining({ id: "term_future", state: "subscription_suspended", paymentState: "active", used: 0, quota: 100 }),
    ]);
    expect(store.state.hiring_terms[2]).toEqual(held);
    for (const row of store.state.hiring_terms.slice(0, 2)) expect(() => assertHiringGrant(row as any, row.startsAtMs + 1)).toThrow(/Active Hiring access/);
  });

  it.each(["paid-before-update", "update-before-paid"])("unpaid -> active via %s preserves exhausted usage and separates subscription/payment holds", async ordering => {
    const store = memoryDb({ orders: [order({ status: "active" })], terms: [term({ used: 100 })] });
    for (const status of ["unpaid", "active"]) {
      external.subscription.mockResolvedValue(subscription({ status }));
      const update = () => dispatchHiringEvent(event("customer.subscription.updated", subscription({ status }), `evt_update_${status}`));
      const paid = () => dispatchHiringEvent(paidEvent(`evt_paid_${status}`));
      if (ordering === "paid-before-update") { await paid(); await update(); }
      else { await update(); await paid(); }
      expect(store.state.hiring_terms).toHaveLength(1);
      expect(store.state.hiring_terms[0]).toMatchObject({ state: status === "unpaid" ? "subscription_suspended" : "active", paymentState: "active", used: 100, quota: 100 });
      expect(store.state.hiring_orders[0]).toMatchObject({ status: "active", paymentState: "active" });
      expect(() => assertHiringGrant(store.state.hiring_terms[0] as any, START + 1, true)).toThrow(status === "unpaid" ? /Active Hiring access/ : /fully used/);
    }
    expect(store.effects.filter(effect => effect.table === "hiring_terms" && effect.kind === "insert")).toEqual([]);
  });

  it("classifies every legacy non-Hiring multi-invoice allocation before returning handled:false", async () => {
    const store = memoryDb();
    external.invoicePayments.mockImplementation(async ({ starting_after }: { starting_after?: string }) => starting_after
      ? { data: [{ id: "inpay_two", invoice: { id: "in_legacy_two" } }], has_more: false }
      : { data: [{ id: "inpay_one", invoice: "in_legacy_one" }], has_more: true });
    external.invoice.mockImplementation(async (id: string) => ({ id, customer: "cus_hiring", metadata: { type: "course_pass" } }));
    await expect(dispatchHiringEvent(reversalEvent("charge.refunded", { metadata: {} }))).resolves.toEqual({ handled: false });
    expect(external.invoice).toHaveBeenCalledWith("in_legacy_one", expect.objectContaining({ expand: expect.any(Array) }));
    expect(external.invoice).toHaveBeenCalledWith("in_legacy_two", expect.objectContaining({ expand: expect.any(Array) }));
    expect(external.invoicePayments.mock.calls[1][0]).toMatchObject({ starting_after: "inpay_one" });
    expect(store.effects).toEqual([]);
  });

  it.each([
    { label: "unknown allocation cannot be fetched", data: [{ id: "inpay_unknown", invoice: "in_unknown" }], more: false, retrieveFails: true },
    { label: "incomplete page cannot advance", data: [{ invoice: "in_legacy_one" }], more: true, retrieveFails: false },
    { label: "empty incomplete page", data: [], more: true, retrieveFails: false },
    { label: "allocation omits invoice ownership", data: [{ id: "inpay_unknown", invoice: null }], more: false, retrieveFails: false },
  ])("unknown legacy/Hiring reversal ownership throws for retry, never ACKs: $label", async ({ data, more, retrieveFails }) => {
    const store = memoryDb();
    external.invoicePayments.mockResolvedValue({ data, has_more: more });
    if (retrieveFails) external.invoice.mockRejectedValue(new Error("mock unknown invoice unavailable"));
    else external.invoice.mockResolvedValue({ id: "in_legacy_one", metadata: { type: "course_pass" } });
    await expect(dispatchHiringEvent(reversalEvent("charge.refunded", { metadata: {} }))).rejects.toThrow();
    expect(store.effects).toEqual([]);
    expect(store.state.hiring_events).toEqual([]);
  });

  it("mixed legacy/Hiring allocations throw instead of claiming ownership", async () => {
    const store = memoryDb();
    external.invoicePayments.mockResolvedValue({ data: [{ id: "inpay_one", invoice: "in_hiring" }, { id: "inpay_two", invoice: "in_legacy" }], has_more: false });
    external.invoice.mockImplementation(async (id: string) => id === "in_hiring" ? invoice() : { id, metadata: { type: "course_pass" } });
    await expect(dispatchHiringEvent(reversalEvent("charge.refunded", { metadata: {} }))).rejects.toThrow(/Ambiguous/);
    expect(store.effects).toEqual([]);
  });

  it.each(["charge.refunded", "charge.dispute.created"])("a verified pre-term %s binds the subscription for owner cancellation", async type => {
    const store = memoryDb({ orders: [order({ stripeSubscriptionId: null })] });
    external.charge.mockResolvedValue(charge(type === "charge.refunded" ? { refunded: true, amount_refunded: 113000 } : { disputed: true }));
    external.disputes.mockResolvedValue({ data: type === "charge.dispute.created" ? [{ id: "dp_hiring", status: "needs_response" }] : [] });
    await dispatchHiringEvent(reversalEvent(type, { metadata: {} }));
    expect(store.state.hiring_orders[0]).toMatchObject({ stripeSubscriptionId: "sub_hiring", status: "pending" });
    expect(store.state.hiring_terms).toEqual([]);
    const storedOrder = store.state.hiring_orders[0];
    expect(() => validateHiringCancellationSubscription(subscription(), { id: storedOrder.id, orgId: storedOrder.orgId, customerId: storedOrder.stripeCustomerId, subscriptionId: storedOrder.stripeSubscriptionId })).not.toThrow();
  });

  it.each(["webhook-before-http-binding", "http-binding-before-webhook"])("checkout expiration releases an unbound reservation: %s", async ordering => {
    const store = memoryDb({ orders: [order({ stripeSubscriptionId: null, stripeCheckoutSessionId: ordering === "http-binding-before-webhook" ? "cs_hiring" : null })] });
    await expect(dispatchHiringEvent(event("checkout.session.expired", checkout()))).resolves.toEqual({ handled: true });
    expect(external.checkout).toHaveBeenCalledWith("cs_hiring");
    expect(store.state.hiring_orders[0]).toMatchObject({ stripeCheckoutSessionId: "cs_hiring", stripeSubscriptionId: null, status: "checkout_expired" });
    // These two initial states cover delivery before/after the HTTP session-ID
    // write. Actual HTTP writer atomicity belongs to the service behavior suite.
    expect(store.state.hiring_terms).toEqual([]);
    expect(store.state.hiring_payments).toEqual([]);
  });

  it.each([
    ["checkout.session.async_payment_failed", null],
    ["checkout.session.async_payment_failed", "sub_hiring"],
    ["checkout.session.expired", null],
    ["checkout.session.expired", "sub_hiring"],
  ])("%s with bound subscription %s retains the reservation and owner cancellation", async (type, boundSubscriptionId) => {
    const store = memoryDb({ orders: [order({ stripeSubscriptionId: boundSubscriptionId, stripeCheckoutSessionId: null })] });
    const live = checkout({ subscription: "sub_hiring", status: type === "checkout.session.expired" ? "expired" : "complete" });
    external.checkout.mockResolvedValue(live);
    await expect(dispatchHiringEvent(event(type, live))).resolves.toEqual({ handled: true, reviewRequired: true });
    expect(store.state.hiring_orders[0]).toMatchObject({ status: "pending", stripeSubscriptionId: "sub_hiring", stripeCheckoutSessionId: "cs_hiring" });
    expect(store.state.hiring_events[0]).toMatchObject({ state: "review_required", eventType: type });
    expect(store.state.hiring_terms).toEqual([]);
    expect(() => validateHiringCancellationSubscription(subscription(), { id: "order_hiring", orgId: 7, customerId: "cus_hiring", subscriptionId: store.state.hiring_orders[0].stripeSubscriptionId })).not.toThrow();
  });

  it("does not trust a stale expired event when live checkout has acquired a subscription", async () => {
    const store = memoryDb({ orders: [order({ stripeSubscriptionId: null })] });
    external.checkout.mockResolvedValue(checkout({ status: "complete", subscription: "sub_hiring" }));
    await dispatchHiringEvent(event("checkout.session.expired", checkout()));
    expect(store.state.hiring_orders[0]).toMatchObject({ status: "pending", stripeSubscriptionId: "sub_hiring" });
    expect(store.state.hiring_terms).toEqual([]);
  });

  it.each(["invoice.paid", "checkout.session.completed", "customer.subscription.updated"])("recognizes hiring_type metadata alias on %s dispatch", async type => {
    const { type: _type, ...rest } = metadata;
    const alias = { ...rest, hiring_type: HIRING_TYPE };
    const store = memoryDb();
    const object = type === "invoice.paid" ? { id: "in_hiring", metadata: alias }
      : type === "checkout.session.completed" ? checkout({ subscription: "sub_hiring", status: "complete", metadata: alias })
      : subscription({ metadata: alias });
    await expect(dispatchHiringEvent(event(type, object, "evt_alias"))).resolves.toEqual({ handled: true });
    if (type === "invoice.paid") expect(store.state.hiring_terms).toHaveLength(1);
    else expect(store.state.hiring_terms).toEqual([]);
  });
});
