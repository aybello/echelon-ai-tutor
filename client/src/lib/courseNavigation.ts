import { getAllCourses, resolveCourseKey, type CourseEntry } from "@shared/courseRegistry";
import { courseProvinceHref, funnelProvince } from "@shared/funnelNavigation";
import { withUSStudyContext } from "@shared/usStudyContext";
import { isInteractiveCourseEligible } from "@shared/interactiveEligibility";

/** Use the quiz's registry key, never a derived label or path, for the activity surface. */
export function getCourseInteractiveHref(courseKey: string | undefined, search: string): string | undefined {
  const course = resolveCourseKey(courseKey ?? "");
  if (!course || !isInteractiveCourseEligible(course.courseKey)) return undefined;
  const province = funnelProvince(new URLSearchParams(search).get("province"));
  const query = new URLSearchParams();
  if (province) query.set("province", province);
  const path = `/courses/${encodeURIComponent(course.courseKey)}/interactive${query.size ? `?${query}` : ""}`;
  return withUSStudyContext(path, course.courseKey, search);
}

export type CourseWorkspaceTab = {
  label: string;
  href: string;
  kind: "practice" | "mock" | "flashcards" | "games" | "notes" | "formulas" | "tutor" | "progress";
};

const MOBILE_PRIMARY_TOOL_KINDS: CourseWorkspaceTab["kind"][] = ["practice", "mock", "flashcards"];

function cleanPath(path: string): string {
  return path.split("?")[0].split("#")[0].replace(/\/$/, "") || "/";
}

/** Query context may disambiguate a formula sheet, never override another study page. */
export function getCourseForPath(path: string, search = path.split("?")[1]?.split("#")[0] ?? ""): CourseEntry | undefined {
  const current = cleanPath(path);
  const candidates = getAllCourses().filter((course) =>
    course.isActive && [
      course.quizPath,
      course.mockExamPath,
      course.flashcardPath,
      course.formulaPath,
    ].filter(Boolean).some((candidate) => cleanPath(candidate!) === current),
  );
  const courseKeys = new URLSearchParams(search).getAll("course");
  const context = courseKeys.length === 1 ? resolveCourseKey(courseKeys[0]) : undefined;
  if (context?.isActive && context.formulaPath && cleanPath(context.formulaPath) === current) {
    return context;
  }
  return candidates.length === 1 ? candidates[0] : undefined;
}

export function isSharedFormulaPath(path: string): boolean {
  return getAllCourses().filter((course) =>
    course.isActive && course.formulaPath && cleanPath(course.formulaPath) === cleanPath(path),
  ).length > 1;
}

/** Shared sheets' own practice/mock buttons must not send distribution/collection to treatment. */
export function getFormulaStudyLinks(path: string, search: string) {
  const course = getCourseForPath(path, search);
  const fallback = cleanPath(path).startsWith("/formulas-us-") ? "/us/courses" : "/wpi";
  const province = new URLSearchParams(search).get("province");
  return {
    course,
    practiceHref: course ? courseProvinceHref(course.quizPath, course.courseKey, province, search) : fallback,
    mockHref: course ? courseProvinceHref(course.mockExamPath, course.courseKey, province, search) : fallback,
    practiceLabel: course ? "Practice Quiz →" : "Choose a course →",
    mockLabel: course ? "Mock Exam →" : "Choose a course for mock exams →",
  };
}

export function getCourseWorkspaceTabs(course: CourseEntry): CourseWorkspaceTab[] {
  const tabs: CourseWorkspaceTab[] = [
    { label: "Practice", href: course.quizPath, kind: "practice" },
    { label: "Mock Exam", href: course.mockExamPath, kind: "mock" },
  ];

  if (course.flashcardPath) {
    tabs.push({ label: "Flashcards", href: course.flashcardPath, kind: "flashcards" });
  }

  const gamesHref = getCourseInteractiveHref(course.courseKey, "");
  if (gamesHref) tabs.push({ label: "Games", href: gamesHref, kind: "games" });

  tabs.push({ label: "Notes", href: `${course.quizPath}?panel=notes`, kind: "notes" });

  if (course.formulaPath) {
    const url = new URL(course.formulaPath, "https://echelon.invalid");
    url.searchParams.set("course", course.courseKey);
    tabs.push({ label: "Formulas", href: `${url.pathname}${url.search}${url.hash}`, kind: "formulas" });
  }

  tabs.push(
    { label: "AI Tutor", href: `${course.quizPath}?panel=tutor`, kind: "tutor" },
    { label: "Progress", href: `/dashboard?course=${encodeURIComponent(course.courseKey)}`, kind: "progress" },
  );

  return tabs;
}

/** Keep the highest-frequency study actions visible on narrow screens. */
export function getMobileWorkspaceTabs(tabs: CourseWorkspaceTab[]) {
  return {
    primaryTabs: tabs.filter((tab) => MOBILE_PRIMARY_TOOL_KINDS.includes(tab.kind)),
    secondaryTabs: tabs.filter((tab) => !MOBILE_PRIMARY_TOOL_KINDS.includes(tab.kind)),
  };
}

export function getActiveWorkspaceTab(path: string, course: CourseEntry): CourseWorkspaceTab["kind"] | null {
  const current = cleanPath(path);
  const params = typeof window !== "undefined" ? new URLSearchParams(window.location.search) : null;
  if (current === cleanPath(course.quizPath) && params?.get("panel") === "notes") return "notes";
  if (current === cleanPath(course.quizPath) && params?.get("panel") === "tutor") return "tutor";
  if (current === cleanPath(course.quizPath)) return "practice";
  if (current === cleanPath(course.mockExamPath)) return "mock";
  if (course.flashcardPath && current === cleanPath(course.flashcardPath)) return "flashcards";
  if (course.formulaPath && current === cleanPath(course.formulaPath)) return "formulas";
  if (current === cleanPath(`/courses/${course.courseKey}/interactive`)) return "games";
  if (current === "/dashboard") return "progress";
  return null;
}
