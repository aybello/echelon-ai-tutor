import { getCourseByKey } from "@shared/courseRegistry";

/** Keep sign-in destinations inside this application, including after URL decoding. */
export function sanitizeAccountNext(raw: string): string {
  if (!raw.startsWith("/") || raw.startsWith("//") || /[\\:\u0000-\u0020\u007f]/.test(raw)) return "";
  try {
    const decoded = decodeURIComponent(raw);
    if (decoded.startsWith("//") || /[\\:\u0000-\u001f\u007f]/.test(decoded)) return "";
  } catch {
    return "";
  }
  return raw;
}

export function otpSuccessDestination(next: string, isManager: boolean): string {
  return sanitizeAccountNext(next) || (isManager ? "/team" : "/account");
}

/** Presentation only: call with the server-verified purchase key, never to grant access. */
export function purchasedCourseNavigation(productKey: string) {
  const course = getCourseByKey(productKey);
  if (!course || course.productKey !== productKey) return null;
  return {
    courseKey: course.courseKey,
    links: [
      { label: `${course.displayName} — Practice Quiz`, path: course.quizPath },
      { label: `${course.displayName} — Mock Exam`, path: course.mockExamPath },
    ],
  };
}
