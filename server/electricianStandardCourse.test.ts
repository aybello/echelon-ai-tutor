import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { getCourseByKey, getRouteForCourse } from "@shared/courseRegistry";
import { FREE_EXAM_TYPES, resolveAccess } from "./_core/access";

describe("Ontario 309A standard Echelon course", () => {
  it("is registered as an active free course with the canonical study-tool route family", () => {
    const course = getCourseByKey("electrician-309a");
    expect(course).toMatchObject({
      courseKey: "electrician-309a",
      examFamily: "ontario",
      track: "construction-electrician",
      quizPath: "/electrician-309a",
      mockExamPath: "/electrician-309a-mock",
      flashcardPath: "/electrician-309a-flashcards",
      teamAssignable: false,
      isActive: true,
    });
    expect(getRouteForCourse("electrician-309a").mockExamPath).toBe("/electrician-309a-mock");
  });

  it("keeps the complete 309A standard course free without a purchase entitlement", async () => {
    expect(FREE_EXAM_TYPES.has("electrician-309a")).toBe(true);
    await expect(resolveAccess(null, "electrician-309a")).resolves.toEqual({ hasAccess: true, isOwner: false });
  });

  it("uses shared quiz, mock, and flashcard components instead of the old standalone practice surface", () => {
    const practice = readFileSync("client/src/pages/Electrician309APractice.tsx", "utf8");
    const mock = readFileSync("client/src/pages/Electrician309AMockExam.tsx", "utf8");
    const flashcards = readFileSync("client/src/pages/Electrician309AFlashcards.tsx", "utf8");
    expect(practice).toContain("QuizShell");
    expect(practice).toContain("renderQuestionSupplement");
    expect(practice).toContain("renderModuleSupplement");
    expect(mock).toContain("MockExamShell");
    expect(mock).toContain("renderQuestionSupplement");
    expect(mock).toContain("freeAccess");
    expect(flashcards).toContain("FlashcardShell");
    expect(flashcards).toContain("selectElectrician309AFlashcards");
    expect(flashcards).toContain("renderFrontSupplement");
    expect(practice).not.toContain("ElectricianCourseWorkspace");
    expect(mock).not.toContain("ElectricianCourseWorkspace");
  });
});
