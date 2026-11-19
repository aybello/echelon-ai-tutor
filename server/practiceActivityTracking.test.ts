import { beforeEach, describe, expect, it, vi } from "vitest";
import { questions, questionAttempts } from "../drizzle/schema";
import { issueAssessmentActivity } from "./assessmentActivity";
import { quick10Router } from "./routers/quick10Router";
import { practiceActivityItems } from "./routers/quizRouter";
import { getDb } from "./db";
import { resolveAccessForRequest } from "./_core/accessService";
import { resolveLearningIdentity } from "./_core/learningIdentity";
import { practiceIdentity, issuePracticeReceipt } from "./practiceQuestionReceipt";
import { resolveAttemptAttribution } from "./teams/attemptAttribution";
import type { TrpcContext } from "./_core/context";

vi.mock("./assessmentActivity", () => ({ issueAssessmentActivity: vi.fn() }));
vi.mock("./db", () => ({ getDb: vi.fn() }));
vi.mock("./_core/accessService", async original => ({ ...await original<typeof import("./_core/accessService")>(), resolveAccessForRequest: vi.fn() }));
vi.mock("./_core/learningIdentity", () => ({ resolveLearningIdentity: vi.fn() }));
vi.mock("./practiceQuestionReceipt", async original => ({ ...await original<typeof import("./practiceQuestionReceipt")>(), practiceIdentity: vi.fn(), issuePracticeReceipt: vi.fn() }));
vi.mock("./teams/attemptAttribution", async original => ({ ...await original<typeof import("./teams/attemptAttribution")>(), resolveAttemptAttribution: vi.fn() }));
const ctx = { user: null, studentEmail: "synthetic@example.test", req: { headers: {} }, res: {} } as unknown as TrpcContext;
const rows = Array.from({ length: 15 }, (_, i) => ({
  id: i + 1, questionNum: i + 1, bankKey: "class1-water", module: "Safety", topic: "Pumps", difficulty: "easy",
  question: `Delivered prompt ${i + 1}`, options: JSON.stringify(["First", "Second", "Third", "Fourth"]), correctIndex: 2,
  explanation: "PRIVATE-SOLUTION", steps: JSON.stringify([{ l: "Display step", c: "PRIVATE-STEP" }]), tip: "PRIVATE-TIP", isCalc: "no", cognitiveLevel: "recall",
}));
const capability = { tracking: true as const, sessionId: "11111111-1111-4111-8111-111111111111", capability: "issued-capability", nextSequence: 2, expiresAt: "2026-11-19T12:00:00.000Z", source: "observed" as const };
beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(getDb).mockResolvedValue({ select: () => ({ from: (table: unknown) => {
    const chain: Record<string, unknown> = {};
    for (const method of ["where", "orderBy", "limit"]) chain[method] = () => chain;
    chain.then = (resolve: (value: unknown) => unknown) => resolve(table === questions ? rows : table === questionAttempts ? [] : []);
    return chain;
  } }) } as never);
  vi.mocked(resolveAccessForRequest).mockResolvedValue(true);
  vi.mocked(practiceIdentity).mockResolvedValue({ owner: "trusted-owner", context: ctx } as never);
  vi.mocked(resolveLearningIdentity).mockResolvedValue({ userId: null, studentEmail: "synthetic@example.test" } as never);
  vi.mocked(issuePracticeReceipt).mockResolvedValue("signed-receipt");
  vi.mocked(resolveAttemptAttribution).mockResolvedValue({ orgId: 9, organizationMemberId: 12, flexLicenceId: null });
  vi.mocked(issueAssessmentActivity).mockResolvedValue(capability);
});
describe("practice assessment delivery tracking", () => {
  it("pins actual issued text and original option indexes, not solutions or fake interactive steps", () => {
    expect(practiceActivityItems([{ id: 7, question: "Actual prompt", options: ["Original B", "Original A"], module: "Module" }])).toEqual([
      { id: "7", prompt: "Actual prompt", topic: "Module", options: [{ id: "0", text: "Original B" }, { id: "1", text: "Original A" }], steps: [] },
    ]);
  });
  it("issues a one-question Quick 10 manifest and receipt server-side, with exact trusted attribution", async () => {
    const result = await quick10Router.createCaller(ctx).start({ courseKey: "class1-water", questionCount: 1 });
    expect(result.questions).toHaveLength(1);
    expect(result.activityTracking).toEqual(capability);
    expect(issuePracticeReceipt).toHaveBeenCalledWith("class1-water", [result.questions[0].id], "trusted-owner", false, { orgId: 9, organizationMemberId: 12, flexLicenceId: null });
    expect(issueAssessmentActivity).toHaveBeenCalledWith(ctx, { courseKey: "class1-water", mode: "quick10", timed: false, items: practiceActivityItems(result.questions) }, { orgId: 9, organizationMemberId: 12, flexLicenceId: null });
    expect(JSON.stringify(result)).not.toMatch(/PRIVATE|correctIndex|explanation|steps|tip/);
  });
  it("does not give preview observations employer attribution", async () => {
    vi.mocked(resolveAccessForRequest).mockResolvedValue(false);
    await quick10Router.createCaller(ctx).start({ courseKey: "class1-water" });
    expect(resolveAttemptAttribution).not.toHaveBeenCalled();
    expect(vi.mocked(issueAssessmentActivity).mock.calls[0][2]).toBeUndefined();
  });
  it("delivers unchanged question access when tracking explicitly declines", async () => {
    vi.mocked(issueAssessmentActivity).mockResolvedValue({ tracking: false, recorded: false, source: "observed" });
    const result = await quick10Router.createCaller(ctx).start({ courseKey: "class1-water" });
    expect(result.questions).toHaveLength(10);
    expect(result.attemptToken).toBe("signed-receipt");
    expect(result.activityTracking.tracking).toBe(false);
  });
});
