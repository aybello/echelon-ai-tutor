import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { useLearningActivitySession } from "@/hooks/useLearningActivitySession";

export function chooseStudyCourse(
  keys: readonly string[],
  preferred?: string,
  chosen?: string
): string {
  if (chosen && keys.includes(chosen)) return chosen;
  if (keys.length === 1) return keys[0];
  return preferred && keys.includes(preferred) ? preferred : "";
}
export default function GuideStudyRecording({
  preferredCourse,
  topic,
  unitsCompleted = 0,
}: {
  preferredCourse?: string;
  topic: string;
  unitsCompleted?: number;
}) {
  const access = trpc.access.auditMyEntitlements.useQuery(undefined, {
    staleTime: 0,
    refetchOnWindowFocus: true,
    retry: 2,
  });
  const [selection, setSelection] = useState<{
    email: string;
    key: string;
  } | null>(null);
  const courses = access.data?.accessibleCourses ?? [];
  const email = access.data?.email ?? "";
  const courseKey = chooseStudyCourse(
    courses.map(c => c.courseKey),
    preferredCourse,
    selection?.email === email ? selection.key : undefined
  );
  const recording = useLearningActivitySession({
    courseKey,
    identityKey: email,
    activityType: "process_guide",
    enabled: !!email && !!courseKey && !access.isError,
    topic,
    unitsCompleted,
  });
  if (access.isLoading)
    return (
      <p role="status" className="p-2 text-sm text-slate-600">
        Checking study-hours access…
      </p>
    );
  if (access.isError)
    return (
      <p role="status" className="p-2 text-sm text-amber-800">
        Study-hours access could not be checked.{" "}
        <button onClick={() => void access.refetch()} className="underline">
          Retry
        </button>
      </p>
    );
  if (!email || !courses.length)
    return (
      <p className="p-2 text-sm text-slate-600">
        Sign in with an active course pass to record study hours.
      </p>
    );
  const messages = {
    ready: "Study-time recording starts when you interact with this lesson.",
    recording: "Recording active study time.",
    saving: "Saving study time…",
    retrying:
      "Connection interrupted. Unsaved time is waiting to retry; keep this page open.",
    unavailable:
      "Study time is not recording. Check your course access and refresh.",
    interrupted:
      "Some time could not be recovered after the interruption. New activity can still be recorded.",
  };
  return (
    <div className="flex flex-wrap items-center gap-2 rounded border border-slate-200 bg-white p-3 text-sm">
      <label>
        Record study for{" "}
        <select
          aria-label="Study-hours course"
          value={courseKey}
          onChange={e => setSelection({ email, key: e.target.value })}
          className="ml-2 max-w-full rounded border p-2"
        >
          <option value="">Choose your course</option>
          {courses.map(c => (
            <option key={c.courseKey} value={c.courseKey}>
              {c.displayName}
            </option>
          ))}
        </select>
      </label>
      <span role="status">
        {courseKey
          ? messages[recording.status]
          : "Choose a course to start recording."}
      </span>
      {recording.status === "retrying" && (
        <button onClick={recording.retry} className="underline">
          Retry saving
        </button>
      )}
    </div>
  );
}
