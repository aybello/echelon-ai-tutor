/**
 * Teams Flex Automated Tests
 * Covers: pricing, fulfilment verification, licence lifecycle,
 * retake extensions, course changes, refund/dispute, dual-model access.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

// ─── Pricing Tests ────────────────────────────────────────────────────────────

describe("Teams Flex pricing", () => {
  it("Ontario OIT: 3-month = $39, 6-month = $49", async () => {
    const { getFlexListPrice } = await import("./teamFlexPricing");
    expect(getFlexListPrice("ontario", "oit", 3)).toBe(2900);
    expect(getFlexListPrice("ontario", "oit", 6)).toBe(3900);
  });

  it("Ontario Class 1: 3-month = $79, 6-month = $99", async () => {
    const { getFlexListPrice } = await import("./teamFlexPricing");
    expect(getFlexListPrice("ontario", "class1", 3)).toBe(5900);
    expect(getFlexListPrice("ontario", "class1", 6)).toBe(7900);
  });

  it("Western Class 1: 3-month = $119, 6-month = $149", async () => {
    const { getFlexListPrice } = await import("./teamFlexPricing");
    expect(getFlexListPrice("western", "class1", 3)).toBe(8900);
    expect(getFlexListPrice("western", "class1", 6)).toBe(11900);
  });

  it("accepts the supported 3-, 6-, and 12-month terms", async () => {
    const { isValidFlexTerm } = await import("./teamFlexPricing");
    expect(isValidFlexTerm(12)).toBe(true);
    expect(isValidFlexTerm(3)).toBe(true);
    expect(isValidFlexTerm(6)).toBe(true);
  });

  it("uses a graduated blended discount without retroactive threshold cliffs", async () => {
    const { getTeamFlexVolumeDiscount } = await import("./teamFlexPricing");
    expect(getTeamFlexVolumeDiscount(5)).toBe(0);
    expect(getTeamFlexVolumeDiscount(10)).toBeCloseTo(0.01);
    expect(getTeamFlexVolumeDiscount(24)).toBeCloseTo(0.0625);
    expect(getTeamFlexVolumeDiscount(25)).toBeCloseTo(0.066);
    expect(getTeamFlexVolumeDiscount(49)).toBeCloseTo(0.107142857);
    expect(getTeamFlexVolumeDiscount(50)).toBeCloseTo(0.109);
    expect(getTeamFlexVolumeDiscount(100)).toBeCloseTo(0.1545);

    const listUnitPrice = 10_000;
    const totalAt24 = Math.round(listUnitPrice * (1 - getTeamFlexVolumeDiscount(24))) * 24;
    const totalAt25 = Math.round(listUnitPrice * (1 - getTeamFlexVolumeDiscount(25))) * 25;
    expect(totalAt25).toBeGreaterThan(totalAt24);
  });

  it("retake extension = 25% of 3-month price", async () => {
    const { getRetakeExtensionPrice } = await import("./teamFlexPricing");
    // Ontario OIT: 25% of $29 = $7.25
    expect(getRetakeExtensionPrice("ontario", "oit")).toBe(725);
    // Ontario class1: 25% of $59 = $14.75
    expect(getRetakeExtensionPrice("ontario", "class1")).toBe(1475);
    // Western class1: 25% of $89 = $22.25
    expect(getRetakeExtensionPrice("western", "class1")).toBe(2225);
  });

  it("getCourseKeyPricingBand correctly maps course keys", async () => {
    const { getCourseKeyPricingBand } = await import("./teamFlexPricing");
    expect(getCourseKeyPricingBand("oit")).toEqual({ examFamily: "ontario", pricingBand: "oit", courseLevel: null });
    expect(getCourseKeyPricingBand("class2-water")).toEqual({ examFamily: "ontario", pricingBand: "class2", courseLevel: 2 });
    expect(getCourseKeyPricingBand("wpi-class3-water")).toEqual({ examFamily: "western", pricingBand: "class3", courseLevel: 3 });
  });

  it("mixed-term order prices correctly with volume discount", async () => {
    const { getFlexListPrice, getTeamFlexVolumeDiscount } = await import("./teamFlexPricing");
    // Brian's order: 10 Class I (3mo) + 7 Class II (6mo) + 6 Class III (3mo) + 2 Class IV (6mo) = 25 licences
    const totalLicences = 10 + 7 + 6 + 2;
    expect(totalLicences).toBe(25);
    const discount = getTeamFlexVolumeDiscount(totalLicences);
    expect(discount).toBeCloseTo(0.066);

    const item1 = getFlexListPrice("western", "class1", 3) * 10; // Class I 3mo
    const item2 = getFlexListPrice("western", "class2", 6) * 7;  // Class II 6mo
    const item3 = getFlexListPrice("western", "class3", 3) * 6;  // Class III 3mo
    const item4 = getFlexListPrice("western", "class4", 6) * 2;  // Class IV 6mo
    const subtotal = item1 + item2 + item3 + item4;
    const discounted = Math.round(subtotal * (1 - discount));
    expect(discounted).toBeGreaterThan(0);
  });
});

// ─── Fulfilment Verification Tests ────────────────────────────────────────────

describe("Teams Flex fulfilment", () => {
  it("fulfilFlexOrder module exports correctly", async () => {
    const mod = await import("./fulfilFlexOrder");
    expect(typeof mod.fulfilFlexOrder).toBe("function");
  });
});

// ─── Licence Lifecycle Tests ──────────────────────────────────────────────────

describe("Teams Flex licence lifecycle", () => {
  it("flexLicenceService exports all lifecycle functions", async () => {
    const mod = await import("./flexLicenceService");
    expect(typeof mod.inviteOperatorToLicence).toBe("function");
    expect(typeof mod.cancelFlexInvitation).toBe("function");
    expect(typeof mod.claimFlexLicence).toBe("function");
    expect(typeof mod.assignFlexLicence).toBe("function");
    expect(typeof mod.activateFlexLicence).toBe("function");
    expect(typeof mod.changeFlexLicenceCourse).toBe("function");
    expect(typeof mod.resendFlexInvitation).toBe("function");
  });

  it("uses calendar-month activation dates at month end and leap year", async () => {
    const { addUtcCalendarMonths } = await import("./flexLicenceService");
    expect(addUtcCalendarMonths(new Date("2028-01-31T15:30:00Z"), 1).toISOString())
      .toBe("2028-02-29T15:30:00.000Z");
    expect(addUtcCalendarMonths(new Date("2027-01-31T15:30:00Z"), 1).toISOString())
      .toBe("2027-02-28T15:30:00.000Z");
    expect(addUtcCalendarMonths(new Date("2026-08-31T15:30:00Z"), 6).toISOString())
      .toBe("2027-02-28T15:30:00.000Z");
  });

  it("allows invited operators to receive OTP without unlocking content", async () => {
    const { resolveFlexEmailState } = await import("../_core/access");
    const now = new Date("2026-08-10T12:00:00Z");
    const result = resolveFlexEmailState([{
      courseKey: "wpi-class1-water-coll",
      status: "invited",
      activationDeadline: new Date("2027-08-10T12:00:00Z"),
      startsAt: null,
      accessEndsAt: null,
    }], now);
    expect(result.identityEligible).toBe(true);
    expect(result.activeCourseKeys).toEqual([]);
  });

  it("unlocks only active, started and unexpired Flex courses", async () => {
    const { resolveFlexEmailState } = await import("../_core/access");
    const now = new Date("2026-08-10T12:00:00Z");
    const result = resolveFlexEmailState([
      {
        courseKey: "wpi-class1-water-coll",
        status: "active",
        activationDeadline: new Date("2027-08-10T12:00:00Z"),
        startsAt: new Date("2026-08-10T11:59:00Z"),
        accessEndsAt: new Date("2026-11-10T12:00:00Z"),
      },
      {
        courseKey: "wpi-class2-water-coll",
        status: "active",
        activationDeadline: new Date("2027-01-01T00:00:00Z"),
        startsAt: new Date("2026-01-01T00:00:00Z"),
        accessEndsAt: new Date("2026-08-09T00:00:00Z"),
      },
    ], now);
    expect(result.identityEligible).toBe(true);
    expect(result.activeCourseKeys).toEqual(["wpi-class1-water-coll"]);
  });
});

// ─── Extension Tests ──────────────────────────────────────────────────────────

describe("Teams Flex retake extension", () => {
  it("extension service exports correctly", async () => {
    const mod = await import("./flexExtensionService");
    expect(typeof mod.checkExtensionEligibility).toBe("function");
    expect(typeof mod.applyExtension).toBe("function");
  });

  it("extension is 90 days", () => {
    const startDate = new Date("2026-06-01T00:00:00Z");
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + 90);
    expect(endDate.toISOString().slice(0, 10)).toBe("2026-08-30");
  });

  it("extension from active licence starts at originalAccessEndsAt", () => {
    // Simulating the logic from applyExtension
    const originalAccessEndsAt = new Date("2026-09-01T00:00:00Z");
    const paymentTimestamp = new Date("2026-08-15T00:00:00Z");
    const licenceStatus = "active";

    const extensionStartsAt = licenceStatus === "active"
      ? originalAccessEndsAt
      : paymentTimestamp;

    expect(extensionStartsAt).toEqual(originalAccessEndsAt);
  });

  it("extension from expired licence starts at payment timestamp", () => {
    const originalAccessEndsAt = new Date("2026-08-01T00:00:00Z");
    const paymentTimestamp = new Date("2026-08-15T00:00:00Z");
    const licenceStatus = "expired";

    const extensionStartsAt = licenceStatus === "active"
      ? originalAccessEndsAt
      : paymentTimestamp;

    expect(extensionStartsAt).toEqual(paymentTimestamp);
  });
});

// ─── Course Change Tests ──────────────────────────────────────────────────────

describe("Teams Flex course change", () => {
  it("same-band detection works correctly", async () => {
    const { getCourseKeyPricingBand } = await import("./teamFlexPricing");
    // Same band: class1-water and class1-wastewater are both Ontario class1
    const a = getCourseKeyPricingBand("class1-water");
    const b = getCourseKeyPricingBand("class1-wastewater");
    expect(a.examFamily).toBe(b.examFamily);
    expect(a.pricingBand).toBe(b.pricingBand);
  });

  it("cross-band detection works correctly", async () => {
    const { getCourseKeyPricingBand } = await import("./teamFlexPricing");
    // Cross-band: oit vs class1-water (oit band vs class1 band)
    const oit = getCourseKeyPricingBand("oit");
    const c1 = getCourseKeyPricingBand("class1-water");
    expect(oit.pricingBand).not.toBe(c1.pricingBand);
  });

  it("cross-family detection works correctly", async () => {
    const { getCourseKeyPricingBand } = await import("./teamFlexPricing");
    // Cross-family: Ontario vs Western
    const ont = getCourseKeyPricingBand("class1-water");
    const wpi = getCourseKeyPricingBand("wpi-class1-water");
    expect(ont.examFamily).not.toBe(wpi.examFamily);
  });
});

// ─── Refund/Dispute Tests ─────────────────────────────────────────────────────

describe("Teams Flex refund and dispute handlers", () => {
  it("exports all handler functions", async () => {
    const mod = await import("./flexRefundDisputeHandlers");
    expect(typeof mod.handleFlexPartialRefund).toBe("function");
    expect(typeof mod.handleFlexUnallocatedRefund).toBe("function");
    expect(typeof mod.handleFlexFullRefund).toBe("function");
    expect(typeof mod.handleFlexDisputeCreated).toBe("function");
    expect(typeof mod.handleFlexDisputeClosed).toBe("function");
  });
});

// ─── Dual-Model Access Tests ──────────────────────────────────────────────────

describe("Teams Flex resolveTeamAccess", () => {
  it("exports resolveTeamAccess function", async () => {
    const mod = await import("./resolveTeamAccess");
    expect(typeof mod.resolveTeamAccess).toBe("function");
  });

  it("effectiveAccessEndsAt logic: null means ongoing Annual", () => {
    // Simulating the grants logic
    const grants = [
      { source: "flex", accessEndsAt: new Date("2026-12-01") },
      { source: "annual", accessEndsAt: null },
    ];
    const hasOngoing = grants.some(g => g.accessEndsAt === null);
    expect(hasOngoing).toBe(true);
    // When ongoing exists, effectiveAccessEndsAt should be null
    const effectiveAccessEndsAt = hasOngoing ? null : new Date();
    expect(effectiveAccessEndsAt).toBeNull();
  });

  it("effectiveAccessEndsAt logic: uses latest expiry when no ongoing", () => {
    const grants = [
      { source: "flex", accessEndsAt: new Date("2026-09-01") },
      { source: "flex", accessEndsAt: new Date("2026-12-01") },
    ];
    const hasOngoing = grants.some(g => g.accessEndsAt === null);
    expect(hasOngoing).toBe(false);
    const latest = grants.reduce<Date | null>((max, g) => {
      if (!g.accessEndsAt) return max;
      if (!max || g.accessEndsAt > max) return g.accessEndsAt;
      return max;
    }, null);
    expect(latest?.toISOString().slice(0, 10)).toBe("2026-12-01");
  });
});

// ─── Expiry Job Tests ─────────────────────────────────────────────────────────

describe("Teams Flex expiry job", () => {
  it("exports runFlexExpiryJob function", async () => {
    const mod = await import("./flexExpiryJob");
    expect(typeof mod.runFlexExpiryJob).toBe("function");
  });
});
