import { afterEach, describe, expect, it, vi } from "vitest";
import { createGameReporter, gameAnalyticsVisitor } from "./gameAnalytics";
const token = "b091f818-9ad8-4e35-ae0f-35f24c80b930";
function browser(navigator: Record<string, unknown> = {}, entries: Record<string, string> = {}) {
  const values = new Map(Object.entries(entries));
  const storage = { getItem: (key: string) => values.get(key) ?? null, setItem: (key: string, value: string) => values.set(key, value) };
  vi.stubGlobal("window", { navigator, localStorage: storage }); vi.stubGlobal("localStorage", storage);
  vi.stubGlobal("crypto", { randomUUID: () => token });
}
afterEach(() => vi.unstubAllGlobals());
describe("game telemetry privacy and delivery", () => {
  it("uses a stable random token, never the legacy shared storage-failure identifier", () => {
    browser(); expect(gameAnalyticsVisitor()).toBe(token); expect(gameAnalyticsVisitor()).toBe(token);
    vi.stubGlobal("localStorage", { getItem() { throw new Error("blocked"); } }); expect(gameAnalyticsVisitor()).toBeUndefined();
  });
  it.each([{ doNotTrack: "1" }, { globalPrivacyControl: true }])("honors browser privacy opt-out %j", navigator => {
    browser(navigator); expect(gameAnalyticsVisitor()).toBeUndefined();
  });
  it("honors existing measurement and vendor opt-outs", () => {
    browser({}, { "echelon:ads-choice:v1": "denied" }); expect(gameAnalyticsVisitor()).toBeUndefined();
    browser({}, { "umami.disabled": "true" }); expect(gameAnalyticsVisitor()).toBeUndefined();
  });
  it("orders completion after the answer and recovers from failures without throwing", async () => {
    const calls: string[] = [];
    const send = vi.fn(async (event: any) => { calls.push(event.event.kind); if (calls.length === 1) throw new Error("offline"); });
    const report = createGameReporter(send);
    expect(report({ round: 0, timed: false, event: { kind: "answer", itemId: "a", sequence: 0 } })).toBeUndefined();
    report({ round: 0, timed: false, event: { kind: "complete" } });
    await vi.waitFor(() => expect(calls).toEqual(["answer", "complete"]));
  });
});
