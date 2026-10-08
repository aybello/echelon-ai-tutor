/**
 * US Class I integration guards.
 *
 * These tests exist to prove the separation claims, not to decorate the build.
 * Each one would fail loudly if a future change let US and Canadian content mix.
 */
import { describe, expect, it } from "vitest";
import {
  getAllActiveCourseKeys,
  getCourseByKey,
  getCoursesForFamily,
  resolveCourseKey,
} from "../shared/courseRegistry";
import { mockBlueprintForBank, selectBlueprintQuestions, type ClassifiedQuestion } from "./mockBlueprint";
import {
  US_CLASS1_BLUEPRINT_VERSION,
  US_CLASS1_DIST_BANK,
  US_CLASS1_DIST_BLUEPRINT,
  US_CLASS1_WATER_BANK,
  US_CLASS1_WATER_BLUEPRINT,
  usMockBlueprintForBank,
} from "./usMockBlueprint";
import { resolveUSStudyContext } from "./usStudyContextServer";
import { buildTutorSystemPrompt } from "./_core/aiTutorPolicy";

const US_COURSE_KEYS = ["us-class1-water", "us-class1-water-dist"];

describe("US courses stay separate from Canadian courses", () => {
  it("registers both US Class I courses in their own exam family", () => {
    for (const key of US_COURSE_KEYS) {
      const course = getCourseByKey(key);
      expect(course, `${key} must exist`).toBeDefined();
      expect(course!.examFamily).toBe("us-wpi");
      expect(course!.provinceOrRegion).toBe("united-states");
    }
  });

  it("never exposes a US bank key to a Canadian course or the reverse", () => {
    const usBanks = new Set(US_COURSE_KEYS.map(k => getCourseByKey(k)!.questionBankKey));
    const canadianBanks = new Set(
      [...getCoursesForFamily("ontario"), ...getCoursesForFamily("western")].map(c => c.questionBankKey),
    );
    for (const bank of usBanks) expect(canadianBanks.has(bank)).toBe(false);
    // Every US bank key is namespaced, so a typo cannot collide with Canada.
    for (const bank of usBanks) expect(bank.startsWith("us-")).toBe(true);
  });

  it("gives US courses their own product keys and routes", () => {
    const canadian = [...getCoursesForFamily("ontario"), ...getCoursesForFamily("western")];
    for (const key of US_COURSE_KEYS) {
      const course = getCourseByKey(key)!;
      expect(canadian.some(c => c.productKey === course.productKey)).toBe(false);
      expect(canadian.some(c => c.quizPath === course.quizPath)).toBe(false);
      expect(canadian.some(c => c.mockExamPath === course.mockExamPath)).toBe(false);
    }
  });

  it("keeps US courses inactive until content is approved", () => {
    for (const key of US_COURSE_KEYS) {
      expect(getCourseByKey(key)!.isActive).toBe(false);
      expect(getAllActiveCourseKeys()).not.toContain(key);
    }
    expect(getCoursesForFamily("us-wpi")).toHaveLength(0);
  });

  it("still resolves unknown keys to undefined", () => {
    expect(resolveCourseKey("us-class1-nonexistent")).toBeUndefined();
    expect(resolveCourseKey("")).toBeUndefined();
  });
});

