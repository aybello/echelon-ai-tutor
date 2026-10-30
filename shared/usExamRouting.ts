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
  /** State-specific course keys approved for this exact local program only. */
  directCourseKeys?: string[];
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
/**
 * A coverage label is scoped to one state program and its cited evidence.
 * It is deliberately not a promise about every credential in a state.
 */
export type USProgramCoverageKind = "wpi-direct" | "state-with-wpi-component" | "state-specific";
export interface USProgramCoverage {
  kind: USProgramCoverageKind;
  label: string;
  note: string;
  hasSharedCourse: boolean;
}
export const US_RESEARCH_CHECKED_DATE = "2026-10-11";
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
/**
 * Classify only what the existing source record establishes for this stream.
 * In particular, a WPI mention, membership, provider, or generic ABC reference
 * never creates a shared-course match on its own.
 */
export function getUSProgramCoverage(program: USProgramEvidence): USProgramCoverage {
  if (program.examSystem === "wpi-standardized" && isSharedProgram(program)) {
    return {
      kind: "wpi-direct",
      label: "WPI Direct",
      note: "The cited state record confirms the listed WPI class matches for this stream.",
      hasSharedCourse: true,
    };
  }
  if (program.examSystem === "mixed" && isSharedProgram(program)) {
    return {
      kind: "state-with-wpi-component",
      label: "State program + WPI component",
      note: "Only the listed standardized WPI classes are linked. State-specific or specialist credentials remain separate.",
      hasSharedCourse: true,
    };
  }
  return {
    kind: "state-specific",
    label: "State-specific / no shared course",
    note: "No shared WPI course is linked unless the cited record confirms an exact standardized class match.",
    hasSharedCourse: false,
  };
}
export function sharedUSCourses(stream?: string): CourseEntry[] {
  // Dedicated US courses take precedence for the exact track and class level
  // they cover. Every other shared western course, including higher classes of
  // the same track, stays available, and Canadian routes are untouched.
  const dedicated = getCoursesForFamily("us-wpi").filter(course => course.isActive);
  const covered = new Set(dedicated.map(course => `${course.track}:${course.classLevel}`));
  const fallback = getCoursesForFamily("western")
    .filter(course => !covered.has(`${course.track}:${course.classLevel}`));
  return [...dedicated, ...fallback].filter(course => !stream || course.track === stream);
}
/**
 * State-specific courses are linked only when their exact course keys appear in
 * the official-evidence record for the current state and program. This is
 * intentionally separate from shared WPI matching: a local course never gains
 * visibility from a WPI class number, and inactive courses never surface.
 */
export function directUSStateCourses(state: USStateConfig, stream?: string): CourseEntry[] {
  const allowed = new Set(
    state.programs
      .filter(program => !stream || program.stream === stream)
      .flatMap(program => program.directCourseKeys ?? []),
  );
  return getCoursesForFamily("us-state")
    .filter(course => allowed.has(course.courseKey))
    .filter(course => !stream || state.programs.some(program =>
      program.stream === stream && (program.directCourseKeys ?? []).includes(course.courseKey),
    ));
}
export function matchedUSCourses(state: USStateConfig, stream?: string): CourseEntry[] {
  const direct = directUSStateCourses(state, stream);
  const shared = sharedUSCourses(stream).filter(course => state.programs.some(program => program.stream === course.track && isSharedProgram(program) && program.verifiedSharedLevels.includes(course.classLevel)));
  return [...new Map([...direct, ...shared].map(course => [course.courseKey, course])).values()];
}
/** Display context only: existing WPI product, bank and paid access identity remain unchanged. */
export function usCourseHref(course: CourseEntry, tool: "practice" | "mock" | "flashcards", state?: USStateCode): string | null {
  if (!["western", "us-wpi", "us-state"].includes(course.examFamily) || !course.isActive) return null;
  if (state && !matchedUSCourses(US_STATE_CONFIGS[state]).some(item => item.courseKey === course.courseKey)) return null;
  const path = tool === "practice" ? course.quizPath : tool === "mock" ? course.mockExamPath : course.flashcardPath;
  if (!path) return null;
  const query = new URLSearchParams({ country: "US" });
  if (state) query.set("state", state);
  return `${path}?${query}`;
}
export function usProgramLabel(program: USProgramEvidence): string {
  const coverage = getUSProgramCoverage(program);
  if (coverage.kind === "wpi-direct") return "WPI Direct";
  if (coverage.kind === "state-with-wpi-component") return "State program + WPI component";
  if ((program.directCourseKeys ?? []).length > 0) return "State-specific preparation available";
  if (program.examSystem === "not-offered") return "Separate certification not identified";
  return coverage.label;
}
