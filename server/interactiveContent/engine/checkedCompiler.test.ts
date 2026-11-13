import { afterEach, describe, expect, it, vi } from "vitest";
const { approvals } = vi.hoisted(() => ({ approvals: {} as Record<string, { corpusSha256: string; scope: string; inventoryEvidence: string; approvalEvidence: string }> }));
vi.mock("../../../scripts/content-engine/trusted-corpora", () => ({ approvedCorpora: approvals }));
import { mkdtempSync, readFileSync, rmSync, readdirSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { compileCheckedRelease, compilePrivateInput } from "../../../scripts/content-engine/compile-checked";
import { InteractiveContentEngine } from "./loader";
import { interactiveModes, interactiveStartSessionInputSchema } from "../../../shared/interactiveSessions";
import { computeInteractiveArtifactFingerprint } from "../../../scripts/interactiveArtifactFingerprint";
// @ts-expect-error Synthetic JS fixtures only.
import { completeFixture, attachReview, attachPolicyReviews, attachBatchAudit } from "../../../scripts/content-engine/fixtures.mjs";
// @ts-expect-error Offline JS hash helper.
import { hash } from "../../../scripts/content-engine/identity.mjs";
// @ts-expect-error Pinned legacy inventory helper.
import { readRelease } from "../../../scripts/content-engine/inventory.mjs";

const roots: string[] = [];
function root() { const r = mkdtempSync(join(tmpdir(), "checked-compiler-test-")); roots.push(r); return r; }
function request(doc: any, selected = doc.exercises.map((e: any) => ({ courseKey: e.courseKey, exerciseId: e.exerciseId }))) {
  approvals.fixture = { corpusSha256: hash(doc), scope: "synthetic full corpus", inventoryEvidence: "fixture inventory", approvalEvidence: "fixture approval" };
  return { approvalId: "fixture", corpus: doc, selected };
}
function checked() { const doc = completeFixture(); attachReview(doc, "human-technical"); attachReview(doc, "software-release"); return doc; }
afterEach(() => { delete approvals.fixture; for (const r of roots.splice(0)) rmSync(r, { recursive: true, force: true }); });

describe("private checked authoring compiler", () => {
  it("distinguishes different synthetic checked runtime content built from the same source", () => {
    const doc = checked();
    const first = root();
    const repeat = root();
    compileCheckedRelease(request(doc), first);
    compileCheckedRelease(request(doc), repeat);
    const before = computeInteractiveArtifactFingerprint(first);
    expect(computeInteractiveArtifactFingerprint(repeat)).toBe(before);
    const changed = checked();
    changed.exercises[0].item.prompt += " A synthetic variation.";
    changed.exercises[0].contentHash = hash(changed.exercises[0].item);
    changed.exercises[0].reviews = [];
    attachReview(changed, "human-technical"); attachReview(changed, "software-release");
    const second = root();
    compileCheckedRelease(request(changed), second);
    expect(computeInteractiveArtifactFingerprint(second)).not.toBe(before);
    expect(new InteractiveContentEngine(first).getCatalog("class1-water", false).version).toBe("checked-v1");
    expect(new InteractiveContentEngine(second).getCatalog("class1-water", false).version).toBe("checked-v1");
  });
  it("fails closed without separately pinned prior full-corpus evidence", () => {
    const doc = checked(); const out = root();
    expect(() => compileCheckedRelease({ approvalId: "missing", corpus: doc, selected: [{ courseKey: doc.exercises[0].courseKey, exerciseId: doc.exercises[0].exerciseId }] }, out)).toThrow("prior full-corpus approval");
    expect(readdirSync(out)).toEqual([]);
  });
  it("uses the pinned complete corpus for quarantine even when selecting one item", () => {
    const doc = checked(); const duplicate = structuredClone(doc.exercises[0]);
    duplicate.exerciseId = "hidden-duplicate"; duplicate.item.id = duplicate.exerciseId;
    doc.exercises.push(duplicate);
    const selection = [{ courseKey: doc.exercises[0].courseKey, exerciseId: doc.exercises[0].exerciseId }];
    const full = request(doc, selection); const out = root();
    expect(() => compileCheckedRelease(full, out)).toThrow("quarantined");
    const trimmed = { ...full, corpus: { ...doc, exercises: [doc.exercises[0]] } };
    expect(() => compileCheckedRelease(trimmed, out)).toThrow("prior full-corpus approval");
    expect(readdirSync(out)).toEqual([]);
  });
  it("permits selecting only eligible records while retaining unrelated corpus records for checks", () => {
    const doc = checked(); const other = structuredClone(doc.exercises[0]);
    other.exerciseId = "unselected"; other.item.id = other.exerciseId;
    other.item.prompt = "A different synthetic concept."; other.contentHash = hash(other.item);
    other.variantFamilyId = "unselected-family"; doc.exercises.push(other);
    const out = root();
    expect(compileCheckedRelease(request(doc, [{ courseKey: doc.exercises[0].courseKey, exerciseId: doc.exercises[0].exerciseId }]), out).newItemCount).toBe(1);
  });
  it("refuses absolute and escaping private input names without output", () => {
    const out = root();
    for (const name of ["/tmp/fixture.json", "../fixture.json", "../../client/x.json"]) {
      expect(() => compilePrivateInput(name, out)).toThrow();
    }
    expect(readdirSync(out)).toEqual([]);
  });
  it("serves an approved synthetic record only in paid indexed sessions and preserves all fixed previews and legacy compatibility", () => {
    const doc = checked(); const out = root();
    expect(compileCheckedRelease(request(doc), out)).toMatchObject({ courseCount: 38, itemCount: 3821, newItemCount: 1 });
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
    for (const access of [false, true]) {
      const catalog = engine.getCatalog("class1-water", access);
      const session = engine.startSession(input, access);
      expect(catalog.version).toBe("checked-v1");
      expect(session.version).toBe("checked-v1");
      expect(JSON.stringify([catalog, session])).not.toContain(manifest.version);
    }
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
    expect(compileCheckedRelease(request(doc), out).newItemCount).toBe(1);
    doc.batchAudits[0].status = "rejected";
    const rejected = root();
    expect(() => compileCheckedRelease(request(doc), rejected)).toThrow();
    expect(readdirSync(rejected)).toEqual([]);
  });
  it("rejects a new record duplicating frozen legacy scientific content even with a different id", () => {
    const doc = completeFixture(); const e = doc.exercises[0];
    const pkg = readRelease(process.cwd()).packages.find((p: any) => p.courseKey === "class1-water");
    e.item = { ...pkg.examples.find((x: any) => x.mode === "rapid-swipe"), id: "different-id" };
    e.exerciseId = e.item.id; e.contentHash = hash(e.item);
    attachReview(doc, "human-technical"); attachReview(doc, "software-release");
    const out = root();
    expect(() => compileCheckedRelease(request(doc), out)).toThrow();
    expect(readdirSync(out)).toEqual([]);
  });
  it.each(["per-item", "risk-based"])("rejects legal language in instruction under %s review", kind => {
    const doc = completeFixture(); const e = doc.exercises[0];
    e.item.instruction = "OSHA regulation requires a permit."; e.contentHash = hash(e.item);
    if (kind === "per-item") { attachReview(doc, "human-technical"); attachReview(doc, "software-release"); }
    else { attachPolicyReviews(doc); attachBatchAudit(doc); }
    const out = root();
    expect(() => compileCheckedRelease(request(doc), out)).toThrow("checked new release candidate");
    expect(readdirSync(out)).toEqual([]);
  });
  it("rejects approval evidence omissions, stale pinned records and unknown or repeated selection", () => {
    const doc = checked(); const input = request(doc); const out = root();
    approvals.fixture.inventoryEvidence = "";
    expect(() => compileCheckedRelease(input, out)).toThrow("prior full-corpus approval");
    request(doc); doc.notice += " changed";
    expect(() => compileCheckedRelease(input, out)).toThrow("prior full-corpus approval");
    const fresh = request(doc);
    expect(() => compileCheckedRelease({ ...fresh, selected: [...fresh.selected, ...fresh.selected] }, out)).toThrow("Duplicate selection");
    expect(() => compileCheckedRelease({ ...fresh, selected: [{ courseKey: "class1-water", exerciseId: "missing" }] }, out)).toThrow("Selection missing");
    expect(readdirSync(out)).toEqual([]);
  });
  it("does not override a manual legal exclusion with new approvals", () => {
    const doc = completeFixture(); const e = doc.exercises[0];
    e.item.id = "wqa-087"; e.exerciseId = e.item.id; e.contentHash = hash(e.item);
    attachReview(doc, "human-technical"); attachReview(doc, "software-release");
    const out = root();
    expect(() => compileCheckedRelease(request(doc), out)).toThrow();
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
    expect(() => compileCheckedRelease(request(doc), out)).toThrow();
    expect(readdirSync(out)).toEqual([]);
  });
});
