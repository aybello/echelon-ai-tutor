import { afterEach, describe, expect, it, vi } from "vitest";
const state = vi.hoisted(() => ({
  approvals: {} as Record<string, any>, pins: {} as Record<string, any>,
  bankBytes: undefined as Buffer | undefined, symlink: false, oversized: false, redirected: false,
}));
vi.mock("../../../scripts/content-engine/trusted-corpora", async original => {
  const actual = await original<typeof import("../../../scripts/content-engine/trusted-corpora")>();
  return {
    ...actual, approvedCorpora: state.approvals, activeCheckedReleases: state.pins,
    trustedApproval: (id: string) => actual.validateTrustedApproval(id, state.approvals),
    activeCheckedRelease: (key: string) => {
      const pin = state.pins[key];
      if (pin && (!actual.validateTrustedApproval(pin.approvalId, state.approvals) || !/^[a-f0-9]{64}$/.test(pin.manifestSha256)))
        throw new Error("Invalid active checked release binding");
      return pin;
    },
  };
});
// Only the fixed bank's disk input is simulated. All artifact compilation and
// legacy reads are real; no production compiler, pin check or loader is mocked.
vi.mock("node:fs", async original => {
  const actual = await original<typeof import("node:fs")>();
  const path = `${process.cwd()}/server/interactiveContent/reviewed-2026-11-13/release.json`;
  return {
    ...actual,
    lstatSync: (file: any, ...args: any[]) => {
      if (String(file) !== path) return (actual.lstatSync as any)(file, ...args);
      if (!state.bankBytes) throw Object.assign(new Error("Synthetic missing bank"), { code: "ENOENT" });
      return { isFile: () => !state.symlink, isSymbolicLink: () => state.symlink, size: state.oversized ? 65 * 1024 * 1024 : state.bankBytes.length };
    },
    realpathSync: (file: any, ...args: any[]) => String(file) === path ? (state.redirected ? `${path}-redirected` : path) : (actual.realpathSync as any)(file, ...args),
    readFileSync: (file: any, ...args: any[]) => String(file) === path ? state.bankBytes : (actual.readFileSync as any)(file, ...args),
  };
});
import { mkdtempSync, readFileSync, readdirSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { compileApprovedOrLegacyRelease, committedReleaseSchema, committedReleasePath } from "../../../scripts/content-engine/committed-release";
import { canonicalJson, digest, type ClassifiedExample } from "./compiler";
import { ENGINE_LIMITS, engineManifestSchema, engineShardSchema, type ArtifactDescriptor, type EngineManifest } from "./schema";
import { interactivePackageSchema } from "../schema";
import { InteractiveContentEngine } from "./loader";
import { interactiveModes, interactiveStartSessionInputSchema } from "../../../shared/interactiveSessions";

const roots: string[] = [];
function root() { const dir = mkdtempSync(join(tmpdir(), "committed-bank-test-")); roots.push(dir); return dir; }
const encode = (value: unknown) => `${canonicalJson(value)}\n`;
const descriptor = (file: string, value: unknown): ArtifactDescriptor => ({ file, sha256: digest(encode(value)), bytes: Buffer.byteLength(encode(value)) });
function legacy(courseKey: string) {
  return interactivePackageSchema.parse(JSON.parse(readFileSync(join(process.cwd(), "server/interactiveContent/release-2026-11-12/packages", `${courseKey}.json`), "utf8")));
}
/** Independent test-only pure artifact plan: establish fixture expectations before
 * calling the real compiler, never compile with disabled or provisional checks. */
function plannedPin(courseKey: string, records: ClassifiedExample[], approval: any): string {
  const pkg = legacy(courseKey);
  const version = approval.checkedVersions[courseKey];
  const rows: ClassifiedExample[] = [...pkg.examples.map(example => ({ example, topicId: "unclassified", difficulty: "unclassified" as const })), ...records];
  const shards: EngineManifest["shards"] = [];
  const entries: EngineManifest["entries"] = [];
  let batch: typeof pkg.examples = [];
  const flush = () => {
    if (!batch.length) return;
    const file = `${courseKey}/shard-${String(shards.length).padStart(4, "0")}.json`;
    shards.push({ ...descriptor(file, engineShardSchema.parse({ format: "interactive-shard-v1", courseKey, version, examples: batch })), count: batch.length });
    batch = [];
  };
  for (const row of rows) {
    if (batch.length === ENGINE_LIMITS.shardItems || Buffer.byteLength(encode({ format: "interactive-shard-v1", courseKey, version, examples: [...batch, row.example] })) > ENGINE_LIMITS.shardBytes) flush();
    entries.push({ id: row.example.id, mode: row.example.mode, topicId: row.topicId, difficulty: row.difficulty, shard: shards.length, offset: batch.length, bytes: Buffer.byteLength(canonicalJson(row.example)), sha256: digest(canonicalJson(row.example)) });
    batch.push(row.example);
  }
  flush();
  return digest(encode(engineManifestSchema.parse({
    format: "interactive-course-v1", courseKey, version, classification: "legacy_plus_checked",
    approvalId: "fixture", publicVersion: approval.releaseToken, sourceVersion: pkg.version,
    sourceSha256: digest(canonicalJson(pkg)), previewIds: pkg.previewIds,
    topics: [{ id: "unclassified", label: "Unclassified" }], legacy: descriptor(`${courseKey}/legacy.json`, pkg), shards, entries,
  })));
}
function provision(courseKeys = ["oit", "oit-ww"]) {
  const bank = committedReleaseSchema.parse({
    format: "reviewed-interactive-release-v1", approvalId: "fixture", corpusSha256: "a".repeat(64),
    records: courseKeys.map((courseKey, index) => ({ courseKey, example: {
      id: `synthetic-reviewed-${index}`, mode: "rapid-swipe", prompt: `Synthetic committed bank statement ${index}.`, correctAnswer: true, explanation: "Synthetic test-only reasoning.",
    }, topicId: "unclassified", difficulty: "easy" })),
  });
  state.bankBytes = Buffer.from(encode(bank));
  const checkedVersions = Object.fromEntries(courseKeys.map(course => {
    const rows = bank.records.filter(r => r.courseKey === course).map(({ example, topicId, difficulty }) => ({ example, topicId, difficulty }));
    return [course, `checked-${digest(canonicalJson(rows)).slice(0, 32)}`];
  }));
  const approval = state.approvals.fixture = {
    corpusSha256: bank.corpusSha256, committedBankSha256: digest(state.bankBytes), scope: "Synthetic fixture scope",
    inventoryEvidence: "Synthetic inventory", approvalEvidence: "Synthetic review, not production approval",
    releaseToken: "checked-11111111-2222-4333-8444-555555555555", checkedVersions,
    selected: bank.records.map(r => `${r.courseKey}/${r.example.id}`).sort(),
  };
  for (const course of courseKeys) {
    const rows = bank.records.filter(r => r.courseKey === course).map(({ example, topicId, difficulty }) => ({ example, topicId, difficulty }));
    state.pins[course] = { approvalId: "fixture", manifestSha256: plannedPin(course, rows, approval) };
  }
  return bank;
}
function repinBytes(bank: unknown) {
  state.bankBytes = Buffer.from(encode(bank));
  state.approvals.fixture.committedBankSha256 = digest(state.bankBytes);
}
afterEach(() => {
  for (const key of Object.keys(state.approvals)) delete state.approvals[key];
  for (const key of Object.keys(state.pins)) delete state.pins[key];
  state.bankBytes = undefined; state.symlink = false; state.oversized = false; state.redirected = false;
  for (const dir of roots.splice(0)) rmSync(dir, { recursive: true, force: true });
  vi.unstubAllEnvs();
});

describe("fixed server-only committed reviewed release", () => {
  it("compiles exact pinned synthetic OIT banks with unchanged legacy compatibility and previews", () => {
    const bank = provision(); const out = root();
    expect(compileApprovedOrLegacyRelease(out)).toMatchObject({ courseCount: 38, itemCount: 3821, newItemCount: 2 });
    const engine = new InteractiveContentEngine(out, []);
    for (const row of bank.records) {
      const pkg = legacy(row.courseKey);
      expect(engine.getLegacyContent(row.courseKey, true).examples).toEqual(pkg.examples);
      for (const mode of interactiveModes) {
        expect(engine.startSession(interactiveStartSessionInputSchema.parse({ courseKey: row.courseKey, mode, sessionSize: 5 }), false).examples)
          .toEqual([pkg.examples.find(e => e.id === pkg.previewIds[mode])]);
      }
      const session = engine.startSession(interactiveStartSessionInputSchema.parse({ courseKey: row.courseKey, mode: "rapid-swipe", difficulty: "easy", sessionSize: 5 }), true);
      expect(session.examples).toEqual([row.example]);
      expect(session.version).toBe(state.approvals.fixture.releaseToken);
      expect(JSON.stringify(engine.getCatalog(row.courseKey, true))).not.toMatch(/correctAnswer|explanation|corpusSha256|manifestSha256|committedBankSha256/);
    }
    expect(committedReleasePath).toBe(join(process.cwd(), "server/interactiveContent/reviewed-2026-11-13/release.json"));
  });
  it("accepts independently pinned JSON property order without normalizing values", () => {
    const bank = provision(["oit"]);
    repinBytes({ records: bank.records, corpusSha256: bank.corpusSha256, approvalId: bank.approvalId, format: bank.format });
    expect(compileApprovedOrLegacyRelease(root())).toMatchObject({ newItemCount: 1 });
  });
  it("applies the strict runtime semantics to options and matching pairs", () => {
    const base = { format: "reviewed-interactive-release-v1", approvalId: "fixture", corpusSha256: "a".repeat(64) };
    for (const example of [
      { id: "synthetic", mode: "odd-one-out", prompt: "Synthetic choice.", explanation: "Synthetic reasoning.", options: [{ id: "a", label: "Duplicate" }, { id: "b", label: "Duplicate" }], correctOptionId: "a" },
      { id: "synthetic", mode: "speed-match", prompt: "Synthetic matching.", pairs: [{ id: "a", left: "Same", right: "One" }, { id: "b", left: "Same", right: "Two" }, { id: "c", left: "Other", right: "Three" }] },
    ]) {
      expect(() => committedReleaseSchema.parse({ ...base, records: [{ courseKey: "oit", example, topicId: "unclassified", difficulty: "easy" }] })).toThrow();
    }
  });
  it("falls back only when absent and fails closed if an active checked course is missing", () => {
    const out = root();
    expect(compileApprovedOrLegacyRelease(out)).toMatchObject({ courseCount: 38, itemCount: 3821 });
    provision(); state.bankBytes = undefined;
    const closed = root();
    expect(() => compileApprovedOrLegacyRelease(closed)).toThrow("Active checked release missing");
    expect(readdirSync(closed)).toEqual([]);
  });
  it.each(["no approval", "corpus mismatch", "no byte pin", "wrong byte pin", "changed bytes", "changed checked version", "missing pin", "wrong approval pin", "extra active course"])("rejects %s before compilation writes", kind => {
    provision(); const out = root();
    if (kind === "no approval") delete state.approvals.fixture;
    if (kind === "corpus mismatch") state.approvals.fixture.corpusSha256 = "b".repeat(64);
    if (kind === "no byte pin") delete state.approvals.fixture.committedBankSha256;
    if (kind === "wrong byte pin") state.approvals.fixture.committedBankSha256 = "b".repeat(64);
    if (kind === "changed bytes") state.bankBytes = Buffer.from(state.bankBytes!.toString() + " ");
    if (kind === "changed checked version") state.approvals.fixture.checkedVersions.oit = `checked-${"b".repeat(32)}`;
    if (kind === "missing pin") delete state.pins.oit;
    if (kind === "wrong approval pin") { state.approvals.other = { ...state.approvals.fixture, releaseToken: "checked-22222222-2222-4333-8444-555555555555" }; state.pins.oit.approvalId = "other"; }
    if (kind === "extra active course") state.pins["class1-water"] = { approvalId: "fixture", manifestSha256: "b".repeat(64) };
    expect(() => compileApprovedOrLegacyRelease(out)).toThrow();
    expect(readdirSync(out)).toEqual([]);
  });
  it("does not bypass the unchanged compiler's exact active manifest pin", () => {
    provision(); state.pins.oit.manifestSha256 = "b".repeat(64);
    expect(() => compileApprovedOrLegacyRelease(root())).toThrow("Compiled checked manifest does not match");
  });
  it.each(["duplicate", "hidden record", "missing record", "changed record", "classification", "extra root field", "source quote", "provider response", "309a", "alias", "unknown course", "normalization"])("rejects %s even with a separately updated byte pin", kind => {
    const bank: any = provision(); const out = root();
    if (kind === "duplicate") bank.records.push(structuredClone(bank.records[0]));
    if (kind === "hidden record") { const extra = structuredClone(bank.records[0]); extra.example.id = "hidden-extra"; bank.records.push(extra); }
    if (kind === "missing record") bank.records.pop();
    if (kind === "changed record") bank.records[0].example.prompt += " Changed.";
    if (kind === "classification") bank.records[0].difficulty = "unclassified";
    if (kind === "extra root field") bank.corpus = {};
    if (kind === "source quote") bank.records[0].sourceQuote = "Not a runtime payload";
    if (kind === "provider response") bank.records[0].example.providerResponse = "Not a runtime payload";
    if (kind === "309a") bank.records[0].courseKey = "electrician-309a";
    if (kind === "alias") bank.records[0].courseKey = "OIT";
    if (kind === "unknown course") bank.records[0].courseKey = "not-a-course";
    if (kind === "normalization") bank.records[0].example.prompt += " ";
    repinBytes(bank);
    expect(() => compileApprovedOrLegacyRelease(out)).toThrow();
    expect(readdirSync(out)).toEqual([]);
  });
  it("rejects duplicate legacy IDs through the real compiler, even with updated synthetic pins", () => {
    const bank = provision(["oit"]);
    bank.records[0].example.id = legacy("oit").examples[0].id;
    repinBytes(bank);
    state.approvals.fixture.selected = [`oit/${bank.records[0].example.id}`];
    const rows = bank.records.map(({ example, topicId, difficulty }) => ({ example, topicId, difficulty }));
    state.approvals.fixture.checkedVersions.oit = `checked-${digest(canonicalJson(rows)).slice(0, 32)}`;
    state.pins.oit.manifestSha256 = plannedPin("oit", rows, state.approvals.fixture);
    expect(() => compileApprovedOrLegacyRelease(root())).toThrow("Duplicate course item id");
  });
  it.each(["symlink", "oversized", "redirected", "malformed JSON", "invalid UTF8"])("rejects %s without falling back", kind => {
    provision(); const out = root();
    if (kind === "symlink") state.symlink = true;
    if (kind === "oversized") state.oversized = true;
    if (kind === "redirected") state.redirected = true;
    if (kind === "malformed JSON") state.bankBytes = Buffer.from("{");
    if (kind === "invalid UTF8") state.bankBytes = Buffer.from([0xff]);
    expect(() => compileApprovedOrLegacyRelease(out)).toThrow();
    expect(readdirSync(out)).toEqual([]);
  });
  it("ignores caller-selected bank and automatic-trust environment variables", () => {
    vi.stubEnv("INTERACTIVE_RELEASE_BANK", "/tmp/unreviewed.json");
    vi.stubEnv("INTERACTIVE_TRUST_APPROVAL", "true");
    vi.stubEnv("INTERACTIVE_CHECKED_DOCUMENT", "private-authoring.json");
    expect(compileApprovedOrLegacyRelease(root())).toMatchObject({ courseCount: 38, itemCount: 3821 });
    provision(); delete state.approvals.fixture;
    expect(() => compileApprovedOrLegacyRelease(root())).toThrow("No trusted prior approval");
  });
});
