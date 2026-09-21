import { readFile } from "node:fs/promises";
import mysql, { type Connection, type RowDataPacket } from "mysql2/promise";
import {
  LEDGER_TABLE,
  buildExpectedSchemaContract,
  downgradeProposedMissingIndexErrors,
  diffExactSchemaContracts,
  diffSchemaContracts,
  fetchActualSchemaContract,
  loadManifest,
  loadSchemaContract,
  planApprovedStandaloneMigration,
  planForwardMigrations,
  resolveRepoPath,
  schemaContractChecksum,
  selectAdoptableForwardMigrations,
  splitMigrationStatements,
  validateBaselineEmbeddedMigration,
  validateManifest,
  sha256,
  type ForwardMigration,
  type LedgerRow,
  type ContractDiff,
  type MigrationManifest,
  type SchemaContract,
} from "./migrationSafety.ts";

const APPROVAL_TOKEN = "APPLY_FORWARD_MIGRATIONS";
const STANDALONE_APPROVAL_TOKEN = "APPLY_APPROVED_STANDALONE_MIGRATION";
const BACKUP_TOKEN = "BACKUP_VERIFIED";

function requireDatabaseUrl(): string {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) throw new Error("DATABASE_URL is required.");
  return databaseUrl;
}

function requireApproval(): void {
  if (process.env.MIGRATION_APPROVED !== APPROVAL_TOKEN) {
    throw new Error(
      `Refusing database write. Set MIGRATION_APPROVED=${APPROVAL_TOKEN}.`
    );
  }
  if (process.env.MIGRATION_BACKUP_CONFIRMED !== BACKUP_TOKEN) {
    throw new Error(
      `Refusing database write. Set MIGRATION_BACKUP_CONFIRMED=${BACKUP_TOKEN} after verifying a backup.`
    );
  }
}

function requireStandaloneApproval(): string {
  if (process.env.MIGRATION_APPROVED !== STANDALONE_APPROVAL_TOKEN) {
    throw new Error(
      `Refusing database write. Set MIGRATION_APPROVED=${STANDALONE_APPROVAL_TOKEN}.`
    );
  }
  if (process.env.MIGRATION_BACKUP_CONFIRMED !== BACKUP_TOKEN) {
    throw new Error(
      `Refusing database write. Set MIGRATION_BACKUP_CONFIRMED=${BACKUP_TOKEN} after verifying a backup.`
    );
  }
  const target = process.env.MIGRATION_TARGET?.trim();
  if (!target) {
    throw new Error(
      "Refusing database write. Set MIGRATION_TARGET to one approved manifest tag."
    );
  }
  return target;
}

async function ledgerExists(connection: Connection): Promise<boolean> {
  const [rows] = await connection.query<RowDataPacket[]>(
    `
    SELECT COUNT(*) AS count
    FROM information_schema.TABLES
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ?
  `,
    [LEDGER_TABLE]
  );
  return Number(rows[0]?.count ?? 0) === 1;
}

async function createLedger(connection: Connection): Promise<void> {
  await connection.query(`
    CREATE TABLE IF NOT EXISTS \`${LEDGER_TABLE}\` (
      \`version\` int NOT NULL,
      \`tag\` varchar(255) NOT NULL,
      \`checksum\` char(64) NOT NULL,
      \`status\` enum('applying','applied','failed') NOT NULL,
      \`startedAt\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
      \`appliedAt\` timestamp NULL,
      \`executionMs\` int NULL,
      \`errorMessage\` text NULL,
      CONSTRAINT \`${LEDGER_TABLE}_pk\` PRIMARY KEY (\`version\`),
      UNIQUE INDEX \`${LEDGER_TABLE}_tag_idx\` (\`tag\`)
    )
  `);
}

async function readLedger(connection: Connection): Promise<LedgerRow[]> {
  if (!(await ledgerExists(connection))) return [];
  const [rows] = await connection.query<RowDataPacket[]>(`
    SELECT version, tag, checksum, status
    FROM \`${LEDGER_TABLE}\`
    ORDER BY version
  `);
  return rows.map(row => ({
    version: Number(row.version),
    tag: String(row.tag),
    checksum: String(row.checksum),
    status: row.status as LedgerRow["status"],
  }));
}

