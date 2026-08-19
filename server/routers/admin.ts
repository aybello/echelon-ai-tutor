/**
 * Admin router — all procedures require role === 'admin'.
 * Provides read access to trial emails, waitlist signups, and question error reports.
 */
import { desc, eq, sql, count, ne, and, gte } from "drizzle-orm";
import Stripe from "stripe";
import { z } from "zod";
import { questionErrorReports, trialEmails, waitlist, examResults, purchases, users, userFeedback, triggerLogs, organizations, organizationMembers, subscriptions, questions, questionBankMeta, productAnalyticsEvents, examOutcomes, teamFlexLicences } from "../../drizzle/schema";

import { normalizeEmail } from "../_core/access";
import { getDb } from "../db";
import { adminProcedure, router } from "../_core/trpc";

import { sendPurchaseConfirmationEmail } from "../email";
import { PRODUCT_STUDY_PATHS } from "../stripe/products";
import { runTriggerEngine } from "../jobs/triggerEngine";
import { runSubscriptionReconciliation } from "../jobs/reconcile";
import { getIndividualExamPassExpiry } from "../stripe/individualExamPass";
import { analyticsIdentity, masteryGain, medianTimeToFirstQuizMinutes, percentage } from "../productKpis";

const OWNER_EMAIL = "belllo.ayoola@gmail.com";

function getStripe() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error("STRIPE_SECRET_KEY not set");
  return new Stripe(key, { apiVersion: "2024-12-18.acacia" as any });
}

