/**
 * server/answerLengthBias.ts
 *
 * Detects "length tell" bias in multiple-choice question banks.
 *
 * A length tell exists when the correct option is conspicuously longer than
 * every distractor. Because writers naturally add qualifying detail to the
 * answer they know is right, the correct option drifts longer than the
 * throwaway distractors. A candidate can then score well above chance by
 * picking the wordiest option without knowing the subject — which inflates
 * practice scores and leaves learners unprepared for the real exam.
 *
 * By chance, the correct option is the longest in about 25% of four-choice
 * questions. Rates materially above that indicate a systemic authoring habit
 * rather than noise.
 *
 * This module is intentionally pure so it can be unit tested and reused by
 * both the DB audit script and any future import-time validator.
 */

/** A question shape narrow enough for any bank (water, WPI, or certification). */
export interface BiasCheckQuestion {
  questionNum: number;
  options: string[];
  correctIndex: number;
  /** Optional context carried through to the report so offenders are actionable. */
  module?: string | null;
  question?: string | null;
}

/**
 * Minimum character advantage over the longest distractor before the length
 * difference is treated as a usable tell. Being one character longer is noise.
 */
export const TELL_ABSOLUTE_CHARS = 12;

/**
 * Alternative relative trigger — a correct option 25% longer than its nearest
 * rival reads as the "detailed" one even when the absolute gap is small.
 */
export const TELL_RELATIVE_MARGIN = 0.25;

/** Probability the correct option is longest when option lengths are unrelated to correctness. */
export const CHANCE_LONGEST_RATE = 0.25;

/**
 * Bank-level failure threshold for the longest-correct rate. Set above the 0.25
 * chance baseline so ordinary sampling variation does not fail a healthy bank,
 * but low enough to catch a systemic habit.
 */
export const BANK_LONGEST_RATE_THRESHOLD = 0.35;

export interface QuestionBiasResult {
  questionNum: number;
  module: string | null;
  /** Trimmed length of each option, in the original option order. */
  optionLengths: number[];
  correctLength: number;
  /** Longest distractor length — the bar the correct option is measured against. */
  longestDistractorLength: number;
  /** True when the correct option is strictly the longest option. */
  correctIsLongest: boolean;
  /** True when the correct option is longest by a margin wide enough to be a usable tell. */
  hasLengthTell: boolean;
  /** How many characters longer the correct option is than its nearest rival. */
  charAdvantage: number;
}

function assertValid(question: BiasCheckQuestion): void {
  if (!Array.isArray(question.options) || question.options.length < 2) {
    throw new Error(`Question ${question.questionNum} must have at least two options.`);
  }
  if (
    !Number.isInteger(question.correctIndex) ||
    question.correctIndex < 0 ||
    question.correctIndex >= question.options.length
  ) {
    throw new Error(
      `Question ${question.questionNum} has correctIndex ${question.correctIndex}, which is outside its option list.`,
    );
  }
}

/**
 * Measure one question. Ties never count as a tell: if the correct option only
 * matches the longest distractor, length carries no signal.
 */
export function analyseQuestion(question: BiasCheckQuestion): QuestionBiasResult {
  assertValid(question);

  const optionLengths = question.options.map(option => option.trim().length);
  const correctLength = optionLengths[question.correctIndex];
  const distractorLengths = optionLengths.filter((_, index) => index !== question.correctIndex);
  const longestDistractorLength = Math.max(...distractorLengths);

  const charAdvantage = correctLength - longestDistractorLength;
  const correctIsLongest = charAdvantage > 0;
  const hasLengthTell =
    correctIsLongest &&
    (charAdvantage >= TELL_ABSOLUTE_CHARS ||
      correctLength >= longestDistractorLength * (1 + TELL_RELATIVE_MARGIN));

  return {
    questionNum: question.questionNum,
    module: question.module ?? null,
    optionLengths,
    correctLength,
    longestDistractorLength,
    correctIsLongest,
    hasLengthTell,
    charAdvantage,
  };
}

export interface BankBiasSummary {
  total: number;
  /** Count and rate of questions where the correct option is simply the longest. */
  longestCorrect: number;
  longestCorrectRate: number;
  /** Count and rate of questions where the length gap is wide enough to be exploitable. */
  tellCount: number;
  tellRate: number;
  /** Distribution of correct answer positions, index 0..n. Reported for context. */
  positionCounts: Record<number, number>;
  /** Questions with a usable tell, worst gap first — this is the remediation worklist. */
  offenders: QuestionBiasResult[];
  /** True when the bank's longest-correct rate exceeds the acceptable threshold. */
  failsThreshold: boolean;
}

/**
 * Summarise a whole bank. Offenders are sorted by character advantage so the
 * most exploitable questions are remediated first.
 */
export function summariseAnswerLengthBias(questions: BiasCheckQuestion[]): BankBiasSummary {
  const results = questions.map(analyseQuestion);
  const total = results.length;

  const longestCorrect = results.filter(result => result.correctIsLongest).length;
  const offenders = results
    .filter(result => result.hasLengthTell)
    .sort((left, right) => right.charAdvantage - left.charAdvantage);

  const positionCounts: Record<number, number> = {};
  for (const question of questions) {
    positionCounts[question.correctIndex] = (positionCounts[question.correctIndex] ?? 0) + 1;
  }

  const longestCorrectRate = total === 0 ? 0 : longestCorrect / total;

  return {
    total,
    longestCorrect,
    longestCorrectRate,
    tellCount: offenders.length,
    tellRate: total === 0 ? 0 : offenders.length / total,
    positionCounts,
    offenders,
    failsThreshold: total > 0 && longestCorrectRate > BANK_LONGEST_RATE_THRESHOLD,
  };
}

/**
 * Target length band a rewritten distractor should land in so it no longer
 * stands apart from the correct option. Remediation should lengthen the
 * distractors rather than trim the correct answer, because shortening a correct
 * option risks stripping the qualifying detail that makes it correct.
 */
export function targetDistractorLength(correctLength: number): { min: number; max: number } {
  return {
    min: Math.max(1, Math.round(correctLength * 0.95)),
    max: Math.round(correctLength * 1.15),
  };
}

/** Render a short human-readable verdict line for CLI output. */
export function formatBankVerdict(bankKey: string, summary: BankBiasSummary): string {
  if (summary.total === 0) return `${bankKey}: no questions`;
  const pct = (value: number) => `${Math.round(value * 100)}%`;
  const status = summary.failsThreshold ? "FAIL" : "ok";
  return (
    `${status.padEnd(4)} ${bankKey.padEnd(28)} ` +
    `longest-correct ${pct(summary.longestCorrectRate).padStart(4)} ` +
    `(chance ${pct(CHANCE_LONGEST_RATE)}) | ` +
    `exploitable tells ${summary.tellCount}/${summary.total} ${pct(summary.tellRate).padStart(4)}`
  );
}
