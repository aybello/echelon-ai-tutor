import { describe, expect, it, vi } from "vitest";
import { ensureJobBoardHeartbeat, JOB_BOARD_HEARTBEAT } from "./jobBoardSchedule";

function dependencies(jobs: unknown[] = []) {
  return {
    list: vi.fn().mockResolvedValue({ jobs }),
    create: vi.fn().mockResolvedValue({ taskUid: "fixture-job" }),
    update: vi.fn().mockResolvedValue({}),
  };
}

describe("job board native schedule", () => {
  it("creates the missing six-hour refresh against the existing callback", async () => {
    const d = dependencies();
    expect(await ensureJobBoardHeartbeat(d)).toBe("created");
    expect(d.create).toHaveBeenCalledWith(JOB_BOARD_HEARTBEAT, "");
    expect(d.update).not.toHaveBeenCalled();
  });
  it("reuses the schedule's durable task UID when a refresh is paused", async () => {
    const d = dependencies([{ taskUid: "existing-id", name: "old-name", callbackPath: JOB_BOARD_HEARTBEAT.path, cronExpression: JOB_BOARD_HEARTBEAT.cron, callbackMethod: "POST", isEnable: false }]);
    expect(await ensureJobBoardHeartbeat(d)).toBe("unchanged");
    expect(d.update).not.toHaveBeenCalled();
    expect(d.create).not.toHaveBeenCalled();
  });
  it("repairs a paused Jobs callback without changing its enable state", async () => {
    const d = dependencies([{ taskUid: "existing-id", name: JOB_BOARD_HEARTBEAT.name, callbackPath: "/old", cronExpression: "old", callbackMethod: "GET", isEnable: false }]);
    expect(await ensureJobBoardHeartbeat(d)).toBe("updated");
    expect(d.update).toHaveBeenCalledWith("existing-id", { cron: JOB_BOARD_HEARTBEAT.cron, path: JOB_BOARD_HEARTBEAT.path, method: "POST" }, "");
    expect(d.update.mock.calls[0][1]).not.toHaveProperty("enable");
    expect(d.create).not.toHaveBeenCalled();
  });
  it("leaves a current schedule and all unrelated jobs alone", async () => {
    const d = dependencies([
      { taskUid: "unrelated", name: "weekly-blog", callbackPath: "/api/scheduled/generate-blog" },
      { taskUid: "existing-id", name: JOB_BOARD_HEARTBEAT.name, callbackPath: JOB_BOARD_HEARTBEAT.path, cronExpression: JOB_BOARD_HEARTBEAT.cron, callbackMethod: "post", isEnable: true },
    ]);
    expect(await ensureJobBoardHeartbeat(d)).toBe("unchanged");
    expect(d.update).not.toHaveBeenCalled();
    expect(d.create).not.toHaveBeenCalled();
  });
  it("does not treat a registration failure as a successful schedule", async () => {
    const d = dependencies();
    d.create.mockRejectedValue(new Error("registration unavailable"));
    await expect(ensureJobBoardHeartbeat(d)).rejects.toThrow("registration unavailable");
  });
});
