import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

/**
 * Leads are money. Emails were being captured in four separate tables and only
 * two of them had any screen at all, so contact enquiries and booked exam dates
 * were collected and never shown to anyone who could act on them.
 *
 * These tests fail if a capture point is added to the schema without being
 * wired into the admin lead view, so the same silent loss cannot happen again.
 */

const adminRouter = readFileSync("server/routers/admin.ts", "utf8");
const adminPage = readFileSync("client/src/pages/Admin.tsx", "utf8");

describe("captured lead visibility", () => {
  it("reads every lead capture table in the unified lead view", () => {
    const procedure = adminRouter.slice(
      adminRouter.indexOf("getLeadCapture: adminProcedure"),
      adminRouter.indexOf("getPurchases: adminProcedure")
    );
    expect(procedure.length).toBeGreaterThan(0);
    for (const table of ["trialEmails", "waitlist", "contactSubmissions", "examDates"]) {
      expect(procedure).toContain(`.from(${table})`);
    }
  });

  it("separates people who already paid from open leads", () => {
    expect(adminRouter).toContain("openLeads");
    expect(adminRouter).toContain("convertedLeads");
  });

  it("only treats kept money as a conversion, and counts team buyers", () => {
    const procedure = adminRouter.slice(
      adminRouter.indexOf("getLeadCapture: adminProcedure"),
      adminRouter.indexOf("getPurchases: adminProcedure")
    );
    // A refunded or zero-amount purchase must not mark a live lead as a
    // customer, or that lead disappears from follow-up and the money is lost.
    expect(procedure).toContain("gt(purchases.amountCAD, 0)");
    expect(procedure).toContain("refundedAt} IS NULL");
    // Team flex orders are real money. A manager who enquired then bought
    // seats must not sit in the open queue forever.
    expect(procedure).toContain("teamFlexOrders.managerEmail");
    expect(procedure).toContain('eq(teamFlexOrders.status, "paid")');
  });

  it("exposes the lead view as its own dashboard tab", () => {
    expect(adminPage).toContain('id: "leads"');
    expect(adminPage).toContain('activeTab === "leads"');
    expect(adminPage).toContain("getLeadCapture.useQuery");
  });

  it("surfaces captured leads on the business overview, not only behind a tab", () => {
    const metrics = adminPage.slice(
      adminPage.indexOf("const operatingMetrics"),
      adminPage.indexOf("const activeSection")
    );
    expect(metrics).toContain("Captured leads");
  });

  it("lets the owner export and copy captured leads", () => {
    const panel = adminPage.slice(
      adminPage.indexOf("── CAPTURED LEADS TAB ──"),
      adminPage.indexOf("── TRIAL EMAILS TAB ──")
    );
    expect(panel).toContain("echelon-captured-leads-");
    expect(panel).toContain("Copy open lead emails");
  });
});
