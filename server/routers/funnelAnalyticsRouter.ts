import { z } from "zod";
import { publicProcedure, router } from "../_core/trpc";
import { trackEvent } from "../analytics";
import { ALL_PRODUCTS } from "../../shared/products";

const visitorId = z.string().min(16).max(128);
const marketingPage = z.enum([
  "home",
  "pricing",
  "teams",
  "courses",
  "wpi",
  "us",
  "us-courses",
  "continuing-education",
  "partnerships",
  "careers",
  "course-detail",
  "canada-course-detail",
]);
const marketingContext = z.object({
  source: z.enum(["campaign", "direct", "organic", "referral", "social"]),
  device: z.enum(["desktop", "mobile", "tablet"]),
  province: z.enum(["ontario", "western", "unknown"]),
});

const knownProductKey = z.string().refine(
  key => ALL_PRODUCTS.some(product => product.key === key),
  "Unknown product key",
);

/**
 * Narrow public endpoint for privacy-safe buyer-journey events. Every event
 * name and field is allowlisted so clients cannot write arbitrary event names,
 * PII, raw URLs, referrers, or unbounded metadata into product analytics.
 */
export const funnelAnalyticsRouter = router({
  track: publicProcedure
    .input(z.discriminatedUnion("event", [
      z.object({
        event: z.literal("marketing_page_viewed"),
        page: marketingPage,
        visitorId,
      }).merge(marketingContext),
      z.object({ event: z.literal("pricing_viewed"), visitorId }).merge(marketingContext.partial()),
      z.object({ event: z.literal("buyer_path_selected"), buyerType: z.enum(["individual", "team"]), visitorId }).merge(marketingContext.partial()),
      z.object({ event: z.literal("product_selected"), productKey: knownProductKey, visitorId }).merge(marketingContext.partial()),
      // Browsing a course is not buying one. Course pickers, course cards and
      // "Start Studying" links report here so the purchase funnel is not
      // inflated by people exploring free content.
      z.object({
        event: z.literal("course_browsed"),
        // Browsing surfaces reference quiz routes as well as catalogue keys,
        // so this is bounded rather than restricted to purchasable products.
        courseKey: z.string().min(1).max(64),
        surface: z.enum(["course_picker", "course_card", "study_link"]),
        visitorId,
      }).merge(marketingContext.partial()),
      z.object({
        event: z.literal("quiz_started"),
        examType: z.string().min(1).max(64),
        quizMode: z.enum(["standard", "quick10", "missed", "bookmarked", "low-confidence"]),
        visitorId,
      }),
      z.object({
        event: z.literal("quiz_completed"),
        examType: z.string().min(1).max(64),
        quizMode: z.enum(["standard", "quick10", "missed", "bookmarked", "low-confidence"]),
        questionCount: z.number().int().min(1).max(500),
        correctCount: z.number().int().min(0).max(500),
        completionReason: z.enum(["session_limit", "preview_gate", "pool_exhausted"]),
        visitorId,
      }),
      z.object({
        event: z.literal("ai_tutor_opened"),
        examType: z.string().min(1).max(64),
        visitorId,
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
      const context = "source" in input ? {
        ...(input.source ? { source: input.source } : {}),
        ...(input.device ? { device: input.device } : {}),
        ...(input.province ? { province: input.province } : {}),
      } : {};

      if (input.event === "marketing_page_viewed") {
        await trackEvent(input.event, {
          ...commercialIdentity,
          extra: { page: input.page, ...context },
        });
      } else if (input.event === "pricing_viewed") {
        await trackEvent(input.event, { ...commercialIdentity, extra: context });
      } else if (input.event === "buyer_path_selected") {
        await trackEvent(input.event, { ...commercialIdentity, extra: { buyerType: input.buyerType, ...context } });
      } else if (input.event === "product_selected") {
        await trackEvent(input.event, { ...commercialIdentity, productKey: input.productKey, extra: context });
      } else if (input.event === "course_browsed") {
        await trackEvent(input.event, {
          ...commercialIdentity,
          productKey: input.courseKey,
          extra: { surface: input.surface, ...context },
        });
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
