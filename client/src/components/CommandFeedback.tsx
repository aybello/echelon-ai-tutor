import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Star, Mail, CheckCircle2, X } from "lucide-react";

// --- Feedback Modal (1-5 stars + optional comment) ---

interface FeedbackPanelProps {
  scenarioId: string;
  guestId: string;
}

export function FeedbackPanel({ scenarioId, guestId }: FeedbackPanelProps) {
  const [rating, setRating] = useState(0);
  const [hovered, setHovered] = useState(0);
  const [comment, setComment] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  const submitMutation = trpc.incidentCommand.submitFeedback.useMutation({
    onSuccess: () => setSubmitted(true),
  });

  if (dismissed) return null;
  if (submitted) {
    return (
      <div className="flex items-center gap-2 rounded-lg border border-emerald-500/30 bg-emerald-950/30 px-4 py-3 text-sm text-emerald-300">
        <CheckCircle2 className="h-4 w-4 shrink-0" />
        <span>Thanks for the feedback!</span>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-slate-700 bg-slate-900/80 p-4 space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-slate-300">How was this scenario?</p>
        <button
          onClick={() => setDismissed(true)}
          className="text-slate-500 hover:text-slate-300 transition-colors"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Star rating */}
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            onMouseEnter={() => setHovered(star)}
            onMouseLeave={() => setHovered(0)}
            onClick={() => setRating(star)}
            className="transition-transform active:scale-90"
          >
            <Star
              className={`h-7 w-7 transition-colors ${
                star <= (hovered || rating)
                  ? "fill-amber-400 text-amber-400"
                  : "text-slate-600"
              }`}
            />
          </button>
        ))}
      </div>

      {/* Comment (shows after rating) */}
      {rating > 0 && (
        <div className="space-y-2 animate-in fade-in slide-in-from-top-1 duration-200">
          <Textarea
            placeholder="Any thoughts? (optional)"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            className="bg-slate-800 border-slate-700 text-slate-200 placeholder:text-slate-500 resize-none h-16 text-sm"
          />
          <Button
            size="sm"
            onClick={() =>
              submitMutation.mutate({
                scenarioId,
                rating,
                comment: comment.trim() || undefined,
                guestId,
              })
            }
            disabled={submitMutation.isPending}
            className="bg-emerald-600 hover:bg-emerald-500 text-white"
          >
            {submitMutation.isPending ? "Sending..." : "Submit"}
          </Button>
        </div>
      )}
    </div>
  );
}

// --- Email Capture CTA ---

interface EmailCapturePanelProps {
  guestId: string;
}

export function EmailCapturePanel({ guestId }: EmailCapturePanelProps) {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  const captureMutation = trpc.incidentCommand.captureEmail.useMutation({
    onSuccess: () => setSubmitted(true),
  });

  // Check localStorage if user already subscribed
  const alreadySubscribed = typeof window !== "undefined" && localStorage.getItem("echelon_command_subscribed") === "true";

  if (dismissed || alreadySubscribed) return null;
  if (submitted) {
    if (typeof window !== "undefined") {
      localStorage.setItem("echelon_command_subscribed", "true");
    }
    return (
      <div className="flex items-center gap-2 rounded-lg border border-blue-500/30 bg-blue-950/30 px-4 py-3 text-sm text-blue-300">
        <Mail className="h-4 w-4 shrink-0" />
        <span>You're on the list. We'll let you know when new scenarios drop.</span>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-slate-700 bg-slate-900/80 p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-slate-300">New scenarios coming soon</p>
          <p className="text-xs text-slate-500">Get notified when we add more drills.</p>
        </div>
        <button
          onClick={() => setDismissed(true)}
          className="text-slate-500 hover:text-slate-300 transition-colors"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (email.trim()) {
            captureMutation.mutate({ email: email.trim(), guestId });
          }
        }}
        className="flex gap-2"
      >
        <Input
          type="email"
          placeholder="your@email.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="bg-slate-800 border-slate-700 text-slate-200 placeholder:text-slate-500 text-sm flex-1"
          required
        />
        <Button
          type="submit"
          size="sm"
          disabled={captureMutation.isPending || !email.trim()}
          className="bg-blue-600 hover:bg-blue-500 text-white shrink-0"
        >
          {captureMutation.isPending ? "..." : "Notify me"}
        </Button>
      </form>
    </div>
  );
}
