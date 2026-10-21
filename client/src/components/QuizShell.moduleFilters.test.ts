import { describe, expect, it } from "vitest";
import {
  canNavigateToPreviousAnswer,
  shouldClearUnavailableSelectedModule,
  shouldShowPracticeQuestionStatus,
} from "./QuizShell";

describe("shouldClearUnavailableSelectedModule", () => {
  const liveModules = [{ name: "Water Treatment" }];

  it("clears a stale deep-linked module after a bank repair", () => {
    expect(shouldClearUnavailableSelectedModule("Coagulation & Flocculation", liveModules)).toBe(true);
  });

  it("keeps an exact module value that the learner-visible bank supports", () => {
    expect(shouldClearUnavailableSelectedModule("Water Treatment", liveModules)).toBe(false);
  });

  it("waits for module metadata before clearing a selected topic", () => {
    expect(shouldClearUnavailableSelectedModule("Water Treatment", [])).toBe(false);
  });

  it("does not change an all-modules selection", () => {
    expect(shouldClearUnavailableSelectedModule(null, liveModules)).toBe(false);
  });

  it("treats an empty selected value as all modules", () => {
    expect(shouldClearUnavailableSelectedModule("", liveModules)).toBe(false);
    expect(shouldClearUnavailableSelectedModule("   ", liveModules)).toBe(false);
  });
});

describe("canNavigateToPreviousAnswer", () => {
  const history = [{ questionId: 1 }, { questionId: 2 }];

  it("keeps Back available for an unanswered delivered question after recorded answers", () => {
    expect(canNavigateToPreviousAnswer(history, 3, false)).toBe(true);
  });

  it("keeps Back available for a later confirmed answer", () => {
    expect(canNavigateToPreviousAnswer(history, 2, true)).toBe(true);
  });

  it("hides Back at the first displayed confirmed answer", () => {
    expect(canNavigateToPreviousAnswer(history, 1, true)).toBe(false);
  });
});

describe("practice delivery status presentation", () => {
  it("keeps normal loading out of the recovery panel", () => {
    expect(shouldShowPracticeQuestionStatus("loading")).toBe(false);
    expect(shouldShowPracticeQuestionStatus(undefined)).toBe(false);
  });

  it("keeps recovery controls for a real error or empty valid selection", () => {
    expect(shouldShowPracticeQuestionStatus("error")).toBe(true);
    expect(shouldShowPracticeQuestionStatus("empty")).toBe(true);
  });
});
