import { expect, it } from "vitest";
import { ceuCurricula } from "./catalogue";
import { newCeuRecord, ceuActionAlreadySaved } from "./learningState";
import { countCeuRecord, emptyCeuMetrics } from "./metrics";

it("counts saved courses without multiplying repeated actions or confusing retakes with learners", () => {
  const r = newCeuRecord(ceuCurricula[0], "Fixture", "1234");
  const moduleId = Object.keys(r.modules)[0];
  r.modules[moduleId].slideIndex = 3;
  r.modules[moduleId].resumeSlideIndex = 1;
  r.modules[moduleId].completedAt = r.updatedAt;
  r.audit = [1, 2].map(() => ({ at: r.updatedAt, actor: "fixture", action: "certificateViewed" }));
  r.attempts = [{ id: "a", answers: [1], score: 0, total: 1, passed: false, at: r.updatedAt }];
  r.assessmentDraft = { attemptId: "b", answers: [null] };
  r.evaluation = { rating: 4, useful: "", improve: "", at: r.updatedAt };
  const totals = emptyCeuMetrics();
  countCeuRecord(totals, r);
  expect(totals).toMatchObject({ enrollments: 1, learningStarted: 1, modulesCompleted: 1, finalStarted: 1, finalSubmitted: 1, retries: 1, certificatesViewed: 1, completed: 0, evaluations: 1, ratingSum: 4 });
  expect(ceuActionAlreadySaved(r, { type: "slideProgress", moduleId, slideIndex: 1 })).toBe(true);
  expect(ceuActionAlreadySaved(r, { type: "slideProgress", moduleId, slideIndex: 2 })).toBe(false);
  expect(ceuActionAlreadySaved(r, { type: "examDraft", attemptId: "b", answers: [null], flaggedQuestionIndexes: [] })).toBe(true);
});
