import fs from "node:fs";
import path from "node:path";
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

  it("does not expose governance-only metadata to learner quiz clients", () => {
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

  it("excludes explicitly rejected questions from every learner-facing bank read", () => {
    const expectedMinimumUses: Record<string, number> = {
      "server/routers/quizRouter.ts": 3,
      "server/routers/activationRouter.ts": 2,
      "server/routers.ts": 2,
      "server/routers/dashboardRouter.ts": 1,
      "server/readinessSnapshot.ts": 1,
    };

    for (const [relativePath, expectedMinimum] of Object.entries(expectedMinimumUses)) {
      const source = fs.readFileSync(path.resolve(process.cwd(), relativePath), "utf8");
      const uses = source.match(/learnerVisibleQuestionFilter\(\)/g) ?? [];
      expect(uses.length, `${relativePath} is missing a rejected-question guard`).toBeGreaterThanOrEqual(expectedMinimum);
    }

    const quizRouter = fs.readFileSync(
      path.resolve(process.cwd(), "server/routers/quizRouter.ts"),
      "utf8",
    );
    expect(quizRouter.match(/reviewStatus <> 'rejected'/g)).toHaveLength(2);
  });

  it("invalidates cached banks when an admin changes a review decision", () => {
    const adminRouter = fs.readFileSync(
      path.resolve(process.cwd(), "server/routers/admin.ts"),
      "utf8",
    );
    expect(adminRouter).toContain("contentVersion: sql`${questionBankMeta.contentVersion} + 1`");
    expect(adminRouter).toContain("AND ${questions.reviewStatus} <> 'rejected'");
  });
});
