// Echelon Institute — Purchase Success Page
// Shown after Stripe Checkout completes successfully
// Verifies the Stripe session while the signed Stripe webhook records the purchase.
// Course access remains server-authoritative; browser storage is not an entitlement source.

import { useEffect, useState } from "react";
import { Link } from "wouter";
import { trpc } from "@/lib/trpc";
import { usePageMeta } from "@/hooks/usePageMeta";
import LandingNav from "@/components/LandingNav";
import PurchaseExamDatePrompt from "@/components/PurchaseExamDatePrompt";
import { adsMeasurement } from "@/lib/googleAds";
import { purchasedCourseNavigation } from "./accountAccess";

const LOGO_URL = "https://d2xsxph8kpxj0f.cloudfront.net/310519663446228701/9KAR7mkGo7x7xavTEeEpiA/echelon-icon-v2_5c9ed3a7.webp";

export default function PurchaseSuccess() {
  usePageMeta({
    title: "Purchase Successful",
    description: "Your purchase was successful. Thank you for choosing Echelon Institute.",
    noindex: true
  });

  const params = new URLSearchParams(window.location.search);
  const sessionId = params.get("session_id") ?? "";

  const [email, setEmail] = useState<string>("");
  const [requiresSignIn, setRequiresSignIn] = useState(true);
  const [verified, setVerified] = useState(false);
  const [verifying, setVerifying] = useState(true);
  const [referralSource, setReferralSource] = useState("");
  const [referralSubmitted, setReferralSubmitted] = useState(false);
  const [stripeSessionId, setStripeSessionId] = useState("");
  const [purchasedProductKey, setPurchasedProductKey] = useState("");
  const [accessExpiresAt, setAccessExpiresAt] = useState<Date | null>(null);
  const [fulfillmentPending, setFulfillmentPending] = useState(false);
  const [fulfillmentAttempts, setFulfillmentAttempts] = useState(0);
  const [verificationFailed, setVerificationFailed] = useState(false);

  const saveReferral = trpc.stripe.saveReferralSource.useMutation();


  // Verify the session while Stripe's signed webhook records the purchase.
  const verifySession = trpc.stripe.verifySession.useMutation({
    onSuccess: (data) => {
      // A transient server/Stripe failure must not erase a payment already
      // confirmed on this page or imply that the customer should pay again.
      if (!data.paid) {
        setVerificationFailed(true);
        setVerifying(false);
        return;
      }
      setVerificationFailed(false);
      if (data.paid && data.email) {
        setEmail(data.email);
        try {
          localStorage.setItem("echelon_trial_email", data.email);
        } catch {
          // ignore
        }
      }
      setPurchasedProductKey(data.paid ? data.productKey : "");
      setVerified(data.paid);
      setRequiresSignIn(data.requiresSignIn);
      setVerifying(false);
      setStripeSessionId(sessionId);
      setAccessExpiresAt(data.accessExpiresAt ?? null);
      setFulfillmentPending(data.fulfillmentPending);
      if (!data.fulfillmentPending) adsMeasurement()?.recordPurchase(data.adsConversion);
    },
    onError: () => {
      setVerificationFailed(true);
      setVerifying(false);
    },
  });

  useEffect(() => {
    if (sessionId) {
      verifySession.mutate({ sessionId });
    } else {
      setVerifying(false);
    }
  }, [sessionId]);

  useEffect(() => {
    if (!fulfillmentPending || !sessionId || fulfillmentAttempts >= 5 || verificationFailed || verifySession.isPending) return;
    const timer = window.setTimeout(() => {
      setFulfillmentAttempts(attempt => attempt + 1);
      verifySession.mutate({ sessionId });
    }, 2_000);
    return () => window.clearTimeout(timer);
  }, [fulfillmentPending, fulfillmentAttempts, sessionId, verificationFailed, verifySession.isPending]);

  const retryVerification = () => {
    if (!sessionId || verifySession.isPending) return;
    setFulfillmentAttempts(0);
    setVerificationFailed(false);
    verifySession.mutate({ sessionId });
  };
  const waitingForRetry = verificationFailed || fulfillmentAttempts >= 5;
  const retryButton = (
    <button type="button" onClick={retryVerification} disabled={!sessionId || verifySession.isPending}
      style={{ padding: "10px 20px", borderRadius: 8, border: "none", background: "#1D4ED8", color: "#fff", fontSize: 14, fontWeight: 700, cursor: verifySession.isPending ? "wait" : "pointer", fontFamily: "inherit" }}>
      {verifySession.isPending ? "Checking access…" : "Check access again"}
    </button>
  );
  const purchasedCourse = verified ? purchasedCourseNavigation(purchasedProductKey) : null;
  const courseLinks = purchasedCourse?.links ?? [{ label: "View current access in My Account", path: "/account" }];

  return (
    <div
      className="learner-redesign learner-purchase-page"
      style={{
        fontFamily: "'Sora', sans-serif",
        background: "#F8FAFC",
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
      }}
    >
      <LandingNav currentPath="/purchase-success" />
      <div className="learner-purchase-main" style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "40px 24px", width: "100%" }}>
      <div
        className="learner-purchase-card"
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
            <div className="learner-status-glyph" aria-hidden="true">CHECK</div>
            <h1 style={{ fontSize: 22, fontWeight: 800, color: "#0F172A", margin: "0 0 8px" }}>
              Confirming your purchase…
            </h1>
            <p style={{ color: "#64748B", fontSize: 14 }}>
              Please wait while we verify your payment.
            </p>
          </>
        ) : !verified ? (
          <>
            <div style={{ fontSize: 40, marginBottom: 16 }}>!</div>
            <h1 style={{ fontSize: 22, fontWeight: 800, color: "#0F172A", margin: "0 0 8px" }}>
              We couldn't confirm this purchase
            </h1>
            <p style={{ color: "#64748B", fontSize: 14, lineHeight: 1.6, marginBottom: 20 }}>
              We could not verify your payment right now. If Stripe charged your card, do not purchase again. Check again or contact us for help.
            </p>
            {sessionId && retryButton}
            <p><a href="mailto:abello@echeloninstitute.ca">Contact support</a></p>
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
            <p role="status" aria-live="polite" style={{ color: "#64748B", fontSize: 14, lineHeight: 1.6, margin: "0 0 8px" }}>
              {fulfillmentPending ? (
                <>Your payment is confirmed. You do not need to purchase again. {verifySession.isPending
                  ? "Checking whether your course access is ready…"
                  : waitingForRetry
                    ? "Your course access is not confirmed yet. Automatic checks have paused. Check again below, or contact support if access is still unavailable."
                    : "We are checking for your course access automatically."}</>
              ) : email ? (
                <>
                  Your {accessExpiresAt ? "Individual Exam Pass" : "grandfathered Practice Pass"} has been recorded for <strong>{email}</strong>.
                  {accessExpiresAt ? ` You have unlimited practice through ${new Date(accessExpiresAt).toLocaleDateString("en-CA", { year: "numeric", month: "long", day: "numeric" })}.` : " Your original permanent-access terms remain unchanged."}
                </>
              ) : (
                <>
                  Your {accessExpiresAt ? "Individual Exam Pass" : "grandfathered Practice Pass"} has been recorded.
                  {accessExpiresAt ? ` You have unlimited practice through ${new Date(accessExpiresAt).toLocaleDateString("en-CA", { year: "numeric", month: "long", day: "numeric" })}.` : " Your original permanent-access terms remain unchanged."}
                </>
              )}
            </p>
            {fulfillmentPending && waitingForRetry && <div style={{ margin: "16px 0" }}>{retryButton}</div>}

            {requiresSignIn && !fulfillmentPending && <p style={{ color: "#334155", fontSize: 14 }}>
              Sign in with the email used at checkout and verify the six-digit inbox code to open your course. This protects your paid access. Your payment is recorded; you do not need to purchase again.
            </p>}
            {/* Access email reminder */}
            {email && (
              <div style={{ background: "#FFF7ED", border: "1.5px solid #FED7AA", borderRadius: 10, padding: "12px 16px", marginBottom: 16, textAlign: "left" }}>
                <p style={{ margin: 0, fontSize: 12, fontWeight: 700, color: "#C2410C" }}>Use this checkout email when signing in</p>
                <p style={{ margin: "4px 0 0", fontSize: 13, color: "#78350F" }}>Your access is tied to: <strong>{email}</strong></p>
              </div>
            )}

            {/* Your Courses - show only after the webhook has recorded access */}
            {!fulfillmentPending && <div
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
                {courseLinks.map(link => (
                    <Link key={link.path} href={requiresSignIn ? `/login/otp?next=${encodeURIComponent(link.path)}` : link.path}>
                      <div
                        style={{
                          padding: "10px 14px",
                          background: "#DCFCE7",
                          borderRadius: 8,
                          border: "1.5px solid #86EFAC",
                          fontSize: 13,
                          fontWeight: 600,
                          color: "#0F172A",
                          cursor: "pointer",
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                        }}
                      >
                        {requiresSignIn ? `Sign in — ${link.label}` : link.label}
                        {purchasedCourse && <span style={{ fontSize: 10, background: "#16A34A", color: "#fff", padding: "2px 6px", borderRadius: 4, fontWeight: 700 }}>NEW</span>}
                        <span style={{ color: "#16A34A" }}>→</span>
                      </div>
                    </Link>
                ))}
                {!purchasedCourse && <p style={{ color: "#475569", fontSize: 13, margin: "8px 0 0" }}>Open your account to view current access, or contact support if your purchased course is missing.</p>}
              </div>
            </div>}

            {/* Exam date: lets the reminder engine reach this learner. Only
                shown once the purchase is recorded, because the date is
                attached to that record. */}
            {!fulfillmentPending && stripeSessionId && <PurchaseExamDatePrompt sessionId={stripeSessionId} />}

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
              <a href="mailto:abello@echeloninstitute.ca" style={{ color: "#1D4ED8" }}>
                abello@echeloninstitute.ca
              </a>
            </div>

            <div style={{ marginTop: 24, display: "flex", gap: 12, justifyContent: "center" }}>
              {!fulfillmentPending && purchasedCourse && (
                <Link href={`/activate/${encodeURIComponent(purchasedCourse.courseKey)}`}>
                  <button
                    style={{
                      padding: "9px 20px", borderRadius: 8, border: "none",
                      background: "linear-gradient(135deg, #1D4ED8, #0E7490)", color: "#fff",
                      fontSize: 13, fontWeight: 800, cursor: "pointer", fontFamily: "inherit",
                    }}
                  >
                    Continue to Study Setup
                  </button>
                </Link>
              )}
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
    </div>
  );
}
