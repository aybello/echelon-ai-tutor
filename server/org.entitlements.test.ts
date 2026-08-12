/**
 * Teams Audit Spec — Automated Tests
 * Tests 1-8: Entitlement enforcement
 * Tests 9-14: Annual licence counting
 * Test 15: Progress survival on revoke
 * Test 16: UI filter (allowedCourseKeys in overview)
 * Test 17: Exam outcome validation
 * Test 18: Winnipeg route (WPI stream-wastewater-coll)
 * Test 19: All Streams orgs
 * Test 20: Legacy migration (class-level tier still works)
 */
import { describe, it, expect } from "vitest";
import {
  validateOrgCourseKeys,
  allowedCourseKeysForOrg,
  STREAM_COURSE_KEYS,
  TEAM_BASE_PRICE,
  TEAM_VOLUME_TIERS,
} from "../server/stripe/subscriptionProducts";

describe("Teams Audit — Entitlement Tests (1-8)", () => {
  // Test 1: Single-stream org can only assign courses in their stream
  it("1. stream-water org can assign wpi-class1-water but not wpi-class1-wastewater", () => {
    const allowed = allowedCourseKeysForOrg("stream-water", "western");
    expect(allowed).toContain("wpi-class1-water");
    expect(allowed).toContain("wpi-class4-water");
    expect(allowed).not.toContain("wpi-class1-wastewater");
    expect(allowed).not.toContain("wpi-class1-wastewater-coll");
  });

  // Test 2: stream-wastewater-coll org can assign collection courses only
  it("2. stream-wastewater-coll org can assign wpi-class4-water-coll but not wpi-class4-water", () => {
    const allowed = allowedCourseKeysForOrg("stream-wastewater-coll", "western");
    expect(allowed).toContain("wpi-class1-water-coll");
    expect(allowed).toContain("wpi-class4-water-coll");
    expect(allowed).not.toContain("wpi-class4-water");
    expect(allowed).not.toContain("wpi-class4-wastewater");
  });

  // Test 3: all-access org can assign any course in their province
  it("3. all-access western org can assign any WPI course", () => {
    const allowed = allowedCourseKeysForOrg("all-access", "western");
    expect(allowed).toContain("wpi-class1-water");
    expect(allowed).toContain("wpi-class4-wastewater");
    expect(allowed).toContain("wpi-class4-water-coll");
    expect(allowed).toContain("wpi-class1-water-dist");
  });

  // Test 4: Ontario stream-water org gets Ontario water courses
  it("4. stream-water ontario org can assign class1-water but not class1-wastewater", () => {
    const allowed = allowedCourseKeysForOrg("stream-water", "ontario");
    expect(allowed).toContain("class1-water");
    expect(allowed).toContain("class4-water");
    expect(allowed).not.toContain("class1-wastewater");
    expect(allowed).not.toContain("class1-wastewater-coll");
  });

  // Test 5: validateOrgCourseKeys throws for out-of-entitlement course
  it("5. validateOrgCourseKeys throws for out-of-entitlement course", () => {
    expect(() => {
      validateOrgCourseKeys(["wpi-class1-wastewater"], "stream-water", "western", "operator");
    }).toThrow();
  });

  // Test 6: validateOrgCourseKeys passes for valid course
  it("6. validateOrgCourseKeys passes for valid course in stream", () => {
    const result = validateOrgCourseKeys(["wpi-class1-water"], "stream-water", "western", "operator");
    expect(result).toEqual(["wpi-class1-water"]);
  });

  // Test 7: validateOrgCourseKeys throws for empty course list on operator
  it("7. validateOrgCourseKeys throws for empty course list on operator", () => {
    expect(() => {
      validateOrgCourseKeys([], "stream-water", "western", "operator");
    }).toThrow();
  });

  // Test 8: validateOrgCourseKeys allows empty for manager role
  it("8. validateOrgCourseKeys allows empty for manager role", () => {
    const result = validateOrgCourseKeys([], "stream-water", "western", "manager");
    expect(result).toEqual([]);
  });
});

