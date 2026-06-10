// Echelon Institute — Purchase Success Page
// Shown after Stripe Checkout completes successfully
// Verifies the session, stores email in localStorage for access gating
// Auto-redirects to the purchased course quiz after 4 seconds

import { useEffect, useState } from "react";
import { Link } from "wouter";
import { trpc } from "@/lib/trpc";
import { usePageMeta } from "@/hooks/usePageMeta";
import LandingNav from "@/components/LandingNav";

const LOGO_URL = "https://d2xsxph8kpxj0f.cloudfront.net/310519663446228701/9KAR7mkGo7x7xavTEeEpiA/echelon-icon-v2_5c9ed3a7.webp";

// Map product keys to quiz/mock exam paths
// First entry is the primary path (used for auto-redirect)
const PRODUCT_PATHS: Record<string, { label: string; path: string }[]> = {
  oit: [
    { label: "OIT Practice Quiz", path: "/quiz" },
    { label: "OIT Mock Exam", path: "/oit-mock" },
  ],
  "oit-ww": [
    { label: "OIT Wastewater Practice Quiz", path: "/oit-ww" },
    { label: "OIT Wastewater Mock Exam", path: "/oit-ww-mock" },
  ],
  "class1-water": [
    { label: "Class 1 Water Practice Quiz", path: "/class1-water" },
    { label: "Class 1 Water Mock Exam", path: "/class1-water-mock" },
  ],
  "class1-ww": [
    { label: "Class 1 Wastewater Practice Quiz", path: "/class1-ww" },
    { label: "Class 1 Wastewater Mock Exam", path: "/class1-ww-mock" },
  ],
  "class2-water": [
    { label: "Class 2 Water Practice Quiz", path: "/class2-water" },
    { label: "Class 2 Water Mock Exam", path: "/class2-water-mock" },
  ],
  "class2-ww": [
    { label: "Class 2 Wastewater Practice Quiz", path: "/class2-ww" },
    { label: "Class 2 Wastewater Mock Exam", path: "/class2-ww-mock" },
  ],
  "class3-water": [
    { label: "Class 3 Water Practice Quiz", path: "/class3-water" },
    { label: "Class 3 Water Mock Exam", path: "/class3-water-mock" },
  ],
  "class3-ww": [
    { label: "Class 3 Wastewater Practice Quiz", path: "/class3-ww" },
    { label: "Class 3 Wastewater Mock Exam", path: "/class3-ww-mock" },
  ],
  "class4-water": [
    { label: "Class 4 Water Practice Quiz", path: "/class4-water" },
    { label: "Class 4 Water Mock Exam", path: "/class4-water-mock" },
  ],
  "class4-ww": [
    { label: "Class 4 Wastewater Practice Quiz", path: "/class4-ww" },
    { label: "Class 4 Wastewater Mock Exam", path: "/class4-ww-mock" },
  ],
  wqa: [
    { label: "WQA Practice Quiz", path: "/wqa" },
    { label: "WQA Mock Exam", path: "/wqa-mock" },
  ],
  "wpi-class1-water": [
    { label: "WPI Class 1 Water Practice Quiz", path: "/wpi-class1-water" },
    { label: "WPI Class 1 Water Mock Exam", path: "/wpi-class1-water-mock" },
  ],
  "wpi-class2-water": [
    { label: "WPI Class 2 Water Practice Quiz", path: "/wpi-class2-water" },
    { label: "WPI Class 2 Water Mock Exam", path: "/wpi-class2-water-mock" },
  ],
  "wpi-class3-water": [
    { label: "WPI Class 3 Water Practice Quiz", path: "/wpi-class3-water" },
    { label: "WPI Class 3 Water Mock Exam", path: "/wpi-class3-water-mock" },
  ],
  "wpi-class4-water": [
    { label: "WPI Class 4 Water Practice Quiz", path: "/wpi-class4-water" },
    { label: "WPI Class 4 Water Mock Exam", path: "/wpi-class4-water-mock" },
  ],
  "wpi-class1-wastewater": [
    { label: "WPI Class 1 Wastewater Practice Quiz", path: "/wpi-class1-wastewater" },
    { label: "WPI Class 1 Wastewater Mock Exam", path: "/wpi-class1-wastewater-mock" },
  ],
  "wpi-class2-wastewater": [
    { label: "WPI Class 2 Wastewater Practice Quiz", path: "/wpi-class2-wastewater" },
    { label: "WPI Class 2 Wastewater Mock Exam", path: "/wpi-class2-wastewater-mock" },
  ],
  "wpi-class3-wastewater": [
    { label: "WPI Class 3 Wastewater Practice Quiz", path: "/wpi-class3-wastewater" },
    { label: "WPI Class 3 Wastewater Mock Exam", path: "/wpi-class3-wastewater-mock" },
  ],
  "wpi-class4-wastewater": [
    { label: "WPI Class 4 Wastewater Practice Quiz", path: "/wpi-class4-wastewater" },
    { label: "WPI Class 4 Wastewater Mock Exam", path: "/wpi-class4-wastewater-mock" },
  ],
  "wpi-class1-water-dist": [
    { label: "WPI Class 1 Distribution Practice Quiz", path: "/wpi-class1-water-dist" },
    { label: "WPI Class 1 Distribution Mock Exam", path: "/wpi-class1-water-dist-mock" },
  ],
  "wpi-class2-water-dist": [
    { label: "WPI Class 2 Distribution Practice Quiz", path: "/wpi-class2-water-dist" },
    { label: "WPI Class 2 Distribution Mock Exam", path: "/wpi-class2-water-dist-mock" },
  ],
  "wpi-class3-water-dist": [
    { label: "WPI Class 3 Distribution Practice Quiz", path: "/wpi-class3-water-dist" },
    { label: "WPI Class 3 Distribution Mock Exam", path: "/wpi-class3-water-dist-mock" },
  ],
  "wpi-class4-water-dist": [
    { label: "WPI Class 4 Distribution Practice Quiz", path: "/wpi-class4-water-dist" },
    { label: "WPI Class 4 Distribution Mock Exam", path: "/wpi-class4-water-dist-mock" },
  ],
  "wpi-class1-water-coll": [
    { label: "WPI Class 1 Collection Practice Quiz", path: "/wpi-class1-water-coll" },
    { label: "WPI Class 1 Collection Mock Exam", path: "/wpi-class1-water-coll-mock" },
  ],
  "wpi-class2-water-coll": [
    { label: "WPI Class 2 Collection Practice Quiz", path: "/wpi-class2-water-coll" },
    { label: "WPI Class 2 Collection Mock Exam", path: "/wpi-class2-water-coll-mock" },
  ],
  "wpi-class3-water-coll": [
    { label: "WPI Class 3 Collection Practice Quiz", path: "/wpi-class3-water-coll" },
    { label: "WPI Class 3 Collection Mock Exam", path: "/wpi-class3-water-coll-mock" },
  ],
  "wpi-class4-water-coll": [
    { label: "WPI Class 4 Collection Practice Quiz", path: "/wpi-class4-water-coll" },
    { label: "WPI Class 4 Collection Mock Exam", path: "/wpi-class4-water-coll-mock" },
  ],
};


