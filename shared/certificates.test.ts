import { describe, expect, it } from "vitest";
import {
  courseKeyForCertificateType,
  daysUntilExpiry,
  dueAlertThreshold,
  parseCertificateDate,
  parseCsv,
  resolveCertificateType,
  statusBandForDays,
  statusBandForExpiry,
  summarizeCertificates,
  validateCertificateCsv,
} from "./certificates";

const NOW = new Date(Date.UTC(2026, 10, 24)); // 2026-11-24 UTC

function daysFromNow(days: number): Date {
  return new Date(NOW.getTime() + days * 24 * 60 * 60 * 1000);
}

describe("daysUntilExpiry and status bands", () => {
  it("computes whole UTC days until expiry", () => {
    expect(daysUntilExpiry(daysFromNow(45), NOW)).toBe(45);
    expect(daysUntilExpiry(daysFromNow(0), NOW)).toBe(0);
    expect(daysUntilExpiry(daysFromNow(-3), NOW)).toBe(-3);
  });

  it("puts a certificate expiring in 45 days in the 90-day band", () => {
    expect(statusBandForExpiry(daysFromNow(45), NOW)).toBe("within90");
  });

  it("assigns band boundaries exactly", () => {
    expect(statusBandForDays(-1)).toBe("expired");
    expect(statusBandForDays(0)).toBe("within30");
    expect(statusBandForDays(30)).toBe("within30");
    expect(statusBandForDays(31)).toBe("within90");
    expect(statusBandForDays(90)).toBe("within90");
    expect(statusBandForDays(91)).toBe("current");
  });
});

describe("dueAlertThreshold", () => {
  it("fires only on threshold days", () => {
    expect(dueAlertThreshold(90)).toBe(90);
    expect(dueAlertThreshold(60)).toBe(60);
    expect(dueAlertThreshold(30)).toBe(30);
    expect(dueAlertThreshold(7)).toBe(7);
    expect(dueAlertThreshold(0)).toBe(0);
    expect(dueAlertThreshold(45)).toBeNull();
    expect(dueAlertThreshold(89)).toBeNull();
    expect(dueAlertThreshold(-1)).toBeNull();
  });
});

describe("parseCertificateDate", () => {
  it("rejects impossible calendar dates and accepts leap day and bounded timestamps", () => {
    expect(parseCertificateDate("2026-02-30")).toBeNull();
    expect(parseCertificateDate("2026-02-31T00:00:00Z")).toBeNull();
    expect(parseCertificateDate("2024-02-29")?.toISOString()).toBe(
      "2024-02-29T00:00:00.000Z"
    );
    expect(parseCertificateDate("2038-01-19T03:14:07Z")?.toISOString()).toBe(
      "2038-01-19T03:14:07.000Z"
    );
  });
});

describe("resolveCertificateType", () => {
  it("resolves keys, labels, course keys, and short forms", () => {
    expect(resolveCertificateType("class-2-water-treatment")).toBe(
      "class-2-water-treatment"
    );
    expect(resolveCertificateType("Class 2 Water Treatment")).toBe(
      "class-2-water-treatment"
    );
    expect(resolveCertificateType("Class 4 Wastewater Collection")).toBe(
      "class-4-wastewater-collection"
    );
    expect(resolveCertificateType("class3-water-dist")).toBe(
      "class-3-water-distribution"
    );
    expect(resolveCertificateType("class1-wastewater")).toBe(
      "class-1-wastewater-treatment"
    );
    expect(resolveCertificateType("class4-wastewater")).toBe(
      "class-4-wastewater-treatment"
    );
    expect(resolveCertificateType("OIT")).toBe("oit");
    expect(resolveCertificateType("Operator-in-Training (OIT)")).toBe("oit");
    expect(resolveCertificateType("WQA")).toBe("water-quality-analyst");
    expect(resolveCertificateType("Water Quality Analyst")).toBe(
      "water-quality-analyst"
    );
    expect(resolveCertificateType("Underwater Basket Weaving")).toBeNull();
  });

  it("maps every certificate type to its renewal course", () => {
    expect(courseKeyForCertificateType("oit")).toBe("oit");
    expect(courseKeyForCertificateType("class-1-water-treatment")).toBe(
      "class1-water"
    );
    expect(courseKeyForCertificateType("class-2-water-distribution")).toBe(
      "class2-water-dist"
    );
    expect(courseKeyForCertificateType("class-1-wastewater-treatment")).toBe(
      "class1-ww"
    );
    expect(courseKeyForCertificateType("class-2-wastewater-treatment")).toBe(
      "class2-ww"
    );
    expect(courseKeyForCertificateType("class-3-wastewater-treatment")).toBe(
      "class3-ww"
    );
    expect(courseKeyForCertificateType("class-4-wastewater-treatment")).toBe(
      "class4-ww"
    );
    expect(courseKeyForCertificateType("class-4-wastewater-collection")).toBe(
      "class4-wastewater-coll"
    );
    expect(courseKeyForCertificateType("water-quality-analyst")).toBe("wqa");
  });
});

