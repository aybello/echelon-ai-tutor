import { describe, expect, it } from "vitest";
import { newCeuRecord } from "../server/ceu/learningState";
import { ceuCourse } from "../server/ceu/catalogue";
import { ceuFinalEntry } from "./ceuFinalEntry";

const course = ceuCourse("ceu-sampling-data-quality")!;
const record = () => newCeuRecord(course, "Example Learner", "90000064", "2026-09-25T15:00:00.000Z");

describe("CEU final assessment entry", () => {
  it("starts an exam only when no draft or submitted attempt exists", () => {
    expect(ceuFinalEntry(record())).toEqual({ view: "exam" });
  });

  it("reopens a saved draft without treating it as a submitted result", () => {
    const learner = record();
    learner.assessmentDraft = { attemptId: "4b65d63e-4d73-4078-b7cb-7a4d4e693abc", answers: [null], flaggedQuestionIndexes: [] };
    expect(ceuFinalEntry(learner)).toEqual({ view: "exam" });
  });

  it("reopens the latest submitted result instead of reusing its attempt ID", () => {
    const learner = record();
    learner.attempts.push({ id: "27b36b1d-4b36-4c77-9bd7-47737d84a5ba", answers: [0], score: 0, total: 1, passed: false, at: "2026-09-25T15:10:00.000Z" });
    expect(ceuFinalEntry(learner)).toEqual({ view: "results", attemptId: "27b36b1d-4b36-4c77-9bd7-47737d84a5ba" });
  });

  it("takes a completed learner to the certificate", () => {
    const learner = record();
    learner.completion = { id: "certificate-id", at: "2026-09-25T15:10:00.000Z", name: learner.learnerName, operatorNumber: learner.operatorNumber, courseId: course.key, recordedMinutes: 0, finalScore: 8, finalTotal: 10, statement: "Non-credit pilot." };
    expect(ceuFinalEntry(learner)).toEqual({ view: "certificate" });
  });
});
