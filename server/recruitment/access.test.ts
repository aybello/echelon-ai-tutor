import { TRPCError } from "@trpc/server";
import { MySqlDialect } from "drizzle-orm/mysql-core";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { Organization, OrganizationMember, RecruitmentAssignmentRow } from "../../drizzle/schema";
import type { TrpcContext } from "../_core/context";
import type { RecruitmentReadDb } from "./types";

const mocks = vi.hoisted(() => ({ assertAccess: vi.fn(), resolveManagedOrganization: vi.fn() }));
vi.mock("../_core/accessService", async original => ({ ...await original<typeof import("../_core/accessService")>(), assertAccess: mocks.assertAccess }));
vi.mock("../teams/resolveManagerOrganization", () => ({ resolveManagedOrganization: mocks.resolveManagedOrganization }));
import { assertCurrentAnnualOrganization, assertRecruitmentCandidate, assertRecruitmentSeat, recruitmentCourseForOrg, recruitmentManager, recruitmentSeatCourses, recruitmentSubscriptionCovers, verifiedRecruitmentEmail, type RecruitmentSubscription } from "./access";

const NOW = Date.parse("2026-11-27T19:00:00Z");
const EMAIL = "candidate@example.test";
const KEY = "class2-water";
const org = () => ({ id: 7, name: "Synthetic utility", province: "ontario", tier: "all-access", billingType: "stripe", status: "active", termStart: new Date(NOW - 1000), termEnd: new Date(NOW + 86400000), managerEmail: "manager@example.test" } as Organization);
const member = () => ({ id: 31, orgId: 7, email: EMAIL, role: "operator", status: "assigned", courseKey: KEY, courseKeys: null } as OrganizationMember);
const sub = () => ({ orgId: 7, email: EMAIL, tier: "class2", province: "ontario", status: "active", currentPeriodStart: new Date(NOW - 1000), currentPeriodEnd: new Date(NOW + 86400000), stripeSubscriptionId: `org-7-${EMAIL}-${KEY}` } as RecruitmentSubscription);
// Model the persisted migration defaults, not a partial pre-migration object.
const assignment = () => ({ id: "11111111-1111-4111-8111-111111111111", orgId: 7, memberId: 31, accessKind: "training-seat", grantId: null, candidateEmail: EMAIL, status: "active" } as RecruitmentAssignmentRow);
const ctx = (email: string | null = EMAIL, userEmail?: string | null) => ({ user: userEmail !== undefined ? { id: 101, email: userEmail } : null, studentEmail: email, req: {}, res: {} } as unknown as TrpcContext);

function queuedReadDb(rows: unknown[][]) {
  const predicates: unknown[] = [];
  const select = vi.fn(() => ({ from: vi.fn(() => ({ where: vi.fn((condition: unknown) => {
    predicates.push(condition);
    const result = rows.shift() ?? [];
    const promise = Promise.resolve(result);
    return Object.assign(promise, { limit: vi.fn(async () => result) });
  }) })) }));
  return { db: { select } as unknown as RecruitmentReadDb, select, predicates };
}

beforeEach(() => { vi.clearAllMocks(); vi.useFakeTimers(); vi.setSystemTime(NOW); mocks.assertAccess.mockResolvedValue(undefined); mocks.resolveManagedOrganization.mockResolvedValue(org()); });
afterEach(() => vi.useRealTimers());

