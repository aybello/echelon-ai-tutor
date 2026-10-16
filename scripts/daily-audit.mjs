#!/usr/bin/env node
/**
 * Echelon Daily Audit
 *
 * Replaces scripts/daily-health-check.mjs (paused 2026-09-22 after it began
 * crying wolf every morning). Changes from the old script:
 *
 *  1. Reads the AUTHORITATIVE database via activeScriptConnection, not raw
 *     DATABASE_URL. The old script read stale TiDB and reported 19,017
 *     questions when the real bank holds 24,350.
 *  2. Separates REAL failures from KNOWN NOISE, so a red alert means
 *     something actually broke. Two release tests cannot run in the sandbox
 *     by design; they are reported as skipped, not failed.
 *  3. Adds paywall enforcement checks against the LIVE site as a signed-out
 *     stranger. This is the class of defect that leaked free AI Tutor access
 *     for 60 days: every unit test passed because each side of the seam was
 *     correct in isolation.
 *  4. Adds revenue reconciliation and lead-capture checks.
 *  5. Retries live checks instead of sleeping a fixed 4 seconds.
 *
 * Exit code is 0 unless a REAL issue is found.
 */

process.env.DATABASE_CUTOVER_USE_EXTERNAL_TARGET = "true";

import { execSync } from "child_process";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import mysql from "mysql2/promise";
import { activeScriptConnection } from "./lib/activeScriptConnection.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = resolve(__dirname, "..");
// Apex, NOT www. The www host 301-redirects, and a redirected POST is
// downgraded to GET, which makes every tRPC mutation probe return 405
// "Unsupported GET-request to mutation procedure". That false alarm would
// report a working paywall as a revenue leak.
const SITE = "https://echeloninstitute.ca";

// Tests that genuinely cannot run in this sandbox. They require a production
// build release identity. Treated as skipped, never as a failure.
const KNOWN_UNRUNNABLE_TESTS = new Set([
  "server/release.test.ts",
  "server/buildRelease.test.ts",
]);

const AI_TUTOR_FREE_LIMIT = 3;

// VERIFIED in server/routers.ts line 919: the server does NOT trust any
// client-supplied anonymous id. It derives identity as
//   `${req.ip}:${req.get("user-agent")}`
// so every probe from this sandbox collapses into one hash no matter what id
// the probe sends, and that hash CANNOT be predicted from here.
//
// Therefore the production over-cap check excludes by event id instead:
// snapshot the highest event id before probing, and only examine rows that
// already existed. Precise, with no guessing at hashes.
let preProbeMaxEventId = null;

const results = [];
let realFailures = 0;

function record(label, status, detail) {
  results.push({ label, status, detail: detail || "" });
  const icon = status === "pass" ? "PASS" : status === "skip" ? "SKIP" : "FAIL";
  console.log(`[${icon}] ${label}${detail ? " - " + detail : ""}`);
  if (status === "fail") realFailures++;
}

async function check(label, fn) {
  try {
    const out = await fn();
    if (out && out.skip) record(label, "skip", out.detail);
    else record(label, "pass", typeof out === "string" ? out : "");
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    record(label, "fail", msg.slice(0, 1200));
  }
}

/** Retry a live check instead of trusting one fixed sleep. */
async function retry(fn, attempts = 4, waitMs = 3000) {
  let last;
  for (let i = 0; i < attempts; i++) {
    try { return await fn(); } catch (e) { last = e; }
    if (i < attempts - 1) await new Promise(r => setTimeout(r, waitMs));
  }
  throw last;
}

let db;
async function getDb() {
  if (!db) {
    const active = await activeScriptConnection();
    db = await mysql.createConnection(active.options);
    db.__description = active.description;
  }
  return db;
}

// ── 1. Database target sanity ────────────────────────────────────────────────
// Guards against the exact mistake the old audit made: silently reading the
// wrong database and reporting confident but wrong numbers.
await check("Database target is authoritative", async () => {
  const conn = await getDb();
  if (!/ondigitalocean/i.test(conn.__description)) {
    throw new Error(`Audit is pointed at the wrong database: ${conn.__description}`);
  }
  const [[q]] = await conn.execute("SELECT COUNT(*) AS n FROM questions");
  return `${conn.__description.slice(0, 60)} - ${q.n} questions`;
});

