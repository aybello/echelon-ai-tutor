import type { InteractiveCatalogResponse } from "@shared/interactiveSessions";

/** A course only advertises its games when there is enough to play, so nobody lands on a nearly empty page. */
export const GAMES_MIN_ITEMS = 40;

export function catalogHasEnoughGames(catalog: Pick<InteractiveCatalogResponse, "available" | "modes"> | null | undefined): boolean {
  if (!catalog?.available) return false;
  const total = catalog.modes.reduce((sum, mode) => sum + mode.totalCount, 0);
  return total >= GAMES_MIN_ITEMS;
}

export const GAMES_NEW_SEEN_KEY = "echelon_games_new_seen_v1";

export function readGamesNewSeen(): boolean {
  try { return localStorage.getItem(GAMES_NEW_SEEN_KEY) === "1"; } catch { return false; }
}
export function writeGamesNewSeen(): void {
  try { localStorage.setItem(GAMES_NEW_SEEN_KEY, "1"); } catch { /* storage unavailable: the badge just shows again */ }
}
