import { useState } from "react";
import { Link } from "wouter";
import SiteNav from "@/components/SiteNav";
import { trpc } from "@/lib/trpc";
import { LessonMarkdown } from "./ContinuingEducationCourse";
import type { CeuLearningRecord } from "@shared/ceuLearning";
import "./CeuLearning.css";
export default function CeuInstructorReview() {
  const queue = trpc.ceu.reviewQueue.useQuery(undefined, { retry: false });
  const [selected, setSelected] = useState("");
  const item = queue.data?.find(
    r => `${r.email}|${r.courseKey}|${r.courseVersion}` === selected
  );
  return (
    <>
      <SiteNav currentPath="/continuing-education" />
      <main className="ceu-learning">
        <Link href="/continuing-education">Course catalogue</Link>
        <h1>Instructor review</h1>
        {queue.isLoading ? (
          <p>Loading submissions…</p>
        ) : queue.isError ? (
          <p role="alert">
            {queue.error.message} Administrator sign-in is required.
          </p>
        ) : (
          <>
            <label className="ceu-field">
              Learner record
              <select
                value={selected}
                onChange={e => setSelected(e.target.value)}
              >
                <option value="">Choose a record</option>
                {queue.data?.map(r => (
                  <option
                    key={`${r.email}|${r.courseKey}|${r.courseVersion}`}
                    value={`${r.email}|${r.courseKey}|${r.courseVersion}`}
                  >
                    {r.email} · {r.courseKey} · {r.courseVersion}
                  </option>
                ))}
              </select>
            </label>
            <p>
              Latest 100 course records. Practical acceptance requires every
              criterion; participation must be supported by attendance and
              engagement evidence.
            </p>
            {item && (
              <Review
                key={selected}
                item={item}
                refresh={() => queue.refetch()}
              />
            )}
          </>
        )}
      </main>
    </>
  );
}
function Review({
  item,
  refresh,
}: {
  item: {
    email: string;
    courseKey: string;
    courseVersion: string;
    record: CeuLearningRecord;
  };
  refresh: () => unknown;
}) {
  const course = trpc.ceu.instructorMaterial.useQuery({
    courseKey: item.courseKey,
  });
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [instructor, setInstructor] = useState(
      item.record.participation?.instructor ?? ""
    ),
    [qualifications, setQualifications] = useState(
      item.record.participation?.instructorQualifications ?? ""
    ),
    [name, setName] = useState("");
  const [reason, setReason] = useState("");
  const [sessions, setSessions] = useState(
    item.record.participation?.sessions ?? [
      { date: "", minutes: 0, evidence: "" },
    ]
  );
  const [error, setError] = useState("");
  const review = trpc.ceu.review.useMutation({
    onSuccess: () => {
      setError("Saved.");
      refresh();
    },
    onError: e => setError(e.message),
  });
  const common = {
    courseKey: item.courseKey,
    email: item.email,
    revision: item.record.revision,
  };
  if (course.isError) return <p role="alert">{course.error.message}</p>;
  if (!course.data) return <p>Loading instructor material…</p>;
  if (course.data.version !== item.courseVersion)
    return (
      <p>
        This record belongs to an archived edition. Review it against its
        original curriculum; current-edition changes are blocked.
      </p>
    );
  return (
    <section>
      <h2>{course.data.title}</h2>
      <p role="status">{error}</p>
      {item.record.completion ? (
        <p>Completed record {item.record.completion.id} is immutable.</p>
      ) : (
        <>
          {course.data.modules.map(m => {
            const work = item.record.modules[m.id];
            return (
              <details key={m.id}>
                <summary>
                  {m.title} ·{" "}
                  {work?.review?.passed
                    ? "accepted"
                    : work?.submittedAt
                      ? "submitted"
                      : "not submitted"}
                </summary>
                <h3>Submitted work</h3>
                <pre className="ceu-submission">
                  {work?.draft || "No work saved."}
                </pre>
                {work?.history?.length ? (
                  <details>
                    <summary>
                      Prior submitted versions ({work.history.length})
                    </summary>
                    {work.history.map((v, i) => (
                      <div key={i}>
                        <p>
                          {v.submittedAt} · {v.review?.feedback}
                        </p>
                        <pre className="ceu-submission">{v.text}</pre>
                      </div>
                    ))}
                  </details>
                ) : null}
                <h3>Marking criteria</h3>
                <ul>
                  {m.rubric.map(r => (
                    <li key={r}>{r}</li>
                  ))}
                </ul>
                <h3>Facilitator guide</h3>
                <LessonMarkdown text={m.facilitatorGuide} />
                <label className="ceu-field">
                  Feedback
                  <textarea
                    value={notes[m.id] ?? ""}
                    onChange={e =>
                      setNotes(p => ({ ...p, [m.id]: e.target.value }))
                    }
                  />
                </label>
                <div className="ceu-actions">
                  {[true, false].map(passed => (
                    <button
                      key={String(passed)}
                      disabled={
                        review.isPending ||
                        !work?.submittedAt ||
                        (notes[m.id]?.trim().length ?? 0) < 20
                      }
                      onClick={() =>
                        review.mutate({
                          ...common,
                          action: {
                            type: "review",
                            moduleId: m.id,
                            passed,
                            feedback: notes[m.id],
                          },
                        })
                      }
                    >
                      {passed
                        ? "Accept against all criteria"
                        : "Return for revision"}
                    </button>
                  ))}
                </div>
                {work?.review && <p>{work.review.feedback}</p>}
              </details>
            );
          })}
          <h3>Verify participation</h3>
          <p>
            Record actual completed sessions, excluding breaks. Dates and
            supporting evidence are mandatory; the same activity must not be
            credited to more than one course. Page-open time is not proof of
            attendance.
          </p>
          <label className="ceu-field">
            Instructor name
            <input
              value={instructor}
              onChange={e => setInstructor(e.target.value)}
            />
          </label>
          <label className="ceu-field">
            Qualifications and authorization evidence
            <textarea
              value={qualifications}
              onChange={e => setQualifications(e.target.value)}
            />
          </label>
          {sessions.map((s, i) => (
            <div key={i} className="ceu-session">
              <label>
                Date
                <input
                  type="date"
                  value={s.date}
                  onChange={e =>
                    setSessions(v =>
                      v.map((x, n) =>
                        n === i ? { ...x, date: e.target.value } : x
                      )
                    )
                  }
                />
              </label>
              <label>
                Contact minutes
                <input
                  type="number"
                  min={1}
                  max={420}
                  value={s.minutes}
                  onChange={e =>
                    setSessions(v =>
                      v.map((x, n) =>
                        n === i ? { ...x, minutes: Number(e.target.value) } : x
                      )
                    )
                  }
                />
              </label>
              <label>
                Attendance and engagement evidence
                <textarea
                  value={s.evidence}
                  onChange={e =>
                    setSessions(v =>
                      v.map((x, n) =>
                        n === i ? { ...x, evidence: e.target.value } : x
                      )
                    )
                  }
                />
              </label>
            </div>
          ))}
          <div className="ceu-actions">
            <button
              onClick={() =>
                setSessions(v => [...v, { date: "", minutes: 0, evidence: "" }])
              }
            >
              Add session
            </button>
            <button
              disabled={review.isPending}
              onClick={() =>
                review.mutate({
                  ...common,
                  action: {
                    type: "participation",
                    instructor,
                    instructorQualifications: qualifications,
                    sessions,
                  },
                })
              }
            >
              Attest completed participation
            </button>
          </div>
          <h3>Reassessment review</h3>
          <p>
            After exhausted unsuccessful attempts, document remedial learning
            and the supervised reassessment arrangement. At most three
            additional pilot attempts may be authorized.
          </p>
          <label className="ceu-field">
            Remedial work and reassessment reason
            <textarea
              value={reason}
              onChange={e => setReason(e.target.value)}
            />
          </label>
          <button
            disabled={
              review.isPending ||
              reason.trim().length < 20 ||
              item.record.attempts.some(a => a.passed) ||
              item.record.attempts.length <
                3 + (item.record.additionalAttempts ?? 0)
            }
            onClick={() =>
              review.mutate({
                ...common,
                action: { type: "authorizeReassessment", reason },
              })
            }
          >
            Authorize one additional attempt
          </button>
          <h3>Record pilot completion</h3>
          <p>
            This issues a non-credit learning record only. It cannot issue a
            Director-approved certificate or assessed CEU value.
          </p>
          <label className="ceu-field">
            Verified participant name
            <input value={name} onChange={e => setName(e.target.value)} />
          </label>
          <button
            disabled={review.isPending || name.trim().length < 2}
            onClick={() =>
              review.mutate({ ...common, action: { type: "complete", name } })
            }
          >
            Verify requirements and record completion
          </button>
        </>
      )}
      <h3>Saved participation and evaluation</h3>
      {item.record.participation && (
        <>
          <p>
            {item.record.participation.instructor} ·{" "}
            {item.record.participation.instructorQualifications}
          </p>
          {item.record.participation.sessions.map((s, i) => (
            <p key={i}>
              {s.date} · {s.minutes} minutes · {s.evidence}
            </p>
          ))}
        </>
      )}
      {item.record.evaluation && (
        <>
          <p>Rating: {item.record.evaluation.rating}/5</p>
          <p>Useful: {item.record.evaluation.useful}</p>
          <p>Improve: {item.record.evaluation.improve}</p>
        </>
      )}
      <h3>Assessment history</h3>
      {item.record.attempts.map(a => (
        <p key={a.id}>
          {a.at}: {a.score}/{a.total} · {a.passed ? "passed" : "not passed"}
        </p>
      ))}
      <h3>Review history</h3>
      {item.record.audit.map((a, i) => (
        <p key={i}>
          {a.at} · {a.action} · {a.moduleId ?? "course"} · {a.actor} ·{" "}
          {a.detail ?? ""}
        </p>
      ))}
    </section>
  );
}
