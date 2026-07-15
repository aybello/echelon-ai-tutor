/**
 * ECHELON INSTITUTE — US State Certification Configuration
 *
 * Maps each US state to its certification framework, certifying body,
 * and the exam types available on the platform.
 *
 * Coverage categories:
 *   "full"    — State uses the ABC/WPI standardized exam directly (~33 states)
 *   "partial" — State uses its own exam based on ABC/WPI Need-to-Know Criteria (~8 states)
 *   "limited" — State uses a fully independent exam (~6 states, coming soon)
 */

export type USStateCode =
  | "IA" | "CO" | "OR" | "ID" | "MT" | "WY" | "ND" | "SD" | "NE" | "KS"
  | "OK" | "AR" | "MS" | "AL" | "GA" | "SC" | "NC" | "VA" | "WV" | "MD"
  | "DE" | "NJ" | "CT" | "RI" | "MA" | "VT" | "NH" | "ME" | "AK" | "HI"
  | "NV" | "NM" | "UT" | "AZ" | "IN" | "OH" | "MI" | "WI" | "MN" | "MO"
  | "KY" | "TN" | "LA" | "PA" | "WA";

export interface USStateConfig {
  code: USStateCode;
  name: string;
  certBody: string;
  certBodyUrl: string;
  examFramework: "wpi" | "state";
  /** Whether WPI exams are used (and thus Echelon content applies) */
  wpiSupported: boolean;
  /**
   * Coverage category:
   * - "full"    — State uses the WPI exam directly. Echelon WPI banks cover 100%.
   * - "partial" — State uses its own exam but based on ABC/WPI Need-to-Know Criteria. ~85% coverage.
   * - "limited" — State uses a fully independent exam. Coverage is low; coming soon.
   */
  coverage: "full" | "partial" | "limited";
  /** Note shown to users about the exam system */
  examNote: string;
  /** URL slug for the state page */
  slug: string;
  /** Certifying body abbreviation */
  certBodyAbbr: string;
}

