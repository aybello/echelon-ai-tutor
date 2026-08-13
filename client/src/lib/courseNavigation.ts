import { getAllCourses, type CourseEntry } from "@shared/courseRegistry";

export type CourseWorkspaceTab = {
  label: string;
  href: string;
  kind: "practice" | "mock" | "flashcards" | "notes" | "formulas" | "tutor" | "progress";
};

const MOBILE_PRIMARY_TOOL_KINDS: CourseWorkspaceTab["kind"][] = ["practice", "mock", "flashcards"];

function cleanPath(path: string): string {
  return path.split("?")[0].split("#")[0].replace(/\/$/, "") || "/";
}

/** Resolve any course study surface back to its canonical registry entry. */
export function getCourseForPath(path: string): CourseEntry | undefined {
  const current = cleanPath(path);
  return getAllCourses().find((course) =>
    course.isActive && [
      course.quizPath,
      course.mockExamPath,
      course.flashcardPath,
      course.formulaPath,
    ].filter(Boolean).some((candidate) => cleanPath(candidate!) === current),
  );
}

export function getCourseWorkspaceTabs(course: CourseEntry): CourseWorkspaceTab[] {
  const tabs: CourseWorkspaceTab[] = [
    { label: "Practice", href: course.quizPath, kind: "practice" },
    { label: "Mock Exam", href: course.mockExamPath, kind: "mock" },
  ];

  if (course.flashcardPath) {
    tabs.push({ label: "Flashcards", href: course.flashcardPath, kind: "flashcards" });
  }

  tabs.push({ label: "Notes", href: `${course.quizPath}?panel=notes`, kind: "notes" });

  if (course.formulaPath) {
    tabs.push({ label: "Formulas", href: course.formulaPath, kind: "formulas" });
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
  if (current === "/dashboard") return "progress";
  return null;
}
