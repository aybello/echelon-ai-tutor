/**
 * useQuestionBank — fetches questions, bank metadata, and module overviews.
 *
 * Caching strategy:
 *   1. On mount, check localStorage for a valid cached bank (24hr TTL).
 *      If found, return instantly — zero network request.
 *   2. If no cache, fetch from DB via tRPC (lazy mode: batch first, then full).
 *   3. Once the full bank is loaded, write it to localStorage for next visit.
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

export function useQuestionBank(bankKey: string, mode: "full" | "lazy" = "full") {
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

  // ── Full bank (skip if cache hit) ────────────────────────────────────────
  const fullQuery = trpc.quiz.getQuestions.useQuery(
    { bankKey },
    {
      staleTime: 1000 * 60 * 30,
      enabled: !cached && (mode === "full" || (mode === "lazy" && batchQuery.isSuccess)),
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

  // ── Write to cache once full bank is loaded ───────────────────────────────
  useEffect(() => {
    if (wroteCache.current) return;
    if (!fullQuery.data || !metaQuery.data) return;
    const questions = fullQuery.data.questions ?? [];
    const modules = metaQuery.data.modules ?? [];
    if (questions.length === 0) return; // don't cache empty (DB down)
    wroteCache.current = true;
    setCached(bankKey, {
      questions,
      modules,
      moduleTargets: metaQuery.data.moduleTargets ?? null,
      formulaLinks: metaQuery.data.formulaLinks ?? null,
      totalQuestions: metaQuery.data.totalQuestions ?? questions.length,
      overviews: (overviewsQuery.data as Record<string, ModuleOverview> | null) ?? null,
    });
  }, [bankKey, fullQuery.data, metaQuery.data, overviewsQuery.data]);

  // ── Resolve data: cache → full → batch ───────────────────────────────────
  let questions: DBQuestion[];
  let modules: string[];
  let moduleTargets: Record<string, number> | null;
  let formulaLinks: Record<string, string> | null;
  let totalQuestions: number;
  let overviews: Record<string, ModuleOverview> | null;
  let isLoading: boolean;

  if (cached) {
    // Instant — served from localStorage
    questions = cached.questions;
    modules = cached.modules;
    moduleTargets = cached.moduleTargets;
    formulaLinks = cached.formulaLinks;
    totalQuestions = cached.totalQuestions;
    overviews = cached.overviews;
    isLoading = false;
  } else if (mode === "lazy") {
    if (fullQuery.data) {
      questions = fullQuery.data.questions ?? [];
    } else {
      questions = batchQuery.data?.questions ?? [];
    }
    isLoading = batchQuery.isLoading || metaQuery.isLoading || overviewsQuery.isLoading;
    modules = metaQuery.data?.modules ?? [];
    moduleTargets = metaQuery.data?.moduleTargets ?? null;
    formulaLinks = metaQuery.data?.formulaLinks ?? null;
    totalQuestions = metaQuery.data?.totalQuestions ?? 0;
    overviews = (overviewsQuery.data as Record<string, ModuleOverview> | null) ?? null;
  } else {
    questions = fullQuery.data?.questions ?? [];
    isLoading = fullQuery.isLoading || metaQuery.isLoading || overviewsQuery.isLoading;
    modules = metaQuery.data?.modules ?? [];
    moduleTargets = metaQuery.data?.moduleTargets ?? null;
    formulaLinks = metaQuery.data?.formulaLinks ?? null;
    totalQuestions = metaQuery.data?.totalQuestions ?? 0;
    overviews = (overviewsQuery.data as Record<string, ModuleOverview> | null) ?? null;
  }

  // ── Detect DB unavailable state ──────────────────────────────────────────
  const queriesSettled = !isLoading;
  const noError = !fullQuery.error && !batchQuery.error && !metaQuery.error;
  const emptyResult = questions.length === 0 && modules.length === 0;
  const dbUnavailable = !cached && queriesSettled && noError && emptyResult;

  return {
    questions,
    modules,
    moduleTargets,
    formulaLinks,
    totalQuestions,
    overviews,
    isLoading,
    isFullyLoaded: cached != null || fullQuery.isSuccess,
    /** True when the DB appears down — queries returned but with no data */
    dbUnavailable,
    error:
      fullQuery.error || batchQuery.error || metaQuery.error || overviewsQuery.error || null,
  };
}
