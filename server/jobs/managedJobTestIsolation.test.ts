import { readFileSync } from "node:fs";
import { expect, it, vi } from "vitest";

vi.mock("./durableWork", () => ({
  claimWork: vi.fn(async () => ({
    assertOwned: vi.fn().mockResolvedValue(undefined),
    finish: vi.fn().mockResolvedValue(undefined),
  })),
  WorkBusyError: class WorkBusyError extends Error {},
}));

import { claimWork } from "./durableWork";
import { MANAGED_JOBS, runManagedJob } from "./managedJobs";

it("uses only the UUID-based injected job name for integration runs and cleanup", () => {
  const source = readFileSync(
    new URL("../billingJobs.integration.test.ts", import.meta.url),
    "utf8"
  );
  expect(source).toContain("const prefix = `reliability-${randomUUID()}`");
  expect(source).toContain("const testJobName = `test-${prefix}`");
  expect(source).not.toContain('"exam-reminders"');
  const calls = [...source.matchAll(/runManagedJob\(\s*([^,]+)/g)];
  expect(calls).toHaveLength(6);
  for (const call of calls) expect(call[1].trim()).toBe("testJobName");
  expect(source.match(/\[testJobName\]:/g)).toHaveLength(2);
  expect(source).toContain("`job-lock:${testJobName}`");
  expect(source).toContain("`job:${testJobName}:${day}`");
  expect(source).toContain("inArray(scheduledWork.workKey");
});

it("derives date and global lock keys from the injected synthetic name", async () => {
  const name =
    "test-reliability-00000000-0000-4000-8000-000000000000" as keyof typeof MANAGED_JOBS;
  const db = {} as any;
  const run = vi.fn().mockResolvedValue({ sent: 0, errors: [] });
  vi.mocked(claimWork).mockClear();
  await expect(
    runManagedJob(name, new Date("2098-01-03T23:59:59Z"), {
      getDb: async () => db,
      jobs: { ...MANAGED_JOBS, [name]: { cron: "0 0 8 * * *", run } },
    })
  ).resolves.toEqual({ state: "completed" });
  expect(vi.mocked(claimWork).mock.calls.map(call => call[1])).toEqual([
    `job:${name}:2098-01-03`,
    `job-lock:${name}`,
  ]);
  expect(run).toHaveBeenCalledTimes(1);
});
