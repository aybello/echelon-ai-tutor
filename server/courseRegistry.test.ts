/**
 * courseRegistry.test.ts
 *
 * Regression tests for shared/courseRegistry.ts (Phase 3).
 *
 * Rules verified:
 * - Every product key in products.ts maps to a real course in the registry.
 * - Every course has valid routes (non-empty quiz and mock paths).
 * - Every team-assignable course is in the registry.
 * - Every subscription tier maps to valid courses.
 * - Every alias resolves intentionally.
 * - Unknown keys fail closed.
 * - Ontario and Western courses do not cross-contaminate.
 */

import { describe, it, expect } from "vitest";
import {
  getCourseByKey,
  getCourseByAlias,
  resolveCourseKey,
  isValidCourseKeyForFamily,
  getCoursesForFamily,
  getCoursesForSubscriptionTier,
  getTeamAssignableCourses,
  courseKeyToTierStrict,
  getRouteForCourse,
  getAllActiveCourseKeys,
  getAllActiveCourseKeysForFamily,
  getAllCourses,
} from "../shared/courseRegistry";
import { INDIVIDUAL_PRODUCTS, TEAM_COURSES_ONTARIO, TEAM_COURSES_WESTERN } from "../shared/products";

// ---------------------------------------------------------------------------
// Basic lookups
// ---------------------------------------------------------------------------

describe("getCourseByKey", () => {
  it("returns a course for a known canonical key", () => {
    const course = getCourseByKey("class1-water");
    expect(course).toBeDefined();
    expect(course!.courseKey).toBe("class1-water");
    expect(course!.examFamily).toBe("ontario");
  });

  it("returns undefined for an unknown key", () => {
    expect(getCourseByKey("nonexistent-course")).toBeUndefined();
  });

  it("returns undefined for an empty string", () => {
    expect(getCourseByKey("")).toBeUndefined();
  });
});

describe("getCourseByAlias", () => {
  it("resolves a known alias to the canonical entry", () => {
    const course = getCourseByAlias("class1-wastewater");
    expect(course).toBeDefined();
    expect(course!.courseKey).toBe("class1-ww");
  });

  it("returns undefined for an unknown alias", () => {
    expect(getCourseByAlias("not-an-alias")).toBeUndefined();
  });
});

