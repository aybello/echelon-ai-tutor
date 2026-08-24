/**
 * Echelon Job Board — Ingestion Orchestrator
 * Runs all RSS tiers, owns the single upsert + expiry logic, prints summary.
 *
 * Usage (manual run):
 *   cd /home/ubuntu/echelon-ai-tutor && node server/scripts/fetchJobs.mjs
 *
 * Also called by the Heartbeat scheduled handler at /api/scheduled/fetchJobs
 */

import "dotenv/config";
import mysql from "mysql2/promise";
import { ingestAssociations } from "./fetchJobsAssociations.mjs";
import { ingestRss } from "./fetchJobsRss.mjs";
import { ingestMunicipal } from "./fetchJobsMunicipal.mjs";

/**
 * Run one complete refresh.
 *
 * Dependencies are injectable so the refresh can be exercised without a live
 * database or network. A fresh SQL connection is opened for every invocation;
 * Heartbeat calls can be hours apart and must not reuse a socket that the
 * database has already closed.
 */
export async function fetchAndIngest(options = {}) {
  const databaseUrl = options.databaseUrl ?? process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error("DATABASE_URL not set");
  }

  const createConnection = options.createConnection ?? mysql.createConnection;
  const ingestRssFn = options.ingestRss ?? ingestRss;
  const ingestAssociationsFn = options.ingestAssociations ?? ingestAssociations;
  const ingestMunicipalFn = options.ingestMunicipal ?? ingestMunicipal;
  const now = options.now ?? (() => new Date());
  const conn = await createConnection(databaseUrl);

  let newCount = 0;
  let seenCount = 0;
  let expiredCount = 0;
  const allErrors = [];
  const runStart = now();

  // Single upsert function passed to every tier.
  async function upsertJob(job) {
    if (!job.sourceUrl) return;
    try {
      const [rows] = await conn.execute(
        "SELECT id FROM job_postings WHERE sourceUrl = ? LIMIT 1",
        [job.sourceUrl]
      );

      if (rows.length > 0) {
        // Refresh lastSeenAt and reactivate if it had been expired
        await conn.execute(
          "UPDATE job_postings SET lastSeenAt = ?, isActive = 1 WHERE id = ?",
          [runStart, rows[0].id]
        );
        seenCount++;
      } else {
        await conn.execute(
          `INSERT INTO job_postings
            (title, company, location, province, salary, jobType, sourceUrl, sourceName, sourceType, description, postedAt, isFeatured, isActive, lastSeenAt, createdAt)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, 1, ?, NOW())`,
          [
            job.title,
            job.company ?? null,
            job.location ?? null,
            job.province ?? "other",
            job.salary ?? null,
            job.jobType ?? "full-time",
            job.sourceUrl,
            job.sourceName,
            job.sourceType ?? "rss",
            job.description ?? null,
            job.postedAt ?? runStart,
            runStart,
          ]
        );
        newCount++;
      }
    } catch (err) {
      if (err.code === "ER_DUP_ENTRY" || /unique/i.test(err.message)) {
        seenCount++;
      } else {
        allErrors.push(`Upsert failed (${job.sourceUrl}): ${err.message}`);
      }
    }
  }

  try {
    console.log("\u2192 Tier 1: RSS ingestion (Job Bank Canada + OWWA)");
    const rss = await ingestRssFn(upsertJob);
    allErrors.push(...rss.errors);

    console.log("\n\u2192 Tier 2: Canadian water-sector association boards");
    const associations = await ingestAssociationsFn(upsertJob);
    allErrors.push(...associations.errors);

    console.log("\n\u2192 Tier 3: Municipal careers page scrapers");
    const municipal = await ingestMunicipalFn(upsertJob);
    allErrors.push(...municipal.errors);

    const successfulSources =
      (rss.successfulSources ?? 0) +
      (associations.successfulSources ?? 0) +
      (municipal.successfulSources ?? 0);
    const failedSources =
      (rss.failedSources ?? 0) +
      (associations.failedSources ?? 0) +
      (municipal.failedSources ?? 0);
    const totalFetched =
      (rss.totalFetched ?? 0) +
      (associations.totalFetched ?? 0) +
      (municipal.totalFetched ?? 0);

    // Never age out the board during a total upstream outage. Once at least one
    // source succeeds, normal 14-day last-seen cleanup can safely resume.
    if (successfulSources > 0 && totalFetched > 0) {
      const staleCutoff = new Date(
        runStart.getTime() - 14 * 24 * 60 * 60 * 1000
      );
      try {
        const [res] = await conn.execute(
          "UPDATE job_postings SET isActive = 0 WHERE isActive = 1 AND lastSeenAt < ?",
          [staleCutoff]
        );
        expiredCount = res.affectedRows ?? 0;
      } catch (err) {
        allErrors.push(`Expiry step: ${err.message}`);
      }
    } else {
      allErrors.push(
        "Expiry skipped because no trustworthy upstream job set was returned; existing jobs were preserved"
      );
    }

    const processedCount = newCount + seenCount;
    // Across the national feeds, a zero-job run is not a healthy refresh. Mark
    // it retryable so silent parser/source changes cannot look successful.
    const ok = successfulSources > 0 && totalFetched > 0 && processedCount > 0;

    console.log(`\n\u2705 Ingestion complete:`);
    console.log(`   New:     ${newCount}`);
    console.log(`   Seen:    ${seenCount} (existing, refreshed)`);
    console.log(`   Expired: ${expiredCount}`);
    console.log(
      `   Sources: ${successfulSources} succeeded, ${failedSources} failed`
    );
    if (allErrors.length) {
      console.warn(`\n\u26a0\ufe0f  ${allErrors.length} error(s):`);
      allErrors.forEach(e => console.warn(`   - ${e}`));
    }

    return {
      ok,
      runStartedAt: runStart.toISOString(),
      newCount,
      seenCount,
      processedCount,
      expiredCount,
      totalFetched,
      successfulSources,
      failedSources,
      errors: allErrors,
    };
  } finally {
    // The connection belongs to this run. Closing it avoids stale sockets and
    // makes retries independent of previous Heartbeat invocations.
    try {
      await conn.end();
    } catch (err) {
      console.warn(
        `[fetch-jobs] database connection close failed: ${err.message}`
      );
    }
  }
}

// Run only when this source file itself is invoked. The module is bundled into
// the production server, where import.meta.url points at dist/index.js; the
// filename guard prevents a server startup from accidentally running the CLI
// path and calling process.exit().
const isDirectRun =
  process.argv[1]?.endsWith("fetchJobs.mjs") &&
  import.meta.url === `file://${process.argv[1]}`;
if (isDirectRun) {
  fetchAndIngest()
    .then(result => process.exit(result.ok ? 0 : 1))
    .catch(err => {
      console.error("Fatal:", err);
      process.exit(1);
    });
}
