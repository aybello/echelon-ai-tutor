import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const report = JSON.parse(readFileSync(resolve(root, "reports/309a-independent-quality-review.json"), "utf8"));
const findings = report.chunks.flatMap((chunk) => chunk.items).filter((item) => item.verdict === "needs_revision");
const categories = new Map();
for (const finding of findings) {
  for (const issue of finding.issues) {
    const values = categories.get(issue.category) ?? [];
    values.push(finding.bankItemNumber);
    categories.set(issue.category, values);
  }
}

const lines = [
  "# Independent 309A Quality Review — Triage",
  "",
  `- Reviewed questions: ${report.questionCount}`,
  `- Questions requiring review: ${findings.length}`,
  "",
  "| Category | Finding count | Question numbers |",
  "| --- | ---: | --- |",
];
for (const [category, numbers] of [...categories.entries()].sort(([left], [right]) => left.localeCompare(right))) {
  lines.push(`| ${category} | ${numbers.length} | ${numbers.join(", ")} |`);
}
lines.push("", "## Findings", "");
for (const finding of findings) {
  lines.push(`### Question ${finding.bankItemNumber}`, "");
  for (const issue of finding.issues) lines.push(`- **${issue.category}:** ${issue.detail}`);
  lines.push("");
}

const path = resolve(root, "reports/309a-independent-quality-review-triage.md");
writeFileSync(path, `${lines.join("\n")}\n`);
console.log(lines.slice(0, 12).join("\n"));
