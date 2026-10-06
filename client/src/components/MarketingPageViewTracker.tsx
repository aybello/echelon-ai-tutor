import { useEffect } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { getAnonymousAnalyticsId } from "@/lib/anonymousAnalytics";
import { getMarketingAttribution } from "@/lib/marketingAnalytics";

export const MARKETING_PAGE_IDS = [
  "home",
  "pricing",
  "teams",
  "courses",
  "wpi",
  "us",
  "us-courses",
  "continuing-education",
  "partnerships",
  "careers",
  "course-detail",
  "canada-course-detail",
] as const;

export type MarketingPageId = typeof MARKETING_PAGE_IDS[number];

export function marketingPageIdForPath(path: string): MarketingPageId | null {
  if (path === "/") return "home";
  if (path === "/pricing") return "pricing";
  if (path === "/teams") return "teams";
  if (path === "/courses") return "courses";
  if (path === "/wpi") return "wpi";
  if (path === "/us") return "us";
  if (path === "/us/courses") return "us-courses";
  if (path === "/continuing-education") return "continuing-education";
  if (path === "/partnerships") return "partnerships";
  if (path === "/careers") return "careers";
  if (/^\/courses\/[a-z0-9-]+$/i.test(path)) return "course-detail";
  if (/^\/canada\/[a-z0-9-]+$/i.test(path)) return "canada-course-detail";
  return null;
}

/**
 * Records one privacy-safe public page view per canonical page and source
 * category for the active browser session. It excludes raw paths, referrers,
 * names, emails, and IP addresses.
 */
export default function MarketingPageViewTracker() {
  const [path] = useLocation();
  const track = trpc.funnelAnalytics.track.useMutation();

  useEffect(() => {
    const page = marketingPageIdForPath(path);
    if (!page) return;
    const attribution = getMarketingAttribution(path);
    const sessionKey = `echelon:marketing-page:${page}:${attribution.source}`;

    try {
      if (sessionStorage.getItem(sessionKey) === "1") return;
      sessionStorage.setItem(sessionKey, "1");
    } catch {
      // Private browsing storage failures should not block page rendering.
    }

    track.mutate({
      event: "marketing_page_viewed",
      page,
      visitorId: getAnonymousAnalyticsId(),
      ...attribution,
    });
  // Tracking must run once for each client-side path change. The mutation
  // identity is intentionally excluded to avoid duplicate events.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [path]);

  return null;
}
