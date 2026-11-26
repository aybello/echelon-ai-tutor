export const DIAGNOSTIC_QUESTION_COUNT = 15;

export type DiagnosticQuestionCandidate = {
  questionNum: number;
  module: string;
  difficulty?: string | null;
};

export type ScoredDiagnosticAnswer = {
  module: string;
  correct: boolean;
};

export type DiagnosticBaseline = {
  score: number;
  correct: number;
  total: number;
  label: "Strong starting point" | "Promising starting point" | "Focus areas identified";
  weakTopics: string[];
  strongTopics: string[];
  topicBreakdown: Record<string, { correct: number; total: number; accuracy: number }>;
  recommendation: string;
};

/**
 * Pick a representative, deterministic diagnostic sample. Questions are
 * round-robined across modules so a bank ordered by module cannot produce a
 * one-topic baseline. The seed rotates the starting question within each
 * module without exposing any scoring data to the client.
 */
export function selectDiagnosticQuestionNumbers(
  candidates: DiagnosticQuestionCandidate[],
  seed: number,
  limit = DIAGNOSTIC_QUESTION_COUNT,
): number[] {
  if (limit <= 0) return [];

  const byModule = new Map<string, DiagnosticQuestionCandidate[]>();
  for (const candidate of candidates) {
    const module = candidate.module.trim() || "General concepts";
    const list = byModule.get(module) ?? [];
    list.push(candidate);
    byModule.set(module, list);
  }

  const modules = Array.from(byModule.entries()).sort(([a], [b]) => a.localeCompare(b));
  if (modules.length === 0) return [];

  for (const [, questions] of modules) {
    questions.sort((a, b) => {
      const difficultyRank = (value?: string | null) => value === "hard" ? 2 : value === "medium" ? 1 : 0;
      return difficultyRank(a.difficulty) - difficultyRank(b.difficulty) || a.questionNum - b.questionNum;
    });
  }

  const selected: number[] = [];
  let round = 0;
  while (selected.length < Math.min(limit, candidates.length)) {
    let added = false;
    for (let moduleIndex = 0; moduleIndex < modules.length; moduleIndex += 1) {
      if (selected.length >= limit) break;
      const questions = modules[moduleIndex][1];
      const offset = Math.abs(seed + moduleIndex * 17) % questions.length;
      const candidate = questions[(offset + round) % questions.length];
      if (!selected.includes(candidate.questionNum)) {
        selected.push(candidate.questionNum);
        added = true;
      }
    }
    if (!added) break;
    round += 1;
  }

  return selected;
}

export function buildDiagnosticBaseline(answers: ScoredDiagnosticAnswer[]): DiagnosticBaseline {
  const topicMap = new Map<string, { correct: number; total: number }>();
  for (const answer of answers) {
    const module = answer.module.trim() || "General concepts";
    const current = topicMap.get(module) ?? { correct: 0, total: 0 };
    current.total += 1;
    if (answer.correct) current.correct += 1;
    topicMap.set(module, current);
  }

  const total = answers.length;
  const correct = answers.filter(answer => answer.correct).length;
  const score = total > 0 ? Math.round((correct / total) * 100) : 0;
  const topicBreakdown = Object.fromEntries(
    Array.from(topicMap.entries()).map(([topic, value]) => [topic, {
      ...value,
      accuracy: value.total > 0 ? Math.round((value.correct / value.total) * 100) : 0,
    }]),
  );

  const ranked = Object.entries(topicBreakdown)
    .sort(([, a], [, b]) => a.accuracy - b.accuracy || b.total - a.total);
  const weakTopics = ranked.filter(([, value]) => value.accuracy < 70).slice(0, 3).map(([topic]) => topic);
  const strongTopics = [...ranked].reverse().filter(([, value]) => value.accuracy >= 70).slice(0, 3).map(([topic]) => topic);
  const label = score >= 80
    ? "Strong starting point"
    : score >= 60
      ? "Promising starting point"
      : "Focus areas identified";
  const recommendation = weakTopics[0]
    ? `Begin with ${weakTopics[0]}, then use targeted practice for ${weakTopics.slice(1).join(" and ") || "the other missed topics"}.`
    : "Begin with mixed-topic practice, then use a timed mock exam to check consistency.";

  return { score, correct, total, label, weakTopics, strongTopics, topicBreakdown, recommendation };
}

export function estimateWeeklyQuestionGoal(studyDaysPerWeek: number, sessionMinutes: number): number {
  const days = Math.min(7, Math.max(1, Math.round(studyDaysPerWeek)));
  const minutes = Math.min(90, Math.max(10, Math.round(sessionMinutes)));
  return days * Math.max(5, Math.round(minutes / 2));
}
