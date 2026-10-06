import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { execFileSync, spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { runInNewContext } from "node:vm";
import { scanPrivacyText, scanTrackedTree } from "./privacyGuard.mjs";

const guard = fileURLToPath(new URL("./privacyGuard.mjs", import.meta.url));

test("permits reserved fixtures, narrowly approved public inboxes and public docs", () => {
  const publicDoc = "Contact abello@echeloninstitute.ca. See https://stripe.com/docs. wouter@3.7.1.patch";
  assert.deepEqual(scanPrivacyText(`${publicDoc} Sample Operator sample@example.com learner@training.test sub_fixture_1`, "docs/service.md"), []);
});

test("blocks a synthetic accidental customer record and redacts values from reports", () => {
  const email = ["accidental.customer", "synthetic-mail-provider", "com"].join(".").replace(".synthetic", "@synthetic");
  const record = `{"name":"Sample Customer","email":"${email}"}`;
  const findings = scanPrivacyText(record, "fixtures/customer.json");
  assert.deepEqual(findings, [{ file: "fixtures/customer.json", category: "unexpected-email", count: 1 }]);
  assert.ok(!JSON.stringify(findings).includes(email));
  assert.ok(!JSON.stringify(findings).includes("Sample Customer"));
});

test("blocks account identifiers, provider secrets, private exports and private-key blocks", () => {
  const privateKey = ["-----BEGIN", "PRIVATE KEY-----"].join(" ");
  const databaseUrl = ["mysql://user:secret", "private-db.invalid-host.com/data"].join("@");
  const text = `cus_${"A1".repeat(12)} sk_live_${"aB7".repeat(12)} ${privateKey} ${databaseUrl}`;
  assert.deepEqual(scanPrivacyText(text, "billing-export.csv").map(row => row.category).sort(), ["billing-identifier", "credential-literal", "database-credential-url", "private-export-file"]);
});

test("all tracked text is scanned, CLI exits nonzero without echoing an accidental identifier", () => {
  const root = mkdtempSync(join(tmpdir(), "privacy-guard-"));
  try {
    execFileSync("git", ["init", "-q"], { cwd: root });
    const email = ["customer", "made-up-provider", "com"].join(".").replace(".made", "@made");
    writeFileSync(join(root, "todo.md"), `Sample Customer: ${email}\n`);
    execFileSync("git", ["add", "todo.md"], { cwd: root });
    assert.equal(scanTrackedTree(root).scanned, 1);
    const result = spawnSync(process.execPath, [guard], { cwd: root, env: { PATH: process.env.PATH }, encoding: "utf8" });
    assert.equal(result.status, 1);
    assert.match(result.stderr, /unexpected-email/);
    assert.ok(!result.stderr.includes(email));
    assert.ok(!result.stderr.includes("Sample Customer"));
    writeFileSync(join(root, "todo.md"), "Sample Learner: learner@example.com\n");
    assert.equal(spawnSync(process.execPath, [guard], { cwd: root, env: { PATH: process.env.PATH } }).status, 0);
  } finally { rmSync(root, { recursive: true, force: true }); }
});

test("staged mode checks the indexed tree, not a clean but unstaged replacement", () => {
  const root = mkdtempSync(join(tmpdir(), "privacy-index-"));
  try {
    execFileSync("git", ["init", "-q"], { cwd: root });
    const email = ["customer", "made-up-provider", "com"].join(".").replace(".made", "@made");
    writeFileSync(join(root, "todo.md"), email);
    execFileSync("git", ["add", "todo.md"], { cwd: root });
    writeFileSync(join(root, "todo.md"), "Synthetic Learner: learner@example.com\n");
    assert.deepEqual(scanTrackedTree(root).findings, []);
    assert.equal(scanTrackedTree(root, { staged: true }).findings[0].category, "unexpected-email");
    const options = { cwd: root, env: { PATH: process.env.PATH }, encoding: "utf8" };
    const blocked = spawnSync(process.execPath, [guard, "--staged"], options);
    assert.equal(blocked.status, 1);
    assert.ok(!blocked.stderr.includes(email));
    execFileSync("git", ["add", "todo.md"], { cwd: root });
    writeFileSync(join(root, "todo.md"), email);
    writeFileSync(join(root, "large.txt"), "Synthetic fixture text.\n".repeat(50_000));
    execFileSync("git", ["add", "large.txt"], { cwd: root });
    const clean = spawnSync(process.execPath, [guard, "--staged"], options);
    assert.equal(clean.status, 0);
    assert.equal(JSON.parse(clean.stdout).source, "staged-index");
    assert.equal(JSON.parse(clean.stdout).scannedTrackedTextFiles, 2);
    assert.equal(scanTrackedTree(root).findings.length, 1);
  } finally { rmSync(root, { recursive: true, force: true }); }
});

test("demo startup gates reject unapproved, remote, production-named and malformed targets without I/O", () => {
  for (const file of ["seed-demo-org.mjs", "simulate-team-activity.ts"]) {
    const source = readFileSync(new URL(file, import.meta.url), "utf8");
    // Evaluate only the real pre-I/O guard, never import/execute a seeder.
    const start = source.indexOf("let DEMO_TARGET");
    const end = source.indexOf(file.endsWith(".mjs") ? "const DB_URL" : "const MANAGER_EMAIL", start);
    assert.ok(start >= 0 && end > start);
    const gate = source.slice(start, end).replace("let DEMO_TARGET: URL;", "let DEMO_TARGET;");
    const check = (url, approval = "ISOLATED_DEMO_FIXTURES") => runInNewContext(gate, {
      URL, process: { env: { DATABASE_URL: url, DEMO_FIXTURE_APPROVED: approval } },
    });
    assert.doesNotThrow(() => check("mysql://root@127.0.0.1:3311/echelon_audit_privacy"));
    assert.doesNotThrow(() => check("mysql://root@localhost/echelon_demo_synthetic"));
    assert.throws(() => check("mysql://root@localhost/echelon"), /disposable/);
    assert.throws(() => check("mysql://root@fixture-db.test/echelon_demo_synthetic"), /loopback/);
    assert.throws(() => check("postgres://root@localhost/echelon_demo_synthetic"), /disposable/);
    assert.throws(() => check("mysql://root@localhost/echelon_demo_synthetic", "NOT_APPROVED"), /approval/);
    assert.throws(() => check("synthetic-malformed-input"), error => {
      assert.ok(!error.message.includes("synthetic-malformed-input"));
      return /valid disposable/.test(error.message);
    });
    if (file.endsWith(".mjs")) assert.doesNotMatch(source, /SignJWT|document\.cookie|dotenv/);
  }
});
