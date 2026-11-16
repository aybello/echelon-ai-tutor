import { getAllActiveCourseKeys, getCourseByKey } from "./courseRegistry";
import { pennsylvaniaBank } from "./pennsylvaniaBanks";

/** PA original SQL question banks have no interactive game release. */
export function isInteractiveCourseEligible(courseKey: string): boolean {
  return !!getCourseByKey(courseKey)?.isActive && courseKey !== "electrician-309a" && !pennsylvaniaBank(courseKey);
}

/** The same canonical cohort must be compiled and validated at runtime. */
export function eligibleInteractiveCourseKeys(): string[] {
  return getAllActiveCourseKeys().filter(isInteractiveCourseEligible).sort();
}
