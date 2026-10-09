import { beforeEach, describe, expect, it } from "vitest";
import type { Request, Response } from "express";
import {
  getManagedJobRejections,
  requireManagedJob,
} from "./jobs/managedJobs";

/**
 * The platform proxy can rewrite the Host header to an internal service
 * address while x-forwarded-host carries the public origin. The managed-job
 * gate must accept an allowed forwarded host, keep rejecting disallowed
 * hosts, and record non-secret diagnostics for every rejection so an
 * operator can see which precondition failed without production log access.
 */

const JOB = "purchase-email-delivery";

function makeReq(headers: Record<string, string>): Request {
  return { headers } as unknown as Request;
}

function makeRes(locals: Record<string, unknown>) {
  const state: { status?: number; body?: unknown } = {};
  const res = {
    locals,
    status(code: number) {
      state.status = code;
      return res;
    },
    json(body: unknown) {
      state.body = body;
      return res;
    },
  } as unknown as Response & { locals: Record<string, unknown> };
  return { res, state };
}

describe("managed-job gate behind the platform proxy", () => {
  const savedEnv: Record<string, string | undefined> = {};
  const keys = [
    "DEPLOYMENT_ENV",
    "MANAGED_JOBS_ENABLED",
    "MANAGED_JOBS_ORIGIN",
    "MANAGED_JOB_TASK_UIDS",
  ];

  beforeEach(() => {
    for (const key of keys) {
      if (!(key in savedEnv)) savedEnv[key] = process.env[key];
    }
    process.env.DEPLOYMENT_ENV = "production";
    process.env.MANAGED_JOBS_ENABLED = "true";
    process.env.MANAGED_JOBS_ORIGIN =
      "https://echeloninstitute.ca,https://www.echeloninstitute.ca";
    process.env.MANAGED_JOB_TASK_UIDS = JSON.stringify({
      [JOB]: "task-uid-for-tests",
    });
    return () => {
      for (const key of keys) {
        const value = savedEnv[key];
        if (value === undefined) delete process.env[key];
        else process.env[key] = value;
      }
    };
  });

  it("accepts an authenticated request whose forwarded host is allowed", () => {
    const req = makeReq({
      host: "internal-service:3000",
      "x-forwarded-host": "echeloninstitute.ca",
      "x-manus-cron-task-uid": "task-uid-for-tests",
    });
    const { res } = makeRes({ scheduledAuthenticated: true });
    expect(requireManagedJob(req, res, JOB)).toBe(true);
  });

  it("accepts the first entry of a comma-separated forwarded host chain", () => {
    const req = makeReq({
      host: "internal-service:3000",
      "x-forwarded-host": "www.echeloninstitute.ca, proxy.internal",
      "x-manus-cron-task-uid": "task-uid-for-tests",
    });
    const { res } = makeRes({ scheduledAuthenticated: true });
    expect(requireManagedJob(req, res, JOB)).toBe(true);
  });

  it("rejects when neither host nor forwarded host is allowed", () => {
    const req = makeReq({
      host: "evil.example.com",
      "x-forwarded-host": "also-evil.example.com",
      "x-manus-cron-task-uid": "task-uid-for-tests",
    });
    const { res, state } = makeRes({ scheduledAuthenticated: true });
    expect(requireManagedJob(req, res, JOB)).toBe(false);
    expect(state.status).toBe(503);
  });

  it("rejects an unauthenticated request even from an allowed host", () => {
    const req = makeReq({
      host: "echeloninstitute.ca",
      "x-manus-cron-task-uid": "task-uid-for-tests",
    });
    const { res, state } = makeRes({});
    expect(requireManagedJob(req, res, JOB)).toBe(false);
    expect(state.status).toBe(503);
  });

  it("rejects a wrong task UID and records a non-secret diagnostic entry", () => {
    const req = makeReq({
      host: "echeloninstitute.ca",
      "x-manus-cron-task-uid": "wrong-task-uid",
    });
    const { res } = makeRes({ scheduledAuthenticated: true });
    expect(requireManagedJob(req, res, JOB)).toBe(false);

    const rejections = getManagedJobRejections();
    expect(rejections.length).toBeGreaterThan(0);
    const latest = rejections[rejections.length - 1] as Record<string, unknown>;
    expect(latest.job).toBe(JOB);
    expect(latest.authenticated).toBe(true);
    expect(latest.taskUidPresent).toBe(true);
    expect(latest.taskUidMatchesJob).toBe(false);
    expect(latest.hostAllowed).toBe(true);
    // Diagnostics never leak the secret or the UID values themselves.
    expect(JSON.stringify(latest)).not.toContain("wrong-task-uid");
    expect(JSON.stringify(latest)).not.toContain("task-uid-for-tests");
  });
});
