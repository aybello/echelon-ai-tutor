import { beforeEach, describe, expect, it, vi } from "vitest";
import { runInNewContext } from "node:vm";

const stubs = vi.hoisted(() => ({
  exchange: vi.fn(), userInfo: vi.fn(), session: vi.fn(), upsert: vi.fn(),
}));
vi.mock("../db", () => ({ upsertUser: stubs.upsert }));
vi.mock("./sdk", () => ({ sdk: { exchangeCodeForToken: stubs.exchange, getUserInfo: stubs.userInfo, createSessionToken: stubs.session } }));
vi.mock("./cookies", () => ({ getSessionCookieOptions: () => ({ path: "/" }) }));
import { registerOAuthRoutes } from "./oauth";
import { IDENTITY_CHANGE_EVENT_KEY } from "../../shared/identityChange";

describe("OAuth identity notification", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    stubs.exchange.mockResolvedValue({ accessToken: "fixture" });
    stubs.userInfo.mockResolvedValue({ openId: "fixture-id", email: "fixture@example.test" });
    stubs.session.mockResolvedValue("fixture-session");
    stubs.upsert.mockResolvedValue(undefined);
  });
  async function invoke(query: Record<string, string>) {
    let handler: any;
    registerOAuthRoutes({ get: (_path: string, fn: any) => { handler = fn; } } as any);
    const response: any = { cookie: vi.fn(), send: vi.fn(), status: vi.fn().mockReturnThis(), json: vi.fn() };
    await handler({ query }, response);
    return response;
  }
  it("sets a cookie before rendering a safe random hint and redirect", async () => {
    const response = await invoke({ code: "fixture", state: "fixture" });
    expect(response.cookie).toHaveBeenCalledOnce();
    expect(response.send).toHaveBeenCalledOnce();
    const html = response.send.mock.calls[0][0] as string;
    const script = html.match(/<script>([\s\S]*?)<\/script>/)?.[1];
    expect(script).toBeTruthy();
    const setItem = vi.fn();
    const postMessage = vi.fn();
    const replace = vi.fn();
    const fixture = { localStorage: { setItem }, crypto: { getRandomValues: (bytes: Uint8Array) => bytes.fill(4) },
      sessionStorage: { getItem: () => "/account", removeItem: vi.fn() },
      BroadcastChannel: class { postMessage = postMessage; close() {} },
      window: { location: { replace } } };
    runInNewContext(script!, fixture);
    expect(setItem).toHaveBeenCalledWith(IDENTITY_CHANGE_EVENT_KEY, "04".repeat(16));
    expect(postMessage).toHaveBeenCalledWith("04".repeat(16));
    expect(replace).toHaveBeenCalledWith("/account");
    runInNewContext(script!, { ...fixture, sessionStorage: { getItem: () => { throw Error("blocked"); } } });
    expect(replace).toHaveBeenLastCalledWith("/");
  });
  it("does not return notification JavaScript on failed exchanges or missing inputs", async () => {
    stubs.exchange.mockRejectedValueOnce(Error("fixture failure"));
    const log = vi.spyOn(console, "error").mockImplementation(() => {});
    const failed = await invoke({ code: "fixture", state: "fixture" });
    const missing = await invoke({});
    expect(failed.cookie).not.toHaveBeenCalled();
    expect(failed.send).not.toHaveBeenCalled();
    expect(missing.send).not.toHaveBeenCalled();
    log.mockRestore();
  });
});
