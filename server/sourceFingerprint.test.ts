import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import {
  mkdirSync,
  mkdtempSync,
  readFileSync,
  renameSync,
  rmSync,
  symlinkSync,
  utimesSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  computeSourceFingerprint,
  isSourceFingerprintPath,
  sourceFingerprintFiles,
} from "../scripts/sourceFingerprint";

function put(root: string, path: string, content: string | Buffer) {
  mkdirSync(dirname(join(root, path)), { recursive: true });
  writeFileSync(join(root, path), content);
}

/**
 * Delete a temporary tree without letting cleanup fail the test run.
 *
 * These fixtures contain a full git checkout. On CI a git child process can
 * still be releasing file handles while rmSync walks the directory, which
 * surfaces as ENOTEMPTY and fails a release for a reason that has nothing to
 * do with the fingerprint contract being tested. Retry briefly, then give up
 * quietly: the operating system reclaims the temp directory regardless.
 */
function removeTempTree(path: string) {
  for (let attempt = 0; attempt < 5; attempt += 1) {
    try {
      rmSync(path, { recursive: true, force: true, maxRetries: 5, retryDelay: 50 });
      return;
    } catch {
      // Retry; a transient handle may still be open.
    }
  }
}
function sourceFixture(root: string) {
  for (const [path, bytes] of Object.entries({
    "package.json":
      '{"private":true,"type":"module","scripts":{"build":"synthetic"}}\n',
    "pnpm-lock.yaml": "lockfileVersion: '9.0'\n",
    "pnpm-workspace.yaml": "packages: []\n",
    "client/index.html": "<main>synthetic fixture</main>\n",
    "client/src/app.ts": "export const client = 'fixture';\n",
    "server/_core/index.ts": "export const server = 'fixture';\n",
    "shared/types.ts": "export type Fixture = string;\n",
    "scripts/buildServer.ts": "export const build = 'fixture';\n",
    "drizzle/schema.ts": "export const schema = 'fixture';\n",
    "patches/fixture.patch": "synthetic dependency patch\n",
    "config/runtime.json": '{"fixture":true}\n',
    "vite.config.ts": "export default {};\n",
    "tsconfig.json": '{"compilerOptions":{}}\n',
    ".npmrc": "engine-strict=true\n",
    ".gitignore":
      "node_modules/\ndist/\n.env*\n.project-config.json\n.manus/\nclient/public/__manus__/\n",
  }))
    put(root, path, bytes);
}

