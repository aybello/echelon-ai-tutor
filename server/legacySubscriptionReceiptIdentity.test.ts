import { beforeEach, describe, expect, it, vi } from "vitest";
import type { TrpcContext } from "./_core/context";

const state = vi.hoisted(() => ({
  retrieve: vi.fn(),
  resolveEntitlements: vi.fn(),
  issueToken: vi.fn(),
  issueCookie: vi.fn(),
}));

vi.mock("./stripe/stripe", () => ({
  stripe: {
    checkout: { sessions: { retrieve: state.retrieve } },
    billingPortal: { sessions: { create: vi.fn() } },
    subscriptions: { retrieve: vi.fn(), update: vi.fn() },
  },
}));
vi.mock("./_core/access", async importOriginal => ({
  ...(await importOriginal<typeof import("./_core/access")>()),
  resolveEntitlementsByEmail: state.resolveEntitlements,
}));
vi.mock("./_core/subscriptionToken", () => ({
  issueSubscriptionToken: state.issueToken,
}));
vi.mock("./_core/emailSession", () => ({
  issueVerifiedEmailSessionCookie: state.issueCookie,
}));
vi.mock("./_core/notification", () => ({ notifyOwner: vi.fn() }));
vi.mock("./analytics", () => ({
  hashAnalyticsAnonymousId: vi.fn(),
  trackEvent: vi.fn(),
}));

import { stripeRouter } from "./routers/stripeRouter";

const receiptEmail = "annual-receipt-owner@echelon.test";
const receipt = (overrides: Record<string, unknown> = {}) => ({
  id: "cs_legacy_subscription_echelon_test",
  mode: "subscription",
  payment_status: "paid",
  status: "complete",
  customer_email: receiptEmail,
  customer_details: { email: receiptEmail },
  metadata: {
    subscription_tier: "class1",
    subscription_province: "ontario",
  },
  ...overrides,
});

function caller(
  identity: { userEmail?: string | null; studentEmail?: string | null } = {}
) {
  return stripeRouter.createCaller({
    user: identity.userEmail
      ? {
          id: 1042,
          email: identity.userEmail,
          openId: "synthetic-receipt-owner",
          role: "user",
        }
      : null,
    studentEmail: identity.studentEmail ?? null,
    req: { headers: {} },
    res: { cookie: vi.fn() },
  } as unknown as TrpcContext);
}

const activePersonalEntitlements = {
  email: receiptEmail,
  hasAnyAccess: true,
  unlockedExamTypes: ["class1-water", "class1-ww"],
  purchasedProductKeys: [],
  activeSubscriptionRows: [
    {
      tier: "class1",
      province: "ontario",
      status: "active",
      currentPeriodEnd: new Date("2027-10-17T00:00:00.000Z"),
      orgId: null,
    },
  ],
  isManager: false,
  sources: ["subscription"],
};

beforeEach(() => {
  vi.clearAllMocks();
  state.retrieve.mockResolvedValue(receipt());
  state.resolveEntitlements.mockResolvedValue(activePersonalEntitlements);
  state.issueToken.mockResolvedValue("synthetic-subscription-token");
  state.issueCookie.mockResolvedValue(undefined);
});

