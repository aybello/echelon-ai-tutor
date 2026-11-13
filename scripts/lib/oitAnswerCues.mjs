// Heuristics surface length clues, not semantic correctness. Editorial choices
// still need one defensible key and plausible, topic-specific misconceptions.
export function analyseOitAnswerCues(questions) {
  const conceptual = questions.filter(question => question.isCalc === "no");
  const longest = [];
  const shortest = [];
  const longTells = [];
  const shortTells = [];
  const qualifierTells = [];
  const shortcut = /\b(without|solely|alone|only|every|all|cannot|independent|despite|unverified)\b/i;
  for (const question of conceptual) {
    const correctLength = question.correctAnswer.length;
    const wrongLengths = question.options.filter((_, i) => i !== question.correctIndex).map(value => value.length);
    if (!shortcut.test(question.correctAnswer) && question.options.filter((_, i) => i !== question.correctIndex).every(value => shortcut.test(value))) {
      qualifierTells.push(question.questionNum);
    }
    const maxWrong = Math.max(...wrongLengths);
    const minWrong = Math.min(...wrongLengths);
    if (correctLength > maxWrong) {
      longest.push(question.questionNum);
      // Match the repository's established answerLengthBias.ts detector.
      if (correctLength - maxWrong >= 12 || correctLength >= maxWrong * 1.25) longTells.push(question.questionNum);
    }
    if (correctLength < minWrong) {
      shortest.push(question.questionNum);
      if (correctLength < minWrong * 0.65 && minWrong - correctLength >= 20) shortTells.push(question.questionNum);
    }
  }
  return { conceptualCount: conceptual.length, longestRate: longest.length / conceptual.length, shortestRate: shortest.length / conceptual.length, longTells, shortTells, qualifierTells };
}
