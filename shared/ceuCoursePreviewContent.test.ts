import { describe, expect, it } from "vitest";
import { CEU_COURSES } from "./ceuCourses";
import { calculateCeuPreviewScore } from "./ceuCoursePreviewContent";
import { CEU_PREVIEW_CURRICULUM, getCeuPreviewCourse } from "./ceuCoursePreviewCurriculum";

describe("CEU course preview curriculum", () => {
  it("provides a complete six-module lesson preview and eight-question final assessment for every catalogue course", () => {
    expect(CEU_PREVIEW_CURRICULUM.courses).toHaveLength(CEU_COURSES.length);

    for (const course of CEU_COURSES) {
      const preview = getCeuPreviewCourse(course.key);
      expect(preview).toBeDefined();
      expect(preview?.modules).toHaveLength(6);
      expect(preview?.modules.map((module) => module.title)).toEqual(course.modules.map((module) => module.title));
      expect(preview?.finalAssessment.questions).toHaveLength(8);
      expect(preview?.finalAssessment.passingScore).toBe(80);

      for (const module of preview?.modules ?? []) {
        expect(module.learningPoints).toHaveLength(3);
        expect(module.knowledgeCheck.choices).toHaveLength(4);
        expect(module.knowledgeCheck.correctIndex).toBeGreaterThanOrEqual(0);
        expect(module.knowledgeCheck.correctIndex).toBeLessThan(4);
      }

      for (const question of preview?.finalAssessment.questions ?? []) {
        expect(question.choices).toHaveLength(4);
        expect(question.correctIndex).toBeGreaterThanOrEqual(0);
        expect(question.correctIndex).toBeLessThan(4);
      }
    }
  });

  it("scores a completed assessment deterministically", () => {
    const assessment = CEU_PREVIEW_CURRICULUM.courses[0].finalAssessment.questions;
    const correctResponses = assessment.map((question) => question.correctIndex);
    const oneMissedResponse = [...correctResponses];
    oneMissedResponse[0] = (assessment[0].correctIndex + 1) % 4;

    expect(calculateCeuPreviewScore(assessment, correctResponses)).toEqual({ correct: 8, percentage: 100 });
    expect(calculateCeuPreviewScore(assessment, oneMissedResponse)).toEqual({ correct: 7, percentage: 88 });
  });
});
