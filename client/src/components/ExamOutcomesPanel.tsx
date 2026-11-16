import { ClipboardCheck } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { MIN_RESULTS_FOR_RATE } from "@shared/examOutcomeConstants";

const RESULT_LABEL = { passed: "Passed", failed: "Did not pass", no_show: "No-show" } as const;
const RESULT_CLASS = { passed: "text-green-700", failed: "text-red-700", no_show: "text-slate-600" } as const;
const date = (value: Date | string) => new Date(value).toLocaleDateString("en-CA", { year: "numeric", month: "short", day: "numeric" });
const monthName = (key: string) => new Date(`${key}-01T12:00:00Z`).toLocaleDateString("en-CA", { year: "numeric", month: "short", timeZone: "UTC" });

/** One line for a pass rate. A rate from only a few results is not shown as a headline. */
function rateText(c: { passRate: number | null; sat: number; rateIsReliable: boolean }): string {
  if (c.passRate === null) return "No results yet";
  return c.rateIsReliable ? `${c.passRate}%` : `${c.passRate}% of ${c.sat}`;
}

/**
 * Exam results the team's managers recorded: how many sat, how many passed, by course and by month.
 * It shows only what was recorded. Operators whose result nobody entered are not counted.
 */
export default function ExamOutcomesPanel({ orgInput }: { orgInput: { orgId?: number } }) {
  const query = trpc.orgIntel.getExamOutcomeSummary.useQuery(orgInput, { retry: false });
  if (query.isLoading) return <p role="status" className="mt-8 text-sm text-slate-500">Loading exam results…</p>;
  if (query.isError || !query.data) return <p role="alert" className="mt-8 text-sm text-amber-800">Exam results could not load. Reload the page to try again.</p>;
  const s = query.data;

  return (
    <section aria-label="Exam results" className="mt-8">
      <h2 className="mb-1 flex items-center gap-2 text-base font-semibold text-slate-800">
        <ClipboardCheck className="h-4 w-4 text-blue-500" aria-hidden="true" />
        Exam results
      </h2>
      <p className="mb-4 text-sm text-slate-600">Results your managers recorded this term, counting the first recorded result for each operator and course. Use "Record result" in the operator list to add one.</p>

      {s.recorded === 0 ? (
        <div className="rounded-xl border border-slate-200 bg-white p-5 text-sm text-slate-700 shadow-sm">
          No exam results have been recorded yet. After an operator sits their exam, record the result from the operator list and it will appear here with your pass rate.
        </div>
      ) : (
        <>
          <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="text-xs text-slate-600">Pass rate</div>
              <div className="mt-1 text-2xl font-bold text-slate-900">{rateText(s)}</div>
              <div className="mt-0.5 text-xs text-slate-500">
                {s.rateIsReliable ? `${s.passed} of ${s.sat} who sat` : `A rate needs ${MIN_RESULTS_FOR_RATE}+ results to be meaningful`}
              </div>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="text-xs text-slate-600">Passed</div>
              <div className="mt-1 text-2xl font-bold text-green-700">{s.passed}</div>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="text-xs text-slate-600">Did not pass</div>
              <div className="mt-1 text-2xl font-bold text-red-700">{s.failed}</div>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="text-xs text-slate-600">No-shows</div>
              <div className="mt-1 text-2xl font-bold text-slate-700">{s.noShow}</div>
              <div className="mt-0.5 text-xs text-slate-500">Not counted in the pass rate</div>
            </div>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
              <table className="w-full text-sm" aria-label="Exam results by course">
                <thead className="bg-slate-50 text-left text-xs text-slate-600">
                  <tr><th className="px-3 py-2 font-semibold">Course</th><th className="px-3 py-2 font-semibold">Passed</th><th className="px-3 py-2 font-semibold">Not passed</th><th className="px-3 py-2 font-semibold">Pass rate</th></tr>
                </thead>
                <tbody>
                  {s.byCourse.map(c => (
                    <tr key={c.courseKey} className="border-t border-slate-100">
                      <td className="px-3 py-2 text-slate-800">{c.courseLabel}</td>
                      <td className="px-3 py-2">{c.passed}</td>
                      <td className="px-3 py-2">{c.failed}</td>
                      <td className="px-3 py-2 font-medium">{rateText(c)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
              <table className="w-full text-sm" aria-label="Most recent exam results">
                <thead className="bg-slate-50 text-left text-xs text-slate-600">
                  <tr><th className="px-3 py-2 font-semibold">Operator</th><th className="px-3 py-2 font-semibold">Course</th><th className="px-3 py-2 font-semibold">Result</th><th className="px-3 py-2 font-semibold">Date</th></tr>
                </thead>
                <tbody>
                  {s.recent.map((r, i) => (
                    <tr key={`${r.memberEmail}-${r.courseKey}-${i}`} className="border-t border-slate-100">
                      <td className="max-w-[140px] truncate px-3 py-2 text-slate-800" title={r.memberEmail}>{r.memberEmail}</td>
                      <td className="px-3 py-2 text-slate-700">{r.courseLabel}</td>
                      <td className={`px-3 py-2 font-medium ${RESULT_CLASS[r.result]}`}>{RESULT_LABEL[r.result]}</td>
                      <td className="px-3 py-2 text-slate-600">{date(r.date)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {s.laterResults > 0 && (
            <p className="mt-3 text-xs text-slate-600">{s.laterResults} later result{s.laterResults === 1 ? "" : "s"} (retakes) {s.laterResults === 1 ? "is" : "are"} recorded but not counted above.</p>
          )}

          {s.byMonth.length > 1 && (
            <p className="mt-3 text-xs text-slate-600">
              By month: {s.byMonth.map(m => `${monthName(m.month)} ${m.passed} passed, ${m.failed} not passed${m.noShow ? `, ${m.noShow} no-show` : ""}`).join(" · ")}
            </p>
          )}
          {s.avgEstimateWhenPassed !== null && s.avgEstimateWhenFailed !== null && (
            <p className="mt-2 text-xs text-slate-600">
              Study estimate just before the exam averaged {s.avgEstimateWhenPassed}% for operators who passed and {s.avgEstimateWhenFailed}% for those who did not. Study estimates are coaching signals, not predictions.
            </p>
          )}
        </>
      )}
    </section>
  );
}
