export interface FlashcardProgressCard {
  id: number | string;
}

export interface FlashcardProgressSummary {
  total: number;
  gotIt: number;
  stillLearning: number;
}

export function flashcardProgressKey(id: number | string): string {
  return String(id);
}

export function normalizeKnownFlashcardIds(
  savedIds: readonly (number | string)[],
  cards: readonly FlashcardProgressCard[],
): Set<string> {
  const validIds = new Set(cards.map((card) => flashcardProgressKey(card.id)));
  return new Set(savedIds.map(flashcardProgressKey).filter((id) => validIds.has(id)));
}

export function summarizeFlashcardProgress(
  cards: readonly FlashcardProgressCard[],
  knownIds: ReadonlySet<string>,
): FlashcardProgressSummary {
  const gotIt = cards.filter((card) => knownIds.has(flashcardProgressKey(card.id))).length;
  return { total: cards.length, gotIt, stillLearning: cards.length - gotIt };
}

export function stillLearningCards<T extends FlashcardProgressCard>(
  cards: readonly T[],
  knownIds: ReadonlySet<string>,
): T[] {
  return cards.filter((card) => !knownIds.has(flashcardProgressKey(card.id)));
}