export const US_STATE_CONFIGS: Record<USStateCode, USStateConfig> = {
  // ── Category 1: WPI Direct (full coverage) ──────────────────────────────
  IA: {
    code: "IA", name: "Iowa", certBody: "Iowa Department of Natural Resources",
    certBodyUrl: "https://www.iowadnr.gov/Environmental-Protection/Water-Quality/Operator-Certification",
    examFramework: "wpi", wpiSupported: true, coverage: "full", certBodyAbbr: "Iowa DNR",
    examNote: "Iowa uses the ABC/WPI standardized exam for all four operator classes.",
    slug: "iowa",
  },
  CO: {
    code: "CO", name: "Colorado", certBody: "Colorado Department of Public Health and Environment",
    certBodyUrl: "https://cdphe.colorado.gov/operator-certification",
    examFramework: "wpi", wpiSupported: true, coverage: "full", certBodyAbbr: "CDPHE",
    examNote: "Colorado uses the ABC/WPI standardized exam for water and wastewater operators.",
    slug: "colorado",
  },
  OR: {
    code: "OR", name: "Oregon", certBody: "Oregon Health Authority",
    certBodyUrl: "https://www.oregon.gov/oha/PH/HEALTHYENVIRONMENTS/DRINKINGWATER/OPERATORCERTIFICATION",
    examFramework: "wpi", wpiSupported: true, coverage: "full", certBodyAbbr: "OHA",
    examNote: "Oregon uses the ABC/WPI standardized exam for water and wastewater operators.",
    slug: "oregon",
  },
  ID: {
    code: "ID", name: "Idaho", certBody: "Idaho Department of Environmental Quality",
    certBodyUrl: "https://www.deq.idaho.gov/water-quality/drinking-water/operator-certification/",
    examFramework: "wpi", wpiSupported: true, coverage: "full", certBodyAbbr: "Idaho DEQ",
    examNote: "Idaho uses the ABC/WPI standardized exam for water and wastewater operators.",
    slug: "idaho",
  },
  MT: {
    code: "MT", name: "Montana", certBody: "Montana Department of Environmental Quality",
    certBodyUrl: "https://deq.mt.gov/water/drinkingwater/operatorcertification",
    examFramework: "wpi", wpiSupported: true, coverage: "full", certBodyAbbr: "Montana DEQ",
    examNote: "Montana uses the ABC/WPI standardized exam for water and wastewater operators.",
    slug: "montana",
  },
  WY: {
    code: "WY", name: "Wyoming", certBody: "Wyoming Department of Environmental Quality",
    certBodyUrl: "https://deq.wyoming.gov/water-quality/operator-certification/",
    examFramework: "wpi", wpiSupported: true, coverage: "full", certBodyAbbr: "Wyoming DEQ",
    examNote: "Wyoming uses the ABC/WPI standardized exam for water and wastewater operators.",
    slug: "wyoming",
  },
  NE: {
    code: "NE", name: "Nebraska", certBody: "Nebraska Department of Environment and Energy",
    certBodyUrl: "https://dee.ne.gov/publica.nsf/opercert.html",
    examFramework: "wpi", wpiSupported: true, coverage: "full", certBodyAbbr: "NDEE",
    examNote: "Nebraska uses the ABC/WPI standardized exam for water and wastewater operators.",
    slug: "nebraska",
  },
  AR: {
    code: "AR", name: "Arkansas", certBody: "Arkansas Department of Health",
    certBodyUrl: "https://www.healthy.arkansas.gov/programs-services/topics/water-operator-certification",
    examFramework: "wpi", wpiSupported: true, coverage: "full", certBodyAbbr: "ADH",
    examNote: "Arkansas uses the ABC/WPI standardized exam for water and wastewater operators.",
    slug: "arkansas",
  },
  MS: {
    code: "MS", name: "Mississippi", certBody: "Mississippi State Department of Health",
    certBodyUrl: "https://msdh.ms.gov/page/44,0,76.html",
    examFramework: "wpi", wpiSupported: true, coverage: "full", certBodyAbbr: "MSDH",
    examNote: "Mississippi uses the ABC/WPI standardized exam for water and wastewater operators.",
    slug: "mississippi",
  },
  GA: {
    code: "GA", name: "Georgia", certBody: "Georgia Environmental Protection Division",
    certBodyUrl: "https://epd.georgia.gov/water/operator-certification",
    examFramework: "wpi", wpiSupported: true, coverage: "full", certBodyAbbr: "Georgia EPD",
    examNote: "Georgia uses the ABC/WPI standardized exam for water and wastewater operators.",
    slug: "georgia",
  },
  SC: {
    code: "SC", name: "South Carolina", certBody: "South Carolina Department of Health and Environmental Control",
    certBodyUrl: "https://www.scdhec.gov/environment/water/water-operator-certification",
    examFramework: "wpi", wpiSupported: true, coverage: "full", certBodyAbbr: "SCDHEC",
    examNote: "South Carolina uses the ABC/WPI standardized exam for water and wastewater operators.",
    slug: "south-carolina",
  },
  NC: {
    code: "NC", name: "North Carolina", certBody: "North Carolina Division of Water Resources",
    certBodyUrl: "https://www.ncwater.org/Certification_and_Operator_Regulatory_Affairs/",
    examFramework: "wpi", wpiSupported: true, coverage: "full", certBodyAbbr: "NC DWR",
    examNote: "North Carolina uses the ABC/WPI standardized exam for water and wastewater operators.",
    slug: "north-carolina",
  },
  WV: {
    code: "WV", name: "West Virginia", certBody: "West Virginia Bureau for Public Health",
    certBodyUrl: "https://dhhr.wv.gov/bph/Pages/Operator-Certification.aspx",
    examFramework: "wpi", wpiSupported: true, coverage: "full", certBodyAbbr: "WV BPH",
    examNote: "West Virginia uses the ABC/WPI standardized exam for water and wastewater operators.",
    slug: "west-virginia",
  },
  MD: {
    code: "MD", name: "Maryland", certBody: "Maryland Department of the Environment",
    certBodyUrl: "https://mde.maryland.gov/programs/water/OperatorCertification/Pages/index.aspx",
    examFramework: "wpi", wpiSupported: true, coverage: "full", certBodyAbbr: "MDE",
    examNote: "Maryland uses the ABC/WPI standardized exam for water and wastewater operators.",
    slug: "maryland",
  },
  DE: {
    code: "DE", name: "Delaware", certBody: "Delaware Department of Natural Resources and Environmental Control",
    certBodyUrl: "https://dnrec.delaware.gov/water/drinking-water/operator-certification/",
    examFramework: "wpi", wpiSupported: true, coverage: "full", certBodyAbbr: "DNREC",
    examNote: "Delaware uses the ABC/WPI standardized exam for water and wastewater operators.",
    slug: "delaware",
  },
  NJ: {
    code: "NJ", name: "New Jersey", certBody: "New Jersey Department of Environmental Protection",
    certBodyUrl: "https://www.nj.gov/dep/watersupply/operator_certification.html",
    examFramework: "wpi", wpiSupported: true, coverage: "full", certBodyAbbr: "NJDEP",
    examNote: "New Jersey uses the ABC/WPI standardized exam for water and wastewater operators.",
    slug: "new-jersey",
  },
  CT: {
    code: "CT", name: "Connecticut", certBody: "Connecticut Department of Public Health",
    certBodyUrl: "https://portal.ct.gov/DPH/Drinking-Water/DWS/Water-Operator-Certification",
    examFramework: "wpi", wpiSupported: true, coverage: "full", certBodyAbbr: "CT DPH",
    examNote: "Connecticut uses the ABC/WPI standardized exam for water and wastewater operators.",
    slug: "connecticut",
  },
  RI: {
    code: "RI", name: "Rhode Island", certBody: "Rhode Island Department of Health",
    certBodyUrl: "https://health.ri.gov/water/about/operatorcertification/",
    examFramework: "wpi", wpiSupported: true, coverage: "full", certBodyAbbr: "RIDOH",
    examNote: "Rhode Island uses the ABC/WPI standardized exam for water and wastewater operators.",
    slug: "rhode-island",
  },
  MA: {
    code: "MA", name: "Massachusetts", certBody: "Massachusetts Department of Environmental Protection",
    certBodyUrl: "https://www.mass.gov/water-operator-certification",
    examFramework: "wpi", wpiSupported: true, coverage: "full", certBodyAbbr: "MassDEP",
    examNote: "Massachusetts uses the ABC/WPI standardized exam for water and wastewater operators.",
    slug: "massachusetts",
  },
  VT: {
    code: "VT", name: "Vermont", certBody: "Vermont Department of Environmental Conservation",
    certBodyUrl: "https://dec.vermont.gov/water/operator-certification",
    examFramework: "wpi", wpiSupported: true, coverage: "full", certBodyAbbr: "VT DEC",
    examNote: "Vermont uses the ABC/WPI standardized exam for water and wastewater operators.",
    slug: "vermont",
  },
  NH: {
    code: "NH", name: "New Hampshire", certBody: "New Hampshire Department of Environmental Services",
    certBodyUrl: "https://www.des.nh.gov/water/drinking-water/operator-certification",
    examFramework: "wpi", wpiSupported: true, coverage: "full", certBodyAbbr: "NHDES",
    examNote: "New Hampshire uses the ABC/WPI standardized exam for water and wastewater operators.",
    slug: "new-hampshire",
  },
  ME: {
    code: "ME", name: "Maine", certBody: "Maine Drinking Water Program",
    certBodyUrl: "https://www.maine.gov/dhhs/mecdc/environmental-health/dwp/operators/",
    examFramework: "wpi", wpiSupported: true, coverage: "full", certBodyAbbr: "Maine DWP",
    examNote: "Maine uses the ABC/WPI standardized exam for water and wastewater operators.",
    slug: "maine",
  },
  AK: {
    code: "AK", name: "Alaska", certBody: "Alaska Department of Environmental Conservation",
    certBodyUrl: "https://dec.alaska.gov/eh/dw/operator-certification/",
    examFramework: "wpi", wpiSupported: true, coverage: "full", certBodyAbbr: "Alaska DEC",
    examNote: "Alaska uses the ABC/WPI standardized exam for water and wastewater operators.",
    slug: "alaska",
  },
  HI: {
    code: "HI", name: "Hawaii", certBody: "Hawaii Department of Health",
    certBodyUrl: "https://health.hawaii.gov/sdwb/operator-certification/",
    examFramework: "wpi", wpiSupported: true, coverage: "full", certBodyAbbr: "Hawaii DOH",
    examNote: "Hawaii uses the ABC/WPI standardized exam for water and wastewater operators.",
    slug: "hawaii",
  },
  NV: {
    code: "NV", name: "Nevada", certBody: "Nevada Division of Environmental Protection",
    certBodyUrl: "https://ndep.nv.gov/water/operator-certification",
    examFramework: "wpi", wpiSupported: true, coverage: "full", certBodyAbbr: "NDEP",
    examNote: "Nevada uses the ABC/WPI standardized exam for water and wastewater operators.",
    slug: "nevada",
  },
  NM: {
    code: "NM", name: "New Mexico", certBody: "New Mexico Environment Department",
    certBodyUrl: "https://www.env.nm.gov/drinking-water/operator-certification/",
    examFramework: "wpi", wpiSupported: true, coverage: "full", certBodyAbbr: "NMED",
    examNote: "New Mexico uses the ABC/WPI standardized exam for water and wastewater operators.",
    slug: "new-mexico",
  },
  UT: {
    code: "UT", name: "Utah", certBody: "Utah Division of Drinking Water",
    certBodyUrl: "https://deq.utah.gov/drinking-water/operator-certification",
    examFramework: "wpi", wpiSupported: true, coverage: "full", certBodyAbbr: "Utah DDW",
    examNote: "Utah uses the ABC/WPI standardized exam for water and wastewater operators.",
    slug: "utah",
  },
  AZ: {
    code: "AZ", name: "Arizona", certBody: "Arizona Department of Environmental Quality",
    certBodyUrl: "https://azdeq.gov/node/151",
    examFramework: "wpi", wpiSupported: true, coverage: "full", certBodyAbbr: "ADEQ",
    examNote: "Arizona uses the ABC/WPI standardized exam for water and wastewater operators.",
    slug: "arizona",
  },
  IN: {
    code: "IN", name: "Indiana", certBody: "Indiana Department of Environmental Management",
    certBodyUrl: "https://www.in.gov/idem/cleanwater/2338.htm",
    examFramework: "wpi", wpiSupported: true, coverage: "full", certBodyAbbr: "IDEM",
    examNote: "Indiana uses the ABC/WPI standardized exam for water and wastewater operators.",
    slug: "indiana",
  },
  OH: {
    code: "OH", name: "Ohio", certBody: "Ohio Environmental Protection Agency",
    certBodyUrl: "https://epa.ohio.gov/divisions-and-offices/drinking-and-ground-waters/operator-certification",
    examFramework: "wpi", wpiSupported: true, coverage: "full", certBodyAbbr: "Ohio EPA",
    examNote: "Ohio uses the ABC/WPI standardized exam for water and wastewater operators.",
    slug: "ohio",
  },
  MN: {
    code: "MN", name: "Minnesota", certBody: "Minnesota Department of Health",
    certBodyUrl: "https://www.health.state.mn.us/communities/environment/water/wateroperators/",
    examFramework: "wpi", wpiSupported: true, coverage: "full", certBodyAbbr: "MDH",
    examNote: "Minnesota uses the ABC/WPI standardized exam for water and wastewater operators.",
    slug: "minnesota",
  },
  MO: {
    code: "MO", name: "Missouri", certBody: "Missouri Department of Natural Resources",
    certBodyUrl: "https://dnr.mo.gov/water/business-industry-other-entities/permits-certification-engineering-fees-forms/operator-certification",
    examFramework: "wpi", wpiSupported: true, coverage: "full", certBodyAbbr: "MO DNR",
    examNote: "Missouri uses the ABC/WPI standardized exam for water and wastewater operators.",
    slug: "missouri",
  },
  KY: {
    code: "KY", name: "Kentucky", certBody: "Kentucky Division of Water",
    certBodyUrl: "https://eec.ky.gov/Environmental-Protection/Water/Operator-Certification/Pages/default.aspx",
    examFramework: "wpi", wpiSupported: true, coverage: "full", certBodyAbbr: "KY DOW",
    examNote: "Kentucky uses the ABC/WPI standardized exam for water and wastewater operators.",
    slug: "kentucky",
  },
  LA: {
    code: "LA", name: "Louisiana", certBody: "Louisiana Department of Health",
    certBodyUrl: "https://ldh.la.gov/page/operator-certification",
    examFramework: "wpi", wpiSupported: true, coverage: "full", certBodyAbbr: "LDH",
    examNote: "Louisiana uses the ABC/WPI standardized exam for water and wastewater operators.",
    slug: "louisiana",
  },
  PA: {
    code: "PA", name: "Pennsylvania", certBody: "Pennsylvania Department of Environmental Protection",
    certBodyUrl: "https://www.dep.pa.gov/Business/Water/OperatorCertification/Pages/default.aspx",
    examFramework: "wpi", wpiSupported: true, coverage: "full", certBodyAbbr: "PA DEP",
    examNote: "Pennsylvania uses the ABC/WPI standardized exam for water and wastewater operators.",
    slug: "pennsylvania",
  },
  WA: {
    code: "WA", name: "Washington", certBody: "Washington State Department of Health",
    certBodyUrl: "https://doh.wa.gov/licenses-permits-and-certificates/professions-a-z/water-system-operator",
    examFramework: "wpi", wpiSupported: true, coverage: "full", certBodyAbbr: "WA DOH",
    examNote: "Washington uses the ABC/WPI standardized exam for water and wastewater operators.",
    slug: "washington",
  },

  // ── Category 2: Own exam, ABC/WPI NTK content basis (partial coverage) ──
  VA: {
    code: "VA", name: "Virginia", certBody: "Virginia Department of Health",
    certBodyUrl: "https://www.vdh.virginia.gov/drinking-water/operator-certification/",
    examFramework: "state", wpiSupported: true, coverage: "partial", certBodyAbbr: "VDH",
    examNote: "Virginia administers its own exam, but the content is based on the ABC Need-to-Know Criteria. Echelon's WPI question banks cover approximately 85% of the exam. The remaining content covers Virginia-specific regulations.",
    slug: "virginia",
  },
  SD: {
    code: "SD", name: "South Dakota", certBody: "South Dakota Department of Agriculture and Natural Resources",
    certBodyUrl: "https://danr.sd.gov/water/operator-certification/",
    examFramework: "state", wpiSupported: true, coverage: "partial", certBodyAbbr: "SD DANR",
    examNote: "South Dakota administers its own exam based on the ABC Need-to-Know Criteria. Echelon's WPI question banks cover approximately 85% of the exam content.",
    slug: "south-dakota",
  },
  TN: {
    code: "TN", name: "Tennessee", certBody: "Tennessee Department of Environment and Conservation",
    certBodyUrl: "https://www.tn.gov/environment/program-areas/wr-water-resources/water-operator-certification.html",
    examFramework: "state", wpiSupported: true, coverage: "partial", certBodyAbbr: "TDEC",
    examNote: "Tennessee administers its own exam via PSI, with content comparable to the ABC/WPI Need-to-Know Criteria. Echelon's WPI question banks cover approximately 85% of the exam.",
    slug: "tennessee",
  },
  MI: {
    code: "MI", name: "Michigan", certBody: "Michigan Department of Environment, Great Lakes, and Energy",
    certBodyUrl: "https://www.michigan.gov/egle/about/organization/drinking-water-and-environmental-health/operator-certification",
    examFramework: "state", wpiSupported: true, coverage: "partial", certBodyAbbr: "EGLE",
    examNote: "Michigan administers its own exam and accepts ABC certifications, but may require a supplemental state exam. Echelon's WPI question banks cover the core content.",
    slug: "michigan",
  },
  WI: {
    code: "WI", name: "Wisconsin", certBody: "Wisconsin Department of Natural Resources",
    certBodyUrl: "https://dnr.wisconsin.gov/topic/DrinkingWater/operators.html",
    examFramework: "state", wpiSupported: true, coverage: "partial", certBodyAbbr: "WI DNR",
    examNote: "Wisconsin administers its own exam based on the ABC Need-to-Know Criteria. Echelon's WPI question banks cover approximately 85% of the exam content.",
    slug: "wisconsin",
  },

  // ── Category 3: Fully independent exam (limited coverage, coming soon) ──
  ND: {
    code: "ND", name: "North Dakota", certBody: "North Dakota Department of Environmental Quality",
    certBodyUrl: "https://www.nddeq.gov/water-quality/operator-certification",
    examFramework: "state", wpiSupported: false, coverage: "limited", certBodyAbbr: "NDDEQ",
    examNote: "North Dakota uses its own state-specific exam and study guides. State-specific content is coming soon to Echelon.",
    slug: "north-dakota",
  },
  KS: {
    code: "KS", name: "Kansas", certBody: "Kansas Department of Health and Environment",
    certBodyUrl: "https://www.kdhe.ks.gov/1038/Operator-Certification",
    examFramework: "state", wpiSupported: false, coverage: "limited", certBodyAbbr: "KDHE",
    examNote: "Kansas uses its own state-specific exam criteria. State-specific content is coming soon to Echelon.",
    slug: "kansas",
  },
  OK: {
    code: "OK", name: "Oklahoma", certBody: "Oklahoma Department of Environmental Quality",
    certBodyUrl: "https://www.deq.ok.gov/water-quality-division/operator-certification/",
    examFramework: "state", wpiSupported: false, coverage: "limited", certBodyAbbr: "Oklahoma DEQ",
    examNote: "Oklahoma uses its own state exam covering OAC 252:710 state rules. State-specific content is coming soon to Echelon.",
    slug: "oklahoma",
  },
  AL: {
    code: "AL", name: "Alabama", certBody: "Alabama Department of Environmental Management",
    certBodyUrl: "https://adem.alabama.gov/programs/water/waterOperatorCert.cnt",
    examFramework: "state", wpiSupported: false, coverage: "limited", certBodyAbbr: "ADEM",
    examNote: "Alabama uses its own proprietary exam with conditional reciprocity. State-specific content is coming soon to Echelon.",
    slug: "alabama",
  },
};

