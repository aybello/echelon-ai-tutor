import type { ChoiceDrillExample, DrillExample, RapidSwipeExample } from "../components/InteractiveDrill";

export interface CourseInteractiveAdapterOptions {
  /** @deprecated Automatic speed matching is disabled until pairs are authored and verified. */
  includeSpeedMatch?: boolean;
}

export interface CourseInteractiveAdapterResult {
  readonly examples: readonly DrillExample[];
  /** Number of input questions accepted for Rapid Swipe, not the activity count. */
  readonly validQuestionCount: number;
}

type ValidQuestion = {
  sourceIndex: number;
  question: string;
  options: readonly string[];
  correctIndex: number;
  explanation: string;
};

const key = (text: string) => text.trim().replace(/\s+/g, " ").toLowerCase();
const nonemptyString = (value: unknown): value is string => typeof value === "string" && value.trim().length > 0;

// A choice's meaning must not depend on its position or another choice. Keep
// this deliberately conservative: an ambiguous reference is not a safe drill.
function hasUnsafeReference(text: string): boolean {
  return /\b(?:above|below|preceding|aforementioned|previous(?:ly)?|latter|former|respectively)\b/i.test(text) ||
    /\b(?:diagram|figure|image|illustration|table|chart|graph|picture|photo|photograph|passage|excerpt|case study|attachment|appendix|video|audio|depicted|pictured|shown)\b/i.test(text) ||
    /\b(?:refer(?:ring)? to|as (?:shown|described|indicated|provided))\b/i.test(text) ||
    /\b(?:both|all|none|neither|either)\b/i.test(text) ||
    /\b(?:following|given)\s+(?:information|data|scenario|situation|case|example)\b/i.test(text) ||
    /\b(?:option|choice|answer|statement|item)s?(?:\s+|(?=\())\(?[a-z0-9]\b\)?/i.test(text) ||
    /\b(?:first|second|third|fourth|last)\s+(?:option|choice|answer|statement|item)\b/i.test(text) ||
    /\bthe same (?:item|option|choice|answer|statement)\b/i.test(text) ||
    /\b(?:event|alternative|response)s?\s+[A-Z]\b/.test(text) ||
    /(?:^|\s)\([A-Za-z]\)\s*(?:,|and\b|or\b|&|\/|is\b|only\b)/i.test(text) ||
    /\b[A-Z]\s+(?:only|is\s+(?:correct|incorrect|true|false))\b/.test(text) ||
    /\b[A-Z]\s*,\s*[A-Z]\b/i.test(text) ||
    /\b[A-Z]\s*(?:through|to|[-–—])\s*[A-Z]\b/.test(text) ||
    /\b[A-Z]\s*(?:,\s*[A-Z]\s*)*,?\s*(?:and|or|&|\/)\s*[A-Z]\b/.test(text) ||
    /\b[a-z](?:\s*,\s*[a-z])*\s*(?:,?\s+(?:and|or)\s+|\s*[&\/]\s*)[a-z]\b/.test(text) ||
    /\b(?:\d+|i{1,3}|iv|v)\s*(?:,\s*(?:\d+|i{1,3}|iv|v)\s*)*(?:and|or|&|\/)\s*(?:\d+|i{1,3}|iv|v)\b/i.test(text) ||
    /\b(?:option|choice|answer|statement)\s+\(?[a-z0-9]\)?\s*(?:is|and|or|through|to)\b/i.test(text) ||
    /\b(?:answer|choice|option)\s+(?:is|was)\s+\(?[a-z0-9]\b\)?/i.test(text) ||
    /^\(?[ivx]+\)?[.!]?$/i.test(text.trim()) ||
    /^(?:\(?[A-Za-z0-9]+\)?[.):]\s*)?(?:[A-Za-z]|\(?\d+\)?)\s*$/i.test(text.trim()) ||
    /\b(?:this|that|these|those)\s+(?:question|scenario|situation|case|information|data|material|example|following)\b/i.test(text) ||
    /\b(?:it|they|their|its)\b/i.test(text) ||
    /\b(?:this|that|these|those)\s*[?.!]\s*$/i.test(text) ||
    /^(?:does|did|is|was|are|were|can|could|will|would|should|what|why|how)\s+(?:it|they|this|that)\b/i.test(text.trim());
}

