/**
 * ECHELON INSTITUTE — Province Certification Configuration
 *
 * Maps each Canadian province to its certification framework,
 * certifying body, and the exam types available on the platform.
 *
 * Ontario: MOECP (own exams, Ontario-specific)
 * BC: EOCP (uses WPI standardized exams)
 * AB/SK/MB: AWWOA / provincial bodies (use WPI standardized exams)
 * QC: MAMH (French, Quebec-specific — coming soon)
 */

export type ProvinceCode = "ON" | "BC" | "AB" | "SK" | "MB" | "QC";

export interface CertLevel {
  /** Internal exam type key used in question banks and products */
  examType: string;
  /** Display name shown to the user */
  displayName: string;
  /** Short label (e.g. "OIT", "Level I") */
  label: string;
  /** Description shown on course cards */
  description: string;
  /** Whether this level is available (false = coming soon) */
  available: boolean;
  /** Stream: water, wastewater, both, or specialty */
  stream: "water" | "wastewater" | "both" | "wqa";
}

export interface ProvinceConfig {
  code: ProvinceCode;
  name: string;
  certBody: string;
  certBodyUrl: string;
  examFramework: "ontario" | "wpi" | "quebec";
  /** Entry-level designation name */
  entryLevelName: string;
  waterLevels: CertLevel[];
  wastewaterLevels: CertLevel[];
  specialtyLevels: CertLevel[];
}

