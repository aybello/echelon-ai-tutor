/**
 * useQuestionBank — fetches questions, bank metadata, and module overviews.
 *
 * Caching strategy (priority order):
 *   1. Seed questions — 25 bundled questions per bank, correctIndex included.
 *      Shown INSTANTLY on first visit while the DB loads in the background.
 *      Questions score correctly from the first millisecond.
 *   2. localStorage cache — bounded study sample cached after a successful DB load.
 *      Served instantly on return visits (2-hour TTL) for fast display.
 *      correctIndex is stored in the cache so returning users score correctly.
 *   3. DB fetch — tRPC call to the server. Lazy mode fetches one session-sized
 *      batch. Full mode fetches a bounded, module-balanced working set.
 *
 * Supports two modes:
 *   - "full" (default): fetches a bounded working set. Use for mock exams and flashcards.
 *   - "lazy": fetches a random 50-question batch. Use for quiz pages.
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
import { getCached, setCached, invalidate, type CachedBank } from "@/lib/questionCache";
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
  diagramId?: string | null;
  diagramAlt?: string | null;
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
 * Convert a SeedQuestion to a DBQuestion shape.
 * correctIndex is included in seed questions so they score correctly
 * before the DB loads.
 */
function seedToDBQuestion(q: SeedQuestion): DBQuestion {
  return {
    id: q.questionNum,
    module: q.module ?? "General",
    difficulty: q.difficulty,
    question: q.question,
    options: q.options,
    correctIndex: q.correctIndex,
    explanation: q.explanation ?? "",
    isCalc: q.isCalc === "yes",
    topic: q.topic ?? undefined,
  };
}

export type QuestionBankPreviewSurface = "practice" | "flashcards" | "mock";

