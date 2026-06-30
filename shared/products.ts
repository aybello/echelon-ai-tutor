/**
 * Echelon Institute — Shared Product Catalog
 *
 * This is the SINGLE SOURCE OF TRUTH for all product keys, prices, names,
 * and study paths. Both the server (Stripe billing) and the client (Pricing page)
 * import from here. Never duplicate this data.
 *
 * All prices are in CAD cents (e.g. 4900 = CA$49.00)
 */

export interface EchelonProduct {
  key: string;
  name: string;
  shortName: string;
  description: string;
  priceCAD: number; // cents
  examTypes: string[];
  badge?: string;
  highlight?: boolean;
}

export interface ProductStudyPaths {
  quizPath: string;
  mockPath: string;
}

// ── Individual Products ───────────────────────────────────────────────────────

export const INDIVIDUAL_PRODUCTS: EchelonProduct[] = [
  {
    key: "oit",
    shortName: "OIT",
    name: "OIT Practice Pass",
    description: "Full OIT (Operator-in-Training) question bank — 500+ questions, adaptive difficulty, AI Tutor, score history. Unlimited attempts.",
    priceCAD: 4900,
    examTypes: ["oit"],
  },
  {
    key: "oit-ww",
    shortName: "OIT Wastewater",
    name: "OIT Wastewater Practice Pass",
    description: "Full OIT Wastewater question bank — 500+ questions covering wastewater collection, treatment principles, and Ontario O. Reg. 129/04. Adaptive difficulty, AI Tutor, score history. Unlimited attempts.",
    priceCAD: 4900,
    examTypes: ["oit-ww"],
  },
  {
    key: "class1-water",
    shortName: "Class 1 Water",
    name: "Class 1 Water Treatment Practice Pass",
    description: "Full Class 1 Water Treatment question bank — 500+ questions, adaptive difficulty, AI Tutor, score history. Unlimited attempts.",
    priceCAD: 9900,
    examTypes: ["class1-water"],
  },
  {
    key: "class2-water",
    shortName: "Class 2 Water",
    name: "Class 2 Water Treatment Practice Pass",
    description: "Full Class 2 Water Treatment question bank — 500 questions across 5 modules, adaptive difficulty, AI Tutor, score history. Unlimited attempts.",
    priceCAD: 14900,
    examTypes: ["class2-water"],
  },
  {
    key: "class3-water",
    shortName: "Class 3 Water",
    name: "Class 3 Water Treatment Practice Pass",
    description: "Full Class 3 Water Treatment question bank — 500+ questions, adaptive difficulty, AI Tutor, score history. Unlimited attempts.",
    priceCAD: 24900,
    examTypes: ["class3-water"],
  },
  {
    key: "class4-water",
    shortName: "Class 4 Water",
    name: "Class 4 Water Treatment Practice Pass",
    description: "Full Class 4 Water Treatment question bank — 500+ questions, adaptive difficulty, AI Tutor, score history. Unlimited attempts.",
    priceCAD: 29900,
    examTypes: ["class4-water"],
  },
  {
    key: "class1-ww",
    shortName: "Class 1 Wastewater",
    name: "Class 1 Wastewater Treatment Practice Pass",
    description: "Full Class 1 Wastewater Treatment question bank — 500+ questions, adaptive difficulty, AI Tutor, score history. Unlimited attempts.",
    priceCAD: 9900,
    examTypes: ["class1-ww"],
  },
  {
    key: "class2-ww",
    shortName: "Class 2 Wastewater",
    name: "Class 2 Wastewater Treatment Practice Pass",
    description: "Full Class 2 Wastewater Treatment question bank — 500+ questions, adaptive difficulty, AI Tutor, score history. Unlimited attempts.",
    priceCAD: 14900,
    examTypes: ["class2-ww"],
  },
  {
    key: "class3-ww",
    shortName: "Class 3 Wastewater",
    name: "Class 3 Wastewater Treatment Practice Pass",
    description: "Full Class 3 Wastewater Treatment question bank — 500+ questions, adaptive difficulty, AI Tutor, score history. Unlimited attempts.",
    priceCAD: 24900,
    examTypes: ["class3-ww"],
  },
  {
    key: "class4-ww",
    shortName: "Class 4 Wastewater",
    name: "Class 4 Wastewater Treatment Practice Pass",
    description: "Full Class 4 Wastewater Treatment question bank — 500+ questions, adaptive difficulty, AI Tutor, score history. Unlimited attempts.",
    priceCAD: 29900,
    examTypes: ["class4-ww"],
  },
  {
    key: "wqa",
    shortName: "WQA",
    name: "WQA Practice Pass",
    description: "Full Water Quality Analyst question bank — 500+ questions, adaptive difficulty, AI Tutor, score history. Unlimited attempts.",
    priceCAD: 14900,
    examTypes: ["wqa"],
  },
  // ── WPI (BC / AB / SK / MB) ──────────────────────────────────────────────
  {
    key: "wpi-class1-water",
    shortName: "WPI Class I Water",
    name: "WPI Class I Water Treatment Practice Pass",
    description: "WPI Class I Water Treatment — 502 questions across 5 modules. Aligned with WPI Need-to-Know Criteria. Recognized by EOCP (BC), AWWOA (AB), SAHO (SK), and MWWA (MB). Adaptive difficulty, AI Tutor, score history. Unlimited attempts.",
    priceCAD: 14900,
    examTypes: ["wpi-class1-water"],
  },
  {
    key: "wpi-class2-water",
    shortName: "WPI Class II Water",
    name: "WPI Class II Water Treatment Practice Pass",
    description: "WPI Class II Water Treatment — 501 questions across 5 advanced modules. Aligned with WPI Class II Need-to-Know Criteria. Recognized by EOCP (BC), AWWOA (AB), SAHO (SK), and MWWA (MB). Adaptive difficulty, AI Tutor, score history. Unlimited attempts.",
    priceCAD: 19900,
    examTypes: ["wpi-class2-water"],
  },
  {
    key: "wpi-class3-water",
    shortName: "WPI Class III Water",
    name: "WPI Class III Water Treatment Practice Pass",
    description: "WPI Class III Water Treatment — 502 questions across 5 advanced modules. Aligned with WPI Class III Need-to-Know Criteria. Recognized by EOCP (BC), AWWOA (AB), SAHO (SK), and MWWA (MB). Adaptive difficulty, AI Tutor, score history. Unlimited attempts.",
    priceCAD: 24900,
    examTypes: ["wpi-class3-water"],
  },
  {
    key: "wpi-class4-water",
    shortName: "WPI Class IV Water",
    name: "WPI Class IV Water Treatment Practice Pass",
    description: "WPI Class IV Water Treatment — 501 questions across 6 chief-operator modules. Aligned with WPI Class IV Need-to-Know Criteria. Recognized by EOCP (BC), AWWOA (AB), SAHO (SK), and MWWA (MB). Adaptive difficulty, AI Tutor, score history. Unlimited attempts.",
    priceCAD: 29900,
    examTypes: ["wpi-class4-water"],
  },
  {
    key: "wpi-class1-wastewater",
    shortName: "WPI Class I Wastewater",
    name: "WPI Class I Wastewater Treatment Practice Pass",
    description: "WPI Class I Wastewater Treatment — 500 questions across 5 modules. Aligned with WPI Class I Wastewater Need-to-Know Criteria. Recognized by EOCP (BC), AWWOA (AB), SAHO (SK), and MWWA (MB). Adaptive difficulty, AI Tutor, score history. Unlimited attempts.",
    priceCAD: 14900,
    examTypes: ["wpi-class1-wastewater"],
  },
  {
    key: "wpi-class2-wastewater",
    shortName: "WPI Class II Wastewater",
    name: "WPI Class II Wastewater Treatment Practice Pass",
    description: "WPI Class II Wastewater Treatment — 501 questions across 5 advanced modules. Aligned with WPI Class II Wastewater Need-to-Know Criteria. Recognized by EOCP (BC), AWWOA (AB), SAHO (SK), and MWWA (MB). Adaptive difficulty, AI Tutor, score history. Unlimited attempts.",
    priceCAD: 19900,
    examTypes: ["wpi-class2-wastewater"],
  },
  {
    key: "wpi-class3-wastewater",
    shortName: "WPI Class III Wastewater",
    name: "WPI Class III Wastewater Treatment Practice Pass",
    description: "WPI Class III Wastewater Treatment — 501 questions across 8 senior-operator modules. Aligned with WPI Class III Wastewater Need-to-Know Criteria. Recognized by EOCP (BC), AWWOA (AB), SAHO (SK), and MWWA (MB). Adaptive difficulty, AI Tutor, score history. Unlimited attempts.",
    priceCAD: 24900,
    examTypes: ["wpi-class3-wastewater"],
  },
  {
    key: "wpi-class4-wastewater",
    shortName: "WPI Class IV Wastewater",
    name: "WPI Class IV Wastewater Treatment Practice Pass",
    description: "WPI Class IV Wastewater Treatment — 502 questions across 7 chief-operator modules. Aligned with WPI Class IV Wastewater Need-to-Know Criteria. Recognized by EOCP (BC), AWWOA (AB), SAHO (SK), and MWWA (MB). Adaptive difficulty, AI Tutor, score history. Unlimited attempts.",
    priceCAD: 29900,
    examTypes: ["wpi-class4-wastewater"],
  },
  // ── WPI Wastewater Collection ─────────────────────────────────────────────
  {
    key: "wpi-class1-water-coll",
    shortName: "WPI Class I Collection",
    name: "WPI Class I Wastewater Collection Practice Pass",
    description: "WPI Class I Wastewater Collection — 150 questions. Aligned with WPI Class I Wastewater Collection Need-to-Know Criteria. Recognized by EOCP (BC), AWWOA (AB), SAHO (SK), and MWWA (MB). Adaptive difficulty, AI Tutor, score history. Unlimited attempts.",
    priceCAD: 14900,
    examTypes: ["wpi-class1-water-coll"],
  },
  {
    key: "wpi-class2-water-coll",
    shortName: "WPI Class II Collection",
    name: "WPI Class II Wastewater Collection Practice Pass",
    description: "WPI Class II Wastewater Collection — 150 questions. Aligned with WPI Class II Wastewater Collection Need-to-Know Criteria. Recognized by EOCP (BC), AWWOA (AB), SAHO (SK), and MWWA (MB). Adaptive difficulty, AI Tutor, score history. Unlimited attempts.",
    priceCAD: 19900,
    examTypes: ["wpi-class2-water-coll"],
  },
  {
    key: "wpi-class3-water-coll",
    shortName: "WPI Class III Collection",
    name: "WPI Class III Wastewater Collection Practice Pass",
    description: "WPI Class III Wastewater Collection — 150 questions. Aligned with WPI Class III Wastewater Collection Need-to-Know Criteria. Recognized by EOCP (BC), AWWOA (AB), SAHO (SK), and MWWA (MB). Adaptive difficulty, AI Tutor, score history. Unlimited attempts.",
    priceCAD: 24900,
    examTypes: ["wpi-class3-water-coll"],
  },
  {
    key: "wpi-class4-water-coll",
    shortName: "WPI Class IV Collection",
    name: "WPI Class IV Wastewater Collection Practice Pass",
    description: "WPI Class IV Wastewater Collection — 150 questions. Aligned with WPI Class IV Wastewater Collection Need-to-Know Criteria. Recognized by EOCP (BC), AWWOA (AB), SAHO (SK), and MWWA (MB). Adaptive difficulty, AI Tutor, score history. Unlimited attempts.",
    priceCAD: 29900,
    examTypes: ["wpi-class4-water-coll"],
  },
  // ── Ontario Water Distribution sub-courses ─────────────────────────────────
  {
    key: "class1-water-dist",
    shortName: "Class 1 Distribution",
    name: "Class 1 Water Distribution Practice Pass",
    description: "Ontario Class 1 Water Distribution — 500 questions. Covers pipe materials, valve operation, hydrant maintenance, and pressure management. Aligned with OWWCO Class 1 certification. Adaptive difficulty, AI Tutor, score history. Unlimited attempts.",
    priceCAD: 9900,
    examTypes: ["class1-water-dist"],
  },
  {
    key: "class2-water-dist",
    shortName: "Class 2 Distribution",
    name: "Class 2 Water Distribution Practice Pass",
    description: "Ontario Class 2 Water Distribution — 500 questions. Covers system design, water main installation, cross-connection control, and distribution operations. Aligned with OWWCO Class 2 certification. Adaptive difficulty, AI Tutor, score history. Unlimited attempts.",
    priceCAD: 14900,
    examTypes: ["class2-water-dist"],
  },
  {
    key: "class3-water-dist",
    shortName: "Class 3 Distribution",
    name: "Class 3 Water Distribution Practice Pass",
    description: "Ontario Class 3 Water Distribution — 500 questions. Covers advanced hydraulics, system modelling, asset management, and distribution system planning. Aligned with OWWCO Class 3 certification. Adaptive difficulty, AI Tutor, score history. Unlimited attempts.",
    priceCAD: 24900,
    examTypes: ["class3-water-dist"],
  },
  {
    key: "class4-water-dist",
    shortName: "Class 4 Distribution",
    name: "Class 4 Water Distribution Practice Pass",
    description: "Ontario Class 4 Water Distribution — 500 questions. Covers strategic asset management, risk-based frameworks, KPIs, capital planning, and regulatory compliance. Aligned with OWWCO Class 4 certification. Adaptive difficulty, AI Tutor, score history. Unlimited attempts.",
    priceCAD: 29900,
    examTypes: ["class4-water-dist"],
  },
  // ── Ontario Wastewater Collection sub-courses ─────────────────────────────
  {
    key: "class1-wastewater-coll",
    shortName: "Class 1 Collection",
    name: "Class 1 Wastewater Collection Practice Pass",
    description: "Ontario Class 1 Wastewater Collection — 500 questions. Covers collection system basics, I/I identification, manhole inspection, and O. Reg. 129/04. Aligned with OWWCO Class 1 certification. Adaptive difficulty, AI Tutor, score history. Unlimited attempts.",
    priceCAD: 9900,
    examTypes: ["class1-wastewater-coll"],
  },
  {
    key: "class2-wastewater-coll",
    shortName: "Class 2 Collection",
    name: "Class 2 Wastewater Collection Practice Pass",
    description: "Ontario Class 2 Wastewater Collection — 500 questions. Covers collection system design, sewer rehabilitation, pump station operations, and CSO management. Aligned with OWWCO Class 2 certification. Adaptive difficulty, AI Tutor, score history. Unlimited attempts.",
    priceCAD: 14900,
    examTypes: ["class2-wastewater-coll"],
  },
  {
    key: "class3-wastewater-coll",
    shortName: "Class 3 Collection",
    name: "Class 3 Wastewater Collection Practice Pass",
    description: "Ontario Class 3 Wastewater Collection — 500 questions. Covers advanced collection system hydraulics, CCTV inspection, force main design, and Long-Term Control Plans. Aligned with OWWCO Class 3 certification. Adaptive difficulty, AI Tutor, score history. Unlimited attempts.",
    priceCAD: 24900,
    examTypes: ["class3-wastewater-coll"],
  },
  {
    key: "class4-wastewater-coll",
    shortName: "Class 4 Collection",
    name: "Class 4 Wastewater Collection Practice Pass",
    description: "Ontario Class 4 Wastewater Collection — 500 questions. Covers strategic collection system management, lifecycle cost optimization, green infrastructure, and regulatory compliance. Aligned with OWWCO Class 4 certification. Adaptive difficulty, AI Tutor, score history. Unlimited attempts.",
    priceCAD: 29900,
    examTypes: ["class4-wastewater-coll"],
  },
  // ── WPI Water Distribution ────────────────────────────────────────────────
  {
    key: "wpi-class1-water-dist",
    shortName: "WPI Class I Distribution",
    name: "WPI Class I Water Distribution Practice Pass",
    description: "WPI Class I Water Distribution — 150 questions. Aligned with WPI Class I Water Distribution Need-to-Know Criteria. Recognized by EOCP (BC), AWWOA (AB), SAHO (SK), and MWWA (MB). Adaptive difficulty, AI Tutor, score history. Unlimited attempts.",
    priceCAD: 14900,
    examTypes: ["wpi-class1-water-dist"],
  },
  {
    key: "wpi-class2-water-dist",
    shortName: "WPI Class II Distribution",
    name: "WPI Class II Water Distribution Practice Pass",
    description: "WPI Class II Water Distribution — 136 questions. Aligned with WPI Class II Water Distribution Need-to-Know Criteria. Recognized by EOCP (BC), AWWOA (AB), SAHO (SK), and MWWA (MB). Adaptive difficulty, AI Tutor, score history. Unlimited attempts.",
    priceCAD: 19900,
    examTypes: ["wpi-class2-water-dist"],
  },
  {
    key: "wpi-class3-water-dist",
    shortName: "WPI Class III Distribution",
    name: "WPI Class III Water Distribution Practice Pass",
    description: "WPI Class III Water Distribution — 150 questions. Aligned with WPI Class III Water Distribution Need-to-Know Criteria. Recognized by EOCP (BC), AWWOA (AB), SAHO (SK), and MWWA (MB). Adaptive difficulty, AI Tutor, score history. Unlimited attempts.",
    priceCAD: 24900,
    examTypes: ["wpi-class3-water-dist"],
  },
  {
    key: "wpi-class4-water-dist",
    shortName: "WPI Class IV Distribution",
    name: "WPI Class IV Water Distribution Practice Pass",
    description: "WPI Class IV Water Distribution — 150 questions. Aligned with WPI Class IV Water Distribution Need-to-Know Criteria. Recognized by EOCP (BC), AWWOA (AB), SAHO (SK), and MWWA (MB). Adaptive difficulty, AI Tutor, score history. Unlimited attempts.",
    priceCAD: 29900,
    examTypes: ["wpi-class4-water-dist"],
  },
];

