import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { describe, expect, it } from "vitest";
import { InteractiveContentEngine } from "./loader";
import { committedOverlayDocuments, compileOverlays, type ContentOverlay } from "./overlay";
import { isExcludedFromMode, committedReleaseExclusions } from "./modeFit";
import { batchSha256, verifyReceipt } from "./reviewReceipt";
import { buildOverlay, type CourseData } from "../../../scripts/game-authoring/build";
import { interactiveModes } from "../../../shared/interactiveSessions";
import counts from "../../../docs/claude-11-batches-counts-20261114.json";

const specs = [
  ...[191, 162].map((count, i) => ({ course: "oit", n: i + 14, count })),
  ...[156, 143, 227, 193].map((count, i) => ({ course: "oit-ww", n: i + 9, count })),
  ...[331, 335].map((count, i) => ({ course: "class1-water", n: i + 1, count })),
  ...[348, 387].map((count, i) => ({ course: "class1-ww", n: i + 1, count })),
  { course: "class1-wastewater-coll", n: 1, count: 361 },
];
const ids = specs.map(s => `og-${s.course}-${s.n}`);
const docs = committedOverlayDocuments() as ContentOverlay[];
const released = docs.filter(d => ids.includes(d.overlayId));
const prior = docs.filter(d => !ids.includes(d.overlayId));
const engine = new InteractiveContentEngine();
const before = new InteractiveContentEngine(undefined, prior);
const sha = (bytes: Buffer) => createHash("sha256").update(bytes).digest("hex");
const pool = (e: InteractiveContentEngine, course: string) => {
  const view = e as unknown as { pool(c: string, manifest: unknown): { id: string; mode: string }[]; manifest(c: string): unknown };
  return view.pool(course, view.manifest(course));
};

describe("pinned eleven Claude batches release", () => {
  it("appends exactly 2834 additions without replacing historical overlays", () => {
    expect(released.map(d => d.overlayId)).toEqual(ids);
    expect(docs.slice(0, prior.length)).toEqual(prior);
    expect(prior).toHaveLength(24);
    expect(released.flatMap(d => d.additions)).toHaveLength(2834);
    expect(released.flatMap(d => d.replacements)).toEqual([]);
    expect(() => compileOverlays(docs)).not.toThrow();
  });
  it.each(specs)("binds exact audited $course batch $n and honest receipt metadata", async ({ course, n, count }) => {
    const path = `scripts/game-authoring/data/${course}-batch${n}.ts`;
    const table = (await import(`../../../scripts/game-authoring/data/${course}-batch${n}.ts`)).default as CourseData;
    const built = buildOverlay(table, `og-${course}-${n}`);
    const doc = released.find(d => d.overlayId === built.doc.overlayId)!;
    expect(built.errors).toEqual([]);
    expect(doc.additions).toHaveLength(count);
    expect(batchSha256(doc)).toBe(batchSha256(built.doc));
    expect(doc.format).toBe("interactive-overlay-v2");
    expect(() => verifyReceipt(doc as Parameters<typeof verifyReceipt>[0])).not.toThrow();
    expect(doc.receipt!.declaration.model).toBe("Claude (owner-provided; exact model unspecified)");
    expect(doc.receipt!.declaration.reviewedAt).toBeNull();
    expect(doc.receipt!.declaration.attestation).toContain(counts.source);
    expect(doc.receipt!.declaration.attestation).toContain(sha(readFileSync(path)));
    expect(doc.receipt!.registeredAt).toMatch(/^2026-11-14T/);
    expect(doc.receipt!.builderResults.errors).toEqual([]);
    expect(JSON.parse(readFileSync(`scripts/game-authoring/drafts/${course}-batch-${n}.review.json`, "utf8"))).toEqual(doc.receipt!.declaration);
  });
  for (const course of Object.keys(counts.totals)) it(`${course}: exact current-main delta, IDs and sessions in every mode`, () => {
    const catalog = engine.getCatalog(course, true);
    const oldCatalog = before.getCatalog(course, true);
    expect(catalog.version).not.toBe(oldCatalog.version);
    const oldPool = pool(before, course);
    const currentPool = pool(engine, course);
    const added = released.flatMap(d => d.additions).filter(a => a.courseKey === course);
    expect(added.every(a => !isExcludedFromMode(course, a.example.mode, a.example.id))).toBe(true);
    expect(new Set(currentPool.map(e => e.id))).toEqual(new Set([...oldPool.map(e => e.id), ...added.map(a => a.example.id)]));
    expect(currentPool).toHaveLength(oldPool.length + added.length);
    const oldIds = new Set(oldPool.map(e => e.id));
    expect(currentPool.filter(e => oldIds.has(e.id))).toEqual(oldPool);
    // Compatibility examples remain unchanged; effective cache identity may change.
    expect(engine.getLegacyContent(course, true).examples).toEqual(before.getLegacyContent(course, true).examples);
    for (const mode of interactiveModes) {
      const expected = counts.rows.find(r => r.course === course && r.mode === mode)!;
      expect(oldCatalog.modes.find(m => m.mode === mode)!.totalCount).toBe(expected.baseline);
      expect(catalog.modes.find(m => m.mode === mode)!.totalCount).toBe(expected.total);
      expect(currentPool.filter(e => e.mode === mode)).toHaveLength(expected.total);
      const session = engine.startSession({ courseKey: course, mode, sessionSize: 50 }, true);
      expect(session.totalAvailableCount).toBe(expected.total);
      expect(session.version).toBe(catalog.version);
      expect(session.examples).toHaveLength(Math.min(50, expected.total));
      expect(new Set(session.examples.map(e => e.id)).size).toBe(session.examples.length);
      for (const example of session.examples) expect(isExcludedFromMode(course, mode, example.id)).toBe(false);
      expect(engine.startSession({ courseKey: course, mode, sessionSize: 50 }, false).examples).toEqual(before.startSession({ courseKey: course, mode, sessionSize: 50 }, false).examples);
    }
  });
  it("preserves all 129 exclusions including four spring-box IDs and rejects 309A", () => {
    expect(sha(readFileSync("server/interactiveContent/engine/releaseExclusions.json"))).toBe(counts.exclusions.sha256);
    const groups = committedReleaseExclusions().groups;
    expect(groups.flatMap(g => g.ids)).toHaveLength(129);
    const live = new Set(pool(engine, "oit").map(e => e.id));
    const spring = groups.find(g => g.name === "spring box source classification")!;
    expect(spring.ids).toHaveLength(4);
    for (const group of groups) for (const id of group.ids) {
      expect(isExcludedFromMode(group.courseKey, group.mode, id)).toBe(true);
      expect(live.has(id)).toBe(false);
    }
    expect(() => engine.getCatalog("electrician-309a", true)).toThrow();
    expect(() => engine.startSession({ courseKey: "electrician-309a", mode: "rapid-swipe", sessionSize: 5 }, true)).toThrow();
  });
});
