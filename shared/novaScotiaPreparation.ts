import { resolveCourseKey } from "./courseRegistry";

// Nova Scotia's published 2021 adoption notice covers the 2017 ABC exams.
// https://novascotia.ca/nse/water.operator.certification/docs/Standardized_exam_info.pdf
// Shared WPI content is preparation, not evidence of provincial approval or
// confirmation that Nova Scotia has adopted a later exam blueprint.
export const NOVA_SCOTIA_EXAM_GUIDANCE_URL = "https://novascotia.ca/nse/water.operator.certification/examinations.asp";

export const NOVA_SCOTIA_PREPARATION_NOTE = "Nova Scotia: shared WPI exam preparation. The province's published 2021 notice adopted the 2017 ABC exams. Confirm your current exam version and requirements with Nova Scotia Environment and Climate Change before buying. Provincial approval, full exam alignment and CEU credit are not claimed. Treatment Classes I–IV and distribution/collection Classes I–III are shown; confirm Class IV distribution/collection requirements with the province.";

export function isNovaScotiaCourseSupported(courseKey: string): boolean {
  const course = resolveCourseKey(courseKey);
  if (!course?.isActive || course.examFamily !== "western" || course.classLevel < 1) return false;
  if (course.track === "water-treatment" || course.track === "wastewater-treatment") return course.classLevel <= 4;
  if (course.track === "water-distribution" || course.track === "wastewater-collection") return course.classLevel <= 3;
  return false;
}
