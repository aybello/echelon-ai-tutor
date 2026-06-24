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
import { and, count, eq, gte, inArray, lt, sql } from "drizzle-orm";
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
import { sendTeamEnrollmentEmail } from "../email";
import { courseKeyToTier, courseKeyToLabel, getUnlockedExamTypes } from "../../shared/products";

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
 *   2. Upsert one subscriptions row per course key (tier derived from courseKey or all-access,
 *      province=org province, orgId=org.id, status=active, currentPeriodEnd=org.termEnd)
 *
 * courseKeys: array of course keys to assign. If empty/undefined, falls back to all-access.
 * courseKey (singular): kept for backward compat — treated as courseKeys[0] if courseKeys not set.
 */
async function grantSeat(
  db: Awaited<ReturnType<typeof getDb>>,
  org: { id: number; province: string; termEnd: Date; name: string },
  email: string,
  role: "manager" | "operator" = "operator",
  managerEmail?: string,
  name?: string,
  courseKey?: string,
  courseKeys?: string[],
) {
  if (!db) throw new Error("Database unavailable");

  // Resolve the canonical list of course keys
  const resolvedKeys: string[] = courseKeys && courseKeys.length > 0
    ? courseKeys
    : courseKey ? [courseKey] : [];

  // Primary course key for backward-compat fields
  const primaryCourseKey = resolvedKeys[0] ?? null;

  // Upsert member row — if previously revoked, re-activate
  const existingMember = await db
    .select({ id: organizationMembers.id, status: organizationMembers.status })
    .from(organizationMembers)
    .where(and(eq(organizationMembers.orgId, org.id), eq(organizationMembers.email, email)))
    .limit(1);

  const isNewMember = existingMember.length === 0;
  const wasRevoked = existingMember.length > 0 && existingMember[0].status === "revoked";

  const courseKeysJson = resolvedKeys.length > 0 ? JSON.stringify(resolvedKeys) : null;

  if (existingMember.length > 0) {
    await db
      .update(organizationMembers)
      .set({
        status: "assigned",
        revokedAt: null as any,
        ...(name !== undefined ? { name } : {}),
        ...(primaryCourseKey !== null ? { courseKey: primaryCourseKey } : {}),
        courseKeys: courseKeysJson,
      })
      .where(eq(organizationMembers.id, existingMember[0].id));
  } else {
    await db.insert(organizationMembers).values({
      orgId: org.id,
      email,
      name: name ?? null,
      role,
      status: "assigned",
      courseKey: primaryCourseKey,
      courseKeys: courseKeysJson,
    });
  }

  // Upsert one subscription row per course key.
  // If no course keys, upsert a single all-access row (legacy behaviour).
  const coursesToUpsert = resolvedKeys.length > 0 ? resolvedKeys : [null];

  for (const ck of coursesToUpsert) {
    const tier = ck ? courseKeyToTier(ck, org.province) : "all-access";
    // Unique sentinel: org-{orgId}-{email}-{courseKey|all}
    const orgSubId = `org-${org.id}-${email}-${ck ?? "all"}`;

    const existingSub = await db
      .select({ id: subscriptions.id })
      .from(subscriptions)
      .where(
        and(
          eq(subscriptions.email, email),
          eq(subscriptions.orgId, org.id),
          eq(subscriptions.stripeSubscriptionId, orgSubId),
        ),
      )
      .limit(1);

    if (existingSub.length > 0) {
      await db
        .update(subscriptions)
        .set({
          status: "active",
          currentPeriodEnd: org.termEnd,
          tier: tier as any,
          province: org.province,
        })
        .where(eq(subscriptions.id, existingSub[0].id));
    } else {
      await db.insert(subscriptions).values({
        email,
        tier: tier as any,
        province: org.province,
        stripeSubscriptionId: orgSubId,
        stripeCustomerId: "",
        status: "active",
        currentPeriodStart: new Date(),
        currentPeriodEnd: org.termEnd,
        orgId: org.id,
      });
    }
  }

  // Send enrollment email to new operators (or re-activated ones)
  // Fire-and-forget — don't block the seat assignment if email fails
  if (role === "operator" && (isNewMember || wasRevoked)) {
    const origin = process.env.FRONTEND_URL ?? "https://echeloninstitute.ca";
    const loginUrl = `${origin}/dashboard/login`;
    const supportEmail = process.env.SUPPORT_EMAIL ?? "support@echeloninstitute.ca";
    const courseName = primaryCourseKey ? courseKeyToLabel(primaryCourseKey, org.province) : undefined;
    sendTeamEnrollmentEmail({
      email,
      orgName: org.name,
      managerEmail: managerEmail ?? supportEmail,
      loginUrl,
      courseName,
    }).catch(err => {
      console.error(`[Team Enrollment Email] Failed to send to ${email}:`, err);
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
        termStart: org.createdAt,
        termEnd: org.termEnd,
        status: org.status,
        billingType: org.billingType,
        stripeSubscriptionId: org.stripeSubscriptionId,
      };
    }

    const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    // Bug fix: replaced sql.raw(emailList) with inArray() to prevent SQL injection
    const [accuracyRows, activeRows] = await Promise.all([
      db
        .select({
          email: questionAttempts.studentEmail,
          total: sql<number>`COUNT(*)`,
          correct: sql<number>`SUM(CASE WHEN ${questionAttempts.correct} = 'yes' THEN 1 ELSE 0 END)`,
        })
        .from(questionAttempts)
        .where(inArray(questionAttempts.studentEmail, memberEmails))
        .groupBy(questionAttempts.studentEmail),
      db
        .select({ email: questionAttempts.studentEmail })
        .from(questionAttempts)
        .where(
          and(
            inArray(questionAttempts.studentEmail, memberEmails),
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
      termStart: org.createdAt,
      termEnd: org.termEnd,
      status: org.status,
      billingType: org.billingType,
      stripeSubscriptionId: org.stripeSubscriptionId,
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

    const memberEmails = members.map(m => m.email);

        // Bug fix: replaced sql.raw(emailList) with inArray() to prevent SQL injection
    const [accuracyRows, lastActiveRows, examDateRows, perCourseRows] = await Promise.all([
      db
        .select({
          email: questionAttempts.studentEmail,
          total: sql<number>`COUNT(*)`,
          correct: sql<number>`SUM(CASE WHEN ${questionAttempts.correct} = 'yes' THEN 1 ELSE 0 END)`,
        })
        .from(questionAttempts)
        .where(inArray(questionAttempts.studentEmail, memberEmails))
        .groupBy(questionAttempts.studentEmail),
      db
        .select({
          email: questionAttempts.studentEmail,
          lastActive: sql<Date>`MAX(${questionAttempts.createdAt})`,
        })
        .from(questionAttempts)
        .where(inArray(questionAttempts.studentEmail, memberEmails))
        .groupBy(questionAttempts.studentEmail),
      db
        .select({ email: examDates.email, examDate: examDates.examDate })
        .from(examDates)
        .where(inArray(examDates.email, memberEmails)),
      // Per-course accuracy: group by email + examType
      db
        .select({
          email: questionAttempts.studentEmail,
          examType: questionAttempts.examType,
          total: sql<number>`COUNT(*)`,
          correct: sql<number>`SUM(CASE WHEN ${questionAttempts.correct} = 'yes' THEN 1 ELSE 0 END)`,
        })
        .from(questionAttempts)
        .where(inArray(questionAttempts.studentEmail, memberEmails))
        .groupBy(questionAttempts.studentEmail, questionAttempts.examType),
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
    // Build per-email, per-examType accuracy map
    const perCourseByEmail = new Map<string, Map<string, { total: number; correct: number }>>();
    for (const r of perCourseRows) {
      if (!r.email) continue;
      if (!perCourseByEmail.has(r.email)) perCourseByEmail.set(r.email, new Map());
      perCourseByEmail.get(r.email)!.set(r.examType, { total: Number(r.total), correct: Number(r.correct) });
    }

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

      // Parse courseKeys JSON; fall back to [courseKey] for legacy rows
      let courseKeys: string[] = [];
      if (m.courseKeys) {
        try { courseKeys = JSON.parse(m.courseKeys as string); } catch { courseKeys = []; }
      } else if (m.courseKey) {
        courseKeys = [m.courseKey];
      }

      // Per-course progress breakdown
      const emailCourseMap = perCourseByEmail.get(m.email);
      const courseProgress = courseKeys.map(ck => {
        const examTypes = getUnlockedExamTypes(ck);
        // Aggregate attempts across all examTypes for this courseKey
        let cTotal = 0, cCorrect = 0;
        for (const et of examTypes) {
          const s = emailCourseMap?.get(et);
          if (s) { cTotal += s.total; cCorrect += s.correct; }
        }
        const cAccuracy = cTotal > 0 ? Math.round((cCorrect / cTotal) * 100) : null;
        let cStatus: "not_started" | "behind" | "needs_focus" | "on_track" = "not_started";
        if (cAccuracy !== null) {
          if (cAccuracy >= ON_TRACK_THRESHOLD) cStatus = "on_track";
          else if (cAccuracy >= BEHIND_THRESHOLD) cStatus = "needs_focus";
          else cStatus = "behind";
        }
        return { courseKey: ck, accuracy: cAccuracy, totalAttempts: cTotal, status: cStatus };
      });

      return {
        id: m.id,
        email: m.email,
        name: m.name ?? null,
        status: m.status,
        assignedAt: m.assignedAt,
        revokedAt: m.revokedAt,
        courseKey: m.courseKey ?? null,
        courseKeys,
        courseProgress,
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

    const memberEmails = members.map(m => m.email);

    const now = new Date();
    const atRiskCutoff = new Date(now.getTime() + AT_RISK_EXAM_DAYS * 24 * 60 * 60 * 1000);
    const stalledNeverStartedCutoff = new Date(
      now.getTime() - STALLED_NEVER_STARTED_DAYS * 24 * 60 * 60 * 1000,
    );
    const stalledInactiveCutoff = new Date(
      now.getTime() - STALLED_INACTIVE_DAYS * 24 * 60 * 60 * 1000,
    );

    // Bug fix: replaced sql.raw(emailList) with inArray() to prevent SQL injection
    const [accuracyRows, lastActiveRows, examDateRows] = await Promise.all([
      db
        .select({
          email: questionAttempts.studentEmail,
          total: sql<number>`COUNT(*)`,
          correct: sql<number>`SUM(CASE WHEN ${questionAttempts.correct} = 'yes' THEN 1 ELSE 0 END)`,
        })
        .from(questionAttempts)
        .where(inArray(questionAttempts.studentEmail, memberEmails))
        .groupBy(questionAttempts.studentEmail),
      db
        .select({
          email: questionAttempts.studentEmail,
          lastActive: sql<Date>`MAX(${questionAttempts.createdAt})`,
        })
        .from(questionAttempts)
        .where(inArray(questionAttempts.studentEmail, memberEmails))
        .groupBy(questionAttempts.studentEmail),
      db
        .select({ email: examDates.email, examDate: examDates.examDate })
        .from(examDates)
        .where(
          and(
            inArray(examDates.email, memberEmails),
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
   * Supports multiple courses via courseKeys array.
   */
  assignSeat: publicProcedure
    .input(z.object({
      email: z.string().email(),
      name: z.string().max(200).optional(),
      courseKey: z.string().max(64).optional(),
      courseKeys: z.array(z.string().max(64)).max(10).optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const { orgId, managerEmail } = await resolveOrgManager(ctx);
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
      const name = input.name?.trim() || undefined;

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

      await grantSeat(db, org, email, "operator", managerEmail, name, input.courseKey, input.courseKeys);
      return { success: true, email };
    }),

  /**
   * updateSeatCourses — update the courses assigned to a seat (supports multiple).
   * Replaces all existing org-managed subscriptions for this operator with new ones.
   * Does NOT reset the term expiry — the year started at assignment.
   */
  updateSeatCourse: publicProcedure
    .input(z.object({
      email: z.string().email(),
      courseKey: z.string().max(64).optional(),
      courseKeys: z.array(z.string().max(64)).max(10).optional(),
    }))
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

      // Verify this email belongs to this org
      const member = await db
        .select({ id: organizationMembers.id, status: organizationMembers.status })
        .from(organizationMembers)
        .where(
          and(
            eq(organizationMembers.orgId, orgId),
            eq(organizationMembers.email, email),
            eq(organizationMembers.role, "operator"),
          ),
        )
        .limit(1)
        .then(r => r[0]);

      if (!member) throw new TRPCError({ code: "NOT_FOUND", message: "Seat not found" });

      // Resolve canonical list
      const resolvedKeys: string[] = input.courseKeys && input.courseKeys.length > 0
        ? input.courseKeys
        : input.courseKey ? [input.courseKey] : [];
      const primaryCourseKey = resolvedKeys[0] ?? null;
      const courseKeysJson = resolvedKeys.length > 0 ? JSON.stringify(resolvedKeys) : null;

      // Update member row
      await db
        .update(organizationMembers)
        .set({
          courseKey: primaryCourseKey,
          courseKeys: courseKeysJson,
        })
        .where(eq(organizationMembers.id, member.id));

      // Expire all existing org-managed subscriptions for this operator
      await db
        .update(subscriptions)
        .set({ status: "expired" })
        .where(
          and(
            eq(subscriptions.email, email),
            eq(subscriptions.orgId, orgId),
          ),
        );

      // Upsert one active subscription per new course key
      const coursesToUpsert = resolvedKeys.length > 0 ? resolvedKeys : [null];
      for (const ck of coursesToUpsert) {
        const tier = ck ? courseKeyToTier(ck, org.province) : "all-access";
        const orgSubId = `org-${org.id}-${email}-${ck ?? "all"}`;
        const existingSub = await db
          .select({ id: subscriptions.id })
          .from(subscriptions)
          .where(
            and(
              eq(subscriptions.email, email),
              eq(subscriptions.orgId, orgId),
              eq(subscriptions.stripeSubscriptionId, orgSubId),
            ),
          )
          .limit(1);
        if (existingSub.length > 0) {
          await db
            .update(subscriptions)
            .set({ status: "active", tier: tier as any, currentPeriodEnd: org.termEnd })
            .where(eq(subscriptions.id, existingSub[0].id));
        } else {
          await db.insert(subscriptions).values({
            email,
            tier: tier as any,
            province: org.province,
            stripeSubscriptionId: orgSubId,
            stripeCustomerId: "",
            status: "active",
            currentPeriodStart: new Date(),
            currentPeriodEnd: org.termEnd,
            orgId: org.id,
          });
        }
      }

      return { success: true };
    }),

  /**
   * assignSeats — bulk assign seats to a list of operator emails.
   * Enforces seat cap across the entire batch before assigning any.
   */
  assignSeats: publicProcedure
    .input(z.object({ emails: z.array(z.string().email()).min(1).max(100) }))
    .mutation(async ({ input, ctx }) => {
      const { orgId, managerEmail } = await resolveOrgManager(ctx);
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
      // Bug fix: replaced sql.raw(emailListSql) with inArray() to prevent SQL injection
      const alreadyActive = await db
        .select({ email: organizationMembers.email })
        .from(organizationMembers)
        .where(
          and(
            eq(organizationMembers.orgId, orgId),
            eq(organizationMembers.role, "operator"),
            eq(organizationMembers.status, "assigned"),
            inArray(organizationMembers.email, uniqueEmails),
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
          await grantSeat(db, org, email, "operator", managerEmail);
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
