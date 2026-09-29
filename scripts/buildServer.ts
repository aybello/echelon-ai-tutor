import { execFileSync } from "node:child_process";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { build } from "esbuild";

type GitReader = (args: string[]) => string;
const git: GitReader = args =>
  execFileSync("git", args, {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "ignore"],
  }).trim();
const validSha = (value: string | undefined): value is string =>
  /^[a-f0-9]{40}$|^[a-f0-9]{64}$/i.test(value ?? "");

/** Stamp the checkout being built; deployment-time variables cannot change it. */
export function buildReleaseId(
  readGit: GitReader = git,
  env: NodeJS.ProcessEnv = process.env
): string {
  try {
    const sha = readGit(["rev-parse", "--verify", "HEAD"]);
    if (validSha(sha)) {
      const dirty = readGit(["status", "--porcelain", "--untracked-files=normal"]);
      return `${sha.toLowerCase()}${dirty.trim() ? "-dirty" : ""}`;
    }
  } catch {
    // Source archives need not include .git. Accept only an explicit SHA.
  }
  const sha = [env.BUILD_COMMIT_SHA, env.GITHUB_SHA].find(validSha);
  return sha?.toLowerCase() ?? "unknown";
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  await build({
    entryPoints: ["server/_core/index.ts"],
    platform: "node",
    packages: "external",
    bundle: true,
    format: "esm",
    outdir: "dist",
    define: { __BUILD_RELEASE_ID__: JSON.stringify(buildReleaseId()) },
    logLevel: "info",
  });
}
