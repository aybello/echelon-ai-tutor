import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  RECOVERY_DELAY_HOURS,
  RECOVERY_STATUS,
  RECOVERY_WINDOW_DAYS,
  isContactableManager,
  shouldRecover,
} from "./jobs/abandonedTeamOrders";
import { buildOrderSummary } from "./abandonedTeamOrderEmail";

/**
 * Team orders are worth multiples of an individual pass, so losing one
 * silently is the single most expensive failure in the funnel. These tests
 * protect both halves of the fix: the recovery that reaches the manager, and
 * the organization reuse that stops one utility fragmenting into many.
 */

describe("abandoned team order recovery", () => {
  it("never contacts internal, owner or placeholder addresses", () => {
    expect(isContactableManager("test@example.com")).toBe(false);
    expect(isContactableManager("probe@echelon.test")).toBe(false);
    expect(isContactableManager("abello@echeloninstitute.ca")).toBe(false);
    expect(isContactableManager("test@winnipeg.ca")).toBe(false);
  });

  it("contacts a real municipal manager", () => {
    expect(isContactableManager("bhull@winnipeg.ca")).toBe(true);
    expect(isContactableManager("wwd-education-training@winnipeg.ca")).toBe(true);
  });

  it("rejects anything that is not an address", () => {
    expect(isContactableManager("")).toBe(false);
    expect(isContactableManager("not-an-email")).toBe(false);
  });

  it("does not chase a manager who already paid for the same course", () => {
    // A municipal buyer often retries checkout before one attempt succeeds.
    // The leftover pending rows are retry artefacts, not lost sales.
    expect(
      shouldRecover({
        managerEmail: "bhull@winnipeg.ca",
        paidOrderCourseKeys: ["wpi-class4-water-coll"],
        orderCourseKeys: ["wpi-class4-water-coll"],
      }),
    ).toBe(false);
  });

  it("still chases a different course from the same manager", () => {
    expect(
      shouldRecover({
        managerEmail: "bhull@winnipeg.ca",
        paidOrderCourseKeys: ["wpi-class4-water-coll"],
        orderCourseKeys: ["wpi-class4-wastewater"],
      }),
    ).toBe(true);
  });

  it("chases a manager who never paid for anything", () => {
    expect(
      shouldRecover({
        managerEmail: "wwd-education-training@winnipeg.ca",
        paidOrderCourseKeys: [],
        orderCourseKeys: ["wpi-class4-water-coll"],
      }),
    ).toBe(true);
  });

  it("waits before reaching out so a slow payment is not interrupted", () => {
    expect(RECOVERY_DELAY_HOURS).toBeGreaterThanOrEqual(1);
    expect(RECOVERY_DELAY_HOURS).toBeLessThanOrEqual(24);
  });

  it("stops chasing once the lead is cold", () => {
    expect(RECOVERY_WINDOW_DAYS).toBeGreaterThan(0);
    expect(RECOVERY_WINDOW_DAYS).toBeLessThanOrEqual(30);
  });

  it("uses a dedicated status so no order is emailed twice", () => {
    expect(RECOVERY_STATUS).toBe("recovery_sent");
    expect(RECOVERY_STATUS).not.toBe("pending");
    expect(RECOVERY_STATUS).not.toBe("paid");
  });

  it("marks the order only after the email is sent", () => {
    // A delivery failure must leave the row pending so the next run retries,
    // rather than silently discarding the lead.
    const source = readFileSync(join(process.cwd(), "server/jobs/abandonedTeamOrders.ts"), "utf8");
    const sendIndex = source.indexOf("sendAbandonedTeamOrderEmail(");
    const markIndex = source.indexOf("RECOVERY_STATUS })");
    expect(sendIndex).toBeGreaterThan(-1);
    expect(markIndex).toBeGreaterThan(sendIndex);
  });

  it("only picks up unpaid orders", () => {
    const source = readFileSync(join(process.cwd(), "server/jobs/abandonedTeamOrders.ts"), "utf8");
    expect(source).toContain('eq(teamFlexOrders.status, "pending")');
    expect(source).toContain("isNull(teamFlexOrders.paidAt)");
  });
});

