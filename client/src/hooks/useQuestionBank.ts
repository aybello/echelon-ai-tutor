/**
 * useQuestionBank — fetches questions, bank metadata, and module overviews
 * from the database via tRPC, replacing static TypeScript imports.
 *
 * Usage:
 *   const { questions, modules, moduleTargets, formulaLinks, overviews, isLoading } = useQuestionBank("class1-water");
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

export function useQuestionBank(bankKey: string) {
  const questionsQuery = trpc.quiz.getQuestions.useQuery(
    { bankKey },
    { staleTime: 1000 * 60 * 30 } // cache for 30 minutes
  );

  const metaQuery = trpc.quiz.getBankMeta.useQuery(
    { bankKey },
    { staleTime: 1000 * 60 * 30 }
  );

  const overviewsQuery = trpc.quiz.getModuleOverviews.useQuery(
    { bankKey },
    { staleTime: 1000 * 60 * 30 }
  );

  const isLoading =
    questionsQuery.isLoading || metaQuery.isLoading || overviewsQuery.isLoading;

  const questions: DBQuestion[] = questionsQuery.data?.questions ?? [];
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
    error:
      questionsQuery.error || metaQuery.error || overviewsQuery.error || null,
  };
}
