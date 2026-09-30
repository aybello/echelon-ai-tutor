export const MARKETING_SOURCES = [
  "campaign",
  "direct",
  "organic",
  "referral",
  "social",
] as const;

export type MarketingSource = typeof MARKETING_SOURCES[number];
export type MarketingDevice = "desktop" | "mobile" | "tablet";
export type MarketingProvince = "ontario" | "western" | "unknown";

export interface MarketingAttribution {
  source: MarketingSource;
  device: MarketingDevice;
  province: MarketingProvince;
}

const SEARCH_HOSTS = ["google.", "bing.com", "duckduckgo.com", "search.brave.com", "yahoo."];
const SOCIAL_HOSTS = ["facebook.com", "instagram.com", "linkedin.com", "tiktok.com", "x.com", "twitter.com", "youtube.com"];

function isKnownHost(hostname: string, knownHosts: readonly string[]) {
  return knownHosts.some((host) => hostname === host || hostname.endsWith(`.${host}`) || hostname.includes(host));
}

export function marketingProvinceForPath(path: string): MarketingProvince {
  if (path.startsWith("/wpi") || path.startsWith("/us") || path.includes("western")) return "western";
  if (path.startsWith("/canada/") || path === "/" || path === "/pricing" || path === "/teams") return "ontario";
  return "unknown";
}

export function marketingDeviceForWidth(width: number): MarketingDevice {
  if (width < 768) return "mobile";
  if (width < 1100) return "tablet";
  return "desktop";
}

export function deriveMarketingAttribution({
  path,
  search = "",
  referrer = "",
  viewportWidth = 1440,
  origin = "https://echeloninstitute.ca",
}: {
  path: string;
  search?: string;
  referrer?: string;
  viewportWidth?: number;
  origin?: string;
}): MarketingAttribution {
  const params = new URLSearchParams(search);
  const utmSource = params.get("utm_source")?.trim() || undefined;
  const utmMedium = params.get("utm_medium")?.trim() || undefined;
  const utmCampaign = params.get("utm_campaign")?.trim() || undefined;

  let source: MarketingSource = utmSource ? "campaign" : "direct";
  if (!utmSource && referrer) {
    try {
      const referrerUrl = new URL(referrer);
      if (referrerUrl.origin !== origin) {
        source = isKnownHost(referrerUrl.hostname, SEARCH_HOSTS)
          ? "organic"
          : isKnownHost(referrerUrl.hostname, SOCIAL_HOSTS)
            ? "social"
            : "referral";
      }
    } catch {
      source = "referral";
    }
  }

  return {
    source,
    device: marketingDeviceForWidth(viewportWidth),
    province: marketingProvinceForPath(path),
  };
}

/** Browser-only wrapper. It returns coarse categories only, never a URL or referrer. */
export function getMarketingAttribution(path?: string): MarketingAttribution {
  if (typeof window === "undefined") {
    return deriveMarketingAttribution({ path: path ?? "/" });
  }
  return deriveMarketingAttribution({
    path: path ?? window.location.pathname,
    search: window.location.search,
    referrer: document.referrer,
    viewportWidth: window.innerWidth,
    origin: window.location.origin,
  });
}
