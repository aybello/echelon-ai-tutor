import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
import { MySqlDialect } from "drizzle-orm/mysql-core";
import { questionAttempts, studentProfiles } from "../drizzle/schema";
import { latestPracticeAttemptValue } from "./practiceReviewEligibility";
import { savePracticeAttempt } from "./practiceAttemptStore";

const source = (relativePath: string) => readFileSync(resolve(process.cwd(), relativePath), "utf8");

describe("WPI historical-attempt interpretation contract", () => {
  afterEach(() => vi.useRealTimers());

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
    const start = router.indexOf("let priority = sql`0`");
    const end = router.indexOf("const parsed = parseLearnerQuestions(rows)", start);
    expect(start).toBeGreaterThanOrEqual(0);
    expect(end).toBeGreaterThan(start);
    const reviewMode = router.slice(start, end);

    expect(reviewMode).toContain('latestPracticeAttemptValue(reviewIdentity, course.courseKey, "correct")');
    expect(reviewMode).toContain('latestPracticeAttemptValue(reviewIdentity, course.courseKey, "confidence")');
    expect(reviewMode).toContain("const rows = await db.select(learnerQuestionColumns).from(questions)");
    expect(reviewMode).not.toContain("question_content_snapshots");

    const dialect = new MySqlDialect();
    for (const field of ["correct", "confidence"] as const) {
      const query = dialect.sqlToQuery(latestPracticeAttemptValue({ userId: 7, email: null }, "wpi-class2-wastewater", field));
      expect(query.sql).toContain("`question_attempts`.`questionId` = `questions`.`questionNum`");
      expect(query.sql).toContain(`SELECT \`question_attempts\`.\`${field}\` FROM \`question_attempts\``);
      expect(query.sql).toContain("ORDER BY `question_attempts`.`createdAt` DESC, `question_attempts`.`id` DESC LIMIT 1");
      expect(query.params).toContain(7);
      expect(query.sql).not.toMatch(/JOIN|question_content_snapshots|questions\.(?:question|options|correctIndex)/i);
    }
  });

  it("the atomic store preserves historical IDs and scores without joining current question content", async () => {
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date("2026-10-17T16:00:00Z"));
    const historical = [{ id: 91, questionId: 1001, correct: "no", selectedIndex: 2, topic: "Safety" }];
    const before = structuredClone(historical);
    const rows = [...historical];
    const profile = { id: 3, topicAccuracy: '{"Safety":{"correct":0,"total":1}}', totalAttempts: 1,
      currentStreak: 4, longestStreak: 8, lastActiveDate: "2026-10-16" };
    const setProfile = vi.fn();
    const tx = {
      insert: (table: unknown) => ({ values: (value: any) => {
        if (table === questionAttempts) { rows.push({ id: 92, ...value }); return Promise.resolve(); }
        expect(table).toBe(studentProfiles);
        return { onDuplicateKeyUpdate: async () => undefined };
      } }),
      select: () => ({ from: (table: unknown) => {
        expect(table).toBe(studentProfiles);
        return { where: () => ({ limit: () => ({ for: async (lock: string) => {
          expect(lock).toBe("update"); return [profile];
        } }) }) };
      } }),
      update: (table: unknown) => {
        expect(table).toBe(studentProfiles);
        return { set: (value: unknown) => ({ where: async () => setProfile(value) }) };
      },
    };
    const transaction = vi.fn(async (callback: (value: typeof tx) => unknown) => callback(tx));
    await expect(savePracticeAttempt({ transaction } as never, { userId: 7,
      examType: "wpi-class2-wastewater", questionId: 1001, correct: "yes", selectedIndex: 1,
      topic: "Safety", quizMode: "standard" })).resolves.toEqual({ success: true, correct: true });
    expect(transaction).toHaveBeenCalledTimes(1);
    expect(rows[0]).toEqual(before[0]);
    expect(historical).toEqual(before);
    expect(rows[1]).toMatchObject({ id: 92, questionId: 1001, correct: "yes", selectedIndex: 1 });
    expect(setProfile).toHaveBeenCalledWith(expect.objectContaining({ totalAttempts: 2,
      topicAccuracy: '{"Safety":{"correct":1,"total":2}}', currentStreak: 5,
      longestStreak: 8, lastActiveDate: "2026-10-17" }));
  });
});
