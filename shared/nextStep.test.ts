import { describe, expect, it } from "vitest";
import { suggestNextStep, weakestModule, type NextStepInput } from "./nextStep";

/** A learner for whom no rule applies: the fifth, default suggestion. */
const calm: NextStepInput = {
  currentStreakDays: 0,
  practisedToday: false,
  missedQuestionCount: 0,
  modules: [{ name: "Hydraulics", attempts: 40, correct: 36 }],
  daysUntilExam: null,
  daysSinceLastMock: null,
};
const withInput = (changes: Partial<NextStepInput>): NextStepInput => ({ ...calm, ...changes });

describe("suggestNextStep: each rule", () => {
  it("rule 1: a streak at risk today asks for today's question", () => {
    const step = suggestNextStep(withInput({ currentStreakDays: 4, practisedToday: false }));
    expect(step.rule).toBe("streak");
    expect(step.message).toBe("Keep your streak: answer today's question.");
    expect(step.action).toEqual({ type: "question-of-the-day" });
  });

  it("rule 1 does not apply when the streak is already extended today", () => {
    expect(suggestNextStep(withInput({ currentStreakDays: 4, practisedToday: true })).rule).toBe("quick-10");
  });

  it("rule 1 does not apply when there is no streak to lose", () => {
    expect(suggestNextStep(withInput({ currentStreakDays: 0, practisedToday: false })).rule).toBe("quick-10");
  });

  it("rule 2: five or more missed questions suggests a review, with the count", () => {
    const step = suggestNextStep(withInput({ missedQuestionCount: 5 }));
    expect(step.rule).toBe("missed");
    expect(step.message).toBe("Review your 5 missed questions.");
    expect(step.action).toEqual({ type: "missed-questions" });
    expect(suggestNextStep(withInput({ missedQuestionCount: 12 })).message).toBe("Review your 12 missed questions.");
  });

  it("rule 2 needs five: four missed questions is not enough", () => {
    expect(suggestNextStep(withInput({ missedQuestionCount: 4 })).rule).toBe("quick-10");
  });

  it("rule 3: a module under 70% with at least 10 attempts is the weakest topic", () => {
    const step = suggestNextStep(withInput({ modules: [{ name: "Storage", attempts: 10, correct: 6 }] }));
    expect(step.rule).toBe("weak-topic");
    expect(step.message).toBe("Work on your weakest topic: Storage.");
    expect(step.action).toEqual({ type: "topic-practice", module: "Storage" });
  });

  it("rule 3 boundaries: exactly 70% is fine, and nine attempts is too few", () => {
    expect(suggestNextStep(withInput({ modules: [{ name: "Storage", attempts: 10, correct: 7 }] })).rule).toBe("quick-10");
    expect(suggestNextStep(withInput({ modules: [{ name: "Storage", attempts: 9, correct: 0 }] })).rule).toBe("quick-10");
  });

  it("rule 3 picks the lowest accuracy, and breaks a tie with the module that has more attempts", () => {
    const modules = [
      { name: "A", attempts: 20, correct: 12 }, // 60%
      { name: "B", attempts: 10, correct: 4 }, // 40%
      { name: "C", attempts: 30, correct: 12 }, // 40%, more attempts
    ];
    expect(weakestModule(modules)?.name).toBe("C");
    expect(weakestModule([modules[0], modules[1]])?.name).toBe("B");
  });

  it("rule 4: an exam within 14 days and no mock in the last 7 days suggests a mock exam", () => {
    const step = suggestNextStep(withInput({ daysUntilExam: 14, daysSinceLastMock: 7 }));
    expect(step.rule).toBe("mock-exam");
    expect(step.message).toBe("Take a mock exam.");
    expect(step.action).toEqual({ type: "mock-exam" });
    expect(suggestNextStep(withInput({ daysUntilExam: 0, daysSinceLastMock: null })).rule).toBe("mock-exam");
  });

  it("rule 4 boundaries: 15 days out, a mock 6 days ago, a past exam date and no exam date all skip it", () => {
    expect(suggestNextStep(withInput({ daysUntilExam: 15, daysSinceLastMock: null })).rule).toBe("quick-10");
    expect(suggestNextStep(withInput({ daysUntilExam: 10, daysSinceLastMock: 6 })).rule).toBe("quick-10");
    expect(suggestNextStep(withInput({ daysUntilExam: -1, daysSinceLastMock: null })).rule).toBe("quick-10");
    expect(suggestNextStep(withInput({ daysUntilExam: null, daysSinceLastMock: null })).rule).toBe("quick-10");
  });

  it("rule 5: otherwise offers another Quick 10", () => {
    const step = suggestNextStep(calm);
    expect(step.rule).toBe("quick-10");
    expect(step.message).toBe("Nice work. Another Quick 10?");
    expect(step.action).toEqual({ type: "quick-10" });
  });
});

describe("suggestNextStep: rule order", () => {
  const everything: NextStepInput = {
    currentStreakDays: 6,
    practisedToday: false,
    missedQuestionCount: 9,
    modules: [{ name: "Storage", attempts: 20, correct: 5 }],
    daysUntilExam: 3,
    daysSinceLastMock: null,
  };

  it("streak beats missed questions, weak topic and mock exam", () => {
    expect(suggestNextStep(everything).rule).toBe("streak");
  });

  it("missed questions beat weak topic and mock exam", () => {
    expect(suggestNextStep({ ...everything, practisedToday: true }).rule).toBe("missed");
  });

  it("weak topic beats mock exam", () => {
    expect(suggestNextStep({ ...everything, practisedToday: true, missedQuestionCount: 4 }).rule).toBe("weak-topic");
  });

  it("mock exam beats the default", () => {
    expect(suggestNextStep({ ...everything, practisedToday: true, missedQuestionCount: 4, modules: [] }).rule).toBe("mock-exam");
  });

  it("returns exactly one suggestion with a plain-language message and a button", () => {
    const step = suggestNextStep(everything);
    expect(Object.keys(step).sort()).toEqual(["action", "buttonLabel", "message", "rule"]);
    expect(step.message.length).toBeGreaterThan(0);
    expect(step.buttonLabel.length).toBeGreaterThan(0);
  });
});
