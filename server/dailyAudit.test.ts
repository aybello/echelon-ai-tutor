import { describe, expect, it } from "vitest";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
// @ts-ignore Standalone ESM audit helpers are tested directly without a build step.
import { isolatedTestEnv, isolatedBrowserTestEnv, ciDeterministicExcludes, runCommand, evaluateVitest, combineTestAttempts, parseTrpc, validateQuestion, validateQuizReply, classifyTutorReply, evaluateTutorSequence, tutorHistoryAssessment, importJourneyResults, validateJourneyReport, evaluateServingReleaseIdentity, createAuditBudget, summarizeResults } from "../scripts/lib/dailyAudit.mjs";

const envelope = (data: unknown) => JSON.stringify([{ result: { data: { json: data } } }]);
const trpcError = (code: string) => JSON.stringify([{ error: { json: { message: "test error", data: { code } } } }]);
const question = () => ({ id: 1, module: "Water", question: "What is detention time?", options: ["a", "b", "c", "d"], correctIndex: 0,
  explanation: "Volume divided by flow.", isCalc: false, attemptToken: "test-only-receipt" });
const quiz = (count = 1) => ({ questions: Array.from({ length: count }, (_, index) => ({ ...question(), id: index + 1 })), locked: true, total: 100, trialLimit: 15 });
const run = (exitCode = 0) => ({ exitCode, timedOut: false, outputLimited: false, signal: null, error: null });
const report = () => ({ success: true, numTotalTests: 1, numPassedTests: 1, numFailedTests: 0, numPendingTests: 0,
  numTotalTestSuites: 1, numPassedTestSuites: 1, numFailedTestSuites: 0, numPendingTestSuites: 0,
  testResults: [{ name: "/repo/server/dailyAudit.test.ts", status: "passed", assertionResults: [{ status: "passed" }] }] });
const oit = { courseKey: "oit", track: "oit", isFreeBeta: false };
const beta = { courseKey: "electrician-309a", track: "construction-electrician", isFreeBeta: true };

