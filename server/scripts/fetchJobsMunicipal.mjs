/**
 * Echelon Job Board — Ontario Municipal Careers Page Scraper
 *
 * Scrapes the careers/job-postings pages of 11 Ontario municipalities
 * that post water/wastewater operator jobs on their own sites (or ATS platforms)
 * rather than submitting to Job Bank Canada.
 *
 * Municipalities covered:
 *   1. City of Cambridge         — own site (HTML table)
 *   2. City of Guelph            — iCIMS ATS
 *   3. City of Barrie            — own site
 *   4. OCWA                      — gojobs.gov.on.ca (OPS job board)
 *   5. Region of Waterloo        — custom ATS (careers.regionofwaterloo.ca)
 *   6. Region of Peel            — own site
 *   7. York Region               — own site
 *   8. City of Ottawa            — ottawa.ca (blocks bots — graceful skip)
 *   9. City of Hamilton          — own site
 *  10. Durham Region             — own site
 *  11. City of Brantford         — own site
 *
 * Strategy: fetch HTML, extract job titles from known job-listing containers,
 * filter by water keywords. Each source has its own parser.
 * All errors are caught and logged; a failed source never blocks others.
 */

const WATER_KEYWORDS = [
  "water operator",
  "wastewater operator",
  "waste water operator",
  "water treatment operator",
  "distribution operator",
  "water works operator",
  "waterworks operator",
  "water & wastewater",
  "water and wastewater",
  "water superintendent",
  "water supervisor",
  "water technician",
  "water quality",
  "water infrastructure",
  "water network",
  "water main",
  "wtp operator",
  "wwtp operator",
  "pumping station operator",
  "utilities operator",
  "water trainee",
  "wastewater trainee",
];

// Broader fallback keywords for pages where we already know all listings are jobs
const BROAD_WATER_KEYWORDS = [
  "water",
  "wastewater",
  "waste water",
  "waterworks",
  "treatment plant",
  "water treatment",
  "pumping station",
];

function isWaterJob(title = "", broad = false) {
  const t = title.toLowerCase();
  const keywords = broad ? BROAD_WATER_KEYWORDS : WATER_KEYWORDS;
  return keywords.some((kw) => t.includes(kw));
}

async function fetchHtml(url, timeoutMs = 15000) {
  const res = await fetch(url, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",
      Accept:
        "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      "Accept-Language": "en-CA,en;q=0.9",
      "Cache-Control": "no-cache",
    },
    signal: AbortSignal.timeout(timeoutMs),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status} from ${url}`);
  return res.text();
}

/**
 * Generic extractor: find all <a> tags whose text matches water keywords.
 * Excludes navigation/footer links by requiring href to contain job-related path segments.
 */
function extractJobLinks(html, baseUrl, company, location, jobPathPatterns = []) {
  const jobs = [];
  const seen = new Set();

  // Match all anchor tags
  const linkRe = /<a\s[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/gi;
  let m;
  while ((m = linkRe.exec(html)) !== null) {
    const href = m[1].trim();
    // Strip HTML tags from link text
    const title = m[2].replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();

    if (!title || title.length < 5 || title.length > 200) continue;
    if (!isWaterJob(title)) continue;

    // If jobPathPatterns provided, only accept hrefs matching at least one pattern
    if (
      jobPathPatterns.length > 0 &&
      !jobPathPatterns.some((p) => href.includes(p))
    )
      continue;

    const url = href.startsWith("http") ? href : `${baseUrl}${href}`;
    if (seen.has(url)) continue;
    seen.add(url);

    jobs.push({ title, company, location, province: "ON", sourceUrl: url });
  }
  return jobs;
}

// ─── Per-municipality scrapers ────────────────────────────────────────────

async function scrapeCambridge() {
  const html = await fetchHtml(
    "https://www.cambridge.ca/mayor-city-council-government/careers-volunteering/current-opportunities/"
  );
  return extractJobLinks(
    html,
    "https://www.cambridge.ca",
    "City of Cambridge",
    "Cambridge, ON",
    ["/careers", "/current-opportunities", "/job", "/employment"]
  );
}

async function scrapeGuelph() {
  // iCIMS ATS — search for water keyword
  const html = await fetchHtml(
    "https://careers-guelph.icims.com/jobs/search?ss=1&searchKeyword=water&mobile=false&width=1903&height=500&bga=true&needsRedirect=false"
  );
  const jobs = [];
  // iCIMS job titles are in <h3 class="iCIMS_JobTitle"> or similar
  const titleRe =
    /<a[^>]+href="(\/jobs\/\d+\/[^"]+)"[^>]*>([\s\S]*?)<\/a>/gi;
  let m;
  while ((m = titleRe.exec(html)) !== null) {
    const title = m[2].replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
    if (!isWaterJob(title)) continue;
    jobs.push({
      title,
      company: "City of Guelph",
      location: "Guelph, ON",
      province: "ON",
      sourceUrl: `https://careers-guelph.icims.com${m[1]}`,
    });
  }
  return jobs;
}

async function scrapeBarrie() {
  const html = await fetchHtml(
    "https://www.barrie.ca/government-news/employment-opportunities"
  );
  // Barrie job links are under /government-news/employment-opportunities/
  return extractJobLinks(
    html,
    "https://www.barrie.ca",
    "City of Barrie",
    "Barrie, ON",
    [
      "/employment-opportunities/",
      "/job-posting",
      "/careers/",
      "employment-opportunities/",
    ]
  );
}

