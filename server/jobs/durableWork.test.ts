import { describe, expect, it, vi } from "vitest";
import { MySqlDialect } from "drizzle-orm/mysql-core";
import { deliverOnce, DeliveryUncertainError } from "./durableWork";

/** Model only the atomic ledger SQL boundary; no SMTP or deployment DB calls. */
function ledger() {
  let status = "pending";
  const dialect = new MySqlDialect();
  const db = {
    execute: vi.fn(async (query: any) => {
      const rendered = dialect.sqlToQuery(query);
      if (rendered.sql.startsWith("INSERT IGNORE"))
        return [{ affectedRows: 1 }];
      if (rendered.sql.includes("attempts = attempts + 1")) {
        if (status !== "pending") return [{ affectedRows: 0 }];
        status = "processing";
        return [{ affectedRows: 1 }];
      }
      if (rendered.sql.startsWith("SELECT status")) return [[{ status }]];
      if (rendered.sql.includes("leaseVersion = leaseVersion + 1"))
        return [{ affectedRows: status === "processing" ? 1 : 0 }];
      status = String(rendered.params[0]);
      return [{ affectedRows: 1 }];
    }),
  };
  return { db: db as any, status: () => status };
}

describe("durable one-shot checkout reminder delivery", () => {
  it("does not send twice on a replay", async () => {
    const state = ledger();
    const send = vi.fn().mockResolvedValue(undefined);
    expect(await deliverOnce(state.db, "fixture-reminder", send)).toBe(true);
    expect(await deliverOnce(state.db, "fixture-reminder", send)).toBe(false);
    expect(send).toHaveBeenCalledTimes(1);
    expect(state.status()).toBe("completed");
  });

  it("does not permit concurrent delivery while the first SMTP call is pending", async () => {
    const state = ledger();
    let release!: () => void;
    let started!: () => void;
    const began = new Promise<void>(resolve => {
      started = resolve;
    });
    const waiting = new Promise<void>(resolve => {
      release = resolve;
    });
    const send = vi.fn(async () => {
      started();
      await waiting;
    });
    const first = deliverOnce(state.db, "fixture-reminder", send);
    await began;
    await expect(
      deliverOnce(state.db, "fixture-reminder", send)
    ).rejects.toBeInstanceOf(DeliveryUncertainError);
    release();
    await first;
    expect(send).toHaveBeenCalledTimes(1);
  });

  it("does not automatically retry an ambiguous SMTP failure", async () => {
    const state = ledger();
    const send = vi.fn().mockRejectedValue(new Error("Synthetic SMTP timeout"));
    await expect(
      deliverOnce(state.db, "fixture-reminder", send)
    ).rejects.toThrow("Synthetic SMTP timeout");
    expect(state.status()).toBe("uncertain");
    await expect(
      deliverOnce(state.db, "fixture-reminder", send)
    ).rejects.toBeInstanceOf(DeliveryUncertainError);
    expect(send).toHaveBeenCalledTimes(1);
  });
});
