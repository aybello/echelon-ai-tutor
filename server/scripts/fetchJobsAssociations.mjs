/**
 * Echelon Job Board — Canadian water-sector association boards
 *
 * These boards aggregate vacancies from many employers and complement the
 * direct municipal scrapers. Only publicly accessible listings are included;
 * boards that require membership/login to view job details are intentionally
 * excluded.
 */

import { parseJobDates } from "./jobVerification.mjs";
import {
  decodeHtmlEntities,
  detectJobType,
  detectProvince,
  fetchWithTimeout,
  isWaterJob,
  truncate,
} from "./jobUtils.mjs";

function cleanText(value = "") {
  return decodeHtmlEntities(
    value
      .replace(/<script[\s\S]*?<\/script>/gi, " ")
      .replace(/<style[\s\S]*?<\/style>/gi, " ")
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim()
  );
}

function absoluteUrl(href, baseUrl) {
  return decodeHtmlEntities(new URL(href, baseUrl).toString());
}

function blocksFromMarkers(html, marker) {
  const starts = [...html.matchAll(marker)].map(match => match.index);
  return starts.map((start, index) =>
    html.slice(start, starts[index + 1] ?? html.length)
  );
}

export function parseAwwOA(html) {
  const jobs = [];
  const itemRe = /<li\b[^>]*>([\s\S]*?)<\/li>/gi;
  let item;
  while ((item = itemRe.exec(html)) !== null) {
    const block = item[1];
    if (!/class="[^"]*closing[^"]*"/i.test(block)) continue;
    const company = cleanText(block.match(/<h3[^>]*>([\s\S]*?)<\/h3>/i)?.[1]);
    const location = cleanText(
      block.match(
        /<span[^>]*class="[^"]*location[^"]*"[^>]*>([\s\S]*?)<\/span>/i
      )?.[1]
    );
    const link = block.match(/<a\b[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/i);
    if (!link) continue;
    const title = cleanText(link[2]);
    if (!title || !isWaterJob(title, block)) continue;
    jobs.push({
      title,
      company: company || "AWWOA member employer",
      location: location || "Alberta",
      province: detectProvince(location || "Alberta"),
      sourceUrl: absoluteUrl(link[1], "https://www.awwoa.ca"),
      ...parseJobDates(block),
      description: truncate(cleanText(block)),
      jobType: detectJobType(block),
    });
  }
  return jobs;
}

// SWWA's public card column uses MM/DD/YY, unlike the shared date grammar.
// Accept only the complete evidenced date; timed/invalid values stay unknown.
function swwaClosingDate(value) {
  const date = value.match(/^(\d{2})\/(\d{2})\/(\d{2})$/);
  if (!date) return null;
  return parseJobDates(`Closing Date: 20${date[3]}-${date[1]}-${date[2]}`).closingAt;
}

const swwaEmploymentTypes = new Map([
  ["full time", "full-time"],
  ["full-time", "full-time"],
  ["part time", "part-time"],
  ["part-time", "part-time"],
  ["contract", "contract"],
  ["temporary", "contract"],
]);

function swwaHeaderEmployer(detailHtml, title, location) {
  const paragraphs = [...detailHtml.matchAll(/<p\b[^>]*>([\s\S]*?)<\/p>/gi)]
    .slice(0, 3).map(match => cleanText(match[1]));
  // Captured headers: employer/type/title, or location/employer/type-title.
  // Do not search arbitrary description prose for a plausible company name.
  if (paragraphs[2] === title && /^(?:full|part)[- ]time$/i.test(paragraphs[1] ?? "")) return paragraphs[0];
  const city = location.split(",")[0].trim();
  const locations = [`${city},SK`, `${city},Saskatchewan`].map(value => value.replace(/\s/g, "").toLowerCase());
  if (locations.includes((paragraphs[0] ?? "").replace(/\s/g, "").toLowerCase()) &&
      /^(?:Full|Part)[- ]time-/i.test(paragraphs[2] ?? "") &&
      paragraphs[2].replace(/^(?:Full|Part)[- ]time-/i, "") === title) return paragraphs[1];
  return null;
}

export function parseSwwa(html) {
  const jobs = [];
  const blocks = blocksFromMarkers(
    html,
    /<div\b[^>]*class="[^"]*item\s+listing-item[^"]*"[^>]*>/gi
  );
  for (const block of blocks) {
    const title = cleanText(
      block.match(
        /<div[^>]*class="[^"]*list-column\s+title[^"]*"[^>]*>([\s\S]*?)<\/div>/i
      )?.[1]
    );
    const location = cleanText(
      block.match(
        /<div[^>]*class="[^"]*list-column\s+location[^"]*"[^>]*>([\s\S]*?)<\/div>/i
      )?.[1]
    ).replace(/^Location:\s*/i, "");
    const link = block.match(
      /<a\b[^>]*class="[^"]*\bapply\b[^"]*"[^>]*href="([^"]+)"/i
    );
    if (!title || !link || !isWaterJob(title, block)) continue;
    const detailHtml = block.match(
      /<div[^>]*class="[^"]*job-details[^"]*"[^>]*>([\s\S]*)/i
    )?.[1];
    const detailLabels = [
      ...(detailHtml ?? "").matchAll(/<strong>([\s\S]*?)<\/strong>/gi),
    ].map(match => cleanText(match[1]));
    const company =
      swwaHeaderEmployer(detailHtml ?? "", title, location) ||
      (detailLabels.find(
        label => !title.toLowerCase().includes(label.toLowerCase())
      ) ?? detailLabels[0]);
    const closingColumn = block.match(/<div[^>]*class="[^"]*list-column\s+closing[^"]*"[^>]*>([\s\S]*?)<\/div>/i);
    const typeColumn = block.match(/<div[^>]*class="[^"]*list-column\s+type[^"]*"[^>]*>([\s\S]*?)<\/div>/i);
    const type = cleanText(typeColumn?.[1]).replace(/^Position Type:\s*/i, "").toLowerCase();
    const jobType = typeColumn ? (swwaEmploymentTypes.get(type) ?? null) : detectJobType(block);
    jobs.push({
      title,
      company: company || "SWWA member employer",
      location: location || "Saskatchewan",
      province: detectProvince(location || "Saskatchewan"),
      sourceUrl: absoluteUrl(link[1], "https://www.swwa.ca"),
      ...parseJobDates(block),
      ...(closingColumn ? { closingAt: swwaClosingDate(cleanText(closingColumn[1]).replace(/^Closing:\s*/i, "")) } : {}),
      description: truncate(cleanText(block)),
      jobType,
    });
  }
  return jobs;
}

