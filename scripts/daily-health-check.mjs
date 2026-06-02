#!/usr/bin/env node
/**
 * Daily Health Check Script
 * Runs: unit tests, TypeScript check, math audit, duplicate ID scan
 * Sends owner notification with pass/fail summary via the tRPC API
 */

import { execSync } from "child_process";
import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import mysql from "mysql2/promise";

const __dirname = dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = resolve(__dirname, "..");

const results = [];
let overallPass = true;

function run(label, fn) {
  try {
    const result = fn();
    results.push({ label, status: "✅ PASS", detail: result || "" });
    console.log(`✅ ${label}`);
  } catch (err) {
    overallPass = false;
    const detail = err.message?.slice(0, 300) || String(err).slice(0, 300);
    results.push({ label, status: "❌ FAIL", detail });
    console.error(`❌ ${label}: ${detail}`);
  }
}

async function runAsync(label, fn) {
  try {
    const result = await fn();
    results.push({ label, status: "✅ PASS", detail: result || "" });
    console.log(`✅ ${label}`);
  } catch (err) {
    overallPass = false;
    const detail = err.message?.slice(0, 300) || String(err).slice(0, 300);
    results.push({ label, status: "❌ FAIL", detail });
    console.error(`❌ ${label}: ${detail}`);
  }
}

// ── 1. Unit Tests ─────────────────────────────────────────────────────────────
run("Unit Tests (vitest)", () => {
  const output = execSync("pnpm test 2>&1", { cwd: PROJECT_ROOT, encoding: "utf8" });
  const match = output.match(/Tests\s+(\d+) passed/);
  if (!match) throw new Error("Test output unrecognised:\n" + output.slice(-300));
  return `${match[1]} tests passed`;
});

// ── 2. TypeScript Compilation ─────────────────────────────────────────────────
run("TypeScript (tsc --noEmit)", () => {
  execSync("npx tsc --noEmit 2>&1", { cwd: PROJECT_ROOT, encoding: "utf8" });
  return "No type errors";
});

// ── 3. Duplicate Question IDs (database) ─────────────────────────────────────
await runAsync("Duplicate Question IDs", async () => {
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) throw new Error("DATABASE_URL not set — cannot query questions table");

  const conn = await mysql.createConnection(dbUrl);
  try {
    // Find any (bankKey, questionNum) pairs that appear more than once
    const [rows] = await conn.execute(
      `SELECT bankKey, questionNum, COUNT(*) AS cnt
       FROM questions
       GROUP BY bankKey, questionNum
       HAVING cnt > 1
       LIMIT 20`
    );
    if (rows.length > 0) {
      const detail = rows.map(r => `${r.bankKey}#${r.questionNum} (×${r.cnt})`).join(", ");
      throw new Error(`Duplicate (bankKey, questionNum) pairs: ${detail}`);
    }
    const [[{ total }]] = await conn.execute("SELECT COUNT(*) AS total FROM questions");
    const [[{ banks }]] = await conn.execute("SELECT COUNT(DISTINCT bankKey) AS banks FROM questions");
    return `${total} questions across ${banks} banks — no duplicates`;
  } finally {
    await conn.end();
  }
});

// ── 4. Math Question Audit (database) ────────────────────────────────────────
await runAsync("Math Question Audit (correct index vs explanation)", async () => {
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) throw new Error("DATABASE_URL not set — cannot query questions table");

  const conn = await mysql.createConnection(dbUrl);
  try {
    const issues = [];

    // 4a. correctIndex out of range (must be 0-3 for 4-option questions)
    const [outOfRange] = await conn.execute(
      `SELECT bankKey, questionNum, correctIndex
       FROM questions
       WHERE correctIndex < 0 OR correctIndex > 3
       LIMIT 20`
    );
    for (const r of outOfRange) {
      issues.push(`${r.bankKey}#${r.questionNum}: correctIndex ${r.correctIndex} out of range`);
    }

    // 4b. Calculation questions whose explanation contains self-correction language
    // Use word-boundary patterns: 'Wait:' / 'Wait —' / 'Wait,' catch AI self-corrections;
    // avoid false positives from normal prose like 'waiting for...'
    const [calcRows] = await conn.execute(
      `SELECT bankKey, questionNum, explanation
       FROM questions
       WHERE isCalc = 'yes'
         AND (
           explanation LIKE '%Wait:%'
           OR explanation LIKE '%Wait —%'
           OR explanation LIKE '%Wait,%'
           OR explanation LIKE '%let me recalculate%'
           OR explanation LIKE '%re-check%'
         )
       LIMIT 20`
    );
    for (const r of calcRows) {
      issues.push(`${r.bankKey}#${r.questionNum}: explanation contains self-correction language`);
    }

    // 4c. Questions with empty explanation
    const [[{ emptyExp }]] = await conn.execute(
      `SELECT COUNT(*) AS emptyExp FROM questions WHERE explanation IS NULL OR explanation = ''`
    );
    if (emptyExp > 0) issues.push(`${emptyExp} questions have empty explanation`);

    // 4d. Questions where options JSON does not parse to exactly 4 items
    const [allCalc] = await conn.execute(
      `SELECT bankKey, questionNum, options FROM questions WHERE isCalc = 'yes' LIMIT 5000`
    );
    let badOptions = 0;
    for (const r of allCalc) {
      try {
        const opts = JSON.parse(r.options);
        if (!Array.isArray(opts) || opts.length !== 4) badOptions++;
      } catch { badOptions++; }
    }
    if (badOptions > 0) issues.push(`${badOptions} calc questions have malformed options JSON`);

    if (issues.length > 0) throw new Error(issues.join("\n"));

    const [[{ calcTotal }]] = await conn.execute(
      `SELECT COUNT(*) AS calcTotal FROM questions WHERE isCalc = 'yes'`
    );
    return `${calcTotal} calc questions audited — no out-of-range indices or self-correction language`;
  } finally {
    await conn.end();
  }
});

