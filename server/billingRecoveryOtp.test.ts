import { beforeEach, describe, expect, it, vi } from "vitest";
import type { TrpcContext } from "./_core/context";
const state = vi.hoisted(() => ({ billingOwner: false, sendMail: vi.fn(), insert: vi.fn(), cookie: vi.fn(), token: vi.fn() }));
vi.mock("./db", () => ({ getDb: async () => ({
  delete: () => ({ where: async () => undefined }),
  insert: () => ({ values: state.insert }),
}) }));
vi.mock("./teams/billingIdentity", () => ({ hasRecoverableTeamBilling: async () => state.billingOwner }));
vi.mock("./_core/access", () => ({ normalizeEmail: (value: string) => value.trim().toLowerCase(), resolveEntitlementsByEmail: async () => ({
  hasAnyAccess: false, isManager: false, unlockedExamTypes: [], purchasedProductKeys: [], activeSubscriptionRows: [], sources: [],
}) }));
vi.mock("nodemailer", () => ({ default: { createTransport: () => ({ sendMail: state.sendMail }) } }));
vi.mock("./routers/trainingRouter", () => ({ hasTrainingRecord: async () => false }));
vi.mock("./_core/emailSession", () => ({ issueVerifiedEmailSessionCookie: state.cookie, readVerifiedEmailFromRequest: vi.fn(), ECHELON_SESSION_COOKIE: "synthetic" }));
vi.mock("./_core/subscriptionToken", () => ({ issueSubscriptionToken: state.token }));
vi.mock("./auth/atomicVerification", () => ({ verifyAndConsumeOtp: async () => ({ valid: true }) }));
import { dashboardAuthRouter } from "./routers/dashboardAuthRouter";
function caller() { return dashboardAuthRouter.createCaller({ user: null, studentEmail: null, req: { headers: {} }, res: { cookie: vi.fn() } } as unknown as TrpcContext); }
beforeEach(() => { vi.clearAllMocks(); state.billingOwner = false; });
describe("legacy dashboard OTP billing recovery", () => {
  it("allows a lapsed billing owner to request OTP without live course access", async () => {
    state.billingOwner = true;
    expect(await caller().sendOtp({ email: "lapsed@example.test" })).toEqual({ sent: true });
    expect(state.sendMail).toHaveBeenCalledOnce();
    expect(state.insert).toHaveBeenCalledOnce();
  });
  it("retains the same neutral response but sends nothing for an unknown email", async () => {
    expect(await caller().sendOtp({ email: "unknown@example.test" })).toEqual({ sent: true });
    expect(state.sendMail).not.toHaveBeenCalled();
    expect(state.insert).not.toHaveBeenCalled();
  });
  it("after valid OTP restores identity but never an expired learner token", async () => {
    state.billingOwner = true;
    expect(await caller().verifyOtp({ email: "lapsed@example.test", code: "123456" })).toMatchObject({ success: true, accessToken: null, unlockedExamTypes: [] });
    expect(state.cookie).toHaveBeenCalledOnce();
    expect(state.token).not.toHaveBeenCalled();
  });
});
