import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { MySqlDialect } from "drizzle-orm/mysql-core";
import { certificationBankVersions, certificationQuestions } from "../drizzle/schema";
import { assessmentActivityIssueSchema, type AssessmentActivityCapability } from "../shared/assessmentActivity";
import { ELECTRICIAN_309A_PROGRAM_KEY, selectCertificationQuestionsForPublicPreview } from "../shared/certificationPrograms";
import electricianQuestions from "./private/electrician309aDraftQuestions";
import { getDb } from "./db";
import { issueAssessmentActivity } from "./assessmentActivity";
import { practiceIdentity } from "./practiceQuestionReceipt";
import { electricianReviewRouter } from "./routers/electricianReviewRouter";
import type { TrpcContext } from "./_core/context";
import { useElectrician309ABank } from "../client/src/hooks/useElectrician309ABank";

const hook = vi.hoisted(() => ({ query: vi.fn() }));
vi.mock("react", () => ({ useMemo: (factory: () => unknown) => factory() }));
vi.mock("@/lib/trpc", () => ({ trpc: { electricianReview: { get309ABetaPractice: { useQuery: hook.query } } } }));
vi.mock("./db", () => ({ getDb: vi.fn() }));
vi.mock("./assessmentActivity", () => ({ issueAssessmentActivity: vi.fn() }));
vi.mock("./practiceQuestionReceipt", async original => ({
  ...await original<typeof import("./practiceQuestionReceipt")>(), practiceIdentity: vi.fn(),
}));

const setHeader = vi.fn();
const ctx = { user: null, studentEmail: null, req: { headers: { "x-echelon-activity": "allowed" } }, res: { setHeader } } as unknown as TrpcContext;
const verified = { ...ctx, studentEmail: "verified@example.test" };
const capability = (index: number): AssessmentActivityCapability => ({
  tracking: true, sessionId: `00000000-0000-4000-8000-${String(index).padStart(12, "0")}`,
  capability: `server-capability-${index}`, nextSequence: 2,
  expiresAt: "2026-11-19T12:00:00.000Z", source: "observed",
});
const row = (id: number) => ({
  id, module: "A", taskCode: "A-1", topic: null, difficulty: "easy", question: `Delivered prompt ${id}`,
  options: JSON.stringify(["Original second", "Original first", "Third", "Fourth"]), correctIndex: 1,
  explanation: "PRIVATE-SOLUTION", steps: JSON.stringify([{ l: "Work", c: "PRIVATE-STEP" }]),
  tip: "PRIVATE-TIP", isCalc: "no", diagramId: null, diagramAlt: null,
});
let rows: ReturnType<typeof row>[];
let bankExists: boolean;
let filters: Array<{ table: unknown; params: unknown[] }>;
beforeEach(() => {
  vi.clearAllMocks(); rows = [row(7)]; bankExists = true; filters = [];
  vi.mocked(getDb).mockResolvedValue({ select: () => ({ from: (table: unknown) => {
    const chain: Record<string, unknown> = {};
    chain.where = (predicate: Parameters<MySqlDialect["sqlToQuery"]>[0]) => {
      filters.push({ table, params: new MySqlDialect().sqlToQuery(predicate).params }); return chain;
    };
    chain.limit = () => chain;
    chain.orderBy = () => chain;
    chain.then = (resolve: (value: unknown) => unknown) => resolve(table === certificationBankVersions ? (bankExists ? [{ id: 42 }] : []) : rows);
    return chain;
  } }) } as never);
  vi.mocked(practiceIdentity).mockResolvedValue({ owner: "trusted-owner", context: verified });
  vi.mocked(issueAssessmentActivity).mockImplementation(async () => capability(vi.mocked(issueAssessmentActivity).mock.calls.length));
  vi.stubGlobal("localStorage", { getItem: () => "signed-access-token" });
});
afterEach(() => vi.unstubAllGlobals());

