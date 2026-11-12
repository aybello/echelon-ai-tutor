import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { flushSync } from "react-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { getQueryKey } from "@trpc/react-query";
import { Link, useRoute, useSearch } from "wouter";
import { InteractiveDrill } from "@/components/InteractiveDrill";
import { usePageMeta } from "@/hooks/usePageMeta";
import { adaptCourseQuestionsToInteractiveDrills } from "@/lib/courseInteractiveAdapter";
import { LOGOUT_EVENT_KEY } from "@/lib/logout";
import { trpc } from "@/lib/trpc";
import { getCourseByKey, type CourseEntry } from "@shared/courseRegistry";
import { funnelProvince } from "@shared/funnelNavigation";
import { watchIdentityChanges } from "@shared/identityChange";
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
  try {
    const token = localStorage.getItem("echelon_access_token");
    // Local input is not identity evidence; the server still verifies every request.
    if (!token || !token.trim() || token.length > 8192 || new TextEncoder().encode(token).length > 8192) return undefined;
    return token;
  } catch { return undefined; }
}

// These existing cross-tab changes are hints only, never identity or entitlement
// evidence. In particular a cookie-only sign-in may emit none of them.
function isIdentityStorageHint(event: StorageEvent): boolean {
  return event.key === null || event.key === LOGOUT_EVENT_KEY ||
    event.key === "echelon_access_token" || event.key === "manus-runtime-user-info" ||
    event.key === "echelon_trial_email" || event.key === "echelon_subscription_email";
}

// Validate the wire response before choosing a content source. This mirrors the
// server's public shape, including its per-example integrity constraints.
const contentText = z.string().trim().min(1).max(4000);
const contentId = z.string().regex(/^[a-zA-Z0-9][a-zA-Z0-9_-]{0,79}$/);
const contentBase = { id: contentId, prompt: contentText, instruction: contentText.optional() };
const contentPair = z.object({ id: contentId, left: contentText, right: contentText }).strict();
const contentOption = z.object({ id: contentId, label: contentText }).strict();
const contentExample = z.union([
  z.object({ ...contentBase, mode: z.literal("rapid-swipe"), correctAnswer: z.boolean(), explanation: contentText }).strict(),
  z.object({ ...contentBase, mode: z.literal("speed-match"), pairs: z.array(contentPair).min(3).max(20), explanation: contentText.optional() }).strict(),
  z.object({ ...contentBase, mode: z.literal("odd-one-out"), options: z.array(contentOption).min(2).max(20), correctOptionId: contentId, explanation: contentText }).strict(),
  z.object({ ...contentBase, mode: z.literal("cause-effect"), options: z.array(contentOption).min(2).max(20), correctOptionId: contentId, explanation: contentText }).strict(),
  z.object({ ...contentBase, mode: z.literal("tap-the-flaw"), options: z.array(contentOption).min(2).max(20), correctOptionId: contentId, explanation: contentText }).strict(),
  z.object({ ...contentBase, mode: z.literal("before-after"), correctAnswer: z.enum(["before", "after"]), explanation: contentText }).strict(),
  z.object({ ...contentBase, mode: z.literal("before-after"), options: z.array(contentText).length(2), correctAnswer: contentText, explanation: contentText }).strict(),
]);
// Match the server's conservative Unicode checks as well as the renderer's
// whitespace/case matching, which intentionally does not normalize Unicode.
const normalizedLabel = (value: string) => value.normalize("NFKC").trim().replace(/\s+/gu, " ").toLowerCase();
const rendererLabel = (value: string) => value.trim().replace(/\s+/g, " ").toLowerCase();
const labelsAreUnique = (labels: string[]) => new Set(labels.map(normalizedLabel)).size === labels.length;
const containsVisibleLabel = (visible: string, label: string) => {
  if (Array.from(label).length > 3) return visible.includes(label);
  const escaped = label.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`(?:^|[^\\p{L}\\p{M}\\p{N}_])${escaped}(?=$|[^\\p{L}\\p{M}\\p{N}_])`, "u").test(visible);
};
const answerLeak = (value: string) => /(?:→|⇒|⟶|➝|->|=>)|\b(?:(?:correct\s+)?(?:answer|choice|option)\s*(?:is\b|[:=])|answer\s+key\b|hint\s*[:=]|(?:choose|select|pick)\s+(?:the\s+)?(?:first|second|left|right)\s+(?:option|choice|answer)\b|(?:first|second|left|right)\s+(?:option|choice|answer)\s+is\s+correct\b|followed\s+by\b|precedes\b|\bthen\b|first\b[^.!?]*\bsecond\b)/iu.test(value);
const contentResponseSchema = z.discriminatedUnion("available", [
  z.object({ courseKey: z.string().min(1).max(64), available: z.literal(false), locked: z.boolean(), version: z.null(), examples: z.array(contentExample).length(0) }).strict(),
  z.object({ courseKey: z.string().min(1).max(64), available: z.literal(true), locked: z.boolean(), version: z.string().min(1).max(80), examples: z.array(contentExample).max(300) }).strict(),
]).superRefine((data, ctx) => {
  const ids = new Set<string>();
  for (const item of data.examples) {
    if (ids.has(item.id)) ctx.addIssue({ code: "custom", message: "Duplicate example" });
    ids.add(item.id);
    if (item.mode === "speed-match") {
      if (new Set(item.pairs.map(pair => pair.id)).size !== item.pairs.length ||
          !labelsAreUnique(item.pairs.map(pair => pair.left)) || !labelsAreUnique(item.pairs.map(pair => pair.right)))
        ctx.addIssue({ code: "custom", message: "Invalid pairs" });
    }
    if (item.mode === "before-after") {
      const visible = `${item.prompt} ${item.instruction ?? ""}`;
      if (answerLeak(visible)) ctx.addIssue({ code: "custom", message: "Before/after contains an answer hint" });
      if ("options" in item) {
        const labels = item.options.map(rendererLabel);
        const answer = rendererLabel(item.correctAnswer);
        if (!labelsAreUnique(item.options) || new Set(labels).size !== 2 || labels.filter(label => label === answer).length !== 1 ||
            item.options.some(label => containsVisibleLabel(rendererLabel(visible), rendererLabel(label)) || containsVisibleLabel(normalizedLabel(visible), normalizedLabel(label))))
          ctx.addIssue({ code: "custom", message: "Invalid before/after options" });
      }
    }
    if (item.mode === "odd-one-out" || item.mode === "cause-effect" || item.mode === "tap-the-flaw") {
      if (new Set(item.options.map(option => option.id)).size !== item.options.length ||
          !item.options.some(option => option.id === item.correctOptionId) || !labelsAreUnique(item.options.map(option => option.label)))
        ctx.addIssue({ code: "custom", message: "Invalid options" });
    }
  }
});

