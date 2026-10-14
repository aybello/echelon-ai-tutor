import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { consentedTrialEmails, isActionableLead, matchesLeadTriageFilter } from "../shared/adminLeadTriage";

describe("administrator lead triage and consent", () => {
  const newLead = { converted: false, optedOut: false, contactFollowUpStatus: "new" };
  it("includes unpaid new leads in follow-up", () => {
    expect(isActionableLead(newLead)).toBe(true);
    expect(matchesLeadTriageFilter(newLead, "actionable")).toBe(true);
  });
  it("excludes past buyers and opt-outs from the contactable bulk-copy list", () => {
    expect(isActionableLead({ ...newLead, converted: true })).toBe(false);
    expect(isActionableLead({ ...newLead, optedOut: true })).toBe(false);
    expect(matchesLeadTriageFilter({ ...newLead, optedOut: true }, "opted_out")).toBe(true);
  });
  it("respects closed contact inquiries without hiding people from all leads", () => {
    const closed = { ...newLead, contactFollowUpStatus: "closed" };
    expect(isActionableLead(closed)).toBe(false);
    expect(matchesLeadTriageFilter(closed, "all")).toBe(true);
  });
  it("a trial opt-out blocks even duplicate capture rows with consent still set", () => {
    expect(consentedTrialEmails([
      { email: "LEARNER@example.com", optOut: false },
      { email: "learner@example.com", optOut: true },
      { email: "operator@example.com", optOut: false },
      { email: "operator@example.com", optOut: false },
    ])).toEqual(["operator@example.com"]);
  });
  it("still allows contacted but unconverted leads to be reviewed", () => {
    expect(isActionableLead({ ...newLead, contactFollowUpStatus: "contacted" })).toBe(true);
  });
});

describe("admin ledger and captured lead completeness", () => {
  const router = readFileSync("server/routers/admin.ts", "utf8");
  const page = readFileSync("client/src/pages/Admin.tsx", "utf8");
  const leadSection = router.slice(router.indexOf("getLeadCapture: adminProcedure"), router.indexOf("getPurchases: adminProcedure"));
  it("captures abandoned checkouts alongside existing capture points", () => {
    for(const tbl of ["trialEmails","contactSubmissions","examDates","waitlist","abandonedCheckouts"]) {
      expect(leadSection).toContain(".from(" + tbl + ")");
    }
    expect(leadSection).toContain("abandonedCheckout: abandonedRows.length");
    expect(page).toContain("Abandoned checkout");
  });
  it("requires active positive-amount subscription rows for conversion", () => {
    expect(leadSection).toContain("gt(subscriptions.amountCAD, 0)");
    expect(leadSection).toContain('eq(subscriptions.status, "active")');
    expect(leadSection).toContain('eq(teamFlexOrders.status, "paid")');
    expect(leadSection).toContain('eq(organizations.billingType, "stripe")');
    expect(leadSection).toContain("organizations.stripeSubscriptionId} IS NOT NULL");
    expect(leadSection).toContain("refundedAt} IS NULL");
  });
  it("retains contact enquiry text and outreach/opt-out information across touchpoints", () => {
    expect(leadSection).toContain("inquiryMessage");
    expect(leadSection).toContain("inquiryOrganization");
    expect(leadSection).toContain("contactRequestId");
    expect(leadSection).toContain("existing.optedOut = existing.optedOut");
    expect(leadSection).toContain("existing.converted = existing.converted || Boolean(lead.recoveredAt)");
    expect(leadSection).toContain("followUpStage");
    expect(page).toContain("isActionableLead");
    expect(page).toContain("Read contact message");
  });
  it("exposes team orders in Sales without double-counting them as individual purchases", () => {
    const panel = page.slice(page.indexOf("{/* -- REVENUE TAB -- */}"), page.indexOf("{/* -- SUBSCRIPTIONS TAB -- */}"));
    expect(panel).toContain("Team Flex orders");
    expect(panel).toContain("revenueBreakdown.teamFlexAlreadyCountedCAD");
    expect(panel).toContain("Do not sum");
    expect(panel).toContain('order.status === "paid"');
    expect(panel).not.toContain("totalRevenueCAD + businessQ");
  });
  it("updates only contact inquiry statuses through admin authorization", () => {
    expect(router).toContain("setContactFollowUpStatus: adminProcedure");
    expect(router).toContain('status: z.enum(["new", "contacted", "closed"])');
    expect(page).toContain("markContactFollowUp.mutate");
  });
});
