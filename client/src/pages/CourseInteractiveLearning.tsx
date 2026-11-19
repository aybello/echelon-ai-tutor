import { createGameReporter, gameAnalyticsVisitor } from "@/lib/gameAnalytics";
import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { flushSync } from "react-dom";
import { z } from "zod";
import { onlineManager, useQuery, useQueryClient } from "@tanstack/react-query";
import { getQueryKey } from "@trpc/react-query";
import { Link, useRoute, useSearch } from "wouter";
import { DRILL_MODES, InteractiveDrill, type DrillMode, type DrillResult } from "@/components/InteractiveDrill";
import { useVerifiedPracticeSaveScope } from "@/components/PracticeSaveStatus";
import { useAssessmentActivity } from "@/hooks/useAssessmentActivity";
import { usePageMeta } from "@/hooks/usePageMeta";
import { LOGOUT_EVENT_KEY } from "@/lib/logout";
import { trpc } from "@/lib/trpc";
import { getCourseByKey, type CourseEntry } from "@shared/courseRegistry";
import { funnelProvince } from "@shared/funnelNavigation";
import { watchIdentityChanges } from "@shared/identityChange";
import {
  interactiveCatalogResponseSchema,
  interactiveProgressResponseSchema,
  interactiveSessionResponseSchema,
  type InteractiveDifficulty,
} from "@shared/interactiveSessions";
import { withUSStudyContext } from "@shared/usStudyContext";
import "./InteractiveLearning.css";
import "./CourseInteractiveLearning.css";

// Keep the existing strict content wire boundary, recognizing only this additive
// server-issued capability. It contains no browser-authored snapshot or identity.
const trackedSessionResponseSchema = interactiveSessionResponseSchema.extend({ activityTracking: z.union([
  z.object({ tracking: z.literal(true), sessionId: z.string().uuid(), capability: z.string().min(1).max(2048), nextSequence: z.number().int().min(2), expiresAt: z.string(), source: z.literal("observed") }).strict(),
  z.object({ tracking: z.literal(false), recorded: z.literal(false), source: z.literal("observed") }).strict(),
]).optional() });

/** Keep only supported study context; never carry arbitrary query parameters. */
function quizHref(course: CourseEntry, search: string): string {
  const params = new URLSearchParams(search);
  const province = funnelProvince(params.get("province"));
  const isDedicatedUS = course.examFamily === "us-wpi" || course.examFamily === "us-state";
  const isUS = isDedicatedUS || (course.examFamily === "western" && params.get("country") === "US");
  if (isUS) {
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
    // Local input is not identity evidence; the server verifies every POST.
    if (!token || !token.trim() || token.length > 8192 || new TextEncoder().encode(token).length > 8192) return undefined;
    return token;
  } catch { return undefined; }
}

function isIdentityStorageHint(event: StorageEvent): boolean {
  return event.key === null || event.key === LOGOUT_EVENT_KEY ||
    event.key === "echelon_access_token" || event.key === "manus-runtime-user-info" ||
    event.key === "echelon_trial_email" || event.key === "echelon_subscription_email";
}

class PracticeVersionMismatch extends Error {}

/** The learner's own calendar day, so a late-night session counts for the day they are in. */
function localDateString(): string {
  const now = new Date();
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}

