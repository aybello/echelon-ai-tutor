import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const allocation = JSON.parse(
  readFileSync(resolve(root, "content/309a/309a-allocation.json"), "utf8"),
);
const sourceManifest = JSON.parse(
  readFileSync(resolve(root, "content/309a/current-exam-source-manifest.json"), "utf8"),
);
const questionSchema = JSON.parse(
  readFileSync(resolve(root, "content/309a/309a-question.schema.json"), "utf8"),
);

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const total = allocation.majorWorkActivities.reduce(
  (sum, mwa) => sum + mwa.bankTarget,
  0,
);
assert(total === allocation.bankTarget, `MWA bank total ${total} must equal ${allocation.bankTarget}.`);

for (const mwa of allocation.majorWorkActivities) {
  const taskTotal = mwa.tasks.reduce((sum, task) => sum + task.bankTarget, 0);
  assert(
    taskTotal === mwa.bankTarget,
    `${mwa.code} task total ${taskTotal} must equal ${mwa.bankTarget}.`,
  );
}

assert(allocation.bankTarget === 500, "The 309A production package must target 500 questions.");
assert(allocation.officialExamTarget === 100, "The official practice-form target must be 100 questions.");
assert(sourceManifest.sources.length >= 4, "At least four authoritative source records are required.");
for (const source of sourceManifest.sources) {
  assert(/^https:\/\//.test(source.url), `${source.id} must have an https URL.`);
  assert(/^[a-f0-9]{64}$/.test(source.sha256), `${source.id} must have a SHA-256 hash.`);
}

assert(questionSchema.properties.bankKey.const === "electrician-309a", "Question schema bank key drift.");
assert(questionSchema.properties.options.minItems === 4, "Question schema must require four options.");
assert(questionSchema.properties.options.maxItems === 4, "Question schema must limit options to four.");
assert(
  questionSchema.properties.questionNum.maximum === 500,
  "Question schema must cap bank item numbers at 500.",
);

console.log(
  `309A production package valid: ${allocation.bankTarget} questions across ${allocation.majorWorkActivities.length} MWAs and ${sourceManifest.sources.length} source records.`,
);
