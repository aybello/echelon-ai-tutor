import { readAdsChoice } from "./googleAds";
import type { GamePlayEvent } from "@shared/gameAnalytics";

const KEY = "echelon:game-browser:v1";
/** A random browser token, not a person or a fingerprint. Storage failure opts out. */
export function gameAnalyticsVisitor(): string | undefined {
  try {
    if (readAdsChoice(window) === "denied" || localStorage.getItem("umami.disabled") === "true") return;
    const existing = localStorage.getItem(KEY);
    if (existing && /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(existing)) return existing;
    const token = crypto.randomUUID();
    localStorage.setItem(KEY, token);
    return token;
  } catch { return; }
}
/** Ordered so completion cannot overtake the last answer. Never awaited by gameplay. */
export function createGameReporter(send: (event: GamePlayEvent) => Promise<unknown>) {
  let pending = Promise.resolve();
  let queued = 0;
  return (event: GamePlayEvent) => {
    if (queued >= 200) return;
    queued++;
    pending = pending.then(async () => { await send(event); }).catch(() => {}).finally(() => { queued--; });
  };
}
