import type { CeuLesson } from "./ceuLearning";

export type CeuSlideKind =
  | "overview"
  | "lesson"
  | "evidence"
  | "quick_check"
  | "takeaways";

export interface CeuSlide {
  id: string;
  kind: CeuSlideKind;
  eyebrow: string;
  title: string;
  body: string;
}

type SlideLesson = Pick<
  CeuLesson,
  "id" | "title" | "objectives" | "lesson" | "evidence"
>;

function nonEmptySections(markdown: string) {
  return markdown
    .split(/\n\s*\n/)
    .map(section => section.trim())
    .filter(Boolean);
}

function presentationCopy(markdown: string) {
  return markdown
    .replace(/case exercises?/gi, "optional practice activity")
    .replace(/module checks?/gi, "quick checks")
    .replace(/active-time tracking/gi, "saved progress")
    .replace(/active[- ]time minimum/gi, "module completion");
}

function spreadSections(sections: string[], groups: number) {
  const result = Array.from({ length: groups }, () => [] as string[]);
  for (const [index, section] of sections.entries()) {
    result[Math.min(groups - 1, Math.floor((index * groups) / sections.length))].push(
      section
    );
  }
  return result.map(group => group.join("\n\n").trim());
}

/**
 * Builds the same seven-slide learning path on the client and server.
 * It preserves the authored lesson and evidence text without putting marking
 * guides or final-answer keys into the public course payload.
 */
export function ceuModuleSlides(module: SlideLesson): CeuSlide[] {
  const contentSections = nonEmptySections(presentationCopy(module.lesson));
  const lessonGroups = spreadSections(contentSections, 3);
  const objectives = module.objectives.map(objective => `- ${objective}`).join("\n");

  return [
    {
      id: `${module.id}:overview`,
      kind: "overview",
      eyebrow: "Module overview",
      title: module.title,
      body: `## What you will learn\n${objectives}\n\nMove through the short lesson slides, then use the optional quick check to reflect before you continue.`,
    },
    ...lessonGroups.map((body, index) => ({
      id: `${module.id}:concept-${index + 1}`,
      kind: "lesson" as const,
      eyebrow: `Core concept ${index + 1} of ${lessonGroups.length}`,
      title: index === 0 ? "Build the operating picture" : "Apply the operating principle",
      body,
    })),
    {
      id: `${module.id}:evidence`,
      kind: "evidence",
      eyebrow: "Worked scenario",
      title: "Read the evidence before acting",
      body: `Facility names, records and numerical conditions are fictional.\n\n${presentationCopy(module.evidence)}`,
    },
    {
      id: `${module.id}:quick-check`,
      kind: "quick_check",
      eyebrow: "Optional knowledge check",
      title: "Test the key idea",
      body: "Use this ungraded check to confirm the main concept. It does not affect course completion or the final exam.",
    },
    {
      id: `${module.id}:takeaways`,
      kind: "takeaways",
      eyebrow: "Module complete",
      title: "Key takeaways",
      body: `Before you continue, make sure you can:\n${objectives}\n\nYou can return to this module any time from the course menu.`,
    },
  ];
}

export function ceuModuleSlideCount(module: SlideLesson) {
  return ceuModuleSlides(module).length;
}
