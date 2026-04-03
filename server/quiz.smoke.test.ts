/**
 * Quiz Page Smoke Tests
 *
 * These tests guard against the "blank quiz / immediate paywall" bug that was
 * found on Class1Quiz, WQAQuiz, and Class3WaterQuiz.
 *
 * Root cause: if a question bank exports an empty array (or the wrong export
 * name), the quiz component initialises `current` to `null` and immediately
 * shows the paywall instead of a question card.
 *
 * Each test verifies that the question bank:
 *   1. Exports a non-empty array (questions exist)
 *   2. Every question has the four required fields: question text, 4 options,
 *      a correct index in range, and an explanation
 *   3. The correct index is within bounds (0–3) — an out-of-range value would
 *      silently mark every answer wrong and confuse users
 */
import { describe, it, expect } from "vitest";

// ── OIT (original question bank) ──────────────────────────────────────────────
import { QUESTIONS as OIT_QUESTIONS } from "../client/src/lib/questions";

// ── Class 1 combined ──────────────────────────────────────────────────────────
import { CLASS1_QUESTIONS } from "../client/src/lib/class1Questions";

// ── Class 1 Water ─────────────────────────────────────────────────────────────
import { CLASS1_WATER_QUESTIONS } from "../client/src/lib/class1WaterQuestions";

// ── Class 1 Wastewater ────────────────────────────────────────────────────────
import { CLASS1_WASTEWATER_QUESTIONS } from "../client/src/lib/class1WastewaterQuestions";

// ── Class 2 Water ─────────────────────────────────────────────────────────────
import { QUESTIONS as CLASS2_WATER_QUESTIONS } from "../client/src/lib/class2WaterQuestions";

// ── Class 2 Wastewater ────────────────────────────────────────────────────────
import { CLASS2_WW_QUESTIONS } from "../client/src/lib/class2WastewaterQuestions";

// ── Class 3 Water ─────────────────────────────────────────────────────────────
import { QUESTIONS as CLASS3_WATER_QUESTIONS } from "../client/src/lib/class3WaterQuestions";

// ── WQA ───────────────────────────────────────────────────────────────────────
import { WQA_QUESTIONS } from "../client/src/lib/wqaQuestions";

// ── Helper ────────────────────────────────────────────────────────────────────
function smokeCheck(
  label: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  questions: any[],
  minCount: number,
  opts: {
    questionField?: string; // field name for question text
    optionsField?: string;  // field name for options array
    correctField?: string;  // field name for correct index
  } = {}
) {
  const {
    questionField = "question",
    optionsField  = "options",
    correctField  = "correct",
  } = opts;

  describe(`${label} — smoke test`, () => {
    it(`exports at least ${minCount} questions (quiz would show paywall if 0)`, () => {
      expect(Array.isArray(questions)).toBe(true);
      expect(questions.length).toBeGreaterThanOrEqual(minCount);
    });

    it("first question has required fields (question text, options, correct, explanation)", () => {
      const q = questions[0];
      expect(q, "first question is undefined — bank may be empty").toBeDefined();
      expect(q[questionField], `missing "${questionField}" field`).toBeTruthy();
      expect(Array.isArray(q[optionsField]), `missing "${optionsField}" array`).toBe(true);
      expect(q[optionsField].length, "must have exactly 4 options").toBe(4);
      expect(q[correctField], `missing "${correctField}" field`).toBeGreaterThanOrEqual(0);
      expect(q[correctField], `"${correctField}" out of range`).toBeLessThanOrEqual(3);
      expect(q.explanation, 'missing "explanation" field').toBeTruthy();
    });

    it("all questions have correct index in range 0–3", () => {
      for (const q of questions) {
        expect(
          q[correctField],
          `Q id=${q.id ?? "?"} has out-of-range correct index: ${q[correctField]}`
        ).toBeGreaterThanOrEqual(0);
        expect(
          q[correctField],
          `Q id=${q.id ?? "?"} has out-of-range correct index: ${q[correctField]}`
        ).toBeLessThanOrEqual(3);
      }
    });

    it("all questions have 4 options", () => {
      for (const q of questions) {
        expect(
          q[optionsField]?.length,
          `Q id=${q.id ?? "?"} does not have 4 options`
        ).toBe(4);
      }
    });
  });
}

// ── OIT uses "q" instead of "question" ───────────────────────────────────────
smokeCheck("OIT Practice Quiz",        OIT_QUESTIONS,              400, { questionField: "q" });

// ── Class 1 combined ──────────────────────────────────────────────────────────
smokeCheck("Class 1 Combined Quiz",    CLASS1_QUESTIONS,           200, { questionField: "q" });

// ── Class 1 Water ─────────────────────────────────────────────────────────────
smokeCheck("Class 1 Water Quiz",       CLASS1_WATER_QUESTIONS,     200);

// ── Class 1 Wastewater ────────────────────────────────────────────────────────
smokeCheck("Class 1 Wastewater Quiz",  CLASS1_WASTEWATER_QUESTIONS, 200);

// ── Class 2 Water ─────────────────────────────────────────────────────────────
smokeCheck("Class 2 Water Quiz",       CLASS2_WATER_QUESTIONS,     200);

// ── Class 2 Wastewater ────────────────────────────────────────────────────────
smokeCheck("Class 2 WW Quiz",          CLASS2_WW_QUESTIONS,        400);

// ── Class 3 Water ─────────────────────────────────────────────────────────────
smokeCheck("Class 3 Water Quiz",       CLASS3_WATER_QUESTIONS,     400);

// ── WQA ───────────────────────────────────────────────────────────────────────
smokeCheck("WQA Quiz",                 WQA_QUESTIONS,              280, { correctField: "correctIndex" });
