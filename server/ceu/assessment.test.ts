import { describe, expect, it } from "vitest";
import { ceuCurricula } from "./catalogue";
import { ceuExamQuestions, ceuSampleQuestions, issueCeuExam } from "./assessment";
import legacy from "./legacyAssessments.json";

describe("CEU server-issued finals", () => {
  it("keeps module coverage, unique questions and keyed choice mapping in every draw", () => {
    for (const course of ceuCurricula) for (let draw = 0; draw < 12; draw++) {
      const manifest = issueCeuExam(course);
      const questions = ceuExamQuestions(course, manifest);
      expect(questions).toHaveLength(course.finalAssessment.length);
      expect(new Set(questions.map(q => q.id)).size).toBe(questions.length);
      for (const module of course.modules) expect(questions.filter(q => q.objective === module.id)).toHaveLength(5);
      for (const q of questions) {
        const original = [...course.finalAssessment, ...(course.alternateFinalAssessment ?? [])].find(item => item.id === q.id)!;
        expect(q.choices[q.correctIndex]).toBe(original.choices[original.correctIndex]);
      }
      const sampleIds = ceuSampleQuestions(course).map(q => q.id);
      expect(questions.some(q => sampleIds.includes(q.id))).toBe(false);
    }
  });
  it("keeps legacy ordering and rejects damaged manifests instead of misgrading", () => {
    const c = ceuCurricula[0];
    const archive = legacy[c.key as keyof typeof legacy];
    expect(ceuExamQuestions(c)).toEqual(archive.primary);
    for (const q of [...archive.primary, ...archive.alternate]) {
      const [restored] = ceuExamQuestions(c, [{ questionId: q.id, choiceOrder: [3, 2, 1, 0] }]);
      expect(restored.choices[restored.correctIndex]).toBe(q.choices[q.correctIndex]);
    }
    expect(() => ceuExamQuestions(c, [{ questionId: c.finalAssessment[0].id, choiceOrder: [0, 0, 2, 3] }])).toThrow("preserved");
  });
});
