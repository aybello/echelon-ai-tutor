import { beforeEach, describe, expect, it, vi } from "vitest";
import { appRouter } from "./routers";
import { getDb } from "./db";
import { questions } from "../drizzle/schema";
import { ENV } from "./_core/env";
import { mockOwner, scoredMockQuestionNums, verifyMockSession } from "./mockExamSession";
import { resolveLearningIdentity } from "./_core/learningIdentity";
import { resolveAttemptAttribution } from "./teams/attemptAttribution";
import { issueAssessmentActivity } from "./assessmentActivity";
import { WPI_CLASS4_BANK } from "./mockBlueprint";

vi.mock("./db", async original => ({ ...await original<typeof import("./db")>(), getDb: vi.fn() }));
vi.mock("./_core/learningIdentity", () => ({ resolveLearningIdentity: vi.fn() }));
vi.mock("./_core/accessService", async original => ({ ...await original<typeof import("./_core/accessService")>(), resolveAccessForRequest: vi.fn(async () => true) }));
vi.mock("./teams/attemptAttribution", () => ({ resolveAttemptAttribution: vi.fn(), validateIssuedAttribution: vi.fn() }));
vi.mock("./assessmentActivity", async original => ({ ...await original<typeof import("./assessmentActivity")>(), issueAssessmentActivity: vi.fn() }));

const identity = { userId: null, studentEmail: "mock-tracking@example.test", orgId: null, organizationMemberId: null };
const personal = { orgId: null, organizationMemberId: null, flexLicenceId: null };
const ctx = { user: null, studentEmail: identity.studentEmail, req: { headers: {}, cookies: {} }, res: {} } as any;
const capability = { tracking: true as const, sessionId: "f9b1ef04-9c37-4d62-bc99-78a7c593b974", capability: "unit-test-only", nextSequence: 2, expiresAt: "2026-11-20T00:00:00.000Z", source: "observed" as const };

function questionDb(bankKey: string) {
  const rows = Array.from({ length: 140 }, (_, i) => ({ id: i + 1, questionNum: i + 1, bankKey,
    module: "Safety", question: `Issued fixture ${i + 1}`, options: '["Original A","Original B","Original C","Original D"]',
    correctIndex: 2, explanation: `PRIVATE rationale ${i + 1}`, steps: '[{"l":"PRIVATE step","c":"PRIVATE calculation"}]', tip: "PRIVATE hint" }));
  vi.mocked(getDb).mockResolvedValue({ select: () => {
    let result: unknown[] = [];
    const chain: any = {
      from(table: unknown) { result = table === questions ? rows : [{ bankKey, modules: '["Safety"]', moduleTargets: '{"Safety":100}', blueprintVersion: 1 }]; return chain; },
      where() { return chain; }, limit() { return Promise.resolve(result); },
      then(resolve: any, reject: any) { return Promise.resolve(result).then(resolve, reject); },
    };
    return chain;
  } } as any);
}

beforeEach(() => {
  vi.clearAllMocks();
  ENV.cookieSecret = "unit-test-mock-tracking-secret";
  vi.mocked(resolveLearningIdentity).mockResolvedValue(identity);
  vi.mocked(resolveAttemptAttribution).mockResolvedValue(personal);
  vi.mocked(issueAssessmentActivity).mockResolvedValue(capability);
});

