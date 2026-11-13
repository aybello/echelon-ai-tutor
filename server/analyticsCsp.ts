/** Project configuration controls this origin; no user request supplies it. */
export function analyticsCspOrigin(value: string | undefined): string[] {
  if (!value || value.includes('%')) return [];
  try {
    const url = new URL(value);
    if (url.protocol !== 'https:' || url.username || url.password || url.port || /[\s*;]/.test(url.hostname)) return [];
    return [url.origin];
  } catch { return []; }
}

// Named Google Ads endpoints only, not a broad google.com script wildcard.
export const GOOGLE_ADS_SCRIPT_ORIGINS = ["https://www.googletagmanager.com", "https://www.googleadservices.com"];
export const GOOGLE_ADS_CONNECT_ORIGINS = [
  "https://www.googletagmanager.com", "https://www.googleadservices.com",
  "https://googleads.g.doubleclick.net", "https://ad.doubleclick.net", "https://pagead2.googlesyndication.com",
  "https://www.google.com", "https://www.google.ca",
];
export const GOOGLE_ADS_FRAME_ORIGINS = ["https://www.googletagmanager.com"];
