import { useEffect } from "react";

const UTM_STORAGE_KEY = "echelon_utm";

export interface UtmParams {
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
}

/**
 * Reads UTM parameters from the current URL and persists them to sessionStorage.
 * Returns the stored UTM params (first-touch attribution).
 */
export function useUtm(): UtmParams {
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const source = params.get("utm_source");
    const medium = params.get("utm_medium");
    const campaign = params.get("utm_campaign");

    // Only store if we have at least one UTM param and nothing stored yet (first-touch)
    if (source || medium || campaign) {
      const existing = sessionStorage.getItem(UTM_STORAGE_KEY);
      if (!existing) {
        sessionStorage.setItem(
          UTM_STORAGE_KEY,
          JSON.stringify({ utmSource: source, utmMedium: medium, utmCampaign: campaign })
        );
      }
    }
  }, []);

  try {
    const stored = sessionStorage.getItem(UTM_STORAGE_KEY);
    return stored ? JSON.parse(stored) : {};
  } catch {
    return {};
  }
}

export function getStoredUtm(): UtmParams {
  try {
    const stored = sessionStorage.getItem(UTM_STORAGE_KEY);
    return stored ? JSON.parse(stored) : {};
  } catch {
    return {};
  }
}