describe("daily audit test isolation and full JSON evidence", () => {
  it("does not inherit database, email, API, release or Node preload credentials", () => {
    const env = isolatedTestEnv({ PATH: "/usr/bin", NODE_ENV: "production", DEPLOYMENT_ENV: "production", DATABASE_URL: "mysql://production",
      EXTERNAL_DATABASE_URL: "mysql://production", EXTERNAL_DATABASE_CA: "secret certificate", DATABASE_CUTOVER_USE_EXTERNAL_TARGET: "true",
      JWT_SECRET: "production-secret", SMTP_HOST: "production-mail", SMTP_PASS: "production-password", OPENAI_API_KEY: "production-key",
      BUILT_IN_FORGE_API_KEY: "production-forge", NODE_OPTIONS: "--require=production-preload.cjs", BUILD_COMMIT_SHA: "production-release" });
    expect(env.NODE_ENV).toBe("test"); expect(env.DEPLOYMENT_ENV).toBe("test");
    expect(env.JWT_SECRET).toContain("test-only"); expect(env.SMTP_HOST).toBe("127.0.0.1");
    expect(env.SMTP_USER).toBe("audit@echelon.test");
    for (const key of ["DATABASE_URL", "EXTERNAL_DATABASE_URL", "EXTERNAL_DATABASE_CA", "DATABASE_CUTOVER_USE_EXTERNAL_TARGET",
      "OPENAI_API_KEY", "BUILT_IN_FORGE_API_KEY", "NODE_OPTIONS", "BUILD_COMMIT_SHA"]) expect(env).not.toHaveProperty(key);
  });
  it("locates existing browsers from the caller HOME without restoring that HOME or forwarding secrets", () => {
    const parent = { PATH: "/usr/bin", HOME: "/caller-home", DATABASE_URL: "mysql://production",
      BUILT_IN_FORGE_API_KEY: "production-forge", NODE_OPTIONS: "--require=production-preload.cjs" };
    const env = isolatedBrowserTestEnv(parent, "/empty-test-home");
    expect(env).toEqual({ ...isolatedTestEnv(parent, "/empty-test-home"), PLAYWRIGHT_BROWSERS_PATH: "/caller-home/.cache/ms-playwright" });
    expect(env.HOME).toBe("/empty-test-home"); expect(env.TMPDIR).toBe("/empty-test-home");
    expect(isolatedBrowserTestEnv({}, "/empty-test-home").PLAYWRIGHT_BROWSERS_PATH).toBe("/home/ubuntu/.cache/ms-playwright");
  });
  it("forwards only an explicit browser directory to browser commands, never ordinary isolated commands", () => {
    const parent = { HOME: "/caller-home", PLAYWRIGHT_BROWSERS_PATH: "/installed browsers", SMTP_PASS: "production-password" };
    expect(isolatedBrowserTestEnv(parent, "/empty-test-home")).toEqual({
      ...isolatedTestEnv(parent, "/empty-test-home"), PLAYWRIGHT_BROWSERS_PATH: "/installed browsers",
    });
    expect(isolatedTestEnv(parent, "/empty-test-home")).not.toHaveProperty("PLAYWRIGHT_BROWSERS_PATH");
  });
  it.each(["", "0", "relative/cache", "https://example.invalid/cache", "/cache\nsecret", "/cache\u0000"])(
    "rejects an invalid explicit browser directory: %j", path => {
      expect(() => isolatedBrowserTestEnv({ PLAYWRIGHT_BROWSERS_PATH: path }, "/empty-test-home")).toThrow(/browser.*absolute.*directory/i);
    });
  it("uses the actual deterministic CI exclude list and does not exclude release tests", async () => {
    const yaml = await readFile(".github/workflows/quality.yml", "utf8");
    const excludes = ciDeterministicExcludes(yaml);
    expect(excludes).toContain("**/*.integration.test.ts");
    expect(excludes).toContain("server/_core/access.test.ts");
    expect(excludes).not.toContain("server/release.test.ts");
    expect(excludes).not.toContain("server/buildRelease.test.ts");
    expect(() => ciDeterministicExcludes("unrecognized workflow")).toThrow();
  });
  it("passes only actual executed, consistent JSON and a zero exit", () => {
    expect(evaluateVitest(run(), report()).status).toBe("pass");
    expect(evaluateVitest(run(1), report()).status).toBe("fail");
    expect(evaluateVitest(run(2), null).status).toBe("blocked");
    expect(evaluateVitest(run(), null).status).toBe("blocked");
    expect(evaluateVitest(run(), {}).status).toBe("blocked");
  });
  it("does not pass a no-tests, missing-summary or inconsistent report", () => {
    expect(evaluateVitest(run(), { ...report(), testResults: [] }).status).toBe("blocked");
    expect(evaluateVitest(run(), { ...report(), numPassedTests: 40 }).status).toBe("blocked");
    expect(evaluateVitest(run(), { ...report(), numTotalTests: 0, numPassedTests: 0, testResults: [] }).status).toBe("blocked");
    expect(evaluateVitest(run(), { ...report(), testResults: [{ status: "passed", assertionResults: [{ status: "future-status" }] }] }).status).toBe("blocked");
  });
  it("does not pass a failed suite, failed assertion, unsuccessful summary or killed command", () => {
    expect(evaluateVitest(run(), { ...report(), success: false }).status).toBe("fail");
    expect(evaluateVitest(run(), { ...report(), testResults: [{ status: "failed", assertionResults: [] }] }).status).toBe("fail");
    expect(evaluateVitest(run(), { ...report(), testResults: [{ status: "passed", assertionResults: [{ status: "failed" }] }] }).status).toBe("fail");
    expect(evaluateVitest(run(), { ...report(), numFailedTestSuites: 1 }).status).toBe("fail");
    expect(evaluateVitest(run(), { ...report(), snapshot: { failure: true } }).status).toBe("fail");
    expect(evaluateVitest({ ...run(), timedOut: true }, report()).status).toBe("blocked");
    expect(evaluateVitest({ ...run(), signal: "SIGTERM" }, report()).status).toBe("blocked");
  });
  it("keeps pending coverage visible and a passing flaky rerun a warning", () => {
    const pending = { ...report(), numTotalTests: 2, numPendingTests: 1, testResults: [{ status: "passed", assertionResults: [{ status: "passed" }, { status: "pending" }] }] };
    expect(evaluateVitest(run(), pending).status).toBe("warn");
    expect(combineTestAttempts({ status: "fail", detail: "first run failed" }, { status: "pass" }).status).toBe("warn");
  });
});

