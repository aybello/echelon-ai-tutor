import { TRPCError } from "@trpc/server";
import { z } from "zod";
import {
  deepCatalogInputSchema, deepCatalogResponseSchema, deepSessionResponseSchema, deepStartInputSchema,
} from "../../shared/deepGames";
import { assessmentActivityAllowed, issueAssessmentActivity } from "../assessmentActivity";
import { resolveVerifiedIdentity } from "../_core/accessService";
import { publicProcedure, router } from "../_core/trpc";
import { practiceIdentity } from "../practiceQuestionReceipt";
import { PERSONAL_ATTRIBUTION, resolveAttemptAttribution } from "../teams/attemptAttribution";
import { DeepGameVersionError, getDeepCatalog, startDeepSession } from "../deepGames/service";
import { validateDeepSessionResponse } from "../deepGames/schema";
import { deepAssessmentIssue } from "../deepGames/tracking";

// Transport credential only. Never enters the shared request/service, snapshots or storage.
const transportIdentity = { accessToken: z.string().min(1).max(8192).optional() };
const NOT_RECORDED = { tracking: false as const, recorded: false as const, source: "observed" as const };
const noStoreProcedure = publicProcedure.use(({ ctx, next }) => {
  // This middleware precedes input validation, including failures.
  ctx.res.setHeader("Cache-Control", "private, no-store");
  return next();
});
function unavailable(): never {
  throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Deep game content is unavailable." });
}

/** All published games are public. No paid/quiz/mock entitlement guard belongs here. */
export const deepGamesRouter = router({
  getCatalog: noStoreProcedure.input(deepCatalogInputSchema.extend(transportIdentity))
    .output(deepCatalogResponseSchema).mutation(({ input }) => getDeepCatalog(input.courseKey)),
  startSession: noStoreProcedure.input(deepStartInputSchema.extend(transportIdentity))
    .output(deepSessionResponseSchema).mutation(async ({ input, ctx }) => {
      const { accessToken, ...body } = input;
      let session;
      try { session = await startDeepSession(body); }
      catch (error) {
        if (error instanceof DeepGameVersionError) throw new TRPCError({ code: "CONFLICT", message: error.message });
        return unavailable();
      }
      let activityTracking: Awaited<ReturnType<typeof issueAssessmentActivity>> = NOT_RECORDED;
      try {
        // Consent precedes identity-token verification AND attribution reads.
        if (assessmentActivityAllowed(ctx)) {
          // Same delivery/record actor resolution as assessmentActivityRouter. A supplied
          // invalid token must not create an anonymous fallback; OAuth/OTP wins over tokens.
          const actor = await practiceIdentity(ctx, accessToken);
          const trackingContext = accessToken && !actor.context.user && !actor.context.studentEmail ? null : actor.context;
          if (trackingContext) {
            let attribution = { ...PERSONAL_ATTRIBUTION };
            const identity = resolveVerifiedIdentity(trackingContext);
            if (identity.type !== "anonymous") {
              try {
                attribution = await resolveAttemptAttribution({
                  userId: identity.type === "oauth" ? identity.userId : null,
                  studentEmail: identity.email,
                }, session.courseKey);
              } catch { /* Attribution failure retains learner-only tracking. */ }
            }
            activityTracking = await issueAssessmentActivity(trackingContext, deepAssessmentIssue(session), attribution);
          }
        }
      } catch { /* Tracking must never stop public play. */ }
      try { return validateDeepSessionResponse({ ...session, activityTracking }); }
      catch { return unavailable(); }
    }),
});
