import { spawn } from "node:child_process";
import { createWriteStream } from "node:fs";
import { mkdir } from "node:fs/promises";
import { dirname, isAbsolute, resolve } from "node:path";

export const AUDIT_STATUSES = ["pass", "fail", "warn", "blocked", "skipped"];

/** Leave time for process-group cleanup and the final report; use a monotonic clock. */
export function createAuditBudget(maxMs, now = () => performance.now(), reserveMs = 5000) {
  if (!Number.isFinite(maxMs) || maxMs <= 0) throw new Error("Invalid audit deadline");
  const start = now();
  const remainingMs = () => Math.max(0, Math.floor(maxMs - (now() - start) - reserveMs));
  return {
    remainingMs,
    timeoutMs(requestedMs) {
      const remaining = remainingMs();
      if (remaining < 1) throw new Error("Overall audit deadline reached; check not executed");
      return Math.min(requestedMs, remaining);
    },
    snapshot: () => ({ maxMs, reserveMs, elapsedMs: Math.max(0, Math.round(now() - start)), remainingMs: remainingMs() }),
  };
}

/** Allowlist, not a blacklist: never forward application, database, email or API secrets. */
export function isolatedTestEnv(parent = process.env, home = "/tmp/echelon-audit-test") {
  const env = {};
  for (const key of ["PATH", "LANG", "LC_ALL", "SYSTEMROOT"]) {
    if (parent[key]) env[key] = parent[key];
  }
  return {
    ...env, HOME: home, TMPDIR: home, TZ: "UTC", CI: "1", NO_COLOR: "1",
    NODE_ENV: "test", DEPLOYMENT_ENV: "test", DOTENV_CONFIG_PATH: "/dev/null",
    JWT_SECRET: "daily-audit-test-only-not-for-production",
    STRIPE_SECRET_KEY: "sk_test_ci_placeholder", STRIPE_WEBHOOK_SECRET: "whsec_ci_placeholder",
    SMTP_HOST: "127.0.0.1", SMTP_PORT: "9", SMTP_USER: "audit@echelon.test",
    SMTP_PASS: "test-only-placeholder", APP_BASE_URL: "http://127.0.0.1:3000",
  };
}

/** Browser commands need the installed cache location, not the caller's HOME or credentials. */
export function isolatedBrowserTestEnv(parent = process.env, home = "/tmp/echelon-audit-test") {
  const browserPath = parent.PLAYWRIGHT_BROWSERS_PATH
    ?? resolve(parent.HOME ?? "/home/ubuntu", ".cache/ms-playwright");
  if (typeof browserPath !== "string" || !isAbsolute(browserPath) || /[\x00-\x1f\x7f]/.test(browserPath)) {
    throw new Error("Playwright browser cache must be an absolute directory path");
  }
  return { ...isolatedTestEnv(parent, home), PLAYWRIGHT_BROWSERS_PATH: browserPath };
}

