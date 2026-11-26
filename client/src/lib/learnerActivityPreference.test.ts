import { afterEach, describe, expect, it, vi } from "vitest";
import { learnerActivityPreference, syncLearnerActivityPreference } from "./learnerActivityPreference";
afterEach(() => vi.unstubAllGlobals());
function browser(values: Record<string, string | undefined> = {}, navigator = {}) {
  const document = { cookie: "" };
  vi.stubGlobal("document", document);
  vi.stubGlobal("window", { navigator, location: { protocol: "https:" }, localStorage: { getItem: (key: string) => values[key] ?? null } });
  return document;
}
describe("internal sign-in privacy forwarding", () => {
  it("forwards preference only with a short-lived secure OAuth cookie", () => {
    const document = browser(); expect(learnerActivityPreference()).toBe("allowed");
    syncLearnerActivityPreference();
    expect(document.cookie).toBe("echelon_activity_preference=allowed; Path=/; Max-Age=600; SameSite=Lax; Secure");
  });
  it.each([{ "echelon:ads-choice:v1": "denied" }, { "umami.disabled": "true" }, { "echelon:ads-choice:v1": "malformed" }])("respects stored refusal %j", values => {
    browser(values); expect(learnerActivityPreference()).toBe("denied");
  });
  it.each([{ doNotTrack: "1" }, { globalPrivacyControl: true }])("respects browser signals %j", navigator => {
    browser({}, navigator); expect(learnerActivityPreference()).toBe("denied");
  });
  it("storage errors opt out without blocking login", () => {
    browser(); window.localStorage.getItem = () => { throw new Error("blocked"); };
    expect(learnerActivityPreference()).toBe("denied"); expect(() => syncLearnerActivityPreference()).not.toThrow();
  });
});
