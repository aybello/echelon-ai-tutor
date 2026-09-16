import { describe, expect, it } from "vitest";
import {
  formatQuestionBankDescription,
  formatQuestionBankTitle,
} from "./questionBankInventory";

describe("question-bank inventory copy", () => {
  it("renders the authoritative loaded inventory instead of a stale hard-coded claim", () => {
    expect(formatQuestionBankTitle("OIT", 489)).toBe("OIT Practice Quiz — 489 Questions");
    expect(formatQuestionBankDescription("Ontario OIT", 489, "Water Treatment")).toContain("489 practice questions");
  });

  it("uses neutral copy while metadata is still loading", () => {
    expect(formatQuestionBankTitle("OIT", 0)).toBe("OIT Practice Quiz");
    expect(formatQuestionBankDescription("Ontario OIT", 0, "Water Treatment")).not.toMatch(/\d+ practice questions/);
  });
});
