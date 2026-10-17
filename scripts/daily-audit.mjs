#!/usr/bin/env node
/**
 * Daily product audit. Evidence only, not an automatic owner notification.
 * The schedule agent validates failures before making defect claims or repairs.
 * Usage: node scripts/daily-audit.mjs [--skip-unit] [--skip-types] [--skip-browser]
 *        [--probe-tutor] [--max-seconds 3300] [--base-url https://echeloninstitute.ca] [--output-dir /absolute/path]
 * Exit: 1 observed failures, 2 blocked coverage, 0 otherwise. Always read allClean
 * and individual statuses: skipped or warning coverage is never an all-clean audit.
 */
import { randomUUID } from "node:crypto";
import { mkdir, readFile, writeFile, stat } from "node:fs/promises";
import { resolve, dirname, isAbsolute, relative } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { parseArgs } from "node:util";
import mysql from "mysql2/promise";
import { activeScriptConnection } from "./lib/activeScriptConnection.mjs";
import {
  isolatedTestEnv, ciDeterministicExcludes, runCommand, commandProblem, evaluateVitest, createAuditBudget,
  validateQuizReply, validateQuestion, classifyTutorReply, evaluateTutorSequence,
  tutorHistoryAssessment, validateJourneyReport, evaluateServingReleaseIdentity, summarizeResults,
} from "./lib/dailyAudit.mjs";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const { values } = parseArgs({ options: {
  "skip-unit": { type: "boolean", default: false }, "skip-types": { type: "boolean", default: false },
  "skip-browser": { type: "boolean", default: false }, "probe-tutor": { type: "boolean", default: false },
  "base-url": { type: "string", default: "https://echeloninstitute.ca" }, "output-dir": { type: "string" },
  "max-seconds": { type: "string", default: "3300" },
} });
const maxSeconds = Number(values["max-seconds"]);
if (!Number.isInteger(maxSeconds) || maxSeconds < 60 || maxSeconds > 3600) {
  throw new Error("--max-seconds must be an integer between 60 and 3600");
}
const budget = createAuditBudget(maxSeconds * 1000);
const base = new URL(values["base-url"]);
if (!["https:", "http:"].includes(base.protocol) || base.username || base.password || base.pathname !== "/" || base.search || base.hash) {
  throw new Error("--base-url must be an HTTP(S) origin without credentials, path or query");
}
const SITE = base.origin;
const startedAt = new Date().toISOString();
const runId = `${startedAt.replace(/[:.]/g, "-")}-${randomUUID().slice(0, 8)}`;
const outputDir = resolve(values["output-dir"] ?? `/home/ubuntu/reviews/daily-audit/${runId}`);
const withinRepo = relative(ROOT, outputDir);
if (withinRepo === "" || (!withinRepo.startsWith("..") && !isAbsolute(withinRepo))) {
  throw new Error("Audit artifacts must be outside the repository");
}
await mkdir(outputDir, { recursive: true, mode: 0o700 });
const testHome = resolve(outputDir, "isolated-home");
await mkdir(testHome, { recursive: true, mode: 0o700 });
const childEnv = isolatedTestEnv(process.env, testHome);
const userAgent = `EchelonProductAudit/${runId}`;
const results = [];
let db = null, databaseUnavailable = null, manifest = null, checkoutIdentity = null;
let deadlineBlockedChecks = 0, orchestrationCompleted = false;