function printSchemaDiff(errors: string[], warnings: string[]): void {
  for (const warning of warnings) console.warn(`WARNING: ${warning}`);
  for (const error of errors) console.error(`ERROR: ${error}`);
}

async function verifyExactBaselineSchema(
  connection: Connection,
  manifest: MigrationManifest
): Promise<void> {
  const diff = await getExactBaselineDiff(connection, manifest);
  printSchemaDiff(diff.errors, diff.warnings);
  if (diff.errors.length > 0) {
    throw new Error(
      `Database does not exactly satisfy immutable baseline ${manifest.baseline.version}.`
    );
  }
  console.log(
    `Exact baseline ${manifest.baseline.version} (${manifest.baseline.tag}) verified.`
  );
}

async function assertBaselineCompatibility(
  connection: Connection,
  manifest: MigrationManifest
): Promise<void> {
  const expected = await loadSchemaContract(manifest.baseline.contract);
  const actual = await fetchActualSchemaContract(connection);
  const diff = diffSchemaContracts(expected, actual);
  printSchemaDiff(diff.errors, diff.warnings);
  if (diff.errors.length > 0) {
    throw new Error(
      `Database does not satisfy immutable baseline ${manifest.baseline.version} compatibility requirements.`
    );
  }
}

async function getExactBaselineDiff(
  connection: Connection,
  manifest: MigrationManifest
): Promise<ContractDiff> {
  const expected = await loadSchemaContract(manifest.baseline.contract);
  const actual = await fetchActualSchemaContract(connection);
  return diffExactSchemaContracts(expected, actual);
}

async function assertPinnedEmbeddedDatabaseEvidence(
  connection: Connection,
  migration: ForwardMigration
): Promise<void> {
  if (migration.version !== 53 || migration.tag !== "0053_question_governance") {
    throw new Error(
      `No runtime evidence verifier is defined for embedded migration ${migration.version} (${migration.tag}).`
    );
  }
  const [rows] = await connection.query<RowDataPacket[]>(
    `
      SELECT column_default AS columnDefault
      FROM information_schema.columns
      WHERE table_schema = DATABASE()
        AND table_name = 'questions'
        AND column_name = 'reviewStatus'
      LIMIT 1
    `
  );
  const columnDefault = String(rows[0]?.columnDefault ?? "").replace(
    /^'(.*)'$/,
    "$1"
  );
  if (rows.length !== 1 || columnDefault !== "unreviewed") {
    throw new Error(
      "Immutable baseline evidence is missing questions.reviewStatus DEFAULT 'unreviewed' required to adopt 0053."
    );
  }
}

async function assertCurrentSchema(connection: Connection): Promise<void> {
  const diff = await getCurrentSchemaDiff(connection);
  printSchemaDiff(diff.errors, diff.warnings);
  if (diff.errors.length > 0)
    throw new Error(
      "Database schema does not match drizzle/schema.ts after migration."
    );
}

async function assertStandaloneMigrationSchema(
  connection: Connection,
  migration: ForwardMigration
): Promise<void> {
  const tableNames = migration.standaloneApply?.tables;
  if (!tableNames || tableNames.length === 0) {
    throw new Error(
      `Migration ${migration.version} (${migration.tag}) has no standalone verification contract.`
    );
  }
  const expected: SchemaContract = {
    formatVersion: 1,
    tables: buildExpectedSchemaContract().tables.filter(table =>
      tableNames.includes(table.name)
    ),
  };
  const actual: SchemaContract = {
    formatVersion: 1,
    tables: (await fetchActualSchemaContract(connection)).tables.filter(table =>
      tableNames.includes(table.name)
    ),
  };
  if (new Set(tableNames).size !== tableNames.length) {
    throw new Error(
      `Standalone migration ${migration.version} (${migration.tag}) has duplicate verification tables.`
    );
  }
  if (expected.tables.length !== tableNames.length) {
    throw new Error(
      `Standalone migration ${migration.version} (${migration.tag}) references a table absent from the expected schema.`
    );
  }
  if (actual.tables.length !== tableNames.length) {
    throw new Error(
      `Standalone migration ${migration.version} (${migration.tag}) did not create every required table.`
    );
  }
  const diff = diffSchemaContracts(expected, actual);
  printSchemaDiff(diff.errors, diff.warnings);
  if (diff.errors.length > 0) {
    throw new Error(
      `Standalone migration ${migration.version} (${migration.tag}) did not produce the required schema.`
    );
  }
}

