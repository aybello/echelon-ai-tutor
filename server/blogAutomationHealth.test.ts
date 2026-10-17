import { describe, expect, it } from "vitest";
// @ts-ignore Standalone ESM audit helpers are tested directly without a build step.
import { blogHeartbeatEnv, evaluateBlogAutomationHealth, readBlogHeartbeatSnapshot, weeklyBlogSlot } from "../scripts/lib/blogAutomationHealth.mjs";

const monday = Date.parse("2026-10-12T14:00:00Z");
const minute = 60_000;
function fixture() {
  return {
    now: new Date(monday + 61 * minute),
    rows: [{ id: "weekly-echelon-blog", runKey: "weekly:2026-10-12", status: "completed", attempts: 8,
      progress: JSON.stringify({ phase: "publish", approved: true }), weeklyTaskUid: "weekly-fixture", workerTaskUid: "worker-fixture",
      startedAt: new Date(monday), updatedAt: new Date(monday + 20 * minute) }],
    latestArticle: { id: 1, slug: "automated-fixture", published: 1, tags: "Ontario, Automated Article", publishedAt: new Date(monday + 20 * minute) },
    heartbeat: { blocked: [] as string[], jobs: [
      { task_uid: "weekly-fixture", name: "weekly-echelon-blog", callback_path: "/api/scheduled/generate-blog", callback_method: "POST",
        cron_expression: "0 0 14 * * 1", is_enable: true, created_at: "2026-09-01T00:00:00Z" },
      { task_uid: "worker-fixture", name: "echelon-blog-continuation", callback_path: "/api/scheduled/continue-blog", callback_method: "POST",
        cron_expression: "0 * * * * *", is_enable: true, created_at: "2026-09-01T00:00:00Z" },
    ], weeklyRuns: [{ task_uid: "weekly-fixture", scheduled_at: new Date(monday + minute), status: "success", http_status: 200, is_manual_trigger: false }] },
  };
}
const assess = (value: unknown) => evaluateBlogAutomationHealth(value);
const codes = (value: unknown) => assess(value).findings.map((finding: { code: string }) => finding.code);

