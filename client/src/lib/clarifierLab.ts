export type ClarifierView = "isometric" | "top" | "cutaway" | "exploded";

export interface ClarifierPart {
  id: string;
  label: string;
  color: string;
  function: string;
  operatorLens: string;
  examConnection: string;
}

export interface ClarifierStage {
  id: string;
  step: string;
  title: string;
  description: string;
  accent: string;
}

export const CLARIFIER_PARTS = [
  {
    id: "feedwell",
    label: "Centre Feedwell",
    color: "#38BDF8",
    function: "Spreads incoming mixed liquor gently into the clarifier so flow energy does not disrupt settling.",
    operatorLens: "Watch for short-circuiting, turbulence, or uneven distribution near the centre.",
    examConnection: "A feedwell reduces inlet velocity and helps keep settled solids from being re-suspended.",
  },
  {
    id: "weir",
    label: "Effluent Weir & Launder",
    color: "#34D399",
    function: "Collects clarified water evenly around the tank perimeter and directs it to the effluent channel.",
    operatorLens: "Look for uneven flow over the weir, algae, debris, or solids escaping with the effluent.",
    examConnection: "Even overflow distribution supports reliable clarification and reduces solids carryover risk.",
  },
  {
    id: "bridge",
    label: "Access Bridge & Drive",
    color: "#FBBF24",
    function: "Supports the rotating mechanism that moves scraper arms slowly through the tank.",
    operatorLens: "Listen for unusual drive noise and check that the bridge is clear before following site lockout procedures.",
    examConnection: "Mechanical inspection always follows the facility’s energy-isolation and safety procedures.",
  },
  {
    id: "scrapers",
    label: "Scraper Arms",
    color: "#C084FC",
    function: "Move settled solids along the floor toward the centre hopper without disturbing the clarified zone.",
    operatorLens: "Confirm the arms travel smoothly and that solids are not building up unevenly around the tank.",
    examConnection: "Slow, consistent scraping helps maintain sludge removal without re-suspending settled biomass.",
  },
  {
    id: "hopper",
    label: "Sludge Hopper",
    color: "#B45309",
    function: "Collects settled solids at the centre of the clarifier for withdrawal as return or waste sludge, depending on plant design.",
    operatorLens: "Trend blanket depth and sludge withdrawal performance according to the plant’s operating procedure.",
    examConnection: "Poor underflow removal can contribute to a rising blanket and solids carryover.",
  },
  {
    id: "scum",
    label: "Surface Skimmer",
    color: "#FB7185",
    function: "Directs floatables, grease, and surface scum toward a collection trough for removal.",
    operatorLens: "Watch for persistent scum, odour, or material collecting near the effluent edge.",
    examConnection: "Surface floatables and settled sludge are handled by different collection paths.",
  },
  {
    id: "underflow",
    label: "Underflow Withdrawal",
    color: "#F97316",
    function: "Transfers collected solids from the hopper to the next sludge-handling or return-sludge process.",
    operatorLens: "Verify withdrawal is occurring as expected before changing rates; use site measurements and SOPs.",
    examConnection: "In secondary clarification, settled biomass may be returned to aeration or wasted to control inventory.",
  },
] as const satisfies readonly ClarifierPart[];

export type ClarifierPartId = (typeof CLARIFIER_PARTS)[number]["id"];

export const CLARIFIER_STAGES = [
  {
    id: "distribute",
    step: "01",
    title: "Distribute influent",
    description: "Mixed liquor enters the centre feedwell and is distributed with lower turbulence.",
    accent: "#38BDF8",
  },
  {
    id: "settle",
    step: "02",
    title: "Settle solids",
    description: "Biological floc settles by gravity while clarified water rises toward the surface.",
    accent: "#8B5CF6",
  },
  {
    id: "collect",
    step: "03",
    title: "Collect sludge",
    description: "Scraper arms move settled solids toward the centre hopper for controlled withdrawal.",
    accent: "#F59E0B",
  },
  {
    id: "decant",
    step: "04",
    title: "Decant effluent",
    description: "Clarified water flows evenly across the weir and into the effluent launder.",
    accent: "#34D399",
  },
] as const satisfies readonly ClarifierStage[];

export type ClarifierStageId = (typeof CLARIFIER_STAGES)[number]["id"];

export const CLARIFIER_STAGE_PARTS: Record<ClarifierStageId, ClarifierPartId> = {
  distribute: "feedwell",
  settle: "weir",
  collect: "scrapers",
  decant: "weir",
};

export function resolveClarifierCount(metadataCount: unknown, fallback: number): number {
  const parsed = typeof metadataCount === "number" ? metadataCount : Number(metadataCount);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}
