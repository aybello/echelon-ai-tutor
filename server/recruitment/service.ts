import { randomInt, randomUUID } from "node:crypto";
import { TRPCError } from "@trpc/server";
import { and, desc, eq, gt, inArray, lte } from "drizzle-orm";
import {
  organizationMembers, organizations, recruitmentAssessments, recruitmentAssignments, subscriptions,
  type Organization, type RecruitmentAssessmentRow, type RecruitmentAssignmentRow,
} from "../../drizzle/schema";
import {
  normalizeRecruitmentDifficulty, recruitmentCreateInput, selectRecruitmentQuestions,
  type RecruitmentCatalog, type RecruitmentDefinitionSummary, type RecruitmentDifficultyCounts, type RecruitmentResult,
} from "../../shared/recruitmentAssessment";
import { allowedCourseKeysForOrg } from "../stripe/subscriptionProducts";
import type { TrpcContext } from "../_core/context";
import {
  assertCurrentAnnualOrganization, assertRecruitmentSeat, recruitmentCourseForOrg, recruitmentManager,
  recruitmentSeatCourses, recruitmentSubscriptionCovers, verifiedRecruitmentEmail,
} from "./access";
import { normalizeEmail } from "../_core/accessService";
import { DELEGATED_MANAGER_ROLE } from "../teams/delegatedManagers";
import { assertRecruitmentSourcesVisible, loadRecruitmentPool, loadRecruitmentPools } from "./questions";
import { assignmentDeadline, finalizeRecruitmentDeadline, recruitmentResult } from "./state";
import { persistRecruitmentTransition, readRecruitmentAssessment, recruitmentDb } from "./store";
import type { RecruitmentCreate, RecruitmentReadDb, RecruitmentTransaction } from "./types";

/** Recheck manager membership inside transactions without invoking a global resolver
 * while a pool connection is held. The existing resolver remains the preflight. */
async function assertManagerStillAuthorized(db: RecruitmentReadDb, org: Organization, email: string): Promise<void> {
  if (normalizeEmail(org.managerEmail) === email) return;
  const [delegate] = await db.select().from(organizationMembers).where(and(
    eq(organizationMembers.orgId, org.id), eq(organizationMembers.email, email),
    eq(organizationMembers.role, DELEGATED_MANAGER_ROLE), eq(organizationMembers.status, "assigned"),
  )).limit(1).for("share");
  if (!delegate || delegate.courseKey !== null || delegate.courseKeys !== null) {
    throw new TRPCError({ code: "FORBIDDEN", message: "You are no longer a manager of this organization." });
  }
}

/** Historical Annual reporting needs current reporting authorization, not a current term. */
async function lockReportingOrganization(tx: RecruitmentTransaction, orgId: number): Promise<Organization> {
  const [org] = await tx.select().from(organizations).where(eq(organizations.id, orgId)).limit(1).for("share");
  if (!org || !["active", "past_due"].includes(org.status)
    || org.billingType === "course-pass" || org.tier === "course-pass") {
    throw new TRPCError({ code: "FORBIDDEN", message: "Team reporting is no longer available." });
  }
  return org;
}

/** The org SHARE lock excludes invitation insertion. Identity is immutable, so
 * discover IDs only, then acquire single-row locks in one common order. SQL
 * ORDER BY alone can sort after an index scan has already acquired row locks. */
async function lockReportingAssignments(tx: RecruitmentTransaction, orgId: number,
  assessmentId?: string): Promise<RecruitmentAssignmentRow[]> {
  const scope = assessmentId === undefined ? eq(recruitmentAssignments.orgId, orgId)
    : and(eq(recruitmentAssignments.orgId, orgId), eq(recruitmentAssignments.assessmentId, assessmentId));
  const ids = await tx.select({ id: recruitmentAssignments.id }).from(recruitmentAssignments).where(scope)
    .orderBy(recruitmentAssignments.id);
  const rows: RecruitmentAssignmentRow[] = [];
  for (const { id } of ids.sort((a, b) => a.id.localeCompare(b.id))) {
    const [row] = await tx.select().from(recruitmentAssignments)
      .where(and(eq(recruitmentAssignments.id, id), scope)).limit(1).for("update");
    if (!row) throw new TRPCError({ code: "CONFLICT", message: "The invitation scope changed. Reload the report." });
    rows.push(row);
  }
  return rows;
}

