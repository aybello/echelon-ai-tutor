/**
 * Echelon Institute -- Subscription Product Definitions
 * Annual subscriptions, province-scoped, class-level access.
 *
 * Pricing:
 *   Ontario (EOCP) — 2 tracks per class (Water Treatment + Wastewater Treatment)
 *     Class 1: $99 | Class 2: $149 | Class 3: $199 | Class 4: $249 | All-Access: $349
 *
 *   Western Canada (WPI) — 4 tracks per class (Water Treatment + Wastewater Treatment
 *                           + Water Distribution + Wastewater Collection)
 *     Class I: $149 | Class II: $199 | Class III: $249 | Class IV: $299 | All-Access: $449
 */

export type SubscriptionTier = "class1" | "class2" | "class3" | "class4" | "all-access";
export type SubscriptionProvince = "ontario" | "western";

export interface SubscriptionProduct {
  tier: SubscriptionTier;
  province: SubscriptionProvince;
  name: string;
  description: string;
  /** Price in cents CAD */
  priceCAD: number;
}

/** Ontario (EOCP) subscription products — 2 tracks per class */
const ONTARIO_SUBSCRIPTION_PRODUCTS: SubscriptionProduct[] = [
  {
    tier: "class1",
    province: "ontario",
    name: "Class 1 All-Access — Ontario",
    description: "OIT + Class 1 Water Treatment + Class 1 Wastewater Treatment (MOECP / OWWCO). Annual.",
    priceCAD: 9900,
  },
  {
    tier: "class2",
    province: "ontario",
    name: "Class 2 All-Access — Ontario",
    description: "Class 2 Water Treatment + Class 2 Wastewater Treatment (MOECP / OWWCO). Annual.",
    priceCAD: 14900,
  },
  {
    tier: "class3",
    province: "ontario",
    name: "Class 3 All-Access — Ontario",
    description: "Class 3 Water Treatment + Class 3 Wastewater Treatment (MOECP / OWWCO). Annual.",
    priceCAD: 19900,
  },
  {
    tier: "class4",
    province: "ontario",
    name: "Class 4 All-Access — Ontario",
    description: "Class 4 Water Treatment + Class 4 Wastewater Treatment + WQA (MOECP / OWWCO). Annual.",
    priceCAD: 24900,
  },
  {
    tier: "all-access",
    province: "ontario",
    name: "All-Access Pass — Ontario",
    description: "Every Ontario exam type: all classes, Water Treatment + Wastewater Treatment + WQA. Annual.",
    priceCAD: 34900,
  },
];

/** Western Canada (WPI) subscription products — 4 tracks per class */
const WESTERN_SUBSCRIPTION_PRODUCTS: SubscriptionProduct[] = [
  {
    tier: "class1",
    province: "western",
    name: "Class I All-Access — Western Canada",
    description: "Class I Water Treatment + Wastewater Treatment + Water Distribution + Wastewater Collection (WPI). Annual.",
    priceCAD: 14900,
  },
  {
    tier: "class2",
    province: "western",
    name: "Class II All-Access — Western Canada",
    description: "Class II Water Treatment + Wastewater Treatment + Water Distribution + Wastewater Collection (WPI). Annual.",
    priceCAD: 19900,
  },
  {
    tier: "class3",
    province: "western",
    name: "Class III All-Access — Western Canada",
    description: "Class III Water Treatment + Wastewater Treatment + Water Distribution + Wastewater Collection (WPI). Annual.",
    priceCAD: 24900,
  },
  {
    tier: "class4",
    province: "western",
    name: "Class IV All-Access — Western Canada",
    description: "Class IV Water Treatment + Wastewater Treatment + Water Distribution + Wastewater Collection (WPI). Annual.",
    priceCAD: 29900,
  },
  {
    tier: "all-access",
    province: "western",
    name: "All-Access Pass — Western Canada",
    description: "Every WPI exam type: all classes, all 4 tracks (Water Treatment, Wastewater Treatment, Water Distribution, Wastewater Collection). Annual.",
    priceCAD: 44900,
  },
];

/** Combined list for lookups */
export const ALL_SUBSCRIPTION_PRODUCTS: SubscriptionProduct[] = [
  ...ONTARIO_SUBSCRIPTION_PRODUCTS,
  ...WESTERN_SUBSCRIPTION_PRODUCTS,
];

/**
 * Look up the subscription product for a given tier + province.
 * Returns undefined if not found.
 */
export function getSubscriptionProduct(
  tier: SubscriptionTier,
  province: SubscriptionProvince
): SubscriptionProduct | undefined {
  return ALL_SUBSCRIPTION_PRODUCTS.find(p => p.tier === tier && p.province === province);
}

// ─── Exam type mappings ──────────────────────────────────────────────────────

const ONTARIO_BY_TIER: Record<SubscriptionTier, string[]> = {
  "class1":     ["oit", "oit-ww", "class1-water", "class1-ww", "class1-water-dist", "class1-wastewater-coll"],
  "class2":     ["class2-water", "class2-ww", "class2-water-dist", "class2-wastewater-coll"],
  "class3":     ["class3-water", "class3-ww", "class3-water-dist", "class3-wastewater-coll"],
  "class4":     ["class4-water", "class4-ww", "wqa", "class4-water-dist", "class4-wastewater-coll"],
  "all-access": ["oit","oit-ww","class1-water","class1-ww","class2-water","class2-ww","class3-water","class3-ww","class4-water","class4-ww","wqa","class1-water-dist","class1-wastewater-coll","class2-water-dist","class2-wastewater-coll","class3-water-dist","class3-wastewater-coll","class4-water-dist","class4-wastewater-coll"],
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
  "class1":     "Class 1 All-Access",
  "class2":     "Class 2 All-Access",
  "class3":     "Class 3 All-Access",
  "class4":     "Class 4 All-Access",
  "all-access": "All-Access Pass",
};

export const PROVINCE_LABELS: Record<SubscriptionProvince, string> = {
  "ontario": "Ontario (MOECP / OWWCO)",
  "western": "Western Canada (WPI — BC, AB, SK, MB)",
};

/** First quiz page to land on after subscribing — Ontario track */
export const TIER_QUIZ_PATHS_ONTARIO: Record<string, string> = {
  "class1":     "/quiz",
  "class2":     "/class2-water",
  "class3":     "/class3-water",
  "class4":     "/class4-water",
  "all-access": "/quiz",
};

/** First quiz page to land on after subscribing — WPI track */
export const TIER_QUIZ_PATHS_WPI: Record<string, string> = {
  "class1":     "/wpi-class1-water",
  "class2":     "/wpi-class2-water",
  "class3":     "/wpi-class3-water",
  "class4":     "/wpi-class4-water",
  "all-access": "/wpi-class1-water",
};