/** Read the exact deterministic CI exclusions. Fail closed if the step changes shape. */
export function ciDeterministicExcludes(yaml) {
  const section = yaml.split("- name: Deterministic unit and acceptance tests\n")[1]?.split("\n        env:")[0];
  if (!section?.includes("pnpm exec vitest run")) throw new Error("Cannot locate CI deterministic Vitest command");
  const excludes = [...section.matchAll(/--exclude\s+(?:'([^']+)'|"([^"]+)"|(\S+))/g)]
    .map(match => match[1] ?? match[2] ?? match[3]);
  if (!excludes.includes("**/*.integration.test.ts") || excludes.length < 2) {
    throw new Error("CI deterministic exclusion list missing or unrecognized");
  }
  return [...new Set(excludes)];
}

/** Stream complete logs to disk, keep only a bounded tail in memory, and finish timeout cleanup before resolving. */
export async function runCommand(command, args, {
  cwd, env, logPath, timeoutMs = 120_000, captureBytes = 16_384, maxOutputBytes = 64 * 1024 * 1024,
}) {
  await mkdir(dirname(logPath), { recursive: true });
  const log = createWriteStream(logPath, { flags: "wx", mode: 0o600 });
  return new Promise(resolve => {
    let tail = Buffer.alloc(0), bytes = 0, timedOut = false, outputLimited = false, error = null;
    let timer, killTimer, stopping = false, childClosed = false, settled = false;
    const child = spawn(command, args, { cwd, env, stdio: ["ignore", "pipe", "pipe"], detached: true });
    const groupExists = () => {
      try { process.kill(-child.pid, 0); return true; } catch { return false; }
    };
    const finish = () => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      clearTimeout(killTimer);
      const complete = () => resolve({ exitCode: child.exitCode, signal: child.signalCode, timedOut, outputLimited, error, bytes, tail: tail.toString("utf8"), logPath });
      // A failed stream never emits finish; do not strand the audit on EEXIST,
      // ENOSPC or a write error after its child has already been cleaned up.
      if (log.destroyed) complete();
      else {
        log.once("error", complete);
        log.end(complete);
      }
    };
    const stop = () => {
      if (stopping || settled) return;
      stopping = true;
      try { process.kill(-child.pid, "SIGTERM"); } catch { /* Already closed. */ }
      killTimer = setTimeout(() => {
        try { process.kill(-child.pid, "SIGKILL"); } catch { /* Already closed. */ }
        killTimer = undefined;
        // The leader may have exited before a worker ignored SIGTERM. Do not
        // let the next audit command start while that worker is still alive.
        if (childClosed) finish();
      }, 2000);
    };
    log.on("error", err => {
      error = `Log write failed: ${err.code ?? err.message}`;
      stop();
      // A destroyed log cannot emit drain. Keep consuming child pipes while
      // terminating the group, otherwise close may wait forever on paused I/O.
      child.stdout.resume(); child.stderr.resume();
    });
    timer = setTimeout(() => { timedOut = true; stop(); }, timeoutMs);
    const collect = chunk => {
      bytes += chunk.length;
      if (bytes > maxOutputBytes) {
        if (!outputLimited) { outputLimited = true; stop(); }
        return;
      }
      // Pause both streams when disk is slower than the child, bounding the log buffer too.
      if (!log.destroyed && !log.write(chunk)) {
        child.stdout.pause(); child.stderr.pause();
        log.once("drain", () => { child.stdout.resume(); child.stderr.resume(); });
      }
      tail = Buffer.concat([tail, chunk]);
      if (tail.length > captureBytes) tail = tail.subarray(tail.length - captureBytes);
    };
    child.stdout.on("data", collect); child.stderr.on("data", collect);
    child.on("error", err => { error = `${err.code ?? "spawn"}: ${err.message}`; });
    child.on("close", (exitCode, signal) => {
      childClosed = true;
      // The leader closing does not prove its process group is empty. Preserve
      // timeout escalation for descendants that ignore SIGTERM and detach stdio.
      if (stopping && killTimer && groupExists()) return;
      finish();
    });
  });
}

export function commandProblem(run) {
  if (run.error) return run.error;
  if (run.timedOut) return "Command timed out; partial evidence only";
  if (run.outputLimited) return "Command exceeded the output safety limit; partial evidence only";
  if (run.signal) return `Command terminated by ${run.signal}`;
  return null;
}

export function evaluateVitest(run, report) {
  const problem = commandProblem(run);
  if (problem) return { status: "blocked", detail: problem };
  if (!report || typeof report !== "object" || !Array.isArray(report.testResults)
    || typeof report.success !== "boolean") {
    return { status: "blocked", detail: `No valid full Vitest JSON summary (exit ${run.exitCode})` };
  }
  const assertions = report.testResults.flatMap(suite => Array.isArray(suite.assertionResults) ? suite.assertionResults : []);
  const validStatuses = new Set(["passed", "failed", "pending", "skipped", "todo"]);
  const failedSuites = report.testResults.filter(suite => suite.status === "failed");
  const failed = assertions.filter(test => test.status === "failed").length;
  const passed = assertions.filter(test => test.status === "passed").length;
  const pending = assertions.length - passed - failed;
  if (run.exitCode !== 0 || !report.success || failed || failedSuites.length
    || report.numFailedTestSuites > 0 || report.snapshot?.failure === true) {
    return { status: "fail", detail: `Vitest exit ${run.exitCode}; ${passed} passed, ${failed} failed assertions, ${failedSuites.length} failed files`, failedFiles: failedSuites.map(suite => suite.name) };
  }
  const counters = [report.numTotalTests, report.numPassedTests, report.numFailedTests, report.numPendingTests,
    report.numTotalTestSuites, report.numPassedTestSuites, report.numFailedTestSuites, report.numPendingTestSuites];
  if (counters.some(n => !Number.isInteger(n) || n < 0) || !report.testResults.length || passed + failed === 0
    || report.numTotalTestSuites < report.testResults.length
    || report.numTotalTestSuites !== report.numPassedTestSuites + report.numFailedTestSuites + report.numPendingTestSuites
    || assertions.length !== report.numTotalTests || passed !== report.numPassedTests || failed !== report.numFailedTests
    || pending !== report.numPendingTests + (report.numTodoTests ?? 0)
    || assertions.some(test => !validStatuses.has(test.status))
    || report.testResults.some(suite => !Array.isArray(suite.assertionResults) || !["passed", "pending", "skipped"].includes(suite.status))) {
    return { status: "blocked", detail: "Empty, incomplete or inconsistent Vitest JSON report; no clean result established" };
  }
  return { status: pending ? "warn" : "pass", detail: `${passed} assertions passed; ${pending} pending/skipped/todo`, passed, pending };
}

