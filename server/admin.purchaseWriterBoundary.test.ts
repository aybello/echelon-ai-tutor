import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const source = readFileSync(new URL("./routers/admin.ts", import.meta.url), "utf8");
const procedureStart = source.indexOf("backfillContactInfo: adminProcedure");
const procedureEnd = source.indexOf("/** Paginated list of user feedback", procedureStart);
const backfillProcedure = source.slice(procedureStart, procedureEnd);

describe("admin purchase writer boundary", () => {
  it("keeps contact backfill read-only for Individual Pass purchase rows", () => {
    expect(procedureStart).toBeGreaterThanOrEqual(0);
    expect(procedureEnd).toBeGreaterThan(procedureStart);
    expect(backfillProcedure).not.toContain(".update(purchases)");
    expect(backfillProcedure).toContain("purchaseContactReviews.push");
  });
});
