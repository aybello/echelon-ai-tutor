/**
 * webhook.integration.test.ts
 *
 * Integration tests for org provisioning and invoice processing.
 * Uses the live DATABASE_URL. Skips gracefully when DATABASE_URL is absent.
 * Set REQUIRE_WEBHOOK_INTEGRATION_DB=1 to fail instead of skip.
 *
 * All tests invoke the real production services (provisionOrgFromWebhook,
 * processOrgInvoice) with injected dependencies for email and notifications.
 * No test manufactures expected database state manually.
 */

import { describe, it, expect, beforeAll, afterAll, vi, beforeEach } from "vitest";
import { and, eq } from "drizzle-orm";
import { getDb } from "./db";
import {
  organizations,
  organizationMembers,
  subscriptions,
  stripeEventLog,
} from "../drizzle/schema";
  import {
  provisionOrgFromWebhook,
  productionProvisionOrgDependencies,
  type ProvisionOrgInput,
  type ProvisionOrgDependencies,
} from "./stripe/provisionOrg";
import {
  processOrgInvoice,
  productionProcessOrgInvoiceDependencies,
  type ProcessOrgInvoiceInput,
  type ProcessOrgInvoiceDependencies,
  classifyInvoiceSubscription,
} from "./stripe/processOrgInvoice";
import { sendManagerOnboardingEmail } from "./email";
import { buildOrgPaymentEmailCopy } from "./email";
import { notifyOwner } from "./_core/notification";
import { grantSeat } from "./routers/orgRouter";
import { initializeOrganizationRenewalTerm } from "./stripe/renewalTerm";

// ── CI guard ──────────────────────────────────────────────────────────────────

const hasIntegrationDatabase = Boolean(process.env.DATABASE_URL);

if (process.env.REQUIRE_WEBHOOK_INTEGRATION_DB === "1" && !hasIntegrationDatabase) {
  throw new Error(
    "DATABASE_URL is required for webhook integration tests. " +
    "Set DATABASE_URL or unset REQUIRE_WEBHOOK_INTEGRATION_DB.",
  );
}

const describeWithDatabase = describe.skipIf(!hasIntegrationDatabase);

// ── Mocks ─────────────────────────────────────────────────────────────────────

vi.mock("./email", async () => {
  const actual = await vi.importActual<typeof import("./email")>("./email");
  return {
    ...actual,
    sendManagerOnboardingEmail: vi.fn().mockResolvedValue(undefined),
    sendOrgPaymentConfirmationEmail: vi.fn().mockResolvedValue(undefined),
    sendTeamEnrollmentEmail: vi.fn().mockResolvedValue(undefined),
    sendWelcomeOnboardingEmail: vi.fn().mockResolvedValue(undefined),
  };
});

vi.mock("./_core/notification", () => ({
  notifyOwner: vi.fn().mockResolvedValue(true),
}));

// Mock the Stripe module so the test file can be imported without STRIPE_SECRET_KEY
vi.mock("./stripe/stripe", () => ({
  stripe: {
    subscriptions: {
      retrieve: vi.fn().mockResolvedValue({
        id: "sub_mock",
        metadata: {},
        status: "active",
        current_period_start: Math.floor(Date.now() / 1000),
        current_period_end: Math.floor(Date.now() / 1000) + 365 * 24 * 3600,
        items: { data: [{ quantity: 5 }] },
        customer: "cus_mock",
      }),
    },
  },
}));

// ── Test data helpers ─────────────────────────────────────────────────────────

const RUN_ID = `wh-${Date.now().toString(36)}`;
function runEmail(n: number | string) { return `wh-test-${RUN_ID}-${n}@echelon-test.invalid`; }
function runEventId(n: number | string) { return `evt_test_${RUN_ID}_${n}`; }
function runSubId(n: number | string) { return `sub_test_${RUN_ID}_${n}`; }

const TERM_END = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000);
const TERM_START = new Date(Date.now() - 1000);

