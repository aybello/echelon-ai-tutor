import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { fetchJobDocument, parseJobDates, verifyJob } from "./scripts/jobVerification.mjs";
import { postingTransportFixture } from "./jobPostingFixtures";

const dayEnd = new Date("2026-10-22T23:59:59.999Z");
const afterExplicitTime = new Date("2026-10-22T13:00:00Z");
const fields = [
  { label: "Application Close", date: "22/10/2026" },
  { label: "Closing Date", date: "October 22, 2026" },
  { label: "Application Deadline", date: "22 October 2026" },
  { label: "Apply By", date: "October 22nd, 2026" },
  { label: "Deadline", date: "2026-10-22" },
];
const unsupportedSuffixes = [
  " - (12:30 UTC)", " — ([at12:30UTC])", " ; [ (12:30 UTC) ]", " : (12.30 UTC)",
  " (12h30 UTC)", " at12:30UTC", " at 12:30 UTC", " (12:30 p.m. UTC)",
  " - (12 pm UTC)", " ; [12PM UTC]", " at 12 a.m. UTC", " at noon UTC",
  " — (midnight UTC)", "T12:30:00", " - (at midnight UTC)",
];
const incidentalSuffixes = [
  "", " Once the closing date has passed, contact the office.",
  " Applications are reviewed at the office.", " - Applications are reviewed at 12:30 UTC.",
  " ; (Applications are reviewed at noon UTC.)", " - (Contact the office before midnight.)",
];
const fixtures = [
  {
    name: "Ottawa", file: "ottawa-process-operator-20261017.html", originalLabel: "Application Close", originalDate: "22/10/2026",
    job: { title: "Process Operator/Process Operator-in-Training 42hrs", company: "City of Ottawa", sourceUrl: "https://jobs-emplois.ottawa.ca/city-jobs/job/Ottawa%2C-ON-Process-OperatorProcess-Operator-in-Training-42hrs-ON-Ottawa%2C-ON/1291635047/" },
  },
  {
    name: "Manitoba", file: "manitoba-water-operations-20261017.html", originalLabel: "Closing Date", originalDate: "October 25, 2026",
    job: { title: "Water Operations Technician", company: "Department of Transportation and Infrastructure", sourceUrl: "https://jobsearch.gov.mb.ca/advancedResult.action?ID=128944" },
  },
].map(item => ({ ...item, raw: readFileSync(new URL(`./__fixtures__/job-postings/${item.file}`, import.meta.url), "utf8") }));

async function evaluate(item: typeof fixtures[number], field: typeof fields[number], suffix = "", now = afterExplicitTime) {
  expect(item.raw).toContain(`${item.originalLabel}:`);
  expect(item.raw).toContain(item.originalDate);
  const raw = item.raw.replace(`${item.originalLabel}:`, `${field.label}:`).replace(item.originalDate, `${field.date}${suffix}`);
  const transport = postingTransportFixture([{ body: raw, headers: { "content-type": "text/html" } }]);
  const result = await verifyJob(item.job, { now, fetchDocument: (url, options) => fetchJobDocument(url, { ...transport, ...options }) });
  expect(transport.lookup).toHaveBeenCalledOnce();
  expect(transport.get).toHaveBeenCalledOnce();
  expect(transport.get.mock.calls[0][0].toString()).toBe(item.job.sourceUrl);
  return result;
}

describe.each(fields)("$label: $date immediate closing suffix validation", field => {
  it.each(unsupportedSuffixes)("rejects unsupported explicit time %s without a guessed end-of-day", suffix => {
    expect(parseJobDates(`${field.label}:${field.date}${suffix}`)).toEqual({ postedAt: null, closingAt: null });
  });
  it.each(incidentalSuffixes)("preserves bare dates and unrelated later prose %s", suffix => {
    expect(parseJobDates(`${field.label}:${field.date}${suffix}`).closingAt).toEqual(dayEnd);
  });
  it.each(["Closing Date: November 22, 2026", "Application Close: 23/10/2026", "Closing: 2026-11-22T12:30:00Z"])("does not fall back to a later field %s", later => {
    expect(parseJobDates(`${field.label}: ${field.date} - (12:30 UTC) ${later}`).closingAt).toBeNull();
  });
});

