import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { quizRouter } from "./routers/quizRouter";
import { issuePracticeReceipt, practiceIdentity } from "./practiceQuestionReceipt";
import { getDb } from "./db";
import { resolveAccessForRequest } from "./_core/accessService";
import { savePracticeAttempt } from "./practiceAttemptStore";
import { validateIssuedAttribution } from "./teams/attemptAttribution";
import type { TrpcContext } from "./_core/context";

vi.mock("./db", () => ({ getDb: vi.fn() }));
vi.mock("./_core/accessService", () => ({ resolveAccessForRequest: vi.fn() }));
vi.mock("./_core/learningIdentity", () => ({ resolveLearningIdentity: vi.fn(async () => ({ userId: null, studentEmail: "operator@example.test" })) }));
vi.mock("./teams/attemptAttribution", () => ({ resolveAttemptAttribution: vi.fn(), validateIssuedAttribution: vi.fn() }));
vi.mock("./practiceAttemptStore", async original => ({ ...await original<any>(), savePracticeAttempt: vi.fn() }));
const ctx = { user: null, studentEmail: "operator@example.test", req: { protocol: "https", headers: {} }, res: {} } as TrpcContext;
const input = { examType: "class1-water", bankKey: "class1-water", questionId: 101,
  selectedIndex: 2, operationId: "550e8400-e29b-41d4-a716-446655440001", sessionId: "550e8400-e29b-41d4-a716-446655440000" };
let attemptToken: string;
beforeEach(async () => {
  vi.clearAllMocks();
  vi.mocked(resolveAccessForRequest).mockResolvedValue(true);
  vi.mocked(validateIssuedAttribution).mockResolvedValue({ orgId: null, organizationMemberId: null, flexLicenceId: null });
  vi.mocked(savePracticeAttempt).mockResolvedValue({ success: true, correct: true });
  const db: any = { select: vi.fn(() => ({ from: () => ({ where: () => ({ limit: async () => [{ correctIndex: 2, topic: "Disinfection", difficulty: "medium", module: "Treatment" }] }) }) })) };
  vi.mocked(getDb).mockResolvedValue(db);
  const { owner } = await practiceIdentity(ctx);
  attemptToken = await issuePracticeReceipt(input.bankKey, [input.questionId], owner, false);
});
afterEach(() => vi.useRealTimers());

describe("quiz.logAttempt idempotent retry guards", () => {
  it("passes a separate per-answer operation and bound exact payload to atomic storage", async () => {
    expect(await quizRouter.createCaller(ctx).logAttempt({ ...input, attemptToken })).toEqual({ success: true, correct: true });
    const stored = vi.mocked(savePracticeAttempt).mock.calls[0][1];
    expect(stored).toMatchObject({ operationId: input.operationId, sessionId: input.sessionId, userId: null, studentEmail: ctx.studentEmail });
    expect(stored.operationPayloadHash).toMatch(/^[a-f0-9]{64}$/);
    expect(validateIssuedAttribution).toHaveBeenCalledTimes(1);
    // The receipt/access/attribution path runs again even if storage already has the operation.
    await quizRouter.createCaller(ctx).logAttempt({ ...input, attemptToken });
    expect(resolveAccessForRequest).toHaveBeenCalledTimes(2);
    expect(validateIssuedAttribution).toHaveBeenCalledTimes(2);
  });
  it("rejects expired receipt replay before reading the saved operation", async () => {
    await quizRouter.createCaller(ctx).logAttempt({ ...input, attemptToken });
    vi.mocked(savePracticeAttempt).mockClear(); vi.mocked(getDb).mockClear();
    vi.useFakeTimers(); vi.setSystemTime(Date.now() + 121 * 60_000);
    expect(await quizRouter.createCaller(ctx).logAttempt({ ...input, attemptToken })).toEqual({ success: false });
    expect(savePracticeAttempt).not.toHaveBeenCalled(); expect(getDb).not.toHaveBeenCalled();
  });
  it("rejects saved paid operation after current entitlement is revoked", async () => {
    await quizRouter.createCaller(ctx).logAttempt({ ...input, attemptToken });
    vi.mocked(savePracticeAttempt).mockClear(); vi.mocked(getDb).mockClear();
    vi.mocked(resolveAccessForRequest).mockResolvedValue(false);
    expect(await quizRouter.createCaller(ctx).logAttempt({ ...input, attemptToken })).toEqual({ success: false });
    expect(savePracticeAttempt).not.toHaveBeenCalled(); expect(getDb).not.toHaveBeenCalled();
  });
  it("rejects another actor's receipt rather than disclosing an existing acknowledgement", async () => {
    expect(await quizRouter.createCaller({ ...ctx, studentEmail: "other@example.test" }).logAttempt({ ...input, attemptToken })).toEqual({ success: false });
    expect(savePracticeAttempt).not.toHaveBeenCalled();
  });
  it("binds different actors even when each submits a valid receipt for the same operation", async () => {
    await quizRouter.createCaller(ctx).logAttempt({ ...input, attemptToken });
    const firstHash = vi.mocked(savePracticeAttempt).mock.calls[0][1].operationPayloadHash;
    const otherCtx = { ...ctx, studentEmail: "other@example.test" };
    const { owner } = await practiceIdentity(otherCtx);
    const otherReceipt = await issuePracticeReceipt(input.bankKey, [input.questionId], owner, false);
    await quizRouter.createCaller(otherCtx).logAttempt({ ...input, attemptToken: otherReceipt });
    const secondHash = vi.mocked(savePracticeAttempt).mock.calls[1][1].operationPayloadHash;
    expect(firstHash).not.toBe(secondHash);
  });
  it("does not treat sessionId as an idempotency key for legacy clients", async () => {
    const { operationId: _, ...legacy } = input;
    await quizRouter.createCaller(ctx).logAttempt({ ...legacy, attemptToken });
    expect(vi.mocked(savePracticeAttempt).mock.calls[0][1]).toMatchObject({ operationId: null, operationPayloadHash: null, sessionId: input.sessionId });
  });
  it("validates the optional operation ID as UUID", async () => {
    await expect(quizRouter.createCaller(ctx).logAttempt({ ...input, attemptToken, operationId: "not-a-uuid" })).rejects.toThrow();
    expect(savePracticeAttempt).not.toHaveBeenCalled();
  });
  it("does not acknowledge when atomic persistence fails", async () => {
    vi.mocked(savePracticeAttempt).mockRejectedValue(new Error("rollback"));
    expect(await quizRouter.createCaller(ctx).logAttempt({ ...input, attemptToken })).toEqual({ success: false });
  });
});
