import { describe, expect, it, vi } from "vitest";
import {
  getAllProductKpiJourneyEvents,
  getExactAnalyticsEventCounts,
  TRAINING_METRIC_EVENT_NAMES,
} from "./analyticsAggregates";

describe("exact analytics event aggregation", () => {
  it("returns complete totals without applying a row limit", async () => {
    const limit = vi.fn(() => {
      throw new Error("exact event totals must never be capped");
    });
    const groupBy = vi.fn().mockResolvedValue([
      { eventName: "training_session_started", total: 100_001 },
      { eventName: "training_session_completed", total: "98" },
    ]);
    const where = vi.fn().mockReturnValue({ groupBy, limit });
    const from = vi.fn().mockReturnValue({ where });
    const select = vi.fn().mockReturnValue({ from });

    const totals = await getExactAnalyticsEventCounts(
      { select } as any,
      new Date("2026-09-01T00:00:00.000Z"),
      TRAINING_METRIC_EVENT_NAMES,
    );

    expect(totals.get("training_session_started")).toBe(100_001);
    expect(totals.get("training_session_completed")).toBe(98);
    expect(totals.get("training_hours_exported")).toBeUndefined();
    expect(limit).not.toHaveBeenCalled();
    expect(groupBy).toHaveBeenCalledOnce();
  });

  it("paginates every KPI journey event instead of dropping rows after a cap", async () => {
    const firstPage = [
      { id: 1, eventName: "pricing_viewed", occurredAt: new Date("2026-09-01T00:00:00Z"), userId: null, emailHash: null, anonymousHash: "a", examType: null, metadata: null },
      { id: 2, eventName: "checkout_completed", occurredAt: new Date("2026-09-01T00:01:00Z"), userId: null, emailHash: "e", anonymousHash: "a", examType: null, metadata: null },
    ];
    const secondPage = [
      { id: 3, eventName: "quiz_started", occurredAt: new Date("2026-09-01T00:02:00Z"), userId: "u", emailHash: "e", anonymousHash: null, examType: "oit", metadata: null },
    ];
    const limit = vi.fn()
      .mockResolvedValueOnce(firstPage)
      .mockResolvedValueOnce(secondPage);
    const orderBy = vi.fn().mockReturnValue({ limit });
    const where = vi.fn().mockReturnValue({ orderBy });
    const from = vi.fn().mockReturnValue({ where });
    const select = vi.fn().mockReturnValue({ from });

    const events = await getAllProductKpiJourneyEvents(
      { select } as any,
      new Date("2026-09-01T00:00:00Z"),
      2,
    );

    expect(events.map(event => event.eventName)).toEqual([
      "pricing_viewed",
      "checkout_completed",
      "quiz_started",
    ]);
    expect(events.every(event => !("id" in event))).toBe(true);
    expect(limit).toHaveBeenCalledTimes(2);
    expect(limit).toHaveBeenNthCalledWith(1, 2);
    expect(limit).toHaveBeenNthCalledWith(2, 2);
  });
});