describe("daily audit live API contracts", () => {
  it("rejects unknown envelopes, non-JSON, non-success HTTP and empty quiz payloads", () => {
    for (const body of ["", "<html>Unavailable</html>", "{}", "[]", "[{}]", JSON.stringify({ questions: [question()] })]) {
      expect(validateQuizReply(200, body, { previewLimit: 15 }).status).toBe("fail");
    }
    expect(parseTrpc(500, envelope({ reply: "looks successful" })).kind).toBe("invalid");
    expect(validateQuizReply(500, envelope(quiz()), { previewLimit: 15 }).status).toBe("fail");
    expect(validateQuizReply(200, envelope({ ...quiz(), questions: [] }), { previewLimit: 15 }).status).toBe("fail");
    expect(validateQuizReply(200, envelope([question()]), { previewLimit: 15 }).status).toBe("fail");
  });
  it("validates nonempty preview shape, bounds, locked flag, totals and typed questions", () => {
    expect(validateQuizReply(200, envelope(quiz()), { previewLimit: 15 }).status).toBe("pass");
    for (const data of [quiz(16), { ...quiz(), locked: false }, { ...quiz(), trialLimit: 30 }, { ...quiz(), total: 0 },
      { ...quiz(), questions: [question(), question()] }, { ...quiz(), questions: [{ ...question(), correctIndex: 4 }] },
      { ...quiz(), questions: [{ ...question(), attemptToken: undefined }] }, { ...quiz(), questions: [{ ...question(), options: [] }] }]) {
      expect(validateQuizReply(200, envelope(data), { previewLimit: 15 }).status).toBe("fail");
    }
  });
  it("uses surface-specific imported limits, not a global fifteen-question assumption", () => {
    const data = { ...quiz(30), trialLimit: 30 };
    expect(validateQuizReply(200, envelope(data), { previewLimit: 30 }).status).toBe("pass");
    expect(validateQuizReply(200, envelope(data), { previewLimit: 15 }).status).toBe("fail");
  });
  it("exempts deliberate free 309A from the paid preview limit but not question validation", () => {
    const data = { questions: quiz(25).questions, total: 25 };
    expect(validateQuizReply(200, envelope(data), { isFreeBeta: true }).status).toBe("pass");
    expect(validateQuizReply(200, envelope({ questions: [], total: 0 }), { isFreeBeta: true }).status).toBe("fail");
    expect(validateQuizReply(200, envelope({ ...data, questions: [{ ...question(), explanation: "" }] }), { isFreeBeta: true }).status).toBe("fail");
  });
  it("checks published question structure without claiming factual correctness", () => {
    expect(validateQuestion(question())).toBeNull();
    expect(validateQuestion({ ...question(), id: 0 })).toMatch(/id/);
    expect(validateQuestion({ ...question(), correctIndex: 1.2 })).toMatch(/correctIndex/);
    expect(validateQuestion({ ...question(), options: ["a", "b", "", "d"] })).toMatch(/option/);
    expect(validateQuestion({ ...question(), steps: {} })).toMatch(/steps/);
    expect(validateQuestion({ ...question(), steps: [{ label: "Formula", content: "V / Q" }] })).toBeNull();
    expect(validateQuestion({ ...question(), steps: [{ l: "Answer without a body" }] })).toMatch(/steps/);
    expect(validateQuestion({ ...question(), steps: [null] })).toMatch(/steps/);
  });

  it("accepts losslessly rendered legacy string bodies and mixed canonical steps", () => {
    const steps = ["H = (70 psi − 30 psi) × 2.31 ft/psi", { l: "Result", c: "92.4 ft" }];
    expect(validateQuestion({ ...question(), steps })).toBeNull();
    expect(validateQuizReply(200, envelope({ ...quiz(), questions: [{ ...question(), steps }] }), { previewLimit: 15 }).status).toBe("pass");
  });

  it.each([
    [""], [" \t\n"], [42], [false], [[]], [{}], [null],
    [{ l: "Y = 0.50", c: "" }], [{ label: "Result", content: "  " }],
    [{ c: 42 }], [{ c: false }], [{ c: {} }],
    ["Valid body", { l: "Body missing" }],
  ])("still rejects every blank, malformed or bodyless step: %j", (...steps) => {
    expect(validateQuestion({ ...question(), steps })).toBe("invalid worked steps");
  });
});