async function scrapeOCWA() {
  const jobs = [];
  try {
    // OCWA posts on OPS job board
    const html = await fetchHtml(
      "https://www.gojobs.gov.on.ca/Jobs.aspx?SearchText=water+operator&OrganizationID=&JobID=&JobTypeID=&SalaryID=&CityID=&RegionID=&LanguageID=1"
    );
    const linkRe =
      /<a[^>]+href="([^"]*JobDetails\.aspx[^"]*)"[^>]*>([\s\S]*?)<\/a>/gi;
    let m;
    while ((m = linkRe.exec(html)) !== null) {
      const title = m[2].replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
      if (!isWaterJob(title)) continue;
      const href = m[1];
      const url = href.startsWith("http")
        ? href
        : `https://www.gojobs.gov.on.ca${href}`;
      jobs.push({
        title,
        company: "Ontario Clean Water Agency (OCWA)",
        location: "Ontario",
        province: "ON",
        sourceUrl: url,
      });
    }
  } catch {
    // OPS jobs may block; non-fatal
  }
  return jobs;
}

async function scrapeWaterloo() {
  const html = await fetchHtml("https://careers.regionofwaterloo.ca/RoW/");
  return extractJobLinks(
    html,
    "https://careers.regionofwaterloo.ca",
    "Region of Waterloo",
    "Waterloo Region, ON",
    ["/RoW/", "/jobs/", "/posting/", "/position/"]
  );
}

async function scrapePeel() {
  const html = await fetchHtml("https://www.peelregion.ca/careers/", 25000);
  // Peel job links are under /careers/ subdirectory
  return extractJobLinks(
    html,
    "https://www.peelregion.ca",
    "Region of Peel",
    "Peel Region, ON",
    ["/careers/", "/job/", "/posting/", "/position/", "/employment/"]
  );
}

async function scrapeYorkRegion() {
  const html = await fetchHtml("https://www.york.ca/careers");
  return extractJobLinks(
    html,
    "https://www.york.ca",
    "York Region",
    "York Region, ON",
    ["/careers/", "/job/", "/posting/", "/position/", "/employment/"]
  );
}

async function scrapeOttawa() {
  // Ottawa blocks server-side requests (403 Forbidden)
  // Return empty — their jobs are typically on Job Bank anyway
  return [];
}

async function scrapeHamilton() {
  const html = await fetchHtml(
    "https://www.hamilton.ca/city-council/jobs-city"
  );
  return extractJobLinks(
    html,
    "https://www.hamilton.ca",
    "City of Hamilton",
    "Hamilton, ON",
    ["/jobs/", "/posting/", "/position/", "/employment/", "/careers/", "/city-council/jobs-city/"]
  );
}

async function scrapeDurham() {
  const html = await fetchHtml(
    "https://www.durham.ca/en/regional-government/careers-and-volunteering.aspx"
  );
  return extractJobLinks(
    html,
    "https://www.durham.ca",
    "Durham Region",
    "Durham Region, ON",
    ["/careers", "/job", "/posting", "/employment", "/volunteering"]
  );
}

async function scrapeBrantford() {
  const html = await fetchHtml(
    "https://www.brantford.ca/your-government/careers/"
  );
  return extractJobLinks(
    html,
    "https://www.brantford.ca",
    "City of Brantford",
    "Brantford, ON",
    ["/careers/", "/job/", "/posting/", "/position/", "/employment/"]
  );
}

// ─── Orchestrator ─────────────────────────────────────────────────────────

const SCRAPERS = [
  { name: "City of Cambridge", fn: scrapeCambridge, sourceName: "City of Cambridge" },
  { name: "City of Guelph", fn: scrapeGuelph, sourceName: "City of Guelph" },
  { name: "City of Barrie", fn: scrapeBarrie, sourceName: "City of Barrie" },
  { name: "OCWA", fn: scrapeOCWA, sourceName: "OCWA / OPS Jobs" },
  { name: "Region of Waterloo", fn: scrapeWaterloo, sourceName: "Region of Waterloo" },
  { name: "Region of Peel", fn: scrapePeel, sourceName: "Region of Peel" },
  { name: "York Region", fn: scrapeYorkRegion, sourceName: "York Region" },
  { name: "City of Ottawa", fn: scrapeOttawa, sourceName: "City of Ottawa" },
  { name: "City of Hamilton", fn: scrapeHamilton, sourceName: "City of Hamilton" },
  { name: "Durham Region", fn: scrapeDurham, sourceName: "Durham Region" },
  { name: "City of Brantford", fn: scrapeBrantford, sourceName: "City of Brantford" },
];

export async function ingestMunicipal(upsertJob) {
  const errors = [];
  let totalFetched = 0;

  for (const scraper of SCRAPERS) {
    try {
      const jobs = await scraper.fn();
      let scraperCount = 0;

      for (const job of jobs) {
        try {
          await upsertJob({
            title: job.title,
            company: job.company,
            location: job.location,
            province: job.province ?? "ON",
            salary: null,
            jobType: "full-time",
            sourceUrl: job.sourceUrl,
            sourceName: scraper.sourceName,
            sourceType: "scraper",
            description: null,
            postedAt: new Date(),
          });
          scraperCount++;
          totalFetched++;
        } catch (upsertErr) {
          errors.push(`Upsert error (${scraper.name}): ${upsertErr.message}`);
        }
      }

      if (scraperCount > 0) {
        console.log(`  ✓ ${scraper.name}: ${scraperCount} water/wastewater jobs`);
      } else {
        console.log(`  · ${scraper.name}: 0 water/wastewater jobs found`);
      }
    } catch (err) {
      errors.push(`Scrape failed (${scraper.name}): ${err.message}`);
      console.log(`  ✗ ${scraper.name}: ${err.message}`);
    }
  }

  console.log(`  Total fetched from municipal scrapers: ${totalFetched}`);
  return { errors };
}
