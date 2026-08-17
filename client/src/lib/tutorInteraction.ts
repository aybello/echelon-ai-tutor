export function getTutorFailureMessage(error: unknown): string {
  if (error instanceof Error && error.message) return error.message;
  return "The AI Tutor could not respond just now. Please try again.";
}

export function isTutorDismissKey(key: string): boolean {
  return key === "Escape";
}
