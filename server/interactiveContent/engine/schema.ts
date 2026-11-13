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

// The client wire parser and private engine enforce exactly the same semantics.
export const engineExampleSchema = interactiveDrillExampleSchema;
export const engineShardSchema = z.object({
  format: z.literal("interactive-shard-v1"), courseKey: safeCourse, version: z.string().min(1).max(80),
  examples: z.array(engineExampleSchema).min(1).max(ENGINE_LIMITS.shardItems),
}).strict();
