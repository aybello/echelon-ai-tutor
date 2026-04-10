/**
 * Echelon Institute — Stripe Product Definitions
 * All prices are in CAD cents (e.g. 5900 = CA$59.00)
 *
 * Pricing strategy: career-accelerator positioning
 *   OIT / OIT-WW:       $59
 *   Class 1 / WPI I:    $149
 *   Class 2 / WPI II:   $199
 *   Class 3 / WPI III:  $349
 *   Class 4 / WPI IV:   $499
 *   WQA:                $179
 */

export interface EchelonProduct {
  key: string;          // internal key used for gating
  name: string;
  description: string;
  priceCAD: number;     // in cents
  examTypes: string[];  // which quiz/mock exam types this unlocks
}

export const INDIVIDUAL_PRODUCTS: EchelonProduct[] = [
  {
    key: "oit",
    name: "OIT Practice Pass",
    description: "Full OIT (Operator-in-Training) question bank — 500+ questions, adaptive difficulty, AI Tutor, score history. Unlimited attempts.",
    priceCAD: 4900,
    examTypes: ["oit"],
  },
  {
    key: "oit-ww",
    name: "OIT Wastewater Practice Pass",
    description: "Full OIT Wastewater question bank — 500+ questions covering wastewater collection, treatment principles, and Ontario O. Reg. 129/04. Adaptive difficulty, AI Tutor, score history. Unlimited attempts.",
    priceCAD: 4900,
    examTypes: ["oit-ww"],
  },
  {
    key: "class1-water",
    name: "Class 1 Water Treatment Practice Pass",
    description: "Full Class 1 Water Treatment question bank — 500+ questions, adaptive difficulty, AI Tutor, score history. Unlimited attempts.",
    priceCAD: 9900,
    examTypes: ["class1-water"],
  },
  {
    key: "class2-water",
    name: "Class 2 Water Treatment Practice Pass",
    description: "Full Class 2 Water Treatment question bank — 500 questions across 5 modules, adaptive difficulty, AI Tutor, score history. Unlimited attempts.",
    priceCAD: 14900,
    examTypes: ["class2-water"],
  },
  {
    key: "class3-water",
    name: "Class 3 Water Treatment Practice Pass",
    description: "Full Class 3 Water Treatment question bank — 500+ questions, adaptive difficulty, AI Tutor, score history. Unlimited attempts.",
    priceCAD: 24900,
    examTypes: ["class3-water"],
  },
  {
    key: "class4-water",
    name: "Class 4 Water Treatment Practice Pass",
    description: "Full Class 4 Water Treatment question bank — 500+ questions, adaptive difficulty, AI Tutor, score history. Unlimited attempts.",
    priceCAD: 29900,
    examTypes: ["class4-water"],
  },
  {
    key: "class1-ww",
    name: "Class 1 Wastewater Treatment Practice Pass",
    description: "Full Class 1 Wastewater Treatment question bank — 500+ questions, adaptive difficulty, AI Tutor, score history. Unlimited attempts.",
    priceCAD: 9900,
    examTypes: ["class1-ww"],
  },
  {
    key: "class2-ww",
    name: "Class 2 Wastewater Treatment Practice Pass",
    description: "Full Class 2 Wastewater Treatment question bank — 500+ questions, adaptive difficulty, AI Tutor, score history. Unlimited attempts.",
    priceCAD: 14900,
    examTypes: ["class2-ww"],
  },
  {
    key: "class3-ww",
    name: "Class 3 Wastewater Treatment Practice Pass",
    description: "Full Class 3 Wastewater Treatment question bank — 500+ questions, adaptive difficulty, AI Tutor, score history. Unlimited attempts.",
    priceCAD: 24900,
    examTypes: ["class3-ww"],
  },
  {
    key: "class4-ww",
    name: "Class 4 Wastewater Treatment Practice Pass",
    description: "Full Class 4 Wastewater Treatment question bank — 500+ questions, adaptive difficulty, AI Tutor, score history. Unlimited attempts.",
    priceCAD: 29900,
    examTypes: ["class4-ww"],
  },
  {
    key: "wqa",
    name: "WQA Practice Pass",
    description: "Full Water Quality Analyst question bank — 500+ questions, adaptive difficulty, AI Tutor, score history. Unlimited attempts.",
    priceCAD: 14900,
    examTypes: ["wqa"],
  },
  // ── WPI (BC / AB / SK / MB) ──────────────────────────────────────────────
  {
    key: "wpi-class1-water",
    name: "WPI Class I Water Treatment Practice Pass",
    description: "WPI Class I Water Treatment — 502 questions across 5 modules: Treatment Process, Equipment O&M, Lab Analysis, Source Water, and Safety & Admin. Aligned with WPI Need-to-Know Criteria. Recognized by EOCP (BC), AWWOA (AB), SAHO (SK), and MWWA (MB). Adaptive difficulty, AI Tutor, score history. Unlimited attempts.",
    priceCAD: 9900,
    examTypes: ["wpi-class1-water"],
  },
  {
    key: "wpi-class2-water",
    name: "WPI Class II Water Treatment Practice Pass",
    description: "WPI Class II Water Treatment — 501 questions across 5 advanced modules: Advanced Treatment Processes, System Design & Engineering, Advanced Laboratory & Monitoring, Source Water & Environmental, and Management, Regulations & Safety. Aligned with WPI Class II Need-to-Know Criteria. Recognized by EOCP (BC), AWWOA (AB), SAHO (SK), and MWWA (MB). Adaptive difficulty, AI Tutor, score history. Unlimited attempts.",
    priceCAD: 14900,
    examTypes: ["wpi-class2-water"],
  },
  {
    key: "wpi-class3-water",
    name: "WPI Class III Water Treatment Practice Pass",
    description: "WPI Class III Water Treatment — 502 questions across 5 advanced modules: Advanced Treatment & Disinfection, Filtration & Membrane Systems, Process Control & Optimization, Distribution System Management, and Regulatory Compliance & QMS. Aligned with WPI Class III Need-to-Know Criteria. Recognized by EOCP (BC), AWWOA (AB), SAHO (SK), and MWWA (MB). Adaptive difficulty, AI Tutor, score history. Unlimited attempts.",
    priceCAD: 24900,
    examTypes: ["wpi-class3-water"],
  },
  {
    key: "wpi-class4-water",
    name: "WPI Class IV Water Treatment Practice Pass",
    description: "WPI Class IV Water Treatment — 501 questions across 6 chief-operator modules: Advanced Process Control, Advanced Water Quality, Emergency Response & Contingency Planning, Plant Management & Leadership, Regulatory Compliance & Reporting, and Source Water Protection. Aligned with WPI Class IV Need-to-Know Criteria. Recognized by EOCP (BC), AWWOA (AB), SAHO (SK), and MWWA (MB). Adaptive difficulty, AI Tutor, score history. Unlimited attempts.",
    priceCAD: 29900,
    examTypes: ["wpi-class4-water"],
  },
  {
    key: "wpi-class1-wastewater",
    name: "WPI Class I Wastewater Treatment Practice Pass",
    description: "WPI Class I Wastewater Treatment — 500 questions across 5 modules: Wastewater Collection Systems, Primary & Secondary Treatment, Solids Handling & Biosolids, Laboratory & Monitoring, Safety & Regulations. Aligned with WPI Class I Wastewater Need-to-Know Criteria. Recognized by EOCP (BC), AWWOA (AB), SAHO (SK), and MWWA (MB). Adaptive difficulty, AI Tutor, score history. Unlimited attempts.",
    priceCAD: 9900,
    examTypes: ["wpi-class1-wastewater"],
  },
  {
    key: "wpi-class2-wastewater",
    name: "WPI Class II Wastewater Treatment Practice Pass",
    description: "WPI Class II Wastewater Treatment — 501 questions across 5 advanced modules: Secondary Treatment, Nutrient Removal, Biosolids Management, Advanced Treatment, and Process Control & Safety. Aligned with WPI Class II Wastewater Need-to-Know Criteria. Recognized by EOCP (BC), AWWOA (AB), SAHO (SK), and MWWA (MB). Adaptive difficulty, AI Tutor, score history. Unlimited attempts.",
    priceCAD: 14900,
    examTypes: ["wpi-class2-wastewater"],
  },
  {
    key: "wpi-class3-wastewater",
    name: "WPI Class III Wastewater Treatment Practice Pass",
    description: "WPI Class III Wastewater Treatment — 501 questions across 8 senior-operator modules: Advanced Biological Treatment, Biological Nutrient Removal, Membrane Bioreactors & Advanced Processes, Industrial Pretreatment & Toxicity, Advanced Biosolids Management, Regulatory Compliance & Reporting, Advanced Process Control & Troubleshooting, and Health, Safety & Environmental Management. Aligned with WPI Class III Wastewater Need-to-Know Criteria. Recognized by EOCP (BC), AWWOA (AB), SAHO (SK), and MWWA (MB). Adaptive difficulty, AI Tutor, score history. Unlimited attempts.",
    priceCAD: 24900,
    examTypes: ["wpi-class3-wastewater"],
  },
  {
    key: "wpi-class4-wastewater",
    name: "WPI Class IV Wastewater Treatment Practice Pass",
    description: "WPI Class IV Wastewater Treatment — 502 questions across 7 chief-operator modules: Advanced Process Control & Optimization, Advanced Nutrient Removal & Resource Recovery, Emerging Technologies & Innovation, Plant Management, Asset Management & Leadership, Regulatory Compliance, Reporting & Environmental Management, Emergency Response & Resilience Planning, and Health, Safety & Environmental Stewardship. Aligned with WPI Class IV Wastewater Need-to-Know Criteria. Recognized by EOCP (BC), AWWOA (AB), SAHO (SK), and MWWA (MB). Adaptive difficulty, AI Tutor, score history. Unlimited attempts.",
    priceCAD: 29900,
    examTypes: ["wpi-class4-wastewater"],
  },
  // ── WPI Water Distribution (BC / AB / SK / MB) ─────────────────────────────────────────────
  {
    key: "wpi-class1-water-dist",
    name: "WPI Class I Water Distribution Practice Pass",
    description: "WPI Class I Water Distribution — 150 questions covering distribution system basics, pipe materials, pressure & flow fundamentals, chlorine residual maintenance, valve & hydrant operation, and regulations & safety. Aligned with WPI Class I Water Distribution Need-to-Know Criteria. Recognized by EOCP (BC), AWWOA (AB), SAHO (SK), and MWWA (MB). Adaptive difficulty, AI Tutor, score history. Unlimited attempts.",
    priceCAD: 9900,
    examTypes: ["wpi-class1-water-dist"],
  },
  {
    key: "wpi-class2-water-dist",
    name: "WPI Class II Water Distribution Practice Pass",
    description: "WPI Class II Water Distribution — 136 questions covering hydraulic analysis & pressure zone design, water quality management in distribution, cross-connection control & backflow prevention, system maintenance & rehabilitation, and regulatory compliance. Aligned with WPI Class II Water Distribution Need-to-Know Criteria. Recognized by EOCP (BC), AWWOA (AB), SAHO (SK), and MWWA (MB). Adaptive difficulty, AI Tutor, score history. Unlimited attempts.",
    priceCAD: 14900,
    examTypes: ["wpi-class2-water-dist"],
  },
  {
    key: "wpi-class3-water-dist",
    name: "WPI Class III Water Distribution Practice Pass",
    description: "WPI Class III Water Distribution — 150 questions covering advanced hydraulic modelling, transmission main design & multi-zone systems, SCADA & automation, water quality monitoring programs, and senior operator responsibilities. Aligned with WPI Class III Water Distribution Need-to-Know Criteria. Recognized by EOCP (BC), AWWOA (AB), SAHO (SK), and MWWA (MB). Adaptive difficulty, AI Tutor, score history. Unlimited attempts.",
    priceCAD: 24900,
    examTypes: ["wpi-class3-water-dist"],
  },
  {
    key: "wpi-class4-water-dist",
    name: "WPI Class IV Water Distribution Practice Pass",
    description: "WPI Class IV Water Distribution — 150 questions covering large-scale system management, asset management & capital planning, advanced water quality & DWQMS, strategic regulatory compliance, and emergency response & resilience. Aligned with WPI Class IV Water Distribution Need-to-Know Criteria. Recognized by EOCP (BC), AWWOA (AB), SAHO (SK), and MWWA (MB). Adaptive difficulty, AI Tutor, score history. Unlimited attempts.",
    priceCAD: 29900,
    examTypes: ["wpi-class4-water-dist"],
  },
];

