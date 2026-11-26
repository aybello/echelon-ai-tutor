import { describe, expect, it } from "vitest";
import { pickQuick10, QUICK_10_SIZE, type Quick10Candidate, type Quick10History } from "./quick10Selection";

/** A small deterministic random source so the tests do not flake. */
function seeded(seed: number): () => number {
  let s = seed >>> 0;
  return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 2 ** 32; };
}

const MODULES = ["Network", "Hydraulics", "Storage", "Quality"];
/** 80 questions, 20 in each of four modules, numbered 1 to 80. */
const bank: Quick10Candidate[] = Array.from({ length: 80 }, (_, i) => ({ questionNum: i + 1, module: MODULES[i % 4] }));
const history = (entries: Array<[number, boolean, number]>) =>
  new Map<number, Quick10History>(entries.map(([n, lastCorrect, lastAttemptAt]) => [n, { lastCorrect, lastAttemptAt }]));

describe("pickQuick10: priority order", () => {
  it("fills the session with never-attempted questions first, even when the learner has missed some", () => {
    // Questions 1 to 60 have been tried (10 of them wrong); 61 to 80 are new.
    const h = history(Array.from({ length: 60 }, (_, i) => [i + 1, i >= 10, 1000 + i] as [number, boolean, number]));
    const picks = pickQuick10(bank, h, seeded(1));
    expect(picks).toHaveLength(QUICK_10_SIZE);
    expect(picks.every(p => p.group === "never-attempted")).toBe(true);
    expect(picks.every(p => p.question.questionNum > 60)).toBe(true);
  });

  it("adds missed questions, newest miss first, when there are not enough new ones", () => {
    // Only questions 71 to 76 are new (6). Missed: 1 (oldest), 2, 3, 4, 5 (newest). The rest were right.
    const entries: Array<[number, boolean, number]> = [];
    for (let n = 1; n <= 70; n++) entries.push([n, n > 5, 1000 + n * 10]);
    entries.push([77, true, 1], [78, true, 1], [79, true, 1], [80, true, 1]);
    const picks = pickQuick10(bank, history(entries), seeded(2));
    const nums = picks.map(p => p.question.questionNum);
    expect(picks).toHaveLength(10);
    expect(picks.filter(p => p.group === "never-attempted")).toHaveLength(6);
    const missed = picks.filter(p => p.group === "missed").map(p => p.question.questionNum).sort((a, b) => a - b);
    // Four slots left for missed questions: the four most recent misses are 5, 4, 3 and 2, never question 1.
    expect(missed).toEqual([2, 3, 4, 5]);
    expect(nums).not.toContain(1);
  });

  it("fills the rest from correctly answered questions when new and missed ones run out", () => {
    // Everything attempted; only 3 missed.
    const entries: Array<[number, boolean, number]> = bank.map(q => [q.questionNum, q.questionNum > 3, 1000 + q.questionNum]);
    const picks = pickQuick10(bank, history(entries), seeded(3));
    expect(picks).toHaveLength(10);
    expect(picks.filter(p => p.group === "missed").map(p => p.question.questionNum).sort()).toEqual([1, 2, 3]);
    expect(picks.filter(p => p.group === "other")).toHaveLength(7);
    expect(picks.filter(p => p.group === "never-attempted")).toHaveLength(0);
  });

  it("treats a learner with no history as all never-attempted", () => {
    const picks = pickQuick10(bank, new Map(), seeded(4));
    expect(picks).toHaveLength(10);
    expect(picks.every(p => p.group === "never-attempted")).toBe(true);
  });
});

describe("pickQuick10: mix across modules", () => {
  it("touches several modules, not just one", () => {
    for (let seed = 1; seed <= 20; seed++) {
      const picks = pickQuick10(bank, new Map(), seeded(seed));
      const modules = new Set(picks.map(p => p.question.module));
      expect(modules.size).toBe(4); // four modules available, ten questions: all four appear
    }
  });

  it("keeps the mix when the missed group is the one being drawn from", () => {
    // Every question has been missed. Missed questions are rotated by module too.
    const entries: Array<[number, boolean, number]> = bank.map(q => [q.questionNum, false, 1000 + q.questionNum]);
    const picks = pickQuick10(bank, history(entries), seeded(5));
    expect(new Set(picks.map(p => p.question.module)).size).toBe(4);
    expect(picks.every(p => p.group === "missed")).toBe(true);
  });

  it("does not take more than its fair share from one module while others still have questions", () => {
    const picks = pickQuick10(bank, new Map(), seeded(6));
    const counts = new Map<string, number>();
    for (const p of picks) counts.set(p.question.module, (counts.get(p.question.module) ?? 0) + 1);
    // Ten questions over four modules is at most three from any one module.
    expect(Math.max(...counts.values())).toBeLessThanOrEqual(3);
  });
});

describe("pickQuick10: module cap", () => {
  it("never takes more than three from one module while others still have questions, even when every miss is in one module", () => {
    // Questions 1, 5, 9 ... are Network. All twenty Network questions were missed; everything else was answered correctly.
    const entries: Array<[number, boolean, number]> = bank.map(q => [q.questionNum, q.module !== "Network", 1000 + q.questionNum]);
    for (let seed = 1; seed <= 15; seed++) {
      const picks = pickQuick10(bank, history(entries), seeded(seed));
      expect(picks).toHaveLength(10);
      expect(picks.filter(p => p.question.module === "Network")).toHaveLength(3);
      expect(new Set(picks.map(p => p.question.module)).size).toBe(4);
    }
  });

  it("among misses spread over modules, the newest are chosen", () => {
    // Eight misses, one per question 1 to 8, newest is question 8. Two modules would otherwise hog the picks; with
    // a cap of three per module the newest three of each module are taken before older ones.
    const entries: Array<[number, boolean, number]> = bank.map(q => [q.questionNum, q.questionNum > 8, q.questionNum <= 8 ? 1000 + q.questionNum : 1]);
    const picks = pickQuick10(bank, history(entries), seeded(21));
    const missed = picks.filter(p => p.group === "missed").map(p => p.question.questionNum);
    expect(missed.sort((a, b) => a - b)).toEqual([1, 2, 3, 4, 5, 6, 7, 8]);
  });

  it("lifts the cap when it would leave the session short", () => {
    const one = bank.filter(q => q.module === "Storage").slice(0, 8);
    expect(pickQuick10(one, new Map(), seeded(22))).toHaveLength(8);
  });
});

describe("pickQuick10: edge cases", () => {
  it("returns fewer than ten when the bank is small, with no duplicates", () => {
    const small = bank.slice(0, 6);
    const picks = pickQuick10([...small, ...small], new Map(), seeded(7));
    expect(picks).toHaveLength(6);
    expect(new Set(picks.map(p => p.question.questionNum)).size).toBe(6);
  });

  it("works with a single module", () => {
    const one = bank.filter(q => q.module === "Storage");
    const picks = pickQuick10(one, new Map(), seeded(8));
    expect(picks).toHaveLength(10);
    expect(new Set(picks.map(p => p.question.module))).toEqual(new Set(["Storage"]));
  });

  it("returns nothing for an empty bank", () => {
    expect(pickQuick10([], new Map(), seeded(9))).toEqual([]);
  });

  it("is repeatable with the same random source", () => {
    const a = pickQuick10(bank, new Map(), seeded(10)).map(p => p.question.questionNum);
    const b = pickQuick10(bank, new Map(), seeded(10)).map(p => p.question.questionNum);
    expect(a).toEqual(b);
  });
});
