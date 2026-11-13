import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { mockBlueprintForBank, selectBlueprintQuestions, WPI_CLASS4_BANK, WPI_CLASS4_BLUEPRINT, WPI_COLLECTION_BANK, WPI_COLLECTION_BLUEPRINT } from "./mockBlueprint";
const files = ["technical-corrections.psv", "planning-rewrites.psv", "operations-rewrites.psv", "remaining-hydraulics-operations.psv", "remaining-assessment-rewrites.psv"];
// Independent list from the reviewed calculation inventory, not inferred from wording.
const calculations = new Set([51,154,166,172,173,174,178,179,189,190,227,228,242,281,282,283,301,304,305,309,316,317,350,351,366,373,392,416,423,435,461]);
const areaKeys = ["E", "C", "L", "M", "S"];
export const collectionPool = files.flatMap(file => readFileSync(new URL(`../content/wpi-class4-collection/review/${file}`, import.meta.url), "utf8")
  .split(/\r?\n/).filter(line => line && !line.startsWith("#")).map(line => {
    const [number, area, cognitiveLevel] = line.split("|");
    return { id: Number(number), module: WPI_COLLECTION_BLUEPRINT[areaKeys.indexOf(area)].module, cognitiveLevel, isCalc: calculations.has(Number(number)) };
  }));
describe("Collection mock using the authored 503-item inventory", () => {
  it("keeps Collection separate from Treatment and requires explicit edition activation", () => {
    expect(mockBlueprintForBank(WPI_COLLECTION_BANK, 1)).toBeNull();
    expect(mockBlueprintForBank(WPI_COLLECTION_BANK, 2025)).toBe(WPI_COLLECTION_BLUEPRINT);
    expect(mockBlueprintForBank(WPI_CLASS4_BANK, 2025)).toBe(WPI_CLASS4_BLUEPRINT);
    expect(mockBlueprintForBank("unrelated", 2025)).toBeNull();
  });
  it("issues 100 unique scored items with exact joint quotas across varied draws", () => {
    expect(collectionPool).toHaveLength(503);
    let seed = 7;
    const rng = () => ((seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0) / 4294967296);
    const firstQuestions = new Set<number>();
    for (let i = 0; i < 100; i++) {
      const selected = selectBlueprintQuestions(collectionPool, WPI_COLLECTION_BLUEPRINT, 100, rng);
      expect(new Set(selected.map(q => q.id)).size).toBe(100);
      expect(selected.filter(q => q.cognitiveLevel === "recall")).toHaveLength(20);
      expect(selected.filter(q => q.cognitiveLevel === "application")).toHaveLength(80);
      expect(selected.filter(q => q.isCalc)).toHaveLength(16);
      for (const area of WPI_COLLECTION_BLUEPRINT) {
        const rows = selected.filter(q => q.module === area.module);
        expect(rows).toHaveLength(area.total);
        expect(rows.filter(q => q.cognitiveLevel === "recall")).toHaveLength(area.recall);
        expect(rows.filter(q => q.isCalc)).toHaveLength(area.calculations);
      }
      firstQuestions.add(selected[0].id);
    }
    expect(firstQuestions.size).toBeGreaterThan(10);
  });
  it("refuses a form after a shortage of Collection safety calculations", () => {
    const pool = collectionPool.filter(q => q.module !== WPI_COLLECTION_BLUEPRINT[4].module || !q.isCalc);
    expect(() => selectBlueprintQuestions(pool, WPI_COLLECTION_BLUEPRINT, 100)).toThrow("Insufficient");
  });
});
