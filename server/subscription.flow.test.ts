/**
 * Subscription Flow Integration Tests
 */

import { describe, expect, it, vi, beforeEach } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";
import { purchases, subscriptions } from "../drizzle/schema";

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

type SubscriptionRow = {
  id: number;
  userId: number | null;
  email: string;
  tier: string;
  province: string;
  stripeSubscriptionId: string;
  stripeCustomerId: string | null;
  status: string;
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  createdAt: Date;
};

let mockPurchases: PurchaseRow[] = [];
let mockSubscriptions: SubscriptionRow[] = [];
let nextId = 1;

const NOW = new Date();
const FUTURE = new Date(NOW.getTime() + 365 * 24 * 60 * 60 * 1000);
const PAST = new Date(NOW.getTime() - 24 * 60 * 60 * 1000);

vi.mock("./db", () => ({
  getDb: vi.fn(async () => ({
    select: (_fields?: unknown) => ({
      from: (table: unknown) => {
        const isSubscriptions = table === subscriptions;
        // For subscriptions: apply active+non-expired filter to match real checkAccess query
        const rows: unknown[] = isSubscriptions
          ? mockSubscriptions.filter(s => s.status === "active" && s.currentPeriodEnd > new Date())
          : mockPurchases;
        return {
          where: (_cond?: unknown) => ({
            limit: (n: number) => Promise.resolve(rows.slice(0, n)),
            then: (resolve: (v: unknown[]) => unknown) => Promise.resolve(rows).then(resolve),
          }),
          orderBy: (_ord?: unknown) => ({
            limit: (n: number) => Promise.resolve(rows.slice(0, n)),
          }),
          limit: (n: number) => Promise.resolve(rows.slice(0, n)),
          then: (resolve: (v: unknown[]) => unknown) => Promise.resolve(rows).then(resolve),
        };
      },
    }),
    insert: (_table: unknown) => ({
      values: (vals: unknown) => {
        mockSubscriptions.push({ id: nextId++, createdAt: new Date(), ...(vals as object) } as SubscriptionRow);
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

vi.mock("./_core/notification", () => ({
  notifyOwner: vi.fn(async () => true),
}));

vi.mock("stripe", () => ({
  default: vi.fn().mockImplementation(() => ({
    checkout: {
      sessions: {
        create: vi.fn(async () => ({ id: "cs_sub_test", url: "https://checkout.stripe.com/test" })),
        retrieve: vi.fn(async () => ({ payment_status: "paid", customer_email: "sub@example.com", metadata: {}, customer_details: { email: "sub@example.com" } })),
      },
    },
    subscriptions: {
      list: vi.fn(async () => ({ data: [], has_more: false })),
    },
    balance: { retrieve: vi.fn(async () => ({ available: [] })) },
    webhooks: {
      constructEvent: vi.fn(() => ({ id: "evt_test_sub", type: "customer.subscription.created" })),
    },
  })),
}));

// ── Context helpers ───────────────────────────────────────────────────────────

function makeCtx(email?: string): TrpcContext {
  return {
    user: email ? { id: 1, email, openId: "user_openid", name: "Test User", role: "user" } : null,
    req: { protocol: "https", headers: { origin: "https://example.com" } } as TrpcContext["req"],
    res: { clearCookie: vi.fn(), cookie: vi.fn() } as unknown as TrpcContext["res"],
  };
}

function addSubscription(overrides: Partial<SubscriptionRow> = {}) {
  mockSubscriptions.push({
    id: nextId++,
    userId: null,
    email: "sub@example.com",
    tier: "class1",
    province: "ontario",
    stripeSubscriptionId: "sub_test_123",
    stripeCustomerId: "cus_test_123",
    status: "active",
    currentPeriodStart: NOW,
    currentPeriodEnd: FUTURE,
    createdAt: NOW,
    ...overrides,
  });
}

// ── Reset before each test ────────────────────────────────────────────────────

beforeEach(() => {
  mockPurchases = [];
  mockSubscriptions = [];
  nextId = 1;
  vi.clearAllMocks();
});

// ── Tests ─────────────────────────────────────────────────────────────────────

describe("Subscription checkAccess", () => {
  it("returns hasAccess:true for active Ontario Class 1 subscription on class1-water", async () => {
    addSubscription({ email: "sub@example.com", tier: "class1", province: "ontario", status: "active", currentPeriodEnd: FUTURE });
    const caller = appRouter.createCaller(makeCtx("sub@example.com"));
    const result = await caller.stripe.checkAccess({ examType: "class1-water" });
    expect(result.hasAccess).toBe(true);
  });

  it("returns hasAccess:false when subscription is expired", async () => {
    addSubscription({ email: "sub@example.com", tier: "class1", province: "ontario", status: "active", currentPeriodEnd: PAST });
    const caller = appRouter.createCaller(makeCtx("sub@example.com"));
    const result = await caller.stripe.checkAccess({ examType: "class1-water" });
    expect(result.hasAccess).toBe(false);
  });

  it("returns hasAccess:false when subscription is cancelled", async () => {
    addSubscription({ email: "sub@example.com", tier: "class1", province: "ontario", status: "cancelled", currentPeriodEnd: FUTURE });
    const caller = appRouter.createCaller(makeCtx("sub@example.com"));
    const result = await caller.stripe.checkAccess({ examType: "class1-water" });
    expect(result.hasAccess).toBe(false);
  });

  it("returns hasAccess:false when no purchase or subscription exists", async () => {
    const caller = appRouter.createCaller(makeCtx("nobody@example.com"));
    const result = await caller.stripe.checkAccess({ examType: "class1-water" });
    expect(result.hasAccess).toBe(false);
  });

  it("returns hasAccess:false when email is not provided", async () => {
    const caller = appRouter.createCaller(makeCtx());
    const result = await caller.stripe.checkAccess({ examType: "class1-water" });
    expect(result.hasAccess).toBe(false);
  });
});

describe("Subscription province scoping", () => {
  it("Ontario subscription does NOT unlock WPI exam types", async () => {
    addSubscription({ email: "sub@example.com", tier: "class1", province: "ontario", status: "active", currentPeriodEnd: FUTURE });
    const caller = appRouter.createCaller(makeCtx("sub@example.com"));
    const result = await caller.stripe.checkAccess({ examType: "wpi-class1-water" });
    expect(result.hasAccess).toBe(false);
  });

  it("Western subscription does NOT unlock Ontario EOCP exam types", async () => {
    addSubscription({ email: "sub@example.com", tier: "class1", province: "western", status: "active", currentPeriodEnd: FUTURE });
    const caller = appRouter.createCaller(makeCtx("sub@example.com"));
    const result = await caller.stripe.checkAccess({ examType: "class1-water" });
    expect(result.hasAccess).toBe(false);
  });

  it("Western Class 1 subscription unlocks wpi-class1-water", async () => {
    addSubscription({ email: "sub@example.com", tier: "class1", province: "western", status: "active", currentPeriodEnd: FUTURE });
    const caller = appRouter.createCaller(makeCtx("sub@example.com"));
    const result = await caller.stripe.checkAccess({ examType: "wpi-class1-water" });
    expect(result.hasAccess).toBe(true);
  });
});

describe("getMySubscriptions", () => {
  it("returns active subscriptions for a logged-in user", async () => {
    addSubscription({ email: "sub@example.com", tier: "class2", province: "ontario", status: "active", currentPeriodEnd: FUTURE });
    const caller = appRouter.createCaller(makeCtx("sub@example.com"));
    const result = await caller.stripe.getMySubscriptions({});
    expect(result.subscriptions.length).toBeGreaterThan(0);
    expect(result.unlockedExamTypes.length).toBeGreaterThan(0);
  });

  it("returns empty arrays when no email is provided", async () => {
    const caller = appRouter.createCaller(makeCtx());
    const result = await caller.stripe.getMySubscriptions({});
    expect(result.subscriptions).toHaveLength(0);
    expect(result.unlockedExamTypes).toHaveLength(0);
  });
});
