import { createHash } from "node:crypto";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import media from "../../shared/ceuManagedMedia.json";
import previewSources from "../../prototypes/ui-ux-preview/media-sources.json";

const root = new URL("../../", import.meta.url);
const read = (path: string) => readFileSync(new URL(path, root), "utf8");
const digest = (value: string) => createHash("sha256").update(value).digest("hex");
const baselineBytes = read("server/ceu/fixtures/managed-media-baseline-7f604509.json");
// URL-only migration baseline from main 7f604509; not a new content approval.
expect(digest(baselineBytes)).toBe("d943ba96301e49bff0968b150fce9e4108bb469957e845c04021bcb67f75debb");
const baseline = JSON.parse(baselineBytes) as Record<string, string>;
const assets = Object.entries(media);
const runtimeFiles = Object.keys(baseline);

describe("verified CEU managed media migration", () => {
  it("maps exactly 34 original JPEGs to distinct durable storage paths with byte fingerprints", () => {
    expect(assets).toHaveLength(34);
    expect(new Set(assets.map(([, asset]) => asset.url)).size).toBe(34);
    expect(assets.reduce((sum, [, asset]) => sum + asset.bytes, 0)).toBe(6_631_233);
    for (const [oldPath, asset] of assets) {
      expect(oldPath).toMatch(/^\/ceu-covers\/ceu-[a-z-]+\.jpg$/);
      expect(asset.url).toMatch(/^\/manus-storage\/ceu-[a-z-]+_[a-f0-9]{8}\.jpg$/);
      expect(asset.url.replace(/^\/manus-storage\//, "/ceu-covers/").replace(/_[a-f0-9]{8}\.jpg$/, ".jpg")).toBe(oldPath);
      expect(asset.sha256).toMatch(/^[a-f0-9]{64}$/);
      expect(asset.bytes).toBeGreaterThan(0);
      expect(existsSync(new URL(`client/public${oldPath}`, root))).toBe(false);
    }
  });

  it("preserves every pre-migration byte except the exact approved image URL substitutions", () => {
    expect(runtimeFiles).toHaveLength(17);
    expect(runtimeFiles.filter(path => path.startsWith("server/ceu/courses/"))).toHaveLength(15);
    const used = new Set<string>();
    for (const [path, expectedHash] of Object.entries(baseline)) {
      let source = read(path);
      expect(source, path).not.toContain("/ceu-covers/");
      for (const [oldPath, asset] of assets) {
        if (source.includes(asset.url)) used.add(oldPath);
        source = source.replaceAll(asset.url, oldPath);
      }
      // Pins all questions, answers, assessment hashes, versions, slide order,
      // caseSolutions, wording, alt text, JSX logic and formatting unchanged.
      expect(digest(source), path).toBe(expectedHash);
    }
    expect([...used].sort()).toEqual(assets.map(([path]) => path).sort());
  });

  it("registers the identical managed images in the offline browser fixture", () => {
    expect(previewSources).toHaveLength(34);
    for (const [oldPath, asset] of assets) {
      expect(previewSources.find(source => source.storagePath === asset.url)).toEqual({
        sha: "7f6045098c044aea234b3788dd2df8c73f591172",
        source: `client/public${oldPath}`,
        storagePath: asset.url,
        sha256: asset.sha256,
      });
    }
  });

  it("leaves no stale public image paths in runtime source or bundled public media", () => {
    const walk = (path: string): string[] => readdirSync(path, { withFileTypes: true }).flatMap(entry => {
      const child = `${path}/${entry.name}`;
      return entry.isDirectory() ? walk(child) : [child];
    });
    for (const directory of ["client/src", "server/ceu/courses", "shared"]) {
      for (const path of walk(fileURLToPath(new URL(directory, root)))) {
        if (!/\.(?:tsx?|json|css|html)$/.test(path) || /\.test\.ts$/.test(path) || path.endsWith("/ceuManagedMedia.json")) continue;
        expect(readFileSync(path, "utf8"), path).not.toContain("/ceu-covers/");
      }
    }
    const publicFiles = walk(fileURLToPath(new URL("client/public", root)));
    expect(publicFiles.some(path => /\/ceu-covers\/.*\.jpe?g$/i.test(path))).toBe(false);
  });
});