// Separate source material cannot be rendered by the drill. getQuestions also
// returns optional worked steps and a tip; reject nonempty values rather than
// silently discarding source explanation content. Its current projection does
// not expose diagram metadata, so missing upstream fields cannot be detected.
function hasSeparateContext(record: Record<string, unknown>): boolean {
  const fields = [
    "diagram", "diagrams", "diagramId", "diagramAlt", "diagram_id", "diagram_alt",
    "image", "images", "imageUrl", "image_url", "figure", "figures", "figureId", "figure_id",
    "table", "tables", "chart", "charts", "graph", "graphs", "passage", "excerpt",
    "context", "contextText", "context_text", "scenario", "scenarioText", "scenario_text",
    "attachment", "attachments", "steps", "tip",
  ];
  // Also reject unanticipated diagram/context projection variants (for example
  // diagramUrl or context_text) instead of silently discarding them.
  const names = Object.keys(record).filter(name => /^(?:diagram|context)/i.test(name));
  return [...fields, ...names].some(name => {
    const value = record[name];
    return value != null && !(typeof value === "string" && value.trim() === "") &&
      !(Array.isArray(value) && value.length === 0);
  });
}

/** Aliases are accepted only when every provided alias is valid and agrees. */
function sameAlias(record: Record<string, unknown>, names: readonly string[], valid: (value: unknown) => boolean): unknown {
  const supplied = names.filter(name => record[name] !== undefined);
  if (!supplied.length) return undefined;
  const first = record[supplied[0]];
  return supplied.every(name => valid(record[name]) && record[name] === first) ? first : undefined;
}

function parseQuestion(value: unknown, sourceIndex: number): ValidQuestion | undefined {
  if (value === null || typeof value !== "object" || Array.isArray(value)) return undefined;
  const record = value as Record<string, unknown>;
  // If a visibility flag is present, require an unambiguous boolean value.
  for (const flag of ["disabled", "isDisabled", "is_disabled", "hidden", "isHidden"]) {
    if (record[flag] !== undefined && record[flag] !== false) return undefined;
  }
  for (const flag of ["enabled", "isEnabled", "is_enabled", "active", "isActive", "is_active"]) {
    if (record[flag] !== undefined && record[flag] !== true) return undefined;
  }
  if (record.status !== undefined && (typeof record.status !== "string" || !/^(active|enabled|published|approved|live)$/i.test(record.status.trim()))) return undefined;
  if (hasSeparateContext(record)) return undefined;

  const question = sameAlias(record, ["question", "q", "text"], nonemptyString);
  const correctIndex = sameAlias(record, ["correctIndex", "correct", "correctAnswer"], value => typeof value === "number" && Number.isInteger(value));
  const options = record.options;
  if (!nonemptyString(question) || !nonemptyString(record.explanation) || !Array.isArray(options) || options.length < 2 || !Array.from(options).every(nonemptyString)) return undefined;
  if (typeof correctIndex !== "number" || correctIndex < 0 || correctIndex >= options.length) return undefined;
  // Duplicate option text makes the proposed answer impossible to score fairly.
  if (new Set(options.map(key)).size !== options.length) return undefined;
  if ([question, ...options, record.explanation].some(hasUnsafeReference)) return undefined;
  // Only plain, unlabelled choices can be given the same A/B/C labels used by
  // the source quiz; reject prelabelled or unusually large sets rather than
  // duplicating or changing labels.
  if (options.length > 26 || options.some(option => /^\s*(?:\(?[a-z]\)|[a-z][.:]|\d+[.):])\s+/i.test(option))) return undefined;
  return { sourceIndex, question, options, correctIndex, explanation: record.explanation };
}

// New mode detection intentionally recognizes a small set of explicit question
// forms, not subject matter or inferred relationships. The source answer key is
// authoritative; no content is rewritten or independently asserted as fact.
function choiceMode(item: ValidQuestion): ChoiceDrillExample["mode"] | undefined {
  const stem = key(item.question);
  // The choice UI cannot supply omitted visual or textual source material.
  if (/\b(?:above|preceding|figure|diagram|image|illustration|table|chart|graph|shown|pictured|passage|excerpt|scenario|case study)\b/.test(stem)) return undefined;
  if (item.options.some(option => /\b(?:figure|diagram|image|illustration|table|chart|graph|pictured|passage|excerpt|case study)\b/i.test(option))) return undefined;

  if (/^which (?:(?:one of |of )(?:the following |these ))?statements? (?:below )?is (?:false|incorrect)\s*[?.:]?$/.test(stem)) return "tap-the-flaw";

  // Reject extra negations and truth-value wording: e.g. "not incorrect" or
  // "not true" is not safely classified as an ordinary odd-one-out question.
  const notQuestion = /^which (?:one )?(?:of the following|of these|of the options|item|option) (?:is|does) not\s+(.+?)\s*\?$/.exec(stem);
  const exceptQuestion = /^all (?:of the following|of these)\s+(.+?)\s+except\s*[?.:]?$/.exec(stem);
  const remainder = notQuestion?.[1] ?? exceptQuestion?.[1];
  if (remainder && !/\b(?:not|never|no|neither|nor|except|exceptions?|false|incorrect|correct|true|untrue|wrong|unless|without|or|if|this|that|these|those|it|they|their|its)\b/.test(remainder) && !/[?!;:\n]/.test(remainder)) return "odd-one-out";

  // Requiring an explicit effect label on every choice avoids classifying an
  // arbitrary MCQ merely because its stem mentions a cause or an effect.
  if (/^what is the effect of\s+[^?]+\?$/.test(stem) &&
      !/\b(?:not|never|no|neither|nor|except|false|incorrect|unless|without|if|or|this|that|these|those|it|they|their|its)\b/.test(stem) &&
      !/[;:\n]/.test(stem) &&
      item.options.every(option => /^effect:\s*\S.+$/i.test(option.trim()))) return "cause-effect";
  return undefined;
}

