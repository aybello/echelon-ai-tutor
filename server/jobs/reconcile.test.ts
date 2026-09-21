import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  mockGetDb,
  mockListSessions,
  mockRecordPurchase,
} = vi.hoisted(() => ({
  mockGetDb: vi.fn(),
  mockListSessions: vi.fn(),
  mockRecordPurchase: vi.fn(),
}));

vi.mock("../db", () => ({ getDb: mockGetDb }));
vi.mock("../purchaseEmailOutbox", () => ({
  recordPurchaseWithConfirmation: mockRecordPurchase,
}));
vi.mock("stripe", () => ({
  default: vi.fn().mockImplementation(() => ({
    checkout: { sessions: { list: mockListSessions } },
    paymentIntents: { retrieve: vi.fn() },
  })),
}));

import { runReconciliation } from "./reconcile";
import { INDIVIDUAL_EXAM_PASS_POLICY_VERSION } from "../stripe/individualExamPass";

describe("runReconciliation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.STRIPE_SECRET_KEY = "sk_test_reconciliation";
    mockGetDb.mockResolvedValue({
      select: vi.fn(() => ({
        from: vi.fn(() => ({
          where: vi.fn(() => ({ limit: vi.fn().mockResolvedValue([]) })),
        })),
      })),
    });
  });

  it("does not create a current Individual Exam Pass outside its signed webhook", async () => {
    mockListSessions.mockResolvedValue({
      data: [{
        id: "cs_current_individual",
        payment_status: "paid",
        amount_total: 4900,
        metadata: {
          product_key: "oit",
          customer_email: "learner@example.com",
          individual_access_policy: INDIVIDUAL_EXAM_PASS_POLICY_VERSION,
        },
      }],
      has_more: false,
    });

    const result = await runReconciliation(48);

    expect(mockRecordPurchase).not.toHaveBeenCalled();
    expect(result.recovered).toBe(0);
    expect(result.errors).toEqual([
      "cs_current_individual: current Individual Exam Pass requires signed webhook replay",
    ]);
  });

  it("does not create an unversioned historical pass outside evidence-bound recovery", async () => {
    mockListSessions.mockResolvedValue({
      data: [{
        id: "cs_historical_individual",
        payment_status: "paid",
        amount_total: 4900,
        metadata: {
          product_key: "oit",
          customer_email: "legacy@example.com",
        },
      }],
      has_more: false,
    });

    const result = await runReconciliation(48);

    expect(mockRecordPurchase).not.toHaveBeenCalled();
    expect(result.recovered).toBe(0);
    expect(result.errors).toEqual([
      "cs_historical_individual: historical Individual Exam Pass requires evidence-bound recovery",
    ]);
  });
});
