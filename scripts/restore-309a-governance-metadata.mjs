import { execFileSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
for (const file of ["batch-b.json", "batch-c.json", "batch-d.json", "batch-e.json"]) {
  const path = resolve(root, "content/309a/questions", file);
  const document = JSON.parse(readFileSync(path, "utf8"));
  const baseline = JSON.parse(execFileSync("git", ["show", `HEAD:content/309a/questions/${file}`], { cwd: root, encoding: "utf8" }));
  const baselineDiagramMetadata = new Map(
    baseline.questions.map((question) => [question.bankItemNumber, { diagramId: question.diagramId, diagramAlt: question.diagramAlt }]),
  );
  for (const question of document.questions) {
    delete question.diagramDescription;
    const governedDiagramMetadata = baselineDiagramMetadata.get(question.bankItemNumber);
    if (governedDiagramMetadata) Object.assign(question, governedDiagramMetadata);
    if (!question.diagramId) {
      question.diagramId = null;
      question.diagramAlt = null;
    }
    if (question.diagramId !== null && question.isCalc === "no" && !/diagram/i.test(question.question)) {
      question.question = `Using the accompanying diagram, ${question.question.charAt(0).toLowerCase()}${question.question.slice(1)}`;
    }
  }
  writeFileSync(path, `${JSON.stringify(document, null, 2)}\n`);
}
console.log("Restored governed diagram metadata and required diagram wording.");
