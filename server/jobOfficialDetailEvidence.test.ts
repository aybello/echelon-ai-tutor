import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { fetchJobDocument, parseJobDates, plainJobText, verifyJob } from "./scripts/jobVerification.mjs";
import { htmlPostingFixture, postingTransportFixture } from "./jobPostingFixtures";

// Already captured public evidence; unrelated session/config fields omitted as documented in the fixture README.
const ottawaRaw = readFileSync(new URL("./__fixtures__/job-postings/ottawa-process-operator-20261017.html", import.meta.url), "utf8");
const manitobaRaw = readFileSync(new URL("./__fixtures__/job-postings/manitoba-water-operations-20261017.html", import.meta.url), "utf8");
const now = new Date("2026-10-17T12:00:00Z");
const cases = [
  { name: "Ottawa", raw: ottawaRaw, job: { title: "Process Operator/Process Operator-in-Training 42hrs", company: "City of Ottawa", sourceUrl: "https://jobs-emplois.ottawa.ca/city-jobs/job/Ottawa%2C-ON-Process-OperatorProcess-Operator-in-Training-42hrs-ON-Ottawa%2C-ON/1291635047/" }, close: "2026-10-22T23:59:59.999Z", id: "1291635047", otherId: "1291635048", landing: "https://jobs-emplois.ottawa.ca/city-jobs/search/", date: "22/10/2026" },
  { name: "Manitoba", raw: manitobaRaw, job: { title: "Water Operations Technician", company: "Department of Transportation and Infrastructure", sourceUrl: "https://jobsearch.gov.mb.ca/advancedResult.action?ID=128944" }, close: "2026-10-25T23:59:59.999Z", id: "128944", otherId: "128945", landing: "https://jobsearch.gov.mb.ca/search.action", date: "October 25, 2026" },
];
const evaluate = (item: typeof cases[number], raw = item.raw, job = item.job, finalUrl = job.sourceUrl, at = now) => verifyJob(job, { now: at, fetchDocument: async () => htmlPostingFixture(raw, finalUrl) });
const replaceRoleHeading = (item: typeof cases[number], replacement: string) => item.raw.replace(/<(h[12])\b[^>]*>[\s\S]*?<\/\1\s*>/gi, heading => heading.includes(item.job.title) ? replacement : heading);

