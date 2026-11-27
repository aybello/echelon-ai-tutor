import { readFileSync, writeFileSync, readdirSync } from "node:fs";
import { resolve } from "node:path";
const root = resolve(import.meta.dirname, "../..");
const order = [
  "basic-safety",
  "basic-hydraulics",
  "basic-math",
  "chlorination-principles",
  "basic-instrumentation",
  "water-distribution-overview",
  "supervisor-essentials",
  "drinking-water-compliance",
  "water-treatment-process-control",
  "wastewater-treatment-process-control",
  "sampling-data-quality",
  "disinfection-ct",
  "coagulation-filtration",
  "instrumentation-scada",
  "distribution-water-quality",
  "collection-wet-weather",
  "activated-sludge-troubleshooting",
  "water-treatment-concepts",
  "wastewater-treatment-concepts",
  "sludge-thickening",
  "sludge-digestion",
  "sludge-dewatering",
  "lift-stations",
  "effluent-filtration",
  "reverse-osmosis",
  "lime-softening",
  "fluoride",
  "chloramines"
];
const codes = [
  "ceu-basic-safety",
  "ceu-basic-hydraulics",
  "ceu-basic-math",
  "ceu-chlorination-principles",
  "ceu-basic-instrumentation",
  "ceu-water-distribution-overview",
  "ceu-supervisor-essentials",
  "ceu-compliance",
  "ceu-water-process",
  "ceu-wastewater-process",
  "ceu-sampling",
  "ceu-disinfection",
  "ceu-filtration",
  "ceu-scada",
  "ceu-distribution",
  "ceu-collection",
  "ceu-activated-sludge",
  "ceu-water-treatment-concepts",
  "ceu-wastewater-concepts",
  "ceu-sludge-thickening",
  "ceu-sludge-digestion",
  "ceu-sludge-dewatering",
  "ceu-lift-stations",
  "ceu-effluent-filtration",
  "ceu-reverse-osmosis",
  "ceu-lime-softening",
  "ceu-fluoride",
  "ceu-chloramines"
];
const curricula = order.map(k =>
  JSON.parse(
    readFileSync(resolve(root, `server/ceu/courses/ceu-${k}.json`), "utf8")
  )
);
if (
  readdirSync(resolve(root, "server/ceu/courses")).filter(f =>
    f.endsWith(".json")
  ).length !== order.length
)
  throw Error("Catalogue order must include every curriculum.");
