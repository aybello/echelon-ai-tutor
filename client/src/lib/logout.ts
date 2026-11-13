import type { QueryClient } from "@tanstack/react-query";
import { IDENTITY_CHANGE_EVENT_KEY, notifyIdentityChange } from "@shared/identityChange";

export const LOGOUT_EVENT_KEY = "echelon.logout.event";

/** Remove device-local identity, paid content, and recoverable learner sessions.
 * Keep unrelated site preferences (for example the theme) intact.
 */
export function clearLearnerStorage(storage: Storage): void {
  const keys: string[] = [];
  for (let i = 0; i < storage.length; i++) {
    const key = storage.key(i);
    if (key && key !== LOGOUT_EVENT_KEY && key !== IDENTITY_CHANGE_EVENT_KEY &&
      (key.startsWith("echelon_") || key.startsWith("echelon.") || key === "manus-runtime-user-info")) {
      keys.push(key);
    }
  }
  for (const key of keys) {
    try { storage.removeItem(key); } catch { /* continue with other keys */ }
  }
}

export async function clearBrowserIdentity(queryClient: QueryClient): Promise<void> {
  // Attempt every cleanup even when cancellation or cache clearing fails.
  let failed = false;
  let failure: unknown;
  try { await queryClient.cancelQueries(); } catch (error) { failed = true; failure = error; }
  try { queryClient.clear(); } catch (error) { if (!failed) { failed = true; failure = error; } }
  // Some browsers disable storage; that must not prevent server logout or redirect.
  for (const getStorage of [() => window.localStorage, () => window.sessionStorage]) {
    try { clearLearnerStorage(getStorage()); } catch { /* unavailable */ }
  }
  if (failed) throw failure;
}

export async function finishLogout(queryClient: QueryClient): Promise<void> {
  // Server logout has succeeded. Cleanup should happen first, but a local
  // failure must not suppress cross-tab identity invalidation or redirect.
  try { await clearBrowserIdentity(queryClient); } catch { /* best effort */ }
  try { notifyIdentityChange(); } catch { /* best effort */ }
  try { localStorage.setItem(LOGOUT_EVENT_KEY, crypto.randomUUID()); } catch { /* unavailable */ }
  // Unmount every hook holding a token, paid sample, or learner data in memory.
  window.location.replace("/account");
}

export function watchOtherTabLogout(queryClient: QueryClient): () => void {
  const currentEvent = () => {
    try { return localStorage.getItem(LOGOUT_EVENT_KEY); } catch { return null; }
  };
  const mountedEvent = currentEvent();
  const reset = () => void clearBrowserIdentity(queryClient).then(() => window.location.replace("/account"));
  const onStorage = (event: StorageEvent) => {
    if (event.key !== LOGOUT_EVENT_KEY || !event.newValue) return;
    reset();
  };
  // A page restored from the back/forward cache may have missed storage events.
  const onPageShow = () => { if (currentEvent() !== mountedEvent) reset(); };
  window.addEventListener("storage", onStorage);
  window.addEventListener("pageshow", onPageShow);
  return () => {
    window.removeEventListener("storage", onStorage);
    window.removeEventListener("pageshow", onPageShow);
  };
}
