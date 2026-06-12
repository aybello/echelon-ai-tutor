/**
 * Echelon Job Board — RSS/Atom Ingestion
 *
 * Sources:
 *   Government of Canada Job Bank (Atom feed)
 *   - NOC 92101: Water and waste treatment plant operators (primary)
 *   - NOC 92011: Supervisors, petroleum/gas/chemical/utilities (includes water plant supers)
 *   - Keyword feeds: water operator, water treatment operator (with relevance filter)
 *
 * Indeed blocks server-side requests (HTTP 403).
 * CivicJobs.ca does not expose a public RSS feed.
 * Job Bank Atom feed is the most reliable public source for Canadian operator jobs.
 */

import { XMLParser } from "fast-xml-parser";

const JOB_BANK_BASE =
  "https://www.jobbank.gc.ca/jobsearch/feed/jobSearchRSSfeed";

// NOC-code based feeds — very precise, no false positives
const NOC_FEEDS = [
  {
    name: "Job Bank — Water & Wastewater Operators (NOC 92101)",
    url: `${JOB_BANK_BASE}?fn21=92101&sort=D&rows=100`,
    requiresFilter: false,
  },
  {
    name: "Job Bank — Utilities Supervisors (NOC 92011)",
    url: `${JOB_BANK_BASE}?fn21=92011&sort=D&rows=100`,
    requiresFilter: true, // NOC 92011 includes non-water roles, filter required
  },
];

// Keyword-based feeds — broader but need relevance filtering
const KEYWORD_FEEDS = [
  {
    name: "Job Bank — keyword: water operator",
    url: `${JOB_BANK_BASE}?searchstring=water+operator&sort=D&rows=100`,
    requiresFilter: true,
  },
  {
    name: "Job Bank — keyword: water treatment operator",
    url: `${JOB_BANK_BASE}?searchstring=water+treatment+operator&sort=D&rows=100`,
    requiresFilter: true,
  },
  {
    name: "Job Bank — keyword: wastewater treatment operator",
    url: `${JOB_BANK_BASE}?searchstring=wastewater+treatment+operator&sort=D&rows=100`,
    requiresFilter: true,
  },
  {
    name: "Job Bank — keyword: drinking water operator",
    url: `${JOB_BANK_BASE}?searchstring=drinking+water+operator&sort=D&rows=100`,
    requiresFilter: true,
  },
];

// Water/wastewater relevance keywords — title must match at least one
const WATER_KEYWORDS = [
  "water",
  "wastewater",
  "waste water",
  "waterworks",
  "water works",
  "treatment plant",
  "water treatment",
  "distribution operator",
  "water utility",
  "water system",
  "pumping station",
  "pumphouse",
  "pump house",
  "water operator",
  "wtp operator",
  "wwtp",
  "water superintendent",
  "water supervisor",
  "water technician",
  "water quality",
  "water infrastructure",
  "water network",
  "water main",
  "water service",
];

function isWaterJob(title = "", description = "") {
  const combined = `${title} ${description}`.toLowerCase();
  return WATER_KEYWORDS.some((kw) => combined.includes(kw));
}

// Province detection from location string
function detectProvince(location = "") {
  const loc = location.toUpperCase();
  if (/\bON\b|ONTARIO/.test(loc)) return "ON";
  if (/\bBC\b|BRITISH COLUMBIA/.test(loc)) return "BC";
  if (/\bAB\b|ALBERTA/.test(loc)) return "AB";
  if (/\bSK\b|SASKATCHEWAN/.test(loc)) return "SK";
  if (/\bMB\b|MANITOBA/.test(loc)) return "MB";
  return "other";
}

// Parse salary from Job Bank summary HTML snippet
function parseSalary(summary = "") {
  const match = summary.match(
    /Salary[^$]*\$?([\d,.]+(?: to [\d,.]+)?(?:\s*hourly|\s*annually|\s*weekly)?)/i
  );
  return match ? match[1].trim() : null;
}

