import { describe, expect, it } from "vitest";
import { normalizeWpiClass4Module, selectBlueprintQuestions, WPI_CLASS4_BLUEPRINT } from "./mockBlueprint";

function pool() {
  let id = 0;
  return WPI_CLASS4_BLUEPRINT.flatMap(area => ["recall", "application"].flatMap(cognitiveLevel =>
    [true, false].flatMap(isCalc => Array.from({ length: 55 }, () => ({ id: ++id, module: area.module, cognitiveLevel, isCalc })))));
}
describe("Class IV joint mock blueprint", () => {
  it("keeps every topic/cognitive/calculation quota across varied samples", () => {
    let seed = 91;
    const rng = () => ((seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0) / 4294967296);
    const starts = new Set<number>();
    for (let i = 0; i < 50; i++) {
      const selected = selectBlueprintQuestions(pool(), WPI_CLASS4_BLUEPRINT, 100, rng);
      starts.add(selected[0].id);
      expect(new Set(selected.map(q => q.id)).size).toBe(100);
      expect(selected.filter(q => q.isCalc)).toHaveLength(16);
      expect(selected.filter(q => q.cognitiveLevel === "recall")).toHaveLength(25);
      for (const area of WPI_CLASS4_BLUEPRINT) {
        const topic = selected.filter(q => q.module === area.module);
        expect(topic).toHaveLength(area.total);
        expect(topic.filter(q => q.cognitiveLevel === "recall")).toHaveLength(area.recall);
        expect(topic.filter(q => q.isCalc)).toHaveLength(area.calculations);
      }
    }
    expect(starts.size).toBeGreaterThan(10);
  });
  it("cannot silently replace a missing category with questions from another topic", () => {
    const eligible = pool().filter(q => q.module !== WPI_CLASS4_BLUEPRINT[2].module);
    expect(() => selectBlueprintQuestions(eligible, WPI_CLASS4_BLUEPRINT, 100)).toThrow("Laboratory");
  });
  it("detects joint shortages even when individual marginal totals look sufficient", () => {
    const questions = Array.from({ length: 10 }, (_, id) => ({ id, module: "A", cognitiveLevel: id < 5 ? "recall" : "application", isCalc: id < 5 }));
    expect(() => selectBlueprintQuestions(questions, [{ module: "A", total: 10, recall: 5, calculations: 0 }], 10)).toThrow("Insufficient");
  });
  it("never guesses unknown cognitive or calculation classifications", () => {
    expect(() => selectBlueprintQuestions(pool().map(q => ({ ...q, cognitiveLevel: null })), WPI_CLASS4_BLUEPRINT, 100)).toThrow("Insufficient");
    expect(() => selectBlueprintQuestions(pool().map(q => ({ ...q, isCalc: undefined })), WPI_CLASS4_BLUEPRINT, 100)).toThrow("Insufficient");
  });
  it("rejects duplicate IDs and malformed quota totals", () => {
    const eligible = pool();
    expect(() => selectBlueprintQuestions([...eligible, eligible[0]], WPI_CLASS4_BLUEPRINT, 100)).toThrow("identity");
    expect(() => selectBlueprintQuestions(eligible, WPI_CLASS4_BLUEPRINT, 99)).toThrow("Invalid");
  });
  it("maps historic synonyms explicitly and leaves unknown topics unmapped", () => {
    expect(normalizeWpiClass4Module("Treatment Process")).toBe(WPI_CLASS4_BLUEPRINT[1].module);
    expect(normalizeWpiClass4Module("Equipment Operation & Maintenance")).toBe(WPI_CLASS4_BLUEPRINT[0].module);
    expect(normalizeWpiClass4Module("Safety & Admin")).toBe(WPI_CLASS4_BLUEPRINT[3].module);
    expect(normalizeWpiClass4Module("Advanced Nutrient Removal")).toBe("Advanced Nutrient Removal");
  });
});
