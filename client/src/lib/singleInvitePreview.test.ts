import { describe, expect, it } from "vitest";
import { prepareSingleInvitePreview } from "./singleInvitePreview";

describe("single Course Pass invitation preview", () => {
  it("prepares a one-recipient confirmation preview with a normalized email", () => {
    expect(prepareSingleInvitePreview({
      licenceId: 42,
      operatorEmail: "  Operator@Utility.ca ",
      courseName: "Class 4 Wastewater Practice Pass",
      termMonths: 6,
    })).toEqual({
      licenceId: 42,
      operatorEmail: "operator@utility.ca",
      courseName: "Class 4 Wastewater Practice Pass",
      termMonths: 6,
    });
  });

  it("does not create a confirmation preview without a recipient", () => {
    expect(prepareSingleInvitePreview({
      licenceId: 42,
      operatorEmail: "   ",
      courseName: "Class 4 Wastewater Practice Pass",
      termMonths: 6,
    })).toBeNull();
  });
});
