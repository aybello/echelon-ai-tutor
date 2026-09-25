import { describe, expect, it } from "vitest";
import { ceuRouter } from "../routers/ceuRouter";
import type { TrpcContext } from "../_core/context";
const ctx = (studentEmail: string | null = null, user: any = null) =>
  ({ user, studentEmail, req: {}, res: {} }) as TrpcContext;
const courseKey = "ceu-sampling-data-quality";
describe("CEU API authorization boundary", () => {
  it("serves public lessons without answer keys or instructor material", async () => {
    const c = await ceuRouter.createCaller(ctx()).course({ courseKey });
    expect(c.modules).toHaveLength(4);
    expect(c.finalQuestionCount).toBe(8);
    expect(JSON.stringify(c)).not.toContain('"correctIndex"');
    await expect(
      ceuRouter.createCaller(ctx()).instructorMaterial({ courseKey })
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
  });
  it("rejects anonymous record reads, writes and assessment requests before database access", async () => {
    const caller = ceuRouter.createCaller(ctx());
    await expect(caller.myRecord({ courseKey })).rejects.toMatchObject({
      code: "UNAUTHORIZED",
    });
    await expect(caller.start({ courseKey })).rejects.toMatchObject({
      code: "UNAUTHORIZED",
    });
    await expect(
      caller.save({
        courseKey,
        revision: 0,
        action: { type: "draft", moduleId: "sample-design", text: "private" },
      })
    ).rejects.toMatchObject({ code: "UNAUTHORIZED" });
    await expect(caller.assessment({ courseKey })).rejects.toMatchObject({
      code: "UNAUTHORIZED",
    });
  });
  it("does not grant an email-session learner instructor privileges", async () => {
    const caller = ceuRouter.createCaller(ctx("learner@example.test"));
    await expect(caller.reviewQueue()).rejects.toMatchObject({
      code: "FORBIDDEN",
    });
    await expect(
      caller.instructorMaterial({ courseKey })
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
    await expect(
      caller.review({
        courseKey,
        email: "victim@example.test",
        revision: 0,
        action: { type: "complete", name: "Forged" },
      })
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
  });
  it("prevents self-review even for an administrator", async () => {
    const caller = ceuRouter.createCaller(
      ctx(null, { id: 9, role: "admin", email: "reviewer@example.test" })
    );
    await expect(
      caller.review({
        courseKey,
        email: "REVIEWER@example.test",
        revision: 0,
        action: { type: "complete", name: "Self" },
      })
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
  });
});
