/**
 * Teams Flex Router — Production-hardened
 * All manager procedures require authenticated session + verified org membership.
 * All pricing is server-side only. No client-controlled redirects or prices.
 */
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { publicProcedure, router } from "../_core/trpc";
import { stripe } from "../stripe/stripe";
import { ENV } from "../_core/env";
import { getDb } from "../db";
import {
  teamFlexOrders,
  teamFlexOrderItems,
  teamFlexLicences,
  organizations,
  organizationMembers,
  questionAttempts,
} from "../../drizzle/schema";
import { eq, and, sql, gte } from "drizzle-orm";
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
  resendFlexInvitation,
  cancelFlexInvitation,
  claimFlexLicence,
  assignFlexLicence,
  activateFlexLicence,
  changeFlexLicenceCourse,
  getFlexInvitation,
  listOperatorFlexLicences,
} from "../teams/flexLicenceService";
import { computeReadiness } from "../_core/readiness";
import { resolveCourseKey } from "../../shared/courseRegistry";
import {
  bulkInviteFlexOperators,
  MAX_BULK_ONBOARDING_ROWS,
  previewFlexBulkOnboarding,
} from "../teams/flexBulkOnboardingService";

const flexBulkRowsSchema = z.array(z.object({
  clientRowId: z.string().min(1).max(64),
  operatorEmail: z.string().min(1).max(320),
  courseKey: z.string().min(1).max(64),
})).min(1).max(MAX_BULK_ONBOARDING_ROWS);

