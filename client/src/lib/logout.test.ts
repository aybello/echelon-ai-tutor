import { afterEach, describe, expect, it, vi } from "vitest";
import { QueryClient } from "@tanstack/react-query";
import { clearBrowserIdentity, clearLearnerStorage, LOGOUT_EVENT_KEY } from "./logout";

function storage(initial: Record<string, string> = {}): Storage {
  const map = new Map(Object.entries(initial));
  return {
    get length() { return map.size; },
    key: index => [...map.keys()][index] ?? null,
    getItem: key => map.get(key) ?? null,
    setItem: (key, value) => { map.set(key, value); },
    removeItem: key => { map.delete(key); },
    clear: () => map.clear(),
  };
}

afterEach(() => vi.unstubAllGlobals());
describe("shared-device identity cleanup", () => {
  it("clears legacy tokens, all bank-cache versions and exam drafts while keeping unrelated preferences", () => {
    const data = storage({
      echelon_access_token: "token", echelon_subscription_tier: "tier",
      echelon_qbank_v1_oit: "answers", echelon_qbank_v2_oit: "answers",
      "echelon.mock.v1:oit:user@example.test": "draft", "manus-runtime-user-info": "user",
      theme: "light", [LOGOUT_EVENT_KEY]: "signal",
    });
    clearLearnerStorage(data);
    expect(data.length).toBe(2);
    expect(data.getItem("theme")).toBe("light");
    expect(data.getItem(LOGOUT_EVENT_KEY)).toBe("signal");
  });
  it("cancels an outstanding identity query and removes cached account data", async () => {
    const client = new QueryClient();
    const aborted = vi.fn();
    const pending = client.fetchQuery({ queryKey: ["account"], queryFn: ({ signal }) => new Promise(resolve => {
      signal.addEventListener("abort", () => { aborted(); resolve("old-account"); });
    }) }).catch(() => undefined);
    client.setQueryData(["paid-questions"], ["answer"]);
    vi.stubGlobal("window", { localStorage: storage(), sessionStorage: storage() });
    await clearBrowserIdentity(client);
    await pending;
    expect(aborted).toHaveBeenCalledOnce();
    expect(client.getQueryCache().getAll()).toEqual([]);
  });
  it("continues cleanup when browser storage is unavailable", async () => {
    const client = new QueryClient();
    client.setQueryData(["account"], "old-account");
    vi.stubGlobal("window", {
      get localStorage() { throw new Error("blocked"); },
      get sessionStorage() { throw new Error("blocked"); },
    });
    await expect(clearBrowserIdentity(client)).resolves.toBeUndefined();
    expect(client.getQueryCache().getAll()).toEqual([]);
  });
});
