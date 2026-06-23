/**
 * Quiz Page Smoke Tests — Database Edition
 *
 * Verifies every question bank in the database has:
 *   1. At least minCount rows (quiz would show paywall if 0)
 *   2. A valid first question (question text, 4 options, correctIndex 0-3, explanation)
 *   3. No out-of-range correctIndex values across all rows
 *   4. All rows have exactly 4 options
 *
 * Queries the `questions` table directly via Drizzle — no static TS imports.
 */
import { describe, it, expect, beforeAll } from "vitest";
import { drizzle } from "drizzle-orm/mysql2";
import { eq, sql } from "drizzle-orm";
import { questions } from "../drizzle/schema";

let db: ReturnType<typeof drizzle> | null = null;

beforeAll(() => {
  if (process.env.DATABASE_URL) {
    db = drizzle(process.env.DATABASE_URL);
  }
});

function smokeCheck(bankKey: string, minCount: number) {
  describe(`${bankKey} — smoke test`, () => {
    it(`has at least ${minCount} questions in the database`, async () => {
      if (!db) { console.warn(`[smoke] Skipping ${bankKey}: DATABASE_URL not set`); return; }
      const [row] = await db
        .select({ cnt: sql<number>`COUNT(*)` })
        .from(questions)
        .where(eq(questions.bankKey, bankKey));
      expect(Number(row.cnt)).toBeGreaterThanOrEqual(minCount);
    });

    it("first question has required fields (question, options, correctIndex, explanation)", async () => {
      if (!db) return;
      const rows = await db.select().from(questions).where(eq(questions.bankKey, bankKey)).limit(1);
      expect(rows.length, `No questions found for bank "${bankKey}"`).toBeGreaterThan(0);
      const q = rows[0];
      expect(
        q.question,
        `DATA BUG: bank "${bankKey}" has empty question text — re-seed this bank`
      ).toBeTruthy();
      const opts = JSON.parse(q.options) as string[];
      expect(Array.isArray(opts), "options must be a JSON array").toBe(true);
      expect(opts.length, "must have exactly 4 options").toBe(4);
      expect(q.correctIndex, "correctIndex must be >= 0").toBeGreaterThanOrEqual(0);
      expect(q.correctIndex, "correctIndex must be <= 3").toBeLessThanOrEqual(3);
      expect(q.explanation, "missing explanation").toBeTruthy();
    });

    it("all questions have correctIndex in range 0-3", async () => {
      if (!db) return;
      const [row] = await db
        .select({ cnt: sql<number>`COUNT(*)` })
        .from(questions)
        .where(sql`${questions.bankKey} = ${bankKey} AND (${questions.correctIndex} < 0 OR ${questions.correctIndex} > 3)`);
      expect(Number(row.cnt), "found questions with out-of-range correctIndex").toBe(0);
    });

    it("all questions have exactly 4 options", async () => {
      if (!db) return;
      const rows = await db
        .select({ id: questions.id, options: questions.options, questionNum: questions.questionNum })
        .from(questions)
        .where(eq(questions.bankKey, bankKey));
      for (const row of rows) {
        const opts = JSON.parse(row.options) as unknown[];
        expect(opts.length, `Q questionNum=${row.questionNum} in "${bankKey}" does not have 4 options`).toBe(4);
      }
    });
  });
}

// Ontario tracks
smokeCheck("oit",                400);
smokeCheck("class1",             200);
smokeCheck("class1-water",       300);
smokeCheck("class1-wastewater",  499);
smokeCheck("class2-water",       300);
smokeCheck("class2-wastewater",  499);
smokeCheck("class3-water",       300);
smokeCheck("class3-wastewater",  498);
smokeCheck("class4-water",       300);
smokeCheck("class4-wastewater",  499);
smokeCheck("wqa",                280);

// WPI Water tracks
smokeCheck("wpi-class1-water",   400);
smokeCheck("wpi-class2-water",   400);
smokeCheck("wpi-class3-water",   400);
smokeCheck("wpi-class4-water",   400);

// WPI Wastewater tracks
smokeCheck("wpi-class1-wastewater",  400);
smokeCheck("wpi-class2-wastewater",  400);
smokeCheck("wpi-class3-wastewater",  400);
smokeCheck("wpi-class4-wastewater",  400);

// WPI Distribution tracks
smokeCheck("wpi-class1-water-dist",  60);
smokeCheck("wpi-class2-water-dist",  60);
smokeCheck("wpi-class3-water-dist",  60);
smokeCheck("wpi-class4-water-dist",  60);

// WPI Collection tracks
smokeCheck("wpi-class1-wastewater-coll",  400);
smokeCheck("wpi-class2-wastewater-coll",  400);
smokeCheck("wpi-class3-wastewater-coll",  400);
smokeCheck("wpi-class4-wastewater-coll",  400);
