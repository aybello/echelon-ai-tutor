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
 *           deterministic synthetic stripeSubscriptionId, tier = assigned course tier, province = org province).
 *   Revoke: set member status = 'revoked' + set subscription status = 'expired'.
 *   Access flows through the existing resolveAccess / resolveAccessByEmail stack
 *   with zero changes to access.ts, quizRouter, or any PurchaseGate.
 */

import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { and, count, desc, eq, gte, inArray, lt, sql } from "drizzle-orm";
import { randomBytes } from "crypto";
import { publicProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { computeManagerReadiness, MANAGER_READINESS_MODEL_VERSION } from "../_core/readiness";
import {
  organizations,
  organizationMembers,
  subscriptions,
  questionAttempts,
  examDates,
  commandRunHistory,
  users,
  examOutcomes,
  examResults,
  learnerOnboarding,
  diagnosticSessions,
} from "../../drizzle/schema";
import { organizationTermUsage } from "../../drizzle/schema";
import { normalizeEmail } from "../_core/access";
import { sendTeamEnrollmentEmail, sendOperatorStudyReminderEmail } from "../email";
import { courseKeyToTierStrict, isValidCourseKey } from "../../shared/products";
import { courseKeyToLabel, getExamTypesForCourseKey } from "../../shared/courseRegistry";
import { allowedCourseKeysForOrg, isSubscriptionProvince, isSubscriptionTier, validateOrgCourseKeys } from "../stripe/subscriptionProducts";
import { trackEvent } from "../analytics";

// ── Constants ────────────────────────────────────────────────────────────────

/** Operators with accuracy >= this threshold have strong study indicators. */
const ON_TRACK_THRESHOLD = 80;

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
 * Organisation statuses that still grant manager access to the team dashboard.
 * Mirrors ORG_ACCESS_STATUSES in _core/access.ts, which governs operator access
 * to study material — a cancelled organisation loses both, not just one.
 */
const MANAGER_ACCESS_STATUSES = new Set(["active", "past_due"]);

/** One contract year, in milliseconds. */
const ONE_TERM_MS = 365 * 24 * 60 * 60 * 1000;

/**
 * The single definition of when an organisation's current contract term began.
 *
 * organizations.termStart is nullable for rows created before Stripe started
 * reporting the period start. When it is null the term is taken to have begun
 * one year before it ends, matching the column's documented contract. Every
 * caller must use this helper: the licence ledger is keyed on (orgId, email,
 * termStart), so two callers disagreeing about the start date would read and
 * write different terms for the same organisation.
 */
function resolveTermStart(org: { termStart: Date | null; termEnd: Date }): Date {
  return org.termStart ?? new Date(org.termEnd.getTime() - ONE_TERM_MS);
}

/**
 * Resolves the manager's email from ctx.studentEmail (OTP session, already
 * verified by context.ts) and looks up their manager membership row.
 * Throws UNAUTHORIZED if no valid manager membership is found, or if the
 * organisation itself is no longer active.
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
    .orderBy(organizationMembers.orgId)
    .limit(1);

  if (rows.length === 0) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "No manager account found for this email.",
    });
  }

  const orgId = rows[0].orgId;

  // Lifecycle gate: manager access must expire on exactly the same terms as
  // operator access in _core/access.ts, which requires an eligible status AND
  // termEnd in the future. Without both checks a cancelled or lapsed account
  // could still assign seats, export the full team roster and send reminder
  // emails to operators who have themselves already lost access.
  //
  // Billing is deliberately not gated here: stripe.createBillingPortalSession
  // is reachable from /account, so a lapsed manager can always still renew.
  const [org] = await db
    .select({ status: organizations.status, termEnd: organizations.termEnd })
    .from(organizations)
    .where(eq(organizations.id, orgId))
    .limit(1);

  if (!org) {
    throw new TRPCError({ code: "UNAUTHORIZED", message: "No manager account found for this email." });
  }

  if (!MANAGER_ACCESS_STATUSES.has(org.status ?? "active")) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "This team subscription is no longer active. Renew from your account page to regain access to the team dashboard.",
    });
  }

  if (!org.termEnd || org.termEnd.getTime() <= Date.now()) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "This team contract term has ended. Renew from your account page to regain access to the team dashboard.",
    });
  }

  return { orgId, managerEmail: normalised };
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
  org: { id: number; province: string; termEnd: Date; termStart?: Date | null; name: string; tier: string },
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

  // Shared entitlement validator — enforces: non-empty for operators, province validity, stream tier
  const validatedKeys = validateOrgCourseKeys(resolvedKeys, org.tier, org.province, role);

  // Primary course key for backward-compat fields
  const primaryCourseKey = validatedKeys[0] ?? null;

  // Upsert member row — if previously revoked, re-activate
  const existingMember = await db
    .select({ id: organizationMembers.id, status: organizationMembers.status })
    .from(organizationMembers)
    .where(and(eq(organizationMembers.orgId, org.id), eq(organizationMembers.email, email)))
    .limit(1);

  const isNewMember = existingMember.length === 0;
  const wasRevoked = existingMember.length > 0 && existingMember[0].status === "revoked";

  const courseKeysJson = validatedKeys.length > 0 ? JSON.stringify(validatedKeys) : null;

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
  // No empty-course fallback: operators must have at least one validated course key.
  const coursesToUpsert = validatedKeys.length > 0 ? validatedKeys : [];
  if (coursesToUpsert.length === 0 && role === "operator") {
    throw new Error("Select at least one course included in your team plan.");
  }
  if (!isSubscriptionProvince(org.province)) {
    throw new Error("Organization province is not supported for subscription access.");
  }
  const subscriptionProvince = org.province;

  for (const ck of coursesToUpsert) {
    const tier = courseKeyToTierStrict(ck, org.province);
    if (!isSubscriptionTier(tier)) {
      throw new Error(`Could not resolve a valid subscription tier for ${ck}.`);
    }
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
          tier,
          province: subscriptionProvince,
        })
        .where(eq(subscriptions.id, existingSub[0].id));
    } else {
      await db.insert(subscriptions).values({
        email,
        tier,
        province: subscriptionProvince,
        stripeSubscriptionId: orgSubId,
        stripeCustomerId: "",
        status: "active",
        currentPeriodStart: new Date(),
        currentPeriodEnd: org.termEnd,
        orgId: org.id,
      });
    }
  }

  if (role === "operator") {
    await trackEvent("team_seat_assigned", {
      email,
      examType: primaryCourseKey,
      orgId: org.id,
      extra: { courseKeys: validatedKeys, reactivated: wasRevoked },
    });
  }

  // Note: annual licence usage is recorded by consumeOrReuseAnnualLicence BEFORE grantSeat is called.
  // grantSeat no longer inserts into organizationTermUsage directly.

  // Send enrollment email to new operators (or re-activated ones)
  // Fire-and-forget — don't block the seat assignment if email fails
  if (role === "operator" && (isNewMember || wasRevoked)) {
    const origin = process.env.FRONTEND_URL ?? "https://echeloninstitute.ca";
    const loginUrl = `${origin}/login`;
    const supportEmail = process.env.SUPPORT_EMAIL ?? "abello@echeloninstitute.ca";
    // Build course label: list all assigned courses, not just the primary one
    const courseName = validatedKeys.length > 1
      ? validatedKeys.map(k => courseKeyToLabel(k, org.province)).join(" & ")
      : primaryCourseKey ? courseKeyToLabel(primaryCourseKey, org.province) : undefined;
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

  await trackEvent("team_seat_revoked", { email, orgId });
}

// ── Annual licence allocation ─────────────────────────────────────────────────

/**
 * Consumes or reuses an annual licence for an operator within a transaction.
 * Uses a pessimistic FOR UPDATE lock on the organization row to prevent concurrent oversubscription.
 * Must be called inside a database transaction.
 */
async function consumeOrReuseAnnualLicence(
  tx: any,
  org: { id: number; seatsTotal: number; termStart: Date | null; termEnd: Date },
  rawEmail: string,
): Promise<{ alreadyCounted: boolean; used: number; remaining: number }> {
  const email = normalizeEmail(rawEmail);

  if (!org.termEnd) {
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Organization contract term is not configured.",
    });
  }

  const termStart = resolveTermStart(org);

  // Pessimistic lock: serialize licence allocation for this organization
  await tx.execute(sql`SELECT id FROM organizations WHERE id = ${org.id} FOR UPDATE`);

  // Check if this email is already counted in the current term
  const existingUsage = await tx
    .select({ id: organizationTermUsage.id })
    .from(organizationTermUsage)
    .where(
      and(
        eq(organizationTermUsage.orgId, org.id),
        eq(organizationTermUsage.memberEmail, email),
        eq(organizationTermUsage.termStart, termStart),
      ),
    )
    .limit(1);

  // Count total usage for this term
  const [{ usageCount }] = await tx
    .select({ usageCount: sql<number>`COUNT(*)` })
    .from(organizationTermUsage)
    .where(
      and(
        eq(organizationTermUsage.orgId, org.id),
        eq(organizationTermUsage.termStart, termStart),
      ),
    );

  const used = Number(usageCount);

  if (existingUsage.length > 0) {
    // Reactivation — already counted this term, no new licence consumed
    return { alreadyCounted: true, used, remaining: Math.max(0, org.seatsTotal - used) };
  }

  // New operator — enforce cap before inserting
  if (used >= org.seatsTotal) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message:
        `Annual operator licence limit reached. ` +
        `${used} of ${org.seatsTotal} licences have already been used this term.`,
    });
  }

  await tx.insert(organizationTermUsage).values({
    orgId: org.id,
    memberEmail: email,
    termStart,
    termEnd: org.termEnd,
  });

  return { alreadyCounted: false, used: used + 1, remaining: Math.max(0, org.seatsTotal - used - 1) };
}

