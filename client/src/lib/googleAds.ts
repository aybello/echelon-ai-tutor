import { publicAnalyticsPage } from "./privacyAnalytics";

export const GOOGLE_ADS_ID = "AW-18491909141";
export const ADS_CHOICE_KEY = "echelon:ads-choice:v1";
export const ADS_CHOICE_EVENT = "echelon:ads-choice";
export type AdsChoice = "allowed" | "denied" | null;
export type AdsConversion = { sendTo: string; value: number; currency: "CAD" | "USD"; transactionId: string };
type AdsWindow = Window & { dataLayer?: unknown[]; gtag?: (...args: unknown[]) => void };

export function readAdsChoice(browser: Window): AdsChoice {
  if (browser.navigator.globalPrivacyControl || browser.navigator.doNotTrack === "1") return "denied";
  try {
    const value = browser.localStorage.getItem(ADS_CHOICE_KEY);
    return value === "allowed" || value === "denied" ? value : null;
  } catch { return null; }
}

/** Only bounded ad-click identifiers are retained, never general query parameters. */
export function googleAdsPage(raw: string) {
  const page = publicAnalyticsPage(raw);
  if (!page) return null;
  const source = new URL(raw, "https://echeloninstitute.ca");
  const safe = new URL(page.path, "https://echeloninstitute.ca");
  for (const name of ["gclid", "gbraid", "wbraid"]) {
    const value = source.searchParams.get(name);
    if (value && /^[a-zA-Z0-9_-]{1,256}$/.test(value)) safe.searchParams.set(name, value);
  }
  return safe.href;
}

export function validAdsConversion(value: unknown): value is AdsConversion {
  if (!value || typeof value !== "object") return false;
  const x = value as AdsConversion;
  return typeof x.sendTo === "string" && /^AW-18491909141\/[a-zA-Z0-9_-]{6,100}$/.test(x.sendTo)
    && Number.isFinite(x.value) && x.value >= 0 && x.value <= 1_000_000
    && (x.currency === "CAD" || x.currency === "USD")
    && typeof x.transactionId === "string" && /^echelon_[a-f0-9]{64}$/.test(x.transactionId);
}

export function createGoogleAdsMeasurement(browser: AdsWindow, doc: Document) {
  let initialized = false;
  let lastPage: string | null = null;
  let pending: AdsConversion | null = null;
  const sent = new Set<string>();
  const allowedHost = () => ["echeloninstitute.ca", "www.echeloninstitute.ca"].includes(browser.location.hostname);
  const safeContext = (url = "https://echeloninstitute.ca/") => ({
    page_location: url, page_referrer: "", page_title: "Echelon Institute",
  });
  const canSend = () => allowedHost() && readAdsChoice(browser) === "allowed";

  function initialize(url: string) {
    if (initialized) return;
    initialized = true;
    browser.dataLayer = browser.dataLayer || [];
    browser.gtag = function () { browser.dataLayer!.push(arguments); };
    browser.gtag("consent", "default", {
      ad_storage: "denied", analytics_storage: "denied", ad_user_data: "denied", ad_personalization: "denied",
    });
    browser.gtag("set", {
      ...safeContext(url), allow_ad_personalization_signals: false, allow_google_signals: false,
      allow_enhanced_conversions: false, url_passthrough: false, ads_data_redaction: true,
    });
    browser.gtag("consent", "update", {
      ad_storage: "granted", analytics_storage: "denied", ad_user_data: "granted", ad_personalization: "denied",
    });
    browser.gtag("js", new Date());
    browser.gtag("config", GOOGLE_ADS_ID, {
      ...safeContext(url), send_page_view: false, allow_ad_personalization_signals: false,
      allow_enhanced_conversions: false,
    });
    const script = doc.createElement("script");
    script.id = "echelon-google-ads";
    script.async = true;
    script.referrerPolicy = "no-referrer";
    script.src = `https://www.googletagmanager.com/gtag/js?id=${GOOGLE_ADS_ID}`;
    doc.head.appendChild(script);
  }

  function flushPurchase() {
    if (!pending || !canSend() || browser.location.pathname !== "/purchase-success") return;
    const conversion = pending;
    const key = `echelon:ads-order:${conversion.transactionId}`;
    if (sent.has(key)) { pending = null; return; }
    try { if (browser.localStorage.getItem(key) === "1") { pending = null; return; } } catch { /* use in-memory and Google's transaction ID */ }
    initialize("https://echeloninstitute.ca/purchase-success");
    // Rebuild the payload. The verification response's email and other fields are never forwarded.
    browser.gtag!("event", "conversion", {
      ...safeContext("https://echeloninstitute.ca/purchase-success"),
      send_to: conversion.sendTo, value: conversion.value, currency: conversion.currency,
      transaction_id: conversion.transactionId, allow_ad_personalization_signals: false,
    });
    sent.add(key);
    try { browser.localStorage.setItem(key, "1"); } catch { /* Google still deduplicates the same transaction ID */ }
    pending = null;
  }

  function update() {
    if (!canSend()) return;
    const url = googleAdsPage(browser.location.href);
    if (!url) {
      lastPage = null;
      // No private page event. Reset the global context before any explicit conversion.
      if (initialized) browser.gtag!("set", safeContext());
      if (browser.location.pathname !== "/purchase-success") pending = null;
      flushPurchase();
      return;
    }
    initialize(url);
    browser.gtag!("set", safeContext(url));
    if (lastPage !== url) {
      browser.gtag!("event", "page_view", { ...safeContext(url), send_to: GOOGLE_ADS_ID });
      lastPage = url;
    }
  }

  function recordPurchase(value: unknown) {
    if (!validAdsConversion(value) || browser.location.pathname !== "/purchase-success") return;
    // Keep only four validated fields in memory until consent. No customer or session ID.
    pending = { sendTo: value.sendTo, value: value.value, currency: value.currency, transactionId: value.transactionId };
    flushPurchase();
  }

  return { update, recordPurchase };
}

let runtime: ReturnType<typeof createGoogleAdsMeasurement> | null = null;
export function adsMeasurement() {
  if (!runtime && typeof window !== "undefined") runtime = createGoogleAdsMeasurement(window, document);
  return runtime;
}

export function setAdsChoice(choice: Exclude<AdsChoice, null>) {
  const previous = readAdsChoice(window);
  try { window.localStorage.setItem(ADS_CHOICE_KEY, choice); } catch { return false; }
  if (choice === "denied" && previous === "allowed") {
    // A loaded vendor cannot be unloaded reliably. Clear only its first-party
    // attribution cookies and reload to guarantee no further Google script runs.
    for (const cookie of document.cookie.split(";")) {
      const name = cookie.split("=")[0].trim();
      if (!/^_gcl_|^_gac_/.test(name)) continue;
      for (const domain of ["", ";domain=echeloninstitute.ca", ";domain=.echeloninstitute.ca"]) {
        document.cookie = `${name}=;Max-Age=0;path=/;Secure;SameSite=Lax${domain}`;
      }
    }
    window.location.reload();
    return true;
  }
  window.dispatchEvent(new Event(ADS_CHOICE_EVENT));
  adsMeasurement()?.update();
  return true;
}

declare global {
  interface Navigator { globalPrivacyControl?: boolean; }
}
