import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, readFile, stat, rm, symlink } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { CONTRACT as C, JOURNAL_ROOT, verifyJobs, verifyRow, verifyPostimage, recoverBinding } from "./lib/blogBindingRecovery.mjs";
import { writeDurableOitRepairBackup } from "./lib/oitReportedItemBackup.mjs";
import { argumentsFor, authoritativeConnection, listJobs } from "./recover-blog-worker-binding.mjs";
const uid = "synthetic-new-worker";
const journalFile = `${JOURNAL_ROOT}/synthetic.json`;
const row = () => ({ id: C.id, workerTaskUid: C.old, weeklyTaskUid: C.weekly, runKey: "", status: "completed",
  progress: "{}", claimToken: null, leaseUntil: null, lastError: null, attempts: 0,
  startedAt: "2026-10-17 00:00:00", updatedAt: "2026-10-17 00:00:00" });
function snapshot() {
  const job = (task_uid, is_enable, name = task_uid) => ({ task_uid, user_id: C.owner, name, is_enable,
    callback_path: C.path, callback_method: C.method, cron_expression: C.cron });
  return { actorUserId: C.owner, total: 3, jobs: [job(C.old, false), job(uid, true, C.name),
    { ...job(C.weekly, true), callback_path: "/api/scheduled/generate-blog" }] };
}
function fixture({ affectedRows = 1, commitFails = false, independentFails = false, journalFails = 0, collateral = false } = {}) {
  let state = row(), saved, n = 0, committed = false;
  const events = [];
  const connection = {
    query: async sql => { events.push(sql); return sql.startsWith("SELECT") ? [[structuredClone(state)]] : [{}]; },
    beginTransaction: async () => { events.push("begin"); },
    execute: async (sql, params) => {
      events.push("update"); assert.match(sql, /SET workerTaskUid = \?/); assert.match(sql, /BINARY workerTaskUid/);
      assert.deepEqual(params, [uid, C.id, C.old, C.weekly]); assert.ok(saved, "journal before UPDATE");
      if (affectedRows === 1) { state.workerTaskUid = uid; state.updatedAt = "2026-10-17 00:01:00"; }
      if (collateral) state.attempts++;
      return [{ affectedRows }];
    },
    rollback: async () => { events.push("rollback"); if (!committed) state = row(); },
    commit: async () => { events.push("commit"); committed = true; if (commitFails) throw new Error("secret driver error"); },
  };
  const options = { connection, snapshot: snapshot(), newUid: uid, apply: true, journalFile,
    saveJournal: async (_file, data) => { events.push("journal"); n++; if (n === journalFails) throw new Error("disk failure"); if (n === 1) saved = structuredClone(data); },
    loadJournal: async () => saved,
    independentRead: async () => { events.push("independent"); if (independentFails) throw new Error("secret read error"); return [structuredClone(state)]; },
  };
  return { options, events, state: () => state };
}
test("strict CLI defaults to plan, requires exact distinct UID and private journal for apply", () => {
  assert.equal(argumentsFor(["--expected-new-worker", uid]).apply, false);
  for (const args of [[], ["--expected-new-worker", C.old], ["--expected-new-worker", uid, "--apply"],
    ["--expected-new-worker", uid, "--plan", "--apply"], ["--expected-new-worker", uid, "--journal-file", "/tmp/a.json"]])
    assert.throws(() => argumentsFor(args));
  assert.throws(() => authoritativeConnection({ DATABASE_URL: "mysql://synthetic" }));
  assert.throws(() => authoritativeConnection({ DATABASE_CUTOVER_USE_EXTERNAL_TARGET: "true", NODE_TLS_REJECT_UNAUTHORIZED: "0" }));
});
test("job list verifies full owner, exact UID and all replacement configuration gates", () => {
  verifyJobs(snapshot(), uid);
  for (const mutate of [s => s.total++, s => s.actorUserId = "other", s => s.jobs[0].is_enable = true,
    s => s.jobs[1].user_id = "other", s => s.jobs[1].name = "lookalike", s => s.jobs[1].is_enable = false,
    s => s.jobs[1].callback_method = "GET", s => s.jobs[1].callback_path = "/other", s => s.jobs[1].cron_expression = "wrong",
    s => s.jobs[1].task_uid = "lookalike", s => s.jobs[1].taskUid = "conflicting-alias",
    s => { s.jobs.push({ ...s.jobs[1], task_uid: "another" }); s.total++; },
    s => { s.jobs.push({ ...s.jobs[1] }); s.total++; }]) {
    const s = snapshot(); mutate(s); assert.throws(() => verifyJobs(s, uid));
  }
});
test("reject active or uncertain state, nonempty runs, any claims/leases and wrong bindings", () => {
  verifyRow([row()], C.old);
  for (const patch of [{ status: "processing" }, { status: "pending" }, { runKey: "weekly:2026-10-12" },
    { progress: '{"submission":"uncertain"}' }, { progress: "[]" }, { progress: "null" }, { progress: "invalid" },
    { claimToken: "old" }, { leaseUntil: "2000-01-01" }, { lastError: "uncertain" }, { weeklyTaskUid: "other" },
    { workerTaskUid: "other" }, { id: "other" }]) assert.throws(() => verifyRow([{ ...row(), ...patch }], C.old));
  assert.throws(() => verifyRow([], C.old)); assert.throws(() => verifyRow([row(), row()], C.old));
});
test("read-only plan has no locks, writes, journal or commit", async () => {
  const f = fixture(); f.options.apply = false;
  assert.equal((await recoverBinding(f.options)).outcome, "read-only-plan");
  assert.ok(f.events.includes("SET TRANSACTION READ ONLY"));
  assert.ok(!f.events.some(e => /journal|update|commit|FOR UPDATE/.test(e)));
});
test("apply serializes, locks, journals before exact CAS then verifies independently after COMMIT", async () => {
  const f = fixture(); const result = await recoverBinding(f.options);
  assert.equal(result.outcome, "committed-independently-verified");
  assert.ok(f.events.includes("SELECT * FROM blog_automation_runs FOR UPDATE"));
  for (const [a,b] of [["journal","update"], ["update","commit"], ["commit","independent"]])
    assert.ok(f.events.indexOf(a) < f.events.indexOf(b));
  assert.equal(f.state().workerTaskUid, uid);
});
test("journal failure blocks UPDATE, CAS miss and collateral changes roll back before COMMIT", async () => {
  for (const settings of [{ journalFails: 1 }, { affectedRows: 0 }, { affectedRows: 2 }, { collateral: true }]) {
    const f = fixture(settings);
    await assert.rejects(recoverBinding(f.options), { name: "RecoveryStopped" });
    assert.ok(f.events.includes("rollback")); assert.ok(!f.events.includes("commit"));
    if (settings.journalFails) assert.ok(!f.events.includes("update"));
  }
});
test("COMMIT transport, postcommit read and receipt failures always report ambiguity without retry", async () => {
  for (const settings of [{ commitFails: true }, { independentFails: true }, { journalFails: 2 }]) {
    const f = fixture(settings);
    await assert.rejects(recoverBinding(f.options), error => error.name === "CommitOutcomeAmbiguous"
      && error.message.includes("may be committed") && !error.message.includes("secret"));
    assert.equal(f.events.filter(e => e === "update").length, 1);
  }
});
test("idempotent repeat needs original matching beforeimage and independent verification; never rewrites", async () => {
  const f = fixture(); await recoverBinding(f.options); f.events.length = 0;
  assert.equal((await recoverBinding(f.options)).outcome, "already-bound-verified");
  assert.ok(!f.events.includes("update")); assert.ok(!f.events.includes("commit"));
  f.options.loadJournal = async () => ({ version: C.version, phase: "prepared", newUid: uid, before: { ...row(), attempts: 99 } });
  await assert.rejects(recoverBinding(f.options));
});
test("postimage compares every field except normal updatedAt", () => {
  verifyPostimage(row(), { ...row(), workerTaskUid: uid, updatedAt: "new" }, uid);
  assert.throws(() => verifyPostimage(row(), { ...row(), workerTaskUid: uid, added: true }, uid));
});
test("durable journal uses exclusive 0600 file outside repo and rejects overwrite/symlink", async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), "binding-journal-"));
  try {
    const file = path.join(root, "before.json");
    await writeDurableOitRepairBackup({ backupRoot: root, backupFile: file, payload: { before: row() } });
    assert.equal((await stat(file)).mode & 0o777, 0o600);
    assert.deepEqual(JSON.parse(await readFile(file, "utf8")).before, row());
    await assert.rejects(writeDurableOitRepairBackup({ backupRoot: root, backupFile: file, payload: {} }));
    const link = path.join(root, "link.json"); await symlink(file, link);
    await assert.rejects(writeDurableOitRepairBackup({ backupRoot: root, backupFile: link, payload: {} }));
  } finally { await rm(root, { recursive: true, force: true }); }
});
test("official CLI list paginates completely with allowlisted env and no scheduler mutation", async () => {
  const jobs = Array.from({ length: 201 }, (_, n) => ({ task_uid: `fixture-${n}` }));
  const calls = [];
  const result = await listJobs({ HOME: "/tmp", PATH: "/bin", DATABASE_URL: "secret" }, async (command, args, options) => {
    calls.push(args); assert.equal(command, "manus-heartbeat"); assert.equal(args[0], "list");
    assert.equal(options.env.DATABASE_URL, undefined);
    const page = Number(args[2]);
    return { stdout: JSON.stringify({ actor_user_id: C.owner, total: 201, jobs: jobs.slice((page - 1) * 200, page * 200) }) };
  });
  assert.equal(result.jobs.length, 201); assert.equal(calls.length, 2);
  await assert.rejects(listJobs({}, async () => ({ stdout: '{"actor_user_id":"wrong","jobs":[],"total":0}' })));
});
