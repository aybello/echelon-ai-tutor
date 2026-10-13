import { afterEach, describe, expect, it, vi } from "vitest";
import { PROVINCE_STORAGE_KEY } from "@/hooks/useProvince";
import { readCheckoutJurisdiction } from "./checkoutJurisdiction";

describe("readCheckoutJurisdiction", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("prefers a valid route province over the saved preference", () => {
    expect(readCheckoutJurisdiction("province=BC", "ns")).toBe("BC");
  });

  it("uses the saved Nova Scotia province for a bookmarked or direct route", () => {
    expect(readCheckoutJurisdiction("", "ns")).toBe("NS");
  });

  it("reads Nova Scotia from the same localStorage key written by useProvince", () => {
    vi.stubGlobal("window", { localStorage: { getItem: vi.fn((key: string) => key === PROVINCE_STORAGE_KEY ? "ns" : null) } });
    expect(readCheckoutJurisdiction("")).toBe("NS");
  });

  it("ignores malformed route and stored province values", () => {
    expect(readCheckoutJurisdiction("province=XX", "invalid")).toBeUndefined();
  });
});
