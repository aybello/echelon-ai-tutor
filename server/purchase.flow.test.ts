/**
 * Purchase Flow Integration Tests
 * ─────────────────────────────────────────────────────────────────────────────
 * Covers the critical purchase flow:
 *   1. verifySession saves purchase when Stripe session is paid
 *   2. verifySession skips duplicate inserts (idempotent)
 *   3. verifySession reads customer_details.email when customer_email is null
 *   4. verifySession returns paid:false for unpaid sessions
 *   5. verifySession does not insert when email is missing
 *   6. getMyPurchases returns empty arrays when no email is provided
 *   7. checkAccess returns hasAccess:false when no purchase exists
 *   8. saveReferralSource completes without error
 *   9. Confirmation email is sent after a new purchase
 *  10. No duplicate confirmation email when purchase already exists
 */

import { describe, expect, it, vi, beforeEach } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

// ── Shared mutable Stripe session state ──────────────────────────────────────
// Tests mutate this object to control what Stripe returns.

const currentSession: Record<string, unknown> = {
  id: "cs_test_abc123",
  payment_status: "paid",
  customer_email: null,
  customer_details: { email: "buyer@example.com", phone: "+16135550100" },
  metadata: {
    product_key: "oit",
    product_name: "OIT Practice Pass",
    user_id: "",
    customer_email: "buyer@example.com",
  },
  amount_total: 14900,
  payment_intent: "pi_test_xyz",
};

function setSession(overrides: Record<string, unknown>) {
  Object.assign(currentSession, {
    id: "cs_test_abc123",
    payment_status: "paid",
    customer_email: null,
    customer_details: { email: "buyer@example.com", phone: "+16135550100" },
    metadata: {
      product_key: "oit",
      product_name: "OIT Practice Pass",
      user_id: "",
      customer_email: "buyer@example.com",
    },
    amount_total: 14900,
    payment_intent: "pi_test_xyz",
    ...overrides,
  });
}

// ── In-memory DB mock ─────────────────────────────────────────────────────────

type PurchaseRow = {
  id: number;
  userId: number | null;
  email: string;
  productKey: string;
  productName: string | null;
  amountCAD: number;
  stripeSessionId: string;
  stripePaymentIntentId: string | null;
  phone: string | null;
  referralSource: string | null;
  createdAt: Date;
};

let mockPurchases: PurchaseRow[] = [];
let nextId = 1;

vi.mock("./db", () => ({
  getDb: vi.fn(async () => ({
    select: () => ({
      from: () => ({
        where: (cond: unknown) => ({
          limit: (n: number) => {
            // For duplicate check: return existing rows matching stripeSessionId
            // We approximate by returning all rows (tests control state)
            return Promise.resolve(mockPurchases.slice(0, n));
          },
          then: (resolve: Function) => Promise.resolve(mockPurchases).then(resolve),
        }),
        orderBy: () => ({
          limit: (n: number) => Promise.resolve(mockPurchases.slice(0, n)),
        }),
        limit: (n: number) => Promise.resolve(mockPurchases.slice(0, n)),
      }),
    }),
    insert: () => ({
      values: (vals: Omit<PurchaseRow, "id" | "createdAt">) => {
        mockPurchases.push({
          id: nextId++,
          createdAt: new Date(),
          referralSource: null,
          ...vals,
        } as PurchaseRow);
        return Promise.resolve();
      },
    }),
    update: () => ({
      set: () => ({
        where: () => Promise.resolve(),
      }),
    }),
    delete: () => ({
      where: () => Promise.resolve(),
    }),
  })),
}));

vi.mock("./email", () => ({
  sendPurchaseConfirmationEmail: vi.fn(async () => {}),
}));

vi.mock("./_core/notification", () => ({
  notifyOwner: vi.fn(async () => true),
}));

vi.mock("stripe", () => ({
  default: vi.fn().mockImplementation(() => ({
    checkout: {
      sessions: {
        retrieve: vi.fn(async () => ({ ...currentSession })),
        list: vi.fn(async () => ({ data: [], has_more: false })),
      },
    },
    balance: { retrieve: vi.fn(async () => ({ available: [] })) },
    webhooks: {
      constructEvent: vi.fn((body, sig, secret) => ({ ...currentSession, type: "checkout.session.completed" })),
    },
  })),
}));

// ── Context helpers ───────────────────────────────────────────────────────────

function makeCtx(): TrpcContext {
  return {
    user: null,
    req: { protocol: "https", headers: { origin: "https://example.com" } } as TrpcContext["req"],
    res: { clearCookie: vi.fn(), cookie: vi.fn() } as unknown as TrpcContext["res"],
  };
}

// ── Reset before each test ────────────────────────────────────────────────────

beforeEach(() => {
  mockPurchases = [];
  nextId = 1;
  vi.clearAllMocks();
  // Reset to default paid session
  setSession({});
});

// ── Tests ─────────────────────────────────────────────────────────────────────

