import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const diagramPromptNumbers = new Set([
  64, 75, 81, 103, 199, 205, 211, 217, 229, 253, 265, 277, 289, 301, 307, 313, 319, 331, 343,
]);
const optionRepairs = new Map([
  [119, "Compare the actual load, battery condition, temperature, manufacturer runtime data, alarm history, and test result with the 30-minute requirement; escalate any deficiency before acceptance."],
  [132, "Verify that the phase and neutral conductors pass through the sensing device correctly, then complete the manufacturer's functional test and compare results with the approved drawings."],
]);

for (const file of ["batch-b.json", "batch-c.json"]) {
  const path = resolve(root, "content/309a/questions", file);
  const document = JSON.parse(readFileSync(path, "utf8"));
  for (const question of document.questions) {
    if (diagramPromptNumbers.has(question.bankItemNumber) && !/diagram/i.test(question.question)) {
      question.question = `${question.question} Use the accompanying diagram to support your assessment.`;
    }
    if (optionRepairs.has(question.bankItemNumber)) {
      question.options[question.correctIndex] = optionRepairs.get(question.bankItemNumber);
    }
  }
  writeFileSync(path, `${JSON.stringify(document, null, 2)}\n`);
}

console.log("Applied 309A deterministic-validator content repairs.");
