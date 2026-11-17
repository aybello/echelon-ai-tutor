import { getAllActiveCourseKeys, getCourseByKey } from "./courseRegistry";
import { statePracticeBank } from "./pennsylvaniaBanks";

/** Independent state SQL question banks have no interactive game release. */
export function isInteractiveCourseEligible(courseKey: string): boolean {
  return !!getCourseByKey(courseKey)?.isActive && courseKey !== "electrician-309a" && !statePracticeBank(courseKey);
}

/** The same canonical cohort must be compiled and validated at runtime. */
export function eligibleInteractiveCourseKeys(): string[] {
  return getAllActiveCourseKeys().filter(isInteractiveCourseEligible).sort();
}
