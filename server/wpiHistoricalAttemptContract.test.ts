import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const source = (relativePath: string) => readFileSync(resolve(process.cwd(), relativePath), "utf8");

describe("WPI historical-attempt interpretation contract", () => {
  it("keeps dashboard historical attempt surfaces limited to attempt metadata", () => {
    const router = source("server/routers/dashboardRouter.ts");
    const start = router.indexOf("missedQuestions: publicProcedure");
    const end = router.indexOf("lowConfidenceQuestions: publicProcedure", start);
    const missedQuestions = router.slice(start, end);

    expect(missedQuestions).toContain("questionId: questionAttempts.questionId");
    expect(missedQuestions).toContain("topic: questionAttempts.topic");
    expect(missedQuestions).not.toContain(".from(questions)");
    expect(missedQuestions).not.toContain("questions.question");
    expect(missedQuestions).not.toContain("questions.options");
    expect(missedQuestions).not.toContain("questions.correctIndex");
  });

  it("uses historical attempts only to select current practice content, not to restate historic content", () => {
    const router = source("server/routers/quizRouter.ts");
    const start = router.indexOf("const attemptScope = and(");
    const end = router.indexOf("return { questions: parseLearnerQuestions", start);
    const reviewMode = router.slice(start, end);

    expect(reviewMode).toContain("eq(questionAttempts.questionId, questions.questionNum)");
    expect(reviewMode).toContain("const rows = await db.select(learnerQuestionColumns).from(questions)");
    expect(reviewMode).not.toContain("question_content_snapshots");
  });
});