describe("governed 309A beta practice observations", () => {
  it("issues the exact display manifest with verified identity, original option aliases, and learner-only ownership", async () => {
    const result = await electricianReviewRouter.createCaller(ctx).get309ABetaPractice({ accessToken: "signed-access-token" });
    expect(practiceIdentity).toHaveBeenCalledWith(ctx, "signed-access-token");
    expect(issueAssessmentActivity).toHaveBeenCalledWith(verified, {
      courseKey: "electrician-309a", mode: "practice", timed: null,
      items: [{ id: "7", prompt: "Delivered prompt 7", topic: "A-1", options: [
        { id: "0", text: "Original second" }, { id: "1", text: "Original first" },
        { id: "2", text: "Third" }, { id: "3", text: "Fourth" },
      ], steps: [] }],
    });
    expect(result.questions[0]).toMatchObject({ id: 7, activityTracking: capability(1), correctIndex: 1, explanation: "PRIVATE-SOLUTION" });
    expect(result.questions[0].attemptToken).toEqual(expect.any(String));
    expect(JSON.stringify(vi.mocked(issueAssessmentActivity).mock.calls)).not.toMatch(/PRIVATE|correctIndex|observedCorrect/);
    expect(setHeader).toHaveBeenCalledWith("Cache-Control", "private, no-store");
    expect(filters).toEqual([
      { table: certificationBankVersions, params: [ELECTRICIAN_309A_PROGRAM_KEY, "electrician-309a", "beta", true, false, false] },
      { table: certificationQuestions, params: [42, "beta_approved", true] },
    ]);
  });

  it("splits large banks at the shared 150-item ceiling and pins each question to its own chunk", async () => {
    rows = Array.from({ length: 301 }, (_, index) => row(index + 1));
    const result = await electricianReviewRouter.createCaller(ctx).get309ABetaPractice();
    expect(result.total).toBe(301);
    expect(vi.mocked(issueAssessmentActivity).mock.calls.map(call => call[1].items.length)).toEqual([150, 150, 1]);
    const ids = vi.mocked(issueAssessmentActivity).mock.calls.flatMap(call => {
      expect(assessmentActivityIssueSchema.safeParse(call[1]).success).toBe(true);
      expect(call).toHaveLength(2); // No employer attribution discovery on this non-team course.
      return call[1].items.map(item => item.id);
    });
    expect(ids).toEqual(rows.map(item => String(item.id)));
    for (let index = 0; index < result.questions.length; index++) {
      expect(result.questions[index].activityTracking).toEqual(capability(Math.floor(index / 150) + 1));
    }
  });

  it.each(["declined", "throws"])("keeps beta practice and receipts available when tracking %s", async failure => {
    if (failure === "throws") vi.mocked(issueAssessmentActivity).mockRejectedValue(new Error("Tracking unavailable"));
    else vi.mocked(issueAssessmentActivity).mockResolvedValue({ tracking: false, recorded: false, source: "observed" });
    const result = await electricianReviewRouter.createCaller(ctx).get309ABetaPractice();
    expect(result.total).toBe(1);
    expect(result.questions[0]).toMatchObject({ id: 7, options: ["Original second", "Original first", "Third", "Fourth"], correctIndex: 1 });
    expect(result.questions[0].attemptToken).toEqual(expect.any(String));
    expect(result.questions[0].activityTracking).toBeUndefined();
  });

  it("never issues observations for an absent active bank or malformed undelivered rows", async () => {
    bankExists = false;
    expect(await electricianReviewRouter.createCaller(ctx).get309ABetaPractice()).toEqual({ questions: [], total: 0 });
    expect(issueAssessmentActivity).not.toHaveBeenCalled();
    bankExists = true; rows = [{ ...row(7), options: "malformed-json" }];
    expect(await electricianReviewRouter.createCaller(ctx).get309ABetaPractice()).toEqual({ questions: [], total: 0 });
    expect(issueAssessmentActivity).not.toHaveBeenCalled();
  });

  it("preserves the admin draft gate, legacy preview, and answer-free mock metadata", async () => {
    await expect(electricianReviewRouter.createCaller(ctx).get309ADiagnostic()).rejects.toMatchObject({ code: "FORBIDDEN" });
    const preview = await electricianReviewRouter.createCaller(ctx).get309APublicPreview();
    expect(preview).toEqual(selectCertificationQuestionsForPublicPreview(electricianQuestions, ELECTRICIAN_309A_PROGRAM_KEY));
    const metadata = await electricianReviewRouter.createCaller(ctx).get309ABetaMetadata();
    expect(metadata).toEqual({ total: expect.any(Number) });
    expect(JSON.stringify(metadata)).not.toMatch(/correctIndex|explanation|options|PRIVATE/);
    expect(issueAssessmentActivity).not.toHaveBeenCalled();
  });

  it("passes real per-question capabilities through the actual bank adapter with fresh-query settings", async () => {
    const delivered = await electricianReviewRouter.createCaller(ctx).get309ABetaPractice();
    hook.query.mockReturnValue({ data: delivered, isSuccess: true, isLoading: false, isError: false });
    const bank = useElectrician309ABank();
    expect(bank.questions[0]).toMatchObject({ activityTracking: capability(1), attemptToken: delivered.questions[0].attemptToken, id: 7 });
    expect(bank.questions[0].options).toEqual(delivered.questions[0].options);
    expect(hook.query).toHaveBeenCalledWith({ accessToken: "signed-access-token" }, expect.objectContaining({ staleTime: 0, gcTime: 0, refetchOnMount: "always" }));
  });
});
