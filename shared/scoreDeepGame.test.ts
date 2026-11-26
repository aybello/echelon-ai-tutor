import { describe, expect, it } from "vitest";
import type { ChoiceStep, ErrorTask, EvidenceTask, LadderTask, ProcessTask } from "./deepGames";
import { deepNumericObservationDescriptor, deepTaskStepIds, scoreDeepStep, scoreDeepTask } from "./scoreDeepGame";

const base = { id: "synthetic", revision: "r1", prompt: "Synthetic test only", topicId: "test", level: "oit" as const, assumptions: "Test fixture, not course content" };
const options = [{ id: "a", label: "Alpha" }, { id: "b", label: "Beta" }];
const choice = (id: string): ChoiceStep => ({ id, prompt: "Choose fixture", options, correctOptionId: "a", explanation: "Synthetic explanation" });
const ladder: LadderTask = { ...base, mode: "calculation-ladder", choices: [choice("formula"), choice("units"), choice("substitution")], result: { id: "result", prompt: "Enter value", unitOptions: [{ id: "L-min", label: "L/min" }, { id: "wrong", label: "Unrelated unit" }], expected: "12.50", expectedUnitId: "L-min", absoluteTolerance: "0.01", explanation: "Synthetic result" } };
const process: ProcessTask = { ...base, mode: "build-process", configuration: "Synthetic configuration", cards: options, correctOrder: ["b", "a"], explanation: "Synthetic order" };
const error: ErrorTask = { ...base, mode: "find-calculation-error", lines: options, firstWrongLineId: "b", correctedLine: "Correct synthetic line", explanation: "Synthetic cause" };
const evidence: EvidenceTask = { ...base, mode: "evidence-detective", evidence: options, inference: choice("inference"), nextClue: { ...choice("next-clue"), correctOptionId: "b" }, clueText: { a: "First clue", b: "Second clue" } };

describe("stable deep-game deterministic checkers", () => {
  it("scores all ladder steps separately and numeric values only as strict issued-unit aliases", () => {
    expect(deepTaskStepIds(ladder)).toEqual(["formula", "units", "substitution", "result"]);
    const correct = { formula: "a", units: "a", substitution: "a", result: "n:12.50:L-min" };
    expect(scoreDeepTask(ladder, correct)).toMatchObject({ complete: true, correct: true });
    expect(scoreDeepTask(ladder, { ...correct, formula: "b" })).toMatchObject({ complete: true, correct: false });
    expect(scoreDeepTask(ladder, { ...correct, result: "n:12.50:wrong" })).toMatchObject({ complete: true, correct: false });
    expect(scoreDeepTask(ladder, { ...correct, result: "n:13:L-min" })).toMatchObject({ complete: true, correct: false });
    for (const result of ["12.50", "n:12.50:unknown", "n:1e2:L-min"]) expect(scoreDeepTask(ladder, { ...correct, result })).toMatchObject({ complete: false, correct: false });
    expect(scoreDeepStep(ladder, "formula", "b")).toBe(false);
    expect(scoreDeepStep(ladder, "other", "a")).toBe(false);
    expect(scoreDeepStep(ladder, "result", "n:12.51:L-min")).toBe(true);
  });
  it("projects a numeric observation descriptor without answer policies or conversions", () => {
    expect(deepNumericObservationDescriptor(ladder)).toEqual({ kind: "numeric", unitOptions: ladder.result.unitOptions });
  });
  it("requires exact process permutations and reports per-slot correctness", () => {
    expect(deepTaskStepIds(process)).toEqual(["slot:0", "slot:1"]);
    expect(scoreDeepTask(process, { "slot:0": "b", "slot:1": "a" })).toMatchObject({ complete: true, correct: true });
    expect(scoreDeepTask(process, { "slot:0": "a", "slot:1": "b" })).toMatchObject({ complete: true, correct: false, steps: [{ id: "slot:0", answered: true, correct: false }, { id: "slot:1", answered: true, correct: false }] });
    const invalidOrders: Array<Record<string, string>> = [{ "slot:0": "a", "slot:1": "a" }, { "slot:0": "b" }, { "slot:0": "b", "slot:1": "unknown" }];
    for (const answers of invalidOrders) expect(scoreDeepTask(process, answers)).toMatchObject({ complete: false, correct: false });
    for (const step of ["slot:01", "slot:-1", "slot:2", "slot:0x0", "slot:0 "]) expect(scoreDeepStep(process, step, "b")).toBe(false);
  });
  it("only accepts the first declared wrong line, not generic flaw choices or corrective text", () => {
    expect(deepTaskStepIds(error)).toEqual(["first-error"]);
    expect(scoreDeepTask(error, { "first-error": "b" })).toMatchObject({ complete: true, correct: true });
    expect(scoreDeepTask(error, { "first-error": "a" })).toMatchObject({ complete: true, correct: false });
    expect(scoreDeepStep(error, "first-error", error.correctedLine)).toBe(false);
    expect(scoreDeepStep(error, "b", "b")).toBe(false);
  });
  it("scores evidence decisions independently without revealing a clue being an answer", () => {
    expect(deepTaskStepIds(evidence)).toEqual(["inference", "next-clue"]);
    expect(scoreDeepTask(evidence, { inference: "a", "next-clue": "b" })).toMatchObject({ complete: true, correct: true });
    expect(scoreDeepTask(evidence, { inference: "a", "next-clue": "a" })).toEqual({ complete: true, correct: false, steps: [{ id: "inference", answered: true, correct: true }, { id: "next-clue", answered: true, correct: false }] });
    expect(scoreDeepTask(evidence, { inference: "b", "next-clue": "b" })).toMatchObject({ complete: true, correct: false, steps: [{ correct: false }, { correct: true }] });
    expect(scoreDeepTask(evidence, { inference: "a" })).toMatchObject({ complete: false, correct: false });
    expect(scoreDeepStep(evidence, "next-clue", "Second clue")).toBe(false);
  });
  it("does not mutate first attempts during retries and never accepts inherited answer keys", () => {
    const first = { "first-error": "a" };
    const retry = { ...first, "first-error": "b" };
    expect(scoreDeepTask(error, first).correct).toBe(false);
    expect(scoreDeepTask(error, retry).correct).toBe(true);
    expect(first).toEqual({ "first-error": "a" });
    expect(scoreDeepTask(error, Object.create({ "first-error": "b" })).complete).toBe(false);
  });
});
