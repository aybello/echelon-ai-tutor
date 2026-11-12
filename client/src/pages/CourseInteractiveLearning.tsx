import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { getQueryKey } from "@trpc/react-query";
import { Link, useRoute, useSearch } from "wouter";
import { InteractiveDrill } from "@/components/InteractiveDrill";
import { usePageMeta } from "@/hooks/usePageMeta";
import { adaptCourseQuestionsToInteractiveDrills } from "@/lib/courseInteractiveAdapter";
import { trpc } from "@/lib/trpc";
import { getCourseByKey, type CourseEntry } from "@shared/courseRegistry";
import { funnelProvince } from "@shared/funnelNavigation";
import { withUSStudyContext } from "@shared/usStudyContext";
import "./InteractiveLearning.css";
import "./CourseInteractiveLearning.css";

/** Keep only supported study context; never carry arbitrary query parameters. */
function quizHref(course: CourseEntry, search: string): string {
  const params = new URLSearchParams(search);
  const province = funnelProvince(params.get("province"));
  const isDedicatedUS = course.examFamily === "us-wpi" || course.examFamily === "us-state";
  const isUS = isDedicatedUS || (course.examFamily === "western" && params.get("country") === "US");
  if (isUS) {
    // A dedicated US course remains a US course even on a direct visit.
    if (isDedicatedUS) params.set("country", "US");
    return withUSStudyContext(course.quizPath, course.courseKey, params.toString());
  }
  const validProvince = course.examFamily === "ontario"
    ? province === "ON" ? province : undefined
    : province && province !== "ON" ? province : undefined;
  return validProvince ? `${course.quizPath}?province=${encodeURIComponent(validProvince)}` : course.quizPath;
}

function readAccessToken(): string | undefined {
  try { return localStorage.getItem("echelon_access_token") ?? undefined; } catch { return undefined; }
}

function CoursePractice({ course }: { course: CourseEntry }) {
  const [accessToken, setAccessToken] = useState<string | undefined>(readAccessToken);
  const [reauthorizing, setReauthorizing] = useState(true);
  const refreshGeneration = useRef(0);
  const queryClient = useQueryClient();
  // Request exactly the registry's bank, with the practice preview surface. No
  // paging, filters or client-selected aliases: the server decides entitlement.
  const query = trpc.quiz.getQuestions.useQuery(
    { bankKey: course.questionBankKey, accessToken, previewSurface: "practice" },
    { staleTime: 0, gcTime: 0, refetchOnMount: "always", retry: 2, retryDelay: 1500 },
  );
  const input = { bankKey: course.questionBankKey, accessToken, previewSurface: "practice" as const };
  const queryKey = getQueryKey(trpc.quiz.getQuestions, input, "query");
  // A successful recheck always starts a new session, even if React batches
  // a very fast fetch and structurally shares the returned data.
  const revision = useSyncExternalStore(
    listener => queryClient.getQueryCache().subscribe(listener),
    () => queryClient.getQueryState(queryKey)?.dataUpdateCount ?? 0,
    () => 0,
  );
  // Cookie identities are not part of the tRPC key, and entitlements can change
  // without a token change. Reauthorize on return and periodically while visible.
  // Rechecking discards the mounted drill and its unsaved state.
  useEffect(() => {
    const input = { bankKey: course.questionBankKey, accessToken, previewSurface: "practice" as const };
    const queryKey = getQueryKey(trpc.quiz.getQuestions, input, "query");
    const refresh = () => {
      const generation = ++refreshGeneration.current;
      setReauthorizing(true);
      const nextToken = readAccessToken();
      // A fetch started by another observer may predate the identity event.
      // Cancel it even when no data is cached (cancelRefetch alone won't).
      void queryClient.cancelQueries({ queryKey, exact: true });
      if (nextToken !== accessToken) {
        const nextKey = getQueryKey(trpc.quiz.getQuestions, { ...input, accessToken: nextToken }, "query");
        void queryClient.resetQueries({ queryKey: nextKey, exact: true });
        setAccessToken(nextToken);
      } else {
        void queryClient.refetchQueries({ queryKey, exact: true }, { cancelRefetch: true }).finally(() => {
          if (refreshGeneration.current === generation) setReauthorizing(false);
        });
      }
    };
    // Other components may refresh identity or entitlement without changing the
    // token. A fresh server response is a signal to reauthorize this working set,
    // not a substitute for the getQuestions access decision.
    const observedPaths = [
      getQueryKey(trpc.auth.me, undefined, "query")[0],
      getQueryKey(trpc.dashboardAuth.me, undefined, "query")[0],
      getQueryKey(trpc.stripe.checkAccess, undefined, "query")[0],
      getQueryKey(trpc.access.auditMyEntitlements, undefined, "query")[0],
    ].map(path => JSON.stringify(path));
    const unsubscribe = queryClient.getQueryCache().subscribe(event => {
      if (event.type === "updated" && event.action.type === "success" &&
          observedPaths.includes(JSON.stringify(event.query.queryKey[0]))) refresh();
    });
    const onVisible = () => { if (document.visibilityState === "visible") refresh(); };
    const onStorage = (event: StorageEvent) => {
      if (event.key === "echelon_access_token" || event.key === null) refresh();
    };
    window.addEventListener("focus", refresh);
    window.addEventListener("pageshow", refresh);
    window.addEventListener("storage", onStorage);
    document.addEventListener("visibilitychange", onVisible);
    const timer = window.setInterval(onVisible, 5 * 60_000);
    refresh();
    return () => {
      refreshGeneration.current++;
      unsubscribe();
      window.removeEventListener("focus", refresh);
      window.removeEventListener("pageshow", refresh);
      window.removeEventListener("storage", onStorage);
      document.removeEventListener("visibilitychange", onVisible);
      window.clearInterval(timer);
    };
  }, [accessToken, course.questionBankKey, queryClient]);

  // The adapter receives only the server-authorized working set.
  const examples = useMemo(
    () => query.data && !query.error ? adaptCourseQuestionsToInteractiveDrills(query.data.questions).examples : [],
    [query.data, query.error],
  );

  // Never expose cached data during any reauthorization (including external
  // invalidation). Errors discard the mounted drill even if stale data remains.
  if (query.isError) return (
    <div className="course-interactive__status" role="alert">
      <p>We couldn’t load practice activities. Please try again.</p>
      <button type="button" onClick={() => void query.refetch()}>Try again</button>
    </div>
  );
  if (!query.data || readAccessToken() !== accessToken) return <p className="course-interactive__status" role="status">Loading practice activities…</p>;
  const revalidating = reauthorizing || query.fetchStatus !== "idle" || query.isPending;
  if (revalidating) return <p className="course-interactive__status" role="status">Loading practice activities…</p>;
  if (!examples.length) return <p className="course-interactive__status" role="status">No interactive activities are available for this course right now.</p>;

  return (
    <>
      {query.data.locked && <p className="course-interactive__preview">You’re practising with the available free preview. Course access determines which questions are available.</p>}
      <div style={{ whiteSpace: "pre-line" }}><InteractiveDrill key={revision} examples={examples} /></div>
    </>
  );
}

