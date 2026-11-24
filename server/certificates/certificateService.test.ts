import { describe, expect, it, vi } from "vitest";
import { createInMemoryDb, type InMemoryDb } from "./inMemoryDb";

const NOW = new Date(Date.UTC(2026, 10, 24));
const daysFromNow = (days: number): Date =>
  new Date(NOW.getTime() + days * 24 * 60 * 60 * 1000);

let currentDb: InMemoryDb;

vi.mock("../db", () => ({
  getDb: async () => currentDb.db,
}));

// Imported after the mock so the service picks up the mocked getDb.
import {
  createCertificate,
  deleteCertificate,
  getCertificateSummaryForOrg,
  importCertificates,
  listCertificatesForOperator,
  listCertificatesForOrg,
  renewCertificate,
  updateCertificate,
} from "./certificateService";

function seedDb(overrides: Partial<InMemoryDb["rows"]> = {}): InMemoryDb {
  currentDb = createInMemoryDb({
    users: [
      { id: 1, email: "ava@quintewest.ca", name: "Ava Chen" },
      { id: 2, email: "ben@quintewest.ca", name: "Ben Ortiz" },
    ],
    organizations: [
      { id: 1, name: "City of Quinte West", managerEmail: "amy@quintewest.ca" },
      { id: 2, name: "City of Kingston", managerEmail: "phil@kingston.ca" },
    ],
    organizationMembers: [
      {
        id: 1,
        orgId: 1,
        email: "ava@quintewest.ca",
        name: "Ava Chen",
        role: "operator",
        status: "assigned",
      },
      {
        id: 2,
        orgId: 1,
        email: "ben@quintewest.ca",
        name: "Ben Ortiz",
        role: "operator",
        status: "assigned",
      },
      {
        id: 3,
        orgId: 1,
        email: "amy@quintewest.ca",
        name: "Amy Russell",
        role: "manager",
        status: "assigned",
      },
      {
        id: 4,
        orgId: 2,
        email: "ava@quintewest.ca",
        name: "Ava Chen",
        role: "operator",
        status: "assigned",
      },
    ],
    certificates: [],
    certificateAlerts: [],
    ...overrides,
  });
  return currentDb;
}

describe("createCertificate + listCertificatesForOrg", () => {
  it("links the operator account and sorts by soonest expiry with the 90-day band", async () => {
    seedDb();
    await createCertificate(1, 10, {
      operatorName: "Ava Chen",
      operatorEmail: "ava@quintewest.ca",
      certificateType: "class-1-water-treatment",
      certificateNumber: "ON-1001",
      expiresAt: daysFromNow(45),
    });
    await createCertificate(1, 10, {
      operatorName: "Ben Ortiz",
      certificateType: "class-2-water-distribution",
      certificateNumber: "ON-1002",
      expiresAt: daysFromNow(10),
    });

    const rows = await listCertificatesForOrg(1, NOW);
    expect(rows).toHaveLength(2);
    // Soonest expiry first.
    expect(rows[0].operatorName).toBe("Ben Ortiz");
    expect(rows[0].statusBand).toBe("within30");
    // The 45-day certificate sits in the 90-day band.
    expect(rows[1].operatorName).toBe("Ava Chen");
    expect(rows[1].statusBand).toBe("within90");
    expect(rows[1].operatorUserId).toBe(1);
    expect(rows[1].certificateLabel).toBe("Class 1 Water Treatment");
    expect(rows[1].courseKey).toBe("class1-water");
  });

  it("does not return another organization's certificates", async () => {
    seedDb({
      certificates: [
        {
          id: 1,
          organizationId: 2,
          operatorName: "Ava Chen",
          certificateType: "oit",
          certificateNumber: "ON-9",
          expiresAt: daysFromNow(20),
          createdAt: NOW,
          updatedAt: NOW,
        },
      ],
    });
    expect(await listCertificatesForOrg(1, NOW)).toHaveLength(0);
    expect(await listCertificatesForOrg(2, NOW)).toHaveLength(1);
  });
});

describe("update / renew / delete scoping", () => {
  const certRow = {
    id: 1,
    organizationId: 1,
    operatorUserId: 1,
    operatorName: "Ava Chen",
    certificateType: "class-1-water-treatment",
    certificateNumber: "ON-1001",
    issuedAt: null,
    expiresAt: daysFromNow(45),
    createdByUserId: 10,
    createdAt: NOW,
    updatedAt: NOW,
    version: 1,
  };

  it("refuses to update or delete a certificate from another organization", async () => {
    seedDb({ certificates: [{ ...certRow }] });
    expect(
      await updateCertificate(2, 1, {
        expectedVersion: 1,
        certificateNumber: "CHANGED",
      })
    ).toBeNull();
    expect(await deleteCertificate(2, 1, 1)).toBe(false);
    expect(await listCertificatesForOrg(1, NOW)).toHaveLength(1);
  });

  it("updates within the org and renews with the matching course link", async () => {
    seedDb({ certificates: [{ ...certRow }] });
    const updated = await updateCertificate(1, 1, {
      expectedVersion: 1,
      certificateNumber: "ON-1001-R",
    });
    expect(updated?.certificateNumber).toBe("ON-1001-R");

    const renewed = await renewCertificate(1, 1, {
      expectedVersion: 2,
      expiresAt: daysFromNow(1000),
    });
    expect(renewed?.statusBand).toBe("current");
    expect(renewed?.courseKey).toBe("class1-water");
    expect(renewed?.coursePath).toBe("/class1-water");

    expect(await deleteCertificate(1, 1, 3)).toBe(true);
    expect(await listCertificatesForOrg(1, NOW)).toHaveLength(0);
  });
});