export const ALL_PRODUCTS = [...INDIVIDUAL_PRODUCTS];

/** Maps product key to quiz and mock exam paths */
export const PRODUCT_STUDY_PATHS: Record<string, ProductStudyPaths> = {
  "oit":                    { quizPath: "/quiz",                      mockPath: "/oit-mock" },
  "oit-ww":                 { quizPath: "/oit-ww",                    mockPath: "/oit-ww-mock" },
  "class1-water":           { quizPath: "/class1-water",              mockPath: "/class1-water-mock" },
  "class1-ww":              { quizPath: "/class1-ww",                 mockPath: "/class1-ww-mock" },
  "class2-water":           { quizPath: "/class2-water",              mockPath: "/class2-water-mock" },
  "class2-ww":              { quizPath: "/class2-ww",                 mockPath: "/class2-ww-mock" },
  "class3-water":           { quizPath: "/class3-water",              mockPath: "/class3-water-mock" },
  "class3-ww":              { quizPath: "/class3-ww",                 mockPath: "/class3-ww-mock" },
  "class4-water":           { quizPath: "/class4-water",              mockPath: "/class4-water-mock" },
  "class4-ww":              { quizPath: "/class4-ww",                 mockPath: "/class4-ww-mock" },
  "wqa":                    { quizPath: "/wqa",                       mockPath: "/wqa-mock" },
  "wpi-class1-water":       { quizPath: "/wpi-class1-water",          mockPath: "/wpi-class1-water-mock" },
  "wpi-class2-water":       { quizPath: "/wpi-class2-water",          mockPath: "/wpi-class2-water-mock" },
  "wpi-class3-water":       { quizPath: "/wpi-class3-water",          mockPath: "/wpi-class3-water-mock" },
  "wpi-class4-water":       { quizPath: "/wpi-class4-water",          mockPath: "/wpi-class4-water-mock" },
  "wpi-class1-wastewater":  { quizPath: "/wpi-class1-wastewater",     mockPath: "/wpi-class1-wastewater-mock" },
  "wpi-class2-wastewater":  { quizPath: "/wpi-class2-wastewater",     mockPath: "/wpi-class2-wastewater-mock" },
  "wpi-class3-wastewater":  { quizPath: "/wpi-class3-wastewater",     mockPath: "/wpi-class3-wastewater-mock" },
  "wpi-class4-wastewater":  { quizPath: "/wpi-class4-wastewater",     mockPath: "/wpi-class4-wastewater-mock" },
  "wpi-class1-water-dist":  { quizPath: "/wpi-class1-water-dist",     mockPath: "/wpi-class1-water-dist-mock" },
  "wpi-class2-water-dist":  { quizPath: "/wpi-class2-water-dist",     mockPath: "/wpi-class2-water-dist-mock" },
  "wpi-class3-water-dist":  { quizPath: "/wpi-class3-water-dist",     mockPath: "/wpi-class3-water-dist-mock" },
  "wpi-class4-water-dist":  { quizPath: "/wpi-class4-water-dist",     mockPath: "/wpi-class4-water-dist-mock" },
  "wpi-class1-water-coll":  { quizPath: "/wpi-class1-water-coll",     mockPath: "/wpi-class1-water-coll-mock" },
  "wpi-class2-water-coll":  { quizPath: "/wpi-class2-water-coll",     mockPath: "/wpi-class2-water-coll-mock" },
  "wpi-class3-water-coll":  { quizPath: "/wpi-class3-water-coll",     mockPath: "/wpi-class3-water-coll-mock" },
  "wpi-class4-water-coll":  { quizPath: "/wpi-class4-water-coll",     mockPath: "/wpi-class4-water-coll-mock" },
  "class1-water-dist":      { quizPath: "/class1-water-dist",         mockPath: "/class1-water-dist-mock" },
  "class2-water-dist":      { quizPath: "/class2-water-dist",         mockPath: "/class2-water-dist-mock" },
  "class3-water-dist":      { quizPath: "/class3-water-dist",         mockPath: "/class3-water-dist-mock" },
  "class4-water-dist":      { quizPath: "/class4-water-dist",         mockPath: "/class4-water-dist-mock" },
  "class1-wastewater-coll": { quizPath: "/class1-wastewater-coll",    mockPath: "/class1-wastewater-coll-mock" },
  "class2-wastewater-coll": { quizPath: "/class2-wastewater-coll",    mockPath: "/class2-wastewater-coll-mock" },
  "class3-wastewater-coll": { quizPath: "/class3-wastewater-coll",    mockPath: "/class3-wastewater-coll-mock" },
  "class4-wastewater-coll": { quizPath: "/class4-wastewater-coll",    mockPath: "/class4-wastewater-coll-mock" },
};

