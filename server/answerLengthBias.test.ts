import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  analyseQuestion,
  summariseAnswerLengthBias,
  targetDistractorLength,
  formatBankVerdict,
  BANK_LONGEST_RATE_THRESHOLD,
  CHANCE_LONGEST_RATE,
  type BiasCheckQuestion,
} from "./answerLengthBias";

/** Build a question whose option lengths are controlled exactly. */
function q(
  questionNum: number,
  lengths: number[],
  correctIndex: number,
  module = "Test Module",
): BiasCheckQuestion {
  return {
    questionNum,
    module,
    options: lengths.map(length => "x".repeat(length)),
    correctIndex,
  };
}

describe("analyseQuestion", () => {
  it("flags a correct option that is far longer than every distractor", () => {
    const result = analyseQuestion(q(1, [30, 30, 90, 30], 2));
    expect(result.correctIsLongest).toBe(true);
    expect(result.hasLengthTell).toBe(true);
    expect(result.charAdvantage).toBe(60);
  });

  it("does not flag a correct option that is longest by only a character", () => {
    const result = analyseQuestion(q(2, [40, 41, 40, 40], 1));
    expect(result.correctIsLongest).toBe(true);
    expect(result.hasLengthTell).toBe(false);
  });

  it("flags short options when the correct one is proportionally much longer", () => {
    // Absolute gap is only 5 characters, below TELL_ABSOLUTE_CHARS, but the
    // correct option is 33% longer than its nearest rival, which still reads.
    const result = analyseQuestion(q(3, [15, 15, 15, 20], 3));
    expect(result.charAdvantage).toBe(5);
    expect(result.hasLengthTell).toBe(true);
  });

  it("treats a tie for longest as carrying no signal", () => {
    const result = analyseQuestion(q(4, [50, 50, 50, 50], 0));
    expect(result.correctIsLongest).toBe(false);
    expect(result.hasLengthTell).toBe(false);
    expect(result.charAdvantage).toBe(0);
  });

  it("does not flag a correct option that is the shortest", () => {
    const result = analyseQuestion(q(5, [90, 20, 90, 90], 1));
    expect(result.correctIsLongest).toBe(false);
    expect(result.hasLengthTell).toBe(false);
  });

  it("ignores surrounding whitespace when measuring length", () => {
    const result = analyseQuestion({
      questionNum: 6,
      options: ["   short   ", "short", "short", "short"],
      correctIndex: 0,
    });
    expect(result.correctIsLongest).toBe(false);
  });

  it("rejects a correctIndex outside the option list", () => {
    expect(() => analyseQuestion(q(7, [10, 10, 10, 10], 9))).toThrow(/outside its option list/);
  });

  it("rejects a question with fewer than two options", () => {
    expect(() =>
      analyseQuestion({ questionNum: 8, options: ["only"], correctIndex: 0 }),
    ).toThrow(/at least two options/);
  });
});

describe("summariseAnswerLengthBias", () => {
  it("reports rates and marks a systemically biased bank as failing", () => {
    // Four of five questions have a wide length tell — the pattern observed in
    // the legacy water banks, where the correct option was longest ~84% of the time.
    const questions = [
      q(1, [30, 30, 90, 30], 2),
      q(2, [30, 90, 30, 30], 1),
      q(3, [90, 30, 30, 30], 0),
      q(4, [30, 30, 30, 90], 3),
      q(5, [90, 30, 90, 90], 1),
    ];
    const summary = summariseAnswerLengthBias(questions);

    expect(summary.total).toBe(5);
    expect(summary.longestCorrect).toBe(4);
    expect(summary.longestCorrectRate).toBeCloseTo(0.8);
    expect(summary.tellCount).toBe(4);
    expect(summary.failsThreshold).toBe(true);
  });

  it("passes a bank whose correct answers are not length-marked", () => {
    const questions = [
      q(1, [50, 50, 50, 50], 0),
      q(2, [50, 50, 50, 50], 1),
      q(3, [50, 50, 50, 50], 2),
      q(4, [90, 50, 50, 50], 3),
    ];
    const summary = summariseAnswerLengthBias(questions);

    expect(summary.longestCorrectRate).toBe(0);
    expect(summary.failsThreshold).toBe(false);
  });

  it("orders the offender worklist by worst length advantage first", () => {
    const summary = summariseAnswerLengthBias([
      q(1, [30, 30, 55, 30], 2),
      q(2, [30, 200, 30, 30], 1),
      q(3, [30, 30, 30, 80], 3),
    ]);
    expect(summary.offenders.map(offender => offender.questionNum)).toEqual([2, 3, 1]);
  });

  it("counts correct answer positions for context", () => {
    const summary = summariseAnswerLengthBias([
      q(1, [40, 40, 40, 40], 0),
      q(2, [40, 40, 40, 40], 0),
      q(3, [40, 40, 40, 40], 2),
    ]);
    expect(summary.positionCounts).toEqual({ 0: 2, 2: 1 });
  });

  it("handles an empty bank without dividing by zero", () => {
    const summary = summariseAnswerLengthBias([]);
    expect(summary.total).toBe(0);
    expect(summary.longestCorrectRate).toBe(0);
    expect(summary.failsThreshold).toBe(false);
  });

  it("keeps the failure threshold above the chance baseline", () => {
    expect(BANK_LONGEST_RATE_THRESHOLD).toBeGreaterThan(CHANCE_LONGEST_RATE);
  });
});

describe("targetDistractorLength", () => {
  it("brackets the correct option so rewritten distractors sit alongside it", () => {
    const band = targetDistractorLength(100);
    expect(band.min).toBe(85);
    expect(band.max).toBe(115);
  });

  it("never returns a zero-length target for very short options", () => {
    expect(targetDistractorLength(1).min).toBeGreaterThanOrEqual(1);
  });
});

describe("formatBankVerdict", () => {
  it("marks a failing bank", () => {
    const summary = summariseAnswerLengthBias([
      q(1, [30, 30, 90, 30], 2),
      q(2, [30, 90, 30, 30], 1),
    ]);
    expect(formatBankVerdict("class1-water", summary)).toContain("FAIL");
  });

  it("reports an empty bank without failing", () => {
    expect(formatBankVerdict("empty-bank", summariseAnswerLengthBias([]))).toBe(
      "empty-bank: no questions",
    );
  });
});

describe("machine rewrite governance", () => {
  it("returns rewritten questions to the staged review queue", () => {
    const script = readFileSync(new URL("../scripts/fix-answer-length-bias.ts", import.meta.url), "utf8");
    expect(script).toContain("reviewStatus = 'in_review'");
    expect(script).not.toContain("reviewStatus = 'unreviewed'");
  });
});
