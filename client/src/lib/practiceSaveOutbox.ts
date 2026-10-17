import { resolveCourseKey } from "@shared/courseRegistry";

export const PRACTICE_SAVE_OUTBOX_KEY = "echelon:practice-save-outbox:v1";
export const PRACTICE_SAVE_OUTBOX_VERSION = 1;

export type PracticeSaveScope = {
  identity: string;
  courseKey: string;
};

export type PendingPracticeSave = {
  version: typeof PRACTICE_SAVE_OUTBOX_VERSION;
  operationId: string;
  /** Only new requests actually sent with operationId may be retried. */
  idempotencyVersion?: 1;
  examType?: string;
  scope: PracticeSaveScope;
  questionId: number;
  attemptToken?: string;
  selectedIndex: number;
  bankKey: string;
  quizMode: "standard" | "quick10" | "missed" | "bookmarked" | "low-confidence";
  sessionId: string;
  confidence?: "low" | "medium" | "high" | null;
  bookmarked?: boolean;
  createdAt: number;
};

type StorageLike = Pick<Storage, "getItem" | "setItem" | "key" | "length"> & Partial<Pick<Storage, "removeItem">>;
const operationPrefix = "echelon:practice-save-outbox:v2:";
const removedPrefix = "echelon:practice-save-outbox:removed:v2:";
const operationKey = (id: string) => operationPrefix + encodeURIComponent(id);
const removedKey = (id: string) => removedPrefix + encodeURIComponent(id);

function isScope(value: unknown): value is PracticeSaveScope {
  if (!value || typeof value !== "object") return false;
  const scope = value as Partial<PracticeSaveScope>;
  return typeof scope.identity === "string" && typeof scope.courseKey === "string";
}

function isPendingPracticeSave(value: unknown): value is PendingPracticeSave {
  if (!value || typeof value !== "object") return false;
  const item = value as Partial<PendingPracticeSave>;
  return item.version === PRACTICE_SAVE_OUTBOX_VERSION
    && typeof item.operationId === "string"
    && isScope(item.scope)
    && Number.isInteger(item.questionId)
    && Number.isInteger(item.selectedIndex)
    && typeof item.bankKey === "string"
    && typeof item.quizMode === "string"
    && typeof item.sessionId === "string"
    && typeof item.createdAt === "number";
}

function readAll(storage: Pick<Storage, "getItem" | "key" | "length">): PendingPracticeSave[] {
  const records = new Map<string, PendingPracticeSave>();
  try {
    const raw = storage.getItem(PRACTICE_SAVE_OUTBOX_KEY);
    try {
      const legacy: unknown = raw ? JSON.parse(raw) : [];
      if (Array.isArray(legacy)) for (const item of legacy.filter(isPendingPracticeSave)) records.set(item.operationId, item);
    } catch { /* A corrupt legacy array must not hide independent records. */ }
    const keys: string[] = [];
    for (let i = 0; i < storage.length; i++) {
      const key = storage.key(i);
      if (key?.startsWith(operationPrefix)) keys.push(key);
    }
    for (const key of keys) {
      try {
        const item: unknown = JSON.parse(storage.getItem(key) ?? "null");
        if (isPendingPracticeSave(item) && key === operationKey(item.operationId)) records.set(item.operationId, item);
      } catch { /* Ignore only this malformed record. */ }
    }
    return [...records.values()].filter(item => storage.getItem(removedKey(item.operationId)) === null);
  } catch { return []; }
}

function sameScope(a: PracticeSaveScope, b: PracticeSaveScope): boolean {
  return a.identity === b.identity && a.courseKey === b.courseKey;
}

export function listPendingPracticeSaves(storage: Pick<Storage, "getItem" | "key" | "length">, scope: PracticeSaveScope): PendingPracticeSave[] {
  return readAll(storage).filter(item => sameScope(item.scope, scope));
}

/** Save before the one network request; an acknowledgement loss is ambiguous. */
export function enqueuePracticeSave(storage: StorageLike, item: PendingPracticeSave): boolean {
  try {
    // Without enumeration a newly persisted record could not be recovered.
    if (typeof storage.key !== "function" || !Number.isInteger(storage.length)) return false;
    // No shared index or read-modify-write: another tab owns different keys.
    storage.setItem(operationKey(item.operationId), JSON.stringify(item));
    return true;
  } catch {
    return false;
  }
}

export function removePendingPracticeSave(storage: StorageLike, operationId: string): boolean {
  try {
    // Keep a durable per-ID acknowledgement, including for untouched v1 arrays.
    // Re-enumeration and old-tab writes can never resurrect this operation.
    storage.setItem(removedKey(operationId), "1");
    try { storage.removeItem?.(operationKey(operationId)); } catch { /* The acknowledgement already prevents replay. */ }
    return true;
  } catch {
    return false;
  }
}

/**
 * Replays only the active learner/course scope. A false response is retained:
 * the client must never claim progress was saved until the server confirms it.
 */
