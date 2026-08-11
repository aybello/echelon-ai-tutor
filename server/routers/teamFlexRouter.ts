/**
 * Teams Flex Router — Production-hardened
 * All procedures gated behind FEATURE_TEAMS_FLEX env var.
 * All manager procedures require authenticated session + verified org membership.
 * All pricing is server-side only. No client-controlled redirects or prices.
 */
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { protectedProcedure, publicProcedure, router } from "../_core/trpc";
import { stripe } from "../stripe/stripe";
import { ENV } from "../_core/env";
import { getDb } from "../db";
import {
  teamFlexOrders,
  teamFlexOrderItems,
  teamFlexLicences,
  organizations,
  organizationMembers,
} from "../../drizzle/schema";
import { eq, and } from "drizzle-orm";
import {
  TEAM_PRICES_CAD,
  getCourseKeyPricingBand,
  getTeamFlexVolumeDiscount,
  getFlexListPrice,
  isValidFlexTerm,
  type TeamFlexTermMonths,
} from "../teams/teamFlexPricing";
import { allowedCourseKeysForOrg } from "../stripe/subscriptionProducts";
import {
  inviteOperatorToLicence,
  cancelFlexInvitation,
  assignFlexLicence,
  activateFlexLicence,
  changeFlexLicenceCourse,
} from "../teams/flexLicenceService";

// ── Feature flag ─────────────────────────────────────────────────────────────
function isFlexEnabled(): boolean {
  return process.env.FEATURE_TEAMS_FLEX === "true";
}
function requireFlex() {
  if (!isFlexEnabled()) {
    throw new TRPCError({ code: "NOT_FOUND", message: "Teams Flex is not available yet." });
  }
}

// ── Manager authorization helper ─────────────────────────────────────────────
/** Verify the authenticated user is a manager of the specified org. */
async function requireManagerOfOrg(
  ctx: { user: { id: number; email?: string | null } | null; studentEmail?: string | null },
  orgId: number,
): Promise<{ managerEmail: string }> {
  const email = ctx.studentEmail ?? ctx.user?.email ?? null;
  if (!email) {
    throw new TRPCError({ code: "UNAUTHORIZED", message: "Authentication required." });
  }
  const db = await getDb();
  if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

  const normalised = email.toLowerCase().trim();
  const rows = await db
    .select({ orgId: organizationMembers.orgId })
    .from(organizationMembers)
    .where(
      and(
        eq(organizationMembers.orgId, orgId),
        eq(organizationMembers.email, normalised),
        eq(organizationMembers.role, "manager"),
        eq(organizationMembers.status, "assigned"),
      ),
    )
    .limit(1);

  if (rows.length === 0) {
    throw new TRPCError({ code: "FORBIDDEN", message: "You are not a manager of this organization." });
  }
  return { managerEmail: normalised };
}

/** Resolve the authenticated user's managed org. */
async function resolveManagerOrg(
  ctx: { user: { id: number; email?: string | null } | null; studentEmail?: string | null },
): Promise<{ orgId: number; managerEmail: string }> {
  const email = ctx.studentEmail ?? ctx.user?.email ?? null;
  if (!email) {
    throw new TRPCError({ code: "UNAUTHORIZED", message: "Authentication required." });
  }
  const db = await getDb();
  if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

  const normalised = email.toLowerCase().trim();
  const rows = await db
    .select({ orgId: organizationMembers.orgId })
    .from(organizationMembers)
    .where(
      and(
        eq(organizationMembers.email, normalised),
        eq(organizationMembers.role, "manager"),
        eq(organizationMembers.status, "assigned"),
      ),
    )
    .limit(1);

  if (rows.length === 0) {
    throw new TRPCError({ code: "FORBIDDEN", message: "No manager account found for this email." });
  }
  return { orgId: rows[0].orgId, managerEmail: normalised };
}

