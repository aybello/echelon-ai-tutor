import { describe, expect, it } from "vitest";
import { EXTENSION_DAYS, deriveExtensionWindow } from "./flexExtensionService";

const activeLicence = {
  status: "active",
  accessEndsAt: new Date("2026-10-01T00:00:00.000Z"),
  originalAccessEndsAt: new Date("2026-10-01T00:00:00.000Z"),
  reportingEndsAt: new Date("2026-10-31T00:00:00.000Z"),
  revokedAt: null,
  suspendedAt: null,
};

describe("Retake Extension terms", () => {
  it("preserves the original expiry and starts an active extension at that expiry", () => {
    const window = deriveExtensionWindow(activeLicence, new Date("2026-09-20T00:00:00.000Z"));
    expect(window.eligible).toBe(true);
    expect(window.extensionStartsAt?.toISOString()).toBe("2026-10-01T00:00:00.000Z");
    expect(window.extensionEndsAt?.toISOString()).toBe("2026-12-30T00:00:00.000Z");
  });

  it("starts an extension bought after expiry on successful payment", () => {
    const window = deriveExtensionWindow({
      ...activeLicence,
      status: "expired",
      accessEndsAt: new Date("2026-09-01T00:00:00.000Z"),
      originalAccessEndsAt: new Date("2026-09-01T00:00:00.000Z"),
      reportingEndsAt: new Date("2026-10-01T00:00:00.000Z"),
    }, new Date("2026-09-20T12:30:00.000Z"));
    expect(window.eligible).toBe(true);
    expect(window.extensionStartsAt?.toISOString()).toBe("2026-09-20T12:30:00.000Z");
    expect(window.extensionEndsAt?.getTime()).toBe(window.extensionStartsAt!.getTime() + EXTENSION_DAYS * 24 * 60 * 60 * 1000);
  });

  it("fails closed outside the reporting window", () => {
    const window = deriveExtensionWindow({
      ...activeLicence,
      status: "expired",
      accessEndsAt: new Date("2026-08-01T00:00:00.000Z"),
      originalAccessEndsAt: new Date("2026-08-01T00:00:00.000Z"),
      reportingEndsAt: new Date("2026-08-31T00:00:00.000Z"),
    }, new Date("2026-09-01T00:00:00.001Z"));
    expect(window).toMatchObject({ eligible: false });
  });

  it("never reactivates revoked or disputed licences", () => {
    for (const status of ["revoked", "refunded", "disputed", "suspended"]) {
      expect(deriveExtensionWindow({ ...activeLicence, status }, new Date("2026-09-20T00:00:00.000Z")))
        .toMatchObject({ eligible: false });
    }

    expect(deriveExtensionWindow({
      ...activeLicence,
      status: "expired",
      revokedAt: new Date("2026-09-05T00:00:00.000Z"),
    }, new Date("2026-09-20T00:00:00.000Z"))).toMatchObject({ eligible: false });

    expect(deriveExtensionWindow({
      ...activeLicence,
      status: "expired",
      suspendedAt: new Date("2026-09-05T00:00:00.000Z"),
    }, new Date("2026-09-20T00:00:00.000Z"))).toMatchObject({ eligible: false });
  });

  it("never shortens unusual active access that extends past the recorded original expiry", () => {
    const window = deriveExtensionWindow({
      ...activeLicence,
      accessEndsAt: new Date("2026-11-01T00:00:00.000Z"),
      originalAccessEndsAt: new Date("2026-10-01T00:00:00.000Z"),
    }, new Date("2026-09-20T00:00:00.000Z"));
    expect(window.extensionStartsAt?.toISOString()).toBe("2026-11-01T00:00:00.000Z");
    expect(window.extensionEndsAt?.toISOString()).toBe("2027-01-30T00:00:00.000Z");
  });
});
