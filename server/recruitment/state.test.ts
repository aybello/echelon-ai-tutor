import { describe, expect, it } from "vitest";
import type { RecruitmentAssessmentRow, RecruitmentAssignmentRow } from "../../drizzle/schema";
import { RECRUITMENT_CONSENT_VERSION } from "../../shared/recruitmentAssessment";
import { assignmentDeadline, finalizeRecruitmentDeadline, recruitmentCandidateView, recruitmentResult, snapshotAnswers, transitionRecruitment } from "./state";
import type { RecruitmentOperation } from "./types";

const NOW = 1_000_000;
const ID = "11111111-1111-4111-8111-111111111111";
const assessment = () => ({ id: "22222222-2222-4222-8222-222222222222", orgId: 7, title: "Synthetic assessment", courseKey: "class2-water", courseLabel: "Class 2 Water", modules: ["Treatment", "Distribution"], questionCount: 5, timeLimitMinutes: 5, expiresAtMs: NOW + 900_000,
  questions: Array.from({ length: 5 }, (_, i) => ({ id: `q${i + 1}`, module: i < 3 ? "Treatment" : "Distribution", prompt: `Synthetic prompt ${i + 1}`, options: ["One", "Two"], correctIndex: i % 2 })),
} as RecruitmentAssessmentRow);
const invited = () => ({ id: ID, assessmentId: assessment().id, orgId: 7, memberId: 31, candidateEmail: "candidate@example.test", candidateName: "Synthetic candidate", creatorEmail: "manager@example.test", status: "invited", startedAtMs: null, submittedAtMs: null, consentVersion: null, consentAcceptedAtMs: null, expiresAtMs: NOW + 900_000, updatedAtMs: NOW - 1000, answers: {}, score: null, revision: 0, revokedAtMs: null, revokedByEmail: null } as RecruitmentAssignmentRow);
const active = () => ({ ...invited(), status: "active" as const, startedAtMs: NOW, consentVersion: RECRUITMENT_CONSENT_VERSION, consentAcceptedAtMs: NOW, revision: 1 });
const start: RecruitmentOperation = { kind: "start", input: { assignmentId: ID, acceptedNotice: true, consentVersion: RECRUITMENT_CONSENT_VERSION } };
const answer = (revision = 1, questionId = "q1", selectedIndex: number | null = 0): RecruitmentOperation => ({ kind: "answer", input: { assignmentId: ID, revision, questionId, selectedIndex } });

function assertCandidatePrivacy(dto: unknown) {
  const json = JSON.stringify(dto);
  for (const key of ["correctIndex", "explanation", "score", "percent", "candidateEmail", "memberId", "creatorEmail", "revokedByEmail", "consentAcceptedAtMs"]) {
    expect(json).not.toContain(`"${key}"`);
  }
}