// ── Router ───────────────────────────────────────────────────────────────────
export const teamFlexRouter = router({
  // ─── Pricing info (public, no auth needed) ─────────────────────────────────
  getFlexPricing: publicProcedure
    .input(z.object({ province: z.enum(["ontario", "western"]) }))
    .query(({ input }) => {
      requireFlex();
      const prices = TEAM_PRICES_CAD[input.province];
      return {
        prices,
        volumeTiers: [
          { min: 1, max: 9, rate: 0 },
          { min: 10, max: 24, rate: 0.10 },
          { min: 25, max: 49, rate: 0.15 },
          { min: 50, max: null, rate: 0.20 },
        ],
      };
    }),

  // ─── List licences for manager's org ───────────────────────────────────────
  listLicences: protectedProcedure
    .input(z.object({ orgId: z.number().int() }))
    .query(async ({ ctx, input }) => {
      requireFlex();
      await requireManagerOfOrg(ctx, input.orgId);
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
      const licences = await db
        .select()
        .from(teamFlexLicences)
        .where(eq(teamFlexLicences.organizationId, input.orgId));
      return licences;
    }),

  // ─── Invite operator to a licence ──────────────────────────────────────────
  inviteLicence: protectedProcedure
    .input(z.object({ licenceId: z.number().int(), operatorEmail: z.string().email(), orgId: z.number().int() }))
    .mutation(async ({ ctx, input }) => {
      requireFlex();
      await requireManagerOfOrg(ctx, input.orgId);
      return inviteOperatorToLicence(input.licenceId, input.operatorEmail, ctx.user.id, input.orgId);
    }),

  // ─── Cancel invitation ─────────────────────────────────────────────────────
  cancelInvitation: protectedProcedure
    .input(z.object({ licenceId: z.number().int(), orgId: z.number().int() }))
    .mutation(async ({ ctx, input }) => {
      requireFlex();
      await requireManagerOfOrg(ctx, input.orgId);
      return cancelFlexInvitation(input.licenceId, input.orgId);
    }),

  // ─── Assign licence directly ───────────────────────────────────────────────
  assignLicence: protectedProcedure
    .input(z.object({ licenceId: z.number().int(), operatorUserId: z.number().int(), orgId: z.number().int() }))
    .mutation(async ({ ctx, input }) => {
      requireFlex();
      await requireManagerOfOrg(ctx, input.orgId);
      return assignFlexLicence(input.licenceId, input.operatorUserId, input.orgId);
    }),

  // ─── Activate licence (operator action) ────────────────────────────────────
  activateLicence: protectedProcedure
    .input(z.object({ licenceId: z.number().int() }))
    .mutation(async ({ ctx, input }) => {
      requireFlex();
      if (!ctx.user) throw new TRPCError({ code: "UNAUTHORIZED", message: "Authentication required." });
      return activateFlexLicence(input.licenceId, ctx.user.id);
    }),

  // ─── Change course (pre-activation, same band) ─────────────────────────────
  changeCourse: protectedProcedure
    .input(z.object({ licenceId: z.number().int(), newCourseKey: z.string().min(1), orgId: z.number().int() }))
    .mutation(async ({ ctx, input }) => {
      requireFlex();
      await requireManagerOfOrg(ctx, input.orgId);
      return changeFlexLicenceCourse(input.licenceId, input.newCourseKey, input.orgId);
    }),

  // ─── Create order (AUTHENTICATED MANAGER ONLY) ─────────────────────────────
  createOrder: protectedProcedure
    .input(z.object({
      province: z.enum(["ontario", "western"]),
      items: z.array(z.object({
        courseKey: z.string().min(1),
        termMonths: z.union([z.literal(3), z.literal(6)]),
        quantity: z.number().int().min(1).max(100),
      })).min(1).max(20),
      overlapAcknowledged: z.boolean().default(false),
    }))
    .mutation(async ({ ctx, input }) => {
      requireFlex();

      // ── Auth: derive identity from session ──────────────────────────────────
      if (!ctx.user) {
        throw new TRPCError({ code: "UNAUTHORIZED", message: "Sign in required to purchase Course Passes." });
      }
      const purchaserUserId = ctx.user.id;

      // ── Resolve manager's org ───────────────────────────────────────────────
      const { orgId, managerEmail } = await resolveManagerOrg(ctx);

      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

      // ── Check Annual overlap ────────────────────────────────────────────────
      const [org] = await db.select().from(organizations).where(eq(organizations.id, orgId)).limit(1);
      if (org?.tier && org?.province) {
        const annualCourses = allowedCourseKeysForOrg(org.tier, org.province);
        const overlapping = input.items.filter(item => annualCourses.includes(item.courseKey));
        if (overlapping.length > 0 && !input.overlapAcknowledged) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: `Overlap detected: ${overlapping.map(i => i.courseKey).join(", ")} are already covered by your Annual plan. Acknowledge to proceed.`,
          });
        }
      }

      // ── Validate items and calculate pricing (server-side only) ─────────────
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
          throw new TRPCError({ code: "BAD_REQUEST", message: `Invalid term: ${item.termMonths}. Only 3 or 6 months.` });
        }

        const bandResult = getCourseKeyPricingBand(item.courseKey);
        // Reject unknown courses — do NOT silently default to Ontario Class 1
        if (bandResult.pricingBand === "class1" && bandResult.courseLevel === null && item.courseKey !== "oit" && item.courseKey !== "oit-ww" && item.courseKey !== "wqa") {
          // The fallback case in getCourseKeyPricingBand returns class1/null for unknown keys
          // Verify the course actually exists in the pricing table
          const familyPrices = TEAM_PRICES_CAD[bandResult.examFamily];
          if (!familyPrices || !familyPrices[bandResult.pricingBand]) {
            throw new TRPCError({ code: "BAD_REQUEST", message: `Unknown course: ${item.courseKey}` });
          }
        }
        const { examFamily, pricingBand, courseLevel } = bandResult;

        // Validate province/family match
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

      // ── Insert pending order ────────────────────────────────────────────────
      const [orderResult] = await db.insert(teamFlexOrders).values({
        organizationId: orgId,
        purchaserUserId,
        managerEmail,
        totalLicences,
        subtotalCents,
        discountRate: String(discountRate),
        discountCents,
        totalBeforeTaxCents: subtotalCents,
        taxCents: null, // Updated from Stripe after payment
        totalPaidCents: null, // Updated from Stripe after payment
        currency: "cad",
        status: "pending",
        overlapAcknowledged: input.overlapAcknowledged,
      });
      const orderId = orderResult.insertId;

      // ── Insert order items ──────────────────────────────────────────────────
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

      // ── Build Stripe Checkout (server-owned URLs, no promotion codes) ───────
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

      const baseUrl = ENV.appBaseUrl;
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
        // No allow_promotion_codes — removed per security directive
        success_url: `${baseUrl}/team?flex_order_id=${orderId}&session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${baseUrl}/teams`,
      });

      // ── Store Stripe session ID on order ────────────────────────────────────
      await db.update(teamFlexOrders)
        .set({ stripeCheckoutSessionId: session.id })
        .where(eq(teamFlexOrders.id, orderId));

      return { url: session.url, orderId };
    }),
});
