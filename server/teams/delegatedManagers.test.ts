import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { getTableName } from "drizzle-orm";
import { MySqlDialect } from "drizzle-orm/mysql-core";
import { organizations, organizationMembers, organizationTermUsage, subscriptions, purchases, teamFlexLicences } from "../../drizzle/schema";

const state = vi.hoisted(() => ({ db: null as any, send: vi.fn(), otp: vi.fn(), portal: vi.fn(), updateStripe: vi.fn(), session: vi.fn(), token: vi.fn() }));
vi.mock("../db", () => ({ getDb: async () => state.db }));
vi.mock("../email", () => ({ sendTeamEnrollmentEmail: state.send, sendOperatorStudyReminderEmail: state.send, sendOtpEmail: state.otp }));
vi.mock("../analytics", () => ({ trackEvent: vi.fn(), hashAnalyticsAnonymousId: vi.fn() }));
vi.mock("../stripe/stripe", () => ({ stripe: { billingPortal: { sessions: { create: state.portal } }, subscriptions: { update: state.updateStripe } } }));
vi.mock("../_core/emailSession", () => ({ issueVerifiedEmailSessionCookie: state.session }));
vi.mock("../_core/subscriptionToken", () => ({ issueSubscriptionToken: state.token }));
// Claim concurrency is covered by emailOtp.test.ts; this suite exercises live entitlement rechecks.
vi.mock("../auth/atomicVerification", () => ({ verifyAndConsumeOtp: async () => ({ valid: true }) }));
import { orgRouter, orgIntelRouter } from "../routers/orgRouter";
import { stripeRouter } from "../routers/stripeRouter";
import { emailOtpRouter } from "../routers/emailOtpRouter";
import { listManagedOrganizations, resolveManagedOrganization } from "./resolveManagerOrganization";
import { resolveEntitlementsByEmail } from "../_core/access";
import { resolveTeamAccess } from "./resolveTeamAccess";

const NOW = new Date("2026-11-12T20:00:00Z");
const future = new Date("2027-11-12T20:00:00Z");
const owner = "owner@example.test";
const delegate = "delegate@example.test";
const ctx = (email: string | null = owner) => ({ user: null, studentEmail: email, req: { headers: {}, cookies: {} }, res: {} }) as any;
const caller = (email = owner) => orgRouter.createCaller(ctx(email));
let data: Map<string, any[]>;
const rows = (table: any) => {
  const name = getTableName(table);
  if (!data.has(name)) data.set(name, []);
  return data.get(name)!;
};
function member(email = delegate, overrides = {}) {
  const row = { id: rows(organizationMembers).length + 1, orgId: 1, email, name: null, role: "delegated_manager", status: "assigned", courseKey: null, courseKeys: null, assignedAt: NOW, revokedAt: null, reminderOptOut: false, lastRemindedAt: null, ...overrides };
  rows(organizationMembers).push(row); return row;
}
function organization(overrides = {}) {
  const row = { id: 1, name: "Synthetic utility", managerEmail: owner, status: "active", billingType: "stripe", seatsTotal: 10, tier: "all-access", province: "ontario", termStart: NOW, termEnd: future, createdAt: NOW, stripeCustomerId: "cus_synthetic", stripeSubscriptionId: "sub_synthetic", ...overrides };
  rows(organizations).push(row); return row;
}

