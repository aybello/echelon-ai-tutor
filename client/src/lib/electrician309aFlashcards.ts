export interface Electrician309AFlashcardSource {
  module: string;
  topic?: string;
  question?: string;
  options: string[];
  correctIndex?: number;
  explanation: string;
  tip?: string;
  diagramId?: string | null;
}

export interface Electrician309AFlashcardContent {
  kicker: string;
  topic: string;
  title: string;
  prompt: string;
  answer: string;
  explanation: string;
  takeaway?: string;
  diagramNote?: string;
}

export const ELECTRICIAN_309A_FLASHCARD_TARGETS = {
  A: 22,
  B: 56,
  C: 60,
  D: 42,
  E: 20,
} as const;

function normalise(value: string | undefined): string {
  return (value ?? "").replace(/\s+/g, " ").trim();
}

function moduleCode(module: string): string {
  return module.match(/^([A-E])\./)?.[1] ?? module;
}

function displayTopic(value: string): string {
  return normalise(value)
    .replace(/[-_/]+/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function optionText(card: Electrician309AFlashcardSource): string {
  const index = card.correctIndex;
  if (index === undefined || index < 0 || index >= card.options.length) return "Answer unavailable";
  return normalise(card.options[index]).replace(/^[A-Da-d][.):]\s*/, "");
}

function answerablePrompt(value: string): string {
  const normalised = normalise(value);
  if (!normalised) return "Recall the safest and most defensible response for this topic.";
  return normalised;
}

function selectEvenly<T>(cards: T[], target: number): T[] {
  if (cards.length <= target) return cards;
  return Array.from({ length: target }, (_, index) => cards[Math.floor(((index + 0.5) * cards.length) / target)]);
}

/**
 * Produces a stable, blueprint-weighted study deck instead of exposing every
 * assessment item as a flashcard. The original question IDs remain intact so
 * existing learner progress continues to refer to canonical bank records.
 */
export function selectElectrician309AFlashcards<T extends { module: string; isCalc?: boolean; type?: string }>(questions: T[]): T[] {
  const conceptual = questions.filter((question) => !question.isCalc && question.type !== "calculation");
  return (Object.entries(ELECTRICIAN_309A_FLASHCARD_TARGETS) as [keyof typeof ELECTRICIAN_309A_FLASHCARD_TARGETS, number][])
    .flatMap(([code, target]) => selectEvenly(
      conceptual.filter((question) => moduleCode(question.module) === code),
      target,
    ));
}

/**
 * Projects a governed assessment question into an answerable study card while
 * retaining the complete approved answer and explanation after reveal.
 */
export function buildElectrician309AFlashcard(card: Electrician309AFlashcardSource): Electrician309AFlashcardContent {
  const topic = normalise(card.topic) || "Construction electrician decision making";
  const explanation = normalise(card.explanation);
  const prompt = answerablePrompt(card.question ?? "");
  const takeaway = normalise(card.tip) || undefined;

  return {
    kicker: `Module ${moduleCode(card.module)} · Ontario 309A`,
    topic: displayTopic(topic),
    title: "Check your understanding",
    prompt,
    answer: optionText(card),
    explanation,
    takeaway,
  };
}