describe("recruitment verified identity and manager scope", () => {
  it("rejects anonymous identity instead of accepting an assignment link as authorization", () => {
    expect(() => verifiedRecruitmentEmail(ctx(null))).toThrowError(expect.objectContaining({ code: "UNAUTHORIZED" }));
  });
  it("normalizes verified OTP and OAuth email, with OAuth taking precedence", () => {
    expect(verifiedRecruitmentEmail(ctx(" CANDIDATE@EXAMPLE.TEST "))).toBe(EMAIL);
    expect(verifiedRecruitmentEmail(ctx("other@example.test", " CANDIDATE@EXAMPLE.TEST "))).toBe(EMAIL);
    expect(() => verifiedRecruitmentEmail(ctx(EMAIL, null))).toThrowError(expect.objectContaining({ code: "UNAUTHORIZED" }));
  });
  it("cross-organization manager denial propagates without fallback to a default organization", async () => {
    mocks.resolveManagedOrganization.mockRejectedValue(new TRPCError({ code: "FORBIDDEN", message: "Not this organization's manager" }));
    const context = ctx("manager@example.test");
    await expect(recruitmentManager(context, 99, true)).rejects.toMatchObject({ code: "FORBIDDEN" });
    expect(mocks.resolveManagedOrganization).toHaveBeenCalledOnce();
    expect(mocks.resolveManagedOrganization).toHaveBeenCalledWith(context, { orgId: 99, purpose: "dashboard" });
  });
  it("does not ask the manager resolver to discover an organization for an anonymous visitor", async () => {
    await expect(recruitmentManager(ctx(null), 7, true)).rejects.toMatchObject({ code: "UNAUTHORIZED" });
    expect(mocks.resolveManagedOrganization).not.toHaveBeenCalled();
  });
  it.each([
    { billingType: "course-pass" }, { tier: "course-pass" },
  ])("rejects a Flex reporting organization for current and historical operations (%j)", async override => {
    mocks.resolveManagedOrganization.mockResolvedValue({ ...org(), ...override });
    for (const annual of [true, false]) {
      await expect(recruitmentManager(ctx("manager@example.test"), 7, annual)).rejects.toMatchObject({ code: "FORBIDDEN" });
    }
  });
  it("preserves resolver-authorized historical Annual reporting after the term ends", async () => {
    const historical = { ...org(), termEnd: new Date(NOW - 1) };
    mocks.resolveManagedOrganization.mockResolvedValue(historical);
    expect(await recruitmentManager(ctx("manager@example.test"), 7, false)).toEqual(historical);
    await expect(recruitmentManager(ctx("manager@example.test"), 7, true)).rejects.toMatchObject({ code: "FORBIDDEN" });
  });
  it("does not bypass the manager resolver when historical reporting is denied", async () => {
    mocks.resolveManagedOrganization.mockRejectedValue(new TRPCError({ code: "FORBIDDEN", message: "Reporting window ended" }));
    await expect(recruitmentManager(ctx("manager@example.test"), 7, false)).rejects.toMatchObject({ code: "FORBIDDEN" });
  });
});

describe("recruitment Annual contract and course seat", () => {
  it.each([
    ["expired term", { termEnd: new Date(NOW - 1) }], ["exact term boundary", { termEnd: new Date(NOW) }],
    ["missing term", { termEnd: null }], ["cancelled", { status: "cancelled" }],
    ["pending", { status: "pending" }], ["Flex billing", { billingType: "course-pass" }],
    ["Flex tier", { tier: "course-pass" }],
    ["future term start", { termStart: new Date(NOW + 1) }],
  ])("requires a current Annual contract (%s)", (_label, override) => {
    expect(() => assertCurrentAnnualOrganization({ ...org(), ...override } as Organization, NOW)).toThrowError(expect.objectContaining({ code: "FORBIDDEN" }));
  });
  it.each(["active", "past_due"])("permits a current %s Annual contract", status => {
    expect(() => assertCurrentAnnualOrganization({ ...org(), status }, NOW)).not.toThrow();
  });
  it.each([null, new Date(NOW)])("preserves the null-start convention and accepts the exact start boundary (%s)", termStart => {
    expect(() => assertCurrentAnnualOrganization({ ...org(), termStart }, NOW)).not.toThrow();
  });
  it.each([
    ["other org", { orgId: 99 }], ["revoked", { status: "revoked" }],
    ["delegated manager", { role: "delegated_manager" }],
    ["no assignment", { courseKey: null, courseKeys: null }],
    ["empty multi-course assignment", { courseKey: null, courseKeys: "[]" }],
    ["malformed no legacy assignment", { courseKey: null, courseKeys: "{bad}" }],
  ])("does not convert %s into all-access", (_label, override) => {
    expect(recruitmentSeatCourses(org(), { ...member(), ...override })).toEqual([]);
  });
  it("uses explicit canonical multi-course assignments, with no other course expansion", () => {
    expect(recruitmentSeatCourses(org(), { ...member(), courseKeys: JSON.stringify([KEY, "class2-water-dist"]) })).toEqual([KEY, "class2-water-dist"]);
  });
  it.each(["class2-wastewater", "wpi-class2-water", "unknown-course"])("refuses noncanonical, wrong-region or unknown course %s", key => {
    expect(() => recruitmentCourseForOrg(org(), key)).toThrowError(expect.objectContaining({ code: "FORBIDDEN" }));
  });
  it("preserves canonical course-to-bank mapping for separate class2 water and wastewater banks", () => {
    expect(recruitmentCourseForOrg(org(), "class2-water-dist").questionBankKey).toBe("class2-water-dist");
    expect(recruitmentCourseForOrg(org(), "class2-ww").questionBankKey).toBe("class2-wastewater");
  });
});