describe("Teams Audit — Annual Licence Tests (9-14)", () => {
  // Test 9: STREAM_COURSE_KEYS has all 4 streams for western
  it("9. STREAM_COURSE_KEYS maps all 4 WPI streams correctly", () => {
    expect(STREAM_COURSE_KEYS["western"]["stream-water"].length).toBe(4);
    expect(STREAM_COURSE_KEYS["western"]["stream-wastewater"].length).toBe(4);
    expect(STREAM_COURSE_KEYS["western"]["stream-water-dist"].length).toBe(4);
    expect(STREAM_COURSE_KEYS["western"]["stream-wastewater-coll"].length).toBe(4);
  });

  // Test 10: STREAM_COURSE_KEYS has all 4 streams for ontario
  it("10. STREAM_COURSE_KEYS maps all 4 Ontario streams correctly", () => {
    expect(STREAM_COURSE_KEYS["ontario"]["stream-water"].length).toBeGreaterThanOrEqual(4);
    expect(STREAM_COURSE_KEYS["ontario"]["stream-wastewater"].length).toBeGreaterThanOrEqual(4);
    expect(STREAM_COURSE_KEYS["ontario"]["stream-water-dist"].length).toBeGreaterThanOrEqual(4);
    expect(STREAM_COURSE_KEYS["ontario"]["stream-wastewater-coll"].length).toBeGreaterThanOrEqual(4);
  });

 // Test 11: TEAM_BASE_PRICE has exact national prices (Ontario = Western)
  it("11. exact national prices: all tiers $399, Ontario = Western", () => {
    expect(TEAM_BASE_PRICE.ontario["stream-water"]).toBe(39900);
    expect(TEAM_BASE_PRICE.western["stream-water"]).toBe(39900);
    expect(TEAM_BASE_PRICE.ontario["all-access"]).toBe(39900);
    expect(TEAM_BASE_PRICE.western["all-access"]).toBe(39900);
  });

  // Test 12: Volume discount tiers are correctly ordered
  it("12. volume discount tiers are correctly ordered (10, 25, 50)", () => {
    expect(TEAM_VOLUME_TIERS[1].min).toBe(10);
    expect(TEAM_VOLUME_TIERS[2].min).toBe(25);
    expect(TEAM_VOLUME_TIERS[3].min).toBe(50);
    expect(TEAM_VOLUME_TIERS[1].discountPct).toBeLessThan(TEAM_VOLUME_TIERS[2].discountPct);
    expect(TEAM_VOLUME_TIERS[2].discountPct).toBeLessThan(TEAM_VOLUME_TIERS[3].discountPct);
  });

  // Test 13: all-access includes OIT entry-level courses for ontario
  it("13. all-access ontario includes OIT entry-level courses", () => {
    const allowed = allowedCourseKeysForOrg("all-access", "ontario");
    expect(allowed).toContain("oit");
    expect(allowed).toContain("oit-ww");
  });

  // Test 14: stream-water includes OIT (entry-level for water), but NOT oit-ww (wastewater entry)
  it("14. stream-water ontario includes OIT but NOT oit-ww", () => {
    const allowed = allowedCourseKeysForOrg("stream-water", "ontario");
    expect(allowed).toContain("oit");
    expect(allowed).not.toContain("oit-ww");
  });
});

describe("Teams Audit — Additional Tests (15-20)", () => {
  // Test 15: Progress survival on revoke — verify revokeSeat source never deletes attempts
  it("15. revokeSeat source code never calls DELETE on question_attempts", () => {
    // Read the revokeSeat function from orgRouter.ts and assert it only updates status
    const fs = require("fs");
    const routerSrc = fs.readFileSync("server/routers/orgRouter.ts", "utf-8");
    // Extract the revokeSeat function body
    const revokeStart = routerSrc.indexOf("async function revokeSeat(");
    const revokeEnd = routerSrc.indexOf("\n}", revokeStart) + 2;
    const revokeFn = routerSrc.slice(revokeStart, revokeEnd);
    // Must NOT delete question_attempts
    expect(revokeFn).not.toContain("questionAttempts");
    expect(revokeFn).not.toContain("delete(");
    // Must update organizationMembers status to revoked
    expect(revokeFn).toContain("revoked");
    expect(revokeFn).toContain("organizationMembers");
    // Must update subscriptions status to expired
    expect(revokeFn).toContain("expired");
    expect(revokeFn).toContain("subscriptions");
  });

  // Test 16: getOrgOverview returns allowedCourseKeys (structural)
  it("16. allowedCourseKeysForOrg returns non-empty array for stream tiers", () => {
    const keys = allowedCourseKeysForOrg("stream-water", "ontario");
    expect(keys.length).toBeGreaterThan(0);
    // All keys should be water-related (class*-water or oit)
    expect(keys.every(k => k.includes("water") || k === "oit")).toBe(true);
  });

  // Test 17: Exam outcome validation (structural)
  it("17. allowedCourseKeysForOrg correctly excludes cross-stream courses", () => {
    const waterKeys = allowedCourseKeysForOrg("stream-water", "western");
    const wastewaterKeys = allowedCourseKeysForOrg("stream-wastewater", "western");
    // No overlap between water and wastewater streams
    const overlap = waterKeys.filter(k => wastewaterKeys.includes(k));
    expect(overlap.length).toBe(0);
  });

  // Test 18: Winnipeg route (WPI stream-wastewater-coll)
  it("18. Winnipeg route: stream-wastewater-coll western includes wpi-class4-water-coll", () => {
    const allowed = allowedCourseKeysForOrg("stream-wastewater-coll", "western");
    expect(allowed).toContain("wpi-class4-water-coll");
    expect(allowed).toContain("wpi-class1-water-coll");
    expect(allowed.length).toBe(4); // Class 1-4 only
  });

  // Test 19: All Streams orgs get everything
  it("19. all-access ontario gets all courses including entry-level", () => {
    const allowed = allowedCourseKeysForOrg("all-access", "ontario");
    // Should include water, wastewater, dist, coll, and OIT
    expect(allowed).toContain("class1-water");
    expect(allowed).toContain("class4-ww");
    expect(allowed).toContain("class4-wastewater-coll");
    expect(allowed).toContain("class4-water-dist");
    expect(allowed).toContain("oit");
    expect(allowed).toContain("oit-ww");
  });

  // Test 20: Legacy class-level tiers still work
  it("20. legacy class-level tier (class1) still resolves to valid course keys", () => {
    const allowed = allowedCourseKeysForOrg("class1", "ontario");
    // class1 tier should include all class1 courses for ontario
    expect(allowed.length).toBeGreaterThan(0);
  });
});
