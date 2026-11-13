import { describe, expect, it } from "vitest";
import { purchaseAccessLabel, purchaseAccessSummary } from "./email";

describe("purchaseAccessSummary", () => {
  it("discloses the exact recorded expiry for a new Individual Exam Pass", () => {
    expect(purchaseAccessSummary(new Date("2027-09-21T14:30:00.000Z")))
      .toBe("Access expires September 21, 2027 at 14:30 UTC.");
  });

  it("does not invent a term for historical purchases without an expiry", () => {
    expect(purchaseAccessSummary(null))
      .toBe("Your recorded access term is available in your account.");
  });

  it("uses the recorded-term fallback for an invalid serialized expiry", () => {
    expect(purchaseAccessLabel("not-a-date"))
      .toBe("Your recorded access term is available in your account");
  });

  it("handles serialized queue payload timestamps", () => {
    expect(purchaseAccessSummary("2027-09-21T14:30:00.000Z"))
      .toBe("Access expires September 21, 2027 at 14:30 UTC.");
  });

  it("uses a punctuation-free label inside the purchase summary card", () => {
    expect(purchaseAccessLabel("2027-09-21T14:30:00.000Z"))
      .toBe("Access expires September 21, 2027 at 14:30 UTC");
  });
});
