import { getCourseByKey, type CourseEntry } from "@shared/courseRegistry";

type AssignedMember = {
  email: string;
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

  const member = members.find(
    (candidate) =>
      candidate.status === "assigned" &&
      candidate.email.trim().toLowerCase() === normalizedEmail,
  );
  if (!member) return [];

  const keys = member.courseKeys?.length
    ? member.courseKeys
    : member.courseKey
      ? [member.courseKey]
      : [];

  return keys
    .map((key) => getCourseByKey(key))
    .filter(
      (course): course is CourseEntry =>
        Boolean(course?.isActive && course.teamAssignable),
    );
}