describe.each(cases)("$name official single-vacancy detail evidence", item => {
  it("finally verifies the unmodified captured detail with its own closing date", async () => {
    expect(await evaluate(item)).toMatchObject({ status: "verified", closingAt: new Date(item.close) });
  });
  it.each(["complete", "unterminated", "title", "employer", "application", "deadline"])("rejects %s commented-out vacancy evidence", async field => {
    const comment = (value: string) => `<!--${value}-->`;
    let raw = item.raw;
    if (field === "complete") raw = comment(raw);
    if (field === "unterminated") raw = `<!--${raw}`;
    if (field === "title") raw = replaceRoleHeading(item, comment(`<h${item.name === "Ottawa" ? 1 : 2}>${item.job.title}</h${item.name === "Ottawa" ? 1 : 2}>`));
    if (field === "employer") raw = raw.replace(/<(p|li)\b[^>]*>[\s\S]*?<\/\1\s*>/gi, block => block.includes(item.job.company) ? comment(block) : block);
    if (field === "application") raw = raw.replace(/<a\b[^>]*>[\s\S]*?<\/a\s*>/gi, link => link.includes(item.id) ? comment(link) : link);
    if (field === "deadline") raw = raw.replace(/<p\b[^>]*>[\s\S]*?<\/p\s*>/gi, block => block.includes(item.date) ? comment(block) : block);
    expect(raw).not.toBe(item.raw);
    expect((await evaluate(item, raw)).status).toBe("unavailable");
  });
  it.each([
    "VALID Application Close: Not available",
    "Not available Application Close: VALID",
    "VALID Application Close: 21/10/2026 12:30",
    "21/10/2026 12:30 Application Close: VALID",
    "VALID Application Close: 31/02/2026",
  ])("rejects every unresolved explicit deadline in %s", async value => {
    expect((await evaluate(item, item.raw.replace(item.date, value.replace("VALID", item.date)))).status).toBe("unavailable");
  });
  it("accepts repeated explicit fields only when they resolve to the same deadline", async () => {
    const label = item.name === "Ottawa" ? "Application Close" : "Closing Date";
    const raw = item.raw.replace(item.date, `${item.date} ${label}: ${item.date}`);
    expect(await evaluate(item, raw)).toMatchObject({ status: "verified", closingAt: new Date(item.close) });
  });
  it("does not treat incidental closing-date prose as an unresolved field", async () => {
    const raw = item.raw.replace(item.date, `${item.date} Once the closing date has passed, the poster is unavailable.`);
    expect(await evaluate(item, raw)).toMatchObject({ status: "verified", closingAt: new Date(item.close) });
  });
  it("verifies through the bounded pinned-transport fixture without rewriting the vacancy URL", async () => {
    const transport = postingTransportFixture([{ body: item.raw, headers: { "content-type": "text/html" } }]);
    const result = await verifyJob(item.job, { now, fetchDocument: (url, options) => fetchJobDocument(url, { ...transport, ...options }) });
    expect(result).toMatchObject({ status: "verified", closingAt: new Date(item.close) });
    expect(transport.get.mock.calls[0][0].toString()).toBe(item.job.sourceUrl);
  });
  it("rejects missing or inexact role headings even when the title appears elsewhere", async () => {
    for (const replacement of ["", `${item.job.title} Assistant`]) {
      const level = item.name === "Ottawa" ? "h1" : "h2";
      const raw = replaceRoleHeading(item, `<${level}>${replacement}</${level}>`);
      expect((await evaluate(item, raw)).status).toBe("unavailable");
    }
  });
  it("rejects the wrong candidate employer and employer evidence absent from the container", async () => {
    expect((await evaluate(item, item.raw, { ...item.job, company: "Wrong Water Authority" })).status).toBe("unavailable");
    const raw = item.raw.split(item.job.company).join("Wrong Water Authority");
    expect((await evaluate(item, raw)).status).toBe("unavailable");
  });
  it("does not mistake department/service description prose for a hiring employer", async () => {
    const company = item.name === "Ottawa" ? "Water Facilities & Treatment Services" : "Manitoba government";
    expect((await evaluate(item, item.raw, { ...item.job, company })).status).toBe("unavailable");
  });
  it("does not borrow employer evidence from outside the vacancy", async () => {
    const raw = `<p>${item.job.company}</p>` + item.raw.split(item.job.company).join("Wrong Water Authority");
    expect((await evaluate(item, raw)).status).toBe("unavailable");
  });
  it("binds source, final detail and in-container application/print identity", async () => {
    expect((await evaluate(item, item.raw, { ...item.job, sourceUrl: item.job.sourceUrl.replace(item.id, item.otherId) })).status).toBe("unavailable");
    expect((await evaluate(item, item.raw, item.job, item.job.sourceUrl.replace(item.id, item.otherId))).status).toBe("unavailable");
    const raw = item.raw.replaceAll(item.id, item.otherId);
    expect((await evaluate(item, raw)).status).toBe("unavailable");
    expect((await evaluate(item, item.raw, { ...item.job, postingId: item.otherId } as typeof item.job)).status).toBe("unavailable");
  });
  it("does not strip unknown ATS parameters or accept duplicated query identifiers", async () => {
    const suffix = item.job.sourceUrl.includes("?") ? "&" : "?";
    for (const query of ["FOCUS=Applicant", `ID=${item.id}`, "redirect=https%3A%2F%2Fevil.example.test"]) {
      const sourceUrl = item.job.sourceUrl + suffix + query;
      expect((await evaluate(item, item.raw, { ...item.job, sourceUrl })).status).toBe("unavailable");
      expect((await evaluate(item, item.raw, item.job, sourceUrl)).status).toBe("unavailable");
    }
  });
  it("never approves a listing/root or a detail redirected to one, even with captured detail markup", async () => {
    expect((await evaluate(item, item.raw, { ...item.job, sourceUrl: item.landing })).status).toBe("unavailable");
    expect((await evaluate(item, item.raw, item.job, item.landing)).status).toBe("unavailable");
    expect((await evaluate(item, `<h1>${item.job.title}</h1><p>${item.job.company} Closing: November 18, 2026</p>`, { ...item.job, sourceUrl: item.landing })).status).toBe("unavailable");
    const card = `<article><h1>${item.job.title}</h1><p>${item.job.company} Closing: November 18, 2026</p></article>`;
    expect((await evaluate(item, card, { ...item.job, sourceUrl: item.landing })).status).toBe("unavailable");
  });
  it("rejects duplicate complete details and unscoped multiple titles/deadlines", async () => {
    expect((await evaluate(item, item.raw + item.raw)).status).toBe("unavailable");
    const raw = replaceRoleHeading(item, `<h1>${item.job.title}</h1><h2>${item.job.title}</h2><h2>Unrelated Operator</h2>`);
    expect((await evaluate(item, raw)).status).toBe("unavailable");
    expect((await evaluate(item, replaceRoleHeading(item, `<h1>${item.job.title}</h1><h2>${item.job.title}</h2>`))).status).toBe("unavailable");
    const conflicting = item.raw.replace(item.date, `${item.date} Closing Date: November 18, 2026`);
    expect((await evaluate(item, conflicting)).status).toBe("unavailable");
  });
  it("does not accept an incomplete container, script-only evidence or a second detail link", async () => {
    const unclosed = item.raw.replace(/<\/div>\s*(?:<\/body>\s*<\/html>\s*)?$/, "");
    expect((await evaluate(item, unclosed)).status).toBe("unavailable");
    expect((await evaluate(item, `<script>${item.raw}</script>`)).status).toBe("unavailable");
    const raw = replaceRoleHeading(item, `<h${item.name === "Ottawa" ? 1 : 2}>${item.job.title}</h${item.name === "Ottawa" ? 1 : 2}><a href="${item.job.sourceUrl.replace(item.id, item.otherId)}">Another vacancy</a>`);
    expect((await evaluate(item, raw)).status).toBe("unavailable");
  });
  it("does not borrow a missing deadline from outside the detail", async () => {
    expect((await evaluate(item, `<p>Closing Date: November 18, 2026</p>${item.raw.replace(item.date, "Not available")}`)).status).toBe("unavailable");
  });
  it("retains the five-megabyte transport response limit for official details", async () => {
    const transport = postingTransportFixture([{ body: item.raw + " ".repeat(5_000_001) }]);
    expect((await verifyJob(item.job, { now, fetchDocument: (url, options) => fetchJobDocument(url, { ...transport, ...options }) })).status).toBe("unavailable");
  });
  it("does not borrow an in-container ID from outside, scripts or a foreign origin", async () => {
    const link = item.name === "Ottawa" ? /<a\b[^>]*href="\/talentcommunity\/apply\/[^"]+"[^>]*>[\s\S]*?<\/a>/g : /<a\b[^>]*href="generateBulletin\.action\?[^"]+"[^>]*>[\s\S]*?<\/a>/g;
    const removed = item.raw.replace(link, "");
    const evidence = item.name === "Ottawa" ? `<a href="/talentcommunity/apply/${item.id}/?locale=en_GB">Apply now</a>` : `<a href="generateBulletin.action?ID=${item.id}">Printer Friendly Version</a>`;
    for (const raw of [removed, evidence + removed, `<script>${evidence}</script>` + removed, item.raw.replace(link, evidence.replace('href="', 'href="https://evil.example.test'))]) {
      expect((await evaluate(item, raw)).status).toBe("unavailable");
    }
  });
  it("retains date-only end-of-day expiry rather than approving old details", async () => {
    expect((await evaluate(item, item.raw, item.job, item.job.sourceUrl, new Date(item.close))).status).toBe("verified");
    expect(await evaluate(item, item.raw, item.job, item.job.sourceUrl, new Date(new Date(item.close).getTime() + 1))).toMatchObject({ status: "expired", closingAt: new Date(item.close) });
  });
  it("preserves an exact zoned closing instant without extending it to end of day", async () => {
    const raw = item.raw.replace(item.date, "2026-10-17T08:30:00-04:00");
    expect(await evaluate(item, raw, item.job, item.job.sourceUrl, new Date("2026-10-17T12:30:00.001Z"))).toMatchObject({ status: "expired", closingAt: new Date("2026-10-17T12:30:00Z") });
  });
  it("keeps pre-known expiry and caller cancellation effective", async () => {
    let called = false;
    expect((await verifyJob({ ...item.job, closingAt: "2026-10-16T12:00:00Z" }, { now, fetchDocument: async () => { called = true; throw Error("must not fetch"); } })).status).toBe("expired");
    expect(called).toBe(false);
    const transport = postingTransportFixture([{ body: item.raw }]);
    const result = await verifyJob(item.job, { now, signal: AbortSignal.abort(), fetchDocument: (url, options) => fetchJobDocument(url, { ...transport, ...options }) });
    expect(result.status).toBe("unavailable");
    expect(transport.get).not.toHaveBeenCalled();
  });
});

