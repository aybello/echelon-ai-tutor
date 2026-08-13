import { describe, expect, it } from "vitest";
import {
  getIndividualExamPassExpiry,
  INDIVIDUAL_EXAM_PASS_ENTITLEMENT_TYPE,
} from "./individualExamPass";

describe("Individual Exam Pass expiry", () => {
  it("gives new marked checkouts 12 calendar months of access", () => {
    const expiry = getIndividualExamPassExpiry(
      {
        entitlement_type: INDIVIDUAL_EXAM_PASS_ENTITLEMENT_TYPE,
        access_term_months: "12",
      },
      new Date("2028-02-29T15:30:00Z"),
    );

    expect(expiry?.toISOString()).toBe("2029-02-28T15:30:00.000Z");
  });

  it("grandfathers older purchases without the new entitlement marker", () => {
    expect(getIndividualExamPassExpiry(undefined, new Date())).toBeNull();
    expect(getIndividualExamPassExpiry({ product_key: "oit" }, new Date())).toBeNull();
  });

  it("rejects malformed term metadata instead of granting permanent access", () => {
    expect(() => getIndividualExamPassExpiry(
      {
        entitlement_type: INDIVIDUAL_EXAM_PASS_ENTITLEMENT_TYPE,
        access_term_months: "6",
      },
      new Date(),
    )).toThrow("invalid access-term metadata");
  });
});
