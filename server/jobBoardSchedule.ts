import { createHeartbeatJob, listHeartbeatJobs, updateHeartbeatJob } from "./_core/heartbeat";

export const JOB_BOARD_HEARTBEAT = {
  name: "echelon-job-board-refresh",
  cron: "0 0 */6 * * *",
  path: "/api/scheduled/fetch-jobs",
  method: "POST" as const,
  description: "Refresh public Canadian operator job sources every six hours in the active application database.",
};

/** Called only after the production handler is deployed, never in the sandbox. */
export async function ensureJobBoardHeartbeat(dependencies = {
  list: listHeartbeatJobs,
  create: createHeartbeatJob,
  update: updateHeartbeatJob,
}): Promise<"created" | "updated" | "unchanged"> {
  const { jobs } = await dependencies.list("", { page: 1, pageSize: 100 });
  const existing = jobs.find(job => job.callbackPath === JOB_BOARD_HEARTBEAT.path || job.name === JOB_BOARD_HEARTBEAT.name);
  if (!existing) {
    await dependencies.create(JOB_BOARD_HEARTBEAT, "");
    return "created";
  }
  if (existing.cronExpression === JOB_BOARD_HEARTBEAT.cron &&
      existing.callbackPath === JOB_BOARD_HEARTBEAT.path &&
      existing.callbackMethod.toUpperCase() === JOB_BOARD_HEARTBEAT.method &&
      existing.isEnable) return "unchanged";
  await dependencies.update(existing.taskUid, {
    cron: JOB_BOARD_HEARTBEAT.cron,
    path: JOB_BOARD_HEARTBEAT.path,
    method: JOB_BOARD_HEARTBEAT.method,
    enable: true,
  }, "");
  return "updated";
}
