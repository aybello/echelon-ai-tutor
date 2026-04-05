// PurchaseGate — checks if the user has purchased a specific exam type
// If not purchased, shows a paywall overlay with a Stripe checkout CTA
// Usage: wrap the quiz content in <PurchaseGate examType="oit" productKey="oit" productName="OIT Practice Pass" price={49} />

import { useState } from "react";
import { Link, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { loginWithReturnPath } from "@/const";

const LOGO_URL = "https://d2xsxph8kpxj0f.cloudfront.net/310519663446228701/9KAR7mkGo7x7xavTEeEpiA/echelon-icon-v2_37a8727b.png";

interface PurchaseGateProps {
  examType: string;       // e.g. "oit", "class1-water", "wqa"
  productKey: string;     // e.g. "oit", "class1-water", "wqa"
  productName: string;    // e.g. "OIT Practice Pass"
  price: number;          // in dollars, e.g. 49
  children: React.ReactNode;
  /** Optional feature bullets shown in the paywall */
  features?: string[];
}

/** Read email from localStorage (set during QuizGate or PurchaseSuccess) */
function getStoredEmail(): string {
  try {
    return localStorage.getItem("echelon_trial_email") ?? "";
  } catch {
    return "";
  }
}

/** Check if a product key is in the locally stored purchased products list */
function isLocallyPurchased(examType: string): boolean {
  try {
    const keys = JSON.parse(localStorage.getItem("echelon_purchased_products") ?? "[]") as string[];
    return keys.includes(examType);
  } catch {
    return false;
  }
}

const DEFAULT_FEATURES: Record<string, string[]> = {
  "wqa": [
    "300-question WQA bank — unlimited attempts",
    "Timed WQA mock exam (100 questions, 2 hrs)",
    "WQA formula sheet (30+ formulas)",
    "AI Tutor explanations on every question",
  ],
  "class4-water": [
    "500 Class 4 Water questions — unlimited attempts",
    "Timed Class 4 Water mock exam",
    "Class 4 Water formula sheet (37 formulas)",
    "AI Tutor explanations on every question",
  ],
  "class3-water": [
    "500+ Class 3 Water questions — unlimited attempts",
    "Timed Class 3 Water mock exam",
    "Class 3 Water formula sheet",
    "AI Tutor explanations on every question",
  ],
  "class3-ww": [
    "502 Class 3 WW questions — unlimited attempts",
    "Timed Class 3 WW mock exam",
    "WW3 formula sheet",
    "AI Tutor explanations on every question",
  ],
  "class4-ww": [
    "500 Class 4 WW questions — unlimited attempts",
    "Timed Class 4 WW mock exam (100 questions, 2 hrs)",
    "Class 4 WW formula sheet (30+ formulas)",
    "AI Tutor explanations on every question",
  ],
  "class2-water": [
    "500+ Class 2 Water questions — unlimited attempts",
    "Timed Class 2 Water mock exam",
    "Water2 formula sheet",
    "AI Tutor explanations on every question",
  ],
  "class2-ww": [
    "500+ Class 2 WW questions — unlimited attempts",
    "Timed Class 2 WW mock exam",
    "WW2 formula sheet",
    "AI Tutor explanations on every question",
  ],
  "class1-water": [
    "500+ Class 1 Water questions — unlimited attempts",
    "Timed Class 1 Water mock exam",
    "Water1 formula sheet",
    "AI Tutor explanations on every question",
  ],
  "class1-ww": [
    "500+ Class 1 WW questions — unlimited attempts",
    "Timed Class 1 WW mock exam",
    "WW1 formula sheet",
    "AI Tutor explanations on every question",
  ],
};

const FALLBACK_FEATURES = [
  "Full question bank — unlimited attempts",
  "Timed mock exam",
  "AI Tutor explanations on every question",
  "Score history & module breakdown",
];

export default function PurchaseGate({
  examType,
  productKey,
  productName,
  price,
  children,
  features,
}: PurchaseGateProps) {
  const [email] = useState(getStoredEmail);
  const [localAccess] = useState(() => isLocallyPurchased(examType));
  const [, navigate] = useLocation();
  const { isAuthenticated } = useAuth();

  // Stripe checkout session mutation
  const createSession = trpc.stripe.createCheckoutSession.useMutation({
    onSuccess: (data) => {
      if (data.url) window.location.href = data.url;
    },
    onError: () => {
      alert("Something went wrong starting checkout. Please try again.");
    },
  });

  // Server-side access check — runs when logged in (for owner bypass) or when email is stored
  const { data: accessData, isLoading } = trpc.stripe.checkAccess.useQuery(
    { examType, email: email || undefined },
    {
      enabled: (!!email || isAuthenticated) && !localAccess,
      staleTime: 5 * 60 * 1000,
      retry: false,
    }
  );

  const hasAccess = localAccess || accessData?.hasAccess === true;

  // While checking, show the children (optimistic — avoids flash of paywall)
  if (isLoading && (email || isAuthenticated)) {
    return <>{children}</>;
  }

  // Access granted — render children
  if (hasAccess) {
    return <>{children}</>;
  }

  const featureList = features ?? DEFAULT_FEATURES[productKey] ?? FALLBACK_FEATURES;

  function handleBuyNow() {
    createSession.mutate({ productKey, email: email || undefined, origin: window.location.origin });
  }

  // No access — show paywall
  return (
    <div
      style={{
        fontFamily: "Sora, Nunito, sans-serif",
        minHeight: "100vh",
        background: "#F8FAFC",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "40px 24px",
        position: "relative",
      }}
    >
      <div
        style={{
          background: "#fff",
          borderRadius: 20,
          border: "1.5px solid #E2E8F0",
          padding: "40px 36px 36px",
          maxWidth: 500,
          width: "100%",
          textAlign: "center",
          boxShadow: "0 4px 24px rgba(0,0,0,0.08)",
          position: "relative",
        }}
      >
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
          }}
        >
          ✕
        </button>
        {/* Full logo: droplets icon + "Echelon Institute" text */}
        <Link href="/">
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 10,
              marginBottom: 24,
              cursor: "pointer",
              textDecoration: "none",
            }}
          >
            <img
              src={LOGO_URL}
              alt="Echelon Institute"
              style={{ height: 36, width: "auto", objectFit: "contain" }}
            />
            <span
              style={{
                fontFamily: "'Sora', sans-serif",
                fontWeight: 800,
                fontSize: 17,
                color: "#0F172A",
                letterSpacing: "-0.02em",
                whiteSpace: "nowrap",
              }}
            >
              Echelon Institute
            </span>
          </div>
        </Link>

        <div
          style={{
            width: 56,
            height: 56,
            borderRadius: "50%",
            background: "#EFF6FF",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: "0 auto 16px",
            fontSize: 26,
          }}
        >
          🔒
        </div>

        <h2
          style={{
            fontSize: 22,
            fontWeight: 900,
            color: "#0F172A",
            margin: "0 0 6px",
            letterSpacing: "-0.5px",
          }}
        >
          Unlock {productName}
        </h2>
        <p style={{ color: "#64748B", fontSize: 14, lineHeight: 1.6, margin: "0 0 20px" }}>
          One-time payment · No subscription · Access never expires
        </p>

        {/* Feature bullets */}
        <div
          style={{
            background: "linear-gradient(135deg, #EFF6FF 0%, #F0FDFA 100%)",
            border: "1.5px solid #BFDBFE",
            borderRadius: 14,
            padding: "16px 20px",
            marginBottom: 20,
            textAlign: "left",
          }}
        >
          <ul style={{ margin: 0, padding: 0, listStyle: "none" }}>
            {featureList.map((f) => (
              <li key={f} style={{ fontSize: 13, color: "#1E3A5F", marginBottom: 7, display: "flex", alignItems: "flex-start", gap: 8 }}>
                <span style={{ color: "#059669", fontWeight: 700, flexShrink: 0, marginTop: 1 }}>✓</span>
                <span>{f}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Price */}
        <div
          style={{
            fontSize: 36,
            fontWeight: 900,
            color: "#0F172A",
            lineHeight: 1,
            marginBottom: 4,
          }}
        >
          CA${price}
        </div>
        <div style={{ fontSize: 12, color: "#94A3B8", marginBottom: 20 }}>
          one-time · no subscription · instant access
        </div>

        {/* CTAs */}
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <button
            onClick={handleBuyNow}
            disabled={createSession.isPending}
            style={{
              width: "100%",
              padding: "13px 0",
              borderRadius: 10,
              background: createSession.isPending
                ? "#93C5FD"
                : "linear-gradient(135deg, #1D4ED8, #0E7490)",
              color: "#fff",
              border: "none",
              fontSize: 15,
              fontWeight: 800,
              cursor: createSession.isPending ? "not-allowed" : "pointer",
              fontFamily: "inherit",
              letterSpacing: "0.01em",
            }}
          >
            {createSession.isPending
              ? "Redirecting to checkout…"
              : `Get Full Access — CA$${price} →`}
          </button>
          <p style={{ fontSize: 11, color: "#64748B", margin: "0 0 4px", textAlign: "center" }}>
            Secure checkout via Stripe
          </p>

          <Link href="/pricing">
            <button
              style={{
                width: "100%",
                padding: "11px 0",
                borderRadius: 10,
                background: "#fff",
                color: "#475569",
                border: "1.5px solid #E2E8F0",
                fontSize: 13,
                fontWeight: 600,
                cursor: "pointer",
                fontFamily: "inherit",
              }}
            >
              📋 View All Courses & Pricing
            </button>
          </Link>

          <Link href="/quiz">
            <button
              style={{
                width: "100%",
                padding: "10px 0",
                borderRadius: 10,
                background: "transparent",
                color: "#94A3B8",
                border: "none",
                fontSize: 12,
                fontWeight: 500,
                cursor: "pointer",
                fontFamily: "inherit",
              }}
            >
              Try Free OIT Practice Instead
            </button>
          </Link>
        </div>

        <div
          style={{
            marginTop: 20,
            paddingTop: 16,
            borderTop: "1px solid #E2E8F0",
            fontSize: 11,
            color: "#94A3B8",
            lineHeight: 1.6,
          }}
        >
          Already purchased?{" "}
          <a href="/account" style={{ color: "#1D4ED8", fontWeight: 600 }}>
            Restore access →
          </a>
          <br />
          <a
            href="#"
            onClick={(e) => { e.preventDefault(); loginWithReturnPath(window.location.pathname); }}
            style={{ color: "#64748B", fontWeight: 500, marginTop: 4, display: "inline-block" }}
          >
            Log in to your account →
          </a>
        </div>
      </div>

      {/* Back to homepage text link at bottom */}
      <Link href="/">
        <button
          style={{
            marginTop: 20,
            background: "transparent",
            border: "none",
            color: "#94A3B8",
            fontSize: 13,
            cursor: "pointer",
            fontFamily: "inherit",
            fontWeight: 500,
          }}
        >
          ← Back to Homepage
        </button>
      </Link>
    </div>
  );
}
