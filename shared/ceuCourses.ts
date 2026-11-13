import catalogue from "./ceuCatalogueData.json";

export type CeuApprovalStatus =
  "director_approval_required" | "ceu_value_review_required";
export type CeuCourseStream = "drinking_water" | "wastewater";

export interface CeuCourseModule {
  number: number;
  title: string;
  durationMinutes: number;
  summary: string;
}

export interface CeuCourse {
  key: string;
  interestCode: string;
  title: string;
  shortTitle: string;
  stream: CeuCourseStream;
  approvalStatus: CeuApprovalStatus;
  statusLabel: string;
  statusDescription: string;
  plannedContactHours: number;
  audience: string;
  outcomes: readonly string[];
  modules: readonly CeuCourseModule[];
  completionRequirements: readonly string[];
  publicDisclosure: string;
  ctaLabel: string;
}

/** Public metadata only. Assessment keys and marking guides are server-owned. */
export const CEU_COURSES: readonly CeuCourse[] = catalogue as CeuCourse[];
export function getCeuCourseByKey(key: string): CeuCourse | undefined {
  return CEU_COURSES.find(course => course.key === key);
}
export function plannedCourseMinutes(course: CeuCourse): number {
  return course.modules.reduce(
    (total, module) => total + module.durationMinutes,
    0
  );
}