describe("resolveCourseKey", () => {
  it("resolves a canonical key", () => {
    expect(resolveCourseKey("class2-water")?.courseKey).toBe("class2-water");
  });

  it("resolves a legacy alias to the canonical entry", () => {
    expect(resolveCourseKey("class1-wastewater")?.courseKey).toBe("class1-ww");
  });

  it("returns undefined for an unknown key", () => {
    expect(resolveCourseKey("garbage-key")).toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// Province / family validation
// ---------------------------------------------------------------------------

describe("isValidCourseKeyForFamily", () => {
  it("returns true for a valid Ontario key", () => {
    expect(isValidCourseKeyForFamily("class1-water", "ontario")).toBe(true);
  });

  it("returns true for a valid Western key", () => {
    expect(isValidCourseKeyForFamily("wpi-class1-water", "western")).toBe(true);
  });

  it("returns false for an Ontario key checked against western", () => {
    expect(isValidCourseKeyForFamily("class1-water", "western")).toBe(false);
  });

  it("returns false for a Western key checked against ontario", () => {
    expect(isValidCourseKeyForFamily("wpi-class1-water", "ontario")).toBe(false);
  });

  it("returns false for an unknown key", () => {
    expect(isValidCourseKeyForFamily("unknown-key", "ontario")).toBe(false);
  });
});

describe("getCoursesForFamily", () => {
  it("returns only Ontario courses for ontario family", () => {
    const courses = getCoursesForFamily("ontario");
    expect(courses.length).toBeGreaterThan(0);
    expect(courses.every((c) => c.examFamily === "ontario")).toBe(true);
  });

  it("returns only Western courses for western family", () => {
    const courses = getCoursesForFamily("western");
    expect(courses.length).toBeGreaterThan(0);
    expect(courses.every((c) => c.examFamily === "western")).toBe(true);
  });

  it("Ontario and Western course sets are disjoint", () => {
    const ontarioKeys = new Set(getCoursesForFamily("ontario").map((c) => c.courseKey));
    const westernKeys = new Set(getCoursesForFamily("western").map((c) => c.courseKey));
    const overlap = [...ontarioKeys].filter((k) => westernKeys.has(k));
    expect(overlap).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// Subscription tier mappings
// ---------------------------------------------------------------------------

describe("getCoursesForSubscriptionTier", () => {
  it("returns courses for class1 ontario", () => {
    const courses = getCoursesForSubscriptionTier("class1", "ontario");
    expect(courses.length).toBeGreaterThan(0);
    expect(courses.every((c) => c.subscriptionTier === "class1")).toBe(true);
    expect(courses.every((c) => c.examFamily === "ontario")).toBe(true);
  });

  it("returns courses for class4 western", () => {
    const courses = getCoursesForSubscriptionTier("class4", "western");
    expect(courses.length).toBeGreaterThan(0);
    expect(courses.every((c) => c.subscriptionTier === "class4")).toBe(true);
    expect(courses.every((c) => c.examFamily === "western")).toBe(true);
  });
});

describe("courseKeyToTierStrict", () => {
  it("returns the correct tier for a known Ontario key", () => {
    expect(courseKeyToTierStrict("class1-water", "ontario")).toBe("class1");
    expect(courseKeyToTierStrict("class4-ww", "ontario")).toBe("class4");
  });

  it("returns the correct tier for a known Western key", () => {
    expect(courseKeyToTierStrict("wpi-class2-water", "western")).toBe("class2");
  });

  it("returns null for an unknown key", () => {
    expect(courseKeyToTierStrict("unknown-key", "ontario")).toBeNull();
  });

  it("returns null for a cross-family key", () => {
    expect(courseKeyToTierStrict("class1-water", "western")).toBeNull();
    expect(courseKeyToTierStrict("wpi-class1-water", "ontario")).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// Team-assignable courses
// ---------------------------------------------------------------------------

describe("getTeamAssignableCourses", () => {
  it("returns team-assignable Ontario courses", () => {
    const courses = getTeamAssignableCourses("ontario");
    expect(courses.length).toBeGreaterThan(0);
    expect(courses.every((c) => c.teamAssignable)).toBe(true);
    expect(courses.every((c) => c.examFamily === "ontario")).toBe(true);
  });

  it("returns team-assignable Western courses", () => {
    const courses = getTeamAssignableCourses("western");
    expect(courses.length).toBeGreaterThan(0);
    expect(courses.every((c) => c.teamAssignable)).toBe(true);
    expect(courses.every((c) => c.examFamily === "western")).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Routes
// ---------------------------------------------------------------------------

describe("getRouteForCourse", () => {
  it("returns quiz and mock paths for a known course", () => {
    const routes = getRouteForCourse("class1-water");
    expect(routes).not.toBeNull();
    expect(routes!.quizPath).toBe("/class1-water");
    expect(routes!.mockExamPath).toBe("/class1-water-mock");
  });

  it("returns null for an unknown course", () => {
    expect(getRouteForCourse("not-a-course")).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// All active keys
// ---------------------------------------------------------------------------

describe("getAllActiveCourseKeys", () => {
  it("returns a non-empty array", () => {
    const keys = getAllActiveCourseKeys();
    expect(keys.length).toBeGreaterThan(0);
  });

  it("does not contain duplicates", () => {
    const keys = getAllActiveCourseKeys();
    expect(new Set(keys).size).toBe(keys.length);
  });
});

describe("getAllActiveCourseKeysForFamily", () => {
  it("returns only Ontario keys", () => {
    const keys = getAllActiveCourseKeysForFamily("ontario");
    expect(keys.every((k) => getCourseByKey(k)?.examFamily === "ontario")).toBe(true);
  });

  it("returns only Western keys", () => {
    const keys = getAllActiveCourseKeysForFamily("western");
    expect(keys.every((k) => getCourseByKey(k)?.examFamily === "western")).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Cross-validation: products.ts vs registry
// ---------------------------------------------------------------------------

describe("Cross-validation: INDIVIDUAL_PRODUCTS vs registry", () => {
  it("every product key in INDIVIDUAL_PRODUCTS maps to a real course in the registry", () => {
    const missing: string[] = [];
    for (const product of INDIVIDUAL_PRODUCTS) {
      if (!getCourseByKey(product.key)) {
        missing.push(product.key);
      }
    }
    expect(missing).toHaveLength(0);
  });
});

describe("Cross-validation: TEAM_COURSES_ONTARIO vs registry", () => {
  it("every Ontario team course key is in the registry as an Ontario course", () => {
    const missing: string[] = [];
    for (const tc of TEAM_COURSES_ONTARIO) {
      const course = getCourseByKey(tc.key);
      if (!course || course.examFamily !== "ontario") {
        missing.push(tc.key);
      }
    }
    expect(missing).toHaveLength(0);
  });
});

describe("Cross-validation: TEAM_COURSES_WESTERN vs registry", () => {
  it("every Western team course key is in the registry as a Western course", () => {
    const missing: string[] = [];
    for (const tc of TEAM_COURSES_WESTERN) {
      const course = getCourseByKey(tc.key);
      if (!course || course.examFamily !== "western") {
        missing.push(tc.key);
      }
    }
    expect(missing).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// Registry integrity checks
// ---------------------------------------------------------------------------

describe("Registry integrity", () => {
  it("every course has a non-empty quizPath and mockExamPath", () => {
    const invalid = getAllCourses().filter(
      (c) => !c.quizPath || !c.mockExamPath,
    );
    expect(invalid).toHaveLength(0);
  });

  it("every course has a non-empty courseKey, displayName, and productKey", () => {
    const invalid = getAllCourses().filter(
      (c) => !c.courseKey || !c.displayName || !c.productKey,
    );
    expect(invalid).toHaveLength(0);
  });

  it("no two courses share the same courseKey", () => {
    const keys = getAllCourses().map((c) => c.courseKey);
    expect(new Set(keys).size).toBe(keys.length);
  });

  it("no alias is the same as a canonical courseKey", () => {
    const canonicalKeys = new Set(getAllCourses().map((c) => c.courseKey));
    const badAliases: string[] = [];
    for (const course of getAllCourses()) {
      for (const alias of course.aliases) {
        if (canonicalKeys.has(alias)) {
          badAliases.push(`${course.courseKey} has alias ${alias} which is also a canonical key`);
        }
      }
    }
    expect(badAliases).toHaveLength(0);
  });
});