/** Fully mocked Drizzle builder. Evaluates predicates on JS rows, not a SQL engine. */
function mockedDatabase() {
  const dialect = new MySqlDialect();
  function matches(condition: any, tables: Record<string, any>) {
    if (!condition) return true;
    const { sql, params } = dialect.sqlToQuery(condition);
    let i = 0;
    const checks: boolean[] = [];
    const pattern = /`([^`]+)`\.`([^`]+)`\s*(is null|in\s*\([^)]*\)|=\s*\?|>\s*\?)/gi;
    for (const match of sql.matchAll(pattern)) {
      const value = tables[match[1]]?.[match[2]];
      const op = match[3].toLowerCase();
      if (op === "is null") checks.push(value == null);
      else if (op.startsWith("in")) { const n = (op.match(/\?/g) ?? []).length; checks.push(params.slice(i, i + n).includes(value)); i += n; }
      else { const expected = params[i++]; const actual = value instanceof Date ? value.getTime() : value;
        const target: any = value instanceof Date ? new Date(`${expected}Z`).getTime() : expected;
        checks.push(op.startsWith(">") ? actual > target : actual === target); }
    }
    if (!checks.length) throw new Error(`Unsupported mocked predicate: ${sql}`);
    return checks.every(Boolean);
  }
  const db: any = {
    execute: vi.fn(async () => []),
    select: (projection?: any) => ({ from: (table: any) => {
      const name = getTableName(table); let joined: any; let condition: any;
      const result = () => {
        const source: Record<string, any>[] = rows(table).flatMap(row => joined ? rows(joined).filter(other => row.orgId === other.id).map(other => ({ [name]: row, [getTableName(joined)]: other })) : [{ [name]: row }]);
        const filtered = source.filter(tables => matches(condition, tables));
        if (projection?.usageCount || projection?.cnt) return [{ usageCount: filtered.length, cnt: filtered.length }];
        return filtered.map(tables => !projection ? { ...tables[name] } : Object.fromEntries(Object.entries(projection).map(([key, column]: [string, any]) => {
          if (column === organizations) return [key, { ...tables.organizations }];
          const columnTable = column?.table ? getTableName(column.table) : name;
          return [key, tables[columnTable]?.[column?.name]];
        })));
      };
      const query: any = { innerJoin: (t: any) => { joined = t; return query; }, where: (c: any) => { condition = c; return query; },
        limit: (n: number) => Promise.resolve(result().slice(0, n)), orderBy: () => query, groupBy: () => query,
        then: (resolve: any, reject: any) => Promise.resolve().then(result).then(resolve, reject) };
      return query;
    } }),
    insert: (table: any) => ({ values: async (values: any) => { const list = Array.isArray(values) ? values : [values];
      for (const row of list) rows(table).push({ id: rows(table).length + 1, courseKey: null, courseKeys: null, revokedAt: null, assignedAt: NOW, ...row }); } }),
    update: (table: any) => ({ set: (values: any) => ({ where: async (condition: any) => {
      for (const row of rows(table)) if (matches(condition, { [getTableName(table)]: row })) Object.assign(row, values);
      return [{ affectedRows: 1 }];
    } }) }),
    transaction: async (run: any) => { const before = structuredClone(data); try { return await run(db); } catch (error) { data = before; throw error; } },
  };
  return db;
}
const snapshot = () => structuredClone({ members: rows(organizationMembers), usage: rows(organizationTermUsage), subs: rows(subscriptions), orgs: rows(organizations) });
beforeEach(() => {
  vi.useFakeTimers({ toFake: ["Date"] }); vi.setSystemTime(NOW);
  data = new Map();
  for (const table of [organizations, organizationMembers, organizationTermUsage, subscriptions, purchases, teamFlexLicences]) data.set(getTableName(table), []);
  state.db = mockedDatabase(); organization();
  for (const mock of [state.send, state.otp, state.portal, state.updateStripe, state.session, state.token]) mock.mockReset().mockResolvedValue(undefined);
});
afterEach(() => { vi.useRealTimers(); state.db = null; });

