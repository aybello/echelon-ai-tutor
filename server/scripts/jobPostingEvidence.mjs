import { decodeHtmlEntities, normalizeJobIdentityText } from "./jobUtils.mjs";

const identity = value => normalizeJobIdentityText(value).replace(/[^\p{L}\p{N}]+/gu, " ").trim();
const hasIdentity = (text, value) => Boolean(identity(value)) && ` ${identity(text)} `.includes(` ${identity(value)} `);
const saneEmployer = value => {
  if (typeof value !== "string") return false;
  const name = identity(value);
  return name.length >= 4 && /\p{L}/u.test(name) && !/^(?:unknown|not (?:listed|specified)|n a|indeed|job bank|employer|company|confidential)$/.test(name) &&
    !/member employer|water resources association|water (?:and )?wastewater association/.test(name);
};
const expectedEmployer = job => saneEmployer(job.company) ? job.company : saneEmployer(job.employer) ? job.employer : null;
const employerMatches = (name, job) => saneEmployer(name) && (!expectedEmployer(job) || identity(name) === identity(expectedEmployer(job)));
function postingIdFromUrl(value) {
  try {
    const url = new URL(value);
    for (const [key, id] of url.searchParams) {
      if (/^(?:jobid|job_id|vacancyid|postingid|jk)$/i.test(key) && id && !/^echelon-/i.test(id)) return id;
    }
  } catch { /* no source-provided identifier */ }
  return null;
}
const targetId = job => job.postingId && !/^echelon-/i.test(String(job.postingId)) ? String(job.postingId) : postingIdFromUrl(job.sourceUrl);
const recordId = record => typeof record.identifier === "object" ? record.identifier?.value : record.identifier;
function specificLink(value, base) {
  try {
    const url = new URL(decodeHtmlEntities(value), base);
    if (url.protocol !== "https:" || url.username || url.password || (url.port && url.port !== "443")) return false;
    if (postingIdFromUrl(url.toString())) return true;
    const parts = url.pathname.split("/").filter(Boolean);
    const genericTail = /^(?:careers?|jobs?|job-opportunities|opportunities|vacancies|employment|positions|job-board|list(?:ings?)?|search|results|all|openings|current|index(?:\.html?)?)$/i.test(parts.at(-1) ?? "");
    const pagination = /\/(?:page|pages)\/\d+\/?$/i.test(url.pathname);
    return /\.pdf$/i.test(url.pathname) || parts.length >= 2 && !genericTail && !pagination;
  } catch { return false; }
}
function collectJsonRecords(raw) {
  const records = [];
  function visit(value, depth = 0) {
    if (!value || typeof value !== "object") return;
    if (depth > 20 || records.length > 500) throw new Error("Posting metadata exceeds verification limit");
    if (Array.isArray(value)) { for (const item of value) visit(item, depth + 1); return; }
    const types = Array.isArray(value["@type"]) ? value["@type"] : [value["@type"]];
    if (types.some(type => type === "JobPosting" || type === "https://schema.org/JobPosting")) { records.push(value); return; }
    for (const child of Object.values(value)) visit(child, depth + 1);
  }
  for (const script of raw.matchAll(/<script\b[^>]*type\s*=\s*["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script\s*>/gi)) {
    let parsed;
    try { parsed = JSON.parse(script[1]); } catch { continue; }
    visit(parsed); // Traversal limits fail closed, never leave a partial match.
  }
  return records;
}

/** Collect complete containers without browser repair or script/style evidence. */
function htmlContainers(raw, isRecord) {
  const records = [], stack = [];
  // Script/style markup is not a visible vacancy container.
  raw = raw.replace(/<(script|style)\b[^>]*>[\s\S]*?<\/\1\s*>/gi, " ");
  const tags = /<\/?([a-z][\w:-]*)\b[^>]*>/gi;
  for (const tag of raw.matchAll(tags)) {
    const name = tag[1].toLowerCase();
    if (/^<\//.test(tag[0])) {
      const index = stack.findLastIndex(entry => entry.name === name);
      if (index < 0) continue;
      const entry = stack[index];
      // Reject unbalanced nesting for evidence; forgiving browser repair is not proof.
      if (index === stack.length - 1 && entry.record) records.push(raw.slice(entry.start, tag.index + tag[0].length));
      stack.splice(index);
    } else if (!/\/\s*>$/.test(tag[0]) && !/^(?:area|base|br|col|embed|hr|img|input|link|meta|param|source|track|wbr)$/.test(name)) {
      const className = tag[0].match(/\bclass\s*=\s*["']([^"']*)["']/i)?.[1] ?? "";
      const record = isRecord(name, className, tag[0]);
      stack.push({ name, start: tag.index, record });
    }
  }
  return records;
}

/** Only complete explicit vacancy containers; never infer a record from page-wide title proximity. */
function htmlRecords(raw) {
  const records = htmlContainers(raw, (name, className, tag) => /^(?:article|li|tr)$/.test(name) ||
    /(?:^|\s)(?:job-card|job-listing|job-details|listing-item|vacancy|vacancy-card|job-posting)(?:\s|$)/i.test(className) ||
    /\bitemtype\s*=\s*["']https?:\/\/schema\.org\/JobPosting["']/i.test(tag));
  // An outer record containing other records is a list, not a single vacancy.
  return records.filter(record => !records.some(other => other !== record && record.includes(other)));
}
const anchorEntries = raw => [...raw.matchAll(/<a\b[^>]*href\s*=\s*["']([^"']+)["'][^>]*>([\s\S]*?)<\/a\s*>/gi)];

// These two captured public layouts are not generic board approvals. Keep
// exact detail routes and all query parameters intact; never strip ATS queries.
function officialRoute(value) {
  try {
    const url = new URL(value);
    const provider = url.hostname === "jobs-emplois.ottawa.ca" ? "ottawa" : url.hostname === "jobsearch.gov.mb.ca" ? "manitoba" : null;
    if (!provider) return null;
    let id = null;
    if (url.protocol === "https:" && !url.username && !url.password && !url.port && !url.hash) {
      if (provider === "ottawa" && !url.search) id = url.pathname.match(/^\/city-jobs\/job\/[^/]+\/(\d+)\/$/)?.[1] ?? null;
      if (provider === "manitoba" && /^\/(?:jow\/)?advancedResult\.action$/.test(url.pathname) && [...url.searchParams.keys()].length === 1 && /^\d+$/.test(url.searchParams.get("ID") ?? "")) id = url.searchParams.get("ID");
    }
    return { provider, url, id };
  } catch { return null; }
}

function officialDetailEvidence(job, raw, finalUrl, { plainJobText, parseJobDates }) {
  const source = officialRoute(job.sourceUrl), final = officialRoute(finalUrl);
  if (!source?.id || !final?.id || source.provider !== final.provider || source.id !== final.id ||
      (targetId(job) && targetId(job) !== source.id) || !expectedEmployer(job)) return null;
  const ottawa = source.provider === "ottawa";
  const containers = htmlContainers(raw, (name, classes, tag) => name === "div" && (ottawa ?
    /(?:^|\s)jobDisplayShell(?:\s|$)/.test(classes) && /\bitemtype\s*=\s*["']https?:\/\/schema\.org\/JobPosting["']/i.test(tag) :
    /(?:^|\s)positionlisting(?:\s|$)/.test(classes) && /\bid\s*=\s*["']positionListing["']/i.test(tag)));
  if (containers.length !== 1) return null;
  const record = containers[0], text = plainJobText(record), title = identity(job.title);
  if (!hasIdentity(text, expectedEmployer(job))) return null;
  if (ottawa) {
    if (identity(expectedEmployer(job)) !== identity("City of Ottawa")) return null;
  } else {
    // The captured bulletin advertises its hiring department as the fourth
    // paragraph after the role heading (classification, term, optional blank,
    // employer). Description prose and the global Manitoba masthead are not it.
    const header = record.match(/<h2\b[^>]*>[\s\S]*?<\/h2\s*>([\s\S]*?)Advertisement Number:/i)?.[1] ?? "";
    const paragraphs = [...header.matchAll(/<p\b[^>]*>([\s\S]*?)<\/p\s*>/gi)];
    if (identity(plainJobText(paragraphs[3]?.[1] ?? "")) !== identity(expectedEmployer(job))) return null;
  }
  const headings = [...record.matchAll(/<(h[1-6])\b[^>]*>([\s\S]*?)<\/\1\s*>/gi)]
    .map(match => ({ level: match[1].toLowerCase(), text: identity(plainJobText(match[2])) }));
  const titleHeadings = headings.filter(heading => heading.level === (ottawa ? "h1" : "h2"));
  if (titleHeadings.length !== 1 || titleHeadings[0].text !== title || headings.filter(heading => heading.text === title).length !== 1) return null;
  const sections = /^(?:job summary|education and experience|certifications and licences|knowledge|competencies skills and abilities|apply to)$/;
  if (headings.some(heading => heading.text !== title && !sections.test(heading.text))) return null;
  if (!ottawa && htmlContainers(record, (name, _classes, tag) => name === "div" && /\bid\s*=\s*["']bulletinTextArea["']/i.test(tag)).length !== 1) return null;
  const ids = [];
  for (const link of anchorEntries(record)) {
    let url;
    try { url = new URL(decodeHtmlEntities(link[1]), finalUrl); } catch { continue; }
    const linkedDetail = officialRoute(url.toString());
    if (linkedDetail?.id && (linkedDetail.provider !== source.provider || linkedDetail.id !== source.id)) return null;
    const id = ottawa ? url.pathname.match(/^\/talentcommunity\/apply\/(\d+)\/$/)?.[1] :
      /^\/(?:jow\/)?generateBulletin\.action$/.test(url.pathname) && [...url.searchParams.keys()].length === 1 ? url.searchParams.get("ID") : null;
    if (id) {
      if (url.origin !== final.url.origin || url.username || url.password || url.hash) return null;
      ids.push(id);
    }
  }
  // Repeated apply buttons for this one role are expected, not multiple jobs.
  if (!ids.length || ids.some(id => id !== source.id)) return null;
  if (closingDates(text, parseJobDates).size !== 1 || !parseJobDates(text).closingAt) return null;
  return { text };
}

/**
 * Return one positively identified record or null (unavailable, NOT a 404).
 * Unknown/text-only fixtures are deliberately insufficient: callers must retain
 * raw HTML or explicitly identify a specific PDF, as fetchJobDocument now does.
 */
export function matchPostingEvidence(job, document, { plainJobText, parseJobDates }) {
  const title = identity(job.title);
  if (!title) return null;
  const raw = typeof document.raw === "string" ? document.raw : "";
  const finalUrl = document.finalUrl ?? job.sourceUrl;
  // Recognized public hosts fail closed on roots, listings, redirects and
  // incomplete detail evidence; they must not fall through to generic cards.
  if (officialRoute(job.sourceUrl) || officialRoute(finalUrl)) return officialDetailEvidence(job, raw, finalUrl, { plainJobText, parseJobDates });
  const id = targetId(job);
  const jsonRecords = collectJsonRecords(raw);
  if (jsonRecords.length) {
    let matches = jsonRecords.filter(record => identity(record.title) === title &&
      employerMatches(typeof record.hiringOrganization === "string" ? record.hiringOrganization : record.hiringOrganization?.name, job));
    if (id) matches = matches.filter(record => String(recordId(record) ?? postingIdFromUrl(record.url)) === id);
    if (matches.length !== 1) return null;
    const record = matches[0];
    return { text: plainJobText(record.description ?? ""), postedAt: record.datePosted, closingAt: record.validThrough };
  }
  const employer = expectedEmployer(job);
  // The transport sets isPdf from the bytes, not an untrusted Content-Type.
  const isPdf = document.isPdf === true;
  if (isPdf) {
    // Format alone does not prove a single vacancy. Require one explicit title
    // header; unknown layouts and recruitment bulletins remain unavailable.
    if (!employer || !hasIdentity(document.text, job.title) || !hasIdentity(document.text, employer)) return null;
    const titles = [...document.text.matchAll(/(?:^|\n|\s)(?:job title|position title|position|vacancy title|role title)\s*:\s*([^\n]+?)(?=\s+(?:job title|position title|position|vacancy title|role title|application deadline|apply by|closing(?: date)?|posted(?: date)?)\s*:|\s+open until filled\b|\n|$)/gi)]
      .map(match => identity(match[1]));
    if (titles.length !== 1 || titles[0] !== title || /\b(?:vacancies|multiple positions|recruitment bulletin|positions available|current openings)\b/i.test(document.text)) return null;
    const dates = closingDates(document.text, parseJobDates);
    if (dates.size > 1) return null;
    return { text: document.text };
  }
  if (!raw || !employer) return null;
  const matches = htmlRecords(raw).filter(record => {
    const text = plainJobText(record);
    if (!hasIdentity(text, employer)) return false;
    const headings = [...record.matchAll(/<(?:h[1-6]|dt)\b[^>]*>([\s\S]*?)<\/(?:h[1-6]|dt)\s*>/gi)].map(match => identity(plainJobText(match[1])));
    const roleHeading = headings.includes(title);
    const sectionHeading = /^(?:responsibilities|qualifications|requirements|duties|key duties|key responsibilities|essential qualifications|preferred qualifications|education|experience|skills|benefits|salary|compensation|working conditions|job description|about (?:us|the (?:role|position|organization))|how to apply|application process|equal opportunity|employment equity|contact(?: us)?|location|hours|schedule)$/;
    const roleHeadings = headings.filter(heading => heading !== identity(employer) && !sectionHeading.test(heading));
    // Multiple role headings without separate containers cannot scope a date.
    if (new Set(roleHeadings).size > 1 || closingDates(text, parseJobDates).size > 1) return false;
    const links = anchorEntries(record);
    const linkedRoles = links.filter(link => specificLink(link[1], finalUrl)).map(link => identity(plainJobText(link[2]))).filter(label => label && !/^(?:apply(?: now)?|download|details|view(?: details)?|learn more|here)$/.test(label));
    if (new Set(linkedRoles).size > 1) return false;
    const roleLink = links.some(link => identity(plainJobText(link[2])) === title && specificLink(link[1], finalUrl));
    if (!roleHeading && !roleLink) return false;
    if (id) {
      const identifier = record.match(/\bdata-(?:job-id|posting-id|vacancy-id)\s*=\s*["']([^"']+)["']/i)?.[1];
      const linkedId = links.some(link => { try { return postingIdFromUrl(new URL(decodeHtmlEntities(link[1]), finalUrl).toString()) === id; } catch { return false; } });
      if (identifier !== id && !linkedId) return false;
    }
    // A generic careers URL needs a specific role link or a complete dated
    // vacancy record. A bare heading/employer on a board remains ambiguous.
    return roleLink || Boolean(parseJobDates(text).closingAt);
  });
  return matches.length === 1 ? { text: plainJobText(matches[0]) } : null;
}

function closingDates(text, parseJobDates) {
  const labels = [...text.matchAll(/(?:application deadline|applications? (?:close|due)|closing(?: date)?|deadline|apply (?:by|before))/gi)];
  return new Set(labels.map((label, index) => parseJobDates(text.slice(label.index, labels[index + 1]?.index)).closingAt?.toISOString()).filter(Boolean));
}