async function finalizeReportingAssignments(tx: RecruitmentTransaction, assessment: RecruitmentAssessmentRow,
  rows: RecruitmentAssignmentRow[], nowMs: number): Promise<RecruitmentAssignmentRow[]> {
  const finalized: RecruitmentAssignmentRow[] = [];
  for (const row of rows) {
    const next = finalizeRecruitmentDeadline(assessment, row, nowMs);
    if (next !== row) await persistRecruitmentTransition(tx, row, next);
    finalized.push(next);
  }
  return finalized;
}

export function recruitmentDefinitionSummary(assessment: RecruitmentAssessmentRow, assignments: RecruitmentAssignmentRow[]): RecruitmentDefinitionSummary {
  const rows = assignments.filter(row => row.assessmentId === assessment.id && row.orgId === assessment.orgId);
  return {
    id: assessment.id, title: assessment.title, courseKey: assessment.courseKey, courseLabel: assessment.courseLabel,
    difficultyMode: assessment.difficultyMode ?? null,
    modules: [...assessment.modules], questionCount: assessment.questionCount, timeLimitMinutes: assessment.timeLimitMinutes,
    createdAtMs: assessment.createdAtMs, expiresAtMs: assessment.expiresAtMs,
    candidates: rows.length,
    completed: rows.filter(row => row.submittedAtMs !== null).length,
  };
}

export async function recruitmentCatalog(ctx: TrpcContext, orgId: number): Promise<RecruitmentCatalog> {
  await recruitmentManager(ctx, orgId, true);
  const actorEmail = verifiedRecruitmentEmail(ctx);
  const db = await recruitmentDb();
  return db.transaction(async tx => {
    // Keep org and delegated-manager SHARE locks through the roster reads and
    // final clock check; no global resolver runs while holding this connection.
    const [org] = await tx.select().from(organizations).where(eq(organizations.id, orgId)).limit(1).for("share");
    if (!org) throw new TRPCError({ code: "FORBIDDEN", message: "Team unavailable." });
    assertCurrentAnnualOrganization(org, Date.now());
    await assertManagerStillAuthorized(tx, org, actorEmail);
    const eligibleCourses = allowedCourseKeysForOrg(org.tier, org.province).flatMap(key => {
      try { return [recruitmentCourseForOrg(org, key)]; } catch { return []; }
    });
    const pools = await loadRecruitmentPools(tx, eligibleCourses.map(course => course.questionBankKey));
    const courses = eligibleCourses.flatMap(course => {
      const pool = pools.get(course.questionBankKey) ?? [];
      if (!pool.length) return [];
      const difficultyCounts: RecruitmentDifficultyCounts = { mixed: 0, medium: 0, hard: 0 };
      const modules = new Map<string, RecruitmentDifficultyCounts>();
      let unlabelledCount = 0;
      for (const q of pool) {
        const counts = modules.get(q.module) ?? { mixed: 0, medium: 0, hard: 0 };
        const difficulty = normalizeRecruitmentDifficulty(q.difficulty);
        counts.mixed++; difficultyCounts.mixed++;
        if (difficulty === "medium" || difficulty === "hard") { counts[difficulty]++; difficultyCounts[difficulty]++; }
        if (difficulty === null) unlabelledCount++;
        modules.set(q.module, counts);
      }
      return [{ courseKey: course.courseKey, label: course.displayName, difficultyCounts, unlabelledCount,
        modules: [...modules].map(([name, counts]) => ({ name, count: counts.mixed, difficultyCounts: counts })).sort((a, b) => a.name.localeCompare(b.name)) }];
    });
    const members = await tx.select().from(organizationMembers).where(and(eq(organizationMembers.orgId, org.id), eq(organizationMembers.status, "assigned"))).orderBy(organizationMembers.id);
    const now = new Date();
    const subs = await tx.select().from(subscriptions).where(and(eq(subscriptions.orgId, org.id),
      inArray(subscriptions.status, ["active", "past_due"]), lte(subscriptions.currentPeriodStart, now), gt(subscriptions.currentPeriodEnd, now)));
    const available = new Set(courses.map(course => course.courseKey));
    const candidates = members.flatMap(member => {
      const email = normalizeEmail(member.email);
      const courseKeys = recruitmentSeatCourses(org, member).filter(key => available.has(key)
        && subs.some(sub => recruitmentSubscriptionCovers(sub, org, email, key, Date.now())));
      return email && courseKeys.length ? [{ memberId: member.id, email, name: member.name, courseKeys }] : [];
    });
    assertCurrentAnnualOrganization(org, Date.now());
    return { orgName: org.name, courses, candidates };
  }, { isolationLevel: "read committed" });
}

