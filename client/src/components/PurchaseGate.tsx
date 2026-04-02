// PurchaseGate — checks if the user has purchased a specific exam type
// If not purchased, shows a paywall overlay with a link to the Pricing page
// Usage: wrap the quiz content in <PurchaseGate examType="oit" productKey="oit" productName="OIT Practice Pass" price={49} />

import { useState, useEffect } from "react";
import { Link } from "wouter";
import { trpc } from "@/lib/trpc";

const LOGO_URL = "https://d2xsxph8kpxj0f.cloudfront.net/310519663446228701/9KAR7mkGo7x7xavTEeEpiA/echelon-icon-v2_37a8727b.png";

interface PurchaseGateProps {
  examType: string;       // e.g. "oit", "class1-water", "wqa"
  productKey: string;     // e.g. "oit", "class1-water", "wqa"
  productName: string;    // e.g. "OIT Practice Pass"
  price: number;          // in dollars, e.g. 49
  children: React.ReactNode;
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
    // Direct match on product key or exam type
    if (keys.includes(examType)) return true;
    // Bundle checks
    if (keys.includes("bundle-all")) return true;
    if (
      (examType === "oit" || examType.includes("-water")) &&
      keys.includes("bundle-water")
    )
      return true;
    if (examType.includes("-ww") && keys.includes("bundle-ww")) return true;
    return false;
  } catch {
    return false;
  }
}

export default function PurchaseGate({
  examType,
  productKey,
  productName,
  price,
  children,
}: PurchaseGateProps) {
  const [email] = useState(getStoredEmail);
  const [localAccess] = useState(() => isLocallyPurchased(examType));

  // Server-side access check (only if we have an email)
  const { data: accessData, isLoading } = trpc.stripe.checkAccess.useQuery(
    { examType, email: email || undefined },
    {
      enabled: !!email && !localAccess,
      staleTime: 5 * 60 * 1000, // 5 min cache
      retry: false,
    }
  );

  const hasAccess = localAccess || accessData?.hasAccess === true;

  // While checking, show the children (optimistic — avoids flash of paywall)
  if (isLoading && email) {
    return <>{children}</>;
  }

  // Access granted — render children
  if (hasAccess) {
    return <>{children}</>;
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
      }}
    >
      <div
        style={{
          background: "#fff",
          borderRadius: 20,
          border: "1.5px solid #E2E8F0",
          padding: "48px 40px",
          maxWidth: 480,
          width: "100%",
          textAlign: "center",
          boxShadow: "0 4px 24px rgba(0,0,0,0.08)",
        }}
      >
        <img
          src={LOGO_URL}
          alt="Echelon Institute"
          style={{ height: 44, marginBottom: 20, objectFit: "contain" }}
        />

        <div
          style={{
            width: 56,
            height: 56,
            borderRadius: "50%",
            background: "#EFF6FF",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: "0 auto 20px",
            fontSize: 28,
          }}
        >
          🔒
        </div>

        <h2
          style={{
            fontSize: 22,
            fontWeight: 900,
            color: "#0F172A",
            margin: "0 0 10px",
            letterSpacing: "-0.5px",
          }}
        >
          Unlock Full Access
        </h2>
        <p
          style={{
            color: "#64748B",
            fontSize: 14,
            lineHeight: 1.65,
            margin: "0 0 24px",
          }}
        >
          The <strong>{productName}</strong> gives you 500+ questions, adaptive
          difficulty, AI Tutor, and unlimited attempts — one-time payment, no
          subscription.
        </p>

        <div
          style={{
            background: "#F8FAFC",
            borderRadius: 12,
            border: "1px solid #E2E8F0",
            padding: "16px",
            marginBottom: 24,
          }}
        >
          <div
            style={{
              fontSize: 36,
              fontWeight: 900,
              color: "#0F172A",
              lineHeight: 1,
            }}
          >
            CA${price}
          </div>
          <div style={{ fontSize: 12, color: "#94A3B8", marginTop: 4 }}>
            one-time · no subscription · access never expires
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <Link href={`/pricing`}>
            <button
              style={{
                width: "100%",
                padding: "13px 0",
                borderRadius: 10,
                background: "linear-gradient(135deg, #1D4ED8, #0E7490)",
                color: "#fff",
                border: "none",
                fontSize: 14,
                fontWeight: 700,
                cursor: "pointer",
                fontFamily: "inherit",
              }}
            >
              Get {productName} — CA${price} →
            </button>
          </Link>

          <Link href="/quiz">
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
              Try Free OIT Practice Instead
            </button>
          </Link>
        </div>

        <div
          style={{
            marginTop: 20,
            fontSize: 11,
            color: "#94A3B8",
            lineHeight: 1.6,
          }}
        >
          Already purchased?{" "}
          <a href="/pricing" style={{ color: "#1D4ED8", fontWeight: 600 }}>
            View your passes
          </a>{" "}
          or email{" "}
          <a
            href="mailto:support@echeloninstitute.ca"
            style={{ color: "#1D4ED8" }}
          >
            support@echeloninstitute.ca
          </a>
        </div>
      </div>
    </div>
  );
}