/** All US state codes that use WPI exams (full or partial coverage) */
export const WPI_US_STATES: USStateCode[] = Object.values(US_STATE_CONFIGS)
  .filter(s => s.wpiSupported)
  .map(s => s.code);

/** All US state codes with full WPI coverage */
export const FULL_COVERAGE_STATES: USStateCode[] = Object.values(US_STATE_CONFIGS)
  .filter(s => s.coverage === "full")
  .map(s => s.code);

/** All US state codes with partial coverage (own exam, ABC/WPI content basis) */
export const PARTIAL_COVERAGE_STATES: USStateCode[] = Object.values(US_STATE_CONFIGS)
  .filter(s => s.coverage === "partial")
  .map(s => s.code);

/** Get state config by slug (e.g. "iowa") */
export function getStateBySlug(slug: string): USStateConfig | undefined {
  return Object.values(US_STATE_CONFIGS).find(s => s.slug === slug);
}

/** Get state config by code */
export function getStateByCode(code: USStateCode): USStateConfig {
  return US_STATE_CONFIGS[code];
}

/** High-traffic states to feature prominently */
export const FEATURED_US_STATES: USStateCode[] = [
  "IA", "CO", "OR", "OH", "MI", "WI", "MN", "IN", "VA", "NC",
  "GA", "MD", "MA", "WA", "PA",
];

