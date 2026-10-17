import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { TrpcContext } from "./_core/context";

const mocks = vi.hoisted(() => ({
  resolve: vi.fn(), getDb: vi.fn(), retrieve: vi.fn(), update: vi.fn(),
}));
vi.mock("./db", () => ({ getDb: mocks.getDb }));
vi.mock("./stripe/stripe", () => ({ stripe: { subscriptions: { retrieve: mocks.retrieve, update: mocks.update } } }));
vi.mock("./teams/resolveManagerOrganization", () => ({
  managerEmailForContext: (ctx: TrpcContext) => ctx.user?.email ?? "",
  resolveManagedOrganization: mocks.resolve,
}));
import { stripeRouter } from "./routers/stripeRouter";

const NOW = new Date("2026-10-17T16:00:00Z");
const context = { user: { id: 1, email: "owner@example.test" }, studentEmail: null, req: { headers: {} }, res: {} } as TrpcContext;
const organization = () => ({
  id: 7, managerEmail: "owner@example.test", status: "active", seatsTotal: 10,
  stripeSubscriptionId: "sub_synthetic", termStart: new Date("2026-01-01Z"),
  termEnd: new Date("2027-01-01Z"),
});
let db: { select: ReturnType<typeof vi.fn>; update: ReturnType<typeof vi.fn>; insert: ReturnType<typeof vi.fn>; delete: ReturnType<typeof vi.fn> };
let used: number;
const caller = () => stripeRouter.createCaller(context);
function noEffects() {
  expect(mocks.retrieve).not.toHaveBeenCalled();
  expect(mocks.update).not.toHaveBeenCalled();
  expect(db.update).not.toHaveBeenCalled();
  expect(db.insert).not.toHaveBeenCalled();
  expect(db.delete).not.toHaveBeenCalled();
}
beforeEach(() => {
  vi.clearAllMocks();
  vi.useFakeTimers();
  vi.setSystemTime(NOW);
  used = 5;
  db = {
    select: vi.fn(() => ({ from: vi.fn(() => ({ where: vi.fn(async () => [{ cnt: used }]) })) })),
    update: vi.fn(), insert: vi.fn(), delete: vi.fn(),
  };
  mocks.getDb.mockResolvedValue(db);
  // The existing resolver module is mocked as a verified-owner resolution.
  // Its broader paid-Flex reporting eligibility must not authorize Annual billing.
  mocks.resolve.mockResolvedValue(organization());
  mocks.retrieve.mockResolvedValue({ items: { data: [{ id: "si_synthetic" }] } });
  mocks.update.mockResolvedValue({});
});
afterEach(() => vi.useRealTimers());

describe("updateTeamSeats Annual term guard", () => {
  it.each([
    ["expired", "active", new Date(NOW.getTime() - 1)],
    ["equal boundary", "active", NOW],
    ["missing term", "active", null],
    ["pending", "pending", new Date("2027-01-01Z")],
    ["cancelled", "cancelled", new Date("2027-01-01Z")],
    ["checkout failed", "checkout_failed", new Date("2027-01-01Z")],
    ["expired past due", "past_due", new Date(NOW.getTime() - 1)],
  ])("rejects %s before any Stripe call, usage query, or DB write", async (_label, status, termEnd) => {
    mocks.resolve.mockResolvedValue({ ...organization(), status, termEnd });
    await expect(caller().updateTeamSeats({ orgId: 7, seats: 15 })).rejects.toMatchObject({ code: "FORBIDDEN" });
    expect(mocks.resolve).toHaveBeenCalledWith(context, { orgId: 7 });
    expect(db.select).not.toHaveBeenCalled();
    noEffects();
  });

  it.each(["active", "past_due"])("preserves current %s increases and proration", async status => {
    mocks.resolve.mockResolvedValue({ ...organization(), status, termEnd: new Date(NOW.getTime() + 1) });
    await expect(caller().updateTeamSeats({ orgId: 7, seats: 15 })).resolves.toEqual({ success: true, seats: 15 });
    expect(db.select).toHaveBeenCalledTimes(1);
    expect(mocks.retrieve).toHaveBeenCalledWith("sub_synthetic");
    expect(mocks.update).toHaveBeenCalledTimes(1);
    expect(mocks.update).toHaveBeenCalledWith("sub_synthetic", {
      items: [{ id: "si_synthetic", quantity: 15 }], proration_behavior: "create_prorations",
    });
    expect(db.update).not.toHaveBeenCalled();
  });

  it("preserves the five-seat minimum", async () => {
    await expect(caller().updateTeamSeats({ seats: 4 })).rejects.toMatchObject({ code: "BAD_REQUEST" });
    noEffects();
  });
  it("preserves named licences used floor", async () => {
    used = 16;
    await expect(caller().updateTeamSeats({ seats: 15 })).rejects.toThrow("already been used this term");
    noEffects();
  });
  it("preserves current-term reduction rejection", async () => {
    await expect(caller().updateTeamSeats({ seats: 8 })).rejects.toThrow("Seat reductions take effect at renewal");
    noEffects();
  });
  it("preserves unchanged quantities without Stripe", async () => {
    await expect(caller().updateTeamSeats({ seats: 10 })).resolves.toEqual({ success: true, seats: 10, unchanged: true });
    noEffects();
  });
  it("preserves missing-subscription rejection", async () => {
    mocks.resolve.mockResolvedValue({ ...organization(), stripeSubscriptionId: null });
    await expect(caller().updateTeamSeats({ seats: 15 })).rejects.toMatchObject({ code: "BAD_REQUEST" });
    noEffects();
  });
});
