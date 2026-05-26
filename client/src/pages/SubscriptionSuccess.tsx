// Echelon Institute — Subscription Success Page
// Shown after a successful annual subscription checkout

import { useEffect, useRef, useState } from "react";
import { Link, useLocation } from "wouter";
import { usePageMeta } from "@/hooks/usePageMeta";
import LandingNav from "@/components/LandingNav";

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

  const params = new URLSearchParams(window.location.search);
  const tier = params.get("tier") ?? "all-access";
  const province = params.get("province") ?? "ontario";
  const tierLabel = TIER_LABELS[tier] ?? "All-Access";
  const quizPath = province === "western"
    ? (TIER_QUIZ_PATHS_WPI[tier] ?? "/wpi-class1-water")
    : (TIER_QUIZ_PATHS_ONTARIO[tier] ?? "/quiz");
  const provinceLabel = province === "ontario" ? "Ontario (EOCP)" : "Western Canada (WPI)";

  useEffect(() => {
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
  }, [quizPath, setLocation]);

  return (
    <div style={{
      minHeight: "100vh",
      background: "linear-gradient(135deg, #0F172A 0%, #1E1B4B 50%, #0F172A 100%)",
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
        <h1 style={{ fontSize: 24, fontWeight: 900, color: "#0F172A", margin: "0 0 8px" }}>
          Subscription Activated!
        </h1>
        <p style={{ fontSize: 15, color: "#475569", margin: "0 0 20px", lineHeight: 1.6 }}>
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
          <ul style={{ margin: 0, padding: "0 0 0 16px", fontSize: 13, color: "#475569", lineHeight: 1.8 }}>
            <li>Unlimited practice questions for all included exam types</li>
            <li>AI Tutor with step-by-step explanations</li>
            <li>Timed mock exams &amp; score history</li>
            <li>Flashcards &amp; module study notes</li>
            <li>Access valid for 12 months from today</li>
          </ul>
        </div>
        <Link href={quizPath}>
          <button style={{
            width: "100%", padding: "14px 0", borderRadius: 12,
            background: "linear-gradient(135deg, #7C3AED, #4F46E5)",
            color: "#fff", border: "none", fontSize: 15, fontWeight: 800,
            cursor: "pointer", fontFamily: "inherit", marginBottom: 12,
          }}>
            Start Studying Now →
          </button>
        </Link>
        <Link href="/account">
          <button style={{
            width: "100%", padding: "12px 0", borderRadius: 12,
            background: "#F1F5F9", color: "#475569",
            border: "1.5px solid #E2E8F0", fontSize: 14, fontWeight: 600,
            cursor: "pointer", fontFamily: "inherit", marginBottom: 16,
          }}>
            View My Subscriptions
          </button>
        </Link>
        <p style={{ fontSize: 12, color: "#94A3B8", margin: 0 }}>
          Redirecting to your study page in {countdown}s…
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
