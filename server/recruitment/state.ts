import { TRPCError } from "@trpc/server";
import type { RecruitmentAssessmentRow, RecruitmentAssignmentRow } from "../../drizzle/schema";
import {
  RECRUITMENT_CONSENT_VERSION, RECRUITMENT_NOTICE, candidateQuestions, recruitmentDeadline, scoreRecruitment,
  type RecruitmentAnswers, type RecruitmentCandidateView, type RecruitmentResult,
} from "../../shared/recruitmentAssessment";
import { assertRecruitmentSnapshot } from "./questions";
import type { RecruitmentOperation } from "./types";

/** Revalidate durable JSON at the boundary, and never forward arbitrary keys. */
export function snapshotAnswers(assessment: RecruitmentAssessmentRow, assignment: RecruitmentAssignmentRow): RecruitmentAnswers {
  const result: RecruitmentAnswers = {};
  const stored = assignment.answers;
  if (!stored || typeof stored !== "object" || Array.isArray(stored)) {
    throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Saved assessment answers are unavailable." });
  }
  for (const q of assertRecruitmentSnapshot(assessment.questions)) {
    const choice = Object.hasOwn(stored, q.id) ? stored[q.id] : undefined;
    if (typeof choice === "number" && Number.isInteger(choice) && choice >= 0 && choice < q.options.length) result[q.id] = choice;
  }
  return result;
}

export function assignmentDeadline(assessment: RecruitmentAssessmentRow, assignment: RecruitmentAssignmentRow): number {
  return recruitmentDeadline(assignment.startedAtMs, assessment.timeLimitMinutes, Math.min(assessment.expiresAtMs, assignment.expiresAtMs));
}

/** Pure lazy finalization. Caller persists under lock; never replaces a completed or revoked status. */
export function finalizeRecruitmentDeadline(assessment: RecruitmentAssessmentRow, assignment: RecruitmentAssignmentRow, nowMs: number): RecruitmentAssignmentRow {
  if (assignment.status === "invited" && nowMs >= assignmentDeadline(assessment, assignment)) {
    return { ...assignment, status: "expired", updatedAtMs: nowMs, revision: assignment.revision + 1 };
  }
  if (assignment.status === "active" && nowMs >= assignmentDeadline(assessment, assignment)) {
    const answers = snapshotAnswers(assessment, assignment);
    if (assessment.timeLimitMinutes === null) {
      return { ...assignment, answers, status: "expired", submittedAtMs: null, score: null,
        updatedAtMs: nowMs, revision: assignment.revision + 1 };
    }
    return { ...assignment, answers, status: "timed_out", submittedAtMs: assignmentDeadline(assessment, assignment),
      score: scoreRecruitment(assessment.questions, answers), updatedAtMs: nowMs, revision: assignment.revision + 1 };
  }
  return assignment;
}

