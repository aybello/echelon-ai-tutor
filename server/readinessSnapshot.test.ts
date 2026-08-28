import { describe, expect, it, vi } from "vitest";
import { calculateReadinessSnapshot } from "./readinessSnapshot";

function simpleQuery(result: unknown[]) {
  return { from: vi.fn(() => ({ where: vi.fn().mockResolvedValue(result) })) };
}

function groupedQuery(result: unknown[]) {
  return {
    from: vi.fn(() => ({
      where: vi.fn(() => ({
        groupBy: vi.fn(() => ({
          orderBy: vi.fn(() => ({ limit: vi.fn().mockResolvedValue(result) })),
        })),
      })),
    })),
  };
}

describe("server-owned readiness snapshots", () => {
  it("uses recent practice, real mock performance and the actual bank topic count", async () => {
    const select = vi.fn()
      .mockImplementationOnce(() => simpleQuery([{ total: 40, correct: 32, activeDays: 10, distinctTopics: 12 }]))
      .mockImplementationOnce(() => groupedQuery([
        { sessionId: "mock-1", total: 20, correct: 16 },
        { sessionId: "mock-2", total: 20, correct: 18 },
      ]))
      .mockImplementationOnce(() => simpleQuery([{ count: 20 }]))
      .mockImplementationOnce(() => simpleQuery([{ count: 8 }]));

    const result = await calculateReadinessSnapshot({ select } as any, {
      userId: 42,
      email: "learner@example.com",
      examType: "oit",
      now: new Date("2026-08-23T12:00:00Z"),
    });

    expect(result.hasData).toBe(true);
    expect(result.totalAttempts).toBe(40);
    expect(result.breakdown).toEqual({
      recentAccuracy: 80,
      mockAccuracy: 85,
      topicCoverage: 60,
      studyFrequency: 50,
      recentBonus: true,
    });
    expect(result.score).toBe(75);
  });

  it("does not invent a calibratable score when the learner has no attempts", async () => {
    const select = vi.fn()
      .mockImplementationOnce(() => simpleQuery([{ total: 0, correct: 0, activeDays: 0, distinctTopics: 0 }]))
      .mockImplementationOnce(() => groupedQuery([]))
      .mockImplementationOnce(() => simpleQuery([{ count: 11 }]))
      .mockImplementationOnce(() => simpleQuery([{ count: 0 }]));

    const result = await calculateReadinessSnapshot({ select } as any, {
      userId: null,
      email: "learner@example.com",
      examType: "oit",
    });

    expect(result.hasData).toBe(false);
    expect(result.score).toBe(0);
  });
});
