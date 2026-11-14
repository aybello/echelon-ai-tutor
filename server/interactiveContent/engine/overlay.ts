import { boundReviewSchema, receiptSchema, verifyReceipt, canonicalSha256 } from "./reviewReceipt";
import { createHash } from "node:crypto";
import { z } from "zod";
import { getCourseByKey } from "../../../shared/courseRegistry";
import { causeEffectFit, type CauseEffectChoiceItem } from "../../../shared/interactiveCauseEffect";
import { interactiveDifficultySchema, interactiveDrillExampleSchema, interactiveSafeIdSchema, type InteractiveDifficulty, type InteractiveDrillExample } from "../../../shared/interactiveSessions";
import { ENGINE_LIMITS } from "./schema";
import rapidSwipeBalance from "../overlay/2026-11-14-rapid-swipe-balance.json";
import optionLengthClass2Ww from "../overlay/2026-11-14-option-length-class2-ww.json";
import optionLengthBatch2 from "../overlay/2026-11-14-option-length-batch-2.json";
import oitBatch1 from "../overlay/2026-11-14-oit-batch-1.json";
import oitBatch2 from "../overlay/2026-11-14-oit-batch-2.json";
import oitBatch3 from "../overlay/2026-11-14-oit-batch-3.json";
import oitBatch5 from "../overlay/2026-11-14-oit-batch-5.json";
import oitBatch4 from "../overlay/2026-11-14-oit-batch-4.json";
import oitBatch6 from "../overlay/2026-11-14-oit-batch-6.json";
import oitBatch7 from "../overlay/2026-11-14-oit-batch-7.json";
import oitBatch8 from "../overlay/2026-11-14-oit-batch-8.json";
import oitBatch9 from "../overlay/2026-11-14-oit-batch-9.json";
import oitBatch10 from "../overlay/2026-11-14-oit-batch-10.json";
import oitBatch11 from "../overlay/2026-11-14-oit-batch-11.json";
import oitBatch12 from "../overlay/2026-11-14-oit-batch-12.json";
import oitBatch13 from "../overlay/2026-11-14-oit-batch-13.json";
import oitWwBatch1 from "../overlay/2026-11-14-oit-ww-batch-1.json";
import oitWwBatch2 from "../overlay/2026-11-14-oit-ww-batch-2.json";
import oitWwBatch3 from "../overlay/2026-11-14-oit-ww-batch-3.json";
import oitWwBatch4 from "../overlay/2026-11-14-oit-ww-batch-4.json";
import oitWwBatch5 from "../overlay/2026-11-14-oit-ww-batch-5.json";
import oitWwBatch6 from "../overlay/2026-11-14-oit-ww-batch-6.json";
import oitWwBatch7 from "../overlay/2026-11-14-oit-ww-batch-7.json";
import oitWwBatch8 from "../overlay/2026-11-14-oit-ww-batch-8.json";

// Committed owner-authorized AI-reviewed overlays, in application order.
const COMMITTED_OVERLAYS: readonly unknown[] = [rapidSwipeBalance, optionLengthClass2Ww, optionLengthBatch2, oitBatch1, oitBatch2, oitBatch3, oitBatch4, oitBatch5,
  oitBatch6, oitBatch7, oitBatch8, oitBatch9, oitBatch10, oitBatch11, oitBatch12, oitBatch13,
  oitWwBatch1, oitWwBatch2, oitWwBatch3, oitWwBatch4, oitWwBatch5, oitWwBatch6, oitWwBatch7, oitWwBatch8];