describe("recruitment scoped subscription requirement", () => {
  it.each([
    ["personal purchase", { orgId: null, stripeSubscriptionId: "sub_synthetic_personal" }],
    ["another organization", { orgId: 99, stripeSubscriptionId: `org-99-${EMAIL}-${KEY}` }],
    ["another candidate", { email: "other@example.test" }],
    ["same-class sibling", { stripeSubscriptionId: `org-7-${EMAIL}-class2-water-dist` }],
    ["wrong class", { tier: "class3" }], ["wrong province", { province: "western" }],
    ["cancelled", { status: "cancelled" }], ["expired status", { status: "expired" }], ["unpaid", { status: "unpaid" }],
    ["expired period", { currentPeriodEnd: new Date(NOW - 1) }], ["exact expiry", { currentPeriodEnd: new Date(NOW) }],
    ["not started", { currentPeriodStart: new Date(NOW + 1) }],
  ])("rejects %s despite generic personal entitlement availability", (_label, override) => {
    expect(recruitmentSubscriptionCovers({ ...sub(), ...override } as RecruitmentSubscription, org(), EMAIL, KEY, NOW)).toBe(false);
  });
  it.each(["active", "past_due"])("accepts only the current %s course-specific same-org subscription", status => {
    expect(recruitmentSubscriptionCovers({ ...sub(), status, currentPeriodStart: new Date(NOW) } as RecruitmentSubscription, org(), EMAIL, KEY, NOW)).toBe(true);
  });
  it("cancelled requested course plus active sibling of the same class cannot satisfy seat access", async () => {
    const { db } = queuedReadDb([[member()], [{ ...sub(), status: "cancelled" }, { ...sub(), stripeSubscriptionId: `org-7-${EMAIL}-class2-water-dist` }]]);
    await expect(assertRecruitmentSeat(db, org(), 31, KEY, EMAIL)).rejects.toMatchObject({ code: "FORBIDDEN" });
    expect(mocks.assertAccess).not.toHaveBeenCalled();
  });
  it("queries seats and subscriptions with explicit same-org/email/status/period scope", async () => {
    const { db, predicates } = queuedReadDb([[member()], [sub()]]);
    expect(await assertRecruitmentSeat(db, org(), 31, KEY, EMAIL)).toEqual(member());
    const dialect = new MySqlDialect();
    const seat = dialect.sqlToQuery(predicates[0] as Parameters<typeof dialect.sqlToQuery>[0]);
    expect(seat.sql).toContain("`organization_members`.`orgId` = ?");
    expect(seat.params).toEqual([31, 7, "assigned"]);
    const subscription = dialect.sqlToQuery(predicates[1] as Parameters<typeof dialect.sqlToQuery>[0]);
    expect(subscription.sql).toContain("`subscriptions`.`orgId` = ?");
    expect(subscription.sql).toContain("`subscriptions`.`currentPeriodStart` <= ?");
    expect(subscription.sql).toContain("`subscriptions`.`currentPeriodEnd` > ?");
    expect(subscription.sql).toContain("`subscriptions`.`stripeSubscriptionId` = ?");
    expect(subscription.params.slice(0, 5)).toEqual([7, EMAIL, `org-7-${EMAIL}-${KEY}`, "active", "past_due"]);
  });
});

