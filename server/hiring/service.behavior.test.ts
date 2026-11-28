import { getTableName, sql, type SQL } from "drizzle-orm";
import { MySqlDialect } from "drizzle-orm/mysql-core";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { TrpcContext } from "../_core/context";

const external = vi.hoisted(() => ({ getDb: vi.fn(), retrieve: vi.fn(), update: vi.fn(), priceRetrieve: vi.fn(), customerCreate: vi.fn(), sessionCreate: vi.fn(), sessionRetrieve: vi.fn() }));
vi.mock("../db", () => ({ getDb: external.getDb }));
vi.mock("../stripe/stripe", () => ({ stripe: {
  subscriptions: { retrieve: external.retrieve, update: external.update },
  prices: { retrieve: external.priceRetrieve }, customers: { create: external.customerCreate },
  checkout: { sessions: { create: external.sessionCreate, retrieve: external.sessionRetrieve } },
} }));
vi.mock("../_core/env", () => ({ ENV: { appBaseUrl: "http://127.0.0.1:3000" } }));
// Avoid importing unrelated access-token services. Use canonical, real normalization.
vi.mock("../_core/accessService", async () => ({ normalizeEmail: (await import("../_core/access")).normalizeEmail }));
import { cancelHiringAtPeriodEnd, createHiringCheckout, getHiringStatus } from "./service";
import { HIRING_AMOUNT, HIRING_POLICY, HIRING_TYPE } from "./policy";

type Row = Record<string, any>;
const NOW = Date.parse("2026-11-28T05:00:00Z");
const EMAIL = "owner@example.test";
const context = { user: null, studentEmail: EMAIL, req: {}, res: {} } as unknown as TrpcContext;
const organization = () => ({ id: 7, managerEmail: EMAIL, name: "Synthetic organization", province: "ontario", tier: "all-access", status: "active", billingType: "stripe", seatsTotal: 12, stripeSubscriptionId: "sub_learner", stripeCustomerId: "cus_hiring", termStart: new Date("2026-01-01T00:00:00Z"), termEnd: new Date("2027-01-01T00:00:00Z"), createdAt: new Date("2026-01-01T00:00:00Z") });
const term = (changes: Row = {}) => ({ id: "term_current", orgId: 7, basis: "stripe", startsAtMs: Date.parse("2026-01-01T00:00:00Z"), endsAtMs: Date.parse("2027-01-01T00:00:00Z"), used: 9, quota: 100, state: "active", paymentState: "active", sourceSubscriptionId: "sub_hiring", ...changes });
const oldTerm = () => term({ id: "term_expired", startsAtMs: Date.parse("2025-01-01T00:00:00Z"), endsAtMs: Date.parse("2026-01-01T00:00:00Z"), sourceSubscriptionId: "sub_old", used: 88 });
const order = (id = "order_current", subId = "sub_hiring") => ({ id, orgId: 7, stripeSubscriptionId: subId, stripeCustomerId: "cus_hiring", status: "active", paymentState: "active", ownerEmail: EMAIL, createdAtMs: subId === "sub_hiring" ? NOW : START_OLD });
const START_OLD = Date.parse("2025-01-01T00:00:00Z");
const subscription = (changes: Row = {}) => ({
  id: "sub_hiring", customer: "cus_hiring", status: "active", metadata: { type: HIRING_TYPE, policy: HIRING_POLICY, orderId: "order_current", orgId: "7" }, collection_method: "charge_automatically", items: { data: [{ quantity: 1, price: { id: "price_hiring", currency: "cad", unit_amount: HIRING_AMOUNT, type: "recurring", recurring: { interval: "year", interval_count: 1, usage_type: "licensed" }, tax_behavior: "exclusive", billing_scheme: "per_unit", product: { id: "prod_hiring", metadata: { type: HIRING_TYPE, policy: HIRING_POLICY } } } }], has_more: false }, ...changes,
});
const price = () => ({ ...subscription().items.data[0].price, active: true, product: { ...subscription().items.data[0].price.product, active: true } });
const pendingOrder = (changes: Row = {}) => ({ ...order(), status: "pending", stripeSubscriptionId: null, stripeCheckoutSessionId: null, renewalCancelled: false, ...changes });
const session = (changes: Row = {}) => ({ id: "cs_hiring", mode: "subscription", customer: "cus_hiring", metadata: { type: HIRING_TYPE, policy: HIRING_POLICY, orderId: "order_current", orgId: "7", ownerEmail: EMAIL }, status: "open", subscription: null, url: "https://checkout.stripe.test/synthetic", ...changes });

