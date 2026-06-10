// Echelon Career Map — Multi-Province Operator Career Path & Salary Data
// Provinces: Ontario, BC, Alberta, Saskatchewan, Manitoba

export interface CertLevel {
  id: string;
  label: string;
  short: string;
  icon: string;
  years: string;
  yearsNum: number;
  hourly: { min: number; max: number };
  annual: { min: number; max: number };
  tracks: string[];
  color: string;
  bg: string;
  requirements: string[];
  canOperate: string;
  examCourse: string;
  certBody: string;
  regulation: string;
  nextStep: string;
  insight: string;
}

export interface Track {
  id: string;
  label: string;
  icon: string;
  color: string;
  bg: string;
  accent: string;
  desc: string;
}

export interface Employer {
  name: string;
  type: string;
  size: string;
  note: string;
  color: string;
}

export interface ProvinceData {
  id: string;
  name: string;
  abbr: string;
  flag: string;
  certBody: string;
  regulation: string;
  levels: CertLevel[];
  employers: Employer[];
  heroStats: { icon: string; label: string; value: string; color: string }[];
  salaryJumps: { from: string; jump: string; note: string }[];
  jobMarket: { title: string; desc: string }[];
}

export const TRACKS: Track[] = [
  {
    id: "water",
    label: "Water Treatment & Distribution",
    icon: "💧",
    color: "#1D4ED8",
    bg: "#EFF6FF",
    accent: "#BFDBFE",
    desc: "Operate drinking water treatment plants and distribution systems. Protects public health by ensuring safe drinking water delivery.",
  },
  {
    id: "wastewater",
    label: "Wastewater Treatment & Collection",
    icon: "🌊",
    color: "#0F766E",
    bg: "#F0FDFA",
    accent: "#99F6E4",
    desc: "Operate municipal wastewater treatment plants and collection systems. Protects the environment by treating sewage before discharge.",
  },
  {
    id: "wqa",
    label: "Water Quality Analyst",
    icon: "🔬",
    color: "#7C3AED",
    bg: "#FAF5FF",
    accent: "#DDD6FE",
    desc: "Specialist certification for laboratory analysts and technicians. Focuses on analytical chemistry, sampling, and QA/QC.",
  },
];

// ─────────────────────────────────────────────────────────────
// ONTARIO
// ─────────────────────────────────────────────────────────────
const ONTARIO_LEVELS: CertLevel[] = [
  {
    id: "oit",
    label: "Operator-in-Training",
    short: "OIT",
    icon: "🎓",
    years: "0 years",
    yearsNum: 0,
    hourly: { min: 24.88, max: 26.41 },
    annual: { min: 51750, max: 54930 },
    tracks: ["water", "wastewater"],
    color: "#E2E8F0",
    bg: "#1E293B",
    requirements: [
      "Secondary school diploma (or equivalent)",
      "Pass the OIT certification exam",
      "Must work under direct supervision of a licensed operator",
      "Cannot make operational decisions independently",
    ],
    canOperate: "Entry-level tasks at any class of facility — under supervision only",
    examCourse: "OIT — $49 on Echelon",
    certBody: "OWWCO (water) / EOCP (wastewater)",
    regulation: "O. Reg. 128/04 (water) / O. Reg. 129/04 (wastewater)",
    nextStep: "1 year of operating experience → Class 1 exam",
    insight:
      "Your foot in the door. Most operators start here straight out of school or after a career change. The OIT certification proves you understand the basics and can work safely.",
  },
  {
    id: "class1",
    label: "Class 1 Operator",
    short: "Class 1",
    icon: "⭐",
    years: "1+ year",
    yearsNum: 1,
    hourly: { min: 27.92, max: 31.06 },
    annual: { min: 58070, max: 64600 },
    tracks: ["water", "wastewater"],
    color: "#0369A1",
    bg: "#E0F2FE",
    requirements: [
      "Hold an OIT certificate",
      "Minimum 1 year of operating experience",
      "Pass the Class 1 exam",
      "Can operate independently at Class 1 facilities",
    ],
    canOperate: "Small-medium systems serving up to ~10,000 people",
    examCourse: "WT&D Class 1 ($99) or WWT&C Class 1 ($99) on Echelon",
    certBody: "OWWCO / EOCP",
    regulation: "O. Reg. 128/04 / O. Reg. 129/04",
    nextStep: "2 years Class 1 experience → Class 2 exam",
    insight:
      "The first real independence. You can be the operator of record at smaller facilities. Most municipal operators in Ontario's smaller communities hold Class 1 or 2.",
  },
  {
    id: "class2",
    label: "Class 2 Operator",
    short: "Class 2",
    icon: "⭐⭐",
    years: "3+ years",
    yearsNum: 3,
    hourly: { min: 29.49, max: 32.83 },
    annual: { min: 61340, max: 68290 },
    tracks: ["water", "wastewater"],
    color: "#0F766E",
    bg: "#CCFBF1",
    requirements: [
      "Hold a Class 1 certificate",
      "Minimum 2 years of Class 1 experience",
      "Pass the Class 2 exam",
      "Deeper knowledge of treatment processes and troubleshooting",
    ],
    canOperate: "Medium systems — municipalities of 10,000–100,000 people",
    examCourse: "WT&D Class 2 ($149) or WWT&C Class 2 ($149) on Echelon",
    certBody: "OWWCO / EOCP",
    regulation: "O. Reg. 128/04 / O. Reg. 129/04",
    nextStep: "3 years Class 2 experience → Class 3 exam",
    insight:
      "The sweet spot for most operators. Class 2 opens up the majority of municipal jobs in Ontario — cities like Barrie, Belleville, Peterborough. Significant salary jump from Class 1.",
  },
  {
    id: "class3",
    label: "Class 3 Operator",
    short: "Class 3",
    icon: "⭐⭐⭐",
    years: "6+ years",
    yearsNum: 6,
    hourly: { min: 32.0, max: 42.0 },
    annual: { min: 66560, max: 87360 },
    tracks: ["water", "wastewater"],
    color: "#7C3AED",
    bg: "#EDE9FE",
    requirements: [
      "Hold a Class 2 certificate",
      "Minimum 3 years of Class 2 experience",
      "Pass the Class 3 exam",
      "Advanced process knowledge and leadership capability",
    ],
    canOperate: "Large complex systems — cities of 100,000+ people",
    examCourse: "WT&D Class 3 ($249) or WWT&C Class 3 ($249) on Echelon",
    certBody: "OWWCO / EOCP",
    regulation: "O. Reg. 128/04 / O. Reg. 129/04",
    nextStep: "3 years Class 3 experience → Class 4 exam",
    insight:
      "Elite territory. Class 3 holders run large municipal systems and often hold supervisory roles. In cities like Ottawa, Hamilton, London — Class 3 operators are well compensated and in demand.",
  },
  {
    id: "class4",
    label: "Class 4 Operator",
    short: "Class 4",
    icon: "👑",
    years: "9+ years",
    yearsNum: 9,
    hourly: { min: 38.04, max: 56.0 },
    annual: { min: 79120, max: 116480 },
    tracks: ["water", "wastewater"],
    color: "#B45309",
    bg: "#FEF3C7",
    requirements: [
      "Hold a Class 3 certificate",
      "Minimum 3 years of Class 3 experience",
      "Pass the Class 4 exam",
      "Full technical and regulatory authority for major systems",
    ],
    canOperate: "Major systems — Toronto, Ottawa, regional authorities",
    examCourse: "WT&D Class 4 ($299) or WWT&C Class 4 ($299) on Echelon",
    certBody: "OWWCO / EOCP",
    regulation: "O. Reg. 128/04 / O. Reg. 129/04",
    nextStep: "You've reached the top — focus on ORO (Overall Responsible Operator) designation",
    insight:
      "The highest classification in Ontario. Class 4 operators bear ultimate responsibility for some of the province's largest and most complex water infrastructure. Toronto, Ottawa, Region of Peel — Class 4 is the pinnacle.",
  },
  {
    id: "wqa",
    label: "Water Quality Analyst",
    short: "WQA",
    icon: "🔬",
    years: "0–2 years",
    yearsNum: 0,
    hourly: { min: 26.0, max: 38.0 },
    annual: { min: 54080, max: 79040 },
    tracks: ["wqa"],
    color: "#7C3AED",
    bg: "#FAF5FF",
    requirements: [
      "Laboratory or analytical science background",
      "Pass the WQA certification exam",
      "Experience with accredited laboratory methods (ISO/IEC 17025)",
      "Strong chemistry and math skills",
    ],
    canOperate: "Accredited drinking water testing laboratories in Ontario",
    examCourse: "WQA — $149 on Echelon",
    certBody: "OWWCO",
    regulation: "O. Reg. 128/04",
    nextStep: "Senior Analyst → Laboratory Manager → Quality Manager",
    insight:
      "A specialist path distinct from plant operations. WQA-certified analysts work in municipal and private labs testing drinking water for Ontario's certified systems. High demand as Ontario continues tightening lab requirements post-Walkerton.",
  },
];

