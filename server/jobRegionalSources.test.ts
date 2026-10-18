import { afterEach, describe, expect, it, vi } from "vitest";
import { ingestMunicipal } from "./scripts/fetchJobsMunicipal.mjs";
import { ingestRss } from "./scripts/fetchJobsRss.mjs";
import { verifyJob } from "./scripts/jobVerification.mjs";

const OTTAWA = "https://jobs-emplois.ottawa.ca/city-jobs/search/?q=water&sortColumn=referencedate&sortDirection=desc";
const MANITOBA = "https://jobsearch.gov.mb.ca/search.action";
const ottawaPath = "/city-jobs/job/Ottawa%2C-ON-Process-OperatorProcess-Operator-in-Training-42hrs-ON-Ottawa%2C-ON/1291635047/";
// Public HTML structure captured 2026-10-17. No sessions, cookies or credentials.
const ottawaHtml = `<table id="searchresults"><tbody>
<tr><td><a href="${ottawaPath}" class="jobTitle-link">Process Operator/Process Operator-in-Training 42hrs</a><a class="jobTitle-link" href="${ottawaPath}">Process Operator/Process Operator-in-Training 42hrs</a></td></tr>
<tr><td><a href="/city-jobs/job/Ottawa-Waste-Collection-Operator/1291457147/">Waste Collection Operator</a></td></tr>
<tr><td><a href="https://unrelated.example/city-jobs/job/Water-Operator/123/">Water Operator</a><a href="/city-jobs/search/?q=water">Water operator careers</a></td></tr>
</tbody></table>`;
const manitobaHtml = `<table id="results_list_table"><tbody>
<tr style="cursor:pointer;" id="128944" onmouseover="tip128944();"><td>44505</td><td>Water Operations Technician</td><td>Department of Transportation and Infrastructure</td><td onclick="">Morris MB</td><td class="dt-nowrap">2026-10-08</td><td class="dt-nowrap">2026-10-25</td><td></td></tr>
<tr id="129963"><td>45281</td><td>Painter</td><td>Housing, Addictions and Homelessness</td><td>Winnipeg MB</td><td>2026-06-19</td><td>2026-11-03</td><td>Apply Now</td></tr>
<tr id="bad"><td>44505</td><td>Water Operator</td><td>Department</td><td>Morris MB</td><td>2026-10-08</td><td>2026-10-25</td><td></td></tr>
</tbody></table>`;

