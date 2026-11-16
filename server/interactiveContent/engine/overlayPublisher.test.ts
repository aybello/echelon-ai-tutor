import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { descriptorFor, registerDescriptor, validateCommittedOverlays } from "../../../scripts/game-authoring/overlayDescriptors";
import { overlayDescriptors, readOverlayDocument, resolveOverlayRoot } from "./overlayFiles";
import type { ContentOverlay } from "./overlay";

describe("private overlay descriptor publication", () => {
  it("validates the exact committed registry incrementally and regenerates identical metadata", () => {
    expect(() => validateCommittedOverlays()).not.toThrow();
    for (const descriptor of overlayDescriptors) {
      expect(descriptorFor(descriptor.file, readFileSync(join(resolveOverlayRoot(), descriptor.file)))).toEqual(descriptor);
    }
  });
  it("keeps existing descriptor publication idempotent without changing any source bytes", () => {
    const path = "server/interactiveContent/engine/overlayDescriptors.ts";
    const before = readFileSync(path);
    const descriptor = overlayDescriptors[0];
    const doc = readOverlayDocument(resolveOverlayRoot(), descriptor) as ContentOverlay;
    registerDescriptor(join(resolveOverlayRoot(), descriptor.file), doc);
    expect(readFileSync(path)).toEqual(before);
    expect(() => registerDescriptor(join("/tmp", descriptor.file), doc)).toThrow(/fixed private overlay directory/);
    expect(() => descriptorFor("../escape.json", Buffer.from("{}"))).toThrow(/filename/);
  });
  it("retains publication guards before updating the descriptor registry", () => {
    const source = readFileSync("scripts/game-authoring/build.ts", "utf8");
    const hook = source.indexOf("registerDescriptor(outFile, reviewed)");
    expect(hook).toBeGreaterThan(source.indexOf("assertDestination(outFile, reviewed, bytes)"));
    expect(hook).toBeGreaterThan(source.indexOf("compileOverlays([...committedOverlayDocuments()"));
    expect(source.slice(source.lastIndexOf('if (!flags.includes("--check"))'), hook)).toContain("writeFileSync(outFile, bytes");
  });
});