/** Course sessions are temporary and never contribute to quiz history/readiness. */
function CoursePractice({ course }: { course: CourseEntry }) {
  const queryClient = useQueryClient();
  const actorScope = useVerifiedPracticeSaveScope(course.courseKey);
  const stableActor = useRef("anonymous");
  const { client } = trpc.useUtils();
  const transport = useRef(client);
  transport.current = client;
  const [authority, setAuthority] = useState(() => ({ accessToken: readAccessToken(), revision: 0 }));
  const [mode, setMode] = useState<DrillMode>("rapid-swipe");
  const [topicId, setTopicId] = useState("");
  const [difficulty, setDifficulty] = useState<InteractiveDifficulty | "">("");
  const [sessionSize, setSessionSize] = useState<10 | 20 | 30 | 50>(20);
  const [timerSeconds, setTimerSeconds] = useState<30 | 60 | 90 | null>(30);
  const [roundRevision, setRoundRevision] = useState(0);
  const [replay, setReplay] = useState(false);
  const [savedTick, setSavedTick] = useState(0);
  const pendingResults = useRef<DrillResult[]>([]);
  const identityGeneration = useRef(0);
  const saveIdentity = useRef<string | undefined>(undefined);
  const inFlightSaves = useRef(0);
  const failedSave = useRef(false);
  const [saveState, setSaveState] = useState<"ready" | "pending" | "saved" | "unsaved">("ready");
  const flushTimer = useRef<number | undefined>(undefined);
  const [settingsOpen, setSettingsOpen] = useState(() => typeof window !== "undefined" && window.matchMedia("(min-width: 700px)").matches);
  const sessionElement = useRef<HTMLDivElement>(null);
  const focusNextRound = useRef(false);
  const retriedMismatch = useRef(false);
  const prefix = useMemo(() => ["course-interactive-session-engine", course.courseKey] as const, [course.courseKey]);
  const observedPaths = useMemo(() => [
    getQueryKey(trpc.auth.me, undefined, "query")[0],
    getQueryKey(trpc.dashboardAuth.me, undefined, "query")[0],
    getQueryKey(trpc.stripe.checkAccess, undefined, "query")[0],
    getQueryKey(trpc.access.auditMyEntitlements, undefined, "query")[0],
  ].map(path => JSON.stringify(path)), []);
  // Do not display an old cookie identity while an auth/access observer is fetching.
  const authBusy = useSyncExternalStore(
    listener => queryClient.getQueryCache().subscribe(listener),
    () => queryClient.getQueryCache().getAll().some(query =>
      observedPaths.includes(JSON.stringify(query.queryKey[0])) && query.state.fetchStatus !== "idle"),
    () => false,
  );
  const online = useSyncExternalStore(listener => onlineManager.subscribe(listener), () => onlineManager.isOnline(), () => true);
  const tokenMatches = readAccessToken() === authority.accessToken;
  const catalogKey = [...prefix, "catalog", authority.accessToken, authority.revision] as const;
  const catalogQuery = useQuery({
    queryKey: catalogKey,
    queryFn: async ({ signal }) => {
      const data = interactiveCatalogResponseSchema.parse(await client.interactive.getCatalog.mutate({ courseKey: course.courseKey, accessToken: authority.accessToken }, { signal }));
      if (data.courseKey !== course.courseKey || data.available !== (data.version !== null) ||
          new Set(data.modes.map(item => item.mode)).size !== data.modes.length ||
          (!data.available && data.modes.length > 0) || data.modes.some(item =>
            new Set(item.topics.map(topic => topic.id)).size !== item.topics.length ||
            new Set(item.difficulties.map(level => level.id)).size !== item.difficulties.length)) throw new Error("Invalid practice catalog");
      return data;
    },
    enabled: tokenMatches && !authBusy,
    staleTime: 0, gcTime: 0, refetchOnMount: "always", refetchOnWindowFocus: false,
    refetchOnReconnect: false, retry: false,
  });
  const catalogReady = tokenMatches && !authBusy && online && !catalogQuery.isError && catalogQuery.fetchStatus === "idle" && !catalogQuery.isPending;
  const catalog = catalogReady ? catalogQuery.data : undefined;
  const catalogMode = catalog?.modes.find(item => item.mode === mode);
  const locked = !catalog || catalog.locked;
  const hasTopicFilters = Boolean(catalogMode?.topics.some(topic => topic.id !== "unclassified"));
  const hasDifficultyFilters = Boolean(catalogMode?.difficulties.some(level => level.id !== "unclassified"));
  const missingFilter = !locked && ((topicId !== "" && !catalogMode?.topics.some(topic => topic.id === topicId)) ||
    (difficulty !== "" && !catalogMode?.difficulties.some(level => level.id === difficulty)));
  // The API accepts 5..50; free access is a server-fixed single example, not a
  // client-selected size. Send its default size without any paid filters.
  const analyticsVisitorId = gameAnalyticsVisitor();
  const input = {
    ...(analyticsVisitorId ? { analyticsVisitorId } : {}),
    courseKey: course.courseKey, accessToken: authority.accessToken, mode,
    sessionSize: locked ? 20 : sessionSize,
    ...(!locked && topicId ? { topicId } : {}),
    ...(!locked && difficulty ? { difficulty } : {}),
    ...(!locked && replay ? { focus: "review" as const } : {}),
  };
  const sessionKey = [...prefix, "session", authority.accessToken, authority.revision, catalog?.version ?? null,
    mode, input.topicId ?? null, input.difficulty ?? null, input.sessionSize, locked ? 30 : timerSeconds, roundRevision, replay] as const;
  const sessionQuery = useQuery({
    queryKey: sessionKey,
    queryFn: async ({ signal }) => {
      const raw: unknown = await client.interactive.startSession.mutate(input, { signal });
      // Only recognize a valid wire version here. A different release may have
      // a shape that this client cannot parse; never use that payload as data.
      if (raw !== null && typeof raw === "object" && !Array.isArray(raw) && Object.hasOwn(raw, "version")) {
        const version = interactiveSessionResponseSchema.shape.version.safeParse((raw as { version: unknown }).version);
        if (version.success && version.data !== catalog?.version) throw new PracticeVersionMismatch("Practice release changed");
      }
      const data = trackedSessionResponseSchema.parse(raw);
      if (data.courseKey !== course.courseKey || data.mode !== mode ||
          data.available !== catalog?.available || data.locked !== catalog?.locked ||
          data.filters.topicId !== (input.topicId ?? null) || data.filters.difficulty !== (input.difficulty ?? null) ||
          data.filters.requestedSize !== input.sessionSize || data.examples.some(example => example.mode !== mode) ||
          new Set(data.examples.map(example => example.id)).size !== data.examples.length ||
          data.examples.length > (data.locked ? 1 : input.sessionSize) || data.examples.length > data.totalAvailableCount) throw new Error("Invalid practice session");
      return data;
    },
    enabled: Boolean(catalog?.available && catalogMode && catalogMode.totalCount > 0 && !missingFilter),
    staleTime: 0, gcTime: 0, refetchOnMount: "always", refetchOnWindowFocus: false,
    refetchOnReconnect: false, retry: false,
  });

  // Saved results. Only signed-in learners are stored; for everyone else this stays empty and the page is unchanged.
  const progressQuery = useQuery({
    queryKey: [...prefix, "progress", authority.revision, savedTick] as const,
    queryFn: async ({ signal }) => interactiveProgressResponseSchema.parse(
      await client.interactive.getProgress.mutate({ courseKey: course.courseKey, localDate: localDateString() }, { signal })),
    enabled: tokenMatches && !authBusy && online,
    staleTime: 0, gcTime: 0, refetchOnMount: "always", refetchOnWindowFocus: false, refetchOnReconnect: false, retry: false,
  });
  const progress = tokenMatches && !authBusy && online && !progressQuery.isError && progressQuery.fetchStatus === "idle" &&
    progressQuery.data?.stored && progressQuery.data.identityToken ? progressQuery.data : undefined;
  saveIdentity.current = progress?.identityToken;
  const flushResults = useCallback(() => {
    window.clearTimeout(flushTimer.current);
    flushTimer.current = undefined;
    const results = pendingResults.current.splice(0);
    if (!results.length) return;
    const generation = identityGeneration.current;
    const expectedIdentity = saveIdentity.current;
    if (!expectedIdentity) { failedSave.current = true; setSaveState("unsaved"); return; }
    inFlightSaves.current++;
    setSaveState("pending");
    // Do not retry ambiguous transport failures: the server may already have committed.
    // Instead keep the UI explicitly unsaved for this identity generation.
    void transport.current.interactive.recordResults.mutate({
      courseKey: course.courseKey, expectedIdentity,
      results: results.map(({ exampleId, mode: resultMode, correct }) => ({ itemId: exampleId, mode: resultMode, correct })),
      localDate: localDateString(),
    }).then(ack => {
      if (generation !== identityGeneration.current) return;
      if (!ack.stored || ack.saved !== results.length || ack.ignored !== 0) failedSave.current = true;
      else setSavedTick(value => value + 1);
    }).catch(() => {
      if (generation === identityGeneration.current) failedSave.current = true;
    }).finally(() => {
      if (generation !== identityGeneration.current) return;
      inFlightSaves.current--;
      setSaveState(failedSave.current ? "unsaved" : inFlightSaves.current || pendingResults.current.length ? "pending" : "saved");
    });
  }, [course.courseKey]);
  const recordResult = useCallback((result: DrillResult) => {
    if (!saveIdentity.current) { setSaveState("unsaved"); return; }
    pendingResults.current.push(result);
    setSaveState("pending");
    if (pendingResults.current.length >= 5) flushResults();
    else if (flushTimer.current === undefined) flushTimer.current = window.setTimeout(flushResults, 4000);
  }, [flushResults]);
  useEffect(() => {
    const onHide = () => { if (document.visibilityState === "hidden") flushResults(); };
    document.addEventListener("visibilitychange", onHide);
    window.addEventListener("pagehide", flushResults);
    return () => {
      document.removeEventListener("visibilitychange", onHide);
      window.removeEventListener("pagehide", flushResults);
      window.clearTimeout(flushTimer.current);
      pendingResults.current = [];
      identityGeneration.current++;
    };
  }, [flushResults]);
  const saveNote = !progress || saveState === "unsaved" ? "Progress not saved" :
    saveState === "pending" ? "Saving progress…" : saveState === "saved" ? "Progress saved" : "Ready to save results";

  const refreshQueries = useCallback(() => {
    // Gate synchronously before cancellation or a fast/late transport completion.
    // Both query identities change even when a cookie sign-in keeps the same token.
    focusNextRound.current = false;
    // Discard the old identity's queue BEFORE any new identity can render or write.
    identityGeneration.current++;
    saveIdentity.current = undefined;
    window.clearTimeout(flushTimer.current);
    flushTimer.current = undefined;
    pendingResults.current = [];
    inFlightSaves.current = 0;
    failedSave.current = false;
    setSaveState("ready");
    const obsolete = new Set(queryClient.getQueryCache().findAll({ queryKey: prefix }));
    flushSync(() => setAuthority(previous => ({ accessToken: readAccessToken(), revision: previous.revision + 1 })));
    void queryClient.cancelQueries({ queryKey: prefix, predicate: query => obsolete.has(query) });
    queryClient.removeQueries({ queryKey: prefix, predicate: query => query.getObserversCount() === 0 });
  }, [prefix, queryClient]);

  const refresh = useCallback(() => {
    retriedMismatch.current = false;
    refreshQueries();
  }, [refreshQueries]);

  useEffect(() => {
    if (catalogReady && sessionQuery.error instanceof PracticeVersionMismatch && !retriedMismatch.current) {
      retriedMismatch.current = true;
      refreshQueries();
    }
  }, [catalogReady, refreshQueries, sessionQuery.error]);

  useEffect(() => {
    const unsubscribe = queryClient.getQueryCache().subscribe(event => {
      if (event.type === "updated" && observedPaths.includes(JSON.stringify(event.query.queryKey[0])) &&
          (event.action.type === "fetch" || event.action.type === "success" || event.action.type === "error" || event.action.type === "invalidate")) refresh();
    });
    const onVisible = () => { if (document.visibilityState === "visible") refresh(); };
    const onStorage = (event: StorageEvent) => { if (isIdentityStorageHint(event)) refresh(); };
    const unwatchIdentity = watchIdentityChanges(refresh);
    window.addEventListener("focus", refresh);
    window.addEventListener("pageshow", refresh);
    window.addEventListener("online", refresh);
    window.addEventListener("offline", refresh);
    window.addEventListener("storage", onStorage);
    document.addEventListener("visibilitychange", onVisible);
    const timer = window.setInterval(onVisible, 5 * 60_000);
    return () => {
      unsubscribe();
      unwatchIdentity();
      window.removeEventListener("focus", refresh);
      window.removeEventListener("pageshow", refresh);
      window.removeEventListener("online", refresh);
      window.removeEventListener("offline", refresh);
      window.removeEventListener("storage", onStorage);
      document.removeEventListener("visibilitychange", onVisible);
      window.clearInterval(timer);
      void queryClient.cancelQueries({ queryKey: prefix });
    };
  }, [refresh, queryClient, observedPaths, prefix]);

  const changeSession = (change: () => void) => {
    retriedMismatch.current = false;
    void queryClient.cancelQueries({ queryKey: [...prefix, "session"] });
    flushSync(() => { change(); setRoundRevision(previous => previous + 1); });
  };
  const newRound = () => { focusNextRound.current = true; changeSession(() => {}); };
  const session = catalogReady && !missingFilter && Boolean(catalog?.available && catalogMode?.totalCount) &&
    !sessionQuery.isError && sessionQuery.fetchStatus === "idle" && !sessionQuery.isPending
    ? sessionQuery.data : undefined;
  // A fetch is not a sign-out. Preserve the verified namespace while authority
  // refreshes; only a settled identity change retires that actor's outbox.
  // Anonymous observations retain their original server-bound capability and
  // are never moved into a subsequently verified learner's namespace.
  const identitySettled = [getQueryKey(trpc.auth.me, undefined, "query"), getQueryKey(trpc.dashboardAuth.me, undefined, "query")]
    .every(key => {
      const state = queryClient.getQueryState(key);
      return state?.status === "success" && state.fetchStatus === "idle";
    });
  if (identitySettled) stableActor.current = actorScope ? JSON.stringify(actorScope) : "anonymous";
  const activity = useAssessmentActivity(identitySettled && session?.activityTracking?.tracking ? session.activityTracking : null,
    stableActor.current);
  useEffect(() => {
    if (!session || !focusNextRound.current) return;
    const heading = sessionElement.current?.querySelector<HTMLElement>(".interactive-drill__content h2");
    if (heading) { focusNextRound.current = false; heading.focus(); }
  }, [session, roundRevision]);
  const reportPlay = useMemo(() => createGameReporter(async event => {
    const visitorId = gameAnalyticsVisitor();
    if (!visitorId || visitorId !== analyticsVisitorId || !session?.analyticsCapability) return;
    await transport.current.interactive.trackActivity.mutate({ capability: session.analyticsCapability, visitorId, ...event });
  }), [analyticsVisitorId, session]);
  let status: React.ReactNode;
  if (!online || catalogQuery.fetchStatus === "paused" || sessionQuery.fetchStatus === "paused") {
    status = <div className="course-interactive__status" role="alert"><p>Practice activities are unavailable while offline. Check your connection and try again.</p><button type="button" onClick={refresh}>Try again</button></div>;
  } else if (catalogQuery.isError || (catalogReady && !missingFilter && sessionQuery.isError)) {
    status = <div className="course-interactive__status" role="alert"><p>We couldn’t load practice activities. Please try again.</p><button type="button" onClick={refresh}>Try again</button></div>;
  } else if (!catalogReady || !catalog) {
    status = <p className="course-interactive__status" role="status">Loading practice activities…</p>;
  } else if (!catalog.available) {
    status = <p className="course-interactive__status" role="status">No interactive activities are available for this course right now.</p>;
  } else if (missingFilter) {
    status = <p className="course-interactive__status" role="status">The selected topic or difficulty is no longer published for this mode. Choose an available option or All.</p>;
  } else if (!catalogMode || catalogMode.totalCount === 0) {
    status = <p className="course-interactive__status" role="status">No published activities are available for this mode yet. Choose another mode.</p>;
  } else if (!session) {
    status = <p className="course-interactive__status" role="status">Loading your practice round…</p>;
  } else if (!session.examples.length) {
    status = <p className="course-interactive__status" role="status">No activities match this topic and difficulty. Change your filters to start a round.</p>;
  } else {
    const drillKey = JSON.stringify([course.courseKey, authority.revision, session.version, session.mode, session.filters,
      locked ? 30 : timerSeconds, roundRevision, session.sessionId, sessionQuery.dataUpdatedAt]);
    status = <div style={{ whiteSpace: "pre-line" }}><InteractiveDrill key={drillKey} examples={session.examples} selectedMode={mode} hideModeNavigation timerSeconds={locked ? 30 : timerSeconds} onNewRound={locked ? undefined : newRound} onRenewDelivery={newRound} onResult={progress ? recordResult : undefined} onPlay={reportPlay} onActivity={activity.observe} saveNote={progress ? saveNote : undefined} /></div>;
  }

  return (
    <div className="course-interactive__workspace interactive-drill">
      <div className="course-interactive__controls">
        <nav className="interactive-drill__nav" aria-label="Choose a practice mode">
          {DRILL_MODES.map(item => {
            const count = catalog?.modes.find(entry => entry.mode === item.id)?.totalCount;
            return <button type="button" key={item.id} className={mode === item.id ? "is-active" : ""} aria-current={mode === item.id ? "true" : undefined}
              onClick={() => changeSession(() => { setMode(item.id); setTopicId(""); setDifficulty(""); setReplay(false); })}>
              <span>{item.label}</span><small>{item.description}</small>
              <span className="course-interactive__count">{catalog ? `${count ?? 0} published` : "Published count unavailable"}</span>
            </button>;
          })}
        </nav>
        <button type="button" className="interactive-drill__primary course-interactive__new-round" disabled={!catalog?.available || !online || authBusy || !catalogMode?.totalCount || Boolean(missingFilter) || sessionQuery.fetchStatus !== "idle"} onClick={newRound}>{catalog?.locked ? "Replay preview" : "New round"}</button>
      </div>
      <div className="course-interactive__session" ref={sessionElement}>
        <div className="course-interactive__session-heading"><span>{DRILL_MODES.find(item => item.id === mode)?.label}</span><small>{catalog?.locked ? "Free preview" : "Free practice"}</small></div>
        {progress && <div className="course-interactive__progress" role="status" aria-label="Your saved progress">
          <div className="course-interactive__goal">
            <span>Today {Math.min(progress.today.answered, progress.today.goal)} of {progress.today.goal}</span>
            <span className="course-interactive__goal-bar" aria-hidden="true"><span style={{ width: `${Math.min(100, (progress.today.answered / progress.today.goal) * 100)}%` }} /></span>
          </div>
          <span>{progress.streakDays} day streak</span>
          <span>{progress.dueCount} due for review</span>
          {replay
            ? <button type="button" className="interactive-drill__secondary" onClick={() => changeSession(() => setReplay(false))}>Back to mixed practice</button>
            : progress.dueCount > 0 && <button type="button" className="interactive-drill__secondary" onClick={() => changeSession(() => setReplay(true))}>Review missed</button>}
        </div>}
        {catalog?.locked && <p className="course-interactive__preview">You’re practising with the available free preview. Course access determines which activities are available.</p>}
        {session && <p className="course-interactive__inventory">{session.examples.length} in this round · {session.totalAvailableCount} available with these filters · {replay && progress ? "replaying items due for review · " : ""}{saveNote}</p>}
        {session?.activityTracking?.tracking && <p className="course-interactive__inventory" role="status">Optional learning activity records choices, retries and explanations shown, not verified scores or reading time. Anonymous play remains unnamed.</p>}
        {activity.saveError && <p className="course-interactive__inventory" role="alert">Learning activity could not be confirmed saved. Your game score is unchanged. <button type="button" className="interactive-drill__secondary" onClick={() => void activity.retry()}>Retry activity save</button></p>}
        {status}
        <details className="course-interactive__settings-panel" open={settingsOpen} onToggle={event => setSettingsOpen(event.currentTarget.open)}>
          <summary>Round settings <small>{catalog?.locked ? "1 preview example" : `Up to ${sessionSize} activities`}</small></summary>
        <fieldset className="course-interactive__settings" disabled={locked || !catalog?.available} aria-describedby="course-session-settings-note">
          <legend>Round settings</legend>
          <label>Topic<select aria-label="Topic" disabled={!hasTopicFilters && !topicId} value={locked ? "" : topicId} onChange={event => changeSession(() => setTopicId(event.target.value))}>
            <option value="">All topics</option>
            {!locked && topicId && !catalogMode?.topics.some(topic => topic.id === topicId) && <option value={topicId} disabled>Selected topic unavailable</option>}
            {catalogMode?.topics.map(topic => <option key={topic.id} value={topic.id}>{topic.id === "unclassified" ? "Unclassified (not tagged)" : topic.label} ({topic.count})</option>)}
          </select>{!locked && !hasTopicFilters && <small>Topic filters not available yet</small>}</label>
          <label>Difficulty<select aria-label="Difficulty" disabled={!hasDifficultyFilters && !difficulty} value={locked ? "" : difficulty} onChange={event => changeSession(() => setDifficulty(event.target.value as InteractiveDifficulty | ""))}>
            <option value="">All difficulties</option>
            {!locked && difficulty && !catalogMode?.difficulties.some(level => level.id === difficulty) && <option value={difficulty} disabled>Selected difficulty unavailable</option>}
            {catalogMode?.difficulties.map(level => <option key={level.id} value={level.id}>{level.id === "unclassified" ? "Unclassified (not rated)" : `${level.id[0].toUpperCase()}${level.id.slice(1)}`} ({level.count})</option>)}
          </select>{!locked && !hasDifficultyFilters && <small>Difficulty filters not available yet</small>}</label>
          <label>Session size<select aria-label="Session size" value={locked ? 1 : sessionSize} onChange={event => changeSession(() => setSessionSize(Number(event.target.value) as 10 | 20 | 30 | 50))}>
            {locked ? <option value={1}>1 preview example</option> : [10, 20, 30, 50].map(size => <option key={size} value={size}>Up to {size} activities</option>)}
          </select></label>
          <label>Swipe timer<select aria-label="Swipe timer" disabled={mode !== "rapid-swipe"} value={locked ? 30 : timerSeconds ?? "off"} onChange={event => changeSession(() => setTimerSeconds(event.target.value === "off" ? null : Number(event.target.value) as 30 | 60 | 90))}>
            <option value="off">Off</option>{[30, 60, 90].map(seconds => <option key={seconds} value={seconds}>{seconds} seconds</option>)}
          </select>{!locked && mode !== "rapid-swipe" && <small>Rapid Swipe only</small>}</label>
        </fieldset>
        <p id="course-session-settings-note" className="course-interactive__settings-note">{catalog?.locked ? "Free preview: one fixed example per mode. Round settings require course access." : "Available settings apply immediately. Rounds use only published activities, so smaller banks may contain fewer than your selected size."}{" "}{saveNote}{saveState === "unsaved" ? ". Some answers could not be confirmed saved; they will not be retried automatically." : "."}</p>
        </details>
      </div>
    </div>
  );
}

