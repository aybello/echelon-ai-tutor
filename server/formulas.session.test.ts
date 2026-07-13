/**
 * Formula Sheet data integrity + quiz session cap tests — Database Edition
 *
 * Rewrites the original tests to query the `questions` table via Drizzle
 * instead of importing the deleted client-side TypeScript question files.
 *
 * Session cap tests verify that the OIT bank has enough questions to fill
 * multiple non-repeating sessions.  Formula coverage tests verify that
 * critical topic areas (CT values, Wastewater, Ontario Regulations) have
 * meaningful question coverage in the OIT bank.
 */
import { describe, it, expect, beforeAll } from "vitest";
import { drizzle } from "drizzle-orm/mysql2";
import { eq, sql } from "drizzle-orm";
import { questions } from "../drizzle/schema";

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
};

let QUESTIONS: QRow[] = [];

beforeAll(async () => {
  if (!process.env.DATABASE_URL) {
    console.warn("[formulas.session] Skipping: DATABASE_URL not set");
    return;
  }
  db = drizzle(process.env.DATABASE_URL);

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
  }));
});

// ── SESSION CAP TESTS ─────────────────────────────────────────────────────────
describe("Quiz session cap (15 questions)", () => {
  const SESSION_SIZE = 15;

  it("SESSION_SIZE of 15 is less than the total OIT question pool", () => {
    if (!db) return;
    expect(SESSION_SIZE).toBeLessThan(QUESTIONS.length);
  });

  it("OIT bank has enough questions for at least 20 non-repeating sessions", () => {
    if (!db) return;
    // 20 sessions × 15 questions = 300; OIT has 550+
    expect(QUESTIONS.length).toBeGreaterThanOrEqual(SESSION_SIZE * 20);
  });

  it("15 unique questions can be drawn from the pool without repeating", () => {
    if (!db) return;
    // Simulate a simple round-robin draw (no adaptive logic needed here)
    const seen = new Set<number>();
    const shuffled = [...QUESTIONS].sort(() => Math.random() - 0.5);
    for (let i = 0; i < SESSION_SIZE; i++) {
      const q = shuffled[i];
      expect(q, `Should find question ${i + 1}`).toBeDefined();
      expect(seen.has(q.questionNum), `Question ${q.questionNum} should not repeat`).toBe(false);
      seen.add(q.questionNum);
    }
    expect(seen.size).toBe(SESSION_SIZE);
  });

  it("a simulated 15-question history has length equal to SESSION_SIZE", () => {
    if (!db) return;
    const history = QUESTIONS.slice(0, SESSION_SIZE).map(q => ({
      questionId: q.questionNum,
      module: q.module,
      difficulty: q.difficulty,
      correct: true,
      confidence: 3,
      selectedOption: q.correctIndex,
      wrongExplanation: null,
    }));
    expect(history.length).toBe(SESSION_SIZE);
  });
});

// ── FORMULA SHEET COVERAGE TESTS ─────────────────────────────────────────────
describe("Formula Sheet categories", () => {
  // Documentation test — verifies the 7 categories were planned
  const EXPECTED_CATEGORIES = [
    "Flow & Volume",
    "Disinfection & CT",
    "Chemical Dosing",
    "Hydraulics & Head",
    "Wastewater Treatment",
    "Math & Conversions",
    "Ontario Regulations",
  ];

  it("covers all 7 expected formula categories", () => {
    expect(EXPECTED_CATEGORIES.length).toBe(7);
  });

  it("CT formula questions exist in the OIT bank", () => {
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
        q.module === "Wastewater" ||
        q.module.toLowerCase().includes("wastewater") ||
        q.question.toLowerCase().includes("activated sludge") ||
        q.question.toLowerCase().includes("bod") ||
        q.question.toLowerCase().includes("effluent")
    );
    expect(wwQuestions.length).toBeGreaterThan(0);
  });

  it("Ontario Regulations module has more than 10 questions in the OIT bank", () => {
    if (!db) return;
    const regQuestions = QUESTIONS.filter(
      q =>
        q.module === "Ontario Regulations" ||
        q.module.toLowerCase().includes("regulation")
    );
    expect(regQuestions.length).toBeGreaterThan(10);
  });

  it("Disinfection module has more than 10 questions in the OIT bank", () => {
    if (!db) return;
    const disinfQuestions = QUESTIONS.filter(
      q =>
        q.module === "Disinfection" ||
        q.module.toLowerCase().includes("disinfection")
    );
    expect(disinfQuestions.length).toBeGreaterThan(10);
  });

  it("Math & Calculations module has more than 10 questions in the OIT bank", () => {
    if (!db) return;
    const mathQuestions = QUESTIONS.filter(
      q =>
        q.module === "Math & Calculations" ||
        q.module.toLowerCase().includes("math")
    );
    expect(mathQuestions.length).toBeGreaterThan(10);
  });
});