export default function PurchaseSuccess() {
  usePageMeta({
    title: "Purchase Successful",
    description: "Your purchase was successful. Thank you for choosing Echelon Institute.",
  });

  const params = new URLSearchParams(window.location.search);
  const sessionId = params.get("session_id") ?? "";
  const productKey = params.get("product") ?? "";

  const [email, setEmail] = useState<string>("");
  const [verified, setVerified] = useState(false);
  const [verifying, setVerifying] = useState(true);
  const [referralSource, setReferralSource] = useState("");
  const [referralSubmitted, setReferralSubmitted] = useState(false);
  const [stripeSessionId, setStripeSessionId] = useState("");
  const [allUnlockedProducts, setAllUnlockedProducts] = useState<string[]>([]);

  const saveReferral = trpc.stripe.saveReferralSource.useMutation();


  // Verify the session with Stripe and record the purchase
  const verifySession = trpc.stripe.verifySession.useMutation({
    onSuccess: (data) => {
      if (data.email) {
        setEmail(data.email);
        try {
          localStorage.setItem("echelon_trial_email", data.email);
          localStorage.setItem("echelon_trial_unlocked", "true");
          const existing = JSON.parse(localStorage.getItem("echelon_purchased_products") ?? "[]");
          if (!existing.includes(productKey)) {
            existing.push(productKey);
            localStorage.setItem("echelon_purchased_products", JSON.stringify(existing));
          }
          setAllUnlockedProducts(existing);
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

  return (
    <div
      style={{
        fontFamily: "'Sora', sans-serif",
        background: "#FFFFFF",
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
      }}
    >
      <LandingNav currentPath="/purchase-success" />
      <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "40px 24px", width: "100%" }}>
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
            <h1 style={{ fontSize: 22, fontWeight: 800, color: "#FFFFFF", margin: "0 0 8px" }}>
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
            <h1 style={{ fontSize: 24, fontWeight: 900, color: "#FFFFFF", margin: "0 0 8px" }}>
              Payment Successful!
            </h1>
            <p style={{ color: "#64748B", fontSize: 14, lineHeight: 1.6, margin: "0 0 8px" }}>
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

            {/* Access email reminder */}
            {email && (
              <div style={{ background: "#FFF7ED", border: "1.5px solid #FED7AA", borderRadius: 10, padding: "12px 16px", marginBottom: 16, textAlign: "left" }}>
                <p style={{ margin: 0, fontSize: 12, fontWeight: 700, color: "#C2410C" }}>Save this email - it's your access key</p>
                <p style={{ margin: "4px 0 0", fontSize: 13, color: "#78350F" }}>Your access is tied to: <strong>{email}</strong></p>
              </div>
            )}

            {/* Your Courses - show all unlocked products */}
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
                Your Courses
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {(allUnlockedProducts.length > 0 ? allUnlockedProducts : [productKey]).map(pk => {
                  const courseLinks = PRODUCT_PATHS[pk] ?? [{ label: pk, path: "/quiz" }];
                  return courseLinks.map(link => (
                    <Link key={link.path} href={link.path}>
                      <div
                        style={{
                          padding: "10px 14px",
                          background: pk === productKey ? "#DCFCE7" : "#fff",
                          borderRadius: 8,
                          border: pk === productKey ? "1.5px solid #86EFAC" : "1px solid #BBF7D0",
                          fontSize: 13,
                          fontWeight: 600,
                          color: "#FFFFFF",
                          cursor: "pointer",
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                        }}
                      >
                        {link.label}
                        {pk === productKey && <span style={{ fontSize: 10, background: "#16A34A", color: "#fff", padding: "2px 6px", borderRadius: 4, fontWeight: 700 }}>NEW</span>}
                        <span style={{ color: "#16A34A" }}>→</span>
                      </div>
                    </Link>
                  ));
                })}
              </div>
            </div>

            {/* How did you hear about us */}
            {!referralSubmitted ? (
              <div style={{ background: "#FFFFFF", border: "1px solid #E2E8F0", borderRadius: 12, padding: "16px", marginBottom: 16, textAlign: "left" }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: "#64748B", marginBottom: 10, textTransform: "uppercase", letterSpacing: "0.06em" }}>
                  Quick question
                </div>
                <p style={{ fontSize: 13, color: "#FFFFFF", fontWeight: 600, margin: "0 0 10px" }}>
                  How did you hear about Echelon Institute?
                </p>
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  {["Instagram", "Facebook", "Google Search", "Word of mouth / colleague", "LinkedIn", "Other"].map(option => (
                    <button
                      key={option}
                      onClick={() => {
                        setReferralSource(option);
                        setReferralSubmitted(true);
                        if (stripeSessionId) {
                          saveReferral.mutate({ sessionId: stripeSessionId, referralSource: option });
                        }
                      }}
                      style={{
                        padding: "8px 12px",
                        borderRadius: 8,
                        border: `1.5px solid ${referralSource === option ? "#1D4ED8" : "#94A3B8"}`,
                        background: referralSource === option ? "#EFF6FF" : "#fff",
                        color: "#FFFFFF",
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

            <div style={{ fontSize: 12, color: "#64748B", lineHeight: 1.6 }}>
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
                    color: "#64748B",
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
    </div>
  );
}
