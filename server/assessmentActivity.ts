import { createHash, createHmac, randomUUID, timingSafeEqual } from "node:crypto";
import { and, eq, inArray } from "drizzle-orm";
import { z } from "zod";
import { assessmentActivityEvents, assessmentActivitySessions } from "../drizzle/schema";
import { getCourseByKey, resolveCourseKey } from "../shared/courseRegistry";
import {
  assessmentActivityIdentitySchema, assessmentActivityIssueSchema, assessmentActivityLimits,
  assessmentActivityModeSchema, assessmentActivityRecordInputSchema, assessmentActivityResumeInputSchema,
  type AssessmentActivityCapability, type AssessmentActivityEvent, type AssessmentActivityIssue,
  type AssessmentActivityItem, type AssessmentActivityNotRecorded, type AssessmentActivityRecordInput,
  type AssessmentActivityRecordResult, type AssessmentActivityResumeInput, type AssessmentActivityResumeResult,
} from "../shared/assessmentActivity";
import { resolveVerifiedIdentity } from "./_core/accessService";
import type { TrpcContext } from "./_core/context";
import { ENV } from "./_core/env";
import { getDb } from "./db";
import { validateIssuedAttribution } from "./teams/attemptAttribution";

const NOT_RECORDED: AssessmentActivityNotRecorded = { tracking: false, recorded: false, source: "observed" };
const TTL_MS = 6 * 60 * 60 * 1000;
const digest = (value: string) => createHash("sha256").update(value).digest("hex");
const sameHash = (left: string, right: string) => /^[a-f0-9]{64}$/.test(left) && /^[a-f0-9]{64}$/.test(right)
  && timingSafeEqual(Buffer.from(left, "hex"), Buffer.from(right, "hex"));

/** Authorized readers only. Never use a supplied email to establish actor ownership. */
export function assessmentActivityEmailHash(email: string): string {
  if (!ENV.cookieSecret) throw new Error("Tracking unavailable");
  return createHmac("sha256", ENV.cookieSecret).update(`assessment-activity:v1:email:${email.trim().toLowerCase()}`).digest("hex");
}
/** Verify before interpreting stored prompts/options. This is not a grading or answer-key resolver. */
export function readAssessmentActivityItems(issuedItemsJson: string, manifestHash: string): AssessmentActivityItem[] | null {
  try {
    if (!sameHash(digest(issuedItemsJson), manifestHash)) return null;
    return assessmentActivityIssueSchema.shape.items.parse(JSON.parse(issuedItemsJson));
  } catch { return null; }
}

/** Same fail-closed preferences as learnerSignIn; explicit denial always overrides cookies. */
export function assessmentActivityAllowed(ctx: Pick<TrpcContext, "req">): boolean {
  const headers = ctx.req.headers;
  if (headers.dnt === "1" || headers["sec-gpc"] === "1") return false;
  if (headers["x-echelon-activity"] != null) return headers["x-echelon-activity"] === "allowed";
  return /(?:^|;\s*)echelon_activity_preference=allowed(?:;|$)/.test(String(headers.cookie ?? ""));
}
export type AssessmentActivityActor = {
  actorHash: string; identityKind: "user" | "verified-email" | "anonymous";
  userId: number | null; emailHash: string | null;
};
const capSchema = z.object({
  version: z.literal(1), sessionId: z.string().uuid(), courseKey: z.string().min(1).max(64),
  mode: assessmentActivityModeSchema, actorHash: z.string().regex(/^[a-f0-9]{64}$/),
  identityKind: assessmentActivityIdentitySchema, manifestHash: z.string().regex(/^[a-f0-9]{64}$/),
  expires: z.number().int().positive(), anonymousNonce: z.string().uuid().optional(),
}).strict();
type Capability = z.infer<typeof capSchema>;