describe("recruitment durable state transitions", () => {
  it("records explicit consent once and never mutates the invitation or frozen form", () => {
    const form = assessment(), row = invited(), before = structuredClone({ form, row });
    const next = transitionRecruitment(form, row, start, NOW);
    expect(next).toMatchObject({ status: "active", startedAtMs: NOW, consentAcceptedAtMs: NOW, consentVersion: RECRUITMENT_CONSENT_VERSION, revision: 1, updatedAtMs: NOW });
    expect(next.id).toBe(row.id); expect(next.expiresAtMs).toBe(row.expiresAtMs);
    expect({ form, row }).toEqual(before);
    expect(transitionRecruitment(form, next, start, NOW + 90_000)).toBe(next);
  });
  it.each([{ acceptedNotice: false, consentVersion: RECRUITMENT_CONSENT_VERSION }, { acceptedNotice: true, consentVersion: "recruitment-v0" }])("rejects missing/refused or obsolete consent even at the reducer boundary", input => {
    expect(() => transitionRecruitment(assessment(), invited(), { kind: "start", input: { assignmentId: ID, ...input } } as RecruitmentOperation, NOW)).toThrowError(expect.objectContaining({ code: "BAD_REQUEST" }));
  });
  it.each([answer(0), { kind: "submit" } as RecruitmentOperation])("requires start before answers or submission", operation => {
    expect(() => transitionRecruitment(assessment(), invited(), operation, NOW)).toThrowError(expect.objectContaining({ code: "CONFLICT" }));
  });
  it("persists just the selected choice with the next revision; null explicitly clears it", () => {
    const row = active();
    const saved = transitionRecruitment(assessment(), row, answer(), NOW + 1000);
    expect(saved).toMatchObject({ answers: { q1: 0 }, revision: 2, status: "active", score: null });
    expect(row.answers).toEqual({});
    const cleared = transitionRecruitment(assessment(), saved, answer(2, "q1", null), NOW + 2000);
    expect(cleared.answers).toEqual({}); expect(cleared.revision).toBe(3);
  });
  it.each([0, 2, 100])("refuses stale or future revision %s without changing durable answers", revision => {
    const row = { ...active(), answers: { q1: 1 } };
    const before = structuredClone(row);
    expect(() => transitionRecruitment(assessment(), row, answer(revision), NOW + 1000)).toThrowError(expect.objectContaining({ code: "CONFLICT" }));
    expect(row).toEqual(before);
  });
  it.each([["foreign-q", 0], ["q1", -1], ["q1", 2], ["q1", 0.5], ["q1", Number.NaN]] as const)("rejects unknown question or invalid choice (%s/%s)", (questionId, choice) => {
    const row = active();
    expect(() => transitionRecruitment(assessment(), row, answer(1, questionId, choice), NOW + 1000)).toThrowError(expect.objectContaining({ code: "BAD_REQUEST" }));
    expect(row.revision).toBe(1); expect(row.answers).toEqual({});
  });
  it("submits only durable answers, recomputes score, and makes repeat submit idempotent", () => {
    const row = { ...active(), answers: { q1: 0, q2: 0 }, score: { correct: 999 } as RecruitmentAssignmentRow["score"] };
    const next = transitionRecruitment(assessment(), row, { kind: "submit" }, NOW + 1000);
    expect(next).toMatchObject({ status: "submitted", submittedAtMs: NOW + 1000, revision: 2, score: { correct: 1, total: 5, answered: 2, unanswered: 3, percent: 20 } });
    expect(transitionRecruitment(assessment(), next, { kind: "submit" }, NOW + 2000)).toBe(next);
    expect(() => transitionRecruitment(assessment(), next, answer(2), NOW + 2000)).toThrowError(expect.objectContaining({ code: "CONFLICT" }));
  });
  it("at the exact deadline a late answer is not saved and last saved answers become the final score", () => {
    const row = { ...active(), answers: { q1: 0, q2: 0 } };
    const next = transitionRecruitment(assessment(), row, answer(1, "q2", 1), NOW + 300_000);
    expect(next).toMatchObject({ status: "timed_out", answers: { q1: 0, q2: 0 }, submittedAtMs: NOW + 300_000, revision: 2, score: { correct: 1, answered: 2, total: 5, percent: 20 } });
    expect(transitionRecruitment(assessment(), next, { kind: "submit" }, NOW + 400_000)).toBe(next);
  });
  it("late lazy timeout records the deadline, not the eventual read time", () => {
    const next = finalizeRecruitmentDeadline(assessment(), active(), NOW + 600_000);
    expect(next.submittedAtMs).toBe(NOW + 300_000); expect(next.updatedAtMs).toBe(NOW + 600_000);
  });
  it("unstarted invitation expires without a score, consent or start timestamp", () => {
    const row = invited();
    const next = transitionRecruitment(assessment(), row, start, row.expiresAtMs);
    expect(next).toMatchObject({ status: "expired", revision: 1, score: null, startedAtMs: null, consentAcceptedAtMs: null });
  });
  it.each(["submitted", "timed_out", "expired", "revoked"] as const)("deadline reconciliation never rewrites a terminal %s row", status => {
    const row = { ...active(), status, answers: { q1: 1 }, submittedAtMs: NOW + 1000 };
    expect(finalizeRecruitmentDeadline(assessment(), row, NOW + 999_999)).toBe(row);
  });
  it("revoked state cannot be restarted, answered, or submitted", () => {
    const row = { ...active(), status: "revoked" as const, revokedAtMs: NOW + 1000 };
    for (const operation of [start, answer(), { kind: "submit" } as const]) expect(transitionRecruitment(assessment(), row, operation, NOW + 2000)).toBe(row);
  });
  it("uses the earliest original form expiry, assignment expiry or timer deadline", () => {
    expect(assignmentDeadline(assessment(), active())).toBe(NOW + 300_000);
    expect(assignmentDeadline({ ...assessment(), expiresAtMs: NOW + 2000 }, active())).toBe(NOW + 2000);
    expect(assignmentDeadline(assessment(), { ...active(), expiresAtMs: NOW + 1000 })).toBe(NOW + 1000);
    expect(assignmentDeadline({ ...assessment(), timeLimitMinutes: null }, active())).toBe(NOW + 900_000);
  });
});

