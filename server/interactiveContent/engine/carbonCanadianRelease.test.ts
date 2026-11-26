import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { describe, expect, it } from "vitest";
import { InteractiveContentEngine } from "./loader";
import { committedOverlayDocuments, compileOverlays, type ContentOverlay } from "./overlay";
import { verifyReceipt } from "./reviewReceipt";
import { getCourseByKey } from "../../../shared/courseRegistry";
import { interactiveModes } from "../../../shared/interactiveSessions";

const ids = ["target-class1-water-r01", "target-wqa-r01", "target-wpi-class2-water-coll-r01", "target-class2-water-r01"];
const docs = committedOverlayDocuments() as ContentOverlay[];
const end = docs.findIndex(d => d.overlayId === ids.at(-1)) + 1;
const historical = docs.slice(0, end);
const released = historical.filter(d => ids.includes(d.overlayId));
const prior = historical.filter(d => !ids.includes(d.overlayId));
const engine = new InteractiveContentEngine(undefined, historical);
const before = new InteractiveContentEngine(undefined, prior);

describe("pinned Carbon Canadian additions", () => {
  it("registers the exact additive batches with genuine exact-payload receipts", () => {
    expect(released.map(d => d.overlayId)).toEqual(ids);
    expect(released.map(d => d.additions.length)).toEqual([9, 56, 44, 67]);
    expect(released.flatMap(d => d.replacements)).toEqual([]);
    expect(() => compileOverlays(historical)).not.toThrow();
    for (const doc of released) {
      expect(doc.format).toBe("interactive-overlay-v2");
      expect(() => verifyReceipt(doc as Parameters<typeof verifyReceipt>[0])).not.toThrow();
      expect(doc.receipt!.declaration.model).toBe("gemini-4-carbon");
      expect(doc.receipt!.declaration.reviewedAt).toMatch(/^2026-11-19T/);
      expect(doc.receipt!.declaration.reviewAuthority).toBe("owner-authorized-ai-review");
      expect(doc.receipt!.builderResults.errors).toEqual([]);
      for (const a of doc.additions) expect(["ontario", "western"]).toContain(getCourseByKey(a.courseKey)!.examFamily);
    }
  });
  it.each(["class1-water", "wqa", "wpi-class2-water-coll", "class2-water"])("adds only the reviewed playable deltas for %s, preserving original examples", courseKey => {
    const catalog = engine.getCatalog(courseKey, true);
    const old = before.getCatalog(courseKey, true);
    const manifest = (engine as any).manifest(courseKey);
    const additions = released.flatMap(d => d.additions).filter(a => a.courseKey === courseKey);
    const known = engine.knownItems(courseKey);
    const pool = (engine as any).pool(courseKey, manifest);
    for (const a of additions) {
      expect(known.has(a.example.id)).toBe(true);
      expect(pool.find((e: any) => e.id === a.example.id).overlay.example).toEqual(a.example);
      const session = engine.startSession({ courseKey, mode: a.example.mode, sessionSize: 5 }, true, [a.example.id]);
      expect(session.examples[0].id).toBe(a.example.id);
    }
    for (const mode of interactiveModes) {
      const added = additions.filter(a => a.example.mode === mode).length;
      const count = catalog.modes.find(m => m.mode === mode)!.totalCount;
      expect(count).toBe(old.modes.find(m => m.mode === mode)!.totalCount + added);
      const session = engine.startSession({ courseKey, mode, sessionSize: 5 }, true);
      expect(session.totalAvailableCount).toBe(count);
      expect(session.examples).toHaveLength(Math.min(5, count));
      expect(new Set(session.examples.map(e => e.id)).size).toBe(session.examples.length);
    }
    const previous = (before as any).pool(courseKey, (before as any).manifest(courseKey));
    const current = (engine as any).pool(courseKey, manifest);
    const priorIds = new Set(previous.map((e: any) => e.id));
    expect(current.filter((e: any) => priorIds.has(e.id))).toEqual(previous);
  });
  it("preserves safety exclusions and 309A ineligibility", () => {
    const bytes = readFileSync("server/interactiveContent/engine/releaseExclusions.json");
    expect(createHash("sha256").update(bytes).digest("hex")).toBe("bf81d71ab4e0d7fc49ecb79e200276d21bc782b522ad089e3f583a1559642e23");
    expect(() => engine.getCatalog("electrician-309a", true)).toThrow();
  });
});
