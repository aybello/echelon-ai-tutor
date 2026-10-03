import { afterEach, describe, expect, it, vi } from "vitest";
import { BLOG_CONTINUATION_HEARTBEAT, ensureDurableBlogHeartbeat } from "./blogSchedule";
const weekly = { taskUid: "weekly-fixture", name: "weekly-echelon-blog", userId: "owner", description: "Research, review, revise, and publish one source-grounded Echelon article each week.", cronExpression: "0 0 14 * * 1", callbackPath: "/api/scheduled/generate-blog", callbackMethod: "POST", callbackPayload: "{}", isEnable: true };
const worker = { ...weekly, taskUid: "worker-fixture", name: BLOG_CONTINUATION_HEARTBEAT.name, cronExpression: BLOG_CONTINUATION_HEARTBEAT.cron, callbackPath: BLOG_CONTINUATION_HEARTBEAT.path };
function fixture(jobs = [weekly]) {
  const execute = vi.fn().mockResolvedValue([[], []]);
  return { execute, deps: { getDb: vi.fn().mockResolvedValue({ execute }), list: vi.fn().mockResolvedValue({ jobs, actorUserId: "owner", total: jobs.length }), create: vi.fn().mockResolvedValue({ taskUid: "worker-fixture" }), update: vi.fn().mockResolvedValue({}) } };
}
afterEach(() => vi.unstubAllEnvs());
describe("durable blog schedule registration", () => {
  it("rejects preview startup before any database or schedule action", async () => {
    vi.stubEnv("DEPLOYMENT_ENV", "preview");
    const { deps } = fixture();
    await expect(ensureDurableBlogHeartbeat(deps)).rejects.toThrow("Preview");
    expect(deps.getDb).not.toHaveBeenCalled();
    expect(deps.list).not.toHaveBeenCalled();
  });
  it("fails before changing schedules if the approved table is not installed", async () => {
    const { deps, execute } = fixture(); execute.mockRejectedValue(new Error("Table absent"));
    await expect(ensureDurableBlogHeartbeat(deps)).rejects.toThrow("Table absent");
    expect(deps.list).not.toHaveBeenCalled(); expect(deps.create).not.toHaveBeenCalled();
  });
  it("creates only the missing continuation callback and persists task bindings", async () => {
    const { deps, execute } = fixture();
    await expect(ensureDurableBlogHeartbeat(deps)).resolves.toEqual({ weekly: "registered", continuation: "created" });
    expect(deps.create).toHaveBeenCalledOnce(); expect(deps.create).toHaveBeenCalledWith(BLOG_CONTINUATION_HEARTBEAT, "");
    expect(execute).toHaveBeenCalledTimes(2);
  });
  it("leaves correctly configured jobs unchanged on later production boots", async () => {
    const { deps } = fixture([weekly, worker]);
    await ensureDurableBlogHeartbeat(deps);
    expect(deps.create).not.toHaveBeenCalled(); expect(deps.update).not.toHaveBeenCalled();
  });
  it("repairs a paused continuation task by exact stored platform identity", async () => {
    const { deps } = fixture([weekly, { ...worker, isEnable: false }]);
    await ensureDurableBlogHeartbeat(deps);
    expect(deps.update).toHaveBeenCalledWith("worker-fixture", expect.objectContaining({ enable: true, path: "/api/scheduled/continue-blog" }), "");
  });
});
