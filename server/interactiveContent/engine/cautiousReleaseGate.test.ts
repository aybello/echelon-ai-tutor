import { syntheticReceipt } from "./reviewTestFixtures";
import { readFileSync, rmSync } from "node:fs";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { InteractiveContentEngine } from "./loader";
import { committedReleaseExclusions, isExcludedFromMode } from "./modeFit";
import { committedOverlayDocuments, type ContentOverlay } from "./overlay";
import { fixture, syntheticExample } from "./testFixtures";
import { interactiveModes } from "../../../shared/interactiveSessions";
const roots: string[] = [];
afterEach(() => { for (const root of roots.splice(0)) rmSync(root, { recursive: true, force: true }); });
const review = { verdict: "approved" as const, reviewer: "Synthetic fixture", reviewAuthority: "owner-authorized-ai-review" as const, reviewedAt: "2026-11-13T00:00:00Z", notes: "Test metadata, not a receipt" };
function setup() {
  const f = fixture({ perMode: 3 }); roots.push(f.root);
  const manifest = JSON.parse(readFileSync(join(f.root, "class1-water/manifest.json"), "utf8"));
  const preview = manifest.entries.find((entry: any) => entry.id === f.legacy.previewIds["rapid-swipe"]);
  const doc: ContentOverlay = {
    format: "interactive-overlay-v1", overlayId: "test-revisions", scope: "Test only",
    additions: [{ courseKey: "class1-water", topicId: "unclassified", difficulty: "unclassified", example: syntheticExample("rapid-swipe", "test-addition"), review }],
    replacements: [{ courseKey: "class1-water", replacesId: preview.id, replacesSha256: preview.sha256, topicId: "unclassified", difficulty: "unclassified", example: syntheticExample("rapid-swipe", "test-revision"), reason: "Correction", review }],
  };
  return { ...f, doc: syntheticReceipt(doc) };
}
describe("selective release effective view", () => {
  it("applies the same exact-bound revision to sessions, fixed previews and legacy without adding content to compatibility", () => {
    const { root, doc, legacy } = setup();
    const engine = new InteractiveContentEngine(root, [syntheticReceipt(doc)]);
    const input = { courseKey: "class1-water", mode: "rapid-swipe" as const, sessionSize: 50 };
    expect(engine.startSession(input, false).examples).toEqual([doc.replacements[0].example]);
    const session = engine.startSession(input, true);
    expect(session.totalAvailableCount).toBe(4);
    expect(new Set(session.examples.map(e => e.id))).toEqual(new Set(["test-revision", "test-addition", "synthetic-rapid-swipe-1", "synthetic-rapid-swipe-2"]));
    expect(engine.getCatalog(input.courseKey, true).modes.find(m => m.mode === input.mode)?.totalCount).toBe(4);
    const bytes = readFileSync(join(root, "class1-water/legacy.json"));
    for (const access of [false, true]) {
      const result = engine.getLegacyContent(input.courseKey, access);
      expect(result.examples.find(e => e.mode === input.mode)).toEqual(doc.replacements[0].example);
      expect(result.examples.some(e => e.id === "test-addition" || e.id === legacy.previewIds[input.mode])).toBe(false);
    }
    expect(readFileSync(join(root, "class1-water/legacy.json"))).toEqual(bytes);
  });
  it("refuses stale target hashes on all delivery paths instead of falling back", () => {
    const { root, doc } = setup(); doc.replacements[0].replacesSha256 = "0".repeat(64);
    const engine = new InteractiveContentEngine(root, [syntheticReceipt(doc)]);
    for (const access of [false, true]) {
      expect(() => engine.getCatalog("class1-water", access)).toThrow();
      expect(() => engine.startSession({ courseKey: "class1-water", mode: "rapid-swipe", sessionSize: 5 }, access)).toThrow();
      expect(() => engine.getLegacyContent("class1-water", access)).toThrow();
    }
  });
  it("rejects cross-course targets even when their hashes are unchanged", () => {
    const { root, doc } = setup(); doc.replacements[0].courseKey = "class2-water";
    const engine = new InteractiveContentEngine(root, [syntheticReceipt(doc)]);
    expect(() => engine.getLegacyContent("class2-water", true)).toThrow();
  });
  it("excludes only documented exact IDs and keeps the reviewed confined-space correction", () => {
    const docs = committedOverlayDocuments() as ContentOverlay[];
    const all = docs.flatMap(d => d.additions).filter(a => a.courseKey === "oit" && a.example.id.startsWith("og-oit-"));
    const groups = committedReleaseExclusions().groups;
    const ids = groups.flatMap(g => g.ids);
    expect(ids).toHaveLength(125);
    expect(new Set(ids).size).toBe(ids.length);
    for (const group of groups) for (const id of group.ids) {
      const item = all.find(a => a.example.id === id);
      expect(item, id).toBeDefined();
      expect(item!.example.mode).toBe(group.mode);
      expect(isExcludedFromMode(group.courseKey, group.mode, id)).toBe(true);
      expect(isExcludedFromMode("oit-ww", group.mode, id)).toBe(false);
    }
    const engine = new InteractiveContentEngine();
    const view = engine as unknown as { manifest(key: string): any; pool(key: string, manifest: any): { id: string }[] };
    const poolIds = new Set(view.pool("oit", view.manifest("oit")).map(e => e.id));
    for (const id of ids) expect(poolIds.has(id), id).toBe(false);
    expect(all.filter(a => poolIds.has(a.example.id))).toHaveLength(715);
    expect(poolIds.has("og-oit-b2-before-after-0134")).toBe(true);
    for (const access of [false, true]) for (const mode of interactiveModes) {
      const result = engine.startSession({ courseKey: "oit", mode, sessionSize: 50 }, access);
      for (const e of result.examples) expect(isExcludedFromMode("oit", mode, e.id), e.id).toBe(false);
      expect(result.totalAvailableCount).toBe(access ? engine.getCatalog("oit", access).modes.find(m => m.mode === mode)!.totalCount : result.examples.length);
    }
  });
  it("keeps all 124 reviewed corrections effective and out of original fallback paths", () => {
    const engine = new InteractiveContentEngine();
    const view = engine as unknown as { manifest(key: string): any; pool(key: string, manifest: any): { id: string; overlay?: { example: unknown } }[] };
    const replacements = (committedOverlayDocuments() as ContentOverlay[]).flatMap(doc => doc.replacements);
    expect(replacements).toHaveLength(124);
    for (const courseKey of new Set(replacements.map(r => r.courseKey))) {
      const pool = view.pool(courseKey, view.manifest(courseKey));
      const legacy = engine.getLegacyContent(courseKey, true);
      for (const replacement of replacements.filter(r => r.courseKey === courseKey)) {
        expect(pool.some(e => e.id === replacement.replacesId), replacement.replacesId).toBe(false);
        expect(pool.find(e => e.id === replacement.example.id)?.overlay?.example).toEqual(replacement.example);
        expect(legacy.examples.some(e => e.id === replacement.replacesId)).toBe(false);
        expect(legacy.examples.find(e => e.id === replacement.example.id)).toEqual(replacement.example);
      }
    }
  });
  it("serves the corrected wet-well explanation through real session and compatibility paths", () => {
    const engine = new InteractiveContentEngine();
    const courseKey = "class1-wastewater-coll";
    const correction = engine.getLegacyContent(courseKey, true).examples.find(e => e.id === "class1-wastewater-coll-045-r1")!;
    expect(correction.explanation).toMatch(/liquid level, pump status and alarm condition.*street tree species does not/i);
    const examples = engine.startSession({ courseKey, mode: "odd-one-out", sessionSize: 50 }, true).examples;
    expect(examples.find(e => e.id === correction.id)).toEqual(correction);
    expect(examples.some(e => e.id === "class1-wastewater-coll-045")).toBe(false);
  });
});
