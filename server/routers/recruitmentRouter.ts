import { publicProcedure, router } from "../_core/trpc";
import {
  recruitmentOrgInput, recruitmentCreateInput, recruitmentAssessmentInput, recruitmentInviteInput,
  recruitmentRevokeInput, recruitmentAssignmentInput, recruitmentStartInput, recruitmentAnswerInput, recruitmentSubmitInput,
  type RecruitmentCatalog, type RecruitmentDefinitionSummary, type RecruitmentResult, type RecruitmentCandidateView,
} from "../../shared/recruitmentAssessment";
import {
  recruitmentCatalog, createRecruitmentAssessment, listRecruitmentAssessments, recruitmentResults,
  inviteRecruitmentCandidate, revokeRecruitmentAssignment,
} from "../recruitment/service";
import { operateRecruitmentCandidate } from "../recruitment/store";

/** Public procedure supports verified OTP and OAuth sessions equally. Every service
 * explicitly verifies identity and scope; an assignment UUID is never a bearer token.
 * No email, billing, free-candidate, seat, practice, CEU or activity side effects. */
export const recruitmentRouter = router({
  catalog: publicProcedure.input(recruitmentOrgInput).query(async ({ ctx, input }): Promise<RecruitmentCatalog> =>
    recruitmentCatalog(ctx, input.orgId)),
  create: publicProcedure.input(recruitmentCreateInput).mutation(async ({ ctx, input }): Promise<{ assessmentId: string }> =>
    createRecruitmentAssessment(ctx, input)),
  list: publicProcedure.input(recruitmentOrgInput).query(async ({ ctx, input }): Promise<RecruitmentDefinitionSummary[]> =>
    listRecruitmentAssessments(ctx, input.orgId)),
  results: publicProcedure.input(recruitmentAssessmentInput).query(async ({ ctx, input }): Promise<{ assessment: RecruitmentDefinitionSummary; results: RecruitmentResult[] }> =>
    recruitmentResults(ctx, input.orgId, input.assessmentId)),
  invite: publicProcedure.input(recruitmentInviteInput).mutation(async ({ ctx, input }): Promise<{ assignmentId: string }> =>
    inviteRecruitmentCandidate(ctx, input.orgId, input.assessmentId, input.memberId)),
  revoke: publicProcedure.input(recruitmentRevokeInput).mutation(async ({ ctx, input }): Promise<{ success: true }> =>
    revokeRecruitmentAssignment(ctx, input.orgId, input.assignmentId, input.expectedRevision)),
  candidateGet: publicProcedure.input(recruitmentAssignmentInput).query(async ({ ctx, input }): Promise<RecruitmentCandidateView> =>
    operateRecruitmentCandidate(ctx, input.assignmentId, { kind: "get" })),
  start: publicProcedure.input(recruitmentStartInput).mutation(async ({ ctx, input }): Promise<RecruitmentCandidateView> =>
    operateRecruitmentCandidate(ctx, input.assignmentId, { kind: "start", input })),
  saveAnswer: publicProcedure.input(recruitmentAnswerInput).mutation(async ({ ctx, input }): Promise<RecruitmentCandidateView> =>
    operateRecruitmentCandidate(ctx, input.assignmentId, { kind: "answer", input })),
  submit: publicProcedure.input(recruitmentSubmitInput).mutation(async ({ ctx, input }): Promise<RecruitmentCandidateView> =>
    operateRecruitmentCandidate(ctx, input.assignmentId, { kind: "submit", input })),
});
