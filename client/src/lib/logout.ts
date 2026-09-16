import type { QueryClient } from "@tanstack/react-query";

export const LOGOUT_EVENT_KEY = "echelon.logout.event";

/** Remove device-local identity, paid content, and recoverable learner sessions.
 * Keep unrelated site preferences (for example the theme) intact.
 */
export function clearLearnerStorage(storage: Storage): void {
  const keys: string[] = [];
  for (let i = 0; i < storage.length; i++) {
    const key = storage.key(i);
    if (key && key !== LOGOUT_EVENT_KEY &&
      (key.startsWith("echelon_") || key.startsWith("echelon.") || key === "manus-runtime-user-info")) {
      keys.push(key);
    }
  }
  for (const key of keys) storage.removeItem(key);
}

export async function clearBrowserIdentity(queryClient: QueryClient): Promise<void> {
  await queryClient.cancelQueries();
  queryClient.clear();
  // Some browsers disable storage; that must not prevent server logout or redirect.
  for (const getStorage of [() => window.localStorage, () => window.sessionStorage]) {
    try { clearLearnerStorage(getStorage()); } catch { /* unavailable */ }
  }
}

export async function finishLogout(queryClient: QueryClient): Promise<void> {
  await clearBrowserIdentity(queryClient);
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
