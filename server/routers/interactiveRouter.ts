import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { getCourseByKey } from "../../shared/courseRegistry";
import { resolveAccessForRequest } from "../_core/accessService";
import { publicProcedure, router } from "../_core/trpc";
import { loadInteractivePackage } from "../interactiveContent/loader";
import { interactiveModes } from "../interactiveContent/schema";

export const interactiveRouter = router({
  getContent: publicProcedure
    // Before input parsing so validation and resolver errors are also no-store.
    .use(({ ctx, next }) => {
      ctx.res.setHeader("Cache-Control", "private, no-store");
      return next();
    })
    .input(z.object({ courseKey: z.string().min(1).max(64), accessToken: z.string().min(1).max(8192).optional() }).strict())
    .mutation(async ({ ctx, input }) => {
      // Accept canonical keys only, never aliases, unknown or retired courses.
      // 309A has a separate beta governance path and is explicitly excluded.
      const course = getCourseByKey(input.courseKey);
      if (!course || !course.isActive || course.courseKey === "electrician-309a") {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Unknown or unavailable interactive course." });
      }
      const hasAccess = await resolveAccessForRequest(ctx, course.courseKey, { accessToken: input.accessToken });
      const result = loadInteractivePackage(course.courseKey);
      if (result.status === "absent") return { courseKey: course.courseKey, available: false as const, locked: !hasAccess, version: null, examples: [] };
      if (result.status === "invalid") {
        console.warn("Interactive content is unavailable due to a configuration error.");
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Interactive content is unavailable." });
      }
      const pkg = result.package;
      // A free user cannot choose, filter, page or rotate this fixed set.
      const previewIds = new Set(interactiveModes.map(mode => pkg.previewIds[mode]));
      return {
        courseKey: course.courseKey,
        available: true as const,
        locked: !hasAccess,
        version: pkg.version,
        examples: hasAccess ? pkg.examples : pkg.examples.filter(example => previewIds.has(example.id)),
      };
    }),
});
