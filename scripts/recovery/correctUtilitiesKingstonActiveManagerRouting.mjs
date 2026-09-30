#!/usr/bin/env node
/**
 * One-time, audited repair of active Utilities Kingston dashboard routing.
 *
 * Production currently has two populated active rosters whose labels and manager
 * identities point to the opposite operating cohort. This transaction swaps only
 * those two organization labels, stream tags, manager identities, and their two
 * manager-membership emails. It never moves or changes an operator, attempt,
 * activity record, subscription, entitlement, payment, seat count, or term.
 *
 * Usage:
 *   node scripts/recovery/correctUtilitiesKingstonActiveManagerRouting.mjs plan
 *   KINGSTON_ACTIVE_MANAGER_ROUTING_APPROVED=SWAP_ACTIVE_MANAGER_ROUTING_2026_09_30 \
 *     node scripts/recovery/correctUtilitiesKingstonActiveManagerRouting.mjs apply --plan-digest <digest>
 */

import { createHash } from "node:crypto";
import { chmodSync, existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import mysql from "mysql2/promise";

export const CORRECTION_KEY = "utilities-kingston-active-manager-routing-correction-2026-09-30";
export const SCRIPT_VERSION = "2.1.0";
const APPLY_APPROVAL = "SWAP_ACTIVE_MANAGER_ROUTING_2026_09_30";
const PRIVATE_ROOT = "/home/ubuntu/private/echelon-authoritative-recovery/kingston-active-manager-routing-correction-2026-09-30";
const LOCK_NAME = "echelon:utilities-kingston-active-manager-routing:v2";

export function sha256(value) {
  return createHash("sha256").update(typeof value === "string" ? value : JSON.stringify(value)).digest("hex");
}

export function stable(value) {
  if (Array.isArray(value)) return `[${value.map(stable).join(",")}]`;
  if (value && typeof value === "object") {
    return `{${Object.keys(value).sort().map(key => `${JSON.stringify(key)}:${stable(value[key])}`).join(",")}}`;
  }
  return JSON.stringify(value);
}

export function identityHash(email) {
  return sha256(String(email).trim().toLowerCase());
}

export function parseArgs(argv) {
  const [mode = "plan", ...rest] = argv;
  if (!new Set(["plan", "apply"]).has(mode)) throw new Error("Usage requires plan or apply mode.");
  const args = { mode, planDigest: null };
  for (let index = 0; index < rest.length; index += 1) {
    if (rest[index] !== "--plan-digest") throw new Error(`Unknown argument: ${rest[index]}`);
    args.planDigest = rest[++index] ?? null;
  }
  if (mode === "apply" && (!args.planDigest || !/^[a-f0-9]{64}$/.test(args.planDigest))) {
    throw new Error("Apply requires the exact --plan-digest from a fresh plan.");
  }
  return args;
}

function number(value, name) {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 0) throw new Error(`Invalid ${name}.`);
  return parsed;
}

function rosterInvariants(row) {
  return {
    assignedOperators: number(row.assignedOperators, "assigned operators"),
    questionAttempts: number(row.questionAttempts, "question attempts"),
    examResults: number(row.examResults, "exam results"),
    activitySessions: number(row.activitySessions, "activity sessions"),
    subscriptions: number(row.subscriptions, "subscriptions"),
    termUsage: number(row.termUsage, "term usage"),
  };
}

/**
 * The selected rows must be the exact active 10-seat and 14-seat populated
 * rosters. The plan requires evidence that their course cohorts are reversed:
 * the row labelled Distribution contains no distribution/collection assignment,
 * while the row labelled Treatment contains one or more of those assignments.
 */
