const mockProvisionIndividual = vi.hoisted(() => vi.fn());
vi.mock("./provisionIndividualSubscription", () => ({ provisionIndividualSubscription: mockProvisionIndividual }));
const mockRecordPurchase = vi.hoisted(() => vi.fn());
vi.mock("../purchaseEmailOutbox", () => ({ recordPurchaseWithConfirmation: mockRecordPurchase }));
const mockNotifyOwner = vi.hoisted(() => vi.fn());
const mockTrackEvent = vi.hoisted(() => vi.fn());
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
  mockRetrievePaymentIntent,
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
  mockRetrievePaymentIntent: vi.fn(),
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
    paymentIntents: {
      retrieve: mockRetrievePaymentIntent,
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
  notifyOwner: mockNotifyOwner,
}));

vi.mock("../analytics", () => ({
  trackEvent: mockTrackEvent,
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
import {
  INDIVIDUAL_EXAM_PASS_ENTITLEMENT_TYPE,
  INDIVIDUAL_EXAM_PASS_POLICY_VERSION,
} from "./individualExamPass";

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

function dbWithPurchaseLookupSequence(...rows: Array<Array<{ id: number }>>) {
  const limit = vi.fn();
  for (const result of rows) limit.mockResolvedValueOnce(result);
  return {
    select: vi.fn(() => ({
      from: vi.fn(() => ({
        where: vi.fn(() => ({ limit })),
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
  mockRetrievePaymentIntent.mockResolvedValue({
    status: "succeeded",
    latest_charge: { created: 1_789_684_600, paid: true, status: "succeeded" },
  });
  mockNotifyOwner.mockResolvedValue(true);
  mockTrackEvent.mockResolvedValue(undefined);
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


describe("individual subscription acknowledgements", () => {
  it.each([["completed", 200], ["busy", 409], ["retryable_failure", 503]])("maps %s to HTTP %s", async (state, code) => {
    mockConstructEvent.mockReturnValue({ id: "evt_individual", type: "customer.subscription.created", data: { object: { id: "sub_individual" } } });
    mockRetrieveSubscription.mockResolvedValue({ id: "sub_individual", metadata: {} });
    mockGetDb.mockResolvedValue({}); mockProvisionIndividual.mockResolvedValue({ state });
    const res = makeResponse(); await captureWebhookHandler()(makeRequest(), res);
    expect(res.statusCode).toBe(code);
  });
  it("returns a retryable response on storage exceptions", async () => {
    mockConstructEvent.mockReturnValue({ id: "evt_individual", type: "customer.subscription.updated", data: { object: { id: "sub_individual" } } });
    mockRetrieveSubscription.mockResolvedValue({ id: "sub_individual", metadata: {} });
    mockGetDb.mockResolvedValue({}); mockProvisionIndividual.mockRejectedValue(new Error("DB unavailable"));
    const res = makeResponse(); await captureWebhookHandler()(makeRequest(), res);
    expect(res.statusCode).toBe(503);
  });
});

describe("checkout profile updates", () => {
  it.each([null, "", "not-a-phone"])("preserves an existing user phone when checkout provides %s", async phone => {
    const { users } = await import("../../drizzle/schema");
    mockConstructEvent.mockReturnValue({ id: "evt_phone", type: "checkout.session.completed", data: { object: {
      id: "cs_phone", mode: "payment", payment_status: "paid", amount_total: 4900, created: 1780000000,
      metadata: { product_key: "oit", user_id: "42" }, customer_details: { email: "qa@echelon.test", name: "QA Operator", phone },
    } } });
    const update = vi.fn(() => ({ set: vi.fn(() => ({ where: vi.fn().mockResolvedValue([]) })) }));
    mockGetDb.mockResolvedValue({ select: vi.fn(() => ({ from: vi.fn(() => ({ where: vi.fn(() => ({ limit: vi.fn().mockResolvedValue([{ id: 42 }]) })) })) })), update });
    const res = makeResponse(); await captureWebhookHandler()(makeRequest(), res);
    expect(res.statusCode).toBe(200);
    expect(update).not.toHaveBeenCalledWith(users);
  });
});

describe("Individual Exam Pass fulfillment", () => {
  it("records a paid completed checkout from the successful charge timestamp", async () => {
    const handler = captureWebhookHandler();
    const response = makeResponse();
    mockGetDb.mockResolvedValue(dbWithNoOrganization());
    mockRecordPurchase.mockResolvedValue(undefined);
    mockConstructEvent.mockReturnValue({
      id: "evt_paid",
      type: "checkout.session.completed",
      created: 1_800_000_000,
      data: {
        object: {
          id: "cs_paid",
          mode: "payment",
          payment_status: "paid",
          amount_total: 4900,
          payment_intent: "pi_paid",
          metadata: {
            product_key: "oit",
            product_name: "OIT Practice Pass",
            entitlement_type: INDIVIDUAL_EXAM_PASS_ENTITLEMENT_TYPE,
            individual_access_policy: INDIVIDUAL_EXAM_PASS_POLICY_VERSION,
          },
          customer_details: { email: "learner@example.com", phone: null, name: null },
        },
      },
    });

    await handler(makeRequest(), response);

    expect(mockRetrievePaymentIntent).toHaveBeenCalledWith("pi_paid", { expand: ["latest_charge"] });
    expect(mockRecordPurchase).toHaveBeenCalledWith(expect.anything(), expect.objectContaining({
      email: "learner@example.com",
      productKey: "oit",
      stripeSessionId: "cs_paid",
      accessExpiresAt: new Date("2027-09-17T22:36:40.000Z"),
    }));
    expect(response.statusCode).toBe(200);
    expect(response.body).toEqual({ received: true });
  });

  it("keeps a fulfilled pass terminal when analytics and owner notification fail", async () => {
    mockGetDb.mockResolvedValue(dbWithNoOrganization());
    mockRecordPurchase.mockResolvedValue(undefined);
    mockNotifyOwner.mockRejectedValue(new Error("Owner notification unavailable"));
    mockTrackEvent.mockRejectedValue(new Error("Analytics unavailable"));
    mockConstructEvent.mockReturnValue({
      id: "evt_observability_failure",
      type: "checkout.session.completed",
      created: 1_800_000_000,
      data: { object: {
        id: "cs_observability_failure",
        mode: "payment",
        payment_status: "paid",
        amount_total: 4900,
        payment_intent: "pi_observability_failure",
        metadata: {
          product_key: "oit",
          product_name: "OIT Practice Pass",
          entitlement_type: INDIVIDUAL_EXAM_PASS_ENTITLEMENT_TYPE,
          individual_access_policy: INDIVIDUAL_EXAM_PASS_POLICY_VERSION,
        },
        customer_details: { email: "learner@example.com", phone: null, name: null },
      } },
    });

    const response = makeResponse();
    await captureWebhookHandler()(makeRequest(), response);

    expect(mockRecordPurchase).toHaveBeenCalledTimes(1);
    expect(response.statusCode).toBe(200);
    expect(response.body).toEqual({ received: true });
  });

  it("treats a concurrent unique-key collision as a verified duplicate", async () => {
    mockGetDb.mockResolvedValue(dbWithPurchaseLookupSequence([], [{ id: 19 }]));
    mockRecordPurchase.mockRejectedValue(Object.assign(new Error("Duplicate Stripe session"), {
      code: "ER_DUP_ENTRY",
      errno: 1062,
    }));
    mockConstructEvent.mockReturnValue({
      id: "evt_concurrent_duplicate",
      type: "checkout.session.completed",
      created: 1_800_000_001,
      data: { object: {
        id: "cs_concurrent_duplicate",
        mode: "payment",
        payment_status: "paid",
        amount_total: 4900,
        payment_intent: "pi_concurrent_duplicate",
        metadata: {
          product_key: "oit",
          product_name: "OIT Practice Pass",
          entitlement_type: INDIVIDUAL_EXAM_PASS_ENTITLEMENT_TYPE,
          individual_access_policy: INDIVIDUAL_EXAM_PASS_POLICY_VERSION,
        },
        customer_details: { email: "learner@example.com", phone: null, name: null },
      } },
    });

    const response = makeResponse();
    await captureWebhookHandler()(makeRequest(), response);

    expect(mockRecordPurchase).toHaveBeenCalledTimes(1);
    expect(mockNotifyOwner).not.toHaveBeenCalled();
    expect(response.statusCode).toBe(200);
    expect(response.body).toEqual({ received: true });
  });

  it("returns a retryable response when the atomic purchase transaction fails", async () => {
    mockGetDb.mockResolvedValue(dbWithNoOrganization());
    mockRecordPurchase.mockRejectedValue(new Error("Database connection reset"));
    mockConstructEvent.mockReturnValue({
      id: "evt_transaction_failure",
      type: "checkout.session.completed",
      created: 1_800_000_002,
      data: { object: {
        id: "cs_transaction_failure",
        mode: "payment",
        payment_status: "paid",
        amount_total: 4900,
        payment_intent: "pi_transaction_failure",
        metadata: {
          product_key: "oit",
          product_name: "OIT Practice Pass",
          entitlement_type: INDIVIDUAL_EXAM_PASS_ENTITLEMENT_TYPE,
          individual_access_policy: INDIVIDUAL_EXAM_PASS_POLICY_VERSION,
        },
        customer_details: { email: "learner@example.com", phone: null, name: null },
      } },
    });

    const response = makeResponse();
    await captureWebhookHandler()(makeRequest(), response);

    expect(mockRecordPurchase).toHaveBeenCalledTimes(1);
    expect(response.statusCode).toBe(503);
    expect(response.body).toEqual({ error: "Individual Exam Pass fulfilment is incomplete" });
  });

  it("waits for payment success instead of creating access on an unpaid completion", async () => {
    const handler = captureWebhookHandler();
    const response = makeResponse();
    mockGetDb.mockResolvedValue(dbWithNoOrganization());
    mockConstructEvent.mockReturnValue({
      id: "evt_pending_payment",
      type: "checkout.session.completed",
      created: 1_789_684_600,
      data: { object: {
        id: "cs_pending",
        mode: "payment",
        payment_status: "unpaid",
        metadata: {
          product_key: "oit",
          entitlement_type: INDIVIDUAL_EXAM_PASS_ENTITLEMENT_TYPE,
          individual_access_policy: INDIVIDUAL_EXAM_PASS_POLICY_VERSION,
        },
      } },
    });

    await handler(makeRequest(), response);

    expect(mockRecordPurchase).not.toHaveBeenCalled();
    expect(response.statusCode).toBe(200);
    expect(response.body).toEqual({ received: true, pendingPayment: true });
  });

  it("does not duplicate a signed Individual Pass webhook retry", async () => {
    const recorded = new Set<string>();
    const db = {
      select: vi.fn(() => ({
        from: vi.fn(() => ({
          where: vi.fn(() => ({
            limit: vi.fn().mockImplementation(async () => recorded.size ? [{ id: 1 }] : []),
          })),
        })),
      })),
    };
    mockGetDb.mockResolvedValue(db);
    mockRecordPurchase.mockImplementation(async (_db, purchase) => {
      recorded.add(purchase.stripeSessionId);
    });
    mockConstructEvent.mockReturnValue({
      id: "evt_retryable_paid",
      type: "checkout.session.completed",
      created: 1_800_000_000,
      data: { object: {
        id: "cs_retryable_paid",
        mode: "payment",
        payment_status: "paid",
        amount_total: 4900,
        payment_intent: "pi_retryable_paid",
        metadata: {
          product_key: "oit",
          product_name: "OIT Practice Pass",
          entitlement_type: INDIVIDUAL_EXAM_PASS_ENTITLEMENT_TYPE,
          individual_access_policy: INDIVIDUAL_EXAM_PASS_POLICY_VERSION,
        },
        customer_details: { email: "learner@example.com", phone: null, name: null },
      } },
    });

    await captureWebhookHandler()(makeRequest(), makeResponse());
    const retryResponse = makeResponse();
    await captureWebhookHandler()(makeRequest(), retryResponse);

    expect(mockRecordPurchase).toHaveBeenCalledTimes(1);
    expect(mockRetrievePaymentIntent).toHaveBeenCalledTimes(1);
    expect(mockTrackEvent).toHaveBeenCalledTimes(2);
    expect(retryResponse.statusCode).toBe(200);
    expect(retryResponse.body).toEqual({ received: true });
  });

  it("returns a retryable failure without granting access when the successful charge timestamp is missing", async () => {
    mockGetDb.mockResolvedValue(dbWithNoOrganization());
    mockRetrievePaymentIntent.mockResolvedValue({ status: "succeeded", latest_charge: null });
    mockConstructEvent.mockReturnValue({
      id: "evt_payment_lookup_failure",
      type: "checkout.session.completed",
      data: { object: {
        id: "cs_payment_lookup_failure",
        mode: "payment",
        payment_status: "paid",
        amount_total: 4900,
        payment_intent: "pi_missing_charge_timestamp",
        metadata: {
          product_key: "oit",
          product_name: "OIT Practice Pass",
          entitlement_type: INDIVIDUAL_EXAM_PASS_ENTITLEMENT_TYPE,
          individual_access_policy: INDIVIDUAL_EXAM_PASS_POLICY_VERSION,
        },
        customer_details: { email: "learner@example.com", phone: null, name: null },
      } },
    });

    const response = makeResponse();
    await captureWebhookHandler()(makeRequest(), response);

    expect(mockRecordPurchase).not.toHaveBeenCalled();
    expect(response.statusCode).toBe(503);
  });

  it("does not let an unversioned historical checkout create access", async () => {
    mockGetDb.mockResolvedValue(dbWithNoOrganization());
    mockRecordPurchase.mockResolvedValue(undefined);
    mockConstructEvent.mockReturnValue({
      id: "evt_historical_pass",
      type: "checkout.session.completed",
      data: { object: {
        id: "cs_historical_pass",
        mode: "payment",
        payment_status: "paid",
        amount_total: 4900,
        payment_intent: "pi_historical_pass",
        metadata: { product_key: "oit", product_name: "OIT Practice Pass" },
        customer_details: { email: "legacy@example.com", phone: null, name: null },
      } },
    });

    const response = makeResponse();
    await captureWebhookHandler()(makeRequest(), response);

    expect(mockRetrievePaymentIntent).not.toHaveBeenCalled();
    expect(mockRecordPurchase).not.toHaveBeenCalled();
    expect(response.statusCode).toBe(200);
    expect(response.body).toEqual({ received: true });
  });

  it("records a paid delayed-payment success through the same signed webhook path", async () => {
    mockGetDb.mockResolvedValue(dbWithNoOrganization());
    mockRecordPurchase.mockResolvedValue(undefined);
    mockConstructEvent.mockReturnValue({
      id: "evt_delayed_payment_success",
      type: "checkout.session.async_payment_succeeded",
      created: 1_800_000_000,
      data: { object: {
        id: "cs_delayed_payment_success",
        mode: "payment",
        payment_status: "unpaid",
        amount_total: 4900,
        payment_intent: "pi_delayed_payment_success",
        metadata: {
          product_key: "oit",
          product_name: "OIT Practice Pass",
          entitlement_type: INDIVIDUAL_EXAM_PASS_ENTITLEMENT_TYPE,
          individual_access_policy: INDIVIDUAL_EXAM_PASS_POLICY_VERSION,
        },
        customer_details: { email: "delayed@example.com", phone: null, name: null },
      } },
    });

    const response = makeResponse();
    await captureWebhookHandler()(makeRequest(), response);

    expect(mockRecordPurchase).toHaveBeenCalledWith(expect.anything(), expect.objectContaining({
      stripeSessionId: "cs_delayed_payment_success",
      accessExpiresAt: new Date("2027-09-17T22:36:40.000Z"),
    }));
    expect(response.statusCode).toBe(200);
  });

  it("routes a policy-marker mismatch to manual review without granting access", async () => {
    const db = {
      select: vi.fn(() => ({
        from: vi.fn(() => ({
          where: vi.fn(() => ({ limit: vi.fn().mockResolvedValue([{ id: 1 }]) })),
        })),
      })),
    };
    mockGetDb.mockResolvedValue(db);
    mockConstructEvent.mockReturnValue({
      id: "evt_missing_policy_duplicate",
      type: "checkout.session.completed",
      data: { object: {
        id: "cs_missing_policy_duplicate",
        mode: "payment",
        payment_status: "paid",
        amount_total: 4900,
        payment_intent: "pi_missing_policy_duplicate",
        metadata: {
          product_key: "oit",
          entitlement_type: INDIVIDUAL_EXAM_PASS_ENTITLEMENT_TYPE,
        },
        customer_details: { email: "learner@example.com", phone: null, name: null },
      } },
    });

    const response = makeResponse();
    await captureWebhookHandler()(makeRequest(), response);

    expect(mockRecordPurchase).not.toHaveBeenCalled();
    expect(mockNotifyOwner).toHaveBeenCalledTimes(1);
    expect(response.statusCode).toBe(200);
    expect(response.body).toEqual({ received: true, reviewRequired: true });
  });

  it("leaves Teams subscription checkout completions to the subscription webhook", async () => {
    mockGetDb.mockResolvedValue(dbWithNoOrganization());
    mockConstructEvent.mockReturnValue({
      id: "evt_team_checkout",
      type: "checkout.session.completed",
      data: { object: {
        id: "cs_team_checkout",
        mode: "subscription",
        payment_status: "no_payment_required",
        metadata: { type: "org" },
      } },
    });

    const response = makeResponse();
    await captureWebhookHandler()(makeRequest(), response);

    expect(mockRecordPurchase).not.toHaveBeenCalled();
    expect(response.statusCode).toBe(200);
    expect(response.body).toEqual({ received: true });
  });
});