describe("recruitment candidate and manager projections", () => {
  it.each(["invited", "active", "submitted", "timed_out", "expired", "revoked"] as const)("candidate %s DTO never forwards answer keys, score, or arbitrary stored fields", status => {
    const form = assessment();
    form.questions[0] = { ...form.questions[0], explanation: "secret explanation", score: 100 } as typeof form.questions[number];
    const row = { ...active(), status, answers: { q1: 0, q2: 1, foreign: 0, q3: 999 }, score: { correct: 100, percent: 100 } as RecruitmentAssignmentRow["score"] };
    const dto = recruitmentCandidateView(form, row, "Synthetic utility", NOW + 1000);
    assertCandidatePrivacy(dto); expect(dto.answers).toEqual({ q1: 0, q2: 1 });
    expect(dto.questions).toHaveLength(status === "active" ? 5 : 0);
    if (status === "active") expect(Object.keys(dto.questions[0]).sort()).toEqual(["id", "module", "options", "prompt"]);
  });
  it("withholds all prompts/options and saved choices before start, even if an invited row contains answers", () => {
    const dto = recruitmentCandidateView(assessment(), { ...invited(), answers: { q1: 0 } }, "Synthetic utility", NOW);
    expect(dto.questions).toEqual([]); expect(dto.answers).toEqual({});
    expect(JSON.stringify(dto)).not.toContain("Synthetic prompt");
  });
  it("copies candidate options and modules so a caller cannot mutate the authoritative form", () => {
    const form = assessment(), row = active(), before = structuredClone(form);
    const dto = recruitmentCandidateView(form, row, "Synthetic utility", NOW);
    dto.questions[0].options[0] = "Changed"; dto.modules.push("Other");
    expect(form).toEqual(before);
  });
  it("filters foreign, invalid and inherited stored answer keys rather than scoring them", () => {
    const row = { ...active(), answers: Object.assign(Object.create({ q1: 0 }), { q2: 1, q3: -1, q4: 2, q5: 0.5, foreign: 0 }) };
    expect(snapshotAnswers(assessment(), row)).toEqual({ q2: 1 });
  });
  it.each([null, [], "{bad}"])("rejects corrupt durable answers %s", answers => {
    expect(() => snapshotAnswers(assessment(), { ...active(), answers } as unknown as RecruitmentAssignmentRow)).toThrowError(expect.objectContaining({ code: "INTERNAL_SERVER_ERROR" }));
  });
  it("manager reporting recomputes terminal score instead of trusting cached score and hides pending scores", () => {
    const row = { ...active(), answers: { q1: 0 }, score: { correct: 999 } as RecruitmentAssignmentRow["score"] };
    expect(recruitmentResult(assessment(), row, NOW + 1000).score).toBeNull();
    const result = recruitmentResult(assessment(), { ...row, status: "submitted", submittedAtMs: NOW + 1000 }, NOW + 2000);
    expect(result.score).toMatchObject({ correct: 1, total: 5, answered: 1, percent: 20 });
    expect(result.questions[0].correctIndex).toBe(0);
  });
});
