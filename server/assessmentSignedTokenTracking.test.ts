import { createHash, randomUUID } from "node:crypto";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { questions } from "../drizzle/schema";
import { assessmentActivityRecordInputSchema, assessmentActivityResumeInputSchema, type AssessmentActivityCapability } from "../shared/assessmentActivity";
import type { TrpcContext } from "./_core/context";
import { issueSubscriptionToken } from "./_core/subscriptionToken";
import { createAssessmentActivitySecurity, issueAssessmentActivity, recordAssessmentActivity, resumeAssessmentActivity } from "./assessmentActivity";
import { getDb } from "./db";
import { resolveAccessForRequest } from "./_core/accessService";
import { resolveAttemptAttribution } from "./teams/attemptAttribution";
import { quizRouter } from "./routers/quizRouter";
import { quick10Router } from "./routers/quick10Router";
import { assessmentActivityRouter } from "./routers/assessmentActivityRouter";

vi.mock("./_core/env", () => ({ ENV: { cookieSecret: "fixture-signed-tracking-only" } }));
vi.mock("./db", () => ({ getDb: vi.fn() }));
vi.mock("./_core/accessService", async original => ({ ...await original<typeof import("./_core/accessService")>(), resolveAccessForRequest: vi.fn() }));
vi.mock("./teams/attemptAttribution", async original => ({ ...await original<typeof import("./teams/attemptAttribution")>(), resolveAttemptAttribution: vi.fn() }));
vi.mock("./assessmentActivity", async original => ({ ...await original<typeof import("./assessmentActivity")>(), issueAssessmentActivity: vi.fn(), recordAssessmentActivity: vi.fn(), resumeAssessmentActivity: vi.fn() }));

const security = createAssessmentActivitySecurity("fixture-signed-tracking-only");
const denied = { tracking: false as const, recorded: false as const, source: "observed" as const };
const email = "signed-learner@example.test";
const personal = { orgId: null, organizationMemberId: null, flexLicenceId: null };
const annual = { orgId: 9, organizationMemberId: 12, flexLicenceId: null };
const flex = { orgId: 9, organizationMemberId: null, flexLicenceId: 14 };
const context = (studentEmail: string | null = null, user: TrpcContext["user"] = null): TrpcContext => ({
  user, studentEmail, req: { headers: { "x-echelon-activity": "allowed" } }, res: {},
} as unknown as TrpcContext);
const rows = [{ id: 1, questionNum: 1, bankKey: "class1-water", module: "Safety", topic: "Pumps", difficulty: "easy",
  question: "Delivered prompt", options: JSON.stringify(["A", "B", "C", "D"]), correctIndex: 2,
  explanation: "Solution", steps: null, tip: null, isCalc: "no", cognitiveLevel: "recall" }];
function capability(ctx: TrpcContext, mode: "practice" | "quick10" = "practice"): AssessmentActivityCapability {
  const anonymousNonce = !ctx.user && !ctx.studentEmail ? randomUUID() : undefined;
  const actor = security.actor(ctx, anonymousNonce)!;
  const sessionId = randomUUID();
  const expires = Date.now() + 60_000;
  return { tracking: true, sessionId, nextSequence: 2, expiresAt: new Date(expires).toISOString(), source: "observed",
    capability: security.sign({ version: 1, sessionId, courseKey: "class1-water", mode,
      actorHash: actor.actorHash, identityKind: actor.identityKind, manifestHash: createHash("sha256").update("manifest").digest("hex"),
      expires, ...(anonymousNonce ? { anonymousNonce } : {}) }) };
}
beforeEach(() => {
  vi.clearAllMocks();
  // All persistence/delivery dependencies are mocked; no database or network is used.
  vi.mocked(getDb).mockResolvedValue({ select: (projection: Record<string, unknown> | undefined) => ({ from: (table: unknown) => {
    const chain: Record<string, unknown> = {};
    for (const method of ["where", "orderBy", "limit"]) chain[method] = () => chain;
    chain.then = (resolve: (value: unknown) => unknown) => resolve(table === questions ? projection && "total" in projection ? [{ total: 1 }] : rows : []);
    return chain;
  } }) } as never);
  vi.mocked(resolveAccessForRequest).mockResolvedValue(true);
  vi.mocked(resolveAttemptAttribution).mockResolvedValue(personal);
  vi.mocked(issueAssessmentActivity).mockImplementation(async (ctx, input) => capability(ctx, input.mode as "practice" | "quick10"));
  // The real capability verifier enforces ownership; strict core bodies prove the
  // transport-only accessToken never reaches persistence. Durability has separate tests.
  vi.mocked(recordAssessmentActivity).mockImplementation(async (ctx, input) => {
    assessmentActivityRecordInputSchema.parse(input);
    return security.verify(input.capability, ctx) ? { tracking: true, recorded: true, accepted: input.events.length,
      duplicates: 0, nextSequence: 3, status: "active", source: "observed" } : denied;
  });
  vi.mocked(resumeAssessmentActivity).mockImplementation(async (ctx, input) => {
    assessmentActivityResumeInputSchema.parse(input);
    const cap = security.verify(input.capability, ctx);
    return cap ? { tracking: true, sessionId: cap.sessionId, capability: input.capability, nextSequence: 2,
      expiresAt: new Date(cap.expires).toISOString(), status: "active", source: "observed" } : denied;
  });
});