describe("US mock blueprints match the drafted allocations", () => {
  it("uses the exact Treatment allocation", () => {
    const total = US_CLASS1_WATER_BLUEPRINT.reduce((n, a) => n + a.total, 0);
    const recall = US_CLASS1_WATER_BLUEPRINT.reduce((n, a) => n + a.recall, 0);
    const calc = US_CLASS1_WATER_BLUEPRINT.reduce((n, a) => n + a.calculations, 0);
    expect([total, recall, total - recall, calc]).toEqual([100, 40, 60, 10]);
  });

  it("uses the exact Distribution allocation", () => {
    const total = US_CLASS1_DIST_BLUEPRINT.reduce((n, a) => n + a.total, 0);
    const recall = US_CLASS1_DIST_BLUEPRINT.reduce((n, a) => n + a.recall, 0);
    const calc = US_CLASS1_DIST_BLUEPRINT.reduce((n, a) => n + a.calculations, 0);
    expect([total, recall, total - recall, calc]).toEqual([100, 45, 55, 9]);
  });

  it("refuses an unknown bank or a mismatched criteria version", () => {
    expect(usMockBlueprintForBank("us-class1-water", 2024)).toBeNull();
    expect(usMockBlueprintForBank("class1-water", US_CLASS1_BLUEPRINT_VERSION)).toBeNull();
    expect(usMockBlueprintForBank("", US_CLASS1_BLUEPRINT_VERSION)).toBeNull();
  });

  it("routes US banks to US profiles through the shared resolver", () => {
    expect(mockBlueprintForBank(US_CLASS1_WATER_BANK, US_CLASS1_BLUEPRINT_VERSION))
      .toBe(US_CLASS1_WATER_BLUEPRINT);
    expect(mockBlueprintForBank(US_CLASS1_DIST_BANK, US_CLASS1_BLUEPRINT_VERSION))
      .toBe(US_CLASS1_DIST_BLUEPRINT);
    // A US bank asked for a Canadian criteria version gets nothing, never a
    // Canadian outline as a fallback.
    expect(mockBlueprintForBank(US_CLASS1_WATER_BANK, 1999)).toBeNull();
  });

  it("refuses to build a form when a domain lacks capacity instead of borrowing", () => {
    // A pool missing the calculation questions one domain requires.
    const pool: ClassifiedQuestion[] = [];
    let id = 1;
    for (const area of US_CLASS1_WATER_BLUEPRINT) {
      for (let i = 0; i < area.total + 5; i++) {
        pool.push({
          id: id++,
          module: area.module,
          isCalc: false, // deliberately no calculations anywhere
          cognitiveLevel: i < area.recall ? "recall" : "application",
        });
      }
    }
    expect(() => selectBlueprintQuestions(pool, US_CLASS1_WATER_BLUEPRINT, 100))
      .toThrow(/Insufficient classified questions/);
  });

  it("builds a valid Treatment form when capacity exists", () => {
    const pool: ClassifiedQuestion[] = [];
    let id = 1;
    for (const area of US_CLASS1_WATER_BLUEPRINT) {
      // Generous surplus in every bucket.
      for (const level of ["recall", "application"]) {
        for (const isCalc of [true, false]) {
          for (let i = 0; i < area.total; i++) {
            pool.push({ id: id++, module: area.module, isCalc, cognitiveLevel: level });
          }
        }
      }
    }
    const picked = selectBlueprintQuestions(pool, US_CLASS1_WATER_BLUEPRINT, 100);
    expect(picked).toHaveLength(100);
    expect(new Set(picked.map(q => q.id)).size).toBe(100);
    for (const area of US_CLASS1_WATER_BLUEPRINT) {
      const inArea = picked.filter(q => q.module === area.module);
      expect(inArea).toHaveLength(area.total);
      expect(inArea.filter(q => q.cognitiveLevel === "recall")).toHaveLength(area.recall);
      expect(inArea.filter(q => q.isCalc)).toHaveLength(area.calculations);
    }
  });
});

describe("US study context is server-resolved and fails closed", () => {
  it("resolves a recognized state for a US course", () => {
    const context = resolveUSStudyContext("us-class1-water", "AZ");
    expect(context).not.toBeNull();
    expect(context!.stateCode).toBe("AZ");
    expect(context!.unitConvention).toBe("us-customary");
  });

  it("drops an unrecognized state rather than passing it through", () => {
    const context = resolveUSStudyContext("us-class1-water", "Narnia");
    expect(context).not.toBeNull();
    expect(context!.stateCode).toBeNull();
    expect(context!.stateName).toBeNull();
  });

  it("returns null for Canadian or unknown courses", () => {
    expect(resolveUSStudyContext("class1-water", "AZ")).toBeNull();
    expect(resolveUSStudyContext("wpi-class1-water", "AZ")).toBeNull();
    expect(resolveUSStudyContext("not-a-course", "AZ")).toBeNull();
  });
});

describe("US tutor prompt carries the right guardrails", () => {
  const base = {
    courseName: "US Class I Water Treatment",
    question: null,
    selectedIndex: null,
    patternMode: false,
    recentPerformance: [],
  };

  it("requires US units and refuses state licensing advice", () => {
    const prompt = buildTutorSystemPrompt({
      ...base,
      examFamily: "us-wpi",
      usContext: { stateName: "Arizona", unitConvention: "us-customary" },
    });
    expect(prompt).toContain("US gallons");
    expect(prompt).toContain("never Imperial gallons");
    expect(prompt).toContain("state certifying authority");
    expect(prompt).toMatch(/display context only/);
    // Must never promise accreditation or credit.
    expect(prompt).toMatch(/accredited, approved, endorsed/);
  });

  it("does not leak US rules into Canadian courses", () => {
    for (const family of ["ontario", "western"] as const) {
      const prompt = buildTutorSystemPrompt({ ...base, examFamily: family });
      expect(prompt).not.toContain("US gallons");
      expect(prompt).not.toContain("state certifying authority");
    }
  });

  it("omits the state sentence when no state is known", () => {
    const prompt = buildTutorSystemPrompt({ ...base, examFamily: "us-wpi", usContext: null });
    expect(prompt).toContain("US gallons");
    expect(prompt).not.toContain("display context only");
  });
});
