import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";

/** Only test fixtures; the client continues to request its managed-storage URLs. */
export function decodeTrustedLogos(fixtures, organizations) {
  if (fixtures.length !== organizations.length) {
    throw new Error("Trusted logo fixtures must cover every organization");
  }
  const seen = new Set();
  return fixtures.map(asset => {
    const organization = organizations.find(item => item.runtimeUrl === asset.storagePath);
    if (!organization || organization.logoDisplayAllowed !== true || seen.has(asset.storagePath)
      || !/^\/manus-storage\/[\w-]+\.(png|svg)$/.test(asset.storagePath)
      || !["png", "svg"].includes(asset.extension)
      || path.extname(asset.storagePath) !== `.${asset.extension}`
      || !/^[a-f0-9]{64}$/.test(asset.sha256) || asset.sha256 !== organization.sha256) {
      throw new Error("Trusted logo fixture does not match the approved client manifest");
    }
    seen.add(asset.storagePath);
    const bytes = Buffer.from(asset.base64, "base64");
    if (!bytes.length || bytes.toString("base64") !== asset.base64
      || createHash("sha256").update(bytes).digest("hex") !== asset.sha256) {
      throw new Error("Trusted logo fixture checksum mismatch");
    }
    return { storagePath: asset.storagePath, bytes };
  });
}

export async function prepareMedia(output) {
  const sources = JSON.parse(await readFile(new URL("./media-sources.json", import.meta.url), "utf8"));
  const fixtures = JSON.parse(await readFile(new URL("./fixtures/trusted-logos.json", import.meta.url), "utf8"));
  const organizations = JSON.parse(await readFile(new URL("../../client/src/lib/trustedOrganizations.json", import.meta.url), "utf8"));
  const logos = decodeTrustedLogos(fixtures, organizations);
  // Test-only originals stay in temporary storage, never in the app/public build.
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
  for (const asset of logos) {
    if (manifest.some(item => item.storagePath === asset.storagePath)) {
      throw new Error("Duplicate preview media path");
    }
    const original = path.join(output, path.basename(asset.storagePath));
    await writeFile(original, asset.bytes);
    manifest.push({ storagePath: asset.storagePath, original });
  }
  await writeFile(path.join(output, "assets.json"), JSON.stringify(manifest, null, 2) + "\n");
  console.log(`Prepared ${manifest.length} byte-verified preview images in ${output}`);
  return manifest;
}

if (process.argv[1] && pathToFileURL(path.resolve(process.argv[1])).href === import.meta.url) {
  await prepareMedia(path.resolve(process.argv[2] ?? "/tmp/echelon-preview-media"));
}
