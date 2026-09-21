import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  mockGetDb,
  mockListSessions,
  mockRecordPurchase,
  mockLookup,
  mockWhere,
  mockInsert,
  mockUpdate,
} = vi.hoisted(() => ({
  mockGetDb: vi.fn(),
  mockListSessions: vi.fn(),
  mockRecordPurchase: vi.fn(),
  mockLookup: vi.fn(),
  mockWhere: vi.fn(),
  mockInsert: vi.fn(),
  mockUpdate: vi.fn(),
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

import { eq } from "drizzle-orm";
import { purchases } from "../../drizzle/schema";
import { runReconciliation } from "./reconcile";
import { INDIVIDUAL_EXAM_PASS_POLICY_VERSION } from "../stripe/individualExamPass";

describe("runReconciliation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.STRIPE_SECRET_KEY = "sk_test_reconciliation";
    mockLookup.mockReset().mockResolvedValue([]);
    mockWhere.mockImplementation(() => ({ limit: mockLookup }));
    mockGetDb.mockResolvedValue({
      insert: mockInsert,
      update: mockUpdate,
      select: vi.fn(() => ({
        from: vi.fn(() => ({
          where: mockWhere,
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
  it.each(["current", "historical", "refunded", "expired"])("skips a recorded %s purchase without granting access or flagging recovery", async (kind) => {
    const id = `cs_recorded_${kind}`;
    mockListSessions.mockResolvedValue({data: [{
      id, payment_status: "paid", customer_details: {email: "Learner@Example.com"},
      metadata: {product_key: "oit", ...(kind === "current" ? {individual_access_policy: INDIVIDUAL_EXAM_PASS_POLICY_VERSION} : {})},
    }], has_more: false});
    mockLookup.mockResolvedValue([{id: 1, email: "learner@example.com", productKey: "oit", status: kind === "refunded" ? "refunded" : "active", accessExpiresAt: kind === "expired" ? new Date(0) : null}]);
    expect(await runReconciliation()).toEqual({recovered: 0, skipped: 1, details: [], errors: []});
    expect(mockWhere).toHaveBeenCalledWith(eq(purchases.stripeSessionId, id));
    expect(mockRecordPurchase).not.toHaveBeenCalled();
    expect(mockInsert).not.toHaveBeenCalled();
    expect(mockUpdate).not.toHaveBeenCalled();
  });

  it.each([{email: "other@example.com", productKey: "oit"}, {email: "learner@example.com", productKey: "class1-water"}])("flags a mismatched recorded purchase without overwriting it: %j", async (existing) => {
    mockListSessions.mockResolvedValue({data: [{id: "cs_mismatch", payment_status: "paid", customer_email: "learner@example.com", metadata: {product_key: "oit"}}], has_more: false});
    mockLookup.mockResolvedValue([{id: 1, ...existing}]);
    const result = await runReconciliation();
    expect(result.errors).toEqual(["cs_mismatch: recorded purchase does not match checkout identity/product; manual investigation required"]);
    expect(mockInsert).not.toHaveBeenCalled();
    expect(mockUpdate).not.toHaveBeenCalled();
  });

  it("checks every page and reports only the genuinely missing paid checkout", async () => {
    const session = (id: string) => ({id, payment_status: "paid", customer_email: "learner@example.com", metadata: {product_key: "oit"}});
    mockListSessions.mockResolvedValueOnce({data: [session("cs_recorded")], has_more: true})
      .mockResolvedValueOnce({data: [session("cs_missing"), {...session("cs_unpaid"), payment_status: "unpaid"}], has_more: false});
    mockLookup.mockResolvedValueOnce([{id: 1, email: "learner@example.com", productKey: "oit"}]).mockResolvedValueOnce([]);
    const guard = vi.fn().mockResolvedValue(undefined);
    const result = await runReconciliation(48, guard);
    expect(result.errors).toEqual(["cs_missing: historical Individual Exam Pass requires evidence-bound recovery"]);
    expect(mockListSessions).toHaveBeenNthCalledWith(2, expect.objectContaining({starting_after: "cs_recorded"}));
    expect(mockLookup).toHaveBeenCalledTimes(2);
    expect(guard).toHaveBeenCalledTimes(3);
  });

  it("fails visibly when the database is unavailable instead of classifying every payment as missing", async () => {
    mockGetDb.mockResolvedValue(null);
    await expect(runReconciliation()).rejects.toThrow("Database unavailable");
    expect(mockListSessions).not.toHaveBeenCalled();
  });

  it("reports a lookup failure and stops immediately if the job lease is lost", async () => {
    mockListSessions.mockResolvedValue({data: [{id: "cs_lookup", payment_status: "paid", customer_email: "learner@example.com", metadata: {product_key: "oit"}}], has_more: false});
    mockLookup.mockRejectedValue(new Error("lookup unavailable"));
    expect((await runReconciliation()).errors).toEqual(["cs_lookup: lookup unavailable"]);
    mockLookup.mockClear();
    await expect(runReconciliation(48, async () => {throw new Error("lease lost");})).rejects.toThrow("lease lost");
    expect(mockLookup).not.toHaveBeenCalled();
  });

});
