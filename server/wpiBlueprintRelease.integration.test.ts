import mysql, { type Connection } from "mysql2/promise";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
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
    await db.execute("CREATE TEMPORARY TABLE question_bank_meta LIKE question_bank_meta");
    await db.execute("CREATE TEMPORARY TABLE questions LIKE questions");
  });
  afterAll(async () => { if (db) await db.end(); });
  beforeEach(async () => {
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
});
