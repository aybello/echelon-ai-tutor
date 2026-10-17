import { useEffect, useState } from "react";
import { trpc } from "@/lib/trpc";
import { listPendingPracticeSaves, type PracticeSaveScope } from "@/lib/practiceSaveOutbox";
import { resolveCourseKey } from "@shared/courseRegistry";

const listeners = new Set<() => void>();
const states = new Map<string, string>();
const key = (scope: PracticeSaveScope) => JSON.stringify(scope);
export function notifyPracticeSave(scope: PracticeSaveScope, message: string) {
  states.set(key(scope), message);
  for (const listener of listeners) listener();
}
export function useVerifiedPracticeSaveScope(courseKey: string): PracticeSaveScope | null {
  const oauth = trpc.auth.me.useQuery(undefined, { retry: false });
  const email = trpc.dashboardAuth.me.useQuery(undefined, { retry: false });
  if (oauth.isLoading || email.isLoading) return null;
  // Match practiceIdentity: an OAuth account takes precedence over an OTP email.
  const identity = oauth.data ? `user:${oauth.data.id}` : email.data?.email?.trim().toLowerCase();
  const course = resolveCourseKey(courseKey);
  return identity && course ? { identity, courseKey: course.courseKey } : null;
}
export default function PracticeSaveStatus({ courseKey }: { courseKey?: string }) {
  const scope = useVerifiedPracticeSaveScope(courseKey ?? "");
  const [, render] = useState(0);
  useEffect(() => {
    const changed = () => render(value => value + 1);
    listeners.add(changed);
    window.addEventListener("storage", changed);
    return () => { listeners.delete(changed); window.removeEventListener("storage", changed); };
  }, []);
  if (!scope) return <p role="status" className="px-4 py-2 text-xs">Local session score only until a verified account is available.</p>;
  let pending = 0;
  try { pending = listPendingPracticeSaves(window.localStorage, scope).length; } catch { /* storage disabled */ }
  const message = states.get(key(scope));
  if (!pending && !message) return null;
  return <div role="status" aria-live="polite" className="border border-amber-200 bg-amber-50 px-4 py-2 text-sm text-slate-900">
    {message}
    {pending > 0 && <p>{pending} answer save{pending === 1 ? "" : "s"} awaiting confirmation, retained on this browser. The local score is not proof of saved progress. Automatic retry is disabled because the server does not yet prevent duplicate attempts.</p>}
  </div>;
}
