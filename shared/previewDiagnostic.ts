export interface PreviewDiagnostic {
  score: number;
  correct: number;
  total: number;
  label: "Strong start" | "Promising start" | "Focus areas identified";
  weakTopics: string[];
  recommendation: string;
}

export function buildPreviewDiagnostic(
  history: Array<{ module?: string; correct?: boolean }>,
  questionsAnswered: number,
): PreviewDiagnostic {
  const completed = history.filter(entry => typeof entry.correct === "boolean");
  const total = completed.length || questionsAnswered;
  const correct = completed.filter(entry => entry.correct === true).length;
  const score = total > 0 ? Math.round((correct / total) * 100) : 0;
  const modules = new Map<string, { correct: number; total: number }>();

  for (const entry of completed) {
    const module = entry.module?.trim() || "General concepts";
    const current = modules.get(module) ?? { correct: 0, total: 0 };
    current.total += 1;
    if (entry.correct) current.correct += 1;
    modules.set(module, current);
  }

  const weakTopics = Array.from(modules.entries())
    .filter(([, value]) => value.correct < value.total)
    .sort(([, a], [, b]) =>
      (a.correct / a.total) - (b.correct / b.total) || b.total - a.total,
    )
    .slice(0, 3)
    .map(([module]) => module);

  const label = score >= 80
    ? "Strong start"
    : score >= 60
      ? "Promising start"
      : "Focus areas identified";
  const focus = weakTopics[0];
  const recommendation = focus
    ? `Start with ${focus}, then use targeted practice to strengthen the other missed topics.`
    : "Continue with mixed-topic practice and a timed mock exam to test consistency.";

  return { score, correct, total, label, weakTopics, recommendation };
}