function beforeAfterAnswer(item: ValidQuestion): "before" | "after" | undefined {
  // The renderer supplies fixed, ordered buttons and cannot preserve alternative
  // spellings, extra choices, or a reversed order. Accept only exact labels;
  // otherwise the mode must remain unavailable for this source question.
  if (item.options.length !== 2 || item.options[0] !== "Before" || item.options[1] !== "After") return undefined;
  const stem = key(item.question);
  const match = /^does\s+(.+?)\s+occur before or after\s+(.+?)\?$/.exec(stem);
  if (!match || match[1] === match[2] || [match[1], match[2]].some(part =>
    /[?!;:\n]/.test(part) || /\b(?:before|after|not|never|no|neither|nor|except|unless|without|if|or|this|that|these|those|it|they|their|its|figure|diagram|image|table|chart|graph|shown|pictured|passage|excerpt|above|below)\b/.test(part)
  )) return undefined;
  return item.correctIndex === 0 ? "before" : "after";
}

/**
 * Converts only the already-authorized, loaded list supplied by the caller.
 * This function does not load, merge, persist, or authorize course content.
 * It preserves source strings; no answer key is inferred or fabricated.
 * For stable IDs the caller should keep the input order stable. The caller must
 * pass one course's practice bank, not a mixture or an unrevealed assessment.
 */
export function adaptCourseQuestionsToInteractiveDrills(
  questions: readonly unknown[],
  _options: CourseInteractiveAdapterOptions = {},
): CourseInteractiveAdapterResult {
  const valid = questions.map(parseQuestion).filter((question): question is ValidQuestion => question !== undefined);
  const examples: DrillExample[] = valid.map((item, index): RapidSwipeExample => {
    const correctAnswer = index % 2 === 0;
    const candidateIndex = correctAnswer ? item.correctIndex : item.options.findIndex((_, optionIndex) => optionIndex !== item.correctIndex);
    // Preserve the source quiz's A/B/C labels and show the candidate only once.
    const label = (optionIndex: number) => String.fromCharCode(65 + optionIndex);
    const choices = item.options.map((option, optionIndex) => `${label(optionIndex)}. ${option}`).join("  |  ");
    return {
      id: `course-rapid-${item.sourceIndex}`,
      mode: "rapid-swipe",
      prompt: `${item.question}\n\n${choices}\n\nIs option ${label(candidateIndex)} the correct answer?`,
      correctAnswer,
      explanation: `Correct option: ${label(item.correctIndex)}. ${item.options[item.correctIndex]}\n${item.explanation}`,
    };
  });

  for (const item of valid) {
    const mode = choiceMode(item);
    if (mode) {
      const choices = item.options.map((label, index) => ({ id: `course-option-${item.sourceIndex}-${index}`, label }));
      examples.push({
        id: `course-${mode}-${item.sourceIndex}`,
        mode,
        prompt: item.question,
        options: choices,
        correctOptionId: choices[item.correctIndex].id,
        explanation: item.explanation,
      });
    }
    const answer = beforeAfterAnswer(item);
    if (answer) examples.push({
      id: `course-before-after-${item.sourceIndex}`,
      mode: "before-after",
      prompt: item.question,
      correctAnswer: answer,
      explanation: item.explanation,
    });
  }

  // A keyed MCQ cannot establish that cross-pairs are wrong. Never synthesize
  // matching pairs, including when the legacy option is explicitly enabled.
  return { examples, validQuestionCount: valid.length };
}
