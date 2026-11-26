import { describe, expect, it } from "vitest";
import {
  getTutorFailureMessage,
  isTutorAllowanceMessage,
  isTutorDismissKey,
  isTutorPurchasePrompt,
  withoutTutorErrors,
} from "./tutorInteraction";

// These are the exact strings the server sends. Copied verbatim from
// server/routers.ts and server/_core/aiTutorPolicy.ts so the detector cannot
// drift away from the real wording without this test failing.
const FREE_PREVIEW_CAP =
  "You have used your 3 free AI Tutor messages. Unlock the OIT Exam Pass to keep asking questions.";
const PAID_DAILY_CAP =
  "You have reached today's AI Tutor message limit. Please continue tomorrow or use the course explanations and study guides.";
const PROVIDER_FAILURE =
  "The AI Tutor could not finish the explanation. Please retry. Your question is still here.";

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

describe("a used-up allowance is a purchase moment, not a retry", () => {
  it("sends a free visitor who hit the cap to the purchase page", () => {
    expect(isTutorPurchasePrompt(FREE_PREVIEW_CAP)).toBe(true);
  });

  it("never offers to sell the tutor again to a learner who already paid", () => {
    // A paid learner hitting the higher daily cap must not be shown a buy button.
    expect(isTutorPurchasePrompt(PAID_DAILY_CAP)).toBe(false);
  });

  it("suppresses Retry for both caps, because retrying cannot succeed today", () => {
    expect(isTutorAllowanceMessage(FREE_PREVIEW_CAP)).toBe(true);
    expect(isTutorAllowanceMessage(PAID_DAILY_CAP)).toBe(true);
  });

  it("still offers Retry for a genuine provider failure", () => {
    expect(isTutorAllowanceMessage(PROVIDER_FAILURE)).toBe(false);
    expect(isTutorPurchasePrompt(PROVIDER_FAILURE)).toBe(false);
  });

  it("does not mistake an access error for a spent allowance", () => {
    const noAccess = "An active Echelon course pass is required to use the AI Tutor.";
    expect(isTutorAllowanceMessage(noAccess)).toBe(false);
    expect(isTutorPurchasePrompt(noAccess)).toBe(false);
  });
});
