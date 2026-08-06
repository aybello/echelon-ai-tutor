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

/**
 * Team-plan stream tiers — sold by certification stream (career path), all levels included.
 * These are only used for org/team checkout, NOT for individual subscriptions.
 */
export type TeamStreamTier =
  | "stream-water"
  | "stream-wastewater"
  | "stream-water-dist"
  | "stream-wastewater-coll"
  | "all-access";

export const TEAM_STREAM_TIER_LABELS: Record<TeamStreamTier, string> = {
  "stream-water":           "Water Treatment",
  "stream-wastewater":      "Wastewater Treatment",
  "stream-water-dist":      "Water Distribution",
  "stream-wastewater-coll": "Wastewater Collection",
  "all-access":             "All Streams",
};

export const TEAM_STREAM_TIER_DESCRIPTIONS: Record<TeamStreamTier, string> = {
  "stream-water":           "Water treatment — entry level through Class 4",
  "stream-wastewater":      "Wastewater treatment — entry level through Class 4",
  "stream-water-dist":      "Water distribution — entry level through Class 4",
  "stream-wastewater-coll": "Wastewater collection — entry level through Class 4",
  "all-access":             "All four streams, every level",
};

/**
 * Course keys allowed per stream tier per province.
 * Used for entitlement enforcement in grantSeat and OrgDashboard course picker.
 */
export const STREAM_COURSE_KEYS: Record<string, Record<TeamStreamTier, string[]>> = {
  ontario: {
    "stream-water":           ["oit", "class1-water", "class2-water", "class3-water", "class4-water"],
    "stream-wastewater":      ["oit-ww", "class1-ww", "class2-ww", "class3-ww", "class4-ww"],
    "stream-water-dist":      ["oit", "class1-water-dist", "class2-water-dist", "class3-water-dist", "class4-water-dist"],
    "stream-wastewater-coll": ["oit-ww", "class1-wastewater-coll", "class2-wastewater-coll", "class3-wastewater-coll", "class4-wastewater-coll"],
    "all-access":             [
      "oit","oit-ww",
      "class1-water","class1-ww","class1-water-dist","class1-wastewater-coll",
      "class2-water","class2-ww","class2-water-dist","class2-wastewater-coll",
      "class3-water","class3-ww","class3-water-dist","class3-wastewater-coll",
      "class4-water","class4-ww","wqa","class4-water-dist","class4-wastewater-coll",
    ],
  },
  western: {
    "stream-water":           ["wpi-class1-water","wpi-class2-water","wpi-class3-water","wpi-class4-water"],
    "stream-wastewater":      ["wpi-class1-wastewater","wpi-class2-wastewater","wpi-class3-wastewater","wpi-class4-wastewater"],
    "stream-water-dist":      ["wpi-class1-water-dist","wpi-class2-water-dist","wpi-class3-water-dist","wpi-class4-water-dist"],
    "stream-wastewater-coll": ["wpi-class1-water-coll","wpi-class2-water-coll","wpi-class3-water-coll","wpi-class4-water-coll"],
    "all-access":             [
      "wpi-class1-water","wpi-class1-wastewater","wpi-class1-water-dist","wpi-class1-water-coll",
      "wpi-class2-water","wpi-class2-wastewater","wpi-class2-water-dist","wpi-class2-water-coll",
      "wpi-class3-water","wpi-class3-wastewater","wpi-class3-water-dist","wpi-class3-water-coll",
      "wpi-class4-water","wpi-class4-wastewater","wpi-class4-water-dist","wpi-class4-water-coll",
    ],
  },
};

/**
 * Returns the allowed course keys for an org based on its tier and province.
 * Works for both legacy class-level tiers (treated as all-access for backwards compat)
 * and new stream tiers.
 */
export function allowedCourseKeysForOrg(tier: string, province: string): string[] {
  const streamKeys = STREAM_COURSE_KEYS[province];
  if (!streamKeys) return [];
  // New stream tiers
  if (tier in streamKeys) return streamKeys[tier as TeamStreamTier];
  // Legacy class-level tiers: treat as all-access (backwards compatible)
  if (["class1","class2","class3","class4","all-access"].includes(tier)) {
    return streamKeys["all-access"];
  }
  return [];
}

/**
 * Shared entitlement validator for all operator course-assignment paths.
 *
 * Rules enforced:
 * 1. At least one course key must be supplied for operator assignments.
 * 2. Every key must be a valid canonical key for the org's province.
 * 3. Every key must be included in the org's purchased stream tier.
 * 4. Fails closed for unknown, missing, cross-region or unauthorized keys.
 *
 * @param courseKeys  Array of course keys to validate (must be non-empty for operators)
 * @param tier        Organization's purchased tier (e.g. "stream-wastewater-coll")
 * @param province    Organization's province ("ontario" | "western")
 * @param role        "operator" (requires course) | "manager" (may skip course check)
 * @returns           The validated course keys (normalized, same order)
 * @throws            TRPCError BAD_REQUEST or FORBIDDEN with a clear message
 */
