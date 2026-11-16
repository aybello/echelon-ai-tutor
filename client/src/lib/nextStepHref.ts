import { withUSStudyContext } from "@shared/usStudyContext";
import type { NextStepAction } from "@shared/nextStep";

type CoursePaths = { courseKey: string; quizPath: string; mockExamPath: string };

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