export function buildCorrectionPlan(rows) {
  if (!Array.isArray(rows) || rows.length !== 2) {
    throw new Error("Expected exactly two active populated Utilities Kingston rosters.");
  }

  const byStream = new Map(rows.map(row => [row.stream, row]));
  const distribution = byStream.get("distribution");
  const treatment = byStream.get("treatment");
  if (!distribution || !treatment || byStream.size !== 2) {
    throw new Error("Expected one active Distribution roster and one active Treatment roster.");
  }

  for (const [label, row, seats] of [["distribution", distribution, 10], ["treatment", treatment, 14]]) {
    if (row.organizationName !== `Utilities Kingston ${label[0].toUpperCase()}${label.slice(1)}` || row.status !== "active" || number(row.seatsTotal, `${label} seats`) !== seats) {
      throw new Error(`The active ${label} roster does not match the approved correction scope.`);
    }
    if (!row.managerEmail || row.memberEmail !== row.managerEmail || row.memberRole !== "manager" || row.memberStatus !== "assigned") {
      throw new Error(`The active ${label} manager membership is not aligned.`);
    }
    if (rosterInvariants(row).assignedOperators < 1 || rosterInvariants(row).questionAttempts < 1) {
      throw new Error(`The active ${label} roster is not populated.`);
    }
    if (number(row.incomingManagerMembershipConflicts, `${label} incoming manager conflicts`) !== 0) {
      throw new Error(`The incoming manager already has another membership in the active ${label} roster.`);
    }
  }

  if (distribution.managerEmail === treatment.managerEmail) {
    throw new Error("Expected distinct manager identities for the active rosters.");
  }
  if (number(distribution.distributionOrCollectionAssignments, "distribution cohort assignments") !== 0 || number(distribution.nonDistributionAssignments, "treatment cohort assignments") < 1) {
    throw new Error("The labelled Distribution roster does not contain the verified treatment cohort.");
  }
  if (number(treatment.distributionOrCollectionAssignments, "distribution cohort assignments") < 1 || number(treatment.nonDistributionAssignments, "treatment cohort assignments") !== 0) {
    throw new Error("The labelled Treatment roster does not contain the verified distribution cohort.");
  }

  const plan = {
    correctionKey: CORRECTION_KEY,
    scriptVersion: SCRIPT_VERSION,
    scope: "swap the two active Utilities Kingston roster labels and manager identities only",
    routes: [
      {
        id: Number(distribution.organizationId),
        currentLabel: "distribution",
        correctedLabel: "treatment",
        seatCount: 10,
        currentManagerIdentitySha256: identityHash(distribution.managerEmail),
        correctedManagerIdentitySha256: identityHash(treatment.managerEmail),
        invariants: rosterInvariants(distribution),
      },
      {
        id: Number(treatment.organizationId),
        currentLabel: "treatment",
        correctedLabel: "distribution",
        seatCount: 14,
        currentManagerIdentitySha256: identityHash(treatment.managerEmail),
        correctedManagerIdentitySha256: identityHash(distribution.managerEmail),
        invariants: rosterInvariants(treatment),
      },
    ].sort((a, b) => a.currentLabel.localeCompare(b.currentLabel)),
    invariants: {
      organizationRowsCreated: 0,
      organizationRowsDeleted: 0,
      operatorMembershipsCreated: 0,
      operatorMembershipsDeleted: 0,
      learnerRecordsChanged: 0,
      entitlementRowsChanged: 0,
      paymentRowsChanged: 0,
      commercialTermsChanged: 0,
    },
  };
  return { ...plan, planDigest: sha256(stable(plan)) };
}