function LegacyCoursePractice({ course }: { course: CourseEntry }) {
  const [accessToken, setAccessToken] = useState<string | undefined>(readAccessToken);
  const [reauthorizing, setReauthorizing] = useState(true);
  const refreshGeneration = useRef(0);
  const queryClient = useQueryClient();
  // Request exactly the registry's bank, with the practice preview surface. No
  // paging, filters or client-selected aliases: the server decides entitlement.
  const { client } = trpc.useUtils();
  const input = { bankKey: course.questionBankKey, accessToken, previewSurface: "practice" as const };
  const queryKey = ["course-interactive-questions", course.questionBankKey, accessToken] as const;
  const query = useQuery({
    queryKey,
    queryFn: ({ signal }) => client.quiz.getInteractiveQuestions.mutate(input, { signal }),
    // Reconnect is handled below so it rereads the token before refetching.
    staleTime: 0, gcTime: 0, refetchOnMount: "always", refetchOnReconnect: false, retry: 2, retryDelay: 1500,
  });
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
  const refresh = useCallback(() => {
    const queryKey = ["course-interactive-questions", course.questionBankKey, accessToken] as const;
    const generation = ++refreshGeneration.current;
    setReauthorizing(true);
    const nextToken = readAccessToken();
    // A fetch started by another observer may predate the identity event.
    // Cancel it even when no data is cached (cancelRefetch alone won't).
    void queryClient.cancelQueries({ queryKey, exact: true });
    if (nextToken !== accessToken) {
      const nextKey = ["course-interactive-questions", course.questionBankKey, nextToken] as const;
      void queryClient.resetQueries({ queryKey: nextKey, exact: true });
      setAccessToken(nextToken);
    } else {
      void queryClient.refetchQueries({ queryKey, exact: true }, { cancelRefetch: true }).finally(() => {
        if (refreshGeneration.current === generation) setReauthorizing(false);
      });
    }
  }, [accessToken, course.questionBankKey, queryClient]);

  useEffect(() => {
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
      if (isIdentityStorageHint(event)) refresh();
    };
    const unwatchIdentity = watchIdentityChanges(() => {
      flushSync(() => setReauthorizing(true));
      refresh();
    });
    window.addEventListener("focus", refresh);
    window.addEventListener("pageshow", refresh);
    window.addEventListener("online", refresh);
    window.addEventListener("storage", onStorage);
    document.addEventListener("visibilitychange", onVisible);
    const timer = window.setInterval(onVisible, 5 * 60_000);
    refresh();
    return () => {
      refreshGeneration.current++;
      unsubscribe();
      unwatchIdentity();
      window.removeEventListener("focus", refresh);
      window.removeEventListener("pageshow", refresh);
      window.removeEventListener("online", refresh);
      window.removeEventListener("storage", onStorage);
      document.removeEventListener("visibilitychange", onVisible);
      window.clearInterval(timer);
    };
  }, [refresh, queryClient]);

  // The adapter receives only the server-authorized working set.
  const examples = useMemo(
    () => query.data && !query.error ? adaptCourseQuestionsToInteractiveDrills(query.data.questions).examples : [],
    [query.data, query.error],
  );

  // Never expose cached data during any reauthorization (including external
  // invalidation). Errors discard the mounted drill even if stale data remains.
  if (query.fetchStatus === "paused") return (
    <div className="course-interactive__status" role="alert">
      <p>Practice activities are unavailable while offline. Check your connection and try again.</p>
      <button type="button" onClick={refresh}>Try again</button>
    </div>
  );
  if (query.isError) return (
    <div className="course-interactive__status" role="alert">
      <p>We couldn’t load practice activities. Please try again.</p>
      <button type="button" onClick={refresh}>Try again</button>
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


function CoursePractice({ course }: { course: CourseEntry }) {
  const [accessToken, setAccessToken] = useState<string | undefined>(readAccessToken);
  const [reauthorizing, setReauthorizing] = useState(true);
  const refreshGeneration = useRef(0);
  const queryClient = useQueryClient();
  // A mutation sends the access token in a POST body, not in a GET URL. Use
  // a query observer for freshness/offline handling, and forward its abort
  // signal to the tRPC client so an obsolete response can never be displayed.
  const { client } = trpc.useUtils();
  const input = { courseKey: course.courseKey, accessToken };
  const queryKey = ["course-interactive-content", course.courseKey, accessToken] as const;
  const query = useQuery({
    queryKey,
    queryFn: ({ signal }) => client.interactive.getContent.mutate(input, { signal }),
    staleTime: 0, gcTime: 0, refetchOnMount: "always", refetchOnReconnect: false, retry: 2, retryDelay: 1500,
  });
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
  const refresh = useCallback(() => {
    const queryKey = ["course-interactive-content", course.courseKey, accessToken] as const;
    const generation = ++refreshGeneration.current;
    setReauthorizing(true);
    const nextToken = readAccessToken();
    // A fetch started by another observer may predate the identity event.
    // Cancel it even when no data is cached (cancelRefetch alone won't).
    void queryClient.cancelQueries({ queryKey, exact: true });
    if (nextToken !== accessToken) {
      const nextKey = ["course-interactive-content", course.courseKey, nextToken] as const;
      void queryClient.resetQueries({ queryKey: nextKey, exact: true });
      setAccessToken(nextToken);
    } else {
      void queryClient.refetchQueries({ queryKey, exact: true }, { cancelRefetch: true }).finally(() => {
        if (refreshGeneration.current === generation) setReauthorizing(false);
      });
    }
  }, [accessToken, course.courseKey, queryClient]);

  useEffect(() => {
    // Other components may refresh identity or entitlement without changing the
    // token. A fresh server response is a signal to reauthorize this working set,
    // not a substitute for the interactive access decision.
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
      if (isIdentityStorageHint(event)) refresh();
    };
    const unwatchIdentity = watchIdentityChanges(() => {
      flushSync(() => setReauthorizing(true));
      refresh();
    });
    window.addEventListener("focus", refresh);
    window.addEventListener("pageshow", refresh);
    window.addEventListener("online", refresh);
    window.addEventListener("storage", onStorage);
    document.addEventListener("visibilitychange", onVisible);
    const timer = window.setInterval(onVisible, 5 * 60_000);
    refresh();
    return () => {
      refreshGeneration.current++;
      unsubscribe();
      unwatchIdentity();
      window.removeEventListener("focus", refresh);
      window.removeEventListener("pageshow", refresh);
      window.removeEventListener("online", refresh);
      window.removeEventListener("storage", onStorage);
      document.removeEventListener("visibilitychange", onVisible);
      window.clearInterval(timer);
    };
  }, [refresh, queryClient]);

  // Never expose cached data during any reauthorization (including external
  // invalidation). Errors discard the mounted drill even if stale data remains.
  if (query.fetchStatus === "paused") return (
    <div className="course-interactive__status" role="alert">
      <p>Practice activities are unavailable while offline. Check your connection and try again.</p>
      <button type="button" onClick={refresh}>Try again</button>
    </div>
  );
  if (query.isError) return (
    <div className="course-interactive__status" role="alert">
      <p>We couldn’t load practice activities. Please try again.</p>
      <button type="button" onClick={refresh}>Try again</button>
    </div>
  );
  if (!query.data || readAccessToken() !== accessToken) return <p className="course-interactive__status" role="status">Loading practice activities…</p>;
  const revalidating = reauthorizing || query.fetchStatus !== "idle" || query.isPending;
  if (revalidating) return <p className="course-interactive__status" role="status">Loading practice activities…</p>;
  // Fail closed on unexpected shapes, wrong course, or incomplete activity data.
  // Only a complete, explicit unavailable response permits the legacy path.
  const parsed = contentResponseSchema.safeParse(query.data);
  if (!parsed.success || parsed.data.courseKey !== course.courseKey) return (
    <div className="course-interactive__status" role="alert">
      <p>We couldn’t load practice activities. Please try again.</p>
      <button type="button" onClick={refresh}>Try again</button>
    </div>
  );
  if (!parsed.data.available) return <LegacyCoursePractice key={revision} course={course} />;
  if (!parsed.data.examples.length) return <p className="course-interactive__status" role="status">No interactive activities are available for this course right now.</p>;

  return (
    <>
      {parsed.data.locked && <p className="course-interactive__preview">You’re practising with the available free preview. Course access determines which activities are available.</p>}
      <div style={{ whiteSpace: "pre-line" }}><InteractiveDrill key={revision} examples={parsed.data.examples} /></div>
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
