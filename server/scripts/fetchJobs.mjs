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
import { ingestRss } from "./fetchJobsRss.mjs";

const DB_URL = process.env.DATABASE_URL;
if (!DB_URL) {
  console.error("DATABASE_URL not set");
  process.exit(1);
}

// Raw mysql2 connection — avoids importing TypeScript files from .mjs
const conn = await mysql.createConnection(DB_URL);

export async function fetchAndIngest() {
  let newCount = 0;
  let seenCount = 0;
  let expiredCount = 0;
  const allErrors = [];
  const runStart = new Date();

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

  console.log("\u2192 Tier 1: RSS ingestion (Indeed + Job Bank)");
  const rss = await ingestRss(upsertJob);
  allErrors.push(...rss.errors);

  // Expiry: mark inactive anything not seen in 14 days
  const staleCutoff = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);
  try {
    const [res] = await conn.execute(
      "UPDATE job_postings SET isActive = 0 WHERE isActive = 1 AND lastSeenAt < ?",
      [staleCutoff]
    );
    expiredCount = res.affectedRows ?? 0;
  } catch (err) {
    allErrors.push(`Expiry step: ${err.message}`);
  }

  console.log(`\n\u2705 Ingestion complete:`);
  console.log(`   New:     ${newCount}`);
  console.log(`   Seen:    ${seenCount} (existing, refreshed)`);
  console.log(`   Expired: ${expiredCount}`);
  if (allErrors.length) {
    console.warn(`\n\u26a0\ufe0f  ${allErrors.length} error(s):`);
    allErrors.forEach((e) => console.warn(`   - ${e}`));
  }

  return { newCount, seenCount, expiredCount, errors: allErrors };
}

// Run if invoked directly
if (import.meta.url === `file://${process.argv[1]}`) {
  fetchAndIngest()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error("Fatal:", err);
      process.exit(1);
    });
}
