#!/usr/bin/env node
import { execFileSync } from "node:child_process";
import { readFileSync, readdirSync, lstatSync } from "node:fs";
import { resolve, relative } from "node:path";
import { fileURLToPath } from "node:url";

// Exact public service inboxes, not a domain-wide or file-wide exemption.
const PUBLIC_EMAILS = new Set([
  "abello@echeloninstitute.ca",
  "noreply@echeloninstitute.ca",
  "no-reply@echeloninstitute.ca",
]);
const NON_ADDRESS_TOKENS = new Set(["wouter@3.7.1.patch"]);
const EMAIL = /[A-Za-z0-9._%+\-]+@[A-Za-z0-9.\-]+\.[A-Za-z]{2,}/g;

function syntheticEmail(value) {
  const domain = value.split("@").at(-1).toLowerCase();
  return ["example.com", "example.org", "example.net"].includes(domain)
    || /\.(test|example|invalid)$/.test(domain);
}

/** Findings deliberately contain no matched text, hash, line or customer data. */
export function scanPrivacyText(text, file) {
  const counts = new Map();
  const add = category => counts.set(category, (counts.get(category) ?? 0) + 1);
  const databaseUrls = [...text.matchAll(/\b(?:mysql|postgres(?:ql)?):\/\/[^\s"'<>`]+/g)];
  for (const match of text.matchAll(EMAIL)) {
    if (databaseUrls.some(url => match.index >= url.index && match.index < url.index + url[0].length)) continue;
    const email = match[0];
    if (!syntheticEmail(email) && !PUBLIC_EMAILS.has(email.toLowerCase()) && !NON_ADDRESS_TOKENS.has(email)) add("unexpected-email");
  }
  for (const match of text.matchAll(/\b(?:cus|sub|pi|ch|cs_live|acct|in)_[A-Za-z0-9]{10,}\b/g)) {
    if (match[0] === "in_development") continue;
    // Realistic random account IDs are forbidden even in tests. Short descriptive
    // fixture identifiers with a test/mock/example prefix are acceptable.
    if (!/^(?:cus|sub|pi|ch|cs_live|acct|in)_(?:test|mock|fake|fixture|example|placeholder)/i.test(match[0])) add("billing-identifier");
  }
  const secretPatterns = [
    /\b(?:sk|rk)_(?:live|test)_[A-Za-z0-9]{20,}\b/g,
    /\bwhsec_[A-Za-z0-9]{20,}\b/g,
    /\b(?:AKIA|ASIA)[A-Z0-9]{16}\b/g,
    /\b(?:ghp_|github_pat_)[A-Za-z0-9_]{20,}\b/g,
    /\bAIza[A-Za-z0-9_-]{30,}\b/g,
    /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/g,
    /\beyJ[A-Za-z0-9_-]{15,}\.[A-Za-z0-9_-]{15,}\.[A-Za-z0-9_-]{15,}\b/g,
    /\b(?:token|secret|apiKey|password)\s*[:=]\s*["'][a-f0-9]{40,}["']/gi,
  ];
  for (const pattern of secretPatterns) for (const _match of text.matchAll(pattern)) add("credential-literal");
  // Loopback database credentials are permitted only for disposable CI/docs.
  for (const match of text.matchAll(/\b(?:mysql|postgres(?:ql)?):\/\/[^\s"'<>`]+/g)) {
    try {
      const url = new URL(match[0]);
      if (url.password && !["localhost", "127.0.0.1", "[::1]", "db.example.com", "db.example.test"].includes(url.hostname) && !/\.(test|example|invalid)$/.test(url.hostname)) add("database-credential-url");
    } catch { /* incomplete URLs and regexes are not credentials */ }
  }
  if (/(?:^|\/)(?:customer|recipient|billing|stripe|learner)[-_]?(?:export|dump|contacts|records)\.(?:json|csv|sql|tsv)$/i.test(file)) add("private-export-file");
  return [...counts].map(([category, count]) => ({ file, category, count }));
}

export function scanTrackedTree(root, { staged = false } = {}) {
  const entries = execFileSync("git", ["ls-files", "--stage", "-z"], { cwd: root }).toString().split("\0").filter(Boolean);
  const findings = [];
  let scanned = 0;
  for (const entry of entries) {
    const [metadata, ...pathParts] = entry.split("\t");
    const [mode, objectId, stage] = metadata.split(" ");
    const file = pathParts.join("\t");
    if (stage !== "0") throw new Error("Unmerged index cannot pass the privacy gate.");
    if (mode === "120000" || mode === "160000") continue;
    let bytes;
    if (staged) {
      // Scan the indexed blob, not a potentially newer or reverted worktree file.
      // Large tracked text must not hit Node's 1 MiB default pipe buffer. An
      // oversized blob still fails the gate instead of silently being skipped.
      bytes = execFileSync("git", ["cat-file", "blob", objectId], { cwd: root, maxBuffer: 64 * 1024 * 1024 });
    } else {
      const path = resolve(root, file);
      if (lstatSync(path).isSymbolicLink()) continue;
      bytes = readFileSync(path);
    }
    if (bytes.includes(0)) continue;
    findings.push(...scanPrivacyText(bytes.toString("utf8"), file));
    scanned++;
  }
  return { scanned, findings };
}

function scanArtifacts(root, artifactPath) {
  const findings = [];
  function visit(path) {
    const info = lstatSync(path);
    if (info.isSymbolicLink()) return;
    if (info.isDirectory()) { for (const name of readdirSync(path)) visit(resolve(path, name)); return; }
    const bytes = readFileSync(path);
    if (!bytes.includes(0)) findings.push(...scanPrivacyText(bytes.toString("utf8"), relative(root, path)));
  }
  visit(resolve(root, artifactPath));
  return findings;
}

export function main(root = process.cwd(), args = process.argv.slice(2)) {
  const staged = args[0] === "--staged";
  const remaining = staged ? args.slice(1) : args;
  if (remaining.length && (remaining.length !== 2 || remaining[0] !== "--artifacts")) throw new Error("Usage: node scripts/privacyGuard.mjs [--staged] [--artifacts public-build-directory]");
  const { scanned, findings } = scanTrackedTree(root, { staged });
  if (remaining.length) findings.push(...scanArtifacts(root, remaining[1]));
  if (findings.length) {
    console.error(JSON.stringify({ status: "blocked", scannedTrackedTextFiles: scanned, findings }, null, 2));
    return 1;
  }
  console.log(JSON.stringify({ status: "passed", source: staged ? "staged-index" : "tracked-worktree", scannedTrackedTextFiles: scanned, findings: 0 }));
  return 0;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try { process.exitCode = main(); }
  catch { console.error("Privacy guard failed without exposing input values."); process.exitCode = 1; }
}