describe("recruitment candidate access recheck", () => {
  it.each([ctx(null), ctx("other@example.test"), ctx(EMAIL, "other@example.test")])("denies anonymous or non-owner identities before looking up org or entitlements", async context => {
    const { db, select } = queuedReadDb([]);
    await expect(assertRecruitmentCandidate(context, db, assignment(), KEY)).rejects.toMatchObject({ code: context.user || context.studentEmail ? "FORBIDDEN" : "UNAUTHORIZED" });
    expect(select).not.toHaveBeenCalled(); expect(mocks.assertAccess).not.toHaveBeenCalled();
  });
  it("a candidate's personal entitlement is insufficient when the org subscription is absent", async () => {
    const { db } = queuedReadDb([[org()], [member()], []]);
    await expect(assertRecruitmentCandidate(ctx(), db, assignment(), KEY)).rejects.toMatchObject({ code: "FORBIDDEN" });
    expect(mocks.assertAccess).not.toHaveBeenCalled();
  });
  it("another organization subscription cannot satisfy candidate access", async () => {
    const { db } = queuedReadDb([[org()], [member()], [{ ...sub(), orgId: 99 }]]);
    await expect(assertRecruitmentCandidate(ctx(), db, assignment(), KEY)).rejects.toMatchObject({ code: "FORBIDDEN" });
  });
  it("changed original seat email is denied even if candidate entitlement is still available", async () => {
    const { db } = queuedReadDb([[org()], [{ ...member(), email: "replacement@example.test" }]]);
    await expect(assertRecruitmentCandidate(ctx(), db, assignment(), KEY)).rejects.toMatchObject({ code: "FORBIDDEN" });
    expect(mocks.assertAccess).not.toHaveBeenCalled();
  });
  it("requires both same-org seat subscription and the existing course access authority", async () => {
    const context = ctx(" CANDIDATE@EXAMPLE.TEST ");
    const { db } = queuedReadDb([[org()], [member()], [sub()]]);
    expect(await assertRecruitmentCandidate(context, db, assignment(), KEY)).toEqual(org());
    expect(mocks.assertAccess).toHaveBeenCalledOnce();
    expect(mocks.assertAccess).toHaveBeenCalledWith(context, KEY);
  });
  it("propagates existing access-authority denial after the scoped checks", async () => {
    mocks.assertAccess.mockRejectedValue(new TRPCError({ code: "FORBIDDEN", message: "Access revoked" }));
    const { db } = queuedReadDb([[org()], [member()], [sub()]]);
    await expect(assertRecruitmentCandidate(ctx(), db, assignment(), KEY)).rejects.toMatchObject({ code: "FORBIDDEN" });
  });
  it("requires the purpose-bound capability for applicant assignments even when the email matches", async () => {
    const applicant = { ...assignment(), accessKind: "applicant", memberId: null, grantId: "grant-42" } as RecruitmentAssignmentRow;
    const { db } = queuedReadDb([[org()]]);
    await expect(assertRecruitmentCandidate(ctx(), db, applicant, KEY)).rejects.toMatchObject({ code: "FORBIDDEN" });
  });
  it("accepts an applicant only with the matching capability and active Hiring grant", async () => {
    const applicant = { ...assignment(), accessKind: "applicant", memberId: null, grantId: "grant-42" } as RecruitmentAssignmentRow;
    const context = { ...ctx(), assessmentOnlySession: {
      typ: "assessment-only", assignmentId: applicant.id, candidateEmail: EMAIL, courseKey: KEY, exp: Math.floor((NOW + 60_000) / 1000),
    } } as TrpcContext;
    const { db } = queuedReadDb([[org()], [{ id: "grant-42", orgId: 7, state: "active", paymentState: "active", startsAtMs: NOW - 1, endsAtMs: NOW + 60_000 }]]);
    await expect(assertRecruitmentCandidate(context, db, applicant, KEY)).resolves.toEqual(org());
  });
});
