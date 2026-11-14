import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { describe, expect, it } from "vitest";
import { InteractiveContentEngine } from "./loader";
import { committedOverlayDocuments, compileOverlays, type ContentOverlay } from "./overlay";
import { batchSha256, verifyReceipt } from "./reviewReceipt";
import { buildOverlay, type CourseData } from "../../../scripts/game-authoring/build";
import { interactiveModes } from "../../../shared/interactiveSessions";

const specs = [
  ...[161, 150, 142, 210, 234, 242, 259, 226].map((count, i) => ({ course: "oit", n: i + 6, count })),
  ...[158, 138, 151, 152, 218, 224, 229, 219].map((count, i) => ({ course: "oit-ww", n: i + 1, count })),
];
const ids = specs.map(s => `og-${s.course}-${s.n}`);
const docs = committedOverlayDocuments() as ContentOverlay[];
const prior = docs.filter(d => !ids.includes(d.overlayId));
const released = docs.filter(d => ids.includes(d.overlayId));
const engine = new InteractiveContentEngine();
const before = new InteractiveContentEngine(undefined, prior);
const sha = (bytes: Buffer) => createHash("sha256").update(bytes).digest("hex");

describe("pinned sixteen Claude batches release", () => {
  it("registers exactly 3113 additions in normal order, preserving the earlier overlays", () => {
    expect(released.map(d => d.overlayId)).toEqual(ids);
    expect(docs.slice(0, prior.length)).toEqual(prior);
    expect(prior.map(d => d.overlayId)).toEqual(["rapid-swipe-balance-20261114", "option-length-class2-ww-20261114", "option-length-batch-2-20261114", "og-oit-1", "og-oit-2", "og-oit-3", "og-oit-4", "og-oit-5"]);
    expect(released.reduce((n, d) => n + d.additions.length, 0)).toBe(3113);
    expect(released.flatMap(d => d.replacements)).toEqual([]);
    expect(() => compileOverlays(docs)).not.toThrow();
  });
  it.each(specs)("binds exact $course batch $n source identity and honest receipt metadata", async ({ course, n, count }) => {
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
    expect(doc.receipt!.registeredAt).toMatch(/^2026-11-14T/);
    expect(doc.receipt!.builderResults.errors).toEqual([]);
    const declaration = JSON.parse(readFileSync(`scripts/game-authoring/drafts/${course}-batch-${n}.review.json`, "utf8"));
    expect(declaration).toEqual(doc.receipt!.declaration);
    const pool = (engine as any).pool(course, (engine as any).manifest(course)) as { id: string }[];
    const poolIds = new Set(pool.map(e => e.id));
    for (const a of doc.additions) expect(poolIds.has(a.example.id), a.example.id).toBe(true);
  });
  for (const course of ["oit", "oit-ww"]) it(`${course}: exact catalog and session delta in every mode, no legacy changes`, () => {
    const catalog = engine.getCatalog(course, true);
    const old = before.getCatalog(course, true);
    expect(catalog.version).not.toBe(old.version);
    for (const mode of interactiveModes) {
      const added = released.flatMap(d => d.additions).filter(a => a.courseKey === course && a.example.mode === mode).length;
      const total = catalog.modes.find(m => m.mode === mode)!.totalCount;
      expect(total).toBe(old.modes.find(m => m.mode === mode)!.totalCount + added);
      const session = engine.startSession({ courseKey: course, mode, sessionSize: 50 }, true);
      expect(session.totalAvailableCount).toBe(total);
      expect(session.version).toBe(catalog.version);
      expect(session.examples).toHaveLength(Math.min(50, total));
      expect(new Set(session.examples.map(e => e.id)).size).toBe(session.examples.length);
    }
    const pool = (engine as any).pool(course, (engine as any).manifest(course)) as { id: string }[];
    const earlier = (before as any).pool(course, (before as any).manifest(course)) as { id: string }[];
    const oldIds = new Set(earlier.map(e => e.id));
    expect(pool.filter(e => oldIds.has(e.id))).toEqual(earlier);
    expect(engine.getLegacyContent(course, true)).toEqual(before.getLegacyContent(course, true));
  });
  it("preserves the exact 125 exclusions and rejects 309A", () => {
    expect(sha(readFileSync("server/interactiveContent/engine/releaseExclusions.json"))).toBe("d1feb9454ed4324c516abf8ec0900cbccecf29397adfc27a72e499895fa9b5f5");
    expect(() => engine.getCatalog("electrician-309a", true)).toThrow();
    expect(() => engine.startSession({ courseKey: "electrician-309a", mode: "rapid-swipe", sessionSize: 5 }, true)).toThrow();
  });
});
