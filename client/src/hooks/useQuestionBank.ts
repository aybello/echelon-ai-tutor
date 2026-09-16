/** Server-authorized, bounded study data. Paid questions are never bundled or persisted here. */
import { useState } from "react";
import { trpc } from "@/lib/trpc";

export interface DBQuestion {
  id: number;
  attemptToken?: string;
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

export type QuestionBankPreviewSurface = "practice" | "flashcards" | "mock";

/**
 * Quiz pages use lazy loading: their question session is fetched separately,
 * while this hook owns the bank metadata. Prefer the server metadata count so
 * a deliberately empty lazy question array cannot be rendered as “0 questions”.
 */
export function resolveQuestionBankTotal(metadataTotal: unknown, fallbackTotal = 0): number {
  const parsed = Number(metadataTotal);
  return Number.isSafeInteger(parsed) && parsed >= 0 ? parsed : fallbackTotal;
}

export function useQuestionBank(
  bankKey: string,
  mode: "full" | "lazy" = "full",
  previewSurface?: QuestionBankPreviewSurface,
) {
  const [storedAccessToken] = useState<string | undefined>(() => {
    try { return localStorage.getItem("echelon_access_token") ?? undefined; } catch { return undefined; }
  });
  const fullQuery = trpc.quiz.getQuestions.useQuery(
    { bankKey, accessToken: storedAccessToken, previewSurface },
    { enabled: mode === "full", staleTime: 0, gcTime: 0, refetchOnMount: "always", retry: 2, retryDelay: 1500 },
  );
  const metaQuery = trpc.quiz.getBankMeta.useQuery({ bankKey }, { staleTime: 60_000, retry: 2, retryDelay: 1500 });
  const overviewsQuery = trpc.quiz.getModuleOverviews.useQuery({ bankKey }, { staleTime: 0, refetchOnMount: "always", retry: 2, retryDelay: 1500 });
  const questions: DBQuestion[] = mode === "full" && !fullQuery.error ? fullQuery.data?.questions ?? [] : [];
  const modules = metaQuery.data?.modules ?? [];
  const isLoading = metaQuery.isLoading || (mode === "full" && fullQuery.isLoading);
  const error = fullQuery.error || metaQuery.error || overviewsQuery.error || null;
  return {
    questions, modules,
    moduleTargets: metaQuery.data?.moduleTargets ?? null,
    formulaLinks: metaQuery.data?.formulaLinks ?? null,
    totalQuestions: resolveQuestionBankTotal(metaQuery.data?.totalQuestions),
    overviews: (overviewsQuery.data as Record<string, ModuleOverview> | null) ?? null,
    isLoading,
    isFullyLoaded: mode === "full" ? fullQuery.isSuccess : metaQuery.isSuccess,
    dbUnavailable: !isLoading && (mode === "full" ? questions.length === 0 : modules.length === 0),
    error,
  };
}
