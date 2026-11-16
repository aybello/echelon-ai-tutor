import { afterEach, describe, expect, it, vi } from "vitest";
import { createHash } from "node:crypto";
import { mkdtempSync, readFileSync, writeFileSync, rmSync, symlinkSync, copyFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { build } from "esbuild";
import { getAllActiveCourseKeys } from "../../../shared/courseRegistry";
import { interactiveModes } from "../../../shared/interactiveSessions";
import { InteractiveContentEngine, effectiveReleaseVersion } from "./loader";
import { committedOverlayDocuments, compileOverlays, type ContentOverlay } from "./overlay";
import { overlayDescriptors, resolveOverlayRoot, readOverlayDocument, type OverlayDescriptor } from "./overlayFiles";
import { CourseOverlayStore, OVERLAY_CACHE_LIMITS } from "./overlayStore";
const roots: string[] = [];
afterEach(() => { vi.restoreAllMocks(); for (const root of roots.splice(0)) rmSync(root, { recursive: true, force: true }); });
const digest = (value: unknown) => createHash("sha256").update(JSON.stringify(value)).digest("hex");
function temp() { const root = mkdtempSync(join(tmpdir(), "overlay-memory-")); roots.push(root); return root; }
function descriptor(file: string, bytes: Buffer, courses: string[]): OverlayDescriptor { return { file, bytes: bytes.length, sha256: createHash("sha256").update(bytes).digest("hex"), courses }; }

describe("bounded external overlay runtime", () => {
  it("constructs the runtime with zero overlay reads and no cached course", () => {
    const engine = new InteractiveContentEngine();
    expect(engine.diagnostics()).toMatchObject({ diskReads: 0, overlayDiskReads: 0, overlayCachedCourses: 0, overlayCachedBytes: 0 });
  });
  it("preserves explicit registration order and descriptor exact bytes", () => {
    expect(overlayDescriptors).toHaveLength(179);
    for (const entry of overlayDescriptors) expect(readOverlayDocument(resolveOverlayRoot(), entry)).toBeDefined();
  });
  it("reuses a compiled course and evicts courses before decoded budget or count overflow", () => {
    const store = new CourseOverlayStore();
    const version = (docs: ContentOverlay[]) => digest(docs.map(d => d.overlayId));
    const first = store.get("oit", version);
    expect(store.get("oit", version)).toBe(first);
    const reads = store.diagnostics().overlayDiskReads;
    for (const key of ["oit-ww", "wpi-class4-water", "class4-water", "class1-water"]) {
      store.get(key, version);
      expect(store.diagnostics().overlayCachedCourses).toBeLessThanOrEqual(2);
      expect(store.diagnostics().overlayCachedBytes).toBeLessThanOrEqual(OVERLAY_CACHE_LIMITS.decodedBytes);
    }
    expect(store.get("oit", version)).not.toBe(first);
    expect(store.diagnostics().overlayDiskReads).toBeGreaterThan(reads);
  });
  it("fails closed for missing, corrupt, descriptor-mismatched and symlink storage, including warm-cache mutation", () => {
    const root = temp(); const entry = overlayDescriptors[0];
    const store = new CourseOverlayStore(root, [entry]);
    expect(() => store.get(entry.courses[0], () => "version")).toThrow();
    copyFileSync(join(resolveOverlayRoot(), entry.file), join(root, entry.file));
    expect(store.get(entry.courses[0], () => "version")).toBeDefined();
    const bytes = readFileSync(join(root, entry.file)); bytes[bytes.length - 3] ^= 1; writeFileSync(join(root, entry.file), bytes);
    expect(() => store.get(entry.courses[0], () => "version")).toThrow();
    rmSync(join(root, entry.file)); symlinkSync(join(resolveOverlayRoot(), entry.file), join(root, entry.file));
    expect(() => store.get(entry.courses[0], () => "version")).toThrow();
    expect(() => readOverlayDocument(root, { ...entry, file: "../escape.json" })).toThrow();
    expect(() => readOverlayDocument(resolveOverlayRoot(), { ...entry, sha256: "0".repeat(64) })).toThrow();
    expect(() => readOverlayDocument(resolveOverlayRoot(), { ...entry, courses: ["oit"] })).toThrow();
    const link = join(temp(), "linked-root"); symlinkSync(resolveOverlayRoot(), link);
    expect(() => readOverlayDocument(link, entry)).toThrow();
  });
  it("verifies a shared document's WHOLE historical receipt before projecting one course", () => {
    const entry = overlayDescriptors.find(d => d.courses.length > 1)!;
    const raw = readOverlayDocument(resolveOverlayRoot(), entry) as ContentOverlay;
    const course = entry.courses[0];
    const other = [...raw.additions, ...raw.replacements].find(e => e.courseKey !== course)!;
    other.example.prompt += " Changed other course.";
    const bytes = Buffer.from(JSON.stringify(raw)); const root = temp(); writeFileSync(join(root, entry.file), bytes);
    const store = new CourseOverlayStore(root, [descriptor(entry.file, bytes, [...entry.courses])]);
    expect(() => store.get(course, () => "version")).toThrow(/historical|receipt|payload|hash/i);
  });
  it("does not put private overlay literals or the whole-bank enumerator in the runtime bundle", async () => {
    const output = await build({ entryPoints: ["server/interactiveContent/engine/loader.ts"], bundle: true, write: false, platform: "node", packages: "external", format: "esm" });
    const source = output.outputFiles[0].text;
    const doc = readOverlayDocument(resolveOverlayRoot(), overlayDescriptors[3]) as ContentOverlay;
    expect(source).not.toContain(doc.additions[0].example.prompt);
    expect(source).not.toContain("committedOverlayDocuments");
    expect(source).not.toContain("enumerateOverlayDocuments");
    expect(source.length).toBeLessThan(300000);
    const buildScript = readFileSync("scripts/buildServer.ts", "utf8");
    expect(buildScript.indexOf('resolve("dist/interactive-content/overlays")')).toBeLessThan(buildScript.indexOf('writeInteractiveArtifactManifest(resolve('));
  });
  it("matches whole-bank reference catalog, IDs, full effective content and fixed-policy version for all 38 courses and six modes", () => {
    const documents = committedOverlayDocuments() as ContentOverlay[];
    const reference = new InteractiveContentEngine(undefined, documents) as any;
    const lazy = new InteractiveContentEngine() as any;
    const keys = getAllActiveCourseKeys().filter(key => key !== "electrician-309a"); expect(keys).toHaveLength(38);
    const proofs: unknown[] = [];
    for (const key of keys) {
      expect(lazy.getCatalog(key, true)).toEqual(reference.getCatalog(key, true));
      expect(lazy.getCatalog(key, false)).toEqual(reference.getCatalog(key, false));
      const manifest = reference.manifest(key);
      const expected = reference.pool(key, manifest), actual = lazy.pool(key, manifest);
      expect(digest(actual)).toBe(digest(expected));
      expect([...lazy.knownItems(key)]).toEqual([...reference.knownItems(key)]);
      const projected: ContentOverlay[] = [];
      compileOverlays(documents, key, doc => projected.push({ ...doc, additions: doc.additions.filter(e => e.courseKey === key), replacements: doc.replacements.filter(e => e.courseKey === key) }));
      expect(effectiveReleaseVersion(manifest, projected, undefined, "fixed-policy-parity")).toBe(effectiveReleaseVersion(manifest, documents, undefined, "fixed-policy-parity"));
      for (const mode of interactiveModes) {
        const ids = expected.filter((e: any) => e.mode === mode).slice(0, 50).map((e: any) => e.id);
        const input = { courseKey: key, mode, sessionSize: 50 };
        const a = lazy.startSession(input, true, ids), b = reference.startSession(input, true, ids);
        expect({ ...a, sessionId: "same" }).toEqual({ ...b, sessionId: "same" });
        expect({ ...lazy.startSession(input, false), sessionId: "same" }).toEqual({ ...reference.startSession(input, false), sessionId: "same" });
      }
      expect(lazy.getLegacyContent(key, true)).toEqual(reference.getLegacyContent(key, true));
      proofs.push({ key, items: actual.length, sha256: digest(actual) });
    }
    console.log("FULL_COURSE_PARITY_SHA256", digest(proofs));
  }, 180000);
});