// ─────────────────────────────────────────────────────────────
// BRITISH COLUMBIA (EOCP)
// ─────────────────────────────────────────────────────────────
const BC_LEVELS: CertLevel[] = [
  {
    id: "oit",
    label: "Operator-in-Training",
    short: "OIT",
    icon: "🎓",
    years: "0 years",
    yearsNum: 0,
    hourly: { min: 24.0, max: 26.0 },
    annual: { min: 49920, max: 54080 },
    tracks: ["water", "wastewater"],
    color: "#E2E8F0",
    bg: "#1E293B",
    requirements: [
      "High school diploma or equivalent",
      "3 months (500 hours) hands-on experience OR 9.0 CEUs of approved training",
      "Pass the EOCP OIT exam",
      "Must work under supervision of a certified operator",
    ],
    canOperate: "Entry-level tasks at any class of facility — under supervision only",
    examCourse: "OIT — $49 on Echelon",
    certBody: "EOCP (Environmental Operators Certification Program)",
    regulation: "Drinking Water Protection Act / Environmental Management Act",
    nextStep: "12 months (1,800 hours) experience → Level I exam",
    insight:
      "Optional but recommended as a starting point. BC's EOCP OIT is a stepping stone that proves foundational knowledge before you accumulate the 1,800 hours needed for Level I.",
  },
  {
    id: "level1",
    label: "Level I Operator",
    short: "Level I",
    icon: "⭐",
    years: "1+ year",
    yearsNum: 1,
    hourly: { min: 27.0, max: 31.0 },
    annual: { min: 56160, max: 64480 },
    tracks: ["water", "wastewater"],
    color: "#0369A1",
    bg: "#E0F2FE",
    requirements: [
      "High school diploma or equivalent",
      "12 months (1,800 hours) at a Class I or higher facility",
      "Pass the EOCP Level I exam",
      "Must be employed or have an offer in BC or Yukon",
    ],
    canOperate: "Small systems serving communities up to ~5,000 people",
    examCourse: "WPI Class I ($99) on Echelon",
    certBody: "EOCP",
    regulation: "Drinking Water Protection Act / Environmental Management Act",
    nextStep: "3 years (5,400 hours) experience → Level II exam",
    insight:
      "The first independent certification in BC. Level I operators can run small municipal systems across BC's Interior, North, and Island regions. Strong demand in smaller communities.",
  },
  {
    id: "level2",
    label: "Level II Operator",
    short: "Level II",
    icon: "⭐⭐",
    years: "3+ years",
    yearsNum: 3,
    hourly: { min: 29.0, max: 35.0 },
    annual: { min: 60320, max: 72800 },
    tracks: ["water", "wastewater"],
    color: "#0F766E",
    bg: "#CCFBF1",
    requirements: [
      "Hold a Level I certificate",
      "3 years (5,400 hours) at a Class I or higher facility",
      "Pass the EOCP Level II exam",
    ],
    canOperate: "Medium systems — municipalities of 5,000–50,000 people",
    examCourse: "WPI Class II ($149) on Echelon",
    certBody: "EOCP",
    regulation: "Drinking Water Protection Act / Environmental Management Act",
    nextStep: "4 years at Class II facility + 2 yr post-secondary + DRC → Level III exam",
    insight:
      "Opens up the majority of BC municipal operator jobs. Cities like Kamloops, Prince George, Nanaimo, and Kelowna require Level II operators for most positions.",
  },
  {
    id: "level3",
    label: "Level III Operator",
    short: "Level III",
    icon: "⭐⭐⭐",
    years: "7+ years",
    yearsNum: 7,
    hourly: { min: 34.0, max: 44.0 },
    annual: { min: 70720, max: 91520 },
    tracks: ["water", "wastewater"],
    color: "#7C3AED",
    bg: "#EDE9FE",
    requirements: [
      "Hold a Level II certificate",
      "4 years (7,200 hours) at a Class II or higher facility",
      "2 years of post-secondary education or 90 CEUs",
      "2 years (3,000 hours) Direct Responsible Charge at a Class II or higher facility",
      "Pass the EOCP Level III exam",
    ],
    canOperate: "Large systems — cities of 50,000–200,000 people",
    examCourse: "WPI Class III ($249) on Echelon",
    certBody: "EOCP",
    regulation: "Drinking Water Protection Act / Environmental Management Act",
    nextStep: "4 years at Class III facility + 4 yr post-secondary + DRC → Level IV exam",
    insight:
      "Senior operator territory. Level III is required for larger BC cities and regional districts. The post-secondary requirement separates this from lower levels — many operators pursue BCIT or SFU programs.",
  },
  {
    id: "level4",
    label: "Level IV Operator",
    short: "Level IV",
    icon: "👑",
    years: "11+ years",
    yearsNum: 11,
    hourly: { min: 40.0, max: 58.0 },
    annual: { min: 83200, max: 120640 },
    tracks: ["water", "wastewater"],
    color: "#B45309",
    bg: "#FEF3C7",
    requirements: [
      "Hold a Level III certificate",
      "4 years (7,200 hours) at a Class III or higher facility",
      "4 years of post-secondary education or 180 CEUs",
      "2 years (3,000 hours) Direct Responsible Charge at a Class III or higher facility",
      "Pass the EOCP Level IV exam",
    ],
    canOperate: "Major systems — Metro Vancouver, Victoria CRD, large regional authorities",
    examCourse: "WPI Class IV ($299) on Echelon",
    certBody: "EOCP",
    regulation: "Drinking Water Protection Act / Environmental Management Act",
    nextStep: "You've reached the top — focus on management and leadership roles",
    insight:
      "The highest EOCP certification. Level IV operators run Metro Vancouver's massive Seymour-Capilano filtration plant, the CRD's Victoria systems, and BC's largest regional water authorities. Significant post-secondary education required.",
  },
];

