/**
 * webhook.handler.test.ts
 *
 * Tests the registered Express webhook handler directly — no network server needed.
 * Verifies:
 *  1. Org subscription provisioning is delegated to provisionOrgFromWebhook
 *  2. Invoice-before-org returns HTTP 503 (Stripe retries)
 */

import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Request, Response } from "express";

const {
  mockConstructEvent,
  mockRetrieveSubscription,
  mockProvisionOrg,
  mockProcessOrgInvoice,
  mockGetDb,
  mockFlexFullRefund,
  mockFlexPartialRefund,
  mockFlexUnallocatedRefund,
  mockFlexDisputeCreated,
  mockFlexDisputeClosed,
} = vi.hoisted(() => ({
  mockConstructEvent: vi.fn(),
  mockRetrieveSubscription: vi.fn(),
  mockProvisionOrg: vi.fn(),
  mockProcessOrgInvoice: vi.fn(),
  mockGetDb: vi.fn(),
  mockFlexFullRefund: vi.fn(),
  mockFlexPartialRefund: vi.fn(),
  mockFlexUnallocatedRefund: vi.fn(),
  mockFlexDisputeCreated: vi.fn(),
  mockFlexDisputeClosed: vi.fn(),
}));

vi.mock("./stripe", () => ({
  stripe: {
    webhooks: {
      constructEvent: mockConstructEvent,
    },
    subscriptions: {
      retrieve: mockRetrieveSubscription,
    },
  },
}));

vi.mock("../db", () => ({
  getDb: mockGetDb,
}));

vi.mock("./provisionOrg", () => ({
  provisionOrgFromWebhook: mockProvisionOrg,
}));

vi.mock("../teams/flexRefundDisputeHandlers", () => ({
  handleFlexFullRefund: mockFlexFullRefund,
  handleFlexPartialRefund: mockFlexPartialRefund,
  handleFlexUnallocatedRefund: mockFlexUnallocatedRefund,
  handleFlexDisputeCreated: mockFlexDisputeCreated,
  handleFlexDisputeClosed: mockFlexDisputeClosed,
}));

vi.mock("./processOrgInvoice", async () => {
  const actual = await vi.importActual<typeof import("./processOrgInvoice")>(
    "./processOrgInvoice",
  );
  return {
    ...actual,
    processOrgInvoice: mockProcessOrgInvoice,
  };
});

vi.mock("../_core/notification", () => ({
  notifyOwner: vi.fn().mockResolvedValue(true),
}));

vi.mock("../analytics", () => ({
  trackEvent: vi.fn(),
}));

vi.mock("../email", async () => {
  const actual = await vi.importActual<typeof import("../email")>("../email");
  return {
    ...actual,
    sendManagerOnboardingEmail: vi.fn().mockResolvedValue(undefined),
    sendOrgPaymentConfirmationEmail: vi.fn().mockResolvedValue(undefined),
    sendTeamEnrollmentEmail: vi.fn().mockResolvedValue(undefined),
    sendWelcomeOnboardingEmail: vi.fn().mockResolvedValue(undefined),
    sendPurchaseConfirmationEmail: vi.fn().mockResolvedValue(undefined),
    sendSubscriptionConfirmationEmail: vi.fn().mockResolvedValue(undefined),
    sendSubscriptionRenewalEmail: vi.fn().mockResolvedValue(undefined),
  };
});

import { parseRefundLicenceIds, registerStripeWebhook } from "./webhook";

type WebhookHandler = (req: Request, res: Response) => Promise<unknown>;

function captureWebhookHandler(): WebhookHandler {
  let handler: WebhookHandler | undefined;

  const app = {
    post: vi.fn((
      _path: string,
      _rawMiddleware: unknown,
      routeHandler: WebhookHandler,
    ) => {
      handler = routeHandler;
    }),
  };

  registerStripeWebhook(app as any);

  if (!handler) {
    throw new Error("Stripe webhook handler was not registered");
  }

  return handler;
}

function makeResponse() {
  const response: any = {
    statusCode: 200,
    body: undefined,
    status: vi.fn((code: number) => {
      response.statusCode = code;
      return response;
    }),
    json: vi.fn((body: unknown) => {
      response.body = body;
      return response;
    }),
    send: vi.fn((body: unknown) => {
      response.body = body;
      return response;
    }),
  };
  return response;
}

function makeRequest(): Request {
  return {
    body: Buffer.from("{}"),
    headers: {
      "stripe-signature": "test_signature",
    },
  } as unknown as Request;
}

function dbWithNoOrganization() {
  return {
    select: vi.fn(() => ({
      from: vi.fn(() => ({
        where: vi.fn(() => ({
          limit: vi.fn().mockResolvedValue([]),
        })),
      })),
    })),
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  process.env.STRIPE_WEBHOOK_SECRET = "whsec_test";
  mockFlexFullRefund.mockResolvedValue(false);
  mockFlexPartialRefund.mockResolvedValue(false);
  mockFlexUnallocatedRefund.mockResolvedValue(false);
  mockFlexDisputeCreated.mockResolvedValue(false);
  mockFlexDisputeClosed.mockResolvedValue(false);
});