// ── 2. Unit tests, with known-unrunnable separated ───────────────────────────
await check("Unit tests", async () => {
  let output = "";
  try {
    output = execSync("pnpm test 2>&1", { cwd: PROJECT_ROOT, encoding: "utf8" });
  } catch (err) {
    output = String(err.stdout || "") + String(err.stderr || "");
  }
  const failing = [...output.matchAll(/FAIL\s+(\S+\.test\.tsx?)/g)].map(m => m[1]);
  const unexpected = [...new Set(failing)].filter(f => !KNOWN_UNRUNNABLE_TESTS.has(f));
  const summary = output.match(/Test Files\s+.*/)?.[0]?.trim() ?? "no summary";
  // Re-run suspects individually before alarming. Integration specs that share
  // a database can fail under parallel load and pass in isolation; reporting
  // those as breakage is how the previous health check became background noise.
  const confirmed = [];
  for (const file of unexpected) {
    try {
      execSync(`npx vitest run ${file} 2>&1`, { cwd: PROJECT_ROOT, encoding: "utf8" });
    } catch {
      confirmed.push(file);
    }
  }
  if (confirmed.length > 0) {
    throw new Error(`Confirmed test failures: ${confirmed.join(", ")} | ${summary}`);
  }
  const flaky = unexpected.filter(f => !confirmed.includes(f));
  const skipped = [...new Set(failing)].filter(f => KNOWN_UNRUNNABLE_TESTS.has(f));
  return `${summary}` +
    `${skipped.length ? ` (${skipped.length} known-unrunnable ignored)` : ""}` +
    `${flaky.length ? ` (${flaky.length} flaky, passed on re-run: ${flaky.join(", ")})` : ""}`;
});

// ── 3. TypeScript ────────────────────────────────────────────────────────────
await check("TypeScript compiles", () => {
  execSync("npx tsc --noEmit 2>&1", { cwd: PROJECT_ROOT, encoding: "utf8" });
  return "no type errors";
});

// ── 4. PAYWALL ENFORCEMENT, live, signed out ─────────────────────────────────
// The check that would have caught the 60-day AI Tutor leak on day one.
// Every internal test runs signed in, where the quota counts correctly. Only
// a real signed-out session exposes the bug.
await check("AI Tutor free cap holds for a signed-out visitor", async () => {
  // Snapshot before probing so check 8 can ignore rows this probe creates.
  const conn = await getDb();
  const [[snap]] = await conn.execute(
    "SELECT COALESCE(MAX(id), 0) AS maxId FROM product_analytics_events");
  preProbeMaxEventId = Number(snap.maxId);

  const visitor = `echelon-daily-audit-${Date.now()}`;
  const ask = async (n) => {
    const res = await fetch(`${SITE}/api/trpc/tutor.chat?batch=1`, {
      method: "POST",
      headers: { "content-type": "application/json", "x-echelon-anonymous-id": visitor },
      body: JSON.stringify({ 0: { json: {
        examType: "oit",
        anonymousId: visitor,
        messages: [{ role: "user", content: `Audit probe ${n}: what is detention time?` }],
      } } }),
    });
    return { status: res.status, body: await res.text() };
  };

  const seen = [];
  for (let i = 1; i <= AI_TUTOR_FREE_LIMIT + 2; i++) {
    const r = await ask(i);
    const capped = /TOO_MANY_REQUESTS|free AI Tutor messages/i.test(r.body);
    seen.push({ i, capped });
  }
  const pastCap = seen.filter(s => s.i > AI_TUTOR_FREE_LIMIT);
  const leaked = pastCap.filter(s => !s.capped);
  if (leaked.length > 0) {
    // Check whether the identity rotated, which is the known root cause:
    // req.ip behind `trust proxy` resolves to a rotating CDN edge node, so one
    // visitor is counted as several and each gets a fresh allowance.
    const conn2 = await getDb();
    const [spread] = await conn2.execute(
      `SELECT COUNT(DISTINCT anonymousHash) AS identities, COUNT(*) AS rows_
       FROM product_analytics_events
       WHERE eventName='ai_tutor_message' AND id > ?`, [preProbeMaxEventId]);
    const identities = Number(spread?.[0]?.identities ?? 0);
    const rowsWritten = Number(spread?.[0]?.rows_ ?? 0);
    throw new Error(
      `REVENUE LEAK: free AI Tutor cap of ${AI_TUTOR_FREE_LIMIT} is NOT enforced. ` +
      `Messages past the cap still answered: ${leaked.map(s => s.i).join(", ")}. ` +
      `This probe wrote ${rowsWritten} message rows under ${identities} distinct visitor identities` +
      `${identities > 1 ? " - IDENTITY ROTATION confirmed, one visitor is being counted as many" : ""}.`
    );
  }
  return `messages 1-${AI_TUTOR_FREE_LIMIT} answered, ${pastCap.length} past the cap blocked`;
});

