import { afterEach, describe, expect, it, vi } from "vitest";

const { getDb, trackEvent } = vi.hoisted(() => ({
  getDb: vi.fn(),
  trackEvent: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("../db", () => ({ getDb }));
vi.mock("../analytics", () => ({ trackEvent }));
vi.mock("../email", () => ({ sendCoursePassInvitationEmail: vi.fn() }));

import { activateFlexLicence } from "./flexLicenceService";
import { resolveFlexEmailState } from "../_core/access";

/** Emulate MySQL TIMESTAMP(0)'s default fractional-second rounding. */
function databaseTimestamp(date: Date): Date {
  return new Date(Math.round(date.getTime() / 1000) * 1000);
}

function activationDatabase() {
  let row: Record<string, any> = {
    id: 42,
    organizationId: 7,
    courseKey: "class4-ww",
    invitedEmail: "operator@example.test",
    operatorUserId: null,
    status: "assigned",
    termMonths: 12,
    activationDeadline: new Date("2027-10-02T00:00:00Z"),
  };
  const set = vi.fn((values: Record<string, any>) => ({
    where: vi.fn(async () => {
      row = { ...row, ...Object.fromEntries(Object.entries(values).map(([key, value]) => [
        key, value instanceof Date ? databaseTimestamp(value) : value,
      ])) };
      return [{ affectedRows: 1 }];
    }),
  }));
  const db = {
    select: vi.fn(() => ({ from: vi.fn(() => ({ where: vi.fn(() => ({
      limit: vi.fn(async () => [{ ...row }]),
    })) })) })),
    update: vi.fn(() => ({ set })),
  };
  getDb.mockResolvedValue(db);
  return { db, set, row: () => row };
}

afterEach(() => {
  vi.useRealTimers();
  vi.clearAllMocks();
});

describe("Course Pass activation at database timestamp precision", () => {
  it.each([0, 499, 500, 750, 999])("grants immediate access at %ims without a future start", async milliseconds => {
    const now = new Date("2026-10-02T07:19:54.000Z");
    now.setUTCMilliseconds(milliseconds);
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(now);
    const fixture = activationDatabase();

    const activated = await activateFlexLicence(42, "operator@example.test", null);
    expect(activated.startsAt.getTime()).toBeLessThanOrEqual(now.getTime());
    expect(activated.startsAt.getUTCMilliseconds()).toBe(0);
    expect(activated.accessEndsAt.toISOString()).toBe("2027-10-02T07:19:54.000Z");
    expect(activated.reportingEndsAt.toISOString()).toBe("2027-11-01T07:19:54.000Z");
    expect(resolveFlexEmailState([fixture.row() as any], now)).toEqual({
      identityEligible: true,
      activeCourseKeys: ["class4-ww"],
    });

    const repeated = await activateFlexLicence(42, "operator@example.test", null);
    expect(repeated).toEqual(activated);
    expect(fixture.set).toHaveBeenCalledTimes(1);
  });
});