/** Given a product key, return all exam types it unlocks */
export function getUnlockedExamTypes(productKey: string): string[] {
  const product = ALL_PRODUCTS.find(p => p.key === productKey);
  return product?.examTypes ?? [];
}

/** Given a list of purchased product keys, return all unlocked exam types */
export function getAllUnlockedExamTypes(productKeys: string[]): string[] {
  const types = new Set<string>();
  for (const key of productKeys) {
    for (const t of getUnlockedExamTypes(key)) {
      types.add(t);
    }
  }
  return Array.from(types);
}

// ── Team seat course options ──────────────────────────────────────────────────
/**
 * Available course options for team seat assignment, grouped by province.
 * Each entry maps a courseKey (= individual product key) to a human-readable label.
 * The courseKey is stored on the organization_members row and used to derive the
 * subscription tier when granting access.
 */
export interface TeamCourseOption {
  key: string;   // individual product key, e.g. 'class3-water'
  label: string; // display label for the manager UI
  tier: string;  // subscription tier this course maps to, e.g. 'class3'
}

export const TEAM_COURSES_ONTARIO: TeamCourseOption[] = [
  { key: "oit",          label: "OIT (Water)",                    tier: "class1" },
  { key: "oit-ww",       label: "OIT (Wastewater)",               tier: "class1" },
  { key: "class1-water", label: "Class 1 — Water Treatment",      tier: "class1" },
  { key: "class1-ww",    label: "Class 1 — Wastewater Treatment", tier: "class1" },
  { key: "class2-water", label: "Class 2 — Water Treatment",      tier: "class2" },
  { key: "class2-ww",    label: "Class 2 — Wastewater Treatment", tier: "class2" },
  { key: "class3-water", label: "Class 3 — Water Treatment",      tier: "class3" },
  { key: "class3-ww",    label: "Class 3 — Wastewater Treatment", tier: "class3" },
  { key: "class4-water", label: "Class 4 — Water Treatment",      tier: "class4" },
  { key: "class4-ww",    label: "Class 4 — Wastewater Treatment", tier: "class4" },
  { key: "wqa",                label: "Water Quality Analyst (WQA)",        tier: "class4" },
  { key: "class1-water-dist",   label: "Class 1 — Water Distribution",       tier: "class1" },
  { key: "class1-wastewater-coll", label: "Class 1 — Wastewater Collection",  tier: "class1" },
  { key: "class2-water-dist",   label: "Class 2 — Water Distribution",       tier: "class2" },
  { key: "class2-wastewater-coll", label: "Class 2 — Wastewater Collection",  tier: "class2" },
  { key: "class3-water-dist",   label: "Class 3 — Water Distribution",       tier: "class3" },
  { key: "class3-wastewater-coll", label: "Class 3 — Wastewater Collection",  tier: "class3" },
  { key: "class4-water-dist",   label: "Class 4 — Water Distribution",       tier: "class4" },
  { key: "class4-wastewater-coll", label: "Class 4 — Wastewater Collection",  tier: "class4" },
];