// Never persist production connection strings or application secrets in a report.
function safeDetail(value) {
  let text = String(value);
  for (const [key, secret] of Object.entries(process.env)) {
    if (secret && secret.length >= 8 && /SECRET|PASSWORD|_PASS$|API_KEY|TOKEN|DATABASE_URL|DATABASE_CA/.test(key)) text = text.split(secret).join("[redacted]");
  }
  return text.replace(/mysql:\/\/[^\s]+/g, "mysql://[redacted]").slice(0, 1800);
}
function record(name, status, detail, evidence = {}) {
  const result = { name, status, detail: safeDetail(detail), ...evidence };
  results.push(result);
  console.log(`[${status.toUpperCase()}] ${name}: ${result.detail.slice(0, 250)}`);
  return result;
}
async function check(name, fn, errorStatus = "blocked") {
  if (budget.remainingMs() < 1) {
    deadlineBlockedChecks++;
    return record(name, "blocked", "Overall audit deadline reached; check not executed", { completed: false });
  }
  try {
    const result = await fn();
    return record(name, result.status ?? "pass", result.detail, result.evidence);
  } catch (error) { return record(name, errorStatus, safeDetail(error.message ?? error)); }
}
async function readJson(path, maxBytes = 32 * 1024 * 1024) {
  if ((await stat(path)).size > maxBytes) throw new Error("JSON artifact exceeds safety limit");
  return JSON.parse(await readFile(path, "utf8"));
}
async function command(name, program, args, timeoutMs) {
  return runCommand(program, args, { cwd: ROOT, env: childEnv, logPath: resolve(outputDir, `${name}.log`), timeoutMs: budget.timeoutMs(timeoutMs) });
}
async function fetchEvidence(name, path, options = {}, timeoutMs = 30_000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), budget.timeoutMs(timeoutMs));
  try {
    const response = await fetch(SITE + path, {
      ...options, headers: { "user-agent": userAgent, ...options.headers }, signal: controller.signal, redirect: "error",
    });
    const reader = response.body?.getReader();
    const chunks = []; let bytes = 0;
    if (reader) while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      bytes += value.length;
      if (bytes > 8 * 1024 * 1024) { await reader.cancel(); throw new Error("HTTP body exceeded 8 MiB safety limit"); }
      chunks.push(Buffer.from(value));
    }
    const body = Buffer.concat(chunks).toString("utf8");
    const evidence = resolve(outputDir, `${name}.http.json`);
    await writeFile(evidence, JSON.stringify({ status: response.status, contentType: response.headers.get("content-type"), body }), { mode: 0o600 });
    return { status: response.status, body, evidence };
  } finally { clearTimeout(timer); }
}
function trpcQuery(procedure, input) {
  return `/api/trpc/${procedure}?batch=1&input=${encodeURIComponent(JSON.stringify({ 0: { json: input } }))}`;
}
async function query(sql, params = []) {
  if (!db) throw new Error(databaseUnavailable ?? "Authoritative read-only database unavailable");
  try { return (await db.query({ sql, timeout: budget.timeoutMs(25_000) }, params))[0]; }
  catch (error) {
    // A timed-out mysql query cannot be safely reused. Close rather than leave work running.
    if (error.code === "PROTOCOL_SEQUENCE_TIMEOUT") {
      db.destroy(); db = null; databaseUnavailable = "Database query timed out; connection destroyed";
    }
    throw error;
  }
}