describe("mock issued supplemental activity", () => {
  it.each([["class1-water", "class1-water"], [WPI_CLASS4_BANK, WPI_CLASS4_BANK]] as const)("binds %s to the signed UUID and all actual delivered options without answer keys", async (courseKey, physicalBank) => {
    questionDb(physicalBank);
    const issued = await appRouter.createCaller(ctx).exam.startMock({ courseKey });
    const manifest = verifyMockSession(issued.token, mockOwner(identity));
    const [, snapshot, attribution] = vi.mocked(issueAssessmentActivity).mock.calls[0];
    expect(snapshot).toEqual({ courseKey, mode: "mock", timed: true, sourceSessionId: manifest.sessionId,
      items: issued.questions.map(q => ({ id: `${physicalBank}:${q.id}`, prompt: q.question, topic: q.module,
        options: q.options.map((text, index) => ({ id: String(index), text })), steps: [] })) });
    expect(snapshot.items).toHaveLength(courseKey === WPI_CLASS4_BANK ? 110 : 100);
    expect(scoredMockQuestionNums(manifest)).toHaveLength(100);
    expect(attribution).toEqual(personal);
    expect(issued.activityTracking).toEqual(capability);
    expect(JSON.stringify(snapshot)).not.toMatch(/PRIVATE|correctIndex|explanation|tip|isCalc|scored/);
    expect(JSON.stringify(issued.questions)).not.toMatch(/PRIVATE|correctIndex|explanation/);
  });

  it("carries only existing conservative issued org/member/licence attribution", async () => {
    questionDb("class1");
    const attribution = { orgId: 17, organizationMemberId: 42, flexLicenceId: 9 };
    vi.mocked(resolveAttemptAttribution).mockResolvedValue(attribution);
    await appRouter.createCaller(ctx).exam.startMock({ courseKey: "class1-water" });
    expect(issueAssessmentActivity).toHaveBeenCalledWith(ctx, expect.objectContaining({ courseKey: "class1-water", mode: "mock" }), attribution);
    expect(resolveAttemptAttribution).toHaveBeenCalledWith(identity, "class1-water");
  });

  it("keeps ordinary issuance available when optional tracking declines", async () => {
    questionDb("class1");
    vi.mocked(issueAssessmentActivity).mockResolvedValue({ tracking: false, recorded: false, source: "observed" });
    const issued = await appRouter.createCaller(ctx).exam.startMock({ courseKey: "class1-water" });
    expect(issued.questions).toHaveLength(100);
    expect(issued.token).toBeTruthy();
    expect(issued.activityTracking.tracking).toBe(false);
  });
});

describe("mock history privacy", () => {
  const input = { sessionId: "leaked-named-session", examType: "class1" as const };
  it("returns no named rows and never queries storage for an unauthenticated bare UUID", async () => {
    vi.mocked(resolveLearningIdentity).mockResolvedValue({ userId: null, studentEmail: null, orgId: null, organizationMemberId: null });
    expect(await appRouter.createCaller({ ...ctx, studentEmail: null }).exam.getHistory(input)).toEqual([]);
    expect(getDb).not.toHaveBeenCalled();
  });

  it.each([{ userId: null, studentEmail: identity.studentEmail }, { userId: 5, studentEmail: null }])("retains verified history with identity predicates rather than the input UUID: %j", async owner => {
    vi.mocked(resolveLearningIdentity).mockResolvedValue({ ...identity, ...owner });
    const where = vi.fn();
    const row = { id: 1, sessionId: "owned-session", userId: owner.userId, studentEmail: owner.studentEmail, moduleBreakdown: '{"Safety":{"correct":4,"total":5}}' };
    const chain: any = { from() { return chain; }, where(condition: unknown) { where(condition); return chain; }, orderBy() { return chain; }, limit: vi.fn(async () => [row]) };
    vi.mocked(getDb).mockResolvedValue({ select: () => chain } as any);
    expect(await appRouter.createCaller(ctx).exam.getHistory(input)).toEqual([{ ...row, moduleBreakdown: { Safety: { correct: 4, total: 5 } } }]);
    const chunks = (where.mock.calls[0][0] as any).queryChunks;
    const flattened = JSON.stringify(chunks, (key, value) => ["table", "config"].includes(key) ? undefined : value);
    expect(flattened).not.toContain(input.sessionId);
    expect(where).toHaveBeenCalledOnce();
    expect(chain.limit).toHaveBeenCalledWith(5);
  });
});