export function useQuestionBank(
  bankKey: string,
  mode: "full" | "lazy" = "full",
  previewSurface?: QuestionBankPreviewSurface,
) {
  // ── Seed questions — instant fallback, correctIndex included ──────────────
  const seedForBank = seedQuestions[bankKey] ?? [];
  const seedAsDBQuestions: DBQuestion[] = seedForBank.map(seedToDBQuestion);

  // ── Read signed access token from localStorage for server-side access check ──
  // NOTE: We no longer send client-supplied email to the server as an access proof.
  // Only verified sessions (OAuth, OTP) and signed access tokens are accepted.
  const [storedAccessToken] = useState<string | undefined>(() => {
    try { return localStorage.getItem("echelon_access_token") ?? undefined; } catch { return undefined; }
  });

  // ── Check localStorage cache first ───────────────────────────────────────
  // A free OIT practice request (15), flashcard request (50), and mock request
  // (30) must never reuse one another's cached response.
  // v2 retires the earlier Water OIT preview cache, which could contain a
  // wastewater-module question even after the server-side preview was fixed.
  const previewCacheVersion = bankKey === "oit" && previewSurface ? "::v2" : "";
  const cacheKey = `${previewSurface ? `${bankKey}::${previewSurface}` : bankKey}${previewCacheVersion}`;
  // Practice sessions deliberately stay out of persistent browser storage.
  // A fresh bounded batch is cheap and avoids accumulating paid content locally.
  const [cached] = useState<CachedBank | null>(() => mode === "full" ? getCached(cacheKey) : null);
  const wroteCache = useRef(false);

  // ── Fast batch (lazy mode only, skip if cache hit) ───────────────────────
  const batchQuery = trpc.quiz.getRandomQuestions.useQuery(
    { bankKey, limit: 50, accessToken: storedAccessToken },
    {
      enabled: mode === "lazy" && !cached,
      staleTime: 1000 * 60 * 5,
      retry: 4,
      retryDelay: 5000, // TiDB cold-start can take 10-15s; 4 retries × 5s = 20s window
    }
  );

  // ── Bounded study set (mock exams and flashcards) ────────────────────────
  // When cache is present this refreshes silently in the background.
  const fullQuery = trpc.quiz.getQuestions.useQuery(
    { bankKey, accessToken: storedAccessToken, previewSurface },
    {
      staleTime: 1000 * 60 * 30,
      enabled: mode === "full",
      retry: 4,
      retryDelay: 5000,
    }
  );

  // Issue L: metaQuery always runs (even on cache hit) so we can compare contentVersion
  // BEFORE rendering. If the server version is higher, we invalidate immediately.
  const metaQuery = trpc.quiz.getBankMeta.useQuery(
    { bankKey },
    {
      staleTime: 1000 * 60 * 30,
      enabled: true, // always fetch — needed for version check
      retry: 4,
      retryDelay: 5000,
    }
  );

  const overviewsQuery = trpc.quiz.getModuleOverviews.useQuery(
    { bankKey },
    {
      staleTime: 1000 * 60 * 30,
      // Notes are maintained independently from questions. Always refresh them:
      // an existing question-cache entry may predate when notes were published.
      enabled: true,
      retry: 4,
      retryDelay: 5000,
    }
  );

  // ── Issue L: invalidate cache when server contentVersion is newer ────────────────────────
  // This runs BEFORE questions are rendered, so the user never sees stale content.
  useEffect(() => {
    if (!cached || !metaQuery.data) return;
    const serverVersion = metaQuery.data.contentVersion ?? 1;
    const cachedVersion = cached.contentVersion ?? 0;
    if (serverVersion > cachedVersion) {
      // Admin edited a question — bust the cache immediately
      invalidate(cacheKey);
    }
  }, [cacheKey, cached, metaQuery.data]);

  // ── Invalidate stale cache when live full-bank data differs ─────────────────────────
  // Always invalidate when live data arrives — the cache may have stale questions
  // (e.g. all from one module) even if the count is the same.
  useEffect(() => {
    if (!cached || !fullQuery.data) return;
    const liveQuestions = fullQuery.data.questions ?? [];
    if (liveQuestions.length === 0) return;
    // Always invalidate: live data is authoritative. The cache will be rewritten
    // with the fresh data on the next cycle via the write-cache effect.
    invalidate(cacheKey);
  }, [cacheKey, cached, fullQuery.data]);

  // ── Write the bounded study set to cache once loaded ─────────────────────
  useEffect(() => {
    if (wroteCache.current) return;
    if (!fullQuery.data || !metaQuery.data) return;
    const rawQuestions = fullQuery.data.questions ?? [];
    const modules = metaQuery.data.modules ?? [];
    if (rawQuestions.length === 0) return; // don't cache empty (DB down)
    wroteCache.current = true;

    setCached(cacheKey, {
      questions: rawQuestions as DBQuestion[],
      modules,
      moduleTargets: metaQuery.data.moduleTargets ?? null,
      formulaLinks: metaQuery.data.formulaLinks ?? null,
      totalQuestions: metaQuery.data.totalQuestions ?? rawQuestions.length,
      overviews: (overviewsQuery.data as Record<string, ModuleOverview> | null) ?? null,
      // Issue L: persist the server version so future loads can detect content changes
      contentVersion: metaQuery.data.contentVersion ?? 1,
    });
  }, [cacheKey, fullQuery.data, metaQuery.data, overviewsQuery.data]);

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
      // Live data arrived — ALWAYS use it (it has correct modules + correctIndex).
      // The cache is only for instant display before the server responds.
      questions = liveQuestions;
    } else {
      // Live data not yet arrived — serve cached questions (correctIndex included).
      questions = cached.questions;
    }
    // Use live modules when available, fall back to cached
    modules = (liveQuestions && liveQuestions.length > 0)
      ? Array.from(new Set(liveQuestions.map((q: any) => q.module)))
      : cached.modules;
    moduleTargets = cached.moduleTargets;
    formulaLinks = cached.formulaLinks;
    totalQuestions = (liveQuestions && liveQuestions.length > 0) ? liveQuestions.length : cached.totalQuestions;
    // Retain cached notes for an instant render, but prefer the live result so
    // newly published notes appear without requiring users to clear storage.
    overviews = (overviewsQuery.data as Record<string, ModuleOverview> | null) ?? cached.overviews;
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
    isFullyLoaded: cached != null || fullQuery.isSuccess || batchQuery.isSuccess,
    /** True when the DB appears down AND no seed questions available */
    dbUnavailable,
    /** True when showing seed questions (DB not yet loaded) */
    isShowingSeed: !cached && !fullQuery.isSuccess && !batchQuery.isSuccess && seedAsDBQuestions.length > 0,
    error:
      fullQuery.error || batchQuery.error || metaQuery.error || overviewsQuery.error || null,
  };
}
