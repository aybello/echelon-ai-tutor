import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { canInviteSuggestion, markSuggestionHandled, SUGGESTION_COOLDOWN_MS } from "./featureSuggestionPrompt";
let values: Map<string, string>;
beforeEach(() => { values = new Map(); vi.stubGlobal("localStorage", { getItem: (key: string) => values.get(key) ?? null, setItem: (key: string, value: string) => values.set(key, value) }); });
afterEach(() => vi.unstubAllGlobals());
describe("optional suggestion invitation", () => {
  it("allows the first completed session without auto-opening a form", () => expect(canInviteSuggestion()).toBe(true));
  it("waits 30 days after either dismissal or submission", () => { const now = Date.UTC(2026, 10, 20); markSuggestionHandled(now); expect(canInviteSuggestion(now + SUGGESTION_COOLDOWN_MS - 1)).toBe(false); expect(canInviteSuggestion(now + SUGGESTION_COOLDOWN_MS)).toBe(true); });
  it("fails quiet when storage is unavailable", () => { vi.stubGlobal("localStorage", { getItem() { throw Error("blocked"); }, setItem() { throw Error("blocked"); } }); expect(canInviteSuggestion()).toBe(false); expect(() => markSuggestionHandled()).not.toThrow(); });
  it("does not nag on malformed or future stored timestamps", () => { values.set("echelon_suggestion_handled_at_v1", "bad"); expect(canInviteSuggestion()).toBe(false); markSuggestionHandled(Date.now() + 100000); expect(canInviteSuggestion()).toBe(false); });
});
