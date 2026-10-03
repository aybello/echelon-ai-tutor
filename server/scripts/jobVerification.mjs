import { execFile } from "node:child_process";
import { createRequire } from "node:module";
import { dirname, resolve as resolvePath } from "node:path";
import { fileURLToPath } from "node:url";
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
const PDF_TIMEOUT_MS = 8000;
const PDF_INPUT_LIMIT = 5_000_000;
const PDF_OUTPUT_LIMIT = 2_000_000;
const PDF_QUEUE_LIMIT = 8;
let pdfChildActive = false;
const pdfQueue = [];
const pdfUnavailable = () => new Error("PDF text extraction unavailable");

function startPdfExtraction(task) {
  clearTimeout(task.timer);
  const remaining = Math.ceil(task.deadline - performance.now());
  if (remaining <= 0) { task.reject(pdfUnavailable()); return; }
  pdfChildActive = true;
  const complete = (error, stdout) => {
    pdfChildActive = false; // execFile callback runs after the child closes.
    if (error || !stdout?.trim()) task.reject(pdfUnavailable());
    else task.resolve(stdout);
    while (!pdfChildActive && pdfQueue.length) startPdfExtraction(pdfQueue.shift());
  };
  try {
    const pdfModule = createRequire(import.meta.url).resolve("pdfjs-dist/legacy/build/pdf.mjs");
    const pdfRoot = resolvePath(dirname(pdfModule), "../..");
    // esbuild bundles this module into dist/index.js. The build copies only the
    // child helper to dist/scripts; source execution uses its sibling helper.
    const helper = fileURLToPath(new URL(import.meta.url.endsWith("/jobVerification.mjs") ? "./jobPdfText.mjs" : "./scripts/jobPdfText.mjs", import.meta.url));
    const child = execFile(process.execPath, [
      "--max-old-space-size=96", "--max-semi-space-size=4",
      "--disallow-code-generation-from-strings", "--no-addons", "--permission",
      `--allow-fs-read=${helper}`, `--allow-fs-read=${pdfRoot}`,
      helper, pdfModule,
    ], {
      timeout: remaining, killSignal: "SIGKILL", maxBuffer: PDF_OUTPUT_LIMIT,
      encoding: "utf8", env: { LANG: "C.UTF-8" },
    }, complete);
    child.stdin.on("error", () => {});
    child.stdin.end(task.bytes);
    task.bytes = undefined;
  } catch { complete(pdfUnavailable()); }
}

/** Portable PDF.js parser. Failures/scanned PDFs remain unavailable, never proof of an open or missing vacancy. */
export async function pdfToText(bytes) {
  if (!(bytes instanceof Uint8Array) || !bytes.byteLength || bytes.byteLength > PDF_INPUT_LIMIT || (pdfChildActive && pdfQueue.length >= PDF_QUEUE_LIMIT)) throw pdfUnavailable();
  return new Promise((resolve, reject) => {
    const task = { bytes, resolve, reject, deadline: performance.now() + PDF_TIMEOUT_MS, timer: undefined };
    if (!pdfChildActive) startPdfExtraction(task);
    else {
      // Queue wait counts toward the same eight-second budget, so concurrent
      // verification cannot spawn eight parsers on the 512 MiB production host.
      task.timer = setTimeout(() => {
        const index = pdfQueue.indexOf(task);
        if (index !== -1) pdfQueue.splice(index, 1);
        reject(pdfUnavailable());
      }, PDF_TIMEOUT_MS);
      pdfQueue.push(task);
    }
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
