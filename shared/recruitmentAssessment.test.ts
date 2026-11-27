import { describe, expect, it } from "vitest";
import { RECRUITMENT_NOTICE, candidateQuestions, recruitmentAnswerInput, recruitmentCreateInput, recruitmentDeadline, recruitmentStartInput, scoreRecruitment, selectRecruitmentQuestions, validRecruitmentQuestions, validRecruitmentSelectionQuestions, type RecruitmentQuestion } from "./recruitmentAssessment";
const pool: RecruitmentQuestion[] = Array.from({ length: 12 }, (_, n) => ({ id: String(n), module: n < 8 ? "Treatment" : "Distribution", prompt: `Question ${n}`, options: ["A", "B", "C", "D"], correctIndex: n % 4 }));
const org = { orgId: 1, title: "Operator recruitment", courseKey: "class2-water", modules: ["Treatment", "Distribution"], questionCount: 5, timeLimitMinutes: 30, expiresInDays: 7 };
describe("Recruitment assessment domain", () => {
  it("discloses automatic timed scoring and explicit untimed submission before consent", () => {
    expect(RECRUITMENT_NOTICE).toContain("Timed assessments automatically record and score your saved answers");
    expect(RECRUITMENT_NOTICE).toContain("unless the assessment invitation is revoked before that deadline");
    expect(RECRUITMENT_NOTICE).toContain("Losing your team seat or course access prevents further answers but does not cancel this automatic scoring");
    expect(RECRUITMENT_NOTICE).toContain("Untimed assessments require you to submit");
    expect(RECRUITMENT_NOTICE).toContain("unsubmitted untimed assessment expires without a score");
  });
  it("balances topics without duplicates, leaves the bank untouched and freezes a complete form", () => {
    const before = JSON.stringify(pool);
    const selected = selectRecruitmentQuestions(pool, org.modules, 7, () => 0.3);
    expect(selected).toHaveLength(7); expect(new Set(selected.map(q => q.id)).size).toBe(7);
    expect(selected.filter(q => q.module === "Treatment")).toHaveLength(4);
    expect(selected.filter(q => q.module === "Distribution")).toHaveLength(3);
    expect(JSON.stringify(pool)).toBe(before);
  });
  it("rejects undersized and unavailable topic pools, never silently shortens an assessment", () => {
    expect(() => selectRecruitmentQuestions(pool, org.modules, 13)).toThrow(/Not enough/);
    expect(() => selectRecruitmentQuestions(pool, ["Unknown"], 5)).toThrow(/no usable/);
    expect(() => selectRecruitmentQuestions(pool, org.modules, 1)).toThrow(/one question/);
  });
  it("counts unanswered and invalid choices as wrong, ignores foreign IDs", () => {
    const score = scoreRecruitment(pool.slice(0, 4), { "0": 0, "1": 3, "2": 100, foreign: 0 });
    expect(score).toMatchObject({ correct: 1, total: 4, answered: 2, unanswered: 2, percent: 25 });
    expect(score.topics[0]).toEqual({ module: "Treatment", correct: 1, total: 4, answered: 2, percent: 25 });
  });
  it("has no answer keys, explanations or scores in candidate projections, including arbitrary snapshot fields", () => {
    const hidden = { ...pool[0], explanation: "secret", score: 100, extra: { correctIndex: 0 } };
    expect(candidateQuestions([hidden])).toEqual([{ id: "0", module: "Treatment", prompt: "Question 0", options: ["A", "B", "C", "D"] }]);
    const dto = candidateQuestions([pool[0]]); dto[0].options[0] = "Changed"; expect(pool[0].options[0]).toBe("A");
  });
  it("uses the earlier invitation expiry or original start plus time limit, not a reset-on-refresh timer", () => {
    expect(recruitmentDeadline(1_000, 5, 900_000)).toBe(301_000);
    expect(recruitmentDeadline(1_000, 5, 50_000)).toBe(50_000);
    expect(recruitmentDeadline(null, 5, 900_000)).toBe(900_000);
    expect(recruitmentDeadline(1_000, null, 900_000)).toBe(900_000);
    expect(recruitmentDeadline(0, 5, 900_000)).toBe(300_000);
  });
  it("validates real questions and rejects malformed duplicate IDs or out-of-range answer keys", () => {
    expect(validRecruitmentQuestions(pool)).toBe(true);
    expect(validRecruitmentQuestions([pool[0], pool[0]])).toBe(false);
    expect(validRecruitmentQuestions([{ ...pool[0], correctIndex: 4 }])).toBe(false);
    expect(validRecruitmentQuestions([{ ...pool[0], options: [""] }])).toBe(false);
    expect(validRecruitmentQuestions([])).toBe(false);
  });
  it.each([
    ["Same", "Same"], [" Same ", "Same"], ["One\t\n\f\r  choice", "One choice"], ["Caf\u00e9", "Cafe\u0301"],
    ["Yes", "Yes\u200B"], ["Yes", "Yes\u2060"], ["Yes", "Yes\uFEFF"], ["Yes", "Yes\u034F"],
  ])("excludes display-equivalent options %j before new frozen sampling, not historical scoring", (...options) => {
    const historical = { ...pool[0], options, correctIndex: 1 }, before = structuredClone(historical);
    expect(validRecruitmentSelectionQuestions([historical])).toBe(false);
    expect(() => selectRecruitmentQuestions([historical], [historical.module], 1)).toThrow(/no usable/);
    expect(validRecruitmentQuestions([historical])).toBe(true);
    expect(scoreRecruitment([historical], { [historical.id]: 1 })).toMatchObject({ correct: 1 });
    expect(scoreRecruitment([historical], { [historical.id]: 0 })).toMatchObject({ correct: 0 });
    expect(historical).toEqual(before);
  });
  it.each([["CO", "Co"], ["m2", "m\u00b2"], ["H2O", "H\u2082O"], ["A B", "A\u00a0B"]])("preserves meaningful option distinctions %j without lowercasing or compatibility normalization", (...options) => {
    expect(validRecruitmentSelectionQuestions([{ ...pool[0], options }])).toBe(true);
  });
  it("does not include duplicate-option rows in new usable counts or silently shorten a frozen selection", () => {
    const questions = pool.slice(0, 5).map((q, i) => i ? q : { ...q, options: ["One", " One "] });
    expect(() => selectRecruitmentQuestions(questions, ["Treatment"], 5)).toThrow(/Not enough usable/);
    expect(selectRecruitmentQuestions(questions, ["Treatment"], 4)).not.toContainEqual(questions[0]);
  });
  it("rejects unexpected score, identity, entitlement or token fields on the API inputs", () => {
    expect(recruitmentCreateInput.safeParse(org).success).toBe(true);
    expect(recruitmentCreateInput.safeParse({ ...org, modules: ["Treatment", "Treatment"] }).success).toBe(false);
    expect(recruitmentCreateInput.safeParse({ ...org, candidateEmail: "other@example.test" }).success).toBe(false);
    const id = "11111111-1111-4111-8111-111111111111";
    expect(recruitmentStartInput.safeParse({ assignmentId: id, acceptedNotice: false, consentVersion: "recruitment-v1" }).success).toBe(false);
    expect(recruitmentAnswerInput.safeParse({ assignmentId: id, questionId: "0", selectedIndex: 1, revision: 0, score: 100 }).success).toBe(false);
  });
});