export function validateOrgCourseKeys(
  courseKeys: string[],
  tier: string,
  province: string,
  role: "operator" | "manager" = "operator",
): string[] {
  // Rule 1: operators must have at least one course
  if (role === "operator" && courseKeys.length === 0) {
    throw new Error(
      "Select at least one course included in your team plan. " +
      "Every operator must be assigned a specific certification course.",
    );
  }
  // Managers may have no course keys (they get dashboard access, not exam access)
  if (courseKeys.length === 0) return [];

  const allowed = allowedCourseKeysForOrg(tier, province);
  const allRegionalKeys = STREAM_COURSE_KEYS[province]
    ? Object.values(STREAM_COURSE_KEYS[province]).flat()
    : [];

  for (const ck of courseKeys) {
    const normalized = ck.trim().toLowerCase();
    // Rule 2: must be a valid key for this province
    if (!allRegionalKeys.includes(normalized)) {
      throw new Error(
        `'${ck}' is not a valid course for ${province === "western" ? "Western Canada (WPI)" : "Ontario"}. ` +
        `Check the course key and try again.`,
      );
    }
    // Rule 3: must be within the org's purchased stream tier
    if (allowed.length > 0 && !allowed.includes(normalized)) {
      throw new Error(
        `Your plan does not include '${ck}'. ` +
        `Upgrade to All Streams or purchase a matching stream plan to assign this course.`,
      );
    }
  }
  return courseKeys.map(ck => ck.trim().toLowerCase());
}

/**
 * Shared team pricing constants — used by both stripeRouter.ts and Teams.tsx.
 * Values in cents CAD. Single stream = same price regardless of which stream.
 */
export const TEAM_BASE_PRICE: Record<string, Record<TeamStreamTier, number>> = {
  ontario: {
    "stream-water":           19900,
    "stream-wastewater":      19900,
    "stream-water-dist":      19900,
    "stream-wastewater-coll": 19900,
    "all-access":             34900,
  },
  western: {
    "stream-water":           24900,
    "stream-wastewater":      24900,
    "stream-water-dist":      24900,
    "stream-wastewater-coll": 24900,
    "all-access":             44900,
  },
};

/**
 * New volume discount tiers for team plans.
 * Discounts start at 10 seats (department-level), not 25 (city-wide).
 */
export const TEAM_VOLUME_TIERS = [
  { min: 1,  max: 9,    discountPct: 0,  label: "1-9 seats" },
  { min: 10, max: 24,   discountPct: 10, label: "10-24 seats" },
  { min: 25, max: 49,   discountPct: 15, label: "25-49 seats" },
  { min: 50, max: null, discountPct: 20, label: "50+ seats" },
] as const;
export type SubscriptionProvince = "ontario" | "western";

export interface SubscriptionProduct {
  tier: SubscriptionTier;
  province: SubscriptionProvince;
  name: string;
  description: string;
  /** Price in cents CAD */
  priceCAD: number;
  /** Price in cents USD */
  priceUSD: number;
}

/** Ontario (EOCP) subscription products — 2 tracks per class */
const ONTARIO_SUBSCRIPTION_PRODUCTS: SubscriptionProduct[] = [
  {
    tier: "class1",
    province: "ontario",
    name: "Class 1 All-Access — Ontario",
    description: "OIT + Class 1 Water Treatment + Class 1 Wastewater Treatment (MOECP / OWWCO). Annual.",
    priceCAD: 9900,
    priceUSD: 7900,
  },
  {
    tier: "class2",
    province: "ontario",
    name: "Class 2 All-Access — Ontario",
    description: "Class 2 Water Treatment + Class 2 Wastewater Treatment (MOECP / OWWCO). Annual.",
    priceCAD: 14900,
    priceUSD: 10900,
  },
  {
    tier: "class3",
    province: "ontario",
    name: "Class 3 All-Access — Ontario",
    description: "Class 3 Water Treatment + Class 3 Wastewater Treatment (MOECP / OWWCO). Annual.",
    priceCAD: 19900,
    priceUSD: 14900,
  },
  {
    tier: "class4",
    province: "ontario",
    name: "Class 4 All-Access — Ontario",
    description: "Class 4 Water Treatment + Class 4 Wastewater Treatment + WQA (MOECP / OWWCO). Annual.",
    priceCAD: 24900,
    priceUSD: 17900,
  },
  {
    tier: "all-access",
    province: "ontario",
    name: "All-Access Pass — Ontario",
    description: "Every Ontario exam type: all classes, Water Treatment + Wastewater Treatment + WQA. Annual.",
    priceCAD: 34900,
    priceUSD: 24900,
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
    priceUSD: 10900,
  },
  {
    tier: "class2",
    province: "western",
    name: "Class II All-Access — Western Canada",
    description: "Class II Water Treatment + Wastewater Treatment + Water Distribution + Wastewater Collection (WPI). Annual.",
    priceCAD: 19900,
    priceUSD: 14900,
  },
  {
    tier: "class3",
    province: "western",
    name: "Class III All-Access — Western Canada",
    description: "Class III Water Treatment + Wastewater Treatment + Water Distribution + Wastewater Collection (WPI). Annual.",
    priceCAD: 24900,
    priceUSD: 17900,
  },
  {
    tier: "class4",
    province: "western",
    name: "Class IV All-Access — Western Canada",
    description: "Class IV Water Treatment + Wastewater Treatment + Water Distribution + Wastewater Collection (WPI). Annual.",
    priceCAD: 29900,
    priceUSD: 21900,
  },
  {
    tier: "all-access",
    province: "western",
    name: "All-Access Pass — Western Canada",
    description: "Every WPI exam type: all classes, all 4 tracks (Water Treatment, Wastewater Treatment, Water Distribution, Wastewater Collection). Annual.",
    priceCAD: 44900,
    priceUSD: 32900,
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
