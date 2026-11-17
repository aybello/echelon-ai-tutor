import { readAdsChoice } from "./googleAds";
/** Forward only a preference, never browser identity. Storage failure opts out. */
export function learnerActivityPreference(): "allowed" | "denied" {
  try {
    if (window.navigator.doNotTrack === "1" || window.navigator.globalPrivacyControl || readAdsChoice(window) === "denied" || window.localStorage.getItem("umami.disabled") === "true") return "denied";
    return "allowed";
  } catch { return "denied"; }
}
/** OAuth navigation cannot carry RPC headers; refresh a short-lived preference only. */
export function syncLearnerActivityPreference() {
  if (typeof window === "undefined") return;
  try {
    document.cookie = `echelon_activity_preference=${learnerActivityPreference()}; Path=/; Max-Age=600; SameSite=Lax${window.location.protocol === "https:" ? "; Secure" : ""}`;
  } catch { /* Missing preference fails closed on the server. */ }
}
