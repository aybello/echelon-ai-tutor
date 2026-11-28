import { z } from "zod";
import { publicProcedure, adminProcedure, router } from "../_core/trpc";
import { activateHiringPilot, cancelHiringAtPeriodEnd, createHiringCheckout, getHiringStatus } from "../hiring/service";

export const hiringRouter = router({
  activatePilot: adminProcedure.input(z.object({
    orgId: z.number().int().positive(), startsAtMs: z.number().int().positive(), endsAtMs: z.number().int().positive(), quota: z.number().int().positive(), sourcePilotId: z.string().min(3).max(128),
  }).strict()).mutation(({ ctx, input }) => activateHiringPilot(ctx, input)),
  status: publicProcedure.input(z.object({ orgId: z.number().int().positive() }).strict()).query(({ ctx, input }) => getHiringStatus(ctx, input.orgId)),
  createCheckout: publicProcedure.input(z.object({ orgId: z.number().int().positive() }).strict()).mutation(({ ctx, input }) => createHiringCheckout(ctx, input.orgId)),
  cancelAtPeriodEnd: publicProcedure.input(z.object({
    orgId: z.number().int().positive(), expectedBillingOrderId: z.string().min(1).max(128), expectedBillingSubscriptionId: z.string().min(1).max(255),
  }).strict()).mutation(({ ctx, input }) => cancelHiringAtPeriodEnd(ctx, input)),
});
