import { readFileSync } from "node:fs";
import { historicalCeuPresentationSource } from "../../ceu/historicalPresentationBaseline";

/**
 * Historical publication fixtures pin the pre-external-assets authoring tool.
 * Project ONLY the two declared descriptor-publication additions out of today's
 * source. All checker, review, destination and duplicate-validation bytes remain
 * protected by the original fixture SHA256 (not a newly accepted tool hash).
 * Current runtime behavior and publisher registration have separate regressions.
 */
export function historicalAuthoringBytes(path: string): Buffer {
  const bytes = readFileSync(path);
  if (path === "client/src/pages/ContinuingEducationCourse.css") {
    return Buffer.from(historicalCeuPresentationSource(path, bytes.toString("utf8")));
  }
  if (path !== "scripts/game-authoring/build.ts") return bytes;
  let source = bytes.toString("utf8");
  for (const addition of [
    'import { registerDescriptor } from "./overlayDescriptors";\n',
    'registerDescriptor(outFile, reviewed); ',
  ]) {
    if (source.split(addition).length !== 2) throw new Error("Historical builder projection requires the exact declared publisher hook");
    source = source.replace(addition, "");
  }
  return Buffer.from(source);
}
