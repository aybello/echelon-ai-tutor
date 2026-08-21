/**
 * Tests for updateTeamSeats seat floor validation.
 * Verifies that seat reductions below licencesUsedThisTerm or current seatsTotal are rejected.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

vi.mock("./db", () => ({ getDb: vi.fn() }));

import { getDb } from "./db";

// Minimal org row
const ORG = {
  id: 1,
  name: "Test Org",
  seatsTotal: 10,
  stripeSubscriptionId: "sub_test_abc",
  termStart: new Date("2026-01-01"),
  termEnd: new Date("2027-01-01"),
  status: "active",
};

function makeDb(opts: {
  managerOrgId?: number | null;
  org?: typeof ORG | null;
  licencesUsed?: number;
} = {}) {
  const { managerOrgId = 1, org = ORG, licencesUsed = 5 } = opts;
  let call = 0;
  const db: any = {
    select: vi.fn().mockImplementation(() => ({
      from: vi.fn().mockImplementation(() => ({
        where: vi.fn().mockImplementation(() => ({
          limit: vi.fn().mockImplementation(() => ({
            then: (fn: (r: any[]) => any) => {
              call++;
              if (call === 1) return Promise.resolve(fn(managerOrgId ? [{ orgId: managerOrgId }] : []));
              if (call === 2) return Promise.resolve(fn(org ? [org] : []));
              return Promise.resolve(fn([]));
            },
          })),
          then: (fn: (r: any[]) => any) => {
            call++;
            if (call === 3) return Promise.resolve(fn([{ cnt: licencesUsed }]));
            return Promise.resolve(fn([]));
          },
        })),
      })),
    })),
    update: vi.fn().mockReturnValue({ set: vi.fn().mockReturnValue({ where: vi.fn().mockResolvedValue([]) }) }),
  };
  return db;
}

function makeCtx(email = "manager@example.com"): TrpcContext {
  return {
    user: { id: 1, email, openId: "x", name: "M", loginMethod: "manus", role: "user", createdAt: new Date(), updatedAt: new Date(), lastSignedIn: new Date(), phone: null, province: null },
    studentEmail: null,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };
}

describe("updateTeamSeats — seat floor validation", () => {
  beforeEach(() => vi.clearAllMocks());

  it("rejects a reduction below licencesUsedThisTerm", async () => {
    vi.mocked(getDb).mockResolvedValue(makeDb({ licencesUsed: 8 }));
    const caller = appRouter.createCaller(makeCtx());
    await expect(caller.stripe.updateTeamSeats({ seats: 7 })).rejects.toThrow(
      "already been used this term"
    );
  });

  it("rejects any reduction below current seatsTotal even if above licencesUsed", async () => {
    vi.mocked(getDb).mockResolvedValue(makeDb({ licencesUsed: 3 })); // seatsTotal=10, licencesUsed=3
    const caller = appRouter.createCaller(makeCtx());
    await expect(caller.stripe.updateTeamSeats({ seats: 8 })).rejects.toThrow(
      "Seat reductions take effect at renewal"
    );
  });

  it("returns unchanged=true when seats equals current seatsTotal", async () => {
    vi.mocked(getDb).mockResolvedValue(makeDb({ licencesUsed: 5 }));
    const caller = appRouter.createCaller(makeCtx());
    const result = await caller.stripe.updateTeamSeats({ seats: 10 }); // matches seatsTotal
    expect(result.unchanged).toBe(true);
  });

  it("throws UNAUTHORIZED when no manager account is found", async () => {
    vi.mocked(getDb).mockResolvedValue(makeDb({ managerOrgId: null }));
    const caller = appRouter.createCaller(makeCtx());
    await expect(caller.stripe.updateTeamSeats({ seats: 15 })).rejects.toThrow(
      "No manager account found"
    );
  });

  it("throws INTERNAL_SERVER_ERROR when DB is unavailable", async () => {
    vi.mocked(getDb).mockResolvedValue(null);
    const caller = appRouter.createCaller(makeCtx());
    await expect(caller.stripe.updateTeamSeats({ seats: 15 })).rejects.toThrow(
      "Database unavailable"
    );
  });
});
