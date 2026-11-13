import { z } from "zod";

// This shape mirrors the drill renderer, but no authored content lives in shared/client code.
export const interactiveModes = ["rapid-swipe", "speed-match", "odd-one-out", "cause-effect", "tap-the-flaw", "before-after"] as const;
const text = z.string().trim().min(1).max(4000);
const id = z.string().regex(/^[a-zA-Z0-9][a-zA-Z0-9_-]{0,79}$/);
const base = { id, prompt: text, instruction: text.optional() };
const pair = z.object({ id, left: text, right: text }).strict();
const option = z.object({ id, label: text }).strict();
const exampleSchema = z.union([
  z.object({ ...base, mode: z.literal("rapid-swipe"), correctAnswer: z.boolean(), explanation: text }).strict(),
  z.object({ ...base, mode: z.literal("speed-match"), pairs: z.array(pair).min(3).max(20), explanation: text.optional() }).strict(),
  ...(["odd-one-out", "cause-effect", "tap-the-flaw"] as const).map(mode =>
    z.object({ ...base, mode: z.literal(mode), options: z.array(option).min(2).max(20), correctOptionId: id, explanation: text }).strict()),
  z.object({ ...base, mode: z.literal("before-after"), correctAnswer: z.enum(["before", "after"]), explanation: text }).strict(),
  z.object({ ...base, mode: z.literal("before-after"), options: z.array(text).length(2), correctAnswer: text, explanation: text }).strict(),
]);

// Treat Unicode compatibility variants, case, and runs of whitespace as the
// same visible answer. Compare matching columns independently, not across sides.
const normalizedLabel = (value: string) => value.normalize("NFKC").trim().replace(/\s+/gu, " ").toLowerCase();
// The renderer folds whitespace and case, but does not apply Unicode normalization.
const rendererLabel = (value: string) => value.trim().replace(/\s+/g, " ").toLowerCase();
// For labels up to three Unicode code points, require both surrounding characters
// to be non-word boundaries (Unicode letters, marks, numbers and underscore are
// word characters). Longer labels retain conservative substring detection.
const containsVisibleLabel = (visible: string, label: string) => {
  if (Array.from(label).length > 3) return visible.includes(label);
  const escaped = label.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`(?:^|[^\\p{L}\\p{M}\\p{N}_])${escaped}(?=$|[^\\p{L}\\p{M}\\p{N}_])`, "u").test(visible);
};
// Conservatively block explicit answer keys and exposed sequences in pre-answer text.
// This is a structural heuristic, not a substitute for human content review.
const answerLeak = (value: string) => /(?:→|⇒|⟶|➝|->|=>)|\b(?:(?:correct\s+)?(?:answer|choice|option)\s*(?:is\b|[:=])|answer\s+key\b|hint\s*[:=]|(?:choose|select|pick)\s+(?:the\s+)?(?:first|second|left|right)\s+(?:option|choice|answer)\b|(?:first|second|left|right)\s+(?:option|choice|answer)\s+is\s+correct\b|followed\s+by\b|precedes\b|\bthen\b|first\b[^.!?]*\bsecond\b)/iu.test(value);
const labelsAreUnique = (labels: string[]) => new Set(labels.map(normalizedLabel)).size === labels.length;

export const interactivePackageSchema = z.object({
  courseKey: z.string().min(1).max(64),
  // Both registry approval and package approval are required. Approval is a
  // release workflow decision, not proof that the subject matter is correct.
  status: z.literal("approved"),
  version: z.string().min(1).max(80),
  previewIds: z.object(Object.fromEntries(interactiveModes.map(mode => [mode, id])) as Record<(typeof interactiveModes)[number], typeof id>).strict(),
  examples: z.array(exampleSchema).min(1).max(300),
}).strict().superRefine((pkg, ctx) => {
  const ids = new Set<string>();
  for (const item of pkg.examples) {
    if (ids.has(item.id)) ctx.addIssue({ code: "custom", message: "Duplicate example id" });
    ids.add(item.id);
    if (item.mode === "speed-match") {
      if (new Set(item.pairs.map(pair => pair.id)).size !== item.pairs.length)
        ctx.addIssue({ code: "custom", message: "Duplicate pair id" });
      if (!labelsAreUnique(item.pairs.map(pair => pair.left)) || !labelsAreUnique(item.pairs.map(pair => pair.right)))
        ctx.addIssue({ code: "custom", message: "Duplicate matching label" });
    }
    if (item.mode === "before-after") {
      const visible = `${item.prompt} ${item.instruction ?? ""}`;
      if (answerLeak(visible)) ctx.addIssue({ code: "custom", message: "Before/after prompt or instruction contains an explicit answer hint or sequence" });
      if ("options" in item) {
        const labels = item.options.map(rendererLabel);
        const answer = rendererLabel(item.correctAnswer);
        if (!labelsAreUnique(item.options) || new Set(labels).size !== 2 || labels.filter(label => label === answer).length !== 1)
          ctx.addIssue({ code: "custom", message: "Before/after options must be unique and match exactly one answer" });
        const visibleRenderer = rendererLabel(visible);
        const visibleConservative = normalizedLabel(visible);
        if (item.options.some(label => containsVisibleLabel(visibleRenderer, rendererLabel(label)) || containsVisibleLabel(visibleConservative, normalizedLabel(label))))
          ctx.addIssue({ code: "custom", message: "Before/after prompt or instruction contains an option label" });
      }
    }
    if (item.mode === "odd-one-out" || item.mode === "cause-effect" || item.mode === "tap-the-flaw") {
      if (new Set(item.options.map(option => option.id)).size !== item.options.length || !item.options.some(option => option.id === item.correctOptionId))
        ctx.addIssue({ code: "custom", message: "Invalid options" });
      if (!labelsAreUnique(item.options.map(option => option.label)))
        ctx.addIssue({ code: "custom", message: "Duplicate option label" });
    }
  }
  if (new Set(interactiveModes.map(mode => pkg.previewIds[mode])).size !== interactiveModes.length)
    ctx.addIssue({ code: "custom", message: "Preview ids must be unique" });
  for (const mode of interactiveModes) {
    const selected = pkg.previewIds[mode];
    if (!pkg.examples.some(item => item.id === selected && item.mode === mode))
      ctx.addIssue({ code: "custom", message: "Preview id must identify an example of its declared mode" });
    if (!pkg.examples.some(item => item.mode === mode && item.id !== selected))
      ctx.addIssue({ code: "custom", message: "Each mode must contain a non-preview example" });
  }
});
export type InteractivePackage = z.infer<typeof interactivePackageSchema>;
