import { issueGameCapability, recordGameActivity } from "../gameAnalytics";
import { gameActivityInputSchema } from "../../shared/gameAnalytics";
import { createHmac } from "node:crypto";
import { z } from "zod";
import { assessmentActivityAllowed, issueAssessmentActivity } from "../assessmentActivity";
import { resolveVerifiedIdentity } from "../_core/accessService";
import { PERSONAL_ATTRIBUTION, resolveAttemptAttribution } from "../teams/attemptAttribution";
import type { AssessmentActivityIssue } from "../../shared/assessmentActivity";
import { ENV } from "../_core/env";
import { TRPCError } from "@trpc/server";
import { getCourseByKey } from "../../shared/courseRegistry";
import {
  interactiveCatalogInputSchema, interactiveCatalogResponseSchema,
  interactiveStartSessionInputSchema, interactiveSessionResponseSchema,
  interactiveProgressInputSchema, interactiveProgressResponseSchema,
  interactiveRecordResultsInputSchema, interactiveRecordResultsResponseSchema,
  type InteractiveSessionResponse,
} from "../../shared/interactiveSessions";
import { acceptLocalDate, dueItemIds, learnerKeyFrom, readProgress, saveResults } from "../interactiveProgress";
import { publicProcedure, router } from "../_core/trpc";
import { getInteractiveContentEngine } from "../interactiveContent/engine/loader";

const activityTrackingSchema = z.union([
  z.object({ tracking: z.literal(true), sessionId: z.string().uuid(), capability: z.string().min(1).max(2048), nextSequence: z.number().int().min(2), expiresAt: z.string(), source: z.literal("observed") }).strict(),
  z.object({ tracking: z.literal(false), recorded: z.literal(false), source: z.literal("observed") }).strict(),
]);
const trackedSessionResponseSchema = interactiveSessionResponseSchema.extend({ activityTracking: activityTrackingSchema.optional() });

/** Stable aliases refer to original issued positions, never shuffled visual positions.
 * Pair steps name the left item; their choices name each issued right item.
 * No answer keys enter this supplemental snapshot or employer attribution.
 */
export function gameAssessmentIssue(session: InteractiveSessionResponse): AssessmentActivityIssue {
  return {
    courseKey: session.courseKey, mode: session.mode, timed: null, sourceSessionId: session.sessionId,
    items: session.examples.map(item => {
      const base = { id: item.id, title: `${session.mode} · content version ${session.version ?? "unavailable"}`, prompt: [item.prompt, item.instruction, "assumptions" in item ? item.assumptions : undefined].filter(Boolean).join("\n"), options: [] as { id: string; text: string }[], steps: [] as { id: string; label: string; options: { id: string; text: string }[] }[] };
      if (item.mode === "speed-match") {
        base.steps = item.pairs.map((pair, index) => ({ id: `pair:${index}`, label: pair.left, options: item.pairs.map((right, rightIndex) => ({ id: String(rightIndex), text: right.right })) }));
      } else if ("effects" in item) {
        base.steps = item.effects.map((effect, index) => ({ id: `effect:${index}`, label: effect.parameter, options: [
          { id: "increase", text: "Increases" }, { id: "decrease", text: "Decreases" }, { id: "unchanged", text: "Unchanged" }, { id: "depends", text: "Depends" },
        ] }));
      } else if (item.mode === "rapid-swipe") base.options = [{ id: "no", text: "No" }, { id: "yes", text: "Yes" }];
      else if (item.mode === "before-after") base.options = "options" in item
        ? item.options.map((text, index) => ({ id: String(index), text }))
        : [{ id: "before", text: "Before" }, { id: "after", text: "After" }];
      else base.options = item.options.map((option, index) => ({ id: String(index), text: option.label }));
      return base;
    }),
  };
}

