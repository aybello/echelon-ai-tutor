import { randomUUID } from "node:crypto";
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import mysql, { type Pool } from "mysql2/promise";
import { drizzle } from "drizzle-orm/mysql2";
import { sql } from "drizzle-orm";
const state = vi.hoisted(() => ({ db: null as any }));
vi.mock("./db", () => ({ getDb: async () => state.db }));
import { fetchAndIngest } from "./scripts/fetchJobs.mjs";
import { JOB_HEALTH_KEY, JOB_REFRESH_LOCK_KEY, jobSourceStateKey, vacancyStateKey, readJobRefreshHealth } from "./jobBoardState";
import { jobsRouter } from "./routers/jobsRouter";
import { claimWork } from "./jobs/durableWork";

// A flag alone is insufficient: refuse every non-designated or non-loopback target.
const suite = process.env.AUDIT_INTEGRATION_TEST_DB === "1" ? describe : describe.skip;
const prefix = `jobs-fixture-${randomUUID()}`;
let pool: Pool;
const caller = jobsRouter.createCaller({ user: null, req: { headers: {} }, res: {} } as any);
const now = () => new Date();
const oldPosted = new Date("2026-07-02T00:00:00Z");
const empty = async () => ({ errors: [], totalFetched: 0, successfulSources: 0, failedSources: 0, sourceOutcomes: [] });
const verified = async (job: any) => ({ status: "verified" as const, postedAt: job.postedAt ?? null, closingAt: null });
function job(province: "ON" | "AB", suffix = province) {
  return { title: `Fixture water operator ${suffix}`, sourceName: `fixture-${province}`, location: province, province, sourceType: "rss", sourceUrl: `https://employer.example.test/${prefix}/${suffix}`, postedAt: oldPosted };
}
function tier(province: "ON" | "AB") {
  return async (upsert: (job: unknown) => Promise<void>) => {
    await upsert(job(province));
    return { errors: [], totalFetched: 1, successfulSources: 1, failedSources: 0, sourceOutcomes: [{ source: `fixture-${province}`, status: "success", count: 1 }] };
  };
}
const run = (options: Record<string, unknown> = {}) => fetchAndIngest({ databaseUrl: process.env.DATABASE_URL!, now, verifyJob: verified, ingestRss: tier("ON"), ingestAssociations: tier("AB"), ingestMunicipal: empty, ...options });
async function readState(key: string) {
  const [rows] = await pool.execute<any[]>("SELECT * FROM scheduled_work WHERE workKey = ?", [key]);
  return rows[0];
}
async function writeVacancy(url: string, status: string, value: unknown) {
  await pool.execute("INSERT INTO scheduled_work (workKey,status,lastError) VALUES (?,?,?) ON DUPLICATE KEY UPDATE status=VALUES(status),lastError=VALUES(lastError)", [vacancyStateKey(url), status, typeof value === "string" ? value : JSON.stringify(value)]);
}
suite("Jobs real SQL durable state in a disposable database", () => {
  beforeAll(async () => {
    const url = new URL(process.env.DATABASE_URL!);
    if (url.protocol !== "mysql:" || !["127.0.0.1", "localhost"].includes(url.hostname) || !["/echelon_audit_reliability", "/echelon_ci"].includes(url.pathname)) throw new Error("Jobs SQL tests require the designated disposable loopback database");
    pool = mysql.createPool({ uri: url.toString(), connectionLimit: 6, timezone: "Z" });
    state.db = drizzle(pool);
    await pool.execute("SELECT workKey FROM scheduled_work LIMIT 1");
  });
  beforeEach(async () => {
    await pool.execute("DELETE FROM job_postings");
    await pool.execute("DELETE FROM scheduled_work WHERE workKey LIKE 'job-board:%' OR workKey LIKE ?", [`${prefix}%`]);
  });
  afterAll(async () => {
    if (!pool) return;
    await pool.execute("DELETE FROM job_postings WHERE sourceUrl LIKE ?", [`%${prefix}%`]);
    await pool.execute("DELETE FROM scheduled_work WHERE workKey LIKE 'job-board:%' OR workKey LIKE ?", [`${prefix}%`]);
    await pool.end();
  });
  it("persists run/source/vacancy JSON, source dates and degraded last success across fresh connections", async () => {
    expect((await run()).ok).toBe(true);
    const health = await readJobRefreshHealth(state.db);
    expect(health).toMatchObject({ status: "complete", productiveTiers: 2, provinceCount: 2 });
    expect(health?.lastSuccessAt).toBeTruthy();
    const source = JSON.parse((await readState(jobSourceStateKey("fixture-ON"))).lastError);
    expect(source).toMatchObject({ status: "success", count: 1, lastSuccessAt: health?.runStartedAt });
    const vacancy = JSON.parse((await readState(vacancyStateKey(job("ON").sourceUrl))).lastError);
    expect(vacancy).toMatchObject({ status: "verified", postedAt: oldPosted.toISOString(), closingAt: null });
    const listing = await caller.listJobs({});
    expect(listing.total).toBe(2);
    expect(new Date(listing.jobs[0].postedAt!).toISOString()).toBe(oldPosted.toISOString());
    expect(await caller.stats()).toMatchObject({ total: 2, refreshStatus: "complete", isStale: false, refreshedSourceCount: 2 });
    await pool.execute("INSERT INTO job_postings (title,province,sourceUrl,sourceName,lastSeenAt) VALUES ('Fixture retained inventory','ON',?,'fixture-old',DATE_SUB(NOW(),INTERVAL 18 DAY))", [`https://employer.example.test/${prefix}/retained`]);
    const failure = async () => ({ errors: ["synthetic feed unavailable"], totalFetched: 0, successfulSources: 0, failedSources: 1, sourceOutcomes: [{ source: "fixture-AB", status: "failed", count: 0 }] });
    expect((await run({ ingestAssociations: failure })).ok).toBe(false);
    const degraded = await readJobRefreshHealth(state.db);
    expect(degraded).toMatchObject({ status: "degraded", lastSuccessAt: health?.lastSuccessAt });
    expect(JSON.parse((await readState(jobSourceStateKey("fixture-AB"))).lastError)).toMatchObject({ status: "failed", lastSuccessAt: health?.runStartedAt });
    expect((await caller.listJobs({})).total).toBe(3);
    expect(await caller.stats()).toMatchObject({ total: 3, refreshStatus: "degraded", isStale: true, coverageComplete: false });
    const detail = await caller.getJob({ id: listing.jobs[0].id });
    expect(new Date(detail.postedAt!).toISOString()).toBe(oldPosted.toISOString());
    await run();
    expect(new Date((await caller.listJobs({ province: "ON" })).jobs[0].postedAt!).toISOString()).toBe(oldPosted.toISOString());
  });
  it("treats an omitted expected source as degraded even when two current tiers and provinces contribute", async () => {
    await run();
    await pool.execute("INSERT INTO job_postings (title,province,sourceUrl,sourceName,lastSeenAt) VALUES ('Fixture retained inventory','ON',?,'fixture-old',DATE_SUB(NOW(),INTERVAL 18 DAY))", [`https://employer.example.test/${prefix}/retained`]);
    const thirdSource = async () => ({ errors: [], totalFetched: 0, successfulSources: 1, failedSources: 0, sourceOutcomes: [{ source: "fixture-expected", status: "success", count: 0 }] });
    await run({ ingestMunicipal: thirdSource, skipExpiry: true });
    expect((await run()).ok).toBe(false);
    expect(await caller.stats()).toMatchObject({ total: 3, refreshStatus: "degraded", refreshedSourceCount: 2, expectedSourceCount: 3, failedSourceCount: 1 });
  });
  it("filters quarantine and explicit deadlines at the list/count/stats/detail SQL boundary while tolerating legacy JSON", async () => {
    const variants = ["future", "expired", "quarantine", "null-date", "legacy", "malformed", "stale"];
    const ids: Record<string, number> = {};
    for (const variant of variants) {
      const url = `https://employer.example.test/${prefix}/${variant}`;
      const [row] = await pool.execute<mysql.ResultSetHeader>("INSERT INTO job_postings (title,province,sourceUrl,sourceName,postedAt,lastSeenAt) VALUES (?,'ON',?,'fixture',NOW(),?)", [variant, url, variant === "stale" ? new Date(Date.now() - 22 * 86400000) : now()]);
      ids[variant] = row.insertId;
      if (variant === "legacy" || variant === "stale") continue;
      await writeVacancy(url, variant === "quarantine" ? "quarantined" : "verified", variant === "malformed" ? "not-json" : { status: "verified", postedAt: variant === "null-date" ? null : oldPosted.toISOString(), closingAt: variant === "expired" ? new Date(Date.now() - 1000).toISOString() : variant === "future" ? new Date(Date.now() + 86400000).toISOString() : null });
    }
    const list = await caller.listJobs({ province: "ON" });
    expect(list.jobs.map(x => x.title).sort()).toEqual(["future", "legacy", "malformed", "null-date"]);
    expect(list.total).toBe(4);
    expect(list.jobs.filter(x => x.title !== "future").every(x => x.postedAt === null)).toBe(true);
    expect(await caller.stats()).toMatchObject({ total: 4, refreshStatus: "unknown", isStale: true });
    for (const key of ["expired", "quarantine", "stale"]) await expect(caller.getJob({ id: ids[key] })).rejects.toMatchObject({ code: "NOT_FOUND" });
    expect((await caller.listJobs({ province: "AB" })).total).toBe(0);
    await pool.execute("INSERT INTO scheduled_work (workKey,status,lastError) VALUES (?,'failed','not-json')", [JOB_HEALTH_KEY]);
    expect(await caller.stats()).toMatchObject({ refreshStatus: "unknown", isStale: true });
    await pool.execute("UPDATE scheduled_work SET lastError=? WHERE workKey=?", [JSON.stringify({ runStartedAt: now().toISOString(), status: "complete", sources: [], runCompletedAt: "invalid" }), JOB_HEALTH_KEY]);
    expect(await caller.stats()).toMatchObject({ refreshStatus: "unknown", isStale: true, lastRefreshedAt: null });
  });
  it("retains last success and reports durable failure when an entire parser tier rejects", async () => {
    await run();
    const previous = await readJobRefreshHealth(state.db);
    await expect(run({ ingestRss: async () => { throw Error("synthetic parser failure"); } })).rejects.toThrow("synthetic parser failure");
    expect(await readJobRefreshHealth(state.db)).toMatchObject({ status: "failed", lastSuccessAt: previous?.lastSuccessAt, successfulSources: 0, failedSources: 2 });
    expect(JSON.parse((await readState(jobSourceStateKey("fixture-ON"))).lastError)).toMatchObject({ status: "degraded", lastSuccessAt: previous?.runStartedAt });
    expect((await caller.listJobs({})).total).toBe(2);
  });
  it("serializes concurrent refreshes, protects telemetry from a rejected owner, and leaves task ledger keys untouched", async () => {
    const taskKey = `${prefix}:task`;
    const task = (await claimWork(state.db, taskKey, true))!;
    const original = await readState(taskKey);
    let started!: () => void; let release!: () => void;
    const ready = new Promise<void>(resolve => { started = resolve; });
    const blocked = new Promise<void>(resolve => { release = resolve; });
    const first = run({ ingestRss: async (upsert: (job: unknown) => Promise<void>) => { started(); await blocked; return tier("ON")(upsert); } });
    await ready;
    const running = (await readState(JOB_HEALTH_KEY)).lastError;
    try {
      await expect(run()).rejects.toThrow("already running");
      expect((await readState(JOB_HEALTH_KEY)).lastError).toBe(running);
      expect(await readState(taskKey)).toEqual(original);
    } finally { release(); }
    expect((await first).ok).toBe(true);
    expect(await readState(JOB_REFRESH_LOCK_KEY)).toMatchObject({ status: "job-idle", claimToken: null, leaseUntil: null });
    await task.assertOwned();
    await task.finish("completed");
  });
  it("fences an expired owner from overwriting newer health, vacancies or inventory", async () => {
    let started!: () => void; let release!: () => void;
    const ready = new Promise<void>(resolve => { started = resolve; });
    const blocked = new Promise<void>(resolve => { release = resolve; });
    const first = run({ ingestRss: async (upsert: (job: unknown) => Promise<void>) => { started(); await blocked; return tier("ON")(upsert); } });
    const assertion = expect(first).rejects.toThrow("ownership");
    await ready;
    await pool.execute("UPDATE scheduled_work SET leaseUntil=DATE_SUB(CURRENT_TIMESTAMP,INTERVAL 1 MINUTE) WHERE workKey=?", [JOB_REFRESH_LOCK_KEY]);
    expect((await run()).ok).toBe(true);
    const newer = (await readState(JOB_HEALTH_KEY)).lastError;
    release();
    await assertion;
    expect((await readState(JOB_HEALTH_KEY)).lastError).toBe(newer);
    expect((await caller.listJobs({})).total).toBe(2);
  });
  it("does not alter retained inventory or verification during temporary destination or PDF-parser failures", async () => {
    await run();
    const before = (await readState(vacancyStateKey(job("ON").sourceUrl))).lastError;
    const [rows] = await pool.execute<any[]>("SELECT lastSeenAt,postedAt,isActive FROM job_postings WHERE sourceUrl=?", [job("ON").sourceUrl]);
    expect((await run({ verifyJob: async () => ({ status: "unavailable", postedAt: null, closingAt: null }) })).ok).toBe(false);
    expect((await readState(vacancyStateKey(job("ON").sourceUrl))).lastError).toBe(before);
    const [after] = await pool.execute<any[]>("SELECT lastSeenAt,postedAt,isActive FROM job_postings WHERE sourceUrl=?", [job("ON").sourceUrl]);
    expect(after).toEqual(rows);
    expect(JSON.parse((await readState(jobSourceStateKey("fixture-ON"))).lastError)).toMatchObject({ status: "degraded" });
    expect(await caller.stats()).toMatchObject({ refreshedSourceCount: 0, failedSourceCount: 2, isStale: true });
  });
});
