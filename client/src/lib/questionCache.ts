/**
 * questionCache — localStorage-backed cache for question banks.
 *
 * Each bank is stored under the key `echelon_qbank_v1_<bankKey>` with a
 * 24-hour TTL. On cache hit the data is returned instantly; on miss the
 * caller fetches from the DB and writes back via `set()`.
 *
 * Cache schema:
 *   { ts: number, questions: DBQuestion[], modules: string[], ... }
 */

import type { DBQuestion, ModuleOverview } from "@/hooks/useQuestionBank";

const CACHE_PREFIX = "echelon_qbank_v1_";
const TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

export interface CachedBank {
  ts: number;
  questions: DBQuestion[];
  modules: string[];
  moduleTargets: Record<string, number> | null;
  formulaLinks: Record<string, string> | null;
  totalQuestions: number;
  overviews: Record<string, ModuleOverview> | null;
}

function key(bankKey: string) {
  return `${CACHE_PREFIX}${bankKey}`;
}

export function getCached(bankKey: string): CachedBank | null {
  try {
    const raw = localStorage.getItem(key(bankKey));
    if (!raw) return null;
    const parsed: CachedBank = JSON.parse(raw);
    if (Date.now() - parsed.ts > TTL_MS) {
      localStorage.removeItem(key(bankKey));
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export function setCached(bankKey: string, data: Omit<CachedBank, "ts">) {
  try {
    const entry: CachedBank = { ts: Date.now(), ...data };
    localStorage.setItem(key(bankKey), JSON.stringify(entry));
  } catch {
    // localStorage quota exceeded or unavailable — silently skip
  }
}

export function invalidate(bankKey: string) {
  try {
    localStorage.removeItem(key(bankKey));
  } catch {
    // ignore
  }
}

export function invalidateAll() {
  try {
    const toRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && k.startsWith(CACHE_PREFIX)) toRemove.push(k);
    }
    toRemove.forEach((k) => localStorage.removeItem(k));
  } catch {
    // ignore
  }
}
