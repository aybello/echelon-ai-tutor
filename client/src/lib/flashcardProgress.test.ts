import { describe, expect, it } from "vitest";
import {
  normalizeKnownFlashcardIds,
  stillLearningCards,
  summarizeFlashcardProgress,
} from "./flashcardProgress";

const cards = [{ id: 101 }, { id: 102 }, { id: "103" }];

describe("flashcard progress summaries", () => {
  it("normalizes old numeric and string persistence values to stable card keys", () => {
    const known = normalizeKnownFlashcardIds([101, "102", "stale"], cards);
    expect([...known]).toEqual(["101", "102"]);
  });

  it("reports Got it and Still learning from the selected study scope", () => {
    const known = normalizeKnownFlashcardIds(["101", 103], cards);
    expect(summarizeFlashcardProgress(cards, known)).toEqual({ total: 3, gotIt: 2, stillLearning: 1 });
  });

  it("keeps review filtering aligned with the displayed still-learning count", () => {
    const known = normalizeKnownFlashcardIds([101], cards);
    const summary = summarizeFlashcardProgress(cards, known);
    expect(stillLearningCards(cards, known).map((card) => card.id)).toEqual([102, "103"]);
    expect(stillLearningCards(cards, known)).toHaveLength(summary.stillLearning);
  });
});
