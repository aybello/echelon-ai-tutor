/**
 * Reviewed 2025 WPI wastewater treatment topic quotas, not study chapters.
 * OWWCO confirms Ontario Class 1-4 uses WPI standardized exams:
 * https://owwco.ca/preparing-for-your-exam/
 * WPI requires jurisdiction/exam-date adoption confirmation. These profiles
 * retain the existing advertised Echelon split, not a claim of Ontario adoption.
 * Source notes and classification requirements: docs/audit-learning-taxonomy.md.
 */
export const WASTEWATER_MOCK_AREAS = {
  equipment: "Equipment Evaluation, Maintenance & Operation",
  process: "Treatment Process Evaluation & Adjustment",
  laboratory: "Laboratory Analysis",
  safety: "Safety & Admin",
} as const;
export type WastewaterMockArea = typeof WASTEWATER_MOCK_AREAS[keyof typeof WASTEWATER_MOCK_AREAS];
const { equipment, process, laboratory, safety } = WASTEWATER_MOCK_AREAS;
export const ONTARIO_WASTEWATER_MOCK_PROFILES = {
  "class1-wastewater": {
    source: "https://gowpi.org/wp-content/uploads/2026/04/WastewaterTreatment-%E2%80%93-Class-1_mh-fin.pdf",
    targets: { [equipment]: 39, [process]: 38, [laboratory]: 10, [safety]: 13 },
  },
  "class2-wastewater": {
    source: "https://gowpi.org/wp-content/uploads/2026/04/WastewaterTreatment-%E2%80%93-Class-2_mh-fin.pdf",
    targets: { [equipment]: 37, [process]: 40, [laboratory]: 10, [safety]: 13 },
  },
} as const;
export type OntarioWastewaterBank = keyof typeof ONTARIO_WASTEWATER_MOCK_PROFILES;
export function ontarioWastewaterMockProfile(bankKey: string) {
  return Object.hasOwn(ONTARIO_WASTEWATER_MOCK_PROFILES, bankKey)
    ? ONTARIO_WASTEWATER_MOCK_PROFILES[bankKey as OntarioWastewaterBank] : null;
}

// Exact content-area labels and reviewed naming aliases only. No substring,
// keyword, question-text, ID-range or random classification is permitted.
const AREA_ALIASES: Readonly<Record<string, WastewaterMockArea>> = {
  [equipment]: equipment,
  "Equipment Evaluation, Maintenance, and/or Operation": equipment,
  [process]: process,
  "Treatment Process Evaluation and Adjustment": process,
  [laboratory]: laboratory,
  [safety]: safety,
  "Security, Safety, and Administrative Procedures": safety,
  "Security, Safety & Administrative Procedures": safety,
};

/** null means content classification is required, not permission to fill randomly. */
export const ONTARIO_WASTEWATER_CHAPTER_AREAS: Readonly<Record<OntarioWastewaterBank, Readonly<Record<string, WastewaterMockArea | null>>>> = {
  "class1-wastewater": {
    "Wastewater Characteristics & Preliminary Treatment": null,
    "Primary Treatment": null,
    "Secondary Treatment": null,
    "Biological Nutrient Removal": null,
    "Tertiary Treatment & Filtration": null,
    "Disinfection": null,
    "Solids Handling & Biosolids": null,
    "Regulations, Safety & Operations": null,
    "Wastewater Collection": null,
  },
  "class2-wastewater": {
    "Treatment Process": process,
    "Collection Systems": null,
    "Laboratory Analysis": laboratory,
    "Safety & Administration": safety,
    "Equipment O&M": equipment,
  },
};

export type WastewaterAreaQuestion = {
  module: string;
  blueprintObjective?: string | null;
  reviewStatus?: string | null;
};
export function reviewedWastewaterMockArea(bankKey: string, question: WastewaterAreaQuestion): WastewaterMockArea | null {
  if (!ontarioWastewaterMockProfile(bankKey)) return null;
  // An approved, exact area in the existing governance field can classify a
  // cross-area chapter without relabelling its module or changing question IDs.
  // A present but unapproved/unknown objective is excluded, never guessed.
  if (question.blueprintObjective?.trim()) {
    return question.reviewStatus === "approved"
      ? AREA_ALIASES[question.blueprintObjective] ?? null : null;
  }
  return AREA_ALIASES[question.module]
    ?? ONTARIO_WASTEWATER_CHAPTER_AREAS[bankKey as OntarioWastewaterBank][question.module]
    ?? null;
}
