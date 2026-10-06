import { beforeEach, afterEach, describe, expect, it, vi } from "vitest";
import { eq } from "drizzle-orm";
import { organizations, subscriptions } from "../../drizzle/schema";
import { createAuditSqlDatabase } from "./auditSqlHarness";
import { stripeRouter } from "../routers/stripeRouter";
import type { TrpcContext } from "../_core/context";

const isolated = vi.hoisted(() => ({ db: null as any }));
const external = vi.hoisted(() => ({ portal: vi.fn().mockResolvedValue({ url: "https://billing.example.test" }) }));
vi.mock("../db", () => ({ getDb: vi.fn(async () => isolated.db) }));
vi.mock("../stripe/stripe", () => ({ stripe: { billingPortal: { sessions: { create: external.portal } } } }));
vi.mock("../_core/notification", () => ({ notifyOwner: vi.fn() }));
vi.mock("../analytics", () => ({ hashAnalyticsAnonymousId: vi.fn(), trackEvent: vi.fn() }));
const email = "dual-owner@example.test";
const ctx = (studentEmail: string | null, oauthEmail?: string | null): TrpcContext => ({
  user: oauthEmail !== undefined ? { id: 7001, email: oauthEmail, openId: "synthetic", role: "user" } : null,
  studentEmail, req: { headers: {} }, res: {},
}) as any;
const personalCaller = () => stripeRouter.createCaller(ctx(email));
let close: () => void;
let orgId: number;
const start = new Date(Date.now() - 86400000);
const end = new Date(Date.now() + 90 * 86400000);

beforeEach(async () => {
  const database = createAuditSqlDatabase();
  isolated.db = database.db; close = database.close;
  external.portal.mockClear();
  const [org] = await database.db.insert(organizations).values({ name: "Synthetic dual owner", managerEmail: email, province: "ontario", seatsTotal: 5, status: "active", termStart: start, termEnd: end, stripeCustomerId: "cus_team", stripeSubscriptionId: "sub_team" });
  orgId = Number((org as any).insertId);
  await database.db.insert(subscriptions).values([
    { email, tier: "class1", province: "ontario", orgId: null, stripeSubscriptionId: "sub_personal", stripeCustomerId: "cus_personal", currentPeriodStart: start, currentPeriodEnd: end, createdAt: start },
    { email, tier: "all-access", province: "ontario", orgId, stripeSubscriptionId: "sub_team_seat", stripeCustomerId: "cus_team", currentPeriodStart: start, currentPeriodEnd: end, createdAt: new Date() },
  ]);
});
afterEach(() => { close(); isolated.db = null; });

describe("explicit billing scope (synthetic SQL and mocked Stripe)", () => {
  it("personal ignores a newer team row and returns to the explicit Account view", async () => {
    await personalCaller().createBillingPortalSession({ scope: "personal" });
    expect(external.portal).toHaveBeenCalledOnce();
    expect(external.portal).toHaveBeenCalledWith({ customer: "cus_personal", return_url: expect.stringMatching(/\/account\?billing=personal$/) });
  });
  it.each([{}, undefined])("legacy %j keeps safe team-first routing", async input => {
    await personalCaller().createBillingPortalSession(input);
    expect(external.portal).toHaveBeenCalledWith({ customer: "cus_team", return_url: expect.stringMatching(/\/team$/) });
  });
  it.each(["invoice", "pending", "checkout_failed"])("explicit personal is independent of %s Team billing", async kind => {
    await isolated.db.update(organizations).set(kind === "invoice" ? { billingType: "invoice" } : { status: kind }).where(eq(organizations.id, orgId));
    await personalCaller().createBillingPortalSession({ scope: "personal" });
    expect(external.portal).toHaveBeenCalledWith(expect.objectContaining({ customer: "cus_personal" }));
    external.portal.mockClear();
    await expect(personalCaller().createBillingPortalSession({ scope: "team", orgId })).rejects.toThrow(kind === "invoice" ? "invoice billing" : "completed billing");
    expect(external.portal).not.toHaveBeenCalled();
    await expect(personalCaller().createBillingPortalSession({})).rejects.toThrow();
    expect(external.portal).not.toHaveBeenCalled();
  });
  it("explicit Team targets only its owned organization", async () => {
    await personalCaller().createBillingPortalSession({ scope: "team", orgId });
    expect(external.portal).toHaveBeenCalledWith(expect.objectContaining({ customer: "cus_team" }));
  });
  it("personal cannot select any organization", async () => {
    await expect(personalCaller().createBillingPortalSession({ scope: "personal", orgId })).rejects.toMatchObject({ code: "BAD_REQUEST" });
    expect(external.portal).not.toHaveBeenCalled();
  });
  it("an unknown Team cannot fall back to personal", async () => {
    await expect(personalCaller().createBillingPortalSession({ scope: "team", orgId: orgId + 999 })).rejects.toMatchObject({ code: "FORBIDDEN" });
    expect(external.portal).not.toHaveBeenCalled();
  });
  it("explicit Team with no ownership cannot fall back to personal", async () => {
    await isolated.db.delete(organizations).where(eq(organizations.id, orgId));
    await expect(personalCaller().createBillingPortalSession({ scope: "team" })).rejects.toThrow("No manager account");
    expect(external.portal).not.toHaveBeenCalled();
    await personalCaller().createBillingPortalSession({});
    expect(external.portal).toHaveBeenCalledWith(expect.objectContaining({ customer: "cus_personal" }));
  });
  it("personal does not use team customers when no direct personal subscription exists", async () => {
    await isolated.db.delete(subscriptions).where(eq(subscriptions.stripeSubscriptionId, "sub_personal"));
    await expect(personalCaller().createBillingPortalSession({ scope: "personal" })).rejects.toThrow("No Stripe customer found");
    expect(external.portal).not.toHaveBeenCalled();
  });
  it.each([{}, { scope: "personal" as const }, { scope: "team" as const }])("anonymous %j never calls Stripe", async input => {
    await expect(stripeRouter.createCaller(ctx(null)).createBillingPortalSession(input)).rejects.toMatchObject({ code: "UNAUTHORIZED" });
    expect(external.portal).not.toHaveBeenCalled();
  });
  it("verified OAuth identity takes precedence over a simultaneous OTP identity", async () => {
    await expect(stripeRouter.createCaller(ctx(email, "other@example.test")).createBillingPortalSession({ scope: "personal" })).rejects.toThrow("No Stripe customer found");
    expect(external.portal).not.toHaveBeenCalled();
  });
  it("normalizes the verified personal identity and supports OAuth subscribers", async () => {
    await stripeRouter.createCaller(ctx(null, " DUAL-OWNER@EXAMPLE.TEST ")).createBillingPortalSession({ scope: "personal" });
    expect(external.portal).toHaveBeenCalledWith(expect.objectContaining({ customer: "cus_personal" }));
  });
  it("rejects an invalid scope instead of silently selecting Team", async () => {
    await expect(personalCaller().createBillingPortalSession({ scope: "auto" } as any)).rejects.toMatchObject({ code: "BAD_REQUEST" });
    expect(external.portal).not.toHaveBeenCalled();
  });
});
