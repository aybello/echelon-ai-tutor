// Echelon Institute — Subscription Success Page
// Shown after a successful annual subscription checkout.
// Calls verifySubscriptionSession to confirm payment server-side, then writes
// subscription access to localStorage so the customer can study immediately
// without needing to log in first.
import { useEffect, useRef, useState } from "react";
import { Link, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { usePageMeta } from "@/hooks/usePageMeta";
import LandingNav from "@/components/LandingNav";

/** Write subscription access to localStorage so the quiz gate lifts immediately. */
function writeSubscriptionAccess(email: string, tier: string, province: string, examTypes: string[], accessToken?: string | null) {
  try {
    localStorage.setItem("echelon_subscription_email", email);
    localStorage.setItem("echelon_subscription_tier", tier);
    localStorage.setItem("echelon_subscription_province", province);
    localStorage.setItem("echelon_subscription_exam_types", JSON.stringify(examTypes));
    // Also set the global trial-unlocked flag so the quiz gate lifts immediately
    localStorage.setItem("echelon_trial_unlocked", "true");
    if (email) {
      localStorage.setItem("echelon_trial_email", email);
    }
    // Store signed JWT access token so server can verify without a DB lookup on every question fetch
    if (accessToken) {
      localStorage.setItem("echelon_access_token", accessToken);
    }
  } catch {
    // ignore — localStorage may be unavailable in some browsers
  }
}

const LOGO_URL = "https://d2xsxph8kpxj0f.cloudfront.net/310519663446228701/9KAR7mkGo7x7xavTEeEpiA/echelon-icon-v2_5c9ed3a7.webp";

const TIER_LABELS: Record<string, string> = {
  "class1": "Class 1 All-Access",
  "class2": "Class 2 All-Access",
  "class3": "Class 3 All-Access",
  "class4": "Class 4 All-Access",
  "all-access": "All-Access Pass",
};

const TIER_QUIZ_PATHS_ONTARIO: Record<string, string> = {
  "class1": "/quiz",
  "class2": "/class2-water",
  "class3": "/class3-water",
  "class4": "/class4-water",
  "all-access": "/quiz",
};

const TIER_QUIZ_PATHS_WPI: Record<string, string> = {
  "class1": "/wpi-class1-water",
  "class2": "/wpi-class2-water",
  "class3": "/wpi-class3-water",
  "class4": "/wpi-class4-water",
  "all-access": "/wpi-class1-water",
};

export default function SubscriptionSuccess() {
  usePageMeta({
    title: "Subscription Activated — Echelon Institute",
    description: "Your Echelon Institute annual subscription is now active.",
  });

  const [, setLocation] = useLocation();
  const [countdown, setCountdown] = useState(8);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [accessWritten, setAccessWritten] = useState(false);

  // Read URL params — tier/province passed as convenience fallback
  const params = new URLSearchParams(window.location.search);
  const sessionId = params.get("session_id") ?? "";
  const tier = params.get("tier") ?? "all-access";
  const province = params.get("province") ?? "ontario";
  const tierLabel = TIER_LABELS[tier] ?? "All-Access";
  const quizPath = province === "western"
    ? (TIER_QUIZ_PATHS_WPI[tier] ?? "/wpi-class1-water")
    : (TIER_QUIZ_PATHS_ONTARIO[tier] ?? "/quiz");
  const provinceLabel = province === "ontario" ? "Ontario (EOCP)" : "Western Canada (WPI)";

  // ── Verify session server-side and write localStorage access ──────────────
  const verifyMutation = trpc.stripe.verifySubscriptionSession.useMutation({
    onSuccess: (data) => {
      if (data.paid && data.examTypes.length > 0) {
        writeSubscriptionAccess(data.email, data.tier || tier, data.province || province, data.examTypes, data.accessToken);
      } else {
        // Fallback: set trial-unlocked so they're not completely blocked
        try { localStorage.setItem("echelon_trial_unlocked", "true"); } catch {}
      }
      setAccessWritten(true);
    },
    onError: () => {
      // Best-effort fallback — server-side checkAccess will be authoritative once they log in
      try { localStorage.setItem("echelon_trial_unlocked", "true"); } catch {}
      setAccessWritten(true);
    },
  });

  // Fire the verification once on mount
  useEffect(() => {
    if (sessionId) {
      verifyMutation.mutate({ sessionId });
    } else {
      setAccessWritten(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId]);

  // Start countdown once access is written
  useEffect(() => {
    if (!accessWritten) return;
    intervalRef.current = setInterval(() => {
      setCountdown(c => {
        if (c <= 1) {
          clearInterval(intervalRef.current!);
          setLocation(quizPath);
          return 0;
        }
        return c - 1;
      });
    }, 1000);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [accessWritten, quizPath, setLocation]);

  return (
    <div style={{
      minHeight: "100vh",
      background: "linear-gradient(135deg, #EFF6FF 0%, #E0F2FE 100%)",
      display: "flex",
      flexDirection: "column",
      fontFamily: "'Sora', sans-serif",
    }}>
      <LandingNav currentPath="/subscription-success" />
      <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "24px 16px", width: "100%" }}>
      <div style={{
        background: "#fff",
        borderRadius: 20,
        padding: "40px 36px",
        maxWidth: 520,
        width: "100%",
        textAlign: "center",
        boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
      }}>
        <img src={LOGO_URL} alt="Echelon Institute" style={{ height: 48, width: "auto", objectFit: "contain", marginBottom: 16 }} />
        <div style={{
          width: 64, height: 64, borderRadius: "50%",
          background: "linear-gradient(135deg, #7C3AED, #4F46E5)",
          display: "flex", alignItems: "center", justifyContent: "center",
          margin: "0 auto 20px", fontSize: 28, color: "#fff",
        }}>✓</div>
        <h1 style={{ fontSize: 24, fontWeight: 900, color: "#FFFFFF", margin: "0 0 8px" }}>
          Subscription Activated!
        </h1>
        <p style={{ fontSize: 15, color: "#64748B", margin: "0 0 20px", lineHeight: 1.6 }}>
          Your <strong>{tierLabel}</strong> subscription for <strong>{provinceLabel}</strong> is now active.
          You have full access to all included exam types for the next 12 months.
        </p>
        <div style={{
          background: "#F5F3FF", border: "1.5px solid #C4B5FD",
          borderRadius: 12, padding: "16px 20px", marginBottom: 24, textAlign: "left",
        }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: "#7C3AED", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8 }}>
            Your subscription includes
          </div>
          <ul style={{ margin: 0, padding: "0 0 0 16px", fontSize: 13, color: "#64748B", lineHeight: 1.8 }}>
            <li>Unlimited practice questions for all included exam types</li>
            <li>AI Tutor with step-by-step explanations</li>
            <li>Timed mock exams &amp; score history</li>
            <li>Flashcards &amp; module study notes</li>
            <li>Access valid for 12 months from today</li>
          </ul>
        </div>
        <Link href={quizPath}>
          <button
            onClick={() => { if (intervalRef.current) clearInterval(intervalRef.current); }}
            style={{
              width: "100%", padding: "14px 0", borderRadius: 12,
              background: "linear-gradient(135deg, #7C3AED, #4F46E5)",
              color: "#fff", border: "none", fontSize: 15, fontWeight: 800,
              cursor: "pointer", fontFamily: "inherit", marginBottom: 12,
            }}
          >
            Start Studying Now →
          </button>
        </Link>
        <Link href="/account">
          <button
            onClick={() => { if (intervalRef.current) clearInterval(intervalRef.current); }}
            style={{
              width: "100%", padding: "12px 0", borderRadius: 12,
              background: "#FFFFFF", color: "#64748B",
              border: "1.5px solid #E2E8F0", fontSize: 14, fontWeight: 600,
              cursor: "pointer", fontFamily: "inherit", marginBottom: 16,
            }}
          >
            View My Subscriptions
          </button>
        </Link>
        <p style={{ fontSize: 12, color: "#64748B", margin: 0 }}>
          {accessWritten
            ? `Redirecting to your study page in ${countdown}s…`
            : "Activating your access…"}
        </p>
      </div>
      <p style={{ marginTop: 24, fontSize: 12, color: "rgba(255,255,255,0.4)", textAlign: "center" }}>
        Questions? Email us at{" "}
        <a href="mailto:support@echeloninstitute.ca" style={{ color: "rgba(255,255,255,0.6)" }}>
          support@echeloninstitute.ca
        </a>
      </p>
      </div>
    </div>
  );
}
