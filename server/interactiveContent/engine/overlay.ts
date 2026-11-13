import { createHash } from "node:crypto";
import { z } from "zod";
import { getCourseByKey } from "../../../shared/courseRegistry";
import { causeEffectFit, type CauseEffectChoiceItem } from "../../../shared/interactiveCauseEffect";
import { interactiveDifficultySchema, interactiveDrillExampleSchema, interactiveSafeIdSchema, type InteractiveDifficulty, type InteractiveDrillExample } from "../../../shared/interactiveSessions";
import { ENGINE_LIMITS } from "./schema";
import rapidSwipeBalance from "../overlay/2026-11-14-rapid-swipe-balance.json";
import optionLengthClass2Ww from "../overlay/2026-11-14-option-length-class2-ww.json";
import optionLengthBatch2 from "../overlay/2026-11-14-option-length-batch-2.json";

// Every committed overlay, in application order. Add new reviewed batches here.
const COMMITTED_OVERLAYS: readonly unknown[] = [rapidSwipeBalance, optionLengthClass2Ww, optionLengthBatch2];

/**
 * Committed, server-only content overlays on the published game bank.
 *
 * An overlay adds reviewed exercises to a course, or replaces a stored exercise
 * with a reviewed revision under a new ID. The stored release artifacts stay
 * byte-for-byte unchanged. A replacement names the SHA-256 of the exact stored
 * example it supersedes; if the stored bytes ever differ, the engine fails
 * closed rather than serving a revision of different content.
 *
 * Review here is owner-authorized AI review. It is not human technical review.
 */
const text = z.string().trim().min(1).max(4000);
const review = z.object({
  verdict: z.literal("approved"),
  reviewer: text,
  reviewAuthority: z.literal("owner-authorized-ai-review"),
  reviewedAt: z.string().datetime({ offset: true }),
  notes: text,
}).strict();
const courseKey = z.string().regex(/^[a-z0-9][a-z0-9-]{0,63}$/);
export const overlaySchema = z.object({
  format: z.literal("interactive-overlay-v1"),
  overlayId: interactiveSafeIdSchema,
  scope: text,
  additions: z.array(z.object({
    courseKey, topicId: z.literal("unclassified"), difficulty: interactiveDifficultySchema,
    example: interactiveDrillExampleSchema, review,
  }).strict()).max(38 * 2000),
  replacements: z.array(z.object({
    courseKey, replacesId: interactiveSafeIdSchema, replacesSha256: z.string().regex(/^[a-f0-9]{64}$/),
    topicId: z.literal("unclassified"), difficulty: interactiveDifficultySchema,
    example: interactiveDrillExampleSchema, reason: text, review,
  }).strict()).max(38 * 2000),
}).strict();
export type ContentOverlay = z.infer<typeof overlaySchema>;

export type OverlayItem = { id: string; mode: InteractiveDrillExample["mode"]; topicId: string; difficulty: InteractiveDifficulty; bytes: number; example: InteractiveDrillExample };
export type CourseOverlay = { additions: OverlayItem[]; replacements: Map<string, { sha256: string; item: OverlayItem }> };

const json = (value: unknown) => JSON.stringify(value);
export const exampleSha256 = (example: unknown) => createHash("sha256").update(json(example)).digest("hex");

function deepFreeze<T>(value: T): T {
  if (value && typeof value === "object" && !Object.isFrozen(value)) {
    for (const child of Object.values(value)) deepFreeze(child);
    Object.freeze(value);
  }
  return value;
}

/** Validate every overlay at module load. Any defect throws and nothing is served. */
export function compileOverlays(overlays: readonly unknown[]): ReadonlyMap<string, CourseOverlay> {
  const courses = new Map<string, CourseOverlay>();
  const overlayIds = new Set<string>();
  const course = (key: string) => {
    const known = getCourseByKey(key);
    if (!known?.isActive || known.courseKey !== key || key === "electrician-309a") throw new Error(`Overlay course is not eligible: ${key}`);
    let entry = courses.get(key);
    if (!entry) courses.set(key, entry = { additions: [], replacements: new Map() });
    return entry;
  };
  const ids = new Map<string, Set<string>>();
  const claim = (key: string, id: string) => {
    const seen = ids.get(key) ?? new Set<string>();
    if (seen.has(id)) throw new Error(`Duplicate overlay id ${key}/${id}`);
    seen.add(id); ids.set(key, seen);
  };
  const item = (example: InteractiveDrillExample, topicId: string, difficulty: InteractiveDifficulty): OverlayItem => {
    const bytes = Buffer.byteLength(json(example));
    if (bytes > ENGINE_LIMITS.exampleBytes) throw new Error(`Overlay example too large: ${example.id}`);
    if (example.mode === "cause-effect" && causeEffectFit(example as CauseEffectChoiceItem) === "calculation") throw new Error(`Calculation item in Cause and Effect: ${example.id}`);
    return { id: example.id, mode: example.mode, topicId, difficulty, bytes, example };
  };
  for (const raw of overlays) {
    const overlay = overlaySchema.parse(raw);
    if (overlayIds.has(overlay.overlayId)) throw new Error(`Duplicate overlay ${overlay.overlayId}`);
    overlayIds.add(overlay.overlayId);
    for (const addition of overlay.additions) {
      claim(addition.courseKey, addition.example.id);
      course(addition.courseKey).additions.push(item(addition.example, addition.topicId, addition.difficulty));
    }
    for (const replacement of overlay.replacements) {
      const target = course(replacement.courseKey);
      if (target.replacements.has(replacement.replacesId)) throw new Error(`Stored item replaced twice: ${replacement.replacesId}`);
      if (replacement.example.id === replacement.replacesId) throw new Error(`A revision needs a new id: ${replacement.replacesId}`);
      claim(replacement.courseKey, replacement.example.id);
      claim(replacement.courseKey, `replaces:${replacement.replacesId}`);
      target.replacements.set(replacement.replacesId, { sha256: replacement.replacesSha256, item: item(replacement.example, replacement.topicId, replacement.difficulty) });
    }
  }
  return deepFreeze(courses);
}

const committed = compileOverlays(COMMITTED_OVERLAYS);
const empty: CourseOverlay = Object.freeze({ additions: [], replacements: new Map() }) as CourseOverlay;
export const committedOverlay = (courseKey: string): CourseOverlay => committed.get(courseKey) ?? empty;
export const committedOverlayDocuments = (): readonly unknown[] => COMMITTED_OVERLAYS;