describe("delegated discovery and login (fully mocked)", () => {
  it("keeps the primary owner authoritative without a membership row", async () => {
    expect((await resolveManagedOrganization(ctx()))?.id).toBe(1);
    expect((await resolveEntitlementsByEmail(owner)).isManager).toBe(true);
  });
  it("discovers an assigned delegate and permits OTP without study keys or a subscription", async () => {
    member();
    expect((await listManagedOrganizations(ctx(delegate))).map(row => row.id)).toEqual([1]);
    expect((await resolveManagedOrganization(ctx(delegate), { orgId: 1 }))?.id).toBe(1);
    await expect(resolveEntitlementsByEmail(delegate)).resolves.toMatchObject({ isManager: true, hasAnyAccess: true, unlockedExamTypes: [], activeSubscriptionRows: [] });
    await expect(emailOtpRouter.createCaller(ctx(null)).requestOtp({ email: delegate })).resolves.toEqual({ sent: true });
    expect(state.otp).toHaveBeenCalledWith(expect.objectContaining({ email: delegate }));
    // Claim concurrency has separate regression coverage; the real verifier rechecks live entitlements here.
    expect(await emailOtpRouter.createCaller(ctx(null)).verifyOtp({ email: delegate, code: "123456" })).toMatchObject({ valid: true, isManager: true, examTypes: [], accessToken: "" });
    expect(state.session).toHaveBeenCalledWith(expect.anything(), delegate); expect(state.token).not.toHaveBeenCalled();
    expect(rows(subscriptions)).toEqual([]); expect(rows(organizationTermUsage)).toEqual([]);
  });
  it.each(["manager", "operator", "unknown"])("never trusts legacy/nonmanager role %s", async role => {
    member(delegate, { role });
    expect(await listManagedOrganizations(ctx(delegate))).toEqual([]);
    expect((await resolveEntitlementsByEmail(delegate)).isManager).toBe(false);
    await expect(resolveManagedOrganization(ctx(delegate), { orgId: 1 })).rejects.toMatchObject({ code: "FORBIDDEN" });
  });
  it.each(["revoked", "pending", "cancelled", "expired"])("denies a %s delegate on live checks", async status => {
    member(delegate, { status });
    expect((await resolveEntitlementsByEmail(delegate)).isManager).toBe(false);
    expect(await listManagedOrganizations(ctx(delegate))).toEqual([]);
    await emailOtpRouter.createCaller(ctx(null)).requestOtp({ email: delegate }); expect(state.otp).not.toHaveBeenCalled();
  });
  it.each(["pending", "checkout_failed", "cancelled", "expired"])("denies delegate discovery in a %s organization", async status => {
    member(); rows(organizations)[0].status = status;
    expect(await listManagedOrganizations(ctx(delegate))).toEqual([]);
    expect((await resolveEntitlementsByEmail(delegate)).isManager).toBe(false);
  });
  it("denies expired Annual terms at the exact boundary", async () => {
    member(); rows(organizations)[0].termEnd = NOW;
    expect((await resolveEntitlementsByEmail(delegate)).isManager).toBe(false);
    expect(await listManagedOrganizations(ctx(delegate))).toEqual([]);
  });
  it("retains a paid reporting window for delegates without extending Annual learner assignment", async () => {
    member(); rows(organizations)[0].termEnd = NOW;
    rows(teamFlexLicences).push({ organizationId: 1, status: "expired", activationDeadline: NOW, accessEndsAt: NOW, reportingEndsAt: future });
    expect((await resolveEntitlementsByEmail(delegate)).isManager).toBe(true);
    expect((await resolveManagedOrganization(ctx(delegate), { orgId: 1 }))?.id).toBe(1);
    await expect(caller(delegate).assignSeat({ orgId: 1, email: "op@example.test", courseKeys: ["class1-water"] })).rejects.toMatchObject({ code: "FORBIDDEN" });
    expect(rows(organizationTermUsage)).toEqual([]);
  });
  it("preserves past_due delegate access during the live term", async () => {
    member(); rows(organizations)[0].status = "past_due";
    expect((await resolveEntitlementsByEmail(delegate)).isManager).toBe(true);
    expect((await resolveManagedOrganization(ctx(delegate), { orgId: 1 }))?.id).toBe(1);
  });
  it("requires the current chooser for multiple orgs and refuses foreign selection", async () => {
    member(); organization({ id: 2, managerEmail: "other-owner@example.test" }); member(delegate, { orgId: 2 });
    expect((await listManagedOrganizations(ctx(delegate))).map(row => row.id)).toEqual([2, 1]);
    await expect(resolveManagedOrganization(ctx(delegate))).rejects.toMatchObject({ code: "CONFLICT" });
    expect((await resolveManagedOrganization(ctx(delegate), { orgId: 2 }))?.id).toBe(2);
    await expect(caller(delegate).assignSeat({ orgId: 3, email: "op@example.test", courseKeys: ["class1-water"] })).rejects.toMatchObject({ code: "FORBIDDEN" });
  });
  it("OAuth identity never falls through to a simultaneous delegated OTP identity", async () => {
    member();
    await expect(resolveManagedOrganization({ ...ctx(delegate), user: { id: 9, email: "outsider@example.test" } }, { orgId: 1 })).rejects.toMatchObject({ code: "FORBIDDEN" });
  });
  it.each([{ courseKey: "class1-water" }, { courseKeys: '["class1-water"]' }])("denies malformed course-bearing delegates %j in both study resolvers", async fields => {
    member(delegate, fields);
    expect((await resolveEntitlementsByEmail(delegate))).toMatchObject({ isManager: false, unlockedExamTypes: [] });
    expect((await resolveTeamAccess(null, delegate, "class1-water")).hasAccess).toBe(false);
    expect(await listManagedOrganizations(ctx(delegate))).toEqual([]);
  });
});

