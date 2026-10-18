import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { verifyJob } from "./scripts/jobVerification.mjs";
import { htmlPostingFixture } from "./jobPostingFixtures";

const now = new Date("2026-10-17T12:00:00Z");
const cases = [
  {
    name: "Ottawa",
    raw: readFileSync(new URL("./__fixtures__/job-postings/ottawa-process-operator-20261017.html", import.meta.url), "utf8"),
    job: { title: "Process Operator/Process Operator-in-Training 42hrs", company: "City of Ottawa", sourceUrl: "https://jobs-emplois.ottawa.ca/city-jobs/job/Ottawa%2C-ON-Process-OperatorProcess-Operator-in-Training-42hrs-ON-Ottawa%2C-ON/1291635047/" },
    href: "/talentcommunity/apply/1291635047/?locale=en_GB",
    action: /<a\b[^>]*href="\/talentcommunity\/apply\/[^">]+"[^>]*>[\s\S]*?<\/a>/g,
    marker: "apply dialogApplyBtn",
    label: "Apply now »",
  },
  {
    name: "Manitoba",
    raw: readFileSync(new URL("./__fixtures__/job-postings/manitoba-water-operations-20261017.html", import.meta.url), "utf8"),
    job: { title: "Water Operations Technician", company: "Department of Transportation and Infrastructure", sourceUrl: "https://jobsearch.gov.mb.ca/advancedResult.action?ID=128944" },
    href: "generateBulletin.action?ID=128944",
    action: /<a\b[^>]*href="generateBulletin\.action\?[^">]+"[^>]*>[\s\S]*?<\/a>/g,
    marker: "",
    label: "Printer Friendly Version",
  },
];
type Case = typeof cases[number];
const evaluate = (item: Case, raw: string) => verifyJob(item.job, {
  now,
  fetchDocument: async () => htmlPostingFixture(raw, item.job.sourceUrl),
});
const anchor = (item: Case) => [...item.raw.matchAll(item.action)][0][0];
// Manitoba captures one print action; duplicate that exact captured anchor so
// every negative test leaves a second, valid action in the same vacancy.
const twoButtons = (item: Case) => item.name === "Ottawa" ? item.raw : item.raw.replace(anchor(item), anchor(item) + anchor(item));
const oneChangedButton = (item: Case, replacement: string) => twoButtons(item).replace(anchor(item), replacement);
const changedHref = (item: Case, href: string) => anchor(item).replace(`href="${item.href}"`, `href="${href}"`);
const hide = [
  ["comment", (html: string) => `<!--${html}-->`],
  ["hidden anchor", (html: string) => html.replace("<a ", "<a hidden ")],
  ["hidden ancestor", (html: string) => `<div hidden>${html}</div>`],
  ["aria-hidden ancestor", (html: string) => `<div aria-hidden="true">${html}</div>`],
  ["display-none ancestor", (html: string) => `<div style="display: none">${html}</div>`],
  ["visibility-hidden ancestor", (html: string) => `<span style="visibility: hidden">${html}</span>`],
  ["script", (html: string) => `<script>${html}</script>`],
  ["style", (html: string) => `<style>${html}</style>`],
  ["script with a quoted closing tag", (html: string) => `<script data-note="one ></script> two">${html}</script>`],
  ["style with a quoted closing tag", (html: string) => `<style data-note="one ></style> two">${html}</style>`],
] as const;

