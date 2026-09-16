export function formatQuestionBankTitle(
  courseLabel: string,
  totalQuestions: number,
): string {
  if (!Number.isSafeInteger(totalQuestions) || totalQuestions <= 0) {
    return `${courseLabel} Practice Quiz`;
  }

  return `${courseLabel} Practice Quiz — ${totalQuestions.toLocaleString()} Questions`;
}

export function formatQuestionBankDescription(
  courseLabel: string,
  totalQuestions: number,
  subject: string,
): string {
  const count = Number.isSafeInteger(totalQuestions) && totalQuestions > 0
    ? ` with ${totalQuestions.toLocaleString()} practice questions`
    : "";

  return `Practice for the ${courseLabel} exam${count} across ${subject}. AI Tutor, step-by-step solutions, and confidence tracking included.`;
}