/** All mutations are performed against a locked durable row, never against client scores/timestamps. */
export function transitionRecruitment(assessment: RecruitmentAssessmentRow, assignment: RecruitmentAssignmentRow, operation: RecruitmentOperation, nowMs: number): RecruitmentAssignmentRow {
  assertRecruitmentSnapshot(assessment.questions);
  const current = finalizeRecruitmentDeadline(assessment, assignment, nowMs);
  // A newly elapsed deadline returns a committed terminal view, not a thrown rollback.
  if (current !== assignment || operation.kind === "get") return current;
  if (current.status === "revoked") return current;
  if (operation.kind === "start") {
    if (operation.input.acceptedNotice !== true || operation.input.consentVersion !== RECRUITMENT_CONSENT_VERSION) {
      throw new TRPCError({ code: "BAD_REQUEST", message: "Accept the current recruitment assessment notice before starting." });
    }
    if (current.status !== "invited") return current; // Idempotent: original timer and consent survive.
    return { ...current, status: "active", startedAtMs: nowMs, consentVersion: RECRUITMENT_CONSENT_VERSION,
      consentAcceptedAtMs: nowMs, updatedAtMs: nowMs, revision: current.revision + 1 };
  }
  if (operation.kind === "submit" && ["submitted", "timed_out", "expired"].includes(current.status)) return current;
  if (current.status !== "active" || current.startedAtMs === null) {
    throw new TRPCError({ code: "CONFLICT", message: "Start the assessment before answering or submitting. Completed assessments cannot be changed." });
  }
  // Deadline finalization and terminal retries above must win over stale revisions.
  if (operation.input.revision !== current.revision) {
    throw new TRPCError({ code: "CONFLICT", message: "A newer answer has been saved. Reload the assessment before trying again." });
  }
  const answers = snapshotAnswers(assessment, current);
  if (operation.kind === "answer") {
    const q = assessment.questions.find(q => q.id === operation.input.questionId);
    const choice = operation.input.selectedIndex;
    if (!q || (choice !== null && (!Number.isInteger(choice) || choice < 0 || choice >= q.options.length))) {
      throw new TRPCError({ code: "BAD_REQUEST", message: "Choose a valid answer for a question in this assessment." });
    }
    if (choice === null) delete answers[q.id]; else answers[q.id] = choice;
    return { ...current, answers, updatedAtMs: nowMs, revision: current.revision + 1 };
  }
  return { ...current, answers, status: "submitted", submittedAtMs: nowMs,
    score: scoreRecruitment(assessment.questions, answers), updatedAtMs: nowMs, revision: current.revision + 1 };
}

/** Explicit allowlist: no spread of database rows, answer key, explanations, score or other candidates. */
export function recruitmentCandidateView(assessment: RecruitmentAssessmentRow, assignment: RecruitmentAssignmentRow, orgName: string, nowMs: number): RecruitmentCandidateView {
  const active = assignment.status === "active";
  return {
    assignmentId: assignment.id, title: assessment.title, orgName, courseLabel: assessment.courseLabel,
    modules: [...assessment.modules], questionCount: assessment.questionCount, timeLimitMinutes: assessment.timeLimitMinutes,
    expiresAtMs: Math.min(assessment.expiresAtMs, assignment.expiresAtMs), deadlineMs: assignmentDeadline(assessment, assignment),
    serverNowMs: nowMs, startedAtMs: assignment.startedAtMs, submittedAtMs: assignment.submittedAtMs, status: assignment.status,
    questions: active ? candidateQuestions(assertRecruitmentSnapshot(assessment.questions)) : [],
    answers: active ? snapshotAnswers(assessment, assignment) : {},
    revision: assignment.revision, notice: RECRUITMENT_NOTICE,
  };
}

/** Reporting is a projection of durable completion only. The service serializes
 * and persists deadline finalization before calling this function. */
export function recruitmentResult(assessment: RecruitmentAssessmentRow, assignment: RecruitmentAssignmentRow, _nowMs: number): RecruitmentResult {
  const scored = assignment.submittedAtMs !== null && ["submitted", "timed_out", "revoked"].includes(assignment.status);
  const answers = scored ? snapshotAnswers(assessment, assignment) : {};
  return {
    assignmentId: assignment.id, memberId: assignment.memberId, candidateEmail: assignment.candidateEmail,
    candidateName: assignment.candidateName, status: assignment.status, startedAtMs: assignment.startedAtMs,
    submittedAtMs: assignment.submittedAtMs, expiresAtMs: Math.min(assignment.expiresAtMs, assessment.expiresAtMs),
    score: scored ? scoreRecruitment(assessment.questions, answers) : null,
    answers, questions: scored ? assertRecruitmentSnapshot(assessment.questions).map(q => ({ id: q.id, module: q.module, prompt: q.prompt, options: [...q.options], correctIndex: q.correctIndex })) : [],
    revision: assignment.revision,
  };
}
