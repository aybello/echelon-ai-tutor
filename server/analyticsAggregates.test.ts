import { describe, expect, it, vi } from "vitest";
import {
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
});