/** For explicit targeted follow-up by the schedule agent, never silent automatic retries. */
export function combineTestAttempts(first, rerun) {
  if (["fail", "blocked"].includes(first.status) && rerun?.status === "pass") {
    return { status: "warn", detail: `Initial ${first.status}, isolated rerun passed. Flaky or incomplete evidence, not a clean run. ${first.detail}` };
  }
  return first;
}

/** Only accept the actual batched tRPC/SuperJSON envelope, never arbitrary text matches. */
export function parseTrpc(httpStatus, body) {
  let envelope;
  try { envelope = JSON.parse(body); } catch { return { kind: "invalid", detail: `HTTP ${httpStatus}: malformed JSON` }; }
  if (!Array.isArray(envelope) || envelope.length !== 1 || !envelope[0] || typeof envelope[0] !== "object") {
    return { kind: "invalid", detail: `HTTP ${httpStatus}: unknown tRPC envelope` };
  }
  const item = envelope[0];
  if (item.error) {
    const error = item.error.json;
    if (!error || typeof error.data?.code !== "string" || typeof error.message !== "string") {
      return { kind: "invalid", detail: `HTTP ${httpStatus}: unknown tRPC error shape` };
    }
    return { kind: "error", code: error.data.code, httpStatus, detail: `HTTP ${httpStatus}: tRPC ${error.data.code}` };
  }
  if (httpStatus < 200 || httpStatus >= 300) return { kind: "invalid", detail: `Non-success HTTP ${httpStatus}, not an answer` };
  if (!item.result?.data || !Object.hasOwn(item.result.data, "json")) {
    return { kind: "invalid", detail: `HTTP ${httpStatus}: missing tRPC result.data.json` };
  }
  return { kind: "success", data: item.result.data.json };
}

function substantiveLegacyStepLabel(value) {
  if (typeof value !== "string" || !value.trim()) return false;
  const words = value.trim().match(/[A-Za-z0-9]+/g) ?? [];
  return words.length >= 4 && /[0-9=+×÷/]/.test(value);
}

export function validateQuestion(question) {
  if (!question || typeof question !== "object") return "not an object";
  if (!Number.isInteger(question.id) || question.id <= 0) return "invalid bank-scoped question id";
  for (const field of ["module", "question", "explanation"]) {
    if (typeof question[field] !== "string" || !question[field].trim()) return `empty ${field}`;
  }
  if (!Array.isArray(question.options) || question.options.length !== 4
    || question.options.some(option => typeof option !== "string" || !option.trim())) return "invalid four-option structure";
  if (!Number.isInteger(question.correctIndex) || question.correctIndex < 0 || question.correctIndex >= question.options.length) return "invalid correctIndex";
  // Match StepSolution's lossless string-body support. A legacy label is only a body when it contains a substantive calculation.
  if (question.steps != null && (!Array.isArray(question.steps) || question.steps.some(step => typeof step === "string" ? !step.trim() : !step
    || typeof step !== "object" || Array.isArray(step)
    || !((typeof step.c === "string" && step.c.trim()) || (typeof step.content === "string" && step.content.trim()) || substantiveLegacyStepLabel(step.l))))) return "invalid worked steps";
  return null;
}

