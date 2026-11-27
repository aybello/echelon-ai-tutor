import { resolveCourseKey, type CourseEntry } from "@shared/courseRegistry";

type AssignedMember = {
  email?: string | null;
  status: string;
  courseKey?: string | null;
  courseKeys?: string[] | null;
};

function normalizeLearnerEmail(email: string | null | undefined): string {
  const normalized = (email ?? "").trim().toLowerCase();
  const separator = normalized.lastIndexOf("@");
  if (separator <= 0 || separator === normalized.length - 1) return normalized;

  const localPart = normalized.slice(0, separator);
  const domain = normalized.slice(separator + 1);
  if (domain !== "gmail.com" && domain !== "googlemail.com") return normalized;

  const plusIndex = localPart.indexOf("+");
  return plusIndex < 0 ? normalized : `${localPart.slice(0, plusIndex)}@${domain}`;
}

/** Return canonical learner courses for a manager who assigned their own seat. */
export function getManagerLearnerCourses(
  email: string | null | undefined,
  members: readonly AssignedMember[],
  allowedCourseKeys?: readonly string[] | null,
): CourseEntry[] {
  const normalizedEmail = normalizeLearnerEmail(email);
  if (!normalizedEmail) return [];

  const matchingMembers = members.filter(
    (candidate) =>
      candidate.status === "assigned" &&
      normalizeLearnerEmail(candidate.email) === normalizedEmail,
  );
  if (matchingMembers.length === 0) return [];

  const uniqueKeys = new Set<string>();
  for (const member of matchingMembers) {
    const keys = member.courseKeys?.length
      ? member.courseKeys
      : member.courseKey
        ? [member.courseKey]
        : [];
    for (const key of keys) {
      if (key) uniqueKeys.add(key);
    }
  }

  const allowed = allowedCourseKeys ? new Set(allowedCourseKeys) : null;
  const canonicalCourses = new Map<string, CourseEntry>();
  for (const key of uniqueKeys) {
    const course = resolveCourseKey(key);
    if (
      course?.isActive
      && course.teamAssignable
      && (!allowed || allowed.has(course.courseKey))
    ) {
      canonicalCourses.set(course.courseKey, course);
    }
  }
  return Array.from(canonicalCourses.values());
}
