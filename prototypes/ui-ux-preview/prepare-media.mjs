import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

// Test-only originals stay in temporary storage, never in the app/public build.
const output = path.resolve(process.argv[2] ?? "/tmp/echelon-preview-media");
const sources = JSON.parse(await readFile(new URL("./media-sources.json", import.meta.url), "utf8"));
await mkdir(output, { recursive: true });
const manifest = [];
for (const asset of sources) {
  const bytes = execFileSync("git", ["show", `${asset.sha}:${asset.source}`], { maxBuffer: 20 * 1024 * 1024 });
  if (createHash("sha256").update(bytes).digest("hex") !== asset.sha256) {
    throw new Error("Pinned preview media checksum mismatch");
  }
  const original = path.join(output, path.basename(asset.storagePath));
  await writeFile(original, bytes);
  manifest.push({ storagePath: asset.storagePath, original });
}
await writeFile(path.join(output, "assets.json"), JSON.stringify(manifest, null, 2) + "\n");
console.log(`Prepared ${manifest.length} byte-verified preview images in ${output}`);
