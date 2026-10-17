import { normalizeQuestionSteps } from "../shared/questionSteps";

/** Approval is stricter than display normalization: never silently drop broken steps. */
export function validateApprovalSteps(serialized: string | null, isCalculation: boolean): string | null {
  if (serialized === null || serialized.trim() === "") {
    return isCalculation ? "Calculation approval requires complete worked steps." : null;
  }
  let parsed: unknown;
  try { parsed = JSON.parse(serialized); }
  catch { return "Worked steps must be valid JSON before approval."; }
  if (!Array.isArray(parsed)) return "Worked steps must be an array before approval.";
  const normalized = normalizeQuestionSteps(parsed);
  if (normalized.length !== parsed.length || normalized.some(step => !step.l.trim() || !step.c.trim())) {
    return "Every worked step requires a non-empty label and body before approval.";
  }
  if (isCalculation && normalized.length < 2) return "Calculation approval requires a complete multi-step solution.";
  return null;
}
