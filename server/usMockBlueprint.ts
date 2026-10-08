/**
 * United States Class I mock profiles.
 *
 * These mirror the public WPI 2025 Class I criteria allocations used to draft
 * the US question pools. They are SEPARATE from the Canadian western profiles:
 * a US bank key never resolves to a Canadian blueprint and vice versa.
 *
 * Adoption of a given exam edition by any individual state is NOT established
 * by this file. A state label is display context only.
 *
 * Capacity rule: these profiles are only reachable once a reviewed US bank
 * exists. If a domain lacks classified questions, the shared strict selector
 * throws rather than borrowing from another domain. That refusal is intended.
 */
import type { BlueprintArea } from "./mockBlueprint";

export const US_CLASS1_BLUEPRINT_VERSION = 2025;

export const US_CLASS1_WATER_BANK = "us-class1-water";
/** 100 questions: 40 recall, 60 application, 10 of which are calculations. */
export const US_CLASS1_WATER_BLUEPRINT = [
  { module: "Treatment processes", total: 31, recall: 10, calculations: 7 },
  { module: "Laboratory", total: 16, recall: 9, calculations: 0 },
  { module: "Equipment", total: 26, recall: 7, calculations: 2 },
  { module: "Source water", total: 15, recall: 9, calculations: 1 },
  { module: "Safety/security/administration", total: 12, recall: 5, calculations: 0 },
] as const;

export const US_CLASS1_DIST_BANK = "us-class1-water-dist";
/** 100 questions: 45 recall, 55 application, 9 of which are calculations. */
export const US_CLASS1_DIST_BLUEPRINT = [
  { module: "Distribution components", total: 35, recall: 16, calculations: 6 },
  { module: "Equipment/field work", total: 30, recall: 14, calculations: 3 },
  { module: "Water quality/laboratory", total: 15, recall: 8, calculations: 0 },
  { module: "Safety/security/administration/public interactions", total: 20, recall: 7, calculations: 0 },
] as const;

export const US_CLASS1_CRITERIA_SOURCE = "https://gowpi.org/services/2025-need-to-know-criteria/";

/**
 * Resolve a US blueprint. Returns null for any unknown bank or version so
 * callers fail closed. Canadian bank keys never match here.
 */
export function usMockBlueprintForBank(bankKey: string, version: number): readonly BlueprintArea[] | null {
  if (version !== US_CLASS1_BLUEPRINT_VERSION) return null;
  if (bankKey === US_CLASS1_WATER_BANK) return US_CLASS1_WATER_BLUEPRINT;
  if (bankKey === US_CLASS1_DIST_BANK) return US_CLASS1_DIST_BLUEPRINT;
  return null;
}

/** Every bank key that has a US profile. Used to keep families from mixing. */
export const US_BLUEPRINT_BANKS: readonly string[] = [US_CLASS1_WATER_BANK, US_CLASS1_DIST_BANK];
