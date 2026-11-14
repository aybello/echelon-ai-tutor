import { syntheticReceipt } from "./reviewTestFixtures";
import { afterEach, describe, expect, it } from "vitest";
import { createHash } from "node:crypto";
import { readFileSync, rmSync } from "node:fs";
import { join } from "node:path";
import { InteractiveContentEngine, effectiveReleaseVersion, BEHAVIOR_POLICY_SHA256 } from "./loader";
import { committedModeFitExclusions } from "./modeFit";
import { type ContentOverlay } from "./overlay";
import { fixture, syntheticExample } from "./testFixtures";
import { type EngineManifest } from "./schema";

const roots: string[] = [];
afterEach(() => { for (const root of roots.splice(0)) rmSync(root, { recursive: true, force: true }); });
const review = { verdict: "approved" as const, reviewer: "Synthetic reviewer", reviewAuthority: "owner-authorized-ai-review" as const, reviewedAt: "2026-11-13T00:00:00Z", notes: "Synthetic review" };
function setup() {
  const f = fixture({ perMode: 3 }); roots.push(f.root);
  const manifest: EngineManifest = JSON.parse(readFileSync(join(f.root, "class1-water/manifest.json"), "utf8"));
  const target = manifest.entries.find(entry => entry.id === "synthetic-rapid-swipe-1")!;
  const addition: ContentOverlay["additions"][number] = { courseKey: "class1-water", topicId: "unclassified", difficulty: "unclassified", example: syntheticExample("rapid-swipe", "synthetic-added"), review };
  const replacement: ContentOverlay["replacements"][number] = { courseKey: "class1-water", topicId: "unclassified", difficulty: "unclassified", replacesId: target.id, replacesSha256: target.sha256, example: syntheticExample("rapid-swipe", "synthetic-revised"), reason: "Synthetic revision", review };
  const doc: ContentOverlay = { format: "interactive-overlay-v1", overlayId: "synthetic-overlay", scope: "Synthetic test", additions: [addition], replacements: [replacement] };
  return { ...f, manifest, doc: syntheticReceipt(doc) };
}

describe("effective interactive release version", () => {
  it("is deterministic and binds additions, replacements, legacy identity, exclusions and behavior policy", () => {
    const { manifest, doc } = setup();
    const version = (docs: ContentOverlay[]) => effectiveReleaseVersion(manifest, docs);
    const initial = version([doc]);
    expect(initial).toMatch(/^effective-[a-f0-9]{64}$/);
    expect(version([structuredClone(doc)])).toBe(initial);
    const changedAddition = structuredClone(doc); changedAddition.additions[0].example.prompt += " Changed.";
    const changedReplacement = structuredClone(doc); changedReplacement.replacements[0].example.prompt += " Changed.";
    expect(version([changedAddition])).not.toBe(initial);
    expect(version([changedReplacement])).not.toBe(initial);
    expect(version([{ ...doc, additions: [] }])).not.toBe(initial);
    expect(version([{ ...doc, replacements: [] }])).not.toBe(initial);
    expect(effectiveReleaseVersion({ ...manifest, version: "synthetic-v2" }, [doc])).not.toBe(initial);
    const exclusions = structuredClone(committedModeFitExclusions());
    exclusions.courses[manifest.courseKey] = [...(exclusions.courses[manifest.courseKey] ?? []), "new-excluded-id"];
    expect(effectiveReleaseVersion(manifest, [doc], exclusions)).not.toBe(initial);
    expect(effectiveReleaseVersion(manifest, [doc], committedModeFitExclusions(), "different-presentation-policy")).not.toBe(initial);
  });

  it("uses the independent checked token, never private content-derived manifest fields", () => {
    const { manifest, doc } = setup();
    const checked: EngineManifest = { ...manifest, classification: "legacy_plus_checked", publicVersion: "checked-public-random-token-a", approvalId: "test-approval", version: "private-checked-a" };
    const version = effectiveReleaseVersion(checked, [doc]);
    const changedPrivate: EngineManifest = { ...checked, version: "private-checked-b", sourceSha256: "f".repeat(64),
      entries: checked.entries.map(entry => ({ ...entry, sha256: "e".repeat(64) })),
      shards: checked.shards.map(shard => ({ ...shard, sha256: "d".repeat(64) })) };
    expect(effectiveReleaseVersion(changedPrivate, [doc])).toBe(version);
    expect(effectiveReleaseVersion({ ...checked, publicVersion: "checked-public-random-token-b" }, [doc])).not.toBe(version);
    expect(effectiveReleaseVersion({ ...checked, courseKey: "class2-water" }, [])).not.toBe(effectiveReleaseVersion(checked, []));
    expect(() => effectiveReleaseVersion({ ...checked, publicVersion: undefined }, [doc])).toThrow();
  });

  it("only binds overlay entries effective for this course and ignores object-key order", () => {
    const { manifest, doc } = setup();
    const otherCourse = structuredClone(doc);
    otherCourse.additions[0].courseKey = "class2-water";
    otherCourse.replacements = [];
    expect(effectiveReleaseVersion(manifest, [otherCourse])).toBe(effectiveReleaseVersion(manifest, []));
    const reordered = JSON.parse(JSON.stringify(doc, (key, value) => value && !Array.isArray(value) && typeof value === "object" ? Object.fromEntries(Object.entries(value).reverse()) : value));
    expect(effectiveReleaseVersion(manifest, [reordered])).toBe(effectiveReleaseVersion(manifest, [doc]));
  });

  it("keeps catalog and session versions equal for both access states and rejects a mixed deployment", () => {
    const { root, doc } = setup();
    const oldEngine = new InteractiveContentEngine(root, []);
    const nextEngine = new InteractiveContentEngine(root, [doc]);
    for (const access of [false, true]) {
      const input = { courseKey: "class1-water", mode: "rapid-swipe" as const, sessionSize: 5 };
      const catalog = oldEngine.getCatalog(input.courseKey, access);
      const oldSession = oldEngine.startSession(input, access);
      const nextSession = nextEngine.startSession(input, access);
      expect(catalog.version).toBe(oldSession.version);
      expect(nextEngine.getCatalog(input.courseKey, access).version).toBe(nextSession.version);
      expect(nextSession.version).not.toBe(catalog.version);
      expect(oldEngine.getLegacyContent(input.courseKey, access)).toEqual(nextEngine.getLegacyContent(input.courseKey, access));
    }
  });

  it("binds the actual loader, overlay, selection, schema and presentation behavior sources", () => {
    const hash = createHash("sha256");
    for (const path of ["server/interactiveContent/engine/loader.ts", "server/interactiveContent/engine/overlay.ts", "server/interactiveContent/engine/reviewReceipt.ts", "server/interactiveContent/engine/modeFit.ts", "server/interactiveContent/engine/schema.ts", "server/interactiveContent/schema.ts", "shared/interactiveCauseEffect.ts", "shared/interactiveSessions.ts", "shared/courseRegistry.ts"]) {
      let source = readFileSync(path, "utf8");
      if (path.endsWith("/loader.ts")) {
        const pattern = /export const BEHAVIOR_POLICY_SHA256 = "[a-f0-9]{64}";/g;
        expect([...source.matchAll(pattern)]).toHaveLength(1);
        source = source.replace(pattern, `export const BEHAVIOR_POLICY_SHA256 = "${"0".repeat(64)}";`);
      }
      hash.update(path + "\0"); hash.update(source); hash.update("\0");
    }
    expect(hash.digest("hex")).toBe(BEHAVIOR_POLICY_SHA256);
  });
});
