import { describe, expect, it } from "vitest";
import { selectMappedMockQuestions } from "./mockExamSession";
import { ONTARIO_WASTEWATER_CHAPTER_AREAS, ontarioWastewaterMockProfile, reviewedWastewaterMockArea, WASTEWATER_MOCK_AREAS as areas } from "../shared/ontarioWastewaterMock";

type Q = { id: number; module: string; blueprintObjective?: string | null; reviewStatus?: string | null };
function poolFor(bank: string): Q[] {
  let id = 0;
  if (bank === "class2-wastewater") {
    return ["Treatment Process", "Equipment O&M", "Laboratory Analysis", "Safety & Administration", "Collection Systems"]
      .flatMap(module => Array.from({ length: 65 }, () => ({ id: ++id, module })));
  }
  // Detailed Class I chapters span multiple areas. Only reviewed metadata, not
  // the chapter name or an ID range, provides their individual classification.
  const chapters = Object.keys(ONTARIO_WASTEWATER_CHAPTER_AREAS["class1-wastewater"]);
  return Object.values(areas).flatMap(blueprintObjective => Array.from({ length: 65 }, (_, index) => ({
    id: ++id, module: chapters[index % chapters.length], blueprintObjective, reviewStatus: "approved",
  })));
}
function sample(bank: string, rows = poolFor(bank), random = () => 0.31) {
  return selectMappedMockQuestions(rows, ontarioWastewaterMockProfile(bank)!.targets, 100,
    question => reviewedWastewaterMockArea(bank, question), random);
}

describe("reviewed Ontario wastewater topic sampling", () => {
  it.each(["class1-wastewater", "class2-wastewater"])("uses current %s chapters, exact quotas and original identities across shuffles", bank => {
    const pool = poolFor(bank);
    const before = structuredClone(pool);
    for (const seed of [0, 0.2, 0.7, 0.9999]) {
      const result = sample(bank, pool, () => seed);
      expect(result).toHaveLength(100);
      expect(new Set(result.map(q => q.id)).size).toBe(100);
      for (const [area, quota] of Object.entries(ontarioWastewaterMockProfile(bank)!.targets)) {
        expect(result.filter(q => reviewedWastewaterMockArea(bank, q) === area)).toHaveLength(quota);
      }
      for (const q of result) expect(q).toBe(pool.find(original => original.id === q.id));
      expect(result.some(q => q.module === "Collection Systems")).toBe(false);
    }
    expect(pool).toEqual(before);
  });
  it.each(["class1-wastewater", "class2-wastewater"])("rejects %s insufficient mapped area coverage instead of borrowing surplus", bank => {
    const rows = poolFor(bank).filter(q => reviewedWastewaterMockArea(bank, q) !== areas.laboratory);
    expect(rows.length).toBeGreaterThan(100);
    expect(() => sample(bank, rows)).toThrow("Insufficient reviewed coverage for Laboratory Analysis");
  });
  it("does not invent areas for the nine detailed Class I chapters", () => {
    for (const module of Object.keys(ONTARIO_WASTEWATER_CHAPTER_AREAS["class1-wastewater"])) {
      expect(reviewedWastewaterMockArea("class1-wastewater", { module })).toBeNull();
      expect(reviewedWastewaterMockArea("class1-wastewater", { module, blueprintObjective: "Primary Treatment", reviewStatus: "approved" })).toBeNull();
      expect(reviewedWastewaterMockArea("class1-wastewater", { module, blueprintObjective: areas.equipment, reviewStatus: "unreviewed" })).toBeNull();
      expect(reviewedWastewaterMockArea("class1-wastewater", { module, blueprintObjective: areas.equipment, reviewStatus: "approved" })).toBe(areas.equipment);
    }
    expect(() => sample("class1-wastewater", poolFor("class1-wastewater").map(q => ({ ...q, blueprintObjective: null })))).toThrow("Insufficient reviewed coverage");
  });
  it("preserves legacy valid banks already labelled with exam areas", () => {
    let id = 0;
    const pool = Object.values(areas).flatMap(module => Array.from({ length: 65 }, () => ({ id: ++id, module })));
    expect(sample("class1-wastewater", pool)).toHaveLength(100);
    expect(sample("class2-wastewater", pool)).toHaveLength(100);
    expect(reviewedWastewaterMockArea("class2-wastewater", { module: areas.process, blueprintObjective: "unrecognized", reviewStatus: "approved" })).toBeNull();
    expect(ontarioWastewaterMockProfile("wpi-class1-wastewater")).toBeNull();
  });
  it("rejects duplicate IDs and invalid quotas before selection", () => {
    const pool = poolFor("class2-wastewater");
    expect(() => sample("class2-wastewater", [...pool, pool[0]])).toThrow("Duplicate");
    const invalidTargets: Record<string, number>[] = [{ A: 99 }, { A: 100.1 }, { A: -1, B: 101 }, {}];
    for (const targets of invalidTargets) {
      expect(() => selectMappedMockQuestions(pool, targets, 100, () => "A")).toThrow("Invalid mapped mock blueprint");
    }
    expect(() => selectMappedMockQuestions([{ id: 0, module: "A" }], { A: 1 }, 1, () => "A")).toThrow("invalid mock question identity");
  });
});
