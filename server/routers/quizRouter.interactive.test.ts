import { beforeEach, describe, expect, it, vi } from "vitest";
import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import type { TrpcContext } from "../_core/context";
import { router } from "../_core/trpc";
import { quizRouter } from "./quizRouter";
import { getDb } from "../db";
import { resolveAccessByEmail } from "../_core/access";
import { verifySubscriptionToken } from "../_core/subscriptionToken";
import { issuePracticeReceipt } from "../practiceQuestionReceipt";

vi.mock("../db", () => ({ getDb: vi.fn() }));
vi.mock("../_core/access", async importOriginal => ({
  ...await importOriginal<typeof import("../_core/access")>(),
  resolveAccessByEmail: vi.fn(),
}));
vi.mock("../_core/subscriptionToken", () => ({ verifySubscriptionToken: vi.fn() }));
vi.mock("../practiceQuestionReceipt", () => ({
  practiceIdentity: vi.fn(async ctx => ({ owner: "fixture-owner", context: ctx })),
  issuePracticeReceipt: vi.fn(async (_bank, _ids, _owner, preview) => preview ? "preview-receipt" : "paid-receipt"),
  permitsPracticeAttempt: vi.fn(), practiceReceiptAttribution: vi.fn(),
}));
vi.mock("../_core/learningIdentity", () => ({ resolveLearningIdentity: vi.fn().mockResolvedValue({ userId: null, studentEmail: null }) }));
vi.mock("../teams/attemptAttribution", () => ({ resolveAttemptAttribution: vi.fn(), validateIssuedAttribution: vi.fn() }));

const ctx = { user: null, studentEmail: null, req: { headers: {} }, res: {} } as unknown as TrpcContext;
const input = { bankKey: "class1-water", accessToken: "synthetic-valid-token", previewSurface: "practice" as const };
const rows = Array.from({ length: 30 }, (_, i) => ({
  id: i + 1, bankKey: "class1-water", questionNum: i + 1, module: "Module", difficulty: "medium",
  question: `Question ${i + 1}`, options: '["a","b","c","d"]', correctIndex: 0,
  explanation: "Explanation", steps: null, tip: null, isCalc: "no", topic: null, cognitiveLevel: null,
}));
const select = vi.fn(() => ({ from: () => ({ where: () => ({ orderBy: async () => rows }) }) }));
const httpRouter = router({ quiz: quizRouter });

