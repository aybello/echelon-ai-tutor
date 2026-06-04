/**
 * Shared exam type metadata — maps exam type keys to display labels.
 * Used by pricing cards, account page, and success screens.
 */

export const EXAM_LABELS: Record<string, string> = {
  oit: "OIT Water Treatment",
  "oit-ww": "OIT Wastewater Treatment",
  "class1-water": "Class 1 Water Treatment",
  "class1-ww": "Class 1 Wastewater Treatment",
  "class2-water": "Class 2 Water Treatment",
  "class2-ww": "Class 2 Wastewater Treatment",
  "class3-water": "Class 3 Water Treatment",
  "class3-ww": "Class 3 Wastewater Treatment",
  "class4-water": "Class 4 Water Treatment",
  "class4-ww": "Class 4 Wastewater Treatment",
  wqa: "Water Quality Analyst (WQA)",
  "wpi-class1-water": "WPI Class I Water Treatment",
  "wpi-class1-wastewater": "WPI Class I Wastewater Treatment",
  "wpi-class1-water-dist": "WPI Class I Water Distribution",
  "wpi-class1-water-coll": "WPI Class I Wastewater Collection",
  "wpi-class2-water": "WPI Class II Water Treatment",
  "wpi-class2-wastewater": "WPI Class II Wastewater Treatment",
  "wpi-class2-water-dist": "WPI Class II Water Distribution",
  "wpi-class2-water-coll": "WPI Class II Wastewater Collection",
  "wpi-class3-water": "WPI Class III Water Treatment",
  "wpi-class3-wastewater": "WPI Class III Wastewater Treatment",
  "wpi-class3-water-dist": "WPI Class III Water Distribution",
  "wpi-class3-water-coll": "WPI Class III Wastewater Collection",
  "wpi-class4-water": "WPI Class IV Water Treatment",
  "wpi-class4-wastewater": "WPI Class IV Wastewater Treatment",
  "wpi-class4-water-dist": "WPI Class IV Water Distribution",
  "wpi-class4-water-coll": "WPI Class IV Wastewater Collection",
};

/**
 * Maps subscription tier + province to the exam types included.
 * Mirrors the server-side ONTARIO_BY_TIER / WESTERN_BY_TIER.
 */
type SubscriptionTier = "class1" | "class2" | "class3" | "class4" | "all-access";
type SubscriptionProvince = "ontario" | "western";

const ONTARIO_BY_TIER: Record<SubscriptionTier, string[]> = {
  "class1":     ["oit", "oit-ww", "class1-water", "class1-ww"],
  "class2":     ["class2-water", "class2-ww"],
  "class3":     ["class3-water", "class3-ww"],
  "class4":     ["class4-water", "class4-ww", "wqa"],
  "all-access": ["oit","oit-ww","class1-water","class1-ww","class2-water","class2-ww","class3-water","class3-ww","class4-water","class4-ww","wqa"],
};

const WESTERN_BY_TIER: Record<SubscriptionTier, string[]> = {
  "class1":     ["wpi-class1-water","wpi-class1-wastewater","wpi-class1-water-dist","wpi-class1-water-coll"],
  "class2":     ["wpi-class2-water","wpi-class2-wastewater","wpi-class2-water-dist","wpi-class2-water-coll"],
  "class3":     ["wpi-class3-water","wpi-class3-wastewater","wpi-class3-water-dist","wpi-class3-water-coll"],
  "class4":     ["wpi-class4-water","wpi-class4-wastewater","wpi-class4-water-dist","wpi-class4-water-coll"],
  "all-access": [
    "wpi-class1-water","wpi-class1-wastewater","wpi-class1-water-dist","wpi-class1-water-coll",
    "wpi-class2-water","wpi-class2-wastewater","wpi-class2-water-dist","wpi-class2-water-coll",
    "wpi-class3-water","wpi-class3-wastewater","wpi-class3-water-dist","wpi-class3-water-coll",
    "wpi-class4-water","wpi-class4-wastewater","wpi-class4-water-dist","wpi-class4-water-coll",
  ],
};

export function getSubscriptionExamTypes(tier: string, province: string): string[] {
  if (province === "ontario") return ONTARIO_BY_TIER[tier as SubscriptionTier] ?? [];
  return WESTERN_BY_TIER[tier as SubscriptionTier] ?? [];
}
