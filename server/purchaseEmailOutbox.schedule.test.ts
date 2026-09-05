import { describe, expect, it, vi } from "vitest";
import {
  ensurePurchaseEmailHeartbeat,
  runPurchaseEmailDelivery,
} from "./purchaseEmailOutbox";

const CURRENT_JOB = {
  taskUid: "purchase-email-task",
  name: "echelon-purchase-email-delivery",
  userId: "owner",
  description:
    "Deliver queued individual purchase confirmation emails every minute.",
  cronExpression: "0 * * * * *",
  callbackPath: "/api/scheduled/purchase-email-delivery",
  callbackMethod: "POST",
  callbackPayload: "{}",
  isEnable: true,
};

describe("purchase email managed scheduling", () => {
  it("creates the one-minute Heartbeat once and leaves a current schedule unchanged", async () => {
    const create = vi
      .fn()
      .mockResolvedValue({ taskUid: "purchase-email-task" });
    const update = vi.fn().mockResolvedValue({});
    const list = vi
      .fn()
      .mockResolvedValueOnce({ total: 0, actorUserId: "owner", jobs: [] })
      .mockResolvedValueOnce({
        total: 1,
        actorUserId: "owner",
        jobs: [CURRENT_JOB],
      });

    await expect(
      ensurePurchaseEmailHeartbeat({ list, create, update })
    ).resolves.toBe("created");
    await expect(
      ensurePurchaseEmailHeartbeat({ list, create, update })
    ).resolves.toBe("unchanged");
    expect(create).toHaveBeenCalledOnce();
    expect(create).toHaveBeenCalledWith(
      expect.objectContaining({
        cron: "0 * * * * *",
        path: "/api/scheduled/purchase-email-delivery",
        method: "POST",
      }),
      ""
    );
    expect(update).not.toHaveBeenCalled();
  });

  it("repairs a stale or paused Heartbeat instead of creating a duplicate", async () => {
    const create = vi.fn().mockResolvedValue({ taskUid: "unused" });
    const update = vi.fn().mockResolvedValue({});
    const list = vi.fn().mockResolvedValue({
      total: 1,
      actorUserId: "owner",
      jobs: [
        {
          ...CURRENT_JOB,
          cronExpression: "0 */5 * * * *",
          callbackPath: "/api/scheduled/old-purchase-email-delivery",
          isEnable: false,
        },
      ],
    });

    await expect(
      ensurePurchaseEmailHeartbeat({ list, create, update })
    ).resolves.toBe("updated");
    expect(create).not.toHaveBeenCalled();
    expect(update).toHaveBeenCalledWith(
      "purchase-email-task",
      expect.objectContaining({
        cron: "0 * * * * *",
        path: "/api/scheduled/purchase-email-delivery",
        enable: true,
      }),
      ""
    );
  });

  it("runs one bounded delivery batch through the scheduled service", async () => {
    const database = {} as never;
    const getDatabase = vi.fn().mockResolvedValue(database);
    const deliver = vi.fn().mockResolvedValue({ sent: 2 });

    await expect(
      runPurchaseEmailDelivery({ getDatabase, deliver })
    ).resolves.toEqual({ sent: 2 });
    expect(deliver).toHaveBeenCalledOnce();
    expect(deliver).toHaveBeenCalledWith(database);
  });

  it("fails clearly when the database is unavailable", async () => {
    const getDatabase = vi.fn().mockResolvedValue(undefined);
    const deliver = vi.fn();

    await expect(
      runPurchaseEmailDelivery({ getDatabase, deliver })
    ).rejects.toThrow("Database unavailable for purchase email delivery");
    expect(deliver).not.toHaveBeenCalled();
  });
});