function requireExternalTarget() {
  if (process.env.DATABASE_CUTOVER_USE_EXTERNAL_TARGET !== "true" || process.env.DATABASE_REQUIRE_TLS !== "true") {
    throw new Error("Refusing correction: the TLS-selected authoritative external target is not active.");
  }
  if (!process.env.EXTERNAL_DATABASE_URL || !process.env.EXTERNAL_DATABASE_CA || !process.env.DATABASE_CUTOVER_TARGET_DATABASE) {
    throw new Error("Refusing correction: authoritative external database configuration is incomplete.");
  }
  const url = new URL(process.env.EXTERNAL_DATABASE_URL);
  const database = process.env.DATABASE_CUTOVER_TARGET_DATABASE;
  if (!/^[A-Za-z0-9_]+$/.test(database)) throw new Error("Refusing correction: target database name is unsafe.");
  url.pathname = `/${database}`;
  return {
    host: url.hostname,
    port: Number(url.port || 3306),
    user: decodeURIComponent(url.username),
    password: decodeURIComponent(url.password),
    database,
    charset: "utf8mb4",
    timezone: "Z",
    ssl: {
      ca: process.env.EXTERNAL_DATABASE_CA.replace(/\\n/g, "\n").replace(/\r\n/g, "\n").trimEnd() + "\n",
      rejectUnauthorized: true,
    },
  };
}

function privateArtifactPaths() {
  mkdirSync(PRIVATE_ROOT, { recursive: true, mode: 0o700 });
  chmodSync(PRIVATE_ROOT, 0o700);
  return {
    snapshot: resolve(PRIVATE_ROOT, "before-image.json"),
    result: resolve(PRIVATE_ROOT, "result.json"),
  };
}

function writePrivateJson(path, value) {
  if (existsSync(path)) throw new Error(`Refusing to overwrite existing private artifact: ${path}`);
  writeFileSync(path, `${JSON.stringify(value, null, 2)}\n`, { encoding: "utf8", mode: 0o600, flag: "wx" });
  chmodSync(path, 0o600);
}

async function loadScope(connection, { forUpdate = false } = {}) {
  const lock = forUpdate ? " FOR UPDATE" : "";
  const [rows] = await connection.execute(`
    SELECT
      o.id AS organizationId,
      o.name AS organizationName,
      o.stream,
      o.status,
      o.seatsTotal,
      o.managerEmail,
      om.id AS memberId,
      om.email AS memberEmail,
      om.role AS memberRole,
      om.status AS memberStatus,
      (SELECT COUNT(*) FROM organization_members operators WHERE operators.orgId = o.id AND operators.role = 'operator' AND operators.status = 'assigned') AS assignedOperators,
      (SELECT COUNT(*) FROM organization_members operator_courses WHERE operator_courses.orgId = o.id AND operator_courses.role = 'operator' AND operator_courses.status = 'assigned' AND (LOWER(COALESCE(operator_courses.courseKeys, operator_courses.courseKey, '')) LIKE '%-dist%' OR LOWER(COALESCE(operator_courses.courseKeys, operator_courses.courseKey, '')) LIKE '%-coll%')) AS distributionOrCollectionAssignments,
      (SELECT COUNT(*) FROM organization_members operator_courses WHERE operator_courses.orgId = o.id AND operator_courses.role = 'operator' AND operator_courses.status = 'assigned' AND COALESCE(operator_courses.courseKeys, operator_courses.courseKey, '') <> '' AND LOWER(COALESCE(operator_courses.courseKeys, operator_courses.courseKey, '')) NOT LIKE '%-dist%' AND LOWER(COALESCE(operator_courses.courseKeys, operator_courses.courseKey, '')) NOT LIKE '%-coll%') AS nonDistributionAssignments,
      (SELECT COUNT(*) FROM question_attempts attempts WHERE attempts.orgId = o.id) AS questionAttempts,
      (SELECT COUNT(*) FROM exam_results results WHERE results.orgId = o.id) AS examResults,
      (SELECT COUNT(*) FROM learning_activity_sessions sessions WHERE sessions.orgId = o.id) AS activitySessions,
      (SELECT COUNT(*) FROM subscriptions subs WHERE subs.orgId = o.id) AS subscriptions,
      (SELECT COUNT(*) FROM organization_term_operator_usage usage_rows WHERE usage_rows.orgId = o.id) AS termUsage,
      (SELECT COUNT(*) FROM organization_members conflicts WHERE conflicts.orgId = o.id AND LOWER(conflicts.email) = LOWER(other.managerEmail) AND conflicts.id <> om.id) AS incomingManagerMembershipConflicts
    FROM organizations o
    INNER JOIN organization_members om ON om.orgId = o.id AND om.role = 'manager'
    INNER JOIN organizations other
      ON other.name IN ('Utilities Kingston Distribution', 'Utilities Kingston Treatment')
      AND other.status = 'active'
      AND other.id <> o.id
    WHERE o.name IN ('Utilities Kingston Distribution', 'Utilities Kingston Treatment')
      AND o.status = 'active'
    ORDER BY o.stream, o.id${lock}
  `);
  return rows;
}

