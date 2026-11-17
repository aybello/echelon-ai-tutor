import { readFileSync, writeFileSync, readdirSync } from "node:fs";
import { resolve } from "node:path";
const root = resolve(import.meta.dirname, "../..");
const order = [
  "basic-safety", "basic-hydraulics", "basic-math",
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
];
const codes = [
  "ceu-basic-safety", "ceu-basic-hydraulics", "ceu-basic-math",
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
  "ceu-basic-safety": { src: "https://files.manuscdn.com/user_upload_by_module/session_file/310519663446228701/qlvirWqFtbxUNoeG.jpg", alt: "Water operator safety training equipment" },
  "ceu-basic-hydraulics": { src: "https://files.manuscdn.com/user_upload_by_module/session_file/310519663446228701/txYeoebaOSmzZXAn.jpg", alt: "Water operator hydraulics training" },
  "ceu-basic-math": { src: "https://files.manuscdn.com/user_upload_by_module/session_file/310519663446228701/oAWVmiXiXiPCiMRH.jpg", alt: "Water operator mathematics training" },
};
const data = curricula.map((c, i) => ({
  key: c.key,
  interestCode: codes[i],
  title: c.title,
  shortTitle: c.shortTitle,
  stream: c.stream,
  group: covers[c.key] ? "foundations" : "applied",
  regionLabel: covers[c.key] ? "Operator foundations" : c.stream === "drinking_water" ? "Ontario drinking water" : "Ontario wastewater",
  ...(covers[c.key] ? { cover: covers[c.key] } : {}),
  approvalStatus: covers[c.key] ? "not_submitted" :
    c.stream === "drinking_water"
      ? "director_approval_required"
      : "ceu_value_review_required",
  statusLabel: covers[c.key] ? "Not submitted for approval" :
    c.stream === "drinking_water"
      ? "Director approval required"
      : "OWWCO course-value review required",
  statusDescription: covers[c.key] ? "Educational foundation course. Not submitted for regulatory approval in any jurisdiction." :
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
  publicDisclosure: `No approved CEUs or regulatory recognition are awarded. Duration is being validated; no contact-hour award is made by this pilot. ${covers[c.key] ? "This foundation course has not been submitted for approval in any jurisdiction. " : c.stream === "wastewater" ? "Wastewater-only courses are not Director approved for drinking-water renewal. " : "Director approval is required before approved drinking-water CEUs can be offered. "}Use current facility procedures and applicable requirements for operational decisions.`,
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
