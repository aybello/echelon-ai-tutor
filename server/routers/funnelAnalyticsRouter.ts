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
      z.object({ event: z.literal("pricing_viewed"), visitorId: z.string().min(16).max(128) }),
      z.object({ event: z.literal("buyer_path_selected"), buyerType: z.enum(["individual", "team"]), visitorId: z.string().min(16).max(128) }),
      z.object({ event: z.literal("product_selected"), productKey: z.string().min(1).max(64), visitorId: z.string().min(16).max(128) }),
      z.object({
        event: z.literal("quiz_started"),
        examType: z.string().min(1).max(64),
        quizMode: z.enum(["standard", "quick10", "missed", "bookmarked", "low-confidence"]),
        visitorId: z.string().min(16).max(128),
      }),
      z.object({
        event: z.literal("quiz_completed"),
        examType: z.string().min(1).max(64),
        quizMode: z.enum(["standard", "quick10", "missed", "bookmarked", "low-confidence"]),
        questionCount: z.number().int().min(1).max(500),
        correctCount: z.number().int().min(0).max(500),
        completionReason: z.enum(["session_limit", "preview_gate", "pool_exhausted"]),
        visitorId: z.string().min(16).max(128),
      }),
      z.object({
        event: z.literal("ai_tutor_opened"),
        examType: z.string().min(1).max(64),
        visitorId: z.string().min(16).max(128),
      }),
    ]))
    .mutation(async ({ input, ctx }) => {
      const identity = {
        userId: ctx.user?.id?.toString() ?? null,
        email: ctx.user?.email ?? ctx.studentEmail ?? null,
        anonymousId: input.visitorId,
      };
      // Pricing-to-checkout must remain one journey even before a visitor gives
      // us an email. Use the browser pseudonym throughout that commercial path.
      const commercialIdentity = { anonymousId: input.visitorId };
      if (input.event === "pricing_viewed") {
        await trackEvent(input.event, commercialIdentity);
      } else if (input.event === "buyer_path_selected") {
        await trackEvent(input.event, { ...commercialIdentity, extra: { buyerType: input.buyerType } });
      } else if (input.event === "product_selected") {
        await trackEvent(input.event, { ...commercialIdentity, productKey: input.productKey });
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
