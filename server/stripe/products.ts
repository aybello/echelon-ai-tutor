/**
 * Echelon Institute — Stripe Product Definitions
 * All prices are in CAD cents (e.g. 4900 = CA$49.00)
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
    priceCAD: 7900,
    examTypes: ["class1-water"],
  },
  {
    key: "class2-water",
    name: "Class 2 Water Treatment Practice Pass",
    description: "Full Class 2 Water Treatment question bank — 500 questions across 5 modules, adaptive difficulty, AI Tutor, score history. Unlimited attempts.",
    priceCAD: 9900,
    examTypes: ["class2-water"],
  },
  {
    key: "class3-water",
    name: "Class 3 Water Treatment Practice Pass",
    description: "Full Class 3 Water Treatment question bank — 500+ questions, adaptive difficulty, AI Tutor, score history. Unlimited attempts.",
    priceCAD: 12900,
    examTypes: ["class3-water"],
  },
  {
    key: "class4-water",
    name: "Class 4 Water Treatment Practice Pass",
    description: "Full Class 4 Water Treatment question bank — 500+ questions, adaptive difficulty, AI Tutor, score history. Unlimited attempts.",
    priceCAD: 14900,
    examTypes: ["class4-water"],
  },
  {
    key: "class1-ww",
    name: "Class 1 Wastewater Treatment Practice Pass",
    description: "Full Class 1 Wastewater Treatment question bank — 500+ questions, adaptive difficulty, AI Tutor, score history. Unlimited attempts.",
    priceCAD: 7900,
    examTypes: ["class1-ww"],
  },
  {
    key: "class2-ww",
    name: "Class 2 Wastewater Treatment Practice Pass",
    description: "Full Class 2 Wastewater Treatment question bank — 500+ questions, adaptive difficulty, AI Tutor, score history. Unlimited attempts.",
    priceCAD: 9900,
    examTypes: ["class2-ww"],
  },
  {
    key: "class3-ww",
    name: "Class 3 Wastewater Treatment Practice Pass",
    description: "Full Class 3 Wastewater Treatment question bank — 500+ questions, adaptive difficulty, AI Tutor, score history. Unlimited attempts.",
    priceCAD: 12900,
    examTypes: ["class3-ww"],
  },
  {
    key: "class4-ww",
    name: "Class 4 Wastewater Treatment Practice Pass",
    description: "Full Class 4 Wastewater Treatment question bank — 500+ questions, adaptive difficulty, AI Tutor, score history. Unlimited attempts.",
    priceCAD: 14900,
    examTypes: ["class4-ww"],
  },
  {
    key: "wqa",
    name: "WQA Practice Pass",
    description: "Full Water Quality Analyst question bank — 500+ questions, adaptive difficulty, AI Tutor, score history. Unlimited attempts.",
    priceCAD: 7900,
    examTypes: ["wqa"],
  },
  // ── WPI (BC / AB / SK / MB) ──────────────────────────────────────────────
  {
    key: "wpi-class1-water",
    name: "WPI Class I Water Treatment Practice Pass",
    description: "WPI Class I Water Treatment — 502 questions across 5 modules: Treatment Process, Equipment O&M, Lab Analysis, Source Water, and Safety & Admin. Aligned with WPI Need-to-Know Criteria. Recognized by EOCP (BC), AWWOA (AB), SAHO (SK), and MWWA (MB). Adaptive difficulty, AI Tutor, score history. Unlimited attempts.",
    priceCAD: 7900,
    examTypes: ["wpi-class1-water"],
  },
  {
    key: "wpi-class2-water",
    name: "WPI Class II Water Treatment Practice Pass",
    description: "WPI Class II Water Treatment — 501 questions across 5 advanced modules: Advanced Treatment Processes, System Design & Engineering, Advanced Laboratory & Monitoring, Source Water & Environmental, and Management, Regulations & Safety. Aligned with WPI Class II Need-to-Know Criteria. Recognized by EOCP (BC), AWWOA (AB), SAHO (SK), and MWWA (MB). Adaptive difficulty, AI Tutor, score history. Unlimited attempts.",
    priceCAD: 9900,
    examTypes: ["wpi-class2-water"],
  },
  {
    key: "wpi-class3-water",
    name: "WPI Class III Water Treatment Practice Pass",
    description: "WPI Class III Water Treatment — 502 questions across 5 advanced modules: Advanced Treatment & Disinfection, Filtration & Membrane Systems, Process Control & Optimization, Distribution System Management, and Regulatory Compliance & QMS. Aligned with WPI Class III Need-to-Know Criteria. Recognized by EOCP (BC), AWWOA (AB), SAHO (SK), and MWWA (MB). Adaptive difficulty, AI Tutor, score history. Unlimited attempts.",
    priceCAD: 12900,
    examTypes: ["wpi-class3-water"],
  },
  {
    key: "wpi-class4-water",
    name: "WPI Class IV Water Treatment Practice Pass",
    description: "WPI Class IV Water Treatment — 501 questions across 6 chief-operator modules: Advanced Process Control, Advanced Water Quality, Emergency Response & Contingency Planning, Plant Management & Leadership, Regulatory Compliance & Reporting, and Source Water Protection. Aligned with WPI Class IV Need-to-Know Criteria. Recognized by EOCP (BC), AWWOA (AB), SAHO (SK), and MWWA (MB). Adaptive difficulty, AI Tutor, score history. Unlimited attempts.",
    priceCAD: 12900,
    examTypes: ["wpi-class4-water"],
  },
  {
    key: "wpi-class1-wastewater",
    name: "WPI Class I Wastewater Treatment Practice Pass",
    description: "WPI Class I Wastewater Treatment — 500 questions across 5 modules: Wastewater Collection Systems, Primary & Secondary Treatment, Solids Handling & Biosolids, Laboratory & Monitoring, Safety & Regulations. Aligned with WPI Class I Wastewater Need-to-Know Criteria. Recognized by EOCP (BC), AWWOA (AB), SAHO (SK), and MWWA (MB). Adaptive difficulty, AI Tutor, score history. Unlimited attempts.",
    priceCAD: 7900,
    examTypes: ["wpi-class1-wastewater"],
  },
  {
    key: "wpi-class2-wastewater",
    name: "WPI Class II Wastewater Treatment Practice Pass",
    description: "WPI Class II Wastewater Treatment — 501 questions across 5 advanced modules: Secondary Treatment, Nutrient Removal, Biosolids Management, Advanced Treatment, and Process Control & Safety. Aligned with WPI Class II Wastewater Need-to-Know Criteria. Recognized by EOCP (BC), AWWOA (AB), SAHO (SK), and MWWA (MB). Adaptive difficulty, AI Tutor, score history. Unlimited attempts.",
    priceCAD: 9900,
    examTypes: ["wpi-class2-wastewater"],
  },
  {
    key: "wpi-class3-wastewater",
    name: "WPI Class III Wastewater Treatment Practice Pass",
    description: "WPI Class III Wastewater Treatment — 501 questions across 8 senior-operator modules: Advanced Biological Treatment, Biological Nutrient Removal, Membrane Bioreactors & Advanced Processes, Industrial Pretreatment & Toxicity, Advanced Biosolids Management, Regulatory Compliance & Reporting, Advanced Process Control & Troubleshooting, and Health, Safety & Environmental Management. Aligned with WPI Class III Wastewater Need-to-Know Criteria. Recognized by EOCP (BC), AWWOA (AB), SAHO (SK), and MWWA (MB). Adaptive difficulty, AI Tutor, score history. Unlimited attempts.",
    priceCAD: 12900,
    examTypes: ["wpi-class3-wastewater"],
  },
  {
    key: "wpi-class4-wastewater",
    name: "WPI Class IV Wastewater Treatment Practice Pass",
    description: "WPI Class IV Wastewater Treatment — 502 questions across 7 chief-operator modules: Advanced Process Control & Optimization, Advanced Nutrient Removal & Resource Recovery, Emerging Technologies & Innovation, Plant Management, Asset Management & Leadership, Regulatory Compliance, Reporting & Environmental Management, Emergency Response & Resilience Planning, and Health, Safety & Environmental Stewardship. Aligned with WPI Class IV Wastewater Need-to-Know Criteria. Recognized by EOCP (BC), AWWOA (AB), SAHO (SK), and MWWA (MB). Adaptive difficulty, AI Tutor, score history. Unlimited attempts.",
    priceCAD: 12900,
    examTypes: ["wpi-class4-wastewater"],
  },
];

export const BUNDLE_PRODUCTS: EchelonProduct[] = [
  {
    key: "bundle-water",
    name: "Water Treatment Full Ladder Bundle",
    description: "Complete Water Treatment ladder — OIT + Class 1 through Class 4. All 5 exam question banks, unlimited attempts, AI Tutor, score history. Save CA$155 vs buying individually.",
    priceCAD: 34900,
    examTypes: ["oit", "class1-water", "class2-water", "class3-water", "class4-water"],
  },
  {
    key: "bundle-ww",
    name: "Wastewater Treatment Full Ladder Bundle",
    description: "Complete Wastewater Treatment ladder — OIT WW + Class 1 through Class 4. All 5 exam question banks, unlimited attempts, AI Tutor, score history. Save CA$206 vs buying individually.",
    priceCAD: 29900,
    examTypes: ["oit-ww", "class1-ww", "class2-ww", "class3-ww", "class4-ww"],
  },
  {
    key: "bundle-all",
    name: "Complete All Access Bundle",
    description: "Every exam — all 18 Practice Passes in one bundle. Water Treatment (OIT–Class 4), Wastewater (Class 1–4), WQA, WPI Class I–IV Water & WPI Class I–IV Wastewater. Unlimited attempts, AI Tutor, score history. Save CA$1,065 vs buying individually.",
    priceCAD: 59900,
    examTypes: ["oit", "oit-ww", "class1-water", "class2-water", "class3-water", "class4-water", "class1-ww", "class2-ww", "class3-ww", "class4-ww", "wqa", "wpi-class1-water", "wpi-class2-water", "wpi-class3-water", "wpi-class4-water", "wpi-class1-wastewater", "wpi-class2-wastewater", "wpi-class3-wastewater", "wpi-class4-wastewater"],
  },
];

export const ALL_PRODUCTS = [...INDIVIDUAL_PRODUCTS, ...BUNDLE_PRODUCTS];

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