// Parse employer from Job Bank summary HTML snippet
function parseEmployer(summary = "") {
  const match = summary.match(/Employer[^:]*:\s*<\/strong>\s*([^<\n]+)/i);
  return match ? match[1].trim() : null;
}

// Parse location from Job Bank summary HTML snippet
function parseLocation(summary = "") {
  const match = summary.match(/Location[^:]*:\s*<\/strong>\s*([^<\n]+)/i);
  return match ? match[1].trim() : null;
}

async function fetchFeed(feed, parser) {
  const res = await fetch(feed.url, {
    headers: {
      "User-Agent":
        "EchelonInstitute-JobBoard/1.0 (+https://echeloninstitute.ca)",
      Accept: "application/atom+xml, application/xml, text/xml",
    },
    signal: AbortSignal.timeout(15000),
  });

  if (!res.ok) {
    throw new Error(`HTTP ${res.status}`);
  }

  const xml = await res.text();
  const parsed = parser.parse(xml);
  const feed_data = parsed.feed;

  if (!feed_data) {
    throw new Error("No <feed> element in response");
  }

  const entries = Array.isArray(feed_data.entry)
    ? feed_data.entry
    : feed_data.entry
    ? [feed_data.entry]
    : [];

  return entries;
}

export async function ingestRss(upsertJob) {
  const errors = [];
  let totalFetched = 0;
  const seenUrls = new Set(); // deduplicate across feeds

  const parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: "@_",
    cdataPropName: "__cdata",
    parseTagValue: true,
  });

  const allFeeds = [...NOC_FEEDS, ...KEYWORD_FEEDS];

  for (const feed of allFeeds) {
    try {
      const entries = await fetchFeed(feed, parser);
      let feedCount = 0;
      let skipped = 0;

      for (const entry of entries) {
        try {
          const title = (entry.title?.__cdata ?? entry.title ?? "").trim();

          // Link — Atom uses <link rel="alternate" href="..."/>
          let sourceUrl = "";
          if (Array.isArray(entry.link)) {
            const alt = entry.link.find((l) => l["@_rel"] === "alternate");
            sourceUrl = alt?.["@_href"] ?? entry.link[0]?.["@_href"] ?? "";
          } else if (entry.link) {
            sourceUrl = entry.link["@_href"] ?? entry.link ?? "";
          }

          if (!sourceUrl || !title) continue;

          // Deduplicate across feeds
          if (seenUrls.has(sourceUrl)) continue;
          seenUrls.add(sourceUrl);

          const summary = entry.summary?.__cdata ?? entry.summary ?? "";
          const location = parseLocation(summary);
          const company = parseEmployer(summary);
          const salary = parseSalary(summary);
          const province = detectProvince(location ?? "");

          const description = summary
            .replace(/<[^>]+>/g, " ")
            .replace(/\s+/g, " ")
            .trim()
            .slice(0, 400);

          // Apply relevance filter for feeds that need it
          if (feed.requiresFilter && !isWaterJob(title, description)) {
            skipped++;
            continue;
          }

          const postedAt = entry.updated ? new Date(entry.updated) : new Date();

          await upsertJob({
            title,
            company,
            location,
            province,
            salary,
            jobType: "full-time",
            sourceUrl,
            sourceName: "Job Bank Canada",
            sourceType: "rss",
            description,
            postedAt,
          });

          feedCount++;
          totalFetched++;
        } catch (entryErr) {
          errors.push(
            `Entry parse error (${feed.name}): ${entryErr.message}`
          );
        }
      }

      console.log(
        `  ✓ ${feed.name}: ${feedCount} relevant jobs${skipped > 0 ? ` (${skipped} filtered out)` : ""}`
      );
    } catch (err) {
      errors.push(
        `RSS fetch failed (${feed.name} — ${feed.url}): ${err.message}`
      );
    }
  }

  console.log(`  Total fetched from all feeds: ${totalFetched}`);
  return { errors };
}
