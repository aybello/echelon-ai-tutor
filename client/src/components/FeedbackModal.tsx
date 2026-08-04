/**
 * FeedbackModal — Review funnel that routes users based on rating:
 *  - 4-5 stars → redirects to Google review (one action = Google review)
 *  - 1-3 stars → shows internal comment form (keeps complaints private)
 *
 * Shown in multiple contexts:
 *  1. After 15 free questions (quiz gate)
 *  2. After a quiz session completes
 *  3. After mock exam completion
 *  4. After first 80%+ score (one-time)
 */

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { trpc } from "@/lib/trpc";
import { isHappyRating, openGoogleReview, markReviewPromptShown, markAsReviewed } from "@/lib/reviewFunnel";

interface FeedbackModalProps {
  examType: string;
  feedbackType: "quiz_gate" | "session_complete" | "mock_exam" | "first_high_score";
  onClose: () => void;
  onSubmitted?: () => void;
}

const STAR_LABELS = ["", "Poor", "Fair", "Good", "Great", "Excellent"];

export default function FeedbackModal({
  examType,
  feedbackType,
  onClose,
  onSubmitted,
}: FeedbackModalProps) {
  const [rating, setRating] = useState(0);
  const [hoveredStar, setHoveredStar] = useState(0);
  const [comment, setComment] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [redirectedToGoogle, setRedirectedToGoogle] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    markReviewPromptShown();
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, []);

  const submitMutation = trpc.feedback.submit.useMutation({
    onSuccess: () => {
      setSubmitted(true);
      setTimeout(() => {
        onSubmitted?.();
        onClose();
      }, 1800);
    },
    onError: () => {
      setSubmitted(true);
      setTimeout(() => {
        onSubmitted?.();
        onClose();
      }, 1800);
    },
  });

  function handleStarClick(star: number) {
    setRating(star);

    // If happy rating (4-5), redirect to Google immediately
    if (isHappyRating(star)) {
      // Still record internally that they gave a high rating
      let province: string | undefined;
      try { province = localStorage.getItem("echelon_province") ?? undefined; } catch {}
      let email: string | undefined;
      try { email = localStorage.getItem("echelon_trial_email") ?? undefined; } catch {}

      submitMutation.mutate({
        examType,
        rating: star,
        comment: "[Redirected to Google Review]",
        feedbackType,
        province,
        email,
      });

      // Open Google review
      openGoogleReview();
      setRedirectedToGoogle(true);

      // Auto-close after a moment
      setTimeout(() => {
        onSubmitted?.();
        onClose();
      }, 2500);
    }
  }

  function handleSubmit() {
    if (rating === 0) return;
    let province: string | undefined;
    try { province = localStorage.getItem("echelon_province") ?? undefined; } catch {}
    let email: string | undefined;
    try { email = localStorage.getItem("echelon_trial_email") ?? undefined; } catch {}

    submitMutation.mutate({
      examType,
      rating,
      comment: comment.trim() || undefined,
      feedbackType,
      province,
      email,
    });
  }

  const activeStar = hoveredStar || rating;

  // Thank you state after Google redirect
  if (redirectedToGoogle) {
    const content = (
      <div style={{
        position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
        background: "rgba(15,23,42,0.55)",
        backdropFilter: "blur(8px)",
        WebkitBackdropFilter: "blur(8px)",
        zIndex: 99998,
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: 20,
      }}>
        <div style={{
          background: "#fff", borderRadius: 20, padding: "36px 32px",
          maxWidth: 420, width: "100%",
          boxShadow: "0 32px 80px rgba(0,0,0,0.35)",
          textAlign: "center",
          animation: "feedbackFadeIn 0.3s ease",
        }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>⭐</div>
          <h3 style={{ fontSize: 20, fontWeight: 800, color: "#0F172A", marginBottom: 8, fontFamily: "Sora, sans-serif" }}>
            Thanks! A Google Review tab opened.
          </h3>
          <p style={{ color: "#64748B", fontSize: 14 }}>
            Your review helps other operators find quality training.
          </p>
        </div>
      </div>
    );
    if (!mounted) return null;
    return createPortal(content, document.body);
  }

  // Thank you state after internal submission
  if (submitted) {
    const content = (
      <div style={{
        position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
        background: "rgba(15,23,42,0.55)",
        backdropFilter: "blur(8px)",
        WebkitBackdropFilter: "blur(8px)",
        zIndex: 99998,
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: 20,
      }}>
        <div style={{
          background: "#fff", borderRadius: 20, padding: "36px 32px",
          maxWidth: 420, width: "100%",
          boxShadow: "0 32px 80px rgba(0,0,0,0.35)",
          textAlign: "center",
          animation: "feedbackFadeIn 0.3s ease",
        }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>💙</div>
          <h3 style={{ fontSize: 20, fontWeight: 800, color: "#0F172A", marginBottom: 8, fontFamily: "Sora, sans-serif" }}>
            Thank you for your feedback!
          </h3>
          <p style={{ color: "#64748B", fontSize: 14 }}>
            Your input helps us improve Echelon for every operator.
          </p>
        </div>
      </div>
    );
    if (!mounted) return null;
    return createPortal(content, document.body);
  }

  // Main form — shows comment only for 1-3 star ratings
  const showCommentForm = rating > 0 && !isHappyRating(rating);

  const content = (
    <div style={{
      position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
      background: "rgba(15,23,42,0.55)",
      backdropFilter: "blur(8px)",
      WebkitBackdropFilter: "blur(8px)",
      zIndex: 99998,
      display: "flex", alignItems: "center", justifyContent: "center",
      padding: "20px 16px",
      overflowY: "auto",
      WebkitOverflowScrolling: "touch",
    }}>
      <style>{`
        @keyframes feedbackFadeIn {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .fb-star { cursor: pointer; transition: transform 0.15s ease; display: inline-block; }
        .fb-star:hover { transform: scale(1.2); }
        .fb-star:active { transform: scale(0.95); }
      `}</style>
      <div style={{
        background: "#fff", borderRadius: 20,
        padding: "28px 24px 24px",
        maxWidth: 440, width: "100%",
        boxShadow: "0 32px 80px rgba(0,0,0,0.35)",
        textAlign: "center",
        position: "relative",
        animation: "feedbackFadeIn 0.3s ease",
        maxHeight: "calc(100vh - 40px)",
        overflowY: "auto",
      }}>
        {/* Skip button */}
        <button
          onClick={onClose}
          aria-label="Skip feedback"
          style={{
            position: "absolute", top: 14, right: 14,
            width: 32, height: 32, borderRadius: "50%",
            background: "#F1F5F9", border: "1px solid #E2E8F0",
            display: "flex", alignItems: "center", justifyContent: "center",
            cursor: "pointer", fontSize: 15, color: "#64748B",
            lineHeight: 1, padding: 0,
          }}
        >
          ✕
        </button>

        {/* Header */}
        <div style={{ fontSize: 36, marginBottom: 10 }}>
          {feedbackType === "quiz_gate" ? "📝" : feedbackType === "mock_exam" ? "🏆" : feedbackType === "first_high_score" ? "🎉" : "🎯"}
        </div>
        <h3 style={{
          fontSize: 19, fontWeight: 800, color: "#0F172A",
          marginBottom: 6, fontFamily: "Sora, sans-serif",
        }}>
          {feedbackType === "quiz_gate"
            ? "How was your experience?"
            : feedbackType === "mock_exam"
            ? "How was that exam?"
            : feedbackType === "first_high_score"
            ? "Nice score! How's Echelon working for you?"
            : "How was this session?"}
        </h3>
        <p style={{ color: "#64748B", fontSize: 13, marginBottom: 20, lineHeight: 1.5 }}>
          {feedbackType === "quiz_gate"
            ? "Quick feedback before you continue — it helps us improve!"
            : feedbackType === "mock_exam"
            ? "Rate your mock exam experience."
            : feedbackType === "first_high_score"
            ? "You're clearly learning — let us know how it's going."
            : "Rate your practice session — your feedback shapes Echelon."}
        </p>

        {/* Star rating */}
        <div style={{ marginBottom: 8 }}>
          {[1, 2, 3, 4, 5].map((star) => (
            <span
              key={star}
              className="fb-star"
              role="button"
              aria-label={`${star} star${star > 1 ? "s" : ""}`}
              onClick={() => handleStarClick(star)}
              onMouseEnter={() => setHoveredStar(star)}
              onMouseLeave={() => setHoveredStar(0)}
              style={{
                fontSize: 36,
                padding: "0 4px",
                color: star <= activeStar ? "#F59E0B" : "#E2E8F0",
                filter: star <= activeStar ? "drop-shadow(0 1px 2px rgba(245,158,11,0.3))" : "none",
              }}
            >
              ★
            </span>
          ))}
        </div>
        <div style={{
          fontSize: 13, fontWeight: 600, color: "#1D4ED8",
          marginBottom: 18, minHeight: 20,
        }}>
          {activeStar > 0 ? STAR_LABELS[activeStar] : "Tap a star to rate"}
        </div>

        {/* Comment form — only for 1-3 stars (unhappy path) */}
        {showCommentForm && (
          <>
            <p style={{ color: "#64748B", fontSize: 12, marginBottom: 10 }}>
              We're sorry to hear that. What could we do better?
            </p>
            <textarea
              placeholder="Tell us what went wrong..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              maxLength={1000}
              rows={3}
              style={{
                width: "100%",
                padding: "10px 14px",
                borderRadius: 10,
                border: "1.5px solid #E2E8F0",
                fontSize: 14,
                fontFamily: "inherit",
                resize: "vertical",
                outline: "none",
                boxSizing: "border-box",
                marginBottom: 16,
                minHeight: 72,
              }}
              onFocus={(e) => { e.target.style.borderColor = "#1D4ED8"; }}
              onBlur={(e) => { e.target.style.borderColor = "#E2E8F0"; }}
            />

            {/* Submit button */}
            <button
              onClick={handleSubmit}
              disabled={submitMutation.isPending}
              style={{
                width: "100%",
                padding: "13px 20px",
                borderRadius: 12,
                border: "none",
                background: "linear-gradient(135deg, #1D4ED8 0%, #0EA5E9 100%)",
                color: "#fff",
                fontSize: 15,
                fontWeight: 800,
                cursor: "pointer",
                fontFamily: "inherit",
                touchAction: "manipulation",
                letterSpacing: "0.01em",
              }}
            >
              {submitMutation.isPending ? "Sending…" : "Submit Feedback"}
            </button>
          </>
        )}

        {/* "I already left a review" — permanently suppress */}
        <button
          onClick={() => {
            markAsReviewed();
            onClose();
          }}
          style={{
            display: "block",
            width: "100%",
            padding: "10px",
            background: "transparent",
            border: "none",
            color: "#1D4ED8",
            fontSize: 12,
            fontWeight: 600,
            cursor: "pointer",
            fontFamily: "inherit",
            marginTop: 12,
          }}
        >
          I already left a review
        </button>

        {/* Skip link */}
        <button
          onClick={onClose}
          style={{
            display: "block",
            width: "100%",
            padding: "10px",
            background: "transparent",
            border: "none",
            color: "#94A3B8",
            fontSize: 12,
            fontWeight: 500,
            cursor: "pointer",
            fontFamily: "inherit",
            marginTop: 4,
          }}
        >
          Skip for now
        </button>
      </div>
    </div>
  );

  if (!mounted) return null;
  return createPortal(content, document.body);
}
