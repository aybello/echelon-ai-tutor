/**
 * Team exam-outcome summary: pass rate and counts from the results a manager recorded.
 *
 * Pure: takes rows and returns numbers, so it is tested without a database. Each operator and course counts once,
 * by the first result recorded for them (a later retake is counted in `laterResults`, not in the rate). A "no-show"
 * is counted separately and is never a pass or a fail. The pass rate is passed / (passed + failed), and it is only
 * called reliable once there are enough results to mean something. Callers pass the rows for the current term.
 */

import { MIN_RESULTS_FOR_RATE, MIN_RESULTS_FOR_READINESS_COMPARISON } from "../../shared/examOutcomeConstants";
export { MIN_RESULTS_FOR_RATE, MIN_RESULTS_FOR_READINESS_COMPARISON };
const RECENT_LIMIT = 10;

export type RecordedOutcome = {
  memberEmail: string;
  courseKey: string;
  result: "passed" | "failed" | "no_show";
  examDate: Date | null;
  recordedAt: Date;
  readinessScoreAtOutcome: number | null;
};

export type OutcomeCounts = { passed: number; failed: number; noShow: number; sat: number; passRate: number | null; rateIsReliable: boolean };

export type ExamOutcomeSummary = OutcomeCounts & {
  /** Operator-and-course results counted (first recorded result for each), including no-shows. */
  recorded: number;
  /** Further results for an operator and course that already has an earlier one (retakes). Not in any count. */
  laterResults: number;
  byCourse: Array<OutcomeCounts & { courseKey: string }>;
  /** Most recent 12 calendar months that have at least one result, oldest first. Key is YYYY-MM. */
  byMonth: Array<OutcomeCounts & { month: string }>;
  recent: Array<{ memberEmail: string; courseKey: string; result: RecordedOutcome["result"]; date: Date }>;
  /** Average study estimate recorded just before the result, only when there are enough of both groups. */
  avgEstimateWhenPassed: number | null;
  avgEstimateWhenFailed: number | null;
};

/** The date a result belongs to: the exam date if the manager gave one, otherwise when it was recorded. */
export function outcomeDate(row: Pick<RecordedOutcome, "examDate" | "recordedAt">): Date {
  return row.examDate ?? row.recordedAt;
}

function count(rows: readonly RecordedOutcome[]): OutcomeCounts {
  const passed = rows.filter(r => r.result === "passed").length;
  const failed = rows.filter(r => r.result === "failed").length;
  const noShow = rows.filter(r => r.result === "no_show").length;
  const sat = passed + failed;
  const rateIsReliable = sat >= MIN_RESULTS_FOR_RATE;
  return { passed, failed, noShow, sat, passRate: sat === 0 ? null : Math.round((passed / sat) * 100), rateIsReliable };
}

function monthKey(date: Date): string {
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`;
}

function average(values: number[]): number | null {
  return values.length ? Math.round(values.reduce((a, b) => a + b, 0) / values.length) : null;
}

export function summariseExamOutcomes(allRows: readonly RecordedOutcome[]): ExamOutcomeSummary {
  // First recorded result per operator and course; later ones are retakes.
  const seen = new Set<string>();
  const rows = [...allRows]
    .sort((a, b) => a.recordedAt.getTime() - b.recordedAt.getTime())
    .filter(r => {
      const key = `${r.memberEmail.toLowerCase()}::${r.courseKey}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  const total = count(rows);

  const courseKeys = Array.from(new Set(rows.map(r => r.courseKey)));
  const byCourse = courseKeys
    .map(courseKey => ({ courseKey, ...count(rows.filter(r => r.courseKey === courseKey)) }))
    .sort((a, b) => b.sat + b.noShow - (a.sat + a.noShow) || a.courseKey.localeCompare(b.courseKey));

  const months = Array.from(new Set(rows.map(r => monthKey(outcomeDate(r))))).sort().slice(-12);
  const byMonth = months.map(month => ({ month, ...count(rows.filter(r => monthKey(outcomeDate(r)) === month)) }));

  const recent = [...rows]
    .sort((a, b) => outcomeDate(b).getTime() - outcomeDate(a).getTime())
    .slice(0, RECENT_LIMIT)
    .map(r => ({ memberEmail: r.memberEmail, courseKey: r.courseKey, result: r.result, date: outcomeDate(r) }));

  const estimates = (result: "passed" | "failed") => rows
    .filter(r => r.result === result && r.readinessScoreAtOutcome != null)
    .map(r => r.readinessScoreAtOutcome as number);
  const passedEstimates = estimates("passed");
  const failedEstimates = estimates("failed");
  const enough = passedEstimates.length >= MIN_RESULTS_FOR_READINESS_COMPARISON && failedEstimates.length >= MIN_RESULTS_FOR_READINESS_COMPARISON;

  return {
    ...total,
    recorded: rows.length,
    laterResults: allRows.length - rows.length,
    byCourse,
    byMonth,
    recent,
    avgEstimateWhenPassed: enough ? average(passedEstimates) : null,
    avgEstimateWhenFailed: enough ? average(failedEstimates) : null,
  };
}
