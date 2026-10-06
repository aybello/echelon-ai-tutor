import { getCoursesForFamily, type CourseEntry } from "./courseRegistry";
import { US_STATE_NAMES, type USStateCode, usStateIdentity } from "./usStateNames";
import { US_EXAM_RESEARCH } from "./usExamResearch";

export const US_STREAMS = [
  { key: "water-treatment", label: "Water Treatment", abbr: "WT", color: "#0369A1" },
  { key: "wastewater-treatment", label: "Wastewater Treatment", abbr: "WWT", color: "#0F766E" },
  { key: "water-distribution", label: "Water Distribution", abbr: "WD", color: "#1D4ED8" },
  { key: "wastewater-collection", label: "Wastewater Collection", abbr: "WWC", color: "#6D28D9" },
] as const;
export type USStreamKey = typeof US_STREAMS[number]["key"];
export type USExamSystem = "wpi-standardized" | "wpi-customized" | "state-specific" | "mixed" | "unverified" | "not-offered";
export interface USProgramEvidence {
  stream: USStreamKey;
  examSystem: USExamSystem;
  authorityName: string;
  authorityUrl: string;
  localLevels: string;
  verifiedSharedLevels: number[];
  note: string;
  sources: { url: string; title: string; evidence: string }[];
}
export interface USStateResearch {
  code: string;
  name: string;
  streams: USProgramEvidence[];
  dedicatedCourseNeeds: string[];
  limits: string[];
}
export interface USStateConfig {
  code: USStateCode;
  name: string;
  slug: string;
  programs: USProgramEvidence[];
  dedicatedCourseNeeds: string[];
  limits: string[];
}
export const US_RESEARCH_CHECKED_DATE = "2026-10-04";
export const US_STATE_CONFIGS = Object.fromEntries(US_STATE_NAMES.map(identity => {
  const research = US_EXAM_RESEARCH.find(item => item.code === identity.code);
  const programs = US_STREAMS.map(({ key }): USProgramEvidence => research?.streams.find(program => program.stream === key) ?? {
    stream: key, examSystem: "unverified", authorityName: "", authorityUrl: "", localLevels: "Not confirmed",
    verifiedSharedLevels: [], note: "The exam system and local class mapping have not been confirmed. No state-matched course is linked yet.", sources: [],
  });
  return [identity.code, { ...identity, programs, dedicatedCourseNeeds: research?.dedicatedCourseNeeds ?? [], limits: research?.limits ?? ["State program sources need further verification."] }];
})) as Record<USStateCode, USStateConfig>;
export function getStateBySlug(slug: string): USStateConfig | undefined {
  const identity = US_STATE_NAMES.find(state => state.slug === slug);
  return identity ? US_STATE_CONFIGS[identity.code] : undefined;
}
export function getStateByCode(code?: string | null): USStateConfig | undefined {
  const identity = usStateIdentity(code);
  return identity ? US_STATE_CONFIGS[identity.code] : undefined;
}
export function isSharedProgram(program: USProgramEvidence): boolean {
  return ["wpi-standardized", "mixed"].includes(program.examSystem) && program.sources.length > 0 && program.verifiedSharedLevels.some(level => Number.isInteger(level) && level >= 1 && level <= 4);
}
export function sharedUSCourses(stream?: string): CourseEntry[] {
  return getCoursesForFamily("western").filter(course => !stream || course.track === stream);
}
export function matchedUSCourses(state: USStateConfig, stream?: string): CourseEntry[] {
  return sharedUSCourses(stream).filter(course => state.programs.some(program => program.stream === course.track && isSharedProgram(program) && program.verifiedSharedLevels.includes(course.classLevel)));
}
/** Display context only: existing WPI product, bank and paid access identity remain unchanged. */
export function usCourseHref(course: CourseEntry, tool: "practice" | "mock" | "flashcards", state?: USStateCode): string | null {
  if (course.examFamily !== "western" || !course.isActive) return null;
  if (state && !matchedUSCourses(US_STATE_CONFIGS[state]).some(item => item.courseKey === course.courseKey)) return null;
  const path = tool === "practice" ? course.quizPath : tool === "mock" ? course.mockExamPath : course.flashcardPath;
  if (!path) return null;
  const query = new URLSearchParams({ country: "US" });
  if (state) query.set("state", state);
  return `${path}?${query}`;
}
export function usProgramLabel(program: USProgramEvidence): string {
  if (isSharedProgram(program)) return program.examSystem === "mixed" ? "Shared WPI prep for confirmed exams only" : "Shared WPI prep";
  if (program.examSystem === "wpi-standardized") return "WPI exam, class match under review";
  if (["wpi-customized", "state-specific", "mixed"].includes(program.examSystem)) return "Dedicated prep not yet available";
  if (program.examSystem === "not-offered") return "Separate certification not identified";
  return "Exam route under review";
}
