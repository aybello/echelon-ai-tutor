import { beforeEach, describe, expect, it, vi } from "vitest";
import { hiringTerms, organizations, type RecruitmentAssignmentRow, type User } from "../../drizzle/schema";
import { assertAccess, resolveAccessForRequest, verifyAccessTokenAndRecheckDb } from "./accessService";
import { createContext, type TrpcContext } from "./context";
import { ASSESSMENT_ONLY_COOKIE, issueAssessmentOnlySession } from "./assessmentOnlySession";
import { ECHELON_SESSION_COOKIE, issueVerifiedEmailSessionCookie } from "./emailSession";
import { issueSubscriptionToken, verifySubscriptionToken } from "./subscriptionToken";
import { assertRecruitmentCandidate } from "../recruitment/access";
import type { RecruitmentReadDb } from "../recruitment/types";

const state = vi.hoisted(() => ({
  user: null as User | null,
  resolveAccess: vi.fn(), resolveAccessByEmail: vi.fn(), entitlements: vi.fn(),
}));
// Only live entitlement/database and OAuth lookup are replaced. Cookies, JWT
// signatures, context construction, identity precedence and both guards are real.
vi.mock("./sdk", () => ({ sdk: { authenticateRequest: async () => state.user } }));
vi.mock("./access", async importOriginal => ({
  ...await importOriginal<typeof import("./access")>(),
  resolveAccess: state.resolveAccess,
  resolveAccessByEmail: state.resolveAccessByEmail,
  resolveEntitlementsByEmail: state.entitlements,
}));
vi.mock("../db", () => ({ getDb: () => { throw new Error("No database may be called by this test"); } }));

const APPLICANT = "applicant-a@example.test";
const LEARNER = "learner-b@example.test";
const COURSE = "class1-water";
const FREE_COURSE = "electrician-309a";
function entitlements(email: string, courses: string[] = []) {
  return { email, hasAnyAccess: courses.length > 0, isManager: false, unlockedExamTypes: courses,
    purchasedProductKeys: courses, activeSubscriptionRows: [], sources: [] };
}
async function signedCookies(input: { applicant?: boolean; email?: string } = {}) {
  const cookies: Record<string, string> = {};
  const res = {
    cookie: vi.fn((name: string, value: string) => { cookies[name] = value; }),
    clearCookie: vi.fn((name: string) => { delete cookies[name]; }),
  } as unknown as TrpcContext["res"];
  if (input.applicant !== false) await issueAssessmentOnlySession(res, {
    assignmentId: "11111111-1111-4111-8111-111111111111", candidateEmail: APPLICANT, courseKey: COURSE,
  });
  if (input.email) await issueVerifiedEmailSessionCookie(res, input.email);
  const req = { cookies: { ...cookies }, headers: {}, protocol: "https" } as TrpcContext["req"];
  return { cookies, req, res };
}
async function context(input: Parameters<typeof signedCookies>[0] = {}) {
  const client = await signedCookies(input);
  return { ...client, ctx: await createContext({ req: client.req, res: client.res } as any) };
}
async function oldLearnerToken() {
  const token = await issueSubscriptionToken({ email: LEARNER, examTypes: [COURSE] });
  expect(await verifySubscriptionToken(token)).toEqual({ email: LEARNER, examTypes: [COURSE] });
  return token;
}
async function expectDenied(ctx: TrpcContext, examType: string, accessToken?: string) {
  await expect(assertAccess(ctx, examType, { accessToken })).rejects.toMatchObject({ code: "FORBIDDEN" });
  await expect(resolveAccessForRequest(ctx, examType, { accessToken })).resolves.toBe(false);
  await expect(resolveAccessForRequest(ctx, examType, { accessToken, privilegedInteractiveAccess: true })).resolves.toBe(false);
}

beforeEach(() => {
  vi.clearAllMocks(); state.user = null;
  state.resolveAccessByEmail.mockImplementation(async (email, course) => ({ hasAccess: email === LEARNER && course === COURSE, isOwner: false }));
  state.resolveAccess.mockImplementation(async (user, course) => ({ hasAccess: user?.email === LEARNER && course === COURSE, isOwner: false }));
  state.entitlements.mockImplementation(async email => entitlements(email, email === LEARNER ? [COURSE] : []));
});