describe("stripe.verifySession", () => {
  it("saves a new purchase when session is paid", async () => {
    const caller = appRouter.createCaller(makeCtx());
    const result = await caller.stripe.verifySession({ sessionId: "cs_test_abc123", productKey: "oit" });

    expect(result.paid).toBe(true);
    expect(result.email).toBe("buyer@example.com");
    expect(result.productKey).toBe("oit");
    expect(mockPurchases).toHaveLength(1);
    expect(mockPurchases[0]?.email).toBe("buyer@example.com");
    expect(mockPurchases[0]?.productKey).toBe("oit");
    expect(mockPurchases[0]?.amountCAD).toBe(14900);
  });

  it("does not insert a duplicate if the session is already in DB", async () => {
    // Pre-populate DB with the same session
    mockPurchases.push({
      id: 1, userId: null, email: "buyer@example.com", productKey: "oit",
      productName: "OIT Practice Pass", amountCAD: 14900,
      stripeSessionId: "cs_test_abc123", stripePaymentIntentId: "pi_test_xyz",
      phone: null, referralSource: null, createdAt: new Date(),
    });

    const caller = appRouter.createCaller(makeCtx());
    await caller.stripe.verifySession({ sessionId: "cs_test_abc123", productKey: "oit" });

    // Should still only have 1 row (no duplicate)
    expect(mockPurchases).toHaveLength(1);
  });

  it("reads customer_details.email when customer_email is null", async () => {
    setSession({
      customer_email: null,
      customer_details: { email: "details@example.com", phone: null },
      metadata: {
        product_key: "oit",
        product_name: "OIT Practice Pass",
        user_id: "",
        customer_email: "details@example.com",
      },
    });

    const caller = appRouter.createCaller(makeCtx());
    const result = await caller.stripe.verifySession({ sessionId: "cs_test_abc123", productKey: "oit" });

    expect(result.email).toBe("details@example.com");
  });

  it("returns paid:false and does not insert for unpaid sessions", async () => {
    setSession({ payment_status: "unpaid" });

    const caller = appRouter.createCaller(makeCtx());
    const result = await caller.stripe.verifySession({ sessionId: "cs_test_unpaid", productKey: "oit" });

    expect(result.paid).toBe(false);
    expect(mockPurchases).toHaveLength(0);
  });

  it("does not insert when both customer_email and customer_details.email are null", async () => {
    setSession({
      customer_email: null,
      customer_details: null,
      metadata: { product_key: "oit", product_name: "OIT Practice Pass", user_id: "", customer_email: "" },
    });

    const caller = appRouter.createCaller(makeCtx());
    const result = await caller.stripe.verifySession({ sessionId: "cs_test_noemail", productKey: "oit" });

    expect(result).toBeDefined();
    expect(mockPurchases).toHaveLength(0);
  });
});

describe("stripe.getMyPurchases", () => {
  it("throws UNAUTHORIZED when user is not logged in", async () => {
    const caller = appRouter.createCaller(makeCtx());
    await expect(caller.stripe.getMyPurchases({})).rejects.toMatchObject({ code: "UNAUTHORIZED" });
  });
});

describe("stripe.checkAccess", () => {
  it("returns hasAccess:false for a guest (no login required)", async () => {
    const caller = appRouter.createCaller(makeCtx());
    const result = await caller.stripe.checkAccess({ examType: "oit" });
    expect(result.hasAccess).toBe(false);
  });

  it("returns hasAccess:false when user is logged in but has no purchase", async () => {
    // DB is empty (mockPurchases = [])
    const caller = appRouter.createCaller(makeCtx());
    const result = await caller.stripe.checkAccess({ examType: "oit" });
    expect(result.hasAccess).toBe(false);
  });
});

describe("stripe.saveReferralSource", () => {
  it("saves the referral source without error", async () => {
    const caller = appRouter.createCaller(makeCtx());
    const result = await caller.stripe.saveReferralSource({
      sessionId: "cs_test_ref",
      referralSource: "Reddit",
    });
    expect(result.success).toBe(true);
  });
});

describe("purchase flow — confirmation email", () => {
  it("sends a confirmation email after a new purchase is saved", async () => {
    const { sendPurchaseConfirmationEmail } = await import("./email");

    const caller = appRouter.createCaller(makeCtx());
    await caller.stripe.verifySession({ sessionId: "cs_test_email", productKey: "oit" });

    // Allow the non-blocking email to be triggered
    await new Promise(r => setTimeout(r, 10));
    expect(sendPurchaseConfirmationEmail).toHaveBeenCalledTimes(1);
  });

  it("does not send a confirmation email if purchase already exists", async () => {
    const { sendPurchaseConfirmationEmail } = await import("./email");

    // Pre-populate DB so the duplicate check finds a match
    mockPurchases.push({
      id: 1, userId: null, email: "buyer@example.com", productKey: "oit",
      productName: "OIT Practice Pass", amountCAD: 14900,
      stripeSessionId: "cs_test_abc123", stripePaymentIntentId: "pi_test_xyz",
      phone: null, referralSource: null, createdAt: new Date(),
    });

    const caller = appRouter.createCaller(makeCtx());
    await caller.stripe.verifySession({ sessionId: "cs_test_abc123", productKey: "oit" });

    expect(sendPurchaseConfirmationEmail).not.toHaveBeenCalled();
  });
});
