import { describe, expect, it } from "vitest";
import { validateApprovalSteps } from "./questionApproval";
describe("worked-step approval gate", () => {
  it.each([null, "", "[]", '[{"l":"Answer","c":"42"}]'])("requires multi-step calculation solutions: %s", steps => {
    expect(validateApprovalSteps(steps, true)).not.toBeNull();
  });
  it.each(['[{"l":"Security","c":"broken)}"]', "null", "{}", '[{"l":"Correction without a body"}]', '[{"l":"","c":"body"}]', '[null]'])("rejects malformed supplied steps: %s", steps => {
    expect(validateApprovalSteps(steps, false)).not.toBeNull();
  });
  it("accepts complete canonical and legacy step aliases", () => {
    expect(validateApprovalSteps('[{"l":"Formula","c":"Q × C"},{"l":"Calculate","c":"76.7 mg/L"}]', true)).toBeNull();
    expect(validateApprovalSteps('[{"label":"Formula","content":"Q × C"},{"label":"Calculate","content":"76.7 mg/L"}]', true)).toBeNull();
    expect(validateApprovalSteps(null, false)).toBeNull();
  });
});