function request(method: "GET" | "POST", procedure: string, payload: unknown) {
  const encoded = JSON.stringify({ json: payload });
  const url = `http://localhost/api/trpc/quiz.${procedure}${method === "GET" ? `?input=${encodeURIComponent(encoded)}` : ""}`;
  return fetchRequestHandler({
    endpoint: "/api/trpc",
    req: new Request(url, method === "POST"
      ? { method, headers: { "content-type": "application/json" }, body: encoded }
      : { method }),
    router: httpRouter,
    createContext: () => ctx,
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  select.mockImplementation(() => ({ from: () => ({ where: () => ({ orderBy: async () => rows }) }) }));
  vi.mocked(getDb).mockResolvedValue({ select } as never);
  vi.mocked(verifySubscriptionToken).mockResolvedValue({ email: "fixture@example.test", examTypes: ["class1-water"] });
});

describe("interactive question working set", () => {
  it.each(["electrician-309a", "electrician-309a-demo"])(
    "rejects direct POST for %s before database or entitlement lookup", async bankKey => {
      const response = await request("POST", "getInteractiveQuestions", { ...input, bankKey });
      expect(response.status).toBe(403);
      expect(await response.json()).toMatchObject({ error: { json: { data: { code: "FORBIDDEN" } } } });
      expect(getDb).not.toHaveBeenCalled();
      expect(select).not.toHaveBeenCalled();
      expect(verifySubscriptionToken).not.toHaveBeenCalled();
      expect(resolveAccessByEmail).not.toHaveBeenCalled();
      expect(issuePracticeReceipt).not.toHaveBeenCalled();
    },
  );

  it.each(["electrician-309a", "electrician-309a-demo"])(
    "preserves the legacy GET path for %s", async bankKey => {
      const response = await request("GET", "getQuestions", { bankKey });
      expect(response.status).toBe(200);
      expect(getDb).toHaveBeenCalledOnce();
      expect(select).toHaveBeenCalledOnce();
    },
  );

  it("keeps a valid course alias working on direct POST with canonical entitlement", async () => {
    vi.mocked(resolveAccessByEmail).mockResolvedValue({ hasAccess: true });
    const response = await request("POST", "getInteractiveQuestions", { ...input, bankKey: "class1" });
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.result.data.json).toMatchObject({ locked: false, total: 30, trialLimit: 15 });
    expect(body.result.data.json.questions).toHaveLength(30);
    expect(resolveAccessByEmail).toHaveBeenCalledWith("fixture@example.test", "class1-water");
    expect(issuePracticeReceipt).toHaveBeenCalledWith("class1-water", expect.any(Array), "fixture-owner", false, undefined);
  });

  it.each([
    ["practice", 15, 2], ["flashcards", 50, 0], ["mock", 30, 4],
  ] as const)("preserves OIT %s preview and projection on POST", async (previewSurface, limit, minimumCalculations) => {
    const oitRows = Array.from({ length: 65 }, (_, i) => ({
      ...rows[i % rows.length], id: i + 1, questionNum: i + 1, bankKey: "oit",
      module: i >= 60 ? "Wastewater" : `Water ${i % 3}`, isCalc: i < 5 ? "yes" : "no",
    }));
    select.mockImplementation(() => ({ from: () => ({ where: () => ({ orderBy: async () => oitRows }) }) }));
    const payload = { bankKey: "oit", previewSurface };
    const legacy = await request("GET", "getQuestions", payload);
    const interactive = await request("POST", "getInteractiveQuestions", payload);
    expect(legacy.status).toBe(200);
    expect(interactive.status).toBe(200);
    const legacyBody = await legacy.json();
    const body = await interactive.json();
    expect(body.result.data.json).toEqual(legacyBody.result.data.json);
    const result = body.result.data.json;
    expect(result).toMatchObject({ locked: true, total: 65, trialLimit: limit });
    expect(result.questions).toHaveLength(limit);
    expect(result.questions.every((q: { module: string }) => q.module !== "Wastewater")).toBe(true);
    const calculations = result.questions.filter((q: { isCalc: boolean }) => q.isCalc).length;
    expect(calculations).toBeGreaterThanOrEqual(minimumCalculations);
    if (previewSurface === "flashcards") expect(calculations).toBe(0);
    expect(result.questions[0]).toMatchObject({ options: ["a", "b", "c", "d"], correctIndex: 0, attemptToken: "preview-receipt" });
  });

  it("matches the legacy projection and rechecks an expired entitlement for each POST", async () => {
    const caller = quizRouter.createCaller(ctx);
    vi.mocked(resolveAccessByEmail).mockResolvedValue({ hasAccess: true });
    const legacy = await caller.getQuestions(input);
    const paid = await caller.getInteractiveQuestions(input);
    expect(paid).toEqual(legacy);
    expect(paid.locked).toBe(false);
    expect(paid.questions).toHaveLength(30);
    expect(paid.questions[0]).toMatchObject({ question: "Question 1", options: ["a", "b", "c", "d"], correctIndex: 0, attemptToken: "paid-receipt" });
    // Same still-valid token, but the entitlement has expired in the database.
    vi.mocked(resolveAccessByEmail).mockResolvedValue({ hasAccess: false });
    const preview = await caller.getInteractiveQuestions(input);
    expect(preview.locked).toBe(true);
    expect(preview.questions).toHaveLength(15);
    expect(preview.questions.every(q => q.attemptToken === "preview-receipt")).toBe(true);
    expect(resolveAccessByEmail).toHaveBeenCalledTimes(3);
    expect(resolveAccessByEmail).toHaveBeenLastCalledWith("fixture@example.test", "class1-water");
    expect(issuePracticeReceipt).toHaveBeenLastCalledWith("class1-water", expect.any(Array), "fixture-owner", true, undefined);
  });
});
