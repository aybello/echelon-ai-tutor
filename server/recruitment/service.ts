import { randomInt, randomUUID } from "node:crypto";
import { TRPCError } from "@trpc/server";
import { and, desc, eq, gt, inArray, lte } from "drizzle-orm";
import {
  organizationMembers, organizations, recruitmentAssessments, recruitmentAssignments, subscriptions,
  type Organization, type RecruitmentAssessmentRow, type RecruitmentAssignmentRow,
} from "../../drizzle/schema";
import {
  selectRecruitmentQuestions, type RecruitmentCatalog, type RecruitmentDefinitionSummary, type RecruitmentResult,
} from "../../shared/recruitmentAssessment";
import { allowedCourseKeysForOrg } from "../stripe/subscriptionProducts";
import type { TrpcContext } from "../_core/context";
import {
  assertCurrentAnnualOrganization, assertRecruitmentSeat, recruitmentCourseForOrg, recruitmentManager,
  recruitmentSeatCourses, recruitmentSubscriptionCovers, verifiedRecruitmentEmail,
} from "./access";
import { normalizeEmail } from "../_core/accessService";
import { DELEGATED_MANAGER_ROLE } from "../teams/delegatedManagers";
import { loadRecruitmentPool, loadRecruitmentPools } from "./questions";
import { finalizeRecruitmentDeadline, recruitmentResult } from "./state";
import { persistRecruitmentTransition, readRecruitmentAssessment, recruitmentDb } from "./store";
import type { RecruitmentCreate, RecruitmentReadDb } from "./types";