console.log(`Daily product audit ${runId}. Evidence: ${outputDir}`);
try {
  await check("Checkout identity", async () => {
    const head = await command("git-head", "git", ["rev-parse", "HEAD"], 10_000);
    const state = await command("git-status", "git", ["status", "--short"], 10_000);
    const source = await command("checkout-source-fingerprint", "node", ["--import", "tsx", "--input-type=module", "-e",
      "import { computeSourceFingerprint } from './scripts/sourceFingerprint.ts'; console.log(computeSourceFingerprint());"], 60_000);
    const commit = head.tail.trim();
    const sourceSha256 = source.tail.trim();
    if (commandProblem(head) || commandProblem(state) || commandProblem(source) || head.exitCode !== 0 || state.exitCode !== 0 || source.exitCode !== 0
      || !/^(?:[a-f0-9]{40}|[a-f0-9]{64})$/i.test(commit) || !/^[a-f0-9]{64}$/i.test(sourceSha256)) {
      throw new Error("Cannot establish checkout commit and functional-source identities; see checkout identity logs");
    }
    const clean = !state.tail.trim();
    checkoutIdentity = { head: commit, sourceSha256, clean };
    return { status: clean ? "pass" : "warn", detail: `HEAD ${commit}; source-sha256 ${sourceSha256}; ${clean ? "working tree clean" : "working tree has changes, see git-status.log"}`,
      evidence: { headLog: head.logPath, statusLog: state.logPath, sourceFingerprintLog: source.logPath } };
  });

  await check("Actual registry and preview policy", async () => {
    // Import real functions in a sanitized tsx subprocess. No regex extraction of TypeScript.
    const code = `
      import { writeFileSync } from "node:fs";
      import { getAllCourses } from "./shared/courseRegistry.ts";
      import { FREE_EXAM_TYPES } from "./server/_core/access.ts";
      import { previewLimitForRequest } from "./server/routers/quizRouter.ts";
      import { AI_TUTOR_FREE_PREVIEW_MESSAGE_LIMIT } from "./server/_core/aiTutorPolicy.ts";
      import { learnerVisibleQuestionFilter } from "./server/questionGovernance.ts";
      import { ELECTRICIAN_309A_PROGRAM_KEY } from "./shared/certificationPrograms.ts";
      import { MySqlDialect } from "drizzle-orm/mysql-core";
      const courses = getAllCourses().filter(c => c.isActive).map(c => ({ ...c,
        isFreeBeta: FREE_EXAM_TYPES.has(c.courseKey),
        previewLimits: Object.fromEntries(["practice", "flashcards", "mock"].map(surface =>
          [surface, previewLimitForRequest({ bankKey: c.questionBankKey, previewSurface: surface })])) }));
      const visibility = new MySqlDialect().sqlToQuery(learnerVisibleQuestionFilter());
      writeFileSync(process.argv[1], JSON.stringify({ courses, visibility,
        tutorPreviewLimit: AI_TUTOR_FREE_PREVIEW_MESSAGE_LIMIT, electricianProgramKey: ELECTRICIAN_309A_PROGRAM_KEY }), { mode: 0o600 });
    `;
    const run = await command("registry", "node", ["--import", "tsx", "--input-type=module", "-e", code, resolve(outputDir, "registry.json")], 60_000);
    if (commandProblem(run) || run.exitCode !== 0) throw new Error("Actual registry/policy import failed; see registry.log");
    manifest = await readJson(resolve(outputDir, "registry.json"));
    if (!Array.isArray(manifest.courses) || !manifest.courses.length || !manifest.visibility?.sql
      || !Array.isArray(manifest.visibility.params) || !Number.isInteger(manifest.tutorPreviewLimit) || manifest.tutorPreviewLimit < 1 || manifest.tutorPreviewLimit > 10) throw new Error("Registry/policy manifest malformed");
    // Browser runner receives a JSON manifest file, retaining every actual route and bank field.
    await writeFile(resolve(outputDir, "courses.json"), JSON.stringify(manifest.courses, null, 2), { mode: 0o600 });
    return { detail: `${manifest.courses.length} active courses imported, including ${manifest.courses.filter(c => c.isFreeBeta).length} deliberate free beta; preview bounds and visibility filter imported from application` };
  });

  if (values["skip-unit"]) record("Deterministic unit and acceptance tests", "skipped", "Explicit --skip-unit. No unit coverage established.");
  else await check("Deterministic unit and acceptance tests", async () => {
    const excludes = ciDeterministicExcludes(await readFile(resolve(ROOT, ".github/workflows/quality.yml"), "utf8"));
    await writeFile(resolve(outputDir, "unit-exclusions.json"), JSON.stringify(excludes, null, 2), { mode: 0o600 });
    const reportPath = resolve(outputDir, "vitest.json");
    // Vite can load .env.local even after process.env is sanitized. Disable that
    // path too, using an untracked wrapper around the real repository config.
    const configPath = resolve(outputDir, "isolated-vitest.config.mjs");
    await writeFile(configPath, `import base from ${JSON.stringify(pathToFileURL(resolve(ROOT, "vitest.config.ts")).href)};\nexport default { ...base, envFile: false, envDir: ${JSON.stringify(testHome)} };\n`, { mode: 0o600 });
    const args = ["--import", "tsx", resolve(ROOT, "node_modules/vitest/vitest.mjs"), "run", "--config", configPath, "--maxWorkers", "2", "--minWorkers", "1", ...excludes.flatMap(pattern => ["--exclude", pattern]),
      "--reporter=json", `--outputFile=${reportPath}`];
    const run = await command("unit", "node", args, 12 * 60_000);
    let report = null;
    try { report = await readJson(reportPath); } catch { /* Evaluator reports missing/malformed evidence. */ }
    const evaluated = evaluateVitest(run, report);
    record("Database-backed integration coverage", "skipped", `${excludes.length} CI exclusion patterns, plus any pending specs in vitest.json. Requires disposable CI MySQL. No production database or credentials supplied to tests.`, { artifact: resolve(outputDir, "unit-exclusions.json") });
    // Explicit existing regression guards, not table-name counts masquerading as reconciliation.
    for (const file of ["server/revenueCompleteness.test.ts", "server/aiTutorPolicy.test.ts", "server/courseRegistry.test.ts"]) {
      const suite = report?.testResults?.find(suite => suite.name?.endsWith(`/${file}`));
      const assertions = suite?.assertionResults;
      record(`Regression guard: ${file}`, suite?.status === "failed" ? "fail"
        : !suite || !Array.isArray(assertions) || !assertions.length ? "blocked"
          : assertions.some(test => test.status === "failed") ? "fail"
            : assertions.every(test => test.status === "passed") ? "pass" : "warn",
      suite ? `${assertions?.length ?? 0} reported assertions, file status ${suite.status}; structural regression coverage only` : "No verified file result in Vitest JSON");
    }
    return { ...evaluated, evidence: { artifact: reportPath, log: run.logPath, exitCode: run.exitCode } };
  });
  record("Live ledger reconciliation", "skipped", "Not performed. Existing revenueCompleteness regression tests check reporting-source inclusion and deduplication, not Stripe-to-database ledger reconciliation.");

  if (values["skip-types"]) record("TypeScript", "skipped", "Explicit --skip-types. No type coverage established.");
  else await check("TypeScript", async () => {
    const run = await command("types", "pnpm", ["check"], 4 * 60_000);
    return { status: commandProblem(run) ? "blocked" : run.exitCode === 0 ? "pass" : "fail",
      detail: commandProblem(run) ?? `pnpm check exit ${run.exitCode}; includes application and scripts projects`, evidence: { log: run.logPath } };
  });

  await check("Authoritative database read-only session", async () => {
    const active = activeScriptConnection({ ...process.env, DATABASE_CUTOVER_USE_EXTERNAL_TARGET: "true" });
    if (!active.external) throw new Error("Refusing non-authoritative database");
    db = await mysql.createConnection({ ...active.options, connectTimeout: budget.timeoutMs(10_000) });
    // No writes, schema changes or sessions with production testing credentials.
    await query("SET SESSION time_zone = '+00:00'");
    await query("SET SESSION TRANSACTION READ ONLY");
    await query("SET SESSION MAX_EXECUTION_TIME=20000");
    await query("START TRANSACTION READ ONLY");
    const [row] = await query("SELECT @@session.transaction_read_only AS readOnly, @@session.time_zone AS timezone, DATABASE() AS selectedDatabase");
    if (Number(row.readOnly) !== 1 || row.timezone !== "+00:00" || row.selectedDatabase !== process.env.DATABASE_CUTOVER_TARGET_DATABASE) throw new Error("Read-only session, UTC or authoritative schema verification failed");
    return { detail: "Authoritative external target selected via activeScriptConnection; verified read-only session and transaction, certificate-verified TLS and UTC" };
  }).then(result => {
    if (result.status !== "pass") {
      databaseUnavailable = result.detail;
      if (db) db.destroy();
      db = null;
    }
  });

  if (!manifest) record("Published question bank structure", "blocked", "Registry import unavailable; cannot infer active banks or publication rules.");
  else for (const course of manifest.courses) {
    await check(`Published bank: ${course.courseKey}`, async () => {
      let total = 0, invalid = 0, lastId = 0;
      const samples = [];
      const beta = course.isFreeBeta;
      if (beta && course.courseKey !== "electrician-309a") return { status: "blocked", detail: "No verified publication query for this newly free course" };
      // Same publication boundary as electricianReview.get309ABetaPractice, including commercial/team flags.
      let betaId = null;
      if (beta) {
        const banks = await query(`SELECT id FROM certification_bank_versions WHERE programKey=? AND bankKey=?
          AND releaseChannel='beta' AND active=1 AND commercialEligibility=0 AND teamEligibility=0 LIMIT 2`,
        [manifest.electricianProgramKey, course.questionBankKey]);
        if (banks.length !== 1) return { status: "fail", detail: `Expected one eligible active beta version, found ${banks.length}` };
        betaId = banks[0].id;
      }
      // Keyset paging bounds memory while validating every learner-visible row, not draft rows.
      while (true) {
        const rows = beta
          ? await query(`SELECT id AS rowId, bankItemNumber AS id, module, question, options, correctIndex, explanation, steps
              FROM certification_questions WHERE bankVersionId=? AND contentStatus='beta_approved' AND publicEligibility=1 AND id>? ORDER BY id LIMIT 500`, [betaId, lastId])
          : await query(`SELECT id AS rowId, questionNum AS id, module, question, options, correctIndex, explanation, steps
              FROM questions WHERE bankKey=? AND (${manifest.visibility.sql}) AND id>? ORDER BY id LIMIT 500`,
            [course.questionBankKey, ...manifest.visibility.params, lastId]);
        if (!rows.length) break;
        for (const row of rows) {
          total++;
          let problem;
          try { problem = validateQuestion({ ...row, options: JSON.parse(row.options), steps: row.steps ? JSON.parse(row.steps) : undefined }); }
          catch { problem = "malformed options or worked-steps JSON"; }
          if (problem) { invalid++; if (samples.length < 5) samples.push(`question ${row.id}: ${problem}`); }
        }
        const nextId = Number(rows.at(-1).rowId);
        if (nextId <= lastId || total > 100_000) throw new Error("Question pagination safety limit exceeded");
        lastId = nextId;
      }
      return { status: total === 0 || invalid > 0 ? "fail" : "pass", detail: `${total} learner-visible rows; ${invalid} structural defects${samples.length ? ` (${samples.join("; ")})` : ""}. Checks structure only, not factual or regulatory accuracy.` };
    });
  }

  // Take a UTC-day snapshot BEFORE any optional tutor writes. No global max-id
  // heuristic and no claim that an unknown hash belongs to a real unpaid visitor.
  await check("Production OIT tutor quota candidates (UTC, pre-probe)", async () => {
    if (!manifest) throw new Error("No actual course policy manifest");
    const courses = manifest.courses.filter(course => course.track === "oit" && !course.isFreeBeta);
    if (!courses.length) return tutorHistoryAssessment({ overCapIdentities: 0, worst: 0 }, manifest.courses);
    const placeholders = courses.map(() => "?").join(",");
    const [row] = await query(`SELECT COUNT(*) AS overCapIdentities, COALESCE(MAX(n),0) AS worst FROM (
      SELECT COUNT(*) AS n FROM product_analytics_events
      WHERE eventName='ai_tutor_message' AND anonymousHash IS NOT NULL AND emailHash IS NULL AND userId IS NULL
        AND examType IN (${placeholders}) AND occurredAt>=UTC_DATE() AND occurredAt<UTC_DATE()+INTERVAL 1 DAY
      GROUP BY anonymousHash HAVING COUNT(*)>?
    ) AS candidates`, [...courses.map(course => course.courseKey), manifest.tutorPreviewLimit]);
    return tutorHistoryAssessment(row, manifest.courses);
  });

  await check("Product funnel event observations (7 UTC days)", async () => {
    const rows = await query(`SELECT eventName, COUNT(*) AS n FROM product_analytics_events
      WHERE occurredAt>=UTC_TIMESTAMP()-INTERVAL 7 DAY
        AND eventName IN ('preview_plan_offered','preview_plan_requested','otp_verified','checkout_started','checkout_completed')
      GROUP BY eventName ORDER BY eventName`);
    return { status: "warn", detail: `${rows.map(row => `${row.eventName}=${row.n}`).join(", ") || "No selected events"}. Activity only: OTP is authentication and checkout is intent, neither is a lead. Counts do not establish capture health, customer identity or delivery.` };
  });
  // Roll back the entire read-only snapshot before optional live mutation probes.
  if (db) {
    try { await query("ROLLBACK"); await db.end(); }
    catch { db?.destroy(); }
    db = null;
  }

  for (const path of ["/", "/pricing", "/quiz", "/teams"]) {
    await check(`HTTP route: ${path}`, async () => {
      const response = await fetchEvidence(`route-${path.replaceAll("/", "_") || "home"}`, path);
      return { status: response.status === 200 && response.body.trim() ? "pass" : "fail",
        detail: `HTTP ${response.status}; ${Buffer.byteLength(response.body)} response bytes. Transport only, not rendered DOM.`, evidence: { artifact: response.evidence } };
    });
  }

  await check("Serving deployment identity", async () => {
    const response = await fetchEvidence("serving-release", "/api/health");
    let health;
    try { health = JSON.parse(response.body); } catch { throw new Error("Production health response was not valid JSON"); }
    const evaluated = response.status === 200
      ? evaluateServingReleaseIdentity(health, checkoutIdentity)
      : { status: "fail", detail: `Production health returned HTTP ${response.status}` };
    return { ...evaluated, evidence: { artifact: response.evidence } };
  });

  if (!manifest) record("Live question samples", "blocked", "No registry or preview policy. Not substituting a guessed course list.");
  else for (const course of manifest.courses) {
    const beta = course.isFreeBeta;
    const surfaces = !beta && course.track === "oit" ? ["practice", "flashcards", "mock"] : ["practice"];
    for (const surface of surfaces) await check(`Live ${beta ? "free beta" : "paid preview"}: ${course.courseKey}/${surface}`, async () => {
      if (beta && course.courseKey !== "electrician-309a") return { status: "blocked", detail: "No verified beta delivery endpoint for this course" };
      const response = await fetchEvidence(`quiz-${course.courseKey}-${surface}`, beta
        ? trpcQuery("electricianReview.get309ABetaPractice", {})
        : trpcQuery("quiz.getQuestions", { bankKey: course.questionBankKey, previewSurface: surface }));
      const validation = validateQuizReply(response.status, response.body, { previewLimit: course.previewLimits[surface], isFreeBeta: beta });
      return { ...validation, evidence: { artifact: response.evidence } };
    });
  }

  if (!values["probe-tutor"]) record("Live tutor quota probe", "skipped", "Opt-in --probe-tutor only. Default audit does not spend tutor tokens or create tutor analytics events.");
  else await check("Live tutor quota probe", async () => {
    if (!manifest) throw new Error("No actual registry or tutor policy");
    const course = manifest.courses.find(course => course.track === "oit" && !course.isFreeBeta);
    if (!course) return { status: "skipped", detail: "No eligible OIT preview course" };
    const replies = [];
    for (let index = 0; index <= manifest.tutorPreviewLimit; index++) {
      const response = await fetchEvidence(`tutor-${index + 1}`, "/api/trpc/tutor.chat?batch=1", {
        method: "POST", headers: { "content-type": "application/json" },
        body: JSON.stringify({ 0: { json: { examType: course.courseKey, messages: [{ role: "user", content: "What does detention time mean in water treatment? Give one short study hint." }] } } }),
      }, 70_000);
      replies.push(classifyTutorReply(response.status, response.body));
    }
    await writeFile(resolve(outputDir, "tutor-probe.json"), JSON.stringify({ userAgent, courseKey: course.courseKey, replies,
      note: "Unique user-agent supplied. Server-derived IP identity is not observable, so no exact event attribution, traffic exclusion or proxy root cause is claimed." }, null, 2), { mode: 0o600 });
    return { ...evaluateTutorSequence(replies, manifest.tutorPreviewLimit), evidence: { artifact: resolve(outputDir, "tutor-probe.json") } };
  });

  if (values["skip-browser"]) record("Rendered product journeys", "skipped", "Explicit --skip-browser. HTTP route checks are not DOM, mobile, Teams-content or interaction coverage.");
  else if (!manifest) record("Rendered product journeys", "blocked", "Cannot run without the real course manifest");
  else await check("Rendered product journey runner", async () => {
    const detectors = await command("browser-detectors", "python3", ["-B", "scripts/product-journeys.test.py"], 30_000);
    if (commandProblem(detectors) || detectors.exitCode !== 0) {
      return { status: "blocked", detail: "Offline browser detector regression tests did not pass; see browser-detectors.log" };
    }
    const browserDir = resolve(outputDir, "browser");
    await mkdir(browserDir, { recursive: true, mode: 0o700 });
    const browserTimeoutMs = budget.timeoutMs(16 * 60_000);
    // The Python deadline must leave room for screenshots/context shutdown and
    // process-group escalation before the parent's remaining budget expires.
    const browserSeconds = Math.min(840, Math.floor((browserTimeoutMs - 30_000) / 1000));
    if (browserSeconds < 1) throw new Error("Insufficient audit budget for browser checks and cleanup");
    const run = await runCommand("python3", ["-B", "scripts/product-journeys.py", "--base-url", SITE,
      "--courses", resolve(outputDir, "courses.json"), "--output-dir", browserDir, "--max-seconds", String(browserSeconds)], {
      cwd: ROOT, env: { ...childEnv, PLAYWRIGHT_BROWSERS_PATH: process.env.PLAYWRIGHT_BROWSERS_PATH
        ?? resolve(process.env.HOME ?? "/home/ubuntu", ".cache/ms-playwright") },
      logPath: resolve(outputDir, "browser.log"), timeoutMs: browserTimeoutMs,
    });
    let imported = [];
    try {
      imported = validateJourneyReport(await readJson(resolve(browserDir, "product-journeys.json")), {
        baseUrl: SITE, courseKeys: manifest.courses.map(course => course.courseKey),
      });
      for (const result of imported) {
        const { name, status, detail, ...evidence } = result;
        record(name, status, detail, evidence);
      }
    } catch (error) {
      return { status: "blocked", detail: `Cannot import complete browser evidence: ${error.message}. Exit ${run.exitCode}; see browser.log` };
    }
    const problem = commandProblem(run);
    if (problem) return { status: "blocked", detail: problem };
    return { status: imported.some(result => result.status === "fail") ? "fail"
      : imported.some(result => result.status === "blocked") ? "blocked"
        : run.exitCode !== 0 ? "fail" : imported.some(result => result.status !== "pass") ? "warn" : "pass",
    detail: `Imported ${imported.length} individual DOM journey statuses; runner exit ${run.exitCode}`, evidence: { log: run.logPath, artifact: resolve(browserDir, "product-journeys.json") } };
  });
  orchestrationCompleted = true;
} catch (error) {
  record("Audit orchestration", "blocked", error.message ?? error);
} finally {
  if (db) {
    try { await query("ROLLBACK"); await db.end(); } catch { db?.destroy(); }
  }
}

