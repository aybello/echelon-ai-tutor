import { beforeEach, describe, expect, it, vi } from "vitest";
import { TRPCError } from "@trpc/server";
import { dashboardRouter } from "./routers/dashboardRouter";
import { assertAccess } from "./_core/accessService";
import { gatherNextStepInput } from "./nextStepData";
import { resolvePrimaryStudyFocus } from "./_core/studyFocus";
import { getDb } from "./db";
import type { TrpcContext } from "./_core/context";
import type { NextStepInput } from "../shared/nextStep";

vi.mock("./db", () => ({ getDb: vi.fn() }));
vi.mock("./_core/accessService", async importOriginal => ({ ...await importOriginal<typeof import("./_core/accessService")>(), assertAccess: vi.fn() }));
vi.mock("./nextStepData", () => ({ gatherNextStepInput: vi.fn() }));
vi.mock("./_core/studyFocus", () => ({ resolvePrimaryStudyFocus: vi.fn() }));
vi.mock("./_core/access", async importOriginal => ({ ...await importOriginal<typeof import("./_core/access")>(), resolveEntitlementsByEmail: vi.fn(async () => ({ unlockedExamTypes: ["class1-water"] })) }));

const calm: NextStepInput = { currentStreakDays: 0, practisedToday: false, missedQuestionCount: 0, modules: [], daysUntilExam: null, daysSinceLastMock: null };
const caller = (studentEmail: string | null = "learner@example.com") =>
  dashboardRouter.createCaller({ user: null, studentEmail, req: {}, res: {} } as unknown as TrpcContext);

describe("dashboard.nextStep", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getDb).mockResolvedValue({} as never);
    vi.mocked(assertAccess).mockResolvedValue(undefined);
    vi.mocked(gatherNextStepInput).mockResolvedValue(calm);
    vi.mocked(resolvePrimaryStudyFocus).mockResolvedValue({ courseKey: "class1-water", examType: "class1-water", source: "attempts" } as never);
  });

  it("refuses a visitor who is not signed in, without looking at any data", async () => {
    await expect(caller(null).nextStep({ courseKey: "class1-water" })).rejects.toMatchObject({ code: "UNAUTHORIZED" });
    expect(assertAccess).not.toHaveBeenCalled();
    expect(gatherNextStepInput).not.toHaveBeenCalled();
  });

  it("refuses a learner who does not have the course, and reads no learner data", async () => {
    vi.mocked(assertAccess).mockRejectedValue(new TRPCError({ code: "FORBIDDEN", message: "Access denied" }));
    await expect(caller().nextStep({ courseKey: "class1-water" })).rejects.toMatchObject({ code: "FORBIDDEN" });
    expect(assertAccess).toHaveBeenCalledWith(expect.anything(), "class1-water", expect.anything());
    expect(gatherNextStepInput).not.toHaveBeenCalled();
  });

  it("returns exactly one suggestion built from the learner's data", async () => {
    vi.mocked(gatherNextStepInput).mockResolvedValue({ ...calm, missedQuestionCount: 6 });
    const result = await caller().nextStep({ courseKey: "class1-water", timezoneOffsetMinutes: 300 });
    expect(result.courseKey).toBe("class1-water");
    expect(result.step.rule).toBe("missed");
    expect(result.step.message).toBe("Review your 6 missed questions.");
    expect(gatherNextStepInput).toHaveBeenCalledWith(expect.anything(), { userId: null, email: "learner@example.com" }, "class1-water", { timezoneOffsetMinutes: 300 });
  });

  it("uses the course the learner studied most recently when none is given", async () => {
    const result = await caller().nextStep();
    expect(resolvePrimaryStudyFocus).toHaveBeenCalled();
    expect(result.courseKey).toBe("class1-water");
    expect(result.step.rule).toBe("quick-10");
  });

  it("offers the plain Quick 10 suggestion when the learner has no course yet, with no data read", async () => {
    vi.mocked(resolvePrimaryStudyFocus).mockResolvedValue({ courseKey: null, examType: null, source: "none" } as never);
    const result = await caller().nextStep();
    expect(result.courseKey).toBeNull();
    expect(result.step.rule).toBe("quick-10");
    expect(assertAccess).not.toHaveBeenCalled();
    expect(gatherNextStepInput).not.toHaveBeenCalled();
  });

  it("rejects a wild timezone offset", async () => {
    await expect(caller().nextStep({ courseKey: "class1-water", timezoneOffsetMinutes: 5000 })).rejects.toThrow();
  });
});
