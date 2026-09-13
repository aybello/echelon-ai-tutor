import { drizzle } from "drizzle-orm/mysql2";
import { getDb } from "./db";
import { quizRouter } from "./routers/quizRouter";
import { normalizeWpiClass4Module } from "./mockBlueprint";
vi.mock("./db", async original => ({ ...await original<typeof import("./db")>(), getDb: vi.fn() }));
vi.mock("./_core/accessService", async original => ({ ...await original<typeof import("./_core/accessService")>(), resolveAccessForRequest: vi.fn(async () => true) }));
vi.mock("./_core/learningIdentity", () => ({ resolveLearningIdentity: vi.fn(async () => ({ userId: null, studentEmail: null })) }));
import mysql, { type Connection } from "mysql2/promise";
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { applyWpiBlueprintRelease, planWpiBlueprintRelease } from "./wpiBlueprintRelease";
import { WPI_CLASS4_BANK, WPI_CLASS4_BLUEPRINT } from "./mockBlueprint";
let db: Connection;
const suite = process.env.DATABASE_URL ? describe : describe.skip;
async function snapshot() {
  const [meta] = await db.execute<any[]>("SELECT * FROM question_bank_meta WHERE bankKey = ?", [WPI_CLASS4_BANK]);
  const [rows] = await db.execute<any[]>("SELECT * FROM questions WHERE bankKey = ? ORDER BY questionNum", [WPI_CLASS4_BANK]);
  return { metadata: meta[0], questions: rows };
}
suite("Class IV profile activation with MySQL", () => {
  beforeAll(async () => {
    db = await mysql.createConnection(process.env.DATABASE_URL!);
    // Connection-local shadows: neither fixtures nor release code can touch real bank rows.
    for (const table of ["question_bank_meta", "questions"]) {
      const [definition] = await db.query<any[]>(`SHOW CREATE TABLE ${table}`);
      await db.query(String(definition[0]["Create Table"]).replace(/^CREATE TABLE /, "CREATE TEMPORARY TABLE "));
    }
  });
  afterAll(async () => { if (db) await db.end(); });
  beforeEach(async () => {
    vi.mocked(getDb).mockResolvedValue(drizzle(db) as any);
    await db.execute("DELETE FROM questions"); await db.execute("DELETE FROM question_bank_meta");
    await db.execute("INSERT INTO question_bank_meta (bankKey, modules, totalQuestions, contentVersion) VALUES (?, '[]', 800, 2)", [WPI_CLASS4_BANK]);
    const rows: unknown[][] = []; let id = 0;
    for (const area of WPI_CLASS4_BLUEPRINT) for (const level of ["recall", "application"]) for (const calc of ["yes", "no"]) {
      for (let i = 0; i < 50; i++) rows.push([WPI_CLASS4_BANK, ++id, area.module, `QA ${id}`, '["A","B","C","D"]', 0, "Fixture", level, calc, "approved"]);
    }
    await db.query("INSERT INTO questions (bankKey,questionNum,module,question,options,correctIndex,explanation,cognitiveLevel,isCalc,reviewStatus) VALUES ?", [rows]);
  });
  it("uses a consistent dry-run, commits only metadata and is idempotent", async () => {
    await db.query("START TRANSACTION WITH CONSISTENT SNAPSHOT, READ ONLY");
    const before = await snapshot();
    const plan = planWpiBlueprintRelease(before.metadata, before.questions);
    await db.rollback();
    let backup: unknown;
    const result = await applyWpiBlueprintRelease(db, plan.sha256, async value => { backup = value; });
    expect(result.applied).toBe(true); expect(backup).toEqual(before);
    const after = await snapshot();
    expect(after.metadata).toMatchObject({ blueprintVersion: 2025, recallTargetPct: 25, minCalcPerMock: 16, contentVersion: 3 });
    expect(after.questions).toEqual(before.questions);
    expect((await applyWpiBlueprintRelease(db, plan.sha256, async () => { throw new Error("Must not back up a no-op"); })).applied).toBe(false);
  });
  it("rolls back on stale evidence, missing classifications or backup failure", async () => {
    const before = await snapshot(); const plan = planWpiBlueprintRelease(before.metadata, before.questions);
    await expect(applyWpiBlueprintRelease(db, "a".repeat(64), async () => {})).rejects.toThrow("changed");
    await expect(applyWpiBlueprintRelease(db, plan.sha256, async () => { throw new Error("disk full"); })).rejects.toThrow("disk full");
    expect(await snapshot()).toEqual(before);
    await db.execute("UPDATE questions SET cognitiveLevel = NULL");
    const incomplete = await snapshot();
    await expect(applyWpiBlueprintRelease(db, planWpiBlueprintRelease(incomplete.metadata, incomplete.questions).sha256, async () => {})).rejects.toThrow("Insufficient");
    expect((await snapshot()).metadata.blueprintVersion).toBe(1);
  });
  it("uses canonical practice filters with legacy SQL rows and consistent flashcard modules", async () => {
    const synonyms = ["Equipment Operation & Maintenance", "Treatment Process", "Laboratory Analysis", "Safety & Admin"];
    for (const [i, area] of WPI_CLASS4_BLUEPRINT.entries()) {
      await db.execute("UPDATE questions SET module = ? WHERE module = ? AND MOD(questionNum, 2) = 0", [synonyms[i], area.module]);
    }
    await db.execute("UPDATE question_bank_meta SET modules = ?, moduleTargets = ?", [JSON.stringify(synonyms), JSON.stringify(Object.fromEntries(synonyms.map((name, i) => [name, WPI_CLASS4_BLUEPRINT[i].total])))]);
    const caller = quizRouter.createCaller({ user: null, req: { headers: {} }, res: {} } as any);
    const meta = await caller.getBankMeta({ bankKey: WPI_CLASS4_BANK });
    expect(meta?.modules).toEqual(synonyms.map(normalizeWpiClass4Module));
    const flashcards = await caller.getQuestions({ bankKey: WPI_CLASS4_BANK });
    for (const area of WPI_CLASS4_BLUEPRINT) {
      expect(flashcards.questions.some(q => q.module === area.module)).toBe(true);
      const page = await caller.getRandomQuestions({ bankKey: WPI_CLASS4_BANK, module: area.module });
      expect(page.total).toBe(200); // All canonical and legacy rows qualify.
      expect(page.questions).toHaveLength(50);
      expect(page.questions.every(q => q.module === area.module)).toBe(true);
    }
  });

});
