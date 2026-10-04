/** US pages use per-stream source evidence. State identity never implies full exam coverage. */
export { US_STATE_CONFIGS, US_STREAMS, US_RESEARCH_CHECKED_DATE, getStateBySlug, getStateByCode, sharedUSCourses, matchedUSCourses, usCourseHref, usProgramLabel, isSharedProgram } from "@shared/usExamRouting";
export type { USStateConfig, USProgramEvidence, USStreamKey } from "@shared/usExamRouting";
export type { USStateCode } from "@shared/usStateNames";
export const US_LEVELS = [
  { key: "class1", level: 1, label: "Class I", roman: "I", description: "WPI Class I preparation" },
  { key: "class2", level: 2, label: "Class II", roman: "II", description: "WPI Class II preparation" },
  { key: "class3", level: 3, label: "Class III", roman: "III", description: "WPI Class III preparation" },
  { key: "class4", level: 4, label: "Class IV", roman: "IV", description: "WPI Class IV preparation" },
] as const;