export async function createRecruitmentAssessment(ctx: TrpcContext, rawInput: RecruitmentCreate): Promise<{ assessmentId: string }> {
  const parsed = recruitmentCreateInput.safeParse(rawInput);
  if (!parsed.success) throw new TRPCError({ code: "BAD_REQUEST", message: "Choose valid assessment settings, difficulty mode, topics and question count." });
  const input = parsed.data;
  await recruitmentManager(ctx, input.orgId, true);
  const creatorEmail = verifiedRecruitmentEmail(ctx);
  const db = await recruitmentDb();
  return db.transaction(async tx => {
    const [org] = await tx.select().from(organizations).where(eq(organizations.id, input.orgId)).limit(1).for("update");
    if (!org) throw new TRPCError({ code: "FORBIDDEN", message: "Team unavailable." });
    await assertManagerStillAuthorized(tx, org, creatorEmail);
    assertCurrentAnnualOrganization(org, Date.now());
    const course = recruitmentCourseForOrg(org, input.courseKey);
    const pool = await loadRecruitmentPool(tx, course.questionBankKey);
    let selected;
    try {
      selected = selectRecruitmentQuestions(pool, input.modules, input.questionCount, () => randomInt(0, 0x100000000) / 0x100000000, input.difficultyMode);
    } catch (error) {
      throw new TRPCError({ code: "BAD_REQUEST", message: error instanceof Error ? error.message : "Choose valid assessment topics and question count." });
    }
    // Pool sampling is unlocked. Revalidate the exact selected IDs with current
    // bank/governance SHARE locks AND unchanged valid payloads before freezing
    // them; never resample silently. Historical delivery remains visibility-only.
    await assertRecruitmentSourcesVisible(tx, course.questionBankKey, selected, { requireUnchangedPayload: true });
    const nowMs = Date.now();
    assertCurrentAnnualOrganization(org, nowMs);
    const assessmentId = randomUUID();
    await tx.insert(recruitmentAssessments).values({
      id: assessmentId, orgId: org.id, title: input.title, courseKey: course.courseKey, courseLabel: course.displayName,
      difficultyMode: input.difficultyMode, modules: [...new Set(selected.map(q => q.module))], questionCount: selected.length, timeLimitMinutes: input.timeLimitMinutes,
      questions: selected, creatorEmail, createdAtMs: nowMs, expiresAtMs: nowMs + input.expiresInDays * 86_400_000,
    });
    return { assessmentId };
  }, { isolationLevel: "read committed" });
}

