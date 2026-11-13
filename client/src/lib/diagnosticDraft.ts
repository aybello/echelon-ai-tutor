export const DIAGNOSTIC_DRAFT_STORAGE_KEY = "echelon:diagnostic-draft:v1";
export const DIAGNOSTIC_DRAFT_VERSION = 1;

export type DiagnosticDraftScope = {
  identity: string;
  courseKey: string;
};

export type DiagnosticDraft = {
  version: typeof DIAGNOSTIC_DRAFT_VERSION;
  scope: DiagnosticDraftScope;
  sessionId: string;
  questionIds: number[];
  answers: Record<number, number>;
  questionIndex: number;
  updatedAt: number;
};

type StorageLike = Pick<Storage, "getItem" | "setItem">;

/** Inputs must come from authenticated OAuth / OTP state, never browser storage. */
export function resolveDiagnosticDraftIdentity(oauthUserId: number | null | undefined, verifiedOtpEmail: string | null | undefined): string | null {
  return oauthUserId != null ? `user:${oauthUserId}` : verifiedOtpEmail?.trim().toLowerCase() || null;
}

export function createDiagnosticDraftScope(identity: string | null | undefined, courseKey: string): DiagnosticDraftScope | null {
  const normalizedIdentity = identity?.trim().toLowerCase();
  const normalizedCourse = courseKey.trim();
  return normalizedIdentity && normalizedCourse
    ? { identity: normalizedIdentity, courseKey: normalizedCourse }
    : null;
}

/** Only the server-authenticated OAuth user's own email is a legacy alias.
 * Never pass an OTP email or a browser-stored identity as oauthEmail.
 */
export function resolveVerifiedLegacyDiagnosticScope(
  oauthUserId: number | null | undefined,
  oauthEmail: string | null | undefined,
  courseKey: string,
): DiagnosticDraftScope | null {
  return oauthUserId != null && oauthEmail?.includes("@")
    ? createDiagnosticDraftScope(oauthEmail, courseKey)
    : null;
}

function isScope(value: unknown): value is DiagnosticDraftScope {
  if (!value || typeof value !== "object") return false;
  const scope = value as Partial<DiagnosticDraftScope>;
  return typeof scope.identity === "string" && typeof scope.courseKey === "string";
}

function isDraft(value: unknown): value is DiagnosticDraft {
  if (!value || typeof value !== "object") return false;
  const draft = value as Partial<DiagnosticDraft>;
  return draft.version === DIAGNOSTIC_DRAFT_VERSION
    && isScope(draft.scope)
    && typeof draft.sessionId === "string"
    && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(draft.sessionId)
    && Array.isArray(draft.questionIds)
    && draft.questionIds.every(Number.isInteger)
    && !!draft.answers
    && typeof draft.answers === "object"
    && !Array.isArray(draft.answers)
    && Number.isInteger(draft.questionIndex)
    && typeof draft.updatedAt === "number" && Number.isFinite(draft.updatedAt);
}

function sameScope(a: DiagnosticDraftScope, b: DiagnosticDraftScope): boolean {
  return a.identity === b.identity && a.courseKey === b.courseKey;
}

// JSON tuple encoding keeps identity/course boundaries unambiguous.
const scopedKey = (scope: DiagnosticDraftScope) => "echelon:diagnostic-draft:v2:" + JSON.stringify([scope.identity, scope.courseKey]);
const legacyRemovedKey = (scope: DiagnosticDraftScope, sessionId: string) => "echelon:diagnostic-draft:removed:v2:" + JSON.stringify([scope.identity, scope.courseKey, sessionId]);
function readScope(storage: Pick<Storage, "getItem">, scope: DiagnosticDraftScope): DiagnosticDraft[] {
  try {
    const current = storage.getItem(scopedKey(scope));
    if (current !== null) {
      const draft: unknown = JSON.parse(current);
      return isDraft(draft) && sameScope(draft.scope, scope)
        && storage.getItem(legacyRemovedKey(scope, draft.sessionId)) === null ? [draft] : [];
    }
    const raw = storage.getItem(DIAGNOSTIC_DRAFT_STORAGE_KEY);
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.filter(isDraft).filter(draft => sameScope(draft.scope, scope)
      && storage.getItem(legacyRemovedKey(scope, draft.sessionId)) === null) : [];
  } catch { return []; }
}

