import { describe, it, expect } from "vitest";
import { evaluateTriggers, wrapEmailHtml } from "./jobs/triggerEngine";
import type { StudentData } from "./jobs/triggerEngine";

/** Helper to build a StudentData object with sensible defaults */
function makeStudent(overrides: Partial<StudentData> = {}): StudentData {
  return {
    userId: 1,
    studentEmail: null,
    name: "Jane",
    email: "jane@example.com",
    profile: {
      examType: "class1-water",
      weakTopics: ["Hydraulics", "Regulations"],
      strongTopics: ["Disinfection"],
      totalAttempts: 50,
      totalSessions: 5,
      currentStreak: 3,
      longestStreak: 7,
      lastActiveDate: new Date().toISOString().split("T")[0],
      topicAccuracy: {
        Hydraulics: { correct: 5, total: 20 },
        Regulations: { correct: 8, total: 15 },
        Disinfection: { correct: 18, total: 20 },
      },
    },
    examDate: null,
    examProductKey: null,
    recentAttempts: 30,
    recentCorrectRate: 0.7,
    previousCorrectRate: 0.65,
    ...overrides,
  };
}

describe("Trigger Engine — evaluateTriggers", () => {
  it("returns null when student is doing well (no triggers)", () => {
    const student = makeStudent({
      recentAttempts: 30,
      recentCorrectRate: 0.75,
      previousCorrectRate: 0.65,
    });
    const result = evaluateTriggers(student);
    expect(result).toBeNull();
  });

  it("triggers 'struggling' when accuracy < 50% with 20+ recent attempts", () => {
    const student = makeStudent({
      recentAttempts: 25,
      recentCorrectRate: 0.38,
    });
    const result = evaluateTriggers(student);
    expect(result).not.toBeNull();
    expect(result!.type).toBe("struggling");
    expect(result!.cooldownDays).toBe(7);
    expect(result!.subject).toContain("Class 1 Water Treatment");
  });

  it("does NOT trigger 'struggling' with < 20 attempts even if accuracy is low", () => {
    const student = makeStudent({
      recentAttempts: 10,
      recentCorrectRate: 0.3,
    });
    const result = evaluateTriggers(student);
    // Should not be struggling because not enough attempts
    expect(result?.type).not.toBe("struggling");
  });

  it("triggers 'plateau' when accuracy hasn't changed between weeks (30+ attempts)", () => {
    const student = makeStudent({
      recentAttempts: 35,
      recentCorrectRate: 0.62,
      previousCorrectRate: 0.61, // within 3%
    });
    const result = evaluateTriggers(student);
    expect(result).not.toBeNull();
    expect(result!.type).toBe("plateau");
    expect(result!.cooldownDays).toBe(14);
  });

  it("does NOT trigger 'plateau' when accuracy improved by more than 3%", () => {
    const student = makeStudent({
      recentAttempts: 35,
      recentCorrectRate: 0.72,
      previousCorrectRate: 0.61, // 11% improvement
    });
    const result = evaluateTriggers(student);
    expect(result?.type).not.toBe("plateau");
  });

  it("triggers 'inactive' when no activity for 5+ days with 20+ total attempts", () => {
    const fiveDaysAgo = new Date(Date.now() - 6 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split("T")[0];
    const student = makeStudent({
      recentAttempts: 0,
      recentCorrectRate: null,
      previousCorrectRate: null,
      profile: {
        examType: "class1-water",
        weakTopics: ["Hydraulics"],
        strongTopics: ["Disinfection"],
        totalAttempts: 100,
        totalSessions: 10,
        currentStreak: 0,
        longestStreak: 7,
        lastActiveDate: fiveDaysAgo,
        topicAccuracy: {},
      },
    });
    const result = evaluateTriggers(student);
    expect(result).not.toBeNull();
    expect(result!.type).toBe("inactive");
    expect(result!.cooldownDays).toBe(10);
  });

  it("does NOT trigger 'inactive' when student was active recently", () => {
    const today = new Date().toISOString().split("T")[0];
    const student = makeStudent({
      profile: {
        examType: "class1-water",
        weakTopics: [],
        strongTopics: [],
        totalAttempts: 100,
        totalSessions: 10,
        currentStreak: 3,
        longestStreak: 7,
        lastActiveDate: today,
        topicAccuracy: {},
      },
    });
    // Student is active, so no inactive trigger
    const result = evaluateTriggers(student);
    expect(result?.type).not.toBe("inactive");
  });

  it("triggers 'exam_approaching' when exam in 3 days and inactive for 2+ days", () => {
    const threeDaysFromNow = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000);
    const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split("T")[0];
    const student = makeStudent({
      examDate: threeDaysFromNow,
      examProductKey: "class1-water",
      recentAttempts: 0,
      recentCorrectRate: null,
      profile: {
        examType: "class1-water",
        weakTopics: ["Hydraulics"],
        strongTopics: ["Disinfection"],
        totalAttempts: 50,
        totalSessions: 5,
        currentStreak: 0,
        longestStreak: 5,
        lastActiveDate: threeDaysAgo,
        topicAccuracy: {},
      },
    });
    const result = evaluateTriggers(student);
    expect(result).not.toBeNull();
    expect(result!.type).toBe("exam_approaching");
    expect(result!.cooldownDays).toBe(2);
  });

  it("triggers 'milestone' when student crosses 100 attempts", () => {
    const student = makeStudent({
      recentAttempts: 15,
      recentCorrectRate: 0.8,
      previousCorrectRate: 0.7,
      profile: {
        examType: "oit",
        weakTopics: [],
        strongTopics: ["Disinfection", "Regulations"],
        totalAttempts: 105, // just crossed 100
        totalSessions: 10,
        currentStreak: 5,
        longestStreak: 5,
        lastActiveDate: new Date().toISOString().split("T")[0],
        topicAccuracy: {
          Disinfection: { correct: 40, total: 50 },
          Regulations: { correct: 35, total: 50 },
        },
      },
    });
    const result = evaluateTriggers(student);
    expect(result).not.toBeNull();
    expect(result!.type).toBe("milestone");
    expect(result!.subject).toContain("100");
  });

  it("does NOT trigger 'milestone' when well past the milestone threshold", () => {
    const student = makeStudent({
      recentAttempts: 15,
      recentCorrectRate: 0.8,
      previousCorrectRate: 0.7,
      profile: {
        examType: "oit",
        weakTopics: [],
        strongTopics: ["Disinfection"],
        totalAttempts: 150, // past 100 by more than 20
        totalSessions: 15,
        currentStreak: 5,
        longestStreak: 10,
        lastActiveDate: new Date().toISOString().split("T")[0],
        topicAccuracy: {},
      },
    });
    const result = evaluateTriggers(student);
    expect(result?.type).not.toBe("milestone");
  });

  it("returns null when student has no profile", () => {
    const student = makeStudent({ profile: null });
    const result = evaluateTriggers(student);
    expect(result).toBeNull();
  });
});

