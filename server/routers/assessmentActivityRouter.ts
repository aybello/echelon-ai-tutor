import { assessmentActivityRecordInputSchema, assessmentActivityResumeInputSchema } from "../../shared/assessmentActivity";
import { recordAssessmentActivity, resumeAssessmentActivity } from "../assessmentActivity";
import { publicProcedure, router } from "../_core/trpc";

/** Public transport, capability-authorized self-only writes; never an assessment access gate. */
export const assessmentActivityRouter = router({
  record: publicProcedure.input(assessmentActivityRecordInputSchema).mutation(({ ctx, input }) => recordAssessmentActivity(ctx, input)),
  resume: publicProcedure.input(assessmentActivityResumeInputSchema).mutation(({ ctx, input }) => resumeAssessmentActivity(ctx, input)),
});