async function existingCorrection(connection, { forUpdate = false } = {}) {
  const [rows] = await connection.execute(
    `SELECT id, planDigest, status, outputDigest, appliedAt FROM customer_recovery_batches WHERE recoveryKey = ?${forUpdate ? " FOR UPDATE" : ""}`,
    [CORRECTION_KEY],
  );
  return rows[0] ?? null;
}

async function verifyResult(connection, originalPlan) {
  const rows = await loadScope(connection, { forUpdate: true });
  const bySeat = new Map(rows.map(row => [Number(row.seatsTotal), row]));
  const routeBySeat = new Map(originalPlan.routes.map(route => [route.seatCount, route]));
  for (const seats of [10, 14]) {
    const actual = bySeat.get(seats);
    const route = routeBySeat.get(seats);
    if (!actual || !route) throw new Error("Post-correction roster record is missing.");
    const expectedName = `Utilities Kingston ${route.correctedLabel[0].toUpperCase()}${route.correctedLabel.slice(1)}`;
    if (actual.organizationName !== expectedName || actual.stream !== route.correctedLabel || identityHash(actual.managerEmail) !== route.correctedManagerIdentitySha256 || actual.memberEmail !== actual.managerEmail || actual.memberRole !== "manager" || actual.memberStatus !== "assigned") {
      throw new Error("Post-correction manager routing verification failed.");
    }
    if (stable(rosterInvariants(actual)) !== stable(route.invariants)) {
      throw new Error("Post-correction operator, learner, or entitlement invariant changed.");
    }
  }
  return rows;
}

