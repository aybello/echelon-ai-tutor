#!/usr/bin/env node
/**
 * One-time, audited correction of the Utilities Kingston manager-to-stream mapping.
 *
 * This does not create or remove organizations, seats, operator memberships,
 * subscriptions, learners, or study records. It only swaps the two existing
 * manager identities between the already-created Treatment and Distribution
 * dashboards after a verified owner report that they were reversed.
 *
 * Default mode is read-only. Applying requires the exact plan digest, explicit
 * approval, and the external TLS-selected production target. The correction is
 * recorded as a dedicated immutable recovery-batch audit row, so it cannot be
 * applied twice.
 *
 * Usage:
 *   node scripts/recovery/correctUtilitiesKingstonManagerMapping.mjs plan
 *   KINGSTON_MANAGER_MAPPING_APPROVED=SWAP_IDENTITIES_2026_09_29 \
 *   node scripts/recovery/correctUtilitiesKingstonManagerMapping.mjs apply --plan-digest <digest>
 */
import { createHash, randomBytes } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { chmodSync } from "node:fs";
import { resolve } from "node:path";
import mysql from "mysql2/promise";

export const CORRECTION_KEY = "utilities-kingston-manager-mapping-correction-2026-09-29";
export const SCRIPT_VERSION = "1.0.0";
const APPLY_APPROVAL = "SWAP_IDENTITIES_2026_09_29";
const PRIVATE_ROOT = "/home/ubuntu/private/echelon-authoritative-recovery/kingston-manager-mapping-correction-2026-09-29";

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

