import { TRPCError } from "@trpc/server";
import { purchaseEmailOutbox } from "../../drizzle/schema";
/**
 * Admin router — all procedures require role === 'admin'.
 * Provides read access to trial emails, waitlist signups, and question error reports.
 */
import { desc, eq, sql, count, ne, and, gte } from "drizzle-orm";
import Stripe from "stripe";
import { z } from "zod";
import { questionErrorReports, trialEmails, waitlist, examResults, purchaseReadColumns, purchases, users, userFeedback, triggerLogs, organizations, organizationMembers, subscriptions, questions, questionBankMeta, examOutcomes, teamFlexLicences, customerRecoveryEvidence } from "../../drizzle/schema";

import { normalizeEmail } from "../_core/access";
import {
  RECOVERY_ORGANIZATION_GROUPS,
  RECOVERY_SUBJECT_TYPES,
  validateRecoveryClassification,
} from "../customerRecoveryEvidence";
import { getDb } from "../db";
import { adminProcedure, router } from "../_core/trpc";
import {
  getDataExplorerDataset,
  publicDataExplorerCatalog,
  readDataExplorerPage,
} from "../dataExplorer";

import { runManagedJob, managedJobHostAllowed } from "../jobs/managedJobs";
import { runReconciliation, runSubscriptionReconciliation } from "../jobs/reconcile";
import { READINESS_MODEL_VERSION } from "../_core/readiness";
import {
  buildJourneyIdentityResolver,
  cohortConversion,
  comparableQuizGain,
  medianTimeToFirstQuizMinutes,
  percentage,
} from "../productKpis";
import {
  getAllProductKpiJourneyEvents,
  getExactAnalyticsEventCounts,
  type TrainingMetricEventName,
} from "../analyticsAggregates";

const OWNER_EMAIL = "belllo.ayoola@gmail.com";

function getStripe() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error("STRIPE_SECRET_KEY not set");
  return new Stripe(key, { apiVersion: "2024-12-18.acacia" as any });
}

