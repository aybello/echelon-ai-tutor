import { beforeEach, describe, expect, it, vi } from "vitest";
import { appRouter } from "./routers";
import { getDb } from "./db";
import { questions } from "../drizzle/schema";
import { verifyMockSession, mockOwner, scoredMockQuestionNums } from "./mockExamSession";
import { ENV } from "./_core/env";
import { WPI_CLASS4_BANK, WPI_CLASS4_BLUEPRINT, WPI_COLLECTION_BANK, WPI_COLLECTION_BLUEPRINT } from "./mockBlueprint";
vi.mock("./db", async importOriginal => ({ ...await importOriginal<typeof import("./db")>(), getDb: vi.fn() }));
vi.mock("./_core/learningIdentity", () => ({ resolveLearningIdentity: vi.fn(async () => ({ userId: null, studentEmail: "mock@example.test" })) }));
vi.mock("./_core/accessService", async importOriginal => ({ ...await importOriginal<typeof import("./_core/accessService")>(), resolveAccessForRequest: vi.fn(async () => true) }));
let rows: any[], version: number;
const caller = appRouter.createCaller({ user: null, studentEmail: "mock@example.test", req: { headers: {}, cookies: {} }, res: {} } as any);
beforeEach(() => {
  ENV.cookieSecret = "test-only-blueprint-secret"; version = 2025;
  let id = 0;
  rows = WPI_CLASS4_BLUEPRINT.flatMap(area => ["recall", "application"].flatMap(cognitiveLevel => ["yes", "no"].flatMap(isCalc =>
    Array.from({ length: 50 }, () => ({ id: ++id, questionNum: id, bankKey: WPI_CLASS4_BANK,
      module: area.module === WPI_CLASS4_BLUEPRINT[1].module ? "Treatment Process" : area.module, cognitiveLevel, isCalc,
      question: `Fixture ${id}`, options: '["A","B","C","D"]', correctIndex: 0, explanation: "Fixture" })))));
  vi.mocked(getDb).mockResolvedValue({ select: () => {
    let result: unknown[] = [];
    const chain: any = {
      from(table: unknown) { result = table === questions ? rows : [{ bankKey: WPI_CLASS4_BANK, modules: "[]", moduleTargets: "{}", blueprintVersion: version }]; return chain; },
      where() { return chain; }, limit() { return Promise.resolve(result); },
      then(resolve: any, reject: any) { return Promise.resolve(result).then(resolve, reject); },
    };
    return chain;
  } } as any);
});
describe("issued Class IV mock blueprint wiring", () => {
  it("issues a signed full exam with the exact joint quotas and no answer disclosure", async () => {
    const issued = await caller.exam.startMock({ courseKey: WPI_CLASS4_BANK });
    expect(issued.questions).toHaveLength(110); expect(issued.token).toBeTruthy();
    const scored = new Set(scoredMockQuestionNums(verifyMockSession(issued.token, mockOwner({ userId: null, studentEmail: "mock@example.test" }))));
    const selected = issued.questions.filter(q => scored.has(q.id)).map(q => rows.find(row => row.questionNum === q.id));
    expect(selected).toHaveLength(100);
    expect(selected.filter(q => q.isCalc === "yes")).toHaveLength(16);
    expect(selected.filter(q => q.cognitiveLevel === "recall")).toHaveLength(25);
    expect(selected.filter(q => [WPI_CLASS4_BLUEPRINT[1].module, "Treatment Process"].includes(q.module))).toHaveLength(42);
    for (const q of issued.questions) { expect(q).not.toHaveProperty("correctIndex"); expect(q).not.toHaveProperty("explanation"); }
  });
  it("rejects an activated profile with missing classifications instead of silently issuing an unbalanced exam", async () => {
    rows = rows.map(q => ({ ...q, cognitiveLevel: null }));
    await expect(caller.exam.startMock({ courseKey: WPI_CLASS4_BANK })).rejects.toThrow("balanced mock exam");
  });
  it("keeps the current learner journey available until the verified profile is activated", async () => {
    version = 1; rows = rows.map(q => ({ ...q, cognitiveLevel: null }));
    expect((await caller.exam.startMock({ courseKey: WPI_CLASS4_BANK })).questions).toHaveLength(110);
  });
});

describe("issued Collection mock blueprint wiring", () => {
  function collectionRows() {
    let id = 0;
    rows = WPI_COLLECTION_BLUEPRINT.flatMap(area => ["recall", "application"].flatMap(cognitiveLevel => ["yes", "no"].flatMap(isCalc =>
      Array.from({ length: 30 }, () => ({ id: ++id, questionNum: id, bankKey: WPI_COLLECTION_BANK,
        module: area.module, cognitiveLevel, isCalc, question: `Collection fixture ${id}`,
        options: '["A","B","C","D"]', correctIndex: 0, explanation: "Fixture" })))));
  }
  it("uses the canonical bank behind the public Collection course key", async () => {
    collectionRows();
    const issued = await caller.exam.startMock({ courseKey: "wpi-class4-water-coll" });
    expect(issued.questions).toHaveLength(100);
    expect(issued.token).toBeTruthy();
    const selected = issued.questions.map(q => rows.find(row => row.questionNum === q.id));
    expect(selected.filter(q => q.isCalc === "yes")).toHaveLength(16);
    expect(selected.filter(q => q.cognitiveLevel === "recall")).toHaveLength(20);
    for (const area of WPI_COLLECTION_BLUEPRINT) {
      expect(selected.filter(q => q.module === area.module)).toHaveLength(area.total);
    }
    for (const q of issued.questions) {
      expect(q).not.toHaveProperty("correctIndex");
      expect(q).not.toHaveProperty("explanation");
    }
  });
  it("refuses an activated Collection profile with incomplete classification", async () => {
    collectionRows(); rows = rows.map(q => ({ ...q, cognitiveLevel: null }));
    await expect(caller.exam.startMock({ courseKey: "wpi-class4-water-coll" })).rejects.toThrow("balanced mock exam");
  });
  it("preserves the existing Collection journey before metadata activation", async () => {
    collectionRows(); version = 1; rows = rows.map(q => ({ ...q, cognitiveLevel: null }));
    expect((await caller.exam.startMock({ courseKey: "wpi-class4-water-coll" })).questions).toHaveLength(100);
  });
});
