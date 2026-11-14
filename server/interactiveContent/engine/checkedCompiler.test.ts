import { afterEach, describe, expect, it, vi } from "vitest";
import { presentCauseEffect } from "./modeFit";
const { approvals, pins } = vi.hoisted(() => ({ approvals: {} as Record<string, any>, pins: {} as Record<string, any> }));
vi.mock("../../../scripts/content-engine/trusted-corpora", async (original) => {
  const actual = await original<typeof import("../../../scripts/content-engine/trusted-corpora")>();
  return { ...actual, approvedCorpora: approvals, trustedApproval: (id: string) => actual.validateTrustedApproval(id, approvals), activeCheckedRelease: (key: string) => {
    const pin = pins[key];
    if (pin && (!actual.validateTrustedApproval(pin.approvalId, approvals) || !/^[a-f0-9]{64}$/.test(pin.manifestSha256))) throw new Error("Invalid active checked release binding");
    return pin;
  } };
});
import { mkdtempSync, readFileSync, writeFileSync, rmSync, readdirSync } from "node:fs";
import { randomUUID, createHash } from "node:crypto";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { compileCheckedRelease, compilePrivateInput } from "../../../scripts/content-engine/compile-checked";
import { InteractiveContentEngine } from "./loader";
import { interactiveModes, interactiveDrillExampleSchema, interactiveStartSessionInputSchema } from "../../../shared/interactiveSessions";
import { canonicalJson, digest } from "./compiler";
import { computeInteractiveArtifactFingerprint } from "../../../scripts/interactiveArtifactFingerprint";
// @ts-expect-error Synthetic JS fixtures only.
import { completeFixture, attachReview, attachPolicyReviews, attachBatchAudit } from "../../../scripts/content-engine/fixtures.mjs";
// @ts-expect-error Offline JS hash helper.
import { hash } from "../../../scripts/content-engine/identity.mjs";
// @ts-expect-error Pinned legacy inventory helper.
import { readRelease } from "../../../scripts/content-engine/inventory.mjs";

const roots: string[] = [];
function root() { const r = mkdtempSync(join(tmpdir(), "checked-compiler-test-")); roots.push(r); return r; }
function request(doc: any, selected = doc.exercises.map((e: any) => ({ courseKey: e.courseKey, exerciseId: e.exerciseId })), id = "fixture") {
  const keys = selected.map(({ courseKey, exerciseId }: any) => `${courseKey}/${exerciseId}`).sort();
  const versions: Record<string, string> = {};
  for (const course of new Set<string>(selected.map((e: any) => e.courseKey))) {
    const rows = doc.exercises.filter((e: any) => e.courseKey === course && keys.includes(`${e.courseKey}/${e.exerciseId}`))
      .map((e: any) => ({ example: interactiveDrillExampleSchema.parse(e.item), topicId: "unclassified", difficulty: e.difficulty }));
    versions[course] = `checked-${digest(canonicalJson(rows)).slice(0, 32)}`;
  }
  approvals[id] = { corpusSha256: hash(doc), scope: "synthetic full corpus", inventoryEvidence: "fixture inventory", approvalEvidence: "fixture approval", releaseToken: approvals[id]?.releaseToken ?? `checked-${randomUUID()}`, selected: keys, checkedVersions: versions };
  return { approvalId: id, corpus: doc, selected };
}
// Test-only two-pass fixture provisioning: never used by production approval code.
function compileFixture(input: any, output: string) {
  const staging = root();
  try { compileCheckedRelease(input, staging); } catch (error) {
    if (!(error instanceof Error) || !error.message.includes("Compiled checked manifest")) throw error;
  }
  for (const course of Object.keys(approvals[input.approvalId].checkedVersions)) {
    const bytes = readFileSync(join(staging, course, "manifest.json"));
    pins[course] = { approvalId: input.approvalId, manifestSha256: createHash("sha256").update(bytes).digest("hex") };
  }
  return compileCheckedRelease(input, output);
}
function checked() { const doc = completeFixture(); attachReview(doc, "human-technical"); attachReview(doc, "software-release"); return doc; }
afterEach(() => { for (const key of Object.keys(approvals)) delete approvals[key]; for (const key of Object.keys(pins)) delete pins[key]; for (const r of roots.splice(0)) rmSync(r, { recursive: true, force: true }); });