describe("daily audit tutor quota evidence", () => {
  it("counts only a structured successful nonempty reply as an answer", () => {
    expect(classifyTutorReply(200, envelope({ reply: "Hint" })).kind).toBe("answered");
    for (const [status, body] of [[500, envelope({ reply: "false answer" })], [200, "malformed"], [200, envelope({})], [200, envelope({ reply: " " })],
      [503, trpcError("SERVICE_UNAVAILABLE")], [200, "TOO_MANY_REQUESTS"], [500, trpcError("TOO_MANY_REQUESTS")]] as const) {
      expect(classifyTutorReply(status, body).kind).toBe("error");
    }
    expect(classifyTutorReply(429, trpcError("TOO_MANY_REQUESTS")).kind).toBe("capped");
  });
  it("requires an actual allowance and actual cap rather than inferring a cap from errors", () => {
    const answered = { kind: "answered" }, capped = { kind: "capped" };
    expect(evaluateTutorSequence([answered, answered, answered, capped], 3).status).toBe("pass");
    expect(evaluateTutorSequence([answered, answered, answered, answered], 3).status).toBe("fail");
    const failed = evaluateTutorSequence([answered, answered, answered, { kind: "error", detail: "HTTP 500" }], 3);
    expect(failed.status).toBe("fail"); expect(failed.detail).toContain("not evidence");
    expect(evaluateTutorSequence([capped, capped, capped, capped], 3).status).toBe("warn");
    expect(evaluateTutorSequence([answered], 3).status).toBe("blocked");
  });
  it("treats anonymous OIT counts as warning candidates and excludes the free beta", () => {
    expect(tutorHistoryAssessment({ overCapIdentities: 1, worst: 7 }, [oit, beta]).status).toBe("warn");
    expect(tutorHistoryAssessment({ overCapIdentities: 1, worst: 7 }, [beta]).status).toBe("skipped");
    expect(tutorHistoryAssessment({ overCapIdentities: 0, worst: 0 }, [oit, beta]).status).toBe("pass");
  });
});

