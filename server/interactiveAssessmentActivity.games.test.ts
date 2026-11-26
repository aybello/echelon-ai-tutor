import { beforeEach, describe, expect, it, vi } from "vitest";
import type { TrpcContext } from "./_core/context";
import { assessmentActivityIssueSchema } from "../shared/assessmentActivity";
import type { InteractiveSessionExample, InteractiveSessionResponse } from "../shared/interactiveSessions";

const mocks = vi.hoisted(() => ({ issue: vi.fn(), start: vi.fn(), analytics: vi.fn(), allowed: vi.fn(), attribution: vi.fn() }));
vi.mock("./assessmentActivity", () => ({ issueAssessmentActivity: mocks.issue, assessmentActivityAllowed: mocks.allowed }));
vi.mock("./teams/attemptAttribution", () => ({
  PERSONAL_ATTRIBUTION: { orgId: null, organizationMemberId: null, flexLicenceId: null },
  resolveAttemptAttribution: mocks.attribution,
}));
vi.mock("./gameAnalytics", () => ({ issueGameCapability: mocks.analytics, recordGameActivity: vi.fn() }));
vi.mock("./interactiveContent/engine/loader", () => ({ getInteractiveContentEngine: () => ({ startSession: mocks.start }) }));
import { gameAssessmentIssue, interactiveRouter } from "./routers/interactiveRouter";

const ctx = { user: null, studentEmail: null, req: { headers: {} }, res: { setHeader: vi.fn() } } as unknown as TrpcContext;
const make = (example: InteractiveSessionExample): InteractiveSessionResponse => ({
  courseKey: "class1-water", available: true, locked: false, version: "synthetic-version-v2",
  sessionId: "00000000-0000-4000-8000-000000000001", mode: example.mode, totalAvailableCount: 1,
  examples: [example], filters: { topicId: null, difficulty: null, requestedSize: 20 },
});
const options = [{ id: "option-long-a", label: "First" }, { id: "option-long-b", label: "Second" }];
const examples: InteractiveSessionExample[] = [
  { id: "swipe", mode: "rapid-swipe", prompt: "Statement", correctAnswer: true, explanation: "Reason" },
  { id: "match", mode: "speed-match", prompt: "Pair these", pairs: ["a", "b", "c"].map(id => ({ id, left: `Left ${id}`, right: `Right ${id}` })), explanation: "Reason" },
  { id: "odd", mode: "odd-one-out", prompt: "Pick an outlier", options, correctOptionId: options[1].id, explanation: "Reason" },
  { id: "effect", mode: "cause-effect", prompt: "Predict change", assumptions: "Hold X constant", effects: [{ id: "e", parameter: "Pressure", direction: "increase", explanation: "Reason" }] },
  { id: "flaw", mode: "tap-the-flaw", prompt: "Pick a flaw", options, correctOptionId: options[0].id, explanation: "Reason" },
  { id: "order", mode: "before-after", prompt: "Choose an earlier stage", options: ["Screening", "Clarification"], correctAnswer: "Screening", explanation: "Reason" },
];
const nullAttribution = { orgId: null, organizationMemberId: null, flexLicenceId: null };
const oauthCtx = { ...ctx, user: { id: 7, email: "OAuth@Example.test" }, studentEmail: "different@example.test" } as unknown as TrpcContext;
const otpCtx = { ...ctx, studentEmail: "OTP@Example.test" } as TrpcContext;
beforeEach(() => {
  vi.clearAllMocks();
  mocks.issue.mockResolvedValue({ tracking: false, recorded: false, source: "observed" });
  mocks.analytics.mockReturnValue(null);
  mocks.allowed.mockReturnValue(true);
  mocks.attribution.mockResolvedValue({ ...nullAttribution });
});