async function assertStandaloneMigrationPreconditions(
  connection: Connection,
  migration: ForwardMigration
): Promise<void> {
  const emptyTables = migration.standaloneApply?.requireEmptyTables ?? [];
  for (const table of emptyTables) {
    if (!/^[a-z0-9_]+$/.test(table)) {
      throw new Error(`Standalone migration has an invalid precondition table name: ${table}`);
    }
    const [rows] = await connection.query<RowDataPacket[]>(
      `SELECT COUNT(*) AS count FROM \`${table}\``
    );
    if (Number(rows[0]?.count ?? 0) !== 0) {
      throw new Error(
        `Standalone migration ${migration.version} (${migration.tag}) requires an empty ${table} table.`
      );
    }
  }
}

async function getCurrentSchemaDiff(
  connection: Connection,
  manifest?: MigrationManifest
): Promise<ContractDiff> {
  const expected = buildExpectedSchemaContract();
  const actual = await fetchActualSchemaContract(connection);
  const diff = diffSchemaContracts(expected, actual);
  return manifest
    ? downgradeProposedMissingIndexErrors(diff, manifest)
    : diff;
}

async function validateRepository(manifest: MigrationManifest): Promise<void> {
  const errors = await validateManifest(manifest);
  if (errors.length > 0)
    throw new Error(`Migration manifest is invalid:\n- ${errors.join("\n- ")}`);
}

async function adopt(
  connection: Connection,
  manifest: MigrationManifest
): Promise<void> {
  requireApproval();
  const existing = await readLedger(connection);
  if (existing.length > 0)
    throw new Error(
      "Migration ledger already contains records; baseline adoption is a one-time operation."
    );

  const baselineChecksum = schemaContractChecksum(
    await loadSchemaContract(manifest.baseline.contract)
  );
  const adoptablePrefix = [] as MigrationManifest["migrations"];
  for (const migration of manifest.migrations) {
    if (migration.proposedOnly || !migration.adoptIfCurrentSchemaMatches) break;
    adoptablePrefix.push(migration);
  }
  const baselineEmbeddedMigrations = adoptablePrefix.filter(
    migration => migration.baselineEmbedded
  );
  const exactBaselineDiff = await getExactBaselineDiff(connection, manifest);
  const baselineIsExact = exactBaselineDiff.errors.length === 0;
  if (baselineIsExact && baselineEmbeddedMigrations.length > 0) {
    const baselineContract = await loadSchemaContract(manifest.baseline.contract);
    for (const migration of baselineEmbeddedMigrations) {
      const sql = await readFile(resolveRepoPath(migration.file), "utf8");
      if (sha256(sql) !== migration.sha256) {
        throw new Error(
          `Embedded migration ${migration.version} (${migration.tag}) checksum does not match the manifest.`
        );
      }
      const errors = validateBaselineEmbeddedMigration(
        sql,
        baselineContract,
        migration.file
      );
      if (errors.length > 0) {
        throw new Error(
          `Embedded migration ${migration.version} (${migration.tag}) is not proven by the immutable baseline:\n- ${errors.join("\n- ")}`
        );
      }
      await assertPinnedEmbeddedDatabaseEvidence(connection, migration);
    }
  }
  let adoptCurrentSchemaMigrations = false;
  if (!baselineIsExact && adoptablePrefix.length > 0) {
    console.log(
      "Database is not an exact baseline rehearsal target; evaluating current-schema adoption."
    );
    await assertBaselineCompatibility(connection, manifest);
    const currentDiff = await getCurrentSchemaDiff(connection, manifest);
    adoptCurrentSchemaMigrations = currentDiff.errors.length === 0;
    if (adoptCurrentSchemaMigrations) printSchemaDiff([], currentDiff.warnings);
  }
  if (!baselineIsExact && !adoptCurrentSchemaMigrations) {
    throw new Error(
      "Database matches neither the immutable baseline nor the verified current schema; refusing migration adoption."
    );
  }
  const adoptedForwardMigrations =
    baselineIsExact || adoptCurrentSchemaMigrations
      ? selectAdoptableForwardMigrations(baselineIsExact, adoptablePrefix)
      : [];
  await createLedger(connection);
  const adoptedRows = [
    [manifest.baseline.version, manifest.baseline.tag, baselineChecksum],
    ...adoptedForwardMigrations.map(migration => [
      migration.version,
      migration.tag,
      migration.sha256,
    ]),
  ];
  await connection.query(
    `
    INSERT INTO \`${LEDGER_TABLE}\`
      (version, tag, checksum, status, appliedAt, executionMs)
    VALUES ${adoptedRows
      .map(() => "(?, ?, ?, 'applied', CURRENT_TIMESTAMP, 0)")
      .join(", ")}
  `,
    adoptedRows.flat()
  );
  console.log(
    `Adopted verified baseline ${manifest.baseline.version} (${manifest.baseline.tag}).`
  );
  for (const migration of adoptedForwardMigrations) {
    const reason =
      baselineIsExact && migration.baselineEmbedded
        ? "immutable baseline-contract verification"
        : "current-schema verification";
    console.log(
      `Adopted existing ${migration.version} (${migration.tag}) after ${reason}.`
    );
  }
}

