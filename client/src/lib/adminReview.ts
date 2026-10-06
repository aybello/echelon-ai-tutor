export function parseReviewOptions(value: string): string[] | null {
  try {
    const options: unknown = JSON.parse(value);
    return Array.isArray(options) && options.length === 4 && options.every(option => typeof option === "string" && option.trim())
      ? options : null;
  } catch {
    return null;
  }
}

export function formatReviewSteps(value: string): string[] {
  try {
    const steps: unknown = JSON.parse(value);
    if (Array.isArray(steps)) {
      return steps.map(step => {
        if (typeof step === "string") return step;
        if (step && typeof step === "object") {
          const entry = step as Record<string, unknown>;
          return [entry.l, entry.c].filter(part => typeof part === "string").join(": ");
        }
        return "";
      }).filter(Boolean);
    }
  } catch { /* Legacy free-text steps render below. */ }
  return [value];
}

export function describePurchaseCheck(result: {
  recovered: number;
  skipped: number;
  errors: string[];
}): string {
  if (result.errors.length) {
    return `${result.errors.length} Stripe session(s) need review. No learner access was changed. Investigate each session and use signed webhook replay or evidence-bound historical recovery where appropriate:\n\n${result.errors.join("\n")}`;
  }
  return `Stripe check complete. No unmatched paid sessions were found. ${result.skipped} session(s) were skipped. No learner access was changed.`;
}
