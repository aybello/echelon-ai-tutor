import { readFileSync } from "node:fs";
import { getTableName } from "drizzle-orm";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { activationRouter } from "./routers/activationRouter";
import { getDb } from "./db";
import { resolveLearningIdentity } from "./_core/learningIdentity";
import { assertAccess, resolveVerifiedIdentity } from "./_core/accessService";
import { issueAssessmentActivity } from "./assessmentActivity";
import { PERSONAL_ATTRIBUTION, resolveAttemptAttribution } from "./teams/attemptAttribution";

vi.mock("./db", () => ({ getDb: vi.fn() }));
vi.mock("./analytics", () => ({ trackEvent: vi.fn() }));
vi.mock("./_core/learningIdentity", () => ({ resolveLearningIdentity: vi.fn() }));
vi.mock("./_core/accessService", () => ({
  assertAccess: vi.fn(), resolveVerifiedIdentity: vi.fn(),
  getAccessibleCoursesForIdentity: vi.fn(), identityEmail: vi.fn(),
}));
vi.mock("./assessmentActivity", () => ({ issueAssessmentActivity: vi.fn() }));
vi.mock("./teams/attemptAttribution", () => ({
  PERSONAL_ATTRIBUTION: { orgId: null, organizationMemberId: null, flexLicenceId: null },
  resolveAttemptAttribution: vi.fn(),
}));

const ctx = { user: { id: 7, email: "owner@example.test" }, req: { headers: {} }, res: {} } as any;
const capability = { tracking: true as const, sessionId: "550e8400-e29b-41d4-a716-446655440001", capability: "signed.server.capability", nextSequence: 2, expiresAt: "2026-11-19T12:00:00Z", source: "observed" as const };
const rows = Array.from({ length: 30 }, (_, index) => ({
  questionNum: index + 1, module: index % 2 ? "Water" : "Safety", difficulty: "easy",
  question: `Delivered question ${index + 1}`, options: JSON.stringify([`Original A ${index}`, `Original B ${index}`]),
  correctIndex: 1,
}));

function memoryDb(questionRows = rows, onboarding: any = { id: 11, diagnosticStartedAt: new Date() }) {
  return {
    select: vi.fn(() => ({ from: (table: any) => ({ where: () => {
      const selected = getTableName(table) === "learner_onboarding" ? (onboarding ? [onboarding] : []) : questionRows;
      return { then: (fn: any) => Promise.resolve(selected).then(fn), limit: async () => selected };
    } }) })),
    update: vi.fn(() => ({ set: () => ({ where: async () => {} }) })),
  } as any;
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(resolveVerifiedIdentity).mockReturnValue({ type: "oauth", userId: 7, email: "owner@example.test" } as any);
  vi.mocked(assertAccess).mockResolvedValue(undefined as any);
  vi.mocked(resolveLearningIdentity).mockResolvedValue({ userId: 7, studentEmail: "owner@example.test", orgId: null, organizationMemberId: null });
  vi.mocked(resolveAttemptAttribution).mockResolvedValue({ ...PERSONAL_ATTRIBUTION });
  vi.mocked(issueAssessmentActivity).mockResolvedValue(capability);
  vi.mocked(getDb).mockResolvedValue(memoryDb());
});