export const ALL_PRODUCTS = [...INDIVIDUAL_PRODUCTS];

/** Maps product key → { quizPath, mockPath } for use in confirmation emails */
export const PRODUCT_STUDY_PATHS: Record<string, { quizPath: string; mockPath: string }> = {
  "oit":                    { quizPath: "/quiz",                      mockPath: "/oit-mock" },
  "oit-ww":                { quizPath: "/oit-ww",                    mockPath: "/oit-ww-mock" },
  "class1-water":          { quizPath: "/class1-water",              mockPath: "/class1-water-mock" },
  "class1-ww":             { quizPath: "/class1-ww",                 mockPath: "/class1-ww-mock" },
  "class2-water":          { quizPath: "/class2-water",              mockPath: "/class2-water-mock" },
  "class2-ww":             { quizPath: "/class2-ww",                 mockPath: "/class2-ww-mock" },
  "class3-water":          { quizPath: "/class3-water",              mockPath: "/class3-water-mock" },
  "class3-ww":             { quizPath: "/class3-ww",                 mockPath: "/class3-ww-mock" },
  "class4-water":          { quizPath: "/class4-water",              mockPath: "/class4-water-mock" },
  "class4-ww":             { quizPath: "/class4-ww",                 mockPath: "/class4-ww-mock" },
  "wqa":                   { quizPath: "/wqa",                       mockPath: "/wqa-mock" },
  "wpi-class1-water":      { quizPath: "/wpi-class1-water",          mockPath: "/wpi-class1-water-mock" },
  "wpi-class2-water":      { quizPath: "/wpi-class2-water",          mockPath: "/wpi-class2-water-mock" },
  "wpi-class3-water":      { quizPath: "/wpi-class3-water",          mockPath: "/wpi-class3-water-mock" },
  "wpi-class4-water":      { quizPath: "/wpi-class4-water",          mockPath: "/wpi-class4-water-mock" },
  "wpi-class1-wastewater": { quizPath: "/wpi-class1-wastewater",     mockPath: "/wpi-class1-wastewater-mock" },
  "wpi-class2-wastewater": { quizPath: "/wpi-class2-wastewater",     mockPath: "/wpi-class2-wastewater-mock" },
  "wpi-class3-wastewater": { quizPath: "/wpi-class3-wastewater",     mockPath: "/wpi-class3-wastewater-mock" },
  "wpi-class4-wastewater":      { quizPath: "/wpi-class4-wastewater",          mockPath: "/wpi-class4-wastewater-mock" },
  "wpi-class1-water-dist":      { quizPath: "/wpi-class1-water-dist",          mockPath: "/wpi-class1-water-dist-mock" },
  "wpi-class2-water-dist":      { quizPath: "/wpi-class2-water-dist",          mockPath: "/wpi-class2-water-dist-mock" },
  "wpi-class3-water-dist":      { quizPath: "/wpi-class3-water-dist",          mockPath: "/wpi-class3-water-dist-mock" },
  "wpi-class4-water-dist":      { quizPath: "/wpi-class4-water-dist",          mockPath: "/wpi-class4-water-dist-mock" },
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
