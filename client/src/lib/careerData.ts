// Echelon Career Map — Ontario Operator Career Path & Salary Data
// Design: Professional SaaS — Clean Dark-Accent (Sora, blue/teal brand)

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

export const LEVELS: CertLevel[] = [
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
    color: "#64748B",
    bg: "#F8FAFC",
    requirements: [
      "Secondary school diploma (or equivalent)",
      "Pass the OIT certification exam",
      "Must work under direct supervision of a licensed operator",
      "Cannot make operational decisions independently",
    ],
    canOperate: "Entry-level tasks at any class of facility — under supervision only",
    examCourse: "OIT — $119 on Echelon",
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
    examCourse: "WT&D Class 1 ($159) or WWT&C Class 1 ($159) on Echelon",
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
    examCourse: "WT&D Class 2 ($199) or WWT&C Class 2 ($199) on Echelon",
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
    examCourse: "WT&D Class 3 ($279) or WWT&C Class 3 ($279) on Echelon",
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
    examCourse: "WT&D Class 4 ($329) or WWT&C Class 4 ($329) on Echelon",
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
    examCourse: "WQA — $169 on Echelon",
    certBody: "OWWCO",
    regulation: "O. Reg. 128/04",
    nextStep: "Senior Analyst → Laboratory Manager → Quality Manager",
    insight:
      "A specialist path distinct from plant operations. WQA-certified analysts work in municipal and private labs testing drinking water for Ontario's certified systems. High demand as Ontario continues tightening lab requirements post-Walkerton.",
  },
];

export const EMPLOYERS: Employer[] = [
  {
    name: "Ontario Clean Water Agency (OCWA)",
    type: "Crown",
    size: "800+ facilities",
    note: "Largest employer in Ontario — unionised (OPSEU)",
    color: "#1D4ED8",
  },
  {
    name: "City of Toronto",
    type: "Municipal",
    size: "Class 4 systems",
    note: "R.C. Harris & F.J. Horgan plants — some of Canada's largest",
    color: "#0F766E",
  },
  {
    name: "Region of Peel",
    type: "Regional",
    size: "Class 4 systems",
    note: "Serves Mississauga, Brampton, Caledon",
    color: "#7C3AED",
  },
  {
    name: "Veolia Water",
    type: "Private",
    size: "Multiple Ontario contracts",
    note: "Private operation of municipal systems",
    color: "#B45309",
  },
  {
    name: "Municipalities",
    type: "Municipal",
    size: "All classes",
    note: "Hamilton, Ottawa, London, Kitchener, Windsor and 400+ more",
    color: "#059669",
  },
  {
    name: "Conservation Authorities",
    type: "Government",
    size: "Source water",
    note: "Grand River, Credit Valley, TRCA etc.",
    color: "#64748B",
  },
];

export const SALARY_JUMPS = [
  { from: "OIT→Cl.1",  jump: "+12%", note: "First licence" },
  { from: "Cl.1→Cl.2", jump: "+8%",  note: "Opens mid-size cities" },
  { from: "Cl.2→Cl.3", jump: "+18%", note: "Major pay jump" },
  { from: "Cl.3→Cl.4", jump: "+25%", note: "Top of the ladder" },
];

export const HERO_STATS = [
  { icon: "👷", label: "Licensed Operators in Ontario", value: "8,000+",    color: "#1D4ED8" },
  { icon: "💰", label: "Average Senior Operator Salary", value: "$71,900/yr", color: "#059669" },
  { icon: "📈", label: "5-year Salary Growth Potential",  value: "+13%",      color: "#D97706" },
  { icon: "🏆", label: "Top Class 4 Hourly Rate",         value: "$56.00/hr", color: "#B45309" },
];

export const JOB_MARKET = [
  {
    title: "Aging Workforce",
    desc: "An estimated 30–40% of current Ontario operators are expected to retire in the next 10 years, creating strong long-term demand for new certified operators at all levels.",
  },
  {
    title: "Infrastructure Investment",
    desc: "Federal and provincial infrastructure programs (DWSP, IESO, CWWF) are funding upgrades to water systems across Ontario, creating new operator positions at upgraded facilities.",
  },
  {
    title: "Regulatory Tightening",
    desc: "Post-Walkerton regulatory requirements continue to increase operational complexity and the need for certified operators at higher classification levels.",
  },
  {
    title: "Echelon Opportunity",
    desc: "The gap between retiring operators and new entrants, combined with the difficulty of traditional exam prep, is exactly why Echelon Institute exists.",
  },
];

export const fmtSalary = (n: number) => `$${Math.round(n).toLocaleString()}`;
export const fmtHr = (n: number) => `$${n.toFixed(2)}`;
