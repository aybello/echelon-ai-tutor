const mockProvisionIndividual = vi.hoisted(() => vi.fn());
vi.mock("./provisionIndividualSubscription", () => ({ provisionIndividualSubscription: mockProvisionIndividual }));
const mockRecordPurchase = vi.hoisted(() => vi.fn());
vi.mock("../purchaseEmailOutbox", () => ({ recordPurchaseWithConfirmation: mockRecordPurchase }));
// Handler unit fixtures do not emulate database locking. The dedicated payment
// integration suite invokes this boundary against an isolated loopback database.
vi.mock("./paymentState", () => ({
  withPaymentState: (_db: unknown, _pi: string, work: (tx: unknown, state: string) => unknown) => work(_db, "clear"),
  revokePaymentState: vi.fn(), revokeIndividualPurchases: vi.fn(), processIndividualDispute: vi.fn(),
}));
const mockNotifyOwner = vi.hoisted(() => vi.fn());
const mockTrackEvent = vi.hoisted(() => vi.fn());
/**
 * webhook.handler.test.ts
 *
 * Tests the registered Express webhook handler directly — no network server needed.
 * Verifies:
 *  1. Org subscription provisioning is delegated to provisionOrgFromWebhook
 *  2. Invoice-before-org returns HTTP 503 (Stripe retries)
 */

import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Request, Response } from "express";
import { getTableName, type SQL } from "drizzle-orm";
import { MySqlDialect } from "drizzle-orm/mysql-core";
import { hiringOrders, purchases } from "../../drizzle/schema";
import * as email from "../email";

const {
  mockConstructEvent,
  mockRetrieveSubscription,
  mockRetrievePaymentIntent,
  mockProvisionOrg,
  mockProcessOrgInvoice,
  mockGetDb,
  mockFlexFullRefund,
  mockFlexPartialRefund,
  mockFlexUnallocatedRefund,
  mockFlexDisputeCreated,
  mockFlexDisputeClosed,
  mockInvoiceAllocations,
  mockReversalInvoice,
  mockReversalCharge,
  mockListDisputes,
  mockRetrieveCheckout,
} = vi.hoisted(() => ({
  mockConstructEvent: vi.fn(),
  mockRetrieveSubscription: vi.fn(),
  mockRetrievePaymentIntent: vi.fn(),
  mockProvisionOrg: vi.fn(),
  mockProcessOrgInvoice: vi.fn(),
  mockGetDb: vi.fn(),
  mockFlexFullRefund: vi.fn(),
  mockFlexPartialRefund: vi.fn(),
  mockFlexUnallocatedRefund: vi.fn(),
  mockFlexDisputeCreated: vi.fn(),
  mockFlexDisputeClosed: vi.fn(),
  mockInvoiceAllocations: vi.fn(),
  mockReversalInvoice: vi.fn(),
  mockReversalCharge: vi.fn(),
  mockListDisputes: vi.fn(),
  mockRetrieveCheckout: vi.fn(),
}));

vi.mock("./stripe", () => ({
  stripe: {
    webhooks: {
      constructEvent: mockConstructEvent,
    },
    subscriptions: {
      retrieve: mockRetrieveSubscription,
    },
    checkout: { sessions: { retrieve: mockRetrieveCheckout } },
    invoicePayments: { list: mockInvoiceAllocations },
    invoices: { retrieve: mockReversalInvoice },
    charges: { retrieve: mockReversalCharge },
    disputes: {
      retrieve: vi.fn(async (id: string) => ({ id, status: "needs_response" })),
      list: mockListDisputes,
    },
    paymentIntents: {
      retrieve: mockRetrievePaymentIntent,
    },
  },
}));

vi.mock("../db", () => ({
  // Wrap the actual imported getDb boundary, not just selected fixture setters.
  getDb: async () => withEmptyHiringTables(await mockGetDb()),
}));

vi.mock("./provisionOrg", () => ({
  provisionOrgFromWebhook: mockProvisionOrg,
}));

vi.mock("../teams/flexRefundDisputeHandlers", () => ({
  flexDisputeOutcome: (status: string | null | undefined) =>
    status === "won" || status === "warning_closed" ? "won" : status === "lost" ? "lost" : null,
  handleFlexFullRefund: mockFlexFullRefund,
  handleFlexPartialRefund: mockFlexPartialRefund,
  handleFlexUnallocatedRefund: mockFlexUnallocatedRefund,
  handleFlexDisputeCreated: mockFlexDisputeCreated,
  handleFlexDisputeClosed: mockFlexDisputeClosed,
}));

vi.mock("./processOrgInvoice", async () => {
  const actual = await vi.importActual<typeof import("./processOrgInvoice")>(
    "./processOrgInvoice",
  );
  return {
    ...actual,
    processOrgInvoice: mockProcessOrgInvoice,
  };
});

vi.mock("../_core/notification", () => ({
  notifyOwner: mockNotifyOwner,
}));

vi.mock("../analytics", () => ({
  trackEvent: mockTrackEvent,
}));

vi.mock("../email", async () => {
  const actual = await vi.importActual<typeof import("../email")>("../email");
  return {
    ...actual,
    sendManagerOnboardingEmail: vi.fn().mockResolvedValue(undefined),
    sendOrgPaymentConfirmationEmail: vi.fn().mockResolvedValue(undefined),
    sendTeamEnrollmentEmail: vi.fn().mockResolvedValue(undefined),
    sendWelcomeOnboardingEmail: vi.fn().mockResolvedValue(undefined),
    sendPurchaseConfirmationEmail: vi.fn().mockResolvedValue(undefined),
    sendSubscriptionConfirmationEmail: vi.fn().mockResolvedValue(undefined),
    sendSubscriptionRenewalEmail: vi.fn().mockResolvedValue(undefined),
  };
});

import { parseRefundLicenceIds, registerStripeWebhook } from "./webhook";
import {
  INDIVIDUAL_EXAM_PASS_ENTITLEMENT_TYPE,
  INDIVIDUAL_EXAM_PASS_POLICY_VERSION,
} from "./individualExamPass";
import { HIRING_AMOUNT, HIRING_POLICY, HIRING_TYPE } from "../hiring/policy";

type WebhookHandler = (req: Request, res: Response) => Promise<unknown>;

const HIRING_READ_OPTIONS = { timeout: 5_000, maxNetworkRetries: 0 };
const HIRING_INVOICE_EXPAND = { expand: ["payments.data.payment.payment_intent", "payments.data.payment.charge"] };
const hiringTableNames = new Set(["hiring_orders", "hiring_terms", "hiring_payments", "hiring_events"]);
const richerHiringDatabases = new WeakSet<object>();

/** Delay legacy select() until from(table) identifies its namespace. Merely
 * classifying an event must not consume a legacy mockResolvedValueOnce sequence.
 * Only empty Hiring reads are supplied: all writes/transactions remain the real
 * fixture's methods, so accidental legacy writes cannot disappear in this shim. */
function withEmptyHiringTables(database: any): any {
  if (!database || richerHiringDatabases.has(database)) return database;
  return new Proxy(database, {
    get(target, property, receiver) {
      if (property !== "select") return Reflect.get(target, property, receiver);
      return (...selection: unknown[]) => ({
        from(table: any) {
          if (!hiringTableNames.has(getTableName(table))) return target.select(...selection).from(table);
          const empty: any = {
            where: () => empty,
            limit: () => empty,
            orderBy: () => empty,
            for: () => empty,
            then: (resolve: any, reject: any) => Promise.resolve([]).then(resolve, reject),
          };
          return empty;
        },
      });
    },
  });
}

function captureWebhookHandler(): WebhookHandler {
  let handler: WebhookHandler | undefined;

  const app = {
    post: vi.fn((
      _path: string,
      _rawMiddleware: unknown,
      routeHandler: WebhookHandler,
    ) => {
      handler = routeHandler;
    }),
  };

  registerStripeWebhook(app as any);

  if (!handler) {
    throw new Error("Stripe webhook handler was not registered");
  }

  return handler;
}

