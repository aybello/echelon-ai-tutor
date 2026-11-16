import { useState } from "react";
import { ArrowRight, Zap } from "lucide-react";
import { Link } from "wouter";
import { chooseQuick10Course, isQuick10Eligible, quick10Href } from "@/lib/nextStepHref";
import { trpc } from "@/lib/trpc";

/**
 * The one-tap Quick 10 button at the top of the student dashboard. It starts ten questions for the course the
 * learner studied most recently. A learner with more than one course can switch course first.
 */
export default function Quick10Button({ enabled, preferredCourseKey }: { enabled: boolean; preferredCourseKey?: string }) {
  const courses = trpc.quick10.courses.useQuery(undefined, { enabled, retry: false, refetchOnWindowFocus: false });
  const [chosen, setChosen] = useState<string | null>(null);

  const list = (courses.data?.courses ?? []).filter(course => isQuick10Eligible(course.courseKey));
  const courseKey = enabled ? chooseQuick10Course([chosen, preferredCourseKey, courses.data?.currentCourseKey], list.map(course => course.courseKey)) : null;
  if (!courseKey) return null;
  const label = list.find(c => c.courseKey === courseKey)?.shortName;

  return (
    <section aria-label="Quick 10" className="mb-6 rounded-2xl border border-border bg-card p-4 shadow-sm sm:p-5">
      <Link
        href={quick10Href(courseKey)}
        className="flex min-h-14 w-full items-center justify-between gap-3 rounded-xl bg-primary px-5 py-3 text-primary-foreground hover:opacity-95 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
      >
        <span className="flex items-center gap-3">
          <Zap size={22} aria-hidden="true" />
          <span>
            <span className="block text-lg font-extrabold leading-tight">Quick 10</span>
            <span className="block text-sm opacity-90">10 questions, about 5 minutes{label ? ` · ${label}` : ""}</span>
          </span>
        </span>
        <ArrowRight size={22} aria-hidden="true" />
      </Link>
      {list.length > 1 && (
        <label className="mt-3 flex items-center gap-2 text-sm">
          <span className="text-muted-foreground">Practise</span>
          <select
            className="min-h-10 min-w-0 flex-1 rounded-md border border-border bg-background px-2 text-sm"
            value={courseKey}
            onChange={event => setChosen(event.target.value)}
          >
            {list.map(c => <option key={c.courseKey} value={c.courseKey}>{c.displayName}</option>)}
          </select>
        </label>
      )}
    </section>
  );
}