export async function replayPendingPracticeSaves(
  storage: StorageLike,
  scope: PracticeSaveScope,
  save: (item: PendingPracticeSave) => Promise<{ success: boolean }>,
  options: { supportsIdempotency: boolean; isScopeActive: () => boolean },
): Promise<{ saved: number; pending: number }> {
  let saved = 0;
  // Legacy bulk replay is not used by the UI; explicit single-answer recovery validates the original receipt.
  if (!options.supportsIdempotency) return { saved, pending: listPendingPracticeSaves(storage, scope).length };
  for (const item of listPendingPracticeSaves(storage, scope)) {
    if (!options.isScopeActive()) break;
    if (practiceSaveRetryProblem(item, scope)) continue;
    try {
      const result = await save(item);
      if (result.success && removePendingPracticeSave(storage, item.operationId)) saved++;
    } catch {
      // Retain the original operation ID and receipt for an idempotent recovery contract.
    }
  }
  return { saved, pending: listPendingPracticeSaves(storage, scope).length };
}

const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
/** Reject-only checks of browser data. Never evidence of identity, access or a signature. */
export function practiceSaveRetryProblem(item: PendingPracticeSave, scope: PracticeSaveScope, now = Date.now()): string | null {
  if (!sameScope(item.scope, scope)) return "This answer belongs to another verified account or course.";
  if (item.idempotencyVersion !== 1 || !uuid.test(item.operationId)) return "This older answer was not sent with a safe retry ID. It cannot be retried without risking duplicate history.";
  const course = resolveCourseKey(scope.courseKey);
  if (!course?.isActive || course.courseKey !== scope.courseKey || !item.examType ||
      resolveCourseKey(item.examType)?.courseKey !== course.courseKey ||
      resolveCourseKey(item.bankKey)?.courseKey !== course.courseKey) return "The original bank/course cannot be safely matched.";
  if (!Number.isInteger(item.questionId) || item.questionId <= 0 || !Number.isInteger(item.selectedIndex) || item.selectedIndex < 0 || item.selectedIndex > 3 ||
      !uuid.test(item.sessionId) || !["standard", "quick10", "missed", "bookmarked", "low-confidence"].includes(item.quizMode) ||
      (item.confidence != null && !["low", "medium", "high"].includes(item.confidence)) ||
      (item.bookmarked !== undefined && typeof item.bookmarked !== "boolean")) return "The original answer input is incomplete or invalid; it will not be reconstructed.";
  // All banks, including free beta, require a server-issued receipt. Do not mint one.
  try {
    if (typeof item.attemptToken !== "string" || item.attemptToken.length > 16384) throw Error();
    const parts = item.attemptToken.split(".");
    if (parts.length !== 3 || !parts.every(Boolean)) throw Error();
    const payload = JSON.parse(atob(parts[1].replace(/-/g, "+").replace(/_/g, "/"))) as { exp?: unknown };
    if (typeof payload.exp !== "number" || !Number.isFinite(payload.exp)) throw Error();
    if (payload.exp * 1000 <= now) return "The original question receipt has expired. The server cannot safely confirm this retry; it may already have saved the answer.";
  } catch { return "The original question receipt or its expiry is missing or unreadable. This answer cannot be safely retried."; }
  return null;
}

/** Preserve exact submitted learning fields; credentials are checked afresh by the server. */
export function practiceSaveInput(item: PendingPracticeSave, accessToken?: string) {
  return { operationId: item.operationId, examType: item.examType!, questionId: item.questionId,
    selectedIndex: item.selectedIndex, bankKey: item.bankKey, quizMode: item.quizMode,
    sessionId: item.sessionId, confidence: item.confidence, bookmarked: item.bookmarked, attemptToken: item.attemptToken,
    ...(accessToken ? { accessToken } : {}) };
}

export async function retryPendingPracticeSave(storage: StorageLike, scope: PracticeSaveScope, operationId: string,
  save: (input: ReturnType<typeof practiceSaveInput>) => Promise<{ success: boolean }>, isScopeActive: () => boolean,
): Promise<string> {
  const item = listPendingPracticeSaves(storage, scope).find(record => record.operationId === operationId);
  if (!item || !isScopeActive()) return "Account or course changed. No retry was sent.";
  const problem = practiceSaveRetryProblem(item, scope);
  if (problem) return problem;
  try {
    const accessToken = storage.getItem("echelon_access_token") ?? undefined;
    const result = await save(practiceSaveInput(item, accessToken));
    if (!result.success) return "Server did not confirm this answer. It remains pending; access or the original receipt may no longer be valid.";
    return removePendingPracticeSave(storage, operationId)
      ? "Answer confirmed saved to your course history."
      : "Answer confirmed saved, but this browser could not clear its local warning. Dismiss the local record; no server history is deleted.";
  } catch { return "Save still unconfirmed. The original answer and retry ID are retained; no automatic retry was made."; }
}
