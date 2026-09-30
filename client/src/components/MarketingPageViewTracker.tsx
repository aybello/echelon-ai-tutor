import { useEffect } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { getAnonymousAnalyticsId } from "@/lib/anonymousAnalytics";
import { getMarketingAttribution } from "@/lib/marketingAnalytics";

function isMarketingPage(path: string) {
  return path === "/"
    || path === "/pricing"
    || path === "/teams"
    || path === "/courses"
    || path === "/wpi"
    || path === "/us"
    || path === "/us/courses"
    || path === "/continuing-education"
    || path === "/partnerships"
    || path === "/careers"
    || path.startsWith("/courses/")
    || path.startsWith("/canada/");
}

/**
 * Records one privacy-safe public page view per path and source category for
 * the active browser session. It deliberately excludes authenticated learning
 * routes and never sends raw URLs, referrers, names, emails, or IP addresses.
 */
export default function MarketingPageViewTracker() {
  const [path] = useLocation();
  const track = trpc.funnelAnalytics.track.useMutation();

  useEffect(() => {
    if (!isMarketingPage(path)) return;
    const attribution = getMarketingAttribution(path);
    const sessionKey = `echelon:marketing-page:${path}:${attribution.source}`;

    try {
      if (sessionStorage.getItem(sessionKey) === "1") return;
      sessionStorage.setItem(sessionKey, "1");
    } catch {
      // Private browsing storage failures should not block page rendering.
    }

    track.mutate({
      event: "marketing_page_viewed",
      page: path,
      visitorId: getAnonymousAnalyticsId(),
      ...attribution,
    });
  // Tracking must run once for each client-side path change. The mutation
  // identity is intentionally excluded to avoid duplicate events.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [path]);

  return null;
}
