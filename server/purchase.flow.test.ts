import { purchaseEmailOutbox } from "../drizzle/schema";
/**
 * Purchase Flow Integration Tests
 * ─────────────────────────────────────────────────────────────────────────────
 * Covers the critical purchase flow:
 *   1. verifySession confirms payment while the signed webhook saves the purchase
 *   2. verifySession reports recorded webhook purchases idempotently
 *   3. verifySession reads customer_details.email when customer_email is null
 *   4. verifySession returns paid:false for unpaid sessions
 *   5. verifySession does not insert when email is missing
 *   6. getMyPurchases returns empty arrays when no email is provided
 *   7. checkAccess returns hasAccess:false when no purchase exists
 *   8. saveReferralSource completes without error
 *   9. Browser verification does not queue purchase email delivery
 *  10. No duplicate confirmation email when purchase already exists
 */

import { describe, expect, it, vi, beforeEach } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";
import { getDb } from "./db";

// ── Shared mutable Stripe session state ──────────────────────────────────────
// Tests mutate this object to control what Stripe returns.

const currentSession: Record<string, unknown> = {
  id: "cs_test_abc123",
  mode: "payment",
  payment_status: "paid",
  currency: "cad",
  customer_email: null,
  customer_details: { email: "buyer@example.com", phone: "+16135550100", name: "Test Buyer", address: null, tax_exempt: "none", tax_ids: [] },
  metadata: {
    product_key: "oit",
    product_name: "OIT Practice Pass",
    user_id: "",
    customer_email: "buyer@example.com",
    individual_access_policy: "individual-exam-pass-12-month-v1",
  },
  amount_subtotal: 4900,
  amount_total: 4900,
  payment_intent: "pi_test_xyz",
};

