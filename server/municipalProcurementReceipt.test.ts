import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const source = readFileSync(join(__dirname, "municipalProcurement.ts"), "utf8");

/**
 * A municipal buyer can print the pricing estimate and carry a receipt number
 * into a procurement conversation. That number must always refer to the exact
 * figures Echelon holds on file.
 */
describe("municipal procurement receipts", () => {
  it("never grants access or takes payment", () => {
    expect(source).not.toMatch(/insert\((subscriptions|purchases|organizations)\)/);
    expect(source).not.toMatch(/stripe\./i);
    expect(source).toContain("persistedPartnershipInquiry");
  });

  it("prices the request on the server, not from client input", () => {
    expect(source).toContain("getTeamTotalPriceCents(input.region, input.tier, input.seats)");
  });

  it("binds the receipt to the whole priced payload", () => {
    // Replaying one requestKey with different seats or a different tier must
    // not return the original receipt number beside a new price. That would
    // let someone print an official looking estimate whose reference number
    // does not match what Echelon actually recorded.
    const key = source.slice(source.indexOf("const payloadHash"), source.indexOf("const requestText"));
    expect(key).toContain("createHash");
    for (const field of ["input.requestKey", "input.kind", "input.email", "input.organization", "input.region", "tier", "totalCents"]) {
      expect(key, `idempotency key must cover ${field}`).toContain(field);
    }
    expect(source).toContain("requestKey: idempotencyKey");
  });
});
