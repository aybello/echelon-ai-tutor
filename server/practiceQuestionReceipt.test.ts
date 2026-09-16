import { afterEach, describe, expect, it, vi } from "vitest";
import { attachPracticeReceipts, issuePracticeReceipt, permitsPracticeAttempt, practiceIdentity } from "./practiceQuestionReceipt";
import { issueSubscriptionToken } from "./_core/subscriptionToken";
import type { TrpcContext } from "./_core/context";

afterEach(() => vi.useRealTimers());
describe("practice receipt trust boundary", () => {
  it("binds bank, issued question ids and learner identity", async () => {
    const token = await issuePracticeReceipt("class1-water", [1, 2], "owner", false);
    expect(await permitsPracticeAttempt(token, "class1-water", 1, "owner", true)).toBe(true);
    for (const [bank, id, owner] of [["class2-water", 1, "owner"], ["class1-water", 3, "owner"], ["class1-water", 1, "other"]] as const) {
      expect(await permitsPracticeAttempt(token, bank, id, owner, true)).toBe(false);
    }
    expect(await permitsPracticeAttempt(`${token}x`, "class1-water", 1, "owner", true)).toBe(false);
    expect(await permitsPracticeAttempt(token, "class1-water", 1, "owner", false)).toBe(false);
  });
  it("permits only the issued preview questions without a paid pass", async () => {
    const token = await issuePracticeReceipt("oit", [4, 9], "guest", true);
    expect(await permitsPracticeAttempt(token, "oit", 4, "guest", false)).toBe(true);
    expect(await permitsPracticeAttempt(token, "oit", 10, "guest", false)).toBe(false);
  });
  it("expires receipts instead of accepting a stale study set forever", async () => {
    vi.useFakeTimers();
    const token = await issuePracticeReceipt("oit", [1], "owner", true);
    vi.setSystemTime(Date.now() + 121 * 60_000);
    expect(await permitsPracticeAttempt(token, "oit", 1, "owner", true)).toBe(false);
  });
  it("bounds each signed receipt to 50 delivered questions", async () => {
    const rows = await attachPracticeReceipts(Array.from({ length: 125 }, (_, id) => ({ id })), "oit", "owner", false);
    expect(rows).toHaveLength(125);
    expect(await permitsPracticeAttempt(rows[0].attemptToken, "oit", 51, "owner", true)).toBe(false);
    expect(await permitsPracticeAttempt(rows[51].attemptToken, "oit", 51, "owner", true)).toBe(true);
  });
  it("uses verified token identity only when no signed-in account exists", async () => {
    const token = await issueSubscriptionToken({ email: "first@example.test", examTypes: ["oit"] });
    const ctx = { user: null, studentEmail: null } as TrpcContext;
    const anonymousToken = await practiceIdentity(ctx, token);
    expect(anonymousToken.context.studentEmail).toBe("first@example.test");
    const second = await practiceIdentity({ ...ctx, studentEmail: "second@example.test" }, token);
    expect(second.context.studentEmail).toBe("second@example.test");
    expect(second.owner).not.toBe(anonymousToken.owner);
  });
});