// ─────────────────────────────────────────────────────────────
// ALBERTA (AEP / AWWOA)
// ─────────────────────────────────────────────────────────────
const ALBERTA_LEVELS: CertLevel[] = [
  {
    id: "ss",
    label: "Small Systems Operator",
    short: "Small Sys.",
    icon: "🎓",
    years: "0 years",
    yearsNum: 0,
    hourly: { min: 22.0, max: 26.0 },
    annual: { min: 45760, max: 54080 },
    tracks: ["water", "wastewater"],
    color: "#E2E8F0",
    bg: "#1E293B",
    requirements: [
      "High school diploma or equivalent",
      "Complete Alberta Environment entry-level training course",
      "Pass the Small Systems certification exam",
      "Designed for operators of small rural water/wastewater systems",
    ],
    canOperate: "Small rural water and wastewater systems (typically <500 connections)",
    examCourse: "OIT — $49 on Echelon",
    certBody: "Alberta Environment and Protected Areas (AEP)",
    regulation: "Environmental Protection and Enhancement Act (EPEA)",
    nextStep: "1 year experience → Level I exam",
    insight:
      "The entry point for Alberta's many rural and Indigenous community water systems. Small Systems certification is practical and accessible — no post-secondary required.",
  },
  {
    id: "level1",
    label: "Level I Operator",
    short: "Level I",
    icon: "⭐",
    years: "1+ year",
    yearsNum: 1,
    hourly: { min: 24.57, max: 28.72 },
    annual: { min: 51100, max: 59740 },
    tracks: ["water", "wastewater"],
    color: "#0369A1",
    bg: "#E0F2FE",
    requirements: [
      "High school diploma or equivalent",
      "1 year of operating experience in a provincially recognized facility",
      "Complete mandatory AWWOA entry-level training",
      "Pass the Alberta Level I certification exam",
    ],
    canOperate: "Level I classified water and wastewater facilities",
    examCourse: "WPI Class I ($99) on Echelon",
    certBody: "Alberta Environment and Protected Areas (AEP)",
    regulation: "Environmental Protection and Enhancement Act (EPEA)",
    nextStep: "Additional experience + training → Level II exam",
    insight:
      "The standard entry-level certification for Alberta municipal operators. Level I opens doors across Alberta's many mid-sized cities and towns. AWWOA provides excellent exam prep resources.",
  },
  {
    id: "level2",
    label: "Level II Operator",
    short: "Level II",
    icon: "⭐⭐",
    years: "3+ years",
    yearsNum: 3,
    hourly: { min: 28.0, max: 34.0 },
    annual: { min: 58240, max: 70720 },
    tracks: ["water", "wastewater"],
    color: "#0F766E",
    bg: "#CCFBF1",
    requirements: [
      "Hold a Level I certificate",
      "Additional operating experience at a Level I or higher facility",
      "Approved training/CEUs as required by AEP",
      "Pass the Alberta Level II certification exam",
    ],
    canOperate: "Level II classified water and wastewater facilities",
    examCourse: "WPI Class II ($149) on Echelon",
    certBody: "Alberta Environment and Protected Areas (AEP)",
    regulation: "Environmental Protection and Enhancement Act (EPEA)",
    nextStep: "Post-secondary education + experience → Level III exam",
    insight:
      "Level II is the most common certification held by Alberta operators. Cities like Red Deer, Lethbridge, Medicine Hat, and Grande Prairie operate primarily at Level II and III.",
  },
  {
    id: "level3",
    label: "Level III Operator",
    short: "Level III",
    icon: "⭐⭐⭐",
    years: "6+ years",
    yearsNum: 6,
    hourly: { min: 33.0, max: 43.0 },
    annual: { min: 68640, max: 89440 },
    tracks: ["water", "wastewater"],
    color: "#7C3AED",
    bg: "#EDE9FE",
    requirements: [
      "Hold a Level II certificate",
      "Post-secondary education or equivalent CEUs (AEP requirement)",
      "Substantial operating experience at Level II or higher facilities",
      "Pass the Alberta Level III certification exam",
    ],
    canOperate: "Level III classified water and wastewater facilities",
    examCourse: "WPI Class III ($249) on Echelon",
    certBody: "Alberta Environment and Protected Areas (AEP)",
    regulation: "Environmental Protection and Enhancement Act (EPEA)",
    nextStep: "4-year post-secondary degree or equivalent + experience → Level IV exam",
    insight:
      "Post-secondary education becomes mandatory at Level III in Alberta. Many operators pursue NAIT or SAIT environmental technology programs. Level III is required for Edmonton and Calgary's regional systems.",
  },
  {
    id: "level4",
    label: "Level IV Operator",
    short: "Level IV",
    icon: "👑",
    years: "10+ years",
    yearsNum: 10,
    hourly: { min: 38.0, max: 55.0 },
    annual: { min: 79040, max: 114400 },
    tracks: ["water", "wastewater"],
    color: "#B45309",
    bg: "#FEF3C7",
    requirements: [
      "Hold a Level III certificate",
      "4-year post-secondary degree or equivalent (180 CEUs)",
      "Extensive operating experience at Level III or higher facilities",
      "Pass the Alberta Level IV certification exam",
    ],
    canOperate: "Level IV classified water and wastewater facilities — Edmonton, Calgary, EPCOR",
    examCourse: "WPI Class IV ($299) on Echelon",
    certBody: "Alberta Environment and Protected Areas (AEP)",
    regulation: "Environmental Protection and Enhancement Act (EPEA)",
    nextStep: "You've reached the top — pursue management, consulting, or regulatory roles",
    insight:
      "The pinnacle of Alberta operator certification. EPCOR (Edmonton) and ENMAX/City of Calgary operate at Level IV. The average Alberta operator salary of $68,393 is pulled up significantly by Level III and IV holders.",
  },
];