const summary = summarizeResults(results);
const report = { schemaVersion: 2, runId, startedAt, finishedAt: new Date().toISOString(), baseUrl: SITE, outputDir,
  ...summary, options: values, results,
  budget: budget.snapshot(),
  coverage: { orchestrationCompleted, deadlineBlockedChecks,
    completedAllPlannedChecks: orchestrationCompleted && deadlineBlockedChecks === 0
      && !results.some(result => ["blocked", "skipped"].includes(result.status)) },
  limitations: [
    "Failures are evidence for validation, not automatically verified defect claims. No owner notification sent.",
    "No authenticated learner, manager or admin mutations, real email delivery, checkout charge or live ledger reconciliation.",
    "Live bank/API checks establish structure and preview contracts, not question accuracy or regulatory correctness.",
    "DOM route checks verify expected content or gate state, not exact bank identity. Authenticated paid study journeys and deeper course/region identity tracing remain part of the scheduled deep review.",
    "Production analytics cannot prove unpaid entitlement or distinguish historical tester traffic. Tutor history snapshot predates the optional probe.",
    "CI integration suites need a disposable database. Subprocesses receive test-only credentials and no production database or key material.",
  ] };
await writeFile(resolve(outputDir, "daily-audit.json"), JSON.stringify(report, null, 2) + "\n", { mode: 0o600 });
const md = ["# Echelon Daily Product Audit", "", `- Run: ${runId}`, `- Target: ${SITE}`,
  `- Overall: **${summary.status}**; all clean: **${summary.allClean}**`,
  `- Counts: ${Object.entries(summary.counts).map(([status, n]) => `${status}=${n}`).join(", ")}`,
  `- Budget: ${report.budget.elapsedMs}/${report.budget.maxMs} ms; deadline-blocked checks: ${deadlineBlockedChecks}`,
  `- Completed all planned checks: **${report.coverage.completedAllPlannedChecks}** (blocked/skipped coverage is incomplete)`,
  `- Evidence: ${outputDir}`, "", "## Results", "",
  ...results.map(result => `- **${result.status.toUpperCase()}** ${result.name}: ${result.detail.replaceAll("\n", " ")}${result.artifact ? ` ([evidence](${result.artifact}))` : result.log ? ` ([log](${result.log}))` : ""}`),
  "", "## Coverage limits", "", ...report.limitations.map(text => `- ${text}`), ""].join("\n");
await writeFile(resolve(outputDir, "daily-audit.md"), md, { mode: 0o600 });
console.log(`\nAudit ${summary.status.toUpperCase()}: ${Object.entries(summary.counts).map(([status, n]) => `${n} ${status}`).join(", ")}. allClean=${summary.allClean}`);
console.log(`Reports: ${resolve(outputDir, "daily-audit.json")} and ${resolve(outputDir, "daily-audit.md")}`);
process.exitCode = summary.exitCode;
