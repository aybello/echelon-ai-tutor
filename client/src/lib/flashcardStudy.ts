export type FlashcardReviewOutcome = "known" | "learning";

export interface FlashcardReviewQueueResult<T> {
  deck: T[];
  index: number;
  complete: boolean;
}

/**
 * Applies one self-assessment result to the active still-learning queue.
 *
 * - known: remove the card from the queue
 * - learning: move the card behind the remaining cards so it returns again
 */
export function advanceReviewQueue<T>(
  deck: readonly T[],
  index: number,
  outcome: FlashcardReviewOutcome,
): FlashcardReviewQueueResult<T> {
  if (deck.length === 0) {
    return { deck: [], index: 0, complete: true };
  }

  const safeIndex = Math.min(Math.max(index, 0), deck.length - 1);
  const nextDeck = [...deck];
  const [current] = nextDeck.splice(safeIndex, 1);

  if (outcome === "learning") {
    nextDeck.push(current);
  }

  const nextIndex = nextDeck.length === 0
    ? 0
    : safeIndex >= nextDeck.length || (outcome === "learning" && safeIndex === deck.length - 1)
      ? 0
      : safeIndex;

  return {
    deck: nextDeck,
    index: nextIndex,
    complete: outcome === "known" && nextDeck.length === 0,
  };
}