/** A draft only resumes when its fixed server-selected question set is unchanged. */
export function loadDiagnosticDraft(
  storage: Pick<Storage, "getItem">,
  scope: DiagnosticDraftScope,
  expectedQuestionIds: readonly number[],
  verifiedLegacyScope?: DiagnosticDraftScope | null,
): DiagnosticDraft | null {
  const expected = [...expectedQuestionIds];
  const current = readScope(storage, scope).find(draft => sameScope(draft.scope, scope)
    && draft.questionIds.length === expected.length
    && draft.questionIds.every((id, index) => id === expected[index])
    && draft.questionIndex >= 0
    && draft.questionIndex < expected.length
    && Object.entries(draft.answers).every(([questionId, selectedIndex]) =>
      expected.includes(Number(questionId)) && Number.isInteger(selectedIndex) && selectedIndex >= 0 && selectedIndex <= 9,
    )) ?? null;
  if (current) return current;
  // Explicit completion must not fall back to an older trusted email alias.
  try { if (storage.getItem(scopedKey(scope)) === "null") return null; } catch { return null; }
  if (!scope.identity.startsWith("user:") || !verifiedLegacyScope
    || !verifiedLegacyScope.identity.includes("@")
    || verifiedLegacyScope.courseKey !== scope.courseKey) return null;
  const legacy = loadDiagnosticDraft(storage, verifiedLegacyScope, expectedQuestionIds);
  if (!legacy) return null;
  try {
    return storage.getItem(legacyRemovedKey(scope, legacy.sessionId)) === null ? { ...legacy, scope } : null;
  } catch { return null; }
}

/** Write the validated replacement before marking the old alias as consumed.
 * A failed first write leaves the legacy record available for in-memory resume.
 */
export function upgradeLegacyDiagnosticDraft(
  storage: StorageLike,
  scope: DiagnosticDraftScope,
  expectedQuestionIds: readonly number[],
  verifiedLegacyScope?: DiagnosticDraftScope | null,
): DiagnosticDraft | null {
  const current = loadDiagnosticDraft(storage, scope, expectedQuestionIds);
  if (current) return current;
  const draft = loadDiagnosticDraft(storage, scope, expectedQuestionIds, verifiedLegacyScope);
  if (draft) saveDiagnosticDraft(storage, draft, verifiedLegacyScope);
  return draft;
}

export function saveDiagnosticDraft(storage: StorageLike, draft: DiagnosticDraft, verifiedLegacyScope?: DiagnosticDraftScope | null): boolean {
  try {
    // Restart/completion in another tab retires this session. A later edit in
    // the old tab must not overwrite the replacement draft (or its null marker).
    if (storage.getItem(legacyRemovedKey(draft.scope, draft.sessionId)) !== null) return false;
    storage.setItem(scopedKey(draft.scope), JSON.stringify(draft));
    if (draft.scope.identity.startsWith("user:") && verifiedLegacyScope
      && verifiedLegacyScope.identity.includes("@") && verifiedLegacyScope.courseKey === draft.scope.courseKey) {
      for (const legacy of readScope(storage, verifiedLegacyScope)) {
        if (legacy.sessionId === draft.sessionId && legacy.questionIds.length === draft.questionIds.length
          && legacy.questionIds.every((id, index) => id === draft.questionIds[index])) {
          storage.setItem(legacyRemovedKey(verifiedLegacyScope, legacy.sessionId), "1");
        }
      }
    }
    return true;
  } catch {
    return false;
  }
}

export function clearDiagnosticDraft(storage: StorageLike, scope: DiagnosticDraftScope, sessionId?: string): boolean {
  try {
    const drafts = readScope(storage, scope);
    // In-memory resume can complete even if its earlier upgrade write failed.
    // Persist that completion without requiring a stored destination record.
    if (sessionId !== undefined) storage.setItem(legacyRemovedKey(scope, sessionId), "1");
    // Mark only completed sessions, preserving every unrelated scope in v1.
    for (const draft of drafts) {
      if (sessionId === undefined) {
        storage.setItem(legacyRemovedKey(scope, draft.sessionId), "1");
      }
    }
    // A delayed completion must not replace another, newer draft with null.
    if (sessionId !== undefined && drafts.some(draft => draft.sessionId !== sessionId)) return true;
    // A scoped null suppresses old v1 work and trusted-alias fallback too.
    storage.setItem(scopedKey(scope), "null");
    return true;
  } catch {
    return false;
  }
}
