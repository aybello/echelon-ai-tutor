import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ getDb: vi.fn() }));
vi.mock("./db", () => mocks);

import { dashboardRouter } from "./routers/dashboardRouter";

const ctx = {
  user: { id: 7, email: "bookmark-fixture@echelon.test" },
  studentEmail: null,
  req: { headers: {} },
  res: {},
} as any;

beforeEach(() => vi.clearAllMocks());

describe("dashboard bookmark read reliability", () => {
  it("does not represent an unavailable database as an empty bookmark list", async () => {
    mocks.getDb.mockResolvedValue(null);

    await expect(dashboardRouter.createCaller(ctx).bookmarkedQuestions({ examType: "audit-course" }))
      .rejects.toMatchObject({
        code: "SERVICE_UNAVAILABLE",
        message: "Bookmarks are temporarily unavailable. Please retry.",
      });
  });
});