describe("assessment-only central study boundary", () => {
  it("denies an actual applicant cookie carrying a previous learner's still-valid signed token", async () => {
    const token = await oldLearnerToken();
    // Prove this is a usable old credential, not a malformed-token false positive.
    expect(await verifyAccessTokenAndRecheckDb(token, COURSE)).toEqual({ hasAccess: true, email: LEARNER });
    state.resolveAccessByEmail.mockClear();
    const { ctx } = await context();
    expect(ctx.studentEmail).toBeNull(); expect(ctx.assessmentOnlyHasLearnerAccess).toBe(false);
    await expectDenied(ctx, COURSE, token);
    expect(state.resolveAccessByEmail).not.toHaveBeenCalled(); expect(state.resolveAccess).not.toHaveBeenCalled();
  });

  it("keeps access to the exact assigned assessment without opening any learner course", async () => {
    const { ctx } = await context();
    const now = Date.now();
    const org = { id: 7, province: "ontario", tier: "all-access", billingType: "stripe", status: "active",
      termStart: new Date(now - 1000), termEnd: new Date(now + 60_000) };
    const grant = { id: "synthetic-grant", orgId: 7, state: "active", paymentState: "active", startsAtMs: now - 1000, endsAtMs: now + 60_000 };
    // Live row retrieval alone is synthetic; the candidate checker, capability
    // matching and central study checker all execute their real implementations.
    const db = { select: () => ({ from: (table: unknown) => ({ where: () => ({ limit: async () => {
      if (table === organizations) return [org];
      if (table === hiringTerms) return [grant];
      throw new Error("Unexpected candidate lookup");
    } }) }) }) } as unknown as RecruitmentReadDb;
    const assigned = { id: ctx.assessmentOnlySession!.assignmentId, orgId: 7, memberId: null, accessKind: "applicant",
      grantId: grant.id, candidateEmail: APPLICANT, status: "active" } as RecruitmentAssignmentRow;
    await expect(assertRecruitmentCandidate(ctx, db, assigned, COURSE)).resolves.toEqual(org);
    await expect(assertRecruitmentCandidate(ctx, db, { ...assigned, id: "22222222-2222-4222-8222-222222222222" }, COURSE))
      .rejects.toMatchObject({ code: "FORBIDDEN" });
    await expect(assertRecruitmentCandidate(ctx, db, { ...assigned, candidateEmail: LEARNER }, COURSE))
      .rejects.toMatchObject({ code: "FORBIDDEN" });
    await expect(assertRecruitmentCandidate(ctx, db, assigned, "class2-water"))
      .rejects.toMatchObject({ code: "FORBIDDEN" });
    await expectDenied(ctx, COURSE, await oldLearnerToken());
    expect(state.resolveAccessByEmail).not.toHaveBeenCalled();
  });

  it("denies a free beta before any free-access fallback without changing the assigned capability", async () => {
    const { ctx } = await context();
    const capability = { ...ctx.assessmentOnlySession };
    await expectDenied(ctx, FREE_COURSE, await oldLearnerToken());
    expect(ctx.assessmentOnlySession).toEqual(capability);
    expect(ctx.assessmentOnlySession).toMatchObject({ candidateEmail: APPLICANT, courseKey: COURSE });
    expect(state.resolveAccessByEmail).not.toHaveBeenCalled();
  });

  it.each([undefined, false, true])("does not treat a learner-access flag (%s) as independent authentication", async flag => {
    const { ctx } = await context(); ctx.assessmentOnlyHasLearnerAccess = flag;
    await expectDenied(ctx, COURSE, await oldLearnerToken());
    expect(state.resolveAccessByEmail).not.toHaveBeenCalled();
  });

  it("does not turn a manager-only matching identity into learner access", async () => {
    state.entitlements.mockImplementation(async email => ({ ...entitlements(email), hasAnyAccess: true, isManager: true }));
    const { ctx } = await context({ email: APPLICANT });
    expect(ctx.assessmentOnlyHasLearnerAccess).toBe(false);
    await expectDenied(ctx, COURSE, await oldLearnerToken());
    expect(state.resolveAccessByEmail).not.toHaveBeenCalled();
  });

  it.each(["otp", "oauth"] as const)("preserves separately authenticated learner B with stale applicant A cookie (%s)", async kind => {
    if (kind === "oauth") state.user = { id: 42, email: LEARNER, role: "user", openId: "synthetic-b" } as User;
    const { ctx, cookies, res } = await context(kind === "otp" ? { email: LEARNER } : {});
    expect(ctx.assessmentOnlySession).toBeNull();
    expect(res.clearCookie).toHaveBeenCalledWith(ASSESSMENT_ONLY_COOKIE, { path: "/" });
    expect(cookies[ASSESSMENT_ONLY_COOKIE]).toBeUndefined();
    await expect(assertAccess(ctx, COURSE)).resolves.toBeUndefined();
    await expect(resolveAccessForRequest(ctx, COURSE)).resolves.toBe(true);
  });

  it.each(["otp", "oauth"] as const)("allows the same applicant after independent %s learner authentication and entitlement", async kind => {
    state.entitlements.mockImplementation(async email => entitlements(email, [COURSE]));
    state.resolveAccessByEmail.mockResolvedValue({ hasAccess: true }); state.resolveAccess.mockResolvedValue({ hasAccess: true });
    if (kind === "oauth") state.user = { id: 7, email: APPLICANT, role: "user" } as User;
    const { ctx } = await context(kind === "otp" ? { email: APPLICANT } : {});
    expect(ctx.assessmentOnlyHasLearnerAccess).toBe(true);
    await expect(assertAccess(ctx, COURSE)).resolves.toBeUndefined();
    await expect(resolveAccessForRequest(ctx, COURSE)).resolves.toBe(true);
  });

  it("preserves normal token-only learner access and its live revocation recheck", async () => {
    const token = await oldLearnerToken();
    const { ctx } = await context({ applicant: false });
    expect(ctx.req.cookies?.[ECHELON_SESSION_COOKIE]).toBeUndefined();
    await expect(assertAccess(ctx, COURSE, { accessToken: token })).resolves.toBeUndefined();
    await expect(resolveAccessForRequest(ctx, COURSE, { accessToken: token })).resolves.toBe(true);
    state.resolveAccessByEmail.mockResolvedValue({ hasAccess: false });
    await expectDenied(ctx, COURSE, token);
  });

  it("preserves anonymous free beta access when there is no applicant capability", async () => {
    const { ctx } = await context({ applicant: false });
    await expect(assertAccess(ctx, FREE_COURSE)).resolves.toBeUndefined();
    await expect(resolveAccessForRequest(ctx, FREE_COURSE)).resolves.toBe(true);
  });
});
