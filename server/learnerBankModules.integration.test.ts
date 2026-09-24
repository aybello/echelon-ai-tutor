import { drizzle } from "drizzle-orm/mysql2";
import mysql, { type Connection } from "mysql2/promise";
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { getDb } from "./db";
import { quizRouter } from "./routers/quizRouter";

vi.mock("./db", async original => ({
  ...await original<typeof import("./db")>(),
  getDb: vi.fn(),
}));

const suite = process.env.DATABASE_URL ? describe : describe.skip;
let db: Connection;

suite("learner bank module metadata", () => {
  beforeAll(async () => {
    db = await mysql.createConnection(process.env.DATABASE_URL!);
    for (const table of ["question_bank_meta", "questions"]) {
      const [definition] = await db.query<any[]>(`SHOW CREATE TABLE ${table}`);
      await db.query(String(definition[0]["Create Table"]).replace(/^CREATE TABLE /, "CREATE TEMPORARY TABLE "));
    }
  });

  afterAll(async () => { if (db) await db.end(); });

  beforeEach(async () => {
    vi.mocked(getDb).mockResolvedValue(drizzle(db) as any);
    await db.execute("DELETE FROM questions");
    await db.execute("DELETE FROM question_bank_meta");
  });

  it("does not expose stale Class 1 Wastewater module labels or stale question totals", async () => {
    const bankKey = "class1-wastewater";
    const staleMetadata = [
      "Wastewater Characteristics & Preliminary Treatment",
      "Primary Treatment",
      "Secondary Treatment",
    ];
    await db.execute(
      "INSERT INTO question_bank_meta (bankKey, modules, totalQuestions, contentVersion) VALUES (?, ?, ?, ?)",
      [bankKey, JSON.stringify(staleMetadata), 815, 1],
    );
    await db.execute(
      `INSERT INTO questions (bankKey, questionNum, module, question, options, correctIndex, explanation, isCalc, reviewStatus)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [bankKey, 1, "Wastewater Treatment", "Fixture question", '["A","B","C","D"]', 0, "Fixture explanation", "no", "approved"],
    );

    const caller = quizRouter.createCaller({ user: null, req: { headers: {} }, res: {} } as any);
    const meta = await caller.getBankMeta({ bankKey });

    expect(meta?.modules).toEqual(["Wastewater Treatment"]);
    expect(meta?.totalQuestions).toBe(1);
  });

  it("keeps a curated module ordering only when each displayed label has learner-visible questions", async () => {
    const bankKey = "class1-water";
    const modules = ["Disinfection", "Distribution"];
    await db.execute(
      "INSERT INTO question_bank_meta (bankKey, modules, totalQuestions, contentVersion) VALUES (?, ?, ?, ?)",
      [bankKey, JSON.stringify(modules), 2, 1],
    );
    for (const [questionNum, module] of [[1, "Distribution"], [2, "Disinfection"]] as const) {
      await db.execute(
        `INSERT INTO questions (bankKey, questionNum, module, question, options, correctIndex, explanation, isCalc, reviewStatus)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [bankKey, questionNum, module, `Fixture ${questionNum}`, '["A","B","C","D"]', 0, "Fixture explanation", "no", "approved"],
      );
    }

    const caller = quizRouter.createCaller({ user: null, req: { headers: {} }, res: {} } as any);
    const meta = await caller.getBankMeta({ bankKey });

    expect(meta?.modules).toEqual(modules);
  });

  it("does not expose metadata module filters when the bank has no learner-visible questions", async () => {
    const bankKey = "class2-wastewater";
    await db.execute(
      "INSERT INTO question_bank_meta (bankKey, modules, totalQuestions, contentVersion) VALUES (?, ?, ?, ?)",
      [bankKey, JSON.stringify(["Primary Treatment"]), 1, 1],
    );
    await db.execute(
      `INSERT INTO questions (bankKey, questionNum, module, question, options, correctIndex, explanation, isCalc, reviewStatus)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [bankKey, 1, "Primary Treatment", "Held fixture", '["A","B","C","D"]', 0, "Fixture explanation", "no", "in_review"],
    );

    const caller = quizRouter.createCaller({ user: null, req: { headers: {} }, res: {} } as any);
    const meta = await caller.getBankMeta({ bankKey });

    expect(meta?.modules).toEqual([]);
  });
});
