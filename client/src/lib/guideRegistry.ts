export type GuideId =
  | "drinking-water"
  | "wastewater-treatment"
  | "water-distribution"
  | "wastewater-collection"
  | "pumping-systems"
  | "instrumentation"
  | "chemical-feed";

export type GuideStream =
  | "water-treatment"
  | "wastewater-treatment"
  | "water-distribution"
  | "wastewater-collection";

export type GuideJurisdiction = "ontario" | "wpi";
export type GuideLevel = "oit" | "1" | "2" | "3" | "4";

export interface GuideDefinition {
  id: GuideId;
  title: string;
  shortTitle: string;
  eyebrow: string;
  description: string;
  route: string;
  stream: GuideStream;
  accent: string;
  softAccent: string;
  estimatedMinutes: number;
  stepCount: number;
  metric: string;
  topics: string[];
}

export const GUIDE_REGISTRY: GuideDefinition[] = [
  {
    id: "drinking-water",
    title: "Drinking Water Treatment",
    shortTitle: "Drinking Water",
    eyebrow: "Treatment process",
    description: "Follow source water through coagulation, filtration, disinfection and distribution.",
    route: "/process",
    stream: "water-treatment",
    accent: "#0B63CE",
    softAccent: "#EAF3FF",
    estimatedMinutes: 24,
    stepCount: 7,
    metric: "Turbidity, pH and residual",
    topics: ["Coagulation", "Filtration", "Disinfection"],
  },
  {
    id: "wastewater-treatment",
    title: "Wastewater Treatment",
    shortTitle: "Wastewater",
    eyebrow: "Treatment process",
    description: "Trace influent through primary, biological, nutrient, disinfection and solids processes.",
    route: "/wastewater",
    stream: "wastewater-treatment",
    accent: "#0F766E",
    softAccent: "#E7F8F5",
    estimatedMinutes: 26,
    stepCount: 7,
    metric: "BOD, TSS, ammonia and DO",
    topics: ["Primary", "Biological", "Solids"],
  },
  {
    id: "water-distribution",
    title: "Water Distribution",
    shortTitle: "Distribution",
    eyebrow: "Network process",
    description: "Explore pumping, storage, pressure zones, mains, cross-connections and services.",
    route: "/distribution-guide",
    stream: "water-distribution",
    accent: "#0369A1",
    softAccent: "#E8F5FC",
    estimatedMinutes: 22,
    stepCount: 7,
    metric: "Pressure, residual and water age",
    topics: ["Pressure", "Storage", "Cross-connection"],
  },
  {
    id: "wastewater-collection",
    title: "Wastewater Collection",
    shortTitle: "Collection",
    eyebrow: "Network process",
    description: "Move from building connections to gravity sewers, lift stations, force mains and CSOs.",
    route: "/collection-guide",
    stream: "wastewater-collection",
    accent: "#6D28D9",
    softAccent: "#F1EAFF",
    estimatedMinutes: 22,
    stepCount: 7,
    metric: "Flow, I/I and hydrogen sulphide",
    topics: ["Gravity sewers", "Lift stations", "I/I"],
  },
  {
    id: "pumping-systems",
    title: "Pumping Systems",
    shortTitle: "Pumping",
    eyebrow: "Interactive system",
    description: "Learn pump anatomy, curves, cavitation, affinity laws and series or parallel operation.",
    route: "/pumping",
    stream: "water-treatment",
    accent: "#1D4ED8",
    softAccent: "#EAF0FF",
    estimatedMinutes: 18,
    stepCount: 4,
    metric: "Flow, head, efficiency and NPSH",
    topics: ["Pump curves", "Cavitation", "Affinity laws"],
  },
  {
    id: "instrumentation",
    title: "Process Control & Instrumentation",
    shortTitle: "Instrumentation",
    eyebrow: "Interactive system",
    description: "Connect instruments, PID control and SCADA into one practical control-system model.",
    route: "/instrumentation",
    stream: "water-treatment",
    accent: "#4338CA",
    softAccent: "#EEEDFF",
    estimatedMinutes: 20,
    stepCount: 4,
    metric: "PV, setpoint, error and output",
    topics: ["Sensors", "PID", "SCADA"],
  },
  {
    id: "chemical-feed",
    title: "Chemical Feed",
    shortTitle: "Chemical Feed",
    eyebrow: "Calculation lab",
    description: "Calculate feed rates for chlorine, alum, lime, fluoride and polymers with live units.",
    route: "/chem-calc",
    stream: "water-treatment",
    accent: "#B45309",
    softAccent: "#FFF4D9",
    estimatedMinutes: 15,
    stepCount: 5,
    metric: "Dose, flow and feed rate",
    topics: ["Chlorine", "Coagulants", "Feed rates"],
  },
];

export const GUIDE_BY_ID = Object.fromEntries(
  GUIDE_REGISTRY.map((guide) => [guide.id, guide]),
) as Record<GuideId, GuideDefinition>;