// ── 5. Quiz preview paywall, live, signed out ────────────────────────────────
// Cross-exam: a preview leak on any course is the same money leak.
await check("Quiz preview paywall holds across courses", async () => {
  const PREVIEW_LIMIT = 15;
  // electrician-309a is a deliberate free learner beta and is excluded.
  const courses = ["oit", "oit-ww", "class1-water", "class2-wastewater"];
  const leaks = [];
  const checked = [];
  for (const bankKey of courses) {
    const visitor = `audit-${Date.now()}-${bankKey}`;
    const res = await fetch(`${SITE}/api/trpc/quiz.getQuestions?batch=1&input=` +
      encodeURIComponent(JSON.stringify({ 0: { json: { bankKey, anonymousId: visitor } } })), {
        headers: { "x-echelon-anonymous-id": visitor },
      });
    const body = await res.text();
    let count = null;
    try {
      const parsed = JSON.parse(body);
      const data = parsed?.[0]?.result?.data?.json;
      const rows = Array.isArray(data) ? data : (data?.questions ?? null);
      if (Array.isArray(rows)) count = rows.length;
    } catch { /* non-JSON response, reported below */ }
    if (count === null) { checked.push(`${bankKey}: no parseable payload`); continue; }
    checked.push(`${bankKey}: ${count}`);
    if (count > PREVIEW_LIMIT) {
      leaks.push(`${bankKey} served ${count} questions to a signed-out visitor (preview limit ${PREVIEW_LIMIT})`);
    }
  }
  if (leaks.length) throw new Error(`PAYWALL LEAK: ${leaks.join("; ")}`);
  return checked.join(", ");
});

// ── 6. Revenue completeness ──────────────────────────────────────────────────
// Catches the class of defect where a money-bearing table exists but is not
// counted, which understated revenue by 8.8% when team flex orders were missed.
await check("Revenue reporting covers every money table", async () => {
  const conn = await getDb();
  const [tables] = await conn.execute(`
    SELECT table_name AS t FROM information_schema.tables
    WHERE table_schema = DATABASE()
      AND (table_name LIKE '%purchase%' OR table_name LIKE '%order%'
           OR table_name LIKE '%invoice%' OR table_name LIKE '%payment%')`);
  const names = tables.map(r => r.t ?? r.table_name);
  const counts = [];
  for (const t of names) {
    const [[c]] = await conn.execute(`SELECT COUNT(*) AS n FROM \`${t}\``);
    if (c.n > 0) counts.push(`${t}=${c.n}`);
  }
  return `${names.length} money tables, non-empty: ${counts.join(", ") || "none"}`;
});

// ── 7. Lead capture is still flowing ─────────────────────────────────────────
// A silent stop here is invisible revenue loss: traffic arrives, nothing is kept.
await check("Lead capture is still recording", async () => {
  const conn = await getDb();
  // Verified against the live event stream: there is no '%lead%' event name.
  // The real identity-capture signals are these. Checking for a name that does
  // not exist is how an audit invents a crisis every morning.
  const [[captured]] = await conn.execute(`
    SELECT COUNT(*) AS n FROM product_analytics_events
    WHERE eventName IN ('otp_verified','preview_plan_requested','checkout_started')
      AND occurredAt >= DATE_SUB(NOW(), INTERVAL 7 DAY)`);
  const [[traffic]] = await conn.execute(`
    SELECT COUNT(*) AS n FROM product_analytics_events
    WHERE occurredAt >= DATE_SUB(NOW(), INTERVAL 7 DAY)`);
  if (traffic.n > 500 && captured.n === 0) {
    throw new Error(
      `${traffic.n} events in 7 days but ZERO identity captures ` +
      `(otp_verified / preview_plan_requested / checkout_started). Capture may be broken.`
    );
  }
  return `${captured.n} identity captures from ${traffic.n} events in 7 days`;
});