export const TEAM_COURSES_WESTERN: TeamCourseOption[] = [
  { key: "wpi-class1-water",       label: "Class I — Water Treatment",         tier: "class1" },
  { key: "wpi-class1-wastewater",  label: "Class I — Wastewater Treatment",    tier: "class1" },
  { key: "wpi-class1-water-dist",  label: "Class I — Water Distribution",      tier: "class1" },
  { key: "wpi-class1-water-coll",  label: "Class I — Wastewater Collection",   tier: "class1" },
  { key: "wpi-class2-water",       label: "Class II — Water Treatment",        tier: "class2" },
  { key: "wpi-class2-wastewater",  label: "Class II — Wastewater Treatment",   tier: "class2" },
  { key: "wpi-class2-water-dist",  label: "Class II — Water Distribution",     tier: "class2" },
  { key: "wpi-class2-water-coll",  label: "Class II — Wastewater Collection",  tier: "class2" },
  { key: "wpi-class3-water",       label: "Class III — Water Treatment",       tier: "class3" },
  { key: "wpi-class3-wastewater",  label: "Class III — Wastewater Treatment",  tier: "class3" },
  { key: "wpi-class3-water-dist",  label: "Class III — Water Distribution",    tier: "class3" },
  { key: "wpi-class3-water-coll",  label: "Class III — Wastewater Collection", tier: "class3" },
  { key: "wpi-class4-water",       label: "Class IV — Water Treatment",        tier: "class4" },
  { key: "wpi-class4-wastewater",  label: "Class IV — Wastewater Treatment",   tier: "class4" },
  { key: "wpi-class4-water-dist",  label: "Class IV — Water Distribution",     tier: "class4" },
  { key: "wpi-class4-water-coll",  label: "Class IV — Wastewater Collection",  tier: "class4" },
];

