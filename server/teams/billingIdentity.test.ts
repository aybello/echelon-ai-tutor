import { beforeEach, describe, expect, it, vi } from "vitest";
import { MySqlDialect } from "drizzle-orm/mysql-core";
import { getDb } from "../db";
import { hasRecoverableTeamBilling } from "./billingIdentity";
vi.mock("../db", () => ({ getDb: vi.fn() }));

let rows: Array<{ status: string; stripeCustomerId: string | null }>;
let params: unknown[];
beforeEach(() => {
  rows = [];
  params = [];
  vi.mocked(getDb).mockResolvedValue({ select: () => ({ from: () => ({ where: (condition: any) => {
    params = new MySqlDialect().sqlToQuery(condition).params;
    return Promise.resolve(rows);
  } }) }) } as any);
});

describe("billing-owner OTP eligibility is independent of current learner access", () => {
  it.each(["active", "past_due", "cancelled", "expired"])("recognizes an existing %s billing customer", async status => {
    rows = [{ status, stripeCustomerId: "cus_synthetic_billing_owner" }];
    expect(await hasRecoverableTeamBilling(" LAPSED-MANAGER@EXAMPLE.TEST ")).toBe(true);
    expect(params).toEqual(["lapsed-manager@example.test"]);
  });
  it.each([
    { status: "pending", stripeCustomerId: "cus_synthetic_pending" },
    { status: "checkout_failed", stripeCustomerId: "cus_synthetic_failed" },
    { status: "cancelled", stripeCustomerId: null },
  ])("does not treat an uncompleted billing account as recoverable: %j", async row => {
    rows = [row];
    expect(await hasRecoverableTeamBilling("unknown@example.test")).toBe(false);
  });
  it("does not authorize an unknown email", async () => {
    expect(await hasRecoverableTeamBilling("unknown@example.test")).toBe(false);
  });
  it("fails closed if persistence is unavailable", async () => {
    vi.mocked(getDb).mockResolvedValue(null);
    expect(await hasRecoverableTeamBilling("lapsed@example.test")).toBe(false);
  });
});
