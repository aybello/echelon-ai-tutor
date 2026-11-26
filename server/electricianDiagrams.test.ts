import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { ELECTRICIAN_DIAGRAMS } from "../client/src/components/ElectricianDiagrams";

describe("309A electrician diagram pack", () => {
  it("ships the first five original blueprint-linked diagram definitions", () => {
    expect(ELECTRICIAN_DIAGRAMS.map((diagram) => diagram.id)).toEqual([
      "309A-D01",
      "309A-D03",
      "309A-D04",
      "309A-D05",
      "309A-D10",
    ]);
  });

  it("gives each visual an accessible explanation and blueprint purpose", () => {
    for (const diagram of ELECTRICIAN_DIAGRAMS) {
      expect(diagram.alt.length).toBeGreaterThan(40);
      expect(diagram.blueprint).toMatch(/[A-E]-/);
      expect(diagram.description).not.toMatch(/Canadian Electrical Code table/i);
    }
  });

  it("keeps the Codex diagram manifest aligned with rendered components", () => {
    const manifest = JSON.parse(
      readFileSync(resolve(process.cwd(), "content/309a/diagram-manifest.json"), "utf8"),
    ) as { implemented: { id: string; altRequired: boolean }[] };
    expect(manifest.implemented.map((diagram) => diagram.id)).toEqual(
      ELECTRICIAN_DIAGRAMS.map((diagram) => diagram.id),
    );
    expect(manifest.implemented.every((diagram) => diagram.altRequired)).toBe(true);
  });
});
