const ANALYTICS_ORIGIN = "https://echeloninstitute.ca";

const PUBLIC_PAGES: Record<string, string> = {
  "/": "home",
  "/pricing": "pricing",
  "/teams": "teams",
  "/courses": "courses",
  "/wpi": "wpi",
  "/us": "us",
  "/us/courses": "us-courses",
  "/continuing-education": "continuing-education",
  "/partnerships": "partnerships",
  "/about": "about",
  "/jobs": "careers",
  "/blog": "blog",
  "/privacy": "privacy",
  "/terms": "terms",
  "/refund": "refund",
  "/faq": "faq",
};

export function publicAnalyticsPage(rawUrl: string) {
  try {
    const { pathname } = new URL(rawUrl, ANALYTICS_ORIGIN);
    if (Object.hasOwn(PUBLIC_PAGES, pathname)) {
      return { path: pathname, category: PUBLIC_PAGES[pathname] };
    }
    // Dynamic values never leave the browser, even when they look like slugs.
    if (/^\/courses\/[a-z0-9-]+$/i.test(pathname)) {
      return { path: "/courses/:courseKey", category: "course-detail" };
    }
    if (/^\/canada\/[a-z0-9-]+$/i.test(pathname)) {
      return { path: "/canada/:regionSlug", category: "canada-course-detail" };
    }
    if (/^\/blog\/[a-z0-9-]+$/i.test(pathname)) {
      return { path: "/blog/:slug", category: "blog-post" };
    }
  } catch { /* malformed URLs fail closed */ }
  // Authentication, OTP, magic links, invites, claims, activation, account,
  // checkout confirmations, learner and unknown routes are excluded entirely.
  return null;
}

export function createAnalyticsBeforeSend(websiteId: string, currentUrl: () => string) {
  return (type: string, payload: unknown) => {
    if (type !== "event" || !websiteId || !payload || typeof payload !== "object" || Array.isArray(payload)) return false;
    // Umami page views use type "event" with no payload name. A name turns the
    // send into a custom event, which does not count as a standard page view.
    // Reject named calls rather than silently turning arbitrary clicks into views.
    if ("name" in payload) return false;
    const page = publicAnalyticsPage(currentUrl());
    if (!page) return false;
    // Rebuild instead of deleting known bad keys. Unknown event fields, titles,
    // identifiers, query strings, fragments and nested return URLs cannot pass.
    return {
      website: websiteId,
      hostname: "echeloninstitute.ca",
      url: `${ANALYTICS_ORIGIN}${page.path}`,
      referrer: "",
      title: "Echelon Institute",
    };
  };
}

type AnalyticsWindow = Window & {
  umami?: { track: (payload: () => unknown) => unknown };
  echelonAnalyticsBeforeSend?: ReturnType<typeof createAnalyticsBeforeSend>;
};

/** The HTML disables vendor auto-tracking before the template script loads. */
export function startPrivacyAnalytics(browser: AnalyticsWindow, doc: Document) {
  const script = doc.getElementById("echelon-analytics");
  const websiteId = script?.getAttribute("data-website-id") ?? "";
  // A missing template configuration is not a reason to send placeholder events.
  const configuredId = websiteId.includes("%") ? "" : websiteId;
  const beforeSend = createAnalyticsBeforeSend(configuredId, () => browser.location.href);
  browser.echelonAnalyticsBeforeSend = beforeSend;
  let lastPath: string | null = null;

  function emitPageView() {
    const safe = beforeSend("event", {});
    if (!safe) { lastPath = null; return; }
    if (!browser.umami || safe.url === lastPath) return;
    lastPath = safe.url;
    try {
      // Function form avoids the vendor's default raw location/title payload.
      // before-send is still required, including for accidental direct calls.
      const result = browser.umami.track(() => safe);
      if (result && typeof (result as Promise<unknown>).catch === "function") {
        void (result as Promise<unknown>).catch(() => {});
      }
    } catch { /* reporting must not interrupt navigation */ }
  }

  const originalPush = browser.history.pushState;
  const originalReplace = browser.history.replaceState;
  const push: History["pushState"] = function (...args) {
    originalPush.apply(browser.history, args);
    emitPageView();
  };
  const replace: History["replaceState"] = function (...args) {
    originalReplace.apply(browser.history, args);
    emitPageView();
  };
  browser.history.pushState = push;
  browser.history.replaceState = replace;
  browser.addEventListener("popstate", emitPageView);
  script?.addEventListener("load", emitPageView);
  emitPageView();

  return () => {
    if (browser.history.pushState === push) browser.history.pushState = originalPush;
    if (browser.history.replaceState === replace) browser.history.replaceState = originalReplace;
    browser.removeEventListener("popstate", emitPageView);
    script?.removeEventListener("load", emitPageView);
    browser.echelonAnalyticsBeforeSend = () => false;
  };
}