/** The 4 streams available for US operators */
export const US_STREAMS = [
  { key: "water-treatment", label: "Water Treatment", abbr: "WT", color: "#0369A1", icon: "💧" },
  { key: "wastewater-treatment", label: "Wastewater Treatment", abbr: "WWT", color: "#0F766E", icon: "🔄" },
  { key: "water-distribution", label: "Water Distribution", abbr: "WD", color: "#1D4ED8", icon: "🚰" },
  { key: "wastewater-collection", label: "Wastewater Collection", abbr: "WWC", color: "#6D28D9", icon: "🏗️" },
] as const;

/** The 4 class levels for US WPI exams */
export const US_CLASSES = [
  { level: 1, label: "Class I", roman: "I", description: "Entry-level operator certification" },
  { level: 2, label: "Class II", roman: "II", description: "Intermediate operator certification" },
  { level: 3, label: "Class III", roman: "III", description: "Advanced operator certification" },
  { level: 4, label: "Class IV", roman: "IV", description: "Expert operator certification" },
] as const;

/** US class levels with key field for backward compatibility with USStatePage/USLanding */
export const US_LEVELS = [
  { key: "class1", level: 1, label: "Class I", roman: "I", description: "Entry-level operator certification" },
  { key: "class2", level: 2, label: "Class II", roman: "II", description: "Intermediate operator certification" },
  { key: "class3", level: 3, label: "Class III", roman: "III", description: "Advanced operator certification" },
  { key: "class4", level: 4, label: "Class IV", roman: "IV", description: "Expert operator certification" },
] as const;

/** Generate the WPI question bank key for a given stream and class level */
export function getUSBankKey(streamKey: string, level: number): string {
  const streamMap: Record<string, string> = {
    "water-treatment": "wpi-class{n}-water",
    "wastewater-treatment": "wpi-class{n}-wastewater",
    "water-distribution": "wpi-class{n}-water-dist",
    "wastewater-collection": "wpi-class{n}-wastewater-coll",
  };
  const template = streamMap[streamKey];
  if (!template) return "";
  return template.replace("{n}", String(level));
}
