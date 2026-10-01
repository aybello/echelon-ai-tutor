import { describe, expect, it } from "vitest";
import { formatAdminCurrency, formatAdminPercent, rateFromCounts } from "./adminDashboard";

describe("founder dashboard metric helpers", () => {
  it("does not turn unavailable commercial data into a false zero", () => {
    expect(formatAdminCurrency(undefined)).toBe("—");
    expect(formatAdminPercent(null)).toBe("—");
    expect(rateFromCounts(0, 0)).toBeNull();
  });

  it("formats available values consistently", () => {
    expect(formatAdminCurrency(249)).toBe("CA$249.00");
    expect(formatAdminPercent(14)).toBe("14%");
    expect(rateFromCounts(3, 8)).toBe(37.5);
  });
});
