import { describe, expect, it, vi } from "vitest";
import { ADS_CHOICE_KEY, GOOGLE_ADS_ID, createGoogleAdsMeasurement, googleAdsPage, readAdsChoice, validAdsConversion } from "./googleAds";

const conversion = { sendTo: `${GOOGLE_ADS_ID}/PurchaseOnly_123`, value: 39.2, currency: "CAD", transactionId: `echelon_${"a".repeat(64)}` };
function harness(path = "/pricing", choice: string | null = null, host = "echeloninstitute.ca") {
  const saved = new Map<string, string>(choice ? [[ADS_CHOICE_KEY, choice]] : []);
  const scripts: any[] = [];
  const browser = {
    location: new URL(`https://${host}${path}`), navigator: {}, dataLayer: [] as unknown[], gtag: undefined as any,
    localStorage: { getItem: (key: string) => saved.get(key) ?? null, setItem: (key: string, value: string) => saved.set(key, value) },
  };
  const doc = { createElement: vi.fn(() => ({})), head: { appendChild: vi.fn(x => scripts.push(x)) } };
  const measurement = createGoogleAdsMeasurement(browser as unknown as Window, doc as unknown as Document);
  const calls = () => browser.dataLayer.map(x => Array.from(x as ArrayLike<unknown>));
  return { browser, saved, scripts, calls, measurement };
}