/** Get course options for a given province */
export function getTeamCourseOptions(province: string): TeamCourseOption[] {
  return province === "western" ? TEAM_COURSES_WESTERN : TEAM_COURSES_ONTARIO;
}

/** Check whether a courseKey is valid for the given province */
export function isValidCourseKey(courseKey: string, province: string): boolean {
  const options = getTeamCourseOptions(province);
  return options.some(o => o.key === courseKey);
}

/**
 * Given a courseKey, return the subscription tier it maps to.
 * FAIL-CLOSED: returns null for unknown or cross-province keys.
 * Use this for all access-granting paths.
 */
export function courseKeyToTierStrict(courseKey: string, province: string): string | null {
  const options = getTeamCourseOptions(province);
  return options.find(o => o.key === courseKey)?.tier ?? null;
}

/**
 * @deprecated Use courseKeyToTierStrict from shared/courseRegistry.ts instead.
 * This legacy version silently falls back to "all-access" for unknown keys — dangerous for access-granting paths.
 * Kept for backward compatibility only — do not use in new code.
 */
export function courseKeyToTier(courseKey: string, province: string): string {
  return courseKeyToTierStrict(courseKey, province) ?? "all-access";
}

/**
 * @deprecated Use courseKeyToLabel from shared/courseRegistry.ts instead.
 * Kept for backward compatibility only — do not use in new code.
 */
export function courseKeyToLabel(courseKey: string, province: string): string {
  const options = getTeamCourseOptions(province);
  return options.find(o => o.key === courseKey)?.label ?? courseKey;
}
