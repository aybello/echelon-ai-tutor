import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

/**
 * The admin dashboard once reported all business-to-business revenue as zero.
 * Nothing threw and no test failed. Team flex orders simply lived in their own
 * table, and the revenue total only ever read purchases and subscriptions, so
 * real money was invisible because a table was forgotten.
 *
 * This test exists so that failure mode cannot repeat silently. Add a table
 * that stores a paid amount and this fails until that money is either counted
 * in the dashboard total or recorded here as deliberately not revenue.
 */

const schema = readFileSync("drizzle/schema.ts", "utf8");
const router = readFileSync("server/routers/admin.ts", "utf8");

const statsSection = (() => {
  const start = router.indexOf("stats: adminProcedure");
  expect(start, "admin stats procedure not found").toBeGreaterThan(-1);
  const after = router.indexOf("adminProcedure", start + 200);
  return router.slice(start, after > start ? after : undefined);
})();

/** Tables whose paid amounts must reach the dashboard revenue total. */
const REVENUE_TABLES = ["purchases", "subscriptions", "teamFlexOrders"];

/**
 * Tables that carry a money column but are deliberately NOT revenue.
 * Every entry needs a reason, so excluding money stays a conscious decision.
 */
const NOT_REVENUE: Record<string, string> = {
  abandonedCheckouts:
    "Never paid. This is demand, not revenue, and is reported separately as recoverable pipeline.",
  customerRecoveryImportItems:
    "Staging rows for reconciling payments that already exist elsewhere. Counting them would double count the purchase they describe, which is how a legacy recovery backfill once inflated the figures.",
  teamFlexExtensions:
    "Per-seat price on an extension of an existing team order. The money is recorded on the parent team flex order, which is already counted.",
};

/** Any column that looks like it stores money. */
const MONEY_COLUMN = /\b\w*(amountCAD|amountCents|subtotalCents|totalBeforeTaxCents|priceCents|totalCents)\b/;

function tablesWithMoneyColumns(): string[] {
  const found: string[] = [];
  const declaration = /export const (\w+) = mysqlTable\(/g;
  const starts: { name: string; index: number }[] = [];
  let match: RegExpExecArray | null;
  while ((match = declaration.exec(schema)) !== null) {
    starts.push({ name: match[1], index: match.index });
  }
  for (let i = 0; i < starts.length; i += 1) {
    // Bound each table by the next declaration. Scanning to the next "});"
    // leaks into neighbouring tables and reports money that is not there.
    const end = i + 1 < starts.length ? starts[i + 1].index : schema.length;
    const body = schema.slice(starts[i].index, end);
    if (MONEY_COLUMN.test(body)) found.push(starts[i].name);
  }
  return found;
}

describe("revenue reporting completeness", () => {
  it("reads every table that is treated as revenue", () => {
    for (const table of REVENUE_TABLES) {
      expect(
        statsSection.includes(table),
        `${table} holds money but the admin stats procedure never reads it. ` +
          `That is exactly how team revenue reported as zero.`
      ).toBe(true);
    }
  });

  it("detects the money tables that exist today", () => {
    // Guards the detector itself. If this list shrinks unexpectedly, the
    // completeness check below would pass while actually checking nothing.
    const detected = tablesWithMoneyColumns();
    for (const table of [...REVENUE_TABLES, "abandonedCheckouts"]) {
      expect(detected, `detector missed ${table}`).toContain(table);
    }
  });

  it("forces a decision when a new table starts storing a paid amount", () => {
    const unaccounted = tablesWithMoneyColumns().filter(
      table => !REVENUE_TABLES.includes(table) && !(table in NOT_REVENUE)
    );

    expect(
      unaccounted,
      `These tables store a money amount but are neither counted as revenue ` +
        `nor listed as deliberately excluded. Add each to REVENUE_TABLES and ` +
        `the stats procedure, or to NOT_REVENUE with a reason: ` +
        unaccounted.join(", ")
    ).toEqual([]);
  });

  it("keeps deduplication on the total so one payment is never counted twice", () => {
    // Two flex payments were once double recorded by a recovery backfill.
    // Naive addition would have overstated the reported total.
    expect(statsSection).toContain("stripePaymentCore");
    expect(statsSection).toContain("revenueBreakdown");
  });
});
