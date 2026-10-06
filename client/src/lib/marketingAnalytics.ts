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

const MARKETING_SOURCE_SESSION_KEY = "echelon:marketing-source";
const SEARCH_HOSTS = [
  "google.com",
  "google.ca",
  "bing.com",
  "duckduckgo.com",
  "search.brave.com",
  "yahoo.com",
] as const;
const SOCIAL_HOSTS = [
  "facebook.com",
  "instagram.com",
  "linkedin.com",
  "tiktok.com",
  "x.com",
  "twitter.com",
  "youtube.com",
] as const;

function isKnownHost(hostname: string, knownHosts: readonly string[]) {
  const normalizedHost = hostname.trim().toLowerCase().replace(/\.$/, "");
  return knownHosts.some((host) => normalizedHost === host || normalizedHost.endsWith(`.${host}`));
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

export function resolveSessionMarketingSource(
  derivedSource: MarketingSource,
  storedSource: string | null | undefined,
  hasCampaignParameters = false,
): MarketingSource {
  const priorSource = MARKETING_SOURCES.includes(storedSource as MarketingSource)
    ? storedSource as MarketingSource
    : null;
  // document.referrer remains the original document referrer during SPA
  // navigation. Once a session source exists, retain it unless an explicit
  // campaign URL establishes a new source.
  return hasCampaignParameters ? "campaign" : priorSource ?? derivedSource;
}

/** Browser-only wrapper. It stores only a five-value acquisition label per browser session. */
export function getMarketingAttribution(path?: string): MarketingAttribution {
  if (typeof window === "undefined") {
    return deriveMarketingAttribution({ path: path ?? "/" });
  }

  const attribution = deriveMarketingAttribution({
    path: path ?? window.location.pathname,
    search: window.location.search,
    referrer: document.referrer,
    viewportWidth: window.innerWidth,
    origin: window.location.origin,
  });

  try {
    const hasCampaignParameters = Boolean(
      new URLSearchParams(window.location.search).get("utm_source")?.trim(),
    );
    const source = resolveSessionMarketingSource(
      attribution.source,
      sessionStorage.getItem(MARKETING_SOURCE_SESSION_KEY),
      hasCampaignParameters,
    );
    sessionStorage.setItem(MARKETING_SOURCE_SESSION_KEY, source);
    return { ...attribution, source };
  } catch {
    // Private browsing storage failures should not affect the buyer path.
    return attribution;
  }
}
