import { randomUUID } from "node:crypto";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { eq, like, sql } from "drizzle-orm";
import { getDb } from "./db";
import {
  scheduledWork,
  stripeEventLog,
  subscriptions,
} from "../drizzle/schema";
import {
  claimWork,
  deliverOnce,
  WorkBusyError,
  DeliveryUncertainError,
} from "./jobs/durableWork";
import { provisionIndividualSubscription } from "./stripe/provisionIndividualSubscription";
import { runManagedJob, MANAGED_JOBS } from "./jobs/managedJobs";

const prefix = `reliability-${randomUUID()}`;
let db: NonNullable<Awaited<ReturnType<typeof getDb>>>;
const suite = process.env.DATABASE_URL ? describe : describe.skip;
suite("billing and managed work with a real isolated database", () => {
  beforeAll(async () => {
    const conn = await getDb();
    if (!conn) throw new Error("Database required");
    db = conn;
  });
  afterAll(async () => {
    if (!db) return;
    await db
      .delete(scheduledWork)
      .where(like(scheduledWork.workKey, `${prefix}%`));
    await db
      .delete(scheduledWork)
      .where(eq(scheduledWork.workKey, "job:exam-reminders:2098-01-02"));
    await db
      .delete(scheduledWork)
      .where(like(scheduledWork.workKey, "job:exam-reminders:2098-01-0%"));
    await db
      .delete(scheduledWork)
      .where(eq(scheduledWork.workKey, "job-lock:exam-reminders"));
    await db
      .delete(stripeEventLog)
      .where(like(stripeEventLog.stripeEventId, `${prefix}%`));
    await db
      .delete(subscriptions)
      .where(like(subscriptions.stripeSubscriptionId, `${prefix}%`));
  });
  it("allows only one replica and fences an expired worker", async () => {
    const key = `${prefix}-lease`;
    const results = await Promise.allSettled([
      claimWork(db, key, true),
      claimWork(db, key, true),
    ]);
    expect(results.filter(r => r.status === "fulfilled")).toHaveLength(1);
    const first = (
      results.find(r => r.status === "fulfilled") as PromiseFulfilledResult<
        Awaited<ReturnType<typeof claimWork>>
      >
    ).value!;
    await first.assertOwned();
    await first.assertOwned(); // same-second renewals must succeed
    await db.execute(
      sql`UPDATE scheduled_work SET leaseUntil = DATE_SUB(CURRENT_TIMESTAMP, INTERVAL 1 MINUTE) WHERE workKey = ${key}`
    );
    const second = (await claimWork(db, key, true))!;
    await expect(first.assertOwned()).rejects.toBeInstanceOf(WorkBusyError);
    await expect(first.finish("completed")).rejects.toBeInstanceOf(
      WorkBusyError
    );
    await second.finish("completed");
    expect(await claimWork(db, key, true)).toBeNull();
  });
  it("does not duplicate SMTP delivery across concurrent workers or an ambiguous failure", async () => {
    const send = vi.fn().mockResolvedValue(undefined);
    await Promise.allSettled([
      deliverOnce(db, `${prefix}-email`, send),
      deliverOnce(db, `${prefix}-email`, send),
    ]);
    expect(send).toHaveBeenCalledTimes(1);
    expect(await deliverOnce(db, `${prefix}-email`, send)).toBe(false);
    const uncertain = vi
      .fn()
      .mockRejectedValue(new Error("SMTP acknowledgement timed out"));
    await expect(
      deliverOnce(db, `${prefix}-uncertain`, uncertain)
    ).rejects.toThrow("timed out");
    await expect(
      deliverOnce(db, `${prefix}-uncertain`, uncertain)
    ).rejects.toBeInstanceOf(DeliveryUncertainError);
    expect(uncertain).toHaveBeenCalledTimes(1);
  });
  it("records a failed managed run and retries it, then suppresses completed replays", async () => {
    const run = vi
      .fn()
      .mockResolvedValueOnce({ sent: 0, errors: ["SMTP unavailable"] })
      .mockResolvedValue({ sent: 1, errors: [] });
    const deps = {
      getDb: async () => db,
      jobs: { ...MANAGED_JOBS, "exam-reminders": { cron: "0 0 8 * * *", run } },
    };
    await expect(
      runManagedJob("exam-reminders", new Date("2098-01-02"), deps)
    ).rejects.toThrow("unresolved errors");
    expect(
      await runManagedJob("exam-reminders", new Date("2098-01-02"), deps)
    ).toEqual({ state: "completed" });
    expect(
      await runManagedJob("exam-reminders", new Date("2098-01-02"), deps)
    ).toEqual({ state: "already_completed" });
    expect(run).toHaveBeenCalledTimes(2);
  });
  it("serializes runs across the UTC date boundary", async () => {
    let release!: () => void;
    let started!: () => void;
    const running = new Promise<void>(resolve => {
      started = resolve;
    });
    const blocker = new Promise<void>(resolve => {
      release = resolve;
    });
    const run = vi.fn(async () => {
      started();
      await blocker;
      return { sent: 0, errors: [] };
    });
    const deps = {
      getDb: async () => db,
      jobs: { ...MANAGED_JOBS, "exam-reminders": { cron: "0 0 8 * * *", run } },
    };
    const first = runManagedJob(
      "exam-reminders",
      new Date("2098-01-03T23:59:59Z"),
      deps
    );
    await running;
    try {
      await expect(
        runManagedJob("exam-reminders", new Date("2098-01-04T00:00:01Z"), deps)
      ).rejects.toBeInstanceOf(WorkBusyError);
      expect(run).toHaveBeenCalledTimes(1);
    } finally {
      release();
      await first;
    }
    expect(
      await runManagedJob("exam-reminders", new Date("2098-01-04"), deps)
    ).toEqual({ state: "completed" });
    expect(run).toHaveBeenCalledTimes(2);
  });
  const subscription = (name: string) => ({
    id: `${prefix}-${name}`,
    customer: "cus_synthetic",
    status: "active",
    metadata: { subscription_tier: "class1", subscription_province: "ontario" },
    current_period_start: 1780000000,
    current_period_end: 1880000000,
  });
  it("retains entitlement after SMTP failure and completes a retry without duplicate subscription rows", async () => {
    const sub = subscription("smtp"),
      id = `${prefix}-smtp-event`;
    const customer = vi
      .fn()
      .mockResolvedValue({ email: `${prefix}@echelon.test` });
    const send = vi
      .fn()
      .mockRejectedValueOnce(new Error("SMTP unavailable"))
      .mockResolvedValue(undefined);
    expect(
      (
        await provisionIndividualSubscription(
          db,
          id,
          "customer.subscription.created",
          sub,
          { customer, send }
        )
      ).state
    ).toBe("retryable_failure");
    let rows = await db
      .select()
      .from(subscriptions)
      .where(eq(subscriptions.stripeSubscriptionId, sub.id));
    expect(rows).toHaveLength(1);
    const rowId = rows[0].id;
    expect(rows[0].status).toBe("active");
    expect(
      (
        await provisionIndividualSubscription(
          db,
          id,
          "customer.subscription.created",
          sub,
          { customer, send }
        )
      ).state
    ).toBe("completed");
    expect(
      (
        await provisionIndividualSubscription(
          db,
          id,
          "customer.subscription.created",
          sub,
          { customer, send }
        )
      ).state
    ).toBe("completed");
    rows = await db
      .select()
      .from(subscriptions)
      .where(eq(subscriptions.stripeSubscriptionId, sub.id));
    expect(rows).toHaveLength(1);
    expect(rows[0].id).toBe(rowId);
    expect(send).toHaveBeenCalledTimes(2);
  });
  it("retries missing metadata and customer lookup errors without acknowledging incomplete entitlement", async () => {
    const sub = subscription("lookup"),
      id = `${prefix}-lookup-event`;
    const customer = vi
      .fn()
      .mockRejectedValueOnce(new Error("Stripe unavailable"))
      .mockResolvedValue({ email: `${prefix}@echelon.test` });
    const send = vi.fn().mockResolvedValue(undefined);
    expect(
      (
        await provisionIndividualSubscription(
          db,
          id,
          "customer.subscription.created",
          { ...sub, metadata: {} },
          { customer, send }
        )
      ).state
    ).toBe("retryable_failure");
    expect(customer).not.toHaveBeenCalled();
    expect(
      (
        await provisionIndividualSubscription(
          db,
          id,
          "customer.subscription.created",
          sub,
          { customer, send }
        )
      ).state
    ).toBe("retryable_failure");
    expect(
      await db
        .select()
        .from(subscriptions)
        .where(eq(subscriptions.stripeSubscriptionId, sub.id))
    ).toHaveLength(0);
    expect(
      (
        await provisionIndividualSubscription(
          db,
          id,
          "customer.subscription.created",
          sub,
          { customer, send }
        )
      ).state
    ).toBe("completed");
  });
  it("rolls back a database failure and preserves event recovery", async () => {
    const sub = subscription("database"),
      id = `${prefix}-database-event`;
    const deps = {
      customer: vi.fn().mockResolvedValue({ email: `${prefix}@echelon.test` }),
      send: vi.fn().mockResolvedValue(undefined),
    };
    const broken = new Proxy(db, {
      get(target, key) {
        if (key === "transaction")
          return async () => {
            throw new Error("Database unavailable");
          };
        return Reflect.get(target, key);
      },
    });
    expect(
      (
        await provisionIndividualSubscription(
          broken,
          id,
          "customer.subscription.created",
          sub,
          deps
        )
      ).state
    ).toBe("retryable_failure");
    expect(
      await db
        .select()
        .from(subscriptions)
        .where(eq(subscriptions.stripeSubscriptionId, sub.id))
    ).toHaveLength(0);
    expect(
      (
        await provisionIndividualSubscription(
          db,
          id,
          "customer.subscription.created",
          sub,
          deps
        )
      ).state
    ).toBe("completed");
  });
});