export function validateQuizReply(httpStatus, body, { previewLimit, isFreeBeta = false }) {
  const parsed = parseTrpc(httpStatus, body);
  if (parsed.kind !== "success") return { status: "fail", detail: parsed.detail };
  const data = parsed.data;
  if (!data || !Array.isArray(data.questions) || !Number.isInteger(data.total)
    || data.total <= 0 || data.total < data.questions.length || data.questions.length === 0) {
    return { status: "fail", detail: "Missing, empty or inconsistent question payload" };
  }
  if (!isFreeBeta && (data.locked !== true || data.trialLimit !== previewLimit || data.questions.length > previewLimit)) {
    return { status: "fail", detail: `Preview contract mismatch: locked=${data.locked}, trialLimit=${data.trialLimit}, received=${data.questions.length}, expected bound=${previewLimit}` };
  }
  const ids = new Set();
  for (const question of data.questions) {
    const problem = validateQuestion(question);
    if (problem) return { status: "fail", detail: `Invalid served question structure: ${problem}` };
    if (ids.has(question.id)) return { status: "fail", detail: "Duplicate question ids in response" };
    ids.add(question.id);
    if (typeof question.isCalc !== "boolean" || typeof question.attemptToken !== "string" || !question.attemptToken) {
      return { status: "fail", detail: "Missing typed calculation flag or issued practice receipt" };
    }
  }
  return { status: "pass", detail: `${data.questions.length} valid questions; published total ${data.total}${isFreeBeta ? "; deliberate free beta, no paid preview cap asserted" : `; locked preview bound ${previewLimit}`}` };
}

export function classifyTutorReply(httpStatus, body) {
  const parsed = parseTrpc(httpStatus, body);
  if (parsed.kind === "error" && parsed.code === "TOO_MANY_REQUESTS" && httpStatus === 429) return { kind: "capped" };
  if (parsed.kind !== "success") return { kind: "error", detail: parsed.detail };
  if (typeof parsed.data?.reply !== "string" || !parsed.data.reply.trim()) return { kind: "error", detail: "Missing or empty tutor reply" };
  return { kind: "answered" };
}

export function evaluateTutorSequence(replies, limit) {
  if (replies.length !== limit + 1) return { status: "blocked", detail: "Incomplete tutor quota sequence" };
  const errors = replies.filter(reply => reply.kind === "error");
  if (errors.length) return { status: "fail", detail: `Tutor response failure, not evidence of an answered over-cap message: ${errors.map(reply => reply.detail).join("; ")}` };
  if (replies.slice(0, limit).some(reply => reply.kind !== "answered")) {
    return { status: "warn", detail: "Quota reached before the expected fresh allowance. Identity freshness or pre-existing usage cannot be established." };
  }
  if (replies[limit].kind === "answered") return { status: "fail", detail: `Observed ${limit + 1} successful replies in the same probe sequence against an expected ${limit}-reply allowance. Identity continuity and root cause require validation.` };
  if (replies[limit].kind !== "capped") return { status: "blocked", detail: "Unknown final tutor outcome" };
  return { status: "pass", detail: `${limit} successful replies followed by a structured TOO_MANY_REQUESTS response; no proxy or identity root cause inferred` };
}

/** Analytics is only a candidate detector: anonymous does not establish unpaid entitlement. */
export function tutorHistoryAssessment({ overCapIdentities, worst }, courses) {
  const eligible = courses.filter(course => course.track === "oit" && !course.isFreeBeta);
  if (!eligible.length) return { status: "skipped", detail: "No active unpaid-OIT-preview courses in registry" };
  if (Number(overCapIdentities) > 0) return { status: "warn", detail: `${overCapIdentities} anonymous OIT candidate identities over the preview cap in the UTC day (maximum ${worst}). Historical tests and paid anonymous entitlement cannot be ruled out. Not a proven defect; beta courses excluded.` };
  return { status: "pass", detail: "No anonymous OIT over-cap candidates in the UTC-day snapshot; beta excluded. This does not prove entitlement or live enforcement." };
}

export function importJourneyResults(report) {
  if (!report || !Array.isArray(report.results) || !report.results.length) throw new Error("Browser runner produced no structured results");
  return report.results.map(result => {
    if (!result || typeof result.name !== "string" || !result.name.trim()
      || !AUDIT_STATUSES.includes(result.status) || typeof result.detail !== "string") throw new Error("Invalid browser result name/status/detail");
    return { ...result, name: `Browser: ${result.name}` };
  });
}

/**
 * Accept browser evidence only when it proves every planned check reached a
 * terminal result. A zero process exit plus one passing result is not a clean
 * browser run if the worker was cut off before the rest of its plan.
 */
