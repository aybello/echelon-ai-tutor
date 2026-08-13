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
    ]))
    .mutation(async ({ input }) => {
      if (input.event === "pricing_viewed") {
        await trackEvent(input.event);
      } else if (input.event === "buyer_path_selected") {
        await trackEvent(input.event, { extra: { buyerType: input.buyerType } });
      } else {
        await trackEvent(input.event, { productKey: input.productKey });
      }
      return { success: true };
    }),
});