const ONTARIO_TOPIC_BY_GUIDE_STEP: Partial<Record<GuideId, Record<string, string>>> = {
  "drinking-water": {
    intake: "Water Sources & Quality",
    coagulation: "Coagulation & Flocculation",
    flocculation: "Coagulation & Flocculation",
    sedimentation: "Sedimentation",
    filtration: "Filtration",
    disinfection: "Disinfection",
    distribution: "Water Distribution",
  },
  "wastewater-treatment": {
    screening: "Primary Treatment",
    primary: "Primary Treatment",
    biological: "Secondary Treatment",
    secondary: "Secondary Treatment",
    nutrient: "Biological Nutrient Removal",
    disinfection: "Tertiary Treatment & Filtration",
    sludge: "Solids Handling & Biosolids",
  },
  "pumping-systems": {
    cutaway: "Hydraulics",
    curves: "Hydraulics",
    config: "Hydraulics",
    tips: "Hydraulics",
  },
  instrumentation: {
    instruments: "Water Quality & Regulations",
    pid: "Chemical Feed & Dosing",
    scada: "Water Quality & Regulations",
    tips: "Water Quality & Regulations",
  },
  "chemical-feed": {
    chlorine: "Chemical Feed & Dosing",
    alum: "Coagulation & Flocculation",
    lime: "Chemical Feed & Dosing",
    fluoride: "Chemical Feed & Dosing",
    polymer: "Chemical Feed & Dosing",
  },
};

const WPI_TOPIC_BY_GUIDE_STEP: Partial<Record<GuideId, Record<string, string>>> = {
  "drinking-water": {
    intake: "Source Water",
    coagulation: "Treatment Process",
    flocculation: "Treatment Process",
    sedimentation: "Treatment Process",
    filtration: "Treatment Process",
    disinfection: "Treatment Process",
    distribution: "Treatment Process",
  },
  "wastewater-treatment": {
    screening: "Primary & Secondary Treatment",
    primary: "Primary & Secondary Treatment",
    biological: "Secondary Treatment",
    secondary: "Secondary Treatment",
    nutrient: "Secondary Treatment",
    disinfection: "Disinfection",
    sludge: "Solids Handling & Biosolids",
  },
  "water-distribution": {
    pumping: "Equipment Installation, O&M & Repair",
    transmission: "Distribution System Components",
    storage: "Distribution System Components",
    pressurezones: "Hydraulics & Pressure Management",
    distribution_mains: "Distribution System Components",
    crossconnection: "Water Quality Monitoring & Lab",
    service: "Distribution System Components",
  },
  "wastewater-collection": {
    sources: "Environmental & Public Health",
    lateral: "Collection System Components",
    gravity_sewer: "Collection System Components",
    manholes: "Collection System Maintenance",
    liftstation: "Equipment Operation & Maintenance",
    forcemain: "Equipment Operation & Maintenance",
    cso: "Environmental & Public Health",
  },
  "pumping-systems": {
    cutaway: "Equipment O&M",
    curves: "Equipment O&M",
    config: "Equipment O&M",
    tips: "Equipment O&M",
  },
  instrumentation: {
    instruments: "Equipment O&M",
    pid: "Treatment Process",
    scada: "Equipment O&M",
    tips: "Safety & Admin",
  },
  "chemical-feed": {
    chlorine: "Treatment Process",
    alum: "Treatment Process",
    lime: "Treatment Process",
    fluoride: "Treatment Process",
    polymer: "Treatment Process",
  },
};

function normalizedLevel(jurisdiction: GuideJurisdiction, level: GuideLevel): Exclude<GuideLevel, "oit"> | "oit" {
  if (jurisdiction === "wpi" && level === "oit") return "1";
  return level;
}

export function getPracticePath(
  stream: GuideStream,
  jurisdiction: GuideJurisdiction,
  requestedLevel: GuideLevel,
): string {
  const level = normalizedLevel(jurisdiction, requestedLevel);

  if (jurisdiction === "wpi") {
    const classLevel = level === "oit" ? "1" : level;
    if (stream === "water-treatment") return `/wpi-class${classLevel}-water`;
    if (stream === "wastewater-treatment") return `/wpi-class${classLevel}-wastewater`;
    if (stream === "water-distribution") return `/wpi-class${classLevel}-water-dist`;
    return `/wpi-class${classLevel}-water-coll`;
  }

  if (level === "oit") {
    return stream === "wastewater-treatment" || stream === "wastewater-collection"
      ? "/oit-ww"
      : "/quiz";
  }

  if (stream === "water-treatment") return `/class${level}-water`;
  if (stream === "wastewater-treatment") return `/class${level}-ww`;
  if (stream === "water-distribution") return `/class${level}-water-dist`;
  return `/class${level}-wastewater-coll`;
}

export function getPracticeHref(
  guideId: GuideId,
  stepId: string,
  jurisdiction: GuideJurisdiction,
  level: GuideLevel,
): string {
  const guide = GUIDE_BY_ID[guideId];
  const basePath = getPracticePath(guide.stream, jurisdiction, level);
  const topicMap = jurisdiction === "wpi" ? WPI_TOPIC_BY_GUIDE_STEP : ONTARIO_TOPIC_BY_GUIDE_STEP;
  const topic = topicMap[guideId]?.[stepId];
  return topic ? `${basePath}?topic=${encodeURIComponent(topic)}&source=process-guides` : `${basePath}?source=process-guides`;
}

export function isGuideId(value: string): value is GuideId {
  return GUIDE_REGISTRY.some((guide) => guide.id === value);
}
