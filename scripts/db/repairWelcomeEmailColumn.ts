import mysql, { type Connection, type ResultSetHeader, type RowDataPacket } from "mysql2/promise";

const APPROVAL_TOKEN = "REPAIR_WELCOME_EMAIL_COLUMN";
const BACKUP_TOKEN = "BACKUP_VERIFIED";
const LOCK_NAME = "echelon_welcome_email_schema_repair";

type ColumnRow = RowDataPacket & {
  columnType: string;
  isNullable: "YES" | "NO";
  columnDefault: string | null;
};

function requireDatabaseUrl(): string {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) throw new Error("DATABASE_URL is required.");
  return databaseUrl;
}

function requireApproval(): void {
  if (process.env.MIGRATION_APPROVED !== APPROVAL_TOKEN) {
    throw new Error(
      `Refusing database write. Set MIGRATION_APPROVED=${APPROVAL_TOKEN}.`,
    );
  }
  if (process.env.MIGRATION_BACKUP_CONFIRMED !== BACKUP_TOKEN) {
    throw new Error(
      `Refusing database write. Set MIGRATION_BACKUP_CONFIRMED=${BACKUP_TOKEN} after verifying a backup.`,
    );
  }
}

async function getColumn(connection: Connection): Promise<ColumnRow | null> {
  const [rows] = await connection.query<ColumnRow[]>(`
    SELECT COLUMN_TYPE AS columnType,
           IS_NULLABLE AS isNullable,
           COLUMN_DEFAULT AS columnDefault
    FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'purchases'
      AND COLUMN_NAME = 'welcomeEmailSentAt'
    LIMIT 1
  `);
  return rows[0] ?? null;
}

function assertCompatibleColumn(column: ColumnRow): void {
  if (column.columnType.toLowerCase() !== "timestamp" || column.isNullable !== "YES") {
    throw new Error(
      "purchases.welcomeEmailSentAt exists with an incompatible type or nullability; manual review is required.",
    );
  }
}

async function repair(connection: Connection): Promise<void> {
  const repairStartedAt = new Date();
  const recentCutoff = new Date(repairStartedAt.getTime() - 24 * 60 * 60 * 1000);
  let column = await getColumn(connection);
  let needsFinalization = false;

  if (!column) {
    // Populate historical rows atomically as the column is created. This avoids
    // a window where the hourly worker could send duplicate onboarding emails
    // to every old purchase before a separate backfill finishes.
    await connection.query(`
      ALTER TABLE \`purchases\`
      ADD COLUMN \`welcomeEmailSentAt\` timestamp NULL DEFAULT CURRENT_TIMESTAMP
      AFTER \`refundedAt\`
    `);
    needsFinalization = true;
    console.log("Added purchases.welcomeEmailSentAt with a duplicate-safe historical marker.");
  } else {
    assertCompatibleColumn(column);
    needsFinalization = column.columnDefault !== null;
  }

  if (needsFinalization) {
    // New purchases must default to NULL so the 24-hour worker can select them.
    await connection.query(`
      ALTER TABLE \`purchases\`
      MODIFY COLUMN \`welcomeEmailSentAt\` timestamp NULL DEFAULT NULL
    `);

    // Purchases that are not yet 24 hours old cannot have been delivered by the
    // hourly job. Restore those rows to NULL while leaving older purchases
    // marked, which prevents a bulk duplicate-email event after this repair.
    const [result] = await connection.execute<ResultSetHeader>(`
      UPDATE \`purchases\`
      SET \`welcomeEmailSentAt\` = NULL
      WHERE \`status\` = 'active'
        AND \`createdAt\` > ?
        AND \`createdAt\` <= ?
    `, [recentCutoff, repairStartedAt]);
    console.log(`Preserved ${result.affectedRows} recent active purchase(s) for normal 24-hour delivery.`);
  }

  column = await getColumn(connection);
  if (!column) throw new Error("Repair finished without creating purchases.welcomeEmailSentAt.");
  assertCompatibleColumn(column);
  if (column.columnDefault !== null) {
    throw new Error("purchases.welcomeEmailSentAt still has a non-NULL default after repair.");
  }

  console.log("Welcome-email schema repair verified. Historical purchases will not be bulk-emailed.");
}

requireApproval();
const connection = await mysql.createConnection(requireDatabaseUrl());

try {
  const [lockRows] = await connection.query<RowDataPacket[]>(
    "SELECT GET_LOCK(?, 15) AS acquired",
    [LOCK_NAME],
  );
  if (Number(lockRows[0]?.acquired ?? 0) !== 1) {
    throw new Error("Could not acquire the welcome-email schema repair lock.");
  }
  await repair(connection);
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
} finally {
  await connection.query("SELECT RELEASE_LOCK(?)", [LOCK_NAME]).catch(() => undefined);
  await connection.end();
}
