import { useEffect, useMemo, useState } from "react";
import { Link, useRoute } from "wouter";
import { marked } from "marked";
import DOMPurify from "dompurify";
import { trpc } from "@/lib/trpc";
import SiteNav from "@/components/SiteNav";
import { usePageMeta } from "@/hooks/usePageMeta";
import type { CeuLearningRecord, CeuQuestion } from "@shared/ceuLearning";
import "./ContinuingEducationCourse.css";
import "./CeuLearning.css";

export function LessonMarkdown({ text }: { text: string }) {
  const html = useMemo(
    () => DOMPurify.sanitize(marked.parse(text, { async: false }) as string),
    [text]
  );
  return (
    <div className="ceu-reading" dangerouslySetInnerHTML={{ __html: html }} />
  );
}
function Choices({
  question,
  value,
  onChange,
  disabled,
}: {
  question: CeuQuestion;
  value?: number;
  onChange: (n: number) => void;
  disabled?: boolean;
}) {
  return (
    <fieldset className="ceu-question">
      <legend>{question.prompt}</legend>
      {question.choices.map((choice, i) => (
        <label key={i} className={value === i ? "selected" : ""}>
          <input
            type="radio"
            name={question.id}
            checked={value === i}
            disabled={disabled}
            onChange={() => onChange(i)}
          />
          <span>{choice}</span>
        </label>
      ))}
    </fieldset>
  );
}
export default function ContinuingEducationCourse() {
  const [, params] = useRoute("/continuing-education/:courseKey");
  return (
    <CourseWorkspace
      key={params?.courseKey}
      courseKey={params?.courseKey ?? ""}
    />
  );
}
function CourseWorkspace({ courseKey }: { courseKey: string }) {
  const identity = trpc.ceu.identity.useQuery(undefined, {
    retry: false,
    staleTime: 0,
  });
  const courseQuery = trpc.ceu.course.useQuery({ courseKey }, { retry: false });
  const recordQuery = trpc.ceu.myRecord.useQuery(
    { courseKey },
    {
      enabled: identity.data?.signedIn === true,
      retry: false,
      refetchOnWindowFocus: false,
    }
  );
  const utils = trpc.useUtils();
  const [active, setActive] = useState("");
  const [view, setView] = useState<"lesson" | "assessment" | "record">(
    "lesson"
  );
  const [draft, setDraft] = useState("");
  const [dirty, setDirty] = useState(false);
  const [message, setMessage] = useState("");
  const [feedback, setFeedback] = useState<Record<string, string>>({});
  const [checkChoices, setCheckChoices] = useState<Record<string, number>>({});
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [examDirty, setExamDirty] = useState(false);
  const [rating, setRating] = useState(5),
    [useful, setUseful] = useState(""),
    [improve, setImprove] = useState("");
  const [attemptId, setAttemptId] = useState<string>(() => crypto.randomUUID());
  const course = courseQuery.data,
    record = recordQuery.data;
  const lesson =
    course?.modules.find(m => m.id === active) ?? course?.modules[0];
  const moduleRecord = lesson ? record?.modules[lesson.id] : undefined;
  const locked = !!record?.completion;
  const exams = trpc.ceu.assessment.useQuery(
    { courseKey },
    {
      enabled: view === "assessment" && !!record,
      retry: false,
      refetchOnWindowFocus: false,
    }
  );
  const cache = (r: CeuLearningRecord | null) =>
    utils.ceu.myRecord.setData({ courseKey }, r);
  const start = trpc.ceu.start.useMutation({
    onSuccess: r => {
      cache(r);
      setMessage("Your course record is ready.");
    },
    onError: e => setMessage(e.message),
  });
  const save = trpc.ceu.save.useMutation({
    onSuccess: ({ record: r, feedback: f }, variables) => {
      cache(r);
      if (
        variables.action.type === "draft" ||
        variables.action.type === "submitExercise"
      )
        setDirty(false);
      if (variables.action.type === "check" && f) {
        const questionId = variables.action.questionId;
        setFeedback(p => ({ ...p, [questionId]: f }));
      }
      if (
        variables.action.type === "exam" ||
        variables.action.type === "examDraft"
      )
        setExamDirty(false);
      if (variables.action.type === "exam") {
        setAttemptId(crypto.randomUUID());
        setMessage("Assessment saved.");
      } else
        setMessage(
          variables.action.type === "resume"
            ? ""
            : "Saved to your course record."
        );
    },
    onError: e => setMessage(e.message),
  });
  const pending = save.isPending || start.isPending;
  usePageMeta({
    title: course
      ? `${course.shortTitle} | Echelon Institute`
      : "Continuing education | Echelon Institute",
    description:
      "Applied operator learning, practical assignments and reviewed learning records.",
    noindex: true,
  });
  useEffect(() => {
    if (record && !active) setActive(record.currentModule);
  }, [record, active]);
  useEffect(() => {
    if (!dirty) setDraft(moduleRecord?.draft ?? "");
  }, [lesson?.id, moduleRecord?.draft, dirty]);
  useEffect(() => {
    const warn = (e: BeforeUnloadEvent) => {
      if (dirty || examDirty) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty, examDirty]);
  useEffect(() => {
    if (!examDirty && record?.assessmentDraft && exams.data) {
      setAnswers(
        Object.fromEntries(
          exams.data.flatMap((q, i) =>
            record.assessmentDraft!.answers[i] === null
              ? []
              : [[q.id, record.assessmentDraft!.answers[i]!]]
          )
        )
      );
      setAttemptId(record.assessmentDraft.attemptId);
    }
  }, [record?.assessmentDraft, exams.data, examDirty]);
  function navigate(moduleId: string) {
    if (
      dirty &&
      !window.confirm(
        "This exercise has unsaved changes. Leave without saving?"
      )
    )
      return;
    setDirty(false);
    setDraft(record?.modules[moduleId]?.draft ?? "");
    setActive(moduleId);
    setView("lesson");
    setMessage("");
    if (record && !locked && !pending)
      save.mutate({
        courseKey,
        revision: record.revision,
        action: { type: "resume", moduleId },
      });
  }
  if (courseQuery.isLoading)
    return <main className="ceu-learning">Loading course…</main>;
  if (!course || !lesson)
    return (
      <main className="ceu-learning">
        <h1>Course unavailable</h1>
        <p>
          {courseQuery.error?.message ?? "Choose a course from the catalogue."}
        </p>
        <Link href="/continuing-education">Course catalogue</Link>
      </main>
    );
  const checked = course.modules.filter(m =>
    m.checks.every(q => record?.modules[m.id]?.checks[q.id]?.correct)
  ).length;
  const submitted = course.modules.filter(
    m => record?.modules[m.id]?.submittedAt
  ).length;
  const reviewed = course.modules.filter(
    m => record?.modules[m.id]?.review?.passed
  ).length;
  const lastAttempt = record?.attempts.at(-1);
  return (
    <div className="ceu-preview-page">
      <SiteNav currentPath="/continuing-education" variant="marketing" />
      <main className="ceu-learning">
        <header className="ceu-learning-header">
          <Link
            href="/continuing-education"
            onClick={e => {
              if (
                (dirty || examDirty) &&
                !window.confirm(
                  "Leave with unsaved work? Save your drafts first to resume later."
                )
              )
                e.preventDefault();
            }}
          >
            ← Course catalogue
          </Link>
          <p className="ceu-eyebrow">
            Operator professional learning · pilot edition
          </p>
          <h1>{course.title}</h1>
          <p>{course.introduction}</p>
          <p className="ceu-note">
            {course.plannedMinutes / 60} planned learning hours · duration
            pending timed pilot · no approved CEUs awarded
          </p>
          <details>
            <summary>Delivery and prerequisites</summary>
            <p>{course.delivery}</p>
            <p>{course.prerequisites}</p>
          </details>
          {identity.data?.reviewer && (
            <Link href="/continuing-education-review">
              Instructor review workspace
            </Link>
          )}
        </header>
        {!identity.data?.signedIn ? (
          <aside className="ceu-status">
            <p>
              Read the lessons freely. Sign in to save practical work and take
              the assessed course.
            </p>
            <Link
              href={`/account?next=${encodeURIComponent(`/continuing-education/${courseKey}`)}`}
            >
              Sign in to save learning
            </Link>
          </aside>
        ) : recordQuery.isError ? (
          <aside className="ceu-status" role="alert">
            <p>{recordQuery.error.message}</p>
            <button onClick={() => recordQuery.refetch()}>
              Retry loading record
            </button>
          </aside>
        ) : recordQuery.isLoading ? (
          <p>Loading saved work…</p>
        ) : !record ? (
          <aside className="ceu-status">
            <p>
              This pilot course does not award approved CEUs. Your practical
              submissions are reviewed by Echelon's authorized instructor team.
            </p>
            <button
              disabled={pending}
              onClick={() => start.mutate({ courseKey })}
            >
              Start and save my learning
            </button>
          </aside>
        ) : null}
        {message && (
          <p className="ceu-status" role="status">
            {message}{" "}
            {save.error?.data?.code === "CONFLICT" && (
              <button onClick={() => recordQuery.refetch()}>
                Reload saved record (keep my unsaved text)
              </button>
            )}
          </p>
        )}
        <div className="ceu-learning-grid">
          <aside className="ceu-learning-nav">
            <p>
              {checked}/{course.modules.length} modules: checks passed
            </p>
            <p>
              {reviewed}/{course.modules.length} practicals accepted
            </p>
            <nav aria-label="Course modules">
              {course.modules.map((m, i) => (
                <button
                  key={m.id}
                  aria-current={
                    view === "lesson" && lesson.id === m.id ? "step" : undefined
                  }
                  disabled={pending}
                  onClick={() => navigate(m.id)}
                >
                  {i + 1}. {m.title}
                </button>
              ))}
            </nav>
            <button
              onClick={() => {
                if (
                  !dirty ||
                  window.confirm(
                    "Your exercise has unsaved changes. Open the assessment?"
                  )
                )
                  setView("assessment");
              }}
            >
              Final assessment
            </button>
            <button onClick={() => setView("record")}>
              My learning record
            </button>
          </aside>
          <section className="ceu-learning-main">
            {view === "lesson" ? (
              <article>
                <h2>{lesson.title}</h2>
                <ul>
                  {lesson.objectives.map(o => (
                    <li key={o}>{o}</li>
                  ))}
                </ul>
                <details>
                  <summary>
                    Learning activities ·{" "}
                    {lesson.activities.reduce((s, a) => s + a.minutes, 0)}{" "}
                    planned minutes
                  </summary>
                  <ol>
                    {lesson.activities.map((a, i) => (
                      <li key={i}>
                        <strong>{a.minutes} minutes:</strong> {a.instruction}
                      </li>
                    ))}
                  </ol>
                  <p>
                    These are self-paced activity estimates, not automatically
                    earned contact hours.
                  </p>
                </details>
                <LessonMarkdown text={lesson.lesson} />
                <section className="ceu-case">
                  <h2>Evidence pack</h2>
                  <p>
                    All facility names, records and numerical operating
                    conditions in this case are fictional.
                  </p>
                  <LessonMarkdown text={lesson.evidence} />
                </section>
                <section>
                  <h2>Practical assignment</h2>
                  <LessonMarkdown text={lesson.assignment} />
                  <h3>Acceptance criteria</h3>
                  <ul>
                    {lesson.rubric.map(r => (
                      <li key={r}>{r}</li>
                    ))}
                  </ul>
                  <label className="ceu-field">
                    Your analysis
                    <textarea
                      rows={12}
                      value={draft}
                      maxLength={20000}
                      disabled={
                        !record ||
                        locked ||
                        pending ||
                        moduleRecord?.review?.passed
                      }
                      onChange={e => {
                        setDraft(e.target.value);
                        setDirty(true);
                      }}
                      placeholder="Use the evidence IDs, show calculations and distinguish facts from assumptions. Do not include confidential workplace records."
                    />
                  </label>
                  <div className="ceu-actions">
                    <button
                      disabled={
                        !record ||
                        pending ||
                        locked ||
                        moduleRecord?.review?.passed
                      }
                      onClick={() =>
                        record &&
                        save.mutate({
                          courseKey,
                          revision: record.revision,
                          action: {
                            type: "draft",
                            moduleId: lesson.id,
                            text: draft,
                          },
                        })
                      }
                    >
                      Save draft
                    </button>
                    <button
                      disabled={
                        !record ||
                        pending ||
                        locked ||
                        draft.trim().length < 100 ||
                        moduleRecord?.review?.passed
                      }
                      onClick={() =>
                        record &&
                        save.mutate({
                          courseKey,
                          revision: record.revision,
                          action: {
                            type: "submitExercise",
                            moduleId: lesson.id,
                            text: draft,
                          },
                        })
                      }
                    >
                      Submit for instructor review
                    </button>
                    <span>
                      {dirty
                        ? "Unsaved changes"
                        : moduleRecord?.submittedAt
                          ? "Submitted for review"
                          : "Draft workspace"}
                    </span>
                  </div>
                  {moduleRecord?.review && (
                    <div className="ceu-status">
                      <strong>
                        {moduleRecord.review.passed
                          ? "Accepted"
                          : "Revision requested"}
                      </strong>
                      <p>{moduleRecord.review.feedback}</p>
                    </div>
                  )}
                </section>
                <section>
                  <h2>Module checks</h2>
                  <p>
                    These checks provide learning feedback. Pass each check
                    before the final assessment.
                  </p>
                  {lesson.checks.map(q => (
                    <div key={q.id}>
                      <Choices
                        question={q}
                        value={
                          checkChoices[q.id] ??
                          moduleRecord?.checks[q.id]?.selectedIndex
                        }
                        disabled={!record || pending || locked}
                        onChange={n =>
                          setCheckChoices(p => ({ ...p, [q.id]: n }))
                        }
                      />
                      <button
                        disabled={
                          !record ||
                          pending ||
                          locked ||
                          (checkChoices[q.id] ??
                            moduleRecord?.checks[q.id]?.selectedIndex) ===
                            undefined
                        }
                        onClick={() =>
                          record &&
                          save.mutate({
                            courseKey,
                            revision: record.revision,
                            action: {
                              type: "check",
                              moduleId: lesson.id,
                              questionId: q.id,
                              choice:
                                checkChoices[q.id] ??
                                moduleRecord!.checks[q.id].selectedIndex,
                            },
                          })
                        }
                      >
                        Check answer
                      </button>
                      {moduleRecord?.checks[q.id] && (
                        <p role="status">
                          {moduleRecord.checks[q.id].correct
                            ? "Correct."
                            : "Review the lesson and try again."}{" "}
                          {feedback[q.id]}
                        </p>
                      )}
                    </div>
                  ))}
                </section>
                <section>
                  <h2>Source reading</h2>
                  <p>
                    Use the indicated sections; Ontario sources establish local
                    requirements. US references support technical learning and
                    do not establish Ontario legal obligations.
                  </p>
                  <ul>
                    {course.sources
                      .filter(s => lesson.sourceIds.includes(s.id))
                      .map(s => (
                        <li key={s.id}>
                          <a href={s.url} target="_blank" rel="noreferrer">
                            {s.title}
                          </a>
                          <p>
                            {s.section} · {s.jurisdiction} · reviewed{" "}
                            {s.accessed}
                          </p>
                        </li>
                      ))}
                  </ul>
                </section>
                <div className="ceu-actions">
                  {course.modules.findIndex(m => m.id === lesson.id) > 0 && (
                    <button
                      disabled={pending}
                      onClick={() =>
                        navigate(
                          course.modules[
                            course.modules.findIndex(m => m.id === lesson.id) -
                              1
                          ].id
                        )
                      }
                    >
                      Previous module
                    </button>
                  )}
                  {course.modules.findIndex(m => m.id === lesson.id) <
                    course.modules.length - 1 && (
                    <button
                      disabled={pending}
                      onClick={() =>
                        navigate(
                          course.modules[
                            course.modules.findIndex(m => m.id === lesson.id) +
                              1
                          ].id
                        )
                      }
                    >
                      Next module
                    </button>
                  )}
                </div>
              </article>
            ) : view === "assessment" ? (
              <article>
                <h2>Final assessment</h2>
                <p>
                  Pass mark: 80%. Three attempts are available before instructor
                  reassessment review. Submitted attempts are retained.
                  Practical acceptance and verified participation are separate
                  completion requirements.
                </p>
                {lastAttempt && (
                  <div className="ceu-status" role="status">
                    Last result: {lastAttempt.score}/{lastAttempt.total} (
                    {Math.round((lastAttempt.score / lastAttempt.total) * 100)}
                    %).{" "}
                    {lastAttempt.passed
                      ? "Passed."
                      : "Review the learning objectives before another attempt."}
                  </div>
                )}
                {!record ||
                checked !== course.modules.length ||
                submitted !== course.modules.length ? (
                  <p>
                    Pass all module checks and submit all practical assignments
                    to unlock the final assessment.
                  </p>
                ) : exams.isError ? (
                  <p role="alert">{exams.error.message}</p>
                ) : exams.isLoading ? (
                  <p>Loading assessment…</p>
                ) : (
                  <>
                    <p>
                      {exams.data?.length} questions · {record.attempts.length}{" "}
                      attempts recorded
                    </p>
                    {exams.data?.map(q => (
                      <Choices
                        key={q.id}
                        question={q}
                        value={answers[q.id]}
                        disabled={
                          pending ||
                          locked ||
                          !!lastAttempt?.passed ||
                          record.attempts.length >=
                            3 + (record.additionalAttempts ?? 0)
                        }
                        onChange={n => {
                          setAnswers(p => ({ ...p, [q.id]: n }));
                          setExamDirty(true);
                        }}
                      />
                    ))}
                    <button
                      disabled={
                        pending ||
                        locked ||
                        !!lastAttempt?.passed ||
                        record.attempts.length >=
                          3 + (record.additionalAttempts ?? 0) ||
                        !exams.data?.every(q => answers[q.id] !== undefined)
                      }
                      onClick={() =>
                        exams.data &&
                        save.mutate({
                          courseKey,
                          revision: record.revision,
                          action: {
                            type: "exam",
                            attemptId,
                            answers: exams.data.map(q => answers[q.id]),
                          },
                        })
                      }
                    >
                      Submit assessment
                    </button>
                    <button
                      disabled={
                        pending || locked || !!lastAttempt?.passed || !examDirty
                      }
                      onClick={() =>
                        exams.data &&
                        save.mutate({
                          courseKey,
                          revision: record.revision,
                          action: {
                            type: "examDraft",
                            attemptId,
                            answers: exams.data.map(q => answers[q.id] ?? null),
                          },
                        })
                      }
                    >
                      Save assessment draft
                    </button>
                    <p>
                      {examDirty
                        ? "Assessment has unsaved changes."
                        : "Saved assessment work is retained in your record."}
                    </p>
                  </>
                )}
              </article>
            ) : (
              <article className="ceu-print-record">
                <h2>My learning record</h2>
                {!record ? (
                  <p>Start this course to create a saved record.</p>
                ) : (
                  <>
                    <dl>
                      <dt>Course</dt>
                      <dd>{course.title}</dd>
                      <dt>Provider</dt>
                      <dd>Echelon Institute</dd>
                      <dt>Course edition</dt>
                      <dd>{record.courseVersion}</dd>
                      <dt>Started</dt>
                      <dd>{new Date(record.startedAt).toLocaleString()}</dd>
                      <dt>Practical submissions</dt>
                      <dd>
                        {submitted}/{course.modules.length} submitted ·{" "}
                        {reviewed} accepted
                      </dd>
                      <dt>Assessment</dt>
                      <dd>
                        {record.attempts.some(a => a.passed)
                          ? "Passed"
                          : "Not yet passed"}
                      </dd>
                      <dt>Participation</dt>
                      <dd>
                        {record.participation
                          ? `${record.participation.sessions.reduce((s, a) => s + a.minutes, 0)} instructor-verified minutes`
                          : "Awaiting instructor verification"}
                      </dd>
                      {record.participation && (
                        <>
                          <dt>Instructor</dt>
                          <dd>{record.participation.instructor}</dd>
                          <dt>Verified learning dates</dt>
                          <dd>
                            {record.participation.sessions.map((session, i) => (
                              <p key={i}>
                                {session.date} · {session.minutes} contact
                                minutes
                              </p>
                            ))}
                          </dd>
                        </>
                      )}
                    </dl>
                    <h3>Assessment history</h3>
                    {record.attempts.map((a, i) => (
                      <p key={a.id}>
                        Attempt {i + 1}: {a.score}/{a.total} ·{" "}
                        {a.passed ? "passed" : "not passed"} ·{" "}
                        {new Date(a.at).toLocaleString()}
                      </p>
                    ))}
                    {record.completion ? (
                      <section className="ceu-status">
                        <h3>Pilot learning completed</h3>
                        <p>{record.completion.name}</p>
                        <p>{record.completion.statement}</p>
                        <p>
                          Record {record.completion.id} ·{" "}
                          {new Date(record.completion.at).toLocaleDateString()}
                        </p>
                        <button
                          className="ceu-no-print"
                          onClick={() => window.print()}
                        >
                          Print learning record
                        </button>
                      </section>
                    ) : (
                      <p>
                        Completion is recorded after all practical work is
                        accepted, the assessment is passed, participation is
                        verified and your evaluation is received. No approved
                        CEU certificate is issued by this pilot.
                      </p>
                    )}
                    <h3>Course evaluation</h3>
                    {record.evaluation ? (
                      <p>
                        Evaluation received. Thank you for helping improve the
                        course.
                      </p>
                    ) : (
                      <form
                        onSubmit={e => {
                          e.preventDefault();
                          save.mutate({
                            courseKey,
                            revision: record.revision,
                            action: {
                              type: "evaluation",
                              rating,
                              useful,
                              improve,
                            },
                          });
                        }}
                      >
                        <p>
                          Your evaluation is linked to this pilot record and
                          visible to the instructor team.
                        </p>
                        <label className="ceu-field">
                          How useful was the course?
                          <select
                            value={rating}
                            onChange={e => setRating(Number(e.target.value))}
                          >
                            {[5, 4, 3, 2, 1].map(n => (
                              <option key={n} value={n}>
                                {n} / 5
                              </option>
                            ))}
                          </select>
                        </label>
                        <label className="ceu-field">
                          What helped you learn?
                          <textarea
                            required
                            minLength={10}
                            maxLength={2000}
                            value={useful}
                            onChange={e => setUseful(e.target.value)}
                          />
                        </label>
                        <label className="ceu-field">
                          What should improve?
                          <textarea
                            required
                            minLength={10}
                            maxLength={2000}
                            value={improve}
                            onChange={e => setImprove(e.target.value)}
                          />
                        </label>
                        <button disabled={pending || locked}>
                          Send evaluation
                        </button>
                      </form>
                    )}
                  </>
                )}
              </article>
            )}
          </section>
        </div>
      </main>
    </div>
  );
}
