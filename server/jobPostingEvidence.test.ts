import { describe, expect, it } from "vitest";
import { verifyJob } from "./scripts/jobVerification.mjs";
import { htmlPostingFixture, pdfPostingFixture, structuredPostingFixture, type JobDocumentFixture } from "./jobPostingFixtures";

const now = new Date("2026-10-03T09:00:00Z");
const job = { title: "Source Water Hydrogeologist", company: "Fixture Water Authority", sourceUrl: "https://employer.example.test/job-opportunities/" };
const evaluate = (document: JobDocumentFixture, candidate = job) => verifyJob(candidate, { now, fetchDocument: async () => document });
const record = (overrides: Record<string, unknown> = {}) => ({ "@type": "JobPosting", title: job.title, hiringOrganization: { "@type": "Organization", name: job.company }, datePosted: "2026-07-02", ...overrides });
const card = (title: string, deadline: string, company = job.company, extra = "") => `<article class="job-card"><h2>${title}</h2><p>${company}</p><p>Closing Date: ${deadline}</p>${extra}</article>`;

describe("specific vacancy evidence, not title-only success", () => {
  it.each([
    `<h1>Careers at ${job.company}</h1><p>${job.title}</p>`,
    `<h1>Careers at ${job.company}</h1><p>${job.title} Closing Date: November 18, 2026</p>`,
    `<h1>Careers at ${job.company}</h1><ul><li>${job.title}</li></ul>`,
    `<article><h2>${job.title}</h2><p>${job.company}</p></article>`,
    `<article><h2>${job.title}</h2><p>${job.company}</p><a href="/careers">${job.title}</a></article>`,
    `<article><h2>${job.title}</h2><p>${job.company}</p><a href="/careers?jobid=echelon-invented">${job.title}</a></article>`,
    `<article><h2>${job.title}</h2><p>${job.company}</p><a href="/careers/list">${job.title}</a></article>`,
    `<article><h2>${job.title}</h2><p>${job.company}</p><a href="/jobs/search">${job.title}</a></article>`,
    `<article><h2>${job.title}</h2><p>${job.company}</p><a href="/careers/page/2">${job.title}</a></article>`,
  ])("does not verify or quarantine an ambiguous matching-title generic board", async raw => {
    expect(await evaluate(htmlPostingFixture(raw))).toMatchObject({ status: "unavailable", closingAt: null, postedAt: null });
  });
  it("treats a posting redirected to a same-title careers root as unavailable, not 404", async () => {
    const candidate = { ...job, sourceUrl: "https://employer.example.test/jobs/previous-vacancy" };
    const doc = htmlPostingFixture(`<h1>${job.company} Careers</h1><p>${job.title} Closing: November 18, 2026</p>`, "https://employer.example.test/careers/");
    expect((await evaluate(doc, candidate)).status).toBe("unavailable");
  });
  it("explicitly does not grandfather the old metadata-free title-only fixtures", async () => {
    expect((await evaluate({ missing: false, text: `${job.company} ${job.title} Closing: November 18, 2026` })).status).toBe("unavailable");
  });
  it("allows a specific PDF with the role and employer, including open-until-filled", async () => {
    for (const deadline of ["Application Deadline: October 18, 2026", "Open until filled"]) {
      expect((await evaluate(pdfPostingFixture(`${job.company} ${job.title} ${deadline}`))).status).toBe("verified");
    }
    expect((await evaluate(pdfPostingFixture(`${job.title} Open until filled`))).status).toBe("unavailable");
    expect((await evaluate(pdfPostingFixture(`Wrong Water Authority ${job.title} Open until filled`))).status).toBe("unavailable");
  });
  it("does not believe a PDF content-type on a generic HTML page", async () => {
    const document = htmlPostingFixture(`<h1>${job.company} Careers</h1><p>${job.title}</p>`);
    document.contentType = "application/pdf";
    expect((await evaluate(document)).status).toBe("unavailable");
  });
  it("uses only the matched HTML vacancy date when another role has a future deadline", async () => {
    const document = htmlPostingFixture(card("Wastewater Operator", "November 18, 2026") + card(job.title, "August 3, 2026"));
    expect(await evaluate(document)).toMatchObject({ status: "expired", closingAt: new Date("2026-08-03T23:59:59.999Z") });
  });
  it("does not expire the matching record using a different role's old deadline", async () => {
    const document = htmlPostingFixture(card("Wastewater Operator", "August 3, 2026") + card(job.title, "November 18, 2026"));
    expect(await evaluate(document)).toMatchObject({ status: "verified", closingAt: new Date("2026-11-18T23:59:59.999Z") });
  });
  it("does not borrow global or another record's date for an undated specific record link", async () => {
    const document = htmlPostingFixture(`<p>Closing: August 3, 2026</p>${card("Wastewater Operator", "August 3, 2026")}<article><h2>${job.title}</h2><p>${job.company}</p><a href="/jobs/hydrogeologist">${job.title}</a><p>Open until filled</p></article>`);
    expect(await evaluate(document)).toMatchObject({ status: "verified", closingAt: null });
  });
  it("requires an exact role heading or role link and matching employer in an HTML record", async () => {
    for (const raw of [card(`${job.title} Assistant`, "November 18, 2026"), card(job.title, "November 18, 2026", "Other Water Authority")]) {
      expect((await evaluate(htmlPostingFixture(raw))).status).toBe("unavailable");
    }
  });
  it("rejects a single outer HTML container containing several unscoped vacancies/dates", async () => {
    const raw = `<article><h2>Wastewater Operator</h2><p>${job.company} Closing: November 18, 2026</p><h2>${job.title}</h2><p>${job.company} Closing: August 3, 2026</p></article>`;
    expect((await evaluate(htmlPostingFixture(raw))).status).toBe("unavailable");
  });
  it("does not infer a single record from multiple role links and a shared date", async () => {
    const raw = `<article><p>${job.company}</p><a href="/jobs/wastewater">Wastewater Operator</a><a href="/jobs/hydrogeologist">${job.title}</a><p>Closing: November 18, 2026</p></article>`;
    expect((await evaluate(htmlPostingFixture(raw))).status).toBe("unavailable");
  });
  it("rejects several matching records rather than guessing which date is ours", async () => {
    expect((await evaluate(htmlPostingFixture(card(job.title, "August 3, 2026") + card(job.title, "November 18, 2026")))).status).toBe("unavailable");
    expect((await evaluate(structuredPostingFixture([record({ validThrough: "2026-08-03" }), record({ validThrough: "2026-11-18" })]))).status).toBe("unavailable");
  });
  it("does not verify unbalanced HTML or HTML-looking text inside script/style", async () => {
    for (const raw of [
      `<article><h2>${job.title}</h2><p>${job.company} Closing: November 18, 2026`,
      `<script>${card(job.title, "November 18, 2026")}</script>`,
      `<style>${card(job.title, "November 18, 2026")}</style>`,
    ]) expect((await evaluate(htmlPostingFixture(raw))).status).toBe("unavailable");
  });
  it("rejects conflicting PDF deadlines instead of taking its first date", async () => {
    expect((await evaluate(pdfPostingFixture(`${job.company} ${job.title} Closing: November 18, 2026 Other posting Closing: August 3, 2026`))).status).toBe("unavailable");
  });
  it("scopes filled/expired text to the matched record, not another vacancy", async () => {
    const raw = card("Wastewater Operator", "November 18, 2026", job.company, "<p>Position has been filled</p>") + card(job.title, "November 18, 2026");
    expect((await evaluate(htmlPostingFixture(raw))).status).toBe("verified");
    expect((await evaluate(htmlPostingFixture(card(job.title, "November 18, 2026", job.company, "<p>Position has been filled</p>")))).status).toBe("missing");
  });
});

