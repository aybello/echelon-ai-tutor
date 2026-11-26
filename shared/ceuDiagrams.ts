import type { CeuLesson } from "./ceuLearning";
import type { CeuSlide } from "./ceuSlides";

export type CeuDiagramFamily =
  | "treatment"
  | "control"
  | "evidence"
  | "calculation"
  | "safety"
  | "leadership";

export interface CeuDiagramDefinition {
  family: CeuDiagramFamily;
  title: string;
  caption: string;
  steps: readonly [string, string, string, string, string];
}

const DIAGRAMS: Record<CeuDiagramFamily, Omit<CeuDiagramDefinition, "steps">> = {
  treatment: {
    family: "treatment",
    title: "Treatment barrier map",
    caption: "Follow the material through each barrier, then verify the result.",
  },
  control: {
    family: "control",
    title: "Process-control loop",
    caption: "A useful operating loop connects the signal to a measured response.",
  },
  evidence: {
    family: "evidence",
    title: "Evidence-to-decision path",
    caption: "Good decisions keep the question, evidence, quality check and record connected.",
  },
  calculation: {
    family: "calculation",
    title: "Calculation check path",
    caption: "Carry the units through the calculation before using the result.",
  },
  safety: {
    family: "safety",
    title: "Safety control path",
    caption: "Recognise the hazard, apply the control and verify the work is safe.",
  },
  leadership: {
    family: "leadership",
    title: "Shift leadership loop",
    caption: "A reliable handover turns observations into owned, verifiable work.",
  },
};

const TREATMENT_STEPS: Array<[RegExp, CeuDiagramDefinition["steps"]]> = [
  [/preliminary|primary/i, ["Influent", "Screen", "Remove grit", "Settle solids", "Check removal"]],
  [/activated|biological|biomass/i, ["Load", "Aerate", "Mix liquor", "Clarify", "Trend solids"]],
  [/filter/i, ["Condition water", "Build floc", "Filter media", "Backwash", "Verify effluent"]],
  [/chlorin|disinfection|ct/i, ["Dose", "Mix", "Contact", "Measure residual", "Record CT"]],
  [/distribution|storage|pressure|system components/i, ["Source", "Store", "Transmit", "Zone pressure", "Protect quality"]],
  [/collection|wet-weather|wet well|incident volume|response plan/i, ["Catchment", "Collect", "Pump or store", "Measure event", "Recover"]],
  [/source and the treatment train|treatment train|coagulation|sedimentation|water treatment concepts/i, ["Source water", "Coagulate", "Settle", "Filter", "Disinfect"]],
];

function familyFor(module: Pick<CeuLesson, "id" | "title">): CeuDiagramFamily {
  const text = `${module.id} ${module.title}`;
  if (/safety|hazard|confined|excavation|chemical-emergency/i.test(text)) return "safety";
  if (/supervisor|responsibility|management|leading-through-change|role/i.test(text)) return "leadership";
  if (/math|calculation|formula|number|percent|area|volume|plant-formulas|dose-calculations/i.test(text)) return "calculation";
  if (/instrument|scada|alarm|signal|control|monitoring|data-audit|sampling|custody|quality|compliance|records|audit|evidence|report|practicum/i.test(text)) return "evidence";
  if (/process|treatment|filter|chlorin|disinfection|distribution|collection|storage|wet-weather|activated|biological|coagulation|sedimentation|source-and-train|preliminary/i.test(text)) return "treatment";
  return "control";
}

function stepsFor(module: Pick<CeuLesson, "id" | "title">, family: CeuDiagramFamily): CeuDiagramDefinition["steps"] {
  const text = `${module.id} ${module.title}`;
  if (family === "treatment") {
    const match = TREATMENT_STEPS.find(([pattern]) => pattern.test(text));
    if (match) return match[1];
  }
  if (family === "control") return ["Measure", "Compare", "Adjust", "Confirm", "Document"];
  if (family === "evidence") return ["Question", "Collect", "Quality check", "Interpret", "Record"];
  if (family === "calculation") return ["Define inputs", "Align units", "Calculate", "Check limits", "Decide"];
  if (family === "safety") return ["Spot hazard", "Choose control", "Prepare", "Verify", "Report"];
  return ["Observe", "Assign", "Support", "Verify", "Handover"];
}

export function ceuDiagramFor(module: Pick<CeuLesson, "id" | "title">): CeuDiagramDefinition {
  const family = familyFor(module);
  return { ...DIAGRAMS[family], steps: stepsFor(module, family) };
}

export function ceuDiagramFamilyFor(module: Pick<CeuLesson, "id" | "title">) {
  return ceuDiagramFor(module).family;
}

/**
 * Chooses one authored teaching slide for the visual. The selection is title-driven
 * so a diagram stays beside the concept it explains rather than becoming decoration
 * on every slide in the course.
 */
export function ceuDiagramSlideId(
  module: Pick<CeuLesson, "id" | "title">,
  slides: readonly Pick<CeuSlide, "id" | "kind" | "title">[]
) {
  const family = ceuDiagramFamilyFor(module);
  const hints: Record<CeuDiagramFamily, RegExp> = {
    treatment: /train|process|screen|grit|clarif|aerat|filter|disinfect|residual|distribution|storage|pressure|collection|hydrograph|wet well|incident|solids|nutrient/i,
    control: /control|loop|trend|alarm|setpoint|scada|instrument|signal|measurement|troubleshoot/i,
    evidence: /evidence|record|sample|custody|quality|compliance|audit|data|report|decision|monitor/i,
    calculation: /formula|worked example|calculation|units|volume|flow|dose|detention|loading|ratio|percent/i,
    safety: /hazard|control|ppe|confined|atmosphere|excavat|energy|chemical|emergency|rescue/i,
    leadership: /role|responsib|accountab|style|delegat|coach|change|handover|supervisor/i,
  };
  const conceptSlides = slides.filter(slide => slide.kind === "lesson");
  return (
    conceptSlides.find(slide => hints[family].test(slide.title))?.id ??
    conceptSlides[0]?.id ??
    `${module.id}:concept-1`
  );
}