describe("Ottawa Application Close day-first grammar only", () => {
  it.each([
    ["Application Close:22/10/2026", "2026-10-22T23:59:59.999Z"],
    ["Application Close: 02/03/2026", "2026-03-02T23:59:59.999Z"],
    ["Application Close: 29/02/2028", "2028-02-29T23:59:59.999Z"],
  ])("parses %s with calendar validation", (text, close) => expect(parseJobDates(text).closingAt).toEqual(new Date(close)));
  it.each(["Application Close: 31/02/2026", "Application Close: 29/02/2026", "Application Close: 10/22/2026", "Application Close: 00/10/2026", "Application Close: 22/00/2026", "Closing Date: 02/03/2026", "Posted: 02/03/2026", "Application Close: 22/10/2026 12:30", "Application Close: 22/10/2026T12:30:00Z"])("does not guess unsupported, invalid or partially timed numeric date %s", text => {
    expect(parseJobDates(text)).toEqual({ closingAt: null, postedAt: null });
  });
  it("requires a valid deadline inside these official detail containers", async () => {
    for (const value of ["31/02/2026", "22/10/2026 12:30", "Not available"]) expect((await evaluate(cases[0], ottawaRaw.replace("22/10/2026", value))).status).toBe("unavailable");
  });
});

describe("Manitoba captured employer paragraph index", () => {
  it("counts the optional blank paragraph before the employer, not after it", async () => {
    const header = manitobaRaw.match(/<h2\b[^>]*>[\s\S]*?<\/h2\s*>([\s\S]*?)Advertisement Number:/i)![1];
    const paragraphs = [...header.matchAll(/<p\b[^>]*>([\s\S]*?)<\/p\s*>/gi)].map(match => plainJobText(match[1]));
    expect(paragraphs.slice(0, 5)).toEqual(["EA4 Engineering Aid 4", "Regular/full-time", "", cases[1].job.company, "Water Operations, Engineering and Technical Service"]);
    expect((await evaluate(cases[1])).status).toBe("verified");
  });
});
