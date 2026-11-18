import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { gunzipSync } from "node:zlib";
import type { CeuCurriculum } from "../../shared/ceuLearning";
import { ceuCourse, publicCeuCourse } from "./catalogue";
import { ceuExamQuestions, issueCeuExam } from "./assessment";
import { newCeuRecord, transitionCeu } from "./learningState";
import { ceuModuleSlides } from "../../shared/ceuSlides";
import legacy from "./legacyAssessments.json";
import managedMedia from "../../shared/ceuManagedMedia.json";

// Exact course JSON bytes from 4c4c105de457dbc5b7a775c64ac8240f613158a5.
// Keep the baseline local: CI's depth-one checkout does not include that commit.
const baselineBytes = readFileSync(new URL("./fixtures/content-feedback-baseline-4c4c105d.json.gz", import.meta.url));
expect(createHash("sha256").update(baselineBytes).digest("hex")).toBe("74a6d4a594e11a7f2a954b499b18f0eaeade7dc92eb9f6e3ad54bd3bf7a6762d");
const baselineSources = JSON.parse(gunzipSync(baselineBytes).toString("utf8")) as Record<string, string>;
const baselineCourse = (name: string) => JSON.parse(baselineSources[name]) as CeuCurriculum;

const names = ["chlorination-principles", "basic-instrumentation", "water-distribution-overview", "supervisor-essentials"];
const course = (name: string) => ceuCourse(`ceu-${name}`)!;
const question = (name: string, suffix: string) => course(name).finalAssessment.find(q => q.id.endsWith(suffix))!;

