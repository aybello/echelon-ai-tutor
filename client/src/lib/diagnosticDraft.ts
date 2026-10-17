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

function readAll(storage: Pick<Storage, "getItem">): DiagnosticDraft[] {
  try {
    const raw = storage.getItem(DIAGNOSTIC_DRAFT_STORAGE_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter(isDraft) : [];
  } catch {
    return [];
  }
}

/** A draft only resumes when its fixed server-selected question set is unchanged. */
export function loadDiagnosticDraft(
  storage: Pick<Storage, "getItem">,
  scope: DiagnosticDraftScope,
  expectedQuestionIds: readonly number[],
  verifiedLegacyScope?: DiagnosticDraftScope | null,
): DiagnosticDraft | null {
  const expected = [...expectedQuestionIds];
  const current = readAll(storage).find(draft => sameScope(draft.scope, scope)
    && draft.questionIds.length === expected.length
    && draft.questionIds.every((id, index) => id === expected[index])
    && draft.questionIndex >= 0
    && draft.questionIndex < expected.length
    && Object.entries(draft.answers).every(([questionId, selectedIndex]) =>
      expected.includes(Number(questionId)) && Number.isInteger(selectedIndex) && selectedIndex >= 0 && selectedIndex <= 9,
    )) ?? null;
  if (current) return current;
  if (!scope.identity.startsWith("user:") || !verifiedLegacyScope
    || !verifiedLegacyScope.identity.includes("@")
    || verifiedLegacyScope.courseKey !== scope.courseKey) return null;
  const legacy = loadDiagnosticDraft(storage, verifiedLegacyScope, expectedQuestionIds);
  return legacy ? { ...legacy, scope } : null;
}

/** Upgrade only after validation. One atomic storage write preserves the old
 * record if storage is unavailable, while the caller can still resume in memory.
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
    const remaining = readAll(storage).filter(existing => !sameScope(existing.scope, draft.scope)
      && !(draft.scope.identity.startsWith("user:") && verifiedLegacyScope
        && verifiedLegacyScope.courseKey === draft.scope.courseKey
        && sameScope(existing.scope, verifiedLegacyScope)
        && existing.sessionId === draft.sessionId
        && existing.questionIds.length === draft.questionIds.length
        && existing.questionIds.every((id, index) => id === draft.questionIds[index])));
    storage.setItem(DIAGNOSTIC_DRAFT_STORAGE_KEY, JSON.stringify([...remaining, draft]));
    return true;
  } catch {
    return false;
  }
}

export function clearDiagnosticDraft(storage: StorageLike, scope: DiagnosticDraftScope, sessionId?: string): boolean {
  try {
    storage.setItem(DIAGNOSTIC_DRAFT_STORAGE_KEY, JSON.stringify(readAll(storage).filter(draft =>
      !sameScope(draft.scope, scope) || (sessionId !== undefined && draft.sessionId !== sessionId),
    )));
    return true;
  } catch {
    return false;
  }
}
