import { describe, expect, it } from "vitest";
import { ceuCurricula, publicCeuCourse } from "./catalogue";
import { CEU_COURSES } from "../../shared/ceuCourses";

describe("CEU curriculum release integrity", () => {
  it("has ten distinct curricula matching public metadata and planned activities", () => {
    expect(ceuCurricula).toHaveLength(10);
    expect(new Set(ceuCurricula.map(c => c.key)).size).toBe(10);
    expect(ceuCurricula.filter(c => c.plannedMinutes === 600)).toHaveLength(3);
    for (const c of ceuCurricula) {
      const publicCourse = CEU_COURSES.find(p => p.key === c.key)!;
      expect(publicCourse.title).toBe(c.title);
      expect(publicCourse.plannedContactHours * 60).toBe(c.plannedMinutes);
      expect(
        c.modules.reduce(
          (sum, m) => sum + m.activities.reduce((s, a) => s + a.minutes, 0),
          0
        )
      ).toBe(c.plannedMinutes);
      expect(publicCourse.modules.map(m => m.title)).toEqual(
        c.modules.map(m => m.title)
      );
      expect(c.modules).toHaveLength(c.plannedMinutes === 600 ? 6 : 4);
      expect(c.finalAssessment).toHaveLength(c.modules.length * 5);
      expect(c.alternateFinalAssessment).toHaveLength(c.modules.length * 5);
      const ids = c.modules
        .flatMap(m => m.checks)
        .concat(c.finalAssessment, c.alternateFinalAssessment ?? [])
        .map(q => q.id);
      expect(new Set(ids).size).toBe(ids.length);
      const prompts = c.modules
        .flatMap(m => m.checks)
        .concat(c.finalAssessment, c.alternateFinalAssessment ?? [])
        .map(q => q.prompt.toLowerCase().replace(/\W+/g, " ").trim());
      expect(new Set(prompts).size).toBe(prompts.length);
      for (const m of c.modules) {
        expect(m.objectives.length).toBeGreaterThanOrEqual(2);
        expect(m.lesson.length).toBeGreaterThan(600);
        expect(m.lesson).toContain("###");
        expect((m.lesson.match(/^###\s/gm) ?? []).length).toBeGreaterThanOrEqual(4);
        expect(m.evidence.length).toBeGreaterThan(120);
        expect(m.evidence.toLowerCase()).toContain("fictional");
        expect(m.assignment.length).toBeGreaterThan(100);
        expect(m.facilitatorGuide.length).toBeGreaterThan(200);
        expect(m.rubric.length).toBeGreaterThanOrEqual(3);
        expect(m.checks).toHaveLength(6);
        expect(
          c.finalAssessment.filter(q => q.objective === m.id)
        ).toHaveLength(5);
        expect(
          (c.alternateFinalAssessment ?? []).filter(q => q.objective === m.id)
        ).toHaveLength(5);
        for (const source of m.sourceIds)
          expect(c.sources.some(s => s.id === source)).toBe(true);
      }
      for (const q of c.modules
        .flatMap(m => m.checks)
        .concat(c.finalAssessment, c.alternateFinalAssessment ?? [])) {
        expect(q.choices).toHaveLength(4);
        expect(new Set(q.choices).size).toBe(4);
        expect(q.correctIndex).toBeGreaterThanOrEqual(0);
        expect(q.correctIndex).toBeLessThan(4);
        expect(q.explanation.length).toBeGreaterThan(15);
        expect(`${q.prompt} ${q.choices.join(" ")} ${q.explanation}`).not.toContain("—");
      }
      expect(c.modules.at(-1)?.activities.at(-1)?.instruction).toContain(
        "final assessment"
      );
    }
  });
  it("does not disclose final answers, formative keys or marking guides publicly", () => {
    for (const c of ceuCurricula) {
      const text = JSON.stringify(publicCeuCourse(c));
      expect(text).not.toContain("correctIndex");
      expect(text).not.toContain("facilitatorGuide");
      expect(text).not.toContain("finalAssessment");
      expect(text).not.toContain('"explanation":');
      for (const q of [...c.finalAssessment, ...(c.alternateFinalAssessment ?? [])])
        expect(text).not.toContain(JSON.stringify(q.prompt));
    }
  });
  it("does not reward a fixed answer position or longest/shortest-choice shortcut", () => {
    for (const c of ceuCurricula) {
      const questions = [...c.finalAssessment, ...(c.alternateFinalAssessment ?? [])];
      for (let position = 0; position < 4; position++)
        expect(
          questions.filter(q => q.correctIndex === position).length /
            questions.length
        ).toBeLessThanOrEqual(0.34);
      for (const direction of [1, -1]) {
        const score = questions.filter(
          q =>
            q.choices
              .map((s, i) => ({ i, n: s.length }))
              .sort((a, b) => direction * (a.n - b.n))[0].i === q.correctIndex
        ).length;
        expect(
          score / questions.length,
          `${c.key} length heuristic`
        ).toBeLessThanOrEqual(0.5);
      }
    }
  });
});
