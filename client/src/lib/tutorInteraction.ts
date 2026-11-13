export function getTutorFailureMessage(error: unknown): string {
  if (error instanceof Error && error.message) return error.message;
  return "The AI Tutor could not respond just now. Please try again.";
}

/**
 * True when the tutor stopped because the visitor used up their allowance for
 * the day, rather than because something went wrong.
 *
 * These two cases need opposite actions. A provider problem deserves Retry. An
 * exhausted allowance must not offer Retry, because retrying cannot succeed
 * until tomorrow, and the visitor is at exactly the point where buying is the
 * answer. Matched on the allowance wording the server sends, so a generic
 * failure never swallows the purchase moment.
 */
export function isTutorAllowanceMessage(message: string): boolean {
  const text = message.toLowerCase();
  return (
    text.includes("free ai tutor message") ||
    text.includes("ai tutor message limit")
  );
}

/**
 * True only for the free preview allowance, where buying is the right next step.
 *
 * Deliberately narrower than isTutorAllowanceMessage. A learner who has already
 * paid and hit the higher daily cap must not be shown a purchase button: they
 * bought this already, and selling it to them again is the wrong experience.
 */
export function isTutorPurchasePrompt(message: string): boolean {
  return message.toLowerCase().includes("free ai tutor message");
}

export function isTutorDismissKey(key: string): boolean {
  return key === "Escape";
}

export type TutorDisplayMessage = {
  role: "user" | "assistant";
  content: string;
};

/** Errors are UI state, not study context. Never send them back to the model. */
export function withoutTutorErrors(messages: TutorDisplayMessage[]): TutorDisplayMessage[] {
  return messages.filter((message) => !message.content.startsWith("__ERROR__:"));
}