export const PROVINCE_CONFIGS: Record<ProvinceCode, ProvinceConfig> = {
  ON: {
    code: "ON",
    name: "Ontario",
    certBody: "MOECP",
    certBodyUrl: "https://www.ontario.ca/page/water-treatment-operator-certification",
    examFramework: "ontario",
    entryLevelName: "OIT",
    waterLevels: [
      {
        examType: "oit",
        displayName: "OIT — Operator-in-Training (Water)",
        label: "OIT Water",
        description: "Entry-level Ontario water operator certification. 500+ questions covering disinfection, hydraulics, regulations, and math.",
        available: true,
        stream: "water",
      },
      {
        examType: "class1-water",
        displayName: "Class 1 Water Treatment",
        label: "Class 1",
        description: "Class 1 Water Treatment — 500+ questions across coagulation, filtration, disinfection, and Ontario regulations.",
        available: true,
        stream: "water",
      },
      {
        examType: "class2-water",
        displayName: "Class 2 Water Treatment",
        label: "Class 2",
        description: "Class 2 Water Treatment — 500 questions covering advanced treatment processes and Ontario O. Reg. 170/03.",
        available: true,
        stream: "water",
      },
      {
        examType: "class3-water",
        displayName: "Class 3 Water Treatment",
        label: "Class 3",
        description: "Class 3 Water Treatment — 500+ questions for senior operators.",
        available: true,
        stream: "water",
      },
      {
        examType: "class4-water",
        displayName: "Class 4 Water Treatment",
        label: "Class 4",
        description: "Class 4 Water Treatment — 500+ questions for chief operators.",
        available: true,
        stream: "water",
      },
    ],
    wastewaterLevels: [
      {
        examType: "oit-ww",
        displayName: "OIT — Operator-in-Training (Wastewater)",
        label: "OIT Wastewater",
        description: "Entry-level Ontario wastewater operator certification. 500+ questions covering O. Reg. 129/04 and wastewater treatment fundamentals.",
        available: true,
        stream: "wastewater",
      },
      {
        examType: "class1-ww",
        displayName: "Class 1 Wastewater Treatment",
        label: "Class 1",
        description: "Class 1 Wastewater Treatment — 500+ questions.",
        available: true,
        stream: "wastewater",
      },
      {
        examType: "class2-ww",
        displayName: "Class 2 Wastewater Treatment",
        label: "Class 2",
        description: "Class 2 Wastewater Treatment — 500+ questions.",
        available: true,
        stream: "wastewater",
      },
      {
        examType: "class3-ww",
        displayName: "Class 3 Wastewater Treatment",
        label: "Class 3",
        description: "Class 3 Wastewater Treatment — 500+ questions.",
        available: true,
        stream: "wastewater",
      },
      {
        examType: "class4-ww",
        displayName: "Class 4 Wastewater Treatment",
        label: "Class 4",
        description: "Class 4 Wastewater Treatment — 500+ questions.",
        available: true,
        stream: "wastewater",
      },
    ],
    specialtyLevels: [
      {
        examType: "wqa",
        displayName: "Water Quality Analyst (WQA)",
        label: "WQA",
        description: "Water Quality Analyst certification — 300+ questions.",
        available: true,
        stream: "wqa",
      },
    ],
  },

  BC: {
    code: "BC",
    name: "British Columbia",
    certBody: "EOCP",
    certBodyUrl: "https://eocp.ca",
    examFramework: "wpi",
    entryLevelName: "OIT",
    waterLevels: [
      {
        examType: "oit",
        displayName: "OIT — Operator-in-Training",
        label: "OIT",
        description: "Entry-level BC environmental operator certification. Covers water treatment, distribution, wastewater, and collection fundamentals.",
        available: true,
        stream: "both",
      },
      {
        examType: "class1-water",
        displayName: "Water Treatment Operator Level I",
        label: "Level I",
        description: "EOCP Water Treatment Level I — 500+ questions covering treatment processes, equipment O&M, lab analysis, and source water.",
        available: true,
        stream: "water",
      },
      {
        examType: "class2-water",
        displayName: "Water Treatment Operator Level II",
        label: "Level II",
        description: "EOCP Water Treatment Level II — 500+ questions for intermediate operators.",
        available: true,
        stream: "water",
      },
      {
        examType: "class3-water",
        displayName: "Water Treatment Operator Level III",
        label: "Level III",
        description: "EOCP Water Treatment Level III — 500+ questions for senior operators.",
        available: true,
        stream: "water",
      },
      {
        examType: "class4-water",
        displayName: "Water Treatment Operator Level IV",
        label: "Level IV",
        description: "EOCP Water Treatment Level IV — 500+ questions for chief operators.",
        available: true,
        stream: "water",
      },
    ],
    wastewaterLevels: [
      {
        examType: "class1-ww",
        displayName: "Wastewater Treatment Operator Level I",
        label: "Level I",
        description: "EOCP Wastewater Treatment Level I — 500+ questions.",
        available: true,
        stream: "wastewater",
      },
      {
        examType: "class2-ww",
        displayName: "Wastewater Treatment Operator Level II",
        label: "Level II",
        description: "EOCP Wastewater Treatment Level II — 500+ questions.",
        available: true,
        stream: "wastewater",
      },
      {
        examType: "class3-ww",
        displayName: "Wastewater Treatment Operator Level III",
        label: "Level III",
        description: "EOCP Wastewater Treatment Level III — 500+ questions.",
        available: true,
        stream: "wastewater",
      },
      {
        examType: "class4-ww",
        displayName: "Wastewater Treatment Operator Level IV",
        label: "Level IV",
        description: "EOCP Wastewater Treatment Level IV — 500+ questions.",
        available: true,
        stream: "wastewater",
      },
    ],
    specialtyLevels: [],
  },

  AB: {
    code: "AB",
    name: "Alberta",
    certBody: "AWWOA",
    certBodyUrl: "https://www.awwoa.ab.ca",
    examFramework: "wpi",
    entryLevelName: "Class I",
    waterLevels: [
      {
        examType: "class1-water",
        displayName: "Water Treatment Operator Class I",
        label: "Class I",
        description: "AWWOA Water Treatment Class I — WPI standardized exam. 100 questions covering treatment process, equipment O&M, lab analysis, and source water.",
        available: true,
        stream: "water",
      },
      {
        examType: "class2-water",
        displayName: "Water Treatment Operator Class II",
        label: "Class II",
        description: "AWWOA Water Treatment Class II — WPI standardized exam.",
        available: true,
        stream: "water",
      },
      {
        examType: "class3-water",
        displayName: "Water Treatment Operator Class III",
        label: "Class III",
        description: "AWWOA Water Treatment Class III — WPI standardized exam.",
        available: true,
        stream: "water",
      },
      {
        examType: "class4-water",
        displayName: "Water Treatment Operator Class IV",
        label: "Class IV",
        description: "AWWOA Water Treatment Class IV — WPI standardized exam.",
        available: true,
        stream: "water",
      },
    ],
    wastewaterLevels: [
      {
        examType: "class1-ww",
        displayName: "Wastewater Treatment Operator Class I",
        label: "Class I",
        description: "AWWOA Wastewater Treatment Class I — WPI standardized exam.",
        available: true,
        stream: "wastewater",
      },
      {
        examType: "class2-ww",
        displayName: "Wastewater Treatment Operator Class II",
        label: "Class II",
        description: "AWWOA Wastewater Treatment Class II — WPI standardized exam.",
        available: true,
        stream: "wastewater",
      },
      {
        examType: "class3-ww",
        displayName: "Wastewater Treatment Operator Class III",
        label: "Class III",
        description: "AWWOA Wastewater Treatment Class III — WPI standardized exam.",
        available: true,
        stream: "wastewater",
      },
      {
        examType: "class4-ww",
        displayName: "Wastewater Treatment Operator Class IV",
        label: "Class IV",
        description: "AWWOA Wastewater Treatment Class IV — WPI standardized exam.",
        available: true,
        stream: "wastewater",
      },
    ],
    specialtyLevels: [],
  },

  SK: {
    code: "SK",
    name: "Saskatchewan",
    certBody: "SPEA",
    certBodyUrl: "https://www.spea.ca",
    examFramework: "wpi",
    entryLevelName: "Class I",
    waterLevels: [
      {
        examType: "class1-water",
        displayName: "Water Treatment Operator Class I",
        label: "Class I",
        description: "Saskatchewan Water Treatment Class I — WPI standardized exam.",
        available: true,
        stream: "water",
      },
      {
        examType: "class2-water",
        displayName: "Water Treatment Operator Class II",
        label: "Class II",
        description: "Saskatchewan Water Treatment Class II — WPI standardized exam.",
        available: true,
        stream: "water",
      },
      {
        examType: "class3-water",
        displayName: "Water Treatment Operator Class III",
        label: "Class III",
        description: "Saskatchewan Water Treatment Class III — WPI standardized exam.",
        available: true,
        stream: "water",
      },
      {
        examType: "class4-water",
        displayName: "Water Treatment Operator Class IV",
        label: "Class IV",
        description: "Saskatchewan Water Treatment Class IV — WPI standardized exam.",
        available: true,
        stream: "water",
      },
    ],
    wastewaterLevels: [
      {
        examType: "class1-ww",
        displayName: "Wastewater Treatment Operator Class I",
        label: "Class I",
        description: "Saskatchewan Wastewater Treatment Class I — WPI standardized exam.",
        available: true,
        stream: "wastewater",
      },
      {
        examType: "class2-ww",
        displayName: "Wastewater Treatment Operator Class II",
        label: "Class II",
        description: "Saskatchewan Wastewater Treatment Class II — WPI standardized exam.",
        available: true,
        stream: "wastewater",
      },
      {
        examType: "class3-ww",
        displayName: "Wastewater Treatment Operator Class III",
        label: "Class III",
        description: "Saskatchewan Wastewater Treatment Class III — WPI standardized exam.",
        available: true,
        stream: "wastewater",
      },
      {
        examType: "class4-ww",
        displayName: "Wastewater Treatment Operator Class IV",
        label: "Class IV",
        description: "Saskatchewan Wastewater Treatment Class IV — WPI standardized exam.",
        available: true,
        stream: "wastewater",
      },
    ],
    specialtyLevels: [],
  },

  MB: {
    code: "MB",
    name: "Manitoba",
    certBody: "WPCAM",
    certBodyUrl: "https://www.wpcam.ca",
    examFramework: "wpi",
    entryLevelName: "Class I",
    waterLevels: [
      {
        examType: "class1-water",
        displayName: "Water Treatment Operator Class I",
        label: "Class I",
        description: "Manitoba Water Treatment Class I — WPI standardized exam.",
        available: true,
        stream: "water",
      },
      {
        examType: "class2-water",
        displayName: "Water Treatment Operator Class II",
        label: "Class II",
        description: "Manitoba Water Treatment Class II — WPI standardized exam.",
        available: true,
        stream: "water",
      },
      {
        examType: "class3-water",
        displayName: "Water Treatment Operator Class III",
        label: "Class III",
        description: "Manitoba Water Treatment Class III — WPI standardized exam.",
        available: true,
        stream: "water",
      },
      {
        examType: "class4-water",
        displayName: "Water Treatment Operator Class IV",
        label: "Class IV",
        description: "Manitoba Water Treatment Class IV — WPI standardized exam.",
        available: true,
        stream: "water",
      },
    ],
    wastewaterLevels: [
      {
        examType: "class1-ww",
        displayName: "Wastewater Treatment Operator Class I",
        label: "Class I",
        description: "Manitoba Wastewater Treatment Class I — WPI standardized exam.",
        available: true,
        stream: "wastewater",
      },
      {
        examType: "class2-ww",
        displayName: "Wastewater Treatment Operator Class II",
        label: "Class II",
        description: "Manitoba Wastewater Treatment Class II — WPI standardized exam.",
        available: true,
        stream: "wastewater",
      },
      {
        examType: "class3-ww",
        displayName: "Wastewater Treatment Operator Class III",
        label: "Class III",
        description: "Manitoba Wastewater Treatment Class III — WPI standardized exam.",
        available: true,
        stream: "wastewater",
      },
      {
        examType: "class4-ww",
        displayName: "Wastewater Treatment Operator Class IV",
        label: "Class IV",
        description: "Manitoba Wastewater Treatment Class IV — WPI standardized exam.",
        available: true,
        stream: "wastewater",
      },
    ],
    specialtyLevels: [],
  },

  QC: {
    code: "QC",
    name: "Quebec",
    certBody: "MAMH",
    certBodyUrl: "https://www.mamh.gouv.qc.ca",
    examFramework: "quebec",
    entryLevelName: "Classe 1",
    waterLevels: [
      {
        examType: "qc-class1-water",
        displayName: "Opérateur de classe 1 — Eau potable",
        label: "Classe 1",
        description: "Coming soon — Quebec water operator Class 1 certification prep in French.",
        available: false,
        stream: "water",
      },
    ],
    wastewaterLevels: [
      {
        examType: "qc-class1-ww",
        displayName: "Opérateur de classe 1 — Eaux usées",
        label: "Classe 1",
        description: "Coming soon — Quebec wastewater operator Class 1 certification prep in French.",
        available: false,
        stream: "wastewater",
      },
    ],
    specialtyLevels: [],
  },
};

export const ALL_PROVINCES: ProvinceCode[] = ["ON", "BC", "AB", "SK", "MB", "QC"];

export const WPI_PROVINCES: ProvinceCode[] = ["BC", "AB", "SK", "MB"];

/** Get all cert levels for a province (water + wastewater + specialty) */
export function getAllLevels(province: ProvinceCode): CertLevel[] {
  const config = PROVINCE_CONFIGS[province];
  return [
    ...config.waterLevels,
    ...config.wastewaterLevels,
    ...config.specialtyLevels,
  ];
}

/** Get province display name */
export function getProvinceName(code: ProvinceCode): string {
  return PROVINCE_CONFIGS[code]?.name ?? code;
}

/** Check if a province uses WPI exams */
export function isWpiProvince(code: ProvinceCode): boolean {
  return WPI_PROVINCES.includes(code);
}

/** Get the product key for a given province + examType */
export function getProductKey(province: ProvinceCode, examType: string): string {
  // WPI provinces share the same product keys as Ontario (same question bank)
  // but with province prefix for tracking
  if (isWpiProvince(province) || province === "BC") {
    return `${province.toLowerCase()}-${examType}`;
  }
  return examType; // Ontario uses the base key
}