describe("functional source SHA256 contract", () => {
  it("matches a real clean Git checkout to git archive HEAD without metadata, secrets or outputs", () => {
    const checkout = mkdtempSync(join(tmpdir(), "echelon-source-checkout-"));
    const archive = mkdtempSync(join(tmpdir(), "echelon-source-archive-"));
    const git = (args: string[]) =>
      execFileSync("git", ["-C", checkout, ...args], {
        encoding: "utf8",
        stdio: ["ignore", "pipe", "ignore"],
      }).trim();
    try {
      sourceFixture(checkout);
      git(["init", "--quiet"]);
      git(["add", "."]);
      git([
        "-c",
        "user.name=Audit Fixture",
        "-c",
        "user.email=fixture@example.test",
        "-c",
        "commit.gpgsign=false",
        "commit",
        "--quiet",
        "-m",
        "Synthetic source fingerprint fixture",
      ]);
      put(checkout, ".env", "SYNTHETIC_SECRET=never-exported\n");
      put(
        checkout,
        ".project-config.json",
        '{"syntheticPrivateMetadata":true}\n'
      );
      put(checkout, "test-output.txt", "local test output\n");
      put(checkout, "dist/public/index.html", "generated output\n");
      put(
        checkout,
        "node_modules/synthetic/index.js",
        "installed dependency\n"
      );
      put(
        checkout,
        "client/public/__manus__/version.json",
        '{"checkpoint":"abcde"}\n'
      );
      const tar = execFileSync("git", ["-C", checkout, "archive", "HEAD"]);
      const names = execFileSync("tar", ["-tf", "-"], {
        input: tar,
        encoding: "utf8",
      }).split("\n");
      expect(names).not.toContain(".env");
      expect(names).not.toContain(".project-config.json");
      expect(names).not.toContain("node_modules/");
      expect(names).not.toContain("dist/");
      expect(names).not.toContain("release.json");
      execFileSync("tar", ["-xf", "-", "-C", archive], { input: tar });
      const digest = computeSourceFingerprint(checkout);
      expect(digest).toMatch(/^[a-f0-9]{64}$/);
      expect(computeSourceFingerprint(archive)).toBe(digest);
      const files = sourceFingerprintFiles(archive);
      expect(files).toEqual(
        [...files].sort((a, b) =>
          Buffer.compare(Buffer.from(a), Buffer.from(b))
        )
      );
      // Independently reconstruct the published domain and length-framing contract.
      const hash = createHash("sha256").update(
        "echelon-functional-source-sha256-v1\0"
      );
      for (const path of files) {
        const bytes = readFileSync(join(archive, path));
        for (const part of [Buffer.from(path, "utf8"), bytes]) {
          const length = Buffer.alloc(8);
          length.writeBigUInt64BE(BigInt(part.length));
          hash.update(length).update(part);
        }
      }
      expect(hash.digest("hex")).toBe(digest);
      for (const path of files) utimesSync(join(archive, path), 1, 1);
      expect(computeSourceFingerprint(archive)).toBe(digest);
      expect(git(["status", "--porcelain", "--untracked-files=no"])).toBe("");
    } finally {
      // Cleanup must never fail the run. On CI these directories hold a full
      // git checkout, and a lingering git process can still be releasing file
      // handles when rmSync walks the tree, producing a spurious ENOTEMPTY
      // that fails a release for a reason unrelated to the code under test.
      removeTempTree(checkout);
      removeTempTree(archive);
    }
  });

  it("covers functional source, assets, migrations, dependency pins, patches and every root build config", () => {
    const root = mkdtempSync(join(tmpdir(), "echelon-source-mutation-"));
    try {
      sourceFixture(root);
      for (const [path, bytes] of Object.entries({
        "client/public/logo.svg": "<svg/>\n",
        "content/fixture.json": "[]\n",
        "configs/runtime.yaml": "fixture: true\n",
        "public/icon.svg": "<svg/>\n",
        "attached_assets/icon.svg": "<svg/>\n",
        "vendor/runtime.js": "export {};\n",
        "postcss.config.cjs": "module.exports = {};\n",
        "tsconfig.scripts.json": "{}\n",
        "tailwind.config.ts": "export default {};\n",
        "components.json": "{}\n",
        "babel.config.json": "{}\n",
        "eslint.config.mjs": "export default [];\n",
      }))
        put(root, path, bytes);
      const files = sourceFingerprintFiles(root);
      const before = computeSourceFingerprint(root);
      for (const path of files) {
        const original = readFileSync(join(root, path));
        put(
          root,
          path,
          Buffer.concat([original, Buffer.from("\0synthetic mutation")])
        );
        expect(computeSourceFingerprint(root), path).not.toBe(before);
        put(root, path, original);
      }
      renameSync(
        join(root, "shared/types.ts"),
        join(root, "shared/renamed.ts")
      );
      expect(computeSourceFingerprint(root)).not.toBe(before);
    } finally {
      removeTempTree(root);
    }
  });

  it("ignores secret/local/platform metadata and generated files in any source subtree", () => {
    const root = mkdtempSync(join(tmpdir(), "echelon-source-exclusions-"));
    try {
      sourceFixture(root);
      const before = computeSourceFingerprint(root);
      for (const path of [
        ".env",
        ".env.production",
        ".project-config.json",
        ".manus/private.json",
        "dist/index.js",
        "build/index.js",
        "node_modules/synthetic.js",
        "test-output.txt",
        "test-results/report.json",
        "client/public/__manus__/version.json",
        "server/.env",
        "server/secrets/token.json",
        "server/private/local.pem",
        "scripts/run.log",
        "shared/types.tsbuildinfo",
      ])
        put(root, path, "synthetic ignored bytes\n");
      expect(computeSourceFingerprint(root)).toBe(before);
      expect(sourceFingerprintFiles(root).every(isSourceFingerprintPath)).toBe(
        true
      );
      expect(isSourceFingerprintPath("server/../private.txt")).toBe(false);
    } finally {
      removeTempTree(root);
    }
  });

  it("rejects empty/incomplete source and both in-root and escaping source symlinks", () => {
    const root = mkdtempSync(join(tmpdir(), "echelon-source-reject-"));
    try {
      expect(() => computeSourceFingerprint(root)).toThrow(
        "Incomplete functional source archive"
      );
      sourceFixture(root);
      symlinkSync("types.ts", join(root, "shared/link.ts"));
      expect(() => computeSourceFingerprint(root)).toThrow("symlink");
      rmSync(join(root, "shared/link.ts"));
      symlinkSync("../../outside.ts", join(root, "shared/link.ts"));
      expect(() => computeSourceFingerprint(root)).toThrow("symlink");
      rmSync(join(root, "shared/link.ts"));
      rmSync(join(root, "shared"), { recursive: true });
      expect(() => computeSourceFingerprint(root)).toThrow(
        "missing shared source"
      );
      symlinkSync("../outside", join(root, "shared"));
      expect(() => computeSourceFingerprint(root)).toThrow("symlink");
    } finally {
      removeTempTree(root);
    }
  });
});
