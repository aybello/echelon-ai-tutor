import mysql from "mysql2/promise";
import { createHash } from "node:crypto";
import { afterEach, describe, expect, it, vi } from "vitest";
import { fetchAndIngest, JOB_REFRESH_BUDGET } from "./scripts/fetchJobs.mjs";
import { ingestRss } from "./scripts/fetchJobsRss.mjs";
import { fetchJobDocument, verifyJob } from "./scripts/jobVerification.mjs";
import { buildJobIdentityKey } from "./scripts/jobUtils.mjs";
import { postingTransportFixture } from "./jobPostingFixtures";

const empty = async () => ({ errors: [], totalFetched: 0, successfulSources: 0, failedSources: 0, sourceOutcomes: [] });
const candidates = Array.from({ length: 40 }, (_, index) => ({ title: `Water operator ${index}`, company: index % 2 ? "City of Peterborough" : "Region of Peel", sourceUrl: `https://employer.example.test/jobs/${index}?JobID=${index}&lang=en`, sourceName: "fixture", outcomeSource: "fixture", location: "Ontario", province: "ON" }));
function memoryDatabase() {
  const states = new Map<string, string>();
  const execute = vi.fn(async (query: string, params: any[] = []) => {
    if (query.startsWith("SELECT lastError")) return [states.has(params[0]) ? [{ lastError: states.get(params[0]) }] : []];
    if (query.startsWith("SELECT id")) return [[]];
    if (query.startsWith("INSERT INTO scheduled_work")) states.set(params[0], params[2]);
    return [{ affectedRows: 1 }];
  });
  const connections: any[] = [];
  return { execute, states, createConnection: async () => { const conn = { execute, end: vi.fn() }; connections.push(conn); return conn; }, connections };
}
afterEach(() => { vi.restoreAllMocks(); vi.unstubAllGlobals(); vi.useRealTimers(); });
describe("Jobs callback budget and durable fairness", () => {
  it("finishes a national sweep before re-verifying earlier destinations", async () => {
    const db = memoryDatabase();
    const provinces = ["ON", "BC", "AB", "SK", "MB"];
    const inputs = candidates.slice(0, 34).map((job, index) => ({ ...job, location: provinces[index % 5], province: provinces[index % 5] }));
    const visited: string[] = [];
    const coverage = new Set<string>();
    const ingest = async (collect: (job: unknown) => Promise<void>) => {
      for (const job of inputs) await collect(job);
      return { errors: ["fixture upstream unavailable"], totalFetched: inputs.length, successfulSources: 1, failedSources: 1, sourceOutcomes: [{ source: "fixture", status: "failed", count: inputs.length }] };
    };
    for (const [index, expected] of [16, 16, 2].entries()) {
      const before = visited.length;
      const result = await fetchAndIngest({ databaseUrl: "fixture", createConnection: db.createConnection, ingestRss: ingest, ingestAssociations: empty, ingestMunicipal: empty, verifyJob: async job => {
        visited.push(job.sourceUrl); coverage.add(inputs.find(input => input.sourceUrl === job.sourceUrl)!.province);
        return { status: "verified", postedAt: null, closingAt: null };
      } });
      expect(visited.length - before).toBe(expected);
      expect(result).toMatchObject({ ok: false, processedCount: expected, deferredCount: [18, 2, 0][index], failedSources: 1, expiredCount: 0 });
      expect(JSON.parse(db.states.get("job-board:refresh-health")!)).toMatchObject({ status: "degraded", lastSuccessAt: null });
    }
    expect(visited).toHaveLength(34);
    expect(new Set(visited).size).toBe(34);
    expect([...coverage].sort()).toEqual([...provinces].sort());
    expect(db.execute.mock.calls.some(([sql]) => sql.includes("lastSeenAt <"))).toBe(false);
    expect(db.connections).toHaveLength(3);
    expect(db.connections.every(conn => conn.end.mock.calls.length === 1)).toBe(true);
  });
  it("keeps prior unavailable coverage degraded at sweep end and restarts on the next callback", async () => {
    const db = memoryDatabase();
    const inputs = candidates.slice(0, 18).map((job, index) => ({ ...job, location: index % 2 ? "BC" : "ON", province: index % 2 ? "BC" : "ON", outcomeSource: index % 2 ? "west" : "east" }));
    const ingest = (source: string) => async (collect: (job: unknown) => Promise<void>) => {
      const rows = inputs.filter(job => job.outcomeSource === source);
      for (const job of rows) await collect(job);
      return { errors: [], totalFetched: rows.length, successfulSources: 1, failedSources: 0, sourceOutcomes: [{ source, status: "success", count: rows.length }] };
    };
    const visited: string[] = [];
    for (const [run, expected] of [16, 2, 16].entries()) {
      const result = await fetchAndIngest({ databaseUrl: "fixture", createConnection: db.createConnection, ingestRss: ingest("east"), ingestAssociations: ingest("west"), ingestMunicipal: empty, verifyJob: async job => {
        visited.push(job.sourceUrl);
        return { status: run === 0 ? "unavailable" : "verified", postedAt: null, closingAt: null };
      } });
      expect(result).toMatchObject({ ok: false, expiredCount: 0, deferredCount: [2, 0, 2][run], verificationUnavailable: run === 0 ? expected : 0 });
      const health = JSON.parse(db.states.get("job-board:refresh-health")!);
      expect(health).toMatchObject({ status: "degraded", lastSuccessAt: null });
      expect(health.sources.some((source: { status: string }) => source.status === "degraded")).toBe(true);
    }
    expect(new Set(visited.slice(0, 18)).size).toBe(18);
    expect(visited.slice(18)).toEqual(visited.slice(0, 16));
    expect(db.execute.mock.calls.some(([sql]) => sql.includes("lastSeenAt <"))).toBe(false);
  });
  it("never persists cursor progress after a thrown ownership failure", async () => {
    const db = memoryDatabase();
    const execute = db.execute.getMockImplementation()!;
    db.execute.mockImplementation(async (query, params = []) => {
      if (query.startsWith("INSERT INTO scheduled_work") && String(params[0]).startsWith("job-board:vacancy:")) throw new Error("Jobs refresh ownership expired or changed");
      return execute(query, params);
    });
    const ingest = async (collect: (job: unknown) => Promise<void>) => {
      for (const job of candidates) await collect(job);
      return { errors: [], totalFetched: candidates.length, successfulSources: 1, failedSources: 0, sourceOutcomes: [] };
    };
    await expect(fetchAndIngest({ databaseUrl: "fixture", createConnection: db.createConnection, ingestRss: ingest, ingestAssociations: empty, ingestMunicipal: empty, verifyJob: async () => ({ status: "verified", postedAt: null, closingAt: null }) })).rejects.toThrow("ownership");
    expect(JSON.parse(db.states.get("job-board:refresh-health")!)).toMatchObject({ status: "failed", lastVerificationKey: null, lastSuccessAt: null });
    expect(db.execute.mock.calls.some(([sql]) => /UPDATE job_postings|INSERT INTO job_postings/.test(sql))).toBe(false);
    expect(db.connections[0].end).toHaveBeenCalledOnce();
  });
  it("does not advance past unstarted destinations when the verification deadline expires", async () => {
    const db = memoryDatabase();
    const inputs = candidates.slice(0, 32);
    const ordered = [...inputs].sort((a, b) => key(a).localeCompare(key(b)));
    function key(job: typeof candidates[number]) { return createHash("sha256").update(buildJobIdentityKey(job)).digest("hex"); }
    const timeout = AbortSignal.timeout.bind(AbortSignal);
    let controller: AbortController;
    vi.spyOn(AbortSignal, "timeout").mockImplementation(ms => ms === JOB_REFRESH_BUDGET.verificationMs ? controller.signal : timeout(ms));
    const visited: string[] = [];
    const ingest = async (collect: (job: unknown) => Promise<void>) => {
      for (const job of inputs) await collect(job);
      return { errors: [], totalFetched: inputs.length, successfulSources: 1, failedSources: 0, sourceOutcomes: [{ source: "fixture", status: "success", count: inputs.length }] };
    };
    for (let run = 0; run < 4; run++) {
      controller = new AbortController();
      const before = visited.length;
      const result = await fetchAndIngest({ databaseUrl: "fixture", createConnection: db.createConnection, ingestRss: ingest, ingestAssociations: empty, ingestMunicipal: empty, verifyJob: async job => {
        visited.push(job.sourceUrl);
        if (visited.length - before === 8) controller.abort();
        return { status: "unavailable", postedAt: null, closingAt: null };
      } });
      expect(visited.length - before).toBe(8);
      expect(JSON.parse(db.states.get("job-board:refresh-health")!).lastVerificationKey).toBe(key(ordered[(run + 1) * 8 - 1]));
      expect(result).toMatchObject({ ok: false, processedCount: 0, verificationUnavailable: 8, deferredCount: 24 - run * 8, expiredCount: 0 });
    }
    expect(visited).toEqual(ordered.map(job => job.sourceUrl));
    expect(new Set(visited).size).toBe(32);
    expect(db.execute.mock.calls.some(([sql]) => /UPDATE job_postings|INSERT INTO job_postings/.test(sql))).toBe(false);
  });
  it("limits each callback to 16 destinations and resumes fairly across new connections without expiring retained jobs", async () => {
    const db = memoryDatabase();
    const visited: string[] = [];
    const ingest = async (collect: (job: unknown) => Promise<void>) => { for (const job of candidates) await collect(job); return { errors: [], totalFetched: candidates.length, successfulSources: 1, failedSources: 0, sourceOutcomes: [{ source: "fixture", status: "success", count: candidates.length }] }; };
    for (let run = 0; run < 3; run++) {
      const before = visited.length;
      const result = await fetchAndIngest({ databaseUrl: "fixture", createConnection: db.createConnection, ingestRss: ingest, ingestAssociations: empty, ingestMunicipal: empty, verifyJob: async job => { visited.push(job.sourceUrl); return { status: "verified", postedAt: null, closingAt: null }; } });
      expect(visited.length - before).toBe([16, 16, 8][run]);
      expect(result).toMatchObject({ ok: false, deferredCount: [24, 8, 0][run] });
    }
    expect(new Set(visited).size).toBe(40);
    expect(db.connections.every(conn => conn.end.mock.calls.length === 1)).toBe(true);
    expect(db.execute.mock.calls.some(([sql]) => sql.includes("lastSeenAt <"))).toBe(false);
    const inserts = db.execute.mock.calls.filter(([sql]) => sql.startsWith("INSERT INTO job_postings"));
    expect(inserts.map(([, params]) => params![1])).toContain("Region of Peel");
    expect(inserts.map(([, params]) => params![1])).toContain("City of Peterborough");
    expect(inserts.every(([, params]) => /\?JobID=\d+&lang=en$/.test(params![6]))).toBe(true);
  });
  it("cancels slow work, records every failure/deferred outcome and preserves the last successful refresh", async () => {
    const db = memoryDatabase();
    const lastSuccessAt = "2026-10-01T00:00:00.000Z";
    db.states.set("job-board:refresh-health", JSON.stringify({ runStartedAt: lastSuccessAt, runCompletedAt: lastSuccessAt, status: "complete", lastSuccessAt, sources: [], successfulSources: 0, failedSources: 0, productiveTiers: 0, provinceCount: 0 }));
    // Scale wall-clock waits only; assert the actual production budgets too.
    const timeout = AbortSignal.timeout.bind(AbortSignal);
    const budgets: number[] = [];
    vi.spyOn(AbortSignal, "timeout").mockImplementation(ms => { budgets.push(ms); return timeout(ms === JOB_REFRESH_BUDGET.sourcesMs ? 30 : ms === 4000 ? 20 : ms === JOB_REFRESH_BUDGET.verificationMs ? 60 : ms); });
    let active = 0;
    const collected = async (collect: (job: unknown) => Promise<void>, options: { signal: AbortSignal }) => {
      for (const job of candidates) await collect(job);
      await new Promise(resolve => options.signal.addEventListener("abort", resolve, { once: true }));
      return { errors: ["fixture source aborted"], totalFetched: candidates.length, successfulSources: 0, failedSources: 1, sourceOutcomes: [{ source: "fixture", status: "failed", count: candidates.length }] };
    };
    const result = await fetchAndIngest({ databaseUrl: "fixture", createConnection: db.createConnection, ingestRss: collected as any, ingestAssociations: empty, ingestMunicipal: empty, verifyJob: async (_, options) => {
      active++;
      await new Promise(resolve => options!.signal!.addEventListener("abort", resolve, { once: true }));
      active--;
      return { status: "unavailable", closingAt: null, postedAt: null };
    } });
    expect(active).toBe(0); // no work survives the callback
    expect(budgets).toContain(12000);
    expect(budgets).toContain(8500);
    expect(result).toMatchObject({ ok: false, deferredCount: 24, verificationUnavailable: 16, expiredCount: 0 });
    const health = JSON.parse(db.states.get("job-board:refresh-health")!);
    expect(health).toMatchObject({ status: "degraded", lastSuccessAt, sources: [{ source: "fixture", status: "failed" }] });
    expect(db.execute.mock.calls.some(([sql]) => /UPDATE job_postings|INSERT INTO job_postings/.test(sql))).toBe(false);
  });
  it("uses finite verified-target connection/query waits on the default mysql path", async () => {
    const execute = vi.fn(async (query: { sql: string; timeout: number }) => {
      if (query.sql.startsWith("SELECT")) return [[]];
      return [{ affectedRows: 1 }];
    });
    const conn = { execute, end: vi.fn(), destroy: vi.fn() };
    const connect = vi.spyOn(mysql, "createConnection").mockResolvedValue(conn as any);
    await fetchAndIngest({ databaseUrl: { host: "fixture.invalid", connectTimeout: 15000 } as any, ingestRss: empty, ingestAssociations: empty, ingestMunicipal: empty });
    expect(connect).toHaveBeenCalledWith({ host: "fixture.invalid", connectTimeout: 3000 });
    expect(execute.mock.calls.every(([query]) => typeof query.sql === "string" && query.timeout > 0 && query.timeout <= 2000)).toBe(true);
    expect(conn.end).toHaveBeenCalledOnce();
  });
  it("bounds a delayed prepare callback, rejects queued SQL, and ignores late settlement", async () => {
    vi.useFakeTimers();
    let finish!: (value: unknown) => void;
    const execute = vi.fn((_query: unknown) => new Promise(resolve => { finish = resolve; }));
    const conn = { execute, end: vi.fn(), destroy: vi.fn() };
    vi.spyOn(mysql, "createConnection").mockResolvedValue(conn as any);
    const run = fetchAndIngest({ databaseUrl: "fixture", ingestRss: empty, ingestAssociations: empty, ingestMunicipal: empty });
    const failed = expect(run).rejects.toThrow("Jobs database execute budget exhausted");
    await vi.advanceTimersByTimeAsync(0);
    const queued = expect(conn.execute("SELECT queued" as any)).rejects.toThrow("Jobs database execute budget exhausted");
    await vi.advanceTimersByTimeAsync(2000);
    await failed; await queued;
    expect(execute).toHaveBeenCalledOnce();
    expect(conn.destroy).toHaveBeenCalledOnce();
    expect(conn.end).toHaveBeenCalledOnce();
    finish([{ affectedRows: 1 }]);
    await vi.advanceTimersByTimeAsync(3000);
    expect(conn.destroy).toHaveBeenCalledOnce();
    expect(vi.getTimerCount()).toBe(0);
  });
  it("clears successful SQL watchdogs and allows the application queue to drain", async () => {
    vi.useFakeTimers();
    const execute = vi.fn(async (query: { sql: string }) => query.sql.startsWith("SELECT") ? [[]] : [{ affectedRows: 1 }]);
    const conn = { execute, end: vi.fn(), destroy: vi.fn() };
    vi.spyOn(mysql, "createConnection").mockResolvedValue(conn as any);
    await fetchAndIngest({ databaseUrl: "fixture", ingestRss: empty, ingestAssociations: empty, ingestMunicipal: empty });
    await Promise.all([conn.execute("SELECT first" as any), conn.execute("SELECT second" as any)]);
    expect(execute.mock.calls.slice(-2).map(([query]) => query.sql)).toEqual(["SELECT first", "SELECT second"]);
    expect(conn.destroy).not.toHaveBeenCalled();
    expect(vi.getTimerCount()).toBe(0);
    await vi.advanceTimersByTimeAsync(3000);
    expect(conn.destroy).not.toHaveBeenCalled();
  });
  it("limits the whole prepare/execute watchdog to the remaining invocation deadline", async () => {
    vi.useFakeTimers();
    const execute = vi.fn(() => new Promise(() => {}));
    const conn = { execute, end: vi.fn(), destroy: vi.fn() };
    vi.spyOn(mysql, "createConnection").mockImplementation(async () => { await new Promise(resolve => setTimeout(resolve, 23500)); return conn as any; });
    const run = fetchAndIngest({ databaseUrl: "fixture", ingestRss: empty, ingestAssociations: empty, ingestMunicipal: empty });
    const failed = expect(run).rejects.toThrow("Jobs database execute budget exhausted");
    await vi.advanceTimersByTimeAsync(23999);
    expect(conn.destroy).not.toHaveBeenCalled();
    await vi.advanceTimersByTimeAsync(1);
    await failed;
    expect(conn.destroy).toHaveBeenCalledOnce();
    expect(execute).toHaveBeenCalledWith(expect.objectContaining({ timeout: 500 }), expect.any(Array));
    expect(vi.getTimerCount()).toBe(0);
  });
  it.runIf(process.env.JOBS_SQL_CLOSEOUT_DB === "1")("bounds real mysql2 Prepare waiting for a disposable metadata lock", async () => {
    // No dotenv/app credentials, configurable host, or production fallback.
    const config = { host: "127.0.0.1", port: 3306, user: "root", password: process.env.JOBS_SQL_CLOSEOUT_PASSWORD, database: "echelon_ci", connectTimeout: 1000 };
    const connections: any[] = [];
    const table = `sql_closeout_${process.pid}_${Date.now()}`;
    let created = false;
    let ddl: Promise<unknown> | undefined;
    let raw: Promise<unknown> | undefined;
    try {
      for (let i = 0; i < 4; i++) {
        const conn = await mysql.createConnection(config);
        connections.push(conn);
        const [[identity]]: any = await conn.query("SELECT @@datadir AS datadir, DATABASE() AS db");
        expect(identity).toMatchObject({ datadir: "/home/ubuntu/jobs/job_H2KyvZao/mysql/", db: "echelon_ci" });
      }
      const [holder, alter, control, victim] = connections;
      await holder.query(`CREATE TABLE ${table} (id INT)`); created = true;
      await holder.query("START TRANSACTION");
      await holder.query(`SELECT id FROM ${table}`);
      // An exclusive MDL waiter makes subsequent uncached prepares wait too.
      ddl = alter.query(`ALTER TABLE ${table} ADD COLUMN marker INT`).then(() => undefined, (error: unknown) => error);
      const waitForMdl = async (conn: any) => {
        for (let i = 0; i < 100; i++) {
          const [rows]: any = await holder.query("SHOW PROCESSLIST");
          if (rows.some((row: any) => row.Id === conn.connection.threadId && /metadata lock/i.test(row.State))) return;
          await new Promise(resolve => setTimeout(resolve, 10));
        }
        throw new Error("Expected disposable metadata-lock waiter");
      };
      await waitForMdl(alter);
      let rawSettled = false;
      raw = control.execute({ sql: `SELECT id FROM ${table}`, timeout: 50 }).then((value: unknown) => { rawSettled = true; return value; }, (error: unknown) => { rawSettled = true; return error; });
      const originalExecute = victim.execute.bind(victim);
      // Redirect the FIRST Jobs SQL to our scratch table: never touch app tables.
      vi.spyOn(victim, "execute").mockImplementation((query: any) => originalExecute({ sql: `SELECT id FROM ${table}`, timeout: query.timeout }));
      const destroy = vi.spyOn(victim, "destroy");
      vi.spyOn(mysql, "createConnection").mockResolvedValue(victim);
      const started = Date.now();
      const outcome = fetchAndIngest({ databaseUrl: config as any, ingestRss: empty, ingestAssociations: empty, ingestMunicipal: empty }).then(() => null, error => error);
      await waitForMdl(victim);
      expect(victim.connection._command.constructor.name).toBe("Prepare");
      expect(control.connection._command.constructor.name).toBe("Prepare");
      let observationTimer: ReturnType<typeof setTimeout> | undefined;
      let error: any;
      try {
        error = await Promise.race([outcome, new Promise(resolve => {
          observationTimer = setTimeout(() => resolve(new Error("Missing whole-execute watchdog")), 2700);
        })]);
      } finally { clearTimeout(observationTimer); }
      expect(error?.message).toBe("Jobs database execute budget exhausted");
      expect(Date.now() - started).toBeLessThan(2800);
      expect(rawSettled).toBe(false); // driver's 50ms timeout did not cover Prepare, even after 2s
      expect(destroy).toHaveBeenCalledOnce();
      await holder.query("ROLLBACK");
      await ddl; await raw;
      expect((await holder.query(`SELECT id FROM ${table}`))[0]).toEqual([]);
    } finally {
      // Only our unique table may be changed or dropped. Release MDL first.
      const holder = connections[0];
      if (holder) await holder.query("ROLLBACK");
      await ddl; await raw;
      if (created) await holder.query(`DROP TABLE ${table}`);
      for (const conn of connections) await conn.end().catch(() => conn.destroy());
    }
  }, 10000);
  it("destroys a timed-out mysql socket rather than leaving SQL in flight behind the callback", async () => {
    const execute = vi.fn().mockRejectedValue(Object.assign(new Error("fixture timeout"), { code: "PROTOCOL_SEQUENCE_TIMEOUT" }));
    const conn = { execute, end: vi.fn(), destroy: vi.fn() };
    vi.spyOn(mysql, "createConnection").mockResolvedValue(conn as any);
    await expect(fetchAndIngest({ databaseUrl: "fixture", ingestRss: empty, ingestAssociations: empty, ingestMunicipal: empty })).rejects.toThrow("fixture timeout");
    expect(conn.destroy).toHaveBeenCalledOnce();
    expect(conn.end).toHaveBeenCalledOnce();
  });
  it("caps string-form connection settings and a stalled connection close", async () => {
    vi.useFakeTimers();
    const execute = vi.fn(async (query: { sql: string }) => query.sql.startsWith("SELECT") ? [[]] : [{ affectedRows: 1 }]);
    const conn = { execute, end: vi.fn(() => new Promise(() => {})), destroy: vi.fn() };
    const connect = vi.spyOn(mysql, "createConnection").mockResolvedValue(conn as any);
    const run = fetchAndIngest({ databaseUrl: "mysql://root@127.0.0.1:3311/echelon_audit_reliability", ingestRss: empty, ingestAssociations: empty, ingestMunicipal: empty });
    await vi.advanceTimersByTimeAsync(500);
    await run;
    expect(connect).toHaveBeenCalledWith({ uri: "mysql://root@127.0.0.1:3311/echelon_audit_reliability", connectTimeout: 3000 });
    expect(conn.destroy).toHaveBeenCalledOnce();
  });
  it("charges connection, initial SQL and all final source writes to one 24-second deadline", async () => {
    let clock = 0;
    vi.spyOn(Date, "now").mockImplementation(() => clock);
    const execute = vi.fn(async (query: { sql: string; timeout: number }) => {
      expect(clock + query.timeout).toBeLessThanOrEqual(24000);
      clock += 1000;
      return query.sql.startsWith("SELECT") ? [[]] : [{ affectedRows: 1 }];
    });
    const conn = { execute, end: vi.fn(), destroy: vi.fn() };
    vi.spyOn(mysql, "createConnection").mockImplementation(async () => { clock += 3000; return conn as any; });
    const sources = async () => { clock = 23000; return { errors: [], totalFetched: 0, successfulSources: 31, failedSources: 0, sourceOutcomes: Array.from({ length: 31 }, (_, i) => ({ source: `source-${i}`, status: "success", count: 0 })) }; };
    await expect(fetchAndIngest({ databaseUrl: "fixture", ingestRss: sources, ingestAssociations: empty, ingestMunicipal: empty })).rejects.toThrow("database budget exhausted");
    expect(clock).toBe(24000);
    expect(execute).toHaveBeenCalledTimes(6);
    expect(conn.destroy).toHaveBeenCalled();
    expect(conn.end).toHaveBeenCalledOnce();
  });
  it("persists all 31 source outcomes in one fenced batch instead of 62 sequential SQL calls", async () => {
    const db = memoryDatabase();
    const sources = async () => ({ errors: [], totalFetched: 0, successfulSources: 31, failedSources: 0, sourceOutcomes: Array.from({ length: 31 }, (_, i) => ({ source: `source-${i}`, status: "success", count: 0 })) });
    await fetchAndIngest({ databaseUrl: "fixture", createConnection: db.createConnection, ingestRss: sources, ingestAssociations: empty, ingestMunicipal: empty });
    const batch = db.execute.mock.calls.filter(([query]) => query.includes("FROM (") && query.includes("UNION ALL"));
    expect(batch).toHaveLength(1);
    expect(batch[0][1]).toHaveLength(31 * 4 + 2);
    expect(db.execute).toHaveBeenCalledTimes(10);
  });
  it("does not let a slow OWWA gate the independent Job Bank feeds", async () => {
    let release!: () => void;
    const pending = new Promise<Response>(resolve => { release = () => resolve(new Response("<rss><channel /></rss>")); });
    const requests: string[] = [];
    vi.stubGlobal("fetch", vi.fn((url: string) => { requests.push(url); return url.includes("owwa.ca") ? pending : Promise.resolve(new Response("<feed />")); }));
    const run = ingestRss(vi.fn());
    await new Promise(resolve => setImmediate(resolve));
    const requestedBeforeOwwaCompleted = [...requests];
    release(); await run;
    expect(requestedBeforeOwwaCompleted).toHaveLength(7);
  });
  it("passes cancellation through verification to the document reader", async () => {
    const controller = new AbortController();
    const reader = vi.fn(async () => ({ missing: false, text: "Region of Peel Water operator" }));
    await verifyJob(candidates[0], { signal: controller.signal, fetchDocument: reader });
    expect(reader).toHaveBeenCalledWith(candidates[0].sourceUrl, expect.objectContaining({ signal: controller.signal }));
  });
  it("rejects an already-aborted document request before DNS, HTTPS or PDF extraction", async () => {
    const fixture = postingTransportFixture();
    const signal = AbortSignal.abort(new Error("Refresh budget exhausted"));
    await expect(fetchJobDocument(candidates[0].sourceUrl, { ...fixture, signal })).rejects.toThrow("budget exhausted");
    expect(fixture.lookup).not.toHaveBeenCalled();
    expect(fixture.get).not.toHaveBeenCalled();
  });
});