const covers = {
  "ceu-basic-safety": {
    "src": "/manus-storage/ceu-basic-safety-cover_008a7f91.jpg",
    "alt": "Water operator safety training equipment"
  },
  "ceu-basic-hydraulics": {
    "src": "/manus-storage/ceu-basic-hydraulics-cover_c5a35cbb.jpg",
    "alt": "Water operator hydraulics training"
  },
  "ceu-basic-math": {
    "src": "/manus-storage/ceu-basic-math-cover_bfce9684.jpg",
    "alt": "Water operator mathematics training"
  },
  "ceu-chlorination-principles": {
    "src": "/manus-storage/ceu-chlorination-principles-cover_8c50586b.jpg",
    "alt": "Chlorination Principles for Water and Wastewater Operators: illustrative operator training scene"
  },
  "ceu-basic-instrumentation": {
    "src": "/manus-storage/ceu-basic-instrumentation-cover_9e868b43.jpg",
    "alt": "Basic Instrumentation for Water and Wastewater Operators: illustrative operator training scene"
  },
  "ceu-water-distribution-overview": {
    "src": "/manus-storage/ceu-water-distribution-overview-cover_033f54eb.jpg",
    "alt": "Water Distribution Overview for Operators: illustrative operator training scene"
  },
  "ceu-supervisor-essentials": {
    "src": "/manus-storage/ceu-supervisor-essentials-cover_c5ab4951.jpg",
    "alt": "Supervisor Essentials for Water and Wastewater Operators: illustrative operator training scene"
  },
  "ceu-drinking-water-compliance": {
    "src": "/manus-storage/ceu-drinking-water-compliance-cover_da3d3d38.jpg",
    "alt": "Drinking Water Operations and Regulatory Compliance: illustrative operator training scene"
  },
  "ceu-water-treatment-process-control": {
    "src": "/manus-storage/ceu-water-treatment-process-control-cover_b42f020f.jpg",
    "alt": "Water Treatment Process Control and Optimization: illustrative operator training scene"
  },
  "ceu-wastewater-treatment-process-control": {
    "src": "/manus-storage/ceu-wastewater-treatment-process-control-cover_254148b5.jpg",
    "alt": "Wastewater Treatment Operations and Process Control: illustrative operator training scene"
  },
  "ceu-sampling-data-quality": {
    "src": "/manus-storage/ceu-sampling-data-quality-cover_921d2611.jpg",
    "alt": "Sampling, Laboratory Results and Data Quality: illustrative operator training scene"
  },
  "ceu-disinfection-ct": {
    "src": "/manus-storage/ceu-disinfection-ct-cover_5d726806.jpg",
    "alt": "Disinfection Verification and CT Calculations: illustrative operator training scene"
  },
  "ceu-coagulation-filtration": {
    "src": "/manus-storage/ceu-coagulation-filtration-cover_0e504937.jpg",
    "alt": "Coagulation, Filtration and Controlled Optimization: illustrative operator training scene"
  },
  "ceu-instrumentation-scada": {
    "src": "/manus-storage/ceu-instrumentation-scada-cover_9fc6ed5d.jpg",
    "alt": "Instrumentation, SCADA and Operational Data Integrity: illustrative operator training scene"
  },
  "ceu-distribution-water-quality": {
    "src": "/manus-storage/ceu-distribution-water-quality-cover_1a8acfce.jpg",
    "alt": "Distribution Water Quality and System Integrity: illustrative operator training scene"
  },
  "ceu-collection-wet-weather": {
    "src": "/manus-storage/ceu-collection-wet-weather-cover_1e493bea.jpg",
    "alt": "Collection Systems and Wet-Weather Response: illustrative operator training scene"
  },
  "ceu-activated-sludge-troubleshooting": {
    "src": "/manus-storage/ceu-activated-sludge-troubleshooting-cover_5618888a.jpg",
    "alt": "Activated Sludge Troubleshooting and Solids Control: illustrative operator training scene"
  },
  "ceu-water-treatment-concepts": {
    "src": "/manus-storage/ceu-water-treatment-concepts-cover_6b46c3b7.png",
    "alt": "Water treatment concepts course cover"
  },
  "ceu-wastewater-treatment-concepts": {
    "src": "/manus-storage/ceu-wastewater-treatment-concepts-cover_abf712eb.png",
    "alt": "Wastewater treatment concepts course cover"
  },
  "ceu-sludge-thickening": {"src":"/manus-storage/ceu-sludge-thickening-cover_49d477d1.jpg","alt":"Sludge Thickening for Wastewater Operators: illustrative operator training scene"},
  "ceu-sludge-digestion": {"src":"/manus-storage/ceu-sludge-digestion-cover_e063766d.jpg","alt":"Sludge Digestion for Wastewater Operators: illustrative operator training scene"},
  "ceu-sludge-dewatering": {"src":"/manus-storage/ceu-sludge-dewatering-cover_a96cc290.jpg","alt":"Sludge Dewatering for Wastewater Operators: illustrative operator training scene"},
  "ceu-lift-stations": {"src":"/manus-storage/ceu-lift-stations-cover_9448a07d.jpg","alt":"Lift Stations for Wastewater Operators: illustrative operator training scene"},
  "ceu-effluent-filtration": {"src":"/manus-storage/ceu-effluent-filtration-cover_8e2ad7ac.jpg","alt":"Effluent Filtration for Wastewater Operators: illustrative operator training scene"},
  "ceu-reverse-osmosis": {"src":"/manus-storage/ceu-reverse-osmosis-cover_eefba436.jpg","alt":"Reverse Osmosis for Water Operators: illustrative operator training scene"},
  "ceu-lime-softening": {"src":"/manus-storage/ceu-lime-softening-cover_9d02a735.jpg","alt":"Lime Softening for Water Operators: illustrative operator training scene"},
  "ceu-fluoride": {"src":"/manus-storage/ceu-fluoride-cover_e8719c88.jpg","alt":"Fluoride in Drinking Water for Operators: illustrative operator training scene"},
  "ceu-chloramines": {"src":"/manus-storage/ceu-chloramines-cover_04e38866.jpg","alt":"Chloramines in Drinking Water for Operators: illustrative operator training scene"}
};
const foundations = new Set(["ceu-water-treatment-concepts", "ceu-wastewater-treatment-concepts", "ceu-basic-safety", "ceu-basic-hydraulics", "ceu-basic-math", "ceu-chlorination-principles", "ceu-basic-instrumentation", "ceu-water-distribution-overview", "ceu-supervisor-essentials"]);
const data = curricula.map((c, i) => ({
  key: c.key,
  interestCode: codes[i],
  title: c.title,
  shortTitle: c.shortTitle,
  stream: c.stream,
  group: foundations.has(c.key) ? "foundations" : "applied",
  regionLabel: foundations.has(c.key) ? "Operator foundations" : c.stream === "drinking_water" ? "Ontario drinking water" : "Ontario wastewater",
  ...(covers[c.key] ? { cover: covers[c.key] } : {}),
  approvalStatus: foundations.has(c.key) ? "not_submitted" :
    c.stream === "drinking_water"
      ? "director_approval_required"
      : "ceu_value_review_required",
  statusLabel: foundations.has(c.key) ? "Not submitted for approval" :
    c.stream === "drinking_water"
      ? "Director approval required"
      : "OWWCO course-value review required",
  statusDescription: foundations.has(c.key) ? "Educational foundation course. Not submitted for regulatory approval in any jurisdiction." :
    c.stream === "drinking_water"
      ? "Pilot curriculum. Director approval is required before advertising approved drinking-water CEUs."
      : "Pilot curriculum. OWWCO review is required before stating an assessed wastewater CEU value.",
  plannedContactHours: c.plannedMinutes / 60,
  audience: c.audience,
  outcomes: c.modules.map(m => m.objectives[0]),
  modules: c.modules.map((m, j) => ({
    number: j + 1,
    title: m.title,
    durationMinutes: m.activities.reduce((s, a) => s + a.minutes, 0),
    summary: m.objectives.join(" "),
  })),
  completionRequirements: [
    `Complete all ${c.modules.length} modules at your own pace. Your place is saved as you move through the slides.`,
    "Use the optional quick checks to practise; they do not affect your final grade.",
    "Score at least 80% on the final exam. Review your results and retry if needed.",
    "Receive your non-credit pilot certificate automatically after passing. Course evaluation is optional.",
  ],
  publicDisclosure: `No approved CEUs or regulatory recognition are awarded. Duration is being validated; no contact-hour award is made by this pilot. ${foundations.has(c.key) ? "This foundation course has not been submitted for approval in any jurisdiction. " : c.stream === "wastewater" ? "Wastewater-only courses are not Director approved for drinking-water renewal. " : "Director approval is required before approved drinking-water CEUs can be offered. "}Use current facility procedures and applicable requirements for operational decisions.`,
  ctaLabel: "Request course and review updates",
}));
const path = resolve(root, "shared/ceuCatalogueData.json");
const output = JSON.stringify(data, null, 2) + "\n";
if (process.argv.includes("--check")) {
  if (readFileSync(path, "utf8") !== output)
    throw Error(
      "Run node scripts/ceu/generateCatalogue.mjs to refresh public metadata."
    );
} else writeFileSync(path, output);
console.log(
  `${data.length} course metadata records ${process.argv.includes("--check") ? "verified" : "generated"}; assessment keys stay server-side.`
);