/** Namespaces intentionally distinguish OAuth IDs from OTP email hashes. No anonymous linking. */
export function createAssessmentActivitySecurity(secret: string) {
  const hmac = (domain: string, value: string) => createHmac("sha256", secret).update(`assessment-activity:v1:${domain}:${value}`).digest("hex");
  function actor(ctx: TrpcContext, anonymousNonce?: string): AssessmentActivityActor | null {
    if (!secret || !assessmentActivityAllowed(ctx)) return null;
    const identity = resolveVerifiedIdentity(ctx);
    if (identity.type === "oauth") return { actorHash: hmac("actor", `user:${identity.userId}`), identityKind: "user", userId: identity.userId, emailHash: null };
    if (identity.type === "otp") return { actorHash: hmac("actor", `email:${identity.email}`), identityKind: "verified-email", userId: null, emailHash: hmac("email", identity.email) };
    if (!anonymousNonce || !z.string().uuid().safeParse(anonymousNonce).success) return null;
    return { actorHash: hmac("actor", `anonymous:${anonymousNonce}`), identityKind: "anonymous", userId: null, emailHash: null };
  }
  function sign(value: Capability): string {
    if (!secret) throw new Error("Tracking unavailable");
    const body = Buffer.from(JSON.stringify(capSchema.parse(value))).toString("base64url");
    return `${body}.${hmac("capability", body)}`;
  }
  function verify(token: string, ctx: TrpcContext, now = Date.now()): Capability | null {
    if (!secret || token.length > 2048) return null;
    const [body, signature, extra] = token.split(".");
    if (!body || !signature || extra || !sameHash(hmac("capability", body), signature)) return null;
    try {
      const cap = capSchema.parse(JSON.parse(Buffer.from(body, "base64url").toString("utf8")));
      const resolved = actor(ctx, cap.anonymousNonce);
      if (cap.expires <= now || cap.expires > now + TTL_MS || !resolved || resolved.identityKind !== cap.identityKind || !sameHash(resolved.actorHash, cap.actorHash)) return null;
      if ((cap.identityKind === "anonymous") !== !!cap.anonymousNonce) return null;
      return cap;
    } catch { return null; }
  }
  return { actor, sign, verify };
}

/** Fixed field order: omitted fields normalize to NULL. UUID reuse with different content is rejected. */
export function assessmentActivityEventHash(event: AssessmentActivityEvent): string {
  return digest(JSON.stringify({ eventId: event.eventId, sequence: event.sequence, action: event.action,
    itemId: event.itemId ?? null, stepId: event.stepId ?? null, chosenAnswer: event.chosenAnswer ?? null,
    observedCorrect: event.observedCorrect ?? null, source: "observed" }));
}
type StoredEvent = { eventId: string; payloadHash: string };
export type AssessmentActivityState = { status: "active" | "completed" | "abandoned"; lastSequence: number; eventCount: number };

function validEventForManifest(event: AssessmentActivityEvent, items: AssessmentActivityItem[]): boolean {
  if (event.action === "issued") return false;
  if (["started", "resumed", "completed", "abandoned"].includes(event.action)) {
    return event.itemId == null && event.stepId == null && event.chosenAnswer == null && event.observedCorrect == null;
  }
  const item = items.find(candidate => candidate.id === event.itemId);
  if (!item) return false;
  const step = event.stepId ? item.steps.find(candidate => candidate.id === event.stepId) : undefined;
  if (event.stepId && !step) return false;
  const answer = event.action === "answer_submitted" || event.action === "step_answer";
  if (event.action === "step_answer" && !step) return false;
  if (event.action === "answer_submitted" && step) return false;
  if (event.action === "selection_changed") return event.observedCorrect == null && event.chosenAnswer != null && (step?.options ?? item.options).some(option => option.id === event.chosenAnswer);
  if (!answer) return event.chosenAnswer == null && event.observedCorrect == null;
  return event.chosenAnswer != null && (step?.options ?? item.options).some(option => option.id === event.chosenAnswer);
}

