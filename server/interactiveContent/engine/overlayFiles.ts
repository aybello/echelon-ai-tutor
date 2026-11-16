import { createHash } from "node:crypto";
import { openSync, closeSync, readFileSync, fstatSync, lstatSync, realpathSync, constants } from "node:fs";
import { dirname, resolve, basename } from "node:path";
import { fileURLToPath } from "node:url";
import { z } from "zod";
import { OVERLAY_DESCRIPTORS } from "./overlayDescriptors";

const descriptorSchema = z.object({ file: z.string().regex(/^[a-z0-9][a-z0-9-]*\.json$/), sha256: z.string().regex(/^[a-f0-9]{64}$/), bytes: z.number().int().positive().max(16 * 1024 * 1024), courses: z.array(z.string().regex(/^[a-z0-9][a-z0-9-]{0,63}$/)).min(1) }).strict();
export type OverlayDescriptor = z.infer<typeof descriptorSchema>;
export const overlayDescriptors: readonly OverlayDescriptor[] = Object.freeze(z.array(descriptorSchema).parse(OVERLAY_DESCRIPTORS).map(d => Object.freeze(d)));
if (new Set(overlayDescriptors.map(d => d.file)).size !== overlayDescriptors.length) throw new Error("Duplicate overlay descriptor");
export function resolveOverlayRoot(moduleUrl = import.meta.url): string {
  const file = fileURLToPath(moduleUrl);
  if (/[/\\]server[/\\]interactiveContent[/\\]engine[/\\]overlayFiles\.(?:ts|js)$/.test(file)) return resolve(dirname(file), "../overlay");
  if (basename(file) === "index.js" && basename(dirname(file)) === "dist") return resolve(dirname(file), "interactive-content/overlays");
  throw new Error("Invalid overlay storage root");
}
export function overlayPath(root: string, descriptor: OverlayDescriptor): string {
  descriptorSchema.parse(descriptor);
  // Reject a substituted root and every parent, not just a symlink at the leaf.
  let parent = resolve(root);
  while (true) {
    if (lstatSync(parent).isSymbolicLink()) throw new Error("Invalid overlay path");
    const next = dirname(parent); if (next === parent) break; parent = next;
  }
  const path = resolve(root, descriptor.file);
  if (lstatSync(path).isSymbolicLink() || realpathSync(path) !== path) throw new Error("Invalid overlay path");
  return path;
}
export function overlayStamp(root: string, descriptor: OverlayDescriptor): string {
  const stat = lstatSync(overlayPath(root, descriptor));
  if (!stat.isFile() || stat.size !== descriptor.bytes) throw new Error("Invalid overlay size");
  return `${stat.dev}:${stat.ino}:${stat.size}:${stat.mtimeMs}:${stat.ctimeMs}`;
}
export function readOverlayDocument(root: string, descriptor: OverlayDescriptor): unknown {
  const fd = openSync(overlayPath(root, descriptor), constants.O_RDONLY | constants.O_NOFOLLOW);
  try {
    const stat = fstatSync(fd);
    if (!stat.isFile() || stat.size !== descriptor.bytes) throw new Error("Invalid overlay size");
    const bytes = readFileSync(fd);
    if (bytes.length !== descriptor.bytes || createHash("sha256").update(bytes).digest("hex") !== descriptor.sha256) throw new Error("Invalid overlay digest");
    const document = JSON.parse(bytes.toString("utf8"));
    const courses = [...new Set([...document.additions, ...document.replacements].map((entry: { courseKey: string }) => entry.courseKey))].sort();
    if (JSON.stringify(courses) !== JSON.stringify([...descriptor.courses].sort())) throw new Error("Invalid overlay course descriptor");
    return document;
  } finally { closeSync(fd); }
}
/** Explicit tooling-only enumeration. Runtime requests use the course store. */
export function* enumerateOverlayDocuments(root = resolveOverlayRoot()): IterableIterator<unknown> {
  for (const descriptor of overlayDescriptors) yield readOverlayDocument(root, descriptor);
}
