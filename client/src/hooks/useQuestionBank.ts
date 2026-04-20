/**
 * useQuestionBank — fetches questions, bank metadata, and module overviews
 * from the database via tRPC.
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
      staleTime: 1000 * 60 * 5,
      retry: 2,
      retryDelay: 3000,
    }
  );

  // ── Full bank (always fetched, but in lazy mode it's deferred) ───────────
  const fullQuery = trpc.quiz.getQuestions.useQuery(
    { bankKey },
    {
      staleTime: 1000 * 60 * 30,
      enabled: mode === "full" || (mode === "lazy" && batchQuery.isSuccess),
      retry: 2,
      retryDelay: 3000,
    }
  );

  const metaQuery = trpc.quiz.getBankMeta.useQuery(
    { bankKey },
    {
      staleTime: 1000 * 60 * 30,
      retry: 2,
      retryDelay: 3000,
    }
  );

  const overviewsQuery = trpc.quiz.getModuleOverviews.useQuery(
    { bankKey },
    {
      staleTime: 1000 * 60 * 30,
      retry: 2,
      retryDelay: 3000,
    }
  );

  // ── Merge questions: use batch first, swap to full when ready ────────────
  let questions: DBQuestion[];
  let isLoading: boolean;

  if (mode === "lazy") {
    if (fullQuery.data) {
      questions = fullQuery.data.questions ?? [];
    } else {
      questions = batchQuery.data?.questions ?? [];
    }
    isLoading = batchQuery.isLoading || metaQuery.isLoading || overviewsQuery.isLoading;
  } else {
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

  // ── Detect DB unavailable state ──────────────────────────────────────────
  // The API returns { questions: [] } and null meta when the DB is down.
  // Detect this: queries succeeded (not loading, no error) but returned empty.
  const queriesSettled = !isLoading;
  const noError = !fullQuery.error && !batchQuery.error && !metaQuery.error;
  const emptyResult = questions.length === 0 && modules.length === 0;
  const dbUnavailable = queriesSettled && noError && emptyResult;

  return {
    questions,
    modules,
    moduleTargets,
    formulaLinks,
    totalQuestions,
    overviews,
    isLoading,
    isFullyLoaded: fullQuery.isSuccess,
    /** True when the DB appears down — queries returned but with no data */
    dbUnavailable,
    error:
      fullQuery.error || batchQuery.error || metaQuery.error || overviewsQuery.error || null,
  };
}
