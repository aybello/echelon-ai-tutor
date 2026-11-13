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

/** Target size; keep authored tables and paragraphs intact. */
const MAX_SLIDE_WORDS = 420;

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

/** Splits one over-long section on paragraph boundaries, repeating its heading. */
function splitLongSection(section: string) {
  const paragraphs = nonEmptySections(section);
  if (paragraphs.length < 2) return [section];
  const heading = section.match(/^###[^\n]*/)?.[0] ?? "";
  const chunks: string[] = [];
  let current: string[] = [];
  let words = 0;
  for (const paragraph of paragraphs) {
    const length = paragraph.split(/\s+/).length;
    if (current.length > 0 && words + length > MAX_SLIDE_WORDS) {
      chunks.push(current.join("\n\n"));
      current = heading ? [heading] : [];
      words = heading ? heading.split(/\s+/).length : 0;
    }
    current.push(paragraph);
    words += length;
  }
  if (current.length > 0) chunks.push(current.join("\n\n"));
  return chunks.filter(
    chunk => chunk.replace(/^#+.*$/gm, "").trim().length > 0
  );
}

/**
 * One teaching slide per authored section, so a deep lesson reads as a sequence
 * of focused slides instead of a few walls of text. Paragraph grouping is only
 * used when a lesson has no section headings.
 */
function teachingSlideBodies(lesson: string) {
  const copy = presentationCopy(lesson).trim();
  const headed = copy
    .split(/\n(?=###\s)/)
    .map(section => section.trim())
    .filter(Boolean);
  const sections = headed.length > 1 ? headed : nonEmptySections(copy);
  const bodies = sections.flatMap(section =>
    section.split(/\s+/).length > MAX_SLIDE_WORDS
      ? splitLongSection(section)
      : [section]
  );
  return bodies.length > 0 ? bodies : [copy];
}

function slideHeading(body: string) {
  return body.match(/^###\s+(.+)$/m)?.[1].trim();
}

/**
 * Builds the same learning path on the client and server: an overview, one
 * slide per teaching section, the worked scenario, the optional quick check and
 * the takeaways. It preserves the authored lesson and evidence text without
 * putting marking guides or final-answer keys into the public course payload.
 */
export function ceuModuleSlides(module: SlideLesson): CeuSlide[] {
  const lessonGroups = teachingSlideBodies(module.lesson);
  const objectives = module.objectives
    .map(objective => `- ${objective}`)
    .join("\n");

  return [
    {
      id: `${module.id}:overview`,
      kind: "overview",
      eyebrow: "Module overview",
      title: module.title,
      body: `## What you will learn\n${objectives}\n\nThis module has ${lessonGroups.length} teaching slides, a worked scenario and optional quick checks. Sign in to save your place as you go.`,
    },
    ...lessonGroups.map((body, index) => {
      const heading = slideHeading(body);
      const stripped = body.replace(/^###\s+.+\n?/, "").trim();
      const continued =
        heading !== undefined &&
        index > 0 &&
        slideHeading(lessonGroups[index - 1]) === heading;
      return {
        id: `${module.id}:concept-${index + 1}`,
        kind: "lesson" as const,
        eyebrow: `Lesson step ${index + 1} of ${lessonGroups.length}`,
        title:
          heading === undefined
            ? index === 0
              ? "Build the operating picture"
              : "Apply the operating principle"
            : continued
              ? `${heading} (continued)`
              : heading,
        body: stripped.length > 0 ? stripped : body,
      };
    }),
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
      body: "Use these ungraded checks to confirm the main concepts. They do not affect course completion or the final exam.",
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
