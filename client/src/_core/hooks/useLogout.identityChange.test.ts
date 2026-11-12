import { beforeEach, describe, expect, it, vi } from "vitest";

const state = vi.hoisted(() => ({ mutate: vi.fn(), finish: vi.fn(), notify: vi.fn(), error: vi.fn(), queryClient: {} }));
vi.mock("@/lib/trpc", () => ({ trpc: { auth: { logout: { useMutation: () => ({ mutateAsync: state.mutate, isPending: false, error: null }) } } } }));
vi.mock("@/lib/logout", () => ({ finishLogout: state.finish }));
vi.mock("@shared/identityChange", () => ({ notifyIdentityChange: state.notify }));
vi.mock("@tanstack/react-query", () => ({ useQueryClient: () => state.queryClient }));
vi.mock("sonner", () => ({ toast: { error: state.error } }));
import { useLogout } from "./useLogout";

beforeEach(() => { vi.resetAllMocks(); });
describe("logout identity notification", () => {
  it("notifies after the server succeeds and before local cleanup", async () => {
    state.mutate.mockResolvedValue({ success: true });
    state.finish.mockResolvedValue(undefined);
    await useLogout().logout();
    expect(state.notify).toHaveBeenCalledOnce();
    expect(state.finish).toHaveBeenCalledWith(state.queryClient);
    expect(state.mutate.mock.invocationCallOrder[0]).toBeLessThan(state.notify.mock.invocationCallOrder[0]);
    expect(state.notify.mock.invocationCallOrder[0]).toBeLessThan(state.finish.mock.invocationCallOrder[0]);
    expect(state.error).not.toHaveBeenCalled();
  });
  it("does not notify or clear identity on a rejected logout request", async () => {
    state.mutate.mockRejectedValue(Error("failed"));
    await useLogout().logout();
    expect(state.notify).not.toHaveBeenCalled();
    expect(state.finish).not.toHaveBeenCalled();
    expect(state.error).toHaveBeenCalledOnce();
  });
});
