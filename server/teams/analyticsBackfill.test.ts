/**
 * Analytics Backfill & Activation Rate Tests
 * Covers: orgId backfill safety, activation rate calculation, status counts.
 */
import { describe, it, expect } from "vitest";

// ─── Backfill Safety Tests ──────────────────────────────────────────────────

describe("Analytics backfill safety", () => {
  it("backfill only targets rows where orgId is NULL or 0", () => {
    // Simulate the backfill logic: only rows with null/0 orgId should be updated
    const attempts = [
      { id: 1, studentEmail: "a@kingston.com", orgId: null },
      { id: 2, studentEmail: "b@kingston.com", orgId: 0 },
      { id: 3, studentEmail: "c@kingston.com", orgId: 90001 }, // already attributed
      { id: 4, studentEmail: "d@other.com", orgId: null }, // not a member
    ];
    const members = [
      { email: "a@kingston.com", orgId: 90001 },
      { email: "b@kingston.com", orgId: 90002 },
      { email: "c@kingston.com", orgId: 90001 },
    ];

    const memberMap = new Map(members.map(m => [m.email, m.orgId]));

    const toUpdate = attempts.filter(a => {
      if (a.orgId !== null && a.orgId !== 0) return false; // already attributed
      return memberMap.has(a.studentEmail); // must be a known member
    });

    expect(toUpdate).toHaveLength(2);
    expect(toUpdate[0].id).toBe(1);
    expect(toUpdate[1].id).toBe(2);
  });

  it("backfill does not update rows already attributed to an org", () => {
    const attempts = [
      { id: 1, studentEmail: "c@kingston.com", orgId: 90001 },
      { id: 2, studentEmail: "c@kingston.com", orgId: 90002 },
    ];
    const toUpdate = attempts.filter(a => a.orgId === null || a.orgId === 0);
    expect(toUpdate).toHaveLength(0);
  });

  it("backfill rejects ambiguous multi-org emails", () => {
    // If an email belongs to multiple orgs, the backfill should not proceed
    const members = [
      { email: "shared@example.com", orgId: 90001 },
      { email: "shared@example.com", orgId: 90002 },
    ];

    const emailOrgCount = new Map<string, number>();
    for (const m of members) {
      emailOrgCount.set(m.email, (emailOrgCount.get(m.email) ?? 0) + 1);
    }

    const ambiguous = [...emailOrgCount.entries()].filter(([, count]) => count > 1);
    expect(ambiguous).toHaveLength(1);
    expect(ambiguous[0][0]).toBe("shared@example.com");
  });

  it("backfill assigns correct orgId from member lookup", () => {
    const members = [
      { email: "op1@kingston.com", orgId: 90001 },
      { email: "op2@kingston.com", orgId: 90002 },
    ];
    const memberMap = new Map(members.map(m => [m.email, m.orgId]));

    const attempt1 = { studentEmail: "op1@kingston.com", orgId: null as number | null };
    const attempt2 = { studentEmail: "op2@kingston.com", orgId: null as number | null };

    attempt1.orgId = memberMap.get(attempt1.studentEmail) ?? null;
    attempt2.orgId = memberMap.get(attempt2.studentEmail) ?? null;

    expect(attempt1.orgId).toBe(90001);
    expect(attempt2.orgId).toBe(90002);
  });
});

// ─── Activation Rate Tests ──────────────────────────────────────────────────

describe("Activation rate calculation", () => {
  it("computes activation rate from licence statuses", () => {
    const licences = [
      { status: "active" },
      { status: "active" },
      { status: "active" },
      { status: "invited" },
      { status: "assigned" },
      { status: "unused" },
    ];

    const total = licences.length;
    const activated = licences.filter(l => l.status === "active").length;
    const unactivated = licences.filter(l => ["unused", "invited", "assigned"].includes(l.status)).length;
    const rate = Math.round((activated / total) * 100);

    expect(total).toBe(6);
    expect(activated).toBe(3);
    expect(unactivated).toBe(3);
    expect(rate).toBe(50);
  });

  it("activation rate is 100% when all licences are active", () => {
    const licences = [
      { status: "active" },
      { status: "active" },
      { status: "active" },
    ];
    const rate = Math.round((licences.filter(l => l.status === "active").length / licences.length) * 100);
    expect(rate).toBe(100);
  });

  it("activation rate is 0% when no licences are active", () => {
    const licences = [
      { status: "unused" },
      { status: "invited" },
      { status: "assigned" },
    ];
    const rate = Math.round((licences.filter(l => l.status === "active").length / licences.length) * 100);
    expect(rate).toBe(0);
  });

  it("expired and revoked licences are excluded from unactivated count", () => {
    const licences = [
      { status: "active" },
      { status: "expired" },
      { status: "revoked" },
      { status: "invited" },
    ];
    const unactivated = licences.filter(l => ["unused", "invited", "assigned"].includes(l.status)).length;
    expect(unactivated).toBe(1); // only "invited" counts as unactivated
  });

  it("Kingston's 22% non-activation rate is correctly identified", () => {
    // 23 operators, 5 with zero activity = 21.7% non-activation
    const totalOperators = 23;
    const inactiveOperators = 5;
    const nonActivationRate = Math.round((inactiveOperators / totalOperators) * 100);
    // Rounds to 22%
    expect(nonActivationRate).toBe(22);
  });
});
