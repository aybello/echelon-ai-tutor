import { mkdtempSync, writeFileSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { interactiveModes, type InteractiveDrillExample, type InteractiveMode } from "../../../shared/interactiveSessions";
import { compileCourse, digest, canonicalJson, eligibleCourseKeys, type ClassifiedExample } from "./compiler";
import type { InteractivePackage } from "../schema";
import type { ArtifactDescriptor } from "./schema";

export function syntheticExample(mode: InteractiveMode, id: string): InteractiveDrillExample {
  const base = { id, prompt: "Synthetic question", explanation: "Synthetic explanation" };
  if (mode === "rapid-swipe") return { ...base, mode, correctAnswer: true };
  if (mode === "speed-match") return { ...base, mode, pairs: [{ id: "x", left: "Alpha", right: "One" }, { id: "y", left: "Beta", right: "Two" }, { id: "z", left: "Gamma", right: "Three" }] };
  if (mode === "before-after") return { ...base, mode, correctAnswer: "before" };
  return { ...base, mode, options: [{ id: "x", label: "Alpha" }, { id: "y", label: "Beta" }], correctOptionId: "x" };
}
export function syntheticLegacy(courseKey = "class1-water"): InteractivePackage {
  return {
    courseKey, status: "approved", version: "synthetic-v1",
    previewIds: Object.fromEntries(interactiveModes.map(mode => [mode, `${courseKey}-preview-${mode}`])) as InteractivePackage["previewIds"],
    examples: interactiveModes.flatMap(mode => [syntheticExample(mode, `${courseKey}-preview-${mode}`), syntheticExample(mode, `${courseKey}-paid-${mode}`)]),
  };
}
export function writeJson(root: string, file: string, content: unknown): ArtifactDescriptor {
  const data = `${canonicalJson(content)}\n`;
  writeFileSync(join(root, file), data);
  return { file, bytes: Buffer.byteLength(data), sha256: digest(data) };
}
export function fixture(options: { perMode?: number; huge?: boolean; secondCourse?: boolean } = {}) {
  const root = mkdtempSync(join(tmpdir(), "interactive-engine-test-"));
  const legacy = syntheticLegacy();
  const records: ClassifiedExample[] = [];
  for (const mode of interactiveModes) {
    records.push({ example: legacy.examples.find(e => e.id === legacy.previewIds[mode])!, topicId: "unclassified", difficulty: "unclassified" });
    for (let i = 1; i < (options.perMode ?? 8); i++) {
      const example = syntheticExample(mode, `synthetic-${mode}-${i}`);
      if (options.huge && mode === "rapid-swipe") { example.prompt = "P".repeat(4000); example.explanation = "E".repeat(4000); }
      records.push({ example, topicId: i % 2 ? "alpha" : "beta", difficulty: i % 3 ? "easy" : "hard" });
    }
  }
  const descriptor = compileCourse(root, legacy, records, [{ id: "unclassified", label: "Unclassified" }, { id: "alpha", label: "Alpha" }, { id: "beta", label: "Beta" }]);
  // Other canonical entries are intentionally missing files: querying them must
  // fail closed; tests never read or import the authored real release catalog.
  const courses: Record<string, ArtifactDescriptor> = Object.fromEntries(eligibleCourseKeys().map(key => [key, { file: `${key}/manifest.json`, bytes: 1, sha256: "0".repeat(64) }]));
  courses[legacy.courseKey] = descriptor;
  if (options.secondCourse) {
    const second = syntheticLegacy("class2-water");
    courses[second.courseKey] = compileCourse(root, second);
  }
  const legacyMetadata = writeJson(root, "legacy-release-metadata.json", { synthetic: true });
  writeJson(root, "registry.json", { format: "interactive-engine-v1", version: "release-v1", legacyMetadata, courses });
  return { root, legacy, records };
}
export function changeManifest(root: string, change: (manifest: any) => void) {
  const registry = JSON.parse(readFileSync(join(root, "registry.json"), "utf8"));
  const file = registry.courses["class1-water"].file;
  const manifest = JSON.parse(readFileSync(join(root, file), "utf8"));
  change(manifest);
  registry.courses["class1-water"] = writeJson(root, file, manifest);
  writeJson(root, "registry.json", registry);
}