describe("recovery email content", () => {
  it("names a single course order plainly", () => {
    expect(buildOrderSummary({ totalLicences: 1, courseNames: ["Class 4 Water Collection"] }))
      .toBe("1 licence for Class 4 Water Collection");
  });

  it("pluralises multiple licences", () => {
    expect(buildOrderSummary({ totalLicences: 5, courseNames: ["Class 1 Water Treatment"] }))
      .toBe("5 licences for Class 1 Water Treatment");
  });

  it("joins several courses readably", () => {
    expect(
      buildOrderSummary({ totalLicences: 3, courseNames: ["Class 1 Water", "Class 2 Water", "WQA"] }),
    ).toBe("3 licences across Class 1 Water, Class 2 Water and WQA");
  });

  it("survives an order with no resolvable course name", () => {
    expect(buildOrderSummary({ totalLicences: 2, courseNames: [] })).toBe("2 licences");
  });

  it("offers procurement help rather than a discount", () => {
    // Discounting a municipal buyer who is blocked by a purchase order solves
    // the wrong problem and cheapens the product.
    const source = readFileSync(join(process.cwd(), "server/abandonedTeamOrderEmail.ts"), "utf8");
    expect(source).toContain("purchase order");
    expect(source).toContain("invoice");
    expect(source.toLowerCase()).not.toContain("% off");
    expect(source.toLowerCase()).not.toContain("coupon");
    expect(source.toLowerCase()).not.toContain("discount code");
  });

  it("routes replies to a human", () => {
    const source = readFileSync(join(process.cwd(), "server/abandonedTeamOrderEmail.ts"), "utf8");
    expect(source).toContain("replyTo");
  });

  it("escapes organization names so a quote cannot break the email", () => {
    const source = readFileSync(join(process.cwd(), "server/abandonedTeamOrderEmail.ts"), "utf8");
    expect(source).toContain("escapeHtml");
  });

  it("uses no em dashes in learner-facing copy", () => {
    const source = readFileSync(join(process.cwd(), "server/abandonedTeamOrderEmail.ts"), "utf8");
    const textBody = source.slice(source.indexOf("const textBody"), source.indexOf("const transporter"));
    expect(textBody).not.toContain("\u2014");
  });
});

describe("organization reuse on retry", () => {
  it("reuses the manager's own provisional organization instead of creating another", () => {
    // Live data had one utility split across six organization rows because
    // every abandoned checkout created a new one.
    const source = readFileSync(join(process.cwd(), "server/routers/teamFlexRouter.ts"), "utf8");
    const reuseIndex = source.indexOf("const [reusable]");
    const insertIndex = source.indexOf("buildProvisionalCoursePassOrganization(");
    expect(reuseIndex).toBeGreaterThan(-1);
    expect(reuseIndex).toBeLessThan(insertIndex);
  });

  it("only reuses an unpaid, access-free organization owned by the same manager", () => {
    const source = readFileSync(join(process.cwd(), "server/routers/teamFlexRouter.ts"), "utf8");
    const block = source.slice(source.indexOf("const [reusable]"), source.indexOf("if (reusable)"));
    expect(block).toContain("eq(organizations.managerEmail, managerEmail)");
    expect(block).toContain('eq(organizations.status, "pending")');
    expect(block).toContain("eq(organizations.seatsTotal, 0)");
    expect(block).toContain("eq(organizations.province, input.province)");
  });

  it("never reuses an organization the manager does not own", () => {
    const source = readFileSync(join(process.cwd(), "server/routers/teamFlexRouter.ts"), "utf8");
    const block = source.slice(source.indexOf("const [reusable]"), source.indexOf("if (reusable)"));
    // Matching on organization name alone would let anyone attach an order to
    // a real paying employer by typing its name.
    expect(block).not.toContain("organizations.name");
  });
});
