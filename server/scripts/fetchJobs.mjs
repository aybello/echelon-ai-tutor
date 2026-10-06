/**
 * Echelon Job Board — Ingestion Orchestrator
 * Runs all RSS tiers, owns the single upsert + expiry logic, prints summary.
 *
 * Usage (manual run):
 *   node --import tsx server/scripts/fetchJobs.mjs
 *
 * Also called by the Heartbeat scheduled handler at /api/scheduled/fetch-jobs
 */

import "dotenv/config";
import { randomUUID } from "node:crypto";
import mysql from "mysql2/promise";
import { ingestAssociations } from "./fetchJobsAssociations.mjs";
import { ingestRss } from "./fetchJobsRss.mjs";
import { ingestMunicipal } from "./fetchJobsMunicipal.mjs";
import { verifyJob } from "./jobVerification.mjs";
import { assertJobStateKey, JOB_HEALTH_KEY, JOB_REFRESH_LOCK_KEY, jobSourceStateKey, mergeSourceOutcomes, parseJobRefreshHealth, vacancyStateKey } from "../jobBoardState.ts";
import {
  buildJobIdentityKey,
  canonicalizeJobSourceUrl,
  detectProvince,
  normalizeJobIdentityText,
} from "./jobUtils.mjs";

const VALID_PROVINCES = new Set(["ON", "BC", "AB", "SK", "MB", "other"]);
const VALID_SOURCE_TYPES = new Set(["rss", "scraper", "association"]);

/**
 * Run one complete refresh.
 *
 * Dependencies are injectable so the refresh can be exercised without a live
 * database or network. A fresh SQL connection is opened for every invocation;
 * Heartbeat calls can be hours apart and must not reuse a socket that the
 * database has already closed.
 */
