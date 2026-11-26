// /preview?key=d200f5c012ca384309b488e742d725e0  → enables preview mode (bypasses all paywalls)
// /preview?disable=1                              → disables preview mode

import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { PREVIEW_KEY, enablePreviewMode, disablePreviewMode, isPreviewModeActive } from "@/lib/previewMode";

export default function PreviewMode() {
  const [, navigate] = useLocation();
  const [status, setStatus] = useState<"checking" | "enabled" | "disabled" | "invalid">("checking");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const key = params.get("key");
    const disable = params.get("disable");

    if (disable === "1") {
      disablePreviewMode();
      setStatus("disabled");
      setTimeout(() => navigate("/"), 2000);
    } else if (key === PREVIEW_KEY) {
      enablePreviewMode();
      setStatus("enabled");
      setTimeout(() => navigate("/"), 2000);
    } else if (isPreviewModeActive()) {
      setStatus("enabled");
      setTimeout(() => navigate("/"), 1500);
    } else {
      setStatus("invalid");
    }
  }, [navigate]);

  return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      background: "#0F172A",
      fontFamily: "Sora, sans-serif",
    }}>
      <div style={{
        background: "#1E293B",
        border: "1.5px solid #334155",
        borderRadius: 16,
        padding: "40px 48px",
        textAlign: "center",
        maxWidth: 400,
      }}>
        {status === "checking" && (
          <p style={{ color: "#94A3B8", fontSize: 16 }}>Checking...</p>
        )}
        {status === "enabled" && (
          <>
            <div style={{ fontSize: 40, marginBottom: 16 }}>✅</div>
            <h2 style={{ color: "#34D399", fontSize: 20, fontWeight: 800, margin: "0 0 8px" }}>
              Preview Mode Active
            </h2>
            <p style={{ color: "#94A3B8", fontSize: 14 }}>
              All paywalls are bypassed. Redirecting to homepage...
            </p>
          </>
        )}
        {status === "disabled" && (
          <>
            <div style={{ fontSize: 40, marginBottom: 16 }}>🔒</div>
            <h2 style={{ color: "#F87171", fontSize: 20, fontWeight: 800, margin: "0 0 8px" }}>
              Preview Mode Disabled
            </h2>
            <p style={{ color: "#94A3B8", fontSize: 14 }}>
              Paywalls are back on. Redirecting to homepage...
            </p>
          </>
        )}
        {status === "invalid" && (
          <>
            <div style={{ fontSize: 40, marginBottom: 16 }}>❌</div>
            <h2 style={{ color: "#F87171", fontSize: 20, fontWeight: 800, margin: "0 0 8px" }}>
              Invalid Key
            </h2>
            <p style={{ color: "#94A3B8", fontSize: 14 }}>
              The preview key is incorrect.
            </p>
          </>
        )}
      </div>
    </div>
  );
}
