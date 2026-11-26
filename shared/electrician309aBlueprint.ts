import {
  ELECTRICIAN_309A_BLUEPRINT_VERSION,
  ELECTRICIAN_309A_PROGRAM_KEY,
} from "./certificationPrograms";

/**
 * Ontario 309A Electrician — Construction & Maintenance
 * Red Seal Construction Electrician exam blueprint.
 *
 * IMPORTANT (Aug 2026): Red Seal currently labels a newer Construction Electrician
 * RSOS as "exams under development". The CURRENT Red Seal exams are still based on
 * the previous RSOS. This file intentionally follows the official CURRENT-exam
 * weighting page, not the newer in-development standard.
 *
 * Primary sources:
 * - https://red-seal.ca/eng/trades/const-elect.shtml
 * - https://red-seal.ca/eng/trades/constelectric/previous/exam-weightings.shtml
 * - https://red-seal.ca/eng/resources/exam-prep-guide.shtml
 * - https://www.skilledtradesontario.ca/trade-information/electrician-construction-and-maintenance/
 */

export const ELECTRICIAN_309A = {
  programKey: ELECTRICIAN_309A_PROGRAM_KEY,
  blueprintVersion: ELECTRICIAN_309A_BLUEPRINT_VERSION,
  courseKey: "electrician-309a",
  bankKey: "electrician-309a",
  credentialCode: "309A",
  ontarioTradeName: "Electrician — Construction & Maintenance",
  redSealTradeName: "Construction Electrician",
  jurisdiction: "Ontario",
  redSeal: true,
  examQuestions: 100,
  examDurationMinutes: 240,
  passMarkPercent: 70,
  standardStatus: "current-exam-previous-rsos" as const,
  sourceCheckedAt: "2026-08-15",
} as const;

export type Electrician309AModuleCode = "A" | "B" | "C" | "D" | "E";

export interface Electrician309ATask {
  code: string;
  title: string;
  /** Percent of the parent Major Work Activity, as published by Red Seal. */
  parentWeightPercent: number;
}

export interface Electrician309AModule {
  code: Electrician309AModuleCode;
  title: string;
  /** Number of questions on the 100-question Red Seal exam. */
  examQuestions: number;
  weightPercent: number;
  tasks: readonly Electrician309ATask[];
}

export const ELECTRICIAN_309A_MODULES: readonly Electrician309AModule[] = [
  {
    code: "A",
    title: "Performs common occupational skills",
    examQuestions: 11,
    weightPercent: 11,
    tasks: [
      { code: "A-1", title: "Performs safety-related functions", parentWeightPercent: 20 },
      { code: "A-2", title: "Uses tools and equipment", parentWeightPercent: 19 },
      { code: "A-3", title: "Organizes work", parentWeightPercent: 19 },
      { code: "A-4", title: "Fabricates and installs support components", parentWeightPercent: 21 },
      { code: "A-5", title: "Commissions and decommissions electrical systems", parentWeightPercent: 16 },
      { code: "A-6", title: "Uses communication and mentoring techniques", parentWeightPercent: 5 },
    ],
  },
  {
    code: "B",
    title: "Installs, services and maintains generating, distribution and service systems",
    examQuestions: 28,
    weightPercent: 28,
    tasks: [
      { code: "B-7", title: "Consumer/supply services and metering equipment", parentWeightPercent: 14 },
      { code: "B-8", title: "Protection devices", parentWeightPercent: 15 },
      { code: "B-9", title: "Power distribution equipment", parentWeightPercent: 15 },
      { code: "B-10", title: "Power conditioning, UPS and surge suppression systems", parentWeightPercent: 8 },
      { code: "B-11", title: "Bonding, grounding and ground-fault systems", parentWeightPercent: 13 },
      { code: "B-12", title: "Power generation and conversion systems", parentWeightPercent: 8 },
      { code: "B-13", title: "Renewable energy generating and storage systems", parentWeightPercent: 8 },
      { code: "B-14", title: "High-voltage systems", parentWeightPercent: 7 },
      { code: "B-15", title: "Transformers", parentWeightPercent: 12 },
    ],
  },
  {
    code: "C",
    title: "Installs, services and maintains wiring systems",
    examQuestions: 30,
    weightPercent: 30,
    tasks: [
      { code: "C-16", title: "Raceways, conductors, cables and enclosures", parentWeightPercent: 30 },
      { code: "C-17", title: "Branch circuitry and devices", parentWeightPercent: 28 },
      { code: "C-18", title: "HVAC systems", parentWeightPercent: 14 },
      { code: "C-19", title: "Electric heating systems", parentWeightPercent: 14 },
      { code: "C-20", title: "Exit and emergency lighting systems", parentWeightPercent: 10 },
      { code: "C-21", title: "Cathodic protection systems", parentWeightPercent: 4 },
    ],
  },
  {
    code: "D",
    title: "Installs, services and maintains motors and control systems",
    examQuestions: 21,
    weightPercent: 21,
    tasks: [
      { code: "D-22", title: "Motor starters and controls", parentWeightPercent: 38 },
      { code: "D-23", title: "Drives", parentWeightPercent: 18 },
      { code: "D-24", title: "Motors", parentWeightPercent: 28 },
      { code: "D-25", title: "Automated control systems", parentWeightPercent: 16 },
    ],
  },
  {
    code: "E",
    title: "Installs, services and maintains signalling and communication systems",
    examQuestions: 10,
    weightPercent: 10,
    tasks: [
      { code: "E-26", title: "Signalling systems", parentWeightPercent: 44 },
      { code: "E-27", title: "Communication systems", parentWeightPercent: 26 },
      { code: "E-28", title: "Integrated control systems", parentWeightPercent: 30 },
    ],
  },
] as const;

export const ELECTRICIAN_309A_MODULE_WEIGHTS: Readonly<Record<Electrician309AModuleCode, number>> =
  Object.fromEntries(ELECTRICIAN_309A_MODULES.map((module) => [module.code, module.weightPercent])) as Record<
    Electrician309AModuleCode,
    number
  >;

export const ELECTRICIAN_309A_SOURCE_URLS = [
  "https://red-seal.ca/eng/trades/const-elect.shtml",
  "https://red-seal.ca/eng/trades/constelectric/previous/exam-weightings.shtml",
  "https://red-seal.ca/eng/resources/exam-prep-guide.shtml",
  "https://www.skilledtradesontario.ca/trade-information/electrician-construction-and-maintenance/",
] as const;