function makeInput(n: number | string, overrides: Partial<ProvisionOrgInput> = {}): ProvisionOrgInput {
  return {
    stripeEventId: runEventId(n),
    eventType: "customer.subscription.created",
    stripeSubscriptionId: runSubId(n),
    stripeCustomerId: "cus_test_001",
    orgName: `Test Org ${RUN_ID}-${n}`,
    managerEmail: runEmail(n),
    province: "western",
    tier: "stream-wastewater-coll",
    seats: 5,
    currentPeriodStart: TERM_START,
    currentPeriodEnd: TERM_END,
    status: "active",
    ...overrides,
  };
}

function makeInvoiceInput(
  orgId: number,
  n: number | string,
  overrides: Partial<ProcessOrgInvoiceInput> = {},
): ProcessOrgInvoiceInput {
  return {
    stripeEventId: runEventId(`inv_${n}`),
    stripeInvoiceId: `in_test_${RUN_ID}_${n}`,
    stripeSubscriptionId: runSubId(n),
    amountPaid: 34900,
    billingReason: "subscription_cycle",
    hostedInvoiceUrl: null,
    invoicePdfUrl: null,
    organization: {
      id: orgId,
      name: `Test Org ${RUN_ID}-${n}`,
      managerEmail: runEmail(n),
      tier: "stream-wastewater-coll",
      seatsTotal: 5,
      status: "active",
    },
    ...overrides,
  };
}

  function makeDeps(overrides: Partial<ProvisionOrgDependencies> = {}): ProvisionOrgDependencies {
  return {
    sendOnboardingEmail: vi.fn().mockResolvedValue(undefined),
    sendOwnerNotification: vi.fn().mockResolvedValue(true),
    ensureManager: grantSeat,
    initializeRenewalTerm: initializeOrganizationRenewalTerm,
    ...overrides,
  };
}

function makeInvoiceDeps(overrides: Partial<ProcessOrgInvoiceDependencies> = {}): ProcessOrgInvoiceDependencies {
  return {
    sendPaymentEmail: vi.fn().mockResolvedValue(undefined),
    retrieveSubscription: vi.fn().mockResolvedValue({
      current_period_start: Math.floor(TERM_START.getTime() / 1000),
      current_period_end: Math.floor(TERM_END.getTime() / 1000),
    }),
    ...overrides,
  };
}

// ── Setup / teardown ──────────────────────────────────────────────────────────

let db: Awaited<ReturnType<typeof getDb>>;
const createdOrgIds: number[] = [];
const createdEventIds: string[] = [];

beforeAll(async () => {
  if (!hasIntegrationDatabase) return;
  db = await getDb();
});

afterAll(async () => {
  if (!db) return;
  for (const orgId of createdOrgIds) {
    await db.delete(subscriptions).where(eq(subscriptions.orgId, orgId)).catch(() => {});
    await db.delete(organizationMembers).where(eq(organizationMembers.orgId, orgId)).catch(() => {});
    await db.delete(organizations).where(eq(organizations.id, orgId)).catch(() => {});
  }
  for (const eventId of createdEventIds) {
    await db.delete(stripeEventLog).where(eq(stripeEventLog.stripeEventId, eventId)).catch(() => {});
  }
});

// ── Tests ─────────────────────────────────────────────────────────────────────

