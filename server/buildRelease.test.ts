import { describe, expect, it } from "vitest";
import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { build } from "esbuild";
import { archiveReleaseSha, buildReleaseId } from "../scripts/buildServer";
import { assertProductionRelease } from "./release";
const sha = "a".repeat(40);
const archive = () => { throw Error("No .git in source archive"); };
const absent = () => { throw Object.assign(Error("Missing manifest"), { code: "ENOENT" }); };
describe("build release provenance", () => {
  it("uses the actual clean checkout instead of stale environment metadata", () => {
    expect(buildReleaseId(args => args[0] === "rev-parse" ? sha : "", { BUILD_COMMIT_SHA: "b".repeat(40) })).toBe(sha);
    expect(() => buildReleaseId(args => args[0] === "rev-parse" ? sha : " M server/release.ts", {})).toThrow("clean");
    expect(buildReleaseId(args => args[0] === "rev-parse" ? sha : " M server/release.ts", { BUILD_ARTIFACT_MODE: "development" })).toBe(`${sha}-dirty`);
    expect(buildReleaseId(args => {
      if (args[0] === "rev-parse") return sha;
      expect(args).toEqual(["status", "--porcelain", "--untracked-files=no"]);
      return "";
    }, {})).toBe(sha);
    expect(() => buildReleaseId(() => "malformed", { BUILD_COMMIT_SHA: sha })).toThrow("HEAD");
  });
  it("requires durable approved metadata and exact environment agreement for managed archives", () => {
    const manifest = () => JSON.stringify({ version: 1, commit: sha, clean: true });
    expect(buildReleaseId(archive, { BUILD_COMMIT_SHA: sha.toUpperCase() }, manifest)).toBe(sha);
    expect(buildReleaseId(archive, { GITHUB_SHA: sha }, manifest)).toBe(sha);
    expect(buildReleaseId(archive, {}, manifest)).toBe(sha);
    expect(() => buildReleaseId(archive, { GITHUB_SHA: "b".repeat(40) }, manifest)).toThrow("provenance");
    expect(() => buildReleaseId(archive, { BUILD_COMMIT_SHA: sha }, absent)).toThrow("provenance");
    expect(() => archiveReleaseSha(JSON.stringify({ version: 1, commit: sha, clean: false }))).toThrow("Invalid");
  });
  it("rejects unknown, dirty or malformed production provenance and never invents a SHA", () => {
    expect(() => buildReleaseId(archive, { BUILD_COMMIT_SHA: "not-a-commit" }, absent)).toThrow("full hexadecimal");
    expect(() => buildReleaseId(archive, {}, absent)).toThrow("provenance");
    expect(() => buildReleaseId(archive, { NODE_ENV: "production", BUILD_ARTIFACT_MODE: "development" }, absent)).toThrow("Development");
    for (const invalid of ["unknown", "development-unversioned", `${sha}-dirty`, "", "1".repeat(39)]) expect(() => assertProductionRelease(invalid, { NODE_ENV: "production" })).toThrow("approved");
    expect(() => assertProductionRelease(sha, { NODE_ENV: "production" })).not.toThrow();
  });
  it("supports explicitly labelled development/test artifacts without claiming a serving commit", () => {
    expect(buildReleaseId(archive, { BUILD_ARTIFACT_MODE: "development" }, absent)).toBe("development-unversioned");
    expect(() => assertProductionRelease("development-unversioned", { NODE_ENV: "test" })).not.toThrow();
  });
  it("checks real tracked Git state and excludes untracked output from the approved archive", () => {
    const root = mkdtempSync(join(tmpdir(), "echelon-release-fixture-"));
    const readGit = (args: string[]) => execFileSync("git", ["-C", root, ...args], { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }).trim();
    try {
      readGit(["init", "--quiet"]);
      writeFileSync(join(root, "source.ts"), "export const fixture = true;\n");
      readGit(["add", "source.ts"]);
      readGit(["-c", "user.name=Audit Fixture", "-c", "user.email=fixture@example.test", "-c", "commit.gpgsign=false", "commit", "--quiet", "-m", "Synthetic release fixture"]);
      const actual = readGit(["rev-parse", "HEAD"]);
      writeFileSync(join(root, "test-output.txt"), "not approved source\n");
      expect(buildReleaseId(readGit, { GITHUB_SHA: sha })).toBe(actual);
      const names = execFileSync("tar", ["-tf", "-"], { input: execFileSync("git", ["-C", root, "archive", "HEAD"]), encoding: "utf8" });
      expect(names.trim()).toBe("source.ts");
      const manifest = join(root, "release.json");
      writeFileSync(manifest, JSON.stringify({ version: 1, commit: actual, clean: true }));
      expect(buildReleaseId(archive, { GITHUB_SHA: actual }, () => readFileSync(manifest, "utf8"))).toBe(actual);
      writeFileSync(join(root, "source.ts"), "export const fixture = false;\n");
      expect(() => buildReleaseId(readGit, {})).toThrow("clean");
      readGit(["add", "source.ts"]);
      expect(() => buildReleaseId(readGit, {})).toThrow("clean");
    } finally { rmSync(root, { recursive: true, force: true }); }
  });
  it("embeds serving identity in the built health output, not runtime environment labels", async () => {
    const result = await build({ entryPoints: ["server/release.ts"], bundle: true, platform: "node", format: "esm", write: false, define: { __BUILD_RELEASE_ID__: JSON.stringify(sha) } });
    const health = await import(`data:text/javascript;base64,${Buffer.from(result.outputFiles[0].text).toString("base64")}`);
    expect(health.publicReleaseHealth().release).toBe(sha);
  });
});