function makeResponse() {
  const response: any = {
    statusCode: 200,
    body: undefined,
    status: vi.fn((code: number) => {
      response.statusCode = code;
      return response;
    }),
    json: vi.fn((body: unknown) => {
      response.body = body;
      return response;
    }),
    send: vi.fn((body: unknown) => {
      response.body = body;
      return response;
    }),
  };
  return response;
}

function makeRequest(): Request {
  return {
    body: Buffer.from("{}"),
    headers: {
      "stripe-signature": "test_signature",
    },
  } as unknown as Request;
}

function dbWithNoOrganization() {
  return {
    select: vi.fn(() => ({
      from: vi.fn(() => ({
        where: vi.fn(() => ({
          limit: vi.fn(() => ({ for: vi.fn().mockResolvedValue([]) })),
        })),
      })),
    })),
  };
}

function dbWithPurchaseLookupSequence(...rows: Array<Array<{ id: number }>>) {
  const lock = vi.fn();
  for (const result of rows) lock.mockResolvedValueOnce(result);
  const limit = vi.fn(() => ({ for: lock }));
  return {
    select: vi.fn(() => ({
      from: vi.fn(() => ({
        where: vi.fn(() => ({ limit })),
      })),
    })),
  };
}

type HiringRow = Record<string, any>;
const HIRING_START = Date.parse("2026-01-01T00:00:00Z");
const HIRING_END = Date.parse("2027-01-01T00:00:00Z");
const hiringMetadata = { type: HIRING_TYPE, policy: HIRING_POLICY, orderId: "order_hiring", orgId: "7" };
const hiringOrder = (changes: HiringRow = {}) => ({
  id: "order_hiring", orgId: 7, stripeSubscriptionId: "sub_hiring", stripeCheckoutSessionId: "cs_hiring",
  stripeCustomerId: "cus_hiring", ownerEmail: "owner@example.test", amountCents: HIRING_AMOUNT,
  currency: "cad", status: "active", paymentState: "active", renewalCancelled: false, ...changes,
});
const hiringTerm = (changes: HiringRow = {}) => ({
  id: "term_hiring", orgId: 7, basis: "stripe", sourceInvoiceId: "in_hiring", sourceSubscriptionId: "sub_hiring",
  sourcePaymentIntentId: "pi_hiring", sourceChargeId: "ch_hiring", startsAtMs: HIRING_START, endsAtMs: HIRING_END,
  quota: 100, used: 6, state: "active", paymentState: "active", createdByEmail: "owner@example.test", ...changes,
});
const hiringSubscription = (changes: HiringRow = {}) => ({
  id: "sub_hiring", customer: "cus_hiring", status: "active", cancel_at_period_end: false, metadata: hiringMetadata,
  collection_method: "charge_automatically", items: { has_more: false, data: [{ quantity: 1, price: {
    id: "price_hiring", currency: "cad", unit_amount: HIRING_AMOUNT, type: "recurring",
    recurring: { interval: "year", interval_count: 1, usage_type: "licensed" }, tax_behavior: "exclusive",
    billing_scheme: "per_unit", product: { id: "prod_hiring", metadata: { type: HIRING_TYPE, policy: HIRING_POLICY } },
  } }] }, ...changes,
});
const hiringInvoice = (changes: HiringRow = {}) => ({
  id: "in_hiring", metadata: {}, subscription: "sub_hiring", customer: "cus_hiring", currency: "cad",
  status: "paid", paid: true, collection_method: "charge_automatically", billing_reason: "subscription_cycle",
  subtotal: HIRING_AMOUNT, total: 113_000, amount_paid: 113_000, amount_remaining: 0,
  lines: { has_more: false, data: [{ type: "subscription", proration: false, quantity: 1, amount: HIRING_AMOUNT,
    currency: "cad", price: "price_hiring", period: { start: HIRING_START / 1000, end: HIRING_END / 1000 } }] },
  payments: { has_more: false, data: [{ status: "paid", amount_paid: 113_000,
    payment: { payment_intent: { id: "pi_hiring", latest_charge: { id: "ch_hiring" } }, charge: { id: "ch_hiring" } } }] },
  ...changes,
});
const hiringCharge = (changes: HiringRow = {}) => ({
  id: "ch_hiring", payment_intent: "pi_hiring", status: "succeeded", paid: true, captured: true, currency: "cad",
  customer: "cus_hiring", amount: 113_000, amount_captured: 113_000, refunded: false, amount_refunded: 0,
  disputed: false, metadata: {}, ...changes,
});

/** Execute real Drizzle equality/AND predicates; no hard-coded query sequence.
 * Every non-Hiring read/write is recorded and rejected, so a caught legacy error
 * cannot make an isolation assertion pass. This is not a MySQL locking test. */