const privatePaths = ["/login/otp", "/auth/magic", "/invite/token", "/activate/oit", "/account", "/admin", "/quiz", "/dashboard", "/team", "/subscription-success", "/unknown/token"];
describe("optional Google Ads boundary", () => {
  it.each([null, "denied", "broken"])("does not load or queue any vendor event for choice %s", choice => {
    const h = harness("/pricing", choice); h.measurement.update();
    expect(h.scripts).toHaveLength(0); expect(h.calls()).toEqual([]);
  });
  it.each(["localhost", "127.0.0.1", "preview.example.test"])("never loads the live tag on non-production host %s", host => {
    const h = harness("/", "allowed", host); h.measurement.update(); expect(h.scripts).toHaveLength(0);
  });
  it("respects browser privacy opt-out even when a prior choice allowed measurement", () => {
    for (const navigator of [{ globalPrivacyControl: true }, { doNotTrack: "1" }]) {
      const h = harness("/", "allowed"); h.browser.navigator = navigator;
      expect(readAdsChoice(h.browser as unknown as Window)).toBe("denied"); h.measurement.update(); expect(h.scripts).toHaveLength(0);
    }
  });
  it("keeps defaults before config, uses one script, and denies personalization/analytics", () => {
    const h = harness("/pricing", "allowed"); h.measurement.update(); h.measurement.update();
    expect(h.scripts).toHaveLength(1);
    expect(h.scripts[0]).toMatchObject({ id: "echelon-google-ads", async: true, referrerPolicy: "no-referrer", src: `https://www.googletagmanager.com/gtag/js?id=${GOOGLE_ADS_ID}` });
    expect(h.calls()[0]).toEqual(["consent", "default", { ad_storage: "denied", analytics_storage: "denied", ad_user_data: "denied", ad_personalization: "denied" }]);
    expect(h.calls().find(x => x[0] === "config")?.[2]).toMatchObject({ send_page_view: false, allow_ad_personalization_signals: false, allow_enhanced_conversions: false });
    expect(h.calls().filter(x => x[0] === "event")).toHaveLength(1);
  });
  it("retains only bounded ad attribution identifiers, never emails/tokens/fragments or dynamic slugs", () => {
    const raw = "/blog/sensitive-slug?email=buyer%40example.test&token=secret&gclid=Good_Click-123&gbraid=bad%40email.test#worst";
    expect(googleAdsPage(raw)).toBe("https://echeloninstitute.ca/blog/:slug?gclid=Good_Click-123");
    expect(googleAdsPage("/pricing?gclid=" + "a".repeat(257))).toBe("https://echeloninstitute.ca/pricing");
    const h = harness(raw, "allowed"); h.measurement.update();
    const text = JSON.stringify(h.calls());
    for (const value of ["buyer", "secret", "sensitive-slug", "worst", "bad@", "email.test"]) expect(text).not.toContain(value);
  });
  it.each(privatePaths)("does not initialize or page-track private initial route %s", path => {
    const h = harness(`${path}?email=private%40example.test&token=never-send`, "allowed");
    h.measurement.update(); expect(h.scripts).toHaveLength(0); expect(h.calls()).toEqual([]);
  });
  it("public/private/public SPA navigation sends no private view and resets context", () => {
    const h = harness("/pricing", "allowed"); h.measurement.update();
    for (const path of privatePaths) { h.browser.location = new URL(`https://echeloninstitute.ca${path}?token=secret`); h.measurement.update(); }
    h.browser.location = new URL("https://echeloninstitute.ca/teams"); h.measurement.update();
    const events = h.calls().filter(x => x[0] === "event"); expect(events).toHaveLength(2);
    expect(JSON.stringify(h.calls())).not.toContain("secret"); expect(h.scripts).toHaveLength(1);
  });
  it("queues only a validated paid payload until consent, then sends the exact actual amount once", () => {
    const h = harness("/purchase-success?session_id=cs_test_secret&email=buyer%40example.test");
    h.measurement.recordPurchase({ ...conversion, email: "buyer@example.test", sessionId: "cs_test_secret" });
    expect(h.calls()).toEqual([]); h.saved.set(ADS_CHOICE_KEY, "allowed"); h.measurement.update();
    h.measurement.recordPurchase(conversion); h.measurement.update();
    const events = h.calls().filter(x => x[0] === "event"); expect(events).toHaveLength(1);
    expect(events[0]).toEqual(["event", "conversion", {
      page_location: "https://echeloninstitute.ca/purchase-success", page_referrer: "", page_title: "Echelon Institute",
      send_to: conversion.sendTo, value: 39.2, currency: "CAD", transaction_id: conversion.transactionId, allow_ad_personalization_signals: false,
    }]);
    expect(JSON.stringify(h.calls())).not.toMatch(/cs_test_secret|buyer|session_id/);
  });
  it("does not send a conversion on an unverified success URL or the wrong route", () => {
    const h = harness("/purchase-success?session_id=cs_test_fake", "allowed"); h.measurement.update();
    expect(h.calls()).toEqual([]);
    h.browser.location = new URL("https://echeloninstitute.ca/pricing"); h.measurement.recordPurchase(conversion);
    expect(h.calls()).toEqual([]);
  });
  it("retains duplicate prevention across a fresh page instance and falls back to stable transaction ID when storage fails", () => {
    const h = harness("/purchase-success", "allowed"); h.measurement.recordPurchase(conversion);
    const second = createGoogleAdsMeasurement(h.browser as unknown as Window, { createElement: () => ({}), head: { appendChild: () => {} } } as unknown as Document);
    second.recordPurchase(conversion); expect(h.calls().filter(x => x[0] === "event")).toHaveLength(1);
    const denied = harness("/", "allowed"); denied.browser.localStorage.getItem = () => { throw new Error("no storage"); };
    expect(readAdsChoice(denied.browser as unknown as Window)).toBeNull(); denied.measurement.update(); expect(denied.calls()).toEqual([]);
  });
  it.each([null, {}, { ...conversion, sendTo: "AW-other/wrong" }, { ...conversion, transactionId: "cs_live_private" }, { ...conversion, currency: "EUR" }, { ...conversion, value: NaN }, { ...conversion, value: -1 }, { ...conversion, value: Infinity }])("rejects malformed or identifying conversion payload %j", value => {
    expect(validAdsConversion(value)).toBe(false);
    const h = harness("/purchase-success", "allowed"); h.measurement.recordPurchase(value); expect(h.calls()).toEqual([]);
  });
});
