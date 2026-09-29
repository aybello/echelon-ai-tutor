import { describe, expect, it } from "vitest";
import { build } from "esbuild";
import { buildReleaseId } from "../scripts/buildServer";

const sha = "a".repeat(40);
const archive = () => { throw Error("No .git in source archive"); };

describe("build release provenance", () => {
  it("uses the checkout SHA instead of a stale environment label", () => {
    const readGit = (args: string[]) => args[0] === "rev-parse" ? sha : "";
    expect(buildReleaseId(readGit, { BUILD_COMMIT_SHA: "b".repeat(40) })).toBe(sha);
    expect(buildReleaseId(args => args[0] === "rev-parse" ? sha : " M server/release.ts\n", {})).toBe(`${sha}-dirty`);
  });

  it("accepts explicit SHAs for source archives and rejects arbitrary values", () => {
    expect(buildReleaseId(archive, { BUILD_COMMIT_SHA: sha.toUpperCase() })).toBe(sha);
    expect(buildReleaseId(archive, { GITHUB_SHA: "b".repeat(40) })).toBe("b".repeat(40));
    expect(buildReleaseId(archive, { BUILD_COMMIT_SHA: "private-configuration-value" })).toBe("unknown");
    expect(buildReleaseId(archive, {})).toBe("unknown");
  });

  it("embeds the release in built health output rather than reading it at runtime", async () => {
    const result = await build({
      entryPoints: ["server/release.ts"],
      bundle: true,
      platform: "node",
      format: "esm",
      write: false,
      define: { __BUILD_RELEASE_ID__: JSON.stringify(sha) },
    });
    const health = await import(`data:text/javascript;base64,${Buffer.from(result.outputFiles[0].text).toString("base64")}`);
    expect(health.publicReleaseHealth().release).toBe(sha);
    expect(health.RELEASE_ID).toBe(sha);
  });
});