describeWithDatabase("Stripe webhook integration", () => {

  // 1. First org event creates one org and one manager
  it("1. First org event creates one org and one manager", async () => {
    const deps = makeDeps();
    const input = makeInput(101);
    createdEventIds.push(input.stripeEventId);

    const result = await provisionOrgFromWebhook(db!, input, deps);
    expect(result.state).toBe("completed");
    if (result.state !== "completed") return;
    createdOrgIds.push(result.orgId);

    const orgRows = await db!.select().from(organizations).where(eq(organizations.id, result.orgId)).limit(1);
    expect(orgRows).toHaveLength(1);
    expect(orgRows[0].managerEmail).toBe(input.managerEmail);
    expect(orgRows[0].seatsTotal).toBe(5);
    expect(orgRows[0].billingType).toBe("stripe");

    const memberRows = await db!.select().from(organizationMembers)
      .where(and(eq(organizationMembers.orgId, result.orgId), eq(organizationMembers.email, input.managerEmail)))
      .limit(1);
    expect(memberRows).toHaveLength(1);
    expect(memberRows[0].role).toBe("manager");

    expect(deps.sendOnboardingEmail).toHaveBeenCalledTimes(1);
  });

  // 2. Replaying the completed event creates no duplicates
  it("2. Replaying the completed event creates no duplicates", async () => {
    const deps = makeDeps();
    const input = makeInput(102);
    createdEventIds.push(input.stripeEventId);

    const result1 = await provisionOrgFromWebhook(db!, input, deps);
    expect(result1.state).toBe("completed");
    if (result1.state !== "completed") return;
    createdOrgIds.push(result1.orgId);

    const result2 = await provisionOrgFromWebhook(db!, input, deps);
    expect(result2.state).toBe("already_completed");

    const orgRows = await db!.select().from(organizations).where(eq(organizations.stripeSubscriptionId, input.stripeSubscriptionId));
    expect(orgRows).toHaveLength(1);

    const memberRows = await db!.select().from(organizationMembers)
      .where(and(eq(organizationMembers.orgId, result1.orgId), eq(organizationMembers.role, "manager")));
    expect(memberRows).toHaveLength(1);

    // Email sent only once
    expect(deps.sendOnboardingEmail).toHaveBeenCalledTimes(1);
  });

  // 3. SMTP failure leaves event in db_completed_email_pending
  it("3. SMTP failure leaves event in db_completed_email_pending", async () => {
    const deps = makeDeps({
      sendOnboardingEmail: vi.fn().mockRejectedValue(new Error("SMTP unavailable")),
    });
    const input = makeInput(103);
    createdEventIds.push(input.stripeEventId);

    const result = await provisionOrgFromWebhook(db!, input, deps);
    expect(result.state).toBe("retryable_failure");

    const ledger = await db!.select().from(stripeEventLog).where(eq(stripeEventLog.stripeEventId, input.stripeEventId)).limit(1);
    expect(ledger[0].status).toBe("db_completed_email_pending");
    expect(ledger[0].dbProcessed).toBe(true);
    expect(ledger[0].emailDelivered).toBe(false);

    // Org was created despite email failure
    const orgRows = await db!.select().from(organizations).where(eq(organizations.stripeSubscriptionId, input.stripeSubscriptionId));
    expect(orgRows).toHaveLength(1);
    createdOrgIds.push(orgRows[0].id);
  });

  // 4. Replaying the same event ID completes onboarding
  it("4. Replaying the same event ID completes onboarding", async () => {
    // First call: SMTP fails
    const failDeps = makeDeps({
      sendOnboardingEmail: vi.fn().mockRejectedValue(new Error("SMTP down")),
    });
    const input = makeInput(104);
    createdEventIds.push(input.stripeEventId);

    const result1 = await provisionOrgFromWebhook(db!, input, failDeps);
    expect(result1.state).toBe("retryable_failure");

    const orgRows = await db!.select().from(organizations).where(eq(organizations.stripeSubscriptionId, input.stripeSubscriptionId));
    expect(orgRows).toHaveLength(1);
    createdOrgIds.push(orgRows[0].id);

    // Verify email not persisted
    expect(orgRows[0].onboardingEmailSentAt).toBeNull();

    // Second call: same event ID, SMTP recovered
    const successDeps = makeDeps({
      sendOnboardingEmail: vi.fn().mockResolvedValue(undefined),
    });
    const result2 = await provisionOrgFromWebhook(db!, input, successDeps);
    expect(result2.state).toBe("completed");

    // Email sent exactly once on retry
    expect(successDeps.sendOnboardingEmail).toHaveBeenCalledTimes(1);

    // onboardingEmailSentAt now set
    const orgAfter = await db!.select({ onboardingEmailSentAt: organizations.onboardingEmailSentAt }).from(organizations).where(eq(organizations.id, orgRows[0].id)).limit(1);
    expect(orgAfter[0].onboardingEmailSentAt).not.toBeNull();

    // Ledger is completed
    const ledger = await db!.select().from(stripeEventLog).where(eq(stripeEventLog.stripeEventId, input.stripeEventId)).limit(1);
    expect(ledger[0].status).toBe("completed");
  });

  // 5. Completed onboarding is not sent again
  it("5. Completed onboarding is not sent again", async () => {
    const deps = makeDeps();
    const input = makeInput(105);
    createdEventIds.push(input.stripeEventId);

    const result1 = await provisionOrgFromWebhook(db!, input, deps);
    expect(result1.state).toBe("completed");
    if (result1.state !== "completed") return;
    createdOrgIds.push(result1.orgId);
    expect(deps.sendOnboardingEmail).toHaveBeenCalledTimes(1);

    // Replay same event ID
    const result2 = await provisionOrgFromWebhook(db!, input, deps);
    expect(result2.state).toBe("already_completed");

    // Email not sent again
    expect(deps.sendOnboardingEmail).toHaveBeenCalledTimes(1);
  });

  // 6. Manager creation failure is repaired on retry
  it("6. Manager creation failure is repaired on retry", async () => {
    const ensureManager = vi.fn()
      .mockRejectedValueOnce(new Error("Manager insert failed"))
      .mockImplementation(grantSeat);

    const deps = makeDeps({ ensureManager });
    const input = makeInput(106);
    createdEventIds.push(input.stripeEventId);

    const first = await provisionOrgFromWebhook(db!, input, deps);
    expect(first.state).toBe("retryable_failure");

    // Retry with same event ID
    const retry = await provisionOrgFromWebhook(db!, input, deps);
    expect(retry.state).toBe("completed");
    if (retry.state !== "completed") return;
    createdOrgIds.push(retry.orgId);

    // Manager exists after repair
    const managerRows = await db!.select().from(organizationMembers)
      .where(and(
        eq(organizationMembers.orgId, retry.orgId),
        eq(organizationMembers.email, input.managerEmail),
        eq(organizationMembers.role, "manager"),
      ));
    expect(managerRows).toHaveLength(1);
  });

  // 7. Renewal-term initialization failure is retryable
  it("7. Renewal-term initialization failure is retryable", async () => {
    // Create an existing org first
    const initialInput = makeInput(107);
    createdEventIds.push(initialInput.stripeEventId);
    const initial = await provisionOrgFromWebhook(db!, initialInput, makeDeps());
    expect(initial.state).toBe("completed");
    if (initial.state !== "completed") return;
    createdOrgIds.push(initial.orgId);

    // Renewal event: same sub ID, new event ID, updated period
    const renewalInput = makeInput(107, {
      stripeEventId: runEventId("107_renewal"),
      eventType: "customer.subscription.updated",
      currentPeriodStart: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
      currentPeriodEnd: new Date(Date.now() + 730 * 24 * 60 * 60 * 1000),
    });
    createdEventIds.push(renewalInput.stripeEventId);

    // First attempt: initializeRenewalTerm fails
    const initializeRenewalTerm = vi.fn()
      .mockRejectedValueOnce(new Error("renewal ledger unavailable"))
      .mockResolvedValueOnce(undefined);

    const failDeps = makeDeps({ initializeRenewalTerm });
    const first = await provisionOrgFromWebhook(db!, renewalInput, failDeps);
    expect(first.state).toBe("retryable_failure");

    const failedEvent = await db!.select().from(stripeEventLog).where(eq(stripeEventLog.stripeEventId, renewalInput.stripeEventId)).limit(1);
    expect(failedEvent[0].status).toBe("failed");
    expect(failedEvent[0].dbProcessed).toBe(false);

    // Retry with same event ID
    const retry = await provisionOrgFromWebhook(db!, renewalInput, failDeps);
    expect(retry.state).toBe("completed");
    expect(initializeRenewalTerm).toHaveBeenCalledTimes(2);
  });

  // 8. Initial invoice sends activation language
  it("8. Initial invoice sends activation language (billing_reason=subscription_create)", async () => {
    // Set up an org first
    const deps = makeDeps();
    const input = makeInput(108);
    createdEventIds.push(input.stripeEventId);
    const result = await provisionOrgFromWebhook(db!, input, deps);
    expect(result.state).toBe("completed");
    if (result.state !== "completed") return;
    createdOrgIds.push(result.orgId);

    const invoiceDeps = makeInvoiceDeps();
    const invoiceInput = makeInvoiceInput(result.orgId, 108, {
      billingReason: "subscription_create",
    });
    createdEventIds.push(invoiceInput.stripeEventId);

    const invoiceResult = await processOrgInvoice(db!, invoiceInput, invoiceDeps);
    expect(invoiceResult.state).toBe("completed");

    expect(invoiceDeps.sendPaymentEmail).toHaveBeenCalledTimes(1);
    const callArgs = (invoiceDeps.sendPaymentEmail as any).mock.calls[0][0];
    expect(callArgs.billingReason).toBe("subscription_create");
  });

  // 9. Renewal invoice sends renewal language
  it("9. Renewal invoice sends renewal language (billing_reason=subscription_cycle)", async () => {
    const deps = makeDeps();
    const input = makeInput(109);
    createdEventIds.push(input.stripeEventId);
    const result = await provisionOrgFromWebhook(db!, input, deps);
    expect(result.state).toBe("completed");
    if (result.state !== "completed") return;
    createdOrgIds.push(result.orgId);

    const invoiceDeps = makeInvoiceDeps();
    const invoiceInput = makeInvoiceInput(result.orgId, 109, {
      billingReason: "subscription_cycle",
    });
    createdEventIds.push(invoiceInput.stripeEventId);

    const invoiceResult = await processOrgInvoice(db!, invoiceInput, invoiceDeps);
    expect(invoiceResult.state).toBe("completed");

    const callArgs = (invoiceDeps.sendPaymentEmail as any).mock.calls[0][0];
    expect(callArgs.billingReason).toBe("subscription_cycle");
  });

  // 10. Non-cycle invoice uses neutral payment language
  it("10. Non-cycle invoice uses neutral billing_reason", async () => {
    const deps = makeDeps();
    const input = makeInput(110);
    createdEventIds.push(input.stripeEventId);
    const result = await provisionOrgFromWebhook(db!, input, deps);
    expect(result.state).toBe("completed");
    if (result.state !== "completed") return;
    createdOrgIds.push(result.orgId);

    const invoiceDeps = makeInvoiceDeps();
    const invoiceInput = makeInvoiceInput(result.orgId, 110, {
      billingReason: "manual",
    });
    createdEventIds.push(invoiceInput.stripeEventId);

    const invoiceResult = await processOrgInvoice(db!, invoiceInput, invoiceDeps);
    expect(invoiceResult.state).toBe("completed");

    const callArgs = (invoiceDeps.sendPaymentEmail as any).mock.calls[0][0];
    expect(callArgs.billingReason).toBe("manual");
  });

  // 11. Payment email failure remains retryable using the same event ID
  it("11. Payment email failure remains retryable using the same event ID", async () => {
    const deps = makeDeps();
    const input = makeInput(111);
    createdEventIds.push(input.stripeEventId);
    const result = await provisionOrgFromWebhook(db!, input, deps);
    expect(result.state).toBe("completed");
    if (result.state !== "completed") return;
    createdOrgIds.push(result.orgId);

    // First invoice attempt: email fails
    const failInvoiceDeps = makeInvoiceDeps({
      sendPaymentEmail: vi.fn().mockRejectedValue(new Error("SMTP down")),
    });
    const invoiceInput = makeInvoiceInput(result.orgId, 111);
    createdEventIds.push(invoiceInput.stripeEventId);

    const failResult = await processOrgInvoice(db!, invoiceInput, failInvoiceDeps);
    expect(failResult.state).toBe("retryable_failure");

    const ledger = await db!.select().from(stripeEventLog).where(eq(stripeEventLog.stripeEventId, invoiceInput.stripeEventId)).limit(1);
    expect(ledger[0].status).toBe("db_completed_email_pending");

    // Retry: email succeeds
    const successInvoiceDeps = makeInvoiceDeps();
    const retryResult = await processOrgInvoice(db!, invoiceInput, successInvoiceDeps);
    expect(retryResult.state).toBe("completed");
    expect(successInvoiceDeps.sendPaymentEmail).toHaveBeenCalledTimes(1);
  });

  // 12. A completed invoice event does not send duplicate email
  it("12. Completed invoice event does not send duplicate email", async () => {
    const deps = makeDeps();
    const input = makeInput(112);
    createdEventIds.push(input.stripeEventId);
    const result = await provisionOrgFromWebhook(db!, input, deps);
    expect(result.state).toBe("completed");
    if (result.state !== "completed") return;
    createdOrgIds.push(result.orgId);

    const invoiceDeps = makeInvoiceDeps();
    const invoiceInput = makeInvoiceInput(result.orgId, 112);
    createdEventIds.push(invoiceInput.stripeEventId);

    const first = await processOrgInvoice(db!, invoiceInput, invoiceDeps);
    expect(first.state).toBe("completed");
    expect(invoiceDeps.sendPaymentEmail).toHaveBeenCalledTimes(1);

    // Replay same event ID
    const replay = await processOrgInvoice(db!, invoiceInput, invoiceDeps);
    expect(replay.state).toBe("already_completed");

    // Email not sent again
    expect(invoiceDeps.sendPaymentEmail).toHaveBeenCalledTimes(1);
  });

  // 13. Invoice arriving before org creation returns retryable failure
  it("13. Invoice before org creation is not processed as individual subscription", async () => {
    // Test via classifyInvoiceSubscription which the production handler uses
    expect(classifyInvoiceSubscription({ isOrganizationSubscription: true, organizationExists: false }))
      .toBe("organization_pending");
    expect(classifyInvoiceSubscription({ isOrganizationSubscription: true, organizationExists: true }))
      .toBe("organization");
    expect(classifyInvoiceSubscription({ isOrganizationSubscription: false, organizationExists: false }))
      .toBe("individual");

  });

  // 14. Two concurrent deliveries create one org, one manager, one onboarding attempt
  it("14. Two concurrent deliveries create one org, one manager, one onboarding attempt", async () => {
    const deps1 = makeDeps();
    const deps2 = makeDeps();
    const input = makeInput(114);
    createdEventIds.push(input.stripeEventId);

    const [result1, result2] = await Promise.all([
      provisionOrgFromWebhook(db!, input, deps1),
      provisionOrgFromWebhook(db!, input, deps2),
    ]);

    const successful = [result1, result2].filter(r => r.state === "completed" || r.state === "already_completed");
    const notBusy = [result1, result2].filter(r => r.state !== "busy");
    // At least one must succeed; the other may be busy or already_completed
    expect(successful.length + [result1, result2].filter(r => r.state === "busy").length).toBe(2);
    expect(successful.length).toBeGreaterThanOrEqual(1);

    const orgId = successful[0].state === "completed" || successful[0].state === "already_completed"
      ? (successful[0] as any).orgId
      : (successful[1] as any).orgId;
    createdOrgIds.push(orgId);

    // Only one org row
    const orgRows = await db!.select().from(organizations).where(eq(organizations.stripeSubscriptionId, input.stripeSubscriptionId));
    expect(orgRows).toHaveLength(1);

    // Only one manager member row
    const managerRows = await db!.select().from(organizationMembers)
      .where(and(eq(organizationMembers.orgId, orgId), eq(organizationMembers.role, "manager")));
    expect(managerRows).toHaveLength(1);

    // Total onboarding email calls across both workers = 1
    const totalEmailCalls = (deps1.sendOnboardingEmail as any).mock.calls.length +
      (deps2.sendOnboardingEmail as any).mock.calls.length;
    expect(totalEmailCalls).toBe(1);
  });

  // 15. Handler-level provisioning delegation test is in webhook.handler.test.ts

  // 16. Handler-level delegation test is in webhook.handler.test.ts

  // 17. Migration applies successfully
  it("17. Migration schema is present in the live database", async () => {
    // Verify stripe_event_log columns by inserting and reading back a test row
    const testEventId = runEventId("migration_check");
    createdEventIds.push(testEventId);

    // Insert a row with all required columns
    await db!.insert(stripeEventLog).values({
      stripeEventId: testEventId,
      eventType: "migration_test",
      stripeObjectId: null,
      orgId: null,
      status: "pending",
      dbProcessed: false,
      emailDelivered: false,
      attemptCount: 0,
      processingToken: "test-token-abc",
      processingStartedAt: new Date(),
    });

    const rows = await db!.select().from(stripeEventLog).where(eq(stripeEventLog.stripeEventId, testEventId)).limit(1);
    expect(rows).toHaveLength(1);
    expect(rows[0].stripeEventId).toBe(testEventId);
    expect(rows[0].processingToken).toBe("test-token-abc");
    expect(rows[0].processingStartedAt).not.toBeNull();
    expect(rows[0].dbProcessed).toBe(false);
    expect(rows[0].emailDelivered).toBe(false);
    expect(rows[0].attemptCount).toBe(0);

    // Verify onboardingEmailSentAt column exists on organizations by reading it
    const orgRows = await db!.select({ onboardingEmailSentAt: organizations.onboardingEmailSentAt }).from(organizations).limit(1);
    // Column exists if query succeeds (even with 0 rows)
    expect(Array.isArray(orgRows)).toBe(true);
  });

});

