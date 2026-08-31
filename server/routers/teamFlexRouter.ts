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
  questionAttempts,
} from "../../drizzle/schema";
import { eq, and, sql } from "drizzle-orm";
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
import { resolveCourseKey } from "../../shared/courseRegistry";
import { calculateReadinessSnapshot } from "../readinessSnapshot";
import {
  bulkInviteFlexOperators,
  MAX_BULK_ONBOARDING_ROWS,
  previewFlexBulkOnboarding,
} from "../teams/flexBulkOnboardingService";
import { buildProvisionalCoursePassOrganization } from "../teams/flexCheckoutOrganization";
import { buildTeamFlexBillingDocumentOptions } from "../stripe/teamBillingDocuments";
import { resolveOrgManager } from "./orgRouter";

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
  const manager = await resolveOrgManager(ctx);
  if (manager.orgId !== orgId) {
    throw new TRPCError({ code: "FORBIDDEN", message: "You are not a manager of this organization." });
  }
  return { managerEmail: manager.managerEmail };
}

/** Resolve the authenticated user's managed org. */
async function resolveManagerOrg(
  ctx: { user: { id: number; email?: string | null } | null; studentEmail?: string | null },
): Promise<{ orgId: number; managerEmail: string }> {
  return resolveOrgManager(ctx);
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

  // ─── Create order (existing manager or guest purchaser) ───────────────────
  createOrder: publicProcedure
    .input(z.object({
      organizationName: z.string().trim().min(2).max(200),
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
      let orgId: number | null = null;
      const ctxEmail = (ctx.user?.email ?? ctx.studentEmail ?? "").toLowerCase().trim();
      if (ctxEmail) {
        purchaserUserId = ctx.user?.id ?? null;
        managerEmail = ctxEmail;
        try {
          const mgr = await resolveManagerOrg(ctx);
          orgId = mgr.orgId;
        } catch { /* new manager, no org yet */ }
      } else if (input.managerEmail) {
        managerEmail = input.managerEmail.toLowerCase().trim();
      } else {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Please provide your email address." });
      }
      const billingEmail = (input.billingEmail ?? managerEmail).toLowerCase().trim();

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

      // ── Create/reuse a real organization and insert the pending order ───────
      // Guest checkout used to write organizationId=0 and purchaserUserId=0.
      // That can violate foreign keys immediately and would attach paid licences
      // to a non-existent organization. A provisional organization is safe: it
      // has no manager membership or course access until Stripe confirms payment.
      let orderId: number;
      try {
        orderId = await db.transaction(async (tx) => {
          let checkoutOrgId = orgId;

          if (!checkoutOrgId) {
            const existingOrganizations = await tx
              .select({ id: organizations.id })
              .from(organizations)
              .where(and(
                eq(organizations.managerEmail, managerEmail),
                eq(organizations.province, input.province),
                eq(organizations.status, "active"),
              ))
              .limit(2);

            // Reuse an unambiguous existing manager organization. If the same
            // email manages multiple organizations, create a separate Course
            // Pass organization instead of guessing which one owns the order.
            if (existingOrganizations.length === 1) {
              checkoutOrgId = existingOrganizations[0].id;
            } else {
              const [organizationResult] = await tx.insert(organizations).values(
                buildProvisionalCoursePassOrganization({
                  organizationName: input.organizationName,
                  managerEmail,
                  province: input.province,
                }),
              );
              checkoutOrgId = Number(organizationResult.insertId);
            }
          }

          if (!checkoutOrgId || checkoutOrgId <= 0) {
            throw new Error("Could not resolve an organization for the Course Pass order");
          }

          const [orderResult] = await tx.insert(teamFlexOrders).values({
            organizationId: checkoutOrgId,
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
          const pendingOrderId = Number(orderResult.insertId);

          for (const item of orderItems) {
            await tx.insert(teamFlexOrderItems).values({
              orderId: pendingOrderId,
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

          return pendingOrderId;
        });
      } catch (error) {
        console.error("[Flex Checkout] Failed to create pending order:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "We could not start checkout. Please try again or contact support if the problem continues.",
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
      let session;
      try {
        session = await stripe.checkout.sessions.create({
          payment_method_types: ["card"],
          mode: "payment",
          line_items: stripeLineItems as any,
          ...buildTeamFlexBillingDocumentOptions({
            billingEmail,
            organizationName: input.organizationName,
            orderId,
          }),
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
      } catch (error) {
        await db.update(teamFlexOrders)
          .set({ status: "checkout_failed" })
          .where(and(eq(teamFlexOrders.id, orderId), eq(teamFlexOrders.status, "pending")));
        console.error(`[Flex Checkout] Stripe session creation failed for order #${orderId}:`, error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Checkout is temporarily unavailable. Please try again in a few minutes.",
        });
      }

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

          const total = Number(stats?.total ?? 0);
          const correct = Number(stats?.correct ?? 0);
          const accuracy = total > 0 ? correct / total : 0;
          const readinessResult = await calculateReadinessSnapshot(db, {
            userId: lic.operatorUserId,
            email: lic.invitedEmail,
            examType: progressExamType,
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
            daysActive30: readinessResult.activeDaysLast30,
          };
        }),
      );

      return results;
    }),

});
