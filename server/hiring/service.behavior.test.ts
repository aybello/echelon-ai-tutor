import { getTableName, sql, type SQL } from "drizzle-orm";
import { MySqlDialect } from "drizzle-orm/mysql-core";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { TrpcContext } from "../_core/context";

const external = vi.hoisted(() => ({ getDb: vi.fn(), retrieve: vi.fn(), update: vi.fn() }));
vi.mock("../db", () => ({ getDb: external.getDb }));
vi.mock("../stripe/stripe", () => ({ stripe: { subscriptions: { retrieve: external.retrieve, update: external.update } } }));
vi.mock("../_core/env", () => ({ ENV: { appBaseUrl: "http://127.0.0.1:3000" } }));
// Avoid importing unrelated access-token services. Use canonical, real normalization.
vi.mock("../_core/accessService", async () => ({ normalizeEmail: (await import("../_core/access")).normalizeEmail }));
import { cancelHiringAtPeriodEnd, getHiringStatus } from "./service";
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

/** Evaluate the actual Drizzle SQL predicates, rather than queueing predetermined rows.
 * This is a query/read-write spy, not an assertion of real MySQL isolation. */
function memoryDb(terms: Row[] = [], org: Row = organization()) {
  const dialect = new MySqlDialect();
  const tables: Record<string, Row[]> = { organizations: [org], hiring_terms: structuredClone(terms), hiring_orders: [order(), order("order_old", "sub_old")], organization_members: [], team_flex_licences: [] };
  const reads: { table: string; predicate: string; params: unknown[]; order: string[] }[] = [];
  const writes: { table: string; values: Row }[] = [];
  function matches(condition: SQL, row: Row) {
    const query = dialect.sqlToQuery(condition);
    let index = 0;
    const checks = [...query.sql.matchAll(/`[^`]+`\.`([^`]+)`\s*(in\s*\(([^)]*)\)|(=|>|<=)\s*\?|is not null)/g)].map(match => {
      const value = row[match[1]];
      if (/is not null/i.test(match[2])) return value != null;
      if (match[3] !== undefined) {
        const count = [...match[3].matchAll(/\?/g)].length;
        const accepted = query.params.slice(index, index + count); index += count;
        return accepted.includes(value);
      }
      const expected: any = query.params[index++];
      return match[4] === "=" ? value === expected : match[4] === ">" ? value > expected : value <= expected;
    });
    if (index !== query.params.length || !checks.length) throw new Error(`Unsupported mocked SQL: ${query.sql}`);
    return checks.every(Boolean);
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
      if (name !== "hiring_terms" && name !== "hiring_orders") throw new Error(`Forbidden learner/organization write: ${name}`);
      tables[name].filter(row => matches(predicate, row)).forEach(row => Object.assign(row, values));
    } }) })),
    insert: vi.fn(() => { throw new Error("Unexpected insert in status/cancellation"); }),
    delete: vi.fn(() => { throw new Error("Unexpected delete in status/cancellation"); }),
  };
  const transactionalDb = { ...db, transaction: vi.fn(async (work: (tx: typeof db) => Promise<any>) => {
    const snapshot = structuredClone(tables);
    try { return await work(db); }
    catch (error) { for (const name of Object.keys(tables)) tables[name] = snapshot[name]; throw error; }
  }) };
  external.getDb.mockResolvedValue(transactionalDb);
  return { db: transactionalDb, tables, reads, writes };
}

beforeEach(() => {
  vi.resetAllMocks(); vi.useFakeTimers(); vi.setSystemTime(NOW);
  external.retrieve.mockResolvedValue(subscription()); external.update.mockResolvedValue(subscription({ cancel_at_period_end: true }));
});
afterEach(() => vi.useRealTimers());

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
