import { describe, expect, it } from "vitest";
import { ceuRouter } from "../routers/ceuRouter";
import type { TrpcContext } from "../_core/context";
const ctx = (studentEmail: string | null = null) =>
  ({ user: null, studentEmail, req: {}, res: {} }) as TrpcContext;
const courseKey = "ceu-sampling-data-quality";
describe("CEU public API boundary", () => {
  it("serves public lessons without case or final answer keys and hides authored marking notes", async () => {
    const c = await ceuRouter.createCaller(ctx()).course({ courseKey });
    expect(c.modules).toHaveLength(4);
    expect(c.finalQuestionCount).toBe(8);
    expect(JSON.stringify(c)).not.toContain('"correctIndex"');
    expect(JSON.stringify(c)).not.toContain('"facilitatorGuide"');
    expect(JSON.stringify(c)).not.toContain('"rubric"');
    expect(JSON.stringify(c)).not.toContain('"assignment"');
  });
  it("rejects anonymous enrollment, record, exercise, heartbeat and final access", async () => {
    const caller = ceuRouter.createCaller(ctx());
    await expect(caller.myRecord({ courseKey })).rejects.toMatchObject({
      code: "UNAUTHORIZED",
    });
    await expect(
      caller.start({
        courseKey,
        learnerName: "Example Learner",
        operatorNumber: "90000064",
      })
    ).rejects.toMatchObject({ code: "UNAUTHORIZED" });
    await expect(
      caller.exercise({ courseKey, moduleId: "sample-design" })
    ).rejects.toMatchObject({ code: "UNAUTHORIZED" });
    await expect(
      caller.heartbeat({
        courseKey,
        moduleId: "sample-design",
        activityAt: new Date().toISOString(),
      })
    ).rejects.toMatchObject({ code: "UNAUTHORIZED" });
    await expect(caller.assessment({ courseKey })).rejects.toMatchObject({
      code: "UNAUTHORIZED",
    });
  });
  it("has no reviewer, attendance attestation or manual completion procedures", () => {
    const procedures = Object.keys(ceuRouter._def.procedures);
    expect(procedures).not.toContain("reviewQueue");
    expect(procedures).not.toContain("instructorMaterial");
    expect(procedures).not.toContain("review");
  });
});
