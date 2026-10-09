import { describe, expect, it } from "vitest";
import { managedJobAllowed, MANAGED_JOBS } from "./jobs/managedJobs";

/**
 * Validates the MANAGED_JOB_TASK_UIDS mapping configured for production.
 * The platform schedules for exam-reminders, study-triggers and
 * reconcile-purchases were recreated on 2026-10-09 after the originals
 * disappeared, which silently stopped daily reminder email delivery.
 */
describe("MANAGED_JOB_TASK_UIDS configuration", () => {
  const raw = process.env.MANAGED_JOB_TASK_UIDS;

  it.skipIf(!raw)("maps every managed job plus the purchase email outbox to a task UID", () => {
    const parsed = JSON.parse(raw!) as Record<string, string>;
    const required = [...Object.keys(MANAGED_JOBS), "purchase-email-delivery"];
    for (const job of required) {
      expect(parsed[job], `missing task UID for ${job}`).toBeTruthy();
      expect(parsed[job]).toMatch(/^[A-Za-z0-9]{10,}$/);
    }
  });

  it.skipIf(!raw)("authorizes each configured job only for its own task UID", () => {
    const parsed = JSON.parse(raw!) as Record<string, string>;
    const env = {
      DEPLOYMENT_ENV: "production",
      MANAGED_JOBS_ENABLED: "true",
      MANAGED_JOBS_ORIGIN: "https://echeloninstitute.ca",
      MANAGED_JOB_TASK_UIDS: raw!,
    } as NodeJS.ProcessEnv;
    for (const [job, uid] of Object.entries(parsed)) {
      expect(managedJobAllowed("echeloninstitute.ca", uid, job, env)).toBe(true);
      expect(managedJobAllowed("echeloninstitute.ca", "wrong-task-uid", job, env)).toBe(false);
    }
  });
});
