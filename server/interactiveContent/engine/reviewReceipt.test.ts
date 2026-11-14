import { readFileSync, mkdtempSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { createHash } from "node:crypto";
import { compileOverlays, committedOverlayDocuments, type ContentOverlay } from "./overlay";
import { batchSha256, educationalSha256, canonicalSha256 } from "./reviewReceipt";
import { InteractiveContentEngine } from "./loader";
import { buildOverlay, registerReviewedOverlay, assertDestination, validate } from "../../../scripts/game-authoring/build";
import data from "../../../scripts/game-authoring/data/oit-batch5";
const docs = committedOverlayDocuments() as ContentOverlay[];
const batch = docs.find(d => d.overlayId === "og-oit-5")!;
const clone = () => structuredClone(batch) as any;

describe("owner-authorized exact payload receipts", () => {
  it.each([
    ["missing receipt", (d: any) => { delete d.receipt; }],
    ["missing item review", (d: any) => { delete d.additions[0].review; }],
    ["prompt", (d: any) => { d.additions[0].example.prompt += " Changed"; }],
    ["key", (d: any) => { d.additions[0].example.correctAnswer = false; }],
    ["explanation", (d: any) => { d.additions[0].example.explanation += " Changed"; }],
    ["course", (d: any) => { d.additions[0].courseKey = "class1-water"; }],
    ["difficulty", (d: any) => { d.additions[0].difficulty = "hard"; }],
    ["date", (d: any) => { d.additions[0].review.reviewedAt = "2026-11-13T00:00:00Z"; }],
    ["invalid date", (d: any) => { d.receipt.declaration.reviewedAt = "yesterday"; }],
    ["model", (d: any) => { d.additions[0].review.model = "Invented"; }],
    ["authority", (d: any) => { d.additions[0].review.reviewAuthority = "validation"; }],
    ["check failure", (d: any) => { d.receipt.builderResults.errors = ["failed"]; }],
    ["stale check results", (d: any) => { d.receipt.builderResults.stats.options++; }],
    ["duplicate IDs", (d: any) => { d.additions[1].example.id = d.additions[0].example.id; }],
    ["missing declaration item", (d: any) => { delete d.receipt.declaration.payloadSha256[d.additions[0].example.id]; }],
    ["new v1 bypass", (d: any) => { d.format = "interactive-overlay-v1"; delete d.receipt; for (const e of d.additions) { e.review = docs[0].additions[0].review; } }],
  ] as const)("fails closed on %s", (_name, mutate) => {
    const doc = clone(); mutate(doc);
    expect(() => new InteractiveContentEngine(undefined, [doc])).toThrow();
  });
  it("pins historical compatibility and rejects altered historical documents", () => {
    expect(() => compileOverlays(docs)).not.toThrow();
    const old = structuredClone(docs[3]); old.additions[0].example.prompt += " changed";
    expect(() => compileOverlays([old])).toThrow(/historical/);
  });
  it("canonicalizes nested keys but includes full educational identity and replacement target", () => {
    const a = batch.additions[0];
    const reordered = JSON.parse(JSON.stringify(a, (_k, v) => v && typeof v === "object" && !Array.isArray(v) ? Object.fromEntries(Object.entries(v).reverse()) : v));
    expect(educationalSha256(reordered)).toBe(educationalSha256(a));
    const replacement = docs.flatMap(d => d.replacements)[0];
    expect(educationalSha256({ ...replacement, replacesId: "changed-target" })).not.toBe(educationalSha256(replacement));
    expect(educationalSha256({ ...a, review: undefined } as any)).toBe(educationalSha256(a));
  });
  it("binds all 165 unchanged attested educational payloads, actual checks and honest metadata", () => {
    const draft = JSON.parse(readFileSync("scripts/game-authoring/drafts/oit-batch-5.draft.json", "utf8"));
    const built = buildOverlay(data, "og-oit-5");
    expect(built.errors).toEqual([]); expect(batch.additions).toHaveLength(165);
    expect(batchSha256(batch)).toBe(batchSha256(draft)); expect(batchSha256(batch)).toBe(batchSha256(built.doc));
    expect(batch.receipt!.declaration.model).toBe("Claude (owner-provided; exact model unspecified)");
    expect(batch.receipt!.declaration.reviewedAt).toBeNull(); expect(batch.receipt!.registeredAt).toMatch(/^2026-/);
    expect(batch.receipt!.builderResults.errors).toEqual([]);
    const result = validate(built.doc, []);
    expect(result.errors).toEqual([]); expect(result.stats).toEqual(batch.receipt!.builderResults.stats);
    expect(() => registerReviewedOverlay(built.doc, batch.receipt!.declaration, { ...result, errors: ["duplicate"] })).toThrow(/checks failed/);
    built.doc.additions[0].example.prompt += " changed";
    expect(() => registerReviewedOverlay(built.doc, batch.receipt!.declaration, result)).toThrow(/exact payload/);
  });
  it("preserves historical exclusions and makes every batch-5 ID available without 309A", () => {
    const exclusions = JSON.parse(readFileSync("server/interactiveContent/engine/releaseExclusions.json", "utf8"));
    const bytes = JSON.stringify({ ...exclusions, groups: exclusions.groups.slice(0, -1) }, null, 2) + "\n";
    expect(createHash("sha256").update(bytes).digest("hex")).toBe("d1feb9454ed4324c516abf8ec0900cbccecf29397adfc27a72e499895fa9b5f5");
    const engine = new InteractiveContentEngine() as any;
    const pool = engine.pool("oit", engine.manifest("oit")); const ids = new Set(pool.map((e: any) => e.id));
    expect(batch.additions.filter(a => ids.has(a.example.id))).toHaveLength(165);
    expect(batch.additions.every(a => a.courseKey === "oit")).toBe(true);
    expect(() => engine.getCatalog("electrician-309a", true)).toThrow();
  });
  it("protects committed IDs and changed destinations, allowing only identical bytes", () => {
    const dir = mkdtempSync(join(tmpdir(), "receipt-destination-"));
    try {
      const out = join(dir, "overlay.json"), bytes = JSON.stringify(batch);
      writeFileSync(out, bytes); expect(() => assertDestination(out, batch, bytes)).not.toThrow();
      expect(() => assertDestination(out, batch, bytes + "\n")).toThrow(/destination/);
      const changed = clone(); changed.scope += " changed";
      expect(() => assertDestination(join(dir, "new.json"), changed, JSON.stringify(changed))).toThrow(/committed overlay ID/);
    } finally { rmSync(dir, { recursive: true, force: true }); }
  });
});