function hiringDatabase(options: { orders?: HiringRow[]; terms?: HiringRow[]; payments?: HiringRow[] } = {}) {
  const dialect = new MySqlDialect();
  const state: Record<string, HiringRow[]> = {
    hiring_orders: structuredClone(options.orders ?? [hiringOrder()]),
    hiring_terms: structuredClone(options.terms ?? []),
    hiring_payments: structuredClone(options.payments ?? []), hiring_events: [],
  };
  const legacyAccess: string[] = [];
  const writes: { table: string; kind: string; ids: string[]; values: HiringRow }[] = [];
  function rowsFor(table: any) {
    const name = getTableName(table);
    if (!hiringTableNames.has(name)) {
      legacyAccess.push(name);
      throw new Error(`Forbidden legacy table access: ${name}`);
    }
    return state[name];
  }
  function matches(predicate: SQL | undefined, row: HiringRow) {
    if (!predicate) return true;
    const query = dialect.sqlToQuery(predicate);
    let index = 0;
    const expression = query.sql.replace(/`[^`]+`\.`([^`]+)`\s*=\s*\?/g,
      (_match, column: string) => String(row[column] === query.params[index++]));
    if (index !== query.params.length || /[^()\s]/.test(expression.replace(/true|false|and/g, ""))) {
      throw new Error(`Unsupported Hiring fixture predicate: ${query.sql}`);
    }
    return !expression.includes("false");
  }
  const database = {
    select: vi.fn(() => ({ from(table: any) {
      rowsFor(table);
      let predicate: SQL | undefined, limit = Infinity;
      const query: any = {
        where: (condition: SQL) => { predicate = condition; return query; },
        limit: (count: number) => { limit = count; return query; },
        orderBy: () => query,
        for: (mode: string) => { expect(mode).toBe("update"); return query; },
        then: (resolve: any, reject: any) => Promise.resolve().then(() =>
          structuredClone(rowsFor(table).filter(row => matches(predicate, row)).slice(0, limit))).then(resolve, reject),
      };
      return query;
    } })),
    insert: vi.fn((table: any) => {
      const rows = rowsFor(table);
      return { values: async (values: HiringRow) => {
        if (rows.some(row => row.id === values.id)) throw new Error("Duplicate Hiring fixture ID");
        writes.push({ table: getTableName(table), kind: "insert", ids: [values.id], values: structuredClone(values) });
        rows.push(structuredClone(values));
      } };
    }),
    update: vi.fn((table: any) => {
      const rows = rowsFor(table);
      return { set: (values: HiringRow) => ({ where: async (predicate: SQL) => {
        const matching = rows.filter(row => matches(predicate, row));
        writes.push({ table: getTableName(table), kind: "update", ids: matching.map(row => row.id), values: structuredClone(values) });
        matching.forEach(row => Object.assign(row, values));
      } }) };
    }),
    transaction: vi.fn(async (work: (tx: any) => Promise<unknown>) => {
      const snapshot = structuredClone(state);
      try { return await work(database); }
      catch (error) { Object.assign(state, snapshot); throw error; }
    }),
  };
  richerHiringDatabases.add(database);
  mockGetDb.mockResolvedValue(database);
  return { database, state, writes, legacyAccess };
}

function expectHiringIsolation(store: ReturnType<typeof hiringDatabase>) {
  expect(store.legacyAccess).toEqual([]);
  expect(mockProvisionIndividual).not.toHaveBeenCalled();
  expect(mockProvisionOrg).not.toHaveBeenCalled();
  expect(mockProcessOrgInvoice).not.toHaveBeenCalled();
  expect(mockRecordPurchase).not.toHaveBeenCalled();
  expect(mockRetrievePaymentIntent).not.toHaveBeenCalled();
  expect(mockNotifyOwner).not.toHaveBeenCalled();
  expect(mockTrackEvent).not.toHaveBeenCalled();
  expect(mockFlexFullRefund).not.toHaveBeenCalled();
  expect(mockFlexPartialRefund).not.toHaveBeenCalled();
  expect(mockFlexUnallocatedRefund).not.toHaveBeenCalled();
  expect(mockFlexDisputeCreated).not.toHaveBeenCalled();
  expect(mockFlexDisputeClosed).not.toHaveBeenCalled();
  for (const [name, send] of Object.entries(email)) {
    if (name.startsWith("send") && vi.isMockFunction(send)) expect(send, name).not.toHaveBeenCalled();
  }
}

beforeEach(() => {
  vi.clearAllMocks();
  mockRecordPurchase.mockReset().mockResolvedValue(undefined);
  process.env.STRIPE_WEBHOOK_SECRET = "whsec_test";
  mockFlexFullRefund.mockResolvedValue(false);
  mockFlexPartialRefund.mockResolvedValue(false);
  mockFlexUnallocatedRefund.mockResolvedValue(false);
  mockFlexDisputeCreated.mockResolvedValue({ handled: false });
  mockFlexDisputeClosed.mockResolvedValue(false);
  mockInvoiceAllocations.mockReset().mockResolvedValue({ data: [], has_more: false });
  mockReversalInvoice.mockReset().mockImplementation(async (id: string) => ({ id, metadata: {}, customer: "cus_flex" }));
  mockReversalCharge.mockReset().mockImplementation(async (id: string) => ({ id, payment_intent: "pi_flex", customer: "cus_flex", metadata: {} }));
  mockListDisputes.mockReset().mockResolvedValue({ data: [], has_more: false });
  mockRetrieveSubscription.mockReset().mockResolvedValue({ metadata: {} });
  // Synthetic authoritative transport returns this test's Checkout resource.
  // Classification still runs before any legacy table or writer is touched.
  mockRetrieveCheckout.mockReset().mockImplementation(async (id: string) => {
    const session = mockConstructEvent.mock.results.at(-1)?.value?.data?.object;
    if (!session || session.id !== id) throw new Error("Missing synthetic authoritative Checkout fixture");
    return structuredClone(session);
  });
  mockRetrievePaymentIntent.mockResolvedValue({
    status: "succeeded",
    latest_charge: { created: 1_789_684_600, paid: true, status: "succeeded" },
  });
  mockNotifyOwner.mockResolvedValue(true);
  mockTrackEvent.mockResolvedValue(undefined);
});

describe("Hiring-aware legacy database fixtures", () => {
  it("does not consume legacy select sequences or swallow real fixture writes", async () => {
    const first = { from: vi.fn(() => "first legacy query") };
    const second = { from: vi.fn(() => "second legacy query") };
    const update = vi.fn(() => "legacy write");
    const legacy = { select: vi.fn().mockReturnValueOnce(first).mockReturnValueOnce(second), update };
    mockGetDb.mockResolvedValue(legacy);
    const { getDb } = await import("../db");
    const database = await getDb() as any;

    expect(await database.select().from(hiringOrders).where(undefined).limit(1)).toEqual([]);
    expect(legacy.select).not.toHaveBeenCalled();
    expect(database.select().from(purchases)).toBe("first legacy query");
    expect(await database.select().from(hiringOrders).where(undefined).limit(1)).toEqual([]);
    expect(database.select({ id: purchases.id }).from(purchases)).toBe("second legacy query");
    expect(legacy.select.mock.calls).toEqual([[], [{ id: purchases.id }]]);
    expect(first.from).toHaveBeenCalledWith(purchases);
    expect(second.from).toHaveBeenCalledWith(purchases);
    expect(database.update(purchases)).toBe("legacy write");
    expect(update).toHaveBeenCalledWith(purchases);
  });
});

describe("Stripe registered handler — durable Hiring isolation (real dispatcher)", () => {
  const matchingTerms = () => [
    hiringTerm({ id: "term_current" }),
    hiringTerm({ id: "term_future", sourceInvoiceId: "in_future", sourceChargeId: "ch_future",
      state: "cancel_at_period_end", used: 17, startsAtMs: HIRING_END, endsAtMs: Date.parse("2028-01-01T00:00:00Z") }),
    hiringTerm({ id: "term_held", sourceInvoiceId: "in_held", sourceChargeId: "ch_held", state: "subscription_suspended" }),
  ];
  const unrelatedTerms = () => [
    hiringTerm({ id: "term_other_subscription", sourceSubscriptionId: "sub_other" }),
    hiringTerm({ id: "term_other_org", orgId: 8 }),
    hiringTerm({ id: "term_refunded", paymentState: "refunded", state: "suspended" }),
  ];

  it.each([false, true])("subscription.created is Hiring-only before fulfilment (durable=%s)", async durable => {
    const store = hiringDatabase({ orders: [hiringOrder({ status: "pending", stripeSubscriptionId: durable ? "sub_hiring" : null })] });
    mockRetrieveSubscription.mockResolvedValue(hiringSubscription());
    mockConstructEvent.mockReturnValue({ id: "evt_hiring_created", type: "customer.subscription.created",
      data: { object: hiringSubscription(durable ? { metadata: {} } : {}) } });
    const response = makeResponse();
    await captureWebhookHandler()(makeRequest(), response);
    expect(response.statusCode).toBe(200);
    expect(response.body).toEqual({ received: true, reviewRequired: false });
    expect(store.state.hiring_orders[0]).toMatchObject({ status: "pending", stripeSubscriptionId: "sub_hiring" });
    expect(store.state.hiring_terms).toEqual([]); expect(store.state.hiring_payments).toEqual([]);
    expect(store.state.hiring_events[0]).toMatchObject({ id: "evt_hiring_created", eventType: "customer.subscription.created", state: "claimed" });
    expectHiringIsolation(store);
  });

  it.each([false, true])("invoice.payment_failed never reaches legacy notifications or subscriptions (durable=%s)", async durable => {
    const original = hiringTerm({ used: 17 });
    const store = hiringDatabase({ orders: [hiringOrder({ stripeSubscriptionId: durable ? "sub_hiring" : null })], terms: [original] });
    mockReversalInvoice.mockResolvedValue(hiringInvoice());
    mockRetrieveSubscription.mockResolvedValue(hiringSubscription({ status: "past_due" }));
    mockConstructEvent.mockReturnValue({ id: "evt_hiring_failed", type: "invoice.payment_failed",
      data: { object: hiringInvoice(durable ? { metadata: {} } : {}) } });
    const response = makeResponse();
    await captureWebhookHandler()(makeRequest(), response);
    expect(response.statusCode).toBe(200);
    expect(response.body).toEqual({ received: true, reviewRequired: false });
    expect(store.state.hiring_terms).toEqual([{ ...original, state: "subscription_suspended" }]);
    expect(store.state.hiring_payments).toEqual([]);
    expect(store.state.hiring_events[0]).toMatchObject({ id: "evt_hiring_failed", eventType: "invoice.payment_failed", state: "claimed" });
    expectHiringIsolation(store);
  });

  it.each([false, true])("refund.created cannot invoke Flex or legacy reversal handling (durable=%s)", async durable => {
    const original = hiringTerm({ used: 17 });
    const store = hiringDatabase({ terms: [original] });
    mockReversalInvoice.mockResolvedValue(hiringInvoice()); mockRetrieveSubscription.mockResolvedValue(hiringSubscription());
    mockReversalCharge.mockResolvedValue(hiringCharge({ refunded: true, amount_refunded: 113_000 }));
    mockConstructEvent.mockReturnValue({ id: "evt_hiring_refund_created", type: "refund.created", data: { object: {
      id: "re_hiring", charge: "ch_hiring", payment_intent: "pi_hiring", amount: 113_000,
      metadata: durable ? {} : { type: HIRING_TYPE, policy: HIRING_POLICY, orderId: "order_hiring", orgId: "7" },
    } } });
    const response = makeResponse();
    await captureWebhookHandler()(makeRequest(), response);
    expect(response.statusCode).toBe(200);
    expect(response.body).toEqual({ received: true, reviewRequired: true });
    expect(store.state.hiring_terms).toEqual([{ ...original, state: "suspended", paymentState: "refunded" }]);
    expect(store.state.hiring_payments[0]).toMatchObject({ id: "ch_hiring", paymentState: "refunded" });
    expect(store.state.hiring_events[0]).toMatchObject({ id: "evt_hiring_refund_created", eventType: "refund.created", state: "review_required" });
    expectHiringIsolation(store);
  });

  it.each([{}, { type: "org" }, { type: "individual" }])(
    "deletion with mutable metadata %j suspends every durably bound term, never learner/Teams records",
    async metadata => {
      const terms = [...matchingTerms(), ...unrelatedTerms()];
      const store = hiringDatabase({ terms });
      // A deletion is terminal even when the payload's mutable status/metadata is stale.
      mockConstructEvent.mockReturnValue({ id: "evt_hiring_deleted", type: "customer.subscription.deleted",
        data: { object: hiringSubscription({ metadata, status: "active" }) } });
      const response = makeResponse();

      await captureWebhookHandler()(makeRequest(), response);

      expect(response.statusCode).toBe(200);
      expect(response.body).toEqual({ received: true, reviewRequired: false });
      expect(store.state.hiring_orders[0]).toMatchObject({ status: "cancelled", renewalCancelled: true });
      expect(store.state.hiring_terms).toEqual(terms.map(term => ["term_current", "term_future", "term_held"].includes(term.id)
        ? { ...term, state: "subscription_suspended" } : term));
      expect(store.writes.filter(write => write.table === "hiring_terms").map(write => write.ids[0]).sort())
        .toEqual(["term_current", "term_future", "term_held"]);
      expect(store.state.hiring_events).toEqual([expect.objectContaining({
        id: "evt_hiring_deleted", orderId: "order_hiring", orgId: 7, eventType: "customer.subscription.deleted", state: "claimed",
      })]);
      expect(mockRetrieveSubscription).not.toHaveBeenCalled();
      expectHiringIsolation(store);
    },
  );

  it.each([
    { status: "active", metadata: {}, terminated: false },
    { status: "past_due", metadata: { type: "individual" }, terminated: false },
    { status: "canceled", metadata: { type: "org" }, terminated: true },
    { status: "incomplete_expired", metadata: {}, terminated: true },
  ])("updated $status with stripped/changed live metadata cannot provision legacy access", async ({ status, metadata, terminated }) => {
    const terms = [...matchingTerms(), ...unrelatedTerms()];
    const store = hiringDatabase({ terms });
    mockRetrieveSubscription.mockResolvedValue(hiringSubscription({ status, metadata }));
    mockConstructEvent.mockReturnValue({ id: "evt_hiring_updated", type: "customer.subscription.updated",
      data: { object: { id: "sub_hiring", customer: "cus_hiring", metadata: {} } } });
    const response = makeResponse();

    await captureWebhookHandler()(makeRequest(), response);

    expect(response.statusCode).toBe(200);
    expect(response.body).toEqual({ received: true, reviewRequired: status === "active" });
    expect(mockRetrieveSubscription.mock.calls).toEqual([["sub_hiring", { expand: ["items.data.price.product", "latest_invoice"] }, HIRING_READ_OPTIONS]]);
    expect(store.state.hiring_orders[0]).toMatchObject({ status: terminated ? "cancelled" : "active", renewalCancelled: terminated });
    expect(store.state.hiring_terms).toEqual(terms.map(term => ["term_current", "term_future", "term_held"].includes(term.id)
      ? { ...term, state: "subscription_suspended" } : term));
    expect(store.writes.filter(write => write.table === "hiring_terms").map(write => write.ids[0]).sort())
      .toEqual(["term_current", "term_future", "term_held"]);
    expect(store.state.hiring_events[0]).toMatchObject({ id: "evt_hiring_updated", state: status === "active" ? "review_required" : "claimed" });
    expectHiringIsolation(store);
  });

  it.each([
    { type: "invoice.paid", metadata: {}, idOnly: false },
    { type: "invoice.payment_succeeded", metadata: { type: "org" }, idOnly: false },
    { type: "invoice.paid", metadata: {}, idOnly: true },
  ])("$type uses durable subscription ownership (id-only=$idOnly) and grants only Hiring quota", async ({ type, metadata, idOnly }) => {
    const store = hiringDatabase({ orders: [hiringOrder({ status: "pending" })] });
    mockReversalInvoice.mockResolvedValue(hiringInvoice({ metadata }));
    mockRetrieveSubscription.mockResolvedValue(hiringSubscription());
    mockReversalCharge.mockResolvedValue(hiringCharge());
    mockConstructEvent.mockReturnValue({ id: "evt_hiring_paid", type,
      data: { object: { id: "in_hiring", metadata, ...(idOnly ? {} : { subscription: "sub_hiring" }) } } });
    const response = makeResponse();

    await captureWebhookHandler()(makeRequest(), response);

    expect(response.statusCode).toBe(200);
    expect(response.body).toEqual({ received: true, reviewRequired: false });
    expect(mockReversalInvoice.mock.calls).toEqual(Array.from({ length: idOnly ? 2 : 1 }, () =>
      ["in_hiring", HIRING_INVOICE_EXPAND, HIRING_READ_OPTIONS]));
    expect(mockRetrieveSubscription.mock.calls).toEqual([["sub_hiring",
      { expand: ["items.data.price.product", "latest_invoice"] }, HIRING_READ_OPTIONS]]);
    expect(mockReversalCharge.mock.calls).toEqual([["ch_hiring", { expand: ["payment_intent"] }, HIRING_READ_OPTIONS]]);
    expect(mockListDisputes.mock.calls).toEqual([[{ charge: "ch_hiring", limit: 100 }, HIRING_READ_OPTIONS]]);
    expect(store.state.hiring_terms).toEqual([expect.objectContaining({ orgId: 7, basis: "stripe", sourceInvoiceId: "in_hiring",
      sourceSubscriptionId: "sub_hiring", sourcePaymentIntentId: "pi_hiring", sourceChargeId: "ch_hiring",
      startsAtMs: HIRING_START, endsAtMs: HIRING_END, quota: 100, used: 0, state: "active", paymentState: "active" })]);
    expect(store.state.hiring_payments).toEqual([expect.objectContaining({ id: "ch_hiring", orderId: "order_hiring",
      subscriptionId: "sub_hiring", invoiceId: "in_hiring", paymentIntentId: "pi_hiring", paymentState: "active" })]);
    expect(store.state.hiring_orders[0]).toMatchObject({ status: "active", stripeSubscriptionId: "sub_hiring" });
    expectHiringIsolation(store);
  });

  it.each(["invoice.paid", "invoice.payment_succeeded"])(
    "%s remains Hiring review-only when both event and live subscription metadata were changed to org",
    async type => {
      const store = hiringDatabase();
      mockReversalInvoice.mockResolvedValue(hiringInvoice({ metadata: { type: "org" } }));
      mockRetrieveSubscription.mockResolvedValue(hiringSubscription({ metadata: { type: "org" } }));
      mockConstructEvent.mockReturnValue({ id: "evt_hiring_changed_metadata", type,
        data: { object: { id: "in_hiring", subscription: "sub_hiring", metadata: { type: "org" } } } });
      const response = makeResponse();

      await captureWebhookHandler()(makeRequest(), response);

      expect(response.statusCode).toBe(200);
      expect(response.body).toEqual({ received: true, reviewRequired: true });
      expect(store.state.hiring_terms).toEqual([]);
      expect(store.state.hiring_payments).toEqual([]);
      expect(store.state.hiring_orders).toEqual([hiringOrder()]);
      expect(store.state.hiring_events[0]).toMatchObject({ id: "evt_hiring_changed_metadata", state: "review_required" });
      expect(mockReversalInvoice.mock.calls).toEqual([["in_hiring", HIRING_INVOICE_EXPAND, HIRING_READ_OPTIONS]]);
      expect(mockRetrieveSubscription.mock.calls).toEqual([["sub_hiring",
        { expand: ["items.data.price.product", "latest_invoice"] }, HIRING_READ_OPTIONS]]);
      expectHiringIsolation(store);
    },
  );

  it.each([false, true])("pre-term refund discovers durable Hiring subscription despite untagged invoice (live metadata removed=%s)", async stripped => {
    const store = hiringDatabase({ orders: [hiringOrder({ status: "pending" })] });
    mockInvoiceAllocations.mockResolvedValue({ data: [{ id: "inpay_hiring", invoice: "in_hiring" }], has_more: false });
    mockReversalInvoice.mockResolvedValue(hiringInvoice());
    mockRetrieveSubscription.mockResolvedValue(hiringSubscription(stripped ? { metadata: {} } : {}));
    mockReversalCharge.mockResolvedValue(hiringCharge({ refunded: true, amount_refunded: 113_000 }));
    mockConstructEvent.mockReturnValue({ id: "evt_hiring_preterm_refund", type: "charge.refunded",
      data: { object: { id: "ch_hiring", payment_intent: "pi_hiring", amount: 113_000, amount_refunded: 113_000, metadata: {} } } });
    const response = makeResponse();

    await captureWebhookHandler()(makeRequest(), response);

    expect(response.statusCode).toBe(200);
    expect(response.body).toEqual({ received: true, reviewRequired: true });
    expect(mockInvoiceAllocations.mock.calls).toEqual([[{
      payment: { type: "payment_intent", payment_intent: "pi_hiring" }, limit: 100,
    }, HIRING_READ_OPTIONS]]);
    expect(mockReversalInvoice.mock.calls).toEqual(Array.from({ length: 2 }, () => ["in_hiring", HIRING_INVOICE_EXPAND, HIRING_READ_OPTIONS]));
    expect(mockReversalCharge.mock.calls).toEqual([
      ["ch_hiring", {}, HIRING_READ_OPTIONS], ["ch_hiring", {}, HIRING_READ_OPTIONS],
    ]);
    expect(mockRetrieveSubscription.mock.calls).toEqual([["sub_hiring",
      { expand: ["items.data.price.product", "latest_invoice"] }, HIRING_READ_OPTIONS]]);
    expect(store.state.hiring_terms).toEqual([]);
    expect(store.state.hiring_events[0]).toMatchObject({ id: "evt_hiring_preterm_refund", invoiceId: "in_hiring", state: "review_required" });
    if (stripped) {
      expect(store.state.hiring_payments).toEqual([]);
      expect(store.state.hiring_orders).toEqual([hiringOrder({ status: "pending" })]);
      expect(mockListDisputes).not.toHaveBeenCalled();
    } else {
      expect(store.state.hiring_payments).toEqual([expect.objectContaining({ id: "ch_hiring", orderId: "order_hiring", orgId: 7,
        invoiceId: "in_hiring", subscriptionId: "sub_hiring", paymentIntentId: "pi_hiring", paymentState: "refunded" })]);
      expect(store.state.hiring_orders[0]).toMatchObject({ status: "pending", stripeSubscriptionId: "sub_hiring",
        paymentState: "refunded", paymentChargeId: "ch_hiring" });
      // A terminal full refund dominates disputes; no additional network read is needed.
      expect(mockListDisputes).not.toHaveBeenCalled();
    }
    expectHiringIsolation(store);
  });

  it("a durably bound untagged checkout session cannot reach the legacy purchase writer", async () => {
    const store = hiringDatabase({ orders: [hiringOrder({ stripeSubscriptionId: null, status: "pending" })] });
    mockConstructEvent.mockReturnValue({ id: "evt_hiring_checkout", type: "checkout.session.completed", data: { object: {
      id: "cs_hiring", mode: "payment", payment_status: "paid", customer: "cus_hiring", amount_total: 4900,
      payment_intent: "pi_hiring", metadata: { product_key: "oit", entitlement_type: INDIVIDUAL_EXAM_PASS_ENTITLEMENT_TYPE,
        individual_access_policy: INDIVIDUAL_EXAM_PASS_POLICY_VERSION }, customer_details: { email: "owner@example.test" },
    } } });
    const response = makeResponse();

    await captureWebhookHandler()(makeRequest(), response);

    expect(response.statusCode).toBe(200);
    expect(response.body).toEqual({ received: true, reviewRequired: true });
    expect(store.state.hiring_terms).toEqual([]);
    expect(store.state.hiring_events[0]).toMatchObject({ id: "evt_hiring_checkout", state: "review_required" });
    expectHiringIsolation(store);
  });
});

describe("Stripe webhook handler — Course Pass refunds and disputes", () => {
  beforeEach(() => {
    // The getDb boundary supplies empty Hiring reads without a real database.
    mockGetDb.mockResolvedValue({});
  });
  it("parses only positive integer licence IDs", () => {
    expect(parseRefundLicenceIds({ licenceIds: "[12, 13, -1, 2.5]" })).toEqual([12, 13]);
    expect(parseRefundLicenceIds({ licence_ids: "21, 22" })).toEqual([21, 22]);
  });

  it("routes a full Course Pass refund to the order-scoped handler", async () => {
    const handler = captureWebhookHandler();
    const response = makeResponse();
    mockConstructEvent.mockReturnValue({
      id: "evt_flex_refund",
      type: "charge.refunded",
      data: { object: { id: "ch_flex", payment_intent: "pi_flex", amount: 5000, amount_refunded: 5000 } },
    });
    mockFlexFullRefund.mockResolvedValue(true);

    await handler(makeRequest(), response);

    expect(mockFlexFullRefund).toHaveBeenCalledWith("pi_flex");
    expect(response.statusCode).toBe(200);
    expect(response.body).toEqual({ received: true });
  });

  it.each(["charge.refunded", "charge.dispute.created"])("routes all-legacy multi-invoice %s after complete ownership classification", async type => {
    const handler = captureWebhookHandler(); const response = makeResponse();
    mockInvoiceAllocations.mockResolvedValue({ data: [{ id: "ip_1", invoice: "in_legacy_1" }, { id: "ip_2", invoice: "in_legacy_2" }], has_more: false });
    mockConstructEvent.mockReturnValue({ id: `evt_multiple_${type}`, type, data: { object: type === "charge.refunded"
      ? { id: "ch_flex", payment_intent: "pi_flex", amount: 5000, amount_refunded: 5000 }
      : { id: "dp_flex", charge: "ch_flex", payment_intent: "pi_flex", status: "needs_response" } } });
    mockFlexFullRefund.mockResolvedValue(true); mockFlexDisputeCreated.mockResolvedValue({ handled: true, action: "suspended" });
    await handler(makeRequest(), response);
    expect(type === "charge.refunded" ? mockFlexFullRefund : mockFlexDisputeCreated).toHaveBeenCalled();
    expect(mockReversalInvoice).toHaveBeenCalledWith("in_legacy_1", HIRING_INVOICE_EXPAND, HIRING_READ_OPTIONS);
    expect(mockReversalInvoice).toHaveBeenCalledWith("in_legacy_2", HIRING_INVOICE_EXPAND, HIRING_READ_OPTIONS);
    expect(response.statusCode).toBe(200); expect(response.body).toEqual({ received: true });
  });

  it("continues paginated all-legacy ownership discovery before the refund handler", async () => {
    const handler = captureWebhookHandler(); const response = makeResponse();
    mockInvoiceAllocations.mockResolvedValueOnce({ data: [{ id: "ip_1", invoice: "in_legacy_1" }], has_more: true })
      .mockResolvedValueOnce({ data: [{ id: "ip_2", invoice: "in_legacy_2" }], has_more: false });
    mockConstructEvent.mockReturnValue({ id: "evt_paginated_legacy", type: "charge.refunded", data: { object: { id: "ch_flex", payment_intent: "pi_flex", amount: 5000, amount_refunded: 5000 } } });
    mockFlexFullRefund.mockResolvedValue(true); await handler(makeRequest(), response);
    expect(mockInvoiceAllocations).toHaveBeenNthCalledWith(2, {
      payment: { type: "payment_intent", payment_intent: "pi_flex" }, limit: 100, starting_after: "ip_1",
    }, HIRING_READ_OPTIONS);
    expect(mockFlexFullRefund).toHaveBeenCalledWith("pi_flex"); expect(response.statusCode).toBe(200);
  });

  it("returns a retryable failure instead of acknowledging incomplete unknown reversal ownership", async () => {
    const handler = captureWebhookHandler(); const response = makeResponse();
    mockInvoiceAllocations.mockResolvedValue({ data: [], has_more: true });
    mockConstructEvent.mockReturnValue({ id: "evt_incomplete_ownership", type: "charge.refunded", data: { object: { id: "ch_flex", payment_intent: "pi_flex", amount: 5000, amount_refunded: 5000 } } });
    await handler(makeRequest(), response); expect(response.statusCode).toBe(503); expect(mockFlexFullRefund).not.toHaveBeenCalled();
  });

  it("routes a partial refund with licence metadata to the scoped handler", async () => {
    const handler = captureWebhookHandler();
    const response = makeResponse();
    mockConstructEvent.mockReturnValue({
      id: "evt_partial_refund",
      type: "refund.created",
      data: { object: { payment_intent: "pi_flex", metadata: { licenceIds: "[31,32]" } } },
    });
    mockFlexPartialRefund.mockResolvedValue(true);

    await handler(makeRequest(), response);

    expect(mockFlexPartialRefund).toHaveBeenCalledWith("pi_flex", [31, 32]);
    expect(response.statusCode).toBe(200);
  });

  it("uses refund metadata embedded in charge.refunded when refund.created is not subscribed", async () => {
    const handler = captureWebhookHandler();
    const response = makeResponse();
    mockConstructEvent.mockReturnValue({
      id: "evt_partial_charge_refund",
      type: "charge.refunded",
      data: {
        object: {
          id: "ch_flex",
          payment_intent: "pi_flex",
          amount: 5000,
          amount_refunded: 1000,
          refunds: { data: [{ metadata: { licenceIds: "[41]" } }] },
        },
      },
    });
    mockFlexPartialRefund.mockResolvedValue(true);

    await handler(makeRequest(), response);

    expect(mockFlexPartialRefund).toHaveBeenCalledWith("pi_flex", [41]);
    expect(mockFlexUnallocatedRefund).not.toHaveBeenCalled();
  });

  it("suspends and restores only the disputed Course Pass order", async () => {
    const handler = captureWebhookHandler();
    const openedResponse = makeResponse();
    mockConstructEvent.mockReturnValue({
      id: "evt_dispute_opened",
      type: "charge.dispute.created",
      data: { object: { id: "dp_flex", payment_intent: "pi_flex", status: "needs_response" } },
    });
    mockFlexDisputeCreated.mockResolvedValue({ handled: true, action: "suspended" });
    await handler(makeRequest(), openedResponse);
    expect(mockFlexDisputeCreated).toHaveBeenCalledWith("pi_flex", expect.any(Function));
    await expect(mockFlexDisputeCreated.mock.calls[0][1]()).resolves.toBe("needs_response");

    const closedResponse = makeResponse();
    mockConstructEvent.mockReturnValue({
      id: "evt_dispute_closed",
      type: "charge.dispute.closed",
      data: { object: { payment_intent: "pi_flex", status: "won" } },
    });
    mockFlexDisputeClosed.mockResolvedValue(true);
    await handler(makeRequest(), closedResponse);
    expect(mockFlexDisputeClosed).toHaveBeenCalledWith("pi_flex", "won");
  });
});

describe("Stripe webhook handler — org provisioning delegation", () => {
  it("delegates a live org subscription to provisionOrgFromWebhook", async () => {
    const handler = captureWebhookHandler();
    const response = makeResponse();
    const database = {};

    mockConstructEvent.mockReturnValue({
      id: "evt_team_created",
      type: "customer.subscription.created",
      data: {
        object: {
          id: "sub_team_123",
          metadata: {},
        },
      },
    });

    mockRetrieveSubscription.mockResolvedValue({
      id: "sub_team_123",
      customer: "cus_team_123",
      status: "active",
      current_period_start: 1786060000,
      current_period_end: 1817596000,
      items: { data: [{ quantity: 25 }] },
      metadata: {
        type: "org",
        manager_email: "manager@example.test",
        org_name: "Synthetic Organization",
        subscription_province: "western",
        subscription_tier: "stream-wastewater-coll",
      },
    });

    mockGetDb.mockResolvedValue(database);
    mockProvisionOrg.mockResolvedValue({
      state: "completed",
      orgId: 42,
    });

    await handler(makeRequest(), response);

    expect(mockProvisionOrg).toHaveBeenCalledTimes(1);
    expect(mockProvisionOrg).toHaveBeenCalledWith(
      database,
      expect.objectContaining({
        stripeEventId: "evt_team_created",
        stripeSubscriptionId: "sub_team_123",
        managerEmail: "manager@example.test",
        orgName: "Synthetic Organization",
        seats: 25,
      }),
    );
    expect(response.statusCode).toBe(200);
  });
});

describe("Stripe webhook handler — invoice-before-org", () => {
  it("returns 503 when an org invoice arrives before provisioning", async () => {
    const handler = captureWebhookHandler();
    const response = makeResponse();

    mockConstructEvent.mockReturnValue({
      id: "evt_invoice_early",
      type: "invoice.payment_succeeded",
      data: {
        object: {
          id: "in_early",
          subscription: "sub_team_early",
          amount_paid: 872500,
          billing_reason: "subscription_create",
        },
      },
    });

    mockRetrieveSubscription.mockResolvedValue({
      id: "sub_team_early",
      metadata: { type: "org" },
    });

    mockGetDb.mockResolvedValue(dbWithNoOrganization());

    await handler(makeRequest(), response);

    expect(response.statusCode).toBe(503);
    expect(response.body).toEqual({
      error: "Organization provisioning is not complete",
    });
    expect(mockProcessOrgInvoice).not.toHaveBeenCalled();
  });
});


describe("individual subscription acknowledgements", () => {
  it.each([["completed", 200], ["busy", 409], ["retryable_failure", 503]])("maps %s to HTTP %s", async (state, code) => {
    mockConstructEvent.mockReturnValue({ id: "evt_individual", type: "customer.subscription.created", data: { object: { id: "sub_fixture_1" } } });
    mockRetrieveSubscription.mockResolvedValue({ id: "sub_fixture_1", metadata: {} });
    mockGetDb.mockResolvedValue({}); mockProvisionIndividual.mockResolvedValue({ state });
    const res = makeResponse(); await captureWebhookHandler()(makeRequest(), res);
    expect(res.statusCode).toBe(code);
  });
  it("returns a retryable response on storage exceptions", async () => {
    mockConstructEvent.mockReturnValue({ id: "evt_individual", type: "customer.subscription.updated", data: { object: { id: "sub_fixture_1" } } });
    mockRetrieveSubscription.mockResolvedValue({ id: "sub_fixture_1", metadata: {} });
    mockGetDb.mockResolvedValue({}); mockProvisionIndividual.mockRejectedValue(new Error("DB unavailable"));
    const res = makeResponse(); await captureWebhookHandler()(makeRequest(), res);
    expect(res.statusCode).toBe(503);
  });
});

describe("checkout profile updates", () => {
  it.each([null, "", "not-a-phone"])("preserves an existing user phone when checkout provides %s", async phone => {
    const { users } = await import("../../drizzle/schema");
    mockConstructEvent.mockReturnValue({ id: "evt_phone", type: "checkout.session.completed", data: { object: {
      id: "cs_phone", mode: "payment", payment_status: "paid", amount_total: 4900, created: 1780000000,
      metadata: { product_key: "oit", user_id: "42" }, customer_details: { email: "qa@echelon.test", name: "QA Operator", phone },
    } } });
    const update = vi.fn(() => ({ set: vi.fn(() => ({ where: vi.fn().mockResolvedValue([]) })) }));
    mockGetDb.mockResolvedValue({ select: vi.fn(() => ({ from: vi.fn(() => ({ where: vi.fn(() => ({ limit: vi.fn().mockResolvedValue([{ id: 42 }]) })) })) })), update });
    const res = makeResponse(); await captureWebhookHandler()(makeRequest(), res);
    expect(res.statusCode).toBe(200);
    expect(update).not.toHaveBeenCalledWith(users);
  });
});

describe("Individual Exam Pass fulfillment", () => {
  it("records a paid completed checkout from the successful charge timestamp", async () => {
    const handler = captureWebhookHandler();
    const response = makeResponse();
    mockGetDb.mockResolvedValue(dbWithNoOrganization());
    mockRecordPurchase.mockResolvedValue(undefined);
    mockConstructEvent.mockReturnValue({
      id: "evt_paid",
      type: "checkout.session.completed",
      created: 1_800_000_000,
      data: {
        object: {
          id: "cs_paid",
          mode: "payment",
          payment_status: "paid",
          amount_total: 4900,
          payment_intent: "pi_paid",
          metadata: {
            product_key: "oit",
            product_name: "OIT Practice Pass",
            entitlement_type: INDIVIDUAL_EXAM_PASS_ENTITLEMENT_TYPE,
            individual_access_policy: INDIVIDUAL_EXAM_PASS_POLICY_VERSION,
          },
          customer_details: { email: "learner@example.com", phone: "+16135550109", name: null },
        },
      },
    });

    await handler(makeRequest(), response);

    expect(mockRetrievePaymentIntent).toHaveBeenCalledWith("pi_paid", { expand: ["latest_charge"] });
    expect(mockRecordPurchase).toHaveBeenCalledWith(expect.anything(), expect.objectContaining({
      email: "learner@example.com",
      productKey: "oit",
      phone: "+16135550109",
      stripeSessionId: "cs_paid",
      accessExpiresAt: new Date("2027-09-17T22:36:40.000Z"),
    }));
    expect(response.statusCode).toBe(200);
    expect(response.body).toEqual({ received: true });
  });

  it("preserves USD in the receipt payload and owner notification for a valid historical checkout", async () => {
    const handler = captureWebhookHandler();
    const response = makeResponse();
    mockGetDb.mockResolvedValue(dbWithNoOrganization());
    mockRecordPurchase.mockResolvedValue(undefined);
    mockConstructEvent.mockReturnValue({
      id: "evt_historical_usd",
      type: "checkout.session.completed",
      data: {
        object: {
          id: "cs_historical_usd",
          mode: "payment",
          payment_status: "paid",
          currency: "usd",
          amount_total: 17_900,
          payment_intent: "pi_historical_usd",
          metadata: {
            product_key: "class3-water-dist",
            product_name: "Class 3 Water Distribution Practice Pass",
            entitlement_type: INDIVIDUAL_EXAM_PASS_ENTITLEMENT_TYPE,
            individual_access_policy: INDIVIDUAL_EXAM_PASS_POLICY_VERSION,
          },
          customer_details: { email: "legacy@example.com", phone: null, name: null },
        },
      },
    });

    await handler(makeRequest(), response);

    expect(mockRecordPurchase).toHaveBeenCalledWith(expect.anything(), expect.objectContaining({
      amountCAD: 17_900,
      paymentCurrency: "usd",
      accessExpiresAt: new Date("2027-09-17T22:36:40.000Z"),
    }));
    expect(mockNotifyOwner).toHaveBeenCalledWith(expect.objectContaining({
      content: expect.stringContaining("US$179.00"),
    }));
    expect(mockTrackEvent).toHaveBeenCalledWith("checkout_completed", expect.objectContaining({
      extra: expect.objectContaining({ amountCAD: 17_900, currency: "usd" }),
    }));
    expect(response.statusCode).toBe(200);
  });

  it("keeps a fulfilled pass terminal when analytics and owner notification fail", async () => {
    mockGetDb.mockResolvedValue(dbWithNoOrganization());
    mockRecordPurchase.mockResolvedValue(undefined);
    mockNotifyOwner.mockRejectedValue(new Error("Owner notification unavailable"));
    mockTrackEvent.mockRejectedValue(new Error("Analytics unavailable"));
    mockConstructEvent.mockReturnValue({
      id: "evt_observability_failure",
      type: "checkout.session.completed",
      created: 1_800_000_000,
      data: { object: {
        id: "cs_observability_failure",
        mode: "payment",
        payment_status: "paid",
        amount_total: 4900,
        payment_intent: "pi_observability_failure",
        metadata: {
          product_key: "oit",
          product_name: "OIT Practice Pass",
          entitlement_type: INDIVIDUAL_EXAM_PASS_ENTITLEMENT_TYPE,
          individual_access_policy: INDIVIDUAL_EXAM_PASS_POLICY_VERSION,
        },
        customer_details: { email: "learner@example.com", phone: null, name: null },
      } },
    });

    const response = makeResponse();
    await captureWebhookHandler()(makeRequest(), response);

    expect(mockRecordPurchase).toHaveBeenCalledTimes(1);
    expect(response.statusCode).toBe(200);
    expect(response.body).toEqual({ received: true });
  });

  it("acknowledges a recorded session without inserting or notifying again", async () => {
    mockGetDb.mockResolvedValue(dbWithPurchaseLookupSequence([{ id: 19 }]));
    mockConstructEvent.mockReturnValue({
      id: "evt_concurrent_duplicate",
      type: "checkout.session.completed",
      created: 1_800_000_001,
      data: { object: {
        id: "cs_concurrent_duplicate",
        mode: "payment",
        payment_status: "paid",
        amount_total: 4900,
        payment_intent: "pi_concurrent_duplicate",
        metadata: {
          product_key: "oit",
          product_name: "OIT Practice Pass",
          entitlement_type: INDIVIDUAL_EXAM_PASS_ENTITLEMENT_TYPE,
          individual_access_policy: INDIVIDUAL_EXAM_PASS_POLICY_VERSION,
        },
        customer_details: { email: "learner@example.com", phone: null, name: null },
      } },
    });

    const response = makeResponse();
    await captureWebhookHandler()(makeRequest(), response);

    expect(mockRecordPurchase).not.toHaveBeenCalled();
    expect(mockNotifyOwner).not.toHaveBeenCalled();
    expect(response.statusCode).toBe(200);
    expect(response.body).toEqual({ received: true });
  });

  it("returns a retryable response when the atomic purchase transaction fails", async () => {
    mockGetDb.mockResolvedValue(dbWithNoOrganization());
    mockRecordPurchase.mockRejectedValue(new Error("Database connection reset"));
    mockConstructEvent.mockReturnValue({
      id: "evt_transaction_failure",
      type: "checkout.session.completed",
      created: 1_800_000_002,
      data: { object: {
        id: "cs_transaction_failure",
        mode: "payment",
        payment_status: "paid",
        amount_total: 4900,
        payment_intent: "pi_transaction_failure",
        metadata: {
          product_key: "oit",
          product_name: "OIT Practice Pass",
          entitlement_type: INDIVIDUAL_EXAM_PASS_ENTITLEMENT_TYPE,
          individual_access_policy: INDIVIDUAL_EXAM_PASS_POLICY_VERSION,
        },
        customer_details: { email: "learner@example.com", phone: null, name: null },
      } },
    });

    const response = makeResponse();
    await captureWebhookHandler()(makeRequest(), response);

    expect(mockRecordPurchase).toHaveBeenCalledTimes(1);
    expect(response.statusCode).toBe(503);
    expect(response.body).toEqual({ error: "Individual Exam Pass fulfilment is incomplete" });
  });

  it("waits for payment success instead of creating access on an unpaid completion", async () => {
    const handler = captureWebhookHandler();
    const response = makeResponse();
    mockGetDb.mockResolvedValue(dbWithNoOrganization());
    mockConstructEvent.mockReturnValue({
      id: "evt_pending_payment",
      type: "checkout.session.completed",
      created: 1_789_684_600,
      data: { object: {
        id: "cs_pending",
        mode: "payment",
        payment_status: "unpaid",
        metadata: {
          product_key: "oit",
          entitlement_type: INDIVIDUAL_EXAM_PASS_ENTITLEMENT_TYPE,
          individual_access_policy: INDIVIDUAL_EXAM_PASS_POLICY_VERSION,
        },
      } },
    });

    await handler(makeRequest(), response);

    expect(mockRecordPurchase).not.toHaveBeenCalled();
    expect(response.statusCode).toBe(200);
    expect(response.body).toEqual({ received: true, pendingPayment: true });
  });

  it("does not duplicate a signed Individual Pass webhook retry", async () => {
    const recorded = new Set<string>();
    const db = {
      select: vi.fn(() => ({
        from: vi.fn(() => ({
          where: vi.fn(() => ({
            limit: vi.fn(() => ({ for: vi.fn().mockImplementation(async () => recorded.size ? [{ id: 1 }] : []) })),
          })),
        })),
      })),
    };
    mockGetDb.mockResolvedValue(db);
    mockRecordPurchase.mockImplementation(async (_db, purchase) => {
      recorded.add(purchase.stripeSessionId);
    });
    mockConstructEvent.mockReturnValue({
      id: "evt_retryable_paid",
      type: "checkout.session.completed",
      created: 1_800_000_000,
      data: { object: {
        id: "cs_retryable_paid",
        mode: "payment",
        payment_status: "paid",
        amount_total: 4900,
        payment_intent: "pi_retryable_paid",
        metadata: {
          product_key: "oit",
          product_name: "OIT Practice Pass",
          entitlement_type: INDIVIDUAL_EXAM_PASS_ENTITLEMENT_TYPE,
          individual_access_policy: INDIVIDUAL_EXAM_PASS_POLICY_VERSION,
        },
        customer_details: { email: "learner@example.com", phone: null, name: null },
      } },
    });

    await captureWebhookHandler()(makeRequest(), makeResponse());
    const retryResponse = makeResponse();
    await captureWebhookHandler()(makeRequest(), retryResponse);

    expect(mockRecordPurchase).toHaveBeenCalledTimes(1);
    expect(mockRetrievePaymentIntent).toHaveBeenCalledTimes(2);
    expect(mockTrackEvent).toHaveBeenCalledTimes(2);
    expect(retryResponse.statusCode).toBe(200);
    expect(retryResponse.body).toEqual({ received: true });
  });

  it("returns a retryable failure without granting access when the successful charge timestamp is missing", async () => {
    mockGetDb.mockResolvedValue(dbWithNoOrganization());
    mockRetrievePaymentIntent.mockResolvedValue({ status: "succeeded", latest_charge: null });
    mockConstructEvent.mockReturnValue({
      id: "evt_payment_lookup_failure",
      type: "checkout.session.completed",
      data: { object: {
        id: "cs_payment_lookup_failure",
        mode: "payment",
        payment_status: "paid",
        amount_total: 4900,
        payment_intent: "pi_missing_charge_timestamp",
        metadata: {
          product_key: "oit",
          product_name: "OIT Practice Pass",
          entitlement_type: INDIVIDUAL_EXAM_PASS_ENTITLEMENT_TYPE,
          individual_access_policy: INDIVIDUAL_EXAM_PASS_POLICY_VERSION,
        },
        customer_details: { email: "learner@example.com", phone: null, name: null },
      } },
    });

    const response = makeResponse();
    await captureWebhookHandler()(makeRequest(), response);

    expect(mockRecordPurchase).not.toHaveBeenCalled();
    expect(response.statusCode).toBe(503);
  });

  it("does not let an unversioned historical checkout create access", async () => {
    mockGetDb.mockResolvedValue(dbWithNoOrganization());
    mockRecordPurchase.mockResolvedValue(undefined);
    mockConstructEvent.mockReturnValue({
      id: "evt_historical_pass",
      type: "checkout.session.completed",
      data: { object: {
        id: "cs_historical_pass",
        mode: "payment",
        payment_status: "paid",
        amount_total: 4900,
        payment_intent: "pi_historical_pass",
        metadata: { product_key: "oit", product_name: "OIT Practice Pass" },
        customer_details: { email: "legacy@example.com", phone: null, name: null },
      } },
    });

    const response = makeResponse();
    await captureWebhookHandler()(makeRequest(), response);

    expect(mockRetrievePaymentIntent).not.toHaveBeenCalled();
    expect(mockRecordPurchase).not.toHaveBeenCalled();
    expect(response.statusCode).toBe(200);
    expect(response.body).toEqual({ received: true });
  });

  it("records a paid delayed-payment success through the same signed webhook path", async () => {
    mockGetDb.mockResolvedValue(dbWithNoOrganization());
    mockRecordPurchase.mockResolvedValue(undefined);
    mockConstructEvent.mockReturnValue({
      id: "evt_delayed_payment_success",
      type: "checkout.session.async_payment_succeeded",
      created: 1_800_000_000,
      data: { object: {
        id: "cs_delayed_payment_success",
        mode: "payment",
        payment_status: "unpaid",
        amount_total: 4900,
        payment_intent: "pi_delayed_payment_success",
        metadata: {
          product_key: "oit",
          product_name: "OIT Practice Pass",
          entitlement_type: INDIVIDUAL_EXAM_PASS_ENTITLEMENT_TYPE,
          individual_access_policy: INDIVIDUAL_EXAM_PASS_POLICY_VERSION,
        },
        customer_details: { email: "delayed@example.com", phone: null, name: null },
      } },
    });

    const response = makeResponse();
    await captureWebhookHandler()(makeRequest(), response);

    expect(mockRecordPurchase).toHaveBeenCalledWith(expect.anything(), expect.objectContaining({
      stripeSessionId: "cs_delayed_payment_success",
      accessExpiresAt: new Date("2027-09-17T22:36:40.000Z"),
    }));
    expect(response.statusCode).toBe(200);
  });

  it("routes a policy-marker mismatch to manual review without granting access", async () => {
    const db = {
      select: vi.fn(() => ({
        from: vi.fn(() => ({
          where: vi.fn(() => ({ limit: vi.fn().mockResolvedValue([{ id: 1 }]) })),
        })),
      })),
    };
    mockGetDb.mockResolvedValue(db);
    mockConstructEvent.mockReturnValue({
      id: "evt_missing_policy_duplicate",
      type: "checkout.session.completed",
      data: { object: {
        id: "cs_missing_policy_duplicate",
        mode: "payment",
        payment_status: "paid",
        amount_total: 4900,
        payment_intent: "pi_missing_policy_duplicate",
        metadata: {
          product_key: "oit",
          entitlement_type: INDIVIDUAL_EXAM_PASS_ENTITLEMENT_TYPE,
        },
        customer_details: { email: "learner@example.com", phone: null, name: null },
      } },
    });

    const response = makeResponse();
    await captureWebhookHandler()(makeRequest(), response);

    expect(mockRecordPurchase).not.toHaveBeenCalled();
    expect(mockNotifyOwner).toHaveBeenCalledTimes(1);
    expect(response.statusCode).toBe(200);
    expect(response.body).toEqual({ received: true, reviewRequired: true });
  });

  it("leaves Teams subscription checkout completions to the subscription webhook", async () => {
    mockGetDb.mockResolvedValue(dbWithNoOrganization());
    mockConstructEvent.mockReturnValue({
      id: "evt_team_checkout",
      type: "checkout.session.completed",
      data: { object: {
        id: "cs_team_checkout",
        mode: "subscription",
        payment_status: "no_payment_required",
        metadata: { type: "org" },
      } },
    });

    const response = makeResponse();
    await captureWebhookHandler()(makeRequest(), response);

    expect(mockRecordPurchase).not.toHaveBeenCalled();
    expect(response.statusCode).toBe(200);
    expect(response.body).toEqual({ received: true });
  });
});
