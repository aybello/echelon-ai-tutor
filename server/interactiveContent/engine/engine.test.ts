import { afterEach, describe, expect, it, vi } from "vitest";
import { isExcludedFromMode, presentCauseEffect } from "./modeFit";
import { existsSync, readFileSync, rmSync, unlinkSync, symlinkSync, writeFileSync, mkdtempSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { build } from "esbuild";
import { pathToFileURL } from "node:url";
import { InteractiveContentEngine, InteractiveEngineError, resolveEngineRoot } from "./loader";
import { compileCourse, compileLegacyRelease, canonicalJson } from "./compiler";
import { ENGINE_LIMITS } from "./schema";
import { interactiveModes, interactiveStartSessionInputSchema, interactiveCatalogResponseSchema, interactiveSessionResponseSchema, interactiveDrillExampleSchema } from "../../../shared/interactiveSessions";
import { fixture, syntheticLegacy, syntheticExample, changeManifest, writeJson } from "./testFixtures";
import { activeCheckedReleases, approvedCorpora } from "../../../scripts/content-engine/trusted-corpora";

// Legacy unit fixtures deliberately have no active checked release. The real shipped
// OIT bank and prior approval/pin bindings are covered by shippedReviewedRelease.test.ts.
vi.mock("../../../scripts/content-engine/trusted-corpora", async importOriginal => ({
  ...await importOriginal<typeof import("../../../scripts/content-engine/trusted-corpora")>(),
  approvedCorpora: Object.freeze({}), activeCheckedReleases: Object.freeze({}),
  trustedApproval: () => undefined, activeCheckedRelease: () => undefined,
}));

const roots: string[] = [];
const make = (options: Parameters<typeof fixture>[0] = {}) => { const result = fixture(options); roots.push(result.root); return result; };
const input = (overrides: Record<string, unknown> = {}) => interactiveStartSessionInputSchema.parse({ courseKey: "class1-water", mode: "rapid-swipe", ...overrides });
afterEach(() => { for (const root of roots.splice(0)) rmSync(root, { recursive: true, force: true }); });

describe("private indexed interactive engine", () => {
  it("isolates immutable-legacy fixtures from active reviewed release approvals", () => {
    expect(Object.keys(approvedCorpora)).toEqual([]);
    expect(Object.keys(activeCheckedReleases)).toEqual([]);
  });
  it("preserves every original preview and bounds compatibility content to legacy", () => {
    const { root, legacy } = make({ perMode: 1001 });
    const engine = new InteractiveContentEngine(root);
    const seen = new Set<string>();
    for (let refresh = 0; refresh < 3; refresh++) {
      for (const mode of interactiveModes) {
        const session = engine.startSession(input({ mode, topicId: "alpha", difficulty: "hard", sessionSize: 50 }), false);
        expect(session.examples).toEqual([legacy.examples.find(e => e.id === legacy.previewIds[mode])]);
        expect(session.filters).toEqual({ topicId: null, difficulty: null, requestedSize: 50 });
        expect(session.totalAvailableCount).toBe(1);
        session.examples.forEach(e => seen.add(e.id));
      }
      engine.getLegacyContent("class1-water", false).examples.forEach(e => seen.add(e.id));
      expect(engine.getCatalog("class1-water", false).modes.every(m => m.totalCount === 1001)).toBe(true);
    }
    expect([...seen].sort()).toEqual(Object.values(legacy.previewIds).sort());
    expect(engine.getLegacyContent("class1-water", true).examples).toEqual(legacy.examples);
    expect(engine.getLegacyContent("class1-water", true).examples.length).toBeLessThanOrEqual(300);
  });

  it("catalog reads only registration and one manifest for a 6006-item bank; session loads only selected shards", () => {
    const { root } = make({ perMode: 1001 });
    const engine = new InteractiveContentEngine(root);
    expect(engine.diagnostics().diskReads).toBe(0);
    const catalog = engine.getCatalog("class1-water", true);
    expect(catalog.modes.map(m => m.totalCount)).toEqual([1001, 1001, 1001, 1001, 1001, 1001]);
    expect(interactiveCatalogResponseSchema.safeParse(catalog).success).toBe(true);
    expect(engine.diagnostics().diskReads).toBe(2);
    expect(JSON.stringify(catalog)).not.toMatch(/correctAnswer|explanation|Synthetic question/);
    const result = engine.startSession(input(), true);
    expect(result.examples).toHaveLength(20);
    expect(new Set(result.examples.map(e => e.id)).size).toBe(20);
    expect(result.totalAvailableCount).toBe(1001);
    expect(engine.diagnostics().diskReads).toBeLessThanOrEqual(22);
    const manifest = JSON.parse(readFileSync(join(root, "class1-water/manifest.json"), "utf8"));
    expect(manifest.entries).toHaveLength(6006);
    expect(manifest.shards.every((s: { count: number; bytes: number }) => s.count <= 100 && s.bytes <= ENGINE_LIMITS.shardBytes)).toBe(true);
    expect(engine.diagnostics().cachedBytes).toBeLessThanOrEqual(ENGINE_LIMITS.cacheBytes);
    expect(engine.diagnostics().cachedEntries).toBeLessThanOrEqual(ENGINE_LIMITS.cacheEntries);
  });

  it("samples exactly the mode/topic/difficulty intersection without replacement and exposes truthful counts", () => {
    const { root, records } = make({ perMode: 80 });
    const engine = new InteractiveContentEngine(root);
    for (const mode of interactiveModes) {
      const expected = records.filter(r => r.example.mode === mode && r.topicId === "alpha" && r.difficulty === "easy");
      const result = engine.startSession(input({ mode, topicId: "alpha", difficulty: "easy", sessionSize: 50 }), true);
      expect(result.totalAvailableCount).toBe(expected.length);
      expect(new Set(result.examples.map(e => e.id))).toEqual(new Set(expected.map(r => r.example.id)));
      expect(result.filters).toEqual({ topicId: "alpha", difficulty: "easy", requestedSize: 50 });
      expect(interactiveSessionResponseSchema.safeParse(result).success).toBe(true);
    }
    const mode = engine.getCatalog("class1-water", true).modes[0];
    expect(mode.topics.reduce((n, t) => n + t.count, 0)).toBe(mode.totalCount);
    expect(mode.difficulties.reduce((n, d) => n + d.count, 0)).toBe(mode.totalCount);
    expect(mode.topics).toContainEqual({ id: "unclassified", label: "Unclassified", count: 1 });
  });

  it("returns an honest empty selection for nonexistent topics or empty intersections", () => {
    const { root } = make();
    const engine = new InteractiveContentEngine(root);
    for (const filters of [{ topicId: "missing" }, { topicId: "alpha", difficulty: "medium" }]) {
      const result = engine.startSession(input(filters), true);
      expect(result).toMatchObject({ available: true, locked: false, totalAvailableCount: 0, examples: [] });
      expect(result.filters).toMatchObject(filters);
    }
  });

  it("preserves both before-after shapes and refuses malformed wire input", () => {
    expect(interactiveDrillExampleSchema.safeParse(syntheticExample("before-after", "synthetic-order")).success).toBe(true);
    expect(interactiveDrillExampleSchema.safeParse({ ...syntheticExample("before-after", "synthetic-order"), options: ["North", "South"], correctAnswer: "North" }).success).toBe(true);
    for (const overrides of [{ sessionSize: 4 }, { sessionSize: 51 }, { sessionSize: 5.5 }, { mode: "unknown" }, { topicId: "../alpha" }, { difficulty: "advanced" }, { answers: true }]) expect(() => input(overrides)).toThrow();
    expect(input().sessionSize).toBe(20);
  });

  it("enforces the response byte budget without admitting items outside the intersection", () => {
    const { root } = make({ perMode: 101, huge: true });
    const engine = new InteractiveContentEngine(root);
    const result = engine.startSession(input({ topicId: "alpha", difficulty: "easy", sessionSize: 50 }), true);
    expect(result.totalAvailableCount).toBe(33);
    expect(result.examples.length).toBeGreaterThan(0);
    expect(result.examples.length).toBeLessThan(33);
    expect(Buffer.byteLength(JSON.stringify(result))).toBeLessThanOrEqual(ENGINE_LIMITS.responseBytes);
    expect(new Set(result.examples.map(e => e.id)).size).toBe(result.examples.length);
    expect(result.filters.requestedSize).toBe(50);
  });

  it("refuses 309A, aliases, traversal, unknown courses, and cross-course artifacts", () => {
    const { root } = make({ secondCourse: true });
    const engine = new InteractiveContentEngine(root);
    for (const key of ["electrician-309a", "electrician-309a-demo", "class1", "../class1-water", "unknown"]) expect(() => engine.getCatalog(key, true)).toThrow(InteractiveEngineError);
    expect(engine.startSession(input({ courseKey: "class2-water" }), false).examples[0].id).toMatch(/^class2-water-/);
    changeManifest(root, m => { m.courseKey = "class2-water"; });
    expect(() => engine.getCatalog("class1-water", true)).toThrow(InteractiveEngineError);
  });

  it.each(["missing-manifest", "missing-shard", "hash", "invalid-json", "oversize", "symlink"])("fails closed on %s, with no legacy fallback", kind => {
    const { root } = make();
    const engine = new InteractiveContentEngine(root);
    const file = join(root, kind === "missing-manifest" ? "class1-water/manifest.json" : "class1-water/shard-0000.json");
    if (kind === "missing-manifest" || kind === "missing-shard") unlinkSync(file);
    else if (kind === "hash") { const data = readFileSync(file, "utf8"); writeFileSync(file, data.replace("Synthetic question", "Tampered! question")); }
    else if (kind === "invalid-json") writeFileSync(file, "not JSON");
    else if (kind === "oversize") writeFileSync(file, "x".repeat(ENGINE_LIMITS.shardBytes + 1));
    else { unlinkSync(file); symlinkSync(join(root, "class1-water/legacy.json"), file); }
    expect(() => engine.startSession(input(), false)).toThrow(InteractiveEngineError);
  });

  it.each(["path", "duplicate-id", "bad-offset", "bad-item-hash"])("rejects a checksummed but invalid manifest: %s", kind => {
    const { root } = make();
    changeManifest(root, m => {
      if (kind === "path") m.shards[0].file = "../outside.json";
      if (kind === "duplicate-id") m.entries[1].id = m.entries[0].id;
      if (kind === "bad-offset") m.entries[0].offset = 99;
      if (kind === "bad-item-hash") m.entries[0].sha256 = "0".repeat(64);
    });
    const engine = new InteractiveContentEngine(root);
    expect(() => engine.startSession(input(), false)).toThrow(InteractiveEngineError);
  });

  it("invalidates validated cache on content changes and prevents caller mutation", () => {
    const { root } = make();
    const engine = new InteractiveContentEngine(root);
    const first = engine.getLegacyContent("class1-water", true);
    expect(() => { first.examples[0].prompt = "Changed by caller"; }).toThrow();
    engine.startSession(input(), false);
    const file = join(root, "class1-water/shard-0000.json");
    writeFileSync(file, readFileSync(file, "utf8").replace("Synthetic question", "Tampered! question"));
    expect(() => engine.startSession(input(), false)).toThrow(InteractiveEngineError);
  });

  it("does not turn a deleted registered course into an unavailable fallback", () => {
    const { root } = make();
    const registry = JSON.parse(readFileSync(join(root, "registry.json"), "utf8"));
    delete registry.courses["class1-water"];
    writeJson(root, "registry.json", registry);
    expect(() => new InteractiveContentEngine(root).getCatalog("class1-water", false)).toThrow(InteractiveEngineError);
  });

  it("revalidates a cached shard after a checksummed manifest changes its item hash", () => {
    const { root } = make();
    const engine = new InteractiveContentEngine(root);
    engine.startSession(input(), false);
    changeManifest(root, m => { m.entries[0].sha256 = "0".repeat(64); });
    expect(() => engine.startSession(input(), false)).toThrow(InteractiveEngineError);
  });

  it("compiler rejects empty, oversized, duplicate and changed-preview synthetic content", () => {
    const { root } = make();
    const legacy = syntheticLegacy();
    expect(() => compileCourse(root, legacy, [])).toThrow();
    const row = { example: legacy.examples[0], topicId: "unclassified", difficulty: "unclassified" as const };
    expect(() => compileCourse(root, legacy, [row, row])).toThrow();
    expect(() => compileCourse(root, { ...legacy, courseKey: "electrician-309a" })).toThrow();
    const rows = legacy.examples.map(example => ({ example, topicId: "unclassified", difficulty: "unclassified" as const }));
    rows[0] = { ...rows[0], example: { ...rows[0].example, prompt: "Changed fixed preview" } };
    expect(() => compileCourse(root, legacy, rows)).toThrow(/preview/);
    const pairs = Array.from({ length: 20 }, (_, i) => ({ id: `pair-${i}`, left: `${i}${"L".repeat(3998)}`, right: `${i}${"R".repeat(3998)}` }));
    expect(() => compileCourse(root, legacy, [{ ...row, example: { id: "oversized", mode: "speed-match", prompt: "Synthetic", pairs } }])).toThrow(/byte/);
  });

  const sourceRegistry = () => readFileSync(new URL("../release-2026-11-12/registry.ts", import.meta.url), "utf8");
  const firstEntry = "'class1-wastewater-coll': { approved: true, content: p0 }";
  const firstImport = "import p0 from './packages/class1-wastewater-coll.json';";
  const invalidRelease = (registry: string) => {
    const root = mkdtempSync(join(tmpdir(), "interactive-registry-test-")); roots.push(root);
    writeFileSync(join(root, "registry.ts"), registry);
    writeFileSync(join(root, "release-metadata.json"), readFileSync(new URL("../release-2026-11-12/release-metadata.json", import.meta.url)));
    const outputDir = join(root, "output");
    expect(() => compileLegacyRelease({ sourceDir: root, outputDir })).toThrow(/registration/);
    // Reject the entire release before publishing any content or attempting package imports.
    expect(existsSync(outputDir)).toBe(false);
  };

  it.each([
    ["approved false", (r: string) => r.replace(firstEntry, firstEntry.replace("approved: true", "approved: false"))],
    ["commented approval plus live false", (r: string) => r.replace(firstEntry, `/* ${firstEntry} */ ${firstEntry.replace("approved: true", "approved: false")}`)],
    ["commented approval plus active false", (r: string) => r.replace(firstEntry, `/* ${firstEntry} */ ${firstEntry.replace("content: p0", "content: p0, active: false")}`)],
    ["active false", (r: string) => r.replace(firstEntry, firstEntry.replace("content: p0", "content: p0, active: false"))],
    ["dynamic approval", (r: string) => r.replace(firstEntry, firstEntry.replace("approved: true", "approved: Boolean(true)"))],
    ["dynamic content", (r: string) => r.replace(firstEntry, firstEntry.replace("content: p0", "content: (() => p0)()"))],
    ["duplicate approval field", (r: string) => r.replace(firstEntry, firstEntry.replace("approved: true", "approved: true, approved: false"))],
    ["duplicate content field", (r: string) => r.replace(firstEntry, firstEntry.replace("content: p0", "content: p0, content: p1"))],
    ["extra field", (r: string) => r.replace(firstEntry, firstEntry.replace("content: p0", "content: p0, extra: true"))],
    ["entry spread", (r: string) => r.replace(firstEntry, firstEntry.replace("content: p0", "content: p0, ...{}"))],
    ["registry spread", (r: string) => r.replace(firstEntry, `${firstEntry}, ...{}`)],
    ["duplicate course", (r: string) => r.replace(firstEntry, `${firstEntry}, ${firstEntry}`)],
    ["computed course", (r: string) => r.replace(firstEntry, firstEntry.replace("'class1-wastewater-coll'", "['class1-wastewater-coll']"))],
    ["shorthand entry field", (r: string) => r.replace(firstEntry, firstEntry.replace("approved: true", "approved"))],
    ["wrong import mapping", (r: string) => r.replace(firstEntry, firstEntry.replace("content: p0", "content: p1"))],
    ["duplicate import binding", (r: string) => r.replace(firstImport, `${firstImport}\n${firstImport}`)],
    ["duplicate imported course", (r: string) => r.replace(firstImport, `${firstImport}\n${firstImport.replace("p0", "p38")}`)],
    ["extra import", (r: string) => r.replace(firstImport, `${firstImport}\nimport p38 from './packages/extra.json';`)],
    ["extra course", (r: string) => r.replace(firstImport, `${firstImport}\nimport p38 from './packages/extra.json';`).replace(firstEntry, `${firstEntry}, 'extra': { approved: true, content: p38 }`)],
    ["missing canonical course", (r: string) => r.replace(firstImport, "").replace(`${firstEntry},`, "")],
    ["commented-out registry", (r: string) => r.replace("export const releasePackages", "/* export const releasePackages") + "*/"],
    ["dynamic freeze", (r: string) => r.replace("Object.freeze({", "Object.assign({}, {")],
    ["wrong export", (r: string) => r.replace("export const releasePackages", "export const otherPackages")],
    ["mutable export", (r: string) => r.replace("export const releasePackages", "export let releasePackages")],
    ["extra declaration", (r: string) => `${r}\nexport const extra = true;`],
    ["malformed syntax", (r: string) => r.replace("approved: true", "approved: true true")],
  ])("does not publish %s registry data", (_name, mutate) => {
    invalidRelease(mutate(sourceRegistry()));
  });

  it("never executes a dynamic registry expression or top-level statement", () => {
    const root = mkdtempSync(join(tmpdir(), "interactive-registry-noexec-")); roots.push(root);
    const marker = join(root, "executed");
    const sideEffect = `require('node:fs').writeFileSync(${JSON.stringify(marker)}, 'executed')`;
    invalidRelease(sourceRegistry().replace(firstEntry, firstEntry.replace("approved: true", `approved: (() => { ${sideEffect}; return true; })()`)));
    invalidRelease(`${sourceRegistry()}\n${sideEffect};`);
    expect(existsSync(marker)).toBe(false);
  });

  it("compiles all 38 unchanged approved filesystem packs deterministically, with honest legacy metadata", () => {
    const root = mkdtempSync(join(tmpdir(), "interactive-release-test-")); roots.push(root);
    const result = compileLegacyRelease({ outputDir: root });
    expect(result).toMatchObject({ courseCount: 38, itemCount: 3821 });
    const original = readFileSync(join(root, "registry.json"), "utf8");
    const engine = new InteractiveContentEngine(root);
    const registry = JSON.parse(original);
    for (const key of Object.keys(registry.courses)) {
      const catalog = engine.getCatalog(key, false);
      const legacy = engine.getLegacyContent(key, true);
      // Cause and Effect calculation items stay stored but are withheld from catalogs (mode fit).
      const withheld = legacy.examples.filter(e => isExcludedFromMode(key, e.mode, e.id)).length;
      expect(catalog.modes.reduce((n, mode) => n + mode.totalCount, 0)).toBe(legacy.examples.length - withheld);
      const manifest = JSON.parse(readFileSync(join(root, `${key}/manifest.json`), "utf8"));
      for (const mode of interactiveModes) expect(engine.startSession(input({ courseKey: key, mode }), false).examples[0]).toEqual(presentCauseEffect(legacy.examples.find(e => e.id === manifest.previewIds[mode])!));
      expect(manifest.classification).toBe("legacy_release");
      expect(manifest.entries.every((e: { topicId: string; difficulty: string }) => e.topicId === "unclassified" && e.difficulty === "unclassified")).toBe(true);
      expect(Object.keys(manifest)).not.toContain("humanApproval");
    }
    expect(engine.diagnostics().cachedBytes).toBeLessThanOrEqual(ENGINE_LIMITS.cacheBytes);
    expect(engine.diagnostics().cachedEntries).toBeLessThanOrEqual(ENGINE_LIMITS.cacheEntries);
    compileLegacyRelease({ outputDir: root });
    expect(readFileSync(join(root, "registry.json"), "utf8")).toBe(original);
  });

  it("detects explicit source/dev and bundled/prod paths without a cwd fallback", async () => {
    expect(resolveEngineRoot(pathToFileURL(join(process.cwd(), "server/interactiveContent/engine/loader.ts")).href)).toBe(join(process.cwd(), "server/interactiveContent/engine/release-v1"));
    expect(resolveEngineRoot("file:///trusted/app/dist/index.js")).toBe("/trusted/app/dist/interactive-content");
    expect(() => resolveEngineRoot("file:///unexpected/loader.js")).toThrow();
    const { root } = make();
    const production = join(root, "dist");
    // A tiny isolated bundle proves import.meta.url works after bundling, no server launch.
    const entry = join(root, "entry.ts");
    writeFileSync(entry, `export { getInteractiveContentEngine } from ${JSON.stringify(join(process.cwd(), "server/interactiveContent/engine/loader.ts"))};`);
    const { cpSync, mkdirSync } = await import("node:fs");
    mkdirSync(production);
    cpSync(root + "/class1-water", production + "/interactive-content/class1-water", { recursive: true });
    cpSync(root + "/registry.json", production + "/interactive-content/registry.json");
    const bundle = await build({ entryPoints: [entry], outfile: join(production, "index.js"), platform: "node", format: "esm", bundle: true, logLevel: "silent", metafile: true });
    expect(Object.keys(bundle.metafile!.inputs).some(file => file.includes("typescript/") || file.endsWith("/compiler.ts"))).toBe(false);
    const bundled = await import(/* @vite-ignore */ pathToFileURL(join(production, "index.js")).href);
    expect(bundled.getInteractiveContentEngine().getCatalog("class1-water", false).available).toBe(true);
  });
});
