import { describe, expect, it } from "vitest";
import {
  buildElectrician309AFlashcard,
  ELECTRICIAN_309A_FLASHCARD_TARGETS,
  selectElectrician309AFlashcards,
} from "./electrician309aFlashcards";

describe("buildElectrician309AFlashcard", () => {
  it("uses a concise governed scenario cue while retaining the complete answer, explanation, and takeaway", () => {
    const longContext = "The approved drawing identifies the source, protection, distribution equipment, feeder, and connected load. ".repeat(3);
    const longExplanation = "The measured condition must be compared with the approved design and manufacturer information before the equipment is accepted. ".repeat(4);
    const card = buildElectrician309AFlashcard({
      module: "B. Distribution systems",
      topic: "Transformer loading verification",
      question: `${longContext}What comparison should be made before accepting the secondary loading?`,
      options: ["A. Check the enclosure colour", "B. Compare measured secondary current with the transformer rating", "C. Measure only no-load voltage", "D. Replace the transformer"],
      correctIndex: 1,
      explanation: longExplanation,
      tip: "Check the rating and the actual load together.",
      diagramId: "D04",
    });

    expect(card.topic).toBe("Transformer Loading Verification");
    expect(card.answer).toBe("Compare measured secondary current with the transformer rating");
    expect(card.prompt).toContain("The approved drawing identifies the source");
    expect(card.prompt.length).toBeLessThanOrEqual(220);
    expect(card.prompt).toBe(longContext.trim().split(". ")[0] + ".");
    expect(card.prompt).not.toContain("What comparison should be made");
    expect(card.explanation).toBe(longExplanation.replace(/\s+/g, " ").trim());
    expect(card.takeaway).toBe("Check the rating and the actual load together.");
    expect(card.diagramNote).toBeUndefined();
  });

  it("does not repeat the explanation as a fake takeaway when no tip is authored", () => {
    const card = buildElectrician309AFlashcard({
      module: "A. Occupational skills",
      topic: "Safe isolation",
      question: "What must happen before work begins?",
      options: ["A. Verify absence of voltage", "B. Begin work", "C. Remove PPE", "D. Skip documentation"],
      correctIndex: 0,
      explanation: "Prove the tester before and after verifying absence of voltage. This preserves the complete safe-work sequence.",
    });

    expect(card.takeaway).toBeUndefined();
    expect(card.diagramNote).toBeUndefined();
  });

  it("fails visibly instead of silently treating option A as correct", () => {
    const card = buildElectrician309AFlashcard({
      module: "A. Occupational skills",
      question: "Which answer is approved?",
      options: ["A. One", "B. Two", "C. Three", "D. Four"],
      explanation: "The governed answer index is required.",
    });

    expect(card.answer).toBe("Answer unavailable");
  });

  it("selects a stable 200-card conceptual deck using the exam blueprint", () => {
    const available = { A: 50, B: 105, C: 120, D: 80, E: 45 } as const;
    const questions = Object.entries(available).flatMap(([module, count]) =>
      Array.from({ length: count }, (_, index) => ({
        id: `${module}-${index + 1}`,
        module: `${module}. Module ${module}`,
        isCalc: false,
      })),
    );
    questions.push(...Object.keys(available).map((module) => ({
      id: `${module}-calc`,
      module: `${module}. Module ${module}`,
      isCalc: true,
    })));

    const deck = selectElectrician309AFlashcards(questions);
    expect(deck).toHaveLength(200);
    expect(new Set(deck.map((question) => question.id)).size).toBe(200);
    expect(deck.every((question) => !question.isCalc)).toBe(true);
    for (const [module, target] of Object.entries(ELECTRICIAN_309A_FLASHCARD_TARGETS)) {
      expect(deck.filter((question) => question.module.startsWith(`${module}.`))).toHaveLength(target);
    }
  });
});
