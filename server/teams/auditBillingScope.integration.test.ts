import { randomUUID } from "node:crypto";
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { eq, inArray } from "drizzle-orm";
import { organizations, subscriptions } from "../../drizzle/schema";
import { createIsolatedAuditDatabase } from "./auditSqlHarness";
import { stripeRouter } from "../routers/stripeRouter";
import type { TrpcContext } from "../_core/context";

const isolated = vi.hoisted(() => ({ db: null as any }));
const external = vi.hoisted(() => ({ portal: vi.fn().mockResolvedValue({ url: "https://billing.example.test" }) }));
vi.mock("../db", () => ({ getDb: async () => isolated.db }));
vi.mock("../stripe/stripe", () => ({ stripe: { billingPortal: { sessions: { create: external.portal } } } }));
vi.mock("../_core/notification", () => ({ notifyOwner: vi.fn() }));
vi.mock("../analytics", () => ({ hashAnalyticsAnonymousId: vi.fn(), trackEvent: vi.fn() }));
const suffix = randomUUID();
const emails = ["dual", "invoice", "pending", "personal-only", "other"].map(label => `billing-${label}-${suffix}@example.test`);
const [dual, invoice, pending, personalOnly, other] = emails;
const start = new Date(Date.now() - 86400000), end = new Date(Date.now() + 90 * 86400000);
const ctx = (email: string | null, oauth?: string): TrpcContext => ({ user: oauth ? { id: 7101, email: oauth, openId: "synthetic-billing", role: "user" } : null, studentEmail: email, req: { headers: {} }, res: {} }) as any;
const caller = (email: string | null) => stripeRouter.createCaller(ctx(email));
const suite = process.env.AUDIT_INTEGRATION_TEST_DB === "1" ? describe : describe.skip;
let close: () => void | Promise<void>;
let orgIds: number[] = [];
let dualOrg: number, invoiceOrg: number, pendingOrg: number, otherOrg: number;