/** Evaluate the actual Drizzle SQL predicates, rather than queueing predetermined rows.
 * This is a query/read-write spy, not an assertion of real MySQL isolation. */
function memoryDb(terms: Row[] = [], org: Row = organization(), orders: Row[] = [order(), order("order_old", "sub_old")]) {
  const dialect = new MySqlDialect();
  const tables: Record<string, Row[]> = { organizations: [org], hiring_terms: structuredClone(terms), hiring_orders: structuredClone(orders), organization_members: [], team_flex_licences: [] };
  const reads: { table: string; predicate: string; params: unknown[]; order: string[] }[] = [];
  const writes: { table: string; values: Row }[] = [];
  function matches(condition: SQL, row: Row) {
    const query = dialect.sqlToQuery(condition);
    const tokens = query.sql.match(/`[^`]+`\.`[^`]+`|<=|[()=>?,]|\b(?:and|or|in|is|not|null)\b/gi) ?? [];
    let index = 0, parameter = 0;
    const take = (expected: string) => { if (tokens[index++]?.toLowerCase() !== expected) throw new Error(`Unsupported mocked SQL: ${query.sql}`); };
    function atom(): boolean {
      if (tokens[index] === "(") { index++; const value = expression(); take(")"); return value; }
      const column = tokens[index++]?.match(/`[^`]+`\.`([^`]+)`/)?.[1];
      if (!column) throw new Error(`Unsupported mocked SQL: ${query.sql}`);
      const value = row[column], operator = tokens[index++]?.toLowerCase();
      if (operator === "is") { take("not"); take("null"); return value != null; }
      if (operator === "in") {
        take("("); const accepted = [];
        do { take("?"); accepted.push(query.params[parameter++]); if (tokens[index] !== ",") break; index++; } while (true);
        take(")"); return accepted.includes(value);
      }
      take("?"); const expected: any = query.params[parameter++];
      if (!["=", ">", "<="].includes(operator)) throw new Error(`Unsupported mocked SQL: ${query.sql}`);
      return operator === "=" ? value === expected : operator === ">" ? value > expected : value <= expected;
    }
    function conjunction(): boolean { let value = atom(); while (tokens[index]?.toLowerCase() === "and") { index++; const right = atom(); value = value && right; } return value; }
    function expression(): boolean { let value = conjunction(); while (tokens[index]?.toLowerCase() === "or") { index++; const right = conjunction(); value = value || right; } return value; }
    const result = expression();
    if (index !== tokens.length || parameter !== query.params.length) throw new Error(`Unsupported mocked SQL: ${query.sql}`);
    return result;
  }
  const db = {
    select: vi.fn((selection?: Row) => ({ from: (table: any) => {
      const name = getTableName(table);
      if (!tables[name]) throw new Error(`Unexpected read: ${name}`);
      let condition: SQL | undefined, count = Infinity;
      const ordering: string[] = [];
      const read = { table: name, predicate: "", params: [] as unknown[], order: ordering };
      const builder: any = {
        innerJoin: () => builder,
        where: (predicate: SQL) => { condition = predicate; const q = dialect.sqlToQuery(predicate); read.predicate = q.sql; read.params = q.params; return builder; },
        orderBy: (...columns: any[]) => { ordering.push(...columns.map(column => dialect.sqlToQuery(sql`${column}`).sql)); return builder; },
        limit: (value: number) => { count = value; return builder; },
        for: () => builder,
        then: (resolve: any, reject: any) => Promise.resolve().then(() => {
          reads.push(read);
          let rows = tables[name].filter(row => !condition || matches(condition, row));
          for (const expression of [...ordering].reverse()) {
            const column = expression.match(/`[^`]+`\.`([^`]+)`/)?.[1];
            if (!column) throw new Error(`Unsupported order: ${expression}`);
            rows = [...rows].sort((a, b) => (a[column] - b[column]) * (/\bdesc\b/i.test(expression) ? -1 : 1));
          }
          return rows.slice(0, count).map(row => selection ? Object.fromEntries(Object.entries(selection).map(([key, column]) => [key, row[(column as any).name]])) : structuredClone(row));
        }).then(resolve, reject),
      };
      return builder;
    } })),
    update: vi.fn((table: any) => ({ set: (values: Row) => ({ where: async (predicate: SQL) => {
      const name = getTableName(table); writes.push({ table: name, values: structuredClone(values) });
      if (!["hiring_terms", "hiring_orders"].includes(name) && !(name === "organizations" && Object.keys(values).join() === "stripeCustomerId")) throw new Error(`Forbidden learner/organization write: ${name}`);
      tables[name].filter(row => matches(predicate, row)).forEach(row => Object.assign(row, values));
    } }) })),
    insert: vi.fn((table: any) => ({ values: async (values: Row) => {
      const name = getTableName(table);
      if (name !== "hiring_orders") throw new Error(`Unexpected insert: ${name}`);
      writes.push({ table: name, values: structuredClone(values) });
      tables[name].push({ stripeSubscriptionId: null, stripeCheckoutSessionId: null, renewalCancelled: false, ...structuredClone(values) });
    } })),
    delete: vi.fn(() => { throw new Error("Unexpected delete in status/cancellation"); }),
  };
  let transactionDepth = 0;
  const transactionalDb = { ...db, transaction: vi.fn(async (work: (tx: typeof db) => Promise<any>) => {
    const snapshot = structuredClone(tables); transactionDepth++;
    try { return await work(db); }
    catch (error) { for (const name of Object.keys(tables)) tables[name] = snapshot[name]; throw error; }
    finally { transactionDepth--; }
  }) };
  external.getDb.mockResolvedValue(transactionalDb);
  return { db: transactionalDb, tables, reads, writes, get transactionDepth() { return transactionDepth; } };
}

beforeEach(() => {
  vi.resetAllMocks(); vi.useFakeTimers(); vi.setSystemTime(NOW);
  vi.stubEnv("HIRING_STRIPE_PRICE_ID", "price_hiring");
  external.retrieve.mockResolvedValue(subscription()); external.update.mockResolvedValue(subscription({ cancel_at_period_end: true }));
  external.priceRetrieve.mockResolvedValue(price()); external.customerCreate.mockResolvedValue({ id: "cus_hiring" });
  external.sessionCreate.mockImplementation(async parameters => session({ metadata: parameters.metadata, customer: parameters.customer }));
  external.sessionRetrieve.mockResolvedValue(session());
});
afterEach(() => { vi.useRealTimers(); vi.unstubAllEnvs(); });

describe("real Hiring status and owner cancellation", () => {
  it.each(["active", "suspended"])("selects latest %s billing term instead of an old expired active term", async state => {
    const current = term({ state, paymentState: state === "suspended" ? "disputed" : "active" });
    const store = memoryDb([oldTerm(), current]);
    const status = await getHiringStatus(context, 7);
    expect(status).toMatchObject({ active: state === "active", owner: true, termId: current.id, state, sourceSubscriptionId: "sub_hiring", used: 9, quota: 100, remaining: 91, canCancelRenewal: true });
    expect(store.reads.filter(read => read.table === "hiring_terms")[1].order).toEqual(["`hiring_terms`.`endsAtMs` desc"]);
    expect(store.writes).toEqual([]); expect(external.retrieve).not.toHaveBeenCalled();
  });

  it.each(["disputed", "needs_review", "refunded"])("allows verified owner cancellation of the latest inaccessible %s Hiring term without restoring access", async paymentState => {
    const store = memoryDb([oldTerm(), term({ state: "suspended", paymentState })]);
    await expect(cancelHiringAtPeriodEnd(context, 7)).resolves.toEqual({ success: true, endsAtMs: term().endsAtMs });
    expect(external.retrieve).toHaveBeenCalledWith("sub_hiring", { expand: ["items.data.price.product"] });
    expect(external.update).toHaveBeenCalledWith("sub_hiring", { cancel_at_period_end: true });
    expect(store.tables.hiring_terms[0]).toEqual(oldTerm());
    expect(store.tables.hiring_terms[1]).toMatchObject({ paymentState });
    await expect(getHiringStatus(context, 7)).resolves.toMatchObject({ active: false });
    expect(store.writes.every(write => (write.table === "hiring_terms" && write.values.state === "cancel_at_period_end") || (write.table === "hiring_orders" && write.values.renewalCancelled === true))).toBe(true);
    expect(store.tables.organizations[0]).toEqual(organization());
    expect(store.db.insert).not.toHaveBeenCalled(); expect(store.db.delete).not.toHaveBeenCalled();
  });

  it("allows cancellation of a future term that has not opened access yet", async () => {
    const future = term({ startsAtMs: Date.parse("2027-01-01T00:00:00Z"), endsAtMs: Date.parse("2028-01-01T00:00:00Z") });
    memoryDb([oldTerm(), future]);
    await expect(getHiringStatus(context, 7)).resolves.toMatchObject({ active: false, termId: future.id, canCancelRenewal: true });
    await expect(cancelHiringAtPeriodEnd(context, 7)).resolves.toEqual({ success: true, endsAtMs: future.endsAtMs });
  });

  it("does not leak an expired term into active Hiring access", async () => {
    memoryDb([oldTerm()]);
    await expect(getHiringStatus(context, 7)).resolves.toMatchObject({ active: false, termId: "term_expired", canCancelRenewal: true });
  });

  it("denies an unverified identity before reading or writing billing", async () => {
    const store = memoryDb([term()]);
    const anonymous = { ...context, studentEmail: null };
    await expect(cancelHiringAtPeriodEnd(anonymous, 7)).rejects.toMatchObject({ code: "UNAUTHORIZED" });
    expect(store.db.select).not.toHaveBeenCalled(); expect(store.writes).toEqual([]); expect(external.update).not.toHaveBeenCalled();
  });

  it("denies a different verified email using the real organization resolver", async () => {
    const store = memoryDb([term()]);
    await expect(cancelHiringAtPeriodEnd({ ...context, studentEmail: "intruder@example.test" }, 7)).rejects.toMatchObject({ code: "FORBIDDEN" });
    expect(store.writes).toEqual([]); expect(external.retrieve).not.toHaveBeenCalled(); expect(external.update).not.toHaveBeenCalled();
  });

  it("rejects a mismatched live subscription/customer before cancellation or local writes", async () => {
    const store = memoryDb([term()]); external.retrieve.mockResolvedValue(subscription({ customer: "cus_unrelated" }));
    await expect(cancelHiringAtPeriodEnd(context, 7)).rejects.toThrow(/customer binding mismatch/i);
    expect(external.update).not.toHaveBeenCalled(); expect(store.writes).toEqual([]);
  });

  it("does not write local cancellation when Stripe update fails", async () => {
    const store = memoryDb([term()]); external.update.mockRejectedValue(new Error("mock Stripe cancellation failure"));
    await expect(cancelHiringAtPeriodEnd(context, 7)).rejects.toThrow("mock Stripe cancellation failure");
    expect(store.writes).toEqual([]); expect(store.tables.hiring_terms).toEqual([term()]);
  });

  it("permits owner cancellation after the parent team contract lapses, without renewing learner seats", async () => {
    // The owner remains authoritative; Hiring billing is separate from team access.
    const lapsed = { ...organization(), status: "cancelled", termEnd: new Date("2026-01-01T00:00:00Z") };
    const store = memoryDb([term({ state: "suspended", paymentState: "needs_review" })], lapsed);
    await expect(getHiringStatus(context, 7)).resolves.toMatchObject({ active: false, canCancelRenewal: true });
    await expect(cancelHiringAtPeriodEnd(context, 7)).resolves.toMatchObject({ success: true });
    expect(external.update).toHaveBeenCalledWith("sub_hiring", { cancel_at_period_end: true });
    expect(store.tables.organizations[0]).toEqual(lapsed);
  });

  it("permits cancellation of a valid bound past-due Hiring subscription even though fulfilment must reject it", async () => {
    memoryDb([term({ state: "suspended", paymentState: "needs_review" })]);
    external.retrieve.mockResolvedValue(subscription({ status: "past_due" }));
    await expect(cancelHiringAtPeriodEnd(context, 7)).resolves.toMatchObject({ success: true });
    expect(external.update).toHaveBeenCalledWith("sub_hiring", { cancel_at_period_end: true });
  });

  it("cancels a verified bound pending subscription before any invoice term exists", async () => {
    const store = memoryDb([]); store.tables.hiring_orders[0].status = "pending";
    await expect(getHiringStatus(context, 7)).resolves.toMatchObject({ active: false, termId: null, sourceSubscriptionId: "sub_hiring", canCancelRenewal: true });
    await expect(cancelHiringAtPeriodEnd(context, 7)).resolves.toEqual({ success: true, endsAtMs: null });
    expect(store.tables.hiring_orders[0]).toMatchObject({ status: "pending", renewalCancelled: true });
    expect(store.tables.hiring_terms).toEqual([]);
    await expect(getHiringStatus(context, 7)).resolves.toMatchObject({ active: false, canCancelRenewal: false });
  });

  it("does not send another Stripe cancellation for an already nonrenewing subscription", async () => {
    const store = memoryDb([term({ state: "cancel_at_period_end" })]);
    store.tables.hiring_orders[0].renewalCancelled = true;
    external.retrieve.mockResolvedValue(subscription({ cancel_at_period_end: true }));
    await expect(getHiringStatus(context, 7)).resolves.toMatchObject({ active: true, canCancelRenewal: false });
    await expect(cancelHiringAtPeriodEnd(context, 7)).resolves.toMatchObject({ success: true });
    expect(external.update).not.toHaveBeenCalled(); expect(store.tables.organizations[0]).toEqual(organization());
  });
});

describe("real Hiring checkout with synthetic Stripe", () => {
  it("creates a customer outside every transaction and persists it only after a fresh authority check", async () => {
    const store = memoryDb([], { ...organization(), stripeCustomerId: null }, []);
    external.customerCreate.mockImplementation(async () => {
      expect(store.transactionDepth).toBe(0);
      expect(store.tables.hiring_orders).toEqual([]);
      expect(store.tables.organizations[0].stripeCustomerId).toBeNull();
      return { id: "cus_hiring" };
    });
    await expect(createHiringCheckout(context, 7)).resolves.toMatchObject({ url: session().url });
    expect(external.customerCreate).toHaveBeenCalledWith({ email: EMAIL, metadata: { orgId: "7", type: HIRING_TYPE, policy: HIRING_POLICY } }, { idempotencyKey: "hiring-customer:7" });
    expect(store.tables.organizations[0].stripeCustomerId).toBe("cus_hiring");
    expect(store.tables.hiring_orders).toHaveLength(1);
    expect(store.tables.hiring_orders[0]).toMatchObject({ status: "pending", stripeCheckoutSessionId: "cs_hiring", stripeCustomerId: "cus_hiring" });
    const customerWrites = store.writes.filter(write => write.table === "organizations");
    expect(customerWrites).toEqual([{ table: "organizations", values: { stripeCustomerId: "cus_hiring" } }]);
  });

  it.each(["owner", "annual"])("rejects a changed %s after customer creation without saving a customer or order", async change => {
    const store = memoryDb([], { ...organization(), stripeCustomerId: null }, []);
    external.customerCreate.mockImplementation(async () => {
      expect(store.transactionDepth).toBe(0);
      if (change === "owner") store.tables.organizations[0].managerEmail = "new-owner@example.test";
      else store.tables.organizations[0].termEnd = new Date(NOW);
      return { id: "cus_hiring" };
    });
    await expect(createHiringCheckout(context, 7)).rejects.toMatchObject({ code: "FORBIDDEN", message: change === "owner" ? "Organization ownership changed. Reload billing." : "Recruitment assessments require a current Annual team contract." });
    expect(store.tables.organizations[0].stripeCustomerId).toBeNull();
    expect(store.tables.hiring_orders).toEqual([]); expect(store.writes).toEqual([]);
    expect(external.sessionCreate).not.toHaveBeenCalled();
  });

  it("uses the fresh customer binding if another request saved it during customer creation", async () => {
    const store = memoryDb([], { ...organization(), stripeCustomerId: null }, []);
    external.customerCreate.mockImplementation(async () => {
      store.tables.organizations[0].stripeCustomerId = "cus_winner";
      return { id: "cus_unused" };
    });
    await expect(createHiringCheckout(context, 7)).resolves.toMatchObject({ url: session().url });
    expect(external.sessionCreate.mock.calls[0][0].customer).toBe("cus_winner");
    expect(store.tables.organizations[0].stripeCustomerId).toBe("cus_winner");
    expect(store.writes.filter(write => write.table === "organizations")).toEqual([]);
  });

  it("reuses a pending operation's customer without creating a duplicate when the org binding is missing", async () => {
    const store = memoryDb([], { ...organization(), stripeCustomerId: null }, [pendingOrder({ stripeCheckoutSessionId: "cs_hiring" })]);
    await expect(createHiringCheckout(context, 7)).resolves.toEqual({ url: session().url, orderId: "order_current" });
    expect(external.customerCreate).not.toHaveBeenCalled(); expect(external.sessionCreate).not.toHaveBeenCalled();
    expect(external.sessionRetrieve).toHaveBeenCalledWith("cs_hiring");
    expect(store.tables.organizations[0].stripeCustomerId).toBe("cus_hiring");
    expect(store.tables.hiring_orders).toHaveLength(1);
  });

  it("preserves the operation and idempotency key after an ambiguous Checkout transport failure", async () => {
    const store = memoryDb([], organization(), []);
    external.sessionCreate.mockRejectedValueOnce(new Error("response lost after Stripe accepted"));
    await expect(createHiringCheckout(context, 7)).rejects.toMatchObject({ code: "SERVICE_UNAVAILABLE", message: expect.stringContaining("billing outcome may still be pending") });
    expect(store.tables.hiring_orders).toHaveLength(1);
    const id = store.tables.hiring_orders[0].id;
    await expect(createHiringCheckout(context, 7)).resolves.toMatchObject({ orderId: id });
    expect(external.sessionCreate.mock.calls.map(call => call[1])).toEqual([{ idempotencyKey: `hiring-checkout:${id}` }, { idempotencyKey: `hiring-checkout:${id}` }]);
    expect(external.customerCreate).not.toHaveBeenCalled(); expect(store.tables.hiring_orders).toHaveLength(1);
  });

  it.each([
    { recurring: { interval: "year", interval_count: 1, usage_type: "metered" } },
    { billing_scheme: "tiered" },
    { transform_quantity: { divide_by: 2, round: "up" } },
  ])("rejects configured prices that fulfilment would reject: %j", async invalid => {
    const store = memoryDb([], organization(), []);
    external.priceRetrieve.mockResolvedValue({ ...price(), ...invalid });
    await expect(createHiringCheckout(context, 7)).rejects.toMatchObject({ code: "PRECONDITION_FAILED", message: expect.stringContaining("approved annual CAD policy") });
    expect(external.customerCreate).not.toHaveBeenCalled(); expect(external.sessionCreate).not.toHaveBeenCalled();
    expect(store.writes).toEqual([]);
  });

  it.each([
    { id: "cs_unrelated" }, { customer: "cus_unrelated" }, { mode: "payment" },
    { metadata: { ...session().metadata, orderId: "order_unrelated" } },
    { metadata: { ...session().metadata, orgId: "8" } },
    { metadata: { ...session().metadata, policy: "wrong-policy" } },
    { metadata: { ...session().metadata, ownerEmail: "unrelated@example.test" } },
  ])("does not return an existing URL with mismatched Checkout binding: %j", async changes => {
    const store = memoryDb([], organization(), [pendingOrder({ stripeCheckoutSessionId: "cs_hiring" })]);
    external.sessionRetrieve.mockResolvedValue(session(changes));
    await expect(createHiringCheckout(context, 7)).rejects.toMatchObject({ code: "CONFLICT", message: expect.stringContaining("binding could not be verified") });
    expect(store.writes).toEqual([]); expect(external.sessionCreate).not.toHaveBeenCalled();
  });

  it("commits confirmed unbound expiry, returns a retry conflict, and permits a new operation only on the next request", async () => {
    const store = memoryDb([], organization(), [pendingOrder({ stripeCheckoutSessionId: "cs_hiring" })]);
    external.sessionRetrieve.mockResolvedValue(session({ status: "expired", url: null }));
    await expect(createHiringCheckout(context, 7)).rejects.toMatchObject({ code: "CONFLICT", message: "The previous Hiring checkout expired. Retry to start a new checkout." });
    expect(store.tables.hiring_orders[0]).toMatchObject({ status: "checkout_expired", stripeSubscriptionId: null });
    expect(external.sessionCreate).not.toHaveBeenCalled();
    external.sessionCreate.mockImplementation(async parameters => session({ id: "cs_replacement", metadata: parameters.metadata }));
    const next = await createHiringCheckout(context, 7);
    expect(next.orderId).not.toBe("order_current"); expect(store.tables.hiring_orders).toHaveLength(2);
  });

  it.each(["complete", "expired"])("retains a live subscription on a %s session without returning a URL or allowing replacement", async status => {
    const store = memoryDb([], organization(), [pendingOrder({ stripeCheckoutSessionId: "cs_hiring" })]);
    external.sessionRetrieve.mockResolvedValue(session({ status, subscription: { id: "sub_hiring" } }));
    await expect(createHiringCheckout(context, 7)).rejects.toMatchObject({ code: "CONFLICT", message: expect.stringContaining("awaiting billing reconciliation") });
    expect(store.tables.hiring_orders[0]).toMatchObject({ status: "pending", stripeSubscriptionId: "sub_hiring" });
    await expect(createHiringCheckout(context, 7)).rejects.toMatchObject({ code: "CONFLICT", message: expect.stringContaining("already connected") });
    expect(external.sessionCreate).not.toHaveBeenCalled(); expect(store.tables.hiring_orders).toHaveLength(1);
  });

  it("does not release an expired session if a subscription binds while its live retrieval is in flight", async () => {
    const store = memoryDb([], organization(), [pendingOrder({ stripeCheckoutSessionId: "cs_hiring" })]);
    external.sessionRetrieve.mockImplementation(async () => {
      store.tables.hiring_orders[0].stripeSubscriptionId = "sub_hiring";
      return session({ status: "expired", url: null });
    });
    await expect(createHiringCheckout(context, 7)).rejects.toMatchObject({ code: "CONFLICT", message: expect.stringContaining("already connected") });
    expect(store.tables.hiring_orders[0]).toMatchObject({ status: "pending", stripeSubscriptionId: "sub_hiring" });
    expect(store.writes).toEqual([]);
  });

  it.each(["checkout_failed", "checkout_expired", "cancelled", "active"])("does not bind, resurrect, or return a URL over a concurrently %s order", async status => {
    const store = memoryDb([], organization(), [pendingOrder()]);
    external.sessionCreate.mockImplementation(async parameters => {
      store.tables.hiring_orders[0].status = status;
      return session({ metadata: parameters.metadata });
    });
    await expect(createHiringCheckout(context, 7)).rejects.toMatchObject({ code: "CONFLICT", message: "The Hiring checkout is no longer pending. Reload billing before retrying." });
    expect(store.tables.hiring_orders[0]).toMatchObject({ status, stripeCheckoutSessionId: null, stripeSubscriptionId: null });
    expect(store.writes).toEqual([]);
  });

  it("preserves a bound subscription when a concurrent terminal event precedes the HTTP response", async () => {
    const store = memoryDb([], organization(), [pendingOrder()]);
    external.sessionCreate.mockImplementation(async parameters => {
      Object.assign(store.tables.hiring_orders[0], { status: "checkout_failed", stripeSubscriptionId: "sub_hiring", stripeCheckoutSessionId: "cs_hiring" });
      return session({ metadata: parameters.metadata, subscription: "sub_hiring" });
    });
    await expect(createHiringCheckout(context, 7)).rejects.toMatchObject({ code: "CONFLICT" });
    expect(store.tables.hiring_orders[0]).toMatchObject({ status: "checkout_failed", stripeSubscriptionId: "sub_hiring", stripeCheckoutSessionId: "cs_hiring" });
    await expect(createHiringCheckout(context, 7)).rejects.toMatchObject({ code: "CONFLICT", message: expect.stringContaining("already connected") });
    expect(store.tables.hiring_orders).toHaveLength(1);
  });

  it("does not release a complete session without a known subscription", async () => {
    const store = memoryDb([], organization(), [pendingOrder({ stripeCheckoutSessionId: "cs_hiring" })]);
    external.sessionRetrieve.mockResolvedValue(session({ status: "complete", subscription: null, url: null }));
    await expect(createHiringCheckout(context, 7)).rejects.toMatchObject({ code: "CONFLICT", message: expect.stringContaining("awaiting billing reconciliation") });
    expect(store.tables.hiring_orders[0].status).toBe("pending"); expect(external.sessionCreate).not.toHaveBeenCalled();
  });
});

describe("independent Hiring billing status", () => {
  it.each(["pending", "checkout_failed", "checkout_expired", "needs_review", "cancelled"])("keeps a bound %s subscription discoverable and cancellable without granting access", async status => {
    const store = memoryDb([], organization(), [{ ...order(), status }]);
    await expect(getHiringStatus(context, 7)).resolves.toMatchObject({ active: false, termId: null, canCancelRenewal: true, billingOrderId: "order_current", billingSubscriptionId: "sub_hiring", billingRenewalCancelled: false, hasBillingSubscription: true });
    await expect(cancelHiringAtPeriodEnd(context, 7)).resolves.toMatchObject({ success: true });
    expect(external.update).toHaveBeenCalledWith("sub_hiring", { cancel_at_period_end: true });
    expect(store.tables.hiring_orders[0]).toMatchObject({ status, renewalCancelled: true });
    await expect(getHiringStatus(context, 7)).resolves.toMatchObject({ active: false, billingRenewalCancelled: true, canCancelRenewal: false });
  });

  it("reports a pilot's access independently from a separate collectible subscription", async () => {
    const pilot = term({ id: "pilot_term", basis: "pilot", sourceSubscriptionId: null, quota: 25 });
    memoryDb([pilot], organization(), [{ ...order(), status: "checkout_failed" }]);
    await expect(getHiringStatus(context, 7)).resolves.toMatchObject({ active: true, basis: "pilot", termId: "pilot_term", sourceSubscriptionId: null, billingOrderId: "order_current", billingSubscriptionId: "sub_hiring", hasBillingSubscription: true, canCancelRenewal: true });
  });

  it("reports absence of billing without changing active pilot access", async () => {
    memoryDb([term({ basis: "pilot", sourceSubscriptionId: null })], organization(), []);
    await expect(getHiringStatus(context, 7)).resolves.toMatchObject({ active: true, basis: "pilot", billingOrderId: null, billingSubscriptionId: null, hasBillingSubscription: false, billingRenewalCancelled: false, canCancelRenewal: false });
  });
});

describe("Hiring checkout conservative retry boundaries", () => {
  it("does not borrow the organization's customer for a pending operation missing its own binding", async () => {
    const store = memoryDb([], organization(), [pendingOrder({ stripeCustomerId: null })]);
    await expect(createHiringCheckout(context, 7)).rejects.toMatchObject({ code: "CONFLICT", message: "Hiring customer binding is unavailable. Reconcile billing before retrying." });
    expect(external.customerCreate).not.toHaveBeenCalled(); expect(external.sessionCreate).not.toHaveBeenCalled(); expect(store.writes).toEqual([]);
  });

  it("reuses a pending operation that appears while customer creation is in flight", async () => {
    const store = memoryDb([], { ...organization(), stripeCustomerId: null }, []);
    external.customerCreate.mockImplementation(async () => {
      expect(store.transactionDepth).toBe(0);
      store.tables.hiring_orders.push(pendingOrder({ stripeCustomerId: "cus_prior", stripeCheckoutSessionId: "cs_hiring" }));
      return { id: "cus_unused" };
    });
    external.sessionRetrieve.mockResolvedValue(session({ customer: "cus_prior" }));
    await expect(createHiringCheckout(context, 7)).resolves.toMatchObject({ orderId: "order_current" });
    expect(store.tables.organizations[0].stripeCustomerId).toBe("cus_prior");
    expect(store.tables.hiring_orders).toHaveLength(1); expect(external.sessionCreate).not.toHaveBeenCalled();
  });

  it("uses the pending customer's binding rather than an unrelated organization customer", async () => {
    const store = memoryDb([], { ...organization(), stripeCustomerId: "cus_org_other" }, [pendingOrder({ stripeCheckoutSessionId: "cs_hiring" })]);
    await expect(createHiringCheckout(context, 7)).resolves.toEqual({ orderId: "order_current", url: session().url });
    expect(store.tables.organizations[0].stripeCustomerId).toBe("cus_org_other");
    expect(external.customerCreate).not.toHaveBeenCalled(); expect(external.sessionCreate).not.toHaveBeenCalled();
  });

  it("does not retry an old unbound operation with a possibly aged-out Stripe idempotency key", async () => {
    const store = memoryDb([], organization(), [pendingOrder({ createdAtMs: NOW - 23 * 60 * 60 * 1000 })]);
    await expect(createHiringCheckout(context, 7)).rejects.toMatchObject({ code: "CONFLICT", message: "The earlier Hiring checkout needs billing reconciliation before retrying." });
    expect(external.sessionCreate).not.toHaveBeenCalled(); expect(store.writes).toEqual([]);
  });

  it("retrieves a known old session and confirms expiry instead of assuming age means it is safe to replace", async () => {
    const store = memoryDb([], organization(), [pendingOrder({ createdAtMs: NOW - 25 * 60 * 60 * 1000, stripeCheckoutSessionId: "cs_hiring" })]);
    external.sessionRetrieve.mockResolvedValue(session({ status: "expired", url: null }));
    await expect(createHiringCheckout(context, 7)).rejects.toMatchObject({ code: "CONFLICT", message: expect.stringContaining("Retry to start a new checkout") });
    expect(store.tables.hiring_orders[0].status).toBe("checkout_expired"); expect(external.sessionCreate).not.toHaveBeenCalled();
  });

  it("does not release a stored session when live retrieval fails ambiguously", async () => {
    const store = memoryDb([], organization(), [pendingOrder({ stripeCheckoutSessionId: "cs_hiring" })]);
    external.sessionRetrieve.mockRejectedValue(new Error("synthetic timeout"));
    await expect(createHiringCheckout(context, 7)).rejects.toMatchObject({ code: "SERVICE_UNAVAILABLE", message: expect.not.stringContaining("No subscription was activated") });
    expect(store.tables.hiring_orders[0]).toMatchObject({ status: "pending", stripeCheckoutSessionId: "cs_hiring" });
    expect(store.writes).toEqual([]); expect(external.sessionCreate).not.toHaveBeenCalled();
  });

  it("does not return a URL or save a session if ownership changes during the Stripe request", async () => {
    const store = memoryDb([], organization(), [pendingOrder()]);
    external.sessionCreate.mockImplementation(async parameters => {
      store.tables.organizations[0].managerEmail = "new-owner@example.test";
      return session({ metadata: parameters.metadata });
    });
    await expect(createHiringCheckout(context, 7)).rejects.toMatchObject({ code: "FORBIDDEN", message: "Organization ownership changed. Reload billing." });
    expect(store.tables.hiring_orders[0]).toMatchObject({ status: "pending", stripeCheckoutSessionId: null }); expect(store.writes).toEqual([]);
  });
});