export function validateJourneyReport(report, expected = {}) {
  if (!report || report.schemaVersion !== 2 || !report.coverage || typeof report.coverage !== "object") {
    throw new Error("Browser runner report has an unsupported or missing completeness schema");
  }
  const coverage = report.coverage;
  if (expected.baseUrl && report.baseUrl !== expected.baseUrl) {
    throw new Error("Browser runner report target does not match the requested origin");
  }
  if (expected.courseKeys) {
    const keys = coverage.selectedCourseKeys;
    if (coverage.scope !== "full-active-route-matrix"
      || coverage.activeCoursesInManifest !== expected.courseKeys.length
      || coverage.selectedCourseCount !== expected.courseKeys.length
      || !Array.isArray(keys) || keys.length !== expected.courseKeys.length
      || new Set(keys).size !== keys.length
      || keys.some(key => !expected.courseKeys.includes(key))
      || !Array.isArray(coverage.omittedCourseKeys) || coverage.omittedCourseKeys.length) {
      throw new Error("Browser runner did not cover the requested active-course manifest");
    }
  }
  if (!Number.isSafeInteger(coverage.plannedChecks) || coverage.plannedChecks < 1
    || !Array.isArray(coverage.plannedCheckNames)
    || coverage.plannedCheckNames.length !== coverage.plannedChecks
    || coverage.plannedCheckNames.some(name => typeof name !== "string" || !name.trim())
    || new Set(coverage.plannedCheckNames).size !== coverage.plannedChecks
    || coverage.completedAllPlannedChecks !== true) {
    throw new Error("Browser runner did not establish complete planned-check coverage");
  }
  const imported = importJourneyResults(report);
  const actualNames = report.results.map(result => result?.name);
  if (actualNames.length !== coverage.plannedChecks
    || new Set(actualNames).size !== actualNames.length
    || actualNames.some(name => typeof name !== "string")
    || [...actualNames].sort().join("\0") !== [...coverage.plannedCheckNames].sort().join("\0")
    || report.results.some(result => result.completed !== true)) {
    throw new Error("Browser runner report is missing, duplicating, or leaving planned checks incomplete");
  }
  if (!report.summary || typeof report.summary !== "object") {
    throw new Error("Browser runner report has no status summary");
  }
  for (const status of AUDIT_STATUSES) {
    const actual = report.results.filter(result => result.status === status).length;
    if (report.summary[status] !== actual) {
      throw new Error("Browser runner status summary does not match individual results");
    }
  }
  return imported;
}

function validRelease(releaseKind, release) {
  return releaseKind === "git-commit"
    ? /^(?:[a-f0-9]{40}|[a-f0-9]{64})$/i.test(release ?? "")
    : releaseKind === "source-sha256" && /^[a-f0-9]{64}$/i.test(release ?? "");
}

/** Compare the public immutable serving marker to both checkout identities. */
export function evaluateServingReleaseIdentity(health, checkout) {
  if (!health || health.status !== "ok" || !validRelease(health.releaseKind, health.release)) {
    return { status: "fail", detail: "Production health did not expose a valid immutable serving identity" };
  }
  if (!checkout || !/^(?:[a-f0-9]{40}|[a-f0-9]{64})$/i.test(checkout.head ?? "")
    || !/^[a-f0-9]{64}$/i.test(checkout.sourceSha256 ?? "")) {
    return { status: "blocked", detail: "Checkout commit and functional-source identities were not both established" };
  }
  const expected = health.releaseKind === "git-commit" ? checkout.head : checkout.sourceSha256;
  if (health.release.toLowerCase() !== expected.toLowerCase()) {
    return { status: "warn", detail: `${health.releaseKind}: ${health.release}. Observed serving identity differs from this checkout's expected ${expected}; local checkout is not deployment evidence.` };
  }
  if (checkout.clean !== true) {
    return { status: "warn", detail: `${health.releaseKind}: ${health.release}. Marker matches, but the checkout has uncommitted changes; this does not establish deployment of local changes.` };
  }
  return { status: "pass", detail: `${health.releaseKind}: ${health.release}. Observed serving identity matches this clean checkout's corresponding immutable identity.` };
}

export function summarizeResults(results) {
  const counts = Object.fromEntries(AUDIT_STATUSES.map(status => [status, results.filter(result => result.status === status).length]));
  const allClean = results.length > 0 && results.every(result => result.status === "pass");
  return { counts, allClean, status: counts.fail ? "fail" : counts.blocked ? "blocked" : allClean ? "pass" : "warn",
    exitCode: counts.fail ? 1 : counts.blocked ? 2 : 0 };
}
