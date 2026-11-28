import { useEffect, useId, useState } from "react";
import { Star } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { GOOGLE_REVIEW_URL, markReviewPromptShown, markAsReviewed } from "@/lib/reviewFunnel";

export type FeedbackType = "quiz_gate" | "session_complete" | "mock_exam" | "first_high_score" | "dashboard" | "quick10" | "recruitment_completion";
interface FeedbackModalProps {
  examType: string;
  feedbackType: FeedbackType;
  onClose: () => void;
  onSubmitted?: () => void;
}
const STAR_LABELS = ["", "Poor", "Fair", "Good", "Great", "Excellent"];

/** Private product feedback and public Google reviews are separate, optional actions. */
export default function FeedbackModal({ examType, feedbackType, onClose, onSubmitted }: FeedbackModalProps) {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [saveError, setSaveError] = useState("");
  const commentId = useId();
  useEffect(() => { markReviewPromptShown(); }, []);
  const submitMutation = trpc.feedback.submit.useMutation({
    onSuccess: () => {
      setSaveError("");
      setSubmitted(true);
      onSubmitted?.();
    },
    onError: () => setSaveError("Your feedback was not saved. Please try again. Your rating and comment are still here."),
  });

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!rating || submitMutation.isPending) return;
    setSaveError("");
    // Session identity is resolved by the server. Do not attach a stale browser-stored email.
    submitMutation.mutate({ examType, feedbackType, rating, comment: comment.trim() || undefined });
  }

  return (
    <Dialog open onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="max-h-[calc(100dvh-2rem)] overflow-y-auto bg-white text-slate-900 sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Share your experience</DialogTitle>
          <DialogDescription>What is working well, and what could be better? All feedback is welcome.</DialogDescription>
        </DialogHeader>
        {submitted ? <div role="status" className="rounded-lg bg-blue-50 p-4 text-sm text-blue-900">
          Thank you. Your feedback has been saved privately for the Echelon team.
        </div> : <form onSubmit={handleSubmit} className="space-y-4">
          <fieldset disabled={submitMutation.isPending}>
            <legend className="mb-2 text-sm font-semibold">Your rating</legend>
            <div className="flex gap-1" role="group" aria-label="Your rating">
              {[1, 2, 3, 4, 5].map(star => <button key={star} type="button"
                aria-label={`${star} star${star > 1 ? "s" : ""}: ${STAR_LABELS[star]}`}
                aria-pressed={rating === star} onClick={() => setRating(star)}
                className="inline-flex h-11 w-11 items-center justify-center rounded-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700 disabled:opacity-50">
                <Star aria-hidden="true" size={28} className={star <= rating ? "fill-amber-400 text-amber-700" : "text-slate-500"} />
              </button>)}
            </div>
            <p className="mt-1 text-sm text-slate-600" aria-live="polite">{rating ? STAR_LABELS[rating] : "Choose 1 to 5 stars"}</p>
          </fieldset>
          <div>
            <label htmlFor={commentId} className="text-sm font-semibold">Tell us more <span className="font-normal text-slate-600">(optional)</span></label>
            <textarea id={commentId} value={comment} onChange={event => setComment(event.target.value)}
              disabled={submitMutation.isPending} maxLength={1000} rows={3}
              placeholder="What helped you learn? What should we improve?"
              className="mt-2 w-full resize-y rounded-lg border border-slate-400 bg-white p-3 text-sm text-slate-900 focus-visible:outline-2 focus-visible:outline-blue-700" />
            <p className="mt-1 text-xs text-slate-600">Private feedback. This does not publish a review or give permission to use your words in marketing.</p>
          </div>
          {saveError && <p role="alert" className="text-sm text-red-700">{saveError}</p>}
          <Button type="submit" disabled={!rating || submitMutation.isPending} className="min-h-11 w-full">
            {submitMutation.isPending ? "Saving feedback..." : saveError ? "Retry saving feedback" : "Send private feedback"}
          </Button>
        </form>}
        <div className="border-t border-slate-200 pt-4">
          <p className="mb-2 text-sm text-slate-600">Prefer to share your experience publicly?</p>
          <a href={GOOGLE_REVIEW_URL} target="_blank" rel="noopener noreferrer"
            className="inline-flex min-h-11 items-center font-semibold text-blue-800 underline underline-offset-4">
            Write a Google review <span className="sr-only">(opens in a new tab)</span>
          </a>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <button type="button" onClick={() => { markAsReviewed(); onClose(); }} className="min-h-11 text-xs text-slate-600 underline">I already left a review</button>
          <Button type="button" variant="outline" onClick={onClose} className="min-h-11">{submitted ? "Done" : "Not now"}</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/** A user-initiated entry point, never an interruption to an active assessment. */
export function ReviewButton({ examType = "general", feedbackType = "dashboard" }: { examType?: string; feedbackType?: FeedbackType }) {
  const [open, setOpen] = useState(false);
  return <>
    <Button type="button" variant="outline" className="min-h-11 gap-2 bg-white text-slate-700" onClick={() => setOpen(true)}>
      <Star size={15} aria-hidden="true" /> Leave a review
    </Button>
    {open && <FeedbackModal examType={examType} feedbackType={feedbackType} onClose={() => setOpen(false)} />}
  </>;
}