describe("18 November CEU content feedback", () => {
  it("makes the magnetic-meter conclusion consistent and fixes the pressure datum and electrical role", () => {
    const c = course("basic-instrumentation");
    const m = c.modules.find(m => m.id === "pressure-level-flow")!;
    const q = m.checks.find(q => q.id.endsWith("pressure-level-flow-c4-r2"))!;
    expect(q.choices[q.correctIndex]).toMatch(/unreliable or invalid/);
    expect(q.prompt).toContain("Electrode position and empty-pipe behaviour are not known");
    expect(m.lesson).toContain("dry electrodes above the water, making the flow reading unreliable or invalid");
    expect(m.lesson).not.toContain("part-full pipe usually makes it over-read");
    expect(m.assignment).toContain("reading is unreliable");
    expect(m.rubric.join(" ")).toContain("unreliable or invalid");
    expect(`${m.assignment} ${m.rubric.join(" ")}`).not.toMatch(/makes it over-read|why the magnetic meter reads high/);
    expect(m.evidence).toContain("pressure-sensing point, which is **1.0 ft above the wet well floor**");
    expect(m.evidence).not.toContain("transmitter on the wet well floor");
    expect(m.caseSolution).toContain("11.626 ft");
    expect(question("basic-instrumentation", "scada-troubleshooting-f3-r2").prompt).toContain("trained, authorized instrument technician");
    expect(c.modules.find(m => m.id === "scada-troubleshooting")!.evidence).toContain("trained, authorized instrument technician");
  });

  it("uses new distribution exam inputs and correctly recomputed answers with explicit squares", () => {
    const tank = question("water-distribution-overview", "operating-system-f1-r2");
    expect(tank.prompt).toContain("24 ft");
    expect(tank.prompt).toContain("3.2 ft");
    const gallons = Math.round(3.1416 * 24 ** 2 / 4 * 3.2 * 7.48);
    expect(tank.choices[tank.correctIndex]).toBe(`${gallons.toLocaleString("en-US")} gal`);
    const velocity = question("water-distribution-overview", "operating-system-f2-r2");
    const ftPerSecond = (1080 / 449) / (3.1416 * (12 / 12) ** 2 / 4);
    expect(velocity.choices[velocity.correctIndex]).toBe(`${ftPerSecond.toFixed(2)} ft/s`);
    const m = course("water-distribution-overview").modules.find(m => m.id === "operating-system")!;
    expect(m.lesson).toContain("(8/12)^2");
    expect(velocity.explanation).toContain("(12/12)^2");
    expect(`${m.lesson} ${m.facilitatorGuide} ${velocity.explanation}`).not.toMatch(/\(\d+\/12\)2/);
    expect(tank.choices).not.toContain("23,793 gal");
    expect(velocity.choices).not.toContain("3.68 ft/s");
  });

  it("aligns supervisor assessment with accountable decisions and labels teaching models honestly", () => {
    const q = question("supervisor-essentials", "management-styles-f3-r2");
    expect(q.prompt).toContain("crew input with supervisory accountability");
    expect(q.choices[q.correctIndex]).toContain("required approval");
    const alarm = question("supervisor-essentials", "leading-through-change-f3-r2");
    expect(alarm.choices[alarm.correctIndex]).toContain("verification in parallel");
    expect(alarm.choices.join(" ")).not.toMatch(/next week|probably nothing/);
    const m = course("supervisor-essentials").modules.find(m => m.id === "management-styles")!;
    expect(m.lesson).toContain("simplified teaching models");
    expect(m.lesson).toContain("not rules linking a management style to an organisation chart");
  });

  it("preserves slide IDs, order and teaching boundaries against the actual pre-patch commit", () => {
    for (const name of names) {
      const baseline = baselineCourse(name);
      const current = course(name);
      expect(current.modules.map(m => m.id)).toEqual(baseline.modules.map(m => m.id));
      for (const [i, m] of current.modules.entries()) {
        const before = ceuModuleSlides(baseline.modules[i]);
        const after = ceuModuleSlides(m);
        const layout = (slides: typeof before) => slides.map(s => ({ id: s.id, kind: s.kind, title: s.title }));
        expect(layout(after)).toEqual(layout(before));
        // PR #264 and the managed-media migration change only image URLs;
        // preserve the exact image, slide and order using the verified manifest.
        const images = (body: string) => [...body.matchAll(/<img src="([^"]+)"/g)].map(match => match[1]);
        const approvedImagePath = (src: string) => {
          const oldPath = src.replace(/^\/manus-storage\/(ceu-[a-z-]+)_[a-f0-9]+\.jpg$/, "/ceu-covers/$1.jpg");
          return managedMedia[oldPath as keyof typeof managedMedia]?.url ?? src;
        };
        for (const [index, slide] of after.entries()) {
          expect(images(slide.body)).toEqual(images(before[index].body).map(approvedImagePath));
          for (const src of images(slide.body)) {
            expect(src).toMatch(/^\/manus-storage\/ceu-[a-z-]+_[a-f0-9]+\.jpg$/);
            expect(Object.values(managedMedia).some(asset => asset.url === src)).toBe(true);
          }
        }
        // IDs alone are numeric: explicitly pin the briefing image as well.
        const briefing = (slides: typeof before) => slides.findIndex(s => /ceu-supervisor-essentials-shift-briefing(?:_[a-f0-9]+)?\.jpg/.test(s.body));
        if (m.id === "management-styles") expect(briefing(before)).toBeGreaterThanOrEqual(0);
        expect(briefing(after)).toBe(briefing(before));
      }
    }
  });

  it("associates a saved old magnetic check with the revision without reusing its selection or grade", () => {
    const c = course("basic-instrumentation");
    const m = c.modules.find(m => m.id === "pressure-level-flow")!;
    const q = publicCeuCourse(c).modules.find(m => m.id === "pressure-level-flow")!.checks.find(q => q.id.endsWith("c4-r2"))!;
    expect(q.previousQuestionId).toBe("ceu-basic-instrumentation-pressure-level-flow-c4");
    const record = newCeuRecord(c, "Fixture learner", "");
    const historical = { selectedIndex: 3, correct: true, answeredAt: "2026-11-17T12:00:00.000Z" };
    record.modules[m.id].checks[q.previousQuestionId!] = historical;
    record.modules[m.id].completedAt = historical.answeredAt;
    expect(record.modules[m.id].checks[q.id]).toBeUndefined();
    const resumed = transitionCeu(c, record, { type: "resume", moduleId: m.id }, "fixture");
    expect(resumed.modules).toEqual(record.modules);
    const revised = transitionCeu(c, resumed, { type: "check", moduleId: m.id, questionId: q.id, choice: 0 }, "fixture");
    expect(revised.modules[m.id].checks[q.previousQuestionId!]).toEqual(historical);
    expect(revised.modules[m.id].checks[q.id]).toMatchObject({ selectedIndex: 0, correct: false });
    expect(revised.modules[m.id].completedAt).toBe(historical.answeredAt);
    expect(record.modules[m.id].checks[q.id]).toBeUndefined();
    const ui = readFileSync(new URL("../../client/src/pages/ContinuingEducationCourse.tsx", import.meta.url), "utf8");
    expect(ui).toContain("activeModuleRecord?.checks[check.previousQuestionId]?.answeredAt");
    expect(ui).toContain("its selection and grading do not apply to this revised check");
    expect(ui).toContain("savedChoice={activeModuleRecord?.checks[check.id]?.selectedIndex}");
  });

  it("uses distinct public distribution practice values rather than current or resumable exam answers", () => {
    const c = course("water-distribution-overview");
    const m = c.modules.find(m => m.id === "operating-system")!;
    const payload = JSON.stringify(publicCeuCourse(c));
    const gallons = Math.round(3.1416 * 28 ** 2 / 4 * 3.6 * 7.48).toLocaleString("en-US");
    const velocity = ((840 / 449) / (3.1416 * (14 / 12) ** 2 / 4)).toFixed(2);
    expect(m.evidence).toContain("28 ft inside-diameter");
    expect(m.evidence).toContain("3.6 ft");
    expect(m.evidence).toContain("14 in inside-diameter main at 840 gpm");
    expect(m.assignment).toContain("14 in inside-diameter main");
    for (const text of [m.caseSolution!, m.facilitatorGuide, m.rubric.join(" ")]) {
      expect(text).toContain(`${gallons} gal`);
      expect(text).toContain(`${velocity} ft/s`);
    }
    const archived = legacy["ceu-water-distribution-overview"];
    for (const q of [...archived.primary, ...archived.alternate, ...c.finalAssessment, ...c.alternateFinalAssessment!].filter(q => /operating-system-f[12](?:-r2)?$/.test(q.id))) {
      expect(payload).not.toContain(q.choices[q.correctIndex]);
      expect(payload).not.toContain(q.prompt);
    }
    for (const name of names.slice(1)) {
      const baseline = baselineCourse(name);
      const archive = legacy[baseline.key as keyof typeof legacy];
      expect(archive.primary).toEqual(baseline.finalAssessment);
      expect(archive.alternate).toEqual(baseline.alternateFinalAssessment);
    }
  });

  it("only publishes dedicated learner feedback, not privileged guides or final exam material", () => {
    for (const name of names) {
      const c = course(name);
      const publicCourse = publicCeuCourse(c);
      const payload = JSON.stringify(publicCourse);
      expect(publicCourse.finalQuestionCount).toBe(20);
      expect(publicCourse.delivery).toContain("non-credit certificate");
      expect(publicCourse.delivery).toContain("no contact-hour award");
      expect(payload).not.toMatch(/facilitatorGuide|correctIndex|finalAssessment|alternateFinalAssessment|plannedMinutes|"assignment"|"rubric"/);
      c.modules.forEach((m, i) => {
        expect(publicCourse.modules[i].caseSolution).toBe(m.caseSolution);
        expect(m.caseSolution!.length).toBeGreaterThan(150);
        expect(payload).not.toContain(m.facilitatorGuide);
        const slides = ceuModuleSlides(publicCourse.modules[i]);
        const withoutFeedback = ceuModuleSlides({ ...m, caseSolution: undefined });
        expect(slides.map(s => s.id)).toEqual(withoutFeedback.map(s => s.id));
        const scenario = slides.find(s => s.kind === "evidence")!;
        expect(scenario.eyebrow).toBe("Try this scenario");
        expect(scenario.caseSolution).toBe(m.caseSolution);
        expect(slides.filter(s => s.caseSolution)).toHaveLength(1);
      });
      for (const q of [...c.finalAssessment, ...c.alternateFinalAssessment!]) {
        expect(payload).not.toContain(q.prompt);
        expect(payload).not.toContain(q.explanation);
      }
      for (const source of c.sources) {
        expect(publicCourse.sources.find(s => s.id === source.id)).toMatchObject({ section: source.section, jurisdiction: source.jurisdiction });
      }
    }
    const old = course("basic-math").modules[0];
    expect(ceuModuleSlides(old).some(s => s.caseSolution)).toBe(false);
  });

  it("preserves original exam content for saved manifests and no-manifest drafts while new exams use replacements", () => {
    for (const name of names.slice(1)) {
      const c = course(name);
      const archived = legacy[c.key as keyof typeof legacy];
      expect(ceuExamQuestions(c)).toEqual(archived.primary);
      for (const q of [...archived.primary, ...archived.alternate]) {
        const [resolved] = ceuExamQuestions(c, [{ questionId: q.id, choiceOrder: [2, 0, 3, 1] }]);
        expect(resolved.prompt).toBe(q.prompt);
        expect(resolved.choices[resolved.correctIndex]).toBe(q.choices[q.correctIndex]);
        expect(resolved.explanation).toBe(q.explanation);
      }
      const newPool = [...c.finalAssessment, ...c.alternateFinalAssessment!];
      const retired = archived.primary.filter(q => !newPool.some(current => current.id === q.id));
      expect(retired.length).toBeGreaterThan(0);
      for (let draw = 0; draw < 8; draw++) {
        const manifest = issueCeuExam(c);
        expect(manifest).toHaveLength(20);
        expect(manifest.some(item => retired.some(q => q.id === item.questionId))).toBe(false);
      }
      expect(c.version).toBe("2026-11-17.1");
      const record = newCeuRecord(c, "Fixture learner", "");
      record.modules[c.modules[0].id].slideIndex = 3;
      const next = transitionCeu(c, record, { type: "resume", moduleId: c.modules[0].id }, "fixture");
      expect(next.modules).toEqual(record.modules);
      expect(next.courseVersion).toBe(record.courseVersion);
      expect(record.revision).toBe(0);
    }
  });

  it("submits historical drafts without changing completed learning records", () => {
    const c = course("water-distribution-overview");
    const archive = legacy["ceu-water-distribution-overview"];
    // Both historical draft formats must still grade the old inputs, not the
    // replacement tank/velocity items, and completed records remain immutable.
    for (const manifest of [undefined, archive.primary.map(q => ({ questionId: q.id, choiceOrder: [3, 1, 0, 2] }))]) {
      const record = newCeuRecord(c, "Fixture learner", "");
      for (const m of c.modules) record.modules[m.id].completedAt = "2026-11-17T12:00:00.000Z";
      const questions = ceuExamQuestions(c, manifest);
      const attemptId = "064f78ec-cbf1-4dbc-aa79-f53fb89dcace";
      record.assessmentDraft = { attemptId, manifest, answers: questions.map(() => null) };
      const result = transitionCeu(c, record, { type: "exam", attemptId, answers: questions.map(q => q.correctIndex) }, "fixture");
      expect(result.attempts[0]).toMatchObject({ score: 20, total: 20, passed: true, manifest });
      expect(result.completion?.statement).toContain("No approved CEUs");
      expect(record.attempts).toEqual([]);
      expect(() => transitionCeu(c, result, { type: "resume", moduleId: c.modules[0].id }, "fixture")).toThrow("immutable");
      const evaluated = transitionCeu(c, result, { type: "evaluation", rating: 4, useful: "", improve: "" }, "fixture");
      expect(evaluated.attempts).toEqual(result.attempts);
      expect(evaluated.completion).toEqual(result.completion);
    }
  });

  it("renders feedback as an optional closed disclosure and displays supplied source context", () => {
    // Lightweight UI contract without starting an app, external services or a DB.
    const ui = readFileSync(new URL("../../client/src/pages/ContinuingEducationCourse.tsx", import.meta.url), "utf8");
    expect(ui).toContain('<details key={activeSlide.id} className="ceu-case-solution">');
    expect(ui).toContain("Show a worked solution (optional)");
    expect(ui).toContain("<LessonMarkdown text={activeSlide.caseSolution} />");
    expect(ui).toContain("{source.section}");
    expect(ui).toContain("{source.jurisdiction}");
    expect(ui).toContain("does not award approved CEUs");
  });
});