async function status(
  connection: Connection,
  manifest: MigrationManifest
): Promise<void> {
  const rows = await readLedger(connection);
  if (rows.length === 0) {
    throw new Error(
      `No Echelon migration ledger exists. Verify a backup and run pnpm db:migrate:adopt before the next schema change.`
    );
  }
  const expectedBaseline = await loadSchemaContract(manifest.baseline.contract);
  const baseline = rows.find(row => row.version === manifest.baseline.version);
  if (baseline?.checksum !== schemaContractChecksum(expectedBaseline)) {
    throw new Error(
      "The adopted baseline checksum does not match the immutable baseline contract."
    );
  }
  const pending = planForwardMigrations(manifest, rows);
  console.log(
    `Baseline: ${manifest.baseline.version} (${manifest.baseline.tag})`
  );
  console.log(
    `Applied forward migrations: ${rows.filter(row => row.version > manifest.baseline.version).length}`
  );
  console.log(`Pending forward migrations: ${pending.length}`);
  for (const migration of pending)
    console.log(`- ${migration.version} ${migration.tag}`);
  if (pending.length === 0) await assertCurrentSchema(connection);
}

async function verifyBaseline(
  connection: Connection,
  manifest: MigrationManifest
): Promise<void> {
  await verifyExactBaselineSchema(connection, manifest);
}

async function apply(
  connection: Connection,
  manifest: MigrationManifest
): Promise<void> {
  requireApproval();
  if (!(await ledgerExists(connection))) {
    throw new Error(
      "Migration ledger is missing. Adopt the verified baseline first."
    );
  }

  const [lockRows] = await connection.query<RowDataPacket[]>(
    "SELECT GET_LOCK('echelon_forward_migrations', 15) AS acquired"
  );
  if (Number(lockRows[0]?.acquired ?? 0) !== 1)
    throw new Error("Could not acquire the Echelon migration lock.");

  try {
    const rows = await readLedger(connection);
    const expectedBaseline = await loadSchemaContract(
      manifest.baseline.contract
    );
    const baseline = rows.find(
      row => row.version === manifest.baseline.version
    );
    if (baseline?.checksum !== schemaContractChecksum(expectedBaseline)) {
      throw new Error(
        "The adopted baseline checksum does not match the immutable baseline contract."
      );
    }
    const pending = planForwardMigrations(manifest, rows);
    if (pending.length === 0) {
      console.log("No forward migrations are pending.");
      await assertCurrentSchema(connection);
      return;
    }

    for (const migration of pending) {
      const startedAt = Date.now();
      await connection.query(
        `
        INSERT INTO \`${LEDGER_TABLE}\`
          (version, tag, checksum, status)
        VALUES (?, ?, ?, 'applying')
      `,
        [migration.version, migration.tag, migration.sha256]
      );

      try {
        const sql = await readFile(resolveRepoPath(migration.file), "utf8");
        for (const statement of splitMigrationStatements(sql))
          await connection.query(statement);
        await connection.query(
          `
          UPDATE \`${LEDGER_TABLE}\`
          SET status = 'applied', appliedAt = CURRENT_TIMESTAMP, executionMs = ?, errorMessage = NULL
          WHERE version = ?
        `,
          [Date.now() - startedAt, migration.version]
        );
        console.log(`Applied ${migration.version} (${migration.tag}).`);
      } catch (error) {
        const message =
          error instanceof Error
            ? error.message.slice(0, 4000)
            : String(error).slice(0, 4000);
        await connection.query(
          `
          UPDATE \`${LEDGER_TABLE}\`
          SET status = 'failed', executionMs = ?, errorMessage = ?
          WHERE version = ?
        `,
          [Date.now() - startedAt, message, migration.version]
        );
        throw error;
      }
    }
    await assertCurrentSchema(connection);
  } finally {
    await connection.query("SELECT RELEASE_LOCK('echelon_forward_migrations')");
  }
}

