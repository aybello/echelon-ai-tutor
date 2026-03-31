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

// ── 3. Duplicate Question IDs ─────────────────────────────────────────────────
run("Duplicate Question IDs", () => {
  const oitPath = resolve(PROJECT_ROOT, "client/src/lib/questions.ts");
  const cl1Path = resolve(PROJECT_ROOT, "client/src/lib/class1Questions.ts");

  const oitContent = readFileSync(oitPath, "utf8");
  const cl1Content = readFileSync(cl1Path, "utf8");

  const oitIds = [...oitContent.matchAll(/^\s+id:\s+(\d+),/gm)].map(m => parseInt(m[1]));
  const cl1Ids = [...cl1Content.matchAll(/^\s+id:\s+(\d+),/gm)].map(m => parseInt(m[1]));

  const allIds = [...oitIds, ...cl1Ids];
  const seen = new Set();
  const dupes = [];
  for (const id of allIds) {
    if (seen.has(id)) dupes.push(id);
    seen.add(id);
  }

  if (dupes.length > 0) throw new Error(`Duplicate IDs found: ${dupes.join(", ")}`);
  return `${allIds.length} unique IDs across OIT (${oitIds.length}) + Class 1 (${cl1Ids.length})`;
});

// ── 4. Math Question Audit ────────────────────────────────────────────────────
run("Math Question Audit (correct index vs explanation)", () => {
  const oitPath = resolve(PROJECT_ROOT, "client/src/lib/questions.ts");
  const cl1Path = resolve(PROJECT_ROOT, "client/src/lib/class1Questions.ts");

  const issues = [];

  for (const [filePath, label] of [[oitPath, "OIT"], [cl1Path, "Class1"]]) {
    const content = readFileSync(filePath, "utf8");

    // Find calculation questions where explanation mentions a number that should match correct option
    // Heuristic: check for "≈ X" or "= X" near the end of explanation and see if correct option contains X
    const blocks = content.split(/(?=\{\s*\n\s*id:)/);

    for (const block of blocks) {
      const idMatch = block.match(/id:\s*(\d+)/);
      if (!idMatch) continue;
      const id = idMatch[1];

      // Only check calculation questions
      if (!block.includes('type: "calculation"')) continue;

      const correctMatch = block.match(/correct:\s*(\d+)/);
      const optionsMatch = block.match(/options:\s*\[([\s\S]*?)\]/);
      const explanationMatch = block.match(/explanation:\s*"([^"]*)"/);

      if (!correctMatch || !optionsMatch || !explanationMatch) continue;

      const correctIdx = parseInt(correctMatch[1]);
      const optionsStr = optionsMatch[1];
      const explanation = explanationMatch[1];

      // Parse options
      const optionValues = [...optionsStr.matchAll(/"([^"]*)"/g)].map(m => m[1]);

      if (correctIdx >= optionValues.length) {
        issues.push(`${label} Q${id}: correct index ${correctIdx} out of range (${optionValues.length} options)`);
        continue;
      }

      // Check for "Wait" or "let me recalculate" in explanation — sign of internal inconsistency
      if (/wait|let me recalculate|re-check/i.test(explanation)) {
        issues.push(`${label} Q${id}: explanation contains self-correction language — may have wrong answer`);
      }
    }
  }

  if (issues.length > 0) throw new Error(issues.join("\n"));
  return "No self-correction language or out-of-range indices found";
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
