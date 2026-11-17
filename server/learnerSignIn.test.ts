import { beforeEach, describe, expect, it, vi } from "vitest";
import type { TrpcContext } from "./_core/context";
const state = vi.hoisted(() => ({
  persist: vi.fn(), verify: vi.fn(), magic: vi.fn(), cookie: vi.fn(), entitlements: vi.fn(),
  exchange: vi.fn(), info: vi.fn(), session: vi.fn(), upsert: vi.fn(), lookup: vi.fn(), track: vi.fn(),
}));
vi.mock("./analytics", () => ({ persistAnalyticsEvent: state.persist, trackEvent: state.track }));
vi.mock("./db", () => ({ getDb: async () => ({}), upsertUser: state.upsert, getUserByOpenId: state.lookup }));
vi.mock("./auth/atomicVerification", () => ({ verifyAndConsumeOtp: state.verify, consumeMagicLinkAtomically: state.magic }));
vi.mock("./_core/emailSession", () => ({ issueVerifiedEmailSessionCookie: state.cookie, readVerifiedEmailFromRequest: vi.fn(), ECHELON_SESSION_COOKIE: "fixture" }));
vi.mock("./_core/access", () => ({ normalizeEmail: (email: string) => email.trim().toLowerCase(), resolveEntitlementsByEmail: state.entitlements }));
vi.mock("./_core/subscriptionToken", () => ({ issueSubscriptionToken: async () => "fixture-only" }));
vi.mock("./_core/sdk", () => ({ sdk: { exchangeCodeForToken: state.exchange, getUserInfo: state.info, createSessionToken: state.session } }));
vi.mock("./teams/billingIdentity", () => ({ hasRecoverableTeamBilling: async () => false }));
vi.mock("./email", () => ({ sendOtpEmail: vi.fn(), sendMagicLinkEmail: vi.fn() }));
vi.mock("./routers/trainingRouter", () => ({ hasTrainingRecord: async () => false }));
import { recordLearnerSignIn } from "./learnerSignIn";
import { emailOtpRouter } from "./routers/emailOtpRouter";
import { dashboardAuthRouter } from "./routers/dashboardAuthRouter";
import { magicLinkRouter } from "./routers/magicLinkRouter";
import { registerOAuthRoutes } from "./_core/oauth";
function context(headers: Record<string, string> = { "x-echelon-activity": "allowed" }): TrpcContext {
  return { user: { id: 999 } as never, studentEmail: "unrelated@example.test", req: { headers, protocol: "https" } as never, res: { cookie: state.cookie } as never };
}
beforeEach(() => {
  vi.resetAllMocks();
  state.verify.mockResolvedValue({ valid: true });
  state.magic.mockResolvedValue({ email: "verified@example.test" });
  state.entitlements.mockResolvedValue({ unlockedExamTypes: [], purchasedProductKeys: [], isManager: false });
  state.exchange.mockResolvedValue({ accessToken: "not-stored" });
  state.info.mockResolvedValue({ openId: "provider-verified-id", email: "not-trusted-for-association@example.test" });
  state.lookup.mockResolvedValue({ id: 17 });
  state.session.mockResolvedValue("not-stored");
});
async function oauth(query: Record<string, string> = { code: "code", state: "state" }) {
  let handler: Function = () => {};
  registerOAuthRoutes({ get: (_path: string, callback: Function) => { handler = callback; } } as never);
  const res = { cookie: state.cookie, send: vi.fn(), status: vi.fn().mockReturnThis(), json: vi.fn() };
  await handler({ query, headers: { cookie: "echelon_activity_preference=allowed" }, protocol: "https" }, res);
  return res;
}
describe("genuine successful sign-ins", () => {
  it.each(["email", "dashboard", "magic"])("records one %s login after successful session issuance using only verified identity", async kind => {
    const ctx = context();
    if (kind === "email") await emailOtpRouter.createCaller(ctx).verifyOtp({ email: " VERIFIED@example.test ".trim(), code: "123456" });
    if (kind === "dashboard") await dashboardAuthRouter.createCaller(ctx).verifyOtp({ email: "verified@example.test", code: "123456" });
    if (kind === "magic") await magicLinkRouter.createCaller(ctx).consumeMagicLink({ token: "not-stored" });
    expect(state.persist).toHaveBeenCalledOnce();
    expect(state.persist.mock.calls[0][0]).toEqual({ event: "login", ts: expect.any(String), userId: null, email: "verified@example.test", extra: { method: kind === "email" ? "email_otp" : kind === "dashboard" ? "dashboard_otp" : "legacy_magic_link", activityVersion: 1 } });
    expect(state.cookie.mock.invocationCallOrder[0]).toBeLessThan(state.persist.mock.invocationCallOrder[0]);
  });
  it("records OAuth using the provider account ID association, not a matched email", async () => {
    await oauth();
    expect(state.lookup).toHaveBeenCalledWith("provider-verified-id");
    expect(state.persist).toHaveBeenCalledOnce();
    expect(state.persist.mock.calls[0][0]).toMatchObject({ userId: "17", email: null, extra: { method: "oauth" } });
    expect(JSON.stringify(state.persist.mock.calls)).not.toContain("not-stored");
    expect(state.cookie.mock.invocationCallOrder[0]).toBeLessThan(state.persist.mock.invocationCallOrder[0]);
  });
  it.each(["email", "dashboard", "magic", "oauth"])("does not record failed or already-consumed %s auth", async kind => {
    state.verify.mockResolvedValue({ valid: false, reason: "expired" });
    state.magic.mockResolvedValue(null);
    if (kind === "email") await emailOtpRouter.createCaller(context()).verifyOtp({ email: "verified@example.test", code: "123456" });
    if (kind === "dashboard") await expect(dashboardAuthRouter.createCaller(context()).verifyOtp({ email: "verified@example.test", code: "123456" })).rejects.toThrow();
    if (kind === "magic") await magicLinkRouter.createCaller(context()).consumeMagicLink({ token: "used" });
    if (kind === "oauth") await oauth({});
    expect(state.persist).not.toHaveBeenCalled();
  });
  it("does not record when session establishment fails", async () => {
    state.cookie.mockRejectedValue(new Error("fixture"));
    await expect(emailOtpRouter.createCaller(context()).verifyOtp({ email: "verified@example.test", code: "123456" })).rejects.toThrow();
    expect(state.persist).not.toHaveBeenCalled();
  });
  it("routine me hydration never records a login", async () => {
    await dashboardAuthRouter.createCaller(context()).me();
    expect(state.persist).not.toHaveBeenCalled();
  });
  it.each([{}, { "x-echelon-activity": "denied" }, { "x-echelon-activity": "allowed", dnt: "1" }, { "x-echelon-activity": "allowed", "sec-gpc": "1" }])("privacy preferences fail closed: %j", async headers => {
    await recordLearnerSignIn({ headers }, { email: "verified@example.test" }, "email_otp");
    expect(state.persist).not.toHaveBeenCalled();
  });
  it("OAuth cookie cannot override a server privacy header", async () => {
    await recordLearnerSignIn({ headers: { cookie: "echelon_activity_preference=allowed", dnt: "1" } }, { openId: "verified" }, "oauth");
    expect(state.persist).not.toHaveBeenCalled();
  });
  it("reporting failures never fail an established login", async () => {
    state.persist.mockRejectedValue(new Error("fixture storage unavailable"));
    await expect(emailOtpRouter.createCaller(context()).verifyOtp({ email: "verified@example.test", code: "123456" })).resolves.toMatchObject({ valid: true });
  });
});
