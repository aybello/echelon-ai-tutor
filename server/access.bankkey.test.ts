/**
 * access.bankkey.test.ts
 *
 * Bank key → exam type coverage audit.
 *
 * WHY THIS TEST EXISTS:
 * Every question bank in the DB has a "bankKey" (e.g. "class1-wastewater").
 * Every subscription tier unlocks a set of "examTypes" (e.g. "class1-ww").
 * If these two naming systems diverge, customers who pay get only 15 trial
 * questions instead of the full bank — silently, with no error.
 *
 * This test is the automated version of the manual audit that caught 9 bugs
 * on 2026-06-04. It will fail if:
 *   - A new course is added with a bankKey that has no override and no matching examType
 *   - An override is removed without updating the bankKey
 *   - A subscription tier stops covering an exam type that a bankKey resolves to
 *
 * HOW TO UPDATE:
 * If you add a new course, add its bankKey to ALL_BANK_KEYS below.
 * If the bankKey differs from the subscription examType, add an entry to
 * BANKKEY_EXAMTYPE_OVERRIDES in server/_core/access.ts.
 */

import { describe, it, expect } from "vitest";
import { bankKeyToExamType } from "./_core/access";
import {
  getAllSubscriptionExamTypes,
  type SubscriptionTier,
  type SubscriptionProvince,
} from "../server/stripe/subscriptionProducts";

// ── All question bank keys that exist in the database ────────────────────────
// When you add a new course, add its bankKey here.
const ALL_BANK_KEYS: string[] = [
  // Ontario — Entry level
  "oit",
  "oit-ww",
  // Ontario — Class 1
  "class1",           // combined water+wastewater bank (legacy mock exam)
  "class1-water",
  "class1-wastewater",
  // Ontario — Class 2
  "class2-water",
  "class2-wastewater",
  // Ontario — Class 3
  "class3-water",
  "class3-wastewater",
  // Ontario — Class 4
  "class4-water",
  "class4-wastewater",
  // Ontario — WQA
  "wqa",
  // WPI — Class I
  "wpi-class1-water",
  "wpi-class1-wastewater",
  "wpi-class1-water-dist",
  "wpi-class1-wastewater-coll",
  // WPI — Class II
  "wpi-class2-water",
  "wpi-class2-wastewater",
  "wpi-class2-water-dist",
  "wpi-class2-wastewater-coll",
  // WPI — Class III
  "wpi-class3-water",
  "wpi-class3-wastewater",
  "wpi-class3-water-dist",
  "wpi-class3-wastewater-coll",
  // WPI — Class IV
  "wpi-class4-water",
  "wpi-class4-wastewater",
  "wpi-class4-water-dist",
  "wpi-class4-wastewater-coll",
];

// ── All subscription tiers and provinces ─────────────────────────────────────
const ALL_TIERS: Array<{ tier: SubscriptionTier; province: SubscriptionProvince }> = [
  { tier: "class1", province: "ontario" },
  { tier: "class2", province: "ontario" },
  { tier: "class3", province: "ontario" },
  { tier: "class4", province: "ontario" },
  { tier: "all-access", province: "ontario" },
  { tier: "class1", province: "western" },
  { tier: "class2", province: "western" },
  { tier: "class3", province: "western" },
  { tier: "class4", province: "western" },
  { tier: "all-access", province: "western" },
];

// Build the complete set of all exam types unlocked by any subscription
const ALL_UNLOCKABLE_EXAM_TYPES = new Set(
  getAllSubscriptionExamTypes(ALL_TIERS)
);

// ── Tests ─────────────────────────────────────────────────────────────────────

