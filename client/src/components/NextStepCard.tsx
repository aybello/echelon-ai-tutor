import { ArrowRight } from "lucide-react";
import { Link, useSearch } from "wouter";
import { trpc } from "@/lib/trpc";
import { isQuick10Eligible, nextStepHref } from "@/lib/nextStepHref";
import { readAccessToken } from "@/lib/readAccessToken";
import { getCourseByKey } from "@shared/courseRegistry";

/**
 * One suggested next step, shown on the results screen of a practice quiz, a Quick 10 or a mock exam.
 * The server picks the suggestion. This only shows it, with a button that starts that activity.
 * If the suggestion cannot be loaded, the card stays out of the way.
 */
export default function NextStepCard({ courseKey, className = "", forceDocumentNavigation = false }: { courseKey: string | undefined; className?: string; forceDocumentNavigation?: boolean }) {
  const search = useSearch();
  const course = courseKey ? getCourseByKey(courseKey) : undefined;
  const query = trpc.dashboard.nextStep.useQuery(
    { courseKey, timezoneOffsetMinutes: new Date().getTimezoneOffset(), accessToken: readAccessToken() },
    { enabled: isQuick10Eligible(courseKey), retry: false, staleTime: 0, refetchOnMount: "always", refetchOnWindowFocus: false },
  );

  if (!course || !isQuick10Eligible(courseKey)) return null;
  if (query.isLoading) {
    return <p role="status" className={`text-sm text-muted-foreground ${className}`}>Finding your next step…</p>;
  }
  if (query.isError || !query.data) return null;

  const { step } = query.data;
  // Completed quizzes initialize mode/module on mount, so query-only steps need a fresh document.
  const ActionLink = forceDocumentNavigation ? "a" : Link;
  return (
    <section aria-label="What next" className={`rounded-xl border border-border bg-card p-4 sm:p-5 ${className}`}>
      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">What next</p>
      <p className="mt-1 text-base font-semibold text-foreground">{step.message}</p>
      <ActionLink
        href={nextStepHref(step.action, course, search)}
        className="mt-3 inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
      >
        {step.buttonLabel} <ArrowRight size={16} aria-hidden="true" />
      </ActionLink>
    </section>
  );
}
