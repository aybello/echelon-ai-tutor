import { createHash } from "node:crypto";
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
const taxonomy = JSON.parse(
  readFileSync(resolve(root, "content/309a/309a-subtask-taxonomy.json"), "utf8"),
);
const diagrams = JSON.parse(
  readFileSync(resolve(root, "content/309a/309a-diagrams.json"), "utf8"),
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
  const mixTotal = Object.values(mwa.questionMix).reduce((sum, value) => sum + value, 0);
  assert(mixTotal === mwa.bankTarget, `${mwa.code} question mix ${mixTotal} must equal ${mwa.bankTarget}.`);
  const cognitiveTotal = Object.values(mwa.cognitiveMix).reduce((sum, value) => sum + value, 0);
  assert(cognitiveTotal === mwa.bankTarget, `${mwa.code} cognitive mix ${cognitiveTotal} must equal ${mwa.bankTarget}.`);
}

assert(allocation.bankTarget === 500, "The 309A production package must target 500 questions.");
assert(allocation.officialExamTarget === 100, "The official practice-form target must be 100 questions.");
assert(sourceManifest.sources.length >= 4, "At least four authoritative source records are required.");
for (const source of sourceManifest.sources) {
  assert(/^https:\/\//.test(source.url), `${source.id} must have an https URL.`);
  assert(/^[a-f0-9]{64}$/.test(source.sha256), `${source.id} must have a SHA-256 hash.`);
  assert(Boolean(source.verifiedAt), `${source.id} must record when rights were verified.`);
  assert(
    ["public_official_reference", "permission_granted", "licensed_access_required"].includes(source.rightsBasis),
    `${source.id} must record a recognized rights basis.`,
  );
  assert(Boolean(source.permittedUsage), `${source.id} must state permitted usage.`);
  if (source.hashScope === "normalized_subtask_taxonomy") {
    const snapshot = taxonomy.majorWorkActivities.find((mwa) => mwa.code === source.snapshotMwa);
    assert(Boolean(snapshot), `${source.id} must resolve to a taxonomy snapshot.`);
    const snapshotHash = snapshot
      ? createHash("sha256").update(JSON.stringify(snapshot)).digest("hex")
      : "";
    assert(snapshotHash === source.sha256, `${source.id} taxonomy snapshot hash drift.`);
    assert(snapshot?.sourceUrl === source.url, `${source.id} snapshot URL drift.`);
  }
}

assert(questionSchema.properties.bankKey.const === "electrician-309a", "Question schema bank key drift.");
assert(
  questionSchema.properties.bankVersionKey.const === allocation.bankVersionKey,
  "Question schema bank version drift.",
);
assert(questionSchema.properties.options.minItems === 4, "Question schema must require four options.");
assert(questionSchema.properties.options.maxItems === 4, "Question schema must limit options to four.");
assert(
  questionSchema.properties.bankItemNumber.maximum === 500,
  "Question schema must cap bank item numbers at 500.",
);
assert(questionSchema.required.includes("contentHash"), "Question schema must require immutable content hashes.");
assert(questionSchema.required.includes("contentStatus"), "Question schema must require governed content status.");
const taskCodes = new Set(allocation.majorWorkActivities.flatMap((mwa) => mwa.tasks.map((task) => task.code)));
const subtaskCodes = taxonomy.majorWorkActivities.flatMap((mwa) => mwa.subtasks.map(([code]) => code));
assert(new Set(subtaskCodes).size === subtaskCodes.length, "Subtask taxonomy must not contain duplicate codes.");
for (const taskCode of taskCodes) {
  assert(subtaskCodes.some((code) => code.startsWith(`${taskCode}.`)), `${taskCode} must have an official subtask mapping.`);
}
for (const code of subtaskCodes) {
  assert(taskCodes.has(code.split(".")[0]), `${code} does not map to a bank task.`);
}
assert(diagrams.diagrams.length === 16, "The original 309A diagram catalog must contain 16 components.");
assert(new Set(diagrams.diagrams.map((diagram) => diagram.id)).size === 16, "Diagram IDs must be unique.");

console.log(
  `309A production package valid: ${allocation.bankTarget} questions across ${allocation.majorWorkActivities.length} MWAs and ${sourceManifest.sources.length} source records.`,
);
