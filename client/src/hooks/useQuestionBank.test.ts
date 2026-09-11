import { describe, expect, it } from "vitest";
import { resolveQuestionBankTotal } from "./useQuestionBank";

describe("resolveQuestionBankTotal", () => {
  it("uses the authoritative server metadata count for lazy quiz pages", () => {
    expect(resolveQuestionBankTotal("966")).toBe(966);
    expect(resolveQuestionBankTotal(974)).toBe(974);
  });

  it("does not turn a missing or malformed metadata value into a false count", () => {
    expect(resolveQuestionBankTotal(undefined)).toBe(0);
    expect(resolveQuestionBankTotal("not-a-count", 716)).toBe(716);
    expect(resolveQuestionBankTotal(-1, 716)).toBe(716);
  });
});
