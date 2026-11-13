import { z } from "zod";
import { interactiveDifficultySchema, interactiveDrillExampleSchema, interactiveModeSchema, interactiveModes, interactiveSafeIdSchema } from "../../../shared/interactiveSessions";

export const ENGINE_LIMITS = Object.freeze({
  shardItems: 100, exampleBytes: 32 * 1024, shardBytes: 1024 * 1024,
  manifestBytes: 4 * 1024 * 1024, registrationBytes: 64 * 1024,
  legacyBytes: 2 * 1024 * 1024, responseBytes: 256 * 1024,
  cacheBytes: 16 * 1024 * 1024, cacheEntries: 64, maxCourseItems: 12000,
});
export const sha256Schema = z.string().regex(/^[a-f0-9]{64}$/);
const bytes = z.number().int().positive();
const safeCourse = z.string().regex(/^[a-z0-9][a-z0-9-]{0,63}$/);
export const artifactDescriptorSchema = z.object({ file: z.string().min(1).max(160), sha256: sha256Schema, bytes }).strict();
export const engineRegistrationSchema = z.object({
  format: z.literal("interactive-engine-v1"), version: z.literal("release-v1"),
  legacyMetadata: artifactDescriptorSchema,
  courses: z.record(safeCourse, artifactDescriptorSchema),
}).strict();
export const engineIndexEntrySchema = z.object({
  id: interactiveSafeIdSchema, mode: interactiveModeSchema,
  topicId: interactiveSafeIdSchema, difficulty: interactiveDifficultySchema,
  shard: z.number().int().nonnegative(), offset: z.number().int().min(0).max(99),
  bytes: bytes.max(ENGINE_LIMITS.exampleBytes), sha256: sha256Schema,
}).strict();
export const engineManifestSchema = z.object({
  format: z.literal("interactive-course-v1"), courseKey: safeCourse,
  version: z.string().min(1).max(80),
  // This adapter does not claim objective alignment, technical or human review.
  classification: z.literal("legacy_release"), sourceVersion: z.string().min(1).max(80), sourceSha256: sha256Schema,
  previewIds: z.object(Object.fromEntries(interactiveModes.map(mode => [mode, interactiveSafeIdSchema])) as Record<(typeof interactiveModes)[number], typeof interactiveSafeIdSchema>).strict(),
  topics: z.array(z.object({ id: interactiveSafeIdSchema, label: z.string().min(1).max(120) }).strict()).min(1).max(200),
  legacy: artifactDescriptorSchema,
  // Byte-driven splits can produce more shards than ceil(itemCount / 100).
  shards: z.array(artifactDescriptorSchema.extend({ count: z.number().int().min(1).max(100) }).strict()).min(1).max(400),
  entries: z.array(engineIndexEntrySchema).min(1).max(ENGINE_LIMITS.maxCourseItems),
}).strict();
export type EngineRegistration = z.infer<typeof engineRegistrationSchema>;
export type EngineManifest = z.infer<typeof engineManifestSchema>;
export type EngineIndexEntry = z.infer<typeof engineIndexEntrySchema>;
export type ArtifactDescriptor = z.infer<typeof artifactDescriptorSchema>;

const normalize = (value: string) => value.normalize("NFKC").trim().replace(/\s+/gu, " ").toLowerCase();
const rendererLabel = (value: string) => value.trim().replace(/\s+/g, " ").toLowerCase();
const unique = (values: string[]) => new Set(values.map(normalize)).size === values.length;
const containsLabel = (visible: string, label: string) => Array.from(label).length > 3 ? visible.includes(label) : new RegExp(`(?:^|[^\\p{L}\\p{M}\\p{N}_])${label.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}(?=$|[^\\p{L}\\p{M}\\p{N}_])`, "u").test(visible);
// Same conservative legacy before-after sequence/answer-leak rejection.
const answerLeak = (value: string) => /(?:→|⇒|⟶|➝|->|=>)|\b(?:(?:correct\s+)?(?:answer|choice|option)\s*(?:is\b|[:=])|answer\s+key\b|hint\s*[:=]|(?:choose|select|pick)\s+(?:the\s+)?(?:first|second|left|right)\s+(?:option|choice|answer)\b|(?:first|second|left|right)\s+(?:option|choice|answer)\s+is\s+correct\b|followed\s+by\b|precedes\b|\bthen\b|first\b[^.!?]*\bsecond\b)/iu.test(value);
export const engineExampleSchema = interactiveDrillExampleSchema.superRefine((item, ctx) => {
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
export const engineShardSchema = z.object({
  format: z.literal("interactive-shard-v1"), courseKey: safeCourse, version: z.string().min(1).max(80),
  examples: z.array(engineExampleSchema).min(1).max(ENGINE_LIMITS.shardItems),
}).strict();
