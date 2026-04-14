/**
 * useQuestionBank — fetches questions, bank metadata, and module overviews
 * from the database via tRPC.
 *
 * Supports two modes:
 *   - "full" (default): fetches ALL questions upfront. Use for mock exams and flashcards.
 *   - "lazy": fetches a small random batch (20 questions) instantly for fast first-question,
 *     then loads the full bank in the background. Use for quiz pages.
 *
 * Usage:
 *   // Quiz page — instant start, lazy background load
 *   const { questions, modules, isLoading } = useQuestionBank("class1-water", "lazy");
 *
 *   // Mock exam / flashcards — full bank needed upfront
 *   const { questions, modules, isLoading } = useQuestionBank("class1-water");
 */
import { useState, useEffect, useRef } from "react";
import { trpc } from "@/lib/trpc";

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
  // ── Fast batch (lazy mode only) ──────────────────────────────────────────
  const batchQuery = trpc.quiz.getRandomQuestions.useQuery(
    { bankKey, limit: 20 },
    {
      enabled: mode === "lazy",
      staleTime: 1000 * 60 * 5, // 5 min — short since it's random
    }
  );

  // ── Full bank (always fetched, but in lazy mode it's deferred) ───────────
  const fullQuery = trpc.quiz.getQuestions.useQuery(
    { bankKey },
    {
      staleTime: 1000 * 60 * 30, // cache for 30 minutes
      // In lazy mode, only start fetching the full bank once the batch is ready
      enabled: mode === "full" || (mode === "lazy" && batchQuery.isSuccess),
    }
  );

  const metaQuery = trpc.quiz.getBankMeta.useQuery(
    { bankKey },
    { staleTime: 1000 * 60 * 30 }
  );

  const overviewsQuery = trpc.quiz.getModuleOverviews.useQuery(
    { bankKey },
    { staleTime: 1000 * 60 * 30 }
  );

  // ── Merge questions: use batch first, swap to full when ready ────────────
  let questions: DBQuestion[];
  let isLoading: boolean;

  if (mode === "lazy") {
    // In lazy mode: show batch questions immediately, upgrade to full when available
    if (fullQuery.data) {
      questions = fullQuery.data.questions ?? [];
    } else {
      questions = batchQuery.data?.questions ?? [];
    }
    // Only block on the initial batch — don't wait for the full bank
    isLoading = batchQuery.isLoading || metaQuery.isLoading || overviewsQuery.isLoading;
  } else {
    // Full mode: wait for everything
    questions = fullQuery.data?.questions ?? [];
    isLoading = fullQuery.isLoading || metaQuery.isLoading || overviewsQuery.isLoading;
  }

  const modules: string[] = metaQuery.data?.modules ?? [];
  const moduleTargets: Record<string, number> | null =
    metaQuery.data?.moduleTargets ?? null;
  const formulaLinks: Record<string, string> | null =
    metaQuery.data?.formulaLinks ?? null;
  const totalQuestions: number = metaQuery.data?.totalQuestions ?? 0;
  const overviews: Record<string, ModuleOverview> | null =
    (overviewsQuery.data as Record<string, ModuleOverview> | null) ?? null;

  return {
    questions,
    modules,
    moduleTargets,
    formulaLinks,
    totalQuestions,
    overviews,
    isLoading,
    /** True when the full bank has loaded (useful for features that need all questions) */
    isFullyLoaded: fullQuery.isSuccess,
    error:
      fullQuery.error || batchQuery.error || metaQuery.error || overviewsQuery.error || null,
  };
}
