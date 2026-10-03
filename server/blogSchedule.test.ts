import { afterEach, describe, expect, it, vi } from "vitest";
import { BLOG_CONTINUATION_HEARTBEAT, ensureDurableBlogHeartbeat, resumeBoundBlogHeartbeat } from "./blogSchedule";
import { ensureWeeklyBlogHeartbeat } from "./blogAutomation";
const weekly = { taskUid: "weekly-fixture", name: "weekly-echelon-blog", userId: "owner", description: "Research, review, revise, and publish one source-grounded Echelon article each week.", cronExpression: "0 0 14 * * 1", callbackPath: "/api/scheduled/generate-blog", callbackMethod: "POST", callbackPayload: "{}", isEnable: true };
const worker = { ...weekly, taskUid: "worker-fixture", name: BLOG_CONTINUATION_HEARTBEAT.name, cronExpression: BLOG_CONTINUATION_HEARTBEAT.cron, callbackPath: BLOG_CONTINUATION_HEARTBEAT.path };
function fixture(jobs = [weekly], bindings = {}) {
  const execute = vi.fn().mockResolvedValue([[bindings], []]);
  return { execute, deps: { getDb: vi.fn().mockResolvedValue({ execute }), list: vi.fn().mockResolvedValue({ jobs, actorUserId: "owner", total: jobs.length }), create: vi.fn().mockResolvedValue({ taskUid: "worker-fixture" }), update: vi.fn().mockResolvedValue({}) } };
}
afterEach(() => vi.unstubAllEnvs());
describe("durable blog schedule registration", () => {
  it("rejects preview before database or schedule actions", async () => {
    vi.stubEnv("DEPLOYMENT_ENV", "preview"); const { deps } = fixture();
    await expect(ensureDurableBlogHeartbeat(deps)).rejects.toThrow("Preview");
    expect(deps.getDb).not.toHaveBeenCalled(); expect(deps.list).not.toHaveBeenCalled();
  });
  it("fails before schedule actions if approved schema is unavailable", async () => {
    const { deps, execute } = fixture(); execute.mockRejectedValue(new Error("Table absent"));
    await expect(ensureDurableBlogHeartbeat(deps)).rejects.toThrow("Table absent");
    expect(deps.list).not.toHaveBeenCalled(); expect(deps.create).not.toHaveBeenCalled();
  });
  it("creates only missing continuation and persists binding", async () => {
    const { deps, execute } = fixture();
    await expect(ensureDurableBlogHeartbeat(deps)).resolves.toEqual({ weekly: "registered", continuation: "created" });
    expect(deps.create).toHaveBeenCalledWith(BLOG_CONTINUATION_HEARTBEAT, "");
    expect(execute).toHaveBeenCalledTimes(3);
  });
  it("preserves weekly and continuation pauses on repeated normal startups", async () => {
    const { deps } = fixture([{ ...weekly, isEnable: false }, { ...worker, isEnable: false }], { weeklyTaskUid: weekly.taskUid, workerTaskUid: worker.taskUid });
    await ensureDurableBlogHeartbeat(deps); await ensureDurableBlogHeartbeat(deps);
    expect(deps.create).not.toHaveBeenCalled(); expect(deps.update).not.toHaveBeenCalled();
  });
  it("repairs callback configuration without enablement", async () => {
    const { deps } = fixture([{ ...weekly, isEnable: false, cronExpression: "old" }, { ...worker, isEnable: false, callbackPath: "/old" }], { weeklyTaskUid: weekly.taskUid, workerTaskUid: worker.taskUid });
    await ensureDurableBlogHeartbeat(deps);
    expect(deps.update).toHaveBeenCalledTimes(2);
    for (const [, patch] of deps.update.mock.calls) expect(patch).not.toHaveProperty("enable");
  });
  it("never silently rebinds a missing saved UID to a same-named task", async () => {
    const { deps } = fixture([weekly, worker], { weeklyTaskUid: "missing-bound-uid" });
    await expect(ensureDurableBlogHeartbeat(deps)).rejects.toThrow("Bound weekly");
    expect(deps.create).not.toHaveBeenCalled(); expect(deps.update).not.toHaveBeenCalled();
  });
  it("explicit resume changes only the saved intended task and rejects wrong identity", async () => {
    vi.stubEnv("NODE_ENV", "production");
    const { deps } = fixture([weekly, { ...worker, isEnable: false }], { weeklyTaskUid: weekly.taskUid, workerTaskUid: worker.taskUid });
    await expect(resumeBoundBlogHeartbeat("worker", "wrong", deps)).rejects.toThrow("binding");
    expect(deps.update).not.toHaveBeenCalled();
    await resumeBoundBlogHeartbeat("worker", worker.taskUid, deps);
    expect(deps.update).toHaveBeenCalledOnce();
    expect(deps.update).toHaveBeenCalledWith(worker.taskUid, { enable: true }, "");
  });
  it("weekly helper alone does not re-enable a deliberate pause", async () => {
    const { deps } = fixture([{ ...weekly, isEnable: false }]);
    expect(await ensureWeeklyBlogHeartbeat(deps, weekly.taskUid)).toBe("unchanged");
    expect(deps.update).not.toHaveBeenCalled();
  });
});
