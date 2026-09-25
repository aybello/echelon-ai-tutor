import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useRoute } from "wouter";
import { marked } from "marked";
import DOMPurify from "dompurify";
import { trpc } from "@/lib/trpc";
import SiteNav from "@/components/SiteNav";
import { usePageMeta } from "@/hooks/usePageMeta";
import type {
  CeuExerciseAnswer,
  CeuExerciseQuestion,
  CeuLearningRecord,
  CeuQuestion,
} from "@shared/ceuLearning";
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
function ExerciseItem({
  item,
  value,
  onChange,
  disabled,
}: {
  item: CeuExerciseQuestion;
  value?: CeuExerciseAnswer;
  onChange: (v: CeuExerciseAnswer) => void;
  disabled: boolean;
}) {
  if (item.type === "number")
    return (
      <label className="ceu-field">
        {item.prompt} ({item.unit})
        <input
          aria-label={item.prompt}
          type="number"
          step="any"
          disabled={disabled}
          value={typeof value === "number" ? value : ""}
          onChange={e => onChange(Number(e.target.value))}
        />
      </label>
    );
  if (item.type === "order")
    return (
      <fieldset className="ceu-question">
        <legend>{item.prompt}</legend>
        {item.choices?.map((_, position) => (
          <label key={position}>
            Step {position + 1}
            <select
              aria-label={`${item.prompt} step ${position + 1}`}
              disabled={disabled}
              value={Array.isArray(value) ? (value[position] ?? "") : ""}
              onChange={e => {
                const next = Array.isArray(value) ? [...value] : [];
                next[position] = Number(e.target.value);
                onChange(next);
              }}
            >
              <option value="">Choose a step</option>
              {item.choices?.map((choice, i) => (
                <option key={i} value={i}>
                  {choice}
                </option>
              ))}
            </select>
          </label>
        ))}
      </fieldset>
    );
  if (item.type === "multiple")
    return (
      <fieldset className="ceu-question">
        <legend>{item.prompt} (select all that apply)</legend>
        {item.choices?.map((choice, i) => (
          <label key={i}>
            <input
              type="checkbox"
              disabled={disabled}
              checked={Array.isArray(value) && value.includes(i)}
              onChange={e =>
                onChange(
                  e.target.checked
                    ? [...(Array.isArray(value) ? value : []), i]
                    : (Array.isArray(value) ? value : []).filter(n => n !== i)
                )
              }
            />
            {choice}
          </label>
        ))}
      </fieldset>
    );
  return (
    <Choices
      question={{
        id: item.id,
        objective: "",
        prompt: item.prompt,
        choices: item.choices ?? [],
      }}
      value={typeof value === "number" ? value : undefined}
      onChange={onChange}
      disabled={disabled}
    />
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
  const [learnerName, setLearnerName] = useState("");
  const [operatorNumber, setOperatorNumber] = useState("");
  const [draft, setDraft] = useState("");
  const [dirty, setDirty] = useState(false);
  const [message, setMessage] = useState("");
  const [checkChoices, setCheckChoices] = useState<Record<string, number>>({});
  const [feedback, setFeedback] = useState<Record<string, string>>({});
  const [exerciseAnswers, setExerciseAnswers] = useState<
    Record<string, CeuExerciseAnswer>
  >({});
  const [exerciseFeedback, setExerciseFeedback] = useState<
    {
      id: string;
      correct: boolean;
      explanation: string;
      correctAnswer: string | number | (string | number)[];
    }[]
  >([]);
  const [exerciseAttemptId, setExerciseAttemptId] = useState<string>(() =>
    crypto.randomUUID()
  );
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [examDirty, setExamDirty] = useState(false);
  const [attemptId, setAttemptId] = useState<string>(() => crypto.randomUUID());
  const [rating, setRating] = useState(5),
    [useful, setUseful] = useState(""),
    [improve, setImprove] = useState("");
  const lastActivity = useRef(Date.now());
  const course = courseQuery.data,
    record = recordQuery.data;
  const lesson =
    course?.modules.find(m => m.id === active) ?? course?.modules[0];
  const moduleRecord = lesson ? record?.modules[lesson.id] : undefined;
  const locked = !!record?.completion;
  const exercise = trpc.ceu.exercise.useQuery(
    { courseKey, moduleId: lesson?.id ?? "" },
    {
      enabled: !!record && !!lesson && !locked,
      retry: false,
      refetchOnWindowFocus: false,
    }
  );
  const exams = trpc.ceu.assessment.useQuery(
    { courseKey },
    {
      enabled: view === "assessment" && !!record && !locked,
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
  const heartbeat = trpc.ceu.heartbeat.useMutation({
    onSuccess: ({ record: r }) => cache(r),
    onError: e => setMessage(e.message),
  });
  const save = trpc.ceu.save.useMutation({
    onSuccess: ({ record: r, feedback: f }, variables) => {
      cache(r);
      if (variables.action.type === "draft") setDirty(false);
      if (variables.action.type === "check" && typeof f === "string") {
        const questionId = variables.action.questionId;
        setFeedback(p => ({ ...p, [questionId]: f }));
      }
      if (variables.action.type === "submitExercise") {
        setExerciseFeedback(Array.isArray(f) ? f : []);
        setExerciseAnswers({});
        setExerciseAttemptId(crypto.randomUUID());
        utils.ceu.exercise.invalidate({
          courseKey,
          moduleId: variables.action.moduleId,
        });
        setMessage(
          r.modules[variables.action.moduleId]?.exerciseAttempts.at(-1)?.passed
            ? "Case exercise passed."
            : "Review the item feedback and retry with a new option order."
        );
      } else if (variables.action.type === "exam") {
        setExamDirty(false);
        setAttemptId(crypto.randomUUID());
        setMessage(
          r.completion
            ? "Course completed. Your record is ready."
            : "Assessment saved."
        );
        if (r.completion) setView("record");
      } else if (variables.action.type === "examDraft") {
        setExamDirty(false);
        setMessage("Assessment draft saved.");
      } else if (variables.action.type !== "resume")
        setMessage("Saved to your course record.");
    },
    onError: e => setMessage(e.message),
  });
  const pending = start.isPending || save.isPending;
  usePageMeta({
    title: course
      ? `${course.shortTitle} | Echelon Institute`
      : "Continuing education | Echelon Institute",
    description:
      "Self-paced case exercises and automatically issued pilot learning records.",
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
  useEffect(() => {
    const activity = () => {
      lastActivity.current = Date.now();
    };
    for (const event of ["pointermove", "keydown", "scroll", "touchstart"])
      window.addEventListener(event, activity, { passive: true });
    return () => {
      for (const event of ["pointermove", "keydown", "scroll", "touchstart"])
        window.removeEventListener(event, activity);
    };
  }, []);
  useEffect(() => {
    if (!record || !lesson || locked) return;
    lastActivity.current = Date.now();
    const send = () => {
      if (
        document.visibilityState !== "visible" ||
        Date.now() - lastActivity.current >= 300000 ||
        save.isPending ||
        heartbeat.isPending
      )
        return;
      heartbeat.mutate({
        courseKey,
        moduleId: lesson.id,
        activityAt: new Date(lastActivity.current).toISOString(),
      });
    };
    send();
    const timer = window.setInterval(send, 30000);
    return () => window.clearInterval(timer);
  }, [!!record, lesson?.id, locked, courseKey]);
  function navigate(moduleId: string) {
    if (
      dirty &&
      !window.confirm("Your notes have unsaved changes. Leave without saving?")
    )
      return;
    setDirty(false);
    setDraft(record?.modules[moduleId]?.draft ?? "");
    setExerciseFeedback([]);
    setExerciseAnswers({});
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
  const passed = course.modules.filter(m =>
    record?.modules[m.id]?.exerciseAttempts.some(a => a.passed)
  ).length;
  const seconds = course.modules.reduce(
    (s, m) => s + (record?.modules[m.id]?.activeSeconds ?? 0),
    0
  );
  const timeMet =
    seconds >= course.plannedMinutes * 60 &&
    course.modules.every(
      m =>
        (record?.modules[m.id]?.activeSeconds ?? 0) >=
        m.activities.reduce((s, a) => s + a.minutes, 0) * 60
    );
  const lastAttempt = record?.attempts.at(-1);
  return (
    <div className="ceu-preview-page">
      <SiteNav currentPath="/continuing-education" variant="marketing" />
      <main className="ceu-learning">
        <header>
          <Link href="/continuing-education">← Course catalogue</Link>
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
        </header>
        {!identity.data?.signedIn ? (
          <aside className="ceu-status">
            <p>
              Read the lessons freely. Sign in to save work and take the
              assessed course.
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
              Enroll for self-paced case exercises and an automatic non-credit
              completion record.
            </p>
            <label className="ceu-field">
              Your full name{" "}
              <input
                value={learnerName}
                maxLength={150}
                onChange={e => setLearnerName(e.target.value)}
              />
            </label>
            <label className="ceu-field">
              WWOCS operator ID{" "}
              <input
                value={operatorNumber}
                maxLength={32}
                onChange={e => setOperatorNumber(e.target.value)}
              />
            </label>
            <p>
              Your name and operator ID will appear on your completion record.
              Confirm them before enrolling.
            </p>
            <button
              disabled={
                pending ||
                learnerName.trim().length < 2 ||
                operatorNumber.trim().length < 3
              }
              onClick={() =>
                start.mutate({ courseKey, learnerName, operatorNumber })
              }
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
                Reload saved record
              </button>
            )}
          </p>
        )}
        <div className="ceu-learning-grid">
          <aside className="ceu-learning-nav">
            <p>
              {checked}/{course.modules.length} module checks passed
            </p>
            <p>
              {passed}/{course.modules.length} case exercises passed
            </p>
            <p>
              {Math.floor(seconds / 60)}/{course.plannedMinutes} active minutes
              recorded
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
            <button onClick={() => setView("assessment")}>
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
                </details>
                <p className="ceu-note">
                  This module:{" "}
                  {Math.floor((moduleRecord?.activeSeconds ?? 0) / 60)} active
                  minutes recorded. The timer pauses after five minutes without
                  activity or when the tab is hidden. You need{" "}
                  {lesson.activities.reduce((s, a) => s + a.minutes, 0)} minutes
                  before submitting the case exercise.
                </p>
                <LessonMarkdown text={lesson.lesson} />
                <section className="ceu-case">
                  <h2>Evidence pack</h2>
                  <p>
                    Facility names, records and numerical conditions are
                    fictional.
                  </p>
                  <LessonMarkdown text={lesson.evidence} />
                </section>
                <section>
                  <h2>Case exercise</h2>
                  <p>
                    Use the evidence pack to answer each item. Pass mark: 70%.
                    After submitting, review the explanations and retry as often
                    as needed. Choice order changes on retry.
                  </p>
                  {exercise.isError ? (
                    <p role="alert">{exercise.error.message}</p>
                  ) : exercise.isLoading && record ? (
                    <p>Loading case exercise…</p>
                  ) : null}
                  {exercise.data?.map(item => (
                    <ExerciseItem
                      key={item.id}
                      item={item}
                      value={exerciseAnswers[item.id]}
                      disabled={
                        !record ||
                        pending ||
                        locked ||
                        !!moduleRecord?.exerciseAttempts.some(a => a.passed)
                      }
                      onChange={v =>
                        setExerciseAnswers(p => ({ ...p, [item.id]: v }))
                      }
                    />
                  ))}
                  <button
                    disabled={
                      !record ||
                      pending ||
                      locked ||
                      !!moduleRecord?.exerciseAttempts.some(a => a.passed) ||
                      !exercise.data?.every(
                        item =>
                          exerciseAnswers[item.id] !== undefined &&
                          (item.type !== "order" ||
                            (Array.isArray(exerciseAnswers[item.id]) &&
                              (exerciseAnswers[item.id] as number[]).length ===
                                item.choices?.length))
                      ) ||
                      (moduleRecord?.activeSeconds ?? 0) <
                        lesson.activities.reduce((s, a) => s + a.minutes, 0) *
                          60
                    }
                    onClick={() =>
                      record &&
                      exercise.data &&
                      save.mutate({
                        courseKey,
                        revision: record.revision,
                        action: {
                          type: "submitExercise",
                          moduleId: lesson.id,
                          attemptId: exerciseAttemptId,
                          answers: exercise.data.map(
                            item => exerciseAnswers[item.id]
                          ),
                        },
                      })
                    }
                  >
                    Submit case exercise
                  </button>
                  {moduleRecord?.exerciseAttempts.at(-1) && (
                    <p role="status">
                      Latest score:{" "}
                      {moduleRecord.exerciseAttempts.at(-1)!.score}/
                      {moduleRecord.exerciseAttempts.at(-1)!.total}
                      {moduleRecord.exerciseAttempts.at(-1)!.passed
                        ? " · passed"
                        : " · retry available"}
                    </p>
                  )}
                  {exerciseFeedback.map(f => (
                    <p key={f.id} role="status">
                      {f.correct ? "Correct" : "Review"}: {f.explanation}{" "}
                      Answer:{" "}
                      {Array.isArray(f.correctAnswer)
                        ? f.correctAnswer.join(" → ")
                        : f.correctAnswer}
                    </p>
                  ))}
                  <label className="ceu-field">
                    Optional private notes{" "}
                    <textarea
                      rows={5}
                      maxLength={20000}
                      value={draft}
                      disabled={!record || pending || locked}
                      onChange={e => {
                        setDraft(e.target.value);
                        setDirty(true);
                      }}
                      placeholder="Record your reasoning without confidential workplace information."
                    />
                  </label>
                  <button
                    disabled={!record || pending || locked || !dirty}
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
                    Save notes
                  </button>
                  {dirty && <span> Unsaved notes</span>}
                </section>
                <section>
                  <h2>Module checks</h2>
                  <p>Pass each check before the final assessment.</p>
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
              </article>
            ) : view === "assessment" ? (
              <article>
                <h2>Final assessment</h2>
                <p>
                  Pass mark: 80%. You may retry after reviewing the lessons and
                  feedback. The final unlocks after all module checks and case
                  exercises pass and the full active-time minimum is met.
                </p>
                {lastAttempt && (
                  <p className="ceu-status" role="status">
                    Last result: {lastAttempt.score}/{lastAttempt.total}
                    {lastAttempt.passed ? " · passed" : " · review and retry"}
                  </p>
                )}
                {!record ||
                checked !== course.modules.length ||
                passed !== course.modules.length ||
                !timeMet ? (
                  <p>
                    Pass all module checks and case exercises and record{" "}
                    {course.plannedMinutes} active minutes, including each
                    module's minimum, to unlock the final assessment.
                  </p>
                ) : exams.isError ? (
                  <p role="alert">{exams.error.message}</p>
                ) : exams.isLoading ? (
                  <p>Loading assessment…</p>
                ) : (
                  <>
                    {exams.data?.map(q => (
                      <Choices
                        key={q.id}
                        question={q}
                        value={answers[q.id]}
                        disabled={pending || locked || !!lastAttempt?.passed}
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
                        !exams.data?.every(q => answers[q.id] !== undefined)
                      }
                      onClick={() =>
                        exams.data &&
                        record &&
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
                      disabled={pending || locked || !examDirty}
                      onClick={() =>
                        exams.data &&
                        record &&
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
                  <p>Start the course to create a saved record.</p>
                ) : (
                  <>
                    <dl>
                      <dt>Course</dt>
                      <dd>{course.title}</dd>
                      <dt>Provider</dt>
                      <dd>Echelon Institute</dd>
                      <dt>Course edition</dt>
                      <dd>{record.courseVersion}</dd>
                      <dt>Learner</dt>
                      <dd>{record.learnerName}</dd>
                      <dt>Operator ID</dt>
                      <dd>{record.operatorNumber}</dd>
                      <dt>Started</dt>
                      <dd>{new Date(record.startedAt).toLocaleString()}</dd>
                      <dt>Case exercises</dt>
                      <dd>
                        {passed}/{course.modules.length} passed
                      </dd>
                      <dt>Active time</dt>
                      <dd>
                        {Math.floor(seconds / 60)}/{course.plannedMinutes}{" "}
                        minutes recorded
                      </dd>
                      <dt>Final</dt>
                      <dd>
                        {record.attempts.some(a => a.passed)
                          ? "Passed"
                          : "Not yet passed"}
                      </dd>
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
                        <p>
                          {record.completion.name} · Operator ID{" "}
                          {record.completion.operatorNumber}
                        </p>
                        <p>{record.completion.statement}</p>
                        <p>
                          Record {record.completion.id} ·{" "}
                          {new Date(record.completion.at).toLocaleDateString()}{" "}
                          · {record.completion.recordedMinutes} minutes · final{" "}
                          {record.completion.finalScore}/
                          {record.completion.finalTotal}
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
                        The non-credit record is issued automatically after all
                        exercises, checks, recorded time and the final are
                        complete.
                      </p>
                    )}
                    <h3>Optional course evaluation</h3>
                    {record.evaluation ? (
                      <p>Evaluation received. Thank you.</p>
                    ) : (
                      !locked && (
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
                          <button disabled={pending}>Send evaluation</button>
                        </form>
                      )
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
