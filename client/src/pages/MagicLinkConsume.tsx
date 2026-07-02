/**
 * /auth/magic — Consumes a magic link token from the URL.
 * On success: stores access token + email in localStorage and redirects to /quiz.
 * On failure: shows an error with a link to /account to request a new link.
 */

import { useEffect, useState } from "react";
import { Link, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import LandingNav from "@/components/LandingNav";

const LOGO_URL = "https://d2xsxph8kpxj0f.cloudfront.net/310519663446228701/9KAR7mkGo7x7xavTEeEpiA/echelon-icon-v2_5c9ed3a7.webp";

export default function MagicLinkConsume() {
  const [, navigate] = useLocation();
  const params = new URLSearchParams(window.location.search);
  const token = params.get("token") ?? "";
  // Support ?next= redirect param — set by /account?next=/dashboard when user was redirected from dashboard
  const nextParam = params.get("next") ?? "";

  const [status, setStatus] = useState<"loading" | "success" | "error" | "expired">("loading");
  const [email, setEmail] = useState("");
  const [isManager, setIsManager] = useState(false);

  const consumeMagicLink = trpc.magicLink.consumeMagicLink.useMutation({
    onSuccess: (data) => {
      if (data.valid) {
        // Store access in localStorage
        localStorage.setItem("echelon_access_token", data.accessToken);
        localStorage.setItem("echelon_subscription_email", data.email);
        localStorage.setItem("echelon_trial_email", data.email);
        localStorage.setItem("echelon_trial_unlocked", "true");
        if (data.examTypes.length > 0) {
          localStorage.setItem("echelon_subscription_exam_types", JSON.stringify(data.examTypes));
          localStorage.setItem("echelon_purchased_products", JSON.stringify(data.examTypes));
        }
        setEmail(data.email);
        setIsManager(!!data.isManager);
        setStatus("success");

        // Managers go to team dashboard; honour ?next= for students (e.g. /dashboard), else default to /quiz
        const redirectPath = data.isManager ? "/team" : (nextParam && nextParam.startsWith("/") ? nextParam : "/quiz");
        setTimeout(() => navigate(redirectPath), 3000);
      } else {
        setStatus("expired");
      }
    },
    onError: () => {
      setStatus("error");
    },
  });

  useEffect(() => {
    if (token) {
      consumeMagicLink.mutate({ token });
    } else {
      setStatus("error");
    }
  }, [token]);

  return (
    <div
      style={{
        fontFamily: "'Sora', sans-serif",
        background: "#F8FAFC",
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
      }}
    >
      <LandingNav currentPath="/auth/magic" />
      <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "40px 24px", width: "100%" }}>
        <div
          style={{
            background: "#fff",
            borderRadius: 20,
            border: "1px solid #E2E8F0",
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
            style={{ height: 48, marginBottom: 20, objectFit: "contain" }}
          />

          {status === "loading" && (
            <>
              <div style={{ fontSize: 40, marginBottom: 16 }}>🔐</div>
              <h1 style={{ fontSize: 22, fontWeight: 800, color: "#0F172A", margin: "0 0 8px" }}>
                Signing you in…
              </h1>
              <p style={{ color: "#64748B", fontSize: 14 }}>
                Please wait while we verify your magic link.
              </p>
            </>
          )}

          {status === "success" && (
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
                You're signed in!
              </h1>
              <p style={{ color: "#64748B", fontSize: 14, lineHeight: 1.6, margin: "0 0 20px" }}>
                Welcome back, <strong>{email}</strong>. Redirecting to your {isManager ? "team dashboard" : "courses"}…
              </p>
              <Link href={isManager ? "/team" : "/quiz"}>
                <button
                  style={{
                    padding: "12px 32px",
                    borderRadius: 10,
                    border: "none",
                    background: "linear-gradient(135deg, #1D4ED8, #0E7490)",
                    color: "#fff",
                    fontSize: 14,
                    fontWeight: 700,
                    cursor: "pointer",
                    fontFamily: "inherit",
                  }}
                >
                  {isManager ? "Go to Team Dashboard →" : "Go to Practice Quiz →"}
                </button>
              </Link>
            </>
          )}

          {(status === "expired" || status === "error") && (
            <>
              <div
                style={{
                  width: 64,
                  height: 64,
                  borderRadius: "50%",
                  background: "#FEE2E2",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  margin: "0 auto 20px",
                  fontSize: 32,
                }}
              >
                ✕
              </div>
              <h1 style={{ fontSize: 22, fontWeight: 800, color: "#0F172A", margin: "0 0 8px" }}>
                {status === "expired" ? "Link Expired" : "Invalid Link"}
              </h1>
              <p style={{ color: "#64748B", fontSize: 14, lineHeight: 1.6, margin: "0 0 20px" }}>
                {status === "expired"
                  ? "This magic link has expired or has already been used. Please request a new one."
                  : "This link is invalid. Please request a new sign-in link from the Account page."}
              </p>
              <Link href="/account">
                <button
                  style={{
                    padding: "12px 32px",
                    borderRadius: 10,
                    border: "none",
                    background: "linear-gradient(135deg, #1D4ED8, #0E7490)",
                    color: "#fff",
                    fontSize: 14,
                    fontWeight: 700,
                    cursor: "pointer",
                    fontFamily: "inherit",
                  }}
                >
                  Request New Link →
                </button>
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
