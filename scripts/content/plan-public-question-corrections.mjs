import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { pathToFileURL } from "node:url";

export const corrections = JSON.parse(readFileSync(new URL("./public-question-corrections-20261017.json", import.meta.url), "utf8"));
const sha256 = value => createHash("sha256").update(JSON.stringify(value)).digest("hex");

/** Offline review support only. Exact raw serialized versions are required, not loose IDs. */
export function planPublicQuestionCorrections(snapshot) {
  if (!Array.isArray(snapshot)) throw new Error("Snapshot must be a question-row array.");
  const changes = corrections.corrections.map(({ expected, replacement }) => {
    const matches = snapshot.filter(row => row.id === expected.id);
    if (matches.length !== 1) throw new Error(`Expected exactly one row for ${expected.bankKey}/${expected.questionNum}`);
    const row = matches[0];
    for (const [key, value] of Object.entries(expected)) {
      if (row[key] !== value) throw new Error(`Exact-version mismatch for ${expected.bankKey}/${expected.questionNum}: ${key}`);
    }
    const steps = JSON.parse(replacement.steps);
    if (!Array.isArray(steps) || steps.some(step => !step.l?.trim() || !step.c?.trim())) throw new Error("Incomplete correction steps.");
    return { id: expected.id, bankKey: expected.bankKey, questionNum: expected.questionNum,
      expectedSha256: sha256(expected), expected, replacement, replacementSha256: sha256(replacement) };
  });
  return { mode: "offline-review-only", version: corrections.version, planSha256: sha256(changes), changes,
    applySupported: false, historicalAttemptsChanged: false };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  if (process.argv.length !== 3 || process.argv[2].startsWith("--")) throw new Error("Usage: node scripts/content/plan-public-question-corrections.mjs /private/exact-question-snapshot.json; no apply mode exists.");
  console.log(JSON.stringify(planPublicQuestionCorrections(JSON.parse(readFileSync(process.argv[2], "utf8"))), null, 2));
}
