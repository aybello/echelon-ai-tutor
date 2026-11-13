import { TRPCError } from "@trpc/server";
import { getCourseByKey } from "../../shared/courseRegistry";
import {
  interactiveCatalogInputSchema, interactiveCatalogResponseSchema,
  interactiveStartSessionInputSchema, interactiveSessionResponseSchema,
} from "../../shared/interactiveSessions";
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
  startSession: noStoreProcedure.input(interactiveStartSessionInputSchema).output(interactiveSessionResponseSchema).mutation(async ({ input }) => {
    const course = canonicalCourse(input.courseKey);
    try { return getInteractiveContentEngine().startSession(input, FULL_PUBLIC_GAME_ACCESS); }
    catch { return unavailable(); }
  }),
});