// ── Manager authorization helper ─────────────────────────────────────────────
/** Verify the authenticated user is a manager of the specified org. */
async function requireManagerOfOrg(
  ctx: { user: { id: number; email?: string | null } | null; studentEmail?: string | null },
  orgId: number,
): Promise<{ managerEmail: string }> {
  const email = ctx.user?.email ?? ctx.studentEmail ?? null;
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
  const email = ctx.user?.email ?? ctx.studentEmail ?? null;
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

function requireVerifiedOperator(
  ctx: { user: { id: number; email?: string | null } | null; studentEmail?: string | null },
): { email: string; userId: number | null } {
  const email = (ctx.user?.email ?? ctx.studentEmail ?? "").toLowerCase().trim();
  if (!email) {
    throw new TRPCError({ code: "UNAUTHORIZED", message: "Verify your email to continue." });
  }
  return { email, userId: ctx.user?.id ?? null };
}

// ── Router ───────────────────────────────────────────────────────────────────
export const teamFlexRouter = router({
  // ─── Pricing info (public, no auth needed) ─────────────────────────────────
  getFlexPricing: publicProcedure
    .input(z.object({ province: z.enum(["ontario", "western"]) }))
    .query(({ input }) => {
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
  listLicences: publicProcedure
    .input(z.object({ orgId: z.number().int() }))
    .query(async ({ ctx, input }) => {
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
  inviteLicence: publicProcedure
    .input(z.object({ licenceId: z.number().int(), operatorEmail: z.string().email(), orgId: z.number().int() }))
    .mutation(async ({ ctx, input }) => {
      await requireManagerOfOrg(ctx, input.orgId);
      return inviteOperatorToLicence(input.licenceId, input.operatorEmail, input.orgId);
    }),

  resendInvitation: publicProcedure
    .input(z.object({ licenceId: z.number().int(), orgId: z.number().int() }))
    .mutation(async ({ ctx, input }) => {
      await requireManagerOfOrg(ctx, input.orgId);
      return resendFlexInvitation(input.licenceId, input.orgId);
    }),

  previewBulkOnboarding: publicProcedure
    .input(z.object({ orgId: z.number().int(), rows: flexBulkRowsSchema }))
    .mutation(async ({ ctx, input }) => {
      await requireManagerOfOrg(ctx, input.orgId);
      return previewFlexBulkOnboarding(input.orgId, input.rows);
    }),

  bulkInviteLicences: publicProcedure
    .input(z.object({ orgId: z.number().int(), rows: flexBulkRowsSchema }))
    .mutation(async ({ ctx, input }) => {
      await requireManagerOfOrg(ctx, input.orgId);
      return bulkInviteFlexOperators(input.orgId, input.rows);
    }),

  // ─── Cancel invitation ─────────────────────────────────────────────────────
  cancelInvitation: publicProcedure
    .input(z.object({ licenceId: z.number().int(), orgId: z.number().int() }))
    .mutation(async ({ ctx, input }) => {
      await requireManagerOfOrg(ctx, input.orgId);
      return cancelFlexInvitation(input.licenceId, input.orgId);
    }),

  // ─── Assign licence directly ───────────────────────────────────────────────
  assignLicence: publicProcedure
    .input(z.object({ licenceId: z.number().int(), operatorUserId: z.number().int(), orgId: z.number().int() }))
    .mutation(async ({ ctx, input }) => {
      await requireManagerOfOrg(ctx, input.orgId);
      return assignFlexLicence(input.licenceId, input.operatorUserId, input.orgId);
    }),

  // ─── Activate licence (operator action) ────────────────────────────────────
  activateLicence: publicProcedure
    .input(z.object({ licenceId: z.number().int() }))
    .mutation(async ({ ctx, input }) => {
      const identity = requireVerifiedOperator(ctx);
      return activateFlexLicence(input.licenceId, identity.email, identity.userId);
    }),

  // ─── Inspect an invitation before sign-in ──────────────────────────────────
  getInvitation: publicProcedure
    .input(z.object({ token: z.string().length(64).regex(/^[a-f0-9]+$/i) }))
    .query(async ({ input }) => {
      return getFlexInvitation(input.token);
    }),

  // ─── Claim invitation using a verified email session ───────────────────────
  claimInvitation: publicProcedure
    .input(z.object({ token: z.string().length(64).regex(/^[a-f0-9]+$/i) }))
    .mutation(async ({ ctx, input }) => {
      const identity = requireVerifiedOperator(ctx);
      return claimFlexLicence(input.token, identity.email, identity.userId);
    }),

  // ─── Operator Course Pass inventory ────────────────────────────────────────
  myLicences: publicProcedure.query(async ({ ctx }) => {
    const identity = requireVerifiedOperator(ctx);
    return listOperatorFlexLicences(identity.email, identity.userId);
  }),

  // ─── Change course (pre-activation, same band) ─────────────────────────────
  changeCourse: publicProcedure
    .input(z.object({ licenceId: z.number().int(), newCourseKey: z.string().min(1), orgId: z.number().int() }))
    .mutation(async ({ ctx, input }) => {
      await requireManagerOfOrg(ctx, input.orgId);
      return changeFlexLicenceCourse(input.licenceId, input.newCourseKey, input.orgId);
    }),

  // ─── Create order (AUTHENTICATED MANAGER ONLY) ─────────────────────────────
  createOrder: publicProcedure
    .input(z.object({
      managerEmail: z.string().email().optional(),
      billingEmail: z.string().email().optional(),
      province: z.enum(["ontario", "western"]),
      items: z.array(z.object({
        courseKey: z.string().min(1),
        termMonths: z.union([z.literal(3), z.literal(6), z.literal(12)]),
        quantity: z.number().int().min(1).max(100),
      })).min(1).max(20),
      overlapAcknowledged: z.boolean().default(false),
    }))
    .mutation(async ({ ctx, input }) => {

      // ── Checkout rule: all items must use the same duration ──────────────
      const termSet = new Set(input.items.map(i => i.termMonths));
      if (termSet.size > 1) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "All Course Pass licences in one order must use the same duration.",
        });
      }

      // ── Auth: accept OAuth, email-code session, OR input.managerEmail ──
      let purchaserUserId: number | null = null;
      let managerEmail: string;
      let orgId: number = 0;
      const ctxEmail = (ctx.user?.email ?? ctx.studentEmail ?? "").toLowerCase().trim();
      if (ctxEmail) {
        purchaserUserId = ctx.user?.id ?? null;
        managerEmail = ctxEmail;
        try {
          const mgr = await resolveManagerOrg(ctx);
          orgId = mgr.orgId ?? 0;
        } catch { /* new manager, no org yet */ }
      } else if (input.managerEmail) {
        managerEmail = input.managerEmail.toLowerCase().trim();
      } else {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Please provide your email address." });
      }

      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

      const normalizedItems = input.items.map((item) => {
        const course = resolveCourseKey(item.courseKey);
        if (!course?.isActive || !course.teamAssignable) {
          throw new TRPCError({ code: "BAD_REQUEST", message: `Unknown or unavailable course: ${item.courseKey}` });
        }
        return { ...item, courseKey: course.courseKey };
      });

      // ── Check Annual overlap ────────────────────────────────────────────────
      const [org] = orgId ? await db.select().from(organizations).where(eq(organizations.id, orgId)).limit(1) : [];
      if (org?.tier && org?.province) {
        const annualCourses = allowedCourseKeysForOrg(org.tier, org.province);
        const overlapping = normalizedItems.filter(item => annualCourses.includes(item.courseKey));
        if (overlapping.length > 0 && !input.overlapAcknowledged) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: `Overlap detected: ${overlapping.map(i => i.courseKey).join(", ")} are already covered by your Annual plan. Acknowledge to proceed.`,
          });
        }
      }

      // ── Validate items and calculate pricing (server-side only) ─────────────
      const totalLicences = normalizedItems.reduce((sum, item) => sum + item.quantity, 0);
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

      for (const item of normalizedItems) {
        if (!isValidFlexTerm(item.termMonths)) {
          throw new TRPCError({ code: "BAD_REQUEST", message: `Invalid term: ${item.termMonths}. Must be 3, 6, or 12 months.` });
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
        organizationId: orgId ?? 0,
        purchaserUserId: purchaserUserId ?? 0,
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
        customer_email: input.billingEmail || managerEmail,
        metadata: {
          type: "team_flex",
          teamFlexOrderId: String(orderId),
        },
        phone_number_collection: { enabled: true },
        automatic_tax: { enabled: true },
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

  // ─── Flex operator progress (manager view) ────────────────────────────────
  getFlexProgress: publicProcedure
    .input(z.object({ orgId: z.number().int() }))
    .query(async ({ ctx, input }) => {
      await requireManagerOfOrg(ctx, input.orgId);
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

      // Get all active/assigned licences for this org
      const licences = await db
        .select()
        .from(teamFlexLicences)
        .where(and(
          eq(teamFlexLicences.organizationId, input.orgId),
          sql`${teamFlexLicences.status} IN ('active', 'assigned', 'invited')`,
        ));

      if (licences.length === 0) return [];

      // For each licence with an operatorUserId, fetch their study progress
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const fourteenDaysAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);

      const results = await Promise.all(
        licences.map(async (lic) => {
          const canonicalCourse = resolveCourseKey(lic.courseKey);
          const progressExamType = canonicalCourse?.questionBankKey ?? lic.courseKey;
          const displayCourseKey = canonicalCourse?.courseKey ?? lic.courseKey;
          if (!lic.operatorUserId || lic.status === "invited") {
            return {
              licenceId: lic.id,
              courseKey: displayCourseKey,
              termMonths: lic.termMonths,
              status: lic.status,
              operatorEmail: lic.invitedEmail,
              activatedAt: lic.activatedAt,
              accessEndsAt: lic.accessEndsAt,
              totalAttempts: 0,
              correctAttempts: 0,
              accuracy: 0,
              readinessScore: 0,
              lastActiveAt: null,
              daysActive30: 0,
            };
          }

          // Fetch attempts for this operator on this course
          const [stats] = await db
            .select({
              total: sql<number>`COUNT(*)`,
              correct: sql<number>`SUM(CASE WHEN ${questionAttempts.correct} = 'yes' THEN 1 ELSE 0 END)`,
              distinctTopics: sql<number>`COUNT(DISTINCT ${questionAttempts.topic})`,
              lastActive: sql<string>`MAX(${questionAttempts.createdAt})`,
            })
            .from(questionAttempts)
            .where(and(
              eq(questionAttempts.userId, lic.operatorUserId),
              eq(questionAttempts.examType, progressExamType),
            ));

          const [recentStats] = await db
            .select({
              daysActive: sql<number>`COUNT(DISTINCT DATE(${questionAttempts.createdAt}))`,
            })
            .from(questionAttempts)
            .where(and(
              eq(questionAttempts.userId, lic.operatorUserId),
              eq(questionAttempts.examType, progressExamType),
              gte(questionAttempts.createdAt, thirtyDaysAgo),
            ));

          const [recentActivity] = await db
            .select({
              hasRecent: sql<number>`COUNT(*)`,
            })
            .from(questionAttempts)
            .where(and(
              eq(questionAttempts.userId, lic.operatorUserId),
              eq(questionAttempts.examType, progressExamType),
              gte(questionAttempts.createdAt, fourteenDaysAgo),
            ));

          const total = Number(stats?.total ?? 0);
          const correct = Number(stats?.correct ?? 0);
          const accuracy = total > 0 ? correct / total : 0;
          const daysActive30 = Number(recentStats?.daysActive ?? 0);
          const activeRecently = Number(recentActivity?.hasRecent ?? 0) > 0;

          const readinessResult = computeReadiness({
            accuracy,
            totalAttempts: total,
            mockAccuracy: 0, // Would need mock exam data — simplified for now
            topicsAttempted: Number(stats?.distinctTopics ?? 0),
            totalTopics: 15, // Approximate topics per course
            activeDaysLast30: daysActive30,
            activeRecently,
          });

          return {
            licenceId: lic.id,
            courseKey: displayCourseKey,
            termMonths: lic.termMonths,
            status: lic.status,
            operatorEmail: lic.invitedEmail,
            activatedAt: lic.activatedAt,
            accessEndsAt: lic.accessEndsAt,
            totalAttempts: total,
            correctAttempts: correct,
            accuracy: Math.round(accuracy * 100),
            readinessScore: readinessResult.score,
            lastActiveAt: stats?.lastActive ?? null,
            daysActive30,
          };
        }),
      );

      return results;
    }),

});
