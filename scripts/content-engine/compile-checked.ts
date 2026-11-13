import { resolve } from "node:path";
import { mkdirSync, rmSync, lstatSync } from "node:fs";
import { fileURLToPath, pathToFileURL } from "node:url";
import { z } from "zod";
import { approvedCorpora } from "./trusted-corpora";
import { compileLegacyRelease, type ClassifiedExample } from "../../server/interactiveContent/engine/compiler";
import { interactivePackageSchema } from "../../server/interactiveContent/schema";
import { interactiveDrillExampleSchema, interactiveModes } from "../../shared/interactiveSessions";
// The offline authoring modules are plain ESM and intentionally have no runtime/backend imports.
// @ts-expect-error Offline JavaScript module has no declaration file.
import { DocumentSchema, payloadIssues } from "./schemas.mjs";
// @ts-expect-error Offline JavaScript module has no declaration file.
import { coverage, blockers } from "./coverage.mjs";
// @ts-expect-error Offline JavaScript module has no declaration file.
import { identity, hash } from "./identity.mjs";
// @ts-expect-error Offline JavaScript module has no declaration file.
import { readRelease } from "./inventory.mjs";
// @ts-expect-error Offline JavaScript module has no declaration file.
import { createPrivateStore } from "./storage.mjs";

type Exercise = { courseKey: string; exerciseId: string; mode: string; difficulty: "easy" | "medium" | "hard" | "unclassified"; item: { id: string }; legacy: unknown };
const repoRoot = resolve(fileURLToPath(new URL("../..", import.meta.url)));

const selectionSchema = z.object({
  approvalId: z.string().min(1).max(120), corpus: DocumentSchema,
  selected: z.array(z.object({ courseKey: z.string().min(1), exerciseId: z.string().min(1) }).strict()).min(1),
}).strict();

/** Only a separately maintained, prior documentary approval may establish the intended
 * full corpus. A hash checks that binding, not completeness or reviewer authenticity. */
export function compileCheckedRelease(input: unknown, outputDir: string) {
  const request = selectionSchema.parse(input);
  const doc = request.corpus;
  const approval = approvedCorpora[request.approvalId];
  if (!approval || ![approval.scope, approval.inventoryEvidence, approval.approvalEvidence].every(v => typeof v === "string" && v.trim().length > 0) || !/^[a-f0-9]{64}$/.test(approval.corpusSha256) || approval.corpusSha256 !== hash(doc)) throw new Error("No trusted prior full-corpus approval for this document");
  const selectedKeys = request.selected.map(({ courseKey, exerciseId }) => `${courseKey}/${exerciseId}`);
  if (new Set(selectedKeys).size !== selectedKeys.length) throw new Error("Duplicate selection");
  const selected = new Set(selectedKeys);
  const candidates = (doc.exercises as Exercise[]).filter(e => selected.has(`${e.courseKey}/${e.exerciseId}`));
  if (candidates.length !== selected.size) throw new Error("Selection missing or ambiguous");
  const release = readRelease(repoRoot);
  if (release.missingCourses.length || release.packages.length !== 38) throw new Error("Incomplete immutable legacy release");
  if (!doc.exercises.length) throw new Error("No new records supplied");
  const report = coverage(doc);
  if (report.duplicateReferenceIds || report.quarantines.length) throw new Error("Authoring corpus has duplicate references or quarantined records");
  const packages = new Map<string, ReturnType<typeof interactivePackageSchema.parse>>();
  const legacyProblems = new Map<string, Set<string>>();
  const legacyIds = new Map<string, Set<string>>();
  for (const raw of release.packages) {
    // inventory adds an internal packageHash which is not part of the runtime package.
    const { packageHash: _packageHash, ...source } = raw;
    const pkg = interactivePackageSchema.parse(source);
    packages.set(pkg.courseKey, pkg);
    legacyProblems.set(pkg.courseKey, new Set(pkg.examples.map(e => `${e.mode}:${identity(e).problemHash}`)));
    legacyIds.set(pkg.courseKey, new Set(pkg.examples.map(e => e.id)));
  }
  const additions = new Map<string, ClassifiedExample[]>();
  for (const e of candidates) {
    const pkg = packages.get(e.courseKey);
    if (!pkg || e.legacy !== null || e.exerciseId !== e.item.id || blockers(e, doc).length || payloadIssues(e.item, interactiveDrillExampleSchema).length) throw new Error("Record is not a checked new release candidate");
    if (legacyIds.get(e.courseKey)!.has(e.item.id) || legacyProblems.get(e.courseKey)!.has(`${e.mode}:${identity(e.item).problemHash}`)) throw new Error("Record conflicts with frozen legacy content");
    // Validate the actual server package semantics, including structural refinements,
    // without exceeding its 300-item compatibility limit. Never modify the package.
    const controls = interactiveModes.flatMap(mode => [
      pkg.examples.find(item => item.id === pkg.previewIds[mode])!,
      pkg.examples.find(item => item.mode === mode && item.id !== pkg.previewIds[mode])!,
    ]);
    interactivePackageSchema.parse({ ...pkg, examples: [...controls, e.item] });
    const example = interactiveDrillExampleSchema.parse(e.item);
    const rows = additions.get(e.courseKey) ?? [];
    rows.push({ example, topicId: "unclassified", difficulty: e.difficulty });
    additions.set(e.courseKey, rows);
  }
  // compileLegacyRelease independently verifies registry approvals, package hashes,
  // scope, preview identity, byte/count limits and runtime manifest/shard schemas.
  const result = compileLegacyRelease({ outputDir, additionalRecords: additions });
  return { ...result, newItemCount: candidates.length };
}

/** Explicit opt-in reads only a relative file in the fixed private store. */
export function compilePrivateInput(name: string, outputDir: string) {
  const store = createPrivateStore({ repoRoot });
  const file = store.destination(name);
  if (!lstatSync(file).isFile() || lstatSync(file).size > 64 * 1024 * 1024) throw new Error("Invalid or oversized private input");
  return compileCheckedRelease(JSON.parse(store.read(name)), outputDir);
}

/** CLI output is a fresh directory under the same fixed private root, never a public bundle. */
export function compilePrivateDirectory(inputName: string, outputName: string) {
  const store = createPrivateStore({ repoRoot });
  const output = store.destination(outputName);
  mkdirSync(output, { mode: 0o700 }); // exclusive reservation; no overwrite
  try { return compilePrivateInput(inputName, output); }
  catch (error) { rmSync(output, { recursive: true, force: true }); throw error; }
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  try {
    if (process.argv.length !== 4) throw new Error("Expected private input and new private output directory");
    const result = compilePrivateDirectory(process.argv[2], process.argv[3]);
    console.log(JSON.stringify({ status: "compiled-private", courses: result.courseCount, legacyItems: result.itemCount, newItems: result.newItemCount }));
  } catch { console.error("Checked compiler refused input or destination; no release was activated."); process.exitCode = 1; }
}
