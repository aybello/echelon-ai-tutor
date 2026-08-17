import { describe, expect, it } from "vitest";
import { buildElectrician309AFlashcard } from "./electrician309aFlashcards";

describe("buildElectrician309AFlashcard", () => {
  it("keeps the governed answer while projecting a concise topic-led study card", () => {
    const card = buildElectrician309AFlashcard({
      module: "B. Distribution systems",
      topic: "Transformer loading verification",
      question: "A dry-type transformer feeding a lighting distribution section runs hottest late in the afternoon. What comparison should be made before accepting the secondary loading?",
      options: ["A. Check the enclosure colour", "B. Compare measured secondary current with the transformer rating", "C. Measure only no-load voltage", "D. Replace the transformer"],
      correctIndex: 1,
      explanation: "The secondary winding carries the larger current in this relationship. Compare per-phase current, load duration, voltage, temperature rise, and the approved load calculation against the transformer rating.",
      tip: "Check the rating and the actual load together.",
      diagramId: "D04",
    });

    expect(card.topic).toBe("Transformer Loading Verification");
    expect(card.answer).toBe("Compare measured secondary current with the transformer rating");
    expect(card.prompt).toContain("Scenario cue:");
    expect(card.takeaway).toBe("Check the rating and the actual load together.");
    expect(card.diagramNote).toContain("original Echelon study diagram");
  });

  it("uses the approved explanation as the takeaway when no card tip is available", () => {
    const card = buildElectrician309AFlashcard({
      module: "A. Occupational skills",
      topic: "Safe isolation",
      question: "What must happen before work begins?",
      options: ["A. Verify absence of voltage", "B. Begin work", "C. Remove PPE", "D. Skip documentation"],
      correctIndex: 0,
      explanation: "Prove the tester before and after verifying absence of voltage. This preserves the complete safe-work sequence.",
    });

    expect(card.takeaway).toBe("Prove the tester before and after verifying absence of voltage.");
    expect(card.diagramNote).toBeUndefined();
  });
});
