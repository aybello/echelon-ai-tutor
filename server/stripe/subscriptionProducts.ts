/**
 * Echelon Institute -- Subscription Product Definitions
 * Annual subscriptions, province-scoped, class-level access.
 */

export type SubscriptionTier = "class1" | "class2" | "class3" | "class4" | "all-access";
export type SubscriptionProvince = "ontario" | "western";

export interface SubscriptionProduct {
  tier: SubscriptionTier;
  name: string;
  description: string;
  priceCAD: number;
}

export const SUBSCRIPTION_PRODUCTS: SubscriptionProduct[] = [
  { tier: "class1",     name: "Class 1 All-Access",  description: "OIT + Class 1 Water + Class 1 Wastewater for your province. Annual.",  priceCAD: 9900  },
  { tier: "class2",     name: "Class 2 All-Access",  description: "Class 2 Water + Wastewater for your province. Annual.",                priceCAD: 14900 },
  { tier: "class3",     name: "Class 3 All-Access",  description: "Class 3 Water + Wastewater for your province. Annual.",                priceCAD: 19900 },
  { tier: "class4",     name: "Class 4 All-Access",  description: "Class 4 Water + Wastewater for your province. Annual.",                priceCAD: 24900 },
  { tier: "all-access", name: "All-Access Pass",      description: "Every exam type on the platform for your province. Annual.",           priceCAD: 34900 },
];

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

export function getSubscriptionExamTypes(tier: SubscriptionTier, province: SubscriptionProvince): string[] {
  if (province === "ontario") return ONTARIO_BY_TIER[tier] ?? [];
  return WESTERN_BY_TIER[tier] ?? [];
}

export function getAllSubscriptionExamTypes(
  subs: Array<{ tier: SubscriptionTier; province: SubscriptionProvince }>
): string[] {
  const types = new Set<string>();
  for (const sub of subs) {
    for (const t of getSubscriptionExamTypes(sub.tier, sub.province)) {
      types.add(t);
    }
  }
  return Array.from(types);
}

export const TIER_LABELS: Record<SubscriptionTier, string> = {
  "class1": "Class 1 All-Access",
  "class2": "Class 2 All-Access",
  "class3": "Class 3 All-Access",
  "class4": "Class 4 All-Access",
  "all-access": "All-Access Pass",
};

export const PROVINCE_LABELS: Record<SubscriptionProvince, string> = {
  "ontario": "Ontario (EOCP)",
  "western": "Western Canada (WPI -- BC, AB, SK, MB)",
};
