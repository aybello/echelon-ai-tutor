import { afterEach, describe, expect, it } from "vitest";
import { mkdtempSync, readFileSync, rmSync, readdirSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { compileCheckedRelease, compilePrivateInput } from "../../../scripts/content-engine/compile-checked";
import { InteractiveContentEngine } from "./loader";
import { interactiveModes, interactiveStartSessionInputSchema } from "../../../shared/interactiveSessions";
// @ts-expect-error Synthetic JS fixtures only.
import { completeFixture, attachReview, attachPolicyReviews, attachBatchAudit } from "../../../scripts/content-engine/fixtures.mjs";
// @ts-expect-error Offline JS hash helper.
import { hash } from "../../../scripts/content-engine/identity.mjs";
// @ts-expect-error Pinned legacy inventory helper.
import { readRelease } from "../../../scripts/content-engine/inventory.mjs";

const roots: string[] = [];
function root() { const r = mkdtempSync(join(tmpdir(), "checked-compiler-test-")); roots.push(r); return r; }
function checked() { const doc = completeFixture(); attachReview(doc, "human-technical"); attachReview(doc, "software-release"); return doc; }
afterEach(() => { for (const r of roots.splice(0)) rmSync(r, { recursive: true, force: true }); });

describe("private checked authoring compiler", () => {
  it("refuses absolute and escaping private input names without output", () => {
    const out = root();
    for (const name of ["/tmp/fixture.json", "../fixture.json", "../../client/x.json"]) {
      expect(() => compilePrivateInput(name, out)).toThrow();
    }
    expect(readdirSync(out)).toEqual([]);
  });
  it("serves an approved synthetic record only in paid indexed sessions and preserves all fixed previews and legacy compatibility", () => {
    const doc = checked(); const out = root();
    expect(compileCheckedRelease(doc, out)).toMatchObject({ courseCount: 38, itemCount: 3821, newItemCount: 1 });
    const engine = new InteractiveContentEngine(out);
    const legacy = engine.getLegacyContent("class1-water", true);
    const freeLegacy = engine.getLegacyContent("class1-water", false);
    for (const mode of interactiveModes) {
      const input = interactiveStartSessionInputSchema.parse({ courseKey: "class1-water", mode, sessionSize: 50 });
      const free = engine.startSession(input, false);
      expect(free.examples).toHaveLength(1);
      expect(freeLegacy.examples).toContainEqual(free.examples[0]);
      expect(legacy.examples).toContainEqual(free.examples[0]);
    }
    const input = interactiveStartSessionInputSchema.parse({ courseKey: "class1-water", mode: "rapid-swipe", difficulty: "easy", sessionSize: 50 });
    const paid = engine.startSession(input, true);
    expect(paid.examples).toEqual([doc.exercises[0].item]);
    expect(legacy.examples.some(e => e.id === doc.exercises[0].item.id)).toBe(false);
    expect(() => engine.getCatalog("electrician-309a", true)).toThrow();
    const manifest = JSON.parse(readFileSync(join(out, "class1-water/manifest.json"), "utf8"));
    expect(manifest.classification).toBe("legacy_plus_checked");
    expect(manifest.version).toMatch(/^checked-/);
    const files = readdirSync(join(out, "class1-water"));
    const serialized = files.map(f => readFileSync(join(out, "class1-water", f), "utf8")).join("\n");
    expect(serialized).not.toContain("Synthetic publisher");
    expect(serialized).not.toContain("Synthetic fact.");
    expect(serialized).not.toContain("fixture authority declaration");
    expect(JSON.stringify(engine.getCatalog("class1-water", true))).not.toMatch(/correctAnswer|explanation/);
  });
  it("honors the existing opt-in audited policy and refuses an invalidated batch", () => {
    const doc = completeFixture(); attachPolicyReviews(doc); attachBatchAudit(doc);
    const out = root();
    expect(compileCheckedRelease(doc, out).newItemCount).toBe(1);
    doc.batchAudits[0].status = "rejected";
    const rejected = root();
    expect(() => compileCheckedRelease(doc, rejected)).toThrow();
    expect(readdirSync(rejected)).toEqual([]);
  });
  it("rejects a new record duplicating frozen legacy scientific content even with a different id", () => {
    const doc = completeFixture(); const e = doc.exercises[0];
    const pkg = readRelease(process.cwd()).packages.find((p: any) => p.courseKey === "class1-water");
    e.item = { ...pkg.examples.find((x: any) => x.mode === "rapid-swipe"), id: "different-id" };
    e.exerciseId = e.item.id; e.contentHash = hash(e.item);
    attachReview(doc, "human-technical"); attachReview(doc, "software-release");
    const out = root();
    expect(() => compileCheckedRelease(doc, out)).toThrow();
    expect(readdirSync(out)).toEqual([]);
  });
  it("does not override a manual legal exclusion with new approvals", () => {
    const doc = completeFixture(); const e = doc.exercises[0];
    e.item.id = "wqa-087"; e.exerciseId = e.item.id; e.contentHash = hash(e.item);
    attachReview(doc, "human-technical"); attachReview(doc, "software-release");
    const out = root();
    expect(() => compileCheckedRelease(doc, out)).toThrow();
    expect(readdirSync(out)).toEqual([]);
  });
  it.each(["missing human", "missing software", "stale", "rejected", "rights", "legacy", "id mismatch", "309a", "duplicate", "legal"]) ("refuses %s before writing artifacts", kind => {
    const doc = checked(); const e = doc.exercises[0];
    if (kind === "missing human") e.reviews = e.reviews.filter((r: any) => r.kind !== "human-technical");
    if (kind === "missing software") e.reviews = e.reviews.filter((r: any) => r.kind !== "software-release");
    if (kind === "stale") { e.item.prompt += " changed"; e.contentHash = hash(e.item); }
    if (kind === "rejected") e.reviews[0].status = "rejected";
    if (kind === "rights") doc.sources[0].permittedUsage = [];
    if (kind === "legacy") e.legacy = { packageVersion: "old", packageHash: hash("old"), softwareStatus: "approved", aiReviewDeclared: true, notice: "old", provenanceRefs: [] };
    if (kind === "id mismatch") e.exerciseId = "other";
    if (kind === "309a") e.courseKey = "electrician-309a";
    if (kind === "duplicate") doc.exercises.push(structuredClone(e));
    if (kind === "legal") { e.claimType = "statutory"; e.authorityEvidence = []; }
    const out = root();
    expect(() => compileCheckedRelease(doc, out)).toThrow();
    expect(readdirSync(out)).toEqual([]);
  });
});