/** Pure bounded reducer used under a session row lock. No score or elapsed-time inference. */
export function reduceAssessmentActivityBatch(state: AssessmentActivityState, items: AssessmentActivityItem[], events: AssessmentActivityEvent[], existing: StoredEvent[]) {
  const known = new Map(existing.map(event => [event.eventId, event.payloadHash]));
  const accepted: AssessmentActivityEvent[] = [];
  const next = { status: state.status, lastSequence: state.lastSequence, eventCount: state.eventCount };
  let duplicates = 0;
  for (const event of events) {
    const payloadHash = assessmentActivityEventHash(event);
    const previous = known.get(event.eventId);
    if (previous) {
      if (!sameHash(previous, payloadHash)) throw new Error("Event UUID payload conflict");
      duplicates++;
      continue;
    }
    // Back-review is observational even after a failed/abandoned practice page.
    // Neither terminal status can accept answers, retries or a new completion.
    const terminalReview = (next.status === "completed" || next.status === "abandoned") && ["item_presented", "hint_opened", "explanation_opened", "resumed"].includes(event.action);
    if ((next.status !== "active" && !terminalReview) || event.sequence !== next.lastSequence + 1 || next.eventCount >= assessmentActivityLimits.events || !validEventForManifest(event, items)) throw new Error("Invalid observed event transition");
    if (event.action === "completed" || event.action === "abandoned") next.status = event.action;
    next.lastSequence = event.sequence;
    next.eventCount++;
    known.set(event.eventId, payloadHash);
    accepted.push(event);
  }
  return { next, accepted, duplicates };
}

/** Additional bounded per-process defense; database eventCount is the durable per-session ceiling. */
const budgets = new Map<string, { count: number; until: number }>();
function consumeBudget(key: string, max: number): boolean {
  const now = Date.now();
  for (const [entry, budget] of budgets) if (budget.until <= now) budgets.delete(entry);
  const budget = budgets.get(key);
  if (budget && budget.count >= max) return false;
  if (!budget && budgets.size >= 10000) return false;
  budgets.set(key, budget ? { ...budget, count: budget.count + 1 } : { count: 1, until: now + 60000 });
  return true;
}
export type AssessmentActivityIssueOptions = {
  /** Optional extra check for an existing canonical source; source IDs must originate in trusted server delivery. */
  resolveSource?: (sourceSessionId: string, actor: AssessmentActivityActor, courseKey: string) => Promise<boolean>;
};
export type AssessmentActivityAttribution = { orgId: number | null; organizationMemberId: number | null; flexLicenceId: number | null };
const LEARNER_ONLY: AssessmentActivityAttribution = { orgId: null, organizationMemberId: null, flexLicenceId: null };
/** Read-only validation, never discovery/reassignment. A cleared session stays learner-only. */
async function revalidateObservationAttribution(ctx: TrpcContext, courseKey: string, issued: AssessmentActivityAttribution, readDb?: Parameters<typeof validateIssuedAttribution>[3]): Promise<AssessmentActivityAttribution> {
  if (!issued.orgId) return { ...LEARNER_ONLY };
  const identity = resolveVerifiedIdentity(ctx);
  if (identity.type === "anonymous") return { ...LEARNER_ONLY };
  try {
    const current = await validateIssuedAttribution({
      userId: identity.type === "oauth" ? identity.userId : null, studentEmail: identity.email,
    }, courseKey, issued, readDb);
    return current?.orgId === issued.orgId && current.organizationMemberId === issued.organizationMemberId
      && current.flexLicenceId === issued.flexLicenceId ? { ...issued } : { ...LEARNER_ONLY };
  } catch {
    // Resolver unavailability cannot preserve employer visibility for newly accepted activity.
    return { ...LEARNER_ONLY };
  }
}
/** UTC epoch milliseconds in storage; ISO conversion only at read boundaries. */
export const assessmentActivityDate = (utcMs: number | null): string | null => utcMs == null ? null : new Date(utcMs).toISOString();

/**
 * SERVER DELIVERY BUILDERS ONLY, after existing access/content checks. Never expose as a public start RPC.
 * Input must come from the exact issued delivery payload, not request input, authored names, or audit files.
 * Failures are isolated: return tracking:false and deliver the original assessment unchanged.
 */