describe("trusted diagnostic tracking delivery", () => {
  it("snapshots only the actual 15 questions and original option aliases without exposing answer keys", async () => {
    const deliveryId = "550e8400-e29b-41d4-a716-446655440002";
    const result = await activationRouter.createCaller(ctx).diagnosticQuestions({ courseKey: "oit", deliveryId });
    expect(result.questions).toHaveLength(15);
    expect(result.activityTracking).toEqual(capability);
    expect(issueAssessmentActivity).toHaveBeenCalledTimes(1);
    const [issuedCtx, issue, attribution] = vi.mocked(issueAssessmentActivity).mock.calls[0];
    expect(issuedCtx).toBe(ctx);
    expect(issue).toEqual({ courseKey: "oit", mode: "diagnostic", timed: false, items: result.questions.map(question => ({
      id: String(question.id), prompt: question.question, topic: question.module,
      options: question.options.map((text, index) => ({ id: String(index), text })), steps: [],
    })) });
    expect(attribution).toEqual(PERSONAL_ATTRIBUTION);
    expect(issue).not.toHaveProperty("sourceSessionId");
    expect(JSON.stringify(issue)).not.toContain(deliveryId);
    expect(result.questions.every(question => !("correctIndex" in question))).toBe(true);
    expect(assertAccess).toHaveBeenCalledWith(ctx, "oit");
  });

  it("keeps the exact verified OTP context and never supplies email/account aliases to the tracking issuer", async () => {
    const otpCtx = { ...ctx, user: null, studentEmail: "owner@example.test" };
    vi.mocked(resolveVerifiedIdentity).mockReturnValue({ type: "otp", email: "owner@example.test" } as any);
    vi.mocked(resolveLearningIdentity).mockResolvedValue({ userId: null, studentEmail: "owner@example.test", orgId: null, organizationMemberId: null });
    await activationRouter.createCaller(otpCtx).diagnosticQuestions({ courseKey: "oit" });
    const [issuedCtx, issue, attribution] = vi.mocked(issueAssessmentActivity).mock.calls[0];
    expect(issuedCtx).toBe(otpCtx);
    expect(issue).not.toHaveProperty("userId");
    expect(issue).not.toHaveProperty("email");
    expect(attribution).toEqual(PERSONAL_ATTRIBUTION);
  });

  it("ignores forged client identity, employer, mode, and snapshot fields", async () => {
    await activationRouter.createCaller(ctx).diagnosticQuestions({
      courseKey: "oit", userId: 99, orgId: 99, flexLicenceId: 100, mode: "flex-diagnostic",
      items: [{ id: "forged", prompt: "Client-authored question" }],
    } as any);
    const [, issue, attribution] = vi.mocked(issueAssessmentActivity).mock.calls[0];
    expect(issue.mode).toBe("diagnostic");
    expect(issue.items).toHaveLength(15);
    expect(JSON.stringify(issue)).not.toContain("Client-authored");
    expect(attribution).toEqual(PERSONAL_ATTRIBUTION);
  });

  it.each([
    [{ orgId: 41, organizationMemberId: 12, flexLicenceId: null }, "team-diagnostic"],
    [{ orgId: 41, organizationMemberId: null, flexLicenceId: 25 }, "flex-diagnostic"],
  ] as const)("uses only the existing conservative attribution %j", async (attribution, mode) => {
    vi.mocked(resolveLearningIdentity).mockResolvedValue({ userId: 7, studentEmail: "owner@example.test", orgId: attribution.orgId, organizationMemberId: attribution.organizationMemberId });
    vi.mocked(resolveAttemptAttribution).mockResolvedValue(attribution);
    await activationRouter.createCaller(ctx).diagnosticQuestions({ courseKey: "oit" });
    expect(issueAssessmentActivity).toHaveBeenCalledWith(ctx, expect.objectContaining({ mode }), attribution);
  });

  it("never picks a changed employer or infers Flex from org identity alone", async () => {
    vi.mocked(resolveLearningIdentity).mockResolvedValue({ userId: 7, studentEmail: "owner@example.test", orgId: 41, organizationMemberId: 12 });
    vi.mocked(resolveAttemptAttribution).mockResolvedValue({ orgId: 99, organizationMemberId: null, flexLicenceId: 25 });
    await activationRouter.createCaller(ctx).diagnosticQuestions({ courseKey: "oit" });
    expect(issueAssessmentActivity).toHaveBeenCalledWith(ctx, expect.objectContaining({ mode: "diagnostic" }), PERSONAL_ATTRIBUTION);
  });

  it("keeps question delivery working when supplemental attribution or tracking is unavailable", async () => {
    vi.mocked(resolveAttemptAttribution).mockRejectedValue(new Error("optional attribution unavailable"));
    vi.mocked(issueAssessmentActivity).mockResolvedValue({ tracking: false, recorded: false, source: "observed" });
    const result = await activationRouter.createCaller(ctx).diagnosticQuestions({ courseKey: "oit" });
    expect(result.questions).toHaveLength(15);
    expect(result.activityTracking.tracking).toBe(false);
    expect(issueAssessmentActivity).toHaveBeenCalledWith(ctx, expect.objectContaining({ mode: "diagnostic" }), PERSONAL_ATTRIBUTION);
  });

  it.each(["anonymous", "no-access", "no-profile", "insufficient-items"])("never issues before existing prerequisite checks: %s", async failure => {
    if (failure === "anonymous") vi.mocked(resolveVerifiedIdentity).mockReturnValue({ type: "anonymous" } as any);
    if (failure === "no-access") vi.mocked(assertAccess).mockRejectedValue(new Error("no entitlement"));
    if (failure === "no-profile") vi.mocked(getDb).mockResolvedValue(memoryDb(rows, null));
    if (failure === "insufficient-items") vi.mocked(getDb).mockResolvedValue(memoryDb(rows.slice(0, 14)));
    await expect(activationRouter.createCaller(ctx).diagnosticQuestions({ courseKey: "oit" })).rejects.toThrow();
    expect(issueAssessmentActivity).not.toHaveBeenCalled();
  });
});

