import { randomInt } from "node:crypto";
import type { CeuCurriculum, CeuExamItem } from "../../shared/ceuLearning";
import legacyData from "./legacyAssessments.json";

const legacy = legacyData as Record<string, {
  primary: CeuCurriculum["finalAssessment"];
  alternate: CeuCurriculum["finalAssessment"];
}>;

function shuffle<T>(values: T[]): T[] {
  const result = [...values];
  for (let i = result.length - 1; i > 0; i--) {
    const j = randomInt(i + 1);
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

/** Keep each module's original weighting while drawing from its private pool. */
export function issueCeuExam(course: CeuCurriculum): CeuExamItem[] {
  const pool = [...course.finalAssessment, ...(course.alternateFinalAssessment ?? [])];
  return shuffle(course.modules.flatMap(module => {
    const count = course.finalAssessment.filter(q => q.objective === module.id).length;
    return shuffle(pool.filter(q => q.objective === module.id)).slice(0, count);
  })).map(q => ({ questionId: q.id, choiceOrder: shuffle(q.choices.map((_, i) => i)) }));
}

/** Missing manifests belong to legacy drafts/results and retain their original ordering. */
export function ceuExamQuestions(course: CeuCurriculum, manifest?: CeuExamItem[]) {
  const archived = legacy[course.key];
  if (!manifest) return archived?.primary ?? course.finalAssessment;
  const pool = [...course.finalAssessment, ...(course.alternateFinalAssessment ?? []),
    ...(archived?.primary ?? []), ...(archived?.alternate ?? [])];
  return manifest.map(item => {
    const q = pool.find(question => question.id === item.questionId);
    if (!q || item.choiceOrder.length !== q.choices.length ||
        new Set(item.choiceOrder).size !== q.choices.length ||
        item.choiceOrder.some(i => !Number.isInteger(i) || i < 0 || i >= q.choices.length))
      throw new Error("This assessment version is unavailable. Your saved answers have been preserved.");
    return { ...q, choices: item.choiceOrder.map(i => q.choices[i]), correctIndex: item.choiceOrder.indexOf(q.correctIndex) };
  });
}

/** Preview uses existing lesson checks, never certificate assessment items. */
export function ceuSampleQuestions(course: CeuCurriculum) {
  return course.modules.map(module => {
    const { correctIndex, explanation, ...question } = module.checks[0];
    return question;
  });
}