describe("six-game supplemental issuance", () => {
  it.each(examples)("snapshots exact issued choices without answer keys: $mode", example => {
    const session = make(example);
    const issue = assessmentActivityIssueSchema.parse(gameAssessmentIssue(session));
    expect(issue).toMatchObject({ courseKey: session.courseKey, mode: session.mode, timed: null, sourceSessionId: session.sessionId });
    expect(issue.items[0].id).toBe(example.id);
    expect(issue.items[0].prompt).toContain(example.prompt);
    for (const key of ["correctAnswer", "correctOptionId", "direction", "explanation", "userId", "email", "orgId"]) expect(JSON.stringify(issue)).not.toContain(`"${key}":`);
  });
  it("aliases both sides of all twenty matching subunits without truncating content", () => {
    const example = { ...examples[1], pairs: Array.from({ length: 20 }, (_, i) => ({ id: `pair-${i}`, left: `Left ${i}`, right: `Right ${i}` })) } as InteractiveSessionExample;
    const issue = assessmentActivityIssueSchema.parse(gameAssessmentIssue(make(example)));
    expect(issue.items[0].steps).toHaveLength(20);
    expect(issue.items[0].steps[19]).toEqual({ id: "pair:19", label: "Left 19", options: Array.from({ length: 20 }, (_, i) => ({ id: String(i), text: `Right ${i}` })) });
  });
  it("retains legacy before/after aliases and supports legacy effect choices", () => {
    const legacy = { id: "legacy", mode: "before-after", prompt: "Which direction?", correctAnswer: "before", explanation: "Reason" } as const;
    expect(gameAssessmentIssue(make(legacy)).items[0].options).toEqual([{ id: "before", text: "Before" }, { id: "after", text: "After" }]);
    const choiceEffect = { id: "choice-effect", mode: "cause-effect", prompt: "Which?", options, correctOptionId: options[0].id, explanation: "Reason" } as const;
    expect(gameAssessmentIssue(make(choiceEffect)).items[0].options).toEqual([{ id: "0", text: "First" }, { id: "1", text: "Second" }]);
  });
  it("returns additive capability from actual public engine delivery, never client identity or a guessed team", async () => {
    const session = make(examples[0]); mocks.start.mockReturnValue(session);
    const cap = { tracking: true, sessionId: "00000000-0000-4000-8000-000000000002", capability: "fixture", nextSequence: 2, expiresAt: "2030-01-01T00:00:00Z", source: "observed" };
    mocks.issue.mockResolvedValue(cap);
    const result = await interactiveRouter.createCaller(ctx).startSession({ courseKey: session.courseKey, mode: session.mode, accessToken: "not-identity-evidence" });
    expect(result).toEqual({ ...session, activityTracking: cap });
    expect(mocks.start).toHaveBeenCalledWith(expect.anything(), true, []);
    expect(mocks.issue).toHaveBeenCalledWith(ctx, gameAssessmentIssue(session), nullAttribution);
    expect(mocks.attribution).not.toHaveBeenCalled();
  });
  it.each([
    { name: "unique Annual employer through OAuth", context: oauthCtx, identity: { userId: 7, studentEmail: "oauth@example.test" }, attribution: { orgId: 21, organizationMemberId: 31, flexLicenceId: null } },
    { name: "unique Flex employer through OTP", context: otpCtx, identity: { userId: null, studentEmail: "otp@example.test" }, attribution: { orgId: 22, organizationMemberId: null, flexLicenceId: 41 } },
  ])("passes trusted $name attribution only after actual public engine delivery", async ({ context, identity, attribution }) => {
    const session = make(examples[0]); mocks.start.mockReturnValue(session);
    mocks.attribution.mockResolvedValue(attribution);
    const result = await interactiveRouter.createCaller(context).startSession({ courseKey: session.courseKey, mode: session.mode, accessToken: "not-identity-evidence" });
    expect(result.examples).toEqual(session.examples);
    expect(mocks.start).toHaveBeenCalledWith(expect.anything(), true, []);
    expect(mocks.attribution).toHaveBeenCalledWith(identity, session.courseKey);
    expect(mocks.start.mock.invocationCallOrder[0]).toBeLessThan(mocks.attribution.mock.invocationCallOrder[0]);
    expect(mocks.attribution.mock.invocationCallOrder[0]).toBeLessThan(mocks.issue.mock.invocationCallOrder[0]);
    expect(mocks.issue).toHaveBeenCalledWith(context, gameAssessmentIssue(session), attribution);
  });
  it.each(["personal entitlement", "ambiguous employers", "unentitled learner"])("retains resolver's null attribution for %s without restricting games", async () => {
    const session = make(examples[0]); mocks.start.mockReturnValue(session);
    const result = await interactiveRouter.createCaller(oauthCtx).startSession({ courseKey: session.courseKey, mode: session.mode });
    expect(result.examples).toEqual(session.examples);
    expect(mocks.attribution).toHaveBeenCalledWith({ userId: 7, studentEmail: "oauth@example.test" }, session.courseKey);
    expect(mocks.issue).toHaveBeenCalledWith(oauthCtx, gameAssessmentIssue(session), nullAttribution);
  });
  it("resolver failure falls through to learner-only tracking without blocking public games", async () => {
    const session = make(examples[0]); mocks.start.mockReturnValue(session);
    mocks.attribution.mockRejectedValue(new Error("Attribution unavailable"));
    const cap = { tracking: true, sessionId: "00000000-0000-4000-8000-000000000002", capability: "fixture", nextSequence: 2, expiresAt: "2030-01-01T00:00:00Z", source: "observed" };
    mocks.issue.mockResolvedValue(cap);
    const result = await interactiveRouter.createCaller(oauthCtx).startSession({ courseKey: session.courseKey, mode: session.mode });
    expect(result).toEqual({ ...session, activityTracking: cap });
    expect(mocks.issue).toHaveBeenCalledWith(oauthCtx, gameAssessmentIssue(session), nullAttribution);
  });
  it("skips attribution reads and supplemental issuance when consent is denied", async () => {
    const session = make(examples[0]); mocks.start.mockReturnValue(session);
    mocks.allowed.mockReturnValue(false);
    const result = await interactiveRouter.createCaller(oauthCtx).startSession({ courseKey: session.courseKey, mode: session.mode });
    expect(result).toEqual({ ...session, activityTracking: { tracking: false, recorded: false, source: "observed" } });
    expect(mocks.attribution).not.toHaveBeenCalled();
    expect(mocks.issue).not.toHaveBeenCalled();
  });
  it("never resolves attribution or issues tracking when the public engine fails", async () => {
    mocks.start.mockImplementationOnce(() => { throw new Error("Content unavailable"); });
    await expect(interactiveRouter.createCaller(oauthCtx).startSession({ courseKey: "class1-water", mode: "rapid-swipe" })).rejects.toMatchObject({ code: "INTERNAL_SERVER_ERROR" });
    expect(mocks.attribution).not.toHaveBeenCalled();
    expect(mocks.issue).not.toHaveBeenCalled();
  });
  it("tracking storage failure never blocks free game delivery or alters the score", async () => {
    const session = make(examples[0]); mocks.start.mockReturnValue(session); mocks.issue.mockRejectedValue(new Error("Storage unavailable"));
    const result = await interactiveRouter.createCaller(ctx).startSession({ courseKey: session.courseKey, mode: session.mode });
    expect(result).toEqual({ ...session, activityTracking: { tracking: false, recorded: false, source: "observed" } });
  });
  it("does not issue for empty deliveries, 309A, arbitrary identity or course injection", async () => {
    const session = { ...make(examples[0]), examples: [], totalAvailableCount: 0 }; mocks.start.mockReturnValue(session);
    await interactiveRouter.createCaller(ctx).startSession({ courseKey: session.courseKey, mode: session.mode });
    expect(mocks.issue).not.toHaveBeenCalled();
    expect(mocks.attribution).not.toHaveBeenCalled();
    for (const input of [{ courseKey: "electrician-309a", mode: "rapid-swipe" }, { courseKey: "class1-water", mode: "rapid-swipe", email: "other@example.test" }, { courseKey: "class1-water", mode: "rapid-swipe", orgId: 123 }]) {
      await expect(interactiveRouter.createCaller(ctx).startSession(input as never)).rejects.toMatchObject({ code: "BAD_REQUEST" });
    }
  });
});
