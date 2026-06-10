/**
 * shuffle() correctness + uniformity tests.
 *
 * Guards against the regression where mock exams used
 * `.sort(() => Math.random() - 0.5)`, a biased shuffle that made
 * questions near the start of the bank far more likely to appear first.
 * These tests fail loudly if anyone reintroduces a non-uniform shuffle.
 */
import { describe, it, expect } from "vitest";
import { shuffle } from "./utils";

describe("shuffle()", () => {
  it("returns a permutation with the same elements", () => {
    const input = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
    const out = shuffle(input);
    expect(out).toHaveLength(input.length);
    expect([...out].sort((a, b) => a - b)).toEqual(input);
  });

  it("does not mutate the original array", () => {
    const input = [1, 2, 3, 4, 5];
    const copy = [...input];
    shuffle(input);
    expect(input).toEqual(copy);
  });

  it("handles empty and single-element arrays", () => {
    expect(shuffle([])).toEqual([]);
    expect(shuffle([42])).toEqual([42]);
  });

  it("is statistically uniform (no positional bias)", () => {
    const LEN = 10;
    const RUNS = 50000;
    const base = Array.from({ length: LEN }, (_, i) => i);

    // Count how often item 0 lands in each final position.
    const positionCounts = new Array(LEN).fill(0);
    for (let i = 0; i < RUNS; i++) {
      const out = shuffle(base);
      positionCounts[out.indexOf(0)]++;
    }

    // Fair shuffle => each position ~10%. Generous band that the biased
    // sort (which produced ~19.6% in position 0) would blow past.
    const expected = RUNS / LEN;
    for (let pos = 0; pos < LEN; pos++) {
      const pct = (100 * positionCounts[pos]) / RUNS;
      expect(pct).toBeGreaterThan(8.5);
      expect(pct).toBeLessThan(11.5);
    }
    // Sanity: total adds up.
    expect(positionCounts.reduce((a, b) => a + b, 0)).toBe(RUNS);
    void expected;
  });
});