export default function CourseInteractiveLearning() {
  const [, params] = useRoute("/courses/:courseKey/interactive");
  const search = useSearch();
  const candidate = getCourseByKey(params?.courseKey ?? "");
  const course = candidate?.isActive ? candidate : undefined;
  usePageMeta({
    title: course ? `${course.displayName} Interactive Practice` : "Interactive Practice",
    description: "Practise with interactive activities from your course. Signed-in learners can save results and review missed items.",
    noindex: true,
  });
  return (
    <div className="interactive-learning course-interactive">
      <nav className="interactive-learning__header" aria-label="Interactive practice navigation">
        <div className="interactive-learning__header-inner">
          <Link href="/" className="interactive-learning__brand"><img src="/echelon-logo.webp" alt="" width="32" height="32" /><span>Echelon Institute</span></Link>
          <Link href={course ? quizHref(course, search) : "/"} className="interactive-learning__back">{course ? "← Back to course practice" : "← Home"}</Link>
        </div>
      </nav>
      <main className="interactive-learning__content">
        <section className="interactive-learning__intro" aria-labelledby="course-interactive-title">
          <p className="interactive-learning__eyebrow">Interactive practice</p>
          <h1 id="course-interactive-title">{course ? course.displayName : "Course unavailable"}</h1>
          {course ? <details className="course-interactive__details">
            <summary>Practice details</summary>
            <p className="interactive-learning__description">All published game exercises are free to practise. No account or course purchase is required for these games.</p>
            <p className="interactive-learning__note">When optional learning activity recording is enabled, choices, retries and explanations shown may be recorded separately from saved game progress; anonymous play remains unnamed. When saved progress is available, signed-in learners can save results so due items can come back for review. The status below confirms whether game results were saved, and activity-save failures are shown separately. Game results and observed activity do not count toward quiz history or your readiness score. Switching activities or rechecking access resets your current round. Returning to this tab rechecks access and resets your round; this is not a saved-run resume.</p>
            <p>Exam practice, not operating instructions or regulatory advice.</p>
          </details> : <p className="interactive-learning__description">This course could not be found or is not currently active.</p>}
        </section>
        {course && <section className="interactive-learning__practice" aria-label={`${course.displayName} activities`}>
          {course.courseKey === "electrician-309a" ? <p className="course-interactive__status" role="status">Interactive practice is not available for the 309A beta yet. Please use the course practice page instead.</p> : <CoursePractice key={course.courseKey} course={course} />}
        </section>}
      </main>
    </div>
  );
}
