import { beforeEach, describe, expect, it, vi } from "vitest";
import { appRouter } from "./routers";
import { getDb } from "./db";
import { questions } from "../drizzle/schema";
import { ENV } from "./_core/env";
import { mockOwner, verifyMockSession } from "./mockExamSession";
import { ontarioWastewaterMockProfile, reviewedWastewaterMockArea, WASTEWATER_MOCK_AREAS as areas } from "../shared/ontarioWastewaterMock";

vi.mock("./db", async original => ({ ...await original<typeof import("./db")>(), getDb: vi.fn() }));
vi.mock("./_core/learningIdentity", () => ({ resolveLearningIdentity: vi.fn(async () => ({ userId: null, studentEmail: "learner@example.invalid" })) }));
vi.mock("./_core/accessService", async original => ({ ...await original<typeof import("./_core/accessService")>(), resolveAccessForRequest: vi.fn(async () => true) }));
vi.mock("./teams/attemptAttribution", async original => {
  const actual = await original<typeof import("./teams/attemptAttribution")>();
  return { ...actual, resolveAttemptAttribution: vi.fn(async () => ({ ...actual.PERSONAL_ATTRIBUTION })) };
});
const caller = appRouter.createCaller({ user: null, studentEmail: "learner@example.invalid", req: { headers: {}, cookies: {} }, res: {} } as any);
let bank: string;
let rows: any[];
let metadata: any;
function setupBank(key: string, explicitClassifications = false) {
  bank = key;
  // Legacy fallback fixtures must not impersonate hash-bound snapshot IDs.
  let id = 900000;
  const modules = bank === "class1-wastewater"
    ? ["Primary Treatment", "Secondary Treatment", "Disinfection", "Regulations, Safety & Operations"]
    : ["Equipment O&M", "Treatment Process", "Laboratory Analysis", "Safety & Administration"];
  rows = modules.flatMap((module, index) => Array.from({ length: 65 }, () => ({
    id: ++id, questionNum: id, bankKey: bank, module,
    question: `Synthetic fixture ${id}`, options: '["A","B","C","D"]', correctIndex: 0, explanation: "Synthetic explanation",
    ...(explicitClassifications ? { blueprintObjective: Object.values(areas)[index], reviewStatus: "approved" } : {}),
  })));
  // Deliberately stale target JSON: metadata returned to mock pages must use the
  // same reviewed profile as startMock, not these chapter-based targets.
  metadata = { bankKey: bank, modules: JSON.stringify(modules), moduleTargets: JSON.stringify({ [modules[0]]: 100 }), blueprintVersion: 1, contentVersion: 2 };
}
beforeEach(() => {
  ENV.cookieSecret = "test-only-ontario-secret";
  setupBank("class2-wastewater");
  vi.mocked(getDb).mockResolvedValue({ select: () => {
    let result: unknown[];
    const chain: any = {
      from(table: unknown) { result = table === questions ? rows : [metadata]; return chain; },
      where() { return chain; }, limit() { return Promise.resolve(result); },
      then(resolve: any, reject: any) { return Promise.resolve(result).then(resolve, reject); },
    };
    return chain;
  } } as any);
});

describe("Ontario wastewater mock issuance", () => {
  it.each([["class1-wastewater", "class1-ww", true], ["class2-wastewater", "class2-ww", false]] as const)(
    "issues %s through its canonical course with exact mapped quotas and no answer/governance disclosure", async (key, course, explicit) => {
      setupBank(key, explicit);
      const meta = await caller.quiz.getBankMeta({ bankKey: key });
      expect(meta?.modules).toEqual(JSON.parse(metadata.modules));
      expect(meta?.moduleTargets).toEqual(ontarioWastewaterMockProfile(key)!.targets);
      const issued = await caller.exam.startMock({ courseKey: course });
      expect(issued.questions).toHaveLength(100);
      expect(new Set(issued.questions.map(q => q.id)).size).toBe(100);
      expect(issued).toMatchObject({ examType: course, duration: 10800, preview: false });
      const manifest = verifyMockSession(issued.token, mockOwner({ userId: null, studentEmail: "learner@example.invalid" }));
      expect(manifest).toMatchObject({ courseKey: course, bankKey: key });
      for (const [area, quota] of Object.entries(ontarioWastewaterMockProfile(key)!.targets)) {
        expect(issued.questions.filter(q => reviewedWastewaterMockArea(key, rows.find(row => row.questionNum === q.id)) === area)).toHaveLength(quota);
      }
      for (const q of issued.questions) {
        expect(q.module).toBe(rows.find(row => row.questionNum === q.id).module);
        for (const field of ["correctIndex", "explanation", "blueprintObjective", "reviewStatus"]) expect(q).not.toHaveProperty(field);
      }
    },
  );
  it("rejects unclassified detailed Class I chapters with a recoverable coverage error", async () => {
    setupBank("class1-wastewater");
    await expect(caller.exam.startMock({ courseKey: "class1-ww" })).rejects.toMatchObject({ code: "PRECONDITION_FAILED", message: expect.stringContaining("Practice remains available") });
  });
  it("rejects Class II lab shortage despite a surplus of other chapters", async () => {
    rows = rows.filter(row => row.module !== "Laboratory Analysis");
    await expect(caller.exam.startMock({ courseKey: "class2-ww" })).rejects.toMatchObject({ code: "PRECONDITION_FAILED" });
  });
  it("preserves valid legacy Class I area-labelled banks and exam settings", async () => {
    setupBank("class1-wastewater");
    rows = rows.map((row, index) => ({ ...row, module: Object.values(areas)[Math.floor(index / 65)] }));
    const issued = await caller.exam.startMock({ courseKey: "class1-ww" });
    expect(issued).toMatchObject({ duration: 10800, preview: false });
    expect(issued.questions).toHaveLength(100);
  });
  it("never uses malformed or duplicate question identities to meet quotas", async () => {
    rows.push(rows[0]);
    await expect(caller.exam.startMock({ courseKey: "class2-ww" })).rejects.toMatchObject({ code: "PRECONDITION_FAILED" });
    setupBank("class2-wastewater");
    rows = rows.map(row => row.module === "Laboratory Analysis" ? { ...row, options: "invalid JSON" } : row);
    await expect(caller.exam.startMock({ courseKey: "class2-ww" })).rejects.toMatchObject({ code: "PRECONDITION_FAILED" });
  });
});
