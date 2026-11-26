/** A change hint, never identity or authorization evidence. */
export const IDENTITY_CHANGE_EVENT_KEY = "echelon.identity-change.event";

/**
 * Self-contained so the OAuth callback can execute this same function in its
 * redirect page. Call only after a successful cookie-changing operation.
 * Delivery is best-effort and must never interrupt the authentication flow.
 */
export function publishIdentityChange(key: string): void {
  try {
    const bytes = new Uint8Array(16);
    globalThis.crypto.getRandomValues(bytes);
    const nonce = Array.from(bytes, byte => byte.toString(16).padStart(2, "0")).join("");
    try { globalThis.localStorage.setItem(key, nonce); } catch { /* unavailable */ }
    try {
      const channel = new BroadcastChannel(key);
      try { channel.postMessage(nonce); } finally { channel.close(); }
    } catch { /* unavailable */ }
  } catch { /* missing secure randomness or non-browser environment */ }
}

/** Convenience wrapper for application sign-in and sign-out flows. */
export function notifyIdentityChange(): void {
  publishIdentityChange(IDENTITY_CHANGE_EVENT_KEY);
}

/**
 * Subscribe to hints from other tabs. The callback must synchronously hide any
 * sensitive working set and reauthorize against the server. Hints do not prove
 * who is signed in. Call the returned function on unmount.
 */
export function watchIdentityChanges(onChange: () => void): () => void {
  if (typeof window === "undefined") return () => {};
  // FIFO history covers interleaved transport deliveries without unbounded growth.
  const maxRecentNonces = 128;
  const recentNonces = new Set<string>();
  let active = true;
  const receive = (nonce: unknown) => {
    if (!active || typeof nonce !== "string" || !/^[0-9a-f]{32}$/.test(nonce) || recentNonces.has(nonce)) return;
    if (recentNonces.size === maxRecentNonces) {
      recentNonces.delete(recentNonces.values().next().value!);
    }
    recentNonces.add(nonce);
    onChange();
  };
  const onStorage = (event: StorageEvent) => {
    if (event.key === IDENTITY_CHANGE_EVENT_KEY) receive(event.newValue);
  };
  window.addEventListener("storage", onStorage);
  let channel: BroadcastChannel | undefined;
  try {
    channel = new BroadcastChannel(IDENTITY_CHANGE_EVENT_KEY);
    channel.onmessage = event => receive(event.data);
  } catch { /* storage events may still work */ }
  return () => {
    if (!active) return;
    active = false;
    recentNonces.clear();
    window.removeEventListener("storage", onStorage);
    try { channel?.close(); } catch { /* unavailable */ }
  };
}
