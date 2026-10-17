import { useEffect, useRef, useState } from "react";
import { trpc } from "@/lib/trpc";
import { listPendingPracticeSaves, practiceSaveRetryProblem, removePendingPracticeSave, retryPendingPracticeSave, type PendingPracticeSave, type PracticeSaveScope } from "@/lib/practiceSaveOutbox";
import { resolveCourseKey } from "@shared/courseRegistry";

const listeners = new Set<() => void>();
const states = new Map<string, string>();
const volatileWarnings = new Map<string, Map<string, string>>();
const key = (scope: PracticeSaveScope) => JSON.stringify(scope);
export function notifyPracticeSave(scope: PracticeSaveScope, message: string, operationId?: string, unavailable = false) {
  states.set(key(scope), message);
  if (operationId) {
    const warnings = volatileWarnings.get(key(scope)) ?? new Map<string, string>();
    if (unavailable) warnings.set(operationId, message);
    else warnings.delete(operationId);
    volatileWarnings.set(key(scope), warnings);
  }
  for (const listener of listeners) listener();
}
export function useVerifiedPracticeSaveScope(courseKey: string): PracticeSaveScope | null {
  const oauth = trpc.auth.me.useQuery(undefined, { retry: false });
  const email = trpc.dashboardAuth.me.useQuery(undefined, { retry: false });
  if (oauth.isLoading || email.isLoading || oauth.isFetching || email.isFetching || oauth.isError || email.isError) return null;
  // Match practiceIdentity: an OAuth account takes precedence over an OTP email.
  const identity = oauth.data ? `user:${oauth.data.id}` : email.data?.email?.trim().toLowerCase();
  const course = resolveCourseKey(courseKey);
  return identity && course ? { identity, courseKey: course.courseKey } : null;
}
export default function PracticeSaveStatus({ courseKey }: { courseKey?: string }) {
  const scope = useVerifiedPracticeSaveScope(courseKey ?? "");
  const activeScope = useRef<string | null>(null);
  activeScope.current = scope ? key(scope) : null;
  const mounted = useRef(true);
  const busy = useRef(false);
  const [retrying, setRetrying] = useState(false);
  const [, render] = useState(0);
  const mutation = trpc.quiz.logAttempt.useMutation({ retry: false });
  useEffect(() => {
    mounted.current = true;
    const changed = () => render(value => value + 1);
    listeners.add(changed);
    window.addEventListener("storage", changed);
    return () => { mounted.current = false; activeScope.current = null; listeners.delete(changed); window.removeEventListener("storage", changed); };
  }, []);
  if (!scope) return <p role="status" className="px-4 py-2 text-xs">Local session score only until a verified account is available.</p>;
  let pending: PendingPracticeSave[] = [];
  let unavailable = false;
  try { pending = listPendingPracticeSaves(window.localStorage, scope); } catch { unavailable = true; }
  const message = states.get(key(scope));
  const warnings = [...(volatileWarnings.get(key(scope))?.entries() ?? [])];
  async function retry(item: PendingPracticeSave) {
    if (!scope || busy.current || activeScope.current !== key(scope)) return;
    busy.current = true; setRetrying(true);
    const originalScope = scope;
    const isActive = () => mounted.current && activeScope.current === key(originalScope);
    try {
      const message = await retryPendingPracticeSave(window.localStorage, originalScope, item.operationId,
        input => mutation.mutateAsync(input), isActive);
      // Never show another learner's response in the currently active scope.
      notifyPracticeSave(originalScope, message);
    } catch { notifyPracticeSave(originalScope, "Browser recovery storage is unavailable. No retry was sent."); }
    finally { busy.current = false; if (mounted.current) setRetrying(false); }
  }
  function dismiss(item: PendingPracticeSave) {
    if (!scope || busy.current || activeScope.current !== key(scope)) return;
    let removed = false;
    try { removed = removePendingPracticeSave(window.localStorage, item.operationId); } catch { /* show honest warning */ }
    notifyPracticeSave(scope, removed ? "Local pending warning dismissed only. This did not save an answer or delete any server history." : "Browser storage could not dismiss this local warning.");
  }
  if (!pending.length && !message && !warnings.length && !unavailable) return null;
  return <div role="status" aria-live="polite" className="border border-amber-200 bg-amber-50 px-4 py-2 text-sm text-slate-900">
    {message && <p>{message}</p>}
    {unavailable && <p>Browser recovery storage is unavailable. Pending answers cannot be recovered here.</p>}
    {warnings.map(([id, warning]) => <p key={id}>{warning} This answer has no durable recovery record; a later answer being saved does not confirm this one.</p>)}
    {pending.length > 0 && <p>{pending.length} answer save{pending.length === 1 ? "" : "s"} awaiting confirmation, retained on this browser. Local score is not proof of saved progress. Nothing is retried automatically; the server rechecks your account, access and original receipt.</p>}
    {pending.map(item => {
      const problem = practiceSaveRetryProblem(item, scope);
      return <div key={item.operationId} className="mt-2">
        <p>Question {item.questionId}: {problem ?? "The original answer can be sent again with the same retry ID."}</p>
        <button type="button" disabled={retrying || !!problem} onClick={() => void retry(item)} className="mr-3 underline">Retry pending answer</button>
        <button type="button" disabled={retrying} onClick={() => dismiss(item)} className="underline">Dismiss local warning only (does not save)</button>
      </div>;
    })}
  </div>;
}
