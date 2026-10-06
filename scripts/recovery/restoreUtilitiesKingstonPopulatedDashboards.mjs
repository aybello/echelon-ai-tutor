#!/usr/bin/env node
/**
 * One-time, audited repair for Utilities Kingston dashboard routing.
 *
 * The recovery process created two newer, empty stream dashboards. The normal
 * manager resolver correctly chose the newest active organization, so both
 * managers were routed away from the older populated organizations containing
 * their real operator memberships and learning records.
 *
 * This correction:
 * - keeps every operator, attempt, exam result, session, subscription, and
 *   annual-use record attached to its existing populated organization ID;
 * - marks only the two verified-empty recovery duplicates as cancelled;
 * - labels the populated 10-seat organization as Distribution and assigns the
 *   Distribution manager; and
 * - labels the populated 14-seat organization as Treatment and assigns the
 *   Treatment manager.
 *
 * It never deletes rows or moves learner data between organizations.
 *
 * Usage:
 *   node scripts/recovery/restoreUtilitiesKingstonPopulatedDashboards.mjs plan
 *   KINGSTON_POPULATED_DASHBOARDS_APPROVED=RESTORE_POPULATED_DASHBOARDS_2026_09_29 \
 *     node scripts/recovery/restoreUtilitiesKingstonPopulatedDashboards.mjs apply --plan-digest <digest>
 */