const page = readFileSync(new URL("../client/src/pages/LearnerActivation.tsx", import.meta.url), "utf8");
const source = readFileSync(new URL("./routers/activationRouter.ts", import.meta.url), "utf8");
describe("diagnostic UI observation boundaries (source guards)", () => {
  it("observes actual option indices without client correctness, hints, steps or fabricated restored choices", () => {
    const select = page.slice(page.indexOf("const selectDiagnosticAnswer"), page.indexOf("const finishDiagnostic"));
    expect(select).toContain('currentAnswer === undefined ? "answer_submitted" : "selection_changed"');
    expect(select).toContain("chosenAnswer: String(index)");
    expect(select).toContain("currentAnswer === index");
    expect(page).not.toContain("observedCorrect:");
    expect(page).not.toContain('action: "hint_opened"');
    expect(page).not.toContain('action: "step_answer"');
    const restore = page.slice(page.indexOf("const draft = upgradeLegacyDiagnosticDraft"), page.indexOf("const result ="));
    expect(restore).not.toContain("activity.observe");
  });
  it("only marks completion inside canonical ACK and rejects a prior-baseline ACK as this run's completion", () => {
    expect(page).toContain('data.sessionId === submitted.sessionId ? "completed" : "abandoned"');
    const finish = page.slice(page.indexOf("const finishDiagnostic"), page.indexOf("const restartDiagnostic"));
    expect(finish).not.toContain("activity.observe");
    const canonicalSubmit = source.slice(source.indexOf("submitDiagnostic:"));
    expect(canonicalSubmit).not.toContain("issueAssessmentActivity");
    expect(canonicalSubmit).toContain("answer.selectedIndex === row.correctIndex");
  });
  it("freshens tracking on restart, retains canonical draft identity validation, and reports storage failure separately", () => {
    const restart = page.slice(page.indexOf("const restartDiagnostic"), page.indexOf("if (auth.isLoading"));
    expect(restart).toContain('activity.observe({ action: "abandoned" })');
    expect(restart).toContain("setDiagnosticDeliveryId(crypto.randomUUID())");
    expect(page).toContain("refetchOnWindowFocus: false");
    expect(page).toContain("resolveDiagnosticDraftIdentity(oauth.user?.id, auth.data?.email)");
    expect(page).toContain('action: "item_presented"');
    expect(page).toContain('action: "resumed"');
    expect(page).toContain("activity.saveError");
    expect(page).toContain("activity.retry()");
    expect(page).not.toContain("useLearningActivitySession");
  });
});
