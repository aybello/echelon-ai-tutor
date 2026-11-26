const VISITOR_KEY = "echelon_analytics_visitor_v1";

/**
 * Stable, pseudonymous browser identifier used only to connect anonymous
 * product events into a journey. The server hashes it before persistence.
 */
export function getAnonymousAnalyticsId(): string {
  try {
    const existing = localStorage.getItem(VISITOR_KEY);
    if (existing && /^[a-zA-Z0-9_-]{16,128}$/.test(existing)) return existing;
    const created = typeof crypto?.randomUUID === "function"
      ? crypto.randomUUID()
      : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}-${Math.random().toString(36).slice(2)}`;
    localStorage.setItem(VISITOR_KEY, created);
    return created;
  } catch {
    return "browser-storage-unavailable";
  }
}
