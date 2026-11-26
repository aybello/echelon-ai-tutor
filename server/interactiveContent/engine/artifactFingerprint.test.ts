import { describe, expect, it } from "vitest";
import { cpSync, mkdirSync, mkdtempSync, readFileSync, rmSync, statSync, symlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { computeInteractiveArtifactFingerprint, writeInteractiveArtifactManifest } from "../../../scripts/interactiveArtifactFingerprint";

describe("private interactive artifact fingerprint", () => {
  it("is deterministic over exact paths and bytes and detects additions, removals and answer changes", () => {
    const root = mkdtempSync(join(tmpdir(), "interactive-fingerprint-"));
    try {
      const one = join(root, "one"), two = join(root, "two");
      mkdirSync(join(one, "course"), { recursive: true });
      writeFileSync(join(one, "registry.json"), '{"synthetic":true}\n');
      writeFileSync(join(one, "course/shard.json"), '{"answer":"A"}\n');
      cpSync(one, two, { recursive: true });
      const original = computeInteractiveArtifactFingerprint(one);
      expect(computeInteractiveArtifactFingerprint(two)).toBe(original);
      writeFileSync(join(two, "course/shard.json"), '{"answer":"B"}\n');
      expect(computeInteractiveArtifactFingerprint(two)).not.toBe(original);
      cpSync(one, two, { recursive: true });
      writeFileSync(join(two, "extra.json"), "{}\n");
      expect(computeInteractiveArtifactFingerprint(two)).not.toBe(original);
      rmSync(join(two, "extra.json"));
      rmSync(join(two, "course/shard.json"));
      expect(computeInteractiveArtifactFingerprint(two)).not.toBe(original);
      const manifest = join(root, "manifest.json");
      writeInteractiveArtifactManifest(one, manifest);
      expect(JSON.parse(readFileSync(manifest, "utf8"))).toEqual({ version: 1, kind: "interactive-artifact-sha256-v1", sha256: original });
      expect(statSync(manifest).mode & 0o777).toBe(0o600);
      expect(() => writeInteractiveArtifactManifest(one, manifest)).toThrow();
      symlinkSync(join(one, "registry.json"), join(two, "linked.json"));
      expect(() => computeInteractiveArtifactFingerprint(two)).toThrow();
      rmSync(join(two, "linked.json"));
      rmSync(join(two, "registry.json"));
      expect(() => computeInteractiveArtifactFingerprint(two)).toThrow();
    } finally { rmSync(root, { recursive: true, force: true }); }
  });
});
