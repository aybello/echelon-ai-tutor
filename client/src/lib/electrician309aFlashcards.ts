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
  takeaway: string;
  diagramNote?: string;
}

function normalise(value: string | undefined): string {
  return (value ?? "").replace(/\s+/g, " ").trim();
}

function compact(value: string, limit: number): string {
  const text = normalise(value);
  if (text.length <= limit) return text;
  const sentenceEnd = text.lastIndexOf(". ", limit);
  const boundary = sentenceEnd >= Math.floor(limit * 0.55) ? sentenceEnd + 1 : text.lastIndexOf(" ", limit);
  return `${text.slice(0, Math.max(boundary, 1)).trimEnd()}…`;
}

function firstSentence(value: string): string {
  const text = normalise(value);
  const match = text.match(/^.*?[.!?](?=\s|$)/);
  return match?.[0] ?? compact(text, 150);
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
  const index = card.correctIndex ?? 0;
  return normalise(card.options[index]).replace(/^[A-Da-d][.):]\s*/, "");
}

/**
 * Projects a governed assessment question into a concise study card without
 * changing the approved answer, explanation, topic, or source-derived facts.
 */
export function buildElectrician309AFlashcard(card: Electrician309AFlashcardSource): Electrician309AFlashcardContent {
  const topic = normalise(card.topic) || "Construction electrician decision making";
  const explanation = normalise(card.explanation);
  const prompt = compact(card.question ?? "", 180);
  const takeaway = normalise(card.tip) || firstSentence(explanation);

  return {
    kicker: `Module ${moduleCode(card.module)} · Ontario 309A`,
    topic: displayTopic(topic),
    title: "Decision check",
    prompt: prompt ? `Scenario cue: ${prompt}` : "Recall the safest and most defensible operating decision for this topic.",
    answer: optionText(card),
    explanation: compact(explanation, 360),
    takeaway: compact(takeaway, 180),
    diagramNote: card.diagramId ? "This concept is paired with an original Echelon study diagram in the course notes." : undefined,
  };
}