export async function issueAssessmentActivity(ctx: TrpcContext, supplied: AssessmentActivityIssue, attribution?: AssessmentActivityAttribution, options: AssessmentActivityIssueOptions = {}): Promise<AssessmentActivityCapability | AssessmentActivityNotRecorded> {
  try {
    if (!assessmentActivityAllowed(ctx)) return NOT_RECORDED;
    const input = assessmentActivityIssueSchema.parse(supplied);
    const course = resolveCourseKey(input.courseKey);
    if (!course || !getCourseByKey(course.courseKey)?.isActive) return NOT_RECORDED;
    const security = createAssessmentActivitySecurity(ENV.cookieSecret);
    const anonymousNonce = resolveVerifiedIdentity(ctx).type === "anonymous" ? randomUUID() : undefined;
    const actor = security.actor(ctx, anonymousNonce);
    if (!actor || !consumeBudget(`issue:${actor.actorHash}`, 30)) return NOT_RECORDED;
    // sourceSessionId is trusted server issuer output, never copied from client diagnostics/session inputs.
    if (input.sourceSessionId && options.resolveSource && !await options.resolveSource(input.sourceSessionId, actor, course.courseKey)) return NOT_RECORDED;
    let ownership = z.object({ orgId: z.number().int().positive().nullable(), organizationMemberId: z.number().int().positive().nullable(), flexLicenceId: z.number().int().positive().nullable() }).strict().parse(attribution ?? { orgId: null, organizationMemberId: null, flexLicenceId: null });
    if ((ownership.organizationMemberId || ownership.flexLicenceId) && !ownership.orgId) return NOT_RECORDED;
    if (actor.identityKind === "anonymous" && (ownership.orgId || ownership.organizationMemberId || ownership.flexLicenceId)) return NOT_RECORDED;
    ownership = await revalidateObservationAttribution(ctx, course.courseKey, ownership);
    // This is a separate observation-session ID, never an attempt ID invented by the browser.
    const sessionId = randomUUID();
    const now = Date.now();
    const expiresAt = now + TTL_MS;
    const issuedItemsJson = JSON.stringify(input.items);
    const manifestHash = digest(issuedItemsJson);
    const db = await getDb();
    if (!db) return NOT_RECORDED;
    const startId = randomUUID();
    await db.transaction(async tx => {
      await tx.insert(assessmentActivitySessions).values({ sessionId, ...actor, ...ownership, courseKey: course.courseKey,
        mode: input.mode, sourceSessionId: input.sourceSessionId ?? null, timed: input.timed,
        itemCount: input.items.length, issuedItemsJson, manifestHash, startedAt: now, lastObservedAt: now, expiresAt,
        activeSeconds: null, lastSequence: 1, eventCount: 1, source: "observed", status: "active" });
      await tx.insert(assessmentActivityEvents).values({ sessionId, eventId: startId, sequence: 1,
        action: "issued", source: "observed", occurredAt: now,
        payloadHash: digest(JSON.stringify({ eventId: startId, sequence: 1, action: "issued", source: "observed" })) });
    });
    const capability = security.sign({ version: 1, sessionId, actorHash: actor.actorHash, identityKind: actor.identityKind,
      courseKey: course.courseKey, mode: input.mode, manifestHash, expires: expiresAt, ...(anonymousNonce ? { anonymousNonce } : {}) });
    return { tracking: true, sessionId, capability, nextSequence: 2, expiresAt: new Date(expiresAt).toISOString(), source: "observed" };
  } catch { return NOT_RECORDED; }
}

