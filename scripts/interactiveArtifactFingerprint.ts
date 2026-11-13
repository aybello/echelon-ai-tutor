import { createHash } from "node:crypto";
import { constants, closeSync, fstatSync, lstatSync, openSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";

/** Private answer-derived identity, not an approval, signature, or source identity. */
export function computeInteractiveArtifactFingerprint(root: string): string {
  const base = resolve(root);
  const files: string[] = [];
  const visit = (relative: string) => {
    const path = relative ? join(base, relative) : base;
    const stat = lstatSync(path);
    if (stat.isSymbolicLink()) throw new Error("Invalid interactive artifact tree");
    if (stat.isDirectory()) {
      for (const name of readdirSync(path)) visit(relative ? `${relative}/${name}` : name);
    } else if (stat.isFile() && relative) {
      files.push(relative);
    } else throw new Error("Invalid interactive artifact tree");
  };
  visit("");
  if (!files.includes("registry.json")) throw new Error("Incomplete interactive artifact tree");
  files.sort((a, b) => Buffer.compare(Buffer.from(a), Buffer.from(b)));
  const hash = createHash("sha256").update("echelon-interactive-artifact-sha256-v1\0");
  const length = (n: number) => {
    const b = Buffer.alloc(8);
    b.writeBigUInt64BE(BigInt(n));
    return b;
  };
  for (const file of files) {
    const fd = openSync(join(base, file), constants.O_RDONLY | constants.O_NOFOLLOW);
    try {
      const stat = fstatSync(fd);
      if (!stat.isFile()) throw new Error("Invalid interactive artifact tree");
      const bytes = readFileSync(fd);
      if (bytes.length !== stat.size) throw new Error("Interactive artifact changed during fingerprint");
      const name = Buffer.from(file, "utf8");
      hash.update(length(name.length)).update(name).update(length(bytes.length)).update(bytes);
    } finally { closeSync(fd); }
  }
  return hash.digest("hex");
}

/** Call only after copying the final tree; never serve or log this manifest. */
export function writeInteractiveArtifactManifest(root: string, manifestPath: string): void {
  const fingerprint = computeInteractiveArtifactFingerprint(root);
  writeFileSync(manifestPath, `${JSON.stringify({ version: 1, kind: "interactive-artifact-sha256-v1", sha256: fingerprint })}\n`, { mode: 0o600, flag: "wx" });
}