describe("legacy verifySubscriptionSession identity boundary", () => {
  it("does not mint identity or access from an anonymous personal receipt", async () => {
    const result = await caller().verifySubscriptionSession({
      sessionId: "cs_legacy_subscription_echelon_test",
    });

    expect(result).toMatchObject({
      paid: true,
      email: "",
      tier: "",
      province: "",
      examTypes: [],
      accessToken: null,
      requiresSignIn: true,
    });
    expect(state.resolveEntitlements).not.toHaveBeenCalled();
    expect(state.issueToken).not.toHaveBeenCalled();
    expect(state.issueCookie).not.toHaveBeenCalled();
  });

  it("does not mint identity when the existing verified identity mismatches the receipt", async () => {
    const result = await caller({
      studentEmail: "different-operator@echelon.test",
    }).verifySubscriptionSession({
      sessionId: "cs_legacy_subscription_echelon_test",
    });

    expect(result).toMatchObject({
      paid: true,
      email: "",
      examTypes: [],
      accessToken: null,
      requiresSignIn: true,
    });
    expect(state.resolveEntitlements).not.toHaveBeenCalled();
    expect(state.issueToken).not.toHaveBeenCalled();
    expect(state.issueCookie).not.toHaveBeenCalled();
  });

  it("does not restore identity from a historical receipt without a live personal subscription", async () => {
    state.resolveEntitlements.mockResolvedValue({
      ...activePersonalEntitlements,
      hasAnyAccess: false,
      unlockedExamTypes: [],
      activeSubscriptionRows: [],
      sources: [],
    });

    const result = await caller({
      studentEmail: receiptEmail,
    }).verifySubscriptionSession({
      sessionId: "cs_historical_subscription_echelon_test",
    });

    expect(result).toMatchObject({
      paid: true,
      email: "",
      examTypes: [],
      accessToken: null,
      requiresSignIn: false,
    });
    expect(state.resolveEntitlements).toHaveBeenCalledWith(receiptEmail);
    expect(state.issueToken).not.toHaveBeenCalled();
    expect(state.issueCookie).not.toHaveBeenCalled();
  });

  it("never treats a Team Annual receipt as a personal identity or class-tier entitlement", async () => {
    state.retrieve.mockResolvedValue(
      receipt({
        id: "cs_team_annual_echelon_test",
        metadata: {
          type: "org",
          subscription_tier: "class1",
          subscription_province: "ontario",
        },
      })
    );

    const result = await caller({
      studentEmail: receiptEmail,
    }).verifySubscriptionSession({ sessionId: "cs_team_annual_echelon_test" });

    expect(result).toMatchObject({
      paid: true,
      email: "",
      tier: "",
      province: "",
      examTypes: [],
      accessToken: null,
    });
    expect(state.resolveEntitlements).not.toHaveBeenCalled();
    expect(state.issueToken).not.toHaveBeenCalled();
    expect(state.issueCookie).not.toHaveBeenCalled();
  });

  it.each([
    { payment_status: "unpaid", status: "complete" },
    { payment_status: "no_payment_required", status: "complete" },
    { mode: "payment" },
  ])("does not treat an unpaid completion or wrong checkout mode as a paid subscription: %j", async overrides => {
    state.retrieve.mockResolvedValue(receipt(overrides));
    const result = await caller({ studentEmail: receiptEmail }).verifySubscriptionSession({ sessionId: "cs_invalid_synthetic" });
    expect(result).toMatchObject({ paid: false, email: "", accessToken: null, examTypes: [] });
    expect(state.issueToken).not.toHaveBeenCalled();
    expect(state.issueCookie).not.toHaveBeenCalled();
  });

  it("does not accept a matching OTP identity alongside a conflicting OAuth identity", async () => {
    const result = await caller({ studentEmail: receiptEmail, userEmail: "other@example.test" }).verifySubscriptionSession({ sessionId: "cs_conflicting_synthetic" });
    expect(result).toMatchObject({ paid: true, requiresSignIn: true, email: "", accessToken: null });
    expect(state.resolveEntitlements).not.toHaveBeenCalled();
  });

  it("does not accept an org-backed row as a current personal subscription", async () => {
    state.resolveEntitlements.mockResolvedValue({ ...activePersonalEntitlements, activeSubscriptionRows: [{ ...activePersonalEntitlements.activeSubscriptionRows[0], orgId: 701 }] });
    const result = await caller({ userEmail: receiptEmail }).verifySubscriptionSession({ sessionId: "cs_org_row_synthetic" });
    expect(result).toMatchObject({ paid: true, examTypes: [], accessToken: null });
  });

  it("confirms a paid Team Annual stream receipt for an anonymous caller without disclosing identity", async () => {
    state.retrieve.mockResolvedValue(receipt({ metadata: { type: "org", subscription_tier: "stream-water", subscription_province: "ontario" } }));
    const result = await caller().verifySubscriptionSession({ sessionId: "cs_team_stream_synthetic" });
    expect(result).toMatchObject({ paid: true, email: "", requiresSignIn: true, examTypes: [], accessToken: null });
    expect(state.issueCookie).not.toHaveBeenCalled();
    expect(state.issueToken).not.toHaveBeenCalled();
  });

  it("confirms for an existing matching OAuth identity without issuing any identity credentials", async () => {
    const result = await caller({ userEmail: receiptEmail.toUpperCase() }).verifySubscriptionSession({ sessionId: "cs_oauth_synthetic" });
    expect(result).toMatchObject({ paid: true, email: receiptEmail, requiresSignIn: false, accessToken: null });
    expect(state.issueToken).not.toHaveBeenCalled();
    expect(state.issueCookie).not.toHaveBeenCalled();
  });

  it("confirms current personal access only after the matching OTP identity boundary", async () => {
    const result = await caller({
      studentEmail: receiptEmail,
    }).verifySubscriptionSession({
      sessionId: "cs_current_subscription_echelon_test",
    });

    expect(result).toMatchObject({
      paid: true,
      email: receiptEmail,
      tier: "class1",
      province: "ontario",
      examTypes: expect.arrayContaining(["class1-water", "class1-ww"]),
      accessToken: null,
      requiresSignIn: false,
    });
    expect(state.resolveEntitlements).toHaveBeenCalledWith(receiptEmail);
    expect(state.issueToken).not.toHaveBeenCalled();
    expect(state.issueCookie).not.toHaveBeenCalled();
  });
});
