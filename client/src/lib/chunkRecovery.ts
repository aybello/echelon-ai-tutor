export const CHUNK_RETRY_KEY = "echelon:chunk-retry";
export const CHUNK_RETRY_COOLDOWN_MS = 5 * 60_000;

/** Browser messages for a failed module download, not arbitrary render errors. */
export function isChunkLoadError(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;
  const message = (error as { message?: unknown }).message;
  return typeof message === "string" && /Failed to fetch dynamically imported module|Importing a module script failed|error loading dynamically imported module|Loading chunk [\w-]+ failed|Unable to preload CSS for/i.test(message);
}

type RecoveryBrowser = {
  navigator: { onLine: boolean };
  sessionStorage: Pick<Storage, "getItem" | "setItem">;
  location: { reload(): void };
};

/** One shared controller is used by unhandled failures and React, preventing duplicate reloads. */
export function createChunkRecovery(browser: RecoveryBrowser, now = Date.now) {
  let reloading = false;
  return (error: unknown): boolean => {
    if (!isChunkLoadError(error) || reloading || browser.navigator.onLine === false) return false;
    try {
      const saved = browser.sessionStorage.getItem(CHUNK_RETRY_KEY);
      const previous = saved === null ? NaN : Number(saved);
      const timestamp = now();
      if (Number.isFinite(previous) && timestamp - previous < CHUNK_RETRY_COOLDOWN_MS) return false;
      // Persist before navigating. If storage is disabled, never risk an automatic loop.
      browser.sessionStorage.setItem(CHUNK_RETRY_KEY, String(timestamp));
      reloading = true;
      // Current HTML is no-store. Keep the entire course URL, query and hash intact.
      browser.location.reload();
      return true;
    } catch {
      return false;
    }
  };
}

let recover: ReturnType<typeof createChunkRecovery> | undefined;
export function recoverChunkLoad(error: unknown): boolean {
  if (typeof window === "undefined") return false;
  recover ??= createChunkRecovery(window);
  return recover(error);
}

/** Locally caught optional imports retain their own fallback without losing the lesson. */
export function installChunkLoadRecovery(target: Window, attemptRecovery = recoverChunkLoad) {
  const onFailure = (event: Event) => {
    const reason = (event as PromiseRejectionEvent).reason;
    if (attemptRecovery(reason)) event.preventDefault();
    // React lazy route failures reach the root ErrorBoundary. Only truly unhandled
    // imports arrive here, after optional component fallbacks had a chance to catch.
  };
  target.addEventListener("unhandledrejection", onFailure);
  return () => target.removeEventListener("unhandledrejection", onFailure);
}
