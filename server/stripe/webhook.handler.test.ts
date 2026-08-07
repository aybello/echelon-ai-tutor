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
} = vi.hoisted(() => ({
  mockConstructEvent: vi.fn(),
  mockRetrieveSubscription: vi.fn(),
  mockProvisionOrg: vi.fn(),
  mockProcessOrgInvoice: vi.fn(),
  mockGetDb: vi.fn(),
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

import { registerStripeWebhook } from "./webhook";

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