export function parseCwwa(html) {
  const jobs = [];
  const blocks = blocksFromMarkers(
    html,
    /<div\b[^>]*class="[^"]*et_pb_row[^"]*"[^>]*>/gi
  );
  for (const block of blocks) {
    const labels = [
      ...block.matchAll(
        /<h4[^>]*>[\s\S]*?<span>([\s\S]*?)<\/span>[\s\S]*?<\/h4>/gi
      ),
    ].map(match => cleanText(match[1]));
    const link = block.match(
      /<a\b[^>]*href="([^"]+)"[^>]*>[\s\S]*?(?:Download|Apply)[\s\S]*?<\/a>/i
    );
    if (labels.length < 2 || !link) continue;
    const [title, company] = labels;
    jobs.push({
      title,
      company,
      location: "Canada",
      province: "other",
      sourceUrl: absoluteUrl(link[1], "https://cwwa.ca"),
      description: null,
      jobType: "full-time",
    });
  }
  return jobs;
}

export function parseCwra(html) {
  const jobs = [];
  const positionRe =
    /<strong[^>]*>\s*Position available:\s*<\/strong>\s*([^<]+)<\/p>[\s\S]*?<strong[^>]*>\s*Location:\s*<\/strong>\s*([^<]+)<\/p>([\s\S]*?)(?=<strong[^>]*>\s*Position available:|$)/gi;
  let position;
  while ((position = positionRe.exec(html)) !== null) {
    const title = cleanText(position[1]);
    const location = cleanText(position[2]);
    const remainder = position[3];
    const links = [
      ...remainder.matchAll(/<a\b[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/gi),
    ];
    const applyLink = links[0];
    if (!title || !applyLink || !isWaterJob(title, remainder)) continue;
    jobs.push({
      title,
      company: /^(?:here|learn more|apply|view)$/i.test(cleanText(applyLink[2]))
        ? "Canadian Water Resources Association"
        : cleanText(applyLink[2]) || "CWRA member employer",
      location,
      province: detectProvince(location),
      sourceUrl: absoluteUrl(applyLink[1], "https://cwra.org"),
      ...parseJobDates(remainder),
      description: truncate(cleanText(remainder)),
      jobType: detectJobType(remainder),
    });
  }
  return jobs;
}

const ASSOCIATION_SOURCES = [
  {
    name: "CWWA — Canadian Water and Wastewater Association",
    url: "https://cwwa.ca/water-jobs/",
    parser: parseCwwa,
  },
  {
    name: "CWRA — Canadian Water Resources Association",
    url: "https://cwra.org/job-board/",
    parser: parseCwra,
  },
  {
    name: "AWWOA — Alberta Water & Wastewater Operators Association",
    url: "https://www.awwoa.ca/careers/career-posting",
    parser: parseAwwOA,
  },
  {
    name: "SWWA — Saskatchewan Water and Wastewater Association",
    url: "https://www.swwa.ca/careers",
    parser: parseSwwa,
  },
];

export async function ingestAssociations(upsertJob, options = {}) {
  const results = await Promise.all(
    ASSOCIATION_SOURCES.map(async source => {
      try {
        const html = await fetchWithTimeout(source.url, 20000, options);
        return { source, jobs: source.parser(html), error: null };
      } catch (error) {
        return { source, jobs: [], error };
      }
    })
  );
  const errors = [];
  const sourceOutcomes = [];
  let totalFetched = 0;
  let successfulSources = 0;
  let failedSources = 0;

  for (const { source, jobs, error } of results) {
    if (error) {
      failedSources++;
      sourceOutcomes.push({ source: source.name, status: "failed", count: 0 });
      errors.push(
        `Association fetch failed (${source.name}): ${error.message}`
      );
      console.log(`  ✗ ${source.name}: ${error.message}`);
      continue;
    }
    successfulSources++;
    sourceOutcomes.push({ source: source.name, status: "success", count: jobs.length });
    for (const job of jobs) {
      try {
        await upsertJob({
          ...job,
          sourceName: source.name,
          sourceType: "association",
        });
        totalFetched++;
      } catch (upsertError) {
        errors.push(
          `Association upsert failed (${source.name}): ${upsertError.message}`
        );
      }
    }
    console.log(
      `  ${jobs.length ? "✓" : "·"} ${source.name}: ${jobs.length} jobs`
    );
  }

  return { errors, totalFetched, successfulSources, failedSources, sourceOutcomes };
}
