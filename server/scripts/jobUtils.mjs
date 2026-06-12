/**
 * Shared helpers for Echelon job board ingestion pipeline.
 * Used by fetchJobsRss.mjs and the orchestrator fetchJobs.mjs.
 */

// ---- Province detection ----
const PROVINCE_MAP = [
  { province: "ON", patterns: ["ontario", ", on", "(on)", " on,", "on,", " on "] },
  { province: "BC", patterns: ["british columbia", ", bc", "(bc)", " bc,", "bc,", " bc "] },
  { province: "AB", patterns: ["alberta", ", ab", "(ab)", " ab,", "ab,", " ab "] },
  { province: "SK", patterns: ["saskatchewan", ", sk", "(sk)", " sk,", "sk,", " sk "] },
  { province: "MB", patterns: ["manitoba", ", mb", "(mb)", " mb,", "mb,", " mb "] },
];

export function detectProvince(locationStr) {
  if (!locationStr) return "other";
  const lower = " " + locationStr.toLowerCase() + " ";
  for (const { province, patterns } of PROVINCE_MAP) {
    if (patterns.some((p) => lower.includes(p))) return province;
  }
  return "other";
}

// ---- Job type detection ----
export function detectJobType(text) {
  const lower = (text || "").toLowerCase();
  if (lower.includes("part-time") || lower.includes("part time")) return "part-time";
  if (
    lower.includes("contract") ||
    lower.includes("temporary") ||
    lower.includes("fixed-term") ||
    lower.includes("fixed term")
  )
    return "contract";
  return "full-time";
}

// ---- Salary extraction ----
export function extractSalary(text) {
  if (!text) return null;
  const match = text.match(
    /(?:C?\$\s?[\d,]+(?:\.\d{2})?)(?:\s*[-\u2013to]+\s*C?\$\s?[\d,]+(?:\.\d{2})?)?(?:\s*\/?\s*(?:hr|hour|year|yr|annum|annual))?/i
  );
  return match ? match[0].replace(/\s+/g, " ").trim() : null;
}

// ---- Relevance filter ----
const WATER_KEYWORDS = [
  "water operator",
  "wastewater operator",
  "water treatment",
  "wastewater treatment",
  "water and wastewater",
  "water & wastewater",
  "sewer",
  "distribution operator",
  "waterworks",
  "water works",
  "treatment plant",
  "wtp",
  "wwtp",
  "water/wastewater",
  "water distribution",
  "water quality",
  "water resource",
  "utility operator",
  "operator-in-training",
  "operator in training",
  "oit",
  "water systems",
  "water supply",
  "drinking water",
  "water infrastructure",
];
const NEGATIVE_KEYWORDS = [
  "lifeguard",
  "swim instructor",
  "aquatic",
  "pool attendant",
  "water park",
  "waterfront",
  "watercolour",
  "watercolor",
];

export function isWaterJob(title, description) {
  const text = ((title || "") + " " + (description || "")).toLowerCase();
  if (
    NEGATIVE_KEYWORDS.some((kw) => text.includes(kw)) &&
    !WATER_KEYWORDS.some((kw) => text.includes(kw))
  ) {
    return false;
  }
  return WATER_KEYWORDS.some((kw) => text.includes(kw));
}

// ---- Description truncation ----
export function truncate(text, max = 600) {
  if (!text) return null;
  const clean = text.replace(/\s+/g, " ").trim();
  return clean.length > max ? clean.slice(0, max) + "\u2026" : clean;
}

// ---- URL normalization for dedup ----
export function normalizeUrl(url) {
  if (!url) return url;
  try {
    const u = new URL(url);
    const KEEP = ["id", "jobid", "job_id", "vacancyid", "postingid", "jk"];
    const params = new URLSearchParams();
    for (const [k, v] of u.searchParams) {
      if (KEEP.includes(k.toLowerCase())) params.set(k, v);
    }
    u.search = params.toString();
    u.hash = "";
    return u.toString();
  } catch {
    return url.split("?")[0];
  }
}

// ---- Fetch with timeout and polite User-Agent ----
export async function fetchWithTimeout(url, timeoutMs = 15000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        "User-Agent":
          "EchelonInstituteJobBot/1.0 (+https://echeloninstitute.ca; water operator job aggregator)",
        Accept: "application/rss+xml, application/xml, text/xml, */*",
      },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
    return await res.text();
  } finally {
    clearTimeout(timer);
  }
}

// ---- Simple RSS/XML parser (no external deps) ----
export function extractTag(xml, tag) {
  const re = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, "i");
  const m = xml.match(re);
  if (!m) return null;
  return m[1]
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    .replace(/<[^>]+>/g, "")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, " ")
    .trim();
}

export function parseRssItems(xml) {
  const items = [];
  const itemRe = /<item>([\s\S]*?)<\/item>/gi;
  let m;
  while ((m = itemRe.exec(xml)) !== null) {
    const block = m[1];
    const title = extractTag(block, "title");
    const link = extractTag(block, "link");
    const description = extractTag(block, "description");
    const pubDate = extractTag(block, "pubDate");
    const company = extractTag(block, "source") || extractTag(block, "author") || null;
    const location = extractTag(block, "location") || null;
    if (title && link) items.push({ title, link, description, pubDate, company, location });
  }
  return items;
}

// ---- Parse Indeed title format: "Job Title - Company - Location" ----
export function parseIndeedTitle(rawTitle) {
  const parts = rawTitle.split(" - ");
  if (parts.length >= 3)
    return {
      title: parts[0].trim(),
      company: parts[1].trim(),
      location: parts.slice(2).join(" - ").trim(),
    };
  if (parts.length === 2)
    return { title: parts[0].trim(), company: parts[1].trim(), location: null };
  return { title: rawTitle.trim(), company: null, location: null };
}

export const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
