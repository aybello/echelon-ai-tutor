/**
 * useQuestionBank — fetches questions, bank metadata, and module overviews.
 *
 * Caching strategy (priority order):
 *   1. Seed questions — 25 bundled questions per bank, answers stripped.
 *      Shown INSTANTLY on first visit while the DB loads in the background.
 *   2. localStorage cache — full bank cached after first successful DB load.
 *      Served instantly on return visits (24hr TTL) for fast display.
 *      IMPORTANT: cache has correctIndex:-1 (stripped). The live DB fetch
 *      always runs in the background to restore real correctIndex values.
 *   3. DB fetch — tRPC call to the server. Lazy mode fetches a batch first,
 *      then the full bank. Full mode fetches everything upfront.
 *
 * Security:
 *   - Seed questions and localStorage cache NEVER contain correctIndex.
 *   - The server is the sole authority on correct answers and access control.
 *   - correctIndex is only present in the in-memory DBQuestion objects
 *     returned from the server during an active session.
 *   - Even when cache is present, the full DB fetch runs in the background
 *     so that correctIndex values are always live from the server.
 *
 * Supports two modes:
 *   - "full" (default): fetches ALL questions upfront. Use for mock exams and flashcards.
 *   - "lazy": fetches a small random batch (20 questions) instantly for fast first-question,
 *     then loads the full bank in the background. Use for quiz pages.
 *
 * When the database is temporarily unavailable (TiDB hibernation), the API
 * returns empty arrays instead of hanging. This hook detects that case and
 * exposes `dbUnavailable` so the UI can show a retry message.
 *
 * Usage:
 *   const { questions, modules, isLoading, dbUnavailable } = useQuestionBank("class1-water", "lazy");
 */
import { useEffect, useRef, useState } from "react";
import { trpc } from "@/lib/trpc";
import { getCached, setCached, type CachedBank } from "@/lib/questionCache";
import seedQuestions, { type SeedQuestion } from "@/lib/seedQuestions";

export interface DBQuestion {
  id: number;
  module: string;
  difficulty: string | null;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
  steps?: { l: string; c: string }[];
  tip?: string;
  isCalc: boolean;
  topic?: string;
}

export interface ModuleOverview {
  title: string;
  intro: string;
  keyPoints: { heading: string; body: string }[];
  tableHeadings?: string[];
  tableRows?: string[][];
  examTips: string[];
  formulaHint?: string;
}

/**
 * Convert a SeedQuestion (no correctIndex) to a DBQuestion shape.
 * correctIndex is set to -1 as a sentinel — the quiz engine must
 * validate answers server-side; it must NOT use correctIndex from
 * seed questions to reveal correct answers client-side.
 */
function seedToDBQuestion(q: SeedQuestion): DBQuestion {
  return {
    id: q.questionNum,
    module: q.module ?? "General",
    difficulty: q.difficulty,
    question: q.question,
    options: q.options,
    correctIndex: -1, // sentinel — server validates, client must not use this
    explanation: q.explanation ?? "",
    isCalc: q.isCalc === "yes",
    topic: q.topic ?? undefined,
  };
}

/**
 * Merge live correctIndex values from the server into cached questions.
 * Matches by question text (since IDs may differ between cache and live).
 * Returns a new array with correctIndex restored for all matched questions.
 */
function mergeCorrectIndex(
  cached: DBQuestion[],
  live: DBQuestion[],
): DBQuestion[] {
  // Build a map from question text → correctIndex for fast lookup
  const liveMap = new Map<string, number>();
  for (const q of live) {
    liveMap.set(q.question, q.correctIndex);
  }
  return cached.map((q) => {
    const liveIdx = liveMap.get(q.question);
    if (liveIdx !== undefined && liveIdx >= 0) {
      return { ...q, correctIndex: liveIdx };
    }
    return q;
  });
}

