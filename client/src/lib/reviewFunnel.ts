/**
 * Google Review Funnel — routes happy users (4-5 stars) to Google,
 * keeps unhappy users (1-3 stars) internal for private feedback.
 *
 * Tracks how many times a user has been shown the review prompt
 * to avoid nagging (max 3 total, max 1 per session).
 *
 * Once a user clicks through to leave a Google review, they are
 * permanently marked as "reviewed" and never prompted again.
 */

export const GOOGLE_REVIEW_URL = "https://g.page/r/CWsjBbkUlS8rEBM/review";

const STORAGE_KEY = "echelon_review_prompt_count";
const SESSION_KEY = "echelon_review_shown_this_session";
const REVIEWED_KEY = "echelon_has_reviewed";

/** Returns true if the user has already left a review (or clicked through to Google) */
export function hasAlreadyReviewed(): boolean {
  try {
    return localStorage.getItem(REVIEWED_KEY) === "true";
  } catch {
    return false;
  }
}

/** Permanently mark the user as having left a review — never prompt again */
export function markAsReviewed(): void {
  try {
    localStorage.setItem(REVIEWED_KEY, "true");
  } catch {}
}

/** Returns true if the user should see a review prompt */
export function shouldShowReviewPrompt(): boolean {
  try {
    // If they already reviewed, never show again
    if (hasAlreadyReviewed()) return false;
    // Max 1 per session
    if (sessionStorage.getItem(SESSION_KEY) === "true") return false;
    // Max 3 total
    const count = parseInt(localStorage.getItem(STORAGE_KEY) || "0", 10);
    return count < 3;
  } catch {
    return true;
  }
}

/** Record that a review prompt was shown */
export function markReviewPromptShown(): void {
  try {
    sessionStorage.setItem(SESSION_KEY, "true");
    const count = parseInt(localStorage.getItem(STORAGE_KEY) || "0", 10);
    localStorage.setItem(STORAGE_KEY, String(count + 1));
  } catch {}
}

/** Returns true if the rating is "happy" (should go to Google) */
export function isHappyRating(rating: number): boolean {
  return rating >= 4;
}

/** Open Google review in a new tab and permanently mark as reviewed */
export function openGoogleReview(): void {
  markAsReviewed();
  window.open(GOOGLE_REVIEW_URL, "_blank", "noopener,noreferrer");
}