describe("owner-only delegation, billing and the shared Annual ledger", () => {
  it("normalizes idempotent additions without consuming seats or altering the owner", async () => {
    const input = { orgId: 1, email: "DELEGATE@example.test", name: "Synthetic manager" };
    await caller().addDelegatedManager(input); const before = snapshot(); await caller().addDelegatedManager(input);
    expect(snapshot()).toEqual(before); expect(rows(organizationMembers)).toHaveLength(1);
    expect(rows(organizationMembers)[0]).toMatchObject({ role: "delegated_manager", status: "assigned", courseKey: null, courseKeys: null });
    expect(rows(organizationTermUsage)).toEqual([]); expect(rows(subscriptions)).toEqual([]);
    expect(rows(organizations)[0]).toMatchObject({ managerEmail: owner, seatsTotal: 10 });
    expect(await caller().listDelegatedManagers({ orgId: 1 })).toHaveLength(1);
    expect(state.send).not.toHaveBeenCalled();
  });
  it("permits delegated roster/report access and reminders only for operators, never delegate recipients", async () => {
    member(); member("op@example.test", { role: "operator", courseKey: "class1-water" });
    expect((await caller(delegate).listMembers({ orgId: 1 })).map(row => row.email)).toEqual(["op@example.test"]);
    const intel = orgIntelRouter.createCaller(ctx(delegate));
    expect((await intel.exportTeamCSV({ orgId: 1 })).csv).toContain("op@example.test");
    expect((await intel.exportTeamCSV({ orgId: 1 })).csv).not.toContain(delegate);
    await expect(intel.sendOperatorReminder({ orgId: 1, email: delegate })).rejects.toMatchObject({ code: "NOT_FOUND" });
    expect(state.send).not.toHaveBeenCalled();
    await intel.sendOperatorReminder({ orgId: 1, email: "op@example.test" });
    expect(state.send).toHaveBeenCalledWith(expect.objectContaining({ email: "op@example.test", managerEmail: delegate }));
    expect(rows(organizationTermUsage)).toEqual([]);
  });
  it("keeps primary-owner team billing and unchanged quantities working", async () => {
    state.portal.mockResolvedValueOnce({ url: "https://billing.example.test" });
    const billing = stripeRouter.createCaller(ctx());
    expect(await billing.createBillingPortalSession({ scope: "team", orgId: 1 })).toEqual({ url: "https://billing.example.test" });
    expect(state.portal).toHaveBeenCalledWith(expect.objectContaining({ customer: "cus_synthetic" }));
    expect(await billing.updateTeamSeats({ orgId: 1, seats: 10 })).toMatchObject({ success: true, seats: 10, unchanged: true });
    expect(state.updateStripe).not.toHaveBeenCalled();
  });
  it.each(["operator", "manager", "delegated_manager"])("rejects unsafe existing %s membership without mutation", async role => {
    member(delegate, { role, status: "revoked", courseKey: "class1-water" }); const before = snapshot();
    await expect(caller().addDelegatedManager({ orgId: 1, email: delegate })).rejects.toMatchObject({ code: "CONFLICT" });
    expect(snapshot()).toEqual(before);
  });
  it("rejects even a revoked, empty-course operator without promoting its paid history", async () => {
    member(delegate, { role: "operator", status: "revoked" });
    rows(organizationTermUsage).push({ id: 1, orgId: 1, memberEmail: delegate, termStart: NOW, termEnd: future }); const before = snapshot();
    await expect(caller().addDelegatedManager({ orgId: 1, email: delegate })).rejects.toMatchObject({ code: "CONFLICT" });
    expect(snapshot()).toEqual(before);
  });
  it.each(["usage", "subscription"])("rejects orphaned paid %s history", async kind => {
    if (kind === "usage") rows(organizationTermUsage).push({ id: 1, orgId: 1, memberEmail: delegate });
    else rows(subscriptions).push({ id: 1, orgId: 1, email: delegate });
    const before = snapshot(); await expect(caller().addDelegatedManager({ orgId: 1, email: delegate })).rejects.toMatchObject({ code: "CONFLICT" }); expect(snapshot()).toEqual(before);
  });
  it("revokes only delegation, immediately removes access, and permits owner re-addition", async () => {
    member(); await caller().removeDelegatedManager({ orgId: 1, email: delegate });
    expect(rows(organizationMembers)[0]).toMatchObject({ status: "revoked", revokedAt: NOW });
    expect((await resolveEntitlementsByEmail(delegate)).isManager).toBe(false);
    await expect(caller(delegate).listMembers({ orgId: 1 })).rejects.toMatchObject({ code: "FORBIDDEN" });
    await caller().removeDelegatedManager({ orgId: 1, email: delegate }); await caller().addDelegatedManager({ orgId: 1, email: delegate });
    expect(rows(organizationMembers)).toHaveLength(1); expect(rows(organizationMembers)[0].status).toBe("assigned");
    expect(rows(organizationTermUsage)).toEqual([]); expect(rows(subscriptions)).toEqual([]);
  });
  it.each(["add", "remove"])("cannot %s the owner via delegation", async operation => {
    const pending = operation === "add" ? caller().addDelegatedManager({ orgId: 1, email: owner }) : caller().removeDelegatedManager({ orgId: 1, email: owner });
    await expect(pending).rejects.toMatchObject({ code: "BAD_REQUEST" }); expect(rows(organizations)[0].managerEmail).toBe(owner);
  });
  it.each([delegate, "legacy@example.test", "outsider@example.test"])("denies manager administration and team billing to %s", async email => {
    member(); member("legacy@example.test", { role: "manager" }); const before = snapshot();
    await expect(caller(email).listDelegatedManagers({ orgId: 1 })).rejects.toMatchObject({ code: "FORBIDDEN" });
    await expect(caller(email).addDelegatedManager({ orgId: 1, email: "new@example.test" })).rejects.toMatchObject({ code: "FORBIDDEN" });
    await expect(caller(email).removeDelegatedManager({ orgId: 1, email: delegate })).rejects.toMatchObject({ code: "FORBIDDEN" });
    const billing = stripeRouter.createCaller(ctx(email));
    await expect(billing.createBillingPortalSession({ scope: "team", orgId: 1 })).rejects.toMatchObject({ code: "FORBIDDEN" });
    await expect(billing.updateTeamSeats({ orgId: 1, seats: 15 })).rejects.toMatchObject({ code: "FORBIDDEN" });
    expect(state.portal).not.toHaveBeenCalled(); expect(state.updateStripe).not.toHaveBeenCalled(); expect(snapshot()).toEqual(before);
  });
  it("owner and multiple delegates assign from exactly the same named ten-operator ledger", async () => {
    member(); member("second@example.test");
    await caller(delegate).assignSeat({ orgId: 1, email: "op1@example.test", courseKeys: ["class1-water"] });
    await caller("second@example.test").assignSeats({ orgId: 1, emails: Array.from({ length: 9 }, (_, i) => `op${i + 2}@example.test`), courseKeys: ["class1-water"] });
    expect(rows(organizationTermUsage)).toHaveLength(10); expect(rows(organizationTermUsage).every(row => row.orgId === 1)).toBe(true);
    expect(rows(subscriptions)).toHaveLength(10); expect(rows(organizationMembers).filter(row => row.role === "operator")).toHaveLength(10);
    const before = snapshot(); await expect(caller().assignSeat({ orgId: 1, email: "op11@example.test", courseKeys: ["class1-water"] })).rejects.toThrow("limit reached"); expect(snapshot()).toEqual(before);
    await caller(delegate).revokeSeat({ orgId: 1, email: "op1@example.test" });
    await caller("second@example.test").assignSeat({ orgId: 1, email: "op1@example.test", courseKeys: ["class1-water"] });
    expect(rows(organizationTermUsage)).toHaveLength(10); expect(rows(organizations)[0].seatsTotal).toBe(10);
  });
  it.each(["assigned", "revoked"])("single/bulk operator assignment cannot overwrite a %s delegate or consume any licence", async status => {
    member(delegate, { status }); const before = snapshot();
    await expect(caller().assignSeat({ orgId: 1, email: delegate, courseKeys: ["class1-water"] })).rejects.toMatchObject({ code: "CONFLICT" });
    await expect(caller().assignSeats({ orgId: 1, emails: ["op@example.test", delegate], courseKeys: ["class1-water"] })).rejects.toMatchObject({ code: "CONFLICT" });
    expect(snapshot()).toEqual(before); expect(state.send).not.toHaveBeenCalled();
  });
  it("preserves legitimate separate primary-owner operator study access", async () => {
    member(owner, { role: "operator", courseKey: "class1-water" });
    expect((await resolveEntitlementsByEmail(owner))).toMatchObject({ isManager: true, unlockedExamTypes: ["class1-water"] });
    expect((await resolveTeamAccess(null, owner, "class1-water")).hasAccess).toBe(true);
  });
});
