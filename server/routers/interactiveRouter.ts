import { TRPCError } from "@trpc/server";
import { getCourseByKey } from "../../shared/courseRegistry";
import {
  interactiveCatalogInputSchema, interactiveCatalogResponseSchema,
  interactiveStartSessionInputSchema, interactiveSessionResponseSchema,
  interactiveProgressInputSchema, interactiveProgressResponseSchema,
  interactiveRecordResultsInputSchema, interactiveRecordResultsResponseSchema,
} from "../../shared/interactiveSessions";
import { acceptLocalDate, dueItemIds, learnerKeyFrom, readProgress, saveResults } from "../interactiveProgress";
import { publicProcedure, router } from "../_core/trpc";
import { getInteractiveContentEngine } from "../interactiveContent/engine/loader";

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
  startSession: noStoreProcedure.input(interactiveStartSessionInputSchema).output(interactiveSessionResponseSchema).mutation(async ({ input, ctx }) => {
    const course = canonicalCourse(input.courseKey);
    // Replay: due items for a signed-in learner go first. Any storage problem falls back to the normal random sample.
    let preferIds: string[] = [];
    const learnerKey = input.focus === "review" ? learnerKeyFrom(ctx) : null;
    if (learnerKey) {
      try { preferIds = await dueItemIds(learnerKey, course.courseKey, input.mode, input.sessionSize); } catch { preferIds = []; }
    }
    try { return getInteractiveContentEngine().startSession(input, FULL_PUBLIC_GAME_ACCESS, preferIds); }
    catch { return unavailable(); }
  }),
  /** Saves answers for a signed-in learner. Anonymous play returns stored: false and writes nothing. */
  recordResults: noStoreProcedure.input(interactiveRecordResultsInputSchema).output(interactiveRecordResultsResponseSchema).mutation(async ({ input, ctx }) => {
    const course = canonicalCourse(input.courseKey);
    const learnerKey = learnerKeyFrom(ctx);
    if (!learnerKey) return { stored: false, saved: 0, ignored: input.results.length };
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
    if (!learnerKey) return empty;
    const now = new Date();
    try {
      const summary = await readProgress(learnerKey, course.courseKey, acceptLocalDate(input.localDate, now), now);
      return { stored: true, ...summary, modes: summary.modes.filter((m): m is typeof m & { mode: "rapid-swipe" } => ["rapid-swipe", "speed-match", "odd-one-out", "cause-effect", "tap-the-flaw", "before-after"].includes(m.mode)) };
    } catch { return empty; }
  }),
});
