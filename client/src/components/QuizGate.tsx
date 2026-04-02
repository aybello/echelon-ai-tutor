import { useState } from "react";
import { Link } from "wouter";
import { trpc } from "@/lib/trpc";

interface QuizGateProps {
  questionsAnswered: number;
  onUnlocked: () => void;
  onDismiss?: () => void; // optional: restart another free 15-question session
  /** If provided, the gate shows a Stripe upsell for this product key as the primary CTA */
  productKey?: string;
  /** Human-readable product name shown in the upsell headline */
  productName?: string;
  /** Price label shown on the Stripe CTA button, e.g. "CA$49" */
  priceLabel?: string;
  /** What the paid pass unlocks — shown as bullet points */
  paidFeatures?: string[];
}

const TRIAL_UNLOCKED_KEY = "echelon_trial_unlocked";

export function isTrialUnlocked(): boolean {
  try {
    return localStorage.getItem(TRIAL_UNLOCKED_KEY) === "true";
  } catch {
    return false;
  }
}

export function setTrialUnlocked(): void {
  try {
    localStorage.setItem(TRIAL_UNLOCKED_KEY, "true");
  } catch {
    // ignore
  }
}

export default function QuizGate({
  questionsAnswered,
  onUnlocked,
  onDismiss,
  productKey,
  productName,
  priceLabel,
  paidFeatures,
}: QuizGateProps) {
  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [showFreeForm, setShowFreeForm] = useState(false);

  // Checkout session mutation (used when productKey is provided)
  const createSession = trpc.stripe.createCheckoutSession.useMutation({
    onSuccess: (data) => {
      if (data.url) window.location.href = data.url;
    },
    onError: () => {
      alert("Something went wrong starting checkout. Please try again.");
    },
  });

  // Free email unlock mutation
  const unlockMutation = trpc.trial.unlock.useMutation({
    onSuccess: () => {
      setTrialUnlocked();
      try { localStorage.setItem("echelon_trial_email", email.trim().toLowerCase()); } catch {}
      setSubmitted(true);
      setTimeout(() => { onUnlocked(); }, 1400);
    },
    onError: () => {
      setTrialUnlocked();
      try { localStorage.setItem("echelon_trial_email", email.trim().toLowerCase()); } catch {}
      setSubmitted(true);
      setTimeout(() => { onUnlocked(); }, 1400);
    },
  });

  function handleStripeClick() {
    if (!productKey) return;
    const storedEmail = localStorage.getItem("echelon_trial_email") || "";
    if (storedEmail) {
      createSession.mutate({ productKey, email: storedEmail, origin: window.location.origin });
    } else {
      // Need email first — show inline email prompt inside the Stripe path
      setShowFreeForm(true);
      // We'll reuse the free form but redirect to checkout on submit
    }
  }

  function validateEmail(val: string): boolean {
    if (!val.trim()) { setEmailError("Please enter your email address."); return false; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val.trim())) { setEmailError("Please enter a valid email address."); return false; }
    setEmailError("");
    return true;
  }

  function handleFreeSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validateEmail(email)) return;
    const trimmed = email.trim().toLowerCase();
    try { localStorage.setItem("echelon_trial_email", trimmed); } catch {}
    unlockMutation.mutate({ email: trimmed });
  }

  const hasPaidOption = Boolean(productKey && productName && priceLabel);

  // ── Success state ──────────────────────────────────────────────────────────
  if (submitted) {
    return (
      <div style={{ position: "fixed", inset: 0, background: "rgba(15,23,42,0.88)", backdropFilter: "blur(6px)", zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
        <div style={{ background: "#fff", borderRadius: 20, padding: "40px 36px", maxWidth: 480, width: "100%", boxShadow: "0 32px 80px rgba(0,0,0,0.35)", textAlign: "center" }}>
          <div style={{ fontSize: 52, marginBottom: 12 }}>🎉</div>
          <h2 style={{ fontSize: 22, fontWeight: 700, color: "#0F172A", marginBottom: 8, fontFamily: "Sora, sans-serif" }}>
            You're in — full access unlocked!
          </h2>
          <p style={{ color: "#64748B", fontSize: 15 }}>Loading your next question…</p>
        </div>
      </div>
    );
  }

  // ── Main gate modal ────────────────────────────────────────────────────────
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(15,23,42,0.88)", backdropFilter: "blur(6px)", zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
      <div style={{ background: "#fff", borderRadius: 20, padding: "36px 32px", maxWidth: 520, width: "100%", boxShadow: "0 32px 80px rgba(0,0,0,0.35)", textAlign: "center" }}>

        {/* Icon + headline */}
        <div style={{ width: 64, height: 64, borderRadius: "50%", background: "linear-gradient(135deg, #1D4ED8 0%, #0EA5E9 100%)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 18px", fontSize: 28 }}>
          🏆
        </div>
        <h2 style={{ fontSize: 22, fontWeight: 800, color: "#0F172A", marginBottom: 6, fontFamily: "Sora, sans-serif", lineHeight: 1.3 }}>
          You've finished your 15 free questions!
        </h2>
        <div style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "#EFF6FF", border: "1px solid #BFDBFE", borderRadius: 100, padding: "5px 14px", fontSize: 12, color: "#1D4ED8", fontWeight: 600, marginBottom: 20 }}>
          ✓ {questionsAnswered} questions answered
        </div>

        {/* ── PAID PATH (primary) ── */}
        {hasPaidOption && !showFreeForm && (
          <div style={{ background: "linear-gradient(135deg, #EFF6FF 0%, #F0FDFA 100%)", border: "2px solid #BFDBFE", borderRadius: 16, padding: "20px 20px 18px", marginBottom: 16, textAlign: "left" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: "#1D4ED8", letterSpacing: "0.08em", marginBottom: 4 }}>RECOMMENDED</div>
                <div style={{ fontSize: 16, fontWeight: 800, color: "#0F172A", fontFamily: "Sora, sans-serif" }}>{productName}</div>
              </div>
              <div style={{ textAlign: "right", flexShrink: 0, marginLeft: 12 }}>
                <div style={{ fontSize: 22, fontWeight: 900, color: "#1D4ED8", fontFamily: "Sora, sans-serif" }}>{priceLabel}</div>
                <div style={{ fontSize: 10, color: "#64748B" }}>one-time</div>
              </div>
            </div>
            <ul style={{ margin: "0 0 16px", padding: "0 0 0 18px", listStyle: "none" }}>
              {(paidFeatures ?? [
                "Full 500+ question bank — unlimited attempts",
                "OIT Mock Exam (100 questions, 2-hour timer)",
                "AI Tutor explanations on every question",
                "Score history & module breakdown",
              ]).map((f) => (
                <li key={f} style={{ fontSize: 13, color: "#1E3A5F", marginBottom: 6, display: "flex", alignItems: "flex-start", gap: 8 }}>
                  <span style={{ color: "#059669", fontWeight: 700, flexShrink: 0 }}>✓</span>
                  <span>{f}</span>
                </li>
              ))}
            </ul>
            <button
              onClick={handleStripeClick}
              disabled={createSession.isPending}
              style={{
                width: "100%",
                padding: "13px 20px",
                borderRadius: 12,
                border: "none",
                background: createSession.isPending ? "#93C5FD" : "linear-gradient(135deg, #1D4ED8 0%, #0EA5E9 100%)",
                color: "#fff",
                fontSize: 15,
                fontWeight: 800,
                cursor: createSession.isPending ? "not-allowed" : "pointer",
                fontFamily: "Sora, sans-serif",
                letterSpacing: "0.01em",
              }}
            >
              {createSession.isPending ? "Redirecting to checkout…" : `Get Full Access — ${priceLabel} →`}
            </button>
            <p style={{ fontSize: 11, color: "#64748B", marginTop: 8, textAlign: "center" }}>
              Secure checkout via Stripe · One-time payment · Instant access
            </p>
          </div>
        )}

        {/* ── FREE PATH ── */}
        {!showFreeForm && !hasPaidOption && (
          <p style={{ color: "#475569", fontSize: 14, lineHeight: 1.6, marginBottom: 20 }}>
            Enter your email to continue with the <strong>full question bank</strong> — completely free.
          </p>
        )}

        {/* Divider between paid and free */}
        {hasPaidOption && !showFreeForm && (
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
            <div style={{ flex: 1, height: 1, background: "#E2E8F0" }} />
            <span style={{ fontSize: 11, color: "#94A3B8", fontWeight: 600, whiteSpace: "nowrap" }}>OR CONTINUE FREE</span>
            <div style={{ flex: 1, height: 1, background: "#E2E8F0" }} />
          </div>
        )}

        {/* Free email form */}
        {!showFreeForm && (
          <form onSubmit={handleFreeSubmit} noValidate>
            <div style={{ marginBottom: 10 }}>
              <input
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={e => { setEmail(e.target.value); if (emailError) validateEmail(e.target.value); }}
                style={{
                  width: "100%",
                  padding: "12px 16px",
                  borderRadius: 10,
                  border: emailError ? "1.5px solid #EF4444" : "1.5px solid #CBD5E1",
                  fontSize: 14,
                  outline: "none",
                  fontFamily: "inherit",
                  boxSizing: "border-box",
                }}
                onFocus={e => { if (!emailError) e.target.style.borderColor = "#1D4ED8"; }}
                onBlur={e => { if (!emailError) e.target.style.borderColor = "#CBD5E1"; }}
              />
              {emailError && <p style={{ color: "#EF4444", fontSize: 12, marginTop: 5, textAlign: "left" }}>{emailError}</p>}
            </div>
            <button
              type="submit"
              disabled={unlockMutation.isPending}
              style={{
                width: "100%",
                padding: "12px 20px",
                borderRadius: 10,
                border: "1.5px solid #CBD5E1",
                background: "#F8FAFC",
                color: "#374151",
                fontSize: 14,
                fontWeight: 600,
                cursor: unlockMutation.isPending ? "not-allowed" : "pointer",
                fontFamily: "inherit",
              }}
            >
              {unlockMutation.isPending ? "Unlocking…" : hasPaidOption ? "Continue free (15 more questions) →" : "Unlock Full Access →"}
            </button>
            {!hasPaidOption && (
              <p style={{ color: "#94A3B8", fontSize: 11, marginTop: 10 }}>No spam, no credit card.</p>
            )}
          </form>
        )}

        {/* Escape options */}
        <div style={{ borderTop: "1px solid #E2E8F0", paddingTop: 14, marginTop: 14, display: "flex", flexDirection: "column", gap: 8 }}>
          {onDismiss && (
            <button
              onClick={onDismiss}
              style={{ width: "100%", padding: "10px 20px", borderRadius: 10, border: "1.5px solid #CBD5E1", background: "#F8FAFC", color: "#374151", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}
              onMouseEnter={e => (e.currentTarget.style.background = "#F1F5F9")}
              onMouseLeave={e => (e.currentTarget.style.background = "#F8FAFC")}
            >
              🔄 Try Another 15 Free Questions
            </button>
          )}
          <Link href="/">
            <button
              style={{ width: "100%", padding: "10px 20px", borderRadius: 10, border: "1.5px solid #CBD5E1", background: "#F8FAFC", color: "#374151", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}
              onMouseEnter={e => (e.currentTarget.style.background = "#F1F5F9")}
              onMouseLeave={e => (e.currentTarget.style.background = "#F8FAFC")}
            >
              ← Back to Homepage
            </button>
          </Link>
        </div>
      </div>
    </div>
  );
}
