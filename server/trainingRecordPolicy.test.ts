import { describe, expect, it } from "vitest";
import { isValidReportRange, isWithinDailyOjtLimit, OJT_MAX_HOURS_PER_DAY } from "./trainingRecordPolicy";

describe("training record policy", () => {
  it("keeps a manager-entered training day at or below the seven-hour cap", () => {
    expect(OJT_MAX_HOURS_PER_DAY).toBe(7);
    expect(isWithinDailyOjtLimit(5.5, 1.5)).toBe(true);
    expect(isWithinDailyOjtLimit(6.75, 0.25)).toBe(true);
    expect(isWithinDailyOjtLimit(6.75, 0.5)).toBe(false);
  });

  it("accepts chronological report ranges up to three years and rejects invalid ranges", () => {
    expect(isValidReportRange(new Date("2026-01-01T00:00:00Z"), new Date("2028-12-31T00:00:00Z"))).toBe(true);
    expect(isValidReportRange(new Date("2026-01-02T00:00:00Z"), new Date("2026-01-01T00:00:00Z"))).toBe(false);
    expect(isValidReportRange(new Date("2026-01-01T00:00:00Z"), new Date("2030-01-02T00:00:00Z"))).toBe(false);
  });
});