export async function listRecruitmentAssessments(ctx: TrpcContext, orgId: number): Promise<RecruitmentDefinitionSummary[]> {
  const org = await recruitmentManager(ctx, orgId, false);
  const actorEmail = verifiedRecruitmentEmail(ctx);
  const db = await recruitmentDb();
  return db.transaction(async tx => {
    const currentOrg = await lockReportingOrganization(tx, org.id);
    await assertManagerStillAuthorized(tx, currentOrg, actorEmail);
    const definitions = await tx.select().from(recruitmentAssessments).where(eq(recruitmentAssessments.orgId, org.id))
      .orderBy(desc(recruitmentAssessments.createdAtMs), recruitmentAssessments.id);
    // Common reporting order: org SHARE -> manager SHARE -> assignments by ID UPDATE.
    // Authority precedes all private reads, including missing/nonowned branches.
    const assignments = definitions.length ? await lockReportingAssignments(tx, org.id) : [];
    const nowMs = Date.now(); // Only after every lock and authorization wait.
    const summaries: RecruitmentDefinitionSummary[] = [];
    for (const definition of definitions) {
      const rows = assignments.filter(row => row.assessmentId === definition.id);
      const finalized = await finalizeReportingAssignments(tx, definition, rows, nowMs);
      summaries.push(recruitmentDefinitionSummary(definition, finalized));
    }
    return summaries;
  }, { isolationLevel: "read committed" });
}

export async function recruitmentResults(ctx: TrpcContext, orgId: number, assessmentId: string): Promise<{ assessment: RecruitmentDefinitionSummary; results: RecruitmentResult[] }> {
  const org = await recruitmentManager(ctx, orgId, false);
  const actorEmail = verifiedRecruitmentEmail(ctx);
  const db = await recruitmentDb();
  return db.transaction(async tx => {
    const currentOrg = await lockReportingOrganization(tx, org.id);
    await assertManagerStillAuthorized(tx, currentOrg, actorEmail);
    const assessment = await readRecruitmentAssessment(tx, assessmentId, org.id);
    const rows = await lockReportingAssignments(tx, org.id, assessment.id);
    const nowMs = Date.now();
    const finalized = await finalizeReportingAssignments(tx, assessment, rows, nowMs);
    // Preserve the existing display order independently of deterministic lock order.
    finalized.sort((a, b) => a.createdAtMs - b.createdAtMs || a.id.localeCompare(b.id));
    return { assessment: recruitmentDefinitionSummary(assessment, finalized), results: finalized.map(row => recruitmentResult(assessment, row, nowMs)) };
  }, { isolationLevel: "read committed" });
}

export async function inviteRecruitmentCandidate(ctx: TrpcContext, orgId: number, assessmentId: string, memberId: number): Promise<{ assignmentId: string }> {
  await recruitmentManager(ctx, orgId, true);
  const creatorEmail = verifiedRecruitmentEmail(ctx);
  const db = await recruitmentDb();
  return db.transaction(async tx => {
    // Existing Annual seat writers lock this org too; no seat/billing writes here.
    const [org] = await tx.select().from(organizations).where(eq(organizations.id, orgId)).limit(1).for("update");
    if (!org) throw new TRPCError({ code: "FORBIDDEN", message: "Team unavailable." });
    await assertManagerStillAuthorized(tx, org, creatorEmail);
    assertCurrentAnnualOrganization(org, Date.now());
    const assessment = await readRecruitmentAssessment(tx, assessmentId, org.id);
    const member = await assertRecruitmentSeat(tx, org, memberId, assessment.courseKey, undefined, true);
    const [existing] = await tx.select().from(recruitmentAssignments)
      .where(and(eq(recruitmentAssignments.assessmentId, assessment.id), eq(recruitmentAssignments.memberId, member.id), eq(recruitmentAssignments.orgId, org.id))).limit(1);
    // Terminal duplicates retain their ordinary lifecycle conflict; every usable
    // link and every fresh INSERT needs the immutable original sources locked.
    if (existing && !["invited", "active"].includes(existing.status)) {
      throw new TRPCError({ code: "CONFLICT", message: "This invitation is no longer usable. Create a new assessment form to invite this candidate again." });
    }
    const assertOriginalBinding = (currentEmail: string) => {
      if (existing && normalizeEmail(currentEmail) !== existing.candidateEmail) {
        throw new TRPCError({ code: "CONFLICT", message: "This seat's email no longer matches the original invitation. Create a new assessment form to invite this candidate again." });
      }
    };
    assertOriginalBinding(member.email);
    const course = recruitmentCourseForOrg(org, assessment.courseKey);
    await assertRecruitmentSourcesVisible(tx, course.questionBankKey, assessment.questions);
    // Seat and subscription time predicates can lapse during governance waits.
    const currentMember = await assertRecruitmentSeat(tx, org, memberId, assessment.courseKey, undefined, true);
    assertOriginalBinding(currentMember.email);
    const nowMs = Date.now();
    assertCurrentAnnualOrganization(org, nowMs);
    if (existing) {
      if (["invited", "active"].includes(existing.status) && nowMs < assignmentDeadline(assessment, existing)) {
        return { assignmentId: existing.id }; // Preserve the original usable invitation and timer.
      }
      throw new TRPCError({ code: "CONFLICT", message: "This invitation is no longer usable. Create a new assessment form to invite this candidate again." });
    }
    if (nowMs >= assessment.expiresAtMs) throw new TRPCError({ code: "CONFLICT", message: "This assessment has expired. Create a new form instead." });
    const assignmentId = randomUUID();
    await tx.insert(recruitmentAssignments).values({
      id: assignmentId, assessmentId: assessment.id, orgId: org.id, memberId: member.id,
      candidateEmail: normalizeEmail(member.email), candidateName: member.name, creatorEmail,
      createdAtMs: nowMs, updatedAtMs: nowMs, expiresAtMs: assessment.expiresAtMs,
      status: "invited", answers: {}, revision: 0,
    });
    return { assignmentId };
  }, { isolationLevel: "read committed" });
}

