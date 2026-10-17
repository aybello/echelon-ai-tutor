import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createRequire } from "node:module";
import { getTableColumns } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql-proxy";
import { subscriptions } from "../drizzle/schema";
import { stripeRouter } from "./routers/stripeRouter";
import { getDb } from "./db";
import type { TrpcContext } from "./_core/context";
import { getAllSubscriptionExamTypes } from "./stripe/subscriptionProducts";

vi.mock("./db", () => ({ getDb: vi.fn() }));
// No payment client or network is needed for these read-only procedures.
vi.mock("./stripe/stripe", () => ({ stripe: {} }));

const { DatabaseSync } = createRequire(import.meta.url)("node:sqlite") as typeof import("node:sqlite");
const EMAIL = "learner@example.test";
const NOW = new Date("2040-01-01T00:00:00Z");
let sqlite: InstanceType<typeof DatabaseSync>;
let nextId: number;

function addRow(overrides: Record<string, unknown> = {}) {
  const id = nextId++;
  const row = {
    id, email: EMAIL, tier: "class1", province: "ontario", orgId: null,
    stripeSubscriptionId: `personal-${id}`, status: "active",
    currentPeriodStart: "2039-12-01 00:00:00.000",
    currentPeriodEnd: "2041-01-01 00:00:00.000",
    createdAt: "2039-12-01 00:00:00.000", updatedAt: "2039-12-01 00:00:00.000",
    ...overrides,
  };
  sqlite.prepare(`INSERT INTO subscriptions (${Object.keys(row).map(k => `\`${k}\``).join(",")}) VALUES (${Object.keys(row).map(() => "?").join(",")})`)
    .run(...Object.values(row) as (string | number | null)[]);
  return id;
}

function caller(identity: "oauth" | "otp" | "none") {
  return stripeRouter.createCaller({
    user: identity === "oauth" ? { id: 1, email: EMAIL, role: "user" } : null,
    studentEmail: identity === "otp" ? EMAIL : null,
    req: { headers: {} }, res: {},
  } as TrpcContext);
}

beforeEach(() => {
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(NOW);
  nextId = 1;
  sqlite = new DatabaseSync(":memory:");
  // Keep the real MySQL schema and generated SQL; SQLite executes the actual
  // email/status/expiry/orgId predicates, rather than a prefiltered mock result.
  sqlite.exec(`CREATE TABLE subscriptions (${Object.entries(getTableColumns(subscriptions))
    .map(([name, column]) => `\`${name}\` ${column.dataType === "number" ? "INTEGER" : "TEXT"}`).join(",")})`);
  const db = drizzle(async (sql, params) => ({
    rows: sqlite.prepare(sql).all(...params).map(row => Object.values(row)),
  }));
  vi.mocked(getDb).mockResolvedValue(db as unknown as NonNullable<Awaited<ReturnType<typeof getDb>>>);
});
afterEach(() => {
  sqlite.close();
  vi.useRealTimers();
  vi.clearAllMocks();
});

for (const identity of ["oauth", "otp"] as const) {
  describe(`${identity} personal subscription surface`, () => {
    const query = () => identity === "oauth"
      ? caller(identity).getMySubscriptions()
      : caller(identity).getMySubscriptionsForEmailSession();

    it.each(["assigned class1-water only", "revoked membership with stale active subscription"])(
      "never expands an organization row: %s", async () => {
        // The legacy org row does not carry the assigned course or revocation.
        // Neither may turn its broad class1 tier into personal water + wastewater.
        addRow({ orgId: 42, stripeSubscriptionId: "org-42-learner-class1-water" });
        expect(await query()).toEqual({ subscriptions: [], unlockedExamTypes: [] });
      },
    );

    it("excludes cancelled, expired, and stale active rows", async () => {
      for (const orgId of [null, 42]) {
        addRow({ orgId, status: "cancelled" });
        addRow({ orgId, status: "expired" });
        addRow({ orgId, currentPeriodEnd: "2039-12-31 23:59:59.000" });
        addRow({ orgId, currentPeriodEnd: "2040-01-01 00:00:00.000" });
      }
      expect(await query()).toEqual({ subscriptions: [], unlockedExamTypes: [] });
    });

    it("retains an independent valid personal subscription without team expansion", async () => {
      addRow({ orgId: 42, tier: "all-access" });
      addRow({ email: "unrelated@example.test", tier: "all-access" });
      const personalId = addRow({ tier: "class1", province: "western" });
      const result = await query();
      expect(result.subscriptions.map(row => row.id)).toEqual([personalId]);
      expect(result.subscriptions.every(row => row.orgId === null)).toBe(true);
      expect(result.unlockedExamTypes).toEqual(getAllSubscriptionExamTypes([{ tier: "class1", province: "western" }]));
      expect(result.unlockedExamTypes).not.toContain("class1-ww");
    });
  });
}

it("keeps unauthenticated OTP reads empty and OAuth reads protected", async () => {
  addRow();
  expect(await caller("none").getMySubscriptionsForEmailSession()).toEqual({ subscriptions: [], unlockedExamTypes: [] });
  await expect(caller("none").getMySubscriptions()).rejects.toMatchObject({ code: "UNAUTHORIZED" });
});
