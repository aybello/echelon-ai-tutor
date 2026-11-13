import { readFileSync } from "node:fs";
import { describe, expect, it, vi } from "vitest";
import { parseSwwa } from "./scripts/fetchJobsAssociations.mjs";
import { verifyJob } from "./scripts/jobVerification.mjs";

const captured = readFileSync(new URL("./fixtures/jobs/swwa-careers-20261019.html", import.meta.url), "utf8");
const jobs = () => parseSwwa(captured);
const yorktonTitle = "Public Works - Water & Sewer Operations Manager";

describe("SWWA current official card metadata", () => {
  it("reads plain paragraph employer headers rather than requiring obsolete strong tags", () => {
    expect(jobs().map(({ title, company }) => ({ title, company }))).toEqual([
      { title: "Maintenance Shift Lead", company: "EPCOR" },
      { title: yorktonTitle, company: "City of Yorkton" },
    ]);
  });
  it("uses the labelled employment type, not incidental contract prose", () => {
    expect(jobs().map(job => job.jobType)).toEqual(["full-time", "full-time"]);
    expect(parseSwwa(captured.replaceAll('Position Type: </span>Full Time', 'Position Type: </span>Part Time')).map(job => job.jobType)).toEqual(["part-time", "part-time"]);
  });
  it("reads the board's evidenced month/day/two-digit-year closing columns", () => {
    expect(jobs().map(job => job.closingAt?.toISOString())).toEqual(["2026-12-31T23:59:59.999Z", "2026-10-22T23:59:59.999Z"]);
  });
  it("preserves the exact source-provided destination including its functional query", () => {
    expect(jobs().map(job => job.sourceUrl)).toEqual([
      "https://www.epcor.com/ca/en/careers/jobs/job-listing.html?eId=od3WAfww",
      "https://recruiting.ultipro.ca/YOR5000YRKC/JobBoard/6fe2375e-a6fd-49e6-9dba-ec484c015092/OpportunityDetail?opportunityId=7f79caaa-93d6-467c-b4cd-ccbb911cc2a1",
    ]);
  });
  it.each(["02/30/26", "13/22/26", "10/22/26 at noon", "10/22/26 12:30", "10/22/2026", "22/10/26", "", "Open until filled"])("does not invent or extend a deadline from unsupported closing value %s", closing => {
    const parsed = parseSwwa(captured.replace("10/22/26", closing));
    expect(parsed[1].closingAt).toBeNull();
    expect(parsed[0].closingAt?.toISOString()).toBe("2026-12-31T23:59:59.999Z");
  });
  it("does not infer an employer from prose when the role header no longer matches", () => {
    const parsed = parseSwwa(captured.replace('<p>Public Works - Water &amp; Sewer Operations Manager</p>', '<p>Another Water Operator</p>'));
    expect(parsed[1].company).toBe("SWWA member employer");
    expect(parsed[0].company).toBe("EPCOR");
  });
  it("does not reuse a neighboring card's employer", () => {
    expect(parseSwwa(captured.replace('<p>City of Yorkton</p>', '<p></p>'))[1].company).toBe("SWWA member employer");
  });
  it("does not promote unknown labelled types using description prose", () => {
    expect(parseSwwa(captured.replaceAll('Position Type: </span>Full Time', 'Position Type: </span>Unknown')).map(job => job.jobType)).toEqual([null, null]);
  });
  it.each(["constructor", "__proto__"])("keeps inherited-looking external type label %s unknown", type => {
    expect(parseSwwa(captured.replaceAll('Position Type: </span>Full Time', `Position Type: </span>${type}`)).map(job => job.jobType)).toEqual([null, null]);
  });
  it("retains expiry before transport and strict destination verification", async () => {
    const job = jobs()[1];
    const fetchDocument = vi.fn(async () => ({ missing: false, raw: `<h1>${job.title}</h1><p>${job.company}</p>`, text: `${job.title} ${job.company}` }));
    expect(await verifyJob(job, { now: new Date("2026-10-23T00:00:00Z"), fetchDocument })).toMatchObject({ status: "expired" });
    expect(fetchDocument).not.toHaveBeenCalled();
    expect(await verifyJob(job, { now: new Date("2026-10-19T12:00:00Z"), fetchDocument })).toMatchObject({ status: "unavailable" });
  });
});