function regionalFetch(responses: Record<string, string | Response> = {}) {
  return vi.fn(async (url: string) => {
    if (!(url in responses)) throw new Error("Unrelated source intentionally offline in fixture");
    const value = responses[url];
    return typeof value === "string" ? new Response(value) : value;
  });
}
afterEach(() => { vi.restoreAllMocks(); vi.unstubAllGlobals(); });
describe("regional source adapter repair", () => {
  it("extracts real Ottawa vacancy destinations once, including the source's water process-operator title", async () => {
    const fetch = regionalFetch({ [OTTAWA]: ottawaHtml }); vi.stubGlobal("fetch", fetch);
    const jobs: any[] = [];
    const result = await ingestMunicipal(async job => { jobs.push(job); });
    expect(result.sourceOutcomes).toContainEqual({ source: "City of Ottawa", status: "success", count: 1 });
    expect(jobs).toEqual([expect.objectContaining({ title: "Process Operator/Process Operator-in-Training 42hrs", company: "City of Ottawa", location: "Ottawa, ON", province: "ON", sourceName: "City of Ottawa", sourceUrl: `https://jobs-emplois.ottawa.ca${ottawaPath}`, postedAt: null })]);
    expect(fetch).toHaveBeenCalledWith(OTTAWA, expect.anything());
  });
  it.each(["?FOCUS=Applicant", "?ID=1291635048", "?redirect=https%3A%2F%2Fevil.example.test", "#another-vacancy"])("rejects rather than erases unsupported Ottawa destination suffix %s", async suffix => {
    vi.stubGlobal("fetch", regionalFetch({ [OTTAWA]: ottawaHtml.replaceAll(ottawaPath, ottawaPath + suffix) }));
    const collect = vi.fn(); const result = await ingestMunicipal(collect);
    expect(result.sourceOutcomes).toContainEqual({ source: "City of Ottawa", status: "success", count: 0 });
    expect(collect).not.toHaveBeenCalled();
  });
  it("uses Manitoba's internal row ID, actual department employer and location, not advert number or search URL", async () => {
    vi.stubGlobal("fetch", regionalFetch({ [MANITOBA]: manitobaHtml }));
    const jobs: any[] = [];
    const result = await ingestMunicipal(async job => { jobs.push(job); });
    expect(result.sourceOutcomes).toContainEqual({ source: "Manitoba Civil Service", status: "success", count: 1 });
    expect(jobs).toEqual([expect.objectContaining({ title: "Water Operations Technician", company: "Department of Transportation and Infrastructure", location: "Morris MB", province: "MB", sourceName: "Manitoba Civil Service", sourceUrl: "https://jobsearch.gov.mb.ca/advancedResult.action?ID=128944", postedAt: new Date("2026-10-08T00:00:00Z") })]);
  });
  it.each(["<html>Just a moment... cf-chl-challenge</html>", "<html>Sign in to view jobs</html>", '<table id="other"><tr><td>Water Operator</td></tr></table>'])("never reports a challenge or changed layout as successful empty inventory: %s", async html => {
    vi.stubGlobal("fetch", regionalFetch({ [OTTAWA]: html, [MANITOBA]: html }));
    const collect = vi.fn(); const result = await ingestMunicipal(collect);
    for (const source of ["City of Ottawa", "Manitoba Civil Service", "City of Surrey"]) expect(result.sourceOutcomes).toContainEqual({ source, status: "failed", count: 0 });
    expect(collect).not.toHaveBeenCalled();
  });
  it("allows an explicitly present empty result table without inventing candidates", async () => {
    vi.stubGlobal("fetch", regionalFetch({ [OTTAWA]: '<table id="searchresults"><tbody></tbody></table>', [MANITOBA]: '<table id="results_list_table"><tbody></tbody></table>' }));
    const collect = vi.fn(); const result = await ingestMunicipal(collect);
    for (const source of ["City of Ottawa", "Manitoba Civil Service"]) expect(result.sourceOutcomes).toContainEqual({ source, status: "success", count: 0 });
    expect(collect).not.toHaveBeenCalled();
  });
  it("keeps real HTTP failures failed rather than silently returning an empty board", async () => {
    vi.stubGlobal("fetch", regionalFetch({ [OTTAWA]: new Response("Unavailable", { status: 503 }), [MANITOBA]: new Response("Forbidden", { status: 403 }) }));
    const result = await ingestMunicipal(vi.fn());
    expect(result.errors).toContain(`Scrape failed (City of Ottawa): HTTP 503 from ${OTTAWA}`);
    expect(result.errors).toContain(`Scrape failed (Manitoba Civil Service): HTTP 403 from ${MANITOBA}`);
  });
  it("does not replace a tighter caller cancellation with the local request deadline", async () => {
    const caller = AbortSignal.abort(new Error("caller budget exhausted"));
    const fetch = vi.fn(async (url: string, options: RequestInit) => {
      if ([OTTAWA, MANITOBA].includes(url)) options.signal!.throwIfAborted();
      throw new Error("fixture");
    });
    vi.stubGlobal("fetch", fetch); const result = await ingestMunicipal(vi.fn(), { signal: caller });
    for (const source of ["City of Ottawa", "Manitoba Civil Service"]) expect(result.errors).toContain(`Scrape failed (${source}): caller budget exhausted`);
  });
  it("retains the source-local eight-second cap even with a longer caller signal", async () => {
    const timeout = vi.spyOn(AbortSignal, "timeout");
    const fetch = regionalFetch({ [OTTAWA]: ottawaHtml, [MANITOBA]: manitobaHtml }); vi.stubGlobal("fetch", fetch);
    const caller = new AbortController(); await ingestMunicipal(vi.fn(), { signal: caller.signal });
    expect(timeout.mock.calls.filter(([ms]) => ms === 8000)).toHaveLength(2);
    for (const [url, options] of fetch.mock.calls as any) if ([OTTAWA, MANITOBA].includes(url)) expect(options.signal).not.toBe(caller.signal);
  });
  it("keeps expiry and unrecognized employer/application evidence fail-closed", async () => {
    const job = { title: "Water Operations Technician", company: "Department of Transportation and Infrastructure", sourceUrl: "https://jobsearch.gov.mb.ca/advancedResult.action?ID=128944" };
    const document = vi.fn(async () => ({ missing: false, raw: "<div><h2>Water Operations Technician</h2>Department of Transportation and Infrastructure Closing Date: October 25, 2026</div>", text: "Water Operations Technician Department of Transportation and Infrastructure Closing Date: October 25, 2026" }));
    expect(await verifyJob(job, { fetchDocument: document })).toMatchObject({ status: "unavailable" });
    expect(await verifyJob({ ...job, closingAt: new Date("2026-10-16T23:59:59Z") }, { now: new Date("2026-10-17T00:00:00Z"), fetchDocument: document })).toMatchObject({ status: "expired" });
    expect(document).toHaveBeenCalledTimes(1);
  });
  it("preserves exact Job Bank timeout-route failures without retrying or claiming feed success", async () => {
    vi.stubGlobal("fetch", vi.fn(async (url: string) => {
      if (url.includes("owwa.ca")) return new Response("<rss><channel /></rss>");
      throw new DOMException("The operation was aborted due to timeout", "TimeoutError");
    }));
    const collect = vi.fn(); const result = await ingestRss(collect, { signal: AbortSignal.timeout(12000) });
    expect(result).toMatchObject({ totalFetched: 0, successfulSources: 1, failedSources: 6 });
    for (const query of ["fn21=92101", "fn21=92011", "searchstring=water+treatment+operator", "searchstring=wastewater+treatment+operator"]) expect(result.errors.some(error => error.includes(`https://www.jobbank.gc.ca/jobsearch/feed/jobSearchRSSfeed?${query}&sort=D&rows=100`) && error.includes("timeout"))).toBe(true);
    expect(collect).not.toHaveBeenCalled();
  });
});