// ─// ── 5. Route Coverage ─────────────────────────────────────────────
run("Route Coverage (all routes have components)", () => {
  const appPath = resolve(PROJECT_ROOT, "client/src/App.tsx");
  const appContent = readFileSync(appPath, "utf8");

  // Extract all import paths (both lazy and static)
  const lazyImports = [...appContent.matchAll(/lazy\(\s*\(\)\s*=>\s*import\("([^"]+)"\)/g)].map(m => m[1]);
  const staticImports = [...appContent.matchAll(/^import\s+\w+\s+from\s+"([^"]+)"/gm)]
    .map(m => m[1])
    .filter(p => p.startsWith("./") || p.startsWith("@/pages"));

  const allImports = [...new Set([...lazyImports, ...staticImports])];

  const missing = [];
  for (const imp of allImports) {
    // Normalise path
    const rel = imp.replace(/^@\//, "").replace(/^\.\//,  "");
    const filePath = resolve(PROJECT_ROOT, "client/src", rel + ".tsx");
    try {
      readFileSync(filePath);
    } catch {
      // Try without .tsx (might be a directory index)
      try {
        readFileSync(resolve(PROJECT_ROOT, "client/src", rel, "index.tsx"));
      } catch {
        missing.push(imp);
      }
    }
  }

  if (missing.length > 0) throw new Error(`Missing route components: ${missing.join(", ")}`);
  return `${allImports.length} route components verified`;
});

// ── 6. User Journey Checks (Playwright, live site) ──────────────────────────
await runAsync("User Journey Checks (live site)", async () => {
  const output = execSync(
    "python3 scripts/journey-checks.py",
    { cwd: PROJECT_ROOT, timeout: 300_000, encoding: "utf8" }
  );
  const match = output.match(/Journey Checks: (\d+) passed, (\d+) failed/);
  if (!match) throw new Error("Could not parse journey check output");
  const passed = parseInt(match[1]);
  const failed = parseInt(match[2]);
  if (failed > 0) {
    const failedLines = output
      .split("\n")
      .filter(l => l.includes("❌"))
      .map(l => l.trim())
      .join("; ");
    throw new Error(`${failed} journey check(s) failed: ${failedLines}`);
  }
  return `${passed} user journeys passed`;
});

// ── Build Report ──────────────────────────────────────────────────────────────
const passCount = results.filter(r => r.status.startsWith("✅")).length;
const failCount = results.filter(r => r.status.startsWith("❌")).length;

const reportLines = results.map(r => {
  const detail = r.detail ? `\n   → ${r.detail}` : "";
  return `${r.status} ${r.label}${detail}`;
});

const summary = overallPass
  ? `✅ All ${passCount} health checks passed`
  : `⚠️ ${failCount} of ${passCount + failCount} checks FAILED`;

const fullReport = [
  `Daily Health Check — ${new Date().toISOString().slice(0, 10)}`,
  summary,
  "",
  ...reportLines,
].join("\n");

console.log("\n" + fullReport);

// ─// ── Send Owner Notification ─────────────────────────────────────────────
// Call the Manus notification service directly using the forge API key
const forgeApiUrl = process.env.BUILT_IN_FORGE_API_URL;
const forgeApiKey = process.env.BUILT_IN_FORGE_API_KEY;

if (!forgeApiUrl || !forgeApiKey) {
  console.warn("⚠️ BUILT_IN_FORGE_API_URL or BUILT_IN_FORGE_API_KEY not set — skipping notification");
} else {
  try {
    const notifyUrl = new URL(
      "webdevtoken.v1.WebDevService/SendNotification",
      forgeApiUrl.endsWith("/") ? forgeApiUrl : forgeApiUrl + "/"
    ).toString();

    const response = await fetch(notifyUrl, {
      method: "POST",
      headers: {
        accept: "application/json",
        authorization: `Bearer ${forgeApiKey}`,
        "content-type": "application/json",
        "connect-protocol-version": "1",
      },
      body: JSON.stringify({
        title: overallPass
          ? `✅ Daily Health Check Passed — ${new Date().toISOString().slice(0, 10)}`
          : `⚠️ Daily Health Check FAILED — ${failCount} issue(s) found`,
        content: fullReport,
      }),
    });

    if (response.ok) {
      console.log("✅ Owner notification sent");
    } else {
      console.error("⚠️ Owner notification failed:", response.status, await response.text());
    }
  } catch (err) {
    console.error("⚠️ Could not send owner notification:", err.message);
  }
}

// Exit with non-zero code if any check failed
process.exit(overallPass ? 0 : 1);
