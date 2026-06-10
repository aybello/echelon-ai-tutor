/**
 * orgRouter — manager-scoped procedures for the Echelon for Teams dashboard.
 *
 * Authorization: every procedure uses requireOrgManager middleware, which reads
 * ctx.studentEmail (already verified + normalized by context.ts) and resolves it
 * to a manager membership row. The orgId is derived server-side — it is NEVER
 * accepted as client input.
 *
 * Seat lifecycle (Decision 2 from spec):
 *   Assign: insert organization_members row + upsert subscriptions row (orgId set,
 *           stripeSubscriptionId null, tier = all-access, province = org province).
 *   Revoke: set member status = 'revoked' + set subscription status = 'expired'.
 *   Access flows through the existing resolveAccess / resolveAccessByEmail stack
 *   with zero changes to access.ts, quizRouter, or any PurchaseGate.
 */

import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { and, count, eq, gte, lt, sql } from "drizzle-orm";
import { publicProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import {
  organizations,
  organizationMembers,
  subscriptions,
  questionAttempts,
  examDates,
} from "../../drizzle/schema";
import { normalizeEmail } from "../_core/access";

// ── Constants ────────────────────────────────────────────────────────────────

/** Operators with accuracy >= this threshold are "on track to pass" */
const ON_TRACK_THRESHOLD = 75;

/** Operators with accuracy < this are "behind" */
const BEHIND_THRESHOLD = 40;

/** Days before exam that triggers "at risk" attention */
const AT_RISK_EXAM_DAYS = 21;

/** Days since assignment with no attempts = "stalled (never started)" */
const STALLED_NEVER_STARTED_DAYS = 7;

/** Days since last activity = "stalled (inactive)" */
const STALLED_INACTIVE_DAYS = 14;

// ── requireOrgManager middleware ─────────────────────────────────────────────

/**
 * Resolves the manager's email from ctx.studentEmail (OTP session, already
 * verified by context.ts) and looks up their manager membership row.
 * Throws UNAUTHORIZED if no valid manager membership is found.
 * Returns the orgId and managerEmail attached to the context.
 */
async function resolveOrgManager(ctx: {
  user: { id: number; email?: string | null } | null;
  studentEmail?: string | null;
}): Promise<{ orgId: number; managerEmail: string }> {
  const email = ctx.studentEmail ?? ctx.user?.email ?? null;
  if (!email) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "Please sign in to access the team dashboard.",
    });
  }

  const db = await getDb();
  if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

  const normalised = normalizeEmail(email);

  // Find an active manager membership for this email
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
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "No manager account found for this email.",
    });
  }

  return { orgId: rows[0].orgId, managerEmail: normalised };
}

// ── Seat lifecycle helpers ────────────────────────────────────────────────────

/**
 * Grants a seat to an operator:
 *   1. Insert/update organization_members row (role=operator, status=assigned)
 *   2. Upsert subscriptions row (tier=all-access, province=org province, orgId=org.id,
 *      stripeSubscriptionId=null, status=active, currentPeriodEnd=org.termEnd)
 */
async function grantSeat(
  db: Awaited<ReturnType<typeof getDb>>,
  org: { id: number; province: string; termEnd: Date },
  email: string,
  role: "manager" | "operator" = "operator",
) {
  if (!db) throw new Error("Database unavailable");

  // Upsert member row — if previously revoked, re-activate
  const existingMember = await db
    .select({ id: organizationMembers.id, status: organizationMembers.status })
    .from(organizationMembers)
    .where(and(eq(organizationMembers.orgId, org.id), eq(organizationMembers.email, email)))
    .limit(1);

  if (existingMember.length > 0) {
    await db
      .update(organizationMembers)
      .set({ status: "assigned", revokedAt: null as any })
      .where(eq(organizationMembers.id, existingMember[0].id));
  } else {
    await db.insert(organizationMembers).values({
      orgId: org.id,
      email,
      role,
      status: "assigned",
    });
  }

  // Upsert subscription row for access
  const existingSub = await db
    .select({ id: subscriptions.id })
    .from(subscriptions)
    .where(and(eq(subscriptions.email, email), eq(subscriptions.orgId, org.id)))
    .limit(1);

  if (existingSub.length > 0) {
    await db
      .update(subscriptions)
      .set({
        status: "active",
        currentPeriodEnd: org.termEnd,
        tier: "all-access",
        province: org.province,
      })
      .where(eq(subscriptions.id, existingSub[0].id));
  } else {
    await db.insert(subscriptions).values({
      email,
      tier: "all-access",
      province: org.province,
      stripeSubscriptionId: null,
      stripeCustomerId: null,
      status: "active",
      currentPeriodStart: new Date(),
      currentPeriodEnd: org.termEnd,
      orgId: org.id,
    });
  }
}