suite("billing scope in designated echelon_audit_teams MySQL (synthetic fixtures only)", () => {
  beforeAll(async () => {
    // Require this task's named database even though the shared harness permits
    // the full-audit database for unrelated suites.
    const target = new URL(process.env.DATABASE_URL ?? "mysql://invalid");
    if (target.pathname !== "/echelon_audit_teams") throw new Error("Billing fixtures require the designated echelon_audit_teams database");
    const database = await createIsolatedAuditDatabase();
    isolated.db = database.db; close = database.close;
    for (const [email, status, billingType, customer] of [
      [dual, "active", "stripe", "cus_sql_dual_team"],
      [dual, "active", "stripe", "cus_sql_second_team"],
      // Invoice row deliberately retains a customer to ensure billingType also
      // fails closed instead of creating an accidental Team Stripe session.
      [invoice, "active", "invoice", "cus_sql_invoice_team"],
      [pending, "pending", "stripe", "cus_sql_pending_team"],
      [other, "active", "stripe", "cus_sql_other_team"],
    ]) {
      const [result] = await isolated.db.insert(organizations).values({ name: "Synthetic billing scope fixture", managerEmail: email, status, billingType, province: "ontario", tier: "all-access", seatsTotal: 5, termStart: start, termEnd: end, stripeCustomerId: customer, stripeSubscriptionId: `sub_sql_team_${suffix}_${orgIds.length}` });
      orgIds.push(Number(result.insertId));
    }
    [dualOrg, , invoiceOrg, pendingOrg, otherOrg] = orgIds;
    for (const [index, email] of emails.entries()) {
      await isolated.db.insert(subscriptions).values({ email, orgId: null, tier: "class1", province: "ontario", status: "active", stripeCustomerId: `cus_sql_personal_${index}`, stripeSubscriptionId: `sub_sql_personal_${suffix}_${index}`, currentPeriodStart: start, currentPeriodEnd: end, createdAt: start });
    }
    // A newer organization-managed subscription must never win personal billing.
    await isolated.db.insert(subscriptions).values({ email: dual, orgId: dualOrg, tier: "all-access", province: "ontario", status: "active", stripeCustomerId: "cus_sql_dual_team", stripeSubscriptionId: `sub_sql_team_seat_${suffix}`, currentPeriodStart: start, currentPeriodEnd: end, createdAt: new Date() });
  });
  beforeEach(() => external.portal.mockClear());
  afterAll(async () => {
    if (!isolated.db) return;
    try {
      await isolated.db.delete(subscriptions).where(inArray(subscriptions.email, emails));
      // Delete only randomized fixtures inserted by this suite.
      if (orgIds.length) await isolated.db.delete(organizations).where(inArray(organizations.id, orgIds));
    } finally { await close(); isolated.db = null; }
  });
  it("dual-active organization owner can explicitly select only their personal customer", async () => {
    await caller(dual).createBillingPortalSession({ scope: "personal" });
    expect(external.portal).toHaveBeenCalledWith({ customer: "cus_sql_personal_0", return_url: expect.stringMatching(/\/account\?billing=personal$/) });
    const rows = await isolated.db.select().from(organizations).where(eq(organizations.managerEmail, dual));
    expect(rows).toHaveLength(2); expect(rows.every((row: any) => row.status === "active")).toBe(true);
  });
  it("omitted scope still requires organization selection when two Teams are active", async () => {
    await expect(caller(dual).createBillingPortalSession({})).rejects.toThrow("Choose the organization");
    expect(external.portal).not.toHaveBeenCalled();
  });
  it("explicit Team selection keeps the displayed organization's billing customer", async () => {
    await caller(dual).createBillingPortalSession({ scope: "team", orgId: dualOrg });
    expect(external.portal).toHaveBeenCalledWith({ customer: "cus_sql_dual_team", return_url: expect.stringMatching(/\/team$/) });
  });
  it.each([{ email: invoice, index: 1 }, { email: pending, index: 2 }])("personal billing ignores invoice/pending Team rows for $email", async ({ email, index }) => {
    await caller(email).createBillingPortalSession({ scope: "personal" });
    expect(external.portal).toHaveBeenCalledWith(expect.objectContaining({ customer: `cus_sql_personal_${index}` }));
  });
  it("invoice Team scope and legacy auto mode never fall back to the personal customer", async () => {
    await expect(caller(invoice).createBillingPortalSession({ scope: "team", orgId: invoiceOrg })).rejects.toThrow("invoice billing");
    await expect(caller(invoice).createBillingPortalSession({})).rejects.toThrow("invoice billing");
    expect(external.portal).not.toHaveBeenCalled();
  });
  it("pending Team scope and legacy auto mode never fall back to personal", async () => {
    await expect(caller(pending).createBillingPortalSession({ scope: "team", orgId: pendingOrg })).rejects.toThrow("completed billing");
    await expect(caller(pending).createBillingPortalSession({})).rejects.toThrow("completed billing");
    expect(external.portal).not.toHaveBeenCalled();
  });
  it("rejects personal plus orgId before calling Stripe", async () => {
    await expect(caller(dual).createBillingPortalSession({ scope: "personal", orgId: dualOrg })).rejects.toMatchObject({ code: "BAD_REQUEST" });
    expect(external.portal).not.toHaveBeenCalled();
  });
  it("unknown and another manager's Team selections never fall back", async () => {
    await expect(caller(dual).createBillingPortalSession({ scope: "team", orgId: 2147483647 })).rejects.toMatchObject({ code: "FORBIDDEN" });
    await expect(caller(dual).createBillingPortalSession({ scope: "team", orgId: otherOrg })).rejects.toMatchObject({ code: "FORBIDDEN" });
    expect(external.portal).not.toHaveBeenCalled();
  });
  it("personal-only subscriber cannot request Team billing", async () => {
    await expect(caller(personalOnly).createBillingPortalSession({ scope: "team" })).rejects.toThrow("No manager account");
    expect(external.portal).not.toHaveBeenCalled();
    await caller(personalOnly).createBillingPortalSession({});
    expect(external.portal).toHaveBeenCalledWith(expect.objectContaining({ customer: "cus_sql_personal_3" }));
  });
  it("anonymous requests never call Stripe", async () => {
    for (const input of [{}, { scope: "personal" as const }, { scope: "team" as const, orgId: dualOrg }]) {
      await expect(caller(null).createBillingPortalSession(input)).rejects.toMatchObject({ code: "UNAUTHORIZED" });
    }
    expect(external.portal).not.toHaveBeenCalled();
  });
  it("personal customer follows verified OAuth identity instead of simultaneous OTP", async () => {
    await stripeRouter.createCaller(ctx(dual, invoice)).createBillingPortalSession({ scope: "personal" });
    expect(external.portal).toHaveBeenCalledWith(expect.objectContaining({ customer: "cus_sql_personal_1" }));
  });
});