describe("daily audit subprocesses and reports", () => {
  const journeyReport = () => ({ schemaVersion: 2,
    coverage: { plannedChecks: 2, plannedCheckNames: ["Teams DOM", "Jobs DOM"], completedAllPlannedChecks: true },
    summary: { pass: 1, fail: 0, warn: 1, blocked: 0, skipped: 0 },
    results: [{ name: "Teams DOM", status: "warn", detail: "Needs validation", completed: true },
      { name: "Jobs DOM", status: "pass", detail: "Rendered", completed: true }] });
  it("caps each operation to the shared monotonic budget and reserves final-report time", () => {
    let clock = 1000;
    const budget = createAuditBudget(10_000, () => clock, 2000);
    expect(budget.timeoutMs(20_000)).toBe(8000);
    clock += 7000;
    expect(budget.timeoutMs(5000)).toBe(1000);
    expect(budget.snapshot()).toMatchObject({ elapsedMs: 7000, remainingMs: 1000, reserveMs: 2000 });
    clock += 1000;
    expect(() => budget.timeoutMs(100)).toThrow(/deadline/);
    expect(budget.remainingMs()).toBe(0);
  });
  it("writes JSON and Markdown with blocked remainder when the overall deadline is exhausted", async () => {
    const dir = await mkdtemp(join(tmpdir(), "daily-audit-deadline-report-"));
    try {
      const auditUrl = new URL("../scripts/daily-audit.mjs", import.meta.url).href;
      const code = `let calls=0;Object.defineProperty(globalThis,'performance',{value:{now:()=>calls++===0?0:100000}});
        globalThis.fetch=()=>{throw new Error('Network forbidden in offline deadline regression')};
        process.argv=['node','--max-seconds','60','--base-url','http://127.0.0.1:9','--output-dir',${JSON.stringify(dir)}];
        await import(${JSON.stringify(auditUrl)});`;
      const result = await runCommand(process.execPath, ["--input-type=module", "-e", code], {
        cwd: process.cwd(), env: isolatedTestEnv(process.env, dir), logPath: join(dir, "cli.log"), timeoutMs: 5000,
      });
      expect(result.exitCode, result.tail).toBe(2);
      const data = JSON.parse(await readFile(join(dir, "daily-audit.json"), "utf8"));
      expect(data.status).toBe("blocked");
      expect(data.allClean).toBe(false);
      expect(data.coverage.orchestrationCompleted).toBe(true);
      expect(data.coverage.completedAllPlannedChecks).toBe(false);
      expect(data.coverage.deadlineBlockedChecks).toBeGreaterThan(0);
      expect(data.budget.remainingMs).toBe(0);
      expect(await readFile(join(dir, "daily-audit.md"), "utf8")).toContain("Completed all planned checks: **false**");
    } finally { await rm(dir, { recursive: true, force: true }); }
  });
  it("accepts complete browser evidence without turning warnings into passes", () => {
    expect(validateJourneyReport(journeyReport()).map((r: { status: string }) => r.status)).toEqual(["warn", "pass"]);
  });
  it("does not accept a complete targeted subset as the requested full active-course audit", () => {
    const data = { ...journeyReport(), baseUrl: "http://offline.test",
      coverage: { ...journeyReport().coverage, scope: "full-active-route-matrix", activeCoursesInManifest: 2,
        selectedCourseCount: 2, selectedCourseKeys: ["oit", "wpi"], omittedCourseKeys: [] as string[] } };
    const expected = { baseUrl: "http://offline.test", courseKeys: ["oit", "wpi"] };
    expect(validateJourneyReport(data, expected)).toHaveLength(2);
    expect(() => validateJourneyReport(data, { ...expected, baseUrl: "http://other.test" })).toThrow(/target/);
    expect(() => validateJourneyReport(data, { ...expected, courseKeys: ["oit", "missing"] })).toThrow(/manifest/);
    data.coverage.scope = "partial";
    expect(() => validateJourneyReport(data, expected)).toThrow(/manifest/);
    data.coverage.scope = "full-active-route-matrix";
    data.coverage.omittedCourseKeys = ["missing"];
    expect(() => validateJourneyReport(data, expected)).toThrow(/manifest/);
  });
  it.each(["legacy", "missing-result", "duplicate-result", "extra-result", "cancelled", "false-coverage", "summary", "plan", "unknown-status"])(
    "rejects %s browser evidence even when the worker exits zero", (mutation) => {
      const data = journeyReport();
      switch (mutation) {
        case "legacy": data.schemaVersion = 1; break;
        case "missing-result": data.results.pop(); break;
        case "duplicate-result": data.results[1].name = data.results[0].name; break;
        case "extra-result": data.results.push({ ...data.results[0], name: "Unplanned" }); break;
        case "cancelled": data.results[1].completed = false; break;
        case "false-coverage": data.coverage.completedAllPlannedChecks = false; break;
        case "summary": data.summary.pass = 100; break;
        case "plan": data.coverage.plannedCheckNames[1] = "Missing"; break;
        case "unknown-status": data.results[1].status = "unknown"; break;
      }
      expect(() => validateJourneyReport(data)).toThrow();
    });
  it("compares the corresponding immutable identity but never calls a dirty checkout deployed", () => {
    const checkout = { head: "a".repeat(40), sourceSha256: "b".repeat(64), clean: true };
    for (const [releaseKind, release] of [["git-commit", checkout.head], ["source-sha256", checkout.sourceSha256]]) {
      const health = { status: "ok", releaseKind, release };
      expect(evaluateServingReleaseIdentity(health, checkout).status).toBe("pass");
      expect(evaluateServingReleaseIdentity(health, { ...checkout, clean: false }).status).toBe("warn");
      expect(evaluateServingReleaseIdentity({ ...health, release: "c".repeat(release.length) }, checkout).status).toBe("warn");
      expect(evaluateServingReleaseIdentity(health, null).status).toBe("blocked");
    }
    expect(evaluateServingReleaseIdentity({ status: "ok", releaseKind: "git-commit", release: "a".repeat(41) }, checkout).status).toBe("fail");
  });
  it("imports individual browser statuses and rejects malformed or empty results", () => {
    const imported = importJourneyResults({ results: [{ name: "Teams DOM", status: "warn", detail: "Needs validation", screenshot: "teams.png" }] });
    expect(imported[0]).toMatchObject({ name: "Browser: Teams DOM", status: "warn", screenshot: "teams.png" });
    for (const data of [{}, { results: [] }, { results: [{ name: "Teams", status: "skip", detail: "unknown status" }] }]) {
      expect(() => importJourneyResults(data)).toThrow();
    }
  });
  it("never calls warning, blocked or skipped coverage all clean", () => {
    expect(summarizeResults([{ status: "pass" }]).allClean).toBe(true);
    for (const status of ["warn", "blocked", "skipped", "fail"]) expect(summarizeResults([{ status: "pass" }, { status }]).allClean).toBe(false);
    expect(summarizeResults([]).allClean).toBe(false);
    expect(summarizeResults([{ status: "blocked" }]).exitCode).toBe(2);
    expect(summarizeResults([{ status: "fail" }]).exitCode).toBe(1);
  });
  it("keeps full logs with only a bounded in-memory output tail", async () => {
    const dir = await mkdtemp(join(tmpdir(), "daily-audit-log-"));
    try {
      const output = await runCommand(process.execPath, ["-e", "process.stdout.write('x'.repeat(20000))"], {
        cwd: dir, env: isolatedTestEnv(process.env, dir), logPath: join(dir, "child.log"), timeoutMs: 5000, captureBytes: 100,
      });
      expect(output.exitCode).toBe(0); expect(output.tail.length).toBe(100);
      expect((await readFile(output.logPath, "utf8")).length).toBe(20000);
    } finally { await rm(dir, { recursive: true, force: true }); }
  });
  it("bounds child time and output instead of allowing an audit to hang", async () => {
    const dir = await mkdtemp(join(tmpdir(), "daily-audit-timeout-"));
    try {
      const timed = await runCommand(process.execPath, ["-e", "setInterval(() => {}, 1000)"], {
        cwd: dir, env: isolatedTestEnv(process.env, dir), logPath: join(dir, "timeout.log"), timeoutMs: 100,
      });
      expect(timed.timedOut).toBe(true);
      const limited = await runCommand(process.execPath, ["-e", "process.stdout.write('x'.repeat(20000))"], {
        cwd: dir, env: isolatedTestEnv(process.env, dir), logPath: join(dir, "limit.log"), timeoutMs: 5000, maxOutputBytes: 1000,
      });
      expect(limited.outputLimited).toBe(true);
    } finally { await rm(dir, { recursive: true, force: true }); }
  });
  it("preserves group kill escalation after the leader exits", async () => {
    const dir = await mkdtemp(join(tmpdir(), "daily-audit-descendant-"));
    let descendant = 0;
    try {
      const childCode = "process.on('SIGTERM',()=>{});setInterval(()=>{},1000)";
      const leader = `const {spawn}=require('node:child_process');const c=spawn(process.execPath,['-e',${JSON.stringify(childCode)}],{stdio:'ignore'});console.log(c.pid);setInterval(()=>{},1000)`;
      const started = performance.now();
      const result = await runCommand(process.execPath, ["-e", leader], {
        cwd: dir, env: isolatedTestEnv(process.env, dir), logPath: join(dir, "leader.log"), timeoutMs: 400,
      });
      descendant = Number(result.tail.trim());
      expect(result.timedOut).toBe(true);
      expect(descendant).toBeGreaterThan(0);
      expect(performance.now() - started).toBeGreaterThanOrEqual(2300);
      let state = "gone";
      // SIGKILL delivery is asynchronous: allow a bounded kernel state transition,
      // not another escalation interval that would hide an early runner return.
      const stateDeadline = performance.now() + 250;
      do {
        try { state = (await readFile(`/proc/${descendant}/stat`, "utf8")).split(") ")[1].split(" ")[0]; }
        catch { state = "gone"; }
        if (["gone", "Z"].includes(state)) break;
        await new Promise(resolve => setTimeout(resolve, 10));
      } while (performance.now() < stateDeadline);
      expect(["gone", "Z"]).toContain(state);
    } finally {
      if (descendant) try { process.kill(descendant, "SIGKILL"); } catch { /* Already dead. */ }
      await rm(dir, { recursive: true, force: true });
    }
  });
  it("returns blocked evidence on log-open failure instead of hanging forever", async () => {
    const dir = await mkdtemp(join(tmpdir(), "daily-audit-log-error-"));
    try {
      const result = await runCommand(process.execPath, ["-e", "setInterval(()=>{},1000)"], {
        cwd: dir, env: isolatedTestEnv(process.env, dir), logPath: dir, timeoutMs: 1000,
      });
      expect(result.error).toMatch(/Log write failed/);
    } finally { await rm(dir, { recursive: true, force: true }); }
  });
  it("returns spawn failure as unusable command evidence", async () => {
    const dir = await mkdtemp(join(tmpdir(), "daily-audit-spawn-error-"));
    try {
      const result = await runCommand(join(dir, "does-not-exist"), [], {
        cwd: dir, env: isolatedTestEnv(process.env, dir), logPath: join(dir, "spawn.log"), timeoutMs: 1000,
      });
      expect(result.error).toMatch(/ENOENT/);
      expect(result.exitCode).not.toBe(0);
    } finally { await rm(dir, { recursive: true, force: true }); }
  });
});