/** No input identity, prompts, snapshots, free text, metadata, client timestamps or canonical scores. */
export async function recordAssessmentActivity(ctx: TrpcContext, supplied: AssessmentActivityRecordInput): Promise<AssessmentActivityRecordResult> {
  try {
    if (!assessmentActivityAllowed(ctx)) return NOT_RECORDED;
    const input = assessmentActivityRecordInputSchema.parse(supplied);
    const cap = createAssessmentActivitySecurity(ENV.cookieSecret).verify(input.capability, ctx);
    if (!cap || !consumeBudget(`record:${cap.actorHash}`, 120)) return NOT_RECORDED;
    const db = await getDb();
    if (!db) return NOT_RECORDED;
    return await db.transaction(async tx => {
      const [session] = await tx.select().from(assessmentActivitySessions).where(and(
        eq(assessmentActivitySessions.sessionId, cap.sessionId), eq(assessmentActivitySessions.actorHash, cap.actorHash),
        eq(assessmentActivitySessions.identityKind, cap.identityKind), eq(assessmentActivitySessions.courseKey, cap.courseKey),
      )).limit(1).for("update");
      if (!session || session.mode !== cap.mode || !sameHash(session.manifestHash, cap.manifestHash)
        || session.expiresAt !== cap.expires || session.expiresAt <= Date.now()
        || !sameHash(digest(session.issuedItemsJson), cap.manifestHash)) throw new Error("Invalid observation session");
      const items = assessmentActivityIssueSchema.shape.items.parse(JSON.parse(session.issuedItemsJson));
      const existing = await tx.select({ eventId: assessmentActivityEvents.eventId, payloadHash: assessmentActivityEvents.payloadHash })
        .from(assessmentActivityEvents).where(and(eq(assessmentActivityEvents.sessionId, cap.sessionId), inArray(assessmentActivityEvents.eventId, input.events.map(event => event.eventId))));
      const reduction = reduceAssessmentActivityBatch(session, items, input.events, existing);
      if (reduction.accepted.length) {
        const now = Date.now();
        const ownership = await revalidateObservationAttribution(ctx, session.courseKey, session, tx);
        if (session.orgId !== ownership.orgId || session.organizationMemberId !== ownership.organizationMemberId || session.flexLicenceId !== ownership.flexLicenceId) {
          // Under the session lock, clear ALL attribution before accepting new observations.
          // Hiding the whole session prevents later reactivation exposing a revoked interval.
          await tx.update(assessmentActivitySessions).set(LEARNER_ONLY).where(eq(assessmentActivitySessions.sessionId, cap.sessionId));
        }
        await tx.insert(assessmentActivityEvents).values(reduction.accepted.map(event => ({
          sessionId: cap.sessionId, eventId: event.eventId, sequence: event.sequence, action: event.action,
          itemId: event.itemId ?? null, stepId: event.stepId ?? null, chosenAnswer: event.chosenAnswer ?? null,
          observedCorrect: event.observedCorrect ?? null, source: "observed", occurredAt: now, payloadHash: assessmentActivityEventHash(event),
        })));
        await tx.update(assessmentActivitySessions).set({ ...reduction.next, lastObservedAt: now,
          ...(session.status === "active" && reduction.next.status !== "active" ? { endedAt: now } : {}) }).where(eq(assessmentActivitySessions.sessionId, cap.sessionId));
      }
      return { tracking: true as const, recorded: true as const, accepted: reduction.accepted.length,
        duplicates: reduction.duplicates, nextSequence: reduction.next.lastSequence + 1, status: reduction.next.status, source: "observed" as const };
    });
  } catch { return NOT_RECORDED; }
}

/** Hydrates sequence only; does not reopen or log activity, expose snapshots, or assert cross-device resume. */
export async function resumeAssessmentActivity(ctx: TrpcContext, supplied: AssessmentActivityResumeInput): Promise<AssessmentActivityResumeResult> {
  try {
    if (!assessmentActivityAllowed(ctx)) return NOT_RECORDED;
    const input = assessmentActivityResumeInputSchema.parse(supplied);
    const cap = createAssessmentActivitySecurity(ENV.cookieSecret).verify(input.capability, ctx);
    if (!cap || !consumeBudget(`resume:${cap.actorHash}`, 60)) return NOT_RECORDED;
    const db = await getDb();
    if (!db) return NOT_RECORDED;
    const [session] = await db.select().from(assessmentActivitySessions).where(and(
      eq(assessmentActivitySessions.sessionId, cap.sessionId), eq(assessmentActivitySessions.actorHash, cap.actorHash),
      eq(assessmentActivitySessions.identityKind, cap.identityKind), eq(assessmentActivitySessions.courseKey, cap.courseKey),
    )).limit(1);
    if (!session || session.mode !== cap.mode || !sameHash(session.manifestHash, cap.manifestHash)
      || session.expiresAt !== cap.expires || session.expiresAt <= Date.now()
      || !sameHash(digest(session.issuedItemsJson), cap.manifestHash)) return NOT_RECORDED;
    return { tracking: true, sessionId: cap.sessionId, capability: input.capability, nextSequence: session.lastSequence + 1,
      expiresAt: new Date(session.expiresAt).toISOString(), source: "observed", status: session.status };
  } catch { return NOT_RECORDED; }
}
