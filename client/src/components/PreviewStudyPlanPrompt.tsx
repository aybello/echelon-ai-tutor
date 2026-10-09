/**
 * PreviewStudyPlanPrompt — the early, dismissible study plan offer.
 *
 * Why this exists: the paywall at question 15 is only reached by roughly 18%
 * of people who start a quiz. Everyone else leaves while still anonymous and
 * becomes permanently unreachable. This prompt appears once, partway through
 * the free preview, while the learner is still present and has just seen
 * enough real questions to judge the quality of the bank.
 *
 * It is deliberately a SOFT gate. The learner can dismiss it and continue to
 * the full free preview. A hard stop here would move the wall forward rather
 * than moving the offer forward, which would be strictly worse than today.
 *
 * Self-contained by design: it resolves its own entitlement and renders from
 * inside QuizShell, so every course gets identical behaviour without any
 * per-page wiring.
 */

import { useEffect, useMemo, useRef, useState } from "react";
import { trpc } from "@/lib/trpc";
import { getAnonymousAnalyticsId } from "@/lib/anonymousAnalytics";
import { buildPreviewDiagnostic } from "@shared/previewDiagnostic";
import { resolveCourseKey } from "@shared/courseRegistry";

/** The question at which the offer appears. See EMAIL_GATE_PLACEMENT analysis. */
export const SOFT_GATE_AT_QUESTION = 5;

/** One ask per course per browser. Being asked repeatedly is an annoyance. */
const DISMISSED_KEY_PREFIX = "echelon_plan_prompt_";

export function softGatePromptKey(courseKey: string): string {
  return `${DISMISSED_KEY_PREFIX}${courseKey}`;
}

export function hasSeenSoftGate(courseKey: string): boolean {
  try {
    return localStorage.getItem(softGatePromptKey(courseKey)) === "true";
  } catch {
    return false;
  }
}

export function markSoftGateSeen(courseKey: string): void {
  try {
    localStorage.setItem(softGatePromptKey(courseKey), "true");
  } catch {
    // A browser that refuses storage simply sees the prompt again. Never throw.
  }
}

/**
 * The prompt shows only at the exact question count, only for learners without
 * a pass, only once per course, and only while enough of the preview remains
 * for the learner to act on what we tell them.
 */
export function shouldShowSoftGate(input: {
  answered: number;
  showAt: number;
  /** Server-confirmed: true only when the learner has no paid entitlement. */
  isFreePreview: boolean;
  alreadySeen: boolean;
  gateActive: boolean;
}): boolean {
  if (!input.isFreePreview) return false;
  if (input.alreadySeen) return false;
  if (input.gateActive) return false;
  return input.answered === input.showAt;
}

interface PreviewStudyPlanPromptProps {
  /** Bank key for the active course, e.g. "class1-water". */
  examType?: string;
  /** Answered questions so far, used for both the trigger and the diagnostic. */
  history: Array<{ module?: string; correct?: boolean }>;
  /** True when the hard paywall is already on screen. */
  gateActive: boolean;
  /**
   * Server-confirmed preview state from the quiz session. Paid learners and
   * free courses never see the prompt, and entitlement is never inferred from
   * a browser flag.
   */
  isFreePreview: boolean;
  /** Overridable for tests. */
  showAt?: number;
}

