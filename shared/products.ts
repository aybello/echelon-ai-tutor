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
