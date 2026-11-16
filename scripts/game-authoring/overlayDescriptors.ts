import { createHash } from "node:crypto";
import { readFileSync, writeFileSync } from "node:fs";
import { resolve, basename } from "node:path";
import { pathToFileURL } from "node:url";
import { OVERLAY_DESCRIPTORS } from "../../server/interactiveContent/engine/overlayDescriptors";
import { readOverlayDocument, enumerateOverlayDocuments, resolveOverlayRoot, type OverlayDescriptor } from "../../server/interactiveContent/engine/overlayFiles";
import { compileOverlays, type ContentOverlay } from "../../server/interactiveContent/engine/overlay";
const output = "server/interactiveContent/engine/overlayDescriptors.ts";
export function descriptorFor(file: string, bytes: Buffer): OverlayDescriptor {
  if (!/^[a-z0-9][a-z0-9-]*\.json$/.test(file)) throw new Error("Invalid registered overlay filename");
  const doc = JSON.parse(bytes.toString("utf8")) as ContentOverlay;
  compileOverlays([doc]);
  return { file, sha256: createHash("sha256").update(bytes).digest("hex"), bytes: bytes.length, courses: [...new Set([...doc.additions, ...doc.replacements].map(e => e.courseKey))].sort() };
}
export function writeDescriptors(descriptors: readonly OverlayDescriptor[]) {
  writeFileSync(output, `// Explicit registration order. Regenerate metadata only for these approved filenames.\nexport const OVERLAY_DESCRIPTORS = ${JSON.stringify(descriptors, null, 2)} as const;\n`);
}
/** Called only after exact-payload review, destination and combined duplicate checks. */
export function registerDescriptor(outFile: string, doc: ContentOverlay) {
  const file = basename(outFile);
  if (resolve(outFile) !== resolve(resolveOverlayRoot(), file)) throw new Error("Publication requires fixed private overlay directory");
  const descriptor = descriptorFor(file, readFileSync(outFile));
  const verified = readOverlayDocument(resolveOverlayRoot(), descriptor) as ContentOverlay;
  if (verified.overlayId !== doc.overlayId) throw new Error("Overlay publication mismatch");
  const existing = OVERLAY_DESCRIPTORS.find(d => d.file === file);
  if (existing && JSON.stringify(existing) !== JSON.stringify(descriptor)) throw new Error("Changed registered descriptor");
  if (!existing) writeDescriptors([...OVERLAY_DESCRIPTORS.map(d => ({ ...d, courses: [...d.courses] })), descriptor]);
}
export function validateCommittedOverlays() {
  const overlayIds = new Set<string>();
  const claimed = new Set<string>();
  for (const raw of enumerateOverlayDocuments()) {
    compileOverlays([raw], undefined, doc => {
      if (overlayIds.has(doc.overlayId)) throw new Error("Duplicate committed overlay ID");
      overlayIds.add(doc.overlayId);
      const claim = (key: string) => { if (claimed.has(key)) throw new Error(`Duplicate committed overlay item ${key}`); claimed.add(key); };
      for (const entry of [...doc.additions, ...doc.replacements]) claim(`${entry.courseKey}/${entry.example.id}`);
      for (const entry of doc.replacements) claim(`${entry.courseKey}/replaces:${entry.replacesId}`);
    });
  }
}
if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  const args = process.argv.slice(2);
  if (args.length !== 1 || !["--check", "--write"].includes(args[0])) throw new Error("Usage: overlayDescriptors.ts --check|--write");
  const generated = OVERLAY_DESCRIPTORS.map(d => descriptorFor(d.file, readFileSync(resolve(resolveOverlayRoot(), d.file))));
  if (args[0] === "--write") writeDescriptors(generated);
  else if (JSON.stringify(generated) !== JSON.stringify(OVERLAY_DESCRIPTORS)) throw new Error("Stale overlay descriptors");
  validateCommittedOverlays();
  console.log(`Validated ${generated.length} explicitly registered overlay documents`);
}