/**
 * Revokes a seat:
 *   1. Set organization_members status = 'revoked', revokedAt = now
 *   2. Set subscriptions status = 'expired' for the org-managed row
 */
async function revokeSeat(
  db: Awaited<ReturnType<typeof getDb>>,
  orgId: number,
  email: string,
) {
  if (!db) throw new Error("Database unavailable");

  await db
    .update(organizationMembers)
    .set({ status: "revoked", revokedAt: new Date() })
    .where(
      and(
        eq(organizationMembers.orgId, orgId),
        eq(organizationMembers.email, email),
        eq(organizationMembers.role, "operator"),
      ),
    );

  await db
    .update(subscriptions)
    .set({ status: "expired" })
    .where(and(eq(subscriptions.email, email), eq(subscriptions.orgId, orgId)));
}

// ── Router ────────────────────────────────────────────────────────────────────

export const orgRouter = router({
  /**
   * getOrgOverview — four summary numbers for the dashboard header cards.
   * Seats assigned, active this week, average readiness, on track to pass.
   */
  getOrgOverview: publicProcedure.query(async ({ ctx }) => {
    const { orgId } = await resolveOrgManager(ctx);
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

    const org = await db
      .select()
      .from(organizations)
      .where(eq(organizations.id, orgId))
      .limit(1)
      .then(r => r[0]);
    if (!org) throw new TRPCError({ code: "NOT_FOUND", message: "Organization not found" });

    // Active operator members
    const activeMembers = await db
      .select({ email: organizationMembers.email })
      .from(organizationMembers)
      .where(
        and(
          eq(organizationMembers.orgId, orgId),
          eq(organizationMembers.role, "operator"),
          eq(organizationMembers.status, "assigned"),
        ),
      );

    const memberEmails = activeMembers.map(m => m.email);
    const seatsAssigned = memberEmails.length;

    if (seatsAssigned === 0) {
      return {
        orgName: org.name,
        seatsTotal: org.seatsTotal,
        seatsAssigned: 0,
        activeThisWeek: 0,
        avgReadiness: 0,
        onTrackCount: 0,
        province: org.province,
        termEnd: org.termEnd,
        status: org.status,
      };
    }

    const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    // Per-member accuracy and last-active
    const emailList = memberEmails.map(e => `'${e.replace(/'/g, "''")}'`).join(",");

    const [accuracyRows, activeRows] = await Promise.all([
      db
        .select({
          email: questionAttempts.studentEmail,
          total: sql<number>`COUNT(*)`,
          correct: sql<number>`SUM(CASE WHEN ${questionAttempts.correct} = 'yes' THEN 1 ELSE 0 END)`,
        })
        .from(questionAttempts)
        .where(sql`${questionAttempts.studentEmail} IN (${sql.raw(emailList)})`)
        .groupBy(questionAttempts.studentEmail),
      db
        .select({ email: questionAttempts.studentEmail })
        .from(questionAttempts)
        .where(
          and(
            sql`${questionAttempts.studentEmail} IN (${sql.raw(emailList)})`,
            gte(questionAttempts.createdAt, oneWeekAgo),
          ),
        )
        .groupBy(questionAttempts.studentEmail),
    ]);

    const accuracyByEmail = new Map(
      accuracyRows.map(r => [
        r.email,
        { total: Number(r.total), correct: Number(r.correct) },
      ]),
    );

    const activeEmails = new Set(activeRows.map(r => r.email));
    const activeThisWeek = activeEmails.size;

    // Compute per-member accuracy; members with no attempts count as 0 for avg
    let totalAccuracy = 0;
    let onTrackCount = 0;
    for (const email of memberEmails) {
      const stats = accuracyByEmail.get(email);
      const acc =
        stats && stats.total > 0
          ? Math.round((stats.correct / stats.total) * 100)
          : 0;
      totalAccuracy += acc;
      if (acc >= ON_TRACK_THRESHOLD) onTrackCount++;
    }

    const avgReadiness =
      seatsAssigned > 0 ? Math.round(totalAccuracy / seatsAssigned) : 0;

    return {
      orgName: org.name,
      seatsTotal: org.seatsTotal,
      seatsAssigned,
      activeThisWeek,
      avgReadiness,
      onTrackCount,
      province: org.province,
      termEnd: org.termEnd,
      status: org.status,
    };
  }),

  /**
   * listMembers — full operator roster with per-member stats.
   */
  listMembers: publicProcedure.query(async ({ ctx }) => {
    const { orgId } = await resolveOrgManager(ctx);
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

    const members = await db
      .select()
      .from(organizationMembers)
      .where(
        and(
          eq(organizationMembers.orgId, orgId),
          eq(organizationMembers.role, "operator"),
        ),
      );

    if (members.length === 0) return [];

    const emailList = members
      .map(m => `'${m.email.replace(/'/g, "''")}'`)
      .join(",");

    const [accuracyRows, lastActiveRows, examDateRows] = await Promise.all([
      db
        .select({
          email: questionAttempts.studentEmail,
          total: sql<number>`COUNT(*)`,
          correct: sql<number>`SUM(CASE WHEN ${questionAttempts.correct} = 'yes' THEN 1 ELSE 0 END)`,
        })
        .from(questionAttempts)
        .where(sql`${questionAttempts.studentEmail} IN (${sql.raw(emailList)})`)
        .groupBy(questionAttempts.studentEmail),
      db
        .select({
          email: questionAttempts.studentEmail,
          lastActive: sql<Date>`MAX(${questionAttempts.createdAt})`,
        })
        .from(questionAttempts)
        .where(sql`${questionAttempts.studentEmail} IN (${sql.raw(emailList)})`)
        .groupBy(questionAttempts.studentEmail),
      db
        .select({ email: examDates.email, examDate: examDates.examDate })
        .from(examDates)
        .where(sql`${examDates.email} IN (${sql.raw(emailList)})`),
    ]);

    const accuracyByEmail = new Map(
      accuracyRows.map(r => [
        r.email,
        { total: Number(r.total), correct: Number(r.correct) },
      ]),
    );
    const lastActiveByEmail = new Map(
      lastActiveRows.map(r => [r.email, r.lastActive]),
    );
    const examDateByEmail = new Map(
      examDateRows.map(r => [r.email, r.examDate]),
    );

    return members.map(m => {
      const stats = accuracyByEmail.get(m.email);
      const total = stats?.total ?? 0;
      const correct = stats?.correct ?? 0;
      const accuracy = total > 0 ? Math.round((correct / total) * 100) : null;
      const lastActive = lastActiveByEmail.get(m.email) ?? null;
      const examDate = examDateByEmail.get(m.email) ?? null;

      let operatorStatus: "not_started" | "behind" | "needs_focus" | "on_track" =
        "not_started";
      if (accuracy !== null) {
        if (accuracy >= ON_TRACK_THRESHOLD) operatorStatus = "on_track";
        else if (accuracy >= BEHIND_THRESHOLD) operatorStatus = "needs_focus";
        else operatorStatus = "behind";
      }

      return {
        id: m.id,
        email: m.email,
        status: m.status,
        assignedAt: m.assignedAt,
        revokedAt: m.revokedAt,
        accuracy,
        totalAttempts: total,
        lastActive,
        examDate,
        operatorStatus,
      };
    });
  }),

  /**
   * getAttention — early-warning list: at-risk-before-exam and stalled operators.
   */
  getAttention: publicProcedure.query(async ({ ctx }) => {
    const { orgId } = await resolveOrgManager(ctx);
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

    const members = await db
      .select()
      .from(organizationMembers)
      .where(
        and(
          eq(organizationMembers.orgId, orgId),
          eq(organizationMembers.role, "operator"),
          eq(organizationMembers.status, "assigned"),
        ),
      );

    if (members.length === 0) return { atRisk: [], stalled: [] };

    const emailList = members
      .map(m => `'${m.email.replace(/'/g, "''")}'`)
      .join(",");

    const now = new Date();
    const atRiskCutoff = new Date(now.getTime() + AT_RISK_EXAM_DAYS * 24 * 60 * 60 * 1000);
    const stalledNeverStartedCutoff = new Date(
      now.getTime() - STALLED_NEVER_STARTED_DAYS * 24 * 60 * 60 * 1000,
    );
    const stalledInactiveCutoff = new Date(
      now.getTime() - STALLED_INACTIVE_DAYS * 24 * 60 * 60 * 1000,
    );

    const [accuracyRows, lastActiveRows, examDateRows] = await Promise.all([
      db
        .select({
          email: questionAttempts.studentEmail,
          total: sql<number>`COUNT(*)`,
          correct: sql<number>`SUM(CASE WHEN ${questionAttempts.correct} = 'yes' THEN 1 ELSE 0 END)`,
        })
        .from(questionAttempts)
        .where(sql`${questionAttempts.studentEmail} IN (${sql.raw(emailList)})`)
        .groupBy(questionAttempts.studentEmail),
      db
        .select({
          email: questionAttempts.studentEmail,
          lastActive: sql<Date>`MAX(${questionAttempts.createdAt})`,
        })
        .from(questionAttempts)
        .where(sql`${questionAttempts.studentEmail} IN (${sql.raw(emailList)})`)
        .groupBy(questionAttempts.studentEmail),
      db
        .select({ email: examDates.email, examDate: examDates.examDate })
        .from(examDates)
        .where(
          and(
            sql`${examDates.email} IN (${sql.raw(emailList)})`,
            lt(examDates.examDate, atRiskCutoff),
            gte(examDates.examDate, now),
          ),
        ),
    ]);

    const accuracyByEmail = new Map(
      accuracyRows.map(r => [
        r.email,
        { total: Number(r.total), correct: Number(r.correct) },
      ]),
    );
    const lastActiveByEmail = new Map(
      lastActiveRows.map(r => [r.email, r.lastActive]),
    );
    const upcomingExamByEmail = new Map(
      examDateRows.map(r => [r.email, r.examDate]),
    );

    const atRisk: Array<{
      email: string;
      accuracy: number;
      examDate: Date;
      daysUntilExam: number;
    }> = [];

    const stalled: Array<{
      email: string;
      reason: "never_started" | "inactive";
      daysSinceActivity: number | null;
    }> = [];

    for (const m of members) {
      const stats = accuracyByEmail.get(m.email);
      const total = stats?.total ?? 0;
      const correct = stats?.correct ?? 0;
      const accuracy = total > 0 ? Math.round((correct / total) * 100) : 0;
      const lastActive = lastActiveByEmail.get(m.email) ?? null;
      const examDate = upcomingExamByEmail.get(m.email) ?? null;

      // At risk: exam within 21 days AND accuracy below threshold
      if (examDate && accuracy < ON_TRACK_THRESHOLD) {
        const daysUntilExam = Math.ceil(
          (examDate.getTime() - now.getTime()) / (24 * 60 * 60 * 1000),
        );
        atRisk.push({ email: m.email, accuracy, examDate, daysUntilExam });
      }

      // Stalled: never started (assigned 7+ days ago, no attempts)
      if (total === 0 && m.assignedAt <= stalledNeverStartedCutoff) {
        stalled.push({ email: m.email, reason: "never_started", daysSinceActivity: null });
        continue;
      }

      // Stalled: inactive 14+ days
      if (lastActive && lastActive <= stalledInactiveCutoff) {
        const daysSinceActivity = Math.floor(
          (now.getTime() - lastActive.getTime()) / (24 * 60 * 60 * 1000),
        );
        stalled.push({ email: m.email, reason: "inactive", daysSinceActivity });
      }
    }

    return { atRisk, stalled };
  }),

  /**
   * assignSeat — assign a single seat to an operator email.
   * Enforces seat cap: active operators must be < seatsTotal.
   */
  assignSeat: publicProcedure
    .input(z.object({ email: z.string().email() }))
    .mutation(async ({ input, ctx }) => {
      const { orgId } = await resolveOrgManager(ctx);
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

      const org = await db
        .select()
        .from(organizations)
        .where(eq(organizations.id, orgId))
        .limit(1)
        .then(r => r[0]);
      if (!org) throw new TRPCError({ code: "NOT_FOUND", message: "Organization not found" });

      const email = normalizeEmail(input.email);

      // Seat cap check
      const [{ cnt }] = await db
        .select({ cnt: count() })
        .from(organizationMembers)
        .where(
          and(
            eq(organizationMembers.orgId, orgId),
            eq(organizationMembers.role, "operator"),
            eq(organizationMembers.status, "assigned"),
          ),
        );

      if (Number(cnt) >= org.seatsTotal) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `Seat limit reached (${org.seatsTotal} seats). Add more seats to assign additional operators.`,
        });
      }

      await grantSeat(db, org, email, "operator");
      return { success: true, email };
    }),

  /**
   * assignSeats — bulk assign seats to a list of operator emails.
   * Enforces seat cap across the entire batch before assigning any.
   */
  assignSeats: publicProcedure
    .input(z.object({ emails: z.array(z.string().email()).min(1).max(100) }))
    .mutation(async ({ input, ctx }) => {
      const { orgId } = await resolveOrgManager(ctx);
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

      const org = await db
        .select()
        .from(organizations)
        .where(eq(organizations.id, orgId))
        .limit(1)
        .then(r => r[0]);
      if (!org) throw new TRPCError({ code: "NOT_FOUND", message: "Organization not found" });

      const emails = input.emails.map(normalizeEmail);
      const uniqueEmails = Array.from(new Set(emails));

      // Seat cap check
      const [{ cnt }] = await db
        .select({ cnt: count() })
        .from(organizationMembers)
        .where(
          and(
            eq(organizationMembers.orgId, orgId),
            eq(organizationMembers.role, "operator"),
            eq(organizationMembers.status, "assigned"),
          ),
        );

      const currentActive = Number(cnt);
      // Count how many of these emails are already active (won't consume a new seat)
      const emailListSql = uniqueEmails.map(e => `'${e.replace(/'/g, "''")}'`).join(",");
      const alreadyActive = await db
        .select({ email: organizationMembers.email })
        .from(organizationMembers)
        .where(
          and(
            eq(organizationMembers.orgId, orgId),
            eq(organizationMembers.role, "operator"),
            eq(organizationMembers.status, "assigned"),
            sql`${organizationMembers.email} IN (${sql.raw(emailListSql)})`,
          ),
        );
      const alreadyActiveSet = new Set(alreadyActive.map(r => r.email));
      const newSeatsNeeded = uniqueEmails.filter(e => !alreadyActiveSet.has(e)).length;

      if (currentActive + newSeatsNeeded > org.seatsTotal) {
        const available = org.seatsTotal - currentActive;
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `Not enough seats. You have ${available} seat${available === 1 ? "" : "s"} available but are trying to assign ${newSeatsNeeded} new operator${newSeatsNeeded === 1 ? "" : "s"}. Add more seats first.`,
        });
      }

      const results: Array<{ email: string; success: boolean; error?: string }> = [];
      for (const email of uniqueEmails) {
        try {
          await grantSeat(db, org, email, "operator");
          results.push({ email, success: true });
        } catch (err: any) {
          results.push({ email, success: false, error: err.message });
        }
      }

      return { results };
    }),

  /**
   * revokeSeat — revoke a seat from an operator.
   * Sets member status = revoked and subscription status = expired.
   */
  revokeSeat: publicProcedure
    .input(z.object({ email: z.string().email() }))
    .mutation(async ({ input, ctx }) => {
      const { orgId } = await resolveOrgManager(ctx);
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

      const email = normalizeEmail(input.email);
      await revokeSeat(db, orgId, email);
      return { success: true, email };
    }),
});

// Export helpers for use in webhook and admin router
export { grantSeat, revokeSeat };
