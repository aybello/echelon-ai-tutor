import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
const { getDb } = vi.hoisted(() => ({ getDb: vi.fn() }));
vi.mock("../db", () => ({ getDb }));
import { managerOrganizationIsCurrent, resolveManagedOrganization } from "./resolveManagerOrganization";
import { flexLicenceIsVisibleInManagerReport, flexLicenceKeepsManagerAccess } from "./flexReporting";
import { resolveFlexEmailState } from "../_core/access";
const now = new Date("2026-10-17T12:00:00Z");
const future = new Date(now.getTime() + 1);
const past = new Date(now.getTime() - 1);
const org = (overrides = {}) => ({ id: 7, managerEmail: "manager@example.test", status: "active", billingType: "course-pass", termEnd: past, createdAt: past, ...overrides });
const licence = (overrides = {}) => ({ organizationId: 7, status: "expired", accessEndsAt: past, reportingEndsAt: future, activationDeadline: past, ...overrides });
function database(rows: any[], licences: any[]) {
  const where = vi.fn().mockResolvedValueOnce(rows).mockResolvedValueOnce(licences);
  const db = { select: vi.fn(() => ({ from: vi.fn(() => ({ where })) })) };
  getDb.mockResolvedValue(db);
  return db;
}
beforeEach(() => { vi.useFakeTimers({ toFake: ["Date"] }); vi.setSystemTime(now); });
afterEach(() => { vi.useRealTimers(); vi.clearAllMocks(); });
describe("paid manager administration lifecycle", () => {
  it.each(["course-pass", "stripe", "invoice"])("retains %s managers through a paid Flex reporting window", billingType => {
    expect(managerOrganizationIsCurrent(org({ billingType }), now, [licence()])).toBe(true);
  });
  it.each(["unused", "invited", "assigned"])("retains late top-up %s inventory until its activation deadline", status => {
    expect(managerOrganizationIsCurrent(org(), now, [licence({ status, reportingEndsAt: null, activationDeadline: future })])).toBe(true);
    expect(managerOrganizationIsCurrent(org(), now, [licence({ status, reportingEndsAt: null, activationDeadline: past })])).toBe(false);
  });
  it("handles reporting and activation exact boundaries without extending them", () => {
    expect(flexLicenceKeepsManagerAccess(licence({ reportingEndsAt: now }), now)).toBe(true);
    expect(flexLicenceKeepsManagerAccess(licence({ reportingEndsAt: past }), now)).toBe(false);
    expect(flexLicenceKeepsManagerAccess(licence({ status: "assigned", activationDeadline: now }), now)).toBe(true);
  });
  it("retains active study even if a legacy pass has no reporting end", () => {
    expect(managerOrganizationIsCurrent(org(), now, [licence({ status: "active", accessEndsAt: future, reportingEndsAt: null })])).toBe(true);
  });
  it.each(["cancelled", "pending", "checkout_failed"])("does not restore %s organizations", status => {
    expect(managerOrganizationIsCurrent(org({ status }), now, [licence()])).toBe(false);
  });
  it.each(["revoked", "suspended", "refunded"])("does not use %s passes to extend manager access", status => {
    expect(managerOrganizationIsCurrent(org(), now, [licence({ status })])).toBe(false);
  });
  it("keeps annual expiry unchanged without paid Flex inventory", () => {
    expect(managerOrganizationIsCurrent(org({ billingType: "stripe", termEnd: now }), now)).toBe(false);
    expect(managerOrganizationIsCurrent(org({ billingType: "stripe", termEnd: future }), now)).toBe(true);
  });
  it("resolves owned expired-term mixed-plan reporting without mutating any entitlement", async () => {
    const row = org({ billingType: "stripe" });
    const db = database([row], [licence()]);
    await expect(resolveManagedOrganization({ user: null, studentEmail: row.managerEmail }, { orgId: 7 })).resolves.toEqual(row);
    expect(Object.keys(db)).toEqual(["select"]);
    expect(resolveFlexEmailState([{ ...licence(), courseKey: "class1-water", startsAt: past } as any], now).activeCourseKeys).toEqual([]);
    expect(resolveFlexEmailState([{ ...licence({ status: "active" }), courseKey: "class1-water", startsAt: past } as any], now).activeCourseKeys).toEqual([]);
  });
  it("never treats a client org ID as ownership", async () => {
    database([org()], [licence()]);
    await expect(resolveManagedOrganization({ user: null, studentEmail: "manager@example.test" }, { orgId: 8 })).rejects.toMatchObject({ code: "FORBIDDEN" });
  });
  it("requires explicit selection when multiple owned teams remain eligible", async () => {
    database([org(), org({ id: 8, termEnd: future })], [licence()]);
    await expect(resolveManagedOrganization({ user: null, studentEmail: "manager@example.test" })).rejects.toMatchObject({ code: "CONFLICT" });
  });
  it("does not substitute the OTP email for a different authenticated OAuth identity", async () => {
    database([], []);
    await expect(resolveManagedOrganization({ user: { id: 1, email: "other@example.test" }, studentEmail: "manager@example.test" })).rejects.toMatchObject({ code: "UNAUTHORIZED" });
  });
});
describe("reporting grace visibility", () => {
  it("retains expired activated passes and elapsed active passes until reporting end", () => {
    expect(flexLicenceIsVisibleInManagerReport(licence(), now)).toBe(true);
    expect(flexLicenceIsVisibleInManagerReport(licence({ status: "active" }), now)).toBe(true);
    expect(flexLicenceIsVisibleInManagerReport(licence({ reportingEndsAt: past }), now)).toBe(false);
  });
  it("does not include expired unactivated passes or revoked/suspended history", () => {
    expect(flexLicenceIsVisibleInManagerReport(licence({ reportingEndsAt: null }), now)).toBe(false);
    for (const status of ["revoked", "suspended"]) expect(flexLicenceIsVisibleInManagerReport(licence({ status }), now)).toBe(false);
  });
});
