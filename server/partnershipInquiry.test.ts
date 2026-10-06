import { beforeEach, describe, expect, it, vi } from "vitest";
import { getDb } from "./db";
import { sendContactEmail } from "./email";
import { notifyOwner } from "./_core/notification";
import { deliverPartnershipNotification, persistedPartnershipInquiry, receivePartnershipInquiry, type PartnershipDependencies, type PartnershipLead } from "./partnershipInquiry";
import { getTrpcRateLimitPolicy } from "./trpcRateLimit";
import { loadManifest, validateManifest } from "../scripts/db/migrationSafety";

vi.mock("./db", () => ({ getDb: vi.fn() }));
vi.mock("./email", () => ({ sendContactEmail: vi.fn().mockResolvedValue(undefined) }));
vi.mock("./_core/notification", () => ({ notifyOwner: vi.fn().mockResolvedValue(true) }));

const input = {
  requestKey: "00000000-0000-4000-8000-000000000075",
  name: " Synthetic Partner ", email: "partner@example.test", organization: "Synthetic Utility",
  partnershipType: "Municipal Utility" as const, message: "Synthetic inquiry with exact fields.\nRetain this line.", website: "",
};

function dependencies() {
  const leads = new Map<string, PartnershipLead>();
  const statuses = new Map<number, string>();
  const deps: PartnershipDependencies = {
    store: {
      save: vi.fn(async fields => {
        const existing = leads.get(fields.requestKey);
        if (existing) return { lead: existing, created: false };
        const lead = { id: leads.size + 1, ...fields };
        leads.set(fields.requestKey, lead);
        return { lead, created: true };
      }),
      notificationStatus: vi.fn(async (id, status) => { statuses.set(id, status); }),
    },
    notify: vi.fn().mockResolvedValue(undefined), reportFailure: vi.fn(),
  };
  return { deps, leads, statuses };
}

beforeEach(() => vi.clearAllMocks());

describe("partnership inquiry persistence", () => {
  it("saves exact fields once before acknowledgment and deduplicates concurrent/retried receipt keys", async () => {
    const { deps, leads } = dependencies();
    const results = await Promise.all([receivePartnershipInquiry(input, deps), receivePartnershipInquiry(input, deps)]);
    expect(results).toEqual([{ success: true, receiptId: 1 }, { success: true, receiptId: 1 }]);
    expect(leads.size).toBe(1);
    expect(leads.get(input.requestKey)).toEqual({ id: 1, requestKey: input.requestKey, name: input.name, email: input.email, organization: input.organization, partnershipType: input.partnershipType, message: input.message });
    expect(deps.notify).toHaveBeenCalledTimes(1);
  });

  it("never acknowledges unavailable storage and can retry with the original fields", async () => {
    const { deps, leads } = dependencies();
    vi.mocked(deps.store.save).mockRejectedValueOnce(new Error("synthetic storage failure"));
    await expect(receivePartnershipInquiry(input, deps)).rejects.toMatchObject({ code: "SERVICE_UNAVAILABLE" });
    expect(deps.notify).not.toHaveBeenCalled();
    await expect(receivePartnershipInquiry(input, deps)).resolves.toMatchObject({ success: true });
    expect(leads.size).toBe(1);
  });

  it("rejects altered fields reusing an existing receipt", async () => {
    const { deps } = dependencies();
    await receivePartnershipInquiry(input, deps);
    await expect(receivePartnershipInquiry({ ...input, organization: "Other synthetic utility" }, deps)).rejects.toMatchObject({ code: "CONFLICT" });
  });

  it.each([{ message: "short" }, { organization: " " }, { email: "invalid" }, { partnershipType: "Unknown" }, { website: "spam.example.test" }])("rejects invalid/abusive fields before storage: %j", async changed => {
    const { deps } = dependencies();
    await expect(receivePartnershipInquiry({ ...input, ...changed } as typeof input, deps)).rejects.toBeDefined();
    expect(deps.store.save).not.toHaveBeenCalled();
  });

  it("records failed secondary delivery without losing a saved lead or delaying receipt", async () => {
    const { deps, leads, statuses } = dependencies();
    let reject!: (error: Error) => void;
    vi.mocked(deps.notify).mockReturnValue(new Promise((_resolve, failure) => { reject = failure; }));
    await expect(receivePartnershipInquiry(input, deps)).resolves.toEqual({ success: true, receiptId: 1 });
    expect(leads.size).toBe(1);
    reject(new Error("synthetic mail failure"));
    await vi.waitFor(() => expect(statuses.get(1)).toBe("failed"));
    expect(deps.reportFailure).toHaveBeenCalledWith(1);
  });

  it("handles notification-status storage failure without an unhandled rejection", async () => {
    const { deps } = dependencies();
    vi.mocked(deps.store.notificationStatus).mockRejectedValue(new Error("synthetic update failure"));
    await expect(deliverPartnershipNotification({ id: 1, ...input }, deps)).resolves.toBeUndefined();
    expect(deps.reportFailure).toHaveBeenCalledWith(1);
  });

  it("uses the existing abuse limiter for normal and batched partnership endpoints", () => {
    expect(getTrpcRateLimitPolicy("/api/trpc/contact.partnership")).toBe("contact");
    expect(getTrpcRateLimitPolicy("/api/trpc/auth.me,contact.partnership?batch=1")).toBe("contact");
  });
});