// ─────────────────────────────────────────────────────────────
// SASKATCHEWAN (SOCB)
// ─────────────────────────────────────────────────────────────
const SASK_LEVELS: CertLevel[] = [
  {
    id: "oit",
    label: "Operator-in-Training",
    short: "OIT",
    icon: "🎓",
    years: "0 years",
    yearsNum: 0,
    hourly: { min: 19.72, max: 21.15 },
    annual: { min: 41000, max: 44000 },
    tracks: ["water", "wastewater"],
    color: "#E2E8F0",
    bg: "#1E293B",
    requirements: [
      "High school diploma or equivalent",
      "Register with Saskatchewan Operator Certification Board (SOCB)",
      "Work under supervision of a certified operator",
      "Begin accumulating required operating hours",
    ],
    canOperate: "Entry-level tasks at any class of facility — under supervision only",
    examCourse: "OIT — $49 on Echelon",
    certBody: "Saskatchewan Operator Certification Board (SOCB)",
    regulation: "The Environmental Management and Protection Act / The Safe Drinking Water Act",
    nextStep: "Accumulate required hours → Class I exam",
    insight:
      "Saskatchewan's OIT designation gets you working in the field while you build toward Class I. Many operators in Saskatchewan's smaller communities start here and move quickly to Class I.",
  },
  {
    id: "class1",
    label: "Class I Operator",
    short: "Class I",
    icon: "⭐",
    years: "1+ year",
    yearsNum: 1,
    hourly: { min: 21.63, max: 25.96 },
    annual: { min: 44990, max: 54000 },
    tracks: ["water", "wastewater"],
    color: "#0369A1",
    bg: "#E0F2FE",
    requirements: [
      "High school diploma or equivalent",
      "Required operating experience at a Class I or higher facility",
      "Pass the SOCB Class I certification exam",
      "Covers water treatment, distribution, wastewater treatment, or collection",
    ],
    canOperate: "Class I water and wastewater facilities",
    examCourse: "WPI Class I ($99) on Echelon",
    certBody: "Saskatchewan Operator Certification Board (SOCB)",
    regulation: "The Environmental Management and Protection Act / The Safe Drinking Water Act",
    nextStep: "Additional experience → Class II exam",
    insight:
      "Class I is the standard entry certification for Saskatchewan operators. Most rural municipalities and smaller cities operate Class I or II facilities. Strong demand across the province.",
  },
  {
    id: "class2",
    label: "Class II Operator",
    short: "Class II",
    icon: "⭐⭐",
    years: "3+ years",
    yearsNum: 3,
    hourly: { min: 24.04, max: 29.81 },
    annual: { min: 50000, max: 62000 },
    tracks: ["water", "wastewater"],
    color: "#0F766E",
    bg: "#CCFBF1",
    requirements: [
      "Hold a Class I certificate",
      "Additional operating experience at a Class I or higher facility",
      "Pass the SOCB Class II certification exam",
    ],
    canOperate: "Class II water and wastewater facilities",
    examCourse: "WPI Class II ($149) on Echelon",
    certBody: "Saskatchewan Operator Certification Board (SOCB)",
    regulation: "The Environmental Management and Protection Act / The Safe Drinking Water Act",
    nextStep: "Experience + training → Class III exam",
    insight:
      "Class II operators run the majority of Saskatchewan's mid-sized municipal systems. Cities like Moose Jaw, Prince Albert, and Swift Current require Class II or III operators.",
  },
  {
    id: "class3",
    label: "Class III Operator",
    short: "Class III",
    icon: "⭐⭐⭐",
    years: "6+ years",
    yearsNum: 6,
    hourly: { min: 28.85, max: 37.98 },
    annual: { min: 60000, max: 79000 },
    tracks: ["water", "wastewater"],
    color: "#7C3AED",
    bg: "#EDE9FE",
    requirements: [
      "Hold a Class II certificate",
      "Substantial operating experience at Class II or higher facilities",
      "Post-secondary training or approved CEUs",
      "Pass the SOCB Class III certification exam",
    ],
    canOperate: "Class III water and wastewater facilities",
    examCourse: "WPI Class III ($249) on Echelon",
    certBody: "Saskatchewan Operator Certification Board (SOCB)",
    regulation: "The Environmental Management and Protection Act / The Safe Drinking Water Act",
    nextStep: "Experience + post-secondary education → Class IV exam",
    insight:
      "Class III is the senior operator level for most of Saskatchewan's larger municipalities. Saskatoon and Regina's regional systems require Class III and IV operators.",
  },
  {
    id: "class4",
    label: "Class IV Operator",
    short: "Class IV",
    icon: "👑",
    years: "10+ years",
    yearsNum: 10,
    hourly: { min: 34.13, max: 50.48 },
    annual: { min: 71000, max: 105000 },
    tracks: ["water", "wastewater"],
    color: "#B45309",
    bg: "#FEF3C7",
    requirements: [
      "Hold a Class III certificate",
      "Extensive operating experience at Class III or higher facilities",
      "Post-secondary degree or equivalent CEUs",
      "Pass the SOCB Class IV certification exam",
    ],
    canOperate: "Class IV water and wastewater facilities — Saskatoon, Regina, major systems",
    examCourse: "WPI Class IV ($299) on Echelon",
    certBody: "Saskatchewan Operator Certification Board (SOCB)",
    regulation: "The Environmental Management and Protection Act / The Safe Drinking Water Act",
    nextStep: "You've reached the top — pursue management, consulting, or regulatory roles",
    insight:
      "The highest certification in Saskatchewan. Class IV operators run Saskatoon and Regina's major water and wastewater systems. Top-end salaries reach $105,000/yr for Level 4 Water Treatment holders.",
  },
];

