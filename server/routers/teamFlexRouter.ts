/**
 * Teams Flex Router
 * All procedures gated behind FEATURE_TEAMS_FLEX env var.
 */
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { protectedProcedure, router } from "../_core/trpc";
import { stripe } from "../stripe/stripe";
import { getDb } from "../db";
import { teamFlexOrders, teamFlexOrderItems, organizations } from "../../drizzle/schema";
import { eq } from "drizzle-orm";
import {
  TEAM_PRICES_CAD,
  getCourseKeyPricingBand,
  getTeamFlexVolumeDiscount,
  getFlexListPrice,
  isValidFlexTerm,
  type TeamFlexTermMonths,
} from "../teams/teamFlexPricing";
import { allowedCourseKeysForOrg } from "../stripe/subscriptionProducts";

function isFlexEnabled(): boolean {
  return process.env.FEATURE_TEAMS_FLEX === "true";
}

function requireFlex() {
  if (!isFlexEnabled()) {
    throw new TRPCError({ code: "NOT_FOUND", message: "Teams Flex is not available yet." });
  }
}

export const teamFlexRouter = router({
  createOrder: protectedProcedure
    .input(z.object({
      organizationId: z.number().int().optional(),
      orgName: z.string().min(2).max(200),
      province: z.enum(["ontario", "western"]),
      items: z.array(z.object({
        courseKey: z.string().min(1),
        termMonths: z.union([z.literal(3), z.literal(6)]),
        quantity: z.number().int().min(1).max(100),
      })).min(1).max(20),
      overlapAcknowledged: z.boolean().default(false),
      origin: z.string().url(),
    }))
    .mutation(async ({ ctx, input }) => {
      requireFlex();

      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
      const purchaserUserId = ctx.user.id;
      const managerEmail = ctx.user.email ?? "";

      if (!managerEmail) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Your account must have an email address to purchase a team plan." });
      }

      // Resolve or create organization
      let orgId: number;
      if (input.organizationId) {
        const [org] = await db.select().from(organizations).where(eq(organizations.id, input.organizationId)).limit(1);
        if (!org) throw new TRPCError({ code: "NOT_FOUND", message: "Organization not found." });
        if (org.managerEmail !== managerEmail) {
          throw new TRPCError({ code: "FORBIDDEN", message: "You are not the manager of this organization." });
        }
        orgId = org.id;

        // Check for overlap with Annual entitlement
        if (org.tier && org.province) {
          const annualCourses = allowedCourseKeysForOrg(org.tier, org.province);
          const overlapping = input.items.filter(item => annualCourses.includes(item.courseKey));
          if (overlapping.length > 0 && !input.overlapAcknowledged) {
            throw new TRPCError({
              code: "BAD_REQUEST",
              message: `Overlap detected: ${overlapping.map(i => i.courseKey).join(", ")} are already covered by your Annual plan. Set overlapAcknowledged to proceed.`,
            });
          }
        }
      } else {
        const result = await db.insert(organizations).values({
          name: input.orgName,
          province: input.province,
          tier: "all-access",
          seatsTotal: 0,
          managerEmail,
          termEnd: new Date(),
          billingType: "stripe",
          status: "active",
        });
        orgId = result[0].insertId;
      }

      // Validate items and calculate pricing
      const totalLicences = input.items.reduce((sum, item) => sum + item.quantity, 0);
      const discountRate = getTeamFlexVolumeDiscount(totalLicences);

      const orderItems: Array<{
        courseKey: string;
        examFamily: string;
        pricingBand: string;
        courseLevel: number | null;
        termMonths: TeamFlexTermMonths;
        quantity: number;
        listUnitPriceCents: number;
        discountedUnitPriceCents: number;
        lineTotalCents: number;
      }> = [];

      for (const item of input.items) {
        if (!isValidFlexTerm(item.termMonths)) {
          throw new TRPCError({ code: "BAD_REQUEST", message: `Invalid term: ${item.termMonths}. Only 3 or 6 months available.` });
        }

        const { examFamily, pricingBand, courseLevel } = getCourseKeyPricingBand(item.courseKey);

        if (input.province === "ontario" && examFamily !== "ontario") {
          throw new TRPCError({ code: "BAD_REQUEST", message: `Course ${item.courseKey} is not available in Ontario.` });
        }
        if (input.province === "western" && examFamily !== "western") {
          throw new TRPCError({ code: "BAD_REQUEST", message: `Course ${item.courseKey} is not available in Western Canada.` });
        }

        const listUnitPriceCents = getFlexListPrice(examFamily, pricingBand, item.termMonths);
        const discountedUnitPriceCents = Math.round(listUnitPriceCents * (1 - discountRate));
        const lineTotalCents = discountedUnitPriceCents * item.quantity;

        orderItems.push({
          courseKey: item.courseKey,
          examFamily,
          pricingBand,
          courseLevel,
          termMonths: item.termMonths,
          quantity: item.quantity,
          listUnitPriceCents,
          discountedUnitPriceCents,
          lineTotalCents,
        });
      }

      const subtotalCents = orderItems.reduce((sum, item) => sum + item.lineTotalCents, 0);
      const discountCents = orderItems.reduce((sum, item) => {
        return sum + (item.listUnitPriceCents * item.quantity - item.lineTotalCents);
      }, 0);

      // Insert pending order
      const [orderResult] = await db.insert(teamFlexOrders).values({
        organizationId: orgId,
        purchaserUserId,
        managerEmail,
        totalLicences,
        subtotalCents,
        discountRate: String(discountRate),
        discountCents,
        totalBeforeTaxCents: subtotalCents,
        taxCents: 0,
        totalPaidCents: subtotalCents,
        currency: "cad",
        status: "pending",
        overlapAcknowledged: input.overlapAcknowledged,
      });
      const orderId = orderResult.insertId;

      // Insert order items
      for (const item of orderItems) {
        await db.insert(teamFlexOrderItems).values({
          orderId,
          courseKey: item.courseKey,
          examFamily: item.examFamily,
          pricingBand: item.pricingBand,
          courseLevel: item.courseLevel,
          termMonths: item.termMonths,
          quantity: item.quantity,
          listUnitPriceCents: item.listUnitPriceCents,
          discountRate: String(discountRate),
          discountedUnitPriceCents: item.discountedUnitPriceCents,
          lineTotalCents: item.lineTotalCents,
        });
      }

      // Build Stripe line items
      const stripeLineItems = orderItems.map(item => ({
        price_data: {
          currency: "cad",
          unit_amount: item.discountedUnitPriceCents,
          product_data: {
            name: `Echelon Flex: ${item.courseKey} (${item.termMonths}-month)`,
            description: `${item.termMonths}-month licence${discountRate > 0 ? ` (${Math.round(discountRate * 100)}% volume discount)` : ""}`,
          },
        },
        quantity: item.quantity,
      }));

      // Create Stripe Checkout session (payment mode, not subscription)
      const session = await stripe.checkout.sessions.create({
        payment_method_types: ["card"],
        mode: "payment",
        line_items: stripeLineItems as any,
        customer_email: managerEmail,
        metadata: {
          type: "team_flex",
          teamFlexOrderId: String(orderId),
        },
        phone_number_collection: { enabled: true },
        allow_promotion_codes: true,
        success_url: `${input.origin}/team?flex_order_id=${orderId}&session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${input.origin}/teams`,
      });

      // Update order with Stripe session ID
      await db.update(teamFlexOrders)
        .set({ stripeCheckoutSessionId: session.id })
        .where(eq(teamFlexOrders.id, orderId));

      return { url: session.url, orderId };
    }),
});