it.each([
  "Closing Date: October22,2026 at12:30UTC", "Closing Date: October 22,2026 at12:30UTC",
  "Closing: 2026-10-22T12:30:00", "Application Close: 31/02/2026", "Closing Date: February 31, 2026",
  "Closing Date: 29 February 2026", "Closing: 2026-02-29", "Closing: 2026-02-31T12:30:00Z",
  "Closing: 2026-13-22", "Closing: 2026-00-22", "Closing: 2026-10-00",
])("rejects malformed or unsupported calendar value without later fallback: %s", text => {
  expect(parseJobDates(text).closingAt).toBeNull();
  expect(parseJobDates(`${text} Application Close: 23/10/2026`).closingAt).toBeNull();
  expect(parseJobDates(`${text} Closing Date: November 22, 2026`).closingAt).toBeNull();
});

it.each([
  ["2026-10-22T12:30:00Z", "2026-10-22T12:30:00.000Z"],
  ["2026-10-22T08:30:00-04:00", "2026-10-22T12:30:00.000Z"],
  ["2026-10-22T14:30:00.123+0200", "2026-10-22T12:30:00.123Z"],
  ["2026-10-22T12:30Z", "2026-10-22T12:30:00.000Z"],
])("keeps the supported zoned ISO instant %s", (date, expected) => {
  expect(parseJobDates(`Closing Date: ${date}`).closingAt?.toISOString()).toBe(expected);
});
it.each(["29/02/2028", "February 29th, 2028", "29 February 2028", "2028-02-29"])("preserves valid leap dates %s", date => {
  expect(parseJobDates(`Application Close: ${date}`).closingAt?.toISOString()).toBe("2028-02-29T23:59:59.999Z");
});
it("preserves posted-date parsing independently of an unresolved closing field", () => {
  expect(parseJobDates("Posted: October 17, 2026 Closing: October 22, 2026 - (12:30 UTC)")).toEqual({ postedAt: new Date("2026-10-17T00:00:00Z"), closingAt: null });
});

describe.each(fixtures)("$name captured detail using socket-free transport", item => {
  describe.each(fields)("$label $date", field => {
    it.each(unsupportedSuffixes)("is unavailable, not verified/expired, after ambiguous deadline %s", async suffix => {
      expect(await evaluate(item, field, suffix)).toMatchObject({ status: "unavailable", closingAt: null });
    });
    it.each(incidentalSuffixes)("retains date-only end-of-day semantics with prose %s", async suffix => {
      expect(await evaluate(item, field, suffix)).toMatchObject({ status: "verified", closingAt: dayEnd });
    });
    it("does not borrow a later valid field after an unsupported timed deadline", async () => {
      expect(await evaluate(item, field, " - (12:30 UTC) Closing Date: November 22, 2026")).toMatchObject({ status: "unavailable", closingAt: null });
    });
  });
  it.each([
    "October22,2026 at12:30UTC", "February 31, 2026", "29 February 2026", "2026-02-29", "2026-02-31T12:30:00Z",
  ])("does not turn malformed value %s into expiry or verification", async date => {
    expect(await evaluate(item, { label: "Closing Date", date })).toMatchObject({ status: "unavailable", closingAt: null });
  });
  it("preserves the exact zoned ISO expiry boundary", async () => {
    const field = { label: "Closing Date", date: "2026-10-22T08:30:00-04:00" };
    const exact = new Date("2026-10-22T12:30:00Z");
    expect(await evaluate(item, field, "", exact)).toMatchObject({ status: "verified", closingAt: exact });
    expect(await evaluate(item, field, "", new Date(exact.getTime() + 1))).toMatchObject({ status: "expired", closingAt: exact });
  });
  it("retains the date-only expiry boundary", async () => {
    expect(await evaluate(item, fields[0], "", dayEnd)).toMatchObject({ status: "verified", closingAt: dayEnd });
    expect(await evaluate(item, fields[0], "", new Date(dayEnd.getTime() + 1))).toMatchObject({ status: "expired", closingAt: dayEnd });
  });
});