describe("signed-access-token assessment tracking transport", () => {
  for (const [name, attribution] of [["personal", personal], ["Annual Team", annual], ["Flex", flex]] as const) {
    for (const route of ["working set", "paged practice", "Quick 10"] as const) {
      it(`issues ${name} ${route} using the exact canonical verified actor and attribution`, async () => {
        const ctx = context();
        const accessToken = await issueSubscriptionToken({ email: " Signed-Learner@Example.Test ", examTypes: ["class1-water"] });
        vi.mocked(resolveAttemptAttribution).mockResolvedValue(attribution);
        const result = route === "working set" ? await quizRouter.createCaller(ctx).getQuestions({ bankKey: "class1-water", accessToken })
          : route === "paged practice" ? await quizRouter.createCaller(ctx).getRandomQuestions({ bankKey: "class1-water", limit: 1, accessToken })
          : await quick10Router.createCaller(ctx).start({ courseKey: "class1-water", questionCount: 1, accessToken });
        const [issuedContext, , ownership] = vi.mocked(issueAssessmentActivity).mock.calls[0];
        expect(issuedContext).toMatchObject({ user: null, studentEmail: email });
        expect(issuedContext.req).toBe(ctx.req);
        expect(issuedContext.res).toBe(ctx.res);
        expect(ctx.studentEmail).toBeNull();
        expect(ownership).toBe(attribution);
        expect(resolveAttemptAttribution).toHaveBeenCalledWith(expect.objectContaining({ userId: null, studentEmail: email }), "class1-water");
        const tracking = result.activityTracking;
        expect(tracking?.tracking).toBe(true);
        if (!tracking?.tracking) throw Error("Missing capability");
        expect(security.verify(tracking.capability, context(email))?.identityKind).toBe("verified-email");
        expect(security.verify(tracking.capability, ctx)).toBeNull();
      });
    }
  }
  it("records and resumes a signed-token learner, stripping the transport credential", async () => {
    const cap = capability(context(email));
    const accessToken = await issueSubscriptionToken({ email, examTypes: ["class1-water"] });
    const caller = assessmentActivityRouter.createCaller(context());
    const events = [{ eventId: randomUUID(), sequence: 2, action: "started" as const }];
    expect(await caller.resume({ capability: cap.capability, accessToken })).toMatchObject({ tracking: true, sessionId: cap.sessionId });
    expect(await caller.record({ capability: cap.capability, events, accessToken })).toMatchObject({ recorded: true });
    expect(recordAssessmentActivity).toHaveBeenCalledWith(expect.objectContaining({ studentEmail: email }), { capability: cap.capability, events });
    expect(resumeAssessmentActivity).toHaveBeenCalledWith(expect.objectContaining({ studentEmail: email }), { capability: cap.capability });
  });
  it("rejects missing, forged, expired and different-learner tokens for a named capability", async () => {
    const cap = capability(context(email));
    const tokens = [undefined, "forged.token.signature", await issueSubscriptionToken({ email, examTypes: ["class1-water"] }, -1000),
      await issueSubscriptionToken({ email: "other@example.test", examTypes: ["class1-water"] })];
    for (const accessToken of tokens) {
      const caller = assessmentActivityRouter.createCaller(context());
      expect(await caller.resume({ capability: cap.capability, accessToken })).toMatchObject({ tracking: false });
      expect(await caller.record({ capability: cap.capability, accessToken, events: [{ eventId: randomUUID(), sequence: 2, action: "started" }] })).toMatchObject({ recorded: false });
    }
  });
  it("does not inherit anonymous activity after signed-token identification, or accept invalid-token anonymous fallback", async () => {
    const cap = capability(context());
    const caller = assessmentActivityRouter.createCaller(context());
    expect(await caller.resume({ capability: cap.capability })).toMatchObject({ tracking: true });
    const accessToken = await issueSubscriptionToken({ email, examTypes: ["class1-water"] });
    for (const token of [accessToken, "forged.token.signature"]) {
      expect(await caller.resume({ capability: cap.capability, accessToken: token })).toMatchObject({ tracking: false });
      expect(await caller.record({ capability: cap.capability, accessToken: token, events: [{ eventId: randomUUID(), sequence: 2, action: "started" }] })).toMatchObject({ recorded: false });
    }
  });
  it.each(["OAuth", "OTP"])("does not let a signed token override an existing %s actor", async kind => {
    const ctx = kind === "OAuth" ? context(null, { id: 77, email: "account@example.test", role: "user" } as TrpcContext["user"])
      : context("account@example.test");
    const accessToken = await issueSubscriptionToken({ email, examTypes: ["class1-water"] });
    await quick10Router.createCaller(ctx).start({ courseKey: "class1-water", questionCount: 1, accessToken });
    expect(vi.mocked(issueAssessmentActivity).mock.calls[0][0]).toMatchObject({ user: ctx.user, studentEmail: ctx.studentEmail });
    const caller = assessmentActivityRouter.createCaller(ctx);
    expect(await caller.resume({ capability: capability(ctx).capability, accessToken })).toMatchObject({ tracking: true });
    expect(await caller.resume({ capability: capability(context(email)).capability, accessToken })).toMatchObject({ tracking: false });
  });
  it("keeps arbitrary email and metadata out of the strict router transport", async () => {
    const caller = assessmentActivityRouter.createCaller(context());
    const cap = capability(context());
    await expect(caller.resume({ capability: cap.capability, email } as never)).rejects.toMatchObject({ code: "BAD_REQUEST" });
    await expect(caller.record({ capability: cap.capability, events: [{ eventId: randomUUID(), sequence: 2, action: "started" }], studentEmail: email } as never)).rejects.toMatchObject({ code: "BAD_REQUEST" });
    await expect(caller.resume({ capability: cap.capability, accessToken: "x".repeat(8193) })).rejects.toMatchObject({ code: "BAD_REQUEST" });
  });
});
