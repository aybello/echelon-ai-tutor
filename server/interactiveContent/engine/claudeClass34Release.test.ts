import { historicalAuthoringBytes } from "./historicalAuthoringBaseline";
import { readFileSync, existsSync } from "node:fs";
import { createHash } from "node:crypto";
import { describe, expect, it } from "vitest";
import { InteractiveContentEngine } from "./loader";
import { committedOverlayDocuments, compileOverlays, type ContentOverlay } from "./overlay";
import { isExcludedFromMode, committedReleaseExclusions } from "./modeFit";
import { batchSha256, verifyReceipt } from "./reviewReceipt";
import { buildOverlay, validate, type CourseData } from "../../../scripts/game-authoring/build";
import { interactiveModes } from "../../../shared/interactiveSessions";
import rawCounts from "../../../docs/claude-class34-counts-20261115.json";
// An all-passing release has [], but held-table checks still need the table shape.
const counts = { ...rawCounts, held: rawCounts.held as (typeof rawCounts.passed)[number][] };
// Pin this historical 26-table regression; the Western release has its own full-bank regression.
const historicalIds = new Set([...counts.priorOverlayIds, ...counts.passed.map(b => b.id)]);
const docs = (committedOverlayDocuments() as ContentOverlay[]).filter(d => historicalIds.has(d.overlayId));
const ids = counts.passed.map(b => b.id);
const released = docs.filter(d => ids.includes(d.overlayId));
const prior = docs.slice(0, counts.priorOverlayIds.length);
const engine = new InteractiveContentEngine(undefined, docs);
const before = new InteractiveContentEngine(undefined, prior);
const sha = (bytes: Buffer) => createHash("sha256").update(bytes).digest("hex");
// The later exact-ID explanation hold is separately covered by westernGamesRelease.test.ts.
// Preserve the complete, byte-equivalent original 129-ID exclusion baseline here.
const historicalExclusions = { ...committedReleaseExclusions(), groups: committedReleaseExclusions().groups.slice(0, 22) };
const historicalExclusionBytes = Buffer.from(JSON.stringify(historicalExclusions, null, 2) + "\n");
const norm = (s: string) => s.normalize("NFKC").toLowerCase().replace(/[^\p{L}\p{N}]+/gu, " ").trim();
const pool = (e: InteractiveContentEngine, course: string) => {
  const view = e as unknown as { pool(c: string, manifest: unknown): { id: string; mode: string; overlay?: { example: any }; stored?: unknown }[]; manifest(c: string): unknown };
  return view.pool(course, view.manifest(course));
};
describe("pinned Class 3–4 Claude publication", () => {
  it("appends only individually passing tables after the exact prior registry", () => {
    expect(prior.map(d => d.overlayId)).toEqual(counts.priorOverlayIds);
    expect(docs.slice(prior.length).map(d => d.overlayId)).toEqual(ids);
    expect(released.flatMap(d => d.additions)).toHaveLength(counts.added);
    expect(released.flatMap(d => d.replacements)).toEqual([]);
    expect(counts.passedTables + counts.heldTables).toBe(counts.tables);
    expect(counts.tables).toBe(26);
    expect(() => compileOverlays(docs)).not.toThrow();
    for (const held of counts.held) {
      expect(docs.some(d => d.overlayId === held.id)).toBe(false);
      expect(existsSync(held.overlay)).toBe(false);
    }
  });
  it("preserves all protected prior payloads, declarations and exclusions byte-for-byte", () => {
    // PRs #247 and #251 authorize presentation-only stylesheet revisions, not content changes.
    // PR #265 adds optional CEU worked-solution and source-context presentation styles.
    // Keep the original publication fixture and every other protected hash unchanged.
    const protectedHashes = {
      ...counts.protectedHashes,
      "client/src/pages/admin.css": "008a798cf62d2d5582409e735f77d2513e3556fa140eed22206b47508cf8ec5e",
      "client/src/pages/ContinuingEducationCourse.css": "3c791788f370ec2f7fda4b2c87d0d89162dad5a76d717accacbcef1f4803ae87",
    };
    for (const [path, hash] of Object.entries(protectedHashes)) expect(sha(path === "server/interactiveContent/engine/releaseExclusions.json" ? historicalExclusionBytes : historicalAuthoringBytes(path)), path).toBe(hash);
  });
  it.each([...counts.passed, ...counts.held])("preserves exact pinned source for $stem and actual courseKey $course", async b => {
    expect(sha(readFileSync(b.table))).toBe(b.sourceSha256);
    const table = (await import(`../../../scripts/game-authoring/data/${b.stem}.ts`)).default as CourseData;
    expect(table.courseKey).toBe(b.course);
    const built = buildOverlay(table, b.id);
    expect(built.errors).toEqual([]);
    expect(built.doc.additions).toHaveLength(b.count);
    if (!ids.includes(b.id)) return;
    const doc = released.find(d => d.overlayId === b.id)!;
    expect(batchSha256(doc)).toBe(batchSha256(built.doc));
    expect(doc.additions.every(a => a.courseKey === table.courseKey)).toBe(true);
    expect(doc.format).toBe("interactive-overlay-v2");
    expect(() => verifyReceipt(doc as Parameters<typeof verifyReceipt>[0])).not.toThrow();
    expect(doc.receipt!.declaration.model).toBe("Claude (owner-provided; exact model unspecified)");
    expect(doc.receipt!.declaration.reviewedAt).toBeNull();
    expect(doc.receipt!.declaration.attestation).toContain(counts.source);
    expect(doc.receipt!.declaration.attestation).toContain(b.sourceSha256);
    expect(doc.receipt!.builderResults.errors).toEqual([]);
    expect(JSON.parse(readFileSync(b.declaration, "utf8"))).toEqual(doc.receipt!.declaration);
  });
  it.each(counts.courses)("%s: checks combined duplicate bank and exact effective IDs, counts, sessions and previews", course => {
    const oldPool = pool(before, course), live = pool(engine, course);
    const added = released.flatMap(d => d.additions).filter(a => a.courseKey === course);
    const oldIds = new Set(oldPool.map(e => e.id));
    expect(live.filter(e => oldIds.has(e.id))).toEqual(oldPool);
    expect(new Set(live.map(e => e.id))).toEqual(new Set([...oldPool.map(e => e.id), ...added.map(a => a.example.id)]));
    expect(live).toHaveLength(oldPool.length + added.length);
    expect(engine.getLegacyContent(course, true).examples).toEqual(before.getLegacyContent(course, true).examples);
    // Re-run the unchanged checker against stored artifacts plus every other accepted
    // addition for this course, including additions accepted later in publication order.
    const privateEngine = before as any;
    const manifest = privateEngine.manifest(course); const stored: any[] = [];
    for (let i = 0; i < manifest.entries.length; i += 50) stored.push(...privateEngine.examples(manifest, manifest.entries.slice(i, i + 50)));
    stored.push(...prior.flatMap(d => d.additions).filter(a => a.courseKey === course).map(a => a.example));
    for (const doc of released.filter(d => d.additions.some(a => a.courseKey === course))) {
      const others = [...stored, ...released.filter(d => d !== doc).flatMap(d => d.additions).filter(a => a.courseKey === course).map(a => a.example)];
      // The unchanged authoring checker accepts draft payloads, not receipt wrappers.
      const { receipt: _receipt, ...draft } = doc;
      const result = validate(draft, others.map(e => ({ prompt: e.prompt, key: norm(JSON.stringify(e.options ?? e.pairs ?? e.correctAnswer)) })));
      expect(result.errors, doc.overlayId).toEqual([]);
    }
    const catalog = engine.getCatalog(course, true);
    for (const mode of interactiveModes) {
      const expected = counts.rows.find(r => r.course === course && r.mode === mode)!;
      expect(before.getCatalog(course, true).modes.find(m => m.mode === mode)!.totalCount).toBe(expected.baseline);
      expect(catalog.modes.find(m => m.mode === mode)!.totalCount).toBe(expected.total);
      expect(live.filter(e => e.mode === mode)).toHaveLength(expected.total);
      const session = engine.startSession({ courseKey: course, mode, sessionSize: 50 }, true);
      expect(session.totalAvailableCount).toBe(expected.total);
      expect(session.version).toBe(catalog.version);
      expect(session.examples).toHaveLength(Math.min(50, expected.total));
      expect(new Set(session.examples.map(e => e.id)).size).toBe(session.examples.length);
      for (const e of session.examples) expect(isExcludedFromMode(course, mode, e.id)).toBe(false);
      expect(engine.startSession({ courseKey: course, mode, sessionSize: 50 }, false).examples).toEqual(before.startSession({ courseKey: course, mode, sessionSize: 50 }, false).examples);
    }
  });
  it("preserves 129 exclusions and 309A rejection, including unaffected OIT pools", () => {
    expect(sha(historicalExclusionBytes)).toBe("8040a4b366a73d13f44cf29746e9bbedb14eb20304519d1c2e2b6ba04273525b");
    const groups = historicalExclusions.groups;
    expect(groups.flatMap(g => g.ids)).toHaveLength(129);
    for (const group of groups) {
      const live = new Set(pool(engine, group.courseKey).map(e => e.id));
      for (const id of group.ids) { expect(isExcludedFromMode(group.courseKey, group.mode, id)).toBe(true); expect(live.has(id)).toBe(false); }
    }
    for (const course of ["oit", "oit-ww"]) expect(pool(engine, course)).toEqual(pool(before, course));
    expect(() => engine.getCatalog("electrician-309a", true)).toThrow();
    expect(() => engine.startSession({ courseKey: "electrician-309a", mode: "rapid-swipe", sessionSize: 5 }, true)).toThrow();
  });
});