export function buildCorrectionPlan(rows) {
  if (!Array.isArray(rows) || rows.length !== 2) {
    throw new Error("Expected exactly two Utilities Kingston organization rows.");
  }
  const byStream = new Map(rows.map(row => [row.stream, row]));
  const treatment = byStream.get("treatment");
  const distribution = byStream.get("distribution");
  if (!treatment || !distribution || byStream.size !== 2) {
    throw new Error("Expected one Treatment and one Distribution dashboard.");
  }
  if (treatment.organizationName !== "Utilities Kingston Treatment" || distribution.organizationName !== "Utilities Kingston Distribution") {
    throw new Error("Utilities Kingston dashboard names do not match the approved correction scope.");
  }
  if (!treatment.managerEmail || !distribution.managerEmail || treatment.managerEmail === distribution.managerEmail) {
    throw new Error("Expected two distinct current manager identities.");
  }
  if (treatment.memberEmail !== treatment.managerEmail || distribution.memberEmail !== distribution.managerEmail) {
    throw new Error("Each current dashboard manager membership must match its organization manager identity.");
  }
  if (treatment.memberRole !== "manager" || distribution.memberRole !== "manager" || treatment.memberStatus !== "assigned" || distribution.memberStatus !== "assigned") {
    throw new Error("Expected exactly one active manager membership for each dashboard.");
  }

  const plan = {
    correctionKey: CORRECTION_KEY,
    scriptVersion: SCRIPT_VERSION,
    scope: "swap the two existing Utilities Kingston manager identities only",
    organizations: [
      {
        id: Number(treatment.organizationId),
        stream: "treatment",
        seatCount: Number(treatment.seatsTotal),
        currentManagerIdentitySha256: identityHash(treatment.managerEmail),
        correctedManagerIdentitySha256: identityHash(distribution.managerEmail),
      },
      {
        id: Number(distribution.organizationId),
        stream: "distribution",
        seatCount: Number(distribution.seatsTotal),
        currentManagerIdentitySha256: identityHash(distribution.managerEmail),
        correctedManagerIdentitySha256: identityHash(treatment.managerEmail),
      },
    ].sort((a, b) => a.stream.localeCompare(b.stream)),
    invariants: {
      organizationRowsCreated: 0,
      organizationRowsDeleted: 0,
      operatorMembershipsCreated: 0,
      operatorMembershipsDeleted: 0,
      learnerRecordsChanged: 0,
      entitlementRowsChanged: 0,
    },
  };
  return { ...plan, planDigest: sha256(stable(plan)) };
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

async function loadLockedRows(connection) {
  const [rows] = await connection.execute(`
    SELECT
      o.id AS organizationId,
      o.name AS organizationName,
      o.stream,
      o.seatsTotal,
      o.managerEmail,
      om.id AS memberId,
      om.email AS memberEmail,
      om.role AS memberRole,
      om.status AS memberStatus
    FROM organizations o
    INNER JOIN organization_members om ON om.orgId = o.id AND om.role = 'manager'
    WHERE o.name IN ('Utilities Kingston Treatment', 'Utilities Kingston Distribution')
    ORDER BY o.stream, o.id
    FOR UPDATE
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

async function run() {
  const args = parseArgs(process.argv.slice(2));
  const connection = await mysql.createConnection(requireExternalTarget());
  try {
    await connection.query("SET time_zone = '+00:00'");
    await connection.query("SET TRANSACTION ISOLATION LEVEL SERIALIZABLE");
    if (args.mode === "plan") {
      await connection.query("SET SESSION TRANSACTION READ ONLY");
      const [rows] = await connection.execute(`
        SELECT
          o.id AS organizationId,
          o.name AS organizationName,
          o.stream,
          o.seatsTotal,
          o.managerEmail,
          om.id AS memberId,
          om.email AS memberEmail,
          om.role AS memberRole,
          om.status AS memberStatus
        FROM organizations o
        INNER JOIN organization_members om ON om.orgId = o.id AND om.role = 'manager'
        WHERE o.name IN ('Utilities Kingston Treatment', 'Utilities Kingston Distribution')
        ORDER BY o.stream, o.id
      `);
      const plan = buildCorrectionPlan(rows);
      const already = await existingCorrection(connection);
      console.log(JSON.stringify({ mode: "plan", plan, alreadyApplied: already?.status === "applied" }, null, 2));
      return;
    }

    if (process.env.KINGSTON_MANAGER_MAPPING_APPROVED !== APPLY_APPROVAL) {
      throw new Error("Apply requires explicit manager-mapping correction approval.");
    }
    await connection.beginTransaction();
    const [[lock]] = await connection.query("SELECT GET_LOCK('echelon:utilities-kingston-manager-mapping-correction:v1', 10) AS acquired");
    if (Number(lock.acquired) !== 1) throw new Error("Could not acquire the Kingston mapping correction lock.");
    try {
      const existing = await existingCorrection(connection, { forUpdate: true });
      if (existing) {
        if (existing.status !== "applied") throw new Error("A prior Kingston correction audit is incomplete. Manual reconciliation is required.");
        await connection.commit();
        console.log(JSON.stringify({ mode: "apply", alreadyApplied: true, correctionAuditId: Number(existing.id) }));
        return;
      }

      const rows = await loadLockedRows(connection);
      const plan = buildCorrectionPlan(rows);
      if (plan.planDigest !== args.planDigest) throw new Error("Live mapping changed after planning. Generate and review a fresh plan.");

      const { snapshot, result } = privateArtifactPaths();
      writePrivateJson(snapshot, {
        capturedAt: new Date().toISOString(),
        correctionKey: CORRECTION_KEY,
        planDigest: plan.planDigest,
        rows,
      });
      const beforeSnapshotSha256 = sha256(readFileSync(snapshot));
      const distribution = rows.find(row => row.stream === "distribution");
      const treatment = rows.find(row => row.stream === "treatment");
      if (!distribution || !treatment) throw new Error("Expected both Kingston dashboard rows.");

      await connection.execute("UPDATE organizations SET managerEmail = ? WHERE id = ?", [distribution.managerEmail, treatment.organizationId]);
      await connection.execute("UPDATE organizations SET managerEmail = ? WHERE id = ?", [treatment.managerEmail, distribution.organizationId]);
      await connection.execute("UPDATE organization_members SET email = ? WHERE id = ?", [distribution.memberEmail, treatment.memberId]);
      await connection.execute("UPDATE organization_members SET email = ? WHERE id = ?", [treatment.memberEmail, distribution.memberId]);

      const correctedRows = await loadLockedRows(connection);
      const correctedPlan = buildCorrectionPlan(correctedRows);
      const expectedTreatmentIdentity = identityHash(distribution.managerEmail);
      const expectedDistributionIdentity = identityHash(treatment.managerEmail);
      const correctedTreatment = correctedRows.find(row => row.stream === "treatment");
      const correctedDistribution = correctedRows.find(row => row.stream === "distribution");
      if (!correctedTreatment || !correctedDistribution || identityHash(correctedTreatment.managerEmail) !== expectedTreatmentIdentity || identityHash(correctedDistribution.managerEmail) !== expectedDistributionIdentity || correctedTreatment.memberEmail !== correctedTreatment.managerEmail || correctedDistribution.memberEmail !== correctedDistribution.managerEmail) {
        throw new Error("Post-correction manager mapping verification failed.");
      }

      const outputDigest = sha256(stable({ planDigest: plan.planDigest, correctedIdentities: correctedPlan.organizations.map(row => ({ stream: row.stream, managerIdentitySha256: row.currentManagerIdentitySha256 })) }));
      const [audit] = await connection.execute(
        `INSERT INTO customer_recovery_batches
          (recoveryKey, planDigest, archiveSha256, authorizationRef, confirmationTokenSha256, scriptVersion, beforeSnapshotSha256, backupArtifactPath, status, outputDigest, appliedAt)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'applied', ?, UTC_TIMESTAMP())`,
        [
          CORRECTION_KEY,
          plan.planDigest,
          sha256("not-an-archive:manager-mapping-correction"),
          "owner-reported Kingston manager stream correction 2026-09-29",
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
        noOperatorMembershipsChanged: true,
        noLearnerRecordsChanged: true,
      });
      console.log(JSON.stringify({ mode: "apply", correctionAuditId: Number(audit.insertId), planDigest: plan.planDigest, outputDigest }));
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      await connection.query("SELECT RELEASE_LOCK('echelon:utilities-kingston-manager-mapping-correction:v1')").catch(() => {});
    }
  } finally {
    await connection.end();
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  run().catch(error => {
    console.error(`Kingston manager mapping correction blocked: ${error instanceof Error ? error.message : String(error)}`);
    process.exitCode = 1;
  });
}
