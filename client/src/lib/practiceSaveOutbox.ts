export const PRACTICE_SAVE_OUTBOX_KEY = "echelon:practice-save-outbox:v1";
export const PRACTICE_SAVE_OUTBOX_VERSION = 1;

export type PracticeSaveScope = {
  identity: string;
  courseKey: string;
};

export type PendingPracticeSave = {
  version: typeof PRACTICE_SAVE_OUTBOX_VERSION;
  operationId: string;
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

type StorageLike = Pick<Storage, "getItem" | "setItem">;

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

function readAll(storage: Pick<Storage, "getItem">): PendingPracticeSave[] {
  try {
    const raw = storage.getItem(PRACTICE_SAVE_OUTBOX_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter(isPendingPracticeSave) : [];
  } catch {
    return [];
  }
}

function sameScope(a: PracticeSaveScope, b: PracticeSaveScope): boolean {
  return a.identity === b.identity && a.courseKey === b.courseKey;
}

export function listPendingPracticeSaves(storage: Pick<Storage, "getItem">, scope: PracticeSaveScope): PendingPracticeSave[] {
  return readAll(storage).filter(item => sameScope(item.scope, scope));
}

/** Save before the one network request; an acknowledgement loss is ambiguous. */
export function enqueuePracticeSave(storage: StorageLike, item: PendingPracticeSave): boolean {
  try {
    const current = readAll(storage);
    const withoutDuplicate = current.filter(existing => existing.operationId !== item.operationId);
    storage.setItem(PRACTICE_SAVE_OUTBOX_KEY, JSON.stringify([...withoutDuplicate, item]));
    return true;
  } catch {
    return false;
  }
}

export function removePendingPracticeSave(storage: StorageLike, operationId: string): boolean {
  try {
    storage.setItem(
      PRACTICE_SAVE_OUTBOX_KEY,
      JSON.stringify(readAll(storage).filter(item => item.operationId !== operationId)),
    );
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
  // No current endpoint supports idempotency. A caller must explicitly prove
  // that contract before enabling replay; the UI deliberately never calls this.
  if (!options.supportsIdempotency) return { saved, pending: listPendingPracticeSaves(storage, scope).length };
  for (const item of listPendingPracticeSaves(storage, scope)) {
    if (!options.isScopeActive()) break;
    try {
      const result = await save(item);
      if (result.success && removePendingPracticeSave(storage, item.operationId)) saved++;
    } catch {
      // Retain the original operation ID and receipt for an idempotent recovery contract.
    }
  }
  return { saved, pending: listPendingPracticeSaves(storage, scope).length };
}
