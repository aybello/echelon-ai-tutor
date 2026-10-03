import { describe, expect, it, vi } from "vitest";
import { createAnalyticsBeforeSend, publicAnalyticsPage, startPrivacyAnalytics } from "./privacyAnalytics";

const sensitive = [
  "/login", "/login/otp", "/auth/magic", "/auth/callback", "/invite/token",
  "/team/invite", "/course-pass/claim", "/activate/oit", "/purchase-success",
  "/subscription-success", "/account", "/team", "/dashboard", "/unknown/token",
];
const privateQuery = "?email=learner%40example.com&token=synthetic-only-token&session_id=cs_test_synthetic&next=%2Fauth%2Fmagic%3Ftoken%3Dnested-synthetic#secret";

function harness(initialPath: string, ready = true, websiteId = "synthetic-website") {
  const location = { href: `https://site.test${initialPath}` };
  const browserEvents = new Map<string, () => void>();
  const scriptEvents = new Map<string, () => void>();
  const requests: unknown[] = [];
  const browser = {
    location,
    history: {
      pushState: vi.fn((_data: unknown, _unused: string, url?: string | URL | null) => { if (url) location.href = new URL(url, location.href).href; }),
      replaceState: vi.fn((_data: unknown, _unused: string, url?: string | URL | null) => { if (url) location.href = new URL(url, location.href).href; }),
    },
    addEventListener: vi.fn((name: string, callback: () => void) => browserEvents.set(name, callback)),
    removeEventListener: vi.fn((name: string) => browserEvents.delete(name)),
    echelonAnalyticsBeforeSend: undefined as ReturnType<typeof createAnalyticsBeforeSend> | undefined,
    umami: undefined as { track: (value: unknown) => Promise<void> } | undefined,
  };
  function attachVendor() {
    browser.umami = {
      track: async (value: unknown) => {
        const input = typeof value === "function" ? value() : value;
        const clean = browser.echelonAnalyticsBeforeSend?.("event", input);
        if (clean) requests.push({ type: "event", payload: clean });
      },
    };
  }
  if (ready) attachVendor();
  const script = {
    getAttribute: (name: string) => name === "data-website-id" ? websiteId : null,
    addEventListener: (name: string, callback: () => void) => scriptEvents.set(name, callback),
    removeEventListener: (name: string) => scriptEvents.delete(name),
  };
  const doc = { getElementById: () => script };
  return { browser, doc, location, requests, browserEvents, scriptEvents, attachVendor };
}

function start(h: ReturnType<typeof harness>) {
  return startPrivacyAnalytics(h.browser as unknown as Window, h.doc as unknown as Document);
}

describe("third-party analytics privacy boundary", () => {
  it.each(sensitive)("excludes initial sensitive load %s completely", path => {
    const h = harness(path + privateQuery);
    start(h);
    expect(h.requests).toEqual([]);
    expect(h.browser.echelonAnalyticsBeforeSend?.("event", { name: "public_page_view" })).toBe(false);
  });

  it("rebuilds allowed events without URL/referrer queries, identifying titles or arbitrary fields", () => {
    const clean = createAnalyticsBeforeSend("synthetic-website", () => `https://site.test/pricing${privateQuery}`);
    const result = clean("event", {
      name: "public_page_view", url: "/auth/magic?token=synthetic-only-token",
      referrer: "https://site.test/login/otp?email=learner@example.com",
      title: "Sample Learner", id: "synthetic-user", website: "overridden",
      data: { email: "learner@example.com", token: "nested-synthetic", title: "Sample Learner" },
    });
    expect(result).toEqual({
      website: "synthetic-website", hostname: "echeloninstitute.ca",
      url: "https://echeloninstitute.ca/pricing", referrer: "", title: "Echelon Institute",
      name: "public_page_view", data: { category: "pricing" },
    });
    expect(clean("identify", { name: "public_page_view" })).toBe(false);
    expect(clean("event", { name: "arbitrary-event", data: { token: "synthetic" } })).toBe(false);
    expect(clean("event", null)).toBe(false);
  });

  it("templates dynamic paths without exporting the slug", () => {
    expect(publicAnalyticsPage("/courses/learner-secret-slug?token=synthetic")).toEqual({ path: "/courses/:courseKey", category: "course-detail" });
    expect(publicAnalyticsPage("/blog/learner-secret-slug")).toEqual({ path: "/blog/:slug", category: "blog-post" });
    expect(publicAnalyticsPage("/courses/learner%40example.com")).toBeNull();
  });

  it("intercepts only scrubbed events across push, replace and popstate navigation", async () => {
    const h = harness(`/pricing${privateQuery}`);
    const stop = start(h);
    expect(h.requests).toHaveLength(1);
    for (const path of sensitive) {
      h.browser.history.pushState({}, "Sample Learner", path + privateQuery);
      await h.browser.umami?.track({ name: "public_page_view", data: { token: "synthetic" } });
    }
    expect(h.requests).toHaveLength(1);
    h.browser.history.replaceState({}, "Private Title", `/teams${privateQuery}`);
    expect(h.requests).toHaveLength(2);
    h.location.href = `https://site.test/auth/magic${privateQuery}`;
    h.browserEvents.get("popstate")?.();
    expect(h.requests).toHaveLength(2);
    h.location.href = `https://site.test/blog/secret-slug${privateQuery}`;
    h.browserEvents.get("popstate")?.();
    expect(h.requests).toHaveLength(3);
    const serialized = JSON.stringify(h.requests);
    for (const value of ["learner", "synthetic-only-token", "nested-synthetic", "secret-slug", "cs_test", "Private Title"]) expect(serialized).not.toContain(value);
    expect(serialized).not.toContain("?");
    expect(serialized).not.toContain("#");
    stop();
    expect(h.browser.echelonAnalyticsBeforeSend?.("event", { name: "public_page_view" })).toBe(false);
  });

  it("waits for the deferred tracker, uses the current route, and disables missing configuration", () => {
    const h = harness("/pricing", false);
    start(h);
    h.browser.history.pushState({}, "", `/auth/magic${privateQuery}`);
    h.attachVendor();
    h.scriptEvents.get("load")?.();
    expect(h.requests).toEqual([]);
    h.browser.history.pushState({}, "", `/pricing${privateQuery}`);
    expect(h.requests).toHaveLength(1);
    const missing = harness("/pricing", true, "%VITE_ANALYTICS_WEBSITE_ID%");
    start(missing);
    expect(missing.requests).toEqual([]);
  });
});
