const KEY = "echelon_suggestion_handled_at_v1";
export const SUGGESTION_COOLDOWN_MS = 30 * 24 * 60 * 60 * 1000;

/** Browser-local preference only. Never use browser storage as verified identity. */
export function canInviteSuggestion(now = Date.now()): boolean {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw === null) return true;
    const handled = Number(raw);
    return Number.isFinite(handled) && handled > 0 && now >= handled && now - handled >= SUGGESTION_COOLDOWN_MS;
  } catch { return false; }
}
export function markSuggestionHandled(now = Date.now()): void {
  try { localStorage.setItem(KEY, String(now)); } catch { /* Manual entry remains available. */ }
}
