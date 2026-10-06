import { getAllCourses, type CourseEntry } from "@shared/courseRegistry";

export const FINDER_PROVINCES = [
  { id: "on", label: "Ontario" }, { id: "bc", label: "British Columbia" },
  { id: "ab", label: "Alberta" }, { id: "sk", label: "Saskatchewan" },
  { id: "mb", label: "Manitoba" },
] as const;

export const FINDER_TRACKS = [
  { id: "water-treatment", label: "Water treatment" },
  { id: "wastewater-treatment", label: "Wastewater treatment" },
  { id: "water-distribution", label: "Water distribution" },
  { id: "wastewater-collection", label: "Wastewater collection" },
  { id: "water-quality", label: "Water quality analyst" },
] as const;

/** Ontario uses the full certification category; Western/WPI keeps its own name. */
export function getFinderTrackLabel(province: string, track: string): string {
  if (province === "on" && track === "water-distribution") return "Water distribution and supply";
  return FINDER_TRACKS.find(item => item.id === track)?.label ?? track;
}

/** Match only supported, active registry entries. Never silently switch province or stream. */
export function getFinderCourses(province: string, track: string): CourseEntry[] {
  if (!FINDER_PROVINCES.some(item => item.id === province)) return [];
  const family = province === "on" ? "ontario" : "western";
  return getAllCourses().filter(course => {
    if (!course.isActive || course.examFamily !== family) return false;
    if (course.track === track) return true;
    if (family !== "ontario" || course.track !== "oit") return false;
    return (track === "water-treatment" && course.courseKey === "oit")
      || (track === "wastewater-treatment" && course.courseKey === "oit-ww");
  }).sort((a, b) => a.classLevel - b.classLevel);
}

export function getFinderLevelLabel(course: CourseEntry): string {
  if (course.track === "water-quality") return "Water Quality Analyst";
  if (course.classLevel === 0) return "Operator-in-Training (OIT)";
  return `Class ${course.classLevel}`;
}