async function applyStandalone(
  connection: Connection,
  manifest: MigrationManifest
): Promise<void> {
  const targetTag = requireStandaloneApproval();
  if (!(await ledgerExists(connection))) {
    throw new Error(
      "Migration ledger is missing. Adopt the verified baseline first."
    );
  }

  const [lockRows] = await connection.query<RowDataPacket[]>(
    "SELECT GET_LOCK('echelon_forward_migrations', 15) AS acquired"
  );
  if (Number(lockRows[0]?.acquired ?? 0) !== 1)
    throw new Error("Could not acquire the Echelon migration lock.");

  try {
    const rows = await readLedger(connection);
    const expectedBaseline = await loadSchemaContract(
      manifest.baseline.contract
    );
    const baseline = rows.find(
      row => row.version === manifest.baseline.version
    );
    if (baseline?.checksum !== schemaContractChecksum(expectedBaseline)) {
      throw new Error(
        "The adopted baseline checksum does not match the immutable baseline contract."
      );
    }
    const migration = planApprovedStandaloneMigration(
      manifest,
      rows,
      targetTag
    );
    await assertStandaloneMigrationPreconditions(connection, migration);
    const startedAt = Date.now();
    await connection.query(
      `
        INSERT INTO \`${LEDGER_TABLE}\`
          (version, tag, checksum, status)
        VALUES (?, ?, ?, 'applying')
      `,
      [migration.version, migration.tag, migration.sha256]
    );
    try {
      const sql = await readFile(resolveRepoPath(migration.file), "utf8");
      for (const statement of splitMigrationStatements(sql))
        await connection.query(statement);
      await assertStandaloneMigrationSchema(connection, migration);
      await connection.query(
        `
          UPDATE \`${LEDGER_TABLE}\`
          SET status = 'applied', appliedAt = CURRENT_TIMESTAMP, executionMs = ?, errorMessage = NULL
          WHERE version = ?
        `,
        [Date.now() - startedAt, migration.version]
      );
      console.log(
        `Applied approved standalone migration ${migration.version} (${migration.tag}).`
      );
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message.slice(0, 4000)
          : String(error).slice(0, 4000);
      await connection.query(
        `
          UPDATE \`${LEDGER_TABLE}\`
          SET status = 'failed', executionMs = ?, errorMessage = ?
          WHERE version = ?
        `,
        [Date.now() - startedAt, message, migration.version]
      );
      throw error;
    }
  } finally {
    await connection.query("SELECT RELEASE_LOCK('echelon_forward_migrations')");
  }
}

const command = process.argv[2];
if (
  !(["status", "verify-baseline", "adopt", "apply", "apply-standalone"] as const).includes(
    command as never
  )
) {
  console.error(
    "Usage: migrate.ts <status|verify-baseline|adopt|apply|apply-standalone>"
  );
  process.exit(1);
}

const manifest = await loadManifest();
await validateRepository(manifest);
const connection = await mysql.createConnection(requireDatabaseUrl());

try {
  if (command === "status") await status(connection, manifest);
  if (command === "verify-baseline") await verifyBaseline(connection, manifest);
  if (command === "adopt") await adopt(connection, manifest);
  if (command === "apply") await apply(connection, manifest);
  if (command === "apply-standalone")
    await applyStandalone(connection, manifest);
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
} finally {
  await connection.end();
}
