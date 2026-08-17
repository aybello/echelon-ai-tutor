import { describe, expect, it } from "vitest";
import { advanceReviewQueue } from "./flashcardStudy";

describe("advanceReviewQueue", () => {
  const cards = [{ id: 1 }, { id: 2 }, { id: 3 }];

  it("removes a card marked known from the still-learning queue", () => {
    expect(advanceReviewQueue(cards, 0, "known")).toEqual({
      deck: [{ id: 2 }, { id: 3 }],
      index: 0,
      complete: false,
    });
  });

  it("moves a still-learning card behind the remaining cards", () => {
    expect(advanceReviewQueue(cards, 0, "learning")).toEqual({
      deck: [{ id: 2 }, { id: 3 }, { id: 1 }],
      index: 0,
      complete: false,
    });
  });

  it("wraps after a still-learning result on the last card", () => {
    expect(advanceReviewQueue(cards, 2, "learning")).toEqual({
      deck: cards,
      index: 0,
      complete: false,
    });
  });

  it("does not complete a one-card queue until the learner marks it known", () => {
    expect(advanceReviewQueue([{ id: 1 }], 0, "learning")).toEqual({
      deck: [{ id: 1 }],
      index: 0,
      complete: false,
    });
    expect(advanceReviewQueue([{ id: 1 }], 0, "known")).toEqual({
      deck: [],
      index: 0,
      complete: true,
    });
  });
});