function setSession(overrides: Record<string, unknown>) {
  Object.assign(currentSession, {
    id: "cs_test_abc123",
    mode: "payment",
    payment_status: "paid",
    currency: "cad",
    customer_email: null,
    customer_details: { email: "buyer@example.com", phone: "+16135550100", name: "Test Buyer", address: null, tax_exempt: "none", tax_ids: [] },
    metadata: {
      product_key: "oit",
      product_name: "OIT Practice Pass",
      user_id: "",
      customer_email: "buyer@example.com",
      individual_access_policy: "individual-exam-pass-12-month-v1",
    },
    amount_subtotal: 4900,
    amount_total: 4900,
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
  accessExpiresAt: Date | null;
  createdAt: Date;
};

let mockPurchases: PurchaseRow[] = [];
let nextId = 1;
let queuedEmails: unknown[] = [];

vi.mock("./db", () => ({
  getDb: vi.fn(async () => ({
    async transaction(work: (tx: any) => Promise<void>) { return work(this); },
    select: () => ({
      from: () => ({
        where: (cond: unknown) => ({
          limit: (n: number) => {
            // For duplicate check: return existing rows matching stripeSessionId
            // We approximate by returning all rows (tests control state)
            return Promise.resolve(mockPurchases.slice(0, n));
          },
          then: (resolve: (value: PurchaseRow[]) => unknown) => Promise.resolve(mockPurchases).then(resolve),
        }),
        orderBy: () => ({
          limit: (n: number) => Promise.resolve(mockPurchases.slice(0, n)),
        }),
        limit: (n: number) => Promise.resolve(mockPurchases.slice(0, n)),
      }),
    }),
    insert: (table: unknown) => ({
      values: (vals: Omit<PurchaseRow, "id" | "createdAt">) => {
        if (table === purchaseEmailOutbox) { queuedEmails.push(vals); return Promise.resolve(); }
        mockPurchases.push({
          id: nextId++,
          createdAt: new Date(),
        ...vals,
        referralSource: vals.referralSource ?? null,
        accessExpiresAt: vals.accessExpiresAt ?? null,
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
    paymentIntents: {
      retrieve: vi.fn(async () => ({
        status: "succeeded",
        latest_charge: { id: "ch_test_xyz", created: 1_789_684_600, paid: true },
      })),
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
    studentEmail: null,
    req: { protocol: "https", headers: { origin: "https://example.com" } } as TrpcContext["req"],
    res: { clearCookie: vi.fn(), cookie: vi.fn() } as unknown as TrpcContext["res"],
  };
}

// ── Reset before each test ────────────────────────────────────────────────────

beforeEach(() => {
  mockPurchases = [];
  queuedEmails = [];
  nextId = 1;
  vi.clearAllMocks();
  // Reset to default paid session
  setSession({});
});

// ── Tests ─────────────────────────────────────────────────────────────────────

describe("stripe.verifySession", () => {
  it("waits for the signed webhook to record a new paid purchase", async () => {
    const caller = appRouter.createCaller(makeCtx());
    const result = await caller.stripe.verifySession({ sessionId: "cs_test_abc123" });

    expect(result.paid).toBe(true);
    expect(result.email).toBe("");
    expect(result.requiresSignIn).toBe(true);
    expect(result.accessToken).toBeNull();
    expect(result.productKey).toBe("oit");
    expect(result.fulfillmentPending).toBe(true);
    expect(mockPurchases).toHaveLength(0);
  });

  it("reports a failure instead of presenting a database outage as pending fulfilment", async () => {
    vi.mocked(getDb).mockResolvedValueOnce(null as any);

    const result = await appRouter.createCaller(makeCtx()).stripe.verifySession({
      sessionId: "cs_test_database_outage",
    });

    expect(result).toMatchObject({ paid: false, fulfillmentPending: false });
    expect(mockPurchases).toHaveLength(0);
  });

  it("does not write a historical session from the browser confirmation path", async () => {
    setSession({
      metadata: {
        product_key: "oit",
        product_name: "OIT Practice Pass",
        user_id: "",
        customer_email: "buyer@example.com",
      },
    });

    await appRouter.createCaller(makeCtx()).stripe.verifySession({ sessionId: "cs_test_historical" });

    expect(mockPurchases).toHaveLength(0);
  });

  it("does not turn a copied checkout URL into a verified email session", async () => {
    for (const email of [null, "someone-else@example.com", "buyer@example.com"]) {
      const ctx = { ...makeCtx(), studentEmail: email };
      const result = await appRouter.createCaller(ctx).stripe.verifySession({ sessionId: "cs_test_abc123" });
      expect(ctx.res.cookie).not.toHaveBeenCalled();
      expect(result.accessToken).toBeNull();
      expect(result.requiresSignIn).toBe(email !== "buyer@example.com");
      expect(result.email).toBe(email === "buyer@example.com" ? email : "");
    }
  });

  it("does not insert a duplicate if the session is already in DB", async () => {
    // Pre-populate DB with the same session
    const recordedExpiry = new Date("2027-09-17T22:36:40.000Z");
    mockPurchases.push({
      id: 1, userId: null, email: "buyer@example.com", productKey: "oit",
      productName: "OIT Practice Pass", amountCAD: 14900,
      stripeSessionId: "cs_test_abc123", stripePaymentIntentId: "pi_test_xyz",
      phone: null, referralSource: null, accessExpiresAt: recordedExpiry, createdAt: new Date(),
    });

    const caller = appRouter.createCaller(makeCtx());
    const result = await caller.stripe.verifySession({ sessionId: "cs_test_abc123" });

    expect(result.fulfillmentPending).toBe(false);
    expect(result.accessExpiresAt).toEqual(recordedExpiry);
    // Should still only have 1 row and no browser-side duplicate.
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
    const result = await caller.stripe.verifySession({ sessionId: "cs_test_abc123" });

    expect(result.email).toBe("");
    expect(result.fulfillmentPending).toBe(true);
    expect(mockPurchases).toHaveLength(0);
  });

  it("returns paid:false and does not insert for unpaid sessions", async () => {
    setSession({ payment_status: "unpaid" });

    const caller = appRouter.createCaller(makeCtx());
    const result = await caller.stripe.verifySession({ sessionId: "cs_test_unpaid" });

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
    const result = await caller.stripe.verifySession({ sessionId: "cs_test_noemail" });

    expect(result).toBeDefined();
    expect(mockPurchases).toHaveLength(0);
  });
});

describe("stripe.getMyPurchases", () => {
  it("throws UNAUTHORIZED when user is not logged in", async () => {
    const caller = appRouter.createCaller(makeCtx());
    await expect(caller.stripe.getMyPurchases()).rejects.toMatchObject({ code: "UNAUTHORIZED" });
  });

  it("denies a pass at its exact recorded expiry boundary", async () => {
    vi.useFakeTimers();
    try {
      const cutoff = new Date("2027-09-21T14:30:00.000Z");
      vi.setSystemTime(cutoff);
      const ctx = {
        ...makeCtx(),
        user: { id: 1, email: "buyer@example.com", role: "user" },
      } as TrpcContext;

      mockPurchases.push({
        id: 1, userId: 1, email: "buyer@example.com", productKey: "oit",
        productName: "OIT Practice Pass", amountCAD: 4900,
        stripeSessionId: "cs_expiry_boundary", stripePaymentIntentId: "pi_expiry_boundary",
        phone: null, referralSource: null, accessExpiresAt: new Date(cutoff.getTime() + 1), createdAt: new Date(),
        status: "active",
      } as PurchaseRow);

      await expect(appRouter.createCaller(ctx).stripe.getMyPurchases()).resolves.toMatchObject({
        unlockedExamTypes: ["oit"],
      });

      mockPurchases[0].accessExpiresAt = cutoff;
      await expect(appRouter.createCaller(ctx).stripe.getMyPurchases()).resolves.toMatchObject({
        unlockedExamTypes: [],
      });
    } finally {
      vi.useRealTimers();
    }
  });
});

describe("stripe.checkAccess", () => {
  // OIT and OIT-WW are free exam types — always returns hasAccess:true regardless of login or purchase
  it("returns hasAccess:false for a guest checking OIT (now paid)", async () => {
    const caller = appRouter.createCaller(makeCtx());
    const result = await caller.stripe.checkAccess({ examType: "oit" });
    expect(result.hasAccess).toBe(false);
  });

  it("returns hasAccess:false for OIT when user has no purchase (now paid)", async () => {
    // OIT is free — no purchase required
    const caller = appRouter.createCaller(makeCtx());
    const result = await caller.stripe.checkAccess({ examType: "oit" });
    expect(result.hasAccess).toBe(false);
  });

  it("returns hasAccess:false for a paid exam type when user has no purchase", async () => {
    const caller = appRouter.createCaller(makeCtx());
    const result = await caller.stripe.checkAccess({ examType: "class1-water" });
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
  it("does not queue a confirmation email from the browser verification path", async () => {
    const { sendPurchaseConfirmationEmail } = await import("./email");

    const caller = appRouter.createCaller(makeCtx());
    await caller.stripe.verifySession({ sessionId: "cs_test_email" });

    // Browser verification never fulfills a purchase or queues email delivery.
    await new Promise(r => setTimeout(r, 10));
    expect(queuedEmails).toHaveLength(0);
    expect(sendPurchaseConfirmationEmail).not.toHaveBeenCalled();
  });

  it("does not send a confirmation email for an already recorded purchase", async () => {
    const { sendPurchaseConfirmationEmail } = await import("./email");

    // Pre-populate DB so the duplicate check finds a match
    mockPurchases.push({
      id: 1, userId: null, email: "buyer@example.com", productKey: "oit",
      productName: "OIT Practice Pass", amountCAD: 14900,
      stripeSessionId: "cs_test_abc123", stripePaymentIntentId: "pi_test_xyz",
      phone: null, referralSource: null, accessExpiresAt: null, createdAt: new Date(),
    });

    const caller = appRouter.createCaller(makeCtx());
    await caller.stripe.verifySession({ sessionId: "cs_test_abc123" });

    expect(sendPurchaseConfirmationEmail).not.toHaveBeenCalled();
  });
});
