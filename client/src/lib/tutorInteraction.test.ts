import { describe, expect, it } from "vitest";
import { getTutorFailureMessage, isTutorDismissKey } from "./tutorInteraction";

describe("AI Tutor interaction helpers", () => {
  it("preserves a meaningful server error for learners", () => {
    expect(getTutorFailureMessage(new Error("An active Echelon course pass is required to use the AI Tutor.")))
      .toBe("An active Echelon course pass is required to use the AI Tutor.");
  });

  it("provides a safe fallback when no structured error is available", () => {
    expect(getTutorFailureMessage(null)).toBe("The AI Tutor could not respond just now. Please try again.");
  });

  it("treats only Escape as the global tutor-dismiss key", () => {
    expect(isTutorDismissKey("Escape")).toBe(true);
    expect(isTutorDismissKey("Enter")).toBe(false);
  });
});