export const adminRouter = router({
  /** Owner-facing product, conversion, team-usage, and outcome signals. */
  getProductKpis: adminProcedure.query(async () => {
    const db = await getDb();
    if (!db) throw new Error("Database unavailable");

    const now = new Date();
    const since30 = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const since7 = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const [events, outcomes, recentPurchases, [seatCapacity], [assignedSeats], [coursePassSeats]] = await Promise.all([
      db.select({
        eventName: productAnalyticsEvents.eventName,
        occurredAt: productAnalyticsEvents.occurredAt,
        userId: productAnalyticsEvents.userId,
        emailHash: productAnalyticsEvents.emailHash,
        examType: productAnalyticsEvents.examType,
        metadata: productAnalyticsEvents.metadata,
      }).from(productAnalyticsEvents)
        .where(gte(productAnalyticsEvents.occurredAt, since30))
        .orderBy(productAnalyticsEvents.occurredAt)
        .limit(100_000),
      db.select({
        result: examOutcomes.result,
        readinessScore: examOutcomes.readinessScoreAtOutcome,
      }).from(examOutcomes)
        .where(gte(examOutcomes.recordedAt, since30)),
      db.select({ status: purchases.status })
        .from(purchases)
        .where(and(
          gte(purchases.createdAt, since30),
          ne(purchases.email, OWNER_EMAIL),
        )),
      db.select({ seats: sql<number>`COALESCE(SUM(${organizations.seatsTotal}), 0)` })
        .from(organizations)
        .where(eq(organizations.status, "active")),
      db.select({ seats: count() })
        .from(organizationMembers)
        .innerJoin(organizations, eq(organizations.id, organizationMembers.orgId))
        .where(and(
          eq(organizations.status, "active"),
          eq(organizationMembers.role, "operator"),
          eq(organizationMembers.status, "assigned"),
        )),
      db.select({
        total: count(),
        allocated: sql<number>`SUM(CASE WHEN ${teamFlexLicences.status} IN ('invited', 'assigned', 'active', 'suspended') THEN 1 ELSE 0 END)`,
        activated: sql<number>`SUM(CASE WHEN ${teamFlexLicences.status} IN ('active', 'suspended') THEN 1 ELSE 0 END)`,
      }).from(teamFlexLicences)
        .where(and(
          ne(teamFlexLicences.status, "revoked"),
          sql`(${teamFlexLicences.activationDeadline} >= ${now} OR ${teamFlexLicences.reportingEndsAt} >= ${now})`,
        )),
    ]);

    const eventCounts = new Map<string, number>();
    for (const event of events) {
      eventCounts.set(event.eventName, (eventCounts.get(event.eventName) ?? 0) + 1);
    }
    const eventCount = (name: string) => eventCounts.get(name) ?? 0;
    const identitiesFor = (name: string) => new Set(
      events
        .filter(event => event.eventName === name)
        .map(analyticsIdentity)
        .filter((identity): identity is string => Boolean(identity)),
    );
    const signupIdentities = identitiesFor("signup");
    const activationIdentities = identitiesFor("access_activated");
    const pricingIdentities = identitiesFor("pricing_viewed");
    const checkoutIdentities = identitiesFor("checkout_completed");
    const quizStartIdentities = identitiesFor("quiz_started");
    const quizCompletionIdentities = identitiesFor("quiz_completed");
    const activatedSignupCohort = Array.from(signupIdentities)
      .filter(identity => activationIdentities.has(identity)).length;

    const learningEvents = new Set([
      "diagnostic_started", "diagnostic_completed", "quiz_started", "quiz_completed",
      "mock_exam_completed", "ai_tutor_opened", "ai_tutor_message",
    ]);
    const weeklyActiveLearners = new Set(
      events
        .filter(event => event.occurredAt >= since7 && learningEvents.has(event.eventName))
        .map(analyticsIdentity)
        .filter((identity): identity is string => Boolean(identity)),
    ).size;

    const passed = outcomes.filter(outcome => outcome.result === "passed");
    const failed = outcomes.filter(outcome => outcome.result === "failed");
    const noShow = outcomes.filter(outcome => outcome.result === "no_show").length;
    const readinessAverage = (rows: typeof outcomes) => {
      const scores = rows.flatMap(row => row.readinessScore === null ? [] : [Number(row.readinessScore)]);
      if (scores.length === 0) return null;
      return Math.round((scores.reduce((sum, score) => sum + score, 0) / scores.length) * 10) / 10;
    };

    const refundedPurchases = recentPurchases.filter(purchase => purchase.status === "refunded").length;
    const seats = Number(seatCapacity?.seats ?? 0);
    const assigned = Number(assignedSeats?.seats ?? 0);
    const coursePassTotal = Number(coursePassSeats?.total ?? 0);
    const coursePassAllocated = Number(coursePassSeats?.allocated ?? 0);
    const coursePassActivated = Number(coursePassSeats?.activated ?? 0);
    const totalTeamCapacity = seats + coursePassTotal;
    const totalTeamAllocated = assigned + coursePassAllocated;
    const mastery = masteryGain(events);

    return {
      periodDays: 30,
      generatedAt: now,
      funnel: {
        pricingViews: eventCount("pricing_viewed"),
        signups: eventCount("signup"),
        accessActivations: eventCount("access_activated"),
        quizStarts: eventCount("quiz_started"),
        quizCompletions: eventCount("quiz_completed"),
        diagnosticCompletions: eventCount("diagnostic_completed"),
        mockExamCompletions: eventCount("mock_exam_completed"),
        checkoutCompletions: eventCount("checkout_completed"),
      },
      engagement: {
        weeklyActiveLearners,
        medianMinutesToFirstQuiz: medianTimeToFirstQuizMinutes(events),
        masteryGainPercentagePoints: mastery.percentagePoints,
        masteryGainSampleSize: mastery.sampleSize,
      },
      teams: {
        assignedSeats: totalTeamAllocated,
        availableSeats: Math.max(totalTeamCapacity - totalTeamAllocated, 0),
        totalSeats: totalTeamCapacity,
        utilizationRate: percentage(totalTeamAllocated, totalTeamCapacity),
        allAccess: {
          assignedSeats: assigned,
          totalSeats: seats,
          utilizationRate: percentage(assigned, seats),
        },
        coursePass: {
          allocatedLicences: coursePassAllocated,
          activatedLicences: coursePassActivated,
          totalLicences: coursePassTotal,
          allocationRate: percentage(coursePassAllocated, coursePassTotal),
          activationRate: percentage(coursePassActivated, coursePassTotal),
        },
      },
      outcomes: {
        passed: passed.length,
        failed: failed.length,
        noShow,
        passRate: percentage(passed.length, passed.length + failed.length),
        averageReadinessPassed: readinessAverage(passed),
        averageReadinessFailed: readinessAverage(failed),
      },
      commercial: {
        pricingToCheckoutRate: percentage(checkoutIdentities.size, pricingIdentities.size),
        activationRate: percentage(activatedSignupCohort, signupIdentities.size),
        quizCompletionRate: percentage(quizCompletionIdentities.size, quizStartIdentities.size),
        refundRate: percentage(refundedPurchases, recentPurchases.length),
        renewals: eventCount("subscription_renewed"),
        cancellations: eventCount("subscription_cancelled"),
      },
    };
  }),

  /** Review coverage for the certification question library. */
  getQuestionGovernanceStats: adminProcedure.query(async () => {
    const db = await getDb();
    if (!db) throw new Error("Database unavailable");

    const [row] = await db
      .select({
        total: count(),
        unreviewed: sql<number>`SUM(CASE WHEN ${questions.reviewStatus} = 'unreviewed' THEN 1 ELSE 0 END)`,
        inReview: sql<number>`SUM(CASE WHEN ${questions.reviewStatus} = 'in_review' THEN 1 ELSE 0 END)`,
        approved: sql<number>`SUM(CASE WHEN ${questions.reviewStatus} = 'approved' THEN 1 ELSE 0 END)`,
        rejected: sql<number>`SUM(CASE WHEN ${questions.reviewStatus} = 'rejected' THEN 1 ELSE 0 END)`,
        missingSource: sql<number>`SUM(CASE WHEN ${questions.sourceTitle} IS NULL OR ${questions.sourceReference} IS NULL THEN 1 ELSE 0 END)`,
      })
      .from(questions);

    return {
      total: Number(row?.total ?? 0),
      unreviewed: Number(row?.unreviewed ?? 0),
      inReview: Number(row?.inReview ?? 0),
      approved: Number(row?.approved ?? 0),
      rejected: Number(row?.rejected ?? 0),
      missingSource: Number(row?.missingSource ?? 0),
    };
  }),

  /** A bounded admin queue for sourcing and reviewing question content. */
  getQuestionGovernanceQueue: adminProcedure
    .input(z.object({
      bankKey: z.string().trim().min(1).max(64).optional(),
      status: z.enum(["unreviewed", "in_review", "approved", "rejected"]).optional(),
      limit: z.number().int().min(1).max(200).default(100),
    }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");

      return db
        .select({
          id: questions.id,
          bankKey: questions.bankKey,
          questionNum: questions.questionNum,
          module: questions.module,
          question: questions.question,
          sourceTitle: questions.sourceTitle,
          sourceReference: questions.sourceReference,
          sourceUrl: questions.sourceUrl,
          blueprintObjective: questions.blueprintObjective,
          reviewStatus: questions.reviewStatus,
          reviewedBy: questions.reviewedBy,
          reviewedAt: questions.reviewedAt,
        })
        .from(questions)
        .where(and(
          input.bankKey ? eq(questions.bankKey, input.bankKey) : undefined,
          input.status ? eq(questions.reviewStatus, input.status) : undefined,
        ))
        .orderBy(questions.bankKey, questions.questionNum)
        .limit(input.limit);
    }),

  /** Persist one question's citation and review decision with server-owned reviewer identity. */
  reviewQuestion: adminProcedure
    .input(z.object({
      id: z.number().int().positive(),
      sourceTitle: z.string().trim().max(255).nullable(),
      sourceReference: z.string().trim().max(512).nullable(),
      sourceUrl: z.string().trim().url().max(1024).nullable(),
      blueprintObjective: z.string().trim().max(255).nullable(),
      reviewStatus: z.enum(["unreviewed", "in_review", "approved", "rejected"]),
    }).superRefine((value, ctx) => {
      if (value.reviewStatus === "approved" && (!value.sourceTitle || !value.sourceReference)) {
        ctx.addIssue({
          code: "custom",
          message: "Approved questions require a source title and precise source reference.",
          path: ["sourceReference"],
        });
      }
    }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");

      const [existing] = await db
        .select({ bankKey: questions.bankKey })
        .from(questions)
        .where(eq(questions.id, input.id))
        .limit(1);
      if (!existing) throw new Error("Question not found");

      const reviewer = normalizeEmail(ctx.user.email ?? "") || ctx.user.name || `user:${ctx.user.id}`;
      const reviewed = input.reviewStatus !== "unreviewed";
      await db.transaction(async tx => {
        await tx
          .update(questions)
          .set({
            sourceTitle: input.sourceTitle || null,
            sourceReference: input.sourceReference || null,
            sourceUrl: input.sourceUrl || null,
            blueprintObjective: input.blueprintObjective || null,
            reviewStatus: input.reviewStatus,
            reviewedBy: reviewed ? reviewer : null,
            reviewedAt: reviewed ? new Date() : null,
          })
          .where(eq(questions.id, input.id));

        // Force every cached learner bank to refresh after a review decision,
        // and keep the advertised inventory aligned with visible questions.
        await tx
          .update(questionBankMeta)
          .set({
            contentVersion: sql`${questionBankMeta.contentVersion} + 1`,
            totalQuestions: sql`(
              SELECT COUNT(*) FROM ${questions}
              WHERE ${questions.bankKey} = ${existing.bankKey}
                AND ${questions.reviewStatus} <> 'rejected'
            )`,
          })
          .where(eq(questionBankMeta.bankKey, existing.bankKey));
      });

      return { success: true };
    }),

  /** Summary counts for the dashboard header */
  stats: adminProcedure.query(async () => {
    const db = await getDb();
    if (!db) throw new Error("Database unavailable");
    // Use COUNT(*) for all counts — avoids loading full table rows just to call .length
    // Exclude owner test email from all counts
    const [
      [{ cnt: trialCount }],
      [{ cnt: waitlistCount }],
      [{ cnt: errorCount }],
      [{ cnt: scoreCount }],
      [{ cnt: purchaseCount }],
      [{ cnt: subscriptionCount }],
      [{ cnt: feedbackCount }],
      [{ cnt: triggerCount }],
      purchaseRevenueRows,
      subscriptionRevenueRows,
      ratingRows,
    ] = await Promise.all([
      db.select({ cnt: count() }).from(trialEmails).where(ne(trialEmails.email, OWNER_EMAIL)),
      db.select({ cnt: count() }).from(waitlist).where(ne(waitlist.email, OWNER_EMAIL)),
      db.select({ cnt: count() }).from(questionErrorReports),
      db.select({ cnt: count() }).from(examResults),
      db.select({ cnt: count() }).from(purchases).where(ne(purchases.email, OWNER_EMAIL)),
      db.select({ cnt: count() }).from(subscriptions).where(ne(subscriptions.email, OWNER_EMAIL)),
      db.select({ cnt: count() }).from(userFeedback),
      db.select({ cnt: count() }).from(triggerLogs),
      // Revenue: sum amountCAD from purchases, excluding owner
      db.select({ total: sql<number>`COALESCE(SUM(amountCAD), 0)` }).from(purchases).where(ne(purchases.email, OWNER_EMAIL)),
      // Revenue: sum amountCAD from subscriptions, excluding owner
      db.select({ total: sql<number>`COALESCE(SUM(amountCAD), 0)` }).from(subscriptions).where(ne(subscriptions.email, OWNER_EMAIL)),
      // Rating: avg in DB
      db.select({ avg: sql<number>`COALESCE(AVG(rating), 0)`, cnt: count() }).from(userFeedback),
    ]);
    const totalRevenueCents = Number(purchaseRevenueRows[0]?.total ?? 0) + Number(subscriptionRevenueRows[0]?.total ?? 0);
    const avgRating = Number(ratingRows[0]?.avg ?? 0);
    return {
      trialCount: Number(trialCount),
      waitlistCount: Number(waitlistCount),
      errorCount: Number(errorCount),
      scoreCount: Number(scoreCount),
      purchaseCount: Number(purchaseCount),
      subscriptionCount: Number(subscriptionCount),
      totalRevenueCAD: totalRevenueCents / 100,
      feedbackCount: Number(feedbackCount),
      avgRating: Math.round(avgRating * 10) / 10,
      triggerCount: Number(triggerCount),
    };
  }),

  /** Paginated list of purchases, newest first — excludes owner test email */
  getPurchases: adminProcedure
    .input(z.object({ limit: z.number().int().min(1).max(500).default(200) }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");
      return db
        .select()
        .from(purchases)
        .where(ne(purchases.email, OWNER_EMAIL))
        .orderBy(desc(purchases.createdAt))
        .limit(input.limit);
    }),

  /** Paginated list of subscriptions, newest first — excludes owner test email */
  getSubscriptions: adminProcedure
    .input(z.object({ limit: z.number().int().min(1).max(500).default(200) }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");
      return db
        .select()
        .from(subscriptions)
        .where(ne(subscriptions.email, OWNER_EMAIL))
        .orderBy(desc(subscriptions.createdAt))
        .limit(input.limit);
    }),

  /** Paginated list of trial email signups, newest first */
  getTrialEmails: adminProcedure
    .input(z.object({ limit: z.number().int().min(1).max(200).default(100) }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");
      return db
        .select()
        .from(trialEmails)
        .where(ne(trialEmails.email, OWNER_EMAIL))
        .orderBy(desc(trialEmails.createdAt))
        .limit(input.limit);
    }),

  /** Paginated list of waitlist signups, newest first */
  getWaitlist: adminProcedure
    .input(z.object({ limit: z.number().int().min(1).max(200).default(100) }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");
      return db
        .select()
        .from(waitlist)
        .where(ne(waitlist.email, OWNER_EMAIL))
        .orderBy(desc(waitlist.createdAt))
        .limit(input.limit);
    }),

  /** Paginated list of question error reports, newest first */
  getErrorReports: adminProcedure
    .input(z.object({ limit: z.number().int().min(1).max(200).default(100) }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");
      return db
        .select()
        .from(questionErrorReports)
        .orderBy(desc(questionErrorReports.createdAt))
        .limit(input.limit);
    }),

  /** Dismiss (delete) a specific error report once it has been reviewed */
  dismissErrorReport: adminProcedure
    .input(z.object({ id: z.number().int().positive() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");
      await db
        .delete(questionErrorReports)
        .where(eq(questionErrorReports.id, input.id));
      return { success: true };
    }),

  /** Paginated list of exam results (score history), newest first */
  getScoreHistory: adminProcedure
    .input(z.object({
      limit: z.number().int().min(1).max(500).default(200),
      examType: z.enum(["class1", "wqa", "oit", "all"]).default("all"),
    }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");
      const results = await db
        .select()
        .from(examResults)
        .orderBy(desc(examResults.createdAt))
        .limit(input.limit);
      return results
        .filter(r => input.examType === "all" || r.examType === input.examType)
        .map(r => ({
          ...r,
          moduleBreakdown: r.moduleBreakdown ? JSON.parse(r.moduleBreakdown) : null,
        }));
    }),

  /** Delete a waitlist entry */
  removeWaitlistEntry: adminProcedure
    .input(z.object({ id: z.number().int().positive() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");
      await db.delete(waitlist).where(eq(waitlist.id, input.id));
      return { success: true };
    }),

  /**
   * Reconcile purchases — queries Stripe for all paid checkout sessions in the
   * last N hours and inserts any that are missing from our database.
   * Safe to call multiple times (idempotent via stripeSessionId unique constraint).
   * Use this to recover purchases that were missed due to webhook failures or
   * customers closing the browser before the success page loaded.
   */
  reconcilePurchases: adminProcedure
    .input(z.object({ hoursBack: z.number().int().min(1).max(168).default(48) }))
    .mutation(async ({ input }) => {
      const stripe = getStripe();
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");

      const since = Math.floor(Date.now() / 1000) - input.hoursBack * 3600;
      const recovered: { email: string; productKey: string; sessionId: string }[] = [];
      const skipped: string[] = [];

      // Page through all completed checkout sessions in the window
      let hasMore = true;
      let startingAfter: string | undefined;

      while (hasMore) {
        const params: Stripe.Checkout.SessionListParams = {
          limit: 100,
          created: { gte: since },
          status: "complete",
        };
        if (startingAfter) params.starting_after = startingAfter;

        const page = await stripe.checkout.sessions.list(params);

        for (const session of page.data) {
          const productKey = session.metadata?.product_key;
          const email =
            (session as any).customer_details?.email ??
            session.customer_email ??
            session.metadata?.customer_email;

          if (!productKey || !email || session.payment_status !== "paid") {
            skipped.push(session.id);
            continue;
          }

          // Check if already in DB
          const existing = await db
            .select({ id: purchases.id })
            .from(purchases)
            .where(eq(purchases.stripeSessionId, session.id))
            .limit(1);

          if (existing.length > 0) {
            skipped.push(session.id);
            continue;
          }

          // Insert the missing purchase
          const productName = session.metadata?.product_name ?? productKey;
          const amountCAD = session.amount_total ?? 0;
          const stripePaymentIntentId =
            typeof session.payment_intent === "string" ? session.payment_intent : null;
          const userId = session.metadata?.user_id
            ? parseInt(session.metadata.user_id)
            : null;
          const phone = (session as any).customer_details?.phone ?? (session.metadata?.customer_phone || null);
          const customerName = (session as any).customer_details?.name ?? (session.metadata?.customer_name || null);
          const accessExpiresAt = getIndividualExamPassExpiry(
            session.metadata,
            new Date(session.created * 1000),
          );

          await db.insert(purchases).values({
            userId: userId ?? undefined,
            email,
            productKey,
            productName,
            amountCAD,
            stripeSessionId: session.id,
            stripePaymentIntentId,
            phone,
            customerName,
            accessExpiresAt,
          });

          // Save phone to users table if available
          if (phone) {
            const targetUserId = userId ?? (await db
              .select({ id: users.id })
              .from(users)
              .where(eq(users.email, email))
              .limit(1)
              .then(rows => rows[0]?.id ?? null));
            if (targetUserId) {
              await db.update(users).set({ phone }).where(eq(users.id, targetUserId));
            }
          }

          // Send confirmation email (non-blocking)
          const studyPaths = PRODUCT_STUDY_PATHS[productKey] ?? { quizPath: "/quiz", mockPath: "/quiz" };
          sendPurchaseConfirmationEmail({
            email,
            productName,
            productKey,
            amountCAD,
            quizPath: studyPaths.quizPath,
            mockPath: studyPaths.mockPath,
          }).catch(err => console.error("[reconcile] Email failed:", err.message));

          recovered.push({ email, productKey, sessionId: session.id });
          console.log(`[reconcile] Recovered missing purchase: ${email.replace(/(^.{3}).+@/, '$1***@')} → ${productKey} (${session.id})`);
        }

        hasMore = page.has_more;
        if (page.data.length > 0) startingAfter = page.data[page.data.length - 1].id;
      }

      return {
        recovered: recovered.length,
        skipped: skipped.length,
        details: recovered,
      };
    }),

  /**
   * Backfill subscriptions dropped by the period-end bug.
   * Idempotent — safe to run multiple times.
   */
  reconcileSubscriptions: adminProcedure
    .mutation(async () => {
      const result = await runSubscriptionReconciliation();
      return {
        recovered: result.recovered,
        skipped: result.skipped,
        errors: result.errors,
        details: result.details,
      };
    }),

  /**
   * Backfill phone and customerName for subscriptions and purchases that are missing them.
   * Looks up each Stripe subscription/customer and updates the DB row.
   * Idempotent — safe to run multiple times.
   */
  backfillContactInfo: adminProcedure
    .mutation(async () => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");
      const stripe = getStripe();

      const updated: { type: string; email: string; phone: string | null; name: string | null }[] = [];
      const errors: string[] = [];

      // ── Subscriptions ────────────────────────────────────────────────────────
      const missingSubs = await db
        .select()
        .from(subscriptions)
        .where(
          sql`(${subscriptions.phone} IS NULL OR ${subscriptions.customerName} IS NULL) AND ${subscriptions.stripeSubscriptionId} IS NOT NULL`
        );

      for (const sub of missingSubs) {
        try {
          let phone: string | null = sub.phone;
          let customerName: string | null = sub.customerName;

          // Method 1: Subscription metadata
          const stripeSub = await stripe.subscriptions.retrieve(sub.stripeSubscriptionId!);
          if (!phone && stripeSub.metadata?.customer_phone) phone = stripeSub.metadata.customer_phone;
          if (!customerName && stripeSub.metadata?.customer_name) customerName = stripeSub.metadata.customer_name;

          // Method 2: Stripe customer object
          if ((!phone || !customerName) && sub.stripeCustomerId) {
            const customer = await stripe.customers.retrieve(sub.stripeCustomerId) as any;
            if (!customer.deleted) {
              if (!phone && customer.phone) phone = customer.phone;
              if (!customerName && customer.name) customerName = customer.name;
            }
          }

          // Method 3: Checkout session metadata
          if (!phone || !customerName) {
            const sessions = await stripe.checkout.sessions.list({
              subscription: sub.stripeSubscriptionId!,
              limit: 5,
              expand: ["data.customer_details"],
            });
            for (const session of sessions.data) {
              const details = (session as any).customer_details;
              if (!phone && details?.phone) phone = details.phone;
              if (!customerName && details?.name) customerName = details.name;
              if (!phone && session.metadata?.customer_phone) phone = session.metadata.customer_phone;
              if (!customerName && session.metadata?.customer_name) customerName = session.metadata.customer_name;
              if (phone && customerName) break;
            }
          }

          if (phone !== sub.phone || customerName !== sub.customerName) {
            await db
              .update(subscriptions)
              .set({ ...(phone ? { phone } : {}), ...(customerName ? { customerName } : {}) })
              .where(eq(subscriptions.id, sub.id));
            updated.push({ type: "subscription", email: sub.email, phone, name: customerName });
          }
        } catch (err: any) {
          errors.push(`sub ${sub.stripeSubscriptionId}: ${err.message}`);
        }
      }

      // ── Purchases ────────────────────────────────────────────────────────────
      const missingPurchases = await db
        .select()
        .from(purchases)
        .where(
          sql`(${purchases.phone} IS NULL OR ${purchases.customerName} IS NULL) AND ${purchases.stripeSessionId} IS NOT NULL AND ${purchases.stripeSessionId} NOT LIKE 'manual_%'`
        );

      for (const p of missingPurchases) {
        try {
          let phone: string | null = p.phone;
          let customerName: string | null = p.customerName;

          const session = await stripe.checkout.sessions.retrieve(p.stripeSessionId!, {
            expand: ["customer_details"],
          });
          const details = (session as any).customer_details;
          if (!phone && details?.phone) phone = details.phone;
          if (!customerName && details?.name) customerName = details.name;
          if (!phone && session.metadata?.customer_phone) phone = session.metadata.customer_phone;
          if (!customerName && session.metadata?.customer_name) customerName = session.metadata.customer_name;

          if (phone !== p.phone || customerName !== p.customerName) {
            await db
              .update(purchases)
              .set({ ...(phone ? { phone } : {}), ...(customerName ? { customerName } : {}) })
              .where(eq(purchases.id, p.id));
            updated.push({ type: "purchase", email: p.email, phone, name: customerName });
          }
        } catch (err: any) {
          errors.push(`purchase ${p.stripeSessionId}: ${err.message}`);
        }
      }

      return {
        updated: updated.length,
        errors,
        details: updated,
      };
    }),

  /** Paginated list of user feedback, newest first */
  getFeedback: adminProcedure
    .input(z.object({ limit: z.number().int().min(1).max(500).default(200) }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");
      return db
        .select()
        .from(userFeedback)
        .orderBy(desc(userFeedback.createdAt))
        .limit(input.limit);
    }),

  /** Delete a feedback entry */
  dismissFeedback: adminProcedure
    .input(z.object({ id: z.number().int().positive() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");
      await db.delete(userFeedback).where(eq(userFeedback.id, input.id));
      return { success: true };
    }),

  /** Paginated list of trigger logs, newest first */
  getTriggerLogs: adminProcedure
    .input(z.object({ limit: z.number().int().min(1).max(500).default(200) }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");
      return db
        .select()
        .from(triggerLogs)
        .orderBy(desc(triggerLogs.sentAt))
        .limit(input.limit);
    }),

  /** Manually run the trigger engine (for testing) */
  runTriggerEngine: adminProcedure.mutation(async () => {
    return await runTriggerEngine();
  }),

  /** System health check — DB, Stripe, SMTP, recent purchases */
  getSystemHealth: adminProcedure.query(async () => {
    const checks: { name: string; status: "ok" | "warn" | "error"; detail: string }[] = [];
    const now = Date.now();

    // 1. Database connectivity
    try {
      const db = await getDb();
      if (!db) throw new Error("getDb returned null");
      await db.select({ id: purchases.id }).from(purchases).limit(1);
      checks.push({ name: "Database", status: "ok", detail: "Connected and queryable" });
    } catch (err: any) {
      checks.push({ name: "Database", status: "error", detail: err.message });
    }

    // The general DB check deliberately selects only a stable primary key. The
    // welcome-email marker needs its own check because a missing column pauses
    // customer onboarding without making the rest of the database unavailable.
    try {
      const db = await getDb();
      if (!db) throw new Error("getDb returned null");
      await db.select({ marker: purchases.welcomeEmailSentAt }).from(purchases).limit(1);
      checks.push({ name: "Welcome Email Queue", status: "ok", detail: "Delivery marker column is ready" });
    } catch (err: any) {
      checks.push({
        name: "Welcome Email Queue",
        status: "error",
        detail: `Onboarding emails are paused: ${err.message}. Run the backup-gated welcome-email schema repair.`,
      });
    }

    // 2. Stripe connectivity
    try {
      const stripe = getStripe();
      await stripe.balance.retrieve();
      checks.push({ name: "Stripe API", status: "ok", detail: "Connected" });
    } catch (err: any) {
      checks.push({ name: "Stripe API", status: "error", detail: err.message });
    }

    // 3. Stripe webhook secret
    const webhookOk = !!process.env.STRIPE_WEBHOOK_SECRET;
    checks.push({
      name: "Stripe Webhook Secret",
      status: webhookOk ? "ok" : "warn",
      detail: webhookOk ? "Configured" : "STRIPE_WEBHOOK_SECRET not set — signature verification disabled",
    });

    // 4. SMTP email config
    const smtpOk = !!(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);
    checks.push({
      name: "Email (SMTP)",
      status: smtpOk ? "ok" : "warn",
      detail: smtpOk ? `Configured (${process.env.SMTP_HOST})` : "SMTP_HOST/USER/PASS not set — emails will not send",
    });

    // 5. Recent purchases + subscriptions (last 24h) — excludes owner test email
    let recentPurchases: { email: string; productKey: string; amountCAD: number; createdAt: Date | string; type: string }[] = [];
    try {
      const db = await getDb();
      if (db) {
        const cutoff = new Date(now - 24 * 60 * 60 * 1000);
        const [purchaseRows, subscriptionRows] = await Promise.all([
          db
            .select({ email: purchases.email, productKey: purchases.productKey, amountCAD: purchases.amountCAD, createdAt: purchases.createdAt })
            .from(purchases)
            .where(ne(purchases.email, OWNER_EMAIL))
            .orderBy(desc(purchases.createdAt))
            .limit(20),
          db
            .select({ email: subscriptions.email, tier: subscriptions.tier, createdAt: subscriptions.createdAt })
            .from(subscriptions)
            .where(ne(subscriptions.email, OWNER_EMAIL))
            .orderBy(desc(subscriptions.createdAt))
            .limit(20),
        ]);
        const recentOnetimes = purchaseRows
          .filter(r => new Date(r.createdAt) >= cutoff)
          .map(r => ({ ...r, productKey: r.productKey, type: "purchase" }));
        const recentSubs = subscriptionRows
          .filter(r => new Date(r.createdAt) >= cutoff)
          .map(r => ({ email: r.email, productKey: r.tier, amountCAD: 0, createdAt: r.createdAt, type: "subscription" }));
        recentPurchases = [...recentOnetimes, ...recentSubs].sort(
          (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        const total = recentPurchases.length;
        const label = total > 0
          ? `${total} transaction(s) in last 24h (${recentOnetimes.length} purchase${recentOnetimes.length !== 1 ? "s" : ""}, ${recentSubs.length} new subscription${recentSubs.length !== 1 ? "s" : ""})`
          : "No purchases or new subscriptions in last 24h";
        checks.push({ name: "Recent Activity (24h)", status: "ok", detail: label });
      }
    } catch (err: any) {
      checks.push({ name: "Recent Activity (24h)", status: "warn", detail: err.message });
    }

    return { checks, recentPurchases, timestamp: new Date() };
  }),

  /**
   * listOrganizations — returns all orgs with seat usage for the admin panel.
   */
  listOrganizations: adminProcedure.query(async () => {
    const db = await getDb();
    if (!db) throw new Error("Database unavailable");

    const orgs = await db
      .select()
      .from(organizations)
      .orderBy(desc(organizations.createdAt));

    // Seat usage per org
    const usageRows = await db
      .select({
        orgId: organizationMembers.orgId,
        assigned: sql<number>`SUM(CASE WHEN ${organizationMembers.status} = 'assigned' AND ${organizationMembers.role} = 'operator' THEN 1 ELSE 0 END)`,
      })
      .from(organizationMembers)
      .groupBy(organizationMembers.orgId);

    const usageByOrg = new Map(usageRows.map(r => [r.orgId, Number(r.assigned)]));

    return orgs.map(org => ({
      ...org,
      seatsUsed: usageByOrg.get(org.id) ?? 0,
    }));
  }),
});