// ─────────────────────────────────────────────────────────────
// MANITOBA (Manitoba Conservation)
// ─────────────────────────────────────────────────────────────
const MANITOBA_LEVELS: CertLevel[] = [
  {
    id: "oit",
    label: "Operator-in-Training",
    short: "OIT",
    icon: "🎓",
    years: "0 years",
    yearsNum: 0,
    hourly: { min: 20.0, max: 23.0 },
    annual: { min: 41600, max: 47840 },
    tracks: ["water", "wastewater"],
    color: "#E2E8F0",
    bg: "#1E293B",
    requirements: [
      "High school diploma or equivalent",
      "Register with Manitoba Conservation Water and Wastewater Facility Operators Certification Program",
      "Work under supervision of a certified operator",
      "Begin accumulating required operating experience",
    ],
    canOperate: "Entry-level tasks at any class of facility — under supervision only",
    examCourse: "OIT — $49 on Echelon",
    certBody: "Manitoba Conservation and Climate",
    regulation: "The Environment Act / The Drinking Water Safety Act",
    nextStep: "Accumulate required hours → Class 1 exam",
    insight:
      "Manitoba's OIT designation allows new operators to gain hands-on experience while working toward Class 1. The apprenticeship program is an alternative pathway for gaining required experience.",
  },
  {
    id: "class1",
    label: "Class 1 Operator",
    short: "Class 1",
    icon: "⭐",
    years: "1+ year",
    yearsNum: 1,
    hourly: { min: 22.0, max: 26.44 },
    annual: { min: 45760, max: 55000 },
    tracks: ["water", "wastewater"],
    color: "#0369A1",
    bg: "#E0F2FE",
    requirements: [
      "High school diploma or equivalent",
      "Required operating experience at a Class 1 or higher facility",
      "Pass the Manitoba Class 1 certification exam",
      "Certification covers water treatment, distribution, wastewater treatment, or collection",
    ],
    canOperate: "Class 1 water and wastewater facilities (small communities)",
    examCourse: "WPI Class I ($99) on Echelon",
    certBody: "Manitoba Conservation and Climate",
    regulation: "The Environment Act / The Drinking Water Safety Act",
    nextStep: "Additional experience + CEUs → Class 2 exam",
    insight:
      "Class 1 is the entry certification for most Manitoba operators. Manitoba's many rural municipalities and First Nations communities rely on Class 1 operators for their water systems.",
  },
  {
    id: "class2",
    label: "Class 2 Operator",
    short: "Class 2",
    icon: "⭐⭐",
    years: "3+ years",
    yearsNum: 3,
    hourly: { min: 25.0, max: 31.25 },
    annual: { min: 52000, max: 65000 },
    tracks: ["water", "wastewater"],
    color: "#0F766E",
    bg: "#CCFBF1",
    requirements: [
      "Hold a Class 1 certificate",
      "Additional operating experience at a Class 1 or higher facility",
      "Continuing education units (CEUs) as required by Manitoba Conservation",
      "Pass the Manitoba Class 2 certification exam",
    ],
    canOperate: "Class 2 water and wastewater facilities",
    examCourse: "WPI Class II ($149) on Echelon",
    certBody: "Manitoba Conservation and Climate",
    regulation: "The Environment Act / The Drinking Water Safety Act",
    nextStep: "Experience + CEUs → Class 3 exam",
    insight:
      "Class 2 is the most common certification in Manitoba. Brandon, Thompson, Portage la Prairie, and Steinbach operate primarily at Class 2. An operator certified in all four categories (highest Class 2) needs 6.0 CEUs to renew.",
  },
  {
    id: "class3",
    label: "Class 3 Operator",
    short: "Class 3",
    icon: "⭐⭐⭐",
    years: "6+ years",
    yearsNum: 6,
    hourly: { min: 29.0, max: 38.46 },
    annual: { min: 60320, max: 80000 },
    tracks: ["water", "wastewater"],
    color: "#7C3AED",
    bg: "#EDE9FE",
    requirements: [
      "Hold a Class 2 certificate",
      "Substantial operating experience at Class 2 or higher facilities",
      "Post-secondary training or approved CEUs",
      "Pass the Manitoba Class 3 certification exam",
    ],
    canOperate: "Class 3 water and wastewater facilities",
    examCourse: "WPI Class III ($249) on Echelon",
    certBody: "Manitoba Conservation and Climate",
    regulation: "The Environment Act / The Drinking Water Safety Act",
    nextStep: "4 years post-secondary + 4 years Class 3 experience + 2 years DRC → Class 4 exam",
    insight:
      "Class 3 operators run larger Manitoba municipal systems. The MWWA (Manitoba Water & Wastewater Association) provides strong professional development resources for operators pursuing Class 3 and 4.",
  },
  {
    id: "class4",
    label: "Class 4 Operator",
    short: "Class 4",
    icon: "👑",
    years: "10+ years",
    yearsNum: 10,
    hourly: { min: 34.62, max: 48.08 },
    annual: { min: 72000, max: 100000 },
    tracks: ["water", "wastewater"],
    color: "#B45309",
    bg: "#FEF3C7",
    requirements: [
      "Hold a Class 3 certificate",
      "4 years of post-secondary education (180 CEUs)",
      "4 years of experience in a Class 3 or higher facility",
      "2 years while holding a Class 3 certificate",
      "Pass the Manitoba Class 4 certification exam",
    ],
    canOperate: "Class 4 water and wastewater facilities — Winnipeg and major regional systems",
    examCourse: "WPI Class IV ($299) on Echelon",
    certBody: "Manitoba Conservation and Climate",
    regulation: "The Environment Act / The Drinking Water Safety Act",
    nextStep: "You've reached the top — pursue management, consulting, or regulatory roles",
    insight:
      "The highest certification in Manitoba. Class 4 operators run Winnipeg's major water and wastewater infrastructure. Manitoba's Class 4 requirements are among the most rigorous in Western Canada, requiring 4 years of post-secondary education.",
  },
];

