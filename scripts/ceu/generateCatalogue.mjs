import { readFileSync, writeFileSync, readdirSync } from "node:fs";
import { resolve } from "node:path";
const root = resolve(import.meta.dirname, "../..");
const order = [
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
const data = curricula.map((c, i) => ({
  key: c.key,
  interestCode: codes[i],
  title: c.title,
  shortTitle: c.shortTitle,
  stream: c.stream,
  approvalStatus:
    c.stream === "drinking_water"
      ? "director_approval_required"
      : "ceu_value_review_required",
  statusLabel:
    c.stream === "drinking_water"
      ? "Director approval required"
      : "OWWCO course-value review required",
  statusDescription:
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
    `Complete all ${c.modules.length} modules at your own pace with instructor-verified activity logs and practical work; ${c.plannedMinutes / 60} learning hours are planned, pending a timed pilot.`,
    "Pass each module check and submit every practical assignment for acceptance against all marking criteria.",
    `Score at least 80% on the ${c.finalAssessment.length}-question final assessment. Three attempts are available before instructor reassessment review.`,
    "Submit a course evaluation. An authorized instructor verifies completion and issues a non-credit pilot learning record.",
  ],
  publicDisclosure: `Duration is a planning estimate, not earned credit. ${c.plannedMinutes > 420 ? "Self-paced study is spread across at least two dates under the pilot's seven-hour daily recording limit; breaks and review turnaround are excluded. " : ""}No approved CEUs or regulatory recognition are awarded. ${c.stream === "wastewater" ? "Wastewater-only courses are not Director approved for drinking-water renewal. " : "Director approval is required before any approved drinking-water CEU claim. "}Use current facility procedures and applicable requirements for operational decisions.`,
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
