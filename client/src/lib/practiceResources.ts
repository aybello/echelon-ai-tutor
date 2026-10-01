import { getCourseForPath } from "@/lib/courseNavigation";

/** Use the exact course's system; electrical practice never links to water guides. */
export function getPracticeGuidePath(path: string): string | null {
  const course = getCourseForPath(path);
  if (!course || course.track === "construction-electrician") return null;
  if (course.courseKey === "oit-ww" || course.track === "wastewater-treatment") return "/wastewater";
  if (course.track === "wastewater-collection") return "/collection-guide";
  if (course.track === "water-distribution") return "/distribution-guide";
  if (course.track === "water-quality") return "/lab";
  return "/process";
}
