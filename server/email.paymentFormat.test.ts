import { describe, expect, it } from "vitest";
import { formatPurchasePaymentAmount } from "./email";

describe("formatPurchasePaymentAmount", () => {
  it("formats the CAD-only checkout default in Canadian dollars", () => {
    expect(formatPurchasePaymentAmount(24_900)).toBe("CA$249.00");
  });

  it("preserves the actual historical currency on a pre-cutover receipt", () => {
    expect(formatPurchasePaymentAmount(17_900, "usd")).toBe("US$179.00");
  });
});