describe("Trigger Engine — wrapEmailHtml", () => {
  it("wraps plain text body into branded HTML email", () => {
    const html = wrapEmailHtml(
      "Jane, you're doing great!\n\nKeep studying.\n\n— The Echelon Institute Team",
      "Keep it up!"
    );
    expect(html).toContain("Keep it up!");
    expect(html).toContain("Jane, you're doing great!");
    expect(html).toContain("Continue Studying");
    expect(html).toContain("echeloninstitute.ca");
    expect(html).toContain("<!DOCTYPE html>");
  });

  it("converts paragraph breaks into separate <p> tags", () => {
    const html = wrapEmailHtml("Para 1\n\nPara 2\n\nPara 3", "Test");
    const pCount = (html.match(/<p style/g) || []).length;
    expect(pCount).toBeGreaterThanOrEqual(3);
  });
});

describe("Trigger Engine — priority ordering", () => {
  it("struggling takes priority over plateau", () => {
    // Student has both low accuracy AND plateau conditions
    const student = makeStudent({
      recentAttempts: 35,
      recentCorrectRate: 0.42,
      previousCorrectRate: 0.41,
    });
    const result = evaluateTriggers(student);
    expect(result).not.toBeNull();
    expect(result!.type).toBe("struggling"); // struggling checked first
  });

  it("inactive is evaluated before exam_approaching (evaluation order)", () => {
    const twoDaysFromNow = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000);
    const sixDaysAgo = new Date(Date.now() - 6 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split("T")[0];
    const student = makeStudent({
      examDate: twoDaysFromNow,
      examProductKey: "class1-water",
      recentAttempts: 0,
      recentCorrectRate: null,
      previousCorrectRate: null,
      profile: {
        examType: "class1-water",
        weakTopics: ["Hydraulics"],
        strongTopics: [],
        totalAttempts: 50,
        totalSessions: 5,
        currentStreak: 0,
        longestStreak: 5,
        lastActiveDate: sixDaysAgo,
        topicAccuracy: {},
      },
    });
    const result = evaluateTriggers(student);
    expect(result).not.toBeNull();
    // inactive is checked before exam_approaching in the evaluation order
    // both conditions match, but inactive fires first
    expect(result!.type).toBe("inactive");
  });
});
