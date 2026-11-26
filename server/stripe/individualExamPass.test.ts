import { describe, expect, it } from "vitest";
import {
  getIndividualExamPassExpiry,
  individualExamPassCheckoutMetadata,
  INDIVIDUAL_EXAM_PASS_ENTITLEMENT_TYPE,
  INDIVIDUAL_EXAM_PASS_TERM_MONTHS,
  INDIVIDUAL_EXAM_PASS_POLICY_VERSION,
  usesTwelveMonthIndividualExamPassPolicy,
} from "./individualExamPass";

describe("Individual Exam Pass entitlements", () => {
  it("emits the exact checkout metadata contract required by the signed webhook", () => {
    expect(individualExamPassCheckoutMetadata()).toEqual({
      entitlement_type: INDIVIDUAL_EXAM_PASS_ENTITLEMENT_TYPE,
      individual_access_policy: INDIVIDUAL_EXAM_PASS_POLICY_VERSION,
    });
  });

  it("issues 12 calendar months of access from successful payment", () => {
    const paidAt = new Date("2026-09-21T14:30:00.000Z");
    const expiry = getIndividualExamPassExpiry(paidAt);

    expect(INDIVIDUAL_EXAM_PASS_TERM_MONTHS).toBe(12);
    expect(expiry.toISOString()).toBe("2027-09-21T14:30:00.000Z");
    expect(paidAt.toISOString()).toBe("2026-09-21T14:30:00.000Z");
  });

  it("uses the last day of February after a leap-day payment", () => {
    expect(getIndividualExamPassExpiry(new Date("2028-02-29T09:00:00.000Z")).toISOString())
      .toBe("2029-02-28T09:00:00.000Z");
  });

  it("preserves valid month-end days and the exact UTC time", () => {
    expect(getIndividualExamPassExpiry(new Date("2027-01-31T23:59:59.123Z")).toISOString())
      .toBe("2028-01-31T23:59:59.123Z");
    expect(getIndividualExamPassExpiry(new Date("2027-03-31T00:00:00.000Z")).toISOString())
      .toBe("2028-03-31T00:00:00.000Z");
  });

  it("applies the new term only to explicitly versioned checkout sessions", () => {
    expect(usesTwelveMonthIndividualExamPassPolicy(INDIVIDUAL_EXAM_PASS_POLICY_VERSION)).toBe(true);
    expect(usesTwelveMonthIndividualExamPassPolicy(undefined)).toBe(false);
    expect(usesTwelveMonthIndividualExamPassPolicy("2026-09-17")).toBe(false);
  });
});
