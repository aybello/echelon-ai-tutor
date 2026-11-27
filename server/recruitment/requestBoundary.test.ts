import { describe, expect, it } from "vitest";
import {
  RECRUITMENT_CONSENT_VERSION,
  recruitmentAnswerInput,
  recruitmentAssignmentInput,
  recruitmentAssessmentInput,
  recruitmentCreateInput,
  recruitmentInviteInput,
  recruitmentOrgInput,
  recruitmentRevokeInput,
  recruitmentStartInput,
  recruitmentSubmitInput,
} from "../../shared/recruitmentAssessment";

const assignmentId = "11111111-1111-4111-8111-111111111111";
const assessmentId = "22222222-2222-4222-8222-222222222222";
const answer = { assignmentId, questionId: "fixture-q1", selectedIndex: 0, revision: 0 };
const create = {
  orgId: 7,
  title: "Operator recruitment",
  courseKey: "class2-water",
  modules: ["Treatment"],
  questionCount: 5,
  timeLimitMinutes: 15,
  expiresInDays: 7,
};

// These exercise the actual schemas shared by the router and UI. They do not
// claim to test authorization or database locking; service tests cover those.
describe("recruitment strict request boundaries", () => {
  it.each([
    ["catalog/list", recruitmentOrgInput, { orgId: 7 }],
    ["create", recruitmentCreateInput, create],
    ["results", recruitmentAssessmentInput, { orgId: 7, assessmentId }],
    ["invite", recruitmentInviteInput, { orgId: 7, assessmentId, memberId: 31 }],
    ["revoke", recruitmentRevokeInput, { orgId: 7, assignmentId, expectedRevision: 0 }],
    ["candidateGet", recruitmentAssignmentInput, { assignmentId }],
    ["submit", recruitmentSubmitInput, { assignmentId, revision: 0 }],
    ["start", recruitmentStartInput, { assignmentId, acceptedNotice: true, consentVersion: RECRUITMENT_CONSENT_VERSION }],
    ["saveAnswer", recruitmentAnswerInput, answer],
  ])("%s refuses client-supplied identity, entitlement, or answer-key fields", (_label, schema, valid) => {
    expect(schema.safeParse(valid).success).toBe(true);
    for (const field of [
      { email: "candidate@example.test" },
      { candidateEmail: "candidate@example.test" },
      { userId: 31 },
      { token: "synthetic-not-a-token" },
      { isManager: true },
      { correctIndex: 0 },
      { score: 100 },
      { unlockedExamTypes: ["class2-water"] },
    ]) {
      expect(schema.safeParse({ ...valid, ...field }).success).toBe(false);
    }
  });

  it.each([
    ["missing acceptance", { consentVersion: RECRUITMENT_CONSENT_VERSION }],
    ["refused acceptance", { acceptedNotice: false, consentVersion: RECRUITMENT_CONSENT_VERSION }],
    ["string acceptance", { acceptedNotice: "true", consentVersion: RECRUITMENT_CONSENT_VERSION }],
    ["missing version", { acceptedNotice: true }],
    ["obsolete version", { acceptedNotice: true, consentVersion: "recruitment-v0" }],
  ])("start rejects %s", (_label, consent) => {
    expect(recruitmentStartInput.safeParse({ assignmentId, ...consent }).success).toBe(false);
  });

  it.each([-1, 0.5, "0", null, undefined, Number.NaN, Number.POSITIVE_INFINITY])("requires a nonnegative integer answer revision (%s)", revision => {
    expect(recruitmentAnswerInput.safeParse({ ...answer, revision }).success).toBe(false);
  });

  it.each([-1, 0.5, "0", null, undefined, Number.NaN, Number.POSITIVE_INFINITY])("requires a nonnegative integer submit revision (%s)", revision => {
    expect(recruitmentSubmitInput.safeParse({ assignmentId, revision }).success).toBe(false);
  });
  it("submit rejects missing revision and accepts zero or a later reviewed revision", () => {
    expect(recruitmentSubmitInput.safeParse({ assignmentId }).success).toBe(false);
    for (const revision of [0, 1, 100]) expect(recruitmentSubmitInput.parse({ assignmentId, revision })).toEqual({ assignmentId, revision });
  });

  it.each([-1, 0.5, "0", null, undefined, Number.NaN, Number.POSITIVE_INFINITY])("requires a nonnegative integer manager expectedRevision (%s)", expectedRevision => {
    expect(recruitmentRevokeInput.safeParse({ orgId: 7, assignmentId, expectedRevision }).success).toBe(false);
  });
  it("revoke requires expectedRevision, not candidate revision, and accepts reviewed zero or later revision", () => {
    expect(recruitmentRevokeInput.safeParse({ orgId: 7, assignmentId }).success).toBe(false);
    expect(recruitmentRevokeInput.safeParse({ orgId: 7, assignmentId, revision: 0 }).success).toBe(false);
    for (const expectedRevision of [0, 1, 100]) {
      expect(recruitmentRevokeInput.parse({ orgId: 7, assignmentId, expectedRevision })).toEqual({ orgId: 7, assignmentId, expectedRevision });
    }
  });

  it("accepts an explicit unanswered choice but not an absent choice or numeric coercion", () => {
    expect(recruitmentAnswerInput.safeParse({ ...answer, selectedIndex: null }).success).toBe(true);
    expect(recruitmentAnswerInput.safeParse({ assignmentId, questionId: answer.questionId, revision: 0 }).success).toBe(false);
    for (const selectedIndex of [-1, 0.5, 8, "0", Number.NaN, Number.POSITIVE_INFINITY]) {
      expect(recruitmentAnswerInput.safeParse({ ...answer, selectedIndex }).success).toBe(false);
    }
  });

  it("candidate inputs cannot select another organization or assessment", () => {
    for (const schema of [recruitmentAssignmentInput, recruitmentStartInput, recruitmentAnswerInput, recruitmentSubmitInput]) {
      const valid = schema === recruitmentStartInput
        ? { assignmentId, acceptedNotice: true, consentVersion: RECRUITMENT_CONSENT_VERSION }
        : schema === recruitmentAnswerInput ? answer : schema === recruitmentSubmitInput ? { assignmentId, revision: 0 } : { assignmentId };
      expect(schema.safeParse({ ...valid, orgId: 99 }).success).toBe(false);
      expect(schema.safeParse({ ...valid, assessmentId }).success).toBe(false);
    }
  });

  it("requires positive organization/member IDs and valid assignment/assessment UUIDs", () => {
    for (const orgId of [0, -1, 0.5, "7"]) expect(recruitmentOrgInput.safeParse({ orgId }).success).toBe(false);
    for (const memberId of [0, -1, 0.5, "31"]) {
      expect(recruitmentInviteInput.safeParse({ orgId: 7, assessmentId, memberId }).success).toBe(false);
    }
    expect(recruitmentAssignmentInput.safeParse({ assignmentId: "not-a-uuid" }).success).toBe(false);
    expect(recruitmentAssessmentInput.safeParse({ orgId: 7, assessmentId: "not-a-uuid" }).success).toBe(false);
  });

  it("requires explicit expiry and a bounded time limit, with null opting out of a timer", () => {
    expect(recruitmentCreateInput.safeParse({ ...create, timeLimitMinutes: null }).success).toBe(true);
    for (const timeLimitMinutes of [0, 4, 181, 5.5, undefined]) {
      expect(recruitmentCreateInput.safeParse({ ...create, timeLimitMinutes }).success).toBe(false);
    }
    for (const expiresInDays of [0, 31, 1.5, undefined]) {
      expect(recruitmentCreateInput.safeParse({ ...create, expiresInDays }).success).toBe(false);
    }
  });
});
