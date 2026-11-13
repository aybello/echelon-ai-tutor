import { TRPCError } from "@trpc/server";
import { getCourseByKey } from "../../shared/courseRegistry";
import {
  interactiveCatalogInputSchema, interactiveCatalogResponseSchema,
  interactiveStartSessionInputSchema, interactiveSessionResponseSchema,
} from "../../shared/interactiveSessions";
import { resolveAccessForRequest } from "../_core/accessService";
import { publicProcedure, router } from "../_core/trpc";
import { getInteractiveContentEngine } from "../interactiveContent/engine/loader";

const privateProcedure = publicProcedure.use(({ ctx, next }) => {
  // Runs before parsing, authorization, or content reads, including errors.
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
export const interactiveRouter = router({
  getContent: privateProcedure.input(interactiveCatalogInputSchema).mutation(async ({ ctx, input }) => {
    const course = canonicalCourse(input.courseKey);
    const hasAccess = await resolveAccessForRequest(ctx, course.courseKey, {
      accessToken: input.accessToken, privilegedInteractiveAccess: true,
    });
    // Only the frozen legacy <=300 package can reach this compatibility endpoint.
    try { return getInteractiveContentEngine().getLegacyContent(course.courseKey, hasAccess); }
    catch { return unavailable(); }
  }),
  getCatalog: privateProcedure.input(interactiveCatalogInputSchema).output(interactiveCatalogResponseSchema).mutation(async ({ ctx, input }) => {
    const course = canonicalCourse(input.courseKey);
    const hasAccess = await resolveAccessForRequest(ctx, course.courseKey, {
      accessToken: input.accessToken, privilegedInteractiveAccess: true,
    });
    try { return getInteractiveContentEngine().getCatalog(course.courseKey, hasAccess); }
    catch { return unavailable(); }
  }),
  startSession: privateProcedure.input(interactiveStartSessionInputSchema).output(interactiveSessionResponseSchema).mutation(async ({ ctx, input }) => {
    const course = canonicalCourse(input.courseKey);
    const hasAccess = await resolveAccessForRequest(ctx, course.courseKey, {
      accessToken: input.accessToken, privilegedInteractiveAccess: true,
    });
    try { return getInteractiveContentEngine().startSession(input, hasAccess); }
    catch { return unavailable(); }
  }),
});