// ── Router ────────────────────────────────────────────────────────────────────

export const orgRouter = router({
  /**
   * getOrgOverview — four summary numbers for the dashboard header cards.
   * Seats assigned, active this week, average study indicator, strong indicators.
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
      .select({ id: organizationMembers.id, email: organizationMembers.email })
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

    // Count licences used this term from the annual usage ledger
    const orgTermStart = resolveTermStart(org);
    const [{ termCnt }] = await db
      .select({ termCnt: sql<number>`COUNT(*)` })
      .from(organizationTermUsage)
      .where(
        and(
          eq(organizationTermUsage.orgId, orgId),
          eq(organizationTermUsage.termStart, orgTermStart),
        ),
      );
    const seatsUsedThisTerm = Number(termCnt);

    if (seatsAssigned === 0) {
      return {
      orgId: org.id,
        orgName: org.name,
        seatsTotal: org.seatsTotal,
        seatsAssigned: 0,
        seatsUsedThisTerm,
        activeThisWeek: 0,
        avgReadiness: 0,
        onTrackCount: 0,
        province: org.province,
        tier: org.tier,
        allowedCourseKeys: allowedCourseKeysForOrg(org.tier, org.province),
        termStart: resolveTermStart(org),
        termEnd: org.termEnd,
        status: org.status,
        billingType: org.billingType,
        stripeSubscriptionId: org.stripeSubscriptionId,
      };
    }

    const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    // Phase 8: scope by orgId instead of email to prevent cross-org data leakage
    const [accuracyRows, activeRows, mockRows] = await Promise.all([
      db
        .select({
          memberId: questionAttempts.organizationMemberId,
          total: sql<number>`COUNT(*)`,
          correct: sql<number>`SUM(CASE WHEN ${questionAttempts.correct} = 'yes' THEN 1 ELSE 0 END)`,
          lastActive: sql<Date | null>`MAX(${questionAttempts.createdAt})`,
        })
        .from(questionAttempts)
        .where(eq(questionAttempts.orgId, orgId))
        .groupBy(questionAttempts.organizationMemberId),
      db
        .select({ memberId: questionAttempts.organizationMemberId })
        .from(questionAttempts)
        .where(
          and(
            eq(questionAttempts.orgId, orgId),
            gte(questionAttempts.createdAt, oneWeekAgo),
          ),
        )
        .groupBy(questionAttempts.organizationMemberId),
      db
        .select({
          memberId: examResults.organizationMemberId,
          count: sql<number>`COUNT(*)`,
        })
        .from(examResults)
        .where(eq(examResults.orgId, orgId))
        .groupBy(examResults.organizationMemberId),
    ]);

    const accuracyByMemberId = new Map(
      accuracyRows
        .filter(r => r.memberId !== null)
        .map(r => [Number(r.memberId), {
          total: Number(r.total),
          correct: Number(r.correct),
          lastActive: r.lastActive ? new Date(r.lastActive) : null,
        }]),
    );
    const mockCountByMemberId = new Map(
      mockRows
        .filter(r => r.memberId !== null)
        .map(r => [Number(r.memberId), Number(r.count)]),
    );
    const activeMemberIds = new Set(activeRows.filter(r => r.memberId !== null).map(r => Number(r.memberId)));
    const activeThisWeek = activeMemberIds.size;
    // Compute the same reduced-input study estimate used throughout manager views.
    let totalReadiness = 0;
    let onTrackCount = 0;
    for (const m of activeMembers) {
      const stats = accuracyByMemberId.get(m.id);
      const totalAttempts = stats?.total ?? 0;
      const score = computeManagerReadiness({
        accuracy: totalAttempts > 0 ? (stats?.correct ?? 0) / totalAttempts : 0,
        totalAttempts,
        mockExamsCompleted: mockCountByMemberId.get(m.id) ?? 0,
        activeRecently: !!stats?.lastActive && stats.lastActive >= oneWeekAgo,
      });
      totalReadiness += score;
      if (score >= ON_TRACK_THRESHOLD) onTrackCount++;
    }

    const avgReadiness =
      seatsAssigned > 0 ? Math.round(totalReadiness / seatsAssigned) : 0;

    return {
      orgId: org.id,
      orgName: org.name,
      seatsTotal: org.seatsTotal,
      seatsAssigned,
      seatsUsedThisTerm,
      activeThisWeek,
      avgReadiness,
      onTrackCount,
      province: org.province,
      tier: org.tier,
      allowedCourseKeys: allowedCourseKeysForOrg(org.tier, org.province),
      termStart: resolveTermStart(org),
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
          memberId: questionAttempts.organizationMemberId,
          total: sql<number>`COUNT(*)`,
          correct: sql<number>`SUM(CASE WHEN ${questionAttempts.correct} = 'yes' THEN 1 ELSE 0 END)`,
        })
        .from(questionAttempts)
        .where(eq(questionAttempts.orgId, orgId))
        .groupBy(questionAttempts.organizationMemberId),
      db
        .select({
          memberId: questionAttempts.organizationMemberId,
          lastActive: sql<Date>`MAX(${questionAttempts.createdAt})`,
        })
        .from(questionAttempts)
        .where(eq(questionAttempts.orgId, orgId))
        .groupBy(questionAttempts.organizationMemberId),
      db
        .select({ email: examDates.email, examDate: examDates.examDate })
        .from(examDates)
        .where(eq(examDates.orgId, orgId)),
      // Per-course accuracy: group by email + examType
      db
        .select({
          memberId: questionAttempts.organizationMemberId,
          examType: questionAttempts.examType,
          total: sql<number>`COUNT(*)`,
          correct: sql<number>`SUM(CASE WHEN ${questionAttempts.correct} = 'yes' THEN 1 ELSE 0 END)`,
        })
        .from(questionAttempts)
        .where(eq(questionAttempts.orgId, orgId))
        .groupBy(questionAttempts.organizationMemberId, questionAttempts.examType),
    ]);
    const accuracyByMemberId = new Map(
      accuracyRows
        .filter(r => r.memberId !== null)
        .map(r => [Number(r.memberId), { total: Number(r.total), correct: Number(r.correct) }]),
    );
    const lastActiveByMemberId = new Map(
      lastActiveRows.filter(r => r.memberId !== null).map(r => [Number(r.memberId), r.lastActive]),
    );
    const examDateByEmail = new Map(
      examDateRows.map(r => [r.email, r.examDate]),
    );
    // Build per-memberId, per-examType accuracy map
    const perCourseByMemberId = new Map<number, Map<string, { total: number; correct: number }>>();
    for (const r of perCourseRows) {
      if (r.memberId === null) continue;
      const mid = Number(r.memberId);
      if (!perCourseByMemberId.has(mid)) perCourseByMemberId.set(mid, new Map());
      perCourseByMemberId.get(mid)!.set(r.examType, { total: Number(r.total), correct: Number(r.correct) });
    }

    return members.map(m => {
      const stats = accuracyByMemberId.get(m.id);
      const total = stats?.total ?? 0;
      const correct = stats?.correct ?? 0;
      const accuracy = total > 0 ? Math.round((correct / total) * 100) : null;
      const lastActive = lastActiveByMemberId.get(m.id) ?? null;
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
      const emailCourseMap = perCourseByMemberId.get(m.id);
      const courseProgress = courseKeys.map(ck => {
        const examTypes = getExamTypesForCourseKey(ck);
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
          memberId: questionAttempts.organizationMemberId,
          total: sql<number>`COUNT(*)`,
          correct: sql<number>`SUM(CASE WHEN ${questionAttempts.correct} = 'yes' THEN 1 ELSE 0 END)`,
        })
        .from(questionAttempts)
        .where(eq(questionAttempts.orgId, orgId))
        .groupBy(questionAttempts.organizationMemberId),
      db
        .select({
          memberId: questionAttempts.organizationMemberId,
          lastActive: sql<Date>`MAX(${questionAttempts.createdAt})`,
        })
        .from(questionAttempts)
        .where(eq(questionAttempts.orgId, orgId))
        .groupBy(questionAttempts.organizationMemberId),
      db
        .select({ email: examDates.email, examDate: examDates.examDate })
        .from(examDates)
        .where(
          and(
            eq(examDates.orgId, orgId),
            lt(examDates.examDate, atRiskCutoff),
            gte(examDates.examDate, now),
          ),
        ),
    ]);

    const accuracyByMemberId = new Map(
      accuracyRows
        .filter(r => r.memberId !== null)
        .map(r => [Number(r.memberId), { total: Number(r.total), correct: Number(r.correct) }]),
    );
    const lastActiveByMemberId = new Map(
      lastActiveRows.filter(r => r.memberId !== null).map(r => [Number(r.memberId), r.lastActive]),
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
      const stats = accuracyByMemberId.get(m.id);
      const total = stats?.total ?? 0;
      const correct = stats?.correct ?? 0;
      const accuracy = total > 0 ? Math.round((correct / total) * 100) : 0;
      const lastActive = lastActiveByMemberId.get(m.id) ?? null;
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

      // Atomic seat cap check + grant inside a transaction to prevent race conditions.
      // Both the count read and the insert/update happen in the same transaction so
      // two concurrent requests cannot both pass the cap check and both write a new row.
      await db.transaction(async (tx) => {
        // consumeOrReuseAnnualLicence handles the full reactivation-vs-new-operator logic:
        // - Reactivation (previously counted this term): allowed even at full capacity
        // - New operator: blocked if all licences are consumed
        // - Pessimistic FOR UPDATE lock prevents concurrent oversubscription
        await consumeOrReuseAnnualLicence(tx, org, email);

        await grantSeat(tx as any, org, email, "operator", managerEmail, name, input.courseKey, input.courseKeys);
      });
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

      // Shared validator: enforces non-empty, province validity, and stream tier entitlement
      let validatedKeys: string[];
      try {
        validatedKeys = validateOrgCourseKeys(resolvedKeys, org.tier, org.province, "operator");
      } catch (err: any) {
        throw new TRPCError({ code: "BAD_REQUEST", message: err.message });
      }

      const primaryCourseKey = validatedKeys[0] ?? null;
      const courseKeysJson = validatedKeys.length > 0 ? JSON.stringify(validatedKeys) : null;
      if (!isSubscriptionProvince(org.province)) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Organization province is not supported for subscription access." });
      }
      const subscriptionProvince = org.province;

      // Build tier map for subscription upserts (all keys validated above)
      const coursesToUpsert = validatedKeys;
      const resolvedTiers = new Map<string, ReturnType<typeof courseKeyToTierStrict>>();
      for (const ck of coursesToUpsert) {
        const resolvedTier = courseKeyToTierStrict(ck, org.province);
        if (!isSubscriptionTier(resolvedTier)) {
          throw new TRPCError({ code: "BAD_REQUEST", message: `Could not resolve a valid subscription tier for ${ck}.` });
        }
        resolvedTiers.set(ck, resolvedTier);
      }

      // PATCH 2: Wrap all writes in a transaction — member update + subscription expire + upserts are atomic
      await db.transaction(async (tx) => {
        // Update member row
        await tx
          .update(organizationMembers)
          .set({
            courseKey: primaryCourseKey,
            courseKeys: courseKeysJson,
          })
          .where(eq(organizationMembers.id, member.id));

        // Expire all existing org-managed subscriptions for this operator
        await tx
          .update(subscriptions)
          .set({ status: "expired" })
          .where(
            and(
              eq(subscriptions.email, email),
              eq(subscriptions.orgId, orgId),
            ),
          );

        // Upsert one active subscription per new course key
        for (const ck of coursesToUpsert) {
          const tier = resolvedTiers.get(ck);
          if (!isSubscriptionTier(tier)) {
            throw new TRPCError({ code: "BAD_REQUEST", message: `Could not resolve a valid subscription tier for ${ck}.` });
          }
          const orgSubId = `org-${org.id}-${email}-${ck}`;
          const existingSub = await tx
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
            await tx
              .update(subscriptions)
              .set({ status: "active", tier, currentPeriodEnd: org.termEnd })
              .where(eq(subscriptions.id, existingSub[0].id));
          } else {
            await tx.insert(subscriptions).values({
              email,
              tier,
              province: subscriptionProvince,
              stripeSubscriptionId: orgSubId,
              stripeCustomerId: "",
              status: "active",
              currentPeriodStart: new Date(),
              currentPeriodEnd: org.termEnd,
              orgId: org.id,
            });
          }
        }
      });

      return { success: true };
    }),

  /**
   * assignSeats — bulk assign seats to a list of operator emails.
   * Enforces seat cap across the entire batch before assigning any.
   */
  assignSeats: publicProcedure
    .input(z.object({
      emails: z.array(z.string().email()).min(1).max(100),
      courseKeys: z.array(z.string().max(64)).min(1).max(10),
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

      // Validate the course keys against the org's entitlement BEFORE processing any emails
      let validatedCourseKeys: string[];
      try {
        validatedCourseKeys = validateOrgCourseKeys(input.courseKeys, org.tier, org.province, "operator");
      } catch (err: any) {
        throw new TRPCError({ code: "BAD_REQUEST", message: err.message });
      }

      const emails = input.emails.map(normalizeEmail);
      const uniqueEmails = Array.from(new Set(emails));

      // All-or-nothing bulk assignment inside a single transaction.
      // consumeOrReuseAnnualLicence handles reactivation vs new-operator logic with a pessimistic lock.
      const results: Array<{ email: string; success: boolean; error?: string }> = [];
      await db.transaction(async (tx) => {
        for (const email of uniqueEmails) {
          // consumeOrReuseAnnualLicence throws if a new licence is needed but cap is reached.
          // It allows reactivation even at full capacity.
          await consumeOrReuseAnnualLicence(tx, org, email);
          await grantSeat(tx as any, org, email, "operator", managerEmail, undefined, undefined, validatedCourseKeys);
          results.push({ email, success: true });
        }
      });

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
  /**
   * recordExamOutcome — manager records a pass/fail/no_show for an operator.
   */
  recordExamOutcome: publicProcedure
    .input(z.object({
      memberEmail: z.string().email(),
      courseKey: z.string().min(1).max(64),
      result: z.enum(["passed", "failed", "no_show"]),
      examDate: z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const { orgId, managerEmail } = await resolveOrgManager(ctx);
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
      const memberEmail = normalizeEmail(input.memberEmail);

      // Validate: email must belong to this org
      const [member] = await db
        .select({ id: organizationMembers.id, courseKeys: organizationMembers.courseKeys })
        .from(organizationMembers)
        .where(
          and(
            eq(organizationMembers.orgId, orgId),
            eq(organizationMembers.email, memberEmail),
          ),
        )
        .limit(1);
      if (!member) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "This operator is not a member of your organization." });
      }

      // Validate: course must be in the operator's assigned courses (not just org entitlement)
      // This prevents recording outcomes for courses the operator was never assigned
      const memberCourseKeys: string[] = (() => {
        if (member.courseKeys) {
          try { return JSON.parse(member.courseKeys as string) as string[]; } catch { return []; }
        }
        return [];
      })();

      if (memberCourseKeys.length > 0 && !memberCourseKeys.includes(input.courseKey)) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `This operator is not assigned to course '${input.courseKey}'. ` +
            `Their assigned courses are: ${memberCourseKeys.join(", ")}.`,
        });
      }

      // Also validate against org entitlement as a secondary check
      const org = await db
        .select({ tier: organizations.tier, province: organizations.province })
        .from(organizations)
        .where(eq(organizations.id, orgId))
        .limit(1)
        .then(r => r[0]);
      if (org) {
        const allowed = allowedCourseKeysForOrg(org.tier, org.province);
        if (allowed.length > 0 && !allowed.includes(input.courseKey)) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "This course is not included in your team plan." });
        }
      }

      const outcomeExamTypes = getExamTypesForCourseKey(input.courseKey);
      const attemptRows = await db
        .select({
          total: sql<number>`COUNT(*)`,
          correct: sql<number>`SUM(CASE WHEN ${questionAttempts.correct} = 'yes' THEN 1 ELSE 0 END)`,
          lastActive: sql<Date | null>`MAX(${questionAttempts.createdAt})`,
        })
        .from(questionAttempts)
        .where(and(
          eq(questionAttempts.studentEmail, memberEmail),
          outcomeExamTypes.length > 0 ? inArray(questionAttempts.examType, outcomeExamTypes) : undefined,
        ));
      const totalAttempts = Number(attemptRows[0]?.total ?? 0);
      const correctAttempts = Number(attemptRows[0]?.correct ?? 0);
      const lastActive = attemptRows[0]?.lastActive ? new Date(attemptRows[0].lastActive) : null;
      const recentCutoff = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);
      const mockRows = await db
        .select({ count: sql<number>`COUNT(*)` })
        .from(examResults)
        .where(and(
          eq(examResults.studentEmail, memberEmail),
          eq(examResults.courseKey, input.courseKey),
        ));
      const readinessScoreAtOutcome = totalAttempts > 0
        ? computeManagerReadiness({
            accuracy: correctAttempts / totalAttempts,
            totalAttempts,
            mockExamsCompleted: Number(mockRows[0]?.count ?? 0),
            activeRecently: !!lastActive && lastActive >= recentCutoff,
          })
        : null;

      await db.insert(examOutcomes).values({
        orgId,
        memberEmail,
        courseKey: input.courseKey,
        result: input.result,
        examDate: input.examDate ? new Date(input.examDate) : null,
        recordedBy: managerEmail,
        readinessScoreAtOutcome,
        readinessModelVersion: readinessScoreAtOutcome == null ? null : MANAGER_READINESS_MODEL_VERSION,
      });
      return { success: true };
    }),

  /**
   * getExamOutcomes — return all recorded outcomes for this org.
   */
  getExamOutcomes: publicProcedure
    .query(async ({ ctx }) => {
      const { orgId } = await resolveOrgManager(ctx);
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
      const rows = await db
        .select()
        .from(examOutcomes)
        .where(eq(examOutcomes.orgId, orgId))
        .orderBy(desc(examOutcomes.recordedAt));
      return { outcomes: rows };
    }),

  /**
   * getPassRateSummary — first-time pass rate for the current term.
   */
  getPassRateSummary: publicProcedure
    .query(async ({ ctx }) => {
      const { orgId } = await resolveOrgManager(ctx);
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
      const org = await db
        .select({ termEnd: organizations.termEnd, termStart: organizations.termStart })
        .from(organizations)
        .where(eq(organizations.id, orgId))
        .limit(1)
        .then(r => r[0]);
      if (!org) return { total: 0, passed: 0, passRate: 0 };
      const termStart = resolveTermStart(org);
      const rows = await db
        .select({
          memberEmail: examOutcomes.memberEmail,
          courseKey: examOutcomes.courseKey,
          result: examOutcomes.result,
          recordedAt: examOutcomes.recordedAt,
        })
        .from(examOutcomes)
        .where(and(eq(examOutcomes.orgId, orgId), gte(examOutcomes.recordedAt, termStart)))
        .orderBy(examOutcomes.recordedAt);
      const seen = new Set<string>();
      let total = 0;
      let passed = 0;
      for (const row of rows) {
        const key = `${row.memberEmail}::${row.courseKey}`;
        if (seen.has(key)) continue;
        seen.add(key);
        total++;
        if (row.result === "passed") passed++;
      }
      return { total, passed, passRate: total > 0 ? Math.round((passed / total) * 100) : 0 };
    }),
});

