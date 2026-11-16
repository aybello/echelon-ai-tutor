/**
 * Choosing the ten questions for a Quick 10.
 *
 * Priority, highest first:
 *   1. Questions the learner has never attempted.
 *   2. Questions the learner got wrong most recently (the most recent attempt was wrong), newest first.
 *   3. Anything else in the bank, in random order.
 *
 * Inside each group, questions are taken one module at a time in rotation, so a single session touches
 * several topics instead of ten questions from one module. Pure and deterministic given `random`.
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

/** Take questions one module at a time in rotation. Each module's own order is kept. */
function rotateByModule<T extends Quick10Candidate>(ordered: readonly T[], random: () => number): T[] {
  const queues = new Map<string, T[]>();
  for (const q of ordered) {
    const queue = queues.get(q.module);
    if (queue) queue.push(q); else queues.set(q.module, [q]);
  }
  const moduleOrder = shuffled([...queues.keys()], random);
  const out: T[] = [];
  let remaining = ordered.length;
  while (remaining > 0) {
    for (const name of moduleOrder) {
      const next = queues.get(name)!.shift();
      if (next) { out.push(next); remaining--; }
    }
  }
  return out;
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
    ["never-attempted", rotateByModule(shuffled(neverAttempted, random), random)],
    ["missed", rotateByModule(missed, random)],
    ["other", rotateByModule(shuffled(other, random), random)],
  ];

  const picked: Array<Quick10Pick<T>> = [];
  for (const [group, questions] of groups) {
    for (const question of questions) {
      if (picked.length >= size) break;
      picked.push({ question, group });
    }
  }
  // The priority decides which questions are chosen, not the order they are asked in.
  return shuffled(picked, random);
}
