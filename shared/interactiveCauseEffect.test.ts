import { describe, expect, it } from "vitest";
import { causeEffectFit, isQuantityLabel, scoreCauseEffect, statedDirection, toCauseEffectEffects, type CauseEffectChoiceItem } from "./interactiveCauseEffect";
import { interactiveCauseEffectExampleSchema, interactiveSessionResponseSchema } from "./interactiveSessions";
// @ts-expect-error The offline authoring module is plain JavaScript.
import { isQuantityLabel as authoringIsQuantityLabel, payloadIssues } from "../scripts/content-engine/schemas.mjs";

const choice = (prompt: string, labels: string[], correct = 0, explanation = "Because of the stated relationship."): CauseEffectChoiceItem => ({
  id: "item-1", prompt, mode: "cause-effect", explanation,
  options: labels.map((label, index) => ({ id: `o${index}`, label })), correctOptionId: `o${correct}`,
});

describe("cause and effect mode fit", () => {
  it("recognizes computed quantities, including compound and superscript units", () => {
    for (const label of ["15.7 minutes", "2,349 US gal", "80%", "0.20 day⁻¹", "24 m³/(m²·day)", "125 mg/L as CaCO₃", "2-log", "approximately 4 h", "75% recovery and 200 m³/day concentrate"])
      expect(isQuantityLabel(label), label).toBe(true);
    for (const label of ["It doubles", "A growing obstruction", "Backsiphonage", "pH rises above 9", "Three pumps run"])
      expect(isQuantityLabel(label), label).toBe(false);
  });

  it("keeps the authoring pipeline's quantity rule identical", () => {
    for (const label of ["15.7 minutes", "0.20 day⁻¹", "24 m³/(m²·day)", "It doubles", "Backsiphonage", "2-log", "x".repeat(61), `1 ${"m".repeat(60)}`])
      expect(authoringIsQuantityLabel(label), label).toBe(isQuantityLabel(label));
  });

  it("classifies calculation items and blocks them in the authoring pipeline", () => {
    const tank = choice("A rectangular tank is 12 m long, 5 m wide and 3 m deep. What is the water volume?", ["180 m³", "20 m³", "60 m³"]);
    expect(causeEffectFit(tank)).toBe("calculation");
    expect(toCauseEffectEffects(tank)).toBeNull();
    expect(payloadIssues(tank)).toContain("cause-effect-calculation-not-mode-fit");
    // The same numeric options are legitimate in a different mode.
    expect(payloadIssues({ ...tank, mode: "odd-one-out" })).toEqual([]);
  });

  it("presents a definite direction for a named parameter with direction controls", () => {
    const item = choice("At fixed tank volume, influent flow doubles. What happens to ideal hydraulic detention time?", ["It halves", "It doubles", "It stays unchanged"]);
    expect(causeEffectFit(item)).toBe("directional");
    expect(toCauseEffectEffects(item)).toEqual({
      id: "item-1", prompt: item.prompt, mode: "cause-effect",
      effects: [{ id: "effect-1", parameter: "Ideal hydraulic detention time", direction: "decrease", explanation: item.explanation }],
    });
    expect(toCauseEffectEffects(choice("At fixed concentration, contact time is cut in half. What happens to calculated CT?", ["CT halves", "CT doubles"]))?.effects[0])
      .toMatchObject({ parameter: "CT", direction: "decrease" });
    expect(toCauseEffectEffects(choice("Flow is constant. What happens to the level?", ["It stays the same", "It rises"]))?.effects[0])
      .toMatchObject({ parameter: "Level", direction: "unchanged" });
    // A trailing condition belongs to the scenario, not the parameter name.
    expect(toCauseEffectEffects(choice("Flow is fixed. What happens to theoretical detention time if liquid volume doubles?", ["It doubles", "It halves"]))?.effects[0].parameter)
      .toBe("Theoretical detention time");
  });

  it("never invents a definite arrow for hedged, compound or unnamed outcomes", () => {
    const cases = [
      choice("Warmer water accelerates chlorine decay. What can happen to residual?", ["It can decline", "It must increase"]),
      choice("Water sits longer in a tank. Which change is plausible, not guaranteed?", ["Residual may decline", "Residual must rise"]),
      choice("A station loses power. What can happen?", ["Pumping can stop and upstream level rise", "Nothing"]),
      choice("A storm exceeds capacity. What occurs?", ["Level rises and overflow risk increases", "Nothing changes"]),
      choice("Demand rises. What follows?", ["It must increase", "It falls"]),
      choice("Roots trap debris. What is a likely result?", ["A growing obstruction", "Automatic pipe repair"]),
      choice("Flow doubles. What follows?", ["It doubles", "It halves"]),
    ];
    for (const item of cases) {
      expect(toCauseEffectEffects(item), item.prompt).toBeNull();
      expect(causeEffectFit(item), item.prompt).toBe("choice");
    }
    expect(statedDirection("It must increase")).toBeNull();
    expect(statedDirection("Residual decreases")).toEqual({ direction: "decrease", subject: "Residual" });
  });

  it("scores every parameter and requires all to be right", () => {
    const effects = [
      { id: "a", parameter: "Detention time", direction: "decrease" as const, explanation: "V/Q with larger Q." },
      { id: "b", parameter: "Tank volume", direction: "unchanged" as const, explanation: "Volume is held fixed." },
      { id: "c", parameter: "Removal", direction: "depends" as const, explanation: "Depends on settling characteristics." },
    ];
    expect(scoreCauseEffect(effects, { a: "decrease", b: "unchanged", c: "depends" })).toEqual({ correct: true, results: [{ id: "a", correct: true }, { id: "b", correct: true }, { id: "c", correct: true }] });
    expect(scoreCauseEffect(effects, { a: "decrease", b: "increase", c: "depends" }).correct).toBe(false);
    expect(scoreCauseEffect(effects, { a: "decrease", b: "unchanged" }).results[2]).toEqual({ id: "c", correct: false });
    expect(scoreCauseEffect([], {}).correct).toBe(false);
  });

  it("validates the delivered payload strictly", () => {
    const valid = { id: "ce-1", prompt: "Flow doubles at fixed volume.", mode: "cause-effect", assumptions: "Ideal steady flow.", effects: [
      { id: "a", parameter: "Detention time", direction: "decrease", explanation: "V/Q." },
      { id: "b", parameter: "Volume", direction: "unchanged", explanation: "Held fixed." },
    ] };
    expect(interactiveCauseEffectExampleSchema.safeParse(valid).success).toBe(true);
    expect(interactiveCauseEffectExampleSchema.safeParse({ ...valid, effects: [] }).success).toBe(false);
    expect(interactiveCauseEffectExampleSchema.safeParse({ ...valid, effects: [valid.effects[0], { ...valid.effects[1], id: "a" }] }).success).toBe(false);
    expect(interactiveCauseEffectExampleSchema.safeParse({ ...valid, effects: [valid.effects[0], { ...valid.effects[1], parameter: " detention  TIME " }] }).success).toBe(false);
    expect(interactiveCauseEffectExampleSchema.safeParse({ ...valid, effects: [{ ...valid.effects[0], direction: "sideways" }] }).success).toBe(false);
    expect(interactiveCauseEffectExampleSchema.safeParse({ ...valid, correctOptionId: "a" }).success).toBe(false);
    const session = { courseKey: "class2-ww", available: true, locked: false, version: "v", sessionId: "s", mode: "cause-effect", totalAvailableCount: 1, examples: [valid], filters: { topicId: null, difficulty: null, requestedSize: 20 } };
    expect(interactiveSessionResponseSchema.safeParse(session).success).toBe(true);
  });
});
