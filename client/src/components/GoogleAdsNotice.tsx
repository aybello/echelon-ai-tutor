import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { ADS_CHOICE_EVENT, ADS_CHOICE_KEY, adsMeasurement, readAdsChoice, setAdsChoice, type AdsChoice } from "@/lib/googleAds";
import { publicAnalyticsPage } from "@/lib/privacyAnalytics";

function useAdsChoice() {
  const [choice, setChoice] = useState<AdsChoice>(() => readAdsChoice(window));
  const [error, setError] = useState(false);
  useEffect(() => {
    const refresh = () => setChoice(readAdsChoice(window));
    const onStorage = (event: StorageEvent) => {
      if (event.key !== ADS_CHOICE_KEY) return;
      // Reload when another tab revokes consent so an already loaded vendor stops.
      if (readAdsChoice(window) !== "allowed") window.location.reload();
      else { refresh(); adsMeasurement()?.update(); }
    };
    window.addEventListener(ADS_CHOICE_EVENT, refresh);
    window.addEventListener("storage", onStorage);
    return () => {
      window.removeEventListener(ADS_CHOICE_EVENT, refresh);
      window.removeEventListener("storage", onStorage);
    };
  }, []);
  const choose = (value: Exclude<AdsChoice, null>) => {
    setError(!setAdsChoice(value));
    setChoice(readAdsChoice(window));
  };
  return { choice, choose, error };
}

const buttonStyle = {
  minHeight: 44, padding: "9px 14px", borderRadius: 8,
  border: "1px solid #CBD5E1", background: "#fff", color: "#0F172A",
  font: "inherit", fontWeight: 600, fontSize: 12, cursor: "pointer",
};

export default function GoogleAdsNotice() {
  const [path] = useLocation();
  const { choice, choose, error } = useAdsChoice();
  useEffect(() => { adsMeasurement()?.update(); }, [path, choice]);
  if (choice !== null || (!publicAnalyticsPage(path) && path !== "/purchase-success")) return null;
  return (
    <section aria-label="Optional advertising measurement" style={{
      background: "#F8FAFC", borderBottom: "1px solid #E2E8F0", padding: "10px 16px",
      fontFamily: "'Sora', sans-serif", color: "#334155",
    }}>
      <div style={{ maxWidth: 1120, margin: "0 auto", display: "flex", flexWrap: "wrap", alignItems: "center", gap: "8px 16px" }}>
        <p style={{ margin: 0, flex: "1 1 320px", fontSize: 12, lineHeight: 1.6 }}>
          We use optional Google Ads cookies to see which ads lead to visits and purchases, not to personalize ads. You can keep browsing either way. <a href="/privacy#advertising-measurement" style={{ color: "#1D4ED8", textDecoration: "underline" }}>Privacy and choices</a>
        </p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          <button type="button" style={buttonStyle} onClick={() => choose("denied")}>Continue without tracking</button>
          <button type="button" style={{ ...buttonStyle, color: "#1D4ED8", borderColor: "#1D4ED8" }} onClick={() => choose("allowed")}>Allow ad measurement</button>
        </div>
        {error && <p role="status" style={{ width: "100%", margin: 0, fontSize: 12 }}>Your browser could not save this choice. Optional Google tracking remains off.</p>}
      </div>
    </section>
  );
}

export function PrivacyAdsControls() {
  const { choice, choose, error } = useAdsChoice();
  const browserOptOut = window.navigator.globalPrivacyControl || window.navigator.doNotTrack === "1";
  return (
    <div id="advertising-measurement" style={{ scrollMarginTop: 90 }}>
      <p role="status">Optional Google Ads measurement is <strong>{choice === "allowed" ? "on" : "off"}</strong>.{browserOptOut ? " Your browser sends a privacy opt-out signal, which we respect." : " You can change your choice here."}</p>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
        <button type="button" style={buttonStyle} onClick={() => choose("denied")}>Turn ad measurement off</button>
        <button type="button" disabled={Boolean(browserOptOut)} style={{ ...buttonStyle, opacity: browserOptOut ? 0.5 : 1 }} onClick={() => choose("allowed")}>Allow ad measurement</button>
      </div>
      {error && <p role="alert">Your browser could not save this change. Use your browser's privacy controls to block Google advertising requests.</p>}
    </div>
  );
}
