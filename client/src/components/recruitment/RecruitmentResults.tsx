import { Fragment, useContext } from "react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Download } from "lucide-react";
import { RecruitmentManagerPrivacyContext } from "@/hooks/recruitmentManagerPrivacy";
import { safeSupervisorCsvCell } from "@shared/supervisorActionPlan";
import { recruitmentDifficultyLabel } from "@shared/recruitmentAssessment";
import type {
  RecruitmentDefinitionSummary,
  RecruitmentResult,
  RecruitmentStatus,
} from "@shared/recruitmentAssessment";

export const recruitmentCard =
  "rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6";
export const recruitmentSelect =
  "min-h-11 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 disabled:opacity-60";
export const recruitmentStatus: Record<RecruitmentStatus, string> = {
  invited: "Not started",
  active: "In progress",
  submitted: "Submitted",
  timed_out: "Time ended",
  expired: "Expired",
  revoked: "Revoked",
};
function resultStatus(result: RecruitmentResult) {
  return result.status === "revoked" && result.score
    ? "Revoked after completion"
    : recruitmentStatus[result.status];
}
export function recruitmentDate(ms: number | null) {
  return ms === null
    ? "—"
    : new Date(ms).toLocaleString(undefined, {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
}
export function recruitmentDuration(result: RecruitmentResult) {
  if (result.startedAtMs === null || result.submittedAtMs === null) return "—";
  const seconds = Math.max(
    0,
    Math.floor((result.submittedAtMs - result.startedAtMs) / 1000)
  );
  return `${Math.floor(seconds / 60)}m ${seconds % 60}s`;
}
export function RecruitmentError({
  message,
  onRetry,
  pending = false,
}: {
  message: string;
  onRetry?: () => void;
  pending?: boolean;
}) {
  return (
    <div
      role="alert"
      className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900"
    >
      <p>{message}</p>
      {onRetry && (
        <Button
          type="button"
          variant="outline"
          className="mt-3 min-h-11"
          onClick={onRetry}
          disabled={pending}
        >
          {pending ? "Retrying…" : "Try again"}
        </Button>
      )}
    </div>
  );
}
export function downloadRecruitmentCsv(
  assessment: RecruitmentDefinitionSummary,
  results: RecruitmentResult[]
) {
  const headings = [
    "Assessment",
    "Course",
    "Difficulty",
    "Candidate name",
    "Candidate email",
    "Status",
    "Passing score",
    "Pass / Fail",
    "Started at",
    "Completed at",
    "Expires at",
    "Completion seconds",
    "Correct",
    "Total",
    "Answered",
    "Unanswered",
    "Percent correct",
    "Topic",
    "Topic correct",
    "Topic total",
    "Topic answered",
    "Topic percent correct",
  ];
  const rows = results.flatMap(result => {
    const score = result.score;
    const topics = score?.topics.length ? score.topics : [null];
    return topics.map(topic => [
      assessment.title,
      assessment.courseLabel,
      recruitmentDifficultyLabel(assessment.difficultyMode),
      result.candidateName,
      result.candidateEmail,
      resultStatus(result),
      assessment.passingScore ?? null,
      score?.passed === null || score?.passed === undefined ? "Unknown" : score.passed ? "Pass" : "Fail",
      result.startedAtMs === null
        ? null
        : new Date(result.startedAtMs).toISOString(),
      result.submittedAtMs === null
        ? null
        : new Date(result.submittedAtMs).toISOString(),
      new Date(result.expiresAtMs).toISOString(),
      result.startedAtMs === null || result.submittedAtMs === null
        ? null
        : Math.max(
            0,
            Math.floor((result.submittedAtMs - result.startedAtMs) / 1000)
          ),
      score?.correct,
      score?.total,
      score?.answered,
      score?.unanswered,
      score?.percent,
      topic?.module,
      topic?.correct,
      topic?.total,
      topic?.answered,
      topic?.percent,
    ]);
  });
  const csv = [headings, ...rows]
    .map(row => row.map(safeSupervisorCsvCell).join(","))
    .join("\r\n");
  const url = URL.createObjectURL(
    new Blob(["\uFEFF", csv], { type: "text/csv;charset=utf-8" })
  );
  const link = document.createElement("a");
  link.href = url;
  link.download = `recruitment-results-${assessment.id}.csv`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function RecruitmentResults({
  assessment,
  results,
  onDownload,
  onCopy,
  onRevoke,
  busy,
}: {
  assessment: RecruitmentDefinitionSummary;
  results: RecruitmentResult[];
  onDownload: () => void;
  onCopy: (assignmentId: string) => void;
  onRevoke: (result: RecruitmentResult) => void;
  busy: boolean;
}) {
  const access = useContext(RecruitmentManagerPrivacyContext);
  if (!access?.isCurrent()) return null;
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h3 className="text-lg font-semibold text-slate-900">
            Candidate results
          </h3>
          <p className="mt-1 text-sm font-medium text-blue-700">
            Difficulty: {recruitmentDifficultyLabel(assessment.difficultyMode)}
            {" · "}Passing score: {assessment.passingScore === null || assessment.passingScore === undefined ? "Unknown" : `${assessment.passingScore}%`}
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          className="min-h-11"
          onClick={() => {
            if (access.isCurrent() && !busy) onDownload();
          }}
          disabled={busy || !results.length}
        >
          <Download className="mr-2 h-4 w-4" aria-hidden="true" />
          Download CSV
        </Button>
      </div>
      <p className="text-sm leading-relaxed text-slate-600">
        Results support human review, not an automatic hiring decision. Pending
        assessments have no final score. CSV includes one row per topic for
        completed results. Difficulty records the selected question labels, not
        a calibrated standard. Scores across different difficulty modes are not
        equivalent.
      </p>
      <p className="text-sm leading-relaxed text-slate-600">
        If a candidate loses team-seat or course access, revoke the assessment
        invitation before its deadline to stop automatic scoring; timed-out
        results are evidence of saved answers, not proof of uninterrupted
        access.
      </p>
      {!results.length ? (
        <p className="rounded-xl bg-slate-50 p-4 text-sm text-slate-600">
          No candidates invited yet. Choose an eligible team member above to
          create a verified-email-bound link.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-slate-200">
          <table className="w-full min-w-[760px] text-left text-sm">
            <caption className="sr-only">
              Candidate completion and knowledge assessment results for{" "}
              {assessment.title}
            </caption>
            <thead className="bg-slate-50 text-xs text-slate-600">
              <tr>
                {[
                  "Candidate",
                  "Status",
                  "Correct / total",
                  "Pass / Fail",
                  "Answered",
                  "Unanswered",
                  "Time",
                  "Actions",
                ].map(label => (
                  <th scope="col" key={label} className="p-4 font-semibold">
                    {label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {results.map(result => (
                <Fragment key={result.assignmentId}>
                  <tr className="border-t border-slate-200 align-top">
                    <th scope="row" className="p-4 font-normal">
                      <span className="block font-medium text-slate-900">
                        {result.candidateName || result.candidateEmail}
                      </span>
                      {result.candidateName && (
                        <span className="block text-xs text-slate-500">
                          {result.candidateEmail}
                        </span>
                      )}
                    </th>
                    <td className="p-4">
                      <span
                        className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${result.score ? "bg-teal-50 text-teal-800" : "bg-slate-100 text-slate-700"}`}
                      >
                        {resultStatus(result)}
                      </span>
                    </td>
                    <td className="p-4 tabular-nums">
                      {result.score
                        ? `${result.score.correct} / ${result.score.total} (${result.score.percent}%)`
                        : "—"}
                    </td>
                    <td className="p-4">
                      {result.score?.passed === null || result.score?.passed === undefined
                        ? "Unknown"
                        : result.score.passed ? "Pass" : "Fail"}
                    </td>
                    <td className="p-4 tabular-nums">
                      {result.score?.answered ?? "—"}
                    </td>
                    <td className="p-4 tabular-nums">
                      {result.score?.unanswered ?? "—"}
                    </td>
                    <td className="p-4 whitespace-nowrap">
                      {recruitmentDuration(result)}
                    </td>
                    <td className="p-4">
                      <div className="flex flex-wrap gap-2">
                        {(result.status === "invited" ||
                          result.status === "active") && (
                          <>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              className="min-h-11"
                              disabled={busy}
                              onClick={() => {
                                if (access.isCurrent())
                                  onCopy(result.assignmentId);
                              }}
                              aria-label={`Copy invitation link for ${result.candidateEmail}`}
                            >
                              Copy link
                            </Button>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              className="min-h-11 text-red-700"
                              disabled={busy}
                              onClick={() => {
                                if (access.isCurrent()) onRevoke(result);
                              }}
                              aria-label={`Revoke invitation for ${result.candidateEmail}`}
                            >
                              Revoke
                            </Button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                  <tr className="border-t border-slate-100">
                    <td colSpan={8} className="px-4 pb-4 pt-2">
                      <details>
                        <summary className="min-h-11 cursor-pointer py-3 text-sm font-medium text-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600">
                          {result.score
                            ? "Review topics and responses"
                            : "View assessment details"}
                          <span className="sr-only">
                            {" "}
                            for {result.candidateEmail}
                          </span>
                        </summary>
                        <div className="space-y-4 rounded-xl bg-slate-50 p-4">
                          <div className="grid gap-2 text-xs text-slate-600 sm:grid-cols-3">
                            <p>
                              Started: {recruitmentDate(result.startedAtMs)}
                            </p>
                            <p>
                              Completed: {recruitmentDate(result.submittedAtMs)}
                            </p>
                            <p>
                              Expires: {recruitmentDate(result.expiresAtMs)}
                            </p>
                          </div>
                          {result.score ? (
                            <>
                              <div className="grid gap-4 md:grid-cols-2">
                                {result.score.topics.map(topic => (
                                  <div key={topic.module}>
                                    <div className="mb-2 flex justify-between gap-4 text-sm">
                                      <span className="font-medium text-slate-800">
                                        {topic.module}
                                      </span>
                                      <span className="shrink-0 tabular-nums text-slate-600">
                                        {topic.correct}/{topic.total} ·{" "}
                                        {topic.percent}%
                                      </span>
                                    </div>
                                    <Progress
                                      value={topic.percent}
                                      aria-label={`${topic.module}: ${topic.correct} of ${topic.total} correct`}
                                      className="bg-slate-200"
                                      indicatorClassName="bg-teal-600 motion-reduce:transition-none"
                                    />
                                    <p className="mt-1 text-xs text-slate-500">
                                      {topic.answered} answered ·{" "}
                                      {topic.total - topic.answered} unanswered
                                    </p>
                                  </div>
                                ))}
                              </div>
                              <p className="text-xs text-slate-600">
                                Selected and correct answers are labelled
                                separately below.
                              </p>
                              <ol className="space-y-4">
                                {result.questions.map((question, index) => (
                                  <li
                                    key={question.id}
                                    className="rounded-xl border border-slate-200 bg-white p-4"
                                  >
                                    <p className="mb-1 text-xs font-medium text-slate-500">
                                      Question {index + 1} · {question.module}
                                    </p>
                                    <p className="whitespace-pre-wrap font-medium text-slate-900">
                                      {question.prompt}
                                    </p>
                                    {result.answers[question.id] ===
                                      undefined && (
                                      <p className="mt-2 text-sm text-slate-600">
                                        Unanswered
                                      </p>
                                    )}
                                    <ul className="mt-3 space-y-2">
                                      {question.options.map(
                                        (option, optionIndex) => {
                                          const selected =
                                              result.answers[question.id] ===
                                              optionIndex,
                                            correct =
                                              question.correctIndex ===
                                              optionIndex;
                                          return (
                                            <li
                                              key={optionIndex}
                                              className={`rounded-lg border p-3 text-sm ${correct ? "border-teal-300 bg-teal-50 text-teal-900" : selected ? "border-blue-300 bg-blue-50 text-blue-900" : "border-slate-200 text-slate-700"}`}
                                            >
                                              <span className="whitespace-pre-wrap">
                                                {option}
                                              </span>
                                              {selected && (
                                                <span className="ml-2 font-semibold">
                                                  · Selected
                                                </span>
                                              )}
                                              {correct && (
                                                <span className="ml-2 font-semibold">
                                                  · Correct answer
                                                </span>
                                              )}
                                            </li>
                                          );
                                        }
                                      )}
                                    </ul>
                                  </li>
                                ))}
                              </ol>
                            </>
                          ) : (
                            <p className="text-sm text-slate-600">
                              {result.status === "expired"
                                ? "This assessment expired without a submission. No final score is available."
                                : result.status === "revoked"
                                  ? "This invitation was revoked before completion. No final score is available."
                                  : "Final scores and response review will be available after submission. Timed assessments automatically score saved answers when their deadline ends; untimed assessments require submission before expiry."}
                            </p>
                          )}
                        </div>
                      </details>
                    </td>
                  </tr>
                </Fragment>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
