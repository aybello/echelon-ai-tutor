import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";

const root = new URL("../content/class1-treatment/", import.meta.url);
const manifestPath = new URL("manifest.json", root);
const manifest = JSON.parse(await readFile(manifestPath, "utf8"));
for (const entry of manifest.banks) {
  const bytes = await readFile(new URL(entry.file, root));
  const rows = JSON.parse(bytes.toString("utf8"));
  entry.sha256 = createHash("sha256").update(bytes).digest("hex");
  entry.count = rows.length;
  entry.conceptual = rows.filter((row) => row.isCalc !== "yes").length;
  entry.calculations = rows.filter((row) => row.isCalc === "yes").length;
  entry.canonicalAnswerPositions = [0, 1, 2, 3].map((index) => rows.filter((row) => row.correctIndex === index).length);
}
manifest.reviewSummary.residualCueCorrections = 6;
manifest.reviewSummary.deterministicDisplayOnlyAnswerBalances = 3;
manifest.reviewSummary.residualCueAudit = "audit/residual-cue-resolution.json";
await writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
console.log(JSON.stringify({ banks: manifest.banks.map((entry) => ({ bankKey: entry.bankKey, sha256: entry.sha256, answerPositions: entry.canonicalAnswerPositions })) }, null, 2));
