import { describe, expect, it, vi } from "vitest";
import { canonicalizeJobSourceUrl, detectProvince, normalizeUrl } from "./scripts/jobUtils.mjs";
import { parseJobDates, verifyJob } from "./scripts/jobVerification.mjs";
import { fetchAndIngest } from "./scripts/fetchJobs.mjs";
import { htmlPostingFixture } from "./jobPostingFixtures";

const job = { title: "Water Operator", company: "Fixture Authority", location: "Lévis, Quebec", province: "other", sourceName: "Fixture", sourceUrl: "https://employer.example.test/posting", description: "Work on water treatment systems." };

describe("functional employer destinations", () => {
  it.each([
    "https://employer.example.test/careersection/2/jobdetail.ftl?job=12345&lang=en",
    "https://employer.example.test/psc/jobs/EMPLOYEE/HRMS/c/HRS_HRAM_FL.HRS_CG_SEARCH_FL.GBL?Page=HRS_APP_JBPST&Action=U&SiteId=1&JobOpeningId=12345&PostingSeq=1",
    "https://employer.example.test/jobs?custom=one&custom=two&JobID=42",
  ])("retains all functional ATS selectors: %s", destination => {
    const tracked = `${destination}&utm_source=fixture&UTM_Campaign=test&gclid=tracking&fbclid=tracking#tracking`;
    expect(normalizeUrl(tracked)).toBe(destination);
    expect(canonicalizeJobSourceUrl({ ...job, sourceUrl: tracked })).toBe(destination);
  });
});

describe("precise plain-text deadlines", () => {
  it.each(["2026-10-17T12:00:00Z", "2026-10-17T08:00:00-04:00", "2026-10-17T14:00:00.000+02:00"])("keeps the exact instant %s", deadline => {
    expect(parseJobDates(`Application Deadline: ${deadline}`).closingAt?.toISOString()).toBe("2026-10-17T12:00:00.000Z");
  });
  it.each([
    ["2026-10-17T11:59:59.999Z", "verified"],
    ["2026-10-17T12:00:00.000Z", "verified"],
    ["2026-10-17T12:00:00.001Z", "expired"],
  ])("honors the existing strict expiry boundary at %s", async (clock, status) => {
    const result = await verifyJob(job, { now: new Date(clock), fetchDocument: async () => htmlPostingFixture(`<script type="application/ld+json">${JSON.stringify({ "@type": "JobPosting", title: job.title, hiringOrganization: { name: job.company }, description: "Application Deadline: 2026-10-17T08:00:00-04:00" })}</script>`) });
    expect(result.status).toBe(status);
    expect(result.closingAt?.toISOString()).toBe("2026-10-17T12:00:00.000Z");
  });
  it("keeps the existing date-only end-of-day policy", () => {
    expect(parseJobDates("Closing: 2026-10-17").closingAt?.toISOString()).toBe("2026-10-17T23:59:59.999Z");
    expect(parseJobDates("Closing: September 20th, 2026").closingAt?.toISOString()).toBe("2026-09-20T23:59:59.999Z");
  });
});

describe("province inference", () => {
  it.each([
    ["Lévis, Quebec Water Operator Work on water treatment systems.", "other"],
    ["Toronto, ON", "ON"], ["Ontario", "ON"], ["Fort McMurray, Alberta — Ontario Water Works Association listing", "AB"],
  ])("classifies %s as %s", (input, expected) => expect(detectProvince(input)).toBe(expected));

  it.each([
    [job, "other"],
    [{ ...job, location: "Toronto, ON", province: "ON", description: "Work at British Columbia equipment supplier" }, "ON"],
    [{ ...job, location: null, province: "BC", description: "Ontario source association" }, "BC"],
  ])("does not override structured province/location using description prose", async (candidate, expected) => {
    const execute = vi.fn(async (query: string) => query.startsWith("SELECT") ? [[]] : [{ affectedRows: 1 }]);
    const empty = async () => ({ errors: [], totalFetched: 0 });
    await fetchAndIngest({ databaseUrl: "fixture-only", createConnection: async () => ({ execute, end: vi.fn() }), ingestRss: async upsert => { await upsert(candidate); return { errors: [], totalFetched: 1 }; }, ingestAssociations: empty, ingestMunicipal: empty, verifyJob: async () => ({ status: "verified", closingAt: null, postedAt: null }) });
    const insert = execute.mock.calls.find(([query]) => query.startsWith("INSERT INTO job_postings"));
    expect(insert).toBeDefined();
    expect((insert as unknown as [string, unknown[]])[1][3]).toBe(expected);
  });
});
