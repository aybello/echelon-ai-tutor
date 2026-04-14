import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { Link, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import CheckoutContactModal from "@/components/CheckoutContactModal";
import FeedbackModal from "@/components/FeedbackModal";

const LOGO_URL = "https://d2xsxph8kpxj0f.cloudfront.net/310519663446228701/9KAR7mkGo7x7xavTEeEpiA/echelon-icon-v2_37a8727b.png";

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
  /** The exam type / bank key for feedback tracking, e.g. "class1-water" */
  examType?: string;
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
  examType,
}: QuizGateProps) {
  const [, navigate] = useLocation();
  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [showContactModal, setShowContactModal] = useState(false);
  const [mounted, setMounted] = useState(false);

  // ── Feedback modal state ────────────────────────────────────────────────
  const [showFeedback, setShowFeedback] = useState(true);
  const [feedbackDone, setFeedbackDone] = useState(false);

  // Ensure portal target is available (SSR-safe)
  useEffect(() => {
    setMounted(true);
    // Lock body scroll while gate is visible — use overflow only (not position:fixed)
    // to avoid breaking child fixed positioning on mobile Chrome
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  // Checkout session mutation (used when productKey is provided)
  const createSession = trpc.stripe.createCheckoutSession.useMutation({
    onSuccess: (data) => {
      if (data.url) window.location.href = data.url;
    },
    onError: () => {
      alert("Something went wrong starting checkout. Please try again.");
    },
  });

  // Free email unlock mutation (only used when no productKey)
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
    setShowContactModal(true);
  }

  function handleContactSubmit(contact: { name: string; email: string; phone: string }) {
    if (!productKey) return;
    try { localStorage.setItem("echelon_trial_email", contact.email); } catch {}
    createSession.mutate({
      productKey,
      email: contact.email,
      name: contact.name,
      phone: contact.phone,
      origin: window.location.origin,
    });
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
  const successContent = (
    <div style={{
      position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
      background: "rgba(15,23,42,0.55)",
      backdropFilter: "blur(8px)",
      WebkitBackdropFilter: "blur(8px)",
      zIndex: 99999,
      display: "flex", alignItems: "center", justifyContent: "center",
      padding: 20,
      WebkitOverflowScrolling: "touch",
    }}>
      <div style={{ background: "#fff", borderRadius: 20, padding: "40px 36px", maxWidth: 480, width: "100%", boxShadow: "0 32px 80px rgba(0,0,0,0.35)", textAlign: "center" }}>
        <div style={{ fontSize: 52, marginBottom: 12 }}>🎉</div>
        <h2 style={{ fontSize: 22, fontWeight: 700, color: "#0F172A", marginBottom: 8, fontFamily: "Sora, sans-serif" }}>
          You're in — full access unlocked!
        </h2>
        <p style={{ color: "#64748B", fontSize: 15 }}>Loading your next question…</p>
      </div>
    </div>
  );

  // ── Main gate modal ────────────────────────────────────────────────────────
  const gateContent = (
    <>
      {showContactModal && productKey && (
        <CheckoutContactModal
          productName={productName ?? productKey}
          priceLabel={priceLabel}
          prefillEmail={(() => { try { return localStorage.getItem("echelon_trial_email") ?? ""; } catch { return ""; } })()}
          onSubmit={handleContactSubmit}
          onClose={() => setShowContactModal(false)}
          isLoading={createSession.isPending}
        />
      )}
      <div style={{
        position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
        background: "rgba(15,23,42,0.55)",
        backdropFilter: "blur(8px)",
        WebkitBackdropFilter: "blur(8px)",
        zIndex: 99999,
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: "20px 16px",
        overflowY: "auto",
        WebkitOverflowScrolling: "touch",
      }}>
        <div style={{
          background: "#fff",
          borderRadius: 20,
          padding: "28px 24px 24px",
          maxWidth: 520,
          width: "100%",
          boxShadow: "0 32px 80px rgba(0,0,0,0.35)",
          textAlign: "center",
          position: "relative",
          margin: "auto",
          maxHeight: "calc(100vh - 40px)",
          overflowY: "auto",
          WebkitOverflowScrolling: "touch",
        }}>
          {/* X button — top-right corner of the card */}
          <button
            onClick={() => navigate("/")}
            aria-label="Back to homepage"
            style={{
              position: "absolute",
              top: 14,
              right: 14,
              width: 32,
              height: 32,
              borderRadius: "50%",
              background: "#F1F5F9",
              border: "1px solid #E2E8F0",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              fontSize: 15,
              color: "#64748B",
              lineHeight: 1,
              padding: 0,
              flexShrink: 0,
            }}
          >
            ✕
          </button>

          {/* Full logo */}
          <Link href="/">
            <div style={{ display: "inline-flex", alignItems: "center", gap: 8, marginBottom: 16, cursor: "pointer" }}>
              <img src={LOGO_URL} alt="Echelon Institute" style={{ height: 28, width: "auto", objectFit: "contain" }} />
              <span style={{ fontFamily: "'Sora', sans-serif", fontWeight: 800, fontSize: 14, color: "#0F172A", letterSpacing: "-0.02em", whiteSpace: "nowrap" }}>Echelon Institute</span>
            </div>
          </Link>

          {/* Icon + headline */}
          <div style={{ width: 56, height: 56, borderRadius: "50%", background: "linear-gradient(135deg, #1D4ED8 0%, #0EA5E9 100%)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 14px", fontSize: 26 }}>
            🏆
          </div>
          <h2 style={{ fontSize: 20, fontWeight: 800, color: "#0F172A", marginBottom: 6, fontFamily: "Sora, sans-serif", lineHeight: 1.3 }}>
            You've finished your 15 free questions!
          </h2>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "#EFF6FF", border: "1px solid #BFDBFE", borderRadius: 100, padding: "4px 12px", fontSize: 12, color: "#1D4ED8", fontWeight: 600, marginBottom: 16 }}>
            ✓ {questionsAnswered} questions answered
          </div>

          {/* ── PAID PATH (primary) — shown when productKey is provided ── */}
          {hasPaidOption ? (
            <>
              <div style={{ background: "linear-gradient(135deg, #EFF6FF 0%, #F0FDFA 100%)", border: "2px solid #BFDBFE", borderRadius: 16, padding: "18px 18px 16px", marginBottom: 14, textAlign: "left" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 700, color: "#1D4ED8", letterSpacing: "0.08em", marginBottom: 4 }}>RECOMMENDED</div>
                    <div style={{ fontSize: 15, fontWeight: 800, color: "#0F172A", fontFamily: "Sora, sans-serif" }}>{productName}</div>
                  </div>
                  <div style={{ textAlign: "right", flexShrink: 0, marginLeft: 12 }}>
                    <div style={{ fontSize: 20, fontWeight: 900, color: "#1D4ED8", fontFamily: "Sora, sans-serif" }}>{priceLabel}</div>
                    <div style={{ fontSize: 10, color: "#64748B" }}>one-time</div>
                  </div>
                </div>
                <ul style={{ margin: "0 0 14px", padding: "0 0 0 0", listStyle: "none" }}>
                  {(paidFeatures ?? [
                    "Full question bank — unlimited attempts",
                    "Timed mock exam",
                    "AI Tutor explanations on every question",
                    "Score history & module breakdown",
                  ]).map((f) => (
                    <li key={f} style={{ fontSize: 13, color: "#1E3A5F", marginBottom: 5, display: "flex", alignItems: "flex-start", gap: 8 }}>
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
                    touchAction: "manipulation",
                  }}
                >
                  {createSession.isPending ? "Redirecting to checkout…" : `Get Full Access — ${priceLabel} →`}
                </button>
                <p style={{ fontSize: 11, color: "#64748B", marginTop: 8, textAlign: "center" }}>
                  Secure checkout via Stripe · One-time payment · Instant access
                </p>
              </div>

              {/* Escape options for paid path */}
              <div style={{ borderTop: "1px solid #E2E8F0", paddingTop: 12, marginTop: 4, display: "flex", flexDirection: "column", gap: 8 }}>
                {onDismiss && (
                  <button
                    onClick={onDismiss}
                    style={{ width: "100%", padding: "10px 20px", borderRadius: 10, border: "1.5px solid #CBD5E1", background: "#F8FAFC", color: "#374151", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", touchAction: "manipulation" }}
                  >
                    🔄 Try Another 15 Free Questions
                  </button>
                )}
                <Link href="/pricing">
                  <button
                    style={{ width: "100%", padding: "10px 20px", borderRadius: 10, border: "1.5px solid #CBD5E1", background: "#F8FAFC", color: "#374151", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", touchAction: "manipulation" }}
                  >
                    📋 View All Courses & Pricing
                  </button>
                </Link>
                <Link href="/">
                  <button
                    style={{ width: "100%", padding: "10px 20px", borderRadius: 10, border: "none", background: "transparent", color: "#94A3B8", fontSize: 12, fontWeight: 500, cursor: "pointer", fontFamily: "inherit", touchAction: "manipulation" }}
                  >
                    ← Back to Homepage
                  </button>
                </Link>
              </div>
            </>
          ) : (
            /* ── FREE PATH — only shown when no productKey (OIT free course) ── */
            <>
              <p style={{ color: "#475569", fontSize: 14, lineHeight: 1.6, marginBottom: 20 }}>
                Enter your email to continue with the <strong>full question bank</strong> — completely free.
              </p>
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
                    border: "none",
                    background: "linear-gradient(135deg, #1D4ED8 0%, #0EA5E9 100%)",
                    color: "#fff",
                    fontSize: 14,
                    fontWeight: 700,
                    cursor: unlockMutation.isPending ? "not-allowed" : "pointer",
                    fontFamily: "inherit",
                    touchAction: "manipulation",
                  }}
                >
                  {unlockMutation.isPending ? "Unlocking…" : "Unlock Full Access — Free →"}
                </button>
                <p style={{ color: "#94A3B8", fontSize: 11, marginTop: 10 }}>No spam, no credit card.</p>
              </form>
              <div style={{ borderTop: "1px solid #E2E8F0", paddingTop: 14, marginTop: 14, display: "flex", flexDirection: "column", gap: 8 }}>
                {onDismiss && (
                  <button
                    onClick={onDismiss}
                    style={{ width: "100%", padding: "10px 20px", borderRadius: 10, border: "1.5px solid #CBD5E1", background: "#F8FAFC", color: "#374151", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", touchAction: "manipulation" }}
                  >
                    🔄 Try Another 15 Free Questions
                  </button>
                )}
                <Link href="/">
                  <button
                    style={{ width: "100%", padding: "10px 20px", borderRadius: 10, border: "1.5px solid #CBD5E1", background: "#F8FAFC", color: "#374151", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", touchAction: "manipulation" }}
                  >
                    ← Back to Homepage
                  </button>
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );

  // Use portal to render directly into document.body — bypasses any parent
  // CSS transforms, overflow:hidden, or position:fixed on body that would
  // trap fixed positioning on mobile Chrome/Safari.
  if (!mounted) return null;

  // Show feedback modal first (before the gate), then transition to the gate
  if (showFeedback && !feedbackDone && !submitted) {
    return createPortal(
      <FeedbackModal
        examType={examType ?? productKey ?? "unknown"}
        feedbackType="quiz_gate"
        onClose={() => { setShowFeedback(false); setFeedbackDone(true); }}
        onSubmitted={() => { setShowFeedback(false); setFeedbackDone(true); }}
      />,
      document.body,
    );
  }

  return createPortal(submitted ? successContent : gateContent, document.body);
}