import { createHash } from "node:crypto";
import { chmodSync, existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import mysql from "mysql2/promise";

export const CORRECTION_KEY = "utilities-kingston-populated-dashboard-routing-correction-2026-09-29";
export const SCRIPT_VERSION = "1.0.0";
const APPLY_APPROVAL = "RESTORE_POPULATED_DASHBOARDS_2026_09_29";
const PRIVATE_ROOT = "/home/ubuntu/private/echelon-authoritative-recovery/kingston-populated-dashboard-routing-correction-2026-09-29";
const STREAMS = ["distribution", "treatment"];

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

/**
 * Validate the database rows without exposing customer identities in committed
 * code or command output. The returned plan includes only SHA-256 identities.
 */
export function buildRepairPlan({ duplicates, populated }) {
  if (!Array.isArray(duplicates) || duplicates.length !== 2 || !Array.isArray(populated) || populated.length !== 2) {
    throw new Error("Expected exactly two empty recovery duplicates and two populated Utilities Kingston organizations.");
  }

  const duplicateByStream = new Map(duplicates.map(row => [row.stream, row]));
  if (duplicateByStream.size !== 2 || STREAMS.some(stream => !duplicateByStream.has(stream))) {
    throw new Error("Expected one empty recovery duplicate for each Utilities Kingston stream.");
  }

  const populatedBySeatCount = new Map(populated.map(row => [Number(row.seatsTotal), row]));
  if (populatedBySeatCount.size !== 2 || !populatedBySeatCount.has(10) || !populatedBySeatCount.has(14)) {
    throw new Error("Expected populated 10-seat Distribution and 14-seat Treatment organizations.");
  }

  for (const duplicate of duplicates) {
    if (duplicate.status !== "active" || Number(duplicate.operatorMembers) !== 0 || Number(duplicate.questionAttempts) !== 0 || Number(duplicate.examResults) !== 0 || Number(duplicate.activitySessions) !== 0 || Number(duplicate.subscriptions) !== 0 || Number(duplicate.termUsage) !== 0) {
      throw new Error("A recovery duplicate is not empty and active; refusing to retire it.");
    }
    if (duplicate.managerRole !== "manager" || duplicate.managerStatus !== "assigned" || duplicate.managerEmail !== duplicate.memberEmail) {
      throw new Error("Each recovery duplicate must have one aligned assigned manager membership.");
    }
  }

  for (const target of populated) {
    if (target.status !== "active" || target.stream !== null || target.organizationName !== "Utilities Kingston") {
      throw new Error("Expected original active Utilities Kingston organizations without stream labels.");
    }
    if (Number(target.operatorMembers) < 1 || Number(target.questionAttempts) < 1) {
      throw new Error("A populated Utilities Kingston organization is missing its expected learner records.");
    }
    if (target.managerRole !== "manager" || target.managerStatus !== "assigned") {
      throw new Error("Each populated organization must have one assigned manager membership.");
    }
  }

  const distributionDuplicate = duplicateByStream.get("distribution");
  const treatmentDuplicate = duplicateByStream.get("treatment");
  const distributionTarget = populatedBySeatCount.get(10);
  const treatmentTarget = populatedBySeatCount.get(14);
  if (!distributionDuplicate || !treatmentDuplicate || !distributionTarget || !treatmentTarget) {
    throw new Error("Utilities Kingston repair mapping could not be constructed.");
  }
  if (distributionDuplicate.managerEmail === treatmentDuplicate.managerEmail) {
    throw new Error("Recovery dashboard manager identities are not distinct.");
  }

  const plan = {
    correctionKey: CORRECTION_KEY,
    scriptVersion: SCRIPT_VERSION,
    scope: "retire empty recovery duplicates and route managers to populated Utilities Kingston teams",
    originalOrganizationRowsCreated: 0,
    originalOrganizationRowsDeleted: 0,
    learnerRecordsMoved: 0,
    learnerRecordsDeleted: 0,
    routes: [
      {
        organizationId: Number(distributionTarget.organizationId),
        seatCount: 10,
        targetStream: "distribution",
        targetOrganizationName: "Utilities Kingston Distribution",
        targetManagerIdentitySha256: identityHash(distributionDuplicate.managerEmail),
        assignedOperators: Number(distributionTarget.operatorMembers),
        historicalQuestionAttempts: Number(distributionTarget.questionAttempts),
      },
      {
        organizationId: Number(treatmentTarget.organizationId),
        seatCount: 14,
        targetStream: "treatment",
        targetOrganizationName: "Utilities Kingston Treatment",
        targetManagerIdentitySha256: identityHash(treatmentDuplicate.managerEmail),
        assignedOperators: Number(treatmentTarget.operatorMembers),
        historicalQuestionAttempts: Number(treatmentTarget.questionAttempts),
      },
    ],
    retiredEmptyDuplicates: [
      {
        organizationId: Number(distributionDuplicate.organizationId),
        stream: "distribution",
        managerIdentitySha256: identityHash(distributionDuplicate.managerEmail),
      },
      {
        organizationId: Number(treatmentDuplicate.organizationId),
        stream: "treatment",
        managerIdentitySha256: identityHash(treatmentDuplicate.managerEmail),
      },
    ],
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
  const [duplicates] = await connection.execute(`
    SELECT
      o.id AS organizationId, o.name AS organizationName, o.stream, o.seatsTotal, o.status, o.managerEmail,
      om.id AS managerMemberId, om.email AS memberEmail, om.role AS managerRole, om.status AS managerStatus,
      (SELECT COUNT(*) FROM organization_members m WHERE m.orgId = o.id AND m.role = 'operator') AS operatorMembers,
      (SELECT COUNT(*) FROM question_attempts q WHERE q.orgId = o.id) AS questionAttempts,
      (SELECT COUNT(*) FROM exam_results e WHERE e.orgId = o.id) AS examResults,
      (SELECT COUNT(*) FROM learning_activity_sessions s WHERE s.orgId = o.id) AS activitySessions,
      (SELECT COUNT(*) FROM subscriptions sub WHERE sub.orgId = o.id) AS subscriptions,
      (SELECT COUNT(*) FROM organization_term_operator_usage u WHERE u.orgId = o.id) AS termUsage
    FROM organizations o
    INNER JOIN organization_members om ON om.orgId = o.id AND om.role = 'manager'
    WHERE o.name IN ('Utilities Kingston Distribution', 'Utilities Kingston Treatment')
    ORDER BY o.stream, o.id${lock}
  `);
  const [populated] = await connection.execute(`
    SELECT
      o.id AS organizationId, o.name AS organizationName, o.stream, o.seatsTotal, o.status, o.managerEmail,
      om.id AS managerMemberId, om.email AS memberEmail, om.role AS managerRole, om.status AS managerStatus,
      (SELECT COUNT(*) FROM organization_members m WHERE m.orgId = o.id AND m.role = 'operator' AND m.status = 'assigned') AS operatorMembers,
      (SELECT COUNT(*) FROM question_attempts q WHERE q.orgId = o.id) AS questionAttempts
    FROM organizations o
    INNER JOIN organization_members om ON om.orgId = o.id AND om.role = 'manager'
    WHERE o.name = 'Utilities Kingston' AND o.stream IS NULL AND o.seatsTotal IN (10, 14)
    ORDER BY o.seatsTotal, o.id${lock}
  `);
  return { duplicates, populated };
}

async function existingCorrection(connection, { forUpdate = false } = {}) {
  const [rows] = await connection.execute(
    `SELECT id, planDigest, status, outputDigest, appliedAt FROM customer_recovery_batches WHERE recoveryKey = ?${forUpdate ? " FOR UPDATE" : ""}`,
    [CORRECTION_KEY],
  );
  return rows[0] ?? null;
}

async function verifyResult(connection, plan) {
  const [rows] = await connection.execute(`
    SELECT o.id AS organizationId, o.name, o.stream, o.status, o.managerEmail,
      om.email AS memberEmail, om.role, om.status AS memberStatus,
      (SELECT COUNT(*) FROM organization_members m WHERE m.orgId=o.id AND m.role='operator' AND m.status='assigned') AS assignedOperators,
      (SELECT COUNT(*) FROM question_attempts q WHERE q.orgId=o.id) AS questionAttempts
    FROM organizations o
    INNER JOIN organization_members om ON om.orgId=o.id AND om.role='manager'
    WHERE o.id IN (${plan.routes.map(() => "?").join(",")}, ${plan.retiredEmptyDuplicates.map(() => "?").join(",")})
    ORDER BY o.id
  `, [...plan.routes.map(row => row.organizationId), ...plan.retiredEmptyDuplicates.map(row => row.organizationId)]);

  const byId = new Map(rows.map(row => [Number(row.organizationId), row]));
  for (const route of plan.routes) {
    const actual = byId.get(route.organizationId);
    if (!actual || actual.name !== route.targetOrganizationName || actual.stream !== route.targetStream || actual.status !== "active" || actual.managerEmail !== actual.memberEmail || actual.memberStatus !== "assigned" || identityHash(actual.managerEmail) !== route.targetManagerIdentitySha256 || Number(actual.assignedOperators) !== route.assignedOperators || Number(actual.questionAttempts) !== route.historicalQuestionAttempts) {
      throw new Error("Post-correction populated dashboard verification failed.");
    }
  }
  for (const duplicate of plan.retiredEmptyDuplicates) {
    const actual = byId.get(duplicate.organizationId);
    if (!actual || actual.status !== "cancelled" || actual.stream !== duplicate.stream || Number(actual.assignedOperators) !== 0 || Number(actual.questionAttempts) !== 0) {
      throw new Error("Post-correction duplicate dashboard retirement verification failed.");
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
      const already = await existingCorrection(connection);
      if (already?.status === "applied") {
        console.log(JSON.stringify({ mode: "plan", alreadyApplied: true, correctionAuditId: Number(already.id), planDigest: already.planDigest }, null, 2));
        return;
      }
      const plan = buildRepairPlan(await loadScope(connection));
      console.log(JSON.stringify({ mode: "plan", plan, alreadyApplied: already?.status === "applied" }, null, 2));
      return;
    }

    if (process.env.KINGSTON_POPULATED_DASHBOARDS_APPROVED !== APPLY_APPROVAL) {
      throw new Error("Apply requires explicit populated-dashboard correction approval.");
    }
    await connection.beginTransaction();
    const [[lock]] = await connection.query("SELECT GET_LOCK('echelon:utilities-kingston-populated-dashboard-routing:v1', 10) AS acquired");
    if (Number(lock.acquired) !== 1) throw new Error("Could not acquire the Kingston populated-dashboard correction lock.");
    try {
      const existing = await existingCorrection(connection, { forUpdate: true });
      if (existing) {
        if (existing.status !== "applied") throw new Error("A prior correction audit is incomplete. Manual reconciliation is required.");
        await connection.commit();
        console.log(JSON.stringify({ mode: "apply", alreadyApplied: true, correctionAuditId: Number(existing.id) }));
        return;
      }

      const plan = buildRepairPlan(await loadScope(connection, { forUpdate: true }));
      if (plan.planDigest !== args.planDigest) throw new Error("Live Kingston routing changed after planning. Generate a fresh plan.");

      const { snapshot, result } = privateArtifactPaths();
      writePrivateJson(snapshot, { capturedAt: new Date().toISOString(), correctionKey: CORRECTION_KEY, planDigest: plan.planDigest, plan, scope: await loadScope(connection, { forUpdate: true }) });
      const beforeSnapshotSha256 = sha256(readFileSync(snapshot));

      for (const route of plan.routes) {
        const sourceDuplicate = plan.retiredEmptyDuplicates.find(row => row.stream === route.targetStream);
        if (!sourceDuplicate) throw new Error("Manager source duplicate is missing.");
        const [managerRows] = await connection.execute("SELECT managerEmail FROM organizations WHERE id = ? FOR UPDATE", [sourceDuplicate.organizationId]);
        const sourceManagerEmail = managerRows[0]?.managerEmail;
        if (!sourceManagerEmail || identityHash(sourceManagerEmail) !== route.targetManagerIdentitySha256) throw new Error("Manager identity changed after planning.");
        const [membershipCollision] = await connection.execute(
          "SELECT id FROM organization_members WHERE orgId = ? AND LOWER(email) = LOWER(?) FOR UPDATE",
          [route.organizationId, sourceManagerEmail],
        );
        if (membershipCollision.length > 0) {
          throw new Error("Incoming manager identity already has a membership on the populated target organization.");
        }
        await connection.execute("UPDATE organizations SET name = ?, stream = ?, managerEmail = ? WHERE id = ?", [route.targetOrganizationName, route.targetStream, sourceManagerEmail, route.organizationId]);
        const [memberUpdate] = await connection.execute("UPDATE organization_members SET email = ? WHERE orgId = ? AND role = 'manager'", [sourceManagerEmail, route.organizationId]);
        if (Number(memberUpdate.affectedRows) !== 1) throw new Error("Expected one populated manager membership to update.");
      }

      for (const duplicate of plan.retiredEmptyDuplicates) {
        const [retired] = await connection.execute("UPDATE organizations SET status = 'cancelled' WHERE id = ? AND status = 'active'", [duplicate.organizationId]);
        if (Number(retired.affectedRows) !== 1) throw new Error("Expected one empty duplicate dashboard to retire.");
      }

      const verifiedRows = await verifyResult(connection, plan);
      const outputDigest = sha256(stable({ planDigest: plan.planDigest, verifiedRows: verifiedRows.map(row => ({ organizationId: Number(row.organizationId), name: row.name, stream: row.stream, status: row.status, managerIdentitySha256: identityHash(row.managerEmail), assignedOperators: Number(row.assignedOperators), questionAttempts: Number(row.questionAttempts) })) }));
      const [audit] = await connection.execute(
        `INSERT INTO customer_recovery_batches
          (recoveryKey, planDigest, archiveSha256, authorizationRef, confirmationTokenSha256, scriptVersion, beforeSnapshotSha256, backupArtifactPath, status, outputDigest, appliedAt)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'applied', ?, UTC_TIMESTAMP())`,
        [
          CORRECTION_KEY,
          plan.planDigest,
          sha256("not-an-archive:populated-dashboard-routing-correction"),
          "owner-reported Utilities Kingston operator progress visibility correction 2026-09-29",
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
        backupPath: snapshot,
        learnerRecordsMoved: 0,
        learnerRecordsDeleted: 0,
      });
      console.log(JSON.stringify({ mode: "apply", correctionAuditId: Number(audit.insertId), planDigest: plan.planDigest, outputDigest }));
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      await connection.query("SELECT RELEASE_LOCK('echelon:utilities-kingston-populated-dashboard-routing:v1')").catch(() => {});
    }
  } finally {
    await connection.end();
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  run().catch(error => {
    console.error(`Kingston populated-dashboard correction blocked: ${error instanceof Error ? error.message : String(error)}`);
    process.exitCode = 1;
  });
}