describe("Stripe webhook handler — Course Pass refunds and disputes", () => {
  it("parses only positive integer licence IDs", () => {
    expect(parseRefundLicenceIds({ licenceIds: "[12, 13, -1, 2.5]" })).toEqual([12, 13]);
    expect(parseRefundLicenceIds({ licence_ids: "21, 22" })).toEqual([21, 22]);
  });

  it("routes a full Course Pass refund to the order-scoped handler", async () => {
    const handler = captureWebhookHandler();
    const response = makeResponse();
    mockConstructEvent.mockReturnValue({
      id: "evt_flex_refund",
      type: "charge.refunded",
      data: { object: { id: "ch_flex", payment_intent: "pi_flex", amount: 5000, amount_refunded: 5000 } },
    });
    mockFlexFullRefund.mockResolvedValue(true);

    await handler(makeRequest(), response);

    expect(mockFlexFullRefund).toHaveBeenCalledWith("pi_flex");
    expect(response.statusCode).toBe(200);
    expect(response.body).toEqual({ received: true });
  });

  it("routes a partial refund with licence metadata to the scoped handler", async () => {
    const handler = captureWebhookHandler();
    const response = makeResponse();
    mockConstructEvent.mockReturnValue({
      id: "evt_partial_refund",
      type: "refund.created",
      data: { object: { payment_intent: "pi_flex", metadata: { licenceIds: "[31,32]" } } },
    });
    mockFlexPartialRefund.mockResolvedValue(true);

    await handler(makeRequest(), response);

    expect(mockFlexPartialRefund).toHaveBeenCalledWith("pi_flex", [31, 32]);
    expect(response.statusCode).toBe(200);
  });

  it("uses refund metadata embedded in charge.refunded when refund.created is not subscribed", async () => {
    const handler = captureWebhookHandler();
    const response = makeResponse();
    mockConstructEvent.mockReturnValue({
      id: "evt_partial_charge_refund",
      type: "charge.refunded",
      data: {
        object: {
          id: "ch_flex",
          payment_intent: "pi_flex",
          amount: 5000,
          amount_refunded: 1000,
          refunds: { data: [{ metadata: { licenceIds: "[41]" } }] },
        },
      },
    });
    mockFlexPartialRefund.mockResolvedValue(true);

    await handler(makeRequest(), response);

    expect(mockFlexPartialRefund).toHaveBeenCalledWith("pi_flex", [41]);
    expect(mockFlexUnallocatedRefund).not.toHaveBeenCalled();
  });

  it("suspends and restores only the disputed Course Pass order", async () => {
    const handler = captureWebhookHandler();
    const openedResponse = makeResponse();
    mockConstructEvent.mockReturnValue({
      id: "evt_dispute_opened",
      type: "charge.dispute.created",
      data: { object: { payment_intent: "pi_flex" } },
    });
    mockFlexDisputeCreated.mockResolvedValue(true);
    await handler(makeRequest(), openedResponse);
    expect(mockFlexDisputeCreated).toHaveBeenCalledWith("pi_flex");

    const closedResponse = makeResponse();
    mockConstructEvent.mockReturnValue({
      id: "evt_dispute_closed",
      type: "charge.dispute.closed",
      data: { object: { payment_intent: "pi_flex", status: "won" } },
    });
    mockFlexDisputeClosed.mockResolvedValue(true);
    await handler(makeRequest(), closedResponse);
    expect(mockFlexDisputeClosed).toHaveBeenCalledWith("pi_flex", "won");
  });
});

describe("Stripe webhook handler — org provisioning delegation", () => {
  it("delegates a live org subscription to provisionOrgFromWebhook", async () => {
    const handler = captureWebhookHandler();
    const response = makeResponse();
    const database = {};

    mockConstructEvent.mockReturnValue({
      id: "evt_team_created",
      type: "customer.subscription.created",
      data: {
        object: {
          id: "sub_team_123",
          metadata: {},
        },
      },
    });

    mockRetrieveSubscription.mockResolvedValue({
      id: "sub_team_123",
      customer: "cus_team_123",
      status: "active",
      current_period_start: 1786060000,
      current_period_end: 1817596000,
      items: { data: [{ quantity: 25 }] },
      metadata: {
        type: "org",
        manager_email: "brian.hull@winnipeg.ca",
        org_name: "City of Winnipeg",
        subscription_province: "western",
        subscription_tier: "stream-wastewater-coll",
      },
    });

    mockGetDb.mockResolvedValue(database);
    mockProvisionOrg.mockResolvedValue({
      state: "completed",
      orgId: 42,
    });

    await handler(makeRequest(), response);

    expect(mockProvisionOrg).toHaveBeenCalledTimes(1);
    expect(mockProvisionOrg).toHaveBeenCalledWith(
      database,
      expect.objectContaining({
        stripeEventId: "evt_team_created",
        stripeSubscriptionId: "sub_team_123",
        managerEmail: "brian.hull@winnipeg.ca",
        orgName: "City of Winnipeg",
        seats: 25,
      }),
    );
    expect(response.statusCode).toBe(200);
  });
});

describe("Stripe webhook handler — invoice-before-org", () => {
  it("returns 503 when an org invoice arrives before provisioning", async () => {
    const handler = captureWebhookHandler();
    const response = makeResponse();

    mockConstructEvent.mockReturnValue({
      id: "evt_invoice_early",
      type: "invoice.payment_succeeded",
      data: {
        object: {
          id: "in_early",
          subscription: "sub_team_early",
          amount_paid: 872500,
          billing_reason: "subscription_create",
        },
      },
    });

    mockRetrieveSubscription.mockResolvedValue({
      id: "sub_team_early",
      metadata: { type: "org" },
    });

    mockGetDb.mockResolvedValue(dbWithNoOrganization());

    await handler(makeRequest(), response);

    expect(response.statusCode).toBe(503);
    expect(response.body).toEqual({
      error: "Organization provisioning is not complete",
    });
    expect(mockProcessOrgInvoice).not.toHaveBeenCalled();
  });
});
