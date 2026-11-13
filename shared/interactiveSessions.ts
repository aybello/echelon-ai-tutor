import { z } from "zod";

// Client-safe wire validation only. No authored examples, server code, or access logic.
export const interactiveModes = ["rapid-swipe", "speed-match", "odd-one-out", "cause-effect", "tap-the-flaw", "before-after"] as const;
export const interactiveModeSchema = z.enum(interactiveModes);
export type InteractiveMode = z.infer<typeof interactiveModeSchema>;
export const interactiveDifficultySchema = z.enum(["easy", "medium", "hard", "unclassified"]);
export type InteractiveDifficulty = z.infer<typeof interactiveDifficultySchema>;
export const interactiveSafeIdSchema = z.string().regex(/^[a-zA-Z0-9][a-zA-Z0-9_-]{0,79}$/);
const text = z.string().trim().min(1).max(4000);
const base = { id: interactiveSafeIdSchema, prompt: text, instruction: text.optional() };
const option = z.object({ id: interactiveSafeIdSchema, label: text }).strict();
const pair = z.object({ id: interactiveSafeIdSchema, left: text, right: text }).strict();
const normalize = (value: string) => value.normalize("NFKC").trim().replace(/\s+/gu, " ").toLowerCase();
const rendererLabel = (value: string) => value.trim().replace(/\s+/g, " ").toLowerCase();
const unique = (values: string[]) => new Set(values.map(normalize)).size === values.length;
const containsLabel = (visible: string, label: string) => Array.from(label).length > 3 ? visible.includes(label) : new RegExp(`(?:^|[^\\p{L}\\p{M}\\p{N}_])${label.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}(?=$|[^\\p{L}\\p{M}\\p{N}_])`, "u").test(visible);
// Same conservative legacy before-after sequence/answer-leak rejection.
const answerLeak = (value: string) => /(?:→|⇒|⟶|➝|->|=>)|\b(?:(?:correct\s+)?(?:answer|choice|option)\s*(?:is\b|[:=])|answer\s+key\b|hint\s*[:=]|(?:choose|select|pick)\s+(?:the\s+)?(?:first|second|left|right)\s+(?:option|choice|answer)\b|(?:first|second|left|right)\s+(?:option|choice|answer)\s+is\s+correct\b|followed\s+by\b|precedes\b|\bthen\b|first\b[^.!?]*\bsecond\b)/iu.test(value);
// Both historical before-after payloads are intentionally retained.
export const interactiveDrillExampleSchema = z.union([
  z.object({ ...base, mode: z.literal("rapid-swipe"), correctAnswer: z.boolean(), explanation: text }).strict(),
  z.object({ ...base, mode: z.literal("speed-match"), pairs: z.array(pair).min(3).max(20), explanation: text.optional() }).strict(),
  ...(["odd-one-out", "cause-effect", "tap-the-flaw"] as const).map(mode =>
    z.object({ ...base, mode: z.literal(mode), options: z.array(option).min(2).max(20), correctOptionId: interactiveSafeIdSchema, explanation: text }).strict()),
  z.object({ ...base, mode: z.literal("before-after"), correctAnswer: z.enum(["before", "after"]), explanation: text }).strict(),
  z.object({ ...base, mode: z.literal("before-after"), options: z.array(text).length(2), correctAnswer: text, explanation: text }).strict(),
]).superRefine((item, ctx) => {
  const invalid = () => ctx.addIssue({ code: "custom", message: "Invalid interactive example semantics" });
  if (item.mode === "speed-match") {
    if (new Set(item.pairs.map(p => p.id)).size !== item.pairs.length || !unique(item.pairs.map(p => p.left)) || !unique(item.pairs.map(p => p.right))) invalid();
  } else if (item.mode === "before-after") {
    const visible = `${item.prompt} ${item.instruction ?? ""}`;
    if (answerLeak(visible)) invalid();
    if ("options" in item && (!unique(item.options) || item.options.map(rendererLabel).filter(label => label === rendererLabel(item.correctAnswer)).length !== 1 || item.options.some(label => containsLabel(rendererLabel(visible), rendererLabel(label)) || containsLabel(normalize(visible), normalize(label))))) invalid();
  } else if ("options" in item) {
    if (new Set(item.options.map(o => o.id)).size !== item.options.length || !item.options.some(o => o.id === item.correctOptionId) || !unique(item.options.map(o => o.label))) invalid();
  }
});
export type InteractiveDrillExample = z.infer<typeof interactiveDrillExampleSchema>;
export type DrillExample = InteractiveDrillExample;

const courseKey = z.string().min(1).max(64);
const accessToken = z.string().min(1).max(8192).optional();
const count = z.number().int().nonnegative();
const version = z.string().min(1).max(80).nullable();
export const interactiveCatalogInputSchema = z.object({ courseKey, accessToken }).strict();
export const interactiveStartSessionInputSchema = z.object({
  courseKey, mode: interactiveModeSchema,
  sessionSize: z.number().int().min(5).max(50).default(20),
  topicId: interactiveSafeIdSchema.optional(),
  difficulty: interactiveDifficultySchema.optional(),
  accessToken,
}).strict();
export const interactiveCatalogModeSchema = z.object({
  mode: interactiveModeSchema, totalCount: count,
  topics: z.array(z.object({ id: interactiveSafeIdSchema, label: z.string().min(1).max(120), count }).strict()).max(200),
  difficulties: z.array(z.object({ id: interactiveDifficultySchema, count }).strict()).max(4),
}).strict();
export const interactiveCatalogResponseSchema = z.object({
  courseKey, available: z.boolean(), locked: z.boolean(), version,
  modes: z.array(interactiveCatalogModeSchema).max(6),
}).strict();
export const interactiveSessionResponseSchema = z.object({
  courseKey, available: z.boolean(), locked: z.boolean(), version,
  sessionId: z.string().min(1).max(80), mode: interactiveModeSchema,
  totalAvailableCount: count, examples: z.array(interactiveDrillExampleSchema).max(50),
  filters: z.object({
    topicId: interactiveSafeIdSchema.nullable(), difficulty: interactiveDifficultySchema.nullable(),
    requestedSize: z.number().int().min(5).max(50),
  }).strict(),
}).strict();
export type InteractiveCatalogInput = z.infer<typeof interactiveCatalogInputSchema>;
export type InteractiveStartSessionInput = z.infer<typeof interactiveStartSessionInputSchema>;
export type InteractiveCatalogResponse = z.infer<typeof interactiveCatalogResponseSchema>;
export type InteractiveSessionResponse = z.infer<typeof interactiveSessionResponseSchema>;
// Explicit aliases for consumers naming schemas after their public procedures.
export const interactiveGetCatalogInputSchema = interactiveCatalogInputSchema;
export const interactiveGetCatalogResponseSchema = interactiveCatalogResponseSchema;
export const interactiveStartSessionResponseSchema = interactiveSessionResponseSchema;
