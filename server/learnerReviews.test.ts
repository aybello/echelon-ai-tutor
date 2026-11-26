import { beforeEach, describe, expect, it, vi } from "vitest";
import type { TrpcContext } from "./_core/context";
const mocks = vi.hoisted(() => ({ values: vi.fn(async (_row: unknown) => {}), notify: vi.fn(async () => true), unavailable: false }));
vi.mock("./db", () => ({ getDb: async () => mocks.unavailable ? null : { insert: () => ({ values: mocks.values }) } }));
vi.mock("./_core/notification", () => ({ notifyOwner: mocks.notify }));
vi.mock("./analytics", () => ({ trackEvent: vi.fn(async () => {}) }));
const { appRouter } = await import("./routers");
function caller(studentEmail: string | null = null) {
  return appRouter.createCaller({ user: null, studentEmail, req: { protocol: "https", headers: {} }, res: {} } as TrpcContext).feedback;
}
beforeEach(() => { mocks.values.mockReset(); mocks.values.mockResolvedValue(undefined); mocks.notify.mockClear(); mocks.unavailable = false; });
describe("learner review collection", () => {
  it.each(["dashboard", "quick10", "quiz_gate", "session_complete", "mock_exam", "first_high_score"])("saves %s reviews in the existing private store", async feedbackType => {
    await expect(caller().submit({ examType: "oit", feedbackType: feedbackType as "dashboard", rating: 4, comment: "Useful practice" })).resolves.toEqual({ success: true });
    expect(mocks.values).toHaveBeenCalledOnce();
    expect(mocks.values).toHaveBeenCalledWith({ userId: null, email: null, examType: "oit", rating: 4, comment: "Useful practice", feedbackType, province: null });
  });
  it("uses verified email-session identity instead of client attribution", async () => {
    await caller("synthetic@example.test").submit({ examType: "general", feedbackType: "dashboard", rating: 5, email: "stale@example.test" });
    expect(mocks.values.mock.calls[0][0]).toMatchObject({ email: "synthetic@example.test" });
  });
  it("returns failure, not success, if feedback cannot be stored", async () => {
    mocks.unavailable = true;
    await expect(caller().submit({ examType: "oit", feedbackType: "quick10", rating: 3 })).rejects.toThrow("Database unavailable");
    expect(mocks.values).not.toHaveBeenCalled();
    mocks.unavailable = false; mocks.values.mockRejectedValueOnce(Error("Synthetic write failure"));
    await expect(caller().submit({ examType: "oit", feedbackType: "dashboard", rating: 3 })).rejects.toThrow("Synthetic write failure");
  });
  it("continues notifying the owner about a low rating", async () => {
    await caller().submit({ examType: "oit", feedbackType: "dashboard", rating: 1, comment: "Needs work" });
    expect(mocks.notify).toHaveBeenCalledOnce();
  });
  it.each([0, 6])("rejects invalid rating %i before writes", async rating => {
    await expect(caller().submit({ examType: "oit", feedbackType: "dashboard", rating })).rejects.toMatchObject({ code: "BAD_REQUEST" });
    expect(mocks.values).not.toHaveBeenCalled();
  });
});
