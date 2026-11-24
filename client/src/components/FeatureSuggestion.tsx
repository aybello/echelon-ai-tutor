import { useEffect, useId, useState } from "react";
import { Lightbulb } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { canInviteSuggestion, markSuggestionHandled } from "@/lib/featureSuggestionPrompt";

type SuggestionSource = "dashboard" | "quick10" | "practice";
type Context = { courseKey: string; source: SuggestionSource };

export function FeatureSuggestionModal({ courseKey, source, onClose, onSubmitted }: Context & { onClose: () => void; onSubmitted?: () => void }) {
  const id = useId();
  const [suggestion, setSuggestion] = useState("");
  const [problem, setProblem] = useState("");
  const [followUpAllowed, setFollowUpAllowed] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  const emailSession = trpc.dashboardAuth.me.useQuery(undefined, { retry: false });
  const account = trpc.auth.me.useQuery(undefined, { retry: false });
  const hasVerifiedEmail = Boolean(emailSession.data?.email || account.data?.email);
  const submit = trpc.featureRequests.submit.useMutation({
    onSuccess: () => { setError(""); setSaved(true); markSuggestionHandled(); onSubmitted?.(); },
    onError: () => setError("Your suggestion was not saved. Please try again. Your answers are still here."),
  });
  return <Dialog open onOpenChange={open => { if (!open) onClose(); }}>
    <DialogContent className="max-h-[calc(100dvh-2rem)] overflow-y-auto bg-white text-slate-900 sm:max-w-lg">
      <DialogHeader>
        <DialogTitle>Suggest an improvement</DialogTitle>
        <DialogDescription>What would make Echelon more useful for your learning? No rating needed.</DialogDescription>
      </DialogHeader>
      {saved ? <div role="status" className="rounded-lg bg-blue-50 p-4 text-sm text-blue-900">Thank you. Your suggestion has been saved privately for the Echelon team. We review requests, but cannot promise a release date.</div> : <form className="space-y-4" onSubmit={event => {
        event.preventDefault();
        if (suggestion.trim().length < 3 || submit.isPending) return;
        setError("");
        submit.mutate({ courseKey, source, pagePath: window.location.pathname.slice(0, 256), suggestion: suggestion.trim(), problem: problem.trim() || undefined, followUpAllowed: hasVerifiedEmail && followUpAllowed });
      }}>
        <div>
          <label htmlFor={`${id}-suggestion`} className="text-sm font-semibold">What should we add or improve?</label>
          <textarea id={`${id}-suggestion`} required minLength={3} maxLength={2000} rows={3} value={suggestion} disabled={submit.isPending} onChange={event => setSuggestion(event.target.value)} placeholder="For example, a clearer explanation or a study tool you need" className="mt-2 w-full resize-y rounded-lg border border-slate-400 bg-white p-3 text-sm text-slate-900 focus-visible:outline-2 focus-visible:outline-blue-700" />
        </div>
        <div>
          <label htmlFor={`${id}-problem`} className="text-sm font-semibold">What problem would it solve? <span className="font-normal text-slate-600">(optional)</span></label>
          <textarea id={`${id}-problem`} maxLength={1000} rows={2} value={problem} disabled={submit.isPending} onChange={event => setProblem(event.target.value)} className="mt-2 w-full resize-y rounded-lg border border-slate-400 bg-white p-3 text-sm text-slate-900 focus-visible:outline-2 focus-visible:outline-blue-700" />
        </div>
        {hasVerifiedEmail ? <label className="flex min-h-11 items-center gap-3 text-sm"><input type="checkbox" checked={followUpAllowed} disabled={submit.isPending} onChange={event => setFollowUpAllowed(event.target.checked)} className="h-5 w-5 shrink-0" />The Echelon team may email me about this suggestion.</label> : <p className="text-xs text-slate-600">You can send a suggestion without signing in. Email follow-up is available when signed in.</p>}
        <p className="text-xs text-slate-600">Private, not a public post. We include this course, the page path and your verified account when signed in. Do not include sensitive information. Follow-up permission is not marketing consent.</p>
        {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
        <Button type="submit" disabled={suggestion.trim().length < 3 || submit.isPending} className="min-h-11 w-full">{submit.isPending ? "Saving suggestion..." : error ? "Retry saving suggestion" : "Send suggestion"}</Button>
      </form>}
      <Button type="button" variant="outline" onClick={onClose} className="min-h-11">{saved ? "Done" : "Not now"}</Button>
    </DialogContent>
  </Dialog>;
}

/** Always available on the dashboard, independent of automatic invitation preferences. */
export function SuggestionButton({ courseKey = "general", source = "dashboard" }: Partial<Context>) {
  const [open, setOpen] = useState(false);
  return <><Button type="button" variant="outline" className="min-h-11 gap-2 bg-white text-slate-700" onClick={() => setOpen(true)}><Lightbulb size={15} aria-hidden="true" />Suggest an improvement</Button>
    {open && <FeatureSuggestionModal courseKey={courseKey} source={source} onClose={() => setOpen(false)} />}</>;
}

/** Mount only on a completed, untimed practice result. Never opens a dialog automatically. */
export function SuggestionInvitation({ courseKey, source }: Context) {
  const [visible, setVisible] = useState(false);
  const [open, setOpen] = useState(false);
  useEffect(() => { setVisible(canInviteSuggestion()); }, []);
  function dismiss() { markSuggestionHandled(); setOpen(false); setVisible(false); }
  if (!visible) return null;
  return <aside aria-label="Help improve Echelon" className="mt-5 rounded-xl border border-blue-200 bg-blue-50 p-4 text-left text-slate-900">
    <p className="text-sm font-semibold">What would make your next session better?</p>
    <p className="mt-1 text-sm text-slate-600">Suggest a feature or an improvement. This is optional.</p>
    <div className="mt-3 flex flex-wrap gap-2"><Button type="button" variant="outline" className="min-h-11 bg-white" onClick={() => setOpen(true)}>Suggest an improvement</Button><Button type="button" variant="ghost" className="min-h-11" onClick={dismiss}>Not now</Button></div>
    {open && <FeatureSuggestionModal courseKey={courseKey} source={source} onClose={dismiss} />}
  </aside>;
}
