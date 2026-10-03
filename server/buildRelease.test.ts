import { describe, expect, it } from "vitest";
import { execFileSync } from "node:child_process";
import {
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { build } from "esbuild";
import {
  archiveReleaseSha,
  buildReleaseId,
  buildReleaseIdentity,
} from "../scripts/buildServer";
import { computeSourceFingerprint } from "../scripts/sourceFingerprint";
import { assertProductionRelease } from "./release";
const sha = "a".repeat(40);
const fingerprint = "c".repeat(64);
const archive = () => {
  throw Error("No .git in source archive");
};
const absent = () => {
  throw Object.assign(Error("Missing manifest"), { code: "ENOENT" });
};
const digest = () => fingerprint;
const cleanGit = (args: string[]) => (args[0] === "rev-parse" ? sha : "");
const manifest = () => JSON.stringify({ version: 1, commit: sha, clean: true });

function put(root: string, path: string, bytes: string) {
  mkdirSync(dirname(join(root, path)), { recursive: true });
  writeFileSync(join(root, path), bytes);
}

describe("build release provenance", () => {
  it("uses actual clean checkout identity rather than stale valid environment labels", () => {
    expect(
      buildReleaseIdentity(cleanGit, { BUILD_COMMIT_SHA: "b".repeat(40) })
    ).toEqual({ release: sha, releaseKind: "git-commit" });
    expect(buildReleaseId(cleanGit, { GITHUB_SHA: "b".repeat(40) })).toBe(sha);
    expect(() =>
      buildReleaseId(
        args => (args[0] === "rev-parse" ? sha : " M server/release.ts"),
        {}
      )
    ).toThrow("clean");
    expect(
      buildReleaseIdentity(
        args => (args[0] === "rev-parse" ? sha : " M server/release.ts"),
        { BUILD_ARTIFACT_MODE: "development" }
      )
    ).toEqual({ release: `${sha}-dirty`, releaseKind: "development" });
    expect(() =>
      buildReleaseId(() => "malformed", { BUILD_COMMIT_SHA: sha })
    ).toThrow("HEAD");
  });

  it("preserves explicit trusted manifest identity with exact agreement for every supplied commit", () => {
    expect(
      buildReleaseIdentity(
        archive,
        { BUILD_COMMIT_SHA: sha.toUpperCase() },
        manifest,
        digest
      )
    ).toEqual({ release: sha, releaseKind: "git-commit" });
    expect(buildReleaseId(archive, { GITHUB_SHA: sha }, manifest, digest)).toBe(
      sha
    );
    expect(buildReleaseId(archive, {}, manifest, digest)).toBe(sha);
    expect(() =>
      buildReleaseId(archive, { GITHUB_SHA: "b".repeat(40) }, manifest, digest)
    ).toThrow("mismatch");
    expect(() =>
      buildReleaseId(
        archive,
        { BUILD_COMMIT_SHA: sha, GITHUB_SHA: "b".repeat(40) },
        manifest,
        digest
      )
    ).toThrow("mismatch");
    for (const invalid of [
      "not-json",
      "null",
      JSON.stringify({ version: 1, commit: sha, clean: false }),
      JSON.stringify({ version: 1, commit: "abcde", clean: true }),
    ]) {
      expect(() =>
        buildReleaseId(archive, {}, () => invalid, digest)
      ).toThrow();
    }
    expect(() =>
      archiveReleaseSha(
        JSON.stringify({ version: 2, commit: sha, clean: true })
      )
    ).toThrow("Invalid");
    expect(() =>
      buildReleaseId(
        archive,
        { BUILD_RELEASE_FILE: "explicit-missing.json" },
        absent,
        digest
      )
    ).toThrow("explicit");
    expect(() =>
      buildReleaseId(
        archive,
        {},
        () => {
          throw Object.assign(Error("denied"), { code: "EACCES" });
        },
        digest
      )
    ).toThrow("provenance");
  });

  it("handles the actual managed archive without release.json or valid LAST_COMMIT_HASH", () => {
    const expected = { release: fingerprint, releaseKind: "source-sha256" };
    expect(
      buildReleaseIdentity(
        archive,
        { LAST_COMMIT_HASH: "5char", NODE_ENV: "production" },
        absent,
        digest
      )
    ).toEqual(expected);
    // Neither full valid environmental label is allowed to claim the archive as a Git commit.
    expect(
      buildReleaseIdentity(
        archive,
        { BUILD_COMMIT_SHA: sha, GITHUB_SHA: "b".repeat(40) },
        absent,
        digest
      )
    ).toEqual(expected);
    expect(buildReleaseId(archive, {}, absent, digest)).toBe(fingerprint);
    let calls = 0;
    expect(
      buildReleaseIdentity(archive, {}, absent, () => {
        calls += 1;
        return fingerprint;
      })
    ).toEqual(expected);
    expect(calls).toBe(1);
    expect(() => buildReleaseId(archive, {}, absent, () => "unknown")).toThrow(
      "fingerprint"
    );
    for (const key of ["BUILD_COMMIT_SHA", "GITHUB_SHA"]) {
      expect(() =>
        buildReleaseId(archive, { [key]: "abcde" }, absent, digest)
      ).toThrow("full hexadecimal");
      expect(() => buildReleaseId(cleanGit, { [key]: "not-a-commit" })).toThrow(
        "full hexadecimal"
      );
    }
  });

  it("rejects unknown, dirty and malformed production identity and requires explicit kind", () => {
    for (const invalid of [
      "unknown",
      "development-unversioned",
      `${sha}-dirty`,
      "",
      "1".repeat(39),
    ]) {
      expect(() =>
        assertProductionRelease(
          invalid,
          { NODE_ENV: "production" },
          "git-commit"
        )
      ).toThrow("immutable");
    }
    expect(() =>
      assertProductionRelease(sha, { NODE_ENV: "production" }, "git-commit")
    ).not.toThrow();
    expect(() =>
      assertProductionRelease(
        fingerprint,
        { NODE_ENV: "production" },
        "source-sha256"
      )
    ).not.toThrow();
    // SHA256 Git repositories are distinguishable only by the explicit kind, never length.
    expect(() =>
      assertProductionRelease(
        fingerprint,
        { NODE_ENV: "production" },
        "git-commit"
      )
    ).not.toThrow();
    expect(() =>
      assertProductionRelease(sha, { NODE_ENV: "production" }, "source-sha256")
    ).toThrow("immutable");
    for (const kind of ["unknown", "development"] as const)
      expect(() =>
        assertProductionRelease(
          fingerprint,
          { DEPLOYMENT_ENV: "production" },
          kind
        )
      ).toThrow("immutable");
    expect(() =>
      assertProductionRelease(sha, { NODE_ENV: "production" })
    ).toThrow("kind");
    expect(() =>
      buildReleaseId(
        archive,
        { NODE_ENV: "production", BUILD_ARTIFACT_MODE: "development" },
        absent,
        digest
      )
    ).toThrow("Development");
    expect(() =>
      buildReleaseId(
        archive,
        { DEPLOYMENT_ENV: "production", BUILD_ARTIFACT_MODE: "development" },
        absent,
        digest
      )
    ).toThrow("Development");
    expect(() =>
      buildReleaseId(
        archive,
        { BUILD_ARTIFACT_MODE: "release-ish" },
        absent,
        digest
      )
    ).toThrow("Unknown");
  });

  it("preserves explicit development/test unversioned behavior without claiming a serving commit", () => {
    expect(
      buildReleaseIdentity(
        archive,
        { BUILD_ARTIFACT_MODE: "development" },
        absent,
        digest
      )
    ).toEqual({
      release: "development-unversioned",
      releaseKind: "development",
    });
    expect(() =>
      assertProductionRelease(
        "development-unversioned",
        { NODE_ENV: "test" },
        "development"
      )
    ).not.toThrow();
    expect(() =>
      buildReleaseId(
        archive,
        { BUILD_ARTIFACT_MODE: "development", GITHUB_SHA: "abcde" },
        absent,
        digest
      )
    ).toThrow("full hexadecimal");
    expect(() =>
      buildReleaseId(
        archive,
        {
          BUILD_ARTIFACT_MODE: "development",
          BUILD_RELEASE_FILE: "missing.json",
        },
        absent,
        digest
      )
    ).toThrow("explicit");
  });

  it("checks real tracked Git state, untracked source, exported bytes and incomplete archives", () => {
    const root = mkdtempSync(join(tmpdir(), "echelon-release-fixture-"));
    const exported = mkdtempSync(join(tmpdir(), "echelon-release-archive-"));
    const empty = mkdtempSync(join(tmpdir(), "echelon-release-empty-"));
    const readGit = (args: string[]) =>
      execFileSync("git", ["-C", root, ...args], {
        encoding: "utf8",
        stdio: ["ignore", "pipe", "ignore"],
      });
    try {
      readGit(["init", "--quiet"]);
      // An unborn checkout is not silently treated as a production source archive.
      expect(() => buildReleaseId(readGit, {}, absent, digest)).toThrow("HEAD");
      for (const [path, bytes] of Object.entries({
        "package.json": '{"private":true,"type":"module"}\n',
        "pnpm-lock.yaml": "lockfileVersion: '9.0'\n",
        "client/index.html": "<main>synthetic fixture</main>\n",
        "server/_core/index.ts": "export const fixture = true;\n",
        "shared/fixture.ts": "export type Fixture = boolean;\n",
        "scripts/buildServer.ts": "export {};\n",
        "vite.config.ts": "export default {};\n",
        "drizzle/schema.ts": "export {};\n",
        "patches/fixture.patch": "synthetic patch\n",
        ".gitignore":
          "node_modules/\ndist/\n.env*\n.project-config.json\nserver/ignored-source.ts\n",
      }))
        put(root, path, bytes);
      readGit(["add", "."]);
      readGit([
        "-c",
        "user.name=Audit Fixture",
        "-c",
        "user.email=fixture@example.test",
        "-c",
        "commit.gpgsign=false",
        "commit",
        "--quiet",
        "-m",
        "Synthetic release fixture",
      ]);
      const actual = readGit(["rev-parse", "HEAD"]).trim();
      put(root, "test-output.txt", "not release source\n");
      put(root, ".project-config.json", '{"syntheticPrivateMetadata":true}\n');
      put(root, ".env", "SYNTHETIC_SECRET=never-exported\n");
      put(root, "node_modules/synthetic/index.js", "installed dependency\n");
      put(root, "dist/index.js", "generated server bundle\n");
      expect(buildReleaseId(readGit, { GITHUB_SHA: sha })).toBe(actual);
      const tar = execFileSync("git", ["-C", root, "archive", "HEAD"]);
      const names = execFileSync("tar", ["-tf", "-"], {
        input: tar,
        encoding: "utf8",
      }).split("\n");
      expect(names).not.toContain("release.json");
      expect(names).not.toContain(".env");
      expect(names).not.toContain(".project-config.json");
      execFileSync("tar", ["-xf", "-", "-C", exported], { input: tar });
      const sourceHash = computeSourceFingerprint(root);
      expect(computeSourceFingerprint(exported)).toBe(sourceHash);
      expect(
        buildReleaseIdentity(
          archive,
          { LAST_COMMIT_HASH: "abcde" },
          absent,
          () => computeSourceFingerprint(exported)
        )
      ).toEqual({ release: sourceHash, releaseKind: "source-sha256" });
      const releaseManifest = join(exported, "release.json");
      writeFileSync(
        releaseManifest,
        JSON.stringify({ version: 1, commit: actual, clean: true })
      );
      expect(
        buildReleaseId(archive, { GITHUB_SHA: actual }, () =>
          readFileSync(releaseManifest, "utf8")
        )
      ).toBe(actual);
      put(root, "server/untracked.ts", "export const added = true;\n");
      expect(() => buildReleaseId(readGit, {})).toThrow("clean");
      rmSync(join(root, "server/untracked.ts"));
      put(root, "server/untracked-directory/source.ts", "export {};\n");
      expect(() => buildReleaseId(readGit, {})).toThrow("clean");
      rmSync(join(root, "server/untracked-directory"), { recursive: true });
      put(root, "server/ignored-source.ts", "export const ignored = true;\n");
      expect(
        readGit(["status", "--porcelain", "--untracked-files=no"]).trim()
      ).toBe("");
      expect(() => buildReleaseId(readGit, {})).toThrow("clean");
      rmSync(join(root, "server/ignored-source.ts"));
      put(root, "server/_core/index.ts", "export const fixture = false;\n");
      expect(() => buildReleaseId(readGit, {})).toThrow("clean");
      readGit(["add", "server/_core/index.ts"]);
      expect(() => buildReleaseId(readGit, {})).toThrow("clean");
      expect(() =>
        buildReleaseId(archive, {}, absent, () =>
          computeSourceFingerprint(empty)
        )
      ).toThrow("Incomplete");
    } finally {
      for (const path of [root, exported, empty])
        rmSync(path, { recursive: true, force: true });
    }
  });

  it("runs the default build resolver from an actual manifest-free archive cwd", () => {
    const root = mkdtempSync(join(tmpdir(), "echelon-default-archive-"));
    try {
      for (const [path, bytes] of Object.entries({
        "package.json": '{"type":"module"}\n',
        "pnpm-lock.yaml": "lockfileVersion: '9.0'\n",
        "client/index.html": "<main>fixture</main>\n",
        "server/_core/index.ts": "export {};\n",
        "shared/fixture.ts": "export {};\n",
        "scripts/buildServer.ts": "export {};\n",
      }))
        put(root, path, bytes);
      const verifier = join(process.cwd(), "scripts/buildServer.ts");
      const tsx = join(process.cwd(), "node_modules/tsx/dist/loader.mjs");
      const run = () =>
        JSON.parse(
          execFileSync(
            process.execPath,
            [
              "--import",
              tsx,
              "--input-type=module",
              "--eval",
              `const { buildReleaseIdentity } = await import(${JSON.stringify(verifier)}); console.log(JSON.stringify(buildReleaseIdentity()));`,
            ],
            {
              cwd: root,
              encoding: "utf8",
              env: {
                PATH: process.env.PATH,
                NODE_ENV: "production",
                LAST_COMMIT_HASH: "abcde",
              },
            }
          )
        );
      expect(run()).toEqual({
        release: computeSourceFingerprint(root),
        releaseKind: "source-sha256",
      });
      put(root, "shared/fixture.ts", "export const mutation = true;\n");
      expect(run().release).toBe(computeSourceFingerprint(root));
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it("embeds immutable identity and explicit kind in production health, not runtime labels/files", async () => {
    for (const [release, releaseKind] of [
      [sha, "git-commit"],
      [fingerprint, "source-sha256"],
      [fingerprint, "git-commit"],
    ]) {
      const result = await build({
        entryPoints: ["server/release.ts"],
        bundle: true,
        platform: "node",
        format: "esm",
        write: false,
        define: {
          __BUILD_RELEASE_ID__: JSON.stringify(release),
          __BUILD_RELEASE_KIND__: JSON.stringify(releaseKind),
        },
      });
      const code = `${result.outputFiles[0].text}\nconsole.log(JSON.stringify(publicReleaseHealth()));`;
      const health = JSON.parse(
        execFileSync(
          process.execPath,
          ["--input-type=module", "--eval", code],
          {
            encoding: "utf8",
            env: {
              NODE_ENV: "production",
              BUILD_COMMIT_SHA: "b".repeat(40),
              LAST_COMMIT_HASH: "abcde",
              RELEASE_KIND: "pretend-commit",
              BUILD_RELEASE_FILE: "/synthetic-missing/release.json",
            },
          }
        )
      );
      expect(health.release).toBe(release);
      expect(health.releaseKind).toBe(releaseKind);
      expect(Object.keys(health).sort()).toEqual([
        "capabilities",
        "release",
        "releaseKind",
        "status",
        "ts",
      ]);
      expect(code).not.toContain("sourceFingerprint");
      expect(code).not.toContain("node:child_process");
    }
  });

  it("executes the normal production server build from a real manifest-free Git archive", () => {
    const checkout = mkdtempSync(join(tmpdir(), "echelon-build-checkout-"));
    const exported = mkdtempSync(join(tmpdir(), "echelon-build-archive-"));
    const git = (args: string[]) =>
      execFileSync("git", ["-C", checkout, ...args], {
        stdio: ["ignore", "pipe", "pipe"],
      });
    try {
      for (const [path, bytes] of Object.entries({
        "package.json": '{"type":"module"}\n',
        "pnpm-lock.yaml": "lockfileVersion: '9.0'\n",
        "client/index.html": "<main>synthetic fixture</main>\n",
        "shared/fixture.ts": "export {};\n",
        "server/_core/index.ts":
          'import {publicReleaseHealth} from "../release"; console.log(JSON.stringify(publicReleaseHealth()));\n',
      }))
        put(checkout, path, bytes);
      for (const path of [
        "scripts/buildServer.ts",
        "scripts/sourceFingerprint.ts",
        "server/release.ts",
      ]) {
        put(checkout, path, readFileSync(path, "utf8"));
      }
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
        "Synthetic managed server build",
      ]);
      execFileSync("tar", ["-xf", "-", "-C", exported], {
        input: git(["archive", "HEAD"]),
      });
      const expected = computeSourceFingerprint(checkout);
      expect(computeSourceFingerprint(exported)).toBe(expected);
      // Model already-installed pinned build dependencies, not source. No install/provider call.
      symlinkSync(
        join(process.cwd(), "node_modules"),
        join(exported, "node_modules")
      );
      execFileSync(
        process.execPath,
        [
          "--import",
          join(process.cwd(), "node_modules/tsx/dist/loader.mjs"),
          "scripts/buildServer.ts",
        ],
        {
          cwd: exported,
          env: {
            PATH: process.env.PATH,
            NODE_ENV: "production",
            LAST_COMMIT_HASH: "abcde",
          },
          stdio: ["ignore", "pipe", "pipe"],
        }
      );
      expect(computeSourceFingerprint(exported)).toBe(expected);
      put(
        exported,
        "shared/fixture.ts",
        "export const changedAfterBuild = true;\n"
      );
      expect(computeSourceFingerprint(exported)).not.toBe(expected);
      const health = JSON.parse(
        execFileSync(process.execPath, ["dist/index.js"], {
          cwd: exported,
          encoding: "utf8",
          env: {
            NODE_ENV: "production",
            BUILD_COMMIT_SHA: "b".repeat(40),
            LAST_COMMIT_HASH: "changed",
          },
        })
      );
      expect(health).toMatchObject({
        status: "ok",
        release: expected,
        releaseKind: "source-sha256",
      });
    } finally {
      for (const path of [checkout, exported])
        rmSync(path, { recursive: true, force: true });
    }
  });
});