describe.each(cases)("$name captured vacancy-action restoration", item => {
  it("preserves duplicate valid captured actions", async () => {
    const raw = twoButtons(item);
    expect(raw.split(`href="${item.href}"`)).toHaveLength(3);
    expect((await evaluate(item, raw)).status).toBe("verified");
  });

  describe.each(['"', "'"])("literal href bytes in %s quotes", quote => {
    it.each(["<!--x-->", "<script>x</script>", "<style>x</style>"])("rejects a captured action suffixed with %s beside a valid action", async suffix => {
      const replacement = anchor(item).replace(`href="${item.href}"`, `href=${quote}${item.href}${suffix}${quote}`);
      const raw = oneChangedButton(item, replacement);
      expect(raw).toContain(`href=${quote}${item.href}${suffix}${quote}`);
      expect(raw.split(`href="${item.href}"`)).toHaveLength(2);
      expect((await evaluate(item, raw)).status).toBe("unavailable");
    });
  });

  it("does not truncate a later changed action at closing tags inside its quoted href", async () => {
    const invalid = changedHref(item, "https://evil.example.test/x></div></div></div>ignored");
    const raw = item.raw.replace(anchor(item), anchor(item) + invalid);
    expect((await evaluate(item, raw)).status).toBe("unavailable");
  });

  it("preserves complete records when benign quoted data contains closing tags", async () => {
    const raw = item.raw.replace(item.action, match => match.replace("<a ", '<a data-note="one ></div></div></div> two" '));
    expect((await evaluate(item, raw)).status).toBe("verified");
  });

  it.each([
    ["review repro: foreign origin and arbitrary path", "https://evil.example.test/apply-now?ID=999&amp;unknown=value"],
    ["review repro: quoted > in foreign href", "https://evil.example.test/x>ignored"],
    ["same origin arbitrary path", "/apply-now?ID=999&amp;unknown=value"],
    ["foreign detail route", "https://evil.example.test/vacancies/999/"],
    ["JavaScript", "javascript:void(0)"],
    ["data", "data:text/plain,apply-now"],
    ["HTTP", "http://evil.example.test/apply-now"],
    ["file", "file:///apply-now"],
    ["mail", "mailto:help@example.test"],
    ["unparseable IPv6 authority", "https://[invalid/apply-now"],
    ["unparseable empty host", "https://"],
    ["empty href", ""],
  ])("rejects an existing action changed to %s beside a valid action", async (_name, href) => {
    const raw = oneChangedButton(item, changedHref(item, href));
    expect(raw.split(`href="${item.href}"`)).toHaveLength(2);
    expect((await evaluate(item, raw)).status).toBe("unavailable");
  });

  it.each(['data-note="one > two"', "data-note='one > two'"])("preserves valid actions with a benign quoted > attribute %s", async attribute => {
    const raw = item.raw.replace(item.action, match => match.replace("<a ", `<a ${attribute} `));
    expect((await evaluate(item, raw)).status).toBe("verified");
  });

  it.each([
    'data-note="one <!--x--> two"', "data-note='one <!--x--> two'",
    'data-note="one <script>x</script> two"', "data-note='one <script>x</script> two'",
    'data-note="one <style>x</style> two"', "data-note='one <style>x</style> two'",
  ])("preserves valid actions with benign quoted node-like data %s", async attribute => {
    const raw = item.raw.replace(item.action, match => match.replace("<a ", `<a ${attribute} `));
    expect((await evaluate(item, raw)).status).toBe("verified");
  });

  it.each(['data-note="one > two"', "data-note='one > two'"])("honors hidden ancestors after a quoted > attribute %s", async attribute => {
    const replacement = `<div ${attribute} hidden>${changedHref(item, "https://evil.example.test/x>ignored")}</div>`;
    expect((await evaluate(item, oneChangedButton(item, replacement))).status).toBe("verified");
  });

  it("rejects a clearly labelled action with a missing href beside a valid action", async () => {
    const raw = oneChangedButton(item, anchor(item).replace(`href="${item.href}"`, ""));
    expect((await evaluate(item, raw)).status).toBe("unavailable");
  });

  it("recognizes the visible captured label independently of classes and endpoint", async () => {
    const replacement = `<a href="https://evil.example.test/apply-now?ID=999&amp;unknown=value"><strong>${item.label}</strong></a>`;
    expect((await evaluate(item, oneChangedButton(item, replacement))).status).toBe("unavailable");
  });

  it("does not mistake privacy, navigation, mail or application-form resources for vacancy actions", async () => {
    const links = '<a href="https://example.test/privacy">Privacy</a><a href="/careers">Careers</a><a href="mailto:help@example.test">Contact</a><a href="https://[invalid">Help</a><a href="">Back</a><a name="navigation">Navigation</a><a href="/application-form">Application form</a>';
    const raw = oneChangedButton(item, anchor(item) + links);
    expect((await evaluate(item, raw)).status).toBe("verified");
  });

  it("does not use hidden label text to classify an unrelated visible link", async () => {
    const link = `<a href="https://example.test/privacy"><span hidden>${item.label}</span>Privacy</a>`;
    expect((await evaluate(item, oneChangedButton(item, anchor(item) + link))).status).toBe("verified");
  });

  it.each(hide)("does not borrow action evidence from a %s", async (_name, wrap) => {
    const raw = item.raw.replace(item.action, match => wrap(match));
    expect((await evaluate(item, raw)).status).toBe("unavailable");
  });

  it.each(hide)("ignores a %s invalid action while a visible valid action remains", async (_name, wrap) => {
    const raw = oneChangedButton(item, wrap(changedHref(item, "https://evil.example.test/apply-now?ID=999&amp;unknown=value")));
    expect((await evaluate(item, raw)).status).toBe("verified");
  });
});

describe("Ottawa captured action markers independently of visible text", () => {
  const item = cases[0];
  it.each(["apply", "dialogApplyBtn"])("recognizes the captured %s class token on an arbitrary destination", async marker => {
    const link = `<a class="btn ${marker}" href="https://evil.example.test/apply-now?ID=999&amp;unknown=value">Continue</a>`;
    expect((await evaluate(item, oneChangedButton(item, link))).status).toBe("unavailable");
  });
  it.each(["https://[invalid/apply-now", "", null])("rejects captured markers with invalid/missing href %s even without a label", async href => {
    const link = `<a class="${item.marker}"${href === null ? "" : ` href="${href}"`}>Continue</a>`;
    expect((await evaluate(item, oneChangedButton(item, link))).status).toBe("unavailable");
  });
  it("does not treat partial class-token matches as action markers", async () => {
    const link = '<a class="apply-help notdialogApplyBtn" href="https://example.test/privacy">Privacy</a>';
    expect((await evaluate(item, oneChangedButton(item, anchor(item) + link))).status).toBe("verified");
  });
});

it("preserves Manitoba's captured external DOCX application-form resources", async () => {
  const item = cases[1];
  const href = "https://www.gov.mb.ca/govjobs/doc/Screening_Application_Form/application_form_for_screening_44505.docx";
  expect(item.raw.split(`href="${href}"`)).toHaveLength(3);
  expect((await evaluate(item, twoButtons(item))).status).toBe("verified");
});