// ── Phase 5: Teams Manager Intelligence ──────────────────────────────────────

export const orgIntelRouter = router({
  /**
   * getTeamReadinessSummary — enhanced overview with readiness breakdown,
   * exam-ready count, at-risk count, inactive count, and top weak topics.
   */
  getTeamReadinessSummary: publicProcedure.query(async ({ ctx }) => {
    const { orgId } = await resolveOrgManager(ctx);
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
    const org = await db.select().from(organizations).where(eq(organizations.id, orgId)).limit(1).then(r => r[0]);
    if (!org) throw new TRPCError({ code: "NOT_FOUND", message: "Organization not found" });
    const activeMembers = await db
      .select({ id: organizationMembers.id, email: organizationMembers.email, assignedAt: organizationMembers.assignedAt })
      .from(organizationMembers)
      .where(and(eq(organizationMembers.orgId, orgId), eq(organizationMembers.role, "operator"), eq(organizationMembers.status, "assigned")));
    const totalAssigned = activeMembers.length;
    if (totalAssigned === 0) {
      return {
        orgName: org.name, seatsTotal: org.seatsTotal, seatsAssigned: 0,
        activeThisWeek: 0, activeThirtyDays: 0, inactiveCount: 0,
        examReadyCount: 0, atRiskCount: 0, avgReadiness: 0, topWeakTopics: [],
        learningActivated: 0, activationRate: 0, diagnosticCompleted: 0,
        diagnosticCompletionRate: 0, mockParticipants: 0, mockParticipationRate: 0,
        totalQuestions: 0, avgDiagnosticBaseline: null, avgPracticeAccuracy: null,
        accuracyChange: null,
      };
    }
    const memberEmails = activeMembers.map(m => m.email);
    const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const twoWeeksAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const [accuracyRows, activeRows, topicRows, mockRows, onboardingRows, diagnosticRows, activeThirtyRows, practiceRows] = await Promise.all([
      db.select({
          memberId: questionAttempts.organizationMemberId,
        total: sql<number>`COUNT(*)`,
        correct: sql<number>`SUM(CASE WHEN ${questionAttempts.correct} = 'yes' THEN 1 ELSE 0 END)`,
        lastActive: sql<Date>`MAX(${questionAttempts.createdAt})`,
      }).from(questionAttempts).where(eq(questionAttempts.orgId, orgId)).groupBy(questionAttempts.organizationMemberId),
      db.select({ memberId: questionAttempts.organizationMemberId }).from(questionAttempts)
        .where(and(eq(questionAttempts.orgId, orgId), gte(questionAttempts.createdAt, oneWeekAgo)))
        .groupBy(questionAttempts.organizationMemberId),
      db.select({
        topic: questionAttempts.topic,
        total: sql<number>`COUNT(*)`,
        correct: sql<number>`SUM(CASE WHEN ${questionAttempts.correct} = 'yes' THEN 1 ELSE 0 END)`,
      }).from(questionAttempts).where(eq(questionAttempts.orgId, orgId))
        .groupBy(questionAttempts.topic).having(sql`COUNT(*) >= 5`),
      db.select({
        memberId: examResults.organizationMemberId,
        count: sql<number>`COUNT(*)`,
      }).from(examResults).where(eq(examResults.orgId, orgId))
        .groupBy(examResults.organizationMemberId),
      db.select({ memberId: learnerOnboarding.organizationMemberId })
        .from(learnerOnboarding)
        .where(eq(learnerOnboarding.orgId, orgId))
        .groupBy(learnerOnboarding.organizationMemberId),
      db.select({
        memberId: diagnosticSessions.organizationMemberId,
        score: sql<number>`MAX(${diagnosticSessions.score})`,
      }).from(diagnosticSessions)
        .where(eq(diagnosticSessions.orgId, orgId))
        .groupBy(diagnosticSessions.organizationMemberId),
      db.select({ memberId: questionAttempts.organizationMemberId })
        .from(questionAttempts)
        .where(and(eq(questionAttempts.orgId, orgId), gte(questionAttempts.createdAt, thirtyDaysAgo)))
        .groupBy(questionAttempts.organizationMemberId),
      db.select({
        memberId: questionAttempts.organizationMemberId,
        total: sql<number>`COUNT(*)`,
        correct: sql<number>`SUM(CASE WHEN ${questionAttempts.correct} = 'yes' THEN 1 ELSE 0 END)`,
      }).from(questionAttempts)
        .where(and(
          eq(questionAttempts.orgId, orgId),
          sql`(${questionAttempts.quizMode} <> 'diagnostic' OR ${questionAttempts.quizMode} IS NULL)`,
        ))
        .groupBy(questionAttempts.organizationMemberId),
    ]);
    // PATCH 4: Also fetch exam dates to align at-risk count with exam-date risk
    const examDateRows = memberEmails.length > 0
      ? await db
          .select({ email: examDates.email, examDate: examDates.examDate })
          .from(examDates)
          .where(eq(examDates.orgId, orgId))
      : [];
    // Keep the nearest upcoming exam date per email
    const examDateByEmail = new Map<string, Date>();
    for (const row of examDateRows) {
      if (!row.examDate || row.examDate <= new Date()) continue;
      const existing = examDateByEmail.get(row.email);
      if (!existing || row.examDate < existing) examDateByEmail.set(row.email, row.examDate);
    }
    const accuracyByMemberId = new Map(
      accuracyRows.filter(r => r.memberId !== null).map(r => [Number(r.memberId), { total: Number(r.total), correct: Number(r.correct), lastActive: r.lastActive }]),
    );
    const activeMemberIds = new Set(activeRows.filter(r => r.memberId !== null).map(r => Number(r.memberId)));
    const activeThirtyDayMemberIds = new Set(activeThirtyRows.filter(r => r.memberId !== null).map(r => Number(r.memberId)));
    const activatedMemberIds = new Set([
      ...onboardingRows.filter(r => r.memberId !== null).map(r => Number(r.memberId)),
      ...accuracyRows.filter(r => r.memberId !== null && Number(r.total) > 0).map(r => Number(r.memberId)),
    ]);
    const diagnosticMemberIds = new Set(diagnosticRows.filter(r => r.memberId !== null).map(r => Number(r.memberId)));
    const mockCountByMemberId = new Map(
      mockRows.filter(r => r.memberId !== null).map(r => [Number(r.memberId), Number(r.count)]),
    );
    let totalReadiness = 0, examReadyCount = 0, atRiskCount = 0, inactiveCount = 0;
    const now = new Date();
    for (const m of activeMembers) {
      const stats = accuracyByMemberId.get(m.id);
      const total = stats?.total ?? 0;
      const correct = stats?.correct ?? 0;
      const accuracy = total > 0 ? correct / total : 0;
      const lastActive = stats?.lastActive ?? null;
      const readinessScore = computeManagerReadiness({
        accuracy,
        totalAttempts: total,
        mockExamsCompleted: mockCountByMemberId.get(m.id) ?? 0,
        activeRecently: !!lastActive && lastActive >= twoWeeksAgo,
      });
      totalReadiness += readinessScore;
      if (readinessScore >= 80) examReadyCount++;
      // At-risk = estimate-based risk OR a near exam with weak practice accuracy.
      const examDate = examDateByEmail.get(m.email);
      const daysUntilExam = examDate ? Math.ceil((examDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)) : null;
      const examDateRisk = daysUntilExam !== null && daysUntilExam <= 21 && accuracy < 0.70;
      const scoreRisk = readinessScore < 50 && total > 10;
      if (scoreRisk || examDateRisk) atRiskCount++;
      if (!lastActive || lastActive <= twoWeeksAgo) inactiveCount++;
    }
    const avgReadiness = totalAssigned > 0 ? Math.round(totalReadiness / totalAssigned) : 0;
    const topWeakTopics = topicRows
      .map(r => ({ topic: r.topic, accuracy: Number(r.total) > 0 ? Math.round((Number(r.correct) / Number(r.total)) * 100) : 0 }))
      .sort((a, b) => a.accuracy - b.accuracy).slice(0, 3).map(t => t.topic);
    const diagnosticScores = diagnosticRows.map(row => Number(row.score)).filter(Number.isFinite);
    const avgDiagnosticBaseline = diagnosticScores.length > 0
      ? Math.round(diagnosticScores.reduce((sum, score) => sum + score, 0) / diagnosticScores.length)
      : null;
    const practiceAccuracyByMemberId = new Map(
      practiceRows
        .filter(row => row.memberId !== null && Number(row.total) > 0)
        .map(row => [Number(row.memberId), Math.round((Number(row.correct) / Number(row.total)) * 100)]),
    );
    const practiceAccuracies = Array.from(practiceAccuracyByMemberId.values());
    const avgPracticeAccuracy = practiceAccuracies.length > 0
      ? Math.round(practiceAccuracies.reduce((sum, accuracy) => sum + accuracy, 0) / practiceAccuracies.length)
      : null;
    const diagnosticByMemberId = new Map(
      diagnosticRows.filter(row => row.memberId !== null).map(row => [Number(row.memberId), Number(row.score)]),
    );
    const individualAccuracyChanges = Array.from(practiceAccuracyByMemberId.entries())
      .filter(([memberId]) => diagnosticByMemberId.has(memberId))
      .map(([memberId, practiceAccuracy]) => practiceAccuracy - diagnosticByMemberId.get(memberId)!);
    const mockParticipants = Array.from(mockCountByMemberId.values()).filter(count => count > 0).length;
    return {
      orgName: org.name,
      seatsTotal: org.seatsTotal,
      seatsAssigned: totalAssigned,
      activeThisWeek: activeMemberIds.size,
      activeThirtyDays: activeThirtyDayMemberIds.size,
      inactiveCount,
      examReadyCount,
      atRiskCount,
      avgReadiness,
      topWeakTopics,
      learningActivated: activatedMemberIds.size,
      activationRate: Math.round((activatedMemberIds.size / totalAssigned) * 100),
      diagnosticCompleted: diagnosticMemberIds.size,
      diagnosticCompletionRate: Math.round((diagnosticMemberIds.size / totalAssigned) * 100),
      mockParticipants,
      mockParticipationRate: Math.round((mockParticipants / totalAssigned) * 100),
      totalQuestions: accuracyRows.reduce((sum, row) => sum + Number(row.total), 0),
      avgDiagnosticBaseline,
      avgPracticeAccuracy,
      accuracyChange: individualAccuracyChanges.length > 0
        ? Math.round(individualAccuracyChanges.reduce((sum, change) => sum + change, 0) / individualAccuracyChanges.length)
        : null,
    };
  }),

  /**
   * getTeamWeakTopics — aggregate weak topics across all active operators.
   */
  getTeamWeakTopics: publicProcedure.query(async ({ ctx }) => {
    const { orgId } = await resolveOrgManager(ctx);
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
    const activeMembers = await db.select({ email: organizationMembers.email }).from(organizationMembers)
      .where(and(eq(organizationMembers.orgId, orgId), eq(organizationMembers.role, "operator"), eq(organizationMembers.status, "assigned")));
    if (activeMembers.length === 0) return { topics: [] };
    const memberEmails = activeMembers.map(m => m.email);
    const topicRows = await db.select({
      topic: questionAttempts.topic,
      total: sql<number>`COUNT(*)`,
      correct: sql<number>`SUM(CASE WHEN ${questionAttempts.correct} = 'yes' THEN 1 ELSE 0 END)`,
      operatorCount: sql<number>`COUNT(DISTINCT ${questionAttempts.studentEmail})`,
    }).from(questionAttempts).where(eq(questionAttempts.orgId, orgId))
      .groupBy(questionAttempts.topic).having(sql`COUNT(*) >= 5`);
    const topics = topicRows
      .map(r => ({
        topic: r.topic,
        totalAttempts: Number(r.total),
        avgAccuracy: Number(r.total) > 0 ? Math.round((Number(r.correct) / Number(r.total)) * 100) : 0,
        operatorsAffected: Number(r.operatorCount),
      }))
      .sort((a, b) => a.avgAccuracy - b.avgAccuracy).slice(0, 10);
    return { topics };
  }),

  /**
   * getOperatorReadiness — per-operator readiness scores for the progress table.
   */
  getOperatorReadiness: publicProcedure.query(async ({ ctx }) => {
    const { orgId } = await resolveOrgManager(ctx);
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
    const members = await db.select().from(organizationMembers)
      .where(and(eq(organizationMembers.orgId, orgId), eq(organizationMembers.role, "operator")));
    if (members.length === 0) return { operators: [] };
    const allEmails = members.map(m => m.email);
    const twoWeeksAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);
    const [accuracyRows, topicRows, mockRows, lastActiveRows, examDateRows, mockScoreRows] = await Promise.all([
      db.select({
          memberId: questionAttempts.organizationMemberId,
        total: sql<number>`COUNT(*)`,
        correct: sql<number>`SUM(CASE WHEN ${questionAttempts.correct} = 'yes' THEN 1 ELSE 0 END)`,
      }).from(questionAttempts).where(eq(questionAttempts.orgId, orgId)).groupBy(questionAttempts.organizationMemberId),
      db.select({
          memberId: questionAttempts.organizationMemberId,
        topic: questionAttempts.topic,
        total: sql<number>`COUNT(*)`,
        correct: sql<number>`SUM(CASE WHEN ${questionAttempts.correct} = 'yes' THEN 1 ELSE 0 END)`,
      }).from(questionAttempts).where(eq(questionAttempts.orgId, orgId)).groupBy(questionAttempts.studentEmail, questionAttempts.topic),
      db.select({
          memberId: questionAttempts.organizationMemberId,
        mockCount: sql<number>`COUNT(DISTINCT ${questionAttempts.sessionId})`,
      }).from(questionAttempts).where(and(eq(questionAttempts.orgId, orgId), eq(questionAttempts.quizMode, "mock"))).groupBy(questionAttempts.organizationMemberId),
      db.select({
          memberId: questionAttempts.organizationMemberId,
        lastActive: sql<Date>`MAX(${questionAttempts.createdAt})`,
      }).from(questionAttempts).where(eq(questionAttempts.orgId, orgId)).groupBy(questionAttempts.organizationMemberId),
      // FIX 9: Fetch the nearest upcoming exam date per operator
      db.select({
        email: examDates.email,
        examDate: sql<Date>`MIN(${examDates.examDate})`,
      }).from(examDates)
        .where(and(eq(examDates.orgId, orgId), sql`${examDates.examDate} >= NOW()`))
        .groupBy(examDates.email),
      // Last 3 mock exam scores per operator from exam_results (persistent, linked to account)
      db.select({
        email: examResults.studentEmail,
        score: examResults.score,
        total: examResults.total,
        passed: examResults.passed,
        createdAt: examResults.createdAt,
        examType: examResults.examType,
      }).from(examResults)
        .where(and(
          eq(examResults.orgId, orgId),
          eq(examResults.calcOnly, "no"),
        ))
        .orderBy(desc(examResults.createdAt)),
    ]);
    const accuracyByMemberId = new Map(
      accuracyRows.filter(r => r.memberId !== null).map(r => [Number(r.memberId), { total: Number(r.total), correct: Number(r.correct) }]),
    );
    const mockByMemberId = new Map(mockRows.filter(r => r.memberId !== null).map(r => [Number(r.memberId), Number(r.mockCount)]));
    const lastActiveByMemberId = new Map(
      lastActiveRows.filter(r => r.memberId !== null).map(r => [Number(r.memberId), r.lastActive]),
    );
    const examDateByEmail = new Map(examDateRows.map(r => [r.email, r.examDate]));
    // Build last 3 mock scores per operator email
    const mockScoresByEmail = new Map<string, Array<{ score: number; total: number; passed: string; createdAt: Date; examType: string }>>();
    for (const r of mockScoreRows) {
      if (!r.email) continue;
      if (!mockScoresByEmail.has(r.email)) mockScoresByEmail.set(r.email, []);
      const scores = mockScoresByEmail.get(r.email)!;
      if (scores.length < 3) scores.push({ score: r.score, total: r.total, passed: r.passed ?? "no", createdAt: r.createdAt, examType: r.examType });
    }
    const topicsByMemberId = new Map<number, Array<{ topic: string; accuracy: number; total: number }>>();
    for (const r of topicRows) {
      if (r.memberId === null) continue;
      if (!topicsByMemberId.has(Number(r.memberId))) topicsByMemberId.set(Number(r.memberId), []);
      const acc = Number(r.total) > 0 ? Math.round((Number(r.correct) / Number(r.total)) * 100) : 0;
      topicsByMemberId.get(Number(r.memberId))!.push({ topic: r.topic, accuracy: acc, total: Number(r.total) });
    }
    const operators = members.map(m => {
      const stats = accuracyByMemberId.get(m.id);
      const total = stats?.total ?? 0;
      const correct = stats?.correct ?? 0;
      const accuracy = total > 0 ? Math.round((correct / total) * 100) : null;
      const lastActive = lastActiveByMemberId.get(m.id) ?? null;
      const mockExamsCompleted = mockByMemberId.get(m.id) ?? 0;
      let readinessScore = 0;
      if (total > 0 && accuracy !== null) {
        readinessScore = computeManagerReadiness({ accuracy: accuracy / 100, totalAttempts: total, mockExamsCompleted, activeRecently: !!(lastActive && lastActive >= twoWeeksAgo) });
      }
      const topics = topicsByMemberId.get(m.id) ?? [];
      const eligibleTopics = topics.filter(t => t.total >= 3);
      const weakestTopic = eligibleTopics.length > 0 ? eligibleTopics.sort((a, b) => a.accuracy - b.accuracy)[0].topic : null;
      let operatorStatus: "not_started" | "active" | "at_risk" | "improving" | "exam_ready" = "not_started";
      if (m.status === "revoked") operatorStatus = "not_started";
      else if (total === 0) operatorStatus = "not_started";
      else if (readinessScore >= 80) operatorStatus = "exam_ready";
      else if (readinessScore >= 60) operatorStatus = "active";
      else if (readinessScore < 40 && total > 10) operatorStatus = "at_risk";
      else operatorStatus = "improving";
      // FIX 9: Compute exam date risk
      const examDate = examDateByEmail.get(m.email) ?? null;
      const daysUntilExam = examDate ? Math.max(0, Math.round((examDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24))) : null;
      let examRisk: "none" | "low" | "medium" | "high" | "critical" = "none";
      if (daysUntilExam !== null) {
        if (daysUntilExam <= 7) examRisk = readinessScore < 60 ? "critical" : "low";
        else if (daysUntilExam <= 14) examRisk = readinessScore < 60 ? "high" : "low";
        else if (daysUntilExam <= 30) examRisk = readinessScore < 50 ? "medium" : "low";
        else examRisk = "low";
      }
      const recentMockScores = mockScoresByEmail.get(m.email) ?? [];
      return { id: m.id, email: m.email, name: m.name ?? null, memberStatus: m.status as "assigned" | "revoked", courseKey: m.courseKey ?? null, assignedAt: m.assignedAt, lastActive, totalAttempts: total, accuracy, readinessScore, weakestTopic, mockExamsCompleted, operatorStatus, examDate, daysUntilExam, examRisk, recentMockScores };
    });
    return { operators };
  }),

  /**
   * exportTeamCSV — export team progress as CSV string.
   */
  exportTeamCSV: publicProcedure.query(async ({ ctx }) => {
    const { orgId } = await resolveOrgManager(ctx);
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
    const org = await db.select().from(organizations).where(eq(organizations.id, orgId)).limit(1).then(r => r[0]);
    if (!org) throw new TRPCError({ code: "NOT_FOUND", message: "Organization not found" });
    const members = await db.select().from(organizationMembers)
      .where(and(eq(organizationMembers.orgId, orgId), eq(organizationMembers.role, "operator")));
    const header = "Email,Name,Assigned Course,Readiness Score,Activation,Diagnostic Baseline,Practice Accuracy,Accuracy Change,Mock Exams,Questions Attempted,Last Active,Weakest Topic,Status";
    if (members.length === 0) {
      await trackEvent("export_downloaded", { orgId, extra: { exportType: "team_learning_outcomes", rowCount: 0 } });
      return { csv: header + "\n", orgName: org.name };
    }
    const allEmails = members.map(m => m.email);
    const twoWeeksAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);
    const [accuracyRows, practiceRows, topicRows, mockRows, lastActiveRows, onboardingRows, diagnosticRows] = await Promise.all([
      db.select({ memberId: questionAttempts.organizationMemberId, total: sql<number>`COUNT(*)`, correct: sql<number>`SUM(CASE WHEN ${questionAttempts.correct} = 'yes' THEN 1 ELSE 0 END)` })
        .from(questionAttempts).where(eq(questionAttempts.orgId, orgId)).groupBy(questionAttempts.organizationMemberId),
      db.select({ memberId: questionAttempts.organizationMemberId, total: sql<number>`COUNT(*)`, correct: sql<number>`SUM(CASE WHEN ${questionAttempts.correct} = 'yes' THEN 1 ELSE 0 END)` })
        .from(questionAttempts)
        .where(and(
          eq(questionAttempts.orgId, orgId),
          sql`(${questionAttempts.quizMode} <> 'diagnostic' OR ${questionAttempts.quizMode} IS NULL)`,
        ))
        .groupBy(questionAttempts.organizationMemberId),
      db.select({ memberId: questionAttempts.organizationMemberId, topic: questionAttempts.topic, total: sql<number>`COUNT(*)`, correct: sql<number>`SUM(CASE WHEN ${questionAttempts.correct} = 'yes' THEN 1 ELSE 0 END)` })
        .from(questionAttempts).where(eq(questionAttempts.orgId, orgId)).groupBy(questionAttempts.organizationMemberId, questionAttempts.topic),
      db.select({ memberId: questionAttempts.organizationMemberId, mockCount: sql<number>`COUNT(DISTINCT ${questionAttempts.sessionId})` })
        .from(questionAttempts).where(and(eq(questionAttempts.orgId, orgId), eq(questionAttempts.quizMode, "mock"))).groupBy(questionAttempts.organizationMemberId),
      db.select({ memberId: questionAttempts.organizationMemberId, lastActive: sql<Date>`MAX(${questionAttempts.createdAt})` })
        .from(questionAttempts).where(eq(questionAttempts.orgId, orgId)).groupBy(questionAttempts.organizationMemberId),
      db.select({ memberId: learnerOnboarding.organizationMemberId })
        .from(learnerOnboarding).where(eq(learnerOnboarding.orgId, orgId)).groupBy(learnerOnboarding.organizationMemberId),
      db.select({ memberId: diagnosticSessions.organizationMemberId, score: sql<number>`MAX(${diagnosticSessions.score})` })
        .from(diagnosticSessions).where(eq(diagnosticSessions.orgId, orgId)).groupBy(diagnosticSessions.organizationMemberId),
    ]);
    const accuracyByMemberId = new Map(
      accuracyRows.filter(r => r.memberId !== null).map(r => [Number(r.memberId), { total: Number(r.total), correct: Number(r.correct) }]),
    );
    const practiceByMemberId = new Map(
      practiceRows.filter(r => r.memberId !== null).map(r => [Number(r.memberId), { total: Number(r.total), correct: Number(r.correct) }]),
    );
    const activatedMemberIds = new Set([
      ...onboardingRows.filter(r => r.memberId !== null).map(r => Number(r.memberId)),
      ...accuracyRows.filter(r => r.memberId !== null && Number(r.total) > 0).map(r => Number(r.memberId)),
    ]);
    const diagnosticByMemberId = new Map(
      diagnosticRows.filter(r => r.memberId !== null).map(r => [Number(r.memberId), Number(r.score)]),
    );
    const mockByMemberId = new Map(mockRows.filter(r => r.memberId !== null).map(r => [Number(r.memberId), Number(r.mockCount)]));
    const lastActiveByMemberId = new Map(
      lastActiveRows.filter(r => r.memberId !== null).map(r => [Number(r.memberId), r.lastActive]),
    );
    const topicsByMemberId = new Map<number, Array<{ topic: string; accuracy: number; total: number }>>();
    for (const r of topicRows) {
      if (r.memberId === null) continue;
      if (!topicsByMemberId.has(Number(r.memberId))) topicsByMemberId.set(Number(r.memberId), []);
      const acc = Number(r.total) > 0 ? Math.round((Number(r.correct) / Number(r.total)) * 100) : 0;
      topicsByMemberId.get(Number(r.memberId))!.push({ topic: r.topic, accuracy: acc, total: Number(r.total) });
    }
    const escapeCSV = (v: string | null | undefined) => { if (v == null) return ""; const s = String(v); return s.includes(",") || s.includes("\"") || s.includes("\n") ? `"${s.replace(/"/g, '""')}"` : s; };
    const rows = members.map(m => {
      const stats = accuracyByMemberId.get(m.id);
      const total = stats?.total ?? 0;
      const correct = stats?.correct ?? 0;
      const accuracy = total > 0 ? Math.round((correct / total) * 100) : null;
      const practiceStats = practiceByMemberId.get(m.id);
      const practiceAccuracy = practiceStats && practiceStats.total > 0
        ? Math.round((practiceStats.correct / practiceStats.total) * 100)
        : null;
      const diagnosticBaseline = diagnosticByMemberId.get(m.id) ?? null;
      const accuracyChange = practiceAccuracy !== null && diagnosticBaseline !== null
        ? practiceAccuracy - diagnosticBaseline
        : null;
      const lastActive = lastActiveByMemberId.get(m.id) ?? null;
      const mockExamsCompleted = mockByMemberId.get(m.id) ?? 0;
      let readinessScore = 0;
      if (total > 0 && accuracy !== null) readinessScore = computeManagerReadiness({ accuracy: accuracy / 100, totalAttempts: total, mockExamsCompleted, activeRecently: !!(lastActive && lastActive >= twoWeeksAgo) });
      const topics = topicsByMemberId.get(m.id) ?? [];
      const eligibleTopics = topics.filter(t => t.total >= 3);
      const weakestTopic = eligibleTopics.length > 0 ? eligibleTopics.sort((a, b) => a.accuracy - b.accuracy)[0].topic : null;
      let status = "Not Started";
      if (m.status === "revoked") status = "Revoked";
      else if (total === 0) status = "Not Started";
      else if (readinessScore >= 80) status = "Estimated Ready";
      else if (readinessScore >= 60) status = "Active";
      else if (readinessScore < 40 && total > 10) status = "At Risk";
      else status = "Improving";
      const courseLabel = m.courseKey ? courseKeyToLabel(m.courseKey, org.province) : "All Access";
      return [
        escapeCSV(m.email), escapeCSV(m.name), escapeCSV(courseLabel),
        readinessScore > 0 ? `${readinessScore}%` : "0%",
        activatedMemberIds.has(m.id) ? "Activated" : "Not Started",
        diagnosticBaseline === null ? "" : `${diagnosticBaseline}%`,
        practiceAccuracy === null ? "" : `${practiceAccuracy}%`,
        accuracyChange === null ? "" : `${accuracyChange >= 0 ? "+" : ""}${accuracyChange} pts`,
        String(mockExamsCompleted), String(total),
        lastActive ? lastActive.toISOString().split("T")[0] : "Never",
        escapeCSV(weakestTopic), status,
      ].join(",");
    });
    await trackEvent("export_downloaded", { orgId, extra: { exportType: "team_learning_outcomes", rowCount: rows.length } });
    return { csv: [header, ...rows].join("\n"), orgName: org.name };
  }),

  /**
   * sendOperatorReminder — send a reminder email to an inactive operator.
   */
  sendOperatorReminder: publicProcedure
    .input(z.object({ email: z.string().email() }))
    .mutation(async ({ input, ctx }) => {
      const { orgId, managerEmail } = await resolveOrgManager(ctx);
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
      const email = normalizeEmail(input.email);
      const member = await db.select().from(organizationMembers)
        .where(and(eq(organizationMembers.orgId, orgId), eq(organizationMembers.email, email), eq(organizationMembers.role, "operator"), eq(organizationMembers.status, "assigned")))
        .limit(1).then(r => r[0]);
      if (!member) throw new TRPCError({ code: "NOT_FOUND", message: "Operator not found in your organization" });

      // FIX 4: Cooldown — refuse to send if a reminder was sent in the last 7 days
      if (member.lastRemindedAt) {
        const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        if (member.lastRemindedAt > sevenDaysAgo) {
          throw new TRPCError({ code: "TOO_MANY_REQUESTS", message: "A reminder was already sent to this operator within the last 7 days." });
        }
      }

      // FIX 4: Respect unsubscribe opt-out
      if (member.reminderOptOut) {
        throw new TRPCError({ code: "FORBIDDEN", message: "This operator has unsubscribed from reminder emails." });
      }

      const org = await db.select().from(organizations).where(eq(organizations.id, orgId)).limit(1).then(r => r[0]);
      if (!org) throw new TRPCError({ code: "NOT_FOUND", message: "Organization not found" });

      // FIX 4: Generate or reuse unsubscribe token
      const unsubscribeToken = member.unsubscribeToken ?? randomBytes(24).toString("hex");
      const unsubscribeUrl = `https://echeloninstitute.ca/api/unsubscribe-reminder?token=${unsubscribeToken}`;

      const courseLabel = member.courseKey ? courseKeyToLabel(member.courseKey, org.province) : "All Courses";
      // FIX 13: Use dedicated reminder email instead of reusing enrollment email
      await sendOperatorStudyReminderEmail({ email, orgName: org.name, managerEmail, loginUrl: "https://echeloninstitute.ca/login", courseName: courseLabel, unsubscribeUrl });

      // FIX 4: Stamp lastRemindedAt and persist unsubscribeToken
      await db.update(organizationMembers)
        .set({ lastRemindedAt: new Date(), unsubscribeToken })
        .where(eq(organizationMembers.id, member.id));

      return { success: true, email };
    }),

  /**
   * sendBulkReminders — send reminders to all inactive operators in the org.
   */
  sendBulkReminders: publicProcedure.mutation(async ({ ctx }) => {
    const { orgId, managerEmail } = await resolveOrgManager(ctx);
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
    const org = await db.select().from(organizations).where(eq(organizations.id, orgId)).limit(1).then(r => r[0]);
    if (!org) throw new TRPCError({ code: "NOT_FOUND", message: "Organization not found" });
    const members = await db.select().from(organizationMembers)
      .where(and(eq(organizationMembers.orgId, orgId), eq(organizationMembers.role, "operator"), eq(organizationMembers.status, "assigned")));
    if (members.length === 0) return { sent: 0, emails: [] };
    const memberEmails = members.map(m => m.email);
    const twoWeeksAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const recentRows = await db.select({ email: questionAttempts.studentEmail }).from(questionAttempts)
      .where(and(eq(questionAttempts.orgId, orgId), gte(questionAttempts.createdAt, twoWeeksAgo)))
      .groupBy(questionAttempts.studentEmail);
    const recentEmails = new Set(recentRows.map(r => r.email));
    // FIX 4: Filter out opted-out and recently-reminded operators
    const eligibleMembers = members.filter(m =>
      !recentEmails.has(m.email) &&
      !m.reminderOptOut &&
      (!m.lastRemindedAt || m.lastRemindedAt < sevenDaysAgo)
    );
    const sentEmails: string[] = [];
    for (const m of eligibleMembers) {
      try {
        // FIX 4: Generate or reuse unsubscribe token per operator
        const unsubscribeToken = m.unsubscribeToken ?? randomBytes(24).toString("hex");
        const unsubscribeUrl = `https://echeloninstitute.ca/api/unsubscribe-reminder?token=${unsubscribeToken}`;
        const courseLabel = m.courseKey ? courseKeyToLabel(m.courseKey, org.province) : "All Courses";
        // FIX 13: Use dedicated reminder email instead of reusing enrollment email
        await sendOperatorStudyReminderEmail({ email: m.email, orgName: org.name, managerEmail, loginUrl: "https://echeloninstitute.ca/login", courseName: courseLabel, unsubscribeUrl });
        // FIX 4: Stamp lastRemindedAt and persist unsubscribeToken
        await db.update(organizationMembers)
          .set({ lastRemindedAt: new Date(), unsubscribeToken })
          .where(eq(organizationMembers.id, m.id));
        sentEmails.push(m.email);
      } catch (err) { console.error(`[sendBulkReminders] Failed to send to ${m.email}:`, err); }
    }
    return { sent: sentEmails.length, emails: sentEmails };
  }),

  /**
   * getCommandCohortSummary — aggregate Command Centre performance across org operators.
   * Returns: per-scenario completion counts, average scores, and most-missed steps.
   */
  getCommandCohortSummary: publicProcedure.query(async ({ ctx }) => {
    const { orgId } = await resolveOrgManager(ctx);
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

    // Get all active operator members
    const activeMembers = await db
      .select({ email: organizationMembers.email })
      .from(organizationMembers)
      .where(and(eq(organizationMembers.orgId, orgId), eq(organizationMembers.role, "operator"), eq(organizationMembers.status, "assigned")));
    if (activeMembers.length === 0) return { totalRuns: 0, scenarios: [], mostMissedSteps: [], operatorScores: [] };

    // Find user IDs for these org members
    const memberEmails = activeMembers.map(m => m.email);
    const userRows = await db.select({ id: users.id, email: users.email, name: users.name })
      .from(users)
      .where(inArray(users.email, memberEmails));
    if (userRows.length === 0) return { totalRuns: 0, scenarios: [], mostMissedSteps: [], operatorScores: [] };
    const userIds = userRows.map(u => u.id);
    const userNameById = new Map(userRows.map(u => [u.id, u.name ?? u.email]));

    // Fetch all command runs for these users
    const runs = await db.select()
      .from(commandRunHistory)
      .where(inArray(commandRunHistory.userId, userIds))
      .orderBy(desc(commandRunHistory.completedAt));

    if (runs.length === 0) return { totalRuns: 0, scenarios: [], mostMissedSteps: [], operatorScores: [] };

    // Aggregate per-scenario stats
    const scenarioMap = new Map<string, { title: string; runs: number; totalScore: number; bestScore: number }>();
    for (const run of runs) {
      const existing = scenarioMap.get(run.scenarioId) ?? { title: run.scenarioTitle, runs: 0, totalScore: 0, bestScore: 0 };
      existing.runs++;
      existing.totalScore += run.commandScore;
      if (run.commandScore > existing.bestScore) existing.bestScore = run.commandScore;
      scenarioMap.set(run.scenarioId, existing);
    }
    const scenarios = Array.from(scenarioMap.entries()).map(([id, s]) => ({
      scenarioId: id,
      scenarioTitle: s.title,
      totalRuns: s.runs,
      avgScore: Math.round(s.totalScore / s.runs),
      bestScore: s.bestScore,
    })).sort((a, b) => a.avgScore - b.avgScore);

    // Aggregate most-missed steps from decisionsJson
    const stepFailures = new Map<string, { scenarioId: string; stepId: string; failCount: number; totalAppearances: number }>();
    for (const run of runs) {
      if (!run.decisionsJson) continue;
      try {
        const decisions: Array<{ stepId: string; choiceId: string; points: number }> = JSON.parse(run.decisionsJson);
        for (const d of decisions) {
          const key = `${run.scenarioId}::${d.stepId}`;
          const existing = stepFailures.get(key) ?? { scenarioId: run.scenarioId, stepId: d.stepId, failCount: 0, totalAppearances: 0 };
          existing.totalAppearances++;
          if (d.points < 20) existing.failCount++; // Non-optimal = failed
          stepFailures.set(key, existing);
        }
      } catch { /* skip malformed JSON */ }
    }
    const mostMissedSteps = Array.from(stepFailures.values())
      .filter(s => s.totalAppearances >= 2) // Only show steps with enough data
      .map(s => ({
        scenarioId: s.scenarioId,
        stepId: s.stepId,
        failRate: Math.round((s.failCount / s.totalAppearances) * 100),
        totalAppearances: s.totalAppearances,
      }))
      .sort((a, b) => b.failRate - a.failRate)
      .slice(0, 10);

    // Per-operator score summary
    const operatorMap = new Map<number, { runs: number; totalScore: number; bestScore: number }>();
    for (const run of runs) {
      if (!run.userId) continue;
      const existing = operatorMap.get(run.userId) ?? { runs: 0, totalScore: 0, bestScore: 0 };
      existing.runs++;
      existing.totalScore += run.commandScore;
      if (run.commandScore > existing.bestScore) existing.bestScore = run.commandScore;
      operatorMap.set(run.userId, existing);
    }
    const operatorScores = Array.from(operatorMap.entries()).map(([userId, s]) => ({
      name: userNameById.get(userId) ?? "Unknown",
      totalRuns: s.runs,
      avgScore: Math.round(s.totalScore / s.runs),
      bestScore: s.bestScore,
    })).sort((a, b) => b.avgScore - a.avgScore);

    return { totalRuns: runs.length, scenarios, mostMissedSteps, operatorScores };
  }),
});

// Export helpers for use in webhook and admin router
export { grantSeat, revokeSeat };