export function useQuestionBank(bankKey: string, mode: "full" | "lazy" = "full") {
  // ── Seed questions — instant fallback, no correctIndex ───────────────────
  const seedForBank = seedQuestions[bankKey] ?? [];
  const seedAsDBQuestions: DBQuestion[] = seedForBank.map(seedToDBQuestion);

  // ── Check localStorage cache first ───────────────────────────────────────
  const [cached] = useState<CachedBank | null>(() => getCached(bankKey));
  const wroteCache = useRef(false);

  // ── Fast batch (lazy mode only, skip if cache hit) ───────────────────────
  const batchQuery = trpc.quiz.getRandomQuestions.useQuery(
    { bankKey, limit: 20 },
    {
      enabled: mode === "lazy" && !cached,
      staleTime: 1000 * 60 * 5,
      retry: 4,
      retryDelay: 5000, // TiDB cold-start can take 10-15s; 4 retries × 5s = 20s window
    }
  );

  // ── Full bank — ALWAYS enabled (even on cache hit) to restore correctIndex ──
  // When cache is present: runs silently in background, result used to patch correctIndex.
  // When no cache: runs normally to populate questions.
  const fullQuery = trpc.quiz.getQuestions.useQuery(
    { bankKey },
    {
      staleTime: 1000 * 60 * 30,
      // Always fetch full bank — cache hit just means we show cached questions
      // instantly, but we still need live correctIndex values from the server.
      enabled: cached != null || mode === "full" || (mode === "lazy" && batchQuery.isSuccess),
      retry: 4,
      retryDelay: 5000,
    }
  );

  const metaQuery = trpc.quiz.getBankMeta.useQuery(
    { bankKey },
    {
      staleTime: 1000 * 60 * 30,
      enabled: !cached,
      retry: 4,
      retryDelay: 5000,
    }
  );

  const overviewsQuery = trpc.quiz.getModuleOverviews.useQuery(
    { bankKey },
    {
      staleTime: 1000 * 60 * 30,
      enabled: !cached,
      retry: 4,
      retryDelay: 5000,
    }
  );

  // ── Write to cache once full bank is loaded (strip correctIndex) ─────────
  useEffect(() => {
    if (wroteCache.current) return;
    if (!fullQuery.data || !metaQuery.data) return;
    const rawQuestions = fullQuery.data.questions ?? [];
    const modules = metaQuery.data.modules ?? [];
    if (rawQuestions.length === 0) return; // don't cache empty (DB down)
    wroteCache.current = true;

    // Strip correctIndex before writing to localStorage
    const safeQuestions = rawQuestions.map((q) => {
      const { correctIndex: _stripped, ...safe } = q as DBQuestion & { correctIndex: number };
      return { ...safe, correctIndex: -1 } as DBQuestion;
    });

    setCached(bankKey, {
      questions: safeQuestions,
      modules,
      moduleTargets: metaQuery.data.moduleTargets ?? null,
      formulaLinks: metaQuery.data.formulaLinks ?? null,
      totalQuestions: metaQuery.data.totalQuestions ?? rawQuestions.length,
      overviews: (overviewsQuery.data as Record<string, ModuleOverview> | null) ?? null,
    });
  }, [bankKey, fullQuery.data, metaQuery.data, overviewsQuery.data]);

  // ── Resolve data: cache (+ live correctIndex patch) → full → batch → seed ─
  let questions: DBQuestion[];
  let modules: string[];
  let moduleTargets: Record<string, number> | null;
  let formulaLinks: Record<string, string> | null;
  let totalQuestions: number;
  let overviews: Record<string, ModuleOverview> | null;
  let isLoading: boolean;

  if (cached) {
    // Start with cached questions for instant display
    const liveQuestions = fullQuery.data?.questions;
    if (liveQuestions && liveQuestions.length > 0) {
      // Live data arrived — merge correctIndex values from server into cached questions
      questions = mergeCorrectIndex(cached.questions, liveQuestions);
    } else {
      // Live data not yet arrived — serve cached questions (correctIndex:-1 sentinel)
      // Users can see questions but answers won't highlight until live data loads.
      questions = cached.questions;
    }
    modules = cached.modules;
    moduleTargets = cached.moduleTargets;
    formulaLinks = cached.formulaLinks;
    totalQuestions = cached.totalQuestions;
    overviews = cached.overviews;
    // isLoading: false so quiz renders immediately; fullQuery runs silently in bg
    isLoading = false;
  } else if (mode === "lazy") {
    if (fullQuery.data) {
      questions = fullQuery.data.questions ?? [];
    } else if (batchQuery.data?.questions?.length) {
      questions = batchQuery.data.questions;
    } else {
      // Seed fallback — shown instantly while DB loads
      questions = seedAsDBQuestions;
    }
    isLoading = batchQuery.isLoading || metaQuery.isLoading || overviewsQuery.isLoading;
    modules = metaQuery.data?.modules ?? [];
    moduleTargets = metaQuery.data?.moduleTargets ?? null;
    formulaLinks = metaQuery.data?.formulaLinks ?? null;
    totalQuestions = metaQuery.data?.totalQuestions ?? 0;
    overviews = (overviewsQuery.data as Record<string, ModuleOverview> | null) ?? null;
  } else {
    if (fullQuery.data?.questions?.length) {
      questions = fullQuery.data.questions;
    } else {
      // Seed fallback for full mode too (mock exams, flashcards)
      questions = seedAsDBQuestions;
    }
    isLoading = fullQuery.isLoading || metaQuery.isLoading || overviewsQuery.isLoading;
    modules = metaQuery.data?.modules ?? [];
    moduleTargets = metaQuery.data?.moduleTargets ?? null;
    formulaLinks = metaQuery.data?.formulaLinks ?? null;
    totalQuestions = metaQuery.data?.totalQuestions ?? 0;
    overviews = (overviewsQuery.data as Record<string, ModuleOverview> | null) ?? null;
  }

  // ── Detect DB unavailable state ──────────────────────────────────────────
  // dbUnavailable is true only when queries settled with no data AND no seed
  const queriesSettled = !isLoading;
  const noError = !fullQuery.error && !batchQuery.error && !metaQuery.error;
  const emptyResult = questions.length === 0 && modules.length === 0;
  const dbUnavailable = !cached && queriesSettled && noError && emptyResult && seedAsDBQuestions.length === 0;

  return {
    questions,
    modules,
    moduleTargets,
    formulaLinks,
    totalQuestions,
    overviews,
    isLoading,
    isFullyLoaded: cached != null || fullQuery.isSuccess,
    /** True when the DB appears down AND no seed questions available */
    dbUnavailable,
    /** True when showing seed questions (DB not yet loaded) */
    isShowingSeed: !cached && !fullQuery.isSuccess && !batchQuery.isSuccess && seedAsDBQuestions.length > 0,
    error:
      fullQuery.error || batchQuery.error || metaQuery.error || overviewsQuery.error || null,
  };
}
