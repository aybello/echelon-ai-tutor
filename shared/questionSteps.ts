export interface QuestionStep {
  l: string;
  c: string;
}

function nonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function substantiveLegacyLabel(value: unknown): value is string {
  if (!nonEmptyString(value)) return false;
  const words = value.trim().match(/[A-Za-z0-9]+/g) ?? [];
  return words.length >= 4 && /[0-9=+×÷/]/.test(value);
}

/**
 * Accept canonical and legacy runtime steps at the display boundary only.
 * Legacy string entries are already complete bodies; retain them verbatim.
 * A substantive legacy calculation in `l` is also a complete body. Never
 * coerce unknown values or invent solution text. Bodyless entries are omitted;
 * a real body without a label remains readable with no heading.
 * Canonical non-empty strings take precedence over their legacy aliases.
 */
export function normalizeQuestionSteps(value: unknown): QuestionStep[] {
  if (!Array.isArray(value)) return [];

  const steps: QuestionStep[] = [];
  for (const entry of value) {
    if (nonEmptyString(entry)) {
      steps.push({ l: "", c: entry });
      continue;
    }
    if (entry === null || typeof entry !== "object" || Array.isArray(entry)) continue;
    const step = entry as Record<string, unknown>;
    const c = nonEmptyString(step.c) ? step.c : nonEmptyString(step.content) ? step.content : undefined;
    if (c === undefined) {
      if (substantiveLegacyLabel(step.l)) steps.push({ l: "", c: step.l });
      continue;
    }
    const l = nonEmptyString(step.l) ? step.l : nonEmptyString(step.label) ? step.label : "";
    steps.push({ l, c });
  }
  return steps;
}
