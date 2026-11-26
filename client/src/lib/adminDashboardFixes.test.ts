import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const adminSource = readFileSync(new URL("../pages/Admin.tsx", import.meta.url), "utf8");
const routerSource = readFileSync(new URL("../../../server/routers/admin.ts", import.meta.url), "utf8");

describe("Admin dashboard fix contracts", () => {
  it("keeps contact maintenance outcomes separate and purchase writes read-only", () => {
    expect(adminSource).toContain("Purchase records needing review:");
    expect(adminSource).toContain("No purchase records were written.");
    const backfill = routerSource.slice(routerSource.indexOf("backfillContactInfo: adminProcedure"), routerSource.indexOf("/** Paginated list of user feedback"));
    expect(backfill).toContain("purchaseContactReviews");
    expect(backfill).not.toContain(".update(purchases)");
  });

  it("requests and renders bounded recovery pagination with status filtering", () => {
    expect(adminSource).toContain("limit: 25, page: recoveryPage");
    expect(adminSource).toContain('reviewStatus: recoveryStatus === "all" ? undefined : recoveryStatus');
    expect(adminSource).toContain("recoveryEvidenceQ.data.items.map");
    expect(adminSource).toContain('htmlFor="recovery-review-status"');
    expect(routerSource).toContain(".offset((input.page - 1) * input.limit)");
    expect(routerSource).toContain("totalPages: Math.max(1");
  });

  it("exposes local query and mutation failure feedback", () => {
    expect(adminSource).toContain("errorsQ.isError");
    expect(adminSource).toContain("errorsQ.refetch()");
    expect(adminSource).toContain("dismissErrorMessage");
    expect(adminSource).toContain("The report could not be dismissed:");
  });

  it("routes central refresh to the displayed child views", () => {
    expect(adminSource).toContain("utils.featureRequests.list.invalidate()");
    expect(adminSource).toContain("utils.admin.gameActivity.invalidate()");
  });

  it("waits for clipboard writes and exposes accessible long values", () => {
    expect(adminSource).toContain("await navigator.clipboard.writeText(email)");
    expect(adminSource).toContain("await navigator.clipboard.writeText(emails.join(\"\\n\"))");
    expect(adminSource).toContain("View full value");
    expect(adminSource).not.toContain("title={fullValue}");
  });

  it("distinguishes an empty individual-purchase table from other sales", () => {
    expect(adminSource).toContain("No individual purchases are recorded yet.");
    expect(adminSource).toContain("Team orders and subscriptions are reported separately above.");
  });
});
