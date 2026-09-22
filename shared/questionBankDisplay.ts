/**
 * Converts trusted bank metadata to customer-facing inventory labels.
 * A missing or malformed count must not appear as a false zero.
 */
export function resolveQuestionBankTotal(
  metadataTotal: unknown,
  fallbackTotal = 0
): number {
  const parsed = Number(metadataTotal);
  return Number.isSafeInteger(parsed) && parsed >= 0 ? parsed : fallbackTotal;
}

export function formatQuestionBankCount(totalQuestions: unknown): string {
  const total = resolveQuestionBankTotal(totalQuestions);
  return total > 0 ? `${total} questions` : "Full question bank";
}
