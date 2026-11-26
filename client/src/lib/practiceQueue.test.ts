import { describe, expect, it, vi } from "vitest";
import { PracticeQueue } from "./practiceQueue";

const questions = Array.from({ length: 125 }, (_, i) => ({ id: i + 1, module: "Safety" }));
const first = <T,>(pool: T[]) => pool[0] ?? null;
describe("bounded practice paging", () => {
  it("continues through 125 unseen module questions while retaining fewer than 60", async () => {
    const fetch = vi.fn(async (excludeIds: number[]) => ({
      questions: questions.filter(q => !excludeIds.includes(q.id)).slice(0, 50), total: 125,
    }));
    const queue = new PracticeQueue(fetch);
    const seen = new Set<number>();
    for (let i = 0; i < 125; i++) {
      const q = await queue.take(first);
      expect(q?.module).toBe("Safety");
      expect(seen.has(q!.id)).toBe(false);
      seen.add(q!.id);
      expect(queue.size).toBeLessThan(60);
    }
    expect(await queue.take(first)).toBeNull();
    expect(seen.size).toBe(125);
    expect(fetch).toHaveBeenCalledTimes(3);
  });
  it("retries failed top-ups without declaring a completed session", async () => {
    let calls = 0;
    const queue = new PracticeQueue(async (excludeIds: number[]) => {
      calls++;
      if (calls === 2) throw new Error("offline");
      return { questions: questions.filter(q => !excludeIds.includes(q.id)).slice(0, 50), total: 125 };
    });
    const ids = [];
    for (let i = 0; i < 75; i++) ids.push((await queue.take(first))!.id);
    expect(new Set(ids).size).toBe(75);
    expect(calls).toBeGreaterThan(2);
  });
  it("waits for an in-flight top-up at the boundary without losing questions", async () => {
    let finish!: (value: { questions: typeof questions; total: number }) => void;
    let calls = 0;
    const queue = new PracticeQueue(() => {
      calls++;
      return calls === 1 ? Promise.resolve({ questions: questions.slice(0, 50), total: 125 })
        : new Promise<{ questions: typeof questions; total: number }>(resolve => { finish = resolve; });
    });
    for (let i = 0; i < 50; i++) await queue.take(first);
    const next = queue.take(first);
    finish({ questions: questions.slice(50, 100), total: 125 });
    expect((await next)?.id).toBe(51);
    expect(calls).toBe(2);
  });
  it("retains consumed IDs across successive sessions", async () => {
    const seen = new Set<number>();
    const fetch = async (excluded: number[]) => ({ questions: questions.filter(q => !excluded.includes(q.id)).slice(0, 50), total: 125 });
    const firstSession = new PracticeQueue(fetch, seen);
    for (let i = 0; i < 50; i++) await firstSession.take(first);
    const secondSession = new PracticeQueue(fetch, seen);
    expect((await secondSession.take(first))?.id).toBe(51);
  });
});
