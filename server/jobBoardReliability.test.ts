import { afterEach, describe, expect, it, vi } from "vitest";
import { verifyJob, parseJobDates, fetchJobDocument, pdfToText } from "./scripts/jobVerification.mjs";
import { fetchAndIngest } from "./scripts/fetchJobs.mjs";
import { assertJobStateKey, jobSourceStateKey, vacancyStateKey, mergeSourceOutcomes, summarizeJobHealth, JOB_HEALTH_KEY, type JobRefreshHealth } from "./jobBoardState";
import { htmlPostingFixture, pdfPostingFixture, postingTransportFixture, type FetchDocumentForFixture } from "./jobPostingFixtures";
const now = new Date("2026-10-03T09:00:00Z");
const job = { title: "Source Water Hydrogeologist", company: "Fixture Water Authority", sourceUrl: "https://employer.example.test/job-opportunities/", sourceName: "CWRA", location: "Ontario", province: "ON" };
const retrieveDocument = fetchJobDocument as FetchDocumentForFixture;
const verified = async (input: any) => ({ status: "verified" as const, closingAt: null, postedAt: input.postedAt ?? null });
const empty = async () => ({ errors: [], totalFetched: 0, successfulSources: 0, failedSources: 0, sourceOutcomes: [] });
function connection(previous?: JobRefreshHealth) {
  const execute = vi.fn(async (query: string, params?: any[]) => {
    if (query.startsWith("SELECT lastError")) return [previous ? [{ lastError: JSON.stringify(previous) }] : []];
    if (query.startsWith("SELECT id")) return [[{ id: 1 }]];
    return [{ affectedRows: 1 }];
  });
  return { execute, end: vi.fn().mockResolvedValue(undefined) };
}
function tier(province: string, status = "success") {
  return async (upsert: (input: unknown) => Promise<void>) => {
    await upsert({ ...job, title: `Water operator ${province}`, location: province, province, sourceName: province, sourceUrl: `https://employer.example.test/${province}`, postedAt: new Date("2026-07-02T00:00:00Z") });
    return { errors: status === "success" ? [] : ["source unavailable"], totalFetched: 1, successfulSources: status === "success" ? 1 : 0, failedSources: status === "success" ? 0 : 1, sourceOutcomes: [{ source: province, status, count: 1 }] };
  };
}
afterEach(() => { vi.restoreAllMocks(); vi.unstubAllGlobals(); });
describe("vacancy truth", () => {
  it("excludes the audited August 3 PDF deadline using parsed content, not a blacklist", async () => {
    const result = await verifyJob({ ...job, title: "Operations Manager" }, { now, fetchDocument: async () => pdfPostingFixture(`${job.company} Job Title: Operations Manager Application Deadline: August 3, 2026 Start Date: September 8, 2026`) });
    expect(result.status).toBe("expired");
    expect(result.closingAt?.toISOString()).toBe("2026-08-03T23:59:59.999Z");
  });
  it("retains inventory when a generic GRCA-style board has no matching vacancy evidence", async () => {
    expect((await verifyJob(job, { now, fetchDocument: async () => htmlPostingFixture("<h1>Current opportunities</h1><p>No current vacancies. Careers</p>") })).status).toBe("unavailable");
  });
  it("retains future and open-until-filled postings and source dates", async () => {
    for (const deadline of ["Application Deadline: October 18, 2026", "Open until filled"]) {
      const result = await verifyJob(job, { now, fetchDocument: async () => pdfPostingFixture(`${job.company} Job Title: ${job.title} Posted: July 2, 2026 ${deadline}`) });
      expect(result.status).toBe("verified");
      expect(result.postedAt?.toISOString()).toBe("2026-07-02T00:00:00.000Z");
    }
    expect(parseJobDates("Closing Date: September 20th, 2026").closingAt?.toISOString()).toBe("2026-09-20T23:59:59.999Z");
  });
  it("distinguishes unavailable from a definitive missing posting", async () => {
    expect((await verifyJob(job, { now, fetchDocument: async () => { throw Error("timeout"); } })).status).toBe("unavailable");
    expect((await verifyJob(job, { now, fetchDocument: async () => ({ missing: true, text: "" }) })).status).toBe("missing");
  });
  it("routes bounded PDF bytes to the document parser", async () => {
    const extract = vi.fn().mockResolvedValue("Application Deadline: August 3, 2026");
    const result = await retrieveDocument("https://employer.example.test/posting.pdf", { ...postingTransportFixture([{ body: "%PDF-fixture" }]), pdfToText: extract });
    expect(extract).toHaveBeenCalledOnce();
    expect(parseJobDates(result.text).closingAt?.getUTCMonth()).toBe(7);
    expect(result).toMatchObject({ isPdf: true, contentType: "application/pdf", finalUrl: "https://employer.example.test/posting.pdf", raw: "Application Deadline: August 3, 2026" });
  });
  it("does not quarantine PDFs for a missing parser or empty OCR text", async () => {
    for (const extract of [async () => { throw Error("missing runtime binary"); }, async () => ""]) {
      const fetchDocument = (url: string) => retrieveDocument(url, { ...postingTransportFixture([{ body: "%PDF-fixture" }]), pdfToText: extract });
      expect((await verifyJob(job, { now, fetchDocument })).status).toBe("unavailable");
    }
    await expect(retrieveDocument(job.sourceUrl, { ...postingTransportFixture([{ body: "<title>Just a moment</title>" }]), pdfToText })).rejects.toThrow("unavailable");
  });
});
describe("durable refresh health", () => {
  it("rejects task keys in telemetry and retains omitted sources as degraded", () => {
    for (const key of [JOB_HEALTH_KEY, jobSourceStateKey("CWRA"), vacancyStateKey(job.sourceUrl)]) expect(() => assertJobStateKey(key)).not.toThrow();
    for (const key of ["job:exam-reminders:2026-10-03", "email:receipt", "job-board:refresh-lock", "job-board:source:raw"]) expect(() => assertJobStateKey(key)).toThrow("namespace");
    const previous = mergeSourceOutcomes([], [{ source: "CWRA", status: "success", count: 1 }], "2026-10-02T00:00:00Z");
    expect(mergeSourceOutcomes(previous, [], now.toISOString())[0]).toMatchObject({ status: "degraded", lastSuccessAt: previous[0].lastSuccessAt });
  });
  it("retains source last success across degraded outcomes and identifies missed six-hour cadence", () => {
    const sources = mergeSourceOutcomes([], [{ source: "CWRA", status: "success", count: 1 }], "2026-10-02T00:00:00Z");
    const next = mergeSourceOutcomes(sources, [{ source: "CWRA", status: "failed", count: 0 }], now.toISOString());
    expect(next[0].lastSuccessAt).toBe("2026-10-02T00:00:00Z");
    const health: JobRefreshHealth = { runStartedAt: now.toISOString(), runCompletedAt: now.toISOString(), lastSuccessAt: null, status: "degraded", sources: next, successfulSources: 0, failedSources: 1, productiveTiers: 0, provinceCount: 0 };
    expect(summarizeJobHealth(health, now)).toMatchObject({ isStale: true, coverageComplete: false, failedSourceCount: 1 });
    expect(summarizeJobHealth({ ...health, status: "complete", runCompletedAt: "2026-10-03T02:59:59Z" }, now).isStale).toBe(true);
  });
  it("writes durable degraded coverage and never bulk-expires inventory on failed feeds", async () => {
    const previous: JobRefreshHealth = { runStartedAt: "2026-10-02T00:00:00Z", runCompletedAt: "2026-10-02T00:01:00Z", status: "complete", lastSuccessAt: "2026-10-02T00:01:00Z", sources: [], successfulSources: 2, failedSources: 0, productiveTiers: 2, provinceCount: 2 };
    const conn = connection(previous);
    const result = await fetchAndIngest({ databaseUrl: "fixture", createConnection: async () => conn, now: () => now, verifyJob: verified, ingestRss: tier("ON"), ingestAssociations: tier("AB"), ingestMunicipal: async () => ({ errors: ["failure"], totalFetched: 0, failedSources: 1, successfulSources: 0, sourceOutcomes: [{ source: "municipal", status: "failed", count: 0 }] }) });
    expect(result.ok).toBe(false);
    expect(conn.execute.mock.calls.some(([query]) => query.includes("lastSeenAt <"))).toBe(false);
    const writes = conn.execute.mock.calls.filter(([query, params]) => query.startsWith("INSERT INTO scheduled_work") && params?.[0] === JOB_HEALTH_KEY);
    expect(JSON.parse(writes.at(-1)![1]![2])).toMatchObject({ status: "degraded", failedSources: 1, lastSuccessAt: previous.lastSuccessAt });
  });
  it("does not change retained inventory, seen time or verification state on temporary destination failure", async () => {
    const conn = connection();
    await fetchAndIngest({ databaseUrl: "fixture", createConnection: async () => conn, now: () => now, verifyJob: async () => ({ status: "unavailable", closingAt: null, postedAt: null }), ingestRss: tier("ON"), ingestAssociations: empty, ingestMunicipal: empty });
    expect(conn.execute.mock.calls.some(([query]) => /UPDATE job_postings|INSERT INTO job_postings/.test(query))).toBe(false);
    expect(conn.execute.mock.calls.filter(([query, params]) => query.includes("scheduled_work") && params?.[0]?.startsWith("job-board:vacancy:"))).toHaveLength(0);
  });
  it("does not mutate retained employer records or verification when a generic board repeats the role", async () => {
    const conn = connection();
    const ingest = async (upsert: (input: unknown) => Promise<void>) => {
      await upsert(job);
      return { errors: [], totalFetched: 1, successfulSources: 1, failedSources: 0, sourceOutcomes: [{ source: "CWRA", status: "success", count: 1 }] };
    };
    const result = await fetchAndIngest({ databaseUrl: "fixture", createConnection: async () => conn, now: () => now,
      verifyJob: (input: any) => verifyJob(input, { now, fetchDocument: async () => htmlPostingFixture(`<h1>Careers at ${job.company}</h1><p>${job.title} Closing: November 1, 2026</p>`) }),
      ingestRss: ingest, ingestAssociations: empty, ingestMunicipal: empty });
    expect(result.ok).toBe(false);
    expect(conn.execute.mock.calls.some(([query]) => /UPDATE job_postings|INSERT INTO job_postings/.test(query))).toBe(false);
    expect(conn.execute.mock.calls.filter(([query, params]) => query.includes("scheduled_work") && params?.[0]?.startsWith("job-board:vacancy:"))).toHaveLength(0);
  });
  it("keeps source dates on repeated refreshes and never stamps seen time as posting time", async () => {
    const conn = connection();
    for (let day = 3; day <= 4; day++) await fetchAndIngest({ databaseUrl: "fixture", createConnection: async () => conn, now: () => new Date(`2026-10-0${day}T09:00:00Z`), verifyJob: verified, ingestRss: tier("ON"), ingestAssociations: tier("AB"), ingestMunicipal: empty });
    const updates = conn.execute.mock.calls.filter(([query]) => query.includes("postedAt = ?"));
    expect(updates).toHaveLength(4);
    for (const [, params] of updates) expect(params?.[11]).toEqual(new Date("2026-07-02T00:00:00Z"));
  });
});
