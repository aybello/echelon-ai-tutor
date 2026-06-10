/**
 * Admin router — all procedures require role === 'admin'.
 * Provides read access to trial emails, waitlist signups, and question error reports.
 */
import { desc, eq } from "drizzle-orm";
import Stripe from "stripe";
import { z } from "zod";
import { questionErrorReports, trialEmails, waitlist, examResults, purchases, users, userFeedback, triggerLogs } from "../../drizzle/schema";
import { getDb } from "../db";
import { adminProcedure, router } from "../_core/trpc";
import { sendPurchaseConfirmationEmail } from "../email";
import { PRODUCT_STUDY_PATHS } from "../stripe/products";
import { runTriggerEngine } from "../jobs/triggerEngine";
import { runSubscriptionReconciliation } from "../jobs/reconcile";

function getStripe() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error("STRIPE_SECRET_KEY not set");
  return new Stripe(key, { apiVersion: "2024-12-18.acacia" as any });
}

export const adminRouter = router({
  /** Summary counts for the dashboard header */
  stats: adminProcedure.query(async () => {
    const db = await getDb();
    if (!db) throw new Error("Database unavailable");
    const [trials, waitlistRows, errors, scores, purchaseRows, feedbackRows] = await Promise.all([
      db.select().from(trialEmails),
      db.select().from(waitlist),
      db.select().from(questionErrorReports),
      db.select().from(examResults),
      db.select().from(purchases),
      db.select().from(userFeedback),
    ]);
    const totalRevenueCents = purchaseRows.reduce((acc, p) => acc + p.amountCAD, 0);
    const avgRating = feedbackRows.length > 0
      ? feedbackRows.reduce((acc, f) => acc + f.rating, 0) / feedbackRows.length
      : 0;
    return {
      trialCount: trials.length,
      waitlistCount: waitlistRows.length,
      errorCount: errors.length,
      scoreCount: scores.length,
      purchaseCount: purchaseRows.length,
      totalRevenueCAD: totalRevenueCents / 100,
      feedbackCount: feedbackRows.length,
      avgRating: Math.round(avgRating * 10) / 10,
      triggerCount: (await db.select().from(triggerLogs)).length,
    };
  }),

  /** Paginated list of purchases, newest first */
  getPurchases: adminProcedure
    .input(z.object({ limit: z.number().int().min(1).max(500).default(200) }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");
      return db
        .select()
        .from(purchases)
        .orderBy(desc(purchases.createdAt))
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
          console.log(`[reconcile] Recovered missing purchase: ${email} → ${productKey} (${session.id})`);
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

    // 5. Recent purchases (last 24h)
    let recentPurchases: { email: string; productKey: string; amountCAD: number; createdAt: Date | string }[] = [];
    try {
      const db = await getDb();
      if (db) {
        const cutoff = new Date(now - 24 * 60 * 60 * 1000);
        const rows = await db
          .select({ email: purchases.email, productKey: purchases.productKey, amountCAD: purchases.amountCAD, createdAt: purchases.createdAt })
          .from(purchases)
          .orderBy(desc(purchases.createdAt))
          .limit(20);
        recentPurchases = rows.filter(r => new Date(r.createdAt) >= cutoff);
        const label = recentPurchases.length > 0
          ? `${recentPurchases.length} purchase(s) in last 24h`
          : "No purchases in last 24h";
        checks.push({ name: "Recent Purchases (24h)", status: "ok", detail: label });
      }
    } catch (err: any) {
      checks.push({ name: "Recent Purchases (24h)", status: "warn", detail: err.message });
    }

    return { checks, recentPurchases, timestamp: new Date() };
  }),
});
