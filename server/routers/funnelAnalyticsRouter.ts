import { z } from "zod";
import { publicProcedure, router } from "../_core/trpc";
import { trackEvent } from "../analytics";

/**
 * Narrow public endpoint for anonymous pricing-funnel events. The schema is
 * intentionally allowlisted so clients cannot write arbitrary event names,
 * PII, or unbounded metadata into product analytics.
 */
export const funnelAnalyticsRouter = router({
  track: publicProcedure
    .input(z.discriminatedUnion("event", [
      z.object({ event: z.literal("pricing_viewed") }),
      z.object({ event: z.literal("buyer_path_selected"), buyerType: z.enum(["individual", "team"]) }),
      z.object({ event: z.literal("product_selected"), productKey: z.string().min(1).max(64) }),
      z.object({
        event: z.literal("quiz_started"),
        examType: z.string().min(1).max(64),
        quizMode: z.enum(["standard", "quick10", "missed", "bookmarked", "low-confidence"]),
      }),
      z.object({
        event: z.literal("quiz_completed"),
        examType: z.string().min(1).max(64),
        quizMode: z.enum(["standard", "quick10", "missed", "bookmarked", "low-confidence"]),
        questionCount: z.number().int().min(1).max(500),
        correctCount: z.number().int().min(0).max(500),
        completionReason: z.enum(["session_limit", "preview_gate", "pool_exhausted"]),
      }),
      z.object({
        event: z.literal("ai_tutor_opened"),
        examType: z.string().min(1).max(64),
      }),
    ]))
    .mutation(async ({ input, ctx }) => {
      const identity = {
        userId: ctx.user?.id?.toString() ?? null,
        email: ctx.user?.email ?? ctx.studentEmail ?? null,
      };
      if (input.event === "pricing_viewed") {
        await trackEvent(input.event);
      } else if (input.event === "buyer_path_selected") {
        await trackEvent(input.event, { extra: { buyerType: input.buyerType } });
      } else if (input.event === "product_selected") {
        await trackEvent(input.event, { productKey: input.productKey });
      } else if (input.event === "quiz_started") {
        await trackEvent(input.event, {
          ...identity,
          examType: input.examType,
          extra: { quizMode: input.quizMode },
        });
      } else if (input.event === "quiz_completed") {
        await trackEvent(input.event, {
          ...identity,
          examType: input.examType,
          extra: {
            quizMode: input.quizMode,
            questionCount: input.questionCount,
            correctCount: input.correctCount,
            completionReason: input.completionReason,
          },
        });
      } else {
        await trackEvent(input.event, { ...identity, examType: input.examType });
      }
      return { success: true };
    }),
});
