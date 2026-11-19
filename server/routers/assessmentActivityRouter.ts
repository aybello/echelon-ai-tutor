import { z } from "zod";
import { assessmentActivityRecordInputSchema, assessmentActivityResumeInputSchema } from "../../shared/assessmentActivity";
import { recordAssessmentActivity, resumeAssessmentActivity } from "../assessmentActivity";
import { publicProcedure, router } from "../_core/trpc";
import type { TrpcContext } from "../_core/context";
import { practiceIdentity } from "../practiceQuestionReceipt";

// Transport credential only: never persist it or admit it to the shared event body.
const transportIdentity = { accessToken: z.string().min(1).max(8192).optional() };
const NOT_RECORDED = { tracking: false as const, recorded: false as const, source: "observed" as const };
async function activityContext(ctx: TrpcContext, accessToken?: string) {
  // Match delivery/submission exactly: OAuth/OTP cannot be replaced by a token.
  const actor = await practiceIdentity(ctx, accessToken);
  // A supplied invalid/expired token must not fall back to an anonymous capability.
  if (accessToken && !actor.context.user && !actor.context.studentEmail) return null;
  return actor.context;
}

/** Public transport, capability-authorized self-only writes; never an assessment access gate. */
export const assessmentActivityRouter = router({
  record: publicProcedure.input(assessmentActivityRecordInputSchema.extend(transportIdentity)).mutation(async ({ ctx, input }) => {
    const { accessToken, ...body } = input;
    const context = await activityContext(ctx, accessToken);
    return context ? recordAssessmentActivity(context, body) : NOT_RECORDED;
  }),
  resume: publicProcedure.input(assessmentActivityResumeInputSchema.extend(transportIdentity)).mutation(async ({ ctx, input }) => {
    const { accessToken, ...body } = input;
    const context = await activityContext(ctx, accessToken);
    return context ? resumeAssessmentActivity(context, body) : NOT_RECORDED;
  }),
});
