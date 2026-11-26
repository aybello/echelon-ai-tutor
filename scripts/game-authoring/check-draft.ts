// Validation only. Builds items in memory from an authoring table and reports problems.
// It never writes a file and never produces a publishable overlay or review record.
//   env -i PATH="$PATH" HOME=/tmp NODE_ENV=test node --require ./scripts/test-safety.cjs --import tsx \
//     scripts/game-authoring/check-draft.ts <table-file> <batchTag, e.g. 6>
import { pathToFileURL } from "node:url";
import { readdirSync } from "node:fs";
import { basename } from "node:path";
import { resolve } from "node:path";
import { InteractiveContentEngine } from "../../server/interactiveContent/engine/loader";
import { committedOverlayDocuments, type ContentOverlay } from "../../server/interactiveContent/engine/overlay";
import { buildItems, validate, type CourseData } from "./build";

const norm = (s: string) => s.normalize("NFKC").toLowerCase().replace(/[^\p{L}\p{N}]+/gu, " ").trim();
const [file, batch] = process.argv.slice(2);
const data = (await import(pathToFileURL(resolve(file)).href)).default as CourseData;
const { items, errors: buildErrors } = buildItems(data, `b${batch}-`);
// In-memory placeholder only, so the overlay schema can be checked. Never written anywhere.
const review = { verdict: "approved", reviewer: "draft-check", reviewAuthority: "owner-authorized-ai-review", reviewedAt: "2026-11-14T00:00:00Z", notes: "in-memory validation only" } as const;
const doc = { format: "interactive-overlay-v1", overlayId: `draft-check-${batch}`, scope: "draft validation", replacements: [],
  additions: items.map(i => ({ courseKey: data.courseKey, topicId: "unclassified", difficulty: i.difficulty, example: i.example, review })) } as unknown as ContentOverlay;
const engine = new InteractiveContentEngine() as any;
const manifest = engine.manifest(data.courseKey); const stored: any[] = [];
for (let i = 0; i < manifest.entries.length; i += 50) stored.push(...engine.examples(manifest, manifest.entries.slice(i, i + 50)));
for (const d of committedOverlayDocuments() as ContentOverlay[]) for (const a of d.additions) if (a.courseKey === data.courseKey) stored.push(a.example);
// Other draft tables for the same course also count as existing, so parallel writers do not duplicate each other.
const dataDir = resolve(file, "..");
for (const other of readdirSync(dataDir)) {
  if (!other.endsWith(".ts") || other === basename(file)) continue;
  const table = (await import(pathToFileURL(resolve(dataDir, other)).href)).default as CourseData;
  if (table.courseKey !== data.courseKey) continue;
  for (const item of buildItems(table, `x-${other}-`).items) stored.push(item.example);
}
const existing = stored.map(e => ({ prompt: e.prompt, key: norm(JSON.stringify(e.options ?? e.pairs ?? e.correctAnswer)) }));
const { errors, stats } = validate(doc, existing);
const byMode: Record<string, number> = {}; for (const a of doc.additions) byMode[(a.example as any).mode] = (byMode[(a.example as any).mode] ?? 0) + 1;
console.log(`${data.courseKey} batch ${batch}: ${items.length} items`, JSON.stringify(byMode), JSON.stringify(stats));
const all = [...buildErrors, ...errors];
for (const e of all.slice(0, 40)) console.log("ERROR", e);
console.log(all.length ? `${all.length} problem(s)` : "no problems");
process.exit(all.length ? 1 : 0);
