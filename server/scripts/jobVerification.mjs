import { execFile } from "node:child_process";
import { decodeHtmlEntities, normalizeJobIdentityText } from "./jobUtils.mjs";

export function plainJobText(value = "") {
  return decodeHtmlEntities(value.replace(/<script[\s\S]*?<\/script>/gi, " ").replace(/<style[\s\S]*?<\/style>/gi, " ").replace(/<[^>]+>/g, " ")).replace(/\s+/g, " ").trim();
}
export function sourceDate(value) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isFinite(date.getTime()) ? date : null;
}
const DATE_PATTERN = "(?:[A-Za-z]+\\s+\\d{1,2}(?:st|nd|rd|th)?(?:,)?\\s+\\d{4}|\\d{1,2}(?:st|nd|rd|th)?\\s+[A-Za-z]+(?:,)?\\s+\\d{4}|\\d{4}-\\d{2}-\\d{2})";
export function parseJobDates(text) {
  const clean = plainJobText(text);
  const parse = label => {
    const match = clean.match(new RegExp(`(?:${label})\\s*(?:date)?\\s*[:\\-]?\\s*(${DATE_PATTERN})`, "i"));
    if (!match) return null;
    return sourceDate(match[1].replace(/(\d)(st|nd|rd|th)\b/gi, "$1"));
  };
  const closing = parse("application deadline|applications? (?:close|due)|closing|deadline|apply (?:by|before)");
  return { postedAt: parse("posted|published|posting"), closingAt: closing ? new Date(Date.UTC(closing.getUTCFullYear(), closing.getUTCMonth(), closing.getUTCDate(), 23, 59, 59, 999)) : null };
}
/** pdfToText uses the established Poppler parser. Missing binary is an unavailable verification, never availability proof. */
export async function pdfToText(bytes) {
  return new Promise((resolve, reject) => {
    const child = execFile("pdftotext", ["-", "-"], { timeout: 8000, maxBuffer: 2_000_000 }, (error, stdout) => error ? reject(new Error("PDF text extraction unavailable")) : resolve(stdout));
    child.stdin.on("error", () => {});
    child.stdin.end(bytes);
  });
}
function fetchableUrl(raw) {
  const url = new URL(raw);
  if (url.protocol !== "https:" || url.username || url.password || /^(localhost|.*\.local|.*\.internal|\d+(?:\.\d+){3}|\[.*\])$/i.test(url.hostname)) throw new Error("Unapproved posting destination");
  const drive = url.hostname === "drive.google.com" && url.pathname.match(/^\/file\/d\/([a-zA-Z0-9_-]+)\//);
  return drive ? `https://drive.google.com/uc?export=download&id=${drive[1]}` : url.toString();
}
export async function fetchJobDocument(url, deps = { fetch, pdfToText }) {
  let destination = fetchableUrl(url);
  const signal = AbortSignal.timeout(8000);
  let response;
  for (let redirects = 0; redirects <= 3; redirects++) {
    response = await deps.fetch(destination, { redirect: "manual", signal });
    if (![301, 302, 303, 307, 308].includes(response.status)) break;
    const next = response.headers.get("location");
    if (!next || redirects === 3) throw new Error("Posting redirect unavailable");
    destination = fetchableUrl(new URL(next, destination).toString());
  }
  if ([404, 410].includes(response.status)) return { missing: true, text: "" };
  if (!response.ok) throw new Error("Posting verification temporarily unavailable");
  // Stream with a hard cap rather than reading an unbounded employer response.
  const chunks = []; let length = 0;
  for await (const chunk of response.body) {
    length += chunk.length;
    if (length > 5_000_000) throw new Error("Posting document exceeds verification limit");
    chunks.push(Buffer.from(chunk));
  }
  const bytes = Buffer.concat(chunks);
  const isPdf = bytes.subarray(0, 5).toString() === "%PDF-";
  const raw = isPdf ? await deps.pdfToText(bytes) : bytes.toString("utf8");
  const text = plainJobText(raw);
  if (!text || /(?:just a moment|checking your browser|verify you are human|cf-chl-|captcha)/i.test(raw))
    throw new Error("Posting content verification unavailable");
  return { missing: false, text };
}
export async function verifyJob(job, options = {}) {
  const now = options.now ?? new Date();
  const dates = parseJobDates(job.description ?? "");
  const postedAt = sourceDate(job.postedAt) ?? dates.postedAt;
  let closingAt = sourceDate(job.closingAt) ?? dates.closingAt;
  if (closingAt && closingAt < now) return { status: "expired", closingAt, postedAt };
  try {
    const document = await (options.fetchDocument ?? fetchJobDocument)(job.sourceUrl);
    if (document.missing) return { status: "missing", closingAt, postedAt };
    if (!plainJobText(document.text)) return { status: "unavailable", closingAt, postedAt };
    const targetDates = parseJobDates(document.text);
    closingAt = targetDates.closingAt ?? closingAt;
    if (closingAt && closingAt < now) return { status: "expired", closingAt, postedAt: postedAt ?? targetDates.postedAt };
    const title = normalizeJobIdentityText(job.title).replace(/[^\p{L}\p{N}]+/gu, " ").trim();
    const text = normalizeJobIdentityText(document.text).replace(/[^\p{L}\p{N}]+/gu, " ");
    // A generic employer board is not a matching vacancy merely because it returns 200.
    if (!title || !text.includes(title)) return { status: "unverified", closingAt, postedAt };
    if (/\b(?:position (?:has been )?filled|posting (?:has )?expired|job (?:is )?no longer available)\b/i.test(document.text) && text.length < 4000) return { status: "missing", closingAt, postedAt };
    return { status: "verified", closingAt, postedAt: postedAt ?? targetDates.postedAt };
  } catch {
    return { status: "unavailable", closingAt, postedAt };
  }
}