describe("weekly blog outcome audit", () => {
  it("passes only a real completed run, enabled bindings, successful schedule and tagged publication", () => {
    expect(assess(fixture()).status).toBe("pass");
  });
  it.each([0, 1])("detects disabled bound task %i", index => {
    const input = fixture(); input.heartbeat.jobs[index].is_enable = false;
    expect(assess(input).status).toBe("fail");
    expect(codes(input)).toContain(index === 0 ? "weekly-disabled" : "worker-disabled");
  });
  it("does not substitute an enabled lookalike for a missing binding", () => {
    const input = fixture(); input.rows[0].weeklyTaskUid = "missing-fixture";
    expect(codes(input)).toContain("weekly-binding");
    expect(assess(input).status).toBe("fail");
  });
  it("rejects missing, non-distinct, ambiguous and duplicate-name bindings", () => {
    for (const change of [
      (input: ReturnType<typeof fixture>) => { input.rows[0].workerTaskUid = ""; },
      (input: ReturnType<typeof fixture>) => { input.rows[0].workerTaskUid = input.rows[0].weeklyTaskUid; },
      (input: ReturnType<typeof fixture>) => { input.heartbeat.jobs.push({ ...input.heartbeat.jobs[0] }); },
      (input: ReturnType<typeof fixture>) => { input.heartbeat.jobs.push({ ...input.heartbeat.jobs[0], task_uid: "duplicate-fixture" }); },
    ]) { const input = fixture(); change(input); expect(assess(input).status).toBe("fail"); }
    expect(assess({ ...fixture(), rows: [] }).status).toBe("fail");
    expect(assess({ ...fixture(), rows: [...fixture().rows, ...fixture().rows] }).status).toBe("fail");
  });
  it("detects wrong cron, callback or method", () => {
    for (const patch of [{ cron_expression: "0 0 15 * * 1" }, { callback_path: "/api/scheduled/unrelated" }, { callback_method: "GET" }]) {
      const input = fixture(); Object.assign(input.heartbeat.jobs[0], patch);
      expect(codes(input)).toContain("weekly-configuration");
    }
  });
  it.each([["failed", 403], ["failed", 500], ["timeout", 0], ["success", 403]])("fails latest scheduled %s HTTP %i even with a fresh manual retry", (status, http) => {
    const input = fixture(); Object.assign(input.heartbeat.weeklyRuns[0], { status, http_status: http });
    input.heartbeat.weeklyRuns.unshift({ ...input.heartbeat.weeklyRuns[0], status: "success", http_status: 200,
      scheduled_at: new Date(monday + 30 * minute), is_manual_trigger: true });
    expect(codes(input)).toContain("weekly-execution"); expect(assess(input).status).toBe("fail");
  });
  it("sorts execution history by scheduled time rather than trusting array order", () => {
    const input = fixture(); input.heartbeat.weeklyRuns.unshift({ ...input.heartbeat.weeklyRuns[0], status: "failed", http_status: 403,
      scheduled_at: new Date(monday - 7 * 24 * 60 * minute) });
    expect(assess(input).status).toBe("pass");
  });
  it("does not accept the completed initialization placeholder", () => {
    const input = fixture(); Object.assign(input.rows[0], { runKey: "", attempts: 0, progress: "{}", status: "completed" });
    expect(codes(input)).toContain("run-evidence"); expect(assess(input).status).toBe("fail");
  });
  it.each(["{}", "broken JSON", JSON.stringify({ phase: "unknown" })])("rejects invalid run progress %s", progress => {
    const input = fixture(); input.rows[0].progress = progress;
    expect(codes(input)).toContain("run-evidence");
  });
  it("does not count manual posts, drafts, tag substrings, old or future publications", () => {
    for (const patch of [{ tags: "Ontario,Manual" }, { tags: "Not Automated Article" }, { published: 0 },
      { publishedAt: new Date(monday - 1) }, { publishedAt: new Date(monday + 62 * minute) }]) {
      const input = fixture(); Object.assign(input.latestArticle, patch);
      expect(codes(input)).toContain("publication-overdue");
    }
    expect(codes({ ...fixture(), latestArticle: null })).toContain("publication-overdue");
  });
  it("accepts exact whitespace-separated automation tags and the exact deadline timestamp", () => {
    const input = fixture(); Object.assign(input.latestArticle, { tags: "Ontario,  Automated Article  ,Study", publishedAt: new Date(monday) });
    expect(assess(input).status).toBe("pass");
  });
  it("keeps the previous weekly obligation before Monday 14 UTC and during grace, not from midnight", () => {
    const input = fixture(); input.latestArticle.publishedAt = new Date(monday - 7 * 24 * 60 * minute + 20 * minute);
    input.heartbeat.weeklyRuns[0].scheduled_at = new Date(monday - 7 * 24 * 60 * minute + minute);
    for (const at of [monday - 1, monday, monday + 60 * minute - 1]) {
      input.now = new Date(at); expect(codes(input)).not.toContain("publication-overdue");
    }
    input.now = new Date(monday + 60 * minute);
    expect(codes(input)).toContain("publication-overdue"); expect(codes(input)).toContain("weekly-missing");
  });
  it("handles UTC weekly boundaries across month, year and daylight-saving dates", () => {
    expect(weeklyBlogSlot(new Date("2026-10-12T13:59:59Z"))).toBe(Date.parse("2026-10-05T14:00:00Z"));
    expect(weeklyBlogSlot(new Date("2026-10-12T14:00:00Z"))).toBe(monday);
    expect(weeklyBlogSlot(new Date("2027-01-01T00:00:00Z"))).toBe(Date.parse("2026-12-28T14:00:00Z"));
    expect(weeklyBlogSlot(new Date("2026-11-02T14:00:00Z"))).toBe(Date.parse("2026-11-02T14:00:00Z"));
  });
  it("warns, never passes, before a new installation's first eligible deadline", () => {
    const input = fixture(); input.heartbeat.jobs[0].created_at = new Date(monday + minute).toISOString();
    Object.assign(input.rows[0], { runKey: "", attempts: 0, progress: "{}" });
    input.heartbeat.weeklyRuns = [];
    const fresh = { ...input, latestArticle: null };
    expect(assess(fresh).status).toBe("warn"); expect(codes(fresh)).not.toContain("publication-overdue");
    fresh.now = new Date(monday + 7 * 24 * 60 * minute + 60 * minute);
    expect(assess(fresh).status).toBe("fail"); expect(codes(fresh)).toContain("publication-overdue");
  });
  it("does not use a late-created state row to hide a missed deadline of an existing task", () => {
    const input = fixture(); input.rows[0].startedAt = input.now;
    expect(codes({ ...input, latestArticle: null })).toContain("publication-overdue");
  });
  it("does not grant first-run exemption when creation equals the scheduled slot", () => {
    const input = fixture(); input.heartbeat.jobs[0].created_at = new Date(monday).toISOString();
    expect(codes({ ...input, latestArticle: null })).toContain("publication-overdue");
  });
  it.each(["pending", "processing"])("checks %s progress and total-run boundaries strictly", status => {
    const input = fixture(); const row = input.rows[0]; row.status = status;
    row.startedAt = new Date(input.now.getTime() - 30 * minute); row.updatedAt = new Date(input.now.getTime() - 5 * minute);
    expect(codes(input)).not.toContain("run-stale");
    row.updatedAt = new Date(input.now.getTime() - 5 * minute - 1);
    expect(codes(input)).toContain("run-stale");
    row.updatedAt = input.now; row.startedAt = new Date(input.now.getTime() - 30 * minute - 1);
    expect(codes(input)).toContain("run-stale");
  });
  it("blocks invalid timestamps and fails a persisted failure", () => {
    const input = fixture(); input.rows[0].status = "failed"; expect(codes(input)).toContain("run-failed");
    input.rows[0].status = "processing"; input.rows[0].updatedAt = new Date("invalid");
    expect(assess(input).status).toBe("blocked");
  });
  it("does not turn unavailable capabilities or unsupported states into a pass", () => {
    for (const patch of [{ heartbeat: null }, { rows: undefined }, { latestArticle: undefined },
      { heartbeat: { ...fixture().heartbeat, weeklyRuns: null } }, { heartbeat: { ...fixture().heartbeat, jobs: null } },
      { heartbeat: { ...fixture().heartbeat, blocked: ["CLI unavailable"] } }]) {
      expect(assess({ ...fixture(), ...patch }).status).toBe("blocked");
    }
    const input = fixture(); delete (input.heartbeat.jobs[0] as Partial<typeof input.heartbeat.jobs[0]>).created_at;
    expect(assess(input).status).toBe("blocked");
  });
  it("blocks future creation/execution clocks and unsupported HTTP-success evidence", () => {
    const futureCreation = fixture(); futureCreation.heartbeat.jobs[0].created_at = "2027-01-01T00:00:00Z";
    expect(assess(futureCreation).status).toBe("blocked");
    const futureRun = fixture(); futureRun.heartbeat.weeklyRuns[0].scheduled_at = new Date("2027-01-01T00:00:00Z");
    expect(assess(futureRun).status).toBe("blocked");
    const noHttp = fixture(); noHttp.heartbeat.weeklyRuns[0].http_status = 0;
    expect(assess(noHttp).status).toBe("blocked");
  });
  it("keeps missing publication capability blocked even during first-run grace", () => {
    const input = fixture(); input.heartbeat.jobs[0].created_at = new Date(monday + minute).toISOString();
    expect(assess({ ...input, latestArticle: undefined }).status).toBe("blocked");
  });
});