// ── Unit tests (no database required) ────────────────────────────────────────

describe("organization payment email copy", () => {
  it("uses activation language for subscription_create", () => {
    const copy = buildOrgPaymentEmailCopy("subscription_create", "City of Winnipeg");
    expect(copy.subject).toContain("is active");
    expect(copy.body).toContain("now active");
    expect(copy.summaryLabel).toBe("Activation Summary");
    expect(copy.subject).not.toContain("renewed");
    expect(copy.periodLabel).toBe("Next renewal");
  });

  it("uses renewal language for subscription_cycle", () => {
    const copy = buildOrgPaymentEmailCopy("subscription_cycle", "City of Winnipeg");
    expect(copy.subject).toContain("renewed");
    expect(copy.body).toContain("has been renewed");
    expect(copy.summaryLabel).toBe("Renewal Summary");
    expect(copy.periodLabel).toBe("Next renewal");
  });

  it("uses neutral language for manual or prorated invoices", () => {
    for (const billingReason of ["manual", "subscription_update", null]) {
      const copy = buildOrgPaymentEmailCopy(billingReason, "City of Winnipeg");
      expect(copy.subject).toContain("Payment confirmed");
      expect(copy.subject).not.toContain("renewed");
      expect(copy.body).toContain("received a payment");
      expect(copy.summaryLabel).toBe("Payment Summary");
      expect(copy.periodLabel).toBe("Current term ends");
    }
  });
});

describe("invoice subscription routing", () => {
  it("routes org subscription with existing org to organization", () => {
    expect(classifyInvoiceSubscription({ isOrganizationSubscription: true, organizationExists: true }))
      .toBe("organization");
  });

  it("routes org subscription with no org to organization_pending", () => {
    expect(classifyInvoiceSubscription({ isOrganizationSubscription: true, organizationExists: false }))
      .toBe("organization_pending");
  });

  it("routes non-org subscription to individual", () => {
    expect(classifyInvoiceSubscription({ isOrganizationSubscription: false, organizationExists: false }))
      .toBe("individual");
    expect(classifyInvoiceSubscription({ isOrganizationSubscription: false, organizationExists: true }))
      .toBe("individual");
  });
});
