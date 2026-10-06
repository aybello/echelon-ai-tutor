import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { ADS_CHOICE_EVENT, ADS_CHOICE_KEY, adsMeasurement, readAdsChoice, setAdsChoice, type AdsChoice } from "@/lib/googleAds";

function useAdsChoice() {
  const [choice, setChoice] = useState<AdsChoice>(() => readAdsChoice(window));
  const [error, setError] = useState(false);
  useEffect(() => {
    const refresh = () => setChoice(readAdsChoice(window));
    const onStorage = (event: StorageEvent) => {
      if (event.key !== ADS_CHOICE_KEY && event.key !== null) return;
      // Another tab's refusal must stop a vendor already loaded in this tab.
      if (readAdsChoice(window) === "denied") window.location.reload();
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

/** Runs the shared measurement lifecycle without rendering a prompt or notice. */
export default function GoogleAdsMeasurement() {
  const [path] = useLocation();
  const { choice } = useAdsChoice();
  useEffect(() => { adsMeasurement()?.update(); }, [path, choice]);
  return null;
}

export function PrivacyAdsControls() {
  const { choice, choose, error } = useAdsChoice();
  const browserOptOut = window.navigator.globalPrivacyControl || window.navigator.doNotTrack === "1";
  return (
    <div id="advertising-measurement" style={{ scrollMarginTop: 90 }}>
      <p role="status">Google Ads measurement is <strong>{choice === "denied" ? "off" : "enabled with regional cookie limits"}</strong>.{browserOptOut ? " Your browser sends a privacy opt-out signal, which we respect." : " You can turn measurement off here without affecting course access."}</p>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
        <button type="button" style={buttonStyle} onClick={() => choose("denied")}>Turn ad measurement off</button>
        <button type="button" disabled={Boolean(browserOptOut)} style={{ ...buttonStyle, opacity: browserOptOut ? 0.5 : 1 }} onClick={() => choose("allowed")}>Turn ad measurement on</button>
      </div>
      {error && <p role="alert">Your browser could not save this change. Use your browser's privacy controls to block Google advertising requests.</p>}
    </div>
  );
}
