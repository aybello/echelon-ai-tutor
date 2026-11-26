import { describe, expect, it } from "vitest";
import { adaptCourseQuestionsToInteractiveDrills } from "./courseInteractiveAdapter";
import type { BeforeAfterExample, ChoiceDrillExample, DrillExample, RapidSwipeExample, SpeedMatchExample } from "../components/InteractiveDrill";

const source = (question: string, answer: string, extra: Record<string, unknown> = {}) => ({
  question,
  options: ["An invented distractor option", answer, "A different invented distractor"],
  correctIndex: 1,
  explanation: `Synthetic explanation for ${answer}.`,
  ...extra,
});
const first = () => source("Which object belongs in the fictional red box?", "A painted wooden cube");
const second = () => source("Which object belongs in the fictional blue box?", "A polished glass sphere");
const swipe = (examples: readonly DrillExample[]): RapidSwipeExample[] => examples.filter((item): item is RapidSwipeExample => item.mode === "rapid-swipe");
const matches = (examples: readonly DrillExample[]): SpeedMatchExample[] => examples.filter((item): item is SpeedMatchExample => item.mode === "speed-match");
const choices = (examples: readonly DrillExample[]): ChoiceDrillExample[] => examples.filter((item): item is ChoiceDrillExample => item.mode === "odd-one-out" || item.mode === "tap-the-flaw" || item.mode === "cause-effect");
const ordering = (examples: readonly DrillExample[]): BeforeAfterExample[] => examples.filter((item): item is BeforeAfterExample => item.mode === "before-after");

