export type MockResultQuestion = {
  id: number;
  /** `false` denotes an unscored practice item returned by the signed mock result. */
  scored?: boolean;
};

export type MockResultAnswer = {
  selected: number | null;
};

export function calculateMockResultStats({
  questions,
  answers,
  correct,
  authoritativeTotal,
  unscoredQuestionNums = [],
}: {
  questions: MockResultQuestion[];
  answers: MockResultAnswer[];
  correct: number;
  authoritativeTotal?: number;
  unscoredQuestionNums?: number[];
}) {
  const explicitUnscored = new Set(unscoredQuestionNums);
  const scoredIndexes = questions.flatMap((question, index) =>
    question.scored === false || explicitUnscored.has(question.id) ? [] : [index]
  );
  const total = authoritativeTotal ?? scoredIndexes.length;
  const skipped = scoredIndexes.filter(index => answers[index]?.selected === null).length;

  return {
    total,
    skipped,
    incorrect: Math.max(0, total - correct - skipped),
  };
}