export const adminRouter = router({
  /**
   * Read-only production data catalog for the internal Data Explorer. The
   * browser can choose only a catalog key and cannot supply a table, column,
   * query, sort expression, or mutation.
   */
  getDataExplorerCatalog: adminProcedure.query(() => ({
    datasets: publicDataExplorerCatalog(),
    generatedAt: new Date(),
  })),
  /**
   * A bounded, paginated application-table view. Sensitive operational values
   * such as authentication hashes, write tokens, Stripe identifiers, and email
   * payloads are removed before rows leave the server.
   */
  getDataExplorerPage: adminProcedure
    .input(z.object({
      datasetKey: z.string().trim().min(1).max(80),
      page: z.number().int().min(1).max(100_000).default(1),
      pageSize: z.number().int().min(10).max(100).default(50),
    }))
    .query(async ({ input }) => {
      const dataset = getDataExplorerDataset(input.datasetKey);
      if (!dataset) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Unknown Data Explorer dataset." });
      }
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");
      return readDataExplorerPage(db, dataset, input.page, input.pageSize);
    }),
  /**
   * Internal evidence intake view. It exposes no grant action: evidence can be
   * reviewed, but an independently authorized, idempotent import is required
   * before any historic learner receives an entitlement.
   */
  getCustomerRecoveryEvidence: adminProcedure
    .input(z.object({
      reviewStatus: z.enum(["staged", "mapped", "claim_verified", "approved", "rejected", "imported"]).optional(),
      limit: z.number().int().min(1).max(100).default(50),
    }).default({ limit: 50 }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");

      const rows = await db.select({
        id: customerRecoveryEvidence.id,
        sourceType: customerRecoveryEvidence.sourceType,
        sourceArchiveRef: customerRecoveryEvidence.sourceArchiveRef,
        customerEmail: customerRecoveryEvidence.customerEmail,
        amountMinor: customerRecoveryEvidence.amountMinor,
        currency: customerRecoveryEvidence.currency,
        paymentStatus: customerRecoveryEvidence.paymentStatus,
        paymentCreatedAt: customerRecoveryEvidence.paymentCreatedAt,
        recoverySubjectType: customerRecoveryEvidence.recoverySubjectType,
        recoveryOrganizationName: customerRecoveryEvidence.recoveryOrganizationName,
        recoveryOrganizationGroup: customerRecoveryEvidence.recoveryOrganizationGroup,
        recoverySeatCount: customerRecoveryEvidence.recoverySeatCount,
        candidateProductKey: customerRecoveryEvidence.candidateProductKey,
        candidateAccessExpiresAt: customerRecoveryEvidence.candidateAccessExpiresAt,
        reviewStatus: customerRecoveryEvidence.reviewStatus,
        claimVerifiedAt: customerRecoveryEvidence.claimVerifiedAt,
        reviewNote: customerRecoveryEvidence.reviewNote,
        reviewedAt: customerRecoveryEvidence.reviewedAt,
        importedAt: customerRecoveryEvidence.importedAt,
        createdAt: customerRecoveryEvidence.createdAt,
      }).from(customerRecoveryEvidence)
        .where(input.reviewStatus ? eq(customerRecoveryEvidence.reviewStatus, input.reviewStatus) : undefined)
        .orderBy(desc(customerRecoveryEvidence.createdAt))
        .limit(input.limit);

      return rows;
    }),
  /**
   * Admin-only evidence classification. It deliberately cannot approve a claim,
   * set a product entitlement, create an organization, create licences, or import
   * an entitlement. Those remain separate controlled recovery operations.
   */
  classifyCustomerRecoveryEvidence: adminProcedure
    .input(z.object({
      id: z.number().int().positive(),
      subjectType: z.enum(RECOVERY_SUBJECT_TYPES),
      organizationName: z.string().trim().min(1).max(128).nullable(),
      organizationGroup: z.enum(RECOVERY_ORGANIZATION_GROUPS).nullable(),
      seatCount: z.number().int().min(1).max(500).nullable(),
      reviewNote: z.string().trim().min(3).max(1000),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");
      const [evidence] = await db.select({
        paymentStatus: customerRecoveryEvidence.paymentStatus,
        reviewStatus: customerRecoveryEvidence.reviewStatus,
      }).from(customerRecoveryEvidence).where(eq(customerRecoveryEvidence.id, input.id)).limit(1);
      if (!evidence) throw new Error("Recovery evidence not found");

      const validationError = validateRecoveryClassification({
        paymentStatus: evidence.paymentStatus,
        reviewStatus: evidence.reviewStatus,
        subjectType: input.subjectType,
        organizationName: input.organizationName,
        organizationGroup: input.organizationGroup,
        seatCount: input.seatCount,
      });
      if (validationError) throw new Error(validationError);

      const [result] = await db.update(customerRecoveryEvidence).set({
        recoverySubjectType: input.subjectType,
        recoveryOrganizationName: input.subjectType === "organization_manager" ? input.organizationName : null,
        recoveryOrganizationGroup: input.subjectType === "organization_manager" ? input.organizationGroup : null,
        recoverySeatCount: input.subjectType === "organization_manager" ? input.seatCount : null,
        reviewNote: input.reviewNote,
        reviewStatus: "mapped",
        reviewedByUserId: ctx.user.id,
        reviewedAt: new Date(),
      }).where(and(
        eq(customerRecoveryEvidence.id, input.id),
        ne(customerRecoveryEvidence.reviewStatus, "imported"),
        ne(customerRecoveryEvidence.reviewStatus, "rejected"),
      ));
      return { classified: result.affectedRows === 1 };
    }),
  purchaseEmailDelivery: adminProcedure.query(async () => {
    const db = await getDb();
    if (!db) throw new Error("Database unavailable");
    return db.select({ id: purchaseEmailOutbox.id, stripeSessionId: purchaseEmailOutbox.stripeSessionId,
      status: purchaseEmailOutbox.status, attempts: purchaseEmailOutbox.attempts,
      sentAt: purchaseEmailOutbox.sentAt }).from(purchaseEmailOutbox)
      .orderBy(desc(purchaseEmailOutbox.id)).limit(100);
  }),
  retryPurchaseEmail: adminProcedure.input(z.object({ id: z.number().int().positive() })).mutation(async ({ input }) => {
    const db = await getDb();
    if (!db) throw new Error("Database unavailable");
    // Failed items only: cannot race a live worker or accidentally resend a sent email.
    const [result] = await db.update(purchaseEmailOutbox).set({ status: "pending", attempts: 0, availableAt: new Date() })
      .where(and(eq(purchaseEmailOutbox.id, input.id), eq(purchaseEmailOutbox.status, "failed")));
    return { queued: result.affectedRows === 1 };
  }),
  /** Owner-facing product, conversion, team-usage, and outcome signals. */
  getProductKpis: adminProcedure.query(async () => {
    const db = await getDb();
    if (!db) throw new Error("Database unavailable");

    const now = new Date();
    const since30 = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const since7 = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const [events, exactTrainingEventCounts, outcomes, recentPurchases, [seatCapacity], [assignedSeats], [coursePassSeats]] = await Promise.all([
      getAllProductKpiJourneyEvents(db, since30),
      getExactAnalyticsEventCounts(db, since30),
      db.select({
        result: examOutcomes.result,
        readinessScore: examOutcomes.readinessScoreAtOutcome,
        readinessModelVersion: examOutcomes.readinessModelVersion,
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
    const exactTrainingEventCount = (name: TrainingMetricEventName) =>
      exactTrainingEventCounts.get(name) ?? 0;
    const learningEvents = new Set([
      "diagnostic_started", "diagnostic_completed", "quiz_started", "quiz_completed",
      "mock_exam_completed", "ai_tutor_opened", "ai_tutor_message",
      "training_session_started", "training_session_completed",
    ]);
    const resolveJourneyIdentity = buildJourneyIdentityResolver(events);
    const weeklyActiveLearners = new Set(
      events
        .filter(event => event.occurredAt >= since7 && learningEvents.has(event.eventName))
        .map(resolveJourneyIdentity)
        .filter((identity): identity is string => Boolean(identity)),
    ).size;
    const pricingConversion = cohortConversion(
      events,
      new Set(["pricing_viewed"]),
      new Set(["checkout_completed"]),
    );
    const learningActivation = cohortConversion(
      events,
      new Set(["access_activated"]),
      learningEvents,
    );
    const quizCompletion = cohortConversion(
      events,
      new Set(["quiz_started"]),
      new Set(["quiz_completed"]),
    );

    // Calibration averages must never combine scores produced by different formulas.
    // The headline figures use only the current learner model; other versions stay
    // available in the database for explicitly versioned analysis.
    const currentModelOutcomes = outcomes.filter(
      outcome => outcome.readinessModelVersion === READINESS_MODEL_VERSION,
    );
    const passed = currentModelOutcomes.filter(outcome => outcome.result === "passed");
    const failed = currentModelOutcomes.filter(outcome => outcome.result === "failed");
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
    const quizImprovement = comparableQuizGain(events);

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
        quizImprovementPercentagePoints: quizImprovement.percentagePoints,
        quizImprovementSampleSize: quizImprovement.sampleSize,
        recordedStudySessionStarts: exactTrainingEventCount("training_session_started"),
        recordedStudySessionCompletions: exactTrainingEventCount("training_session_completed"),
        trainingHoursExports: exactTrainingEventCount("training_hours_exported"),
        trainingRecordsAttested: exactTrainingEventCount("training_record_attested"),
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
        pricingToCheckoutRate: pricingConversion.rate,
        pricingCohortSize: pricingConversion.cohortSize,
        attributedCheckouts: pricingConversion.converted,
        learningActivationRate: learningActivation.rate,
        accessCohortSize: learningActivation.cohortSize,
        learningActivated: learningActivation.converted,
        quizCompletionRate: quizCompletion.rate,
        quizStarterCohortSize: quizCompletion.cohortSize,
        quizCompleters: quizCompletion.converted,
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
      limit: z.number().int().min(1).max(100).default(25),
      page: z.number().int().min(1).max(100_000).default(1),
    }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");

      const filter = and(
        input.bankKey ? eq(questions.bankKey, input.bankKey) : undefined,
        input.status ? eq(questions.reviewStatus, input.status) : undefined,
      );
      const [rows, totals] = await Promise.all([db
        .select({
          id: questions.id,
          bankKey: questions.bankKey,
          questionNum: questions.questionNum,
          module: questions.module,
          question: questions.question,
          options: questions.options,
          correctIndex: questions.correctIndex,
          explanation: questions.explanation,
          steps: questions.steps,
          isCalc: questions.isCalc,
          difficulty: questions.difficulty,
          sourceTitle: questions.sourceTitle,
          sourceReference: questions.sourceReference,
          sourceUrl: questions.sourceUrl,
          blueprintObjective: questions.blueprintObjective,
          reviewStatus: questions.reviewStatus,
          reviewedBy: questions.reviewedBy,
          reviewedAt: questions.reviewedAt,
        })
        .from(questions)
        .where(filter)
        .orderBy(questions.bankKey, questions.questionNum, questions.id)
        .limit(input.limit)
        .offset((input.page - 1) * input.limit),
        db.select({ total: count() }).from(questions).where(filter),
      ]);
      return { rows, total: Number(totals[0]?.total ?? 0), page: input.page, pageSize: input.limit };
    }),

  getQuestionGovernanceBanks: adminProcedure.query(async () => {
    const db = await getDb();
    if (!db) throw new Error("Database unavailable");
    return db.select({ bankKey: questions.bankKey, total: count() })
      .from(questions).groupBy(questions.bankKey).orderBy(questions.bankKey);
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
        .select({ bankKey: questions.bankKey, options: questions.options, correctIndex: questions.correctIndex, explanation: questions.explanation })
        .from(questions)
        .where(eq(questions.id, input.id))
        .limit(1);
      if (!existing) throw new Error("Question not found");
      if (input.reviewStatus === "approved") {
        let parsed: unknown;
        try { parsed = JSON.parse(existing.options); } catch { parsed = null; }
        if (!Array.isArray(parsed) || parsed.length !== 4 || !parsed.every(option => typeof option === "string" && option.trim()) || existing.correctIndex < 0 || existing.correctIndex >= 4 || !existing.explanation.trim()) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Question needs four valid answer options, a valid keyed answer and a rationale before approval." });
        }
      }

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
                AND ${questions.reviewStatus} NOT IN ('in_review', 'rejected')
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
        .select(purchaseReadColumns)
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
   * Report paid one-time sessions that need signed webhook replay or an
   * evidence-bound historical recovery review. This procedure never grants
   * learner access.
   */
  reconcilePurchases: adminProcedure
    .input(z.object({ hoursBack: z.number().int().min(1).max(168).default(48) }))
    .mutation(async ({ input }) => {
      const result = await runReconciliation(input.hoursBack);
      return {
        recovered: result.recovered,
        skipped: result.skipped,
        errors: result.errors,
        details: result.details,
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
   * Backfill subscription contact data and report purchase contact gaps.
   * Individual purchase records are written only by the signed Stripe webhook.
   * The purchase portion is deliberately read-only and safe to run repeatedly.
   */
  backfillContactInfo: adminProcedure
    .mutation(async () => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");
      const stripe = getStripe();

      const updated: { type: string; email: string; phone: string | null; name: string | null }[] = [];
      const purchaseContactReviews: { email: string; phone: string | null; name: string | null }[] = [];
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
        .select(purchaseReadColumns)
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
            purchaseContactReviews.push({ email: p.email, phone, name: customerName });
          }
        } catch (err: any) {
          errors.push(`purchase ${p.stripeSessionId}: ${err.message}`);
        }
      }

      return {
        updated: updated.length,
        errors,
        details: updated,
        purchaseContactReviews,
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

  /** Manual execution shares production isolation and the same durable run ledger. */
  runTriggerEngine: adminProcedure.mutation(async ({ ctx }) => {
    if (!managedJobHostAllowed(ctx.req.headers.host)) throw new TRPCError({ code: "FORBIDDEN", message: "Study email jobs are disabled on this host" });
    return await runManagedJob("study-triggers");
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
