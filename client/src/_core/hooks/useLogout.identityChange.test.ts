import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const state = vi.hoisted(() => ({
  mutate: vi.fn(), notify: vi.fn(), error: vi.fn(),
  queryClient: { cancelQueries: vi.fn(), clear: vi.fn() },
}));
vi.mock("@/lib/trpc", () => ({ trpc: { auth: { logout: { useMutation: () => ({ mutateAsync: state.mutate, isPending: false, error: null }) } } } }));
vi.mock("@shared/identityChange", () => ({ IDENTITY_CHANGE_EVENT_KEY: "echelon.identity-change.event", notifyIdentityChange: state.notify }));
vi.mock("@tanstack/react-query", () => ({ useQueryClient: () => state.queryClient }));
vi.mock("sonner", () => ({ toast: { error: state.error } }));
import { useLogout } from "./useLogout";
import { LOGOUT_EVENT_KEY } from "@/lib/logout";

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

beforeEach(() => { vi.resetAllMocks(); });
afterEach(() => { vi.unstubAllGlobals(); });
describe("logout identity notification", () => {
  it("notifies only after server success and completed local cleanup, before redirect", async () => {
    let finishCancel!: () => void;
    const cancellation = new Promise<void>(resolve => { finishCancel = resolve; });
    const local = storage({ echelon_access_token: "old", theme: "dark" });
    const session = storage({ "echelon.session": "old" });
    const replace = vi.fn();
    vi.stubGlobal("window", { localStorage: local, sessionStorage: session, location: { replace } });
    vi.stubGlobal("localStorage", local);
    state.mutate.mockResolvedValue({ success: true });
    state.queryClient.cancelQueries.mockReturnValue(cancellation);
    state.notify.mockImplementation(() => {
      expect(state.queryClient.clear).toHaveBeenCalledOnce();
      expect(local.getItem("echelon_access_token")).toBeNull();
      expect(session.getItem("echelon.session")).toBeNull();
      expect(replace).not.toHaveBeenCalled();
    });
    const result = useLogout().logout();
    await Promise.resolve();
    expect(state.queryClient.cancelQueries).toHaveBeenCalledOnce();
    expect(state.notify).not.toHaveBeenCalled();
    expect(replace).not.toHaveBeenCalled();
    finishCancel();
    await result;
    expect(state.notify).toHaveBeenCalledOnce();
    expect(state.mutate.mock.invocationCallOrder[0]).toBeLessThan(state.queryClient.cancelQueries.mock.invocationCallOrder[0]);
    expect(state.queryClient.clear.mock.invocationCallOrder[0]).toBeLessThan(state.notify.mock.invocationCallOrder[0]);
    expect(state.notify.mock.invocationCallOrder[0]).toBeLessThan(replace.mock.invocationCallOrder[0]);
    expect(replace).toHaveBeenCalledWith("/account");
    expect(local.getItem("theme")).toBe("dark");
    expect(local.getItem(LOGOUT_EVENT_KEY)).toBeTruthy();
    expect(state.error).not.toHaveBeenCalled();
  });
  it("does not notify, clear identity, or redirect on a rejected logout request", async () => {
    const replace = vi.fn();
    vi.stubGlobal("window", { location: { replace } });
    state.mutate.mockRejectedValue(Error("failed"));
    await useLogout().logout();
    expect(state.notify).not.toHaveBeenCalled();
    expect(state.queryClient.cancelQueries).not.toHaveBeenCalled();
    expect(state.queryClient.clear).not.toHaveBeenCalled();
    expect(replace).not.toHaveBeenCalled();
    expect(state.error).toHaveBeenCalledOnce();
  });
  it.each(["cancelQueries", "clear"] as const)("notifies and redirects after server success when %s fails", async failure => {
    const replace = vi.fn();
    const local = storage({ echelon_access_token: "old" });
    const session = storage({ "echelon.session": "old" });
    vi.stubGlobal("window", { localStorage: local, sessionStorage: session, location: { replace } });
    vi.stubGlobal("localStorage", local);
    state.mutate.mockResolvedValue({ success: true });
    state.queryClient.cancelQueries.mockResolvedValue(undefined);
    if (failure === "cancelQueries") state.queryClient.cancelQueries.mockRejectedValue(Error("cleanup failed"));
    else state.queryClient.clear.mockImplementation(() => { throw Error("cleanup failed"); });
    await useLogout().logout();
    expect(state.queryClient.clear).toHaveBeenCalledOnce();
    expect(local.getItem("echelon_access_token")).toBeNull();
    expect(session.getItem("echelon.session")).toBeNull();
    expect(state.notify).toHaveBeenCalledOnce();
    expect(state.queryClient.clear.mock.invocationCallOrder[0]).toBeLessThan(state.notify.mock.invocationCallOrder[0]);
    expect(state.notify.mock.invocationCallOrder[0]).toBeLessThan(replace.mock.invocationCallOrder[0]);
    expect(local.getItem(LOGOUT_EVENT_KEY)).toBeTruthy();
    expect(replace).toHaveBeenCalledWith("/account");
    expect(state.error).not.toHaveBeenCalled();
  });
  it("continues with the other storage and notifies when a storage removal throws", async () => {
    const local = storage({ echelon_access_token: "old", echelon_other: "old" });
    const session = storage({ "echelon.session": "old" });
    const remove = local.removeItem;
    local.removeItem = key => { if (key === "echelon_access_token") throw Error("blocked"); remove(key); };
    const replace = vi.fn();
    vi.stubGlobal("window", { localStorage: local, sessionStorage: session, location: { replace } });
    vi.stubGlobal("localStorage", local);
    state.mutate.mockResolvedValue({ success: true });
    state.queryClient.cancelQueries.mockResolvedValue(undefined);
    await useLogout().logout();
    expect(local.getItem("echelon_other")).toBeNull();
    expect(session.getItem("echelon.session")).toBeNull();
    expect(state.notify).toHaveBeenCalledOnce();
    expect(replace).toHaveBeenCalledWith("/account");
    expect(state.error).not.toHaveBeenCalled();
  });
  it("still notifies and redirects when storage is unavailable", async () => {
    const replace = vi.fn();
    vi.stubGlobal("window", {
      get localStorage() { throw Error("blocked"); },
      get sessionStorage() { throw Error("blocked"); },
      location: { replace },
    });
    vi.stubGlobal("localStorage", { setItem() { throw Error("blocked"); } });
    state.mutate.mockResolvedValue({ success: true });
    state.queryClient.cancelQueries.mockResolvedValue(undefined);
    await useLogout().logout();
    expect(state.notify).toHaveBeenCalledOnce();
    expect(replace).toHaveBeenCalledWith("/account");
    expect(state.error).not.toHaveBeenCalled();
  });
});
