import { getAllCourses, resolveCourseKey } from "./courseRegistry";

// Nova Scotia's published 2021 adoption notice covers the 2017 ABC exams.
// https://novascotia.ca/nse/water.operator.certification/docs/Standardized_exam_info.pdf
// Shared WPI content is preparation, not evidence of provincial approval or
// confirmation that Nova Scotia has adopted a later exam blueprint.
export const NOVA_SCOTIA_EXAM_GUIDANCE_URL = "https://novascotia.ca/nse/water.operator.certification/examinations.asp";

export const NOVA_SCOTIA_PREPARATION_NOTE = "Nova Scotia: shared WPI exam preparation. The province's published 2021 notice adopted the 2017 ABC exams. Confirm your current exam version and requirements with Nova Scotia Environment and Climate Change before buying. Provincial approval, full exam alignment and CEU credit are not claimed. Treatment Classes I–IV and distribution/collection Classes I–III are shown; confirm Class IV distribution/collection requirements with the province.";

const NOVA_SCOTIA_LEGACY_FORMULA_COURSES: Record<string, string> = {
  "/formulas-wpi-class4-dist": "wpi-class4-water-dist",
  "/formulas-wpi-class4-coll": "wpi-class4-water-coll",
};

function normalizePathname(pathname: string): string {
  const path = pathname.split("?")[0].split("#")[0].toLowerCase();
  return path.length > 1 ? path.replace(/\/+$/, "") : path;
}

function courseForNovaScotiaPath(pathname: string) {
  const normalized = normalizePathname(pathname);
  const legacyCourse = NOVA_SCOTIA_LEGACY_FORMULA_COURSES[normalized];
  return legacyCourse
    ? resolveCourseKey(legacyCourse)
    : getAllCourses().find(candidate => [
      candidate.quizPath,
      candidate.mockExamPath,
      candidate.flashcardPath,
      candidate.formulaPath,
    ].filter((path): path is string => Boolean(path)).some(path => normalizePathname(path) === normalized));
}

export function isNovaScotiaCourseSupported(courseKey: string): boolean {
  const course = resolveCourseKey(courseKey);
  if (!course?.isActive || course.examFamily !== "western" || course.classLevel < 1) return false;
  if (course.track === "water-treatment" || course.track === "wastewater-treatment") return course.classLevel <= 4;
  if (course.track === "water-distribution" || course.track === "wastewater-collection") return course.classLevel <= 3;
  return false;
}

/** Unknown pages remain available. This guard applies only to named course surfaces. */
export function isNovaScotiaPathSupported(pathname: string): boolean {
  const course = courseForNovaScotiaPath(pathname);
  return !course || isNovaScotiaCourseSupported(course.courseKey);
}

/** Distinguishes registered course routes from shared site, authentication and payment pages. */
export function isNovaScotiaCourseSurface(pathname: string): boolean {
  return Boolean(courseForNovaScotiaPath(pathname));
}

export function isNovaScotiaCheckoutAllowed(courseKey: string, province?: string | null): boolean {
  return province?.toUpperCase() !== "NS" || isNovaScotiaCourseSupported(courseKey);
}