const noStoreProcedure = publicProcedure.use(({ ctx, next }) => {
  // Runs before validation or content reads, including errors.
  ctx.res.setHeader("Cache-Control", "private, no-store");
  return next();
});
function canonicalCourse(courseKey: string) {
  const course = getCourseByKey(courseKey);
  // No aliases or implicit fallback, including the separately governed 309A beta.
  if (!course?.isActive || course.courseKey === "electrician-309a") {
    throw new TRPCError({ code: "BAD_REQUEST", message: "Unknown or unavailable interactive course." });
  }
  return course;
}
function unavailable(): never {
  // Never log authored answers, tokens, paths, or malformed artifact details.
  throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Interactive content is unavailable." });
}
// Full access to published games is public by the founder's explicit policy.
// This flag is local to these game endpoints, never to quiz/mock/paid guards.
// The content engine still rejects unregistered, corrupt or unreleased content.
const FULL_PUBLIC_GAME_ACCESS = true;
// Migration 0082 requires separate approval. Code deployment never activates storage.
const savedProgressEnabled = () => process.env.INTERACTIVE_SAVED_PROGRESS_ENABLED === "true";
// An opaque binding, not a credential: every write also requires the same verified server identity.
function identityToken(learnerKey: string): string | null {
  return ENV.cookieSecret ? createHmac("sha256", ENV.cookieSecret).update(`interactive-progress:v1:${learnerKey}`).digest("hex") : null;
}
export const interactiveRouter = router({
  getContent: noStoreProcedure.input(interactiveCatalogInputSchema).mutation(async ({ input }) => {
    const course = canonicalCourse(input.courseKey);
    // Only the frozen legacy <=300 package can reach this compatibility endpoint.
    try { return getInteractiveContentEngine().getLegacyContent(course.courseKey, FULL_PUBLIC_GAME_ACCESS); }
    catch { return unavailable(); }
  }),
  getCatalog: noStoreProcedure.input(interactiveCatalogInputSchema).output(interactiveCatalogResponseSchema).mutation(async ({ input }) => {
    const course = canonicalCourse(input.courseKey);
    try { return getInteractiveContentEngine().getCatalog(course.courseKey, FULL_PUBLIC_GAME_ACCESS); }
    catch { return unavailable(); }
  }),
  startSession: noStoreProcedure.input(interactiveStartSessionInputSchema).output(trackedSessionResponseSchema).mutation(async ({ input, ctx }) => {
    const course = canonicalCourse(input.courseKey);
    // Replay: due items for a signed-in learner go first. Any storage problem falls back to the normal random sample.
    let preferIds: string[] = [];
    const learnerKey = input.focus === "review" ? learnerKeyFrom(ctx) : null;
    if (learnerKey && savedProgressEnabled()) {
      try { preferIds = await dueItemIds(learnerKey, course.courseKey, input.mode, input.sessionSize); } catch { preferIds = []; }
    }
    try {
      const session = getInteractiveContentEngine().startSession(input, FULL_PUBLIC_GAME_ACCESS, preferIds);
      const analyticsCapability = issueGameCapability(session, ctx, input.analyticsVisitorId);
      // Timer is a local choice made after delivery, so timing remains unknown rather than guessed.
      let activityTracking: Awaited<ReturnType<typeof issueAssessmentActivity>> = { tracking: false, recorded: false, source: "observed" };
      if (session.available && session.examples.length) {
        try {
          // Consent precedes attribution reads; public play never requires an entitlement.
          if (assessmentActivityAllowed(ctx)) {
            let attribution = { ...PERSONAL_ATTRIBUTION };
            const identity = resolveVerifiedIdentity(ctx);
            if (identity.type !== "anonymous") {
              try {
                attribution = await resolveAttemptAttribution({
                  userId: identity.type === "oauth" ? identity.userId : null,
                  studentEmail: identity.email,
                }, session.courseKey);
              } catch { /* Attribution failures retain learner-only tracking. */ }
            }
            activityTracking = await issueAssessmentActivity(ctx, gameAssessmentIssue(session), attribution);
          }
        } catch { /* Learning must remain available. */ }
      }
      return { ...session, ...(analyticsCapability ? { analyticsCapability } : {}), activityTracking };
    }
    catch { return unavailable(); }
  }),
  trackActivity: noStoreProcedure.input(gameActivityInputSchema).mutation(({ input, ctx }) => recordGameActivity(input, ctx)),
  /** Saves answers for a signed-in learner. Anonymous play returns stored: false and writes nothing. */
  recordResults: noStoreProcedure.input(interactiveRecordResultsInputSchema).output(interactiveRecordResultsResponseSchema).mutation(async ({ input, ctx }) => {
    const course = canonicalCourse(input.courseKey);
    const learnerKey = learnerKeyFrom(ctx);
    if (!savedProgressEnabled() || !learnerKey || !input.expectedIdentity || input.expectedIdentity !== identityToken(learnerKey)) return { stored: false, saved: 0, ignored: input.results.length };
    // Only items this course can actually serve, under the mode they belong to. Anything else is dropped.
    let known: Map<string, string>;
    try { known = getInteractiveContentEngine().knownItems(course.courseKey); } catch { return unavailable(); }
    const valid = input.results.filter(result => known.get(result.itemId) === result.mode);
    const now = new Date();
    try {
      const { saved } = await saveResults(learnerKey, course.courseKey, valid, acceptLocalDate(input.localDate, now), now);
      return { stored: true, saved, ignored: input.results.length - valid.length };
    } catch {
      // Never lose the game over a storage problem, and never log answers or identity.
      return { stored: false, saved: 0, ignored: input.results.length };
    }
  }),
  getProgress: noStoreProcedure.input(interactiveProgressInputSchema).output(interactiveProgressResponseSchema).mutation(async ({ input, ctx }) => {
    const course = canonicalCourse(input.courseKey);
    const empty = { stored: false, today: { answered: 0, correct: 0, goal: 20 }, streakDays: 0, dueCount: 0, modes: [] };
    const learnerKey = learnerKeyFrom(ctx);
    if (!savedProgressEnabled() || !learnerKey) return empty;
    const binding = identityToken(learnerKey);
    if (!binding) return empty;
    const now = new Date();
    try {
      const summary = await readProgress(learnerKey, course.courseKey, acceptLocalDate(input.localDate, now), now);
      return { stored: true, identityToken: binding, ...summary, modes: summary.modes.filter((m): m is typeof m & { mode: "rapid-swipe" } => ["rapid-swipe", "speed-match", "odd-one-out", "cause-effect", "tap-the-flaw", "before-after"].includes(m.mode)) };
    } catch { return empty; }
  }),
});
