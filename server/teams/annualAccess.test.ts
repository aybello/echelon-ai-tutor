import { beforeEach, describe, expect, it, vi } from "vitest";
import { MySqlDialect } from "drizzle-orm/mysql-core";
import { getDb } from "../db";
import { resolveTeamAccess } from "./resolveTeamAccess";

vi.mock("../db", () => ({ getDb: vi.fn() }));

describe("annual team assignment access", () => {
  const future = new Date(Date.now() + 86400000);
  let member: { orgId: number; courseKey: string | null; courseKeys: string | null; status: string };
  let org: { name: string; status: string; termEnd: Date | null };
  let predicates: unknown[][];
  beforeEach(() => {
    member = { orgId: 1, courseKey: "wpi-class4-water-coll", courseKeys: null, status: "assigned" };
    org = { name: "Test utility", status: "active", termEnd: future };
    predicates = [];
    let calls = 0;
    vi.mocked(getDb).mockResolvedValue({ select: () => ({ from: () => ({ where: (condition: any) => {
      predicates.push(new MySqlDialect().sqlToQuery(condition).params);
      return calls++ === 0 ? Promise.resolve([member]) : { limit: async () => [org] };
    } }) }) } as any);
  });
  it("queries assigned seats and grants only their canonical course", async () => {
    const result = await resolveTeamAccess(null, "Operator@Example.test", "wpi-class4-wastewater-coll");
    expect(result.hasAccess).toBe(true);
    expect(result.grants[0].courseKey).toBe("wpi-class4-water-coll");
    expect(predicates[0]).toEqual(["operator@example.test", "assigned"]);
  });
  it("respects multi-course assignments", async () => {
    member.courseKey = null;
    member.courseKeys = JSON.stringify(["oit", "wpi-class4-water-coll"]);
    expect((await resolveTeamAccess(null, "operator@example.test", "oit")).hasAccess).toBe(true);
  });
  it.each(["revoked", "active"])("does not grant a %s seat", async status => {
    member.status = status;
    expect((await resolveTeamAccess(null, "operator@example.test", "wpi-class4-water-coll")).hasAccess).toBe(false);
  });
  it.each([null, "{bad-json}", "[]"])("does not expand a missing assignment with %s", async courseKeys => {
    member.courseKey = null; member.courseKeys = courseKeys;
    expect((await resolveTeamAccess(null, "operator@example.test", "oit")).hasAccess).toBe(false);
  });
  it.each([null, new Date(0)])("rejects an absent or expired term", async termEnd => {
    org.termEnd = termEnd;
    expect((await resolveTeamAccess(null, "operator@example.test", "wpi-class4-water-coll")).hasAccess).toBe(false);
  });
  it("denies Team Annual access at the exact organization term boundary", async () => {
    vi.useFakeTimers();
    try {
      const cutoff = new Date("2027-09-21T14:30:00.000Z");
      vi.setSystemTime(cutoff);
      org.termEnd = cutoff;
      expect((await resolveTeamAccess(null, "operator@example.test", "wpi-class4-water-coll")).hasAccess).toBe(false);
    } finally {
      vi.useRealTimers();
    }
  });
  it("rejects an inactive organization", async () => {
    org.status = "cancelled";
    expect((await resolveTeamAccess(null, "operator@example.test", "wpi-class4-water-coll")).hasAccess).toBe(false);
  });
  it("does not grant a different course", async () => {
    expect((await resolveTeamAccess(null, "operator@example.test", "oit")).hasAccess).toBe(false);
  });
});
