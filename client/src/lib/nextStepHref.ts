import { resolveCourseKey } from "@shared/courseRegistry";
import { withUSStudyContext } from "@shared/usStudyContext";
import type { NextStepAction } from "@shared/nextStep";

type CoursePaths = { courseKey: string; quizPath: string; mockExamPath: string };

/** Quick 10 is scored practice, not interactive games; 309A retains its own quiz. */
export function isQuick10Eligible(courseKey: string | null | undefined): boolean {
  const course = courseKey ? resolveCourseKey(courseKey) : undefined;
  return Boolean(course?.isActive && course.courseKey !== "electrician-309a");
}
/** Prefer a supported selection, then a supported enrolled fallback. */
export function chooseQuick10Course(preferred: readonly (string | null | undefined)[], available: readonly string[]): string | null {
  return [...preferred, ...available].find(key => isQuick10Eligible(key)) ?? null;
}
/** The page of the Quick 10 screen, optionally limited to a single question (used to keep a streak). */
export function quick10Href(courseKey: string, search = "", questions?: 1): string {
  const params = new URLSearchParams({ course: courseKey });
  if (questions === 1) params.set("questions", "1");
  return withUSStudyContext(`/quick-10?${params.toString()}`, courseKey, search);
}

/** Where a "What next" button goes. Each suggestion starts its activity directly. */
export function nextStepHref(action: NextStepAction, course: CoursePaths, search = ""): string {
  switch (action.type) {
    case "question-of-the-day":
      // There is no separate question-of-the-day screen. One answered question keeps the streak going.
      return quick10Href(course.courseKey, search, 1);
    case "missed-questions":
      return withUSStudyContext(`${course.quizPath}?mode=missed`, course.courseKey, search);
    case "topic-practice":
      return withUSStudyContext(`${course.quizPath}?module=${encodeURIComponent(action.module)}`, course.courseKey, search);
    case "mock-exam":
      return withUSStudyContext(course.mockExamPath, course.courseKey, search);
    case "quick-10":
      return quick10Href(course.courseKey, search);
  }
}

/**
 * The old in-page Quick 10 (`?mode=quick10` on a quiz page) is replaced by the /quick-10 screen. Returns where an old
 * link should go, or null when the page should not redirect (any other mode, an unknown course, or 309A, which keeps
 * its own flow).
 */
export function legacyQuick10Redirect(mode: string | null, examType: string | undefined, search = ""): string | null {
  if (mode !== "quick10" || !examType) return null;
  const course = resolveCourseKey(examType);
  if (!course?.isActive || course.courseKey === "electrician-309a") return null;
  return quick10Href(course.courseKey, search);
}
