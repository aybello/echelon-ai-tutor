/**
 * useGuestSession — manages a stable guest identity for unauthenticated users.
 *
 * Generates a UUID on first visit and persists it to localStorage under
 * "echelon_guest_id". This lets guests save Command runs to the DB and appear
 * on the leaderboard without creating an account.
 *
 * The hook also stores a human-readable display name ("Guest Operator #XXXX")
 * derived from the last 4 hex digits of the UUID so the leaderboard entry is
 * recognisable across sessions.
 */
import { useMemo } from "react";

const GUEST_ID_KEY = "echelon_guest_id";
const GUEST_NAME_KEY = "echelon_guest_name";

function generateGuestId(): string {
  // crypto.randomUUID is available in all modern browsers
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  // Fallback for older environments
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

function getOrCreateGuestId(): string {
  try {
    const existing = localStorage.getItem(GUEST_ID_KEY);
    if (existing) return existing;
    const id = generateGuestId();
    localStorage.setItem(GUEST_ID_KEY, id);
    return id;
  } catch {
    // localStorage blocked (private browsing, etc.) — return ephemeral id
    return generateGuestId();
  }
}

function getOrCreateGuestName(guestId: string): string {
  try {
    const existing = localStorage.getItem(GUEST_NAME_KEY);
    if (existing) return existing;
    // Use last 4 hex chars of the UUID as a short identifier
    const suffix = guestId.replace(/-/g, "").slice(-4).toUpperCase();
    const name = `Guest Operator #${suffix}`;
    localStorage.setItem(GUEST_NAME_KEY, name);
    return name;
  } catch {
    return "Guest Operator";
  }
}

export interface GuestSession {
  guestId: string;
  displayName: string;
}

export function useGuestSession(): GuestSession {
  return useMemo(() => {
    const guestId = getOrCreateGuestId();
    const displayName = getOrCreateGuestName(guestId);
    return { guestId, displayName };
  }, []);
}
