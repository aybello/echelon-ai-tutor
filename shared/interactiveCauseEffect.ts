// Pure Cause and Effect mode-fit rules. No authored content, server code, or access logic.
//
// The six-mode release stored every cause-effect item as a generic single-answer
// choice. Three different kinds of item were mixed together:
//   - calculation: every option is a numeric quantity. These are arithmetic
//     practice, not cause and effect, and are excluded from this mode.
//   - directional: the keyed answer states that one named parameter increases,
//     decreases or stays unchanged. These are presented with direction controls.
//   - choice: a qualitative consequence ("a growing obstruction"). These remain
//     a choice of the most likely effect.
// Classification is structural. It never changes a keyed answer and is not a
// review of the underlying process science.

export const causeEffectDirections = ["increase", "decrease", "unchanged", "depends"] as const;
export type CauseEffectDirection = (typeof causeEffectDirections)[number];

export const CAUSE_EFFECT_DIRECTION_LABELS: Record<CauseEffectDirection, string> = {
  increase: "Increases",
  decrease: "Decreases",
  unchanged: "No change",
  depends: "Depends / not enough information",
};

export interface CauseEffectChoiceItem {
  id: string;
  prompt: string;
  instruction?: string;
  mode: "cause-effect";
  options: readonly { id: string; label: string }[];
  correctOptionId: string;
  explanation: string;
}

export interface CauseEffectEffect {
  id: string;
  /** The affected parameter, named explicitly. */
  parameter: string;
  direction: CauseEffectDirection;
  /** Why this parameter responds this way under the stated conditions. */
  explanation: string;
}

export interface CauseEffectEffectsItem {
  id: string;
  prompt: string;
  instruction?: string;
  mode: "cause-effect";
  /** Stated operating assumptions, including what is held constant. */
  assumptions?: string;
  effects: CauseEffectEffect[];
}

export type CauseEffectFit = "effects" | "directional" | "calculation" | "choice";

const clean = (value: string) => value.normalize("NFKC").trim().replace(/\s+/gu, " ");

// A computed quantity: optional approximation word, then a number that leads a
// short label ("15.7 minutes", "2,349 US gal", "0.20 day⁻¹", "24 m³/(m²·day)",
// "75% recovery and 200 m³/day concentrate", "2-log").
const QUANTITY = /^(?:(?:about|approximately|approx\.?|roughly|nearly)\s+|[~≈]\s*)?[-+]?\$?\d[\d,]*(?:\.\d+)?(?:$|[\s%/-])/u;

export const isQuantityLabel = (label: string) => { const value = clean(label); return value.length <= 60 && QUANTITY.test(value); };

// Hedged answers ("can decline", "may rise") are deliberately not matched: a
// possible outcome is not a definite direction, and stays a choice item.
const MODAL = "(?:(?:will|would|generally|usually|typically|normally|tends? to|is expected to)\\s+)*";
const INCREASE = "(?:increases?|rises?|doubles?|triples?|quadruples?|goes up|go up|grows?|gets? (?:higher|longer|larger|greater)|becomes? (?:higher|longer|larger|greater)|lengthens?)";
const DECREASE = "(?:decreases?|falls?|drops?|declines?|halves?|is halved|is cut in half|goes down|go down|shrinks?|gets? (?:lower|shorter|smaller)|becomes? (?:lower|shorter|smaller)|shortens?|is reduced)";
const UNCHANGED = "(?:stays? (?:the same|unchanged|constant|fixed)|remains? (?:the same|unchanged|constant|fixed)|is unchanged|does not change|do not change|will not change)";
const SUBJECT = "(?<subject>it|they|[\\p{L}\\p{N}][\\p{L}\\p{N} ,()/₀-₉-]{0,59}?)";
const directionPattern = (verb: string) => new RegExp(`^${SUBJECT}\\s+${MODAL}${verb}\\.?$`, "iu");
const DIRECTION_PATTERNS: readonly [CauseEffectDirection, RegExp][] = [
  ["increase", directionPattern(INCREASE)],
  ["decrease", directionPattern(DECREASE)],
  ["unchanged", directionPattern(UNCHANGED)],
];