export async function fetchAndIngest(options = {}) {
  // Explicit databaseUrl is a test dependency only. Production and the CLI
  // resolve the same active target, TLS policy, and maintenance fence as the app.
  const connectionOptions = options.databaseUrl ??
    (await import("../jobBoardDatabase.ts")).jobBoardConnectionOptions();
  const createConnection = options.createConnection ?? mysql.createConnection;
  const ingestRssFn = options.ingestRss ?? ingestRss;
  const ingestAssociationsFn = options.ingestAssociations ?? ingestAssociations;
  const ingestMunicipalFn = options.ingestMunicipal ?? ingestMunicipal;
  const now = options.now ?? (() => new Date());
  const conn = await createConnection(connectionOptions);

  let newCount = 0;
  let seenCount = 0;
  let failedUpsertCount = 0;
  let expiryFailed = false;
  let expiredCount = 0;
  let deduplicatedCount = 0;
  let duplicateInputCount = 0;
  const allErrors = [];
  const observedProvinces = new Set();
  const seenJobIdentities = new Set();
  const runStart = now();
  let verificationUnavailable = 0;
  let quarantinedCount = 0;
  const candidates = [];
  const degradedVerificationSources = new Set();
  // Feed collection and destination verification share the platform two-minute budget.
  const deadline = Date.now() + 90_000;
  let health = { runStartedAt: runStart.toISOString(), runCompletedAt: null, status: "running", lastSuccessAt: null, sources: [], successfulSources: 0, failedSources: 0, productiveTiers: 0, provinceCount: 0 };
  const claimToken = randomUUID();
  let claimed = false;
  const ownership = "EXISTS (SELECT 1 FROM scheduled_work refresh_lock WHERE refresh_lock.workKey = ? AND refresh_lock.claimToken = ? AND refresh_lock.leaseUntil >= CURRENT_TIMESTAMP)";
  const ownerParams = () => [JOB_REFRESH_LOCK_KEY, claimToken];
  async function assertOwned() {
    const [result] = await conn.execute("UPDATE scheduled_work SET leaseVersion = leaseVersion + 1, leaseUntil = DATE_ADD(CURRENT_TIMESTAMP, INTERVAL 5 MINUTE) WHERE workKey = ? AND claimToken = ? AND leaseUntil >= CURRENT_TIMESTAMP", ownerParams());
    if (result.affectedRows !== 1) throw new Error("Jobs refresh ownership expired or changed");
  }
  async function saveState(key, status, value) {
    assertJobStateKey(key);
    await assertOwned();
    const [result] = await conn.execute(`INSERT INTO scheduled_work (workKey, status, lastError, completedAt) SELECT ?, ?, ?, ? WHERE ${ownership}
      ON DUPLICATE KEY UPDATE status = VALUES(status), lastError = VALUES(lastError), completedAt = VALUES(completedAt)`, [key, status, JSON.stringify(value), now(), ...ownerParams()]);
    if (result.affectedRows === 0) await assertOwned();
  }

  // Parsers only collect candidates. Verification runs with bounded concurrency,
  // never one network request at a time through a large RSS inventory.
  async function upsertJob(job) { candidates.push(job); }
  async function processJob(job) {
    if (!job.sourceUrl) return;
    const sourceUrl = canonicalizeJobSourceUrl(job);
    const normalizedJob = { ...job, sourceUrl };
    const identityKey = buildJobIdentityKey(normalizedJob);
    if (seenJobIdentities.has(identityKey)) { duplicateInputCount++; return; }
    seenJobIdentities.add(identityKey);
    const verification = await (options.verifyJob ?? verifyJob)(normalizedJob, { now: runStart });
    if (verification.status === "unavailable") {
      // A temporary upstream failure is not evidence of closure. Keep prior
      // verified state/inventory untouched, do not advance its seen timestamp.
      verificationUnavailable++;
      degradedVerificationSources.add(job.outcomeSource ?? job.sourceName);
      return;
    }
    await saveState(vacancyStateKey(sourceUrl), verification.status === "verified" ? "verified" : "quarantined", verification);
    if (verification.status !== "verified") {
      quarantinedCount++;
      await conn.execute(`UPDATE job_postings SET isActive = 0 WHERE sourceUrl = ? AND ${ownership}`, [sourceUrl, ...ownerParams()]);
      return;
    }
    normalizedJob.postedAt = verification.postedAt ?? null;
    const inferredProvince = detectProvince(
      [normalizedJob.location, normalizedJob.title, normalizedJob.description]
        .filter(Boolean)
        .join(" ")
    );
    const province =
      inferredProvince !== "other"
        ? inferredProvince
        : VALID_PROVINCES.has(normalizedJob.province)
          ? normalizedJob.province
          : "other";
    const sourceType = VALID_SOURCE_TYPES.has(normalizedJob.sourceType)
      ? normalizedJob.sourceType
      : "rss";
    try {
      const sourceNameIdentity = normalizeJobIdentityText(normalizedJob.sourceName);
      const titleIdentity = normalizeJobIdentityText(normalizedJob.title);
      const companyIdentity = normalizeJobIdentityText(normalizedJob.company);
      const locationIdentity = normalizeJobIdentityText(normalizedJob.location);
      const [rows] = await conn.execute(
        `SELECT id, sourceUrl FROM job_postings
         WHERE sourceUrl = ?
            OR (
              LOWER(TRIM(COALESCE(sourceName, ''))) = ?
              AND LOWER(TRIM(title)) = ?
              AND LOWER(TRIM(COALESCE(company, ''))) = ?
              AND LOWER(TRIM(COALESCE(location, ''))) = ?
            )
         ORDER BY CASE WHEN sourceUrl = ? THEN 0 ELSE 1 END, id`,
        [
          sourceUrl,
          sourceNameIdentity,
          titleIdentity,
          companyIdentity,
          locationIdentity,
          sourceUrl,
        ]
      );

      if (rows.length > 0) {
        const canonicalRow = rows[0];
        // Refresh the complete source record so parser and classification fixes
        // repair existing rows instead of preserving stale public data forever.
        await conn.execute(
          `UPDATE job_postings SET
             title = ?,
             company = COALESCE(?, company),
             location = COALESCE(?, location),
             province = CASE WHEN ? = 'other' THEN province ELSE ? END,
             salary = COALESCE(?, salary),
             jobType = ?,
             sourceUrl = ?,
             sourceName = ?,
             sourceType = ?,
             description = COALESCE(?, description),
             postedAt = ?,
             lastSeenAt = ?,
             isActive = 1
           WHERE id = ? AND ${ownership}`,
          [
            normalizedJob.title,
            normalizedJob.company ?? null,
            normalizedJob.location ?? null,
            province,
            province,
            normalizedJob.salary ?? null,
            normalizedJob.jobType ?? "full-time",
            sourceUrl,
            normalizedJob.sourceName,
            sourceType,
            normalizedJob.description ?? null,
            normalizedJob.postedAt ?? null,
            runStart,
            canonicalRow.id,
            ...ownerParams(),
          ]
        );
        const duplicateIds = rows.slice(1).map(row => row.id);
        if (duplicateIds.length > 0) {
          const placeholders = duplicateIds.map(() => "?").join(", ");
          await conn.execute(
            `UPDATE job_postings
             SET isActive = 0, lastSeenAt = ?
             WHERE id IN (${placeholders}) AND ${ownership}`,
            [runStart, ...duplicateIds, ...ownerParams()]
          );
          deduplicatedCount += duplicateIds.length;
        }
        if (province !== "other") observedProvinces.add(province);
        seenCount++;
      } else {
        await conn.execute(
          `INSERT INTO job_postings
            (title, company, location, province, salary, jobType, sourceUrl, sourceName, sourceType, description, postedAt, isFeatured, isActive, lastSeenAt, createdAt)
           SELECT ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, 1, ?, NOW() WHERE ${ownership}`,
          [
            normalizedJob.title,
            normalizedJob.company ?? null,
            normalizedJob.location ?? null,
            province,
            normalizedJob.salary ?? null,
            normalizedJob.jobType ?? "full-time",
            sourceUrl,
            normalizedJob.sourceName,
            sourceType,
            normalizedJob.description ?? null,
            normalizedJob.postedAt ?? null,
            runStart,
            ...ownerParams(),
          ]
        );
        if (province !== "other") observedProvinces.add(province);
        newCount++;
      }
    } catch (err) {
      if (err.code === "ER_DUP_ENTRY" || /unique/i.test(err.message)) {
        seenCount++;
      } else {
        failedUpsertCount++;
        allErrors.push(`Upsert failed (${sourceUrl}): ${err.message}`);
      }
    }
  }

  try {
    await conn.execute("INSERT IGNORE INTO scheduled_work (workKey, status) VALUES (?, 'job-idle')", [JOB_REFRESH_LOCK_KEY]);
    const [lock] = await conn.execute("UPDATE scheduled_work SET status = 'job-locked', claimToken = ?, leaseUntil = DATE_ADD(CURRENT_TIMESTAMP, INTERVAL 5 MINUTE), attempts = attempts + 1 WHERE workKey = ? AND (claimToken IS NULL OR leaseUntil < CURRENT_TIMESTAMP)", [claimToken, JOB_REFRESH_LOCK_KEY]);
    if (lock.affectedRows !== 1) throw new Error("Jobs refresh is already running");
    claimed = true;
    const [stateRows] = await conn.execute("SELECT lastError FROM scheduled_work WHERE workKey = ?", [JOB_HEALTH_KEY]);
    try {
      const previous = parseJobRefreshHealth(stateRows[0]?.lastError ?? "null");
      health.lastSuccessAt = previous?.lastSuccessAt ?? null;
      health.sources = previous?.sources ?? [];
    } catch { /* malformed prior telemetry cannot claim success */ }
    await saveState(JOB_HEALTH_KEY, "running", health);
    console.log("[fetch-jobs] Refreshing RSS, association and municipal sources");
    // Wait for all tiers, including on unexpected parser rejection, before
    // closing their shared connection. Independent sources need not wait for
    // another tier's network timeout before they can contribute fresh jobs.
    const tiers = await Promise.allSettled([
      ingestRssFn(upsertJob),
      ingestAssociationsFn(upsertJob),
      ingestMunicipalFn(upsertJob),
    ]);
    const rejected = tiers.find(result => result.status === "rejected");
    if (rejected) throw rejected.reason;
    const [rss, associations, municipal] = tiers.map(result => result.value);
    let cursor = 0;
    const processed = await Promise.allSettled(Array.from({ length: 8 }, async () => {
      while (cursor < candidates.length) {
        const candidate = candidates[cursor++];
        if (Date.now() >= deadline) {
          verificationUnavailable++;
          degradedVerificationSources.add(candidate.outcomeSource ?? candidate.sourceName);
          continue;
        }
        await processJob(candidate);
      }
    }));
    const processingFailure = processed.find(result => result.status === "rejected");
    if (processingFailure) throw processingFailure.reason;
    allErrors.push(...rss.errors);
    allErrors.push(...associations.errors);
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
    const productiveTiers = [rss, associations, municipal].filter(
      result => (result.totalFetched ?? 0) > 0
    ).length;
    const provinceCount = observedProvinces.size;
    const hasNationalCoverage = productiveTiers >= 2 && provinceCount >= 2;
    const sourceOutcomes = [rss, associations, municipal].flatMap((tier, index) => tier.sourceOutcomes ?? [{ source: ["rss", "associations", "municipal"][index], status: tier.failedSources || tier.errors.length ? "failed" : "success", count: tier.totalFetched ?? 0 }])
      .map(outcome => ({ ...outcome, status: degradedVerificationSources.has(outcome.source) ? "degraded" : outcome.status }));
    const mergedSources = mergeSourceOutcomes(health.sources, sourceOutcomes, runStart.toISOString());
    const sourceCoverageComplete = mergedSources.every(source => source.status === "success");

    // Never age out national inventory during a partial-source refresh. At
    // least two independent tiers and provinces must contribute current jobs.
    if (hasNationalCoverage && sourceCoverageComplete && failedSources === 0 && verificationUnavailable === 0 && failedUpsertCount === 0 && allErrors.length === 0 && options.skipExpiry !== true) {
      const staleCutoff = new Date(
        runStart.getTime() - 14 * 24 * 60 * 60 * 1000
      );
      try {
        await assertOwned();
        const [res] = await conn.execute(
          `UPDATE job_postings SET isActive = 0 WHERE isActive = 1 AND lastSeenAt < ? AND ${ownership}`,
          [staleCutoff, ...ownerParams()]
        );
        expiredCount = res.affectedRows ?? 0;
      } catch (err) {
        expiryFailed = true;
        allErrors.push(`Expiry step: ${err.message}`);
      }
    } else if (!hasNationalCoverage) {
      allErrors.push(
        `Expiry skipped because national coverage was incomplete (${productiveTiers} productive tiers, ${provinceCount} provinces); existing jobs were preserved`
      );
    }

    const processedCount = newCount + seenCount;
    // Across the national feeds, a zero-job run is not a healthy refresh. Mark
    // it retryable so silent parser/source changes cannot look successful.
    const ok =
      successfulSources > 0 &&
      totalFetched > 0 &&
      processedCount > 0 &&
      failedUpsertCount === 0 &&
      !expiryFailed &&
      failedSources === 0 &&
      verificationUnavailable === 0 &&
      allErrors.length === 0 &&
      hasNationalCoverage && sourceCoverageComplete;

    health = { ...health, runCompletedAt: now().toISOString(), status: ok ? "complete" : "degraded", lastSuccessAt: ok ? now().toISOString() : health.lastSuccessAt, sources: mergedSources, successfulSources, failedSources, productiveTiers, provinceCount };
    health.successfulSources = health.sources.filter(source => source.status === "success").length;
    health.failedSources = health.sources.filter(source => source.status !== "success").length;
    for (const source of health.sources) await saveState(jobSourceStateKey(source.source), source.status, source);
    await saveState(JOB_HEALTH_KEY, health.status, health);

    console.log(`\n[fetch-jobs] Ingestion ${ok ? "complete" : "degraded"}:`);
    console.log(`   New:     ${newCount}`);
    console.log(`   Seen:    ${seenCount} (existing, refreshed)`);
    console.log(
      `   Deduped: ${deduplicatedCount} stored rows, ${duplicateInputCount} repeated source rows`
    );
    console.log(`   Failed:  ${failedUpsertCount} database upserts`);
    console.log(`   Expired: ${expiredCount}`);
    console.log(
      `   Sources: ${successfulSources} succeeded, ${failedSources} failed`
    );
    console.log(
      `   Coverage: ${productiveTiers} productive tiers, ${provinceCount} provinces`
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
      failedUpsertCount,
      expiredCount,
      deduplicatedCount,
      duplicateInputCount,
      totalFetched,
      successfulSources,
      failedSources,
      productiveTiers,
      provinceCount,
      provinces: [...observedProvinces].sort(),
      verificationUnavailable,
      quarantinedCount,
      errors: allErrors,
    };
  } catch (error) {
    // Keep failure/last success durable even if a whole parser tier rejects.
    if (claimed) {
      health = { ...health, status: "failed", runCompletedAt: now().toISOString(), successfulSources: 0, failedSources: health.sources.length, sources: health.sources.map(source => ({ ...source, status: "degraded", count: 0 })) };
      for (const source of health.sources) await saveState(jobSourceStateKey(source.source), source.status, source).catch(() => {});
      await saveState(JOB_HEALTH_KEY, "failed", health).catch(() => {});
    }
    throw error;
  } finally {
    if (claimed) await conn.execute("UPDATE scheduled_work SET status = 'job-idle', claimToken = NULL, leaseUntil = NULL WHERE workKey = ? AND claimToken = ?", ownerParams()).catch(() => {});
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
