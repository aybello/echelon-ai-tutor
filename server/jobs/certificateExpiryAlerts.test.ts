import { describe, expect, it, vi } from "vitest";
import { createInMemoryDb, type InMemoryDb } from "../certificates/inMemoryDb";

const DAY_MS = 24 * 60 * 60 * 1000;
const now = new Date();
const utcMidnight = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
const inDays = (days: number): Date => new Date(utcMidnight + days * DAY_MS);

let currentDb: InMemoryDb;

vi.mock("../db", () => ({
  getDb: async () => currentDb.db,
}));

const { sendCertificateExpiryEmail } = vi.hoisted(() => ({
  sendCertificateExpiryEmail: vi.fn(async (_payload: unknown) => undefined),
}));
vi.mock("../email", () => ({
  sendCertificateExpiryEmail,
}));

// Imported after the mocks so the job picks them up.
import { runCertificateExpiryAlerts } from "./certificateExpiryAlerts";

function seedDb(): InMemoryDb {
  const certDExpires = inDays(7);
  currentDb = createInMemoryDb({
    users: [
      { id: 1, email: "ava@quintewest.ca", name: "Ava Chen" },
      { id: 2, email: "ben@quintewest.ca", name: "Ben Ortiz" },
    ],
    organizations: [{ id: 1, name: "City of Quinte West", managerEmail: "amy@quintewest.ca" }],
    organizationMembers: [
      { id: 1, orgId: 1, email: "amy@quintewest.ca", name: "Amy Russell", role: "manager", status: "assigned" },
      { id: 2, orgId: 1, email: "ava@quintewest.ca", name: "Ava Chen", role: "operator", status: "assigned" },
      { id: 3, orgId: 1, email: "ben@quintewest.ca", name: "Ben Ortiz", role: "operator", status: "assigned" },
    ],
    certificates: [
      // A: exactly 30 days out — threshold day. Manager + operator alerted.
      { id: 1, organizationId: 1, operatorUserId: 1, operatorName: "Ava Chen", certificateType: "class-1-water-treatment", certificateNumber: "ON-1001", issuedAt: null, expiresAt: inDays(30), createdByUserId: 10, createdAt: now, updatedAt: now },
      // B: 45 days out — not a threshold day, no alert.
      { id: 2, organizationId: 1, operatorUserId: 2, operatorName: "Ben Ortiz", certificateType: "oit", certificateNumber: "ON-1002", issuedAt: null, expiresAt: inDays(45), createdByUserId: 10, createdAt: now, updatedAt: now },
      // C: expires today — threshold 0. Operator has no account or roster match, managers only.
      { id: 3, organizationId: 1, operatorUserId: null, operatorName: "Ned Noaccount", certificateType: "class-2-water-distribution", certificateNumber: "ON-1003", issuedAt: null, expiresAt: inDays(0), createdByUserId: 10, createdAt: now, updatedAt: now },
      // D: 7 days out — manager already alerted (logged), operator not yet.
      { id: 4, organizationId: 1, operatorUserId: 1, operatorName: "Ava Chen", certificateType: "class-3-wastewater-treatment", certificateNumber: "ON-1004", issuedAt: null, expiresAt: certDExpires, createdByUserId: 10, createdAt: now, updatedAt: now },
    ],
    certificateAlerts: [
      { id: 1, certificateId: 4, thresholdDays: 7, expiresAt: certDExpires, recipientUserId: null, recipientEmail: "amy@quintewest.ca", sentAt: now },
      // C's manager alert previously failed after the exact threshold day.
      // The job must retry the original threshold key, not wait for today to
      // match the threshold again.
      { id: 2, certificateId: 3, thresholdDays: 0, expiresAt: inDays(0), recipientUserId: null, recipientEmail: "amy@quintewest.ca", status: "failed", lastError: "temporary SMTP error", sentAt: null },
    ],
  });
  return currentDb;
}

describe("runCertificateExpiryAlerts", () => {
  it("selects exactly the certificates crossing a threshold today and logs every send", async () => {
    const fake = seedDb();
    sendCertificateExpiryEmail.mockClear();

    const result = await runCertificateExpiryAlerts();
    expect(result.errors).toEqual([]);
    expect(result.considered).toBe(3); // A, C, D — not B (45 days)
    expect(result.sent).toBe(4);

    const calls = sendCertificateExpiryEmail.mock.calls.map(([payload]) => payload as unknown as { email: string; thresholdDays: number; certificateNumber: string });
    const byCert = new Map<string, Array<{ email: string; thresholdDays: number }>>();
    for (const call of calls) {
      const list = byCert.get(call.certificateNumber) ?? [];
      list.push({ email: call.email, thresholdDays: call.thresholdDays });
      byCert.set(call.certificateNumber, list);
    }
    expect(byCert.get("ON-1001")).toEqual([
      { email: "amy@quintewest.ca", thresholdDays: 30 },
      { email: "ava@quintewest.ca", thresholdDays: 30 },
    ]);
    expect(byCert.get("ON-1003")).toEqual([{ email: "amy@quintewest.ca", thresholdDays: 0 }]);
    // D: the manager was already logged, so only the operator is emailed.
    expect(byCert.get("ON-1004")).toEqual([{ email: "ava@quintewest.ca", thresholdDays: 7 }]);
    expect(byCert.has("ON-1002")).toBe(false);

    // The failed C row is reclaimed in place. Three new rows are inserted,
    // while D's pre-seeded sent row remains unchanged.
    expect(fake.rows.certificateAlerts).toHaveLength(5);
    expect(fake.rows.certificateAlerts.find(row => row.id === 2)?.status).toBe("sent");
  });

  it("sends nothing on a re-run the same day (alert log prevents duplicates)", async () => {
    seedDb();
    sendCertificateExpiryEmail.mockClear();

    const first = await runCertificateExpiryAlerts();
    expect(first.sent).toBe(4);
    sendCertificateExpiryEmail.mockClear();

    const second = await runCertificateExpiryAlerts();
    expect(second.errors).toEqual([]);
    expect(second.sent).toBe(0);
    expect(sendCertificateExpiryEmail).not.toHaveBeenCalled();
  });
});