describe("summarizeCertificates", () => {
  it("counts distinct operators and each band", () => {
    const summary = summarizeCertificates(
      [
        { operatorKey: "user:1", expiresAt: daysFromNow(10) },
        { operatorKey: "user:1", expiresAt: daysFromNow(45) },
        { operatorKey: "user:2", expiresAt: daysFromNow(-2) },
        { operatorKey: "name:pat", expiresAt: daysFromNow(200) },
      ],
      NOW
    );
    expect(summary).toEqual({
      operatorsTracked: 3,
      expiringWithin90: 2,
      expiringWithin30: 1,
      expired: 1,
    });
  });
});

describe("parseCsv", () => {
  it("handles quoted fields with commas and CRLF", () => {
    expect(parseCsv('a,b\r\n"Smith, Jane",x\r\n')).toEqual([
      ["a", "b"],
      ["Smith, Jane", "x"],
    ]);
  });

  it("rejects quotes in unquoted fields and trailing data after a quote", () => {
    expect(() => parseCsv('a,AB"12"\n')).toThrow(
      /quote inside an unquoted field/
    );
    expect(() => parseCsv('a,"AB"12\n')).toThrow(/after a closing quote/);
    expect(parseCsv('a,"Smith ""The Boss""\nLine",x')).toEqual([
      ["a", 'Smith "The Boss"\nLine', "x"],
    ]);
  });
});

describe("validateCertificateCsv", () => {
  const mapping = {
    operatorName: 0,
    certificateType: 1,
    certificateNumber: 2,
    expiresAt: 3,
  };

  it("imports 8 of 10 rows and reports the 2 failures with reasons", () => {
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
    const { validRows, failures } = validateCertificateCsv(
      lines.join("\n"),
      mapping
    );
    expect(validRows).toHaveLength(8);
    expect(failures).toHaveLength(2);
    expect(failures[0].rowNumber).toBe(10);
    expect(failures[0].reason).toContain("Unrecognized certificate type");
    expect(failures[1].rowNumber).toBe(11);
    expect(failures[1].reason).toContain("Unparseable expiry date");
    expect(validRows[0]).toMatchObject({
      operatorName: "Ava Chen",
      certificateType: "class-1-water-treatment",
      certificateNumber: "ON-1001",
    });
    expect(validRows[3].expiresAt.toISOString()).toBe(
      "2027-04-22T00:00:00.000Z"
    );
  });

  it("reports missing values instead of dropping rows", () => {
    const csv = [
      "Operator,Type,Number,Expiry",
      ",Class 1 Water Treatment,ON-1,2027-01-01",
      "Kay,Class 1 Water Treatment,,2027-01-01",
    ].join("\n");
    const { validRows, failures } = validateCertificateCsv(csv, mapping);
    expect(validRows).toHaveLength(0);
    expect(failures.map(f => f.reason)).toEqual([
      "Missing operator name.",
      "Missing certificate number.",
    ]);
  });
});