describe("HTML JobPosting structured records", () => {
  it("matches an exact role and sane hiring organization, even on a metadata-only page", async () => {
    expect(await evaluate(structuredPostingFixture([record({ validThrough: "2026-11-18" })]))).toMatchObject({ status: "verified", closingAt: new Date("2026-11-18T23:59:59.999Z"), postedAt: new Date("2026-07-02T00:00:00Z") });
    const { company: _company, ...noEmployerCandidate } = job;
    expect((await evaluate(structuredPostingFixture([record()]), noEmployerCandidate as typeof job)).status).toBe("verified");
  });
  it("preserves precise deadline timestamps and refuses malformed structured closing dates", async () => {
    expect(await evaluate(structuredPostingFixture([record({ validThrough: "2026-11-18T12:30:00-05:00" })]))).toMatchObject({ status: "verified", closingAt: new Date("2026-11-18T17:30:00Z") });
    expect((await evaluate(structuredPostingFixture([record({ validThrough: "not a date" })]))).status).toBe("unavailable");
  });
  it.each(["", "Employer", "Unknown", "AWWOA member employer", "Canadian Water Resources Association", "Wrong Water Authority"])("does not verify a structured record with ambiguous/wrong employer %s", async name => {
    expect((await evaluate(structuredPostingFixture([record({ hiringOrganization: { name } })]))).status).toBe("unavailable");
  });
  it("requires exact title rather than a substring", async () => {
    expect((await evaluate(structuredPostingFixture([record({ title: `${job.title} Assistant` })]))).status).toBe("unavailable");
  });
  it("scopes expired record dates even when another structured vacancy is open", async () => {
    expect(await evaluate(structuredPostingFixture([record({ title: "Wastewater Operator", validThrough: "2026-11-18" }), record({ validThrough: "2026-08-03" })]))).toMatchObject({ status: "expired", closingAt: new Date("2026-08-03T23:59:59.999Z") });
  });
  it("uses a real source posting identifier to choose between same-title records", async () => {
    const candidate = { ...job, sourceUrl: "https://employer.example.test/careers?jobid=actual-id-42" };
    const document = structuredPostingFixture([record({ identifier: { value: "actual-id-41" }, validThrough: "2026-11-18" }), record({ identifier: { value: "actual-id-42" }, validThrough: "2026-08-03" })]);
    expect(await evaluate(document, candidate)).toMatchObject({ status: "expired", closingAt: new Date("2026-08-03T23:59:59.999Z") });
    expect((await evaluate(structuredPostingFixture([record({ identifier: "another-id", validThrough: "2026-11-18" })]), candidate)).status).toBe("unavailable");
  });
  it("can match an identifier carried by a real record URL or HTML data attribute", async () => {
    const candidate = { ...job, sourceUrl: "https://employer.example.test/careers?jobid=actual-id-42" };
    expect((await evaluate(structuredPostingFixture([record({ url: candidate.sourceUrl, validThrough: "2026-11-18" })]), candidate)).status).toBe("verified");
    const raw = `<article data-job-id="actual-id-42"><h2>${job.title}</h2><p>${job.company}</p><p>Closing: November 18, 2026</p></article>`;
    expect((await evaluate(htmlPostingFixture(raw), candidate)).status).toBe("verified");
    expect((await evaluate(htmlPostingFixture(raw.replace("actual-id-42", "actual-id-43")), candidate)).status).toBe("unavailable");
  });
  it("never treats the legacy Echelon-derived board query hash as an employer posting ID", async () => {
    const candidate = { ...job, sourceUrl: "https://employer.example.test/careers?jobid=echelon-not-a-provider-id" };
    expect((await evaluate(structuredPostingFixture([record({ validThrough: "2026-11-18" })]), candidate)).status).toBe("verified");
    expect((await evaluate(htmlPostingFixture(`<h1>${job.company}</h1><p>${job.title}</p>`), candidate)).status).toBe("unavailable");
  });
  it("preserves temporary-failure inventory status and the existing source-deadline guard", async () => {
    const candidate = { ...job, closingAt: new Date("2026-08-03T23:59:59.999Z") };
    let fetched = false;
    const result = await verifyJob(candidate, { now, fetchDocument: async () => { fetched = true; throw Error("timeout"); } });
    expect(result.status).toBe("expired");
    expect(fetched).toBe(false);
    const ambiguous = await evaluate(htmlPostingFixture(`<p>${job.company} ${job.title} Closing: August 3, 2026</p>`));
    expect(ambiguous).toMatchObject({ status: "unavailable", closingAt: null });
  });
});
