import { describe, expect, it } from "vitest";
import { MIN_RESULTS_FOR_RATE, outcomeDate, summariseExamOutcomes, type RecordedOutcome } from "./examOutcomeSummary";

let n = 0;
const row = (over: Partial<RecordedOutcome>): RecordedOutcome => ({
  memberEmail: `op${n++}@example.com`, courseKey: "class1-water", result: "passed",
  examDate: null, recordedAt: new Date("2026-03-10T12:00:00Z"), readinessScoreAtOutcome: null, ...over,
});
const many = (count: number, over: Partial<RecordedOutcome>) => Array.from({ length: count }, () => row(over));

describe("summariseExamOutcomes: counts and pass rate", () => {
  it("is empty and has no rate with no results", () => {
    const s = summariseExamOutcomes([]);
    expect(s).toMatchObject({ recorded: 0, passed: 0, failed: 0, noShow: 0, sat: 0, passRate: null, rateIsReliable: false });
    expect(s.byCourse).toEqual([]);
    expect(s.recent).toEqual([]);
  });

  it("computes the pass rate from sittings only; no-shows are neither a pass nor a fail", () => {
    const s = summariseExamOutcomes([...many(6, { result: "passed" }), ...many(2, { result: "failed" }), ...many(5, { result: "no_show" })]);
    expect(s.sat).toBe(8);
    expect(s.noShow).toBe(5);
    expect(s.passRate).toBe(75);
    expect(s.recorded).toBe(13);
  });

  it(`only calls the rate reliable from ${MIN_RESULTS_FOR_RATE} sittings`, () => {
    expect(summariseExamOutcomes(many(MIN_RESULTS_FOR_RATE - 1, {})).rateIsReliable).toBe(false);
    expect(summariseExamOutcomes(many(MIN_RESULTS_FOR_RATE, {})).rateIsReliable).toBe(true);
  });

  it("shows a rate of null, not 0, when everyone was a no-show", () => {
    expect(summariseExamOutcomes(many(3, { result: "no_show" })).passRate).toBeNull();
  });
});

describe("summariseExamOutcomes: by course, by month, recent", () => {
  it("splits results by course, busiest course first", () => {
    const s = summariseExamOutcomes([...many(2, { courseKey: "wqa" }), ...many(3, { courseKey: "class1-water" }), row({ courseKey: "wqa", result: "failed" })]);
    expect(s.byCourse.map(c => c.courseKey)).toEqual(["class1-water", "wqa"]);
    expect(s.byCourse[1]).toMatchObject({ passed: 2, failed: 1, passRate: 67 });
  });

  it("groups by the exam date when given, otherwise the recorded date", () => {
    expect(outcomeDate(row({ examDate: new Date("2026-01-05T00:00:00Z") })).toISOString()).toBe("2026-01-05T00:00:00.000Z");
    const s = summariseExamOutcomes([
      row({ examDate: new Date("2026-01-05T00:00:00Z") }),
      row({ recordedAt: new Date("2026-02-20T00:00:00Z") }),
      row({ recordedAt: new Date("2026-02-21T00:00:00Z"), result: "failed" }),
    ]);
    expect(s.byMonth.map(m => m.month)).toEqual(["2026-01", "2026-02"]);
    expect(s.byMonth[1]).toMatchObject({ passed: 1, failed: 1 });
  });

  it("keeps only the latest 12 months", () => {
    const rows = Array.from({ length: 14 }, (_, i) => row({ examDate: new Date(Date.UTC(2025, i, 15)) }));
    const s = summariseExamOutcomes(rows);
    expect(s.byMonth).toHaveLength(12);
    expect(s.byMonth[0].month).toBe("2025-03");
    expect(s.byMonth[11].month).toBe("2026-02");
  });

  it("lists the 10 most recent results, newest first", () => {
    const rows = Array.from({ length: 12 }, (_, i) => row({ examDate: new Date(Date.UTC(2026, 0, i + 1)), memberEmail: `m${i}@example.com` }));
    const s = summariseExamOutcomes(rows);
    expect(s.recent).toHaveLength(10);
    expect(s.recent[0].memberEmail).toBe("m11@example.com");
    expect(s.recent[9].memberEmail).toBe("m2@example.com");
  });
});

describe("summariseExamOutcomes: study estimate at the time of the result", () => {
  it("compares the average estimate for passers and failers when there are enough of both", () => {
    const s = summariseExamOutcomes([
      ...many(3, { result: "passed", readinessScoreAtOutcome: 80 }), row({ result: "passed", readinessScoreAtOutcome: 90 }),
      ...many(3, { result: "failed", readinessScoreAtOutcome: 50 }),
    ]);
    expect(s.avgEstimateWhenPassed).toBe(83);
    expect(s.avgEstimateWhenFailed).toBe(50);
  });

  it("shows no comparison when either group is too small or has no estimate", () => {
    const few = summariseExamOutcomes([...many(3, { result: "passed", readinessScoreAtOutcome: 80 }), ...many(2, { result: "failed", readinessScoreAtOutcome: 50 })]);
    expect(few.avgEstimateWhenPassed).toBeNull();
    expect(few.avgEstimateWhenFailed).toBeNull();
    const none = summariseExamOutcomes([...many(4, { result: "passed" }), ...many(4, { result: "failed" })]);
    expect(none.avgEstimateWhenPassed).toBeNull();
  });
});

describe("summariseExamOutcomes: first result per operator and course", () => {
  it("counts a retake in laterResults, not in the pass rate", () => {
    const s = summariseExamOutcomes([
      row({ memberEmail: "a@example.com", result: "failed", recordedAt: new Date("2026-02-01T00:00:00Z") }),
      row({ memberEmail: "a@example.com", result: "passed", recordedAt: new Date("2026-04-01T00:00:00Z") }),
      row({ memberEmail: "b@example.com", result: "passed" }),
    ]);
    expect(s.recorded).toBe(2);
    expect(s.laterResults).toBe(1);
    expect(s).toMatchObject({ passed: 1, failed: 1, passRate: 50 });
  });

  it("treats the same operator on two courses as two results, and ignores email case", () => {
    const s = summariseExamOutcomes([
      row({ memberEmail: "A@Example.com", courseKey: "wqa" }),
      row({ memberEmail: "a@example.com", courseKey: "class1-water" }),
      row({ memberEmail: "a@example.com", courseKey: "class1-water", result: "failed", recordedAt: new Date("2026-05-01T00:00:00Z") }),
    ]);
    expect(s.recorded).toBe(2);
    expect(s.laterResults).toBe(1);
    expect(s.passed).toBe(2);
  });

  it("takes the first by recorded time even when rows arrive out of order", () => {
    const s = summariseExamOutcomes([
      row({ memberEmail: "a@example.com", result: "passed", recordedAt: new Date("2026-06-01T00:00:00Z") }),
      row({ memberEmail: "a@example.com", result: "failed", recordedAt: new Date("2026-01-01T00:00:00Z") }),
    ]);
    expect(s).toMatchObject({ passed: 0, failed: 1 });
  });
});