/**
 * Committed, server-only content overlays on the published game bank.
 *
 * An overlay adds reviewed exercises to a course, or replaces a stored exercise
 * with a reviewed revision under a new ID. The stored release artifacts stay
 * byte-for-byte unchanged. A replacement names the SHA-256 of the exact stored
 * example it supersedes; if the stored bytes ever differ, the engine fails
 * closed rather than serving a revision of different content.
 *
 * The metadata claims owner-authorized AI review. It is not human technical review.
 * Historical v1 metadata is accepted only for seven exact pinned documents.
 * New v2 documents require an explicit owner review declaration bound to each
 * educational payload and successful builder results. Neither metadata nor
 * local integrity hashes authenticate a provider identity. Selected exact-ID
 * exclusions remain unchanged; see docs/pr63-release-review.md for policy.
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
const historicalOverlaySchema = z.object({
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
const additionShape = historicalOverlaySchema.shape.additions.element.omit({ review: true });
const replacementShape = historicalOverlaySchema.shape.replacements.element.omit({ review: true });
export const draftOverlaySchema = historicalOverlaySchema.extend({ additions: z.array(additionShape), replacements: z.array(replacementShape) });
const receiptOverlaySchema = historicalOverlaySchema.extend({
  format: z.literal("interactive-overlay-v2"), receipt: receiptSchema,
  additions: z.array(additionShape.extend({ review: boundReviewSchema })).max(38 * 2000),
  replacements: z.array(replacementShape.extend({ review: boundReviewSchema })).max(38 * 2000),
});
export const overlaySchema = z.discriminatedUnion("format", [historicalOverlaySchema, receiptOverlaySchema]);
type HistoricalOverlay = z.infer<typeof historicalOverlaySchema>;
type BoundReview = z.infer<typeof boundReviewSchema>;
export type ContentOverlay = Omit<HistoricalOverlay, "format" | "additions" | "replacements"> & {
  format: "interactive-overlay-v1" | "interactive-overlay-v2";
  additions: (Omit<HistoricalOverlay["additions"][number], "review"> & { review: HistoricalOverlay["additions"][number]["review"] | BoundReview })[];
  replacements: (Omit<HistoricalOverlay["replacements"][number], "review"> & { review: HistoricalOverlay["replacements"][number]["review"] | BoundReview })[];
  receipt?: z.infer<typeof receiptSchema>;
};

// Exact immutable historical exceptions only. New or changed v1 documents fail closed.
const HISTORICAL_SHA256: Record<string, string> = {
  "rapid-swipe-balance-20261114": "52bf5b1dfc2770d471f43caf6c638dc7ec2a6fb56b6fe5d1f505bf994341e33f",
  "option-length-class2-ww-20261114": "74350072691cf043f04a04ba17c4fceebbcc54bd8ea1ee6094e8d42b8a2342c6",
  "option-length-batch-2-20261114": "9b71be7b3ad9842ebc2263a1e5bd7753b5a3944aa066e8f304aca72f25664d4f",
  "og-oit-1": "63078449fd7acb2c2cf8d56229689a2f1a9f86d610d57df7e693f056d46af776",
  "og-oit-2": "66d2bf9d1fdfa36d632c58c6778e09d11c88aa9acf24a2b80c32cc76a5771115",
  "og-oit-3": "1f374818da29b5bdb87a1e65c2196583ecbb80e36effc9c705d064243222917e",
  "og-oit-4": "73eff70967dc05d60dc33b407b14f46bda84afaac171d87e345e6f206f32777d",
};

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
    if (overlay.format === "interactive-overlay-v2") verifyReceipt(overlay);
    else if (HISTORICAL_SHA256[overlay.overlayId] !== canonicalSha256(overlay)) throw new Error(`Only exact historical v1 overlays are allowed: ${overlay.overlayId}`);
  }
  return deepFreeze(courses);
}

const committed = compileOverlays(COMMITTED_OVERLAYS);
const empty: CourseOverlay = Object.freeze({ additions: [], replacements: new Map() }) as CourseOverlay;
export const committedOverlay = (courseKey: string): CourseOverlay => committed.get(courseKey) ?? empty;
export const committedOverlayDocuments = (): readonly unknown[] => COMMITTED_OVERLAYS;