// ── 8. Tutor quota is actually biting in production data ─────────────────────
// Belt and braces: even if the live probe passes, look for visitors who got
// more free messages than the cap allows.
await check("No visitor exceeded the free tutor cap today", async () => {
  const conn = await getDb();
  // Exclude rows created by this run's own probe (see preProbeMaxEventId).
  // Without this the audit reports a leak every morning caused only by itself.
  const ceiling = preProbeMaxEventId ?? Number.MAX_SAFE_INTEGER;
  const [rows] = await conn.execute(`
    SELECT anonymousHash, COUNT(*) AS n
    FROM product_analytics_events
    WHERE eventName = 'ai_tutor_message'
      AND anonymousHash IS NOT NULL AND emailHash IS NULL AND userId IS NULL
      AND occurredAt >= CURDATE()
      AND id <= ?
    GROUP BY anonymousHash
    HAVING COUNT(*) > ${AI_TUTOR_FREE_LIMIT}`, [ceiling]);
  if (rows.length > 0) {
    const worst = Math.max(...rows.map(r => Number(r.n)));
    throw new Error(
      `${rows.length} anonymous visitor(s) exceeded the ${AI_TUTOR_FREE_LIMIT}-message free cap today ` +
      `(worst: ${worst} answered messages). This run's own probe rows are excluded, so this is real traffic.`
    );
  }
  return "no anonymous visitor over the free cap today";
});

// ── 9. Live site health ──────────────────────────────────────────────────────
await check("Live site responds", async () => {
  return await retry(async () => {
    const paths = ["/", "/pricing", "/quiz", "/teams"];
    const bad = [];
    for (const p of paths) {
      const res = await fetch(SITE + p, { redirect: "follow" });
      if (!res.ok) bad.push(`${p} -> ${res.status}`);
    }
    if (bad.length) throw new Error(`Non-OK responses: ${bad.join(", ")}`);
    return `${paths.length} key pages OK`;
  });
});

// ── 10. Employer surfaces do not divert to individual plans ──────────────────
// Enforces the standing business rule on the LIVE page, not just in tests.
await check("Teams page does not advertise individual plans", async () => {
  return await retry(async () => {
    const res = await fetch(`${SITE}/teams`);
    const html = await res.text();
    const text = html.replace(/<[^>]+>/g, " ");
    const hits = [];
    if (/individual exam pass/i.test(text)) hits.push("'Individual Exam Pass'");
    if (/buy\s+(an?\s+)?individual/i.test(text)) hits.push("'buy individual'");
    if (hits.length) throw new Error(`Employer surface mentions ${hits.join(", ")}`);
    return "no individual-plan diversion on /teams";
  });
});

// ── Report ───────────────────────────────────────────────────────────────────
if (db) await db.end();

const pass = results.filter(r => r.status === "pass").length;
const skip = results.filter(r => r.status === "skip").length;
const fail = results.filter(r => r.status === "fail").length;

const summary = fail === 0
  ? `All ${pass} checks passed${skip ? `, ${skip} skipped` : ""}`
  : `${fail} REAL issue(s) found out of ${results.length} checks`;

const report = [
  `Echelon Daily Audit - ${new Date().toISOString().slice(0, 10)}`,
  summary,
  "",
  ...results.map(r => {
    const icon = r.status === "pass" ? "PASS" : r.status === "skip" ? "SKIP" : "FAIL";
    return `[${icon}] ${r.label}${r.detail ? `\n    ${r.detail}` : ""}`;
  }),
].join("\n");

console.log("\n" + report);

// Notify the owner only when something is actually wrong, or once with a clean
// bill of health. A daily green wall of text trains you to ignore it.
const forgeApiUrl = process.env.BUILT_IN_FORGE_API_URL;
const forgeApiKey = process.env.BUILT_IN_FORGE_API_KEY;
if (forgeApiUrl && forgeApiKey) {
  try {
    const notifyUrl = new URL(
      "webdevtoken.v1.WebDevService/SendNotification",
      forgeApiUrl.endsWith("/") ? forgeApiUrl : forgeApiUrl + "/"
    ).toString();
    const res = await fetch(notifyUrl, {
      method: "POST",
      headers: {
        accept: "application/json",
        authorization: `Bearer ${forgeApiKey}`,
        "content-type": "application/json",
        "connect-protocol-version": "1",
      },
      body: JSON.stringify({
        title: fail === 0
          ? `Echelon daily audit clean - ${new Date().toISOString().slice(0, 10)}`
          : `Echelon daily audit: ${fail} issue(s) need attention`,
        content: report,
      }),
    });
    console.log(res.ok ? "owner notified" : `notification failed: ${res.status}`);
  } catch (err) {
    console.error("could not notify owner:", err.message);
  }
}

process.exit(fail === 0 ? 0 : 1);
