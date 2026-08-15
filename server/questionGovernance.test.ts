import { getTableColumns } from "drizzle-orm";
import { getTableConfig } from "drizzle-orm/mysql-core";
import { describe, expect, it } from "vitest";
import { questions } from "../drizzle/schema";
import { learnerQuestionColumns } from "./routers/quizRouter";

describe("question governance schema", () => {
  it("stores a source, blueprint objective, review state, reviewer, and review date per question", () => {
    const columns = getTableColumns(questions);
    expect(columns).toMatchObject({
      sourceTitle: expect.anything(),
      sourceReference: expect.anything(),
      sourceUrl: expect.anything(),
      blueprintObjective: expect.anything(),
      reviewStatus: expect.anything(),
      reviewedBy: expect.anything(),
      reviewedAt: expect.anything(),
    });
    expect(columns.reviewStatus.notNull).toBe(true);
    expect(columns.reviewStatus.hasDefault).toBe(true);
  });

  it("indexes review queues globally and by question bank", () => {
    const indexNames = getTableConfig(questions).indexes.map((entry) => entry.config.name);
    expect(indexNames).toContain("question_review_status_idx");
    expect(indexNames).toContain("question_bank_review_status_idx");
  });

  it("does not make ordinary learner quiz reads depend on migration 0053 columns", () => {
    expect(Object.keys(learnerQuestionColumns)).not.toEqual(expect.arrayContaining([
      "sourceTitle",
      "sourceReference",
      "sourceUrl",
      "blueprintObjective",
      "reviewStatus",
      "reviewedBy",
      "reviewedAt",
    ]));
  });
});
