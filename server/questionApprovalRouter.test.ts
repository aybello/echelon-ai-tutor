import { beforeEach, describe, expect, it, vi } from "vitest";
vi.mock("./db", () => ({ getDb: vi.fn() }));
import { getDb } from "./db";
import { adminRouter } from "./routers/admin";
const caller = adminRouter.createCaller({ user: { id: 1, email: "reviewer@example.test", name: "Reviewer", role: "admin" }, req: { headers: {} }, res: {} } as any);
const input = { id: 240651, sourceTitle: "Formula source", sourceReference: "Flow-weighted average", sourceUrl: null, blueprintObjective: "Blending calculations", reviewStatus: "approved" as const };
let row: any;
let tx: any;
beforeEach(() => {
  row = { bankKey: "class3-water", options: '["76.7","90","60","66.7"]', correctIndex: 0, explanation: "Flow-weighted mean.", isCalc: "yes", steps: '[{"l":"Formula","c":"Weighted average"},{"l":"Calculate","c":"76.7 mg/L"}]' };
  tx = { update: vi.fn().mockReturnValue({ set: vi.fn().mockReturnValue({ where: vi.fn().mockResolvedValue(undefined) }) }) };
  vi.mocked(getDb).mockResolvedValue({ select: () => ({ from: () => ({ where: () => ({ limit: async () => [row] }) }) }), transaction: async (callback: any) => callback(tx) } as any);
});
describe("actual admin approval procedure", () => {
  it("rejects missing objective before any write", async () => {
    await expect(caller.reviewQuestion({ ...input, blueprintObjective: null })).rejects.toMatchObject({ code: "BAD_REQUEST" });
    expect(tx.update).not.toHaveBeenCalled();
  });
  it.each(['[{"l":"Body missing"}]', '[{"l":"Malformed","c":"oops)}"]', "[]"])("rejects malformed/incomplete worked steps before any write: %s", async steps => {
    row.steps = steps;
    await expect(caller.reviewQuestion(input)).rejects.toMatchObject({ code: "BAD_REQUEST" });
    expect(tx.update).not.toHaveBeenCalled();
  });
  it("approves complete steps and invalidates the existing bank cache", async () => {
    await expect(caller.reviewQuestion(input)).resolves.toEqual({ success: true });
    expect(tx.update).toHaveBeenCalledTimes(2);
  });
});
