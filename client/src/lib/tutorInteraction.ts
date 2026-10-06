export function getTutorFailureMessage(error: unknown): string {
  if (error instanceof Error && error.message) return error.message;
  return "The AI Tutor could not respond just now. Please try again.";
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