describe("read-only heartbeat snapshot", () => {
  const parent = { PATH: "/usr/bin", BUILT_IN_FORGE_API_URL: "https://forge.echelon.test", BUILT_IN_FORGE_API_KEY: "fixture-key",
    DATABASE_URL: "mysql://forbidden", OPENAI_API_KEY: "forbidden", NODE_OPTIONS: "--require=forbidden", SMTP_PASS: "forbidden" };
  const options = { weeklyTaskUid: "weekly-fixture", parentEnv: parent, home: "/private-home", cwd: "/repo", outputDir: "/private-evidence" };
  function runner(outputs: unknown[]) {
    const calls: Array<{ command: string; args: string[]; options: any }> = [];
    return { calls, run: async (command: string, args: string[], options: any) => {
      calls.push({ command, args, options });
      return { exitCode: 0, tail: JSON.stringify(outputs.shift()), logPath: options.logPath };
    } };
  }
  it("allowlists only Forge and basic execution settings, excluding preloads and all other keys", () => {
    const env = blogHeartbeatEnv(parent, "/private-home");
    expect(env.BUILT_IN_FORGE_API_KEY).toBe("fixture-key");
    expect(env.HOME).toBe("/private-home");
    for (const key of ["DATABASE_URL", "OPENAI_API_KEY", "SMTP_PASS", "NODE_OPTIONS"]) expect(env).not.toHaveProperty(key);
  });
  it("calls only fixed list/logs commands with bounded time, bytes and no response bodies", async () => {
    const mock = runner([{ jobs: fixture().heartbeat.jobs, total: 2 },
      { runs: fixture().heartbeat.weeklyRuns, task_uid: "weekly-fixture", total: 1 }]);
    const snapshot = await readBlogHeartbeatSnapshot({ ...options, run: mock.run });
    expect(snapshot.blocked).toEqual([]); expect(mock.calls).toHaveLength(2);
    expect(mock.calls.map(call => call.args[0])).toEqual(["list", "logs"]);
    for (const call of mock.calls) {
      expect(call.command).toBe("manus-heartbeat"); expect(call.args).not.toContain("--with-body");
      expect(call.options.timeoutMs).toBeLessThanOrEqual(12_000);
      expect(call.options.maxOutputBytes).toBe(1024 * 1024); expect(call.options.env).not.toHaveProperty("DATABASE_URL");
    }
  });
  it("blocks partial job pages instead of declaring a missing binding from incomplete evidence", async () => {
    const mock = runner([{ jobs: [], total: 201 }, { runs: [], task_uid: "weekly-fixture", total: 0 }]);
    const snapshot = await readBlogHeartbeatSnapshot({ ...options, run: mock.run });
    expect(snapshot.jobs).toBeNull(); expect(snapshot.blocked.join(" ")).toContain("incomplete");
  });
  it("blocks missing credentials without launching a subprocess", async () => {
    const mock = runner([]);
    const snapshot = await readBlogHeartbeatSnapshot({ ...options, parentEnv: {}, run: mock.run });
    expect(snapshot.blocked).not.toHaveLength(0); expect(mock.calls).toHaveLength(0);
  });
  it.each([{ exitCode: 1, tail: "{}" }, { exitCode: 0, timedOut: true, tail: "{}" },
    { exitCode: 0, error: "ENOENT", tail: "{}" }, { exitCode: 0, tail: "invalid" },
    { exitCode: 0, outputLimited: true, tail: "{}" }])("blocks unavailable, timed out or malformed reads %j", async result => {
    const snapshot = await readBlogHeartbeatSnapshot({ ...options, run: async () => result });
    expect(snapshot.blocked).not.toHaveLength(0); expect(snapshot.jobs).toBeNull(); expect(snapshot.weeklyRuns).toBeNull();
  });
  it("rejects a mismatched log identity and unsafe binding rather than guessing", async () => {
    const mock = runner([{ jobs: [], total: 0 }, { runs: [], total: 0, task_uid: "wrong-fixture" }]);
    expect((await readBlogHeartbeatSnapshot({ ...options, run: mock.run })).blocked.join(" ")).toContain("log shape");
    const unsafe = runner([{ jobs: [], total: 0 }]);
    expect((await readBlogHeartbeatSnapshot({ ...options, weeklyTaskUid: "--resume", run: unsafe.run })).blocked.length).toBeGreaterThan(0);
    expect(unsafe.calls).toHaveLength(1);
  });
});