/** The direction a label states, with its explicit subject when it is not a pronoun. */
export function statedDirection(label: string): { direction: CauseEffectDirection; subject: string | null } | null {
  const value = clean(label);
  for (const [direction, pattern] of DIRECTION_PATTERNS) {
    const match = pattern.exec(value);
    if (!match?.groups) continue;
    const subject = match.groups.subject;
    if (/^(?:it|they)$/iu.test(subject)) return { direction, subject: null };
    // "It must increase" or "Nothing changes" is not a named parameter.
    if (/^(?:it|they|this|that|there|nothing|everything|all|every|none)\b/iu.test(subject) || /\b(?:must|cannot|can't|not|never|no|always|only|and|or|but|can|may|might|could)\b/iu.test(subject)) return null;
    return { direction, subject };
  }
  return null;
}

// "... What happens to calculated CT?" names the affected parameter.
const PARAMETER_QUESTION = /\bwhat\s+(?:(?:generally|usually|typically|normally|would|will)\s+)*happens\s+to\s+(?:(?:the|its|their|a|an)\s+)?(?<parameter>[^?]{2,80})\?\s*$/iu;
// A trailing condition belongs to the scenario, not to the parameter's name.
const TRAILING_CONDITION = /\s+(?:if|when|before|after|during|while|as|once|until)\s.*$/iu;
// A question about a possible outcome does not have a single definite direction.
const HEDGED_QUESTION = /\b(?:may|might|can|could|possible|possibly|plausible|plausibly|likely)\b[^.?!]*\?\s*$/iu;

function promptParameter(prompt: string): string | null {
  const parameter = PARAMETER_QUESTION.exec(clean(prompt))?.groups?.parameter?.replace(TRAILING_CONDITION, "").trim();
  return parameter && parameter.length >= 2 ? parameter : null;
}

const sentenceCase = (value: string) => value.charAt(0).toLocaleUpperCase("en") + value.slice(1);

const isEffectsItem = (item: CauseEffectChoiceItem | CauseEffectEffectsItem): item is CauseEffectEffectsItem => "effects" in item;

/**
 * Present a stored choice item with direction controls, when its keyed answer
 * is a plain direction for one explicitly named parameter. Returns null when
 * the item is not cleanly directional; nothing is guessed.
 */
export function toCauseEffectEffects(item: CauseEffectChoiceItem): CauseEffectEffectsItem | null {
  const correct = item.options.find(option => option.id === item.correctOptionId);
  if (!correct) return null;
  if (item.options.every(option => isQuantityLabel(option.label))) return null;
  if (HEDGED_QUESTION.test(clean(item.prompt))) return null;
  const stated = statedDirection(correct.label);
  if (!stated) return null;
  const parameter = stated.subject ?? promptParameter(item.prompt);
  if (!parameter) return null;
  return {
    id: item.id,
    prompt: item.prompt,
    ...(item.instruction === undefined ? {} : { instruction: item.instruction }),
    mode: "cause-effect",
    effects: [{ id: "effect-1", parameter: sentenceCase(parameter), direction: stated.direction, explanation: item.explanation }],
  };
}

export function causeEffectFit(item: CauseEffectChoiceItem | CauseEffectEffectsItem): CauseEffectFit {
  if (isEffectsItem(item)) return "effects";
  if (item.options.every(option => isQuantityLabel(option.label))) return "calculation";
  return toCauseEffectEffects(item) ? "directional" : "choice";
}

/** True when every parameter's chosen direction equals its keyed direction. */
export function scoreCauseEffect(
  effects: readonly CauseEffectEffect[],
  chosen: Readonly<Record<string, CauseEffectDirection | undefined>>,
): { correct: boolean; results: { id: string; correct: boolean }[] } {
  const results = effects.map(effect => ({ id: effect.id, correct: chosen[effect.id] === effect.direction }));
  return { correct: results.length > 0 && results.every(result => result.correct), results };
}
