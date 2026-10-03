import { describe, expect, it } from "vitest";
import { getTutorFailureMessage, isTutorDismissKey, withoutTutorErrors } from "./tutorInteraction";

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

  it("keeps the study conversation but removes a transient provider error before retry", () => {
    expect(withoutTutorErrors([
      { role: "assistant", content: "Let's work through it." },
      { role: "user", content: "Show the formula." },
      { role: "assistant", content: "__ERROR__:The AI Tutor could not finish the explanation. Please retry." },
    ])).toEqual([
      { role: "assistant", content: "Let's work through it." },
      { role: "user", content: "Show the formula." },
    ]);
  });
});