export async function revokeRecruitmentAssignment(ctx: TrpcContext, orgId: number, assignmentId: string, expectedRevision: number): Promise<{ success: true }> {
  if (!Number.isInteger(expectedRevision) || expectedRevision < 0) {
    throw new TRPCError({ code: "BAD_REQUEST", message: "A nonnegative integer expectedRevision is required." });
  }
  const revisionConflict = () => new TRPCError({ code: "CONFLICT", message: "This assessment invitation has changed. Reload the results and review it again before revoking." });
  const org = await recruitmentManager(ctx, orgId, false);
  const actorEmail = verifiedRecruitmentEmail(ctx);
  const db = await recruitmentDb();
  const outcome = await db.transaction<{ success: true } | { conflict: true }>(async tx => {
    const currentOrg = await lockReportingOrganization(tx, org.id);
    await assertManagerStillAuthorized(tx, currentOrg, actorEmail);
    const [assignment] = await tx.select().from(recruitmentAssignments)
      .where(and(eq(recruitmentAssignments.id, assignmentId), eq(recruitmentAssignments.orgId, org.id))).limit(1).for("update");
    if (!assignment) throw new TRPCError({ code: "NOT_FOUND", message: "Assessment invitation not found." });
    if (assignment.status === "revoked") return { success: true };
    const assessment = await readRecruitmentAssessment(tx, assignment.assessmentId, org.id);
    const nowMs = Date.now();
    const finalized = finalizeRecruitmentDeadline(assessment, assignment, nowMs);
    if (finalized !== assignment) {
      // Commit the deadline's original scoring evidence, then require a fresh
      // review. Throwing inside this callback would roll that finalization back.
      await persistRecruitmentTransition(tx, assignment, finalized);
      return { conflict: true };
    }
    if (assignment.revision !== expectedRevision) throw revisionConflict();
    const next: RecruitmentAssignmentRow = { ...finalized, status: "revoked", revokedAtMs: nowMs,
      revokedByEmail: actorEmail, updatedAtMs: nowMs, revision: finalized.revision + 1 };
    await persistRecruitmentTransition(tx, assignment, next);
    return { success: true };
  }, { isolationLevel: "read committed" });
  if ("conflict" in outcome) throw revisionConflict();
  return outcome;
}
