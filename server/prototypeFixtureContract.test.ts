import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

/**
 * The UI prototype renders the real Admin page against hand-written fixtures.
 * When a new dashboard metric is added to the server contract but not to the
 * fixture, the page throws on an undefined read and the prototype browser test
 * fails in the quality gate rather than locally, which costs a full gate cycle
 * to discover.
 *
 * This guard catches the drift in the fast unit suite instead. It checks the
 * fields the Admin page reads from the KPI payload, so adding a metric without
 * updating the fixture fails here first.
 */

const repoRoot = process.cwd();
const adminPage = readFileSync(join(repoRoot, "client/src/pages/Admin.tsx"), "utf8");
const fixtures = readFileSync(join(repoRoot, "prototypes/ui-ux-preview/fixtures.ts"), "utf8");

/** Every `kpisQ.data.<group>.<field>` the Admin page reads. */
function readKpiFieldsUsedByAdmin(): Map<string, Set<string>> {
  const used = new Map<string, Set<string>>();
  const pattern = /kpisQ\.data\.([a-zA-Z]+)\.([a-zA-Z]+)/g;
  let match: RegExpExecArray | null;
  while ((match = pattern.exec(adminPage)) !== null) {
    const [, group, field] = match;
    if (!used.has(group)) used.set(group, new Set());
    used.get(group)!.add(field);
  }
  return used;
}

/** The fixture block returned for the KPI query. */
function readKpiFixtureBlock(): string {
  const start = fixtures.indexOf('case "admin.getProductKpis"');
  expect(start).toBeGreaterThan(-1);
  const end = fixtures.indexOf('case "admin.getPurchases"', start);
  return fixtures.slice(start, end === -1 ? undefined : end);
}

describe("prototype admin fixture matches the live dashboard contract", () => {
  it("provides every KPI field the Admin page reads", () => {
    const used = readKpiFieldsUsedByAdmin();
    const fixture = readKpiFixtureBlock();

    expect(used.size).toBeGreaterThan(0);

    const missing: string[] = [];
    for (const [group, fields] of used) {
      if (!fixture.includes(`${group}:`)) {
        missing.push(`${group} (whole group)`);
        continue;
      }
      for (const field of fields) {
        if (!fixture.includes(`${field}:`)) missing.push(`${group}.${field}`);
      }
    }

    expect(
      missing,
      `The UI prototype fixture is missing dashboard fields. Add them to ` +
        `prototypes/ui-ux-preview/fixtures.ts or the prototype browser test ` +
        `will fail in the quality gate: ${missing.join(", ")}`,
    ).toEqual([]);
  });

  it("covers the team pipeline metrics that surfaced the unpaid order leak", () => {
    const fixture = readKpiFixtureBlock();
    expect(fixture).toContain("teamPipeline");
    expect(fixture).toContain("ordersAwaitingPayment");
    expect(fixture).toContain("valueAwaitingPaymentCAD");
  });
});
