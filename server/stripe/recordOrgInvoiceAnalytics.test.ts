import { describe, expect, it, vi } from "vitest";
import { recordOrganizationInvoiceConversion } from "./recordOrgInvoiceAnalytics";

function createDb(
  affectedRows: number,
  existingEvent: { status: string; analyticsProcessed: boolean } | undefined = undefined,
) {
  const values = vi.fn().mockResolvedValue(undefined);
  const insert = vi.fn(() => ({ values }));
  const execute = vi.fn().mockResolvedValue([{ affectedRows }]);
  const limit = vi.fn().mockResolvedValue(existingEvent ? [existingEvent] : []);
  const where = vi.fn(() => ({ limit }));
  const from = vi.fn(() => ({ where }));
  const select = vi.fn(() => ({ from }));
  const transaction = vi.fn(async (work: (tx: unknown) => Promise<unknown>) =>
    work({ execute, insert, select }),
  );
  return { db: { transaction } as any, execute, insert, values, select };
}

const input = {
  stripeEventId: "evt_team_invoice",
  org: {
    id: 42,
    managerEmail: "manager@example.com",
    tier: "professional",
    seatsTotal: 12,
  },
  identityHash: "a".repeat(64),
  attribution: {
    source: "campaign",
    device: "desktop",
    province: "ontario",
    surface: "teams",
  },
};

describe("recordOrganizationInvoiceConversion", () => {
  it("records all paid team conversion steps once behind the ledger claim", async () => {
    const { db, execute, insert, values } = createDb(1);

    await expect(recordOrganizationInvoiceConversion(db, input)).resolves.toBe("recorded");

    expect(execute).toHaveBeenCalledTimes(1);
    expect(insert).toHaveBeenCalledTimes(1);
    expect(values).toHaveBeenCalledTimes(1);
    const rows = values.mock.calls[0]?.[0] as Array<{ eventName: string; metadata: string }>;
    expect(rows.map(row => row.eventName)).toEqual([
      "subscription_created",
      "checkout_completed",
      "access_activated",
    ]);
    expect(JSON.parse(rows[0]?.metadata ?? "{}")).toMatchObject({
      paymentStatus: "paid",
      tier: "professional",
      seats: 12,
      source: "campaign",
    });
  });

  it("does not duplicate conversion rows after the invoice ledger is already claimed", async () => {
    const { db, insert, values } = createDb(0, {
      status: "completed",
      analyticsProcessed: true,
    });

    await expect(recordOrganizationInvoiceConversion(db, input)).resolves.toBe("already_recorded");

    expect(insert).not.toHaveBeenCalled();
    expect(values).not.toHaveBeenCalled();
  });

  it("rejects an unclaimed invoice ledger state instead of treating it as deduplicated", async () => {
    const { db, insert } = createDb(0, {
      status: "processing",
      analyticsProcessed: false,
    });

    await expect(recordOrganizationInvoiceConversion(db, input)).rejects.toThrow(
      "ledger status is processing",
    );
    expect(insert).not.toHaveBeenCalled();
  });

  it("keeps metadata inside the coarse analytics allowlists", async () => {
    const { db, values } = createDb(1);

    await recordOrganizationInvoiceConversion(db, {
      ...input,
      attribution: {
        source: "untrusted-source",
        device: "wearable",
        province: "raw-metadata",
        surface: "untrusted-surface",
      },
    });

    expect(JSON.parse(values.mock.calls[0]?.[0]?.[0]?.metadata ?? "{}")).toMatchObject({
      source: "unknown",
      device: "unknown",
      province: "unknown",
      surface: "unknown",
    });
  });
});