async function run() {
  const args = parseArgs(process.argv.slice(2));
  const connection = await mysql.createConnection(requireExternalTarget());
  try {
    await connection.query("SET time_zone = '+00:00'");
    await connection.query("SET TRANSACTION ISOLATION LEVEL SERIALIZABLE");
    if (args.mode === "plan") {
      await connection.query("SET SESSION TRANSACTION READ ONLY");
      const existing = await existingCorrection(connection);
      if (existing?.status === "applied") {
        console.log(JSON.stringify({ mode: "plan", alreadyApplied: true, correctionAuditId: Number(existing.id), planDigest: existing.planDigest }, null, 2));
        return;
      }
      const plan = buildCorrectionPlan(await loadScope(connection));
      console.log(JSON.stringify({ mode: "plan", plan, alreadyApplied: false }, null, 2));
      return;
    }

    if (process.env.KINGSTON_ACTIVE_MANAGER_ROUTING_APPROVED !== APPLY_APPROVAL) {
      throw new Error("Apply requires explicit active-manager routing approval.");
    }

    await connection.beginTransaction();
    const [[lock]] = await connection.query("SELECT GET_LOCK(?, 10) AS acquired", [LOCK_NAME]);
    if (Number(lock.acquired) !== 1) throw new Error("Could not acquire the Kingston active-manager routing lock.");
    try {
      const existing = await existingCorrection(connection, { forUpdate: true });
      if (existing) {
        if (existing.status !== "applied") throw new Error("A prior correction audit is incomplete. Manual reconciliation is required.");
        await connection.commit();
        console.log(JSON.stringify({ mode: "apply", alreadyApplied: true, correctionAuditId: Number(existing.id) }));
        return;
      }

      const rows = await loadScope(connection, { forUpdate: true });
      const plan = buildCorrectionPlan(rows);
      if (plan.planDigest !== args.planDigest) throw new Error("Live manager routing changed after planning. Generate and review a fresh plan.");

      const { snapshot, result } = privateArtifactPaths();
      writePrivateJson(snapshot, { capturedAt: new Date().toISOString(), correctionKey: CORRECTION_KEY, planDigest: plan.planDigest, rows });
      const beforeSnapshotSha256 = sha256(readFileSync(snapshot));
      const distribution = rows.find(row => row.stream === "distribution");
      const treatment = rows.find(row => row.stream === "treatment");
      if (!distribution || !treatment) throw new Error("Expected both active Kingston roster records.");

      const updateOrganization = async (target, incoming, name, stream) => {
        const [updated] = await connection.execute(
          "UPDATE organizations SET managerEmail = ?, name = ?, stream = ? WHERE id = ? AND managerEmail = ? AND name = ? AND stream = ?",
          [incoming.managerEmail, name, stream, target.organizationId, target.managerEmail, target.organizationName, target.stream],
        );
        if (Number(updated.affectedRows) !== 1) throw new Error("Active organization row changed before update.");
      };
      const updateManagerMembership = async (target, incoming) => {
        const [updated] = await connection.execute(
          "UPDATE organization_members SET email = ? WHERE id = ? AND orgId = ? AND role = 'manager' AND status = 'assigned' AND email = ?",
          [incoming.memberEmail, target.memberId, target.organizationId, target.memberEmail],
        );
        if (Number(updated.affectedRows) !== 1) throw new Error("Active manager membership changed before update.");
      };

      await updateOrganization(distribution, treatment, "Utilities Kingston Treatment", "treatment");
      await updateOrganization(treatment, distribution, "Utilities Kingston Distribution", "distribution");
      await updateManagerMembership(distribution, treatment);
      await updateManagerMembership(treatment, distribution);

      const verifiedRows = await verifyResult(connection, plan);
      const outputDigest = sha256(stable({
        planDigest: plan.planDigest,
        verifiedRoutes: verifiedRows.map(row => ({
          organizationId: Number(row.organizationId),
          name: row.organizationName,
          stream: row.stream,
          seatsTotal: Number(row.seatsTotal),
          managerIdentitySha256: identityHash(row.managerEmail),
          invariants: rosterInvariants(row),
        })),
      }));
      const [audit] = await connection.execute(
        `INSERT INTO customer_recovery_batches
          (recoveryKey, planDigest, archiveSha256, authorizationRef, confirmationTokenSha256, scriptVersion, beforeSnapshotSha256, backupArtifactPath, status, outputDigest, appliedAt)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'applied', ?, UTC_TIMESTAMP())`,
        [
          CORRECTION_KEY,
          plan.planDigest,
          sha256("not-an-archive:active-manager-routing-correction"),
          "owner-approved Utilities Kingston active manager routing and labeling correction 2026-09-30",
          sha256(APPLY_APPROVAL),
          SCRIPT_VERSION,
          beforeSnapshotSha256,
          snapshot,
          outputDigest,
        ],
      );
      await connection.commit();
      writePrivateJson(result, {
        appliedAt: new Date().toISOString(),
        correctionAuditId: Number(audit.insertId),
        planDigest: plan.planDigest,
        outputDigest,
        beforeSnapshotSha256,
        noOperatorMembershipsChanged: true,
        noLearnerRecordsChanged: true,
        noEntitlementsChanged: true,
        noPaymentsChanged: true,
        noTermsChanged: true,
      });
      console.log(JSON.stringify({ mode: "apply", correctionAuditId: Number(audit.insertId), planDigest: plan.planDigest, outputDigest }, null, 2));
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      await connection.query("SELECT RELEASE_LOCK(?)", [LOCK_NAME]).catch(() => {});
    }
  } finally {
    await connection.end();
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  run().catch(error => {
    console.error(`Kingston active-manager routing correction blocked: ${error instanceof Error ? error.message : String(error)}`);
    process.exitCode = 1;
  });
}
