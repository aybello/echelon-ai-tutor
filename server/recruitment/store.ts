import { TRPCError } from "@trpc/server";
import { and, eq } from "drizzle-orm";
import { organizations, recruitmentAssessments, recruitmentAssignments, type RecruitmentAssessmentRow, type RecruitmentAssignmentRow } from "../../drizzle/schema";
import type { RecruitmentCandidateView } from "../../shared/recruitmentAssessment";
import type { TrpcContext } from "../_core/context";
import { getDb } from "../db";
import { assertRecruitmentCandidate, recruitmentCourseForOrg, verifiedRecruitmentEmail } from "./access";
import { assertRecruitmentSourcesVisible } from "./questions";
import { finalizeRecruitmentDeadline, recruitmentCandidateView, transitionRecruitment } from "./state";
import type { RecruitmentDb, RecruitmentOperation, RecruitmentReadDb, RecruitmentTransaction } from "./types";

export async function recruitmentDb(): Promise<RecruitmentDb> {
  const db = await getDb();
  if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
  return db;
}

export async function readRecruitmentAssessment(db: RecruitmentReadDb, assessmentId: string, orgId: number): Promise<RecruitmentAssessmentRow> {
  const [row] = await db.select().from(recruitmentAssessments)
    .where(and(eq(recruitmentAssessments.id, assessmentId), eq(recruitmentAssessments.orgId, orgId))).limit(1);
  if (!row) throw new TRPCError({ code: "NOT_FOUND", message: "Assessment not found." });
  return row;
}

export async function readRecruitmentAssignment(db: RecruitmentReadDb, assignmentId: string, email: string): Promise<RecruitmentAssignmentRow> {
  const [row] = await db.select().from(recruitmentAssignments)
    .where(and(eq(recruitmentAssignments.id, assignmentId), eq(recruitmentAssignments.candidateEmail, email))).limit(1);
  if (!row) throw new TRPCError({ code: "FORBIDDEN", message: "This invitation is not available to this account." });
  return row;
}

/** Only attempt fields are mutable. Snapshot, invite identity and original expiry are never reset. */
export async function persistRecruitmentTransition(tx: RecruitmentTransaction, before: RecruitmentAssignmentRow, after: RecruitmentAssignmentRow): Promise<void> {
  if (after === before) return;
  await tx.update(recruitmentAssignments).set({
    status: after.status, answers: after.answers, score: after.score, revision: after.revision,
    updatedAtMs: after.updatedAtMs, startedAtMs: after.startedAtMs, submittedAtMs: after.submittedAtMs,
    consentVersion: after.consentVersion, consentAcceptedAtMs: after.consentAcceptedAtMs,
    revokedAtMs: after.revokedAtMs, revokedByEmail: after.revokedByEmail,
  }).where(and(eq(recruitmentAssignments.id, before.id), eq(recruitmentAssignments.orgId, before.orgId)));
}

/** Central access is checked before the transaction to avoid global-pool starvation.
 * Exact original-org seat/subscription is then rechecked inside READ COMMITTED.
 * candidateGet locks as well because lazy deadline finalization is a durable write. */
export async function operateRecruitmentCandidate(ctx: TrpcContext, assignmentId: string, operation: RecruitmentOperation): Promise<RecruitmentCandidateView> {
  const email = verifiedRecruitmentEmail(ctx);
  const db = await recruitmentDb();
  const preflight = await readRecruitmentAssignment(db, assignmentId, email);
  const definition = await readRecruitmentAssessment(db, preflight.assessmentId, preflight.orgId);
  await assertRecruitmentCandidate(ctx, db, preflight, definition.courseKey, { bootstrapApplicantCapability: operation.kind === "get" });
  return db.transaction(async tx => {
    // Candidate order: org -> assignment -> member -> subscription -> source IDs.
    // Manager reporting: org -> manager SHARE -> assignments by ID UPDATE.
    // Shared member locks are compatible; all lifecycle writers take org first.
    // Org SHARE serializes Annual lifecycle writes without serializing candidates.
    const [lockedOrg] = await tx.select().from(organizations).where(eq(organizations.id, preflight.orgId)).limit(1).for("share");
    if (!lockedOrg) throw new TRPCError({ code: "FORBIDDEN", message: "Team unavailable." });
    const [assignment] = await tx.select().from(recruitmentAssignments)
      .where(and(eq(recruitmentAssignments.id, assignmentId), eq(recruitmentAssignments.candidateEmail, email), eq(recruitmentAssignments.orgId, preflight.orgId)))
      .limit(1).for("update");
    if (!assignment) throw new TRPCError({ code: "FORBIDDEN", message: "This invitation is not available to this account." });
    if (assignment.orgId !== preflight.orgId || assignment.assessmentId !== preflight.assessmentId || assignment.memberId !== preflight.memberId) {
      throw new TRPCError({ code: "CONFLICT", message: "The invitation scope changed. Reload the assessment." });
    }
    const assessment = await readRecruitmentAssessment(tx, assignment.assessmentId, assignment.orgId);
    // Identity and exact original seat/subscription SHARE locks precede durable
    // finalization. Elapsed attempts need no delivery permission from sources.
    let org = await assertRecruitmentCandidate(ctx, tx, assignment, assessment.courseKey, { centralPreflightDone: true, lock: true });
    let nowMs = Date.now();
    let finalized = finalizeRecruitmentDeadline(assessment, assignment, nowMs);
    if (finalized !== assignment) {
      await persistRecruitmentTransition(tx, assignment, finalized);
      return recruitmentCandidateView(assessment, finalized, org.name, nowMs);
    }
    if (assignment.status === "invited" || assignment.status === "active") {
      const course = recruitmentCourseForOrg(lockedOrg, assessment.courseKey);
      let withdrawal: TRPCError | undefined;
      try { await assertRecruitmentSourcesVisible(tx, course.questionBankKey, assessment.questions); }
      catch (error) {
        if (!(error instanceof TRPCError) || error.code !== "PRECONDITION_FAILED") throw error;
        withdrawal = error;
      }
      // Governance may wait across the deadline, including a wait that ends in
      // source withdrawal. Recheck exact current access/term while holding the
      // same seat locks, then read server time. Timeout wins over withdrawal and
      // stale revisions; returning it (not throwing) commits original evidence.
      org = await assertRecruitmentCandidate(ctx, tx, assignment, assessment.courseKey, { centralPreflightDone: true, lock: true });
      nowMs = Date.now();
      finalized = finalizeRecruitmentDeadline(assessment, assignment, nowMs);
      if (finalized !== assignment) {
        await persistRecruitmentTransition(tx, assignment, finalized);
        return recruitmentCandidateView(assessment, finalized, org.name, nowMs);
      }
      if (withdrawal) throw withdrawal;
    }
    const next = transitionRecruitment(assessment, assignment, operation, nowMs);
    await persistRecruitmentTransition(tx, assignment, next);
    return recruitmentCandidateView(assessment, next, org.name, nowMs);
  }, { isolationLevel: "read committed" });
}
