/**
 * OIT Question Bank integrity tests — Database Edition
 *
 * Verifies the OIT bank in the database has correct structure and valid data.
 * Queries the `questions` and `question_bank_meta` tables via Drizzle.
 * No static TS imports from deleted client-side question files.
 */
import { describe, it, expect, beforeAll } from "vitest";
import { drizzle } from "drizzle-orm/mysql2";
import { eq, sql } from "drizzle-orm";
import { questions, questionBankMeta } from "../drizzle/schema";

// ── DB setup ──────────────────────────────────────────────────────────────────
let db: ReturnType<typeof drizzle> | null = null;

type QRow = {
  id: number;
  questionNum: number;
  module: string;
  difficulty: string | null;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
  tip: string | null;
  isCalc: string;
};

let QUESTIONS: QRow[] = [];
let OIT_MODULES: string[] = [];

beforeAll(async () => {
  if (!process.env.DATABASE_URL) {
    console.warn("[questions.bank] Skipping: DATABASE_URL not set");
    return;
  }
  db = drizzle(process.env.DATABASE_URL);

  // Load all OIT questions from DB
  const rows = await db.select().from(questions).where(eq(questions.bankKey, "oit"));
  QUESTIONS = rows.map(r => ({
    id: r.id,
    questionNum: r.questionNum,
    module: r.module,
    difficulty: r.difficulty,
    question: r.question,
    options: JSON.parse(r.options) as string[],
    correctIndex: r.correctIndex,
    explanation: r.explanation,
    tip: r.tip,
    isCalc: r.isCalc,
  }));

  // Load module list from bank metadata
  const metaRows = await db
    .select()
    .from(questionBankMeta)
    .where(eq(questionBankMeta.bankKey, "oit"))
    .limit(1);
  if (metaRows.length > 0) {
    const parsed = JSON.parse(metaRows[0].modules);
    // modules may be an array of strings or objects with a name field
    OIT_MODULES = (parsed as Array<string | { name: string }>).map(m =>
      typeof m === "string" ? m : m.name
    );
  } else {
    // Derive from distinct modules in the question rows as fallback
    OIT_MODULES = [...new Set(QUESTIONS.map(q => q.module))];
  }
});

describe("OIT Question Bank", () => {
  it("loads a substantial number of questions (at least 400)", () => {
    if (!db) return;
    expect(QUESTIONS.length).toBeGreaterThanOrEqual(400);
  });

  it("all questions have required fields", () => {
    if (!db) return;
    for (const q of QUESTIONS) {
      expect(q.questionNum, `Q${q.questionNum} missing questionNum`).toBeDefined();
      expect(q.module, `Q${q.questionNum} missing module`).toBeTruthy();
      expect(q.question, `Q${q.questionNum} missing question text`).toBeTruthy();
      expect(Array.isArray(q.options), `Q${q.questionNum} missing options array`).toBe(true);
      expect(q.options.length, `Q${q.questionNum} must have 4 options`).toBe(4);
      expect(q.correctIndex, `Q${q.questionNum} missing correctIndex`).toBeGreaterThanOrEqual(0);
      expect(q.correctIndex, `Q${q.questionNum} correctIndex out of range`).toBeLessThanOrEqual(3);
      expect(q.explanation, `Q${q.questionNum} missing explanation`).toBeTruthy();
    }
  });

  it("all questions have valid difficulty values (easy | medium | hard)", () => {
    if (!db) return;
    const validDiffs = new Set(["easy", "medium", "hard"]);
    for (const q of QUESTIONS) {
      if (q.difficulty !== null) {
        expect(
          validDiffs.has(q.difficulty),
          `Q${q.questionNum} has invalid difficulty: ${q.difficulty}`
        ).toBe(true);
      }
    }
  });

  it("all modules in OIT_MODULES have at least 20 questions", () => {
    if (!db) return;
    const moduleCounts: Record<string, number> = {};
    for (const q of QUESTIONS) {
      moduleCounts[q.module] = (moduleCounts[q.module] ?? 0) + 1;
    }
    for (const mod of OIT_MODULES) {
      const count = moduleCounts[mod] ?? 0;
      expect(count, `Module "${mod}" has only ${count} questions`).toBeGreaterThanOrEqual(20);
    }
  });

  it("question IDs (questionNum) are unique within the OIT bank", () => {
    if (!db) return;
    const nums = QUESTIONS.map(q => q.questionNum);
    const uniqueNums = new Set(nums);
    expect(uniqueNums.size).toBe(QUESTIONS.length);
  });

  it("database row IDs are unique", () => {
    if (!db) return;
    const ids = QUESTIONS.map(q => q.id);
    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toBe(QUESTIONS.length);
  });

  it("all correctIndex values are in range 0–3 (verified via DB COUNT)", async () => {
    if (!db) return;
    const [row] = await db
      .select({ cnt: sql<number>`COUNT(*)` })
      .from(questions)
      .where(
        sql`${questions.bankKey} = 'oit'
            AND (${questions.correctIndex} < 0 OR ${questions.correctIndex} > 3)`
      );
    expect(Number(row.cnt), "found OIT questions with out-of-range correctIndex").toBe(0);
  });

  it("CT-value / disinfection questions exist in the OIT bank", () => {
    if (!db) return;
    const ctQuestions = QUESTIONS.filter(
      q =>
        q.question.toLowerCase().includes("ct value") ||
        q.question.toLowerCase().includes("contact time") ||
        q.explanation.toLowerCase().includes("ct value")
    );
    expect(ctQuestions.length).toBeGreaterThan(0);
  });

  it("Wastewater module questions exist in the OIT bank", () => {
    if (!db) return;
    const wwQuestions = QUESTIONS.filter(
      q =>
        q.module.toLowerCase().includes("wastewater") ||
        q.question.toLowerCase().includes("activated sludge") ||
        q.question.toLowerCase().includes("bod") ||
        q.question.toLowerCase().includes("effluent")
    );
    expect(wwQuestions.length).toBeGreaterThan(0);
  });

  it("Ontario Regulations module has more than 10 questions", () => {
    if (!db) return;
    const regQuestions = QUESTIONS.filter(
      q =>
        q.module === "Ontario Regulations" ||
        q.module.toLowerCase().includes("regulation")
    );
    expect(regQuestions.length).toBeGreaterThan(10);
  });
});
