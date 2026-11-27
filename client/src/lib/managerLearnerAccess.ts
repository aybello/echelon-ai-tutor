import { resolveCourseKey, type CourseEntry } from "@shared/courseRegistry";

type AssignedMember = {
  email?: string | null;
  status: string;
  courseKey?: string | null;
  courseKeys?: string[] | null;
};

/** Return canonical learner courses for a manager who assigned their own seat. */
export function getManagerLearnerCourses(
  email: string | null | undefined,
  members: readonly AssignedMember[],
): CourseEntry[] {
  const normalizedEmail = email?.trim().toLowerCase();
  if (!normalizedEmail) return [];

  const matchingMembers = members.filter(
    (candidate) =>
      candidate.status === "assigned" &&
      candidate.email?.trim().toLowerCase() === normalizedEmail,
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

  return Array.from(uniqueKeys)
    .map((key) => resolveCourseKey(key))
    .filter(
      (course): course is CourseEntry =>
        Boolean(course?.isActive && course.teamAssignable),
    );
}