export default function PreviewStudyPlanPrompt({
  examType,
  history,
  gateActive,
  isFreePreview,
  showAt = SOFT_GATE_AT_QUESTION,
}: PreviewStudyPlanPromptProps) {
  const [dismissed, setDismissed] = useState(false);
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);
  const shownRef = useRef(false);

  const courseKey = examType ?? "";
  const course = courseKey ? resolveCourseKey(courseKey) : undefined;
  const productKey = course?.courseKey ?? courseKey;

  const answered = history.filter(entry => typeof entry.correct === "boolean").length;
  const alreadySeen = useMemo(() => (courseKey ? hasSeenSoftGate(courseKey) : true), [courseKey]);

  const visible =
    !dismissed &&
    Boolean(courseKey) &&
    shouldShowSoftGate({
      answered,
      showAt,
      isFreePreview,
      alreadySeen,
      gateActive,
    });

  const diagnostic = useMemo(
    () => (visible ? buildPreviewDiagnostic(history, answered) : null),
    [visible, history, answered],
  );

  const analytics = trpc.funnelAnalytics.track.useMutation();
  const sendPlan = trpc.trial.studyPlan.useMutation({
    onSuccess: () => {
      setSent(true);
      if (courseKey) markSoftGateSeen(courseKey);
    },
    onError: () => setError("We could not send your plan. Please try again."),
  });

  // Record the impression once so the capture rate has an honest denominator.
  useEffect(() => {
    if (!visible || shownRef.current || !courseKey) return;
    shownRef.current = true;
    analytics.mutate({
      event: "preview_plan_offered",
      examType: courseKey,
      visitorId: getAnonymousAnalyticsId(),
      questionCount: answered,
    });
  }, [visible, courseKey, answered, analytics]);

  if (!visible || !diagnostic) return null;

  function handleDismiss() {
    if (courseKey) markSoftGateSeen(courseKey);
    setDismissed(true);
  }

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError("");
    const trimmed = email.trim();
    if (!trimmed || !trimmed.includes("@")) {
      setError("Please enter a valid email address.");
      return;
    }
    if (!productKey || !diagnostic || diagnostic.total === 0) return;
    sendPlan.mutate({
      email: trimmed,
      phone: phone.trim() || undefined,
      productKey,
      score: diagnostic.score,
      correct: diagnostic.correct,
      total: diagnostic.total,
      weakTopics: diagnostic.weakTopics,
      // The learner is still mid-preview, so the plan email must say so.
      stage: "in_preview",
    });
  }

  if (sent) {
    return (
      <div
        role="status"
        data-testid="preview-plan-prompt-sent"
        style={{
          background: "#F0FDF4",
          border: "1.5px solid #BBF7D0",
          borderRadius: 14,
          padding: "14px 16px",
          marginBottom: 16,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
          flexWrap: "wrap",
        }}
      >
        <div>
          <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: "#059669" }}>
            Your study plan is on its way
          </p>
          <p style={{ margin: "3px 0 0", fontSize: 12, color: "#475569" }}>
            Keep going. The rest of your free questions are below.
          </p>
        </div>
        <button
          onClick={() => setDismissed(true)}
          style={{
            padding: "8px 16px",
            borderRadius: 9,
            border: "1.5px solid #BBF7D0",
            background: "#fff",
            color: "#047857",
            fontSize: 13,
            fontWeight: 700,
            cursor: "pointer",
            fontFamily: "inherit",
            touchAction: "manipulation",
            flexShrink: 0,
          }}
        >
          Continue
        </button>
      </div>
    );
  }

  return (
    <div
      data-testid="preview-plan-prompt"
      style={{
        background: "linear-gradient(135deg, #EFF6FF 0%, #F0FDFA 100%)",
        border: "1.5px solid #BFDBFE",
        borderRadius: 14,
        padding: "16px 18px",
        marginBottom: 16,
        position: "relative",
      }}
    >
      <button
        onClick={handleDismiss}
        aria-label="Dismiss study plan offer"
        style={{
          position: "absolute",
          top: 10,
          right: 10,
          width: 26,
          height: 26,
          borderRadius: "50%",
          background: "rgba(255,255,255,0.8)",
          border: "1px solid #CBD5E1",
          cursor: "pointer",
          fontSize: 13,
          color: "#64748B",
          lineHeight: 1,
          padding: 0,
          touchAction: "manipulation",
        }}
      >
        ✕
      </button>

      <div style={{ display: "flex", alignItems: "baseline", gap: 10, flexWrap: "wrap", marginBottom: 6 }}>
        <span style={{ fontSize: 11, fontWeight: 800, color: "#1D4ED8", letterSpacing: "0.08em" }}>
          {answered} QUESTIONS IN
        </span>
        <span style={{ fontSize: 13, fontWeight: 800, color: "#0F172A" }}>
          {diagnostic.correct} of {diagnostic.total} correct so far
        </span>
      </div>

      <p style={{ margin: "0 0 10px", fontSize: 13, color: "#1E3A5F", lineHeight: 1.5, paddingRight: 26 }}>
        {diagnostic.weakTopics.length > 0
          ? `Want your free study plan? We will email the topics to focus on first, starting with ${diagnostic.weakTopics.slice(0, 2).join(" and ")}.`
          : "Want your free study plan? We will email the topics to focus on first, based on how you are answering."}
      </p>

      <form onSubmit={handleSubmit}>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          <input
            id="preview-plan-prompt-email"
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="you@example.com"
            autoComplete="email"
            aria-label="Email address for your study plan"
            style={{
              flex: "1 1 200px",
              minWidth: 0,
              padding: "10px 12px",
              borderRadius: 9,
              border: "1.5px solid #CBD5E1",
              fontSize: 14,
              fontFamily: "inherit",
              color: "#0F172A",
            }}
          />
          <button
            type="submit"
            disabled={sendPlan.isPending}
            style={{
              padding: "10px 18px",
              borderRadius: 9,
              border: "none",
              background: "linear-gradient(135deg, #1D4ED8 0%, #0EA5E9 100%)",
              color: "#fff",
              fontSize: 14,
              fontWeight: 800,
              cursor: "pointer",
              fontFamily: "inherit",
              flexShrink: 0,
              opacity: sendPlan.isPending ? 0.7 : 1,
              touchAction: "manipulation",
            }}
          >
            {sendPlan.isPending ? "Sending…" : "Send my plan"}
          </button>
        </div>
        {/* Optional on purpose. A required field here costs more leads than the
            second channel is worth; phone is required at checkout instead. */}
        <input
          type="tel"
          value={phone}
          onChange={e => setPhone(e.target.value)}
          placeholder="Phone (optional, for exam reminders)"
          autoComplete="tel"
          aria-label="Phone number, optional"
          style={{
            width: "100%",
            marginTop: 6,
            padding: "10px 12px",
            borderRadius: 9,
            border: "1.5px solid #CBD5E1",
            fontSize: 14,
            fontFamily: "inherit",
            color: "#0F172A",
            boxSizing: "border-box",
          }}
        />
        {error && (
          <p role="alert" style={{ color: "#B91C1C", fontSize: 12, margin: "7px 0 0" }}>
            {error}
          </p>
        )}
        <button
          type="button"
          onClick={handleDismiss}
          style={{
            marginTop: 8,
            padding: 0,
            border: "none",
            background: "transparent",
            color: "#64748B",
            fontSize: 12,
            fontWeight: 600,
            cursor: "pointer",
            fontFamily: "inherit",
            textDecoration: "underline",
            touchAction: "manipulation",
          }}
        >
          No thanks, keep practising
        </button>
      </form>
    </div>
  );
}
