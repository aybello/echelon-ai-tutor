import { afterEach, expect, it, vi } from "vitest";
import { managedJobAllowed, registerManagedJobs } from "./managedJobs";
import { WorkBusyError } from "./durableWork";
import { wrapEmailHtml } from "./triggerEngine";
const env = {
  DEPLOYMENT_ENV: "production",
  MANAGED_JOBS_ENABLED: "true",
  MANAGED_JOBS_ORIGIN: "https://echeloninstitute.ca",
  MANAGED_JOB_TASK_UIDS: '{"exam-reminders":"owned-task"}',
};
afterEach(() => vi.unstubAllEnvs());
it("rejects preview hosts, unregistered tasks and unconfigured environments", () => {
  expect(
    managedJobAllowed(
      "echeloninstitute.ca",
      "owned-task",
      "exam-reminders",
      env
    )
  ).toBe(true);
  expect(
    managedJobAllowed(
      "preview.example.com",
      "owned-task",
      "exam-reminders",
      env
    )
  ).toBe(false);
  expect(
    managedJobAllowed(
      "echeloninstitute.ca",
      "other-task",
      "exam-reminders",
      env
    )
  ).toBe(false);
  expect(
    managedJobAllowed("echeloninstitute.ca", undefined, "exam-reminders", env)
  ).toBe(false);
  expect(
    managedJobAllowed("echeloninstitute.ca", "owned-task", "exam-reminders", {
      ...env,
      DEPLOYMENT_ENV: "preview",
    })
  ).toBe(false);
  expect(
    managedJobAllowed("echeloninstitute.ca", "owned-task", "exam-reminders", {})
  ).toBe(false);
});
it("requires authenticated scheduled requests and returns retryable HTTP failures", async () => {
  for (const [key, value] of Object.entries(env)) vi.stubEnv(key, value);
  const handlers = new Map<string, Function>();
  const run = vi.fn().mockResolvedValue({ state: "completed" });
  registerManagedJobs(
    {
      post: (path: string, handler: Function) => handlers.set(path, handler),
    } as any,
    run
  );
  const req = {
    headers: {
      host: "echeloninstitute.ca",
      "x-manus-cron-task-uid": "owned-task",
    },
  };
  const res: any = {
    locals: {},
    status: vi.fn().mockReturnThis(),
    json: vi.fn().mockReturnThis(),
  };
  const handler = handlers.get("/api/scheduled/exam-reminders")!;
  await handler(req, res);
  expect(run).not.toHaveBeenCalled();
  expect(res.status).toHaveBeenCalledWith(503);
  res.locals.scheduledAuthenticated = true;
  await handler(req, res);
  expect(res.json).toHaveBeenLastCalledWith({
    ok: true,
    job: "exam-reminders",
    state: "completed",
  });
  run.mockRejectedValueOnce(new WorkBusyError("busy"));
  await handler(req, res);
  expect(res.status).toHaveBeenLastCalledWith(409);
  run.mockRejectedValueOnce(new Error("storage unavailable"));
  await handler(req, res);
  expect(res.status).toHaveBeenLastCalledWith(503);
});
it("renders model output and subject as text rather than executable HTML or links", () => {
  const html = wrapEmailHtml(
    '<script>alert(1)</script>\n\n<a href="https://evil.test">Go</a> & "quoted"',
    '<img src=x onerror="bad">'
  );
  expect(html).not.toContain("<script>");
  expect(html).not.toContain('<a href="https://evil.test">');
  expect(html).toContain("&lt;script&gt;");
  expect(html).toContain("&lt;img");
  expect(html).toContain('href="https://echeloninstitute.ca"');
});