export default function CourseInteractiveLearning() {
  const [, params] = useRoute("/courses/:courseKey/interactive");
  const search = useSearch();
  // Unlike resolveCourseKey, this accepts canonical keys only, not aliases.
  const candidate = getCourseByKey(params?.courseKey ?? "");
  const course = candidate?.isActive ? candidate : undefined;

  usePageMeta({
    title: course ? `${course.displayName} Interactive Practice` : "Interactive Practice",
    description: "Practise with interactive activities from your course. Progress is not saved.",
    noindex: true,
  });

  return (
    <div className="interactive-learning">
      <nav className="interactive-learning__header" aria-label="Interactive practice navigation">
        <div className="interactive-learning__header-inner">
          <Link href="/" className="interactive-learning__brand"><img src="/echelon-logo.webp" alt="" width="32" height="32" /> Echelon Institute</Link>
          <Link href={course ? quizHref(course, search) : "/"} className="interactive-learning__back">{course ? "← Back to course practice" : "← Home"}</Link>
        </div>
      </nav>
      <main className="interactive-learning__content">
        <section className="interactive-learning__intro" aria-labelledby="course-interactive-title">
          <p className="interactive-learning__eyebrow">Interactive practice</p>
          <h1 id="course-interactive-title">{course ? course.displayName : "Course unavailable"}</h1>
          {course ? (
            <>
              <p className="interactive-learning__description">Practise with activities drawn from the questions available to you in this course.</p>
              <p className="interactive-learning__note">Your answers and progress stay on this page and are not saved to your account or quiz history. Switching activities or rechecking access resets your temporary session.</p>
            </>
          ) : <p className="interactive-learning__description">This course could not be found or is not currently active.</p>}
        </section>
        {course && (
          <section className="interactive-learning__practice" aria-label={`${course.displayName} activities`}>
            <div className="interactive-learning__section-heading"><div><p className="interactive-learning__eyebrow">Learn by doing</p><h2>Practice activities</h2></div></div>
            {course.courseKey === "electrician-309a" ? (
              <p className="course-interactive__status" role="status">Interactive practice is not available for the 309A beta yet. Please use the course practice page instead.</p>
            ) : <CoursePractice key={course.courseKey} course={course} />}
          </section>
        )}
      </main>
    </div>
  );
}
