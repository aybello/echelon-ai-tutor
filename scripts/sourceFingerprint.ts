import { createHash } from "node:crypto";
import { lstatSync, readFileSync, readdirSync, realpathSync } from "node:fs";
import { resolve } from "node:path";

/** Versioned functional source contract, not a Git commit or approval assertion. */
const SOURCE_DIRECTORIES = new Set([
  "client",
  "server",
  "shared",
  "scripts",
  "drizzle",
  "patches",
  "config",
  "configs",
  "content",
  "attached_assets",
  "public",
  "vendor",
]);
const ROOT_FILES = new Set([
  "package.json",
  "pnpm-lock.yaml",
  "pnpm-workspace.yaml",
  "components.json",
  ".npmrc",
  ".pnpmfile.cjs",
  ".pnpmfile.mjs",
  "pnpmfile.cjs",
  "pnpmfile.mjs",
  ".nvmrc",
  ".node-version",
  ".browserslistrc",
  ".babelrc",
  ".babelrc.json",
  ".babelrc.js",
  ".babelrc.cjs",
  ".babelrc.mjs",
  ".swcrc",
  ".postcssrc",
  ".postcssrc.json",
  ".postcssrc.yaml",
  ".postcssrc.yml",
  ".postcssrc.js",
  ".postcssrc.cjs",
  ".postcssrc.mjs",
]);
const EXCLUDED_NAMES = new Set([
  "node_modules",
  ".git",
  "dist",
  "build",
  "coverage",
  "test-results",
  "playwright-report",
  ".manus",
  ".manus-logs",
  "__manus__",
  ".webdev",
  ".project-config.json",
  ".pnpm-store",
  ".cache",
  ".vite",
  ".vite-temp",
  "logs",
  "tmp",
  "temp",
  "secrets",
  ".secrets",
]);
const REQUIRED_FILES = [
  "package.json",
  "pnpm-lock.yaml",
  "client/index.html",
  "server/_core/index.ts",
  "scripts/buildServer.ts",
];
const REQUIRED_DIRECTORIES = ["client", "server", "shared", "scripts"];

function excluded(part: string): boolean {
  return (
    EXCLUDED_NAMES.has(part) ||
    /^\.env(?:\.|$)/.test(part) ||
    /(?:\.log|\.tsbuildinfo|\.pem|\.key|\.p12|\.pfx)$/i.test(part)
  );
}

/** Also used to reject untracked functional source in a checkout, not root test outputs. */
export function isSourceFingerprintPath(path: string): boolean {
  const parts = path.split("/");
  if (
    parts.some(part => !part || part === "." || part === ".." || excluded(part))
  )
    return false;
  if (parts.length > 1) return SOURCE_DIRECTORIES.has(parts[0]);
  return (
    SOURCE_DIRECTORIES.has(path) ||
    ROOT_FILES.has(path) ||
    /^tsconfig(?:\.[^.]+)*\.json$/.test(path) ||
    /(?:^|\.)config\.(?:[cm]?[jt]s|json|ya?ml)$/.test(path) ||
    /\.(?:[cm]?[jt]sx?|html|css|scss)$/.test(path)
  );
}

/** Bytewise-sorted POSIX relative paths; never follows source symlinks. */
export function sourceFingerprintFiles(root = process.cwd()): string[] {
  const sourceRoot = realpathSync(root);
  const files: string[] = [];
  function visit(path: string) {
    if (!isSourceFingerprintPath(path)) return;
    const stat = lstatSync(resolve(sourceRoot, path));
    // Reject even in-root symlinks: neither host state nor an escape can enter the digest.
    if (stat.isSymbolicLink())
      throw new Error(`Source fingerprint rejects symlink: ${path}`);
    if (stat.isDirectory()) {
      for (const name of readdirSync(resolve(sourceRoot, path)))
        visit(`${path}/${name}`);
    } else if (stat.isFile()) {
      files.push(path);
    } else {
      throw new Error(`Source fingerprint requires regular files: ${path}`);
    }
  }
  for (const name of readdirSync(sourceRoot)) visit(name);
  files.sort((a, b) =>
    Buffer.compare(Buffer.from(a, "utf8"), Buffer.from(b, "utf8"))
  );
  for (const required of REQUIRED_FILES) {
    if (!files.includes(required))
      throw new Error(
        `Incomplete functional source archive: missing ${required}`
      );
  }
  for (const directory of REQUIRED_DIRECTORIES) {
    if (!files.some(file => file.startsWith(`${directory}/`))) {
      throw new Error(
        `Incomplete functional source archive: missing ${directory} source`
      );
    }
  }
  return files;
}

/**
 * SHA256(domain || uint64be(path byte length) || UTF8 POSIX path ||
 * uint64be(file byte length) || raw file bytes, repeated in bytewise path order).
 * No absolute path, mtime, secret/local metadata, dependency tree or build output.
 */
export function computeSourceFingerprint(root = process.cwd()): string {
  const sourceRoot = realpathSync(root);
  const files = sourceFingerprintFiles(sourceRoot);
  const hash = createHash("sha256").update(
    "echelon-functional-source-sha256-v1\0"
  );
  const length = (size: number) => {
    const bytes = Buffer.alloc(8);
    bytes.writeBigUInt64BE(BigInt(size));
    return bytes;
  };
  for (const path of files) {
    const absolute = resolve(sourceRoot, path);
    if (!lstatSync(absolute).isFile())
      throw new Error(`Source file changed during fingerprint: ${path}`);
    const name = Buffer.from(path, "utf8");
    const bytes = readFileSync(absolute);
    hash
      .update(length(name.length))
      .update(name)
      .update(length(bytes.length))
      .update(bytes);
  }
  return hash.digest("hex");
}
