import mysql from "mysql2/promise";
import { afterEach, describe, expect, it, vi } from "vitest";
import { fetchAndIngest, JOB_REFRESH_BUDGET } from "./scripts/fetchJobs.mjs";
import { ingestRss } from "./scripts/fetchJobsRss.mjs";
import { fetchJobDocument, verifyJob } from "./scripts/jobVerification.mjs";
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
  it("limits each callback to 16 destinations and resumes fairly across new connections without expiring retained jobs", async () => {
    const db = memoryDatabase();
    const visited: string[] = [];
    const ingest = async (collect: (job: unknown) => Promise<void>) => { for (const job of candidates) await collect(job); return { errors: [], totalFetched: candidates.length, successfulSources: 1, failedSources: 0, sourceOutcomes: [{ source: "fixture", status: "success", count: candidates.length }] }; };
    for (let run = 0; run < 3; run++) {
      const before = visited.length;
      const result = await fetchAndIngest({ databaseUrl: "fixture", createConnection: db.createConnection, ingestRss: ingest, ingestAssociations: empty, ingestMunicipal: empty, verifyJob: async job => { visited.push(job.sourceUrl); return { status: "verified", postedAt: null, closingAt: null }; } });
      expect(visited.length - before).toBe(16);
      expect(result).toMatchObject({ ok: false, deferredCount: 24 });
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
