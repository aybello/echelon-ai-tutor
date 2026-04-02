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
    key: "class1-water",
    name: "Class 1 Water Treatment Practice Pass",
    description: "Full Class 1 Water Treatment question bank — 500+ questions, adaptive difficulty, AI Tutor, score history. Unlimited attempts.",
    priceCAD: 7900,
    examTypes: ["class1-water"],
  },
  {
    key: "class2-water",
    name: "Class 2 Water Treatment Practice Pass",
    description: "Full Class 2 Water Treatment question bank — 280+ questions across 5 modules, adaptive difficulty, AI Tutor, score history. Unlimited attempts.",
    priceCAD: 7900,
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
    description: "Complete Wastewater Treatment ladder — Class 1 through Class 4. All 4 exam question banks, unlimited attempts, AI Tutor, score history. Save CA$157 vs buying individually.",
    priceCAD: 29900,
    examTypes: ["class1-ww", "class2-ww", "class3-ww", "class4-ww"],
  },
  {
    key: "bundle-all",
    name: "Complete All Access Bundle",
    description: "Every exam — all 10 Practice Passes in one bundle. Water Treatment (OIT–Class 4), Wastewater (Class 1–4), and WQA. Unlimited attempts, AI Tutor, score history. Save CA$441 vs buying individually.",
    priceCAD: 59900,
    examTypes: ["oit", "class1-water", "class2-water", "class3-water", "class4-water", "class1-ww", "class2-ww", "class3-ww", "class4-ww", "wqa"],
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