describe("private checked authoring compiler", () => {
  it("distinguishes different synthetic checked runtime content built from the same source", () => {
    const doc = checked();
    const first = root();
    const repeat = root();
    compileFixture(request(doc), first);
    const firstPin = { ...pins["class1-water"] };
    compileFixture(request(doc), repeat);
    const before = computeInteractiveArtifactFingerprint(first);
    expect(computeInteractiveArtifactFingerprint(repeat)).toBe(before);
    const changed = checked();
    changed.exercises[0].item.prompt += " A synthetic variation.";
    changed.exercises[0].contentHash = hash(changed.exercises[0].item);
    changed.exercises[0].reviews = [];
    attachReview(changed, "human-technical"); attachReview(changed, "software-release");
    const second = root();
    compileFixture(request(changed, undefined, "other"), second);
    const secondPin = { ...pins["class1-water"] };
    expect(computeInteractiveArtifactFingerprint(second)).not.toBe(before);
    const a = new InteractiveContentEngine(first, []); const a2 = new InteractiveContentEngine(repeat, []); const b = new InteractiveContentEngine(second, []);
    const input = interactiveStartSessionInputSchema.parse({ courseKey: "class1-water", mode: "rapid-swipe", sessionSize: 5 });
    pins["class1-water"] = firstPin;
    const catalog = a.getCatalog("class1-water", false);
    const sessionA = a2.startSession(input, false);
    pins["class1-water"] = secondPin;
    const sessionB = b.startSession(input, false);
    expect(catalog.version).toMatch(/^effective-[a-f0-9]{64}$/);
    expect(sessionA.version).toBe(catalog.version);
    expect(sessionB.version).toMatch(/^effective-[a-f0-9]{64}$/);
    expect(sessionB.version).not.toBe(catalog.version); // client rejects this mixed pair
    expect(b.getCatalog("class1-water", false).version).toBe(sessionB.version);
  });
  it("fails closed without separately pinned prior full-corpus evidence", () => {
    const doc = checked(); const out = root();
    expect(() => compileCheckedRelease({ approvalId: "missing", corpus: doc, selected: [{ courseKey: doc.exercises[0].courseKey, exerciseId: doc.exercises[0].exerciseId }] }, out)).toThrow("prior full-corpus approval");
    expect(readdirSync(out)).toEqual([]);
  });
  it("does not treat corpus approval alone as a compiled artifact approval", () => {
    const doc = checked(); const out = root(); const input = request(doc);
    expect(() => compileCheckedRelease(input, out)).toThrow("Compiled checked manifest");
    expect(() => new InteractiveContentEngine(out, []).getCatalog("class1-water", true)).toThrow();
  });
  it("refuses missing, malformed, reused and caller-selected tokens or changed selections before writing", () => {
    const doc = checked(); const input = request(doc); const out = root();
    const token = approvals.fixture.releaseToken;
    for (const invalid of [undefined, "checked-v1", "checked-00000000-0000-4000-8000-000000000000".toUpperCase()]) {
      approvals.fixture.releaseToken = invalid;
      expect(() => compileCheckedRelease(input, out)).toThrow("prior full-corpus approval");
    }
    approvals.fixture.releaseToken = token;
    expect(() => compileCheckedRelease({ ...input, selected: [{ courseKey: "class1-water", exerciseId: "unapproved" }] }, out)).toThrow("Selection does not match");
    expect(() => compileCheckedRelease({ ...input, publicVersion: `checked-${randomUUID()}` }, out)).toThrow();
    approvals.other = { ...approvals.fixture };
    expect(() => compileCheckedRelease(input, out)).toThrow("prior full-corpus approval");
    delete approvals.other;
    approvals.fixture.checkedVersions[doc.exercises[0].courseKey] = `checked-${"a".repeat(32)}`;
    expect(() => compileCheckedRelease(input, out)).toThrow("content does not match");
    expect(readdirSync(out)).toEqual([]);
  });
  it("rejects missing or changed manifest tokens even when registry checksums are recomputed", () => {
    const doc = checked(); const out = root(); compileFixture(request(doc), out);
    const manifestPath = join(out, "class1-water/manifest.json"); const registryPath = join(out, "registry.json");
    const original = JSON.parse(readFileSync(manifestPath, "utf8"));
    for (const altered of [undefined, `checked-${randomUUID()}`]) {
      const manifest = { ...original, publicVersion: altered };
      const content = JSON.stringify(manifest) + "\n"; writeFileSync(manifestPath, content);
      const registry = JSON.parse(readFileSync(registryPath, "utf8"));
      registry.courses["class1-water"].sha256 = createHash("sha256").update(content).digest("hex");
      registry.courses["class1-water"].bytes = Buffer.byteLength(content);
      writeFileSync(registryPath, JSON.stringify(registry) + "\n");
      const engine = new InteractiveContentEngine(out, []);
      expect(() => engine.getCatalog("class1-water", false)).toThrow();
      expect(() => engine.startSession(interactiveStartSessionInputSchema.parse({ courseKey: "class1-water", mode: "rapid-swipe", sessionSize: 5 }), false)).toThrow();
    }
  });
  it("rejects a checked item altered with every mutable hash recomputed", () => {
    const doc = checked(); const out = root(); compileFixture(request(doc), out);
    const engine = new InteractiveContentEngine(out, []);
    const input = interactiveStartSessionInputSchema.parse({ courseKey: "class1-water", mode: "rapid-swipe", difficulty: "easy", sessionSize: 5 });
    expect(engine.startSession(input, true).examples).toEqual([doc.exercises[0].item]);
    const manifestPath = join(out, "class1-water/manifest.json");
    const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
    const entry = manifest.entries.find((e: any) => e.id === doc.exercises[0].item.id);
    const descriptor = manifest.shards[entry.shard];
    const shardPath = join(out, descriptor.file);
    const shard = JSON.parse(readFileSync(shardPath, "utf8"));
    shard.examples[entry.offset].prompt += " Forged.";
    const item = JSON.stringify(shard.examples[entry.offset]);
    entry.sha256 = createHash("sha256").update(item).digest("hex"); entry.bytes = Buffer.byteLength(item);
    const shardBytes = JSON.stringify(shard) + "\n"; writeFileSync(shardPath, shardBytes);
    descriptor.sha256 = createHash("sha256").update(shardBytes).digest("hex"); descriptor.bytes = Buffer.byteLength(shardBytes);
    const manifestBytes = JSON.stringify(manifest) + "\n"; writeFileSync(manifestPath, manifestBytes);
    const registryPath = join(out, "registry.json"); const registry = JSON.parse(readFileSync(registryPath, "utf8"));
    registry.courses["class1-water"].sha256 = createHash("sha256").update(manifestBytes).digest("hex");
    registry.courses["class1-water"].bytes = Buffer.byteLength(manifestBytes);
    writeFileSync(registryPath, JSON.stringify(registry) + "\n");
    expect(() => engine.getCatalog("class1-water", true)).toThrow();
    expect(() => engine.startSession(input, true)).toThrow();
    expect(() => new InteractiveContentEngine(out, []).startSession(input, true)).toThrow();
  });
  it("rejects changes to a previously cached selected shard and prevents legacy downgrade", () => {
    const doc = checked(); const out = root(); compileFixture(request(doc), out);
    const engine = new InteractiveContentEngine(out, []);
    const input = interactiveStartSessionInputSchema.parse({ courseKey: "class1-water", mode: "rapid-swipe", difficulty: "easy", sessionSize: 5 });
    engine.startSession(input, true);
    const manifestPath = join(out, "class1-water/manifest.json");
    const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
    const entry = manifest.entries.find((e: any) => e.id === doc.exercises[0].item.id);
    const shardPath = join(out, manifest.shards[entry.shard].file);
    writeFileSync(shardPath, readFileSync(shardPath, "utf8").replace(doc.exercises[0].item.prompt, "X".repeat(doc.exercises[0].item.prompt.length)));
    expect(() => engine.startSession(input, true)).toThrow();
    manifest.classification = "legacy_release"; manifest.version = manifest.sourceVersion;
    delete manifest.approvalId; delete manifest.publicVersion;
    const bytes = JSON.stringify(manifest) + "\n"; writeFileSync(manifestPath, bytes);
    const registryPath = join(out, "registry.json"); const registry = JSON.parse(readFileSync(registryPath, "utf8"));
    registry.courses["class1-water"].sha256 = createHash("sha256").update(bytes).digest("hex"); registry.courses["class1-water"].bytes = Buffer.byteLength(bytes);
    writeFileSync(registryPath, JSON.stringify(registry) + "\n");
    expect(() => engine.getCatalog("class1-water", false)).toThrow();
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
    expect(compileFixture(request(doc, [{ courseKey: doc.exercises[0].courseKey, exerciseId: doc.exercises[0].exerciseId }]), out).newItemCount).toBe(1);
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
    expect(compileFixture(request(doc), out)).toMatchObject({ courseCount: 38, itemCount: 3821, newItemCount: 1 });
    const engine = new InteractiveContentEngine(out, []);
    const legacy = engine.getLegacyContent("class1-water", true);
    const freeLegacy = engine.getLegacyContent("class1-water", false);
    for (const mode of interactiveModes) {
      const input = interactiveStartSessionInputSchema.parse({ courseKey: "class1-water", mode, sessionSize: 50 });
      const free = engine.startSession(input, false);
      expect(free.examples).toHaveLength(1);
      // The stored preview is unchanged; directional Cause and Effect is delivered with direction controls.
      expect(freeLegacy.examples.map(presentCauseEffect)).toContainEqual(free.examples[0]);
      expect(legacy.examples.map(presentCauseEffect)).toContainEqual(free.examples[0]);
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
      expect(catalog.version).toMatch(/^effective-[a-f0-9]{64}$/);
      expect(session.version).toBe(catalog.version);
      expect(JSON.stringify([catalog, session])).not.toContain(manifest.version);
      expect(JSON.stringify([catalog, session])).not.toContain(approvals.fixture.corpusSha256);
      expect(JSON.stringify([catalog, session])).not.toContain(pins["class1-water"].manifestSha256);
      for (const entry of manifest.entries) expect(JSON.stringify([catalog, session])).not.toContain(entry.sha256);
    }
    const files = readdirSync(join(out, "class1-water"));
    const serialized = files.map(f => readFileSync(join(out, "class1-water", f), "utf8")).join("\n");
    expect(serialized).not.toContain("Synthetic publisher");
    expect(serialized).not.toContain("Synthetic fact.");
    expect(serialized).not.toContain("fixture authority declaration");
    expect(JSON.stringify(engine.getCatalog("class1-water", true))).not.toMatch(/correctAnswer|explanation/);
  });
  it("rehashes only the checked manifest and selected shard on warm session requests", () => {
    const doc = checked(); const out = root(); compileFixture(request(doc), out);
    const engine = new InteractiveContentEngine(out, []);
    const input = interactiveStartSessionInputSchema.parse({ courseKey: "class1-water", mode: "rapid-swipe", difficulty: "easy", sessionSize: 5 });
    engine.startSession(input, true);
    const before = engine.diagnostics().diskReads;
    engine.startSession(input, true);
    expect(engine.diagnostics().diskReads - before).toBe(2);
  });
  it("honors the existing opt-in audited policy and refuses an invalidated batch", () => {
    const doc = completeFixture(); attachPolicyReviews(doc); attachBatchAudit(doc);
    const out = root();
    expect(compileFixture(request(doc), out).newItemCount).toBe(1);
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
    expect(() => compileCheckedRelease({ ...fresh, selected: [{ courseKey: "class1-water", exerciseId: "missing" }] }, out)).toThrow("Selection does not match");
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