describe("getCertificateSummaryForOrg", () => {
  it("summarizes the register", async () => {
    seedDb({
      certificates: [
        {
          id: 1,
          organizationId: 1,
          operatorUserId: 1,
          operatorName: "Ava Chen",
          certificateType: "oit",
          certificateNumber: "ON-1",
          expiresAt: daysFromNow(10),
          createdAt: NOW,
          updatedAt: NOW,
        },
        {
          id: 2,
          organizationId: 1,
          operatorUserId: 1,
          operatorName: "Ava Chen",
          certificateType: "class-1-water-treatment",
          certificateNumber: "ON-2",
          expiresAt: daysFromNow(45),
          createdAt: NOW,
          updatedAt: NOW,
        },
        {
          id: 3,
          organizationId: 1,
          operatorUserId: 2,
          operatorName: "Ben Ortiz",
          certificateType: "class-2-water-distribution",
          certificateNumber: "ON-3",
          expiresAt: daysFromNow(-2),
          createdAt: NOW,
          updatedAt: NOW,
        },
      ],
    });
    expect(await getCertificateSummaryForOrg(1, NOW)).toEqual({
      operatorsTracked: 2,
      expiringWithin90: 2,
      expiringWithin30: 1,
      expired: 1,
    });
  });
});

describe("importCertificates", () => {
  it("imports 8 of 10 rows and reports the 2 failures", async () => {
    seedDb();
    const mapping = {
      operatorName: 0,
      certificateType: 1,
      certificateNumber: 2,
      expiresAt: 3,
    };
    const lines = [
      "Operator,Certificate Type,Number,Expiry",
      "Ava Chen,Class 1 Water Treatment,ON-1001,2027-03-31",
      "Ben Ortiz,Class 2 Water Distribution and Supply,ON-1002,2027-04-15",
      "Cara Singh,OIT,ON-1003,2027-01-10",
      "Dan Roy,Class 3 Wastewater Treatment,ON-1004,04/22/2027",
      "Eli Ford,Water Quality Analyst,ON-1005,2027-05-01",
      "Fay Lin,Class 4 Wastewater Collection,ON-1006,2027-06-30",
      "Gus Hart,Class 1 Wastewater Treatment,ON-1007,2027-02-28",
      "Hal Ives,Class 2 Water Treatment,ON-1008,2027-08-15",
      "Ivy May,Underwater Basket Weaving,ON-1009,2027-03-31",
      "Jay Fox,Class 1 Water Treatment,ON-1010,not-a-date",
    ];
    const result = await importCertificates(1, 10, lines.join("\n"), mapping);
    expect(result.imported).toBe(8);
    expect(result.failures).toHaveLength(2);
    expect(result.failures[0].rowNumber).toBe(10);
    expect(result.failures[1].rowNumber).toBe(11);

    const rows = await listCertificatesForOrg(1, NOW);
    expect(rows).toHaveLength(8);
    const ava = rows.find(r => r.operatorName === "Ava Chen");
    expect(ava?.operatorUserId).toBe(1); // linked to the roster account
  });
});

describe("listCertificatesForOperator", () => {
  it("returns explicitly linked or same-user certificates, never roster-name matches or another org's", async () => {
    seedDb({
      certificates: [
        {
          id: 1,
          organizationId: 1,
          operatorUserId: 1,
          operatorName: "Ava Chen",
          certificateType: "oit",
          certificateNumber: "ON-1",
          expiresAt: daysFromNow(20),
          createdAt: NOW,
          updatedAt: NOW,
        },
        {
          id: 2,
          organizationId: 1,
          operatorUserId: null,
          operatorName: "Ava Chen",
          certificateType: "class-1-water-treatment",
          certificateNumber: "ON-2",
          expiresAt: daysFromNow(40),
          createdAt: NOW,
          updatedAt: NOW,
        },
        // Same name, an organization Ava is not a member of — never hers.
        {
          id: 3,
          organizationId: 3,
          operatorUserId: null,
          operatorName: "Ava Chen",
          certificateType: "oit",
          certificateNumber: "ON-3",
          expiresAt: daysFromNow(15),
          createdAt: NOW,
          updatedAt: NOW,
        },
        {
          id: 4,
          organizationId: 1,
          operatorUserId: 2,
          operatorName: "Ben Ortiz",
          certificateType: "oit",
          certificateNumber: "ON-4",
          expiresAt: daysFromNow(15),
          createdAt: NOW,
          updatedAt: NOW,
        },
      ],
    });
    const rows = await listCertificatesForOperator(1, "ava@quintewest.ca", NOW);
    expect(rows.map(r => r.id)).toEqual([1]);
  });
});
