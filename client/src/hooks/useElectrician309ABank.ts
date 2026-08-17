import { useMemo } from "react";
import { trpc } from "@/lib/trpc";
import type { DBQuestion, ModuleOverview } from "@/hooks/useQuestionBank";
import { ELECTRICIAN_309A_MODULES } from "@shared/electrician309aBlueprint";

export const ELECTRICIAN_309A_MODULE_LABELS = Object.fromEntries(
  ELECTRICIAN_309A_MODULES.map((module) => [module.code, `${module.code}. ${module.title}`]),
) as Record<string, string>;

const MODULE_OVERVIEWS = Object.fromEntries(
  ELECTRICIAN_309A_MODULES.map((module) => [
    ELECTRICIAN_309A_MODULE_LABELS[module.code],
    {
      title: `${module.code}. ${module.title}`,
      intro: `Study the current-exam tasks within Major Work Activity ${module.code}. This free Echelon Institute course bank contains original questions mapped to the official Red Seal weighting.`,
      keyPoints: module.tasks.slice(0, 4).map((task) => ({ heading: task.code, body: task.title })),
      examTips: [
        `${module.examQuestions} of 100 current-exam questions are allocated to this Major Work Activity.`,
        "Use each explanation to identify the job-task outcome being tested before moving on.",
      ],
    } satisfies ModuleOverview,
  ]),
) as Record<string, ModuleOverview>;

export const ELECTRICIAN_309A_MODULE_TARGETS = Object.fromEntries(
  ELECTRICIAN_309A_MODULES.map((module) => [ELECTRICIAN_309A_MODULE_LABELS[module.code], module.examQuestions]),
) as Record<string, number>;

/** Adapts governed certification records to the standard Echelon course-bank contract. */
export function useElectrician309ABank() {
  const query = trpc.electricianReview.get309ABetaPractice.useQuery(undefined, {
    staleTime: 1000 * 60 * 5,
    retry: 4,
    retryDelay: 5000,
  });

  const questions = useMemo<DBQuestion[]>(() => (query.data?.questions ?? []).map((question) => ({
    id: question.id,
    module: ELECTRICIAN_309A_MODULE_LABELS[question.module] ?? question.module,
    difficulty: question.difficulty,
    question: question.question,
    options: question.options,
    correctIndex: question.correctIndex,
    explanation: question.explanation,
    steps: question.steps,
    tip: question.tip ?? undefined,
    isCalc: question.isCalc,
    topic: question.taskCode,
  })), [query.data]);

  return {
    questions,
    modules: ELECTRICIAN_309A_MODULES.map((module) => ELECTRICIAN_309A_MODULE_LABELS[module.code]),
    moduleTargets: ELECTRICIAN_309A_MODULE_TARGETS,
    totalQuestions: query.data?.total ?? 0,
    overviews: MODULE_OVERVIEWS,
    isLoading: query.isLoading,
    isFullyLoaded: query.isSuccess,
    dbUnavailable: query.isError,
  };
}
