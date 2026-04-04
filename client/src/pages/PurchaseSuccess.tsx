// Echelon Institute — Purchase Success Page
// Shown after Stripe Checkout completes successfully
// Verifies the session, stores email in localStorage for access gating

import { useEffect, useState } from "react";
import { Link, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";

const LOGO_URL = "https://d2xsxph8kpxj0f.cloudfront.net/310519663446228701/9KAR7mkGo7x7xavTEeEpiA/echelon-icon-v2_37a8727b.png";

// Map product keys to quiz/mock exam paths
const PRODUCT_PATHS: Record<string, { label: string; path: string }[]> = {
  oit: [
    { label: "OIT Practice Quiz", path: "/quiz" },
    { label: "OIT Mock Exam", path: "/oit-mock" },
  ],
  "class1-water": [
    { label: "Class 1 Water Practice Quiz", path: "/class1-water" },
    { label: "Class 1 Water Mock Exam", path: "/class1-water-mock" },
  ],
  "class1-ww": [
    { label: "Class 1 Wastewater Practice Quiz", path: "/class1-ww" },
    { label: "Class 1 Wastewater Mock Exam", path: "/class1-ww-mock" },
  ],
  wqa: [
    { label: "WQA Practice Quiz", path: "/wqa" },
    { label: "WQA Mock Exam", path: "/wqa-mock" },
  ],
  "bundle-water": [
    { label: "OIT Practice Quiz", path: "/quiz" },
    { label: "Class 1 Water Practice Quiz", path: "/class1-water" },
    { label: "OIT Mock Exam", path: "/oit-mock" },
    { label: "Class 1 Water Mock Exam", path: "/class1-water-mock" },
  ],
  "bundle-ww": [
    { label: "Class 1 Wastewater Practice Quiz", path: "/class1-ww" },
    { label: "Class 1 Wastewater Mock Exam", path: "/class1-ww-mock" },
  ],
  "bundle-all": [
    { label: "OIT Practice Quiz", path: "/quiz" },
    { label: "Class 1 Water Practice Quiz", path: "/class1-water" },
    { label: "Class 1 Wastewater Practice Quiz", path: "/class1-ww" },
    { label: "WQA Practice Quiz", path: "/wqa" },
    { label: "OIT Mock Exam", path: "/oit-mock" },
    { label: "Class 1 Water Mock Exam", path: "/class1-water-mock" },
    { label: "Class 1 Wastewater Mock Exam", path: "/class1-ww-mock" },
    { label: "WQA Mock Exam", path: "/wqa-mock" },
  ],
};

export default function PurchaseSuccess() {
  const [location] = useLocation();
  const params = new URLSearchParams(window.location.search);
  const sessionId = params.get("session_id") ?? "";
  const productKey = params.get("product") ?? "";

  const [email, setEmail] = useState<string>("");
  const [verified, setVerified] = useState(false);
  const [verifying, setVerifying] = useState(true);
  const [referralSource, setReferralSource] = useState("");
  const [referralSubmitted, setReferralSubmitted] = useState(false);
  const [stripeSessionId, setStripeSessionId] = useState("");

  const saveReferral = trpc.stripe.saveReferralSource.useMutation();

  // Verify the session with Stripe and record the purchase
  const verifySession = trpc.stripe.verifySession.useMutation({
    onSuccess: (data) => {
      if (data.email) {
        setEmail(data.email);
        // Store email in localStorage so quiz pages can check access
        try {
          localStorage.setItem("echelon_trial_email", data.email);
          localStorage.setItem("echelon_trial_unlocked", "true");
          // Store purchased product keys
          const existing = JSON.parse(localStorage.getItem("echelon_purchased_products") ?? "[]");
          if (!existing.includes(productKey)) {
            existing.push(productKey);
            localStorage.setItem("echelon_purchased_products", JSON.stringify(existing));
          }
        } catch {
          // ignore
        }
      }
      setVerified(true);
      setVerifying(false);
      setStripeSessionId(sessionId);
    },
    onError: () => {
      setVerifying(false);
    },
  });

  useEffect(() => {
    if (sessionId) {
      verifySession.mutate({ sessionId, productKey });
    } else {
      setVerifying(false);
    }
  }, [sessionId]);

  const links = PRODUCT_PATHS[productKey] ?? [{ label: "Start Practicing", path: "/quiz" }];

  return (
    <div
      style={{
        fontFamily: "Sora, Nunito, sans-serif",
        background: "#F8FAFC",
        minHeight: "100vh",
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
          border: "1px solid #E2E8F0",
          padding: "48px 40px",
          maxWidth: 520,
          width: "100%",
          textAlign: "center",
          boxShadow: "0 4px 24px rgba(0,0,0,0.08)",
        }}
      >
        <img
          src={LOGO_URL}
          alt="Echelon Institute"
          style={{ height: 48, marginBottom: 20, objectFit: "contain" }}
        />

        {verifying ? (
          <>
            <div style={{ fontSize: 40, marginBottom: 16 }}>⏳</div>
            <h1 style={{ fontSize: 22, fontWeight: 800, color: "#0F172A", margin: "0 0 8px" }}>
              Confirming your purchase…
            </h1>
            <p style={{ color: "#64748B", fontSize: 14 }}>
              Please wait while we verify your payment.
            </p>
          </>
        ) : (
          <>
            <div
              style={{
                width: 64,
                height: 64,
                borderRadius: "50%",
                background: "#DCFCE7",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 20px",
                fontSize: 32,
              }}
            >
              ✓
            </div>
            <h1 style={{ fontSize: 24, fontWeight: 900, color: "#0F172A", margin: "0 0 8px" }}>
              Payment Successful!
            </h1>
            <p style={{ color: "#64748B", fontSize: 14, lineHeight: 1.6, margin: "0 0 24px" }}>
              {email ? (
                <>
                  Your Practice Pass is now active for <strong>{email}</strong>.
                  You have unlimited access — no expiry.
                </>
              ) : (
                <>
                  Your Practice Pass is now active. You have unlimited access — no expiry.
                </>
              )}
            </p>

            <div
              style={{
                background: "#F0FDF4",
                border: "1px solid #BBF7D0",
                borderRadius: 12,
                padding: "16px",
                marginBottom: 24,
                textAlign: "left",
              }}
            >
              <div style={{ fontSize: 12, fontWeight: 700, color: "#16A34A", marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.06em" }}>
                Start Practicing Now
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {links.map(link => (
                  <Link key={link.path} href={link.path}>
                    <div
                      style={{
                        padding: "10px 14px",
                        background: "#fff",
                        borderRadius: 8,
                        border: "1px solid #BBF7D0",
                        fontSize: 13,
                        fontWeight: 600,
                        color: "#0F172A",
                        cursor: "pointer",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                      }}
                    >
                      {link.label}
                      <span style={{ color: "#16A34A" }}>→</span>
                    </div>
                  </Link>
                ))}
              </div>
            </div>

            {/* How did you hear about us */}
            {!referralSubmitted ? (
              <div style={{ background: "#F8FAFC", border: "1px solid #E2E8F0", borderRadius: 12, padding: "16px", marginBottom: 16, textAlign: "left" }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: "#475569", marginBottom: 10, textTransform: "uppercase", letterSpacing: "0.06em" }}>
                  Quick question
                </div>
                <p style={{ fontSize: 13, color: "#0F172A", fontWeight: 600, margin: "0 0 10px" }}>
                  How did you hear about Echelon Institute?
                </p>
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  {["Instagram", "Facebook", "Google Search", "Word of mouth / colleague", "LinkedIn", "Other"].map(option => (
                    <button
                      key={option}
                      onClick={() => {
                        setReferralSource(option);
                        setReferralSubmitted(true);
                        // Save to DB via tRPC
                        if (stripeSessionId) {
                          saveReferral.mutate({ sessionId: stripeSessionId, referralSource: option });
                        }
                      }}
                      style={{
                        padding: "8px 12px",
                        borderRadius: 8,
                        border: `1.5px solid ${referralSource === option ? "#1D4ED8" : "#E2E8F0"}`,
                        background: referralSource === option ? "#EFF6FF" : "#fff",
                        color: "#0F172A",
                        fontSize: 13,
                        fontWeight: 500,
                        cursor: "pointer",
                        textAlign: "left",
                        fontFamily: "inherit",
                      }}
                    >
                      {option}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div style={{ fontSize: 13, color: "#16A34A", fontWeight: 600, marginBottom: 16 }}>
                ✓ Thanks for letting us know!
              </div>
            )}

            <div style={{ fontSize: 12, color: "#94A3B8", lineHeight: 1.6 }}>
              A receipt has been sent to your email by Stripe.
              Questions? Email{" "}
              <a href="mailto:support@echeloninstitute.ca" style={{ color: "#1D4ED8" }}>
                support@echeloninstitute.ca
              </a>
            </div>

            <div style={{ marginTop: 24, display: "flex", gap: 12, justifyContent: "center" }}>
              <Link href="/">
                <button
                  style={{
                    padding: "9px 20px",
                    borderRadius: 8,
                    border: "1.5px solid #E2E8F0",
                    background: "#fff",
                    color: "#475569",
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: "pointer",
                    fontFamily: "inherit",
                  }}
                >
                  Back to Home
                </button>
              </Link>
              <Link href="/pricing">
                <button
                  style={{
                    padding: "9px 20px",
                    borderRadius: 8,
                    border: "none",
                    background: "linear-gradient(135deg, #1D4ED8, #0E7490)",
                    color: "#fff",
                    fontSize: 13,
                    fontWeight: 700,
                    cursor: "pointer",
                    fontFamily: "inherit",
                  }}
                >
                  View All Courses
                </button>
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
