/**
 * Regression tests for the welcome email scheduled job (Issue C).
 *
 * The bug: the original code used setTimeout(24h) in the Stripe webhook to send
 * the onboarding email. This is fragile — server restarts silently drop the timer.
 *
 * The fix: a scheduled hourly job queries purchases where welcomeEmailSentAt IS NULL
 * and createdAt <= NOW() - 24h, sends the email, and marks the column.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

// ─── Mock dependencies ────────────────────────────────────────────────────────
vi.mock("./db", () => ({
  getDb: vi.fn(),
}));

vi.mock("./email", () => ({
  sendWelcomeOnboardingEmail: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("./stripe/products", () => ({
  PRODUCT_STUDY_PATHS: {
    "oit": { quizPath: "/oit-quiz", mockPath: "/oit-mock" },
    "class1-water": { quizPath: "/class1-quiz", mockPath: "/class1-mock" },
  },
}));

vi.mock("./_core/notification", () => ({
  notifyOwner: vi.fn().mockResolvedValue(true),
}));

import { getDb } from "./db";
import { sendWelcomeOnboardingEmail } from "./email";
import { runWelcomeEmailJob } from "./jobs/welcomeEmail";

// ─── Test helpers ─────────────────────────────────────────────────────────────
function makePurchase(overrides: Record<string, unknown> = {}) {
  return {
    id: 1,
    email: "test@example.com",
    customerName: "Test User",
    productKey: "oit",
    productName: "OIT Exam Prep",
    status: "active",
    welcomeEmailSentAt: null,
    createdAt: new Date(Date.now() - 25 * 60 * 60 * 1000), // 25 hours ago
    ...overrides,
  };
}

function makeDb(rows: unknown[] = []) {
  const updateSet = vi.fn().mockReturnThis();
  const updateWhere = vi.fn().mockResolvedValue(undefined);
  const selectFrom = vi.fn().mockReturnThis();
  const selectWhere = vi.fn().mockReturnThis();
  const selectLimit = vi.fn().mockResolvedValue(rows);

  return {
    select: vi.fn().mockReturnValue({ from: selectFrom }),
    from: selectFrom,
    where: selectWhere,
    limit: selectLimit,
    update: vi.fn().mockReturnValue({ set: updateSet }),
    set: updateSet,
    // chain: update().set().where()
    _updateWhere: updateWhere,
  };
}

describe("runWelcomeEmailJob (Issue C regression)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("sends email and marks welcomeEmailSentAt for eligible purchases", async () => {
    const purchase = makePurchase();
    const db = {
      select: vi.fn().mockReturnThis(),
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      limit: vi.fn().mockResolvedValue([purchase]),
      update: vi.fn().mockReturnThis(),
      set: vi.fn().mockReturnThis(),
    };
    // Make update().set().where() resolve
    db.set.mockReturnValue({ where: vi.fn().mockResolvedValue(undefined) });

    vi.mocked(getDb).mockResolvedValue(db as any);

    const result = await runWelcomeEmailJob();

    expect(sendWelcomeOnboardingEmail).toHaveBeenCalledOnce();
    expect(sendWelcomeOnboardingEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        email: "test@example.com",
        productKey: "oit",
        quizPath: "/oit-quiz",
        mockPath: "/oit-mock",
      })
    );
    expect(result.sent).toBe(1);
    expect(result.errors).toHaveLength(0);
  });

  it("returns sent=0 when no eligible purchases exist", async () => {
    const db = {
      select: vi.fn().mockReturnThis(),
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      limit: vi.fn().mockResolvedValue([]),
    };

    vi.mocked(getDb).mockResolvedValue(db as any);

    const result = await runWelcomeEmailJob();

    expect(sendWelcomeOnboardingEmail).not.toHaveBeenCalled();
    expect(result.sent).toBe(0);
    expect(result.errors).toHaveLength(0);
  });

  it("records error and continues when email send fails for one purchase", async () => {
    const purchase1 = makePurchase({ id: 1, email: "ok@example.com" });
    const purchase2 = makePurchase({ id: 2, email: "fail@example.com" });

    let callCount = 0;
    vi.mocked(sendWelcomeOnboardingEmail).mockImplementation(async () => {
      callCount++;
      if (callCount === 2) throw new Error("SMTP timeout");
    });

    const db = {
      select: vi.fn().mockReturnThis(),
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      limit: vi.fn().mockResolvedValue([purchase1, purchase2]),
      update: vi.fn().mockReturnThis(),
      set: vi.fn().mockReturnValue({ where: vi.fn().mockResolvedValue(undefined) }),
    };

    vi.mocked(getDb).mockResolvedValue(db as any);

    const result = await runWelcomeEmailJob();

    expect(result.sent).toBe(1);
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0]).toContain("fail@example.com");
  });

  it("throws when database is unavailable", async () => {
    vi.mocked(getDb).mockResolvedValue(null as any);

    await expect(runWelcomeEmailJob()).rejects.toThrow("Database unavailable");
  });
});