describe("adaptCourseQuestionsToInteractiveDrills", () => {
  it("selects candidates without an index pattern, preserving original text and explanations", () => {
    const a = first();
    const b = second();
    const c = source("Which object belongs in the fictional green box?", "A striped paper cone");
    const result = adaptCourseQuestionsToInteractiveDrills([a, b, c]);
    const items = swipe(result.examples);
    expect(result.validQuestionCount).toBe(3);
    expect(items[0].prompt).toContain(a.question);
    expect(items[0].prompt).toContain(a.options[a.correctIndex]);
    expect(items[1].prompt).toContain(b.question);
    for (const [index, item] of items.entries()) {
      const original = [a, b, c][index];
      const candidateLabel = /Is option ([A-Z]) the correct answer\?/.exec(item.prompt)![1];
      const candidateIndex = candidateLabel.charCodeAt(0) - 65;
      expect(candidateIndex).toBeGreaterThanOrEqual(0);
      expect(candidateIndex).toBeLessThan(original.options.length);
      expect(item.correctAnswer).toBe(candidateIndex === original.correctIndex);
      expect(item.prompt).toBe(`${original.question}\n\n${original.options.map((option, optionIndex) => `${String.fromCharCode(65 + optionIndex)}. ${option}`).join("  |  ")}\n\nIs option ${candidateLabel} the correct answer?`);
      expect(item.explanation).toContain(original.options[original.correctIndex]);
      expect(item.explanation).toContain(original.explanation);
    }
    expect(result.examples.every(item => item.mode === "rapid-swipe")).toBe(true);
    expect(adaptCourseQuestionsToInteractiveDrills([a, b, c])).toEqual(result);
    expect(new Set(result.examples.map(item => item.id)).size).toBe(result.examples.length);
  });

  it("keeps candidate choice independent of source order and covers both truth values", () => {
    const bank = Array.from({ length: 40 }, (_, i) => source(`Which fictional object fits crate ${i}?`, "A painted cube"));
    const items = swipe(adaptCourseQuestionsToInteractiveDrills(bank).examples);
    const reversed = swipe(adaptCourseQuestionsToInteractiveDrills([...bank].reverse()).examples).reverse();
    expect(items.map(item => item.prompt)).toEqual(reversed.map(item => item.prompt));
    expect(new Set(items.map(item => item.correctAnswer)).size).toBe(2);
    expect(items.some((item, i) => i > 0 && item.correctAnswer === items[i - 1].correctAnswer)).toBe(true);
  });

  it("supports observed q/correct aliases but refuses conflicting or inferred keys", () => {
    const legacy = { q: "Which fictional item belongs in the crate?", correct: 0, options: ["A synthetic answer", "Another synthetic answer"], explanation: "Synthetic reason." };
    const bad = { ...legacy, correctIndex: 1 };
    const conflictingQuestion = { ...legacy, question: "A conflicting question?" };
    const stringKey = { ...legacy, correct: "0" };
    const result = adaptCourseQuestionsToInteractiveDrills([legacy, bad, conflictingQuestion, stringKey]);
    expect(result.validQuestionCount).toBe(1);
    expect(swipe(result.examples)[0].prompt).toContain(legacy.q);
    expect(swipe(result.examples)[0].explanation).toContain(legacy.options[0]);
  });

  it("rejects missing or malformed text, options, keys, explanations, and disabled records", () => {
    const invalid: unknown[] = [
      null, 4, [], {},
      { ...first(), question: " " },
      { ...first(), options: [] },
      { ...first(), options: ["only one"] },
      { ...first(), options: ["valid option", " "] },
      { ...first(), options: ["valid option", null] },
      { ...first(), options: new Array(3) },
      { ...first(), options: ["Same option", " same   option "] },
      { ...first(), correctIndex: undefined },
      { ...first(), correctIndex: -1 },
      { ...first(), correctIndex: 3 },
      { ...first(), correctIndex: 1.5 },
      { ...first(), correctIndex: NaN },
      { ...first(), explanation: "  " },
      { ...first(), explanation: null },
      { ...first(), disabled: true },
      { ...first(), isDisabled: true },
      { ...first(), isActive: false },
      { ...first(), enabled: false },
      { ...first(), disabled: "false" },
      { ...first(), status: "archived" },
      { ...first(), diagramId: "synthetic-diagram" },
    ];
    const result = adaptCourseQuestionsToInteractiveDrills(invalid, { includeSpeedMatch: true });
    expect(result).toEqual({ examples: [], validQuestionCount: 0 });
    expect(JSON.stringify(result)).not.toContain("A painted wooden cube");
  });

  it("skips malformed entries without changing candidate selection, and handles empty input", () => {
    expect(adaptCourseQuestionsToInteractiveDrills([])).toEqual({ examples: [], validQuestionCount: 0 });
    const result = adaptCourseQuestionsToInteractiveDrills([first(), { ...second(), correctIndex: undefined }, second()]);
    expect(result.validQuestionCount).toBe(2);
    expect(swipe(result.examples).map(item => item.prompt)).toEqual(
      swipe(adaptCourseQuestionsToInteractiveDrills([first(), second()]).examples).map(item => item.prompt),
    );
  });

  it("rejects positional and cross-choice references anywhere in a source record", () => {
    const references = [
      "All of the above", "None of the below", "Both", "Neither is correct", "Both choices are correct",
      "A and B", "A, B are correct", "a, b are correct", "A,B are correct", "A, B", "A, B, or C", "a/b", "a and b", "A through C", "A, B, C", "Options A and C", "choice (B)", "choice(B)", "Answer 2", "1 and 3", "The same item",
      "I and II", "The first option", "the preceding statement", "as shown in the figure",
      "See the table", "the graph", "the passage", "Refer to the provided information",
    ];
    for (const reference of references) {
      for (const location of ["question", "correct", "distractor", "explanation"] as const) {
        const input = first();
        if (location === "question") input.question = `Which item matches ${reference}?`;
        if (location === "correct") input.options[1] = reference;
        if (location === "distractor") input.options[2] = reference;
        if (location === "explanation") input.explanation = reference;
        expect(adaptCourseQuestionsToInteractiveDrills([input, second()], { includeSpeedMatch: true })).toEqual(
          adaptCourseQuestionsToInteractiveDrills([null, second()], { includeSpeedMatch: true }),
        );
      }
    }
  });

  it("rejects missing source assets, ambiguous anaphora, prelabelled choices, and oversized sets", () => {
    const unsafe = [
      { ...first(), diagramAlt: "Missing illustration" },
      { ...first(), imageUrl: "asset.png" },
      { ...first(), context: "Separate source context" },
      { ...first(), passage: "Separate passage" },
      { ...first(), attachments: ["attachment"] },
      { ...first(), question: "Which item should it contain?" },
      { ...first(), question: "What is the result in this scenario?" },
      { ...first(), options: ["A. Red box", "B. Blue box"] },
      { ...first(), options: Array.from({ length: 27 }, (_, index) => `Distinct synthetic object ${index}`) },
    ];
    expect(adaptCourseQuestionsToInteractiveDrills(unsafe, { includeSpeedMatch: true })).toEqual({ examples: [], validQuestionCount: 0 });
  });

  it("retains ordinary unrelated words and self-contained source context", () => {
    const inputs = [
      source("A water tank contains 120 L. What volume remains after 20 L is removed?", "100 L", { options: ["80 L", "100 L", "140 L"] }),
      source("Which object made of copper is suitable for a display?", "A polished copper ball", { options: ["A painted wooden cube", "A polished copper ball", "A paper cone"] }),
      source("Which statement is false?", "The copper cube is transparent", { options: ["The blue cone is blue", "The copper cube is transparent", "The red ball is red"] }),
    ];
    const result = adaptCourseQuestionsToInteractiveDrills(inputs);
    expect(result.validQuestionCount).toBe(inputs.length);
    expect(swipe(result.examples)).toHaveLength(inputs.length);
    expect(swipe(result.examples)[0].prompt).toContain(inputs[0].question);
    expect(swipe(result.examples)[0].prompt).toContain("A. 80 L  |  B. 100 L  |  C. 140 L");
    expect(choices(result.examples).map(item => item.mode)).toEqual(["tap-the-flaw"]);
  });

  it("never synthesizes speed matches even when distinct keyed answers are equally valid cross-pairs", () => {
    const inputs = [
      source("Which mammal can fly?", "A fruit bat", { options: ["A brown trout", "A fruit bat", "A garden snail"] }),
      source("Which animal can fly?", "A barn owl", { options: ["A pond turtle", "A barn owl", "A garden snail"] }),
      first(), second(),
    ];
    const defaultResult = adaptCourseQuestionsToInteractiveDrills(inputs);
    const optedIn = adaptCourseQuestionsToInteractiveDrills(inputs, { includeSpeedMatch: true });
    expect(defaultResult.validQuestionCount).toBe(4);
    expect(swipe(defaultResult.examples)).toHaveLength(4);
    expect(matches(defaultResult.examples)).toEqual([]);
    expect(matches(optedIn.examples)).toEqual([]);
    expect(optedIn).toEqual(defaultResult);
    expect(adaptCourseQuestionsToInteractiveDrills(inputs, { includeSpeedMatch: false })).toEqual(defaultResult);
  });

  it("accepts real getQuestions metadata but rejects source steps and tips that drills cannot preserve", () => {
    // quizRouter.getQuestions projects these fields from the questions table;
    // undefined steps/tip disappear on JSON transport, and diagram fields are
    // not projected at all, which this adapter cannot recover or detect.
    const projected = {
      id: 123, module: "Fictional module", cognitiveLevel: "application", difficulty: "medium",
      question: "Which object belongs in the fictional box?",
      options: ["A painted wooden cube", "A polished glass sphere"], correctIndex: 0,
      explanation: "Synthetic explanation.", steps: undefined, tip: undefined,
      isCalc: false, topic: "Fictional topic", attemptToken: "synthetic-token",
    };
    const result = adaptCourseQuestionsToInteractiveDrills([projected]);
    expect(result.validQuestionCount).toBe(1);
    expect(swipe(result.examples)[0].prompt).toContain(projected.question);
    expect(swipe(result.examples)[0].prompt).toContain("A. A painted wooden cube  |  B. A polished glass sphere");
    expect(swipe(result.examples)[0].explanation).toContain(projected.explanation);
    expect(adaptCourseQuestionsToInteractiveDrills([{ ...projected, steps: [], tip: " " }])).toEqual(result);
    for (const extra of [{ steps: [{ l: "Step 1", c: "Required context" }] }, { tip: "Required tip" }, { steps: {} }, { tip: false }]) {
      expect(adaptCourseQuestionsToInteractiveDrills([{ ...projected, ...extra }])).toEqual({ examples: [], validQuestionCount: 0 });
    }
  });

  it("rejects nonempty diagram and separate context fields, including alternate spellings", () => {
    const fields = ["diagram", "diagrams", "diagramId", "diagramAlt", "diagram_id", "diagram_alt", "diagramUrl", "diagramData", "contextHtml", "image", "images", "imageUrl", "image_url", "figure", "figures", "figureId", "figure_id", "table", "tables", "chart", "charts", "graph", "graphs", "passage", "excerpt", "context", "contextText", "context_text", "scenario", "scenarioText", "scenario_text", "attachment", "attachments"];
    for (const field of fields) {
      for (const value of ["source context", ["source context"], { text: "source context" }, false]) {
        expect(adaptCourseQuestionsToInteractiveDrills([{ ...first(), [field]: value }], { includeSpeedMatch: true }), field).toEqual({ examples: [], validQuestionCount: 0 });
      }
      expect(adaptCourseQuestionsToInteractiveDrills([{ ...first(), [field]: null }]).validQuestionCount, field).toBe(1);
      expect(adaptCourseQuestionsToInteractiveDrills([{ ...first(), [field]: " " }]).validQuestionCount, field).toBe(1);
      expect(adaptCourseQuestionsToInteractiveDrills([{ ...first(), [field]: [] }]).validQuestionCount, field).toBe(1);
    }
  });

  it("does not use questions from earlier calls or another course", () => {
    const courseA = first();
    const courseB = second();
    const a = adaptCourseQuestionsToInteractiveDrills([courseA], { includeSpeedMatch: true });
    const b = adaptCourseQuestionsToInteractiveDrills([courseB], { includeSpeedMatch: true });
    expect(matches(a.examples)).toHaveLength(0);
    expect(matches(b.examples)).toHaveLength(0);
    expect(JSON.stringify(a)).not.toContain(courseB.question);
    expect(JSON.stringify(a)).not.toContain(courseB.options[courseB.correctIndex]);
    expect(JSON.stringify(b)).not.toContain(courseA.question);
    expect(JSON.stringify(b)).not.toContain(courseA.options[courseA.correctIndex]);
  });

  it("recognizes explicit negative and exception questions as odd-one-out without rewriting or rekeying", () => {
    const stems = [
      "Which of the following is NOT a fictional blue shape?",
      "Which one of these does not belong in the fictional group?",
      "Which option is not a fictional fruit?",
    ];
    const inputs = stems.map((stem, index) => source(stem, `Synthetic response-${index}`, {
      options: [` A synthetic alpha choice-${index} `, `Synthetic response-${index}`, `Synthetic omega choice-${index}`],
      correctIndex: index % 3,
      explanation: `  Synthetic explanation ${index}.  `,
    }));
    const result = adaptCourseQuestionsToInteractiveDrills(inputs);
    expect(result.validQuestionCount).toBe(inputs.length);
    expect(swipe(result.examples)).toHaveLength(inputs.length);
    const derived = choices(result.examples);
    expect(derived.map(item => item.mode)).toEqual(inputs.map(() => "odd-one-out"));
    for (const [index, item] of derived.entries()) {
      const input = inputs[index];
      expect(item.prompt).toBe(input.question);
      expect(item.options.map(option => option.label)).toEqual(input.options);
      expect(item.options.findIndex(option => option.id === item.correctOptionId)).toBe(input.correctIndex);
      expect(item.explanation).toBe(input.explanation);
      expect(new Set(item.options.map(option => option.id)).size).toBe(input.options.length);
    }
    expect(new Set(result.examples.map(item => item.id)).size).toBe(result.examples.length);
    expect(adaptCourseQuestionsToInteractiveDrills(inputs)).toEqual(result);
  });

  it("recognizes explicitly false or incorrect statements as tap-the-flaw", () => {
    const stems = [
      "Which statement is false?",
      "Which of the following statements is incorrect?",
      "Which one of these statements is FALSE?",
    ];
    const inputs = stems.map((stem, index) => source(stem, `Synthetic claim-${index}`, {
      options: [`Synthetic alpha claim ${index}`, `Synthetic claim-${index}`, `Synthetic omega claim ${index}`],
      correctIndex: index % 3,
      explanation: `  Reason ${index}  `,
    }));
    const result = choices(adaptCourseQuestionsToInteractiveDrills(inputs).examples);
    expect(result.map(item => item.mode)).toEqual(inputs.map(() => "tap-the-flaw"));
    result.forEach((item, index) => {
      expect(item.prompt).toBe(inputs[index].question);
      expect(item.options.map(option => option.label)).toEqual(inputs[index].options);
      expect(item.options.findIndex(option => option.id === item.correctOptionId)).toBe(inputs[index].correctIndex);
      expect(item.explanation).toBe(inputs[index].explanation);
    });
  });

  it("does not mistake incidental negative words, double negatives, or different tasks for choice modes", () => {
    const stems = [
      "Which object is red?",
      "What does NOT happen next?",
      "Which of the following is not incorrect?",
      "Which of the following is not false?",
      "Which of the following is not true?",
      "Which of the following is not an exception?",
      "Which of the following is not a fictional fruit or not a fictional shape?",
      "Which of the following is not a fictional fruit? Which object is red?",
      "Which statement is not false?",
      "Which statement is true?",
      "Which statement is false or incomplete?",
      "Which statement is false in the passage?",
      "Which of the following is not shown in the diagram?",
      "Explain the exception to the fictional rule.",
      "Which of the following are fictional items except when it rains?",
      "Which of the following is not a fictional item if it is red?",
      "What is the effect of a fictional event?",
    ];
    const inputs = stems.map((stem, index) => source(stem, `Synthetic response-${index}`));
    const result = adaptCourseQuestionsToInteractiveDrills(inputs);
    expect(result.validQuestionCount).toBe(inputs.length - 4);
    expect(swipe(result.examples)).toHaveLength(inputs.length - 4);
    expect(choices(result.examples)).toHaveLength(0);
    expect(ordering(result.examples)).toHaveLength(0);
  });

  it("only maps explicit cause questions whose every original choice is labeled as an effect", () => {
    const a = source("What is the effect of the fictional switch?", "Effect: The imaginary lamp glows", {
      options: ["Effect: The imaginary lamp dims", "Effect: The imaginary lamp glows", "Effect: The imaginary lamp blinks"],
      correctIndex: 2,
      explanation: " Synthetic effect explanation. ",
    });
    const b = source("WHAT IS THE EFFECT OF THE FICTIONAL LEVER?", "effect: The imaginary wheel turns", {
      options: ["effect: The imaginary wheel turns", "Effect: The imaginary wheel stops"], correctIndex: 0,
    });
    const result = choices(adaptCourseQuestionsToInteractiveDrills([a, b]).examples);
    expect(result.map(item => item.mode)).toEqual(["cause-effect", "cause-effect"]);
    [a, b].forEach((input, index) => {
      const item = result[index];
      expect(item.prompt).toBe(input.question);
      expect(item.options.map(option => option.label)).toEqual(input.options);
      expect(item.options.findIndex(option => option.id === item.correctOptionId)).toBe(input.correctIndex);
      expect(item.explanation).toBe(input.explanation);
    });
  });

  it("leaves ambiguous cause/effect wording and incomplete choice mappings unavailable", () => {
    const explicit = ["Effect: The result is 5", "Effect: The result is 6"];
    const inputs = [
      source("What is the effect of adding 2 to 3?", "The result is 5", { options: [explicit[0], "The result is 6"], correctIndex: 0 }),
      source("What is the cause of 2 plus 3 equaling 5?", "Adding 2 to 3", { options: ["Effect: Adding 2 to 3", "Effect: Subtracting 2 from 3"], correctIndex: 0 }),
      source("Which effect follows adding 2 to 3?", "The result is 5", { options: explicit, correctIndex: 0 }),
      source("What is not the effect of adding 2 to 3?", "The result is 6", { options: explicit, correctIndex: 1 }),
      source("What is the effect of this?", "x", { options: explicit, correctIndex: 0 }),
      source("What is the effect of the diagram shown?", "x", { options: explicit, correctIndex: 0 }),
      source("What is the effect of adding 2 or subtracting negative 2 from 3?", "The result is 5", { options: explicit, correctIndex: 0 }),
      source("What is the effect of adding 2 to 3?", "The result is 5", { options: ["Effect:", explicit[0]], correctIndex: 1 }),
    ];
    const result = adaptCourseQuestionsToInteractiveDrills(inputs);
    expect(result.validQuestionCount).toBe(inputs.length - 2);
    expect(choices(result.examples)).toHaveLength(0);
  });

  it("maps before/after only when the original choices exactly match the renderer's fixed controls", () => {
    const a = source("Does the fictional sunrise occur before or after the fictional ceremony?", "After", {
      options: ["Before", "After"], correctIndex: 1, explanation: "  Synthetic ordering explanation.  ",
    });
    const b = source("Does the fictional opening occur before or after the fictional closing?", "Before", {
      options: ["Before", "After"], correctIndex: 0,
    });
    const result = adaptCourseQuestionsToInteractiveDrills([a, b]);
    const items = ordering(result.examples);
    expect(items).toHaveLength(2);
    expect(items.map(item => item.correctAnswer)).toEqual(["after", "before"]);
    expect(items.map(item => item.prompt)).toEqual([a.question, b.question]);
    expect(items.map(item => item.explanation)).toEqual([a.explanation, b.explanation]);
    expect(choices(result.examples)).toHaveLength(0);
  });

  it("rejects before/after alternatives the fixed controls cannot preserve or safely map", () => {
    const stem = "Does the fictional opening occur before or after the fictional closing?";
    const inputs = [
      source(stem, "Before", { options: ["After", "Before"], correctIndex: 1 }),
      source(stem, "before", { options: ["before", "after"], correctIndex: 0 }),
      source(stem, "Before", { options: [" Before", "After"], correctIndex: 0 }),
      source(stem, "Before", { options: ["Before", "After", "Simultaneously"], correctIndex: 0 }),
      source(stem, "Yes", { options: ["Yes", "No"], correctIndex: 0 }),
      source("Which event comes before fictional event B?", "Before", { options: ["Before", "After"], correctIndex: 0 }),
      source("Does fictional event A not occur before or after fictional event B?", "Before", { options: ["Before", "After"], correctIndex: 0 }),
      source("Does it occur before or after fictional event B?", "Before", { options: ["Before", "After"], correctIndex: 0 }),
      source("Does the event shown in the diagram occur before or after fictional event B?", "Before", { options: ["Before", "After"], correctIndex: 0 }),
      source("Does fictional event A or event C occur before or after fictional event B?", "Before", { options: ["Before", "After"], correctIndex: 0 }),
    ];
    const result = adaptCourseQuestionsToInteractiveDrills(inputs);
    expect(result.validQuestionCount).toBe(inputs.length - 5);
    expect(ordering(result.examples)).toHaveLength(0);
  });

  it("does not create derived modes for rejected records and keeps source positions in stable IDs", () => {
    const odd = source("Which of the following is not a fictional shape?", "Synthetic item");
    const flaw = source("Which statement is false?", "Synthetic statement");
    const result = adaptCourseQuestionsToInteractiveDrills([
      { ...odd, correctIndex: undefined },
      odd,
      { ...flaw, disabled: true },
      flaw,
      { ...odd, diagramId: "source-image" },
      { ...flaw, options: ["Same", " same "] },
    ]);
    expect(result.validQuestionCount).toBe(2);
    expect(choices(result.examples).map(item => item.id)).toEqual(["course-odd-one-out-1", "course-tap-the-flaw-3"]);
    expect(matches(result.examples)).toHaveLength(0);
  });
});