/** Recheck manager membership inside mutations without invoking a global resolver
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

export function recruitmentDefinitionSummary(assessment: RecruitmentAssessmentRow, assignments: RecruitmentAssignmentRow[], nowMs: number): RecruitmentDefinitionSummary {
  const rows = assignments.filter(row => row.assessmentId === assessment.id && row.orgId === assessment.orgId);
  return {
    id: assessment.id, title: assessment.title, courseKey: assessment.courseKey, courseLabel: assessment.courseLabel,
    modules: [...assessment.modules], questionCount: assessment.questionCount, timeLimitMinutes: assessment.timeLimitMinutes,
    createdAtMs: assessment.createdAtMs, expiresAtMs: assessment.expiresAtMs,
    candidates: rows.length,
    completed: rows.filter(row => finalizeRecruitmentDeadline(assessment, row, nowMs).submittedAtMs !== null).length,
  };
}

export async function recruitmentCatalog(ctx: TrpcContext, orgId: number): Promise<RecruitmentCatalog> {
  const org = await recruitmentManager(ctx, orgId, true);
  const db = await recruitmentDb();
  const eligibleCourses = allowedCourseKeysForOrg(org.tier, org.province).flatMap(key => {
    try { return [recruitmentCourseForOrg(org, key)]; } catch { return []; }
  });
  const pools = await loadRecruitmentPools(db, eligibleCourses.map(course => course.questionBankKey));
  const courses = eligibleCourses.flatMap(course => {
    const pool = pools.get(course.questionBankKey) ?? [];
    if (!pool.length) return [];
    const modules = new Map<string, number>();
    for (const q of pool) modules.set(q.module, (modules.get(q.module) ?? 0) + 1);
    return [{ courseKey: course.courseKey, label: course.displayName,
      modules: [...modules].map(([name, count]) => ({ name, count })).sort((a, b) => a.name.localeCompare(b.name)) }];
  });
  const members = await db.select().from(organizationMembers).where(and(eq(organizationMembers.orgId, org.id), eq(organizationMembers.status, "assigned"))).orderBy(organizationMembers.id);
  const now = new Date();
  const subs = await db.select().from(subscriptions).where(and(eq(subscriptions.orgId, org.id),
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
}

export async function createRecruitmentAssessment(ctx: TrpcContext, input: RecruitmentCreate): Promise<{ assessmentId: string }> {
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
      selected = selectRecruitmentQuestions(pool, input.modules, input.questionCount, () => randomInt(0, 0x100000000) / 0x100000000);
    } catch (error) {
      throw new TRPCError({ code: "BAD_REQUEST", message: error instanceof Error ? error.message : "Choose valid assessment topics and question count." });
    }
    const nowMs = Date.now();
    assertCurrentAnnualOrganization(org, nowMs);
    const assessmentId = randomUUID();
    await tx.insert(recruitmentAssessments).values({
      id: assessmentId, orgId: org.id, title: input.title, courseKey: course.courseKey, courseLabel: course.displayName,
      modules: [...input.modules], questionCount: selected.length, timeLimitMinutes: input.timeLimitMinutes,
      questions: selected, creatorEmail, createdAtMs: nowMs, expiresAtMs: nowMs + input.expiresInDays * 86_400_000,
    });
    return { assessmentId };
  }, { isolationLevel: "read committed" });
}

export async function listRecruitmentAssessments(ctx: TrpcContext, orgId: number): Promise<RecruitmentDefinitionSummary[]> {
  const org = await recruitmentManager(ctx, orgId, false);
  const db = await recruitmentDb();
  const definitions = await db.select().from(recruitmentAssessments).where(eq(recruitmentAssessments.orgId, org.id))
    .orderBy(desc(recruitmentAssessments.createdAtMs), recruitmentAssessments.id);
  const assignments = definitions.length ? await db.select().from(recruitmentAssignments).where(eq(recruitmentAssignments.orgId, org.id)) : [];
  const nowMs = Date.now();
  return definitions.map(definition => recruitmentDefinitionSummary(definition, assignments, nowMs));
}

export async function recruitmentResults(ctx: TrpcContext, orgId: number, assessmentId: string): Promise<{ assessment: RecruitmentDefinitionSummary; results: RecruitmentResult[] }> {
  const org = await recruitmentManager(ctx, orgId, false);
  const db = await recruitmentDb();
  const assessment = await readRecruitmentAssessment(db, assessmentId, org.id);
  const rows = await db.select().from(recruitmentAssignments)
    .where(and(eq(recruitmentAssignments.orgId, org.id), eq(recruitmentAssignments.assessmentId, assessment.id)))
    .orderBy(recruitmentAssignments.createdAtMs, recruitmentAssignments.id);
  const nowMs = Date.now();
  return { assessment: recruitmentDefinitionSummary(assessment, rows, nowMs), results: rows.map(row => recruitmentResult(assessment, row, nowMs)) };
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
    if (existing) return { assignmentId: existing.id }; // Never reset a revoked/expired/completed invite.
    const nowMs = Date.now();
    assertCurrentAnnualOrganization(org, nowMs);
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

export async function revokeRecruitmentAssignment(ctx: TrpcContext, orgId: number, assignmentId: string): Promise<{ success: true }> {
  const org = await recruitmentManager(ctx, orgId, false);
  const actorEmail = verifiedRecruitmentEmail(ctx);
  const db = await recruitmentDb();
  return db.transaction(async tx => {
    const [currentOrg] = await tx.select().from(organizations).where(eq(organizations.id, org.id)).limit(1).for("share");
    if (!currentOrg || !["active", "past_due"].includes(currentOrg.status)) {
      throw new TRPCError({ code: "FORBIDDEN", message: "Team reporting is no longer available." });
    }
    const [assignment] = await tx.select().from(recruitmentAssignments)
      .where(and(eq(recruitmentAssignments.id, assignmentId), eq(recruitmentAssignments.orgId, org.id))).limit(1).for("update");
    if (!assignment) throw new TRPCError({ code: "NOT_FOUND", message: "Assessment invitation not found." });
    await assertManagerStillAuthorized(tx, currentOrg, actorEmail);
    if (assignment.status === "revoked") return { success: true };
    const assessment = await readRecruitmentAssessment(tx, assignment.assessmentId, org.id);
    const nowMs = Date.now();
    const finalized = finalizeRecruitmentDeadline(assessment, assignment, nowMs);
    const next: RecruitmentAssignmentRow = { ...finalized, status: "revoked", revokedAtMs: nowMs,
      revokedByEmail: actorEmail, updatedAtMs: nowMs, revision: finalized.revision + 1 };
    await persistRecruitmentTransition(tx, assignment, next);
    return { success: true };
  }, { isolationLevel: "read committed" });
}