describe("contact-table adapter and pending additive migration", () => {
  it("fails closed with no database and sends no notification", async () => {
    vi.mocked(getDb).mockResolvedValue(null);
    await expect(persistedPartnershipInquiry(input)).rejects.toMatchObject({ code: "SERVICE_UNAVAILABLE" });
    expect(sendContactEmail).not.toHaveBeenCalled();
    expect(notifyOwner).not.toHaveBeenCalled();
  });

  it("inserts exact searchable fields and durable new/pending statuses, retaining one row on duplicate retry", async () => {
    let row: Record<string, unknown> | undefined;
    const values = vi.fn(async fields => {
      if (row) throw Object.assign(new Error("synthetic duplicate"), { code: "ER_DUP_ENTRY" });
      row = { id: 1, ...fields };
    });
    const set = vi.fn(() => ({ where: vi.fn().mockResolvedValue(undefined) }));
    const fakeDb = {
      insert: () => ({ values }),
      select: () => ({ from: () => ({ where: () => ({ limit: async () => [row] }) }) }),
      update: () => ({ set }),
    };
    vi.mocked(getDb).mockResolvedValue(fakeDb as never);
    await expect(persistedPartnershipInquiry(input)).resolves.toEqual({ success: true, receiptId: 1 });
    await expect(persistedPartnershipInquiry(input)).resolves.toEqual({ success: true, receiptId: 1 });
    expect(row).toMatchObject({ name: input.name, organization: input.organization, partnershipType: input.partnershipType, message: input.message, followUpStatus: "new", notificationStatus: "pending" });
    expect(sendContactEmail).toHaveBeenCalledTimes(1);
    await vi.waitFor(() => expect(set).toHaveBeenCalledWith({ notificationStatus: "sent" }));
  });

  it("registers the checksummed additive migration as proposed only", async () => {
    const manifest = await loadManifest();
    await expect(validateManifest(manifest)).resolves.toEqual([]);
    expect(manifest.migrations.find(migration => migration.tag === "0076_contact_partnership_receipts")).toMatchObject({ proposedOnly: true, standaloneApply: { tables: ["contact_submissions"] } });
  });

  it("requires explicit exact uniqueness metadata and proposed standalone scope for a pending receipt index", async () => {
    const manifest = await loadManifest();
    const missingUniqueness = structuredClone(manifest);
    const receipt = missingUniqueness.migrations.find(migration => migration.tag === "0076_contact_partnership_receipts")!;
    delete receipt.verifierAllowMissingIndexes![0].unique;
    expect(await validateManifest(missingUniqueness)).toEqual(expect.arrayContaining([
      expect.stringContaining("incorrect expected metadata for contact_submissions.contact_request_key_unique"),
      expect.stringContaining("does not create declared pending index contact_submissions.contact_request_key_unique"),
    ]));

    const wrongScope = structuredClone(manifest);
    delete wrongScope.migrations.find(migration => migration.tag === "0076_contact_partnership_receipts")!.standaloneApply;
    expect(await validateManifest(wrongScope)).toContainEqual(expect.stringContaining("pending unique index outside a proposed standalone verification table"));

    const wrongExistingIndex = structuredClone(manifest);
    wrongExistingIndex.migrations.find(migration => migration.version === 54)!.verifierAllowMissingIndexes![0].unique = true;
    expect(await validateManifest(wrongExistingIndex)).toContainEqual(expect.stringContaining("incorrect expected metadata for stripe_event_log.stripe_event_log_status_idx"));
  });
});
