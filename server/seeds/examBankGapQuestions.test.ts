import { beforeAll, describe, expect, it } from "vitest";
import { drizzle } from "drizzle-orm/mysql2";
import { inArray } from "drizzle-orm";
import { questions } from "../../drizzle/schema";
import {
  examBankGapQuestions,
  validateGapQuestions,
} from "./examBankGapQuestions";

const collectionRows = examBankGapQuestions.filter(
  row => row.bankKey === "class1-wastewater-coll",
);
const distributionRows = examBankGapQuestions.filter(
  row => row.bankKey === "class1-water-dist",
);
let existingRows: Array<{ bankKey: string; questionNum: number; question: string }> = [];

beforeAll(async () => {
  if (!process.env.DATABASE_URL) return;
  const db = drizzle(process.env.DATABASE_URL);
  existingRows = await db
    .select({
      bankKey: questions.bankKey,
      questionNum: questions.questionNum,
      question: questions.question,
    })
    .from(questions)
    .where(inArray(questions.bankKey, ["class1-wastewater-coll", "class1-water-dist"]));
});

function countBy<T extends string>(values: T[]) {
  return values.reduce<Record<T, number>>((counts, value) => {
    counts[value] = (counts[value] ?? 0) + 1;
    return counts;
  }, {} as Record<T, number>);
}

describe("uploaded exam-bank gap questions", () => {
  it("passes its internal schema, count, duplicate, and answer-position checks", () => {
    expect(validateGapQuestions()).toEqual({
      total: 300,
      answerPositions: [75, 75, 75, 75],
    });
  });

  it("provides the approved 150-question expansion for each target bank", () => {
    expect(collectionRows).toHaveLength(150);
    expect(distributionRows).toHaveLength(150);
    expect(collectionRows.map(row => row.questionNum)).toEqual(
      Array.from({ length: 150 }, (_, index) => index + 575),
    );
    expect(distributionRows.map(row => row.questionNum)).toEqual(
      Array.from({ length: 150 }, (_, index) => index + 568),
    );
  });

  it("matches the approved module allocation", () => {
    expect(countBy(collectionRows.map(row => row.module))).toEqual({
      "Applied Science & Hydraulics": 65,
      "Operate Equipment": 50,
      "Maintain & Restore Collection System": 35,
    });
    expect(countBy(distributionRows.map(row => row.module))).toEqual({
      General: 130,
      Administration: 20,
    });
  });

  it("keeps four distinct options and a valid answer in every record", () => {
    for (const row of examBankGapQuestions) {
      const options = JSON.parse(row.options) as string[];
      expect(options, `${row.bankKey}#${row.questionNum}`).toHaveLength(4);
      expect(new Set(options).size, `${row.bankKey}#${row.questionNum}`).toBe(4);
      expect(row.correctIndex, `${row.bankKey}#${row.questionNum}`).toBeGreaterThanOrEqual(0);
      expect(row.correctIndex, `${row.bankKey}#${row.questionNum}`).toBeLessThanOrEqual(3);
      expect(options[row.correctIndex]?.trim(), `${row.bankKey}#${row.questionNum}`).not.toHaveLength(0);
    }
  });

  it("includes worked steps for every calculation question and none for other questions", () => {
    const calculations = examBankGapQuestions.filter(row => row.isCalc === "yes");
    expect(calculations.length).toBeGreaterThan(0);

    for (const row of calculations) {
      const steps = JSON.parse(row.steps ?? "[]") as Array<{ l: string; c: string }>;
      expect(steps.length, `${row.bankKey}#${row.questionNum}`).toBeGreaterThan(0);
      expect(row.topic).toBe("Calculations");
    }

    for (const row of examBankGapQuestions.filter(row => row.isCalc === "no")) {
      expect(row.steps, `${row.bankKey}#${row.questionNum}`).toBeNull();
      expect(row.topic, `${row.bankKey}#${row.questionNum}`).toBeNull();
    }
  });

  it("does not duplicate any question text already in either pre-expansion bank", () => {
    if (!process.env.DATABASE_URL) return;
    const starts = {
      "class1-wastewater-coll": 575,
      "class1-water-dist": 568,
    } as const;
    const existingText = new Set(
      existingRows
        .filter(row => row.questionNum < starts[row.bankKey as keyof typeof starts])
        .map(row => `${row.bankKey}:${row.question.trim().toLowerCase().replace(/\s+/g, " ")}`),
    );

    for (const row of examBankGapQuestions) {
      const key = `${row.bankKey}:${row.question.trim().toLowerCase().replace(/\s+/g, " ")}`;
      expect(existingText.has(key), `${row.bankKey}#${row.questionNum}`).toBe(false);
    }
  });
});
