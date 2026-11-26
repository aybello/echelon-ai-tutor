/**
 * useGeoRegion — lightweight timezone-based region detection
 *
 * Returns "CA" for Canadian visitors, "US" for US visitors, and "OTHER" for
 * everyone else. Detection uses the IANA timezone from Intl.DateTimeFormat,
 * which is available in all modern browsers with no network round-trip.
 *
 * The result is cached in localStorage so it does not flicker on re-renders.
 * Users can override via ?region=US or ?region=CA query param (useful for testing).
 */

import { useState } from "react";

export type GeoRegion = "CA" | "US" | "OTHER";

const STORAGE_KEY = "echelon_geo_region";

const CA_TIMEZONES = new Set([
  "America/Toronto",
  "America/Vancouver",
  "America/Edmonton",
  "America/Winnipeg",
  "America/Halifax",
  "America/St_Johns",
  "America/Regina",
  "America/Whitehorse",
  "America/Yellowknife",
  "America/Dawson_Creek",
  "America/Creston",
  "America/Fort_Nelson",
  "America/Dawson",
  "America/Glace_Bay",
  "America/Goose_Bay",
  "America/Moncton",
  "America/Nipigon",
  "America/Pangnirtung",
  "America/Rainy_River",
  "America/Rankin_Inlet",
  "America/Resolute",
  "America/Swift_Current",
  "America/Thunder_Bay",
  "America/Atikokan",
  "America/Cambridge_Bay",
  "America/Inuvik",
]);

const US_TIMEZONE_PREFIXES = [
  "America/New_York",
  "America/Chicago",
  "America/Denver",
  "America/Los_Angeles",
  "America/Phoenix",
  "America/Anchorage",
  "America/Adak",
  "Pacific/Honolulu",
  "America/Indiana",
  "America/Kentucky",
  "America/North_Dakota",
  "America/Detroit",
  "America/Boise",
  "America/Juneau",
  "America/Nome",
  "America/Sitka",
  "America/Yakutat",
  "America/Metlakatla",
];

function detectRegion(): GeoRegion {
  // Check query param override first (useful for testing)
  if (typeof window !== "undefined") {
    const params = new URLSearchParams(window.location.search);
    const override = params.get("region");
    if (override === "US") return "US";
    if (override === "CA") return "CA";
  }

  // Check localStorage cache
  if (typeof window !== "undefined") {
    const cached = localStorage.getItem(STORAGE_KEY);
    if (cached === "CA" || cached === "US" || cached === "OTHER") {
      return cached as GeoRegion;
    }
  }

  // Detect from timezone
  let region: GeoRegion = "OTHER";
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (CA_TIMEZONES.has(tz)) {
      region = "CA";
    } else if (US_TIMEZONE_PREFIXES.some(prefix => tz.startsWith(prefix) || tz === prefix)) {
      region = "US";
    } else if (tz.startsWith("America/")) {
      // Broad Americas fallback — treat non-CA Americas as US for now
      // (covers Puerto Rico, USVI, etc.)
      region = "US";
    }
  } catch {
    // Intl not available — default to CA (existing user base)
    region = "CA";
  }

  // Cache the result
  if (typeof window !== "undefined") {
    try {
      localStorage.setItem(STORAGE_KEY, region);
    } catch {
      // localStorage unavailable — ignore
    }
  }

  return region;
}

let _cachedRegion: GeoRegion | null = null;

export interface GeoRegionResult {
  region: GeoRegion;
  isUS: boolean;
  isCA: boolean;
  isOther: boolean;
}

export function useGeoRegion(): GeoRegionResult {
  const [region] = useState<GeoRegion>(() => {
    if (_cachedRegion) return _cachedRegion;
    _cachedRegion = detectRegion();
    return _cachedRegion;
  });
  return {
    region,
    isUS: region === "US",
    isCA: region === "CA",
    isOther: region === "OTHER",
  };
}

/** Non-hook version for use outside React components */
export function getGeoRegion(): GeoRegion {
  if (_cachedRegion) return _cachedRegion;
  _cachedRegion = detectRegion();
  return _cachedRegion;
}
