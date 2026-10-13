import { describe, expect, it } from "vitest";
import { readCheckoutJurisdiction } from "./checkoutJurisdiction";

describe("readCheckoutJurisdiction", () => {
  it("prefers a valid route province over the saved preference", () => {
    expect(readCheckoutJurisdiction("province=BC", "ns")).toBe("BC");
  });

  it("uses the saved Nova Scotia province for a bookmarked or direct route", () => {
    expect(readCheckoutJurisdiction("", "ns")).toBe("NS");
  });

  it("ignores malformed route and stored province values", () => {
    expect(readCheckoutJurisdiction("province=XX", "invalid")).toBeUndefined();
  });
});
