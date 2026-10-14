import { beforeEach, describe, expect, it, vi } from "vitest";
import type { TrpcContext } from "./_core/context";
import { municipalProcurementRouter } from "./municipalProcurement";
import { persistedPartnershipInquiry, receivePartnershipInquiry, type PartnershipLead } from "./partnershipInquiry";
import { checkMunicipalRequestThrottle, createMunicipalRequestThrottle } from "./municipalRequestThrottle";
import { readMunicipalCallback } from "../shared/municipalCallback";

vi.mock("./partnershipInquiry", async original => ({
  ...await original<typeof import("./partnershipInquiry")>(), persistedPartnershipInquiry: vi.fn(),
}));
vi.mock("./municipalRequestThrottle", async original => ({
  ...await original<typeof import("./municipalRequestThrottle")>(), checkMunicipalRequestThrottle: vi.fn(),
}));
vi.mock("./email", () => ({ sendContactEmail: vi.fn() }));
vi.mock("./_core/notification", () => ({ notifyOwner: vi.fn() }));

const input = {
  requestKey: "00000000-0000-4000-8000-000000000014",
  kind: "quote" as const, name: "Synthetic Manager", email: "manager@example.test",
  organization: "Synthetic Utility", region: "nova-scotia" as const,
  tier: "all-access" as const, seats: 5,
};
const caller = municipalProcurementRouter.createCaller({ req: { ip: "192.0.2.1" }, user: null } as TrpcContext);
let rows: Map<string, PartnershipLead>;
beforeEach(() => {
  vi.clearAllMocks();
  rows = new Map();
  vi.mocked(persistedPartnershipInquiry).mockImplementation(raw => receivePartnershipInquiry(raw, {
    store: {
      save: async fields => {
        const existing = rows.get(fields.requestKey);
        if (existing) return { lead: existing, created: false };
        const lead = { id: rows.size + 1, ...fields };
        rows.set(fields.requestKey, lead);
        return { lead, created: true };
      },
      notificationStatus: async () => {},
    },
    notify: async () => {}, reportFailure: () => {},
  }));
});

describe("municipal public request through real router and persistence validation", () => {
  it("produces a persistence-compatible UUID and one durable receipt on retry", async () => {
    const first = await caller.request(input);
    expect(first.annualTotalBeforeTaxCents).toBe(274500);
    expect(await caller.request(input)).toEqual(first);
    expect(rows.size).toBe(1);
    expect([...rows.keys()][0]).toMatch(/^[a-f\d]{8}-[a-f\d]{4}-5[a-f\d]{3}-[89ab][a-f\d]{3}-[a-f\d]{12}$/);
  });
  it("creates a different receipt for altered pricing or request details", async () => {
    expect((await caller.request(input)).receiptId).toBe(1);
    expect((await caller.request({ ...input, seats: 10 })).receiptId).toBe(2);
    expect((await caller.request({ ...input, notes: "Please include purchasing details" })).receiptId).toBe(3);
  });
  it("retains callback permission, phone and first server acceptance time across retries", async () => {
    vi.useFakeTimers();
    try {
      vi.setSystemTime(new Date("2026-10-14T12:00:00Z"));
      const withCall = { ...input, phone: "+1 202-555-0142", callbackRequested: true, preferredCallbackTime: "9–11 Eastern" };
      const first = await caller.request(withCall);
      const saved = [...rows.values()][0].message;
      expect(readMunicipalCallback(saved)).toMatchObject({ phone: withCall.phone, preferredTime: withCall.preferredCallbackTime, acceptedAt: "2026-10-14T12:00:00.000Z" });
      vi.advanceTimersByTime(10_000);
      expect((await caller.request(withCall)).receiptId).toBe(first.receiptId);
      expect([...rows.values()][0].message).toBe(saved);
    } finally { vi.useRealTimers(); }
  });
  it("requires explicit callback permission, and does not save unconsented phone data", async () => {
    await expect(caller.request({ ...input, phone: "+1 202-555-0142" })).rejects.toMatchObject({ code: "BAD_REQUEST" });
    await expect(caller.request({ ...input, callbackRequested: true })).rejects.toMatchObject({ code: "BAD_REQUEST" });
    expect(persistedPartnershipInquiry).not.toHaveBeenCalled();
    await caller.request(input);
    expect(readMunicipalCallback([...rows.values()][0].message)).toBeNull();
  });
  it("persists pilot requests without granting access", async () => {
    const result = await caller.request({ ...input, kind: "pilot" });
    expect(result).toMatchObject({ status: "pending_review", seats: null, annualTotalBeforeTaxCents: null });
    expect([...rows.values()][0].message).toContain("No access is granted");
  });
  it("enforces the per-procedure limiter before any persistence", async () => {
    vi.mocked(checkMunicipalRequestThrottle).mockImplementationOnce(() => { throw new Error("synthetic throttle"); });
    await expect(caller.request(input)).rejects.toThrow("synthetic throttle");
    expect(persistedPartnershipInquiry).not.toHaveBeenCalled();
  });
});

describe("bounded municipal throttling", () => {
  it("limits one email across IPs, then permits a later window", () => {
    const check = createMunicipalRequestThrottle();
    for (let i = 0; i < 3; i++) check(`192.0.2.${i}`, "manager@example.test", 1000);
    expect(() => check("192.0.2.99", "MANAGER@example.test", 1001)).toThrow("Too many requests");
    expect(() => check("192.0.2.99", "manager@example.test", 901001)).not.toThrow();
  });
  it("limits one IPv6 subnet despite email/address rotation and batching", () => {
    const check = createMunicipalRequestThrottle();
    for (let i = 0; i < 5; i++) check(`2001:db8::${i}`, `manager-${i}@example.test`, 1000);
    expect(() => check("2001:db8::99", "other@example.test", 1001)).toThrow("Too many requests");
  });
});