describe("Bank key → exam type coverage audit", () => {
  it("every bank key resolves to an exam type that is unlockable by some subscription tier", () => {
    const broken: Array<{ bankKey: string; resolvedExamType: string }> = [];

    for (const bankKey of ALL_BANK_KEYS) {
      const resolvedExamType = bankKeyToExamType(bankKey);
      if (!ALL_UNLOCKABLE_EXAM_TYPES.has(resolvedExamType)) {
        broken.push({ bankKey, resolvedExamType });
      }
    }

    if (broken.length > 0) {
      const lines = broken.map(
        ({ bankKey, resolvedExamType }) =>
          `  "${bankKey}" → "${resolvedExamType}" (not in any subscription tier)`
      );
      throw new Error(
        `ACCESS BUG DETECTED: ${broken.length} bank key(s) cannot be unlocked by any subscription.\n` +
        `Customers who buy a subscription will only get 15 trial questions for these courses.\n\n` +
        `Broken mappings:\n${lines.join("\n")}\n\n` +
        `Fix: Add an entry to BANKKEY_EXAMTYPE_OVERRIDES in server/_core/access.ts,\n` +
        `or add the exam type to the appropriate subscription tier in server/stripe/subscriptionProducts.ts.\n` +
        `Also add the new bankKey to ALL_BANK_KEYS in server/access.bankkey.test.ts.`
      );
    }

    expect(broken).toHaveLength(0);
  });

  it("bankKeyToExamType is idempotent for keys that need no override", () => {
    // Keys that should pass through unchanged
    const passThrough = ["oit", "oit-ww", "class1-water", "class2-water", "wqa",
      "wpi-class1-water", "wpi-class1-wastewater", "wpi-class1-water-dist"];
    for (const key of passThrough) {
      expect(bankKeyToExamType(key)).toBe(key);
    }
  });

  it("bankKeyToExamType correctly maps all wastewater overrides", () => {
    expect(bankKeyToExamType("class1-wastewater")).toBe("class1-ww");
    expect(bankKeyToExamType("class2-wastewater")).toBe("class2-ww");
    expect(bankKeyToExamType("class3-wastewater")).toBe("class3-ww");
    expect(bankKeyToExamType("class4-wastewater")).toBe("class4-ww");
  });

  it("bankKeyToExamType correctly maps WPI collection overrides", () => {
    expect(bankKeyToExamType("wpi-class1-wastewater-coll")).toBe("wpi-class1-water-coll");
    expect(bankKeyToExamType("wpi-class2-wastewater-coll")).toBe("wpi-class2-water-coll");
    expect(bankKeyToExamType("wpi-class3-wastewater-coll")).toBe("wpi-class3-water-coll");
    expect(bankKeyToExamType("wpi-class4-wastewater-coll")).toBe("wpi-class4-water-coll");
  });

  it("bankKeyToExamType maps combined class1 bank to class1-water", () => {
    expect(bankKeyToExamType("class1")).toBe("class1-water");
  });

  it("all-access Ontario subscription unlocks all Ontario bank keys", () => {
    const allAccessExamTypes = new Set(
      getAllSubscriptionExamTypes([{ tier: "all-access", province: "ontario" }])
    );
    const ontarioBankKeys = ALL_BANK_KEYS.filter(k => !k.startsWith("wpi-"));
    for (const bankKey of ontarioBankKeys) {
      const examType = bankKeyToExamType(bankKey);
      expect(
        allAccessExamTypes.has(examType),
        `all-access Ontario should unlock "${bankKey}" (resolves to "${examType}")`
      ).toBe(true);
    }
  });

  it("all-access Western subscription unlocks all WPI bank keys", () => {
    const allAccessExamTypes = new Set(
      getAllSubscriptionExamTypes([{ tier: "all-access", province: "western" }])
    );
    const wpiBankKeys = ALL_BANK_KEYS.filter(k => k.startsWith("wpi-"));
    for (const bankKey of wpiBankKeys) {
      const examType = bankKeyToExamType(bankKey);
      expect(
        allAccessExamTypes.has(examType),
        `all-access Western should unlock "${bankKey}" (resolves to "${examType}")`
      ).toBe(true);
    }
  });
});
