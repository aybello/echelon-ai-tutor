import { z } from "zod";
import { assessmentActivityEventSchema, type AssessmentActivityEvent } from "@shared/assessmentActivity";

export const ASSESSMENT_ACTIVITY_OUTBOX_PREFIX = "echelon:assessment-activity-outbox:v1:";
export const ASSESSMENT_ACTIVITY_QUEUE_LIMIT = 250;
const MAX_BYTES = 256_000;
export const assessmentActivityCapabilitySchema = z.object({
  tracking: z.literal(true), sessionId: z.string().uuid(),
  capability: z.string().min(1).max(2048), nextSequence: z.number().int().min(2).max(3001),
  expiresAt: z.iso.datetime(), source: z.literal("observed"),
}).strict();
export const pendingAssessmentActivityEventSchema = assessmentActivityEventSchema.extend({
  sequence: assessmentActivityEventSchema.shape.sequence.optional(),
}).strict();
export type PendingAssessmentActivityEvent = z.infer<typeof pendingAssessmentActivityEventSchema>;
export const assessmentActivityOutboxSchema = z.object({
  version: z.literal(1), actorKey: z.string().max(2048),
  capability: assessmentActivityCapabilitySchema,
  queue: z.array(pendingAssessmentActivityEventSchema).max(ASSESSMENT_ACTIVITY_QUEUE_LIMIT),
}).strict().superRefine((value, ctx) => {
  const ids = new Set<string>();
  let last = 1;
  let unsequenced = false;
  for (const event of value.queue) {
    if (ids.has(event.eventId) || (event.sequence !== undefined && (unsequenced || event.sequence <= last))) {
      ctx.addIssue({ code: "custom", message: "Conflicting or unordered replay" });
    }
    ids.add(event.eventId);
    if (event.sequence === undefined) unsequenced = true;
    else last = event.sequence;
  }
});
export type AssessmentActivityOutbox = z.infer<typeof assessmentActivityOutboxSchema>;
export type AssessmentActivityStorage = Pick<Storage, "getItem" | "setItem" | "removeItem" | "key" | "length">;
type Scope = Pick<AssessmentActivityOutbox, "actorKey" | "capability">;
/** Browser scoping is reject-only; the RPC header and server capability remain the only identity authority. */
export function assessmentActivityOutboxKey(scope: Scope): string {
  return ASSESSMENT_ACTIVITY_OUTBOX_PREFIX + JSON.stringify([scope.actorKey, scope.capability.sessionId, scope.capability.capability]);
}
export function loadAssessmentActivityOutbox(storage: AssessmentActivityStorage | null, scope: Scope): {
  value: AssessmentActivityOutbox | null; problem: "unavailable" | "invalid" | null;
} {
  if (!storage) return { value: null, problem: "unavailable" };
  let raw: string | null;
  try { raw = storage.getItem(assessmentActivityOutboxKey(scope)); }
  catch { return { value: null, problem: "unavailable" }; }
  if (raw === null) return { value: null, problem: null };
  try {
    if (raw.length > MAX_BYTES) throw Error("Oversized outbox");
    const value = assessmentActivityOutboxSchema.parse(JSON.parse(raw));
    if (assessmentActivityOutboxKey(value) !== assessmentActivityOutboxKey(scope)) throw Error("Scope mismatch");
    return { value, problem: null };
  } catch { return { value: null, problem: "invalid" }; }
}
/** Persist before sending, and after each explicit acknowledgement. Never claim durability on storage failure. */
export function saveAssessmentActivityOutbox(storage: AssessmentActivityStorage | null, value: AssessmentActivityOutbox): boolean {
  try {
    if (!storage) return false;
    const parsed = assessmentActivityOutboxSchema.parse(value);
    const key = assessmentActivityOutboxKey(parsed);
    if (!parsed.queue.length) storage.removeItem(key);
    else {
      const raw = JSON.stringify(parsed);
      if (raw.length > MAX_BYTES) return false;
      storage.setItem(key, raw);
    }
    return true;
  } catch { return false; }
}
/** Clear every pending capability owned by the actor being retired, never transfer anonymous observations. */
export function clearAssessmentActivityActor(storage: AssessmentActivityStorage | null, actorKey: string): boolean {
  if (!storage) return false;
  try {
    const keys: string[] = [];
    for (let i = 0; i < storage.length; i++) {
      const key = storage.key(i);
      if (!key?.startsWith(ASSESSMENT_ACTIVITY_OUTBOX_PREFIX)) continue;
      try {
        const tuple: unknown = JSON.parse(key.slice(ASSESSMENT_ACTIVITY_OUTBOX_PREFIX.length));
        if (Array.isArray(tuple) && tuple[0] === actorKey) keys.push(key);
      } catch { /* Unrelated malformed key. */ }
    }
    for (const key of keys) storage.removeItem(key);
    return true;
  } catch { return false; }
}
/** Hydrate the owned server sequence first. Old assigned records are replayed even after an ambiguous acknowledgement. */
export function sequenceAssessmentActivityOutbox(value: AssessmentActivityOutbox, serverNext: number): AssessmentActivityOutbox {
  const parsed = assessmentActivityOutboxSchema.parse(value);
  if (!Number.isInteger(serverNext) || serverNext < 2 || serverNext > 3001) throw Error("Invalid server sequence");
  let expected = serverNext;
  let next = Math.max(serverNext, ...parsed.queue.map(event => (event.sequence ?? 1) + 1));
  const queue = parsed.queue.map(event => {
    if (event.sequence !== undefined) {
      if (event.sequence > expected) throw Error("Missing observed sequence; cannot reconstruct history");
      if (event.sequence === expected) expected++;
      return event;
    }
    const sequenced = assessmentActivityEventSchema.parse({ ...event, sequence: next++ });
    if (sequenced.sequence !== expected) throw Error("Missing observed sequence");
    expected++;
    return sequenced;
  });
  return assessmentActivityOutboxSchema.parse({ ...parsed, queue });
}
/** Acknowledgements may remove only the exact immutable prefix actually sent, not a replacement choice or UUID. */
export function acknowledgeAssessmentActivityOutbox(value: AssessmentActivityOutbox, sent: AssessmentActivityEvent[]): AssessmentActivityOutbox {
  const parsed = assessmentActivityOutboxSchema.parse(value);
  if (!sent.length || sent.length > 25 || sent.length > parsed.queue.length) throw Error("Invalid acknowledgement");
  sent.forEach((event, index) => {
    const exact = assessmentActivityEventSchema.parse(event);
    if (JSON.stringify(exact) !== JSON.stringify(parsed.queue[index])) throw Error("Conflicting replay acknowledgement");
  });
  return { ...parsed, queue: parsed.queue.slice(sent.length) };
}