// ─────────────────────────────────────────────────────────────
// PROVINCE REGISTRY
// ─────────────────────────────────────────────────────────────
export const PROVINCES: ProvinceData[] = [
  {
    id: "on",
    name: "Ontario",
    abbr: "ON",
    flag: "🍁",
    certBody: "OWWCO / EOCP",
    regulation: "O. Reg. 128/04 / O. Reg. 129/04",
    levels: ONTARIO_LEVELS,
    employers: [
      { name: "Ontario Clean Water Agency (OCWA)", type: "Crown", size: "800+ facilities", note: "Largest employer in Ontario — unionised (OPSEU)", color: "#1D4ED8" },
      { name: "City of Toronto", type: "Municipal", size: "Class 4 systems", note: "R.C. Harris & F.J. Horgan plants — some of Canada's largest", color: "#0F766E" },
      { name: "Region of Peel", type: "Regional", size: "Class 4 systems", note: "Serves Mississauga, Brampton, Caledon", color: "#7C3AED" },
      { name: "Veolia Water", type: "Private", size: "Multiple Ontario contracts", note: "Private operation of municipal systems", color: "#B45309" },
      { name: "Municipalities", type: "Municipal", size: "All classes", note: "Hamilton, Ottawa, London, Kitchener, Windsor and 400+ more", color: "#059669" },
      { name: "Conservation Authorities", type: "Government", size: "Source water", note: "Grand River, Credit Valley, TRCA etc.", color: "#E2E8F0" },
    ],
    heroStats: [
      { icon: "👷", label: "Licensed Operators in Ontario", value: "8,000+", color: "#1D4ED8" },
      { icon: "💰", label: "Average Senior Operator Salary", value: "$71,900/yr", color: "#059669" },
      { icon: "📈", label: "5-year Salary Growth Potential", value: "+13%", color: "#D97706" },
      { icon: "🏆", label: "Top Class 4 Hourly Rate", value: "$56.00/hr", color: "#B45309" },
    ],
    salaryJumps: [
      { from: "OIT→Cl.1", jump: "+12%", note: "First licence" },
      { from: "Cl.1→Cl.2", jump: "+8%", note: "Opens mid-size cities" },
      { from: "Cl.2→Cl.3", jump: "+18%", note: "Major pay jump" },
      { from: "Cl.3→Cl.4", jump: "+25%", note: "Top of the ladder" },
    ],
    jobMarket: [
      { title: "Aging Workforce", desc: "An estimated 30–40% of current Ontario operators are expected to retire in the next 10 years, creating strong long-term demand for new certified operators at all levels." },
      { title: "Infrastructure Investment", desc: "Federal and provincial infrastructure programs (DWSP, IESO, CWWF) are funding upgrades to water systems across Ontario, creating new operator positions at upgraded facilities." },
      { title: "Regulatory Tightening", desc: "Post-Walkerton regulatory requirements continue to increase operational complexity and the need for certified operators at higher classification levels." },
      { title: "Echelon Opportunity", desc: "The gap between retiring operators and new entrants, combined with the difficulty of traditional exam prep, is exactly why Echelon Institute exists." },
    ],
  },
  {
    id: "bc",
    name: "British Columbia",
    abbr: "BC",
    flag: "🌲",
    certBody: "EOCP (Environmental Operators Certification Program)",
    regulation: "Drinking Water Protection Act / Environmental Management Act",
    levels: BC_LEVELS,
    employers: [
      { name: "Metro Vancouver", type: "Regional", size: "Level IV systems", note: "Seymour-Capilano filtration — serves 2.5M people", color: "#1D4ED8" },
      { name: "Capital Regional District (CRD)", type: "Regional", size: "Level IV systems", note: "Victoria region water and wastewater", color: "#0F766E" },
      { name: "City of Kelowna", type: "Municipal", size: "Level III systems", note: "Okanagan's largest city", color: "#7C3AED" },
      { name: "City of Kamloops", type: "Municipal", size: "Level III systems", note: "Thompson-Nicola region hub", color: "#B45309" },
      { name: "BC Municipalities", type: "Municipal", size: "All levels", note: "Prince George, Nanaimo, Abbotsford, Chilliwack and 150+ more", color: "#059669" },
      { name: "First Nations Communities", type: "Indigenous", size: "Small–Level II", note: "Growing demand for certified operators in BC's 200+ First Nations", color: "#E2E8F0" },
    ],
    heroStats: [
      { icon: "👷", label: "Licensed Operators in BC", value: "5,000+", color: "#1D4ED8" },
      { icon: "💰", label: "Average Senior Operator Salary", value: "$75,000/yr", color: "#059669" },
      { icon: "📈", label: "5-year Salary Growth Potential", value: "+15%", color: "#D97706" },
      { icon: "🏆", label: "Top Level IV Hourly Rate", value: "$58.00/hr", color: "#B45309" },
    ],
    salaryJumps: [
      { from: "OIT→Lvl.I", jump: "+14%", note: "First licence" },
      { from: "Lvl.I→Lvl.II", jump: "+10%", note: "Opens mid-size cities" },
      { from: "Lvl.II→Lvl.III", jump: "+20%", note: "Post-sec required" },
      { from: "Lvl.III→Lvl.IV", jump: "+28%", note: "Top of the ladder" },
    ],
    jobMarket: [
      { title: "Aging Workforce", desc: "BC faces the same demographic challenge as Ontario — a large cohort of experienced operators approaching retirement, creating strong demand for new certified operators." },
      { title: "Infrastructure Upgrades", desc: "Metro Vancouver's $10B+ water and wastewater infrastructure program and the CRD's wastewater treatment project are creating significant new operator positions." },
      { title: "Rural & Indigenous Communities", desc: "BC has over 200 First Nations communities, many with water systems requiring certified operators. Federal funding is driving significant investment in rural water infrastructure." },
      { title: "WPI Exam Prep", desc: "BC operators write the WPI (Water and Pollution Control) exams — the same exam series Echelon's WPI courses are designed for. BC is Echelon's primary western market." },
    ],
  },
  {
    id: "ab",
    name: "Alberta",
    abbr: "AB",
    flag: "🌾",
    certBody: "Alberta Environment and Protected Areas (AEP)",
    regulation: "Environmental Protection and Enhancement Act (EPEA)",
    levels: ALBERTA_LEVELS,
    employers: [
      { name: "EPCOR Utilities", type: "Crown", size: "Level IV systems", note: "Edmonton's water and wastewater utility — major employer", color: "#1D4ED8" },
      { name: "City of Calgary", type: "Municipal", size: "Level IV systems", note: "Bearspaw and Glenmore treatment plants", color: "#0F766E" },
      { name: "City of Red Deer", type: "Municipal", size: "Level III systems", note: "Central Alberta's largest city", color: "#7C3AED" },
      { name: "City of Lethbridge", type: "Municipal", size: "Level III systems", note: "Southern Alberta hub", color: "#B45309" },
      { name: "Alberta Municipalities", type: "Municipal", size: "All levels", note: "Grande Prairie, Medicine Hat, Fort McMurray and 300+ more", color: "#059669" },
      { name: "ATCO / Utilities", type: "Private", size: "Multiple contracts", note: "Private utility operations across rural Alberta", color: "#E2E8F0" },
    ],
    heroStats: [
      { icon: "👷", label: "Licensed Operators in Alberta", value: "4,500+", color: "#1D4ED8" },
      { icon: "💰", label: "Average Operator Salary", value: "$68,400/yr", color: "#059669" },
      { icon: "📈", label: "5-year Salary Growth Potential", value: "+12%", color: "#D97706" },
      { icon: "🏆", label: "Top Level IV Hourly Rate", value: "$55.00/hr", color: "#B45309" },
    ],
    salaryJumps: [
      { from: "SS→Lvl.I", jump: "+10%", note: "First licence" },
      { from: "Lvl.I→Lvl.II", jump: "+14%", note: "Opens mid-size cities" },
      { from: "Lvl.II→Lvl.III", jump: "+20%", note: "Post-sec required" },
      { from: "Lvl.III→Lvl.IV", jump: "+22%", note: "Top of the ladder" },
    ],
    jobMarket: [
      { title: "Oil Sands Demand", desc: "Alberta's oil sands operations require large numbers of certified water and wastewater operators for industrial water treatment — creating well-paying private sector opportunities." },
      { title: "Municipal Growth", desc: "Calgary and Edmonton continue to grow rapidly, driving demand for certified operators at all levels to staff new and expanded water infrastructure." },
      { title: "Rural Water Systems", desc: "Alberta has hundreds of rural municipalities and counties with water systems requiring certified operators — many offering competitive salaries to attract talent." },
      { title: "AWWOA Support", desc: "The Alberta Water and Wastewater Operators Association (AWWOA) provides excellent certification prep courses and professional development resources for Alberta operators." },
    ],
  },
  {
    id: "sk",
    name: "Saskatchewan",
    abbr: "SK",
    flag: "🌻",
    certBody: "Saskatchewan Operator Certification Board (SOCB)",
    regulation: "The Environmental Management and Protection Act / The Safe Drinking Water Act",
    levels: SASK_LEVELS,
    employers: [
      { name: "City of Saskatoon", type: "Municipal", size: "Class IV systems", note: "Saskatoon Water — largest employer in the province", color: "#1D4ED8" },
      { name: "City of Regina", type: "Municipal", size: "Class IV systems", note: "Buffalo Pound Water Treatment Plant", color: "#0F766E" },
      { name: "City of Prince Albert", type: "Municipal", size: "Class III systems", note: "Northern Saskatchewan hub", color: "#7C3AED" },
      { name: "City of Moose Jaw", type: "Municipal", size: "Class III systems", note: "South-central Saskatchewan", color: "#B45309" },
      { name: "Saskatchewan Municipalities", type: "Municipal", size: "All classes", note: "Swift Current, Yorkton, North Battleford and 700+ more", color: "#059669" },
      { name: "SaskWater", type: "Crown", size: "Rural systems", note: "Provincial Crown corporation serving rural communities", color: "#E2E8F0" },
    ],
    heroStats: [
      { icon: "👷", label: "Licensed Operators in Saskatchewan", value: "2,500+", color: "#1D4ED8" },
      { icon: "💰", label: "Average Operator Salary", value: "$58,000/yr", color: "#059669" },
      { icon: "📈", label: "5-year Salary Growth Potential", value: "+10%", color: "#D97706" },
      { icon: "🏆", label: "Top Class IV Hourly Rate", value: "$50.48/hr", color: "#B45309" },
    ],
    salaryJumps: [
      { from: "OIT→Cl.I", jump: "+10%", note: "First licence" },
      { from: "Cl.I→Cl.II", jump: "+12%", note: "Opens mid-size cities" },
      { from: "Cl.II→Cl.III", jump: "+18%", note: "Major pay jump" },
      { from: "Cl.III→Cl.IV", jump: "+25%", note: "Top of the ladder" },
    ],
    jobMarket: [
      { title: "Rural Demand", desc: "Saskatchewan has over 700 rural municipalities, many with aging water infrastructure requiring certified operators. SaskWater actively recruits operators for rural systems." },
      { title: "Potash & Mining", desc: "Saskatchewan's potash and uranium mining industries require industrial water treatment operators, creating well-paying private sector opportunities beyond municipal work." },
      { title: "Aging Workforce", desc: "Like other provinces, Saskatchewan faces significant operator retirements in the coming decade, creating strong demand for new certified operators at all levels." },
      { title: "ATAP Training", desc: "ATAP (Applied Technology and Advanced Programs) offers accredited Class 1-4 water and wastewater operator training fully recognized by the SOCB." },
    ],
  },
  {
    id: "mb",
    name: "Manitoba",
    abbr: "MB",
    flag: "🦌",
    certBody: "Manitoba Conservation and Climate",
    regulation: "The Environment Act / The Drinking Water Safety Act",
    levels: MANITOBA_LEVELS,
    employers: [
      { name: "City of Winnipeg", type: "Municipal", size: "Class 4 systems", note: "Deacon and McPhillips treatment plants — largest employer", color: "#1D4ED8" },
      { name: "City of Brandon", type: "Municipal", size: "Class 3 systems", note: "Western Manitoba's largest city", color: "#0F766E" },
      { name: "City of Thompson", type: "Municipal", size: "Class 2–3 systems", note: "Northern Manitoba hub", color: "#7C3AED" },
      { name: "Manitoba Municipalities", type: "Municipal", size: "All classes", note: "Portage la Prairie, Steinbach, Selkirk and 200+ more", color: "#B45309" },
      { name: "Manitoba Hydro", type: "Crown", size: "Industrial water", note: "Water treatment for hydroelectric operations", color: "#059669" },
      { name: "First Nations Communities", type: "Indigenous", size: "Small–Class 2", note: "Federal investment in First Nations water systems driving demand", color: "#E2E8F0" },
    ],
    heroStats: [
      { icon: "👷", label: "Licensed Operators in Manitoba", value: "2,000+", color: "#1D4ED8" },
      { icon: "💰", label: "Average Operator Salary", value: "$60,000/yr", color: "#059669" },
      { icon: "📈", label: "5-year Salary Growth Potential", value: "+11%", color: "#D97706" },
      { icon: "🏆", label: "Top Class 4 Hourly Rate", value: "$48.08/hr", color: "#B45309" },
    ],
    salaryJumps: [
      { from: "OIT→Cl.1", jump: "+10%", note: "First licence" },
      { from: "Cl.1→Cl.2", jump: "+13%", note: "Opens mid-size cities" },
      { from: "Cl.2→Cl.3", jump: "+18%", note: "Major pay jump" },
      { from: "Cl.3→Cl.4", jump: "+22%", note: "Top of the ladder" },
    ],
    jobMarket: [
      { title: "First Nations Investment", desc: "The federal government's commitment to ending long-term drinking water advisories on First Nations reserves is driving significant investment in Manitoba's Indigenous community water systems." },
      { title: "Winnipeg Infrastructure", desc: "Winnipeg's ongoing water and wastewater infrastructure renewal program is creating new operator positions and upgrading existing systems to higher classification levels." },
      { title: "Rural Demand", desc: "Manitoba's 200+ rural municipalities and many small communities require certified operators, with strong demand particularly in the Interlake, Parkland, and Northern regions." },
      { title: "MWWA Resources", desc: "The Manitoba Water & Wastewater Association (MWWA) provides certification prep resources and professional development for Manitoba operators pursuing higher classifications." },
    ],
  },
];

export const fmtSalary = (n: number) => `$${Math.round(n).toLocaleString()}`;
export const fmtHr = (n: number) => `$${n.toFixed(2)}`;
