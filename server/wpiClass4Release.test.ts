import { describe, expect, it } from "vitest";

type Question = Record<string, unknown>;
type WpiReleaseModule = {
  hashWpiQuestionRows(rows: Question[]): string;
  hashWpiNewQuestionRows(rows: Question[]): string;
  planWpiClass4Release(input: {
    currentRows: Question[];
    currentMetadata: Record<string, unknown> | null;
    candidateExisting: Question[];
    candidateNew: Question[];
    expectedBaselineRowsSha256: string;
  }): { ready: boolean; errors: string[]; currentQuestionCount: number; candidateNewCount: number; changedExistingCount: number; intendedVisibleCount: number };
};

const releaseModule = await import(new URL("../scripts/lib/wpiClass4Release.mjs", import.meta.url).href) as WpiReleaseModule;
const { hashWpiNewQuestionRows, hashWpiQuestionRows, planWpiClass4Release } = releaseModule;

function question(id: number | null, questionNum: number, reviewStatus = "unreviewed") {
  return {
    id, bankKey: "wpi-class4-wastewater", questionNum, module: "Treatment Process", difficulty: "easy",
    question: `Question ${questionNum}?`, options: JSON.stringify(["A", "B", "C", "D"]), correctIndex: 0,
    explanation: "Explanation.", steps: "[]", tip: null, isCalc: "no", topic: "Test", cognitiveLevel: "recall",
    sourceTitle: "Source", sourceReference: "Reference", sourceUrl: "https://example.test", blueprintObjective: null, reviewStatus,
  };
}

function readyInput() {
  const currentRows = [question(1, 1), question(2, 2)];
  const candidateExisting = [{ ...currentRows[0], explanation: "Corrected explanation." }, currentRows[1]];
  const candidateNew = Array.from({ length: 250 }, (_, index) => ({ ...question(null, 2001 + index, "in_review"), question: `New question ${2001 + index}?` }));
  return {
    currentRows, candidateExisting, candidateNew,
    currentMetadata: { bankKey: "wpi-class4-wastewater", totalQuestions: 2, contentVersion: 4 },
    expectedBaselineRowsSha256: hashWpiQuestionRows(currentRows),
  };
}

describe("planWpiClass4Release", () => {
  it("authorizes only a complete, baseline-matched, in-review addition package", () => {
    const plan = planWpiClass4Release(readyInput());
    expect(plan).toMatchObject({ ready: true, currentQuestionCount: 2, candidateNewCount: 250, changedExistingCount: 1, intendedVisibleCount: 252 });
  });

  it("fails closed if the production baseline has changed", () => {
    const input = readyInput();
    input.currentRows[0].question = "Concurrent production change";
    const plan = planWpiClass4Release(input);
    expect(plan.ready).toBe(false);
    expect(plan.errors).toContain("Production question baseline hash differs from the approved package.");
  });

  it("rejects a new item that is not staged before promotion", () => {
    const input = readyInput();
    input.candidateNew[99].reviewStatus = "approved";
    const plan = planWpiClass4Release(input);
    expect(plan.ready).toBe(false);
    expect(plan.errors).toContain("New candidate 2100 must arrive as in_review.");
  });

  it("rejects any occupied question number in the governed addition range", () => {
    const input = readyInput();
    input.candidateNew[0].questionNum = 1;
    const plan = planWpiClass4Release(input);
    expect(plan.ready).toBe(false);
    expect(plan.errors).toContain("New candidate question number outside governed range: 1.");
    expect(plan.errors).toContain("Duplicate or occupied new question number: 1.");
  });

  it("does not let database-assigned IDs alter a new-question content checksum", () => {
    const candidate = { ...question(null, 2001, "in_review"), question: "New question 2001?" };
    const inserted = { ...candidate, id: 999999, reviewStatus: "approved" };
    expect(hashWpiNewQuestionRows([inserted])).toBe(hashWpiNewQuestionRows([{ ...candidate, reviewStatus: "approved" }]));
  });
  it("validates repaired existing options and explanations as strictly as additions", () => {
    for (const invalid of [
      { options: "broken JSON" }, { options: JSON.stringify(["A", "A", "C", "D"]) },
      { options: JSON.stringify(["A", "", "C", "D"]) }, { correctIndex: 9 }, { explanation: " " },
    ]) {
      const input = readyInput();
      Object.assign(input.candidateExisting[0], invalid);
      expect(planWpiClass4Release(input).ready).toBe(false);
    }
  });

});
