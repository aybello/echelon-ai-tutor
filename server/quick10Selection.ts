/**
 * Choosing the ten questions for a Quick 10.
 *
 * Priority, highest first:
 *   1. Questions the learner has never attempted.
 *   2. Questions the learner got wrong most recently (the most recent attempt was wrong), newest first.
 *   3. Anything else in the bank, in random order.
 *
 * Each group is taken in its own order (newest miss first, otherwise random). To make one session touch several
 * topics, no more than a fair share (three of ten when there are four or more modules) comes from any single
 * module while other modules still have questions. If the cap leaves the session short, the cap is lifted for the
 * remaining places. Pure and deterministic given `random`.
 */

export const QUICK_10_SIZE = 10;

export interface Quick10Candidate {
  questionNum: number;
  module: string;
}

/** What the attempt history says about one question for this learner. Absent means never attempted. */
export interface Quick10History {
  lastCorrect: boolean;
  /** Milliseconds since the epoch of the most recent attempt. */
  lastAttemptAt: number;
}

export type Quick10Group = "never-attempted" | "missed" | "other";

export interface Quick10Pick<T extends Quick10Candidate> {
  question: T;
  group: Quick10Group;
}

function shuffled<T>(items: readonly T[], random: () => number): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

export function pickQuick10<T extends Quick10Candidate>(
  candidates: readonly T[],
  history: ReadonlyMap<number, Quick10History>,
  random: () => number = Math.random,
  size: number = QUICK_10_SIZE,
): Array<Quick10Pick<T>> {
  const seen = new Set<number>();
  const unique = candidates.filter(c => (seen.has(c.questionNum) ? false : (seen.add(c.questionNum), true)));

  const neverAttempted = unique.filter(c => !history.has(c.questionNum));
  const missed = unique
    .filter(c => history.get(c.questionNum)?.lastCorrect === false)
    .sort((a, b) => history.get(b.questionNum)!.lastAttemptAt - history.get(a.questionNum)!.lastAttemptAt);
  const other = unique.filter(c => history.get(c.questionNum)?.lastCorrect === true);

  const groups: Array<[Quick10Group, T[]]> = [
    ["never-attempted", shuffled(neverAttempted, random)],
    ["missed", missed],
    ["other", shuffled(other, random)],
  ];

  // At most this many from one module: 3 of 10 with four or more modules, 4 with three, 5 with two.
  const moduleCount = new Set(unique.map(c => c.module)).size;
  const perModuleCap = Math.ceil(size / Math.max(1, Math.min(moduleCount, 4)));

  const picked: Array<Quick10Pick<T>> = [];
  const taken = new Set<number>();
  const perModule = new Map<string, number>();
  const take = (group: Quick10Group, question: T) => {
    picked.push({ question, group });
    taken.add(question.questionNum);
    perModule.set(question.module, (perModule.get(question.module) ?? 0) + 1);
  };
  // First pass: priority order, with the module cap.
  for (const [group, questions] of groups) {
    for (const question of questions) {
      if (picked.length >= size) break;
      if ((perModule.get(question.module) ?? 0) >= perModuleCap) continue;
      take(group, question);
    }
  }
  // Second pass: the cap left places empty, so fill them in priority order.
  for (const [group, questions] of groups) {
    for (const question of questions) {
      if (picked.length >= size) break;
      if (!taken.has(question.questionNum)) take(group, question);
    }
  }
  // The priority decides which questions are chosen, not the order they are asked in.
  return shuffled(picked, random);
}
