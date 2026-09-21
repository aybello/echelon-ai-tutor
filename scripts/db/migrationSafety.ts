import { createHash } from "node:crypto";
import { readFile, readdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { isTable } from "drizzle-orm";
import { getTableConfig } from "drizzle-orm/mysql-core";
import type { Connection } from "mysql2/promise";
import * as schema from "../../drizzle/schema.ts";

const REPO_ROOT = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../.."
);
export const MANIFEST_PATH = path.join(
  REPO_ROOT,
  "drizzle/forward-migrations.json"
);
export const LEDGER_TABLE = "echelon_schema_migrations";
const BASELINE_EMBEDDED_0053 = {
  file: "drizzle/0053_question_governance.sql",
  sha256: "10b8141bbfed9fc674116561468630e73b0911d4d018caccd1911be5c40cd03a",
} as const;

export interface SchemaColumnContract {
  name: string;
  type: string;
  nullable: boolean;
  autoIncrement: boolean;
}

export interface SchemaIndexContract {
  name: string;
  unique: boolean;
  columns: string[];
}

export interface SchemaTableContract {
  name: string;
  columns: SchemaColumnContract[];
  indexes: SchemaIndexContract[];
}

export interface SchemaContract {
  formatVersion: 1;
  tables: SchemaTableContract[];
}

export interface ForwardMigration {
  version: number;
  tag: string;
  file: string;
  sha256: string;
  allowDestructive?: boolean;
  adoptIfCurrentSchemaMatches?: boolean;
  /** Historical SQL whose exact schema is already contained in the immutable baseline contract. */
  baselineEmbedded?: boolean;
  /** Explicitly proposed but not yet applied additive schema changes. */
  proposedOnly?: boolean;
  /**
   * Allows this additive migration to be applied through the separately
   * approved standalone command when earlier proposed work remains pending.
   * The listed tables are checked against schema.ts immediately after apply.
   */
  standaloneApply?: {
    tables: string[];
    /** Tables that must have zero rows before this standalone migration runs. */
    requireEmptyTables?: string[];
  };
  /** Missing indexes that this exact proposed migration will add. */
  verifierAllowMissingIndexes?: Array<{
    table: string;
    index: string;
    columns: string[];
  }>;
  /** Exact pending column-type transition allowed during baseline adoption. */
  verifierAllowPendingColumnTypes?: Array<{
    table: string;
    column: string;
    baselineType: string;
    targetType: string;
  }>;
}

export function selectAdoptableForwardMigrations(
  baselineIsExact: boolean,
  adoptablePrefix: readonly ForwardMigration[]
): ForwardMigration[] {
  return baselineIsExact
    ? adoptablePrefix.filter(migration => migration.baselineEmbedded)
    : [...adoptablePrefix];
}

export interface MigrationManifest {
  formatVersion: 1;
  baseline: {
    version: number;
    tag: string;
    contract: string;
    sha256: string;
  };
  migrations: ForwardMigration[];
}

export interface LedgerRow {
  version: number;
  tag: string;
  checksum: string;
  status: "applying" | "applied" | "failed";
}

export interface ContractDiff {
  errors: string[];
  warnings: string[];
}

export function sha256(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

export function stableContractJson(contract: SchemaContract): string {
  return `${JSON.stringify(contract, null, 2)}\n`;
}

export function schemaContractChecksum(contract: SchemaContract): string {
  return sha256(stableContractJson(contract));
}

export function normalizeMySqlType(type: string): string {
  const normalized = type
    .toLowerCase()
    .replace(/\s+/g, "")
    .replace(/^boolean$/, "tinyint(1)");
  return normalized
    .replace(/\bbigint\(\d+\)/g, "bigint")
    .replace(/\bint\(\d+\)/g, "int");
}

export function mysqlNonUniqueToUnique(value: unknown): boolean {
  const primitive = Buffer.isBuffer(value) ? value.toString("utf8") : value;
  let nonUnique: number;

  if (typeof primitive === "bigint") {
    nonUnique = Number(primitive);
  } else if (typeof primitive === "number") {
    nonUnique = primitive;
  } else if (
    typeof primitive === "string" &&
    /^(?:0|1)$/.test(primitive.trim())
  ) {
    nonUnique = Number(primitive.trim());
  } else {
    throw new Error(
      `Unexpected information_schema.STATISTICS.NON_UNIQUE value: ${String(value)}`
    );
  }

  if (nonUnique !== 0 && nonUnique !== 1) {
    throw new Error(
      `Unexpected information_schema.STATISTICS.NON_UNIQUE value: ${String(value)}`
    );
  }
  return nonUnique === 0;
}

function indexColumnName(column: unknown): string | null {
  if (typeof column !== "object" || column === null) return null;
  const candidate = column as { name?: unknown };
  return typeof candidate.name === "string" ? candidate.name : null;
}

export function buildExpectedSchemaContract(): SchemaContract {
  const tables = Object.values(schema)
    .filter(isTable)
    .map(table => {
      const config = getTableConfig(table as never);
      const columns = config.columns
        .map(column => ({
          name: column.name,
          type: normalizeMySqlType(column.getSQLType()),
          nullable: !column.notNull,
          autoIncrement: Boolean(
            "autoIncrement" in column && column.autoIncrement
          ),
        }))
        .sort((a, b) => a.name.localeCompare(b.name));

      const indexes: SchemaIndexContract[] = [];
      const primaryColumns = config.columns
        .filter(column => column.primary)
        .map(column => column.name);
      if (primaryColumns.length > 0) {
        indexes.push({
          name: "PRIMARY",
          unique: true,
          columns: primaryColumns,
        });
      }

      for (const column of config.columns) {
        if (column.isUnique) {
          indexes.push({
            name: column.uniqueName ?? `${config.name}_${column.name}_unique`,
            unique: true,
            columns: [column.name],
          });
        }
      }

      for (const index of config.indexes) {
        indexes.push({
          name: index.config.name,
          unique: Boolean(index.config.unique),
          columns: index.config.columns
            .map(indexColumnName)
            .filter((name): name is string => name !== null),
        });
      }

      return {
        name: config.name,
        columns,
        indexes: indexes.sort((a, b) => a.name.localeCompare(b.name)),
      };
    })
    .sort((a, b) => a.name.localeCompare(b.name));

  return { formatVersion: 1, tables };
}

export async function loadSchemaContract(
  contractPath: string
): Promise<SchemaContract> {
  return JSON.parse(
    await readFile(path.resolve(REPO_ROOT, contractPath), "utf8")
  ) as SchemaContract;
}

export async function loadManifest(): Promise<MigrationManifest> {
  return JSON.parse(await readFile(MANIFEST_PATH, "utf8")) as MigrationManifest;
}

export function findDestructiveSql(sql: string): string[] {
  const withoutComments = sql
    .replace(/\/\*[\s\S]*?\*\//g, " ")
    .replace(/^\s*--.*$/gm, " ");
  const patterns: Array<[string, RegExp]> = [
    ["DROP DATABASE", /\bdrop\s+database\b/i],
    ["DROP TABLE", /\bdrop\s+table\b/i],
    ["DROP COLUMN", /\balter\s+table\b[\s\S]*?\bdrop\s+column\b/i],
    ["DROP INDEX OR KEY", /\balter\s+table\b[\s\S]*?\bdrop\s+(?:index|key)\b/i],
    [
      "DROP CONSTRAINT",
      /\balter\s+table\b[\s\S]*?\bdrop\s+(?:constraint|foreign\s+key)\b/i,
    ],
    [
      "RENAME TABLE",
      /\brename\s+table\b|\balter\s+table\b[\s\S]*?\brename\s+to\b/i,
    ],
    ["TRUNCATE", /\btruncate\s+(?:table\s+)?/i],
    ["DELETE", /\bdelete\s+from\b/i],
  ];
  return patterns
    .filter(([, pattern]) => pattern.test(withoutComments))
    .map(([label]) => label);
}

export function splitMigrationStatements(sql: string): string[] {
  return splitSemicolonDelimitedSql(sql);
}

function splitSemicolonDelimitedSql(source: string): string[] {
  const statements: string[] = [];
  let statement = "";
  let statementHasCode = false;
  let quote: "'" | '"' | "`" | null = null;
  let lineComment = false;
  let blockComment = false;

  for (let index = 0; index < source.length; index += 1) {
    const breakpointEnd = findStatementBreakpointEnd(source, index);
    if (!quote && !lineComment && !blockComment && breakpointEnd !== null) {
      const trimmed = statement.trim();
      if (trimmed && statementHasCode) statements.push(trimmed);
      statement = "";
      statementHasCode = false;
      index = breakpointEnd - 1;
      continue;
    }

    const character = source[index] ?? "";
    const next = source[index + 1] ?? "";
    const previous = source[index - 1] ?? "";
    statement += character;

    if (lineComment) {
      if (character === "\n") lineComment = false;
      continue;
    }
    if (blockComment) {
      if (previous === "*" && character === "/") blockComment = false;
      continue;
    }
    if (quote) {
      if (character === quote && next === quote) {
        statement += next;
        index += 1;
        continue;
      }
      let precedingBackslashes = 0;
      for (let cursor = index - 1; cursor >= 0 && source[cursor] === "\\"; cursor -= 1) {
        precedingBackslashes += 1;
      }
      if (character === quote && precedingBackslashes % 2 === 0) quote = null;
      continue;
    }
    if (
      character === "-" &&
      next === "-" &&
      (source[index + 2] === undefined || /[\s\x00-\x1f]/.test(source[index + 2]))
    ) {
      lineComment = true;
      continue;
    }
    if (character === "#") {
      lineComment = true;
      continue;
    }
    if (character === "/" && next === "*") {
      if (source[index + 2] === "!") {
        throw new Error("Executable MySQL comments are not supported in migration SQL.");
      }
      if (source[index + 2] === "/") {
        throw new Error("Unterminated block comment in migration SQL.");
      }
      blockComment = true;
      continue;
    }
    if (character === "'" || character === '"' || character === "`") {
      quote = character;
      statementHasCode = true;
      continue;
    }
    if (character === ";") {
      const trimmed = statement.trim();
      if (trimmed && statementHasCode) statements.push(trimmed);
      statement = "";
      statementHasCode = false;
      continue;
    }
    if (!/\s/.test(character)) statementHasCode = true;
  }

  if (quote) throw new Error("Unterminated quoted string in migration SQL.");
  if (blockComment) throw new Error("Unterminated block comment in migration SQL.");
  const trailingStatement = statement.trim();
  if (trailingStatement && statementHasCode) {
    statements.push(trailingStatement);
  }
  return statements;
}

function findStatementBreakpointEnd(source: string, index: number): number | null {
  if (index > 0 && source[index - 1] !== "\n") return null;
  const match = /^[\t \r]*-->[\t ]*statement-breakpoint[\t \r]*(?:\n|$)/.exec(
    source.slice(index)
  );
  return match ? index + match[0].length : null;
}

export function validateBaselineEmbeddedMigration(
  sql: string,
  contract: SchemaContract,
  file: string
): string[] {
  const errors: string[] = [];
  const statements = splitMigrationStatements(sql);
  if (statements.length !== 1) {
    return [`${file} baselineEmbedded validation requires exactly one SQL statement.`];
  }
  const statement = statements[0] ?? "";
  const tableMatch = /^\s*alter\s+table\s+`?([a-z0-9_]+)`?/i.exec(
    statement
  );
  const tableName = tableMatch?.[1];
  if (!tableName) {
    return [`${file} baselineEmbedded validation requires an ALTER TABLE statement.`];
  }
  const baselineTable = contract.tables.find(table => table.name === tableName);
  if (!baselineTable) {
    return [`${file} modifies ${tableName}, which is absent from the baseline contract.`];
  }

  const body = statement
    .slice((tableMatch?.[0] ?? "").length)
    .replace(/;\s*$/, "")
    .trim();
  const clauses = splitTopLevelSqlCommaList(body);
  if (clauses.length === 0) {
    return [`${file} baselineEmbedded validation found no ALTER TABLE clauses.`];
  }
  for (const clause of clauses) {
    const columnMatch = /^add\s+column\s+`?([a-z0-9_]+)`?\s+(.+)$/i.exec(clause);
    const indexMatch = /^add\s+(unique\s+)?(?:index|key)\s+`?([a-z0-9_]+)`?\s*\((.+)\)$/i.exec(clause);
    if (!columnMatch && !indexMatch) {
      errors.push(`${file} contains an unrecognized baselineEmbedded ALTER clause: ${clause}.`);
      continue;
    }
    if (columnMatch) {
      const name = columnMatch[1] ?? "";
      const definition = columnMatch[2] ?? "";
      const type = /^([a-z]+(?:\([^)]*\))?)/i.exec(definition)?.[1];
      const baselineColumn = baselineTable.columns.find(column => column.name === name);
      if (!type || !baselineColumn) {
        errors.push(`${file} baseline contract is missing added column ${tableName}.${name}.`);
        continue;
      }
      if (normalizeMySqlType(type) !== baselineColumn.type) {
        errors.push(`${file} baseline column type does not match ${tableName}.${name}.`);
      }
      const nullable = !/\bnot\s+null\b/i.test(definition);
      if (nullable !== baselineColumn.nullable) {
        errors.push(`${file} baseline column nullability does not match ${tableName}.${name}.`);
      }
      const remainder = definition
        .slice(type.length)
        .replace(/\bnot\s+null\b|\bnull\b/gi, "")
        .trim();
      const allowedEmbeddedDefault =
        file === BASELINE_EMBEDDED_0053.file &&
        tableName === "questions" &&
        name === "reviewStatus" &&
        remainder.toLowerCase() === "default 'unreviewed'";
      if (remainder && !allowedEmbeddedDefault) {
        errors.push(
          `${file} contains unmodelled column attributes on ${tableName}.${name}: ${remainder}.`
        );
      }
      continue;
    }
    const name = indexMatch?.[2] ?? "";
    const unique = Boolean(indexMatch?.[1]);
    const columns = (indexMatch?.[3] ?? "")
      .split(",")
      .map(column => column.trim().replace(/`/g, ""));
    const baselineIndex = baselineTable.indexes.find(index => index.name === name);
    if (!baselineIndex) {
      errors.push(`${file} baseline contract is missing added index ${tableName}.${name}.`);
      continue;
    }
    if (baselineIndex.unique !== unique || baselineIndex.columns.join(",") !== columns.join(",")) {
      errors.push(`${file} baseline index metadata does not match ${tableName}.${name}.`);
    }
  }
  return errors;
}

function splitTopLevelSqlCommaList(sql: string): string[] {
  const clauses: string[] = [];
  let clause = "";
  let quote: "'" | '"' | "`" | null = null;
  let parenthesisDepth = 0;
  for (let index = 0; index < sql.length; index += 1) {
    const character = sql[index] ?? "";
    const next = sql[index + 1] ?? "";
    clause += character;
    if (quote) {
      if (character === quote && next === quote) {
        clause += next;
        index += 1;
        continue;
      }
      let backslashes = 0;
      for (let cursor = index - 1; cursor >= 0 && sql[cursor] === "\\"; cursor -= 1) backslashes += 1;
      if (character === quote && backslashes % 2 === 0) quote = null;
      continue;
    }
    if (character === "'" || character === '"' || character === "`") {
      quote = character;
      continue;
    }
    if (character === "(") parenthesisDepth += 1;
    if (character === ")") parenthesisDepth -= 1;
    if (parenthesisDepth < 0) throw new Error("Unbalanced parentheses in ALTER TABLE SQL.");
    if (character === "," && parenthesisDepth === 0) {
      const trimmed = clause.slice(0, -1).trim();
      if (trimmed) clauses.push(trimmed);
      clause = "";
    }
  }
  if (quote || parenthesisDepth !== 0) throw new Error("Unbalanced SQL in ALTER TABLE clause list.");
  const trailing = clause.trim();
  if (trailing) clauses.push(trailing);
  return clauses;
}

export async function validateManifest(
  manifest: MigrationManifest
): Promise<string[]> {
  const errors: string[] = [];
  if (manifest.formatVersion !== 1)
    errors.push("Unsupported migration manifest formatVersion.");
  if (
    !Number.isInteger(manifest.baseline.version) ||
    manifest.baseline.version < 1
  ) {
    errors.push("Baseline version must be a positive integer.");
  }
  if (
    !manifest.baseline.tag.startsWith(
      String(manifest.baseline.version).padStart(4, "0")
    )
  ) {
    errors.push("Baseline tag must begin with its four-digit version.");
  }

  const contractPath = path.resolve(REPO_ROOT, manifest.baseline.contract);
  const contractRaw = await readFile(contractPath, "utf8").catch(() => null);
  const contract = contractRaw
    ? (JSON.parse(contractRaw) as SchemaContract)
    : null;
  if (!contract)
    errors.push(`Baseline contract is missing: ${manifest.baseline.contract}`);
  if (contractRaw && sha256(contractRaw) !== manifest.baseline.sha256) {
    errors.push(
      "Immutable baseline contract checksum does not match the manifest."
    );
  }
  const baselineSql = path.join(
    REPO_ROOT,
    "drizzle",
    `${manifest.baseline.tag}.sql`
  );
  if (!(await readFile(baselineSql, "utf8").catch(() => null))) {
    errors.push(
      `Baseline SQL marker is missing: drizzle/${manifest.baseline.tag}.sql`
    );
  }
  const journal = JSON.parse(
    await readFile(path.join(REPO_ROOT, "drizzle/meta/_journal.json"), "utf8")
  ) as { entries?: Array<{ idx?: number; tag?: string }> };
  if (
    !journal.entries?.some(
      entry =>
        entry.idx === manifest.baseline.version &&
        entry.tag === manifest.baseline.tag
    )
  ) {
    errors.push(
      "Drizzle journal does not contain the declared baseline marker."
    );
  }

  const sqlFiles = (await readdir(path.join(REPO_ROOT, "drizzle")))
    .filter(file => /^\d{4}_.+\.sql$/.test(file))
    .map(file => ({ file, version: Number(file.slice(0, 4)) }));
  const forwardFiles = sqlFiles.filter(
    file => file.version > manifest.baseline.version
  );
  const declaredFiles = new Set(
    manifest.migrations.map(migration => migration.file)
  );

  for (const file of forwardFiles) {
    const relative = `drizzle/${file.file}`;
    if (!declaredFiles.has(relative))
      errors.push(
        `Forward migration is not declared in the manifest: ${relative}`
      );
  }

  let expectedVersion = manifest.baseline.version + 1;
  const seenVersions = new Set<number>();
  const seenTags = new Set<string>();
  const baselineEmbeddedMigrations = manifest.migrations.filter(
    migration => migration.baselineEmbedded
  );
  if (baselineEmbeddedMigrations.length > 1) {
    errors.push("Only one explicitly reviewed baselineEmbedded migration is permitted.");
  }
  for (const migration of manifest.migrations) {
    if (migration.version !== expectedVersion) {
      errors.push(
        `Expected forward migration version ${expectedVersion}, found ${migration.version}.`
      );
    }
    expectedVersion = migration.version + 1;
    if (seenVersions.has(migration.version))
      errors.push(`Duplicate migration version: ${migration.version}`);
    if (seenTags.has(migration.tag))
      errors.push(`Duplicate migration tag: ${migration.tag}`);
    seenVersions.add(migration.version);
    seenTags.add(migration.tag);

    const expectedPrefix = String(migration.version).padStart(4, "0");
    if (
      !migration.tag.startsWith(expectedPrefix) ||
      !migration.file.endsWith(`${migration.tag}.sql`)
    ) {
      errors.push(
        `Migration ${migration.version} has inconsistent tag/file naming.`
      );
    }
    if (!forwardFiles.some(file => `drizzle/${file.file}` === migration.file)) {
      errors.push(
        `Manifest references a missing forward migration: ${migration.file}`
      );
      continue;
    }
    const sql = await readFile(path.join(REPO_ROOT, migration.file), "utf8");
    const actualChecksum = sha256(sql);
    if (actualChecksum !== migration.sha256) {
      errors.push(
        `Checksum mismatch for ${migration.file}: expected ${migration.sha256}, found ${actualChecksum}.`
      );
    }
    const destructive = findDestructiveSql(sql);
    if (destructive.length > 0 && !migration.allowDestructive) {
      errors.push(
        `${migration.file} contains destructive SQL (${destructive.join(", ")}) without allowDestructive=true.`
      );
    }
    if (
      destructive.length > 0 &&
      migration.adoptIfCurrentSchemaMatches === true
    ) {
      errors.push(
        `${migration.file} cannot be adopted from schema state because it contains destructive SQL.`
      );
    }
    try {
      if (splitMigrationStatements(sql).length === 0) {
        errors.push(`${migration.file} contains no SQL statements.`);
      }
    } catch (error) {
      errors.push(
        `${migration.file} cannot be parsed safely: ${error instanceof Error ? error.message : String(error)}`
      );
    }
    if (migration.proposedOnly && migration.adoptIfCurrentSchemaMatches) {
      errors.push(
        `${migration.file} cannot be both proposedOnly and adoptIfCurrentSchemaMatches.`
      );
    }
    if (migration.baselineEmbedded) {
      if (!migration.adoptIfCurrentSchemaMatches || migration.proposedOnly) {
        errors.push(
          `${migration.file} can be baselineEmbedded only when adoptIfCurrentSchemaMatches=true and proposedOnly is absent.`
        );
      }
      if (migration.version !== manifest.baseline.version + 1) {
        errors.push(
          `${migration.file} can be baselineEmbedded only as the first forward migration after the baseline.`
        );
      }
      if (
        migration.file !== BASELINE_EMBEDDED_0053.file ||
        migration.sha256 !== BASELINE_EMBEDDED_0053.sha256
      ) {
        errors.push(
          `${migration.file} is not the one explicitly reviewed baseline-embedded migration.`
        );
      }
      if (contract) {
        errors.push(
          ...validateBaselineEmbeddedMigration(sql, contract, migration.file)
        );
      }
    }
    if (migration.standaloneApply) {
      if (!migration.proposedOnly) {
        errors.push(
          `${migration.file} can allow standalone application only when proposedOnly=true.`
        );
      }
      if (destructive.length > 0 || migration.allowDestructive) {
        errors.push(
          `${migration.file} cannot allow standalone application when it is destructive.`
        );
      }
      if (migration.standaloneApply.tables.length === 0) {
        errors.push(
          `${migration.file} standalone application must declare at least one table to verify.`
        );
      }
      for (const tableName of migration.standaloneApply.tables) {
        if (
          !buildExpectedSchemaContract().tables.some(
            table => table.name === tableName
          )
        ) {
          errors.push(
            `${migration.file} standalone verification table is not declared in schema.ts: ${tableName}.`
          );
        }
      }
    }
    for (const allowedIndex of migration.verifierAllowMissingIndexes ?? []) {
      const expectedTable = buildExpectedSchemaContract().tables.find(
        table => table.name === allowedIndex.table
      );
      const expectedIndex = expectedTable?.indexes.find(
        index => index.name === allowedIndex.index
      );
      if (!expectedIndex) {
        errors.push(
          `${migration.file} allows an index that is not declared in schema.ts: ${allowedIndex.table}.${allowedIndex.index}.`
        );
        continue;
      }
      if (
        expectedIndex.columns.join(",") !== allowedIndex.columns.join(",") ||
        expectedIndex.unique
      ) {
        errors.push(
          `${migration.file} has incorrect expected metadata for ${allowedIndex.table}.${allowedIndex.index}.`
        );
      }
      const normalizedSql = sql.toLowerCase().replace(/[\s`]/g, "");
      const requiredStatement = `createindex${allowedIndex.index.toLowerCase()}on${allowedIndex.table.toLowerCase()}(${allowedIndex.columns.join(",").toLowerCase()})`;
      if (!normalizedSql.includes(requiredStatement)) {
        errors.push(
          `${migration.file} does not create declared pending index ${allowedIndex.table}.${allowedIndex.index}.`
        );
      }
    }
    for (const allowedType of
      migration.verifierAllowPendingColumnTypes ?? []) {
      if (!migration.proposedOnly) {
        errors.push(
          `${migration.file} permits pending column drift but is not proposedOnly.`
        );
      }
      const expectedTable = buildExpectedSchemaContract().tables.find(
        table => table.name === allowedType.table
      );
      const expectedColumn = expectedTable?.columns.find(
        column => column.name === allowedType.column
      );
      const baselineColumn = contract?.tables
        .find(table => table.name === allowedType.table)
        ?.columns.find(column => column.name === allowedType.column);
      if (
        !expectedColumn ||
        normalizeMySqlType(expectedColumn.type) !==
          normalizeMySqlType(allowedType.targetType)
      ) {
        errors.push(
          `${migration.file} has an incorrect target type for ${allowedType.table}.${allowedType.column}.`
        );
      }
      if (
        !baselineColumn ||
        normalizeMySqlType(baselineColumn.type) !==
          normalizeMySqlType(allowedType.baselineType)
      ) {
        errors.push(
          `${migration.file} has an incorrect baseline type for ${allowedType.table}.${allowedType.column}.`
        );
      }
      const normalizedSql = sql.toLowerCase().replace(/[\s`]/g, "");
      const requiredStatement =
        `altertable${allowedType.table.toLowerCase()}modifycolumn${allowedType.column.toLowerCase()}` +
        allowedType.targetType.toLowerCase().replace(/\s/g, "");
      if (!normalizedSql.includes(requiredStatement)) {
        errors.push(
          `${migration.file} does not apply the declared type transition for ${allowedType.table}.${allowedType.column}.`
        );
      }
    }
  }

  for (const file of declaredFiles) {
    if (!forwardFiles.some(candidate => `drizzle/${candidate.file}` === file)) {
      errors.push(
        `Manifest contains a non-forward or unknown migration: ${file}`
      );
    }
  }
  return errors;
}

export async function fetchActualSchemaContract(
  connection: Connection
): Promise<SchemaContract> {
  const [columnRows] = await connection.query(`
    SELECT TABLE_NAME AS tableName, COLUMN_NAME AS columnName, COLUMN_TYPE AS columnType,
           IS_NULLABLE AS isNullable, EXTRA AS extra
    FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
    ORDER BY TABLE_NAME, COLUMN_NAME
  `);
  const [indexRows] = await connection.query(`
    SELECT TABLE_NAME AS tableName, INDEX_NAME AS indexName, NON_UNIQUE AS nonUnique,
           SEQ_IN_INDEX AS sequenceNumber, COLUMN_NAME AS columnName
    FROM information_schema.STATISTICS
    WHERE TABLE_SCHEMA = DATABASE()
    ORDER BY TABLE_NAME, INDEX_NAME, SEQ_IN_INDEX
  `);

  type ColumnRow = {
    tableName: string;
    columnName: string;
    columnType: string;
    isNullable: "YES" | "NO";
    extra: string;
  };
  type IndexRow = {
    tableName: string;
    indexName: string;
    nonUnique: unknown;
    sequenceNumber: unknown;
    columnName: string | null;
  };

  const tableMap = new Map<string, SchemaTableContract>();
  for (const row of columnRows as ColumnRow[]) {
    const table = tableMap.get(row.tableName) ?? {
      name: row.tableName,
      columns: [],
      indexes: [],
    };
    table.columns.push({
      name: row.columnName,
      type: normalizeMySqlType(row.columnType),
      nullable: row.isNullable === "YES",
      autoIncrement: row.extra.toLowerCase().includes("auto_increment"),
    });
    tableMap.set(row.tableName, table);
  }

  const indexMap = new Map<string, SchemaIndexContract>();
  for (const row of indexRows as IndexRow[]) {
    const key = `${row.tableName}\0${row.indexName}`;
    const index = indexMap.get(key) ?? {
      name: row.indexName,
      unique: mysqlNonUniqueToUnique(row.nonUnique),
      columns: [],
    };
    if (row.columnName) index.columns.push(row.columnName);
    indexMap.set(key, index);
  }
  for (const [key, index] of indexMap) {
    const tableName = key.slice(0, key.indexOf("\0"));
    tableMap.get(tableName)?.indexes.push(index);
  }

  const tables = [...tableMap.values()]
    .map(table => ({
      ...table,
      columns: table.columns.sort((a, b) => a.name.localeCompare(b.name)),
      indexes: table.indexes.sort((a, b) => a.name.localeCompare(b.name)),
    }))
    .sort((a, b) => a.name.localeCompare(b.name));
  return { formatVersion: 1, tables };
}

function compareIndex(
  expected: SchemaIndexContract,
  actual: SchemaIndexContract
): string | null {
  if (expected.unique !== actual.unique)
    return `unique=${actual.unique}, expected ${expected.unique}`;
  if (
    expected.columns.length > 0 &&
    expected.columns.join(",") !== actual.columns.join(",")
  ) {
    return `columns=${actual.columns.join(",")}, expected ${expected.columns.join(",")}`;
  }
  return null;
}

export function diffSchemaContracts(
  expected: SchemaContract,
  actual: SchemaContract
): ContractDiff {
  const errors: string[] = [];
  const warnings: string[] = [];
  const actualTables = new Map(actual.tables.map(table => [table.name, table]));
  const expectedTables = new Map(
    expected.tables.map(table => [table.name, table])
  );

  for (const expectedTable of expected.tables) {
    const actualTable = actualTables.get(expectedTable.name);
    if (!actualTable) {
      errors.push(`Missing table: ${expectedTable.name}`);
      continue;
    }
    const actualColumns = new Map(
      actualTable.columns.map(column => [column.name, column])
    );
    const expectedColumns = new Set(
      expectedTable.columns.map(column => column.name)
    );
    for (const expectedColumn of expectedTable.columns) {
      const actualColumn = actualColumns.get(expectedColumn.name);
      const label = `${expectedTable.name}.${expectedColumn.name}`;
      if (!actualColumn) {
        errors.push(`Missing column: ${label}`);
        continue;
      }
      if (expectedColumn.type !== actualColumn.type) {
        errors.push(
          `Column type drift: ${label} is ${actualColumn.type}, expected ${expectedColumn.type}`
        );
      }
      if (expectedColumn.nullable !== actualColumn.nullable) {
        errors.push(
          `Column nullability drift: ${label} nullable=${actualColumn.nullable}, expected ${expectedColumn.nullable}`
        );
      }
      if (expectedColumn.autoIncrement !== actualColumn.autoIncrement) {
        errors.push(
          `Column auto-increment drift: ${label} is ${actualColumn.autoIncrement}, expected ${expectedColumn.autoIncrement}`
        );
      }
    }
    for (const actualColumn of actualTable.columns) {
      if (!expectedColumns.has(actualColumn.name))
        warnings.push(
          `Unexpected column: ${expectedTable.name}.${actualColumn.name}`
        );
    }

    const actualIndexes = new Map(
      actualTable.indexes.map(index => [index.name, index])
    );
    const matchedActualIndexes = new Set<string>();
    for (const expectedIndex of expectedTable.indexes) {
      const actualIndex = actualIndexes.get(expectedIndex.name);
      if (actualIndex) {
        matchedActualIndexes.add(actualIndex.name);
        const mismatch = compareIndex(expectedIndex, actualIndex);
        if (mismatch)
          errors.push(
            `Index drift: ${expectedTable.name}.${expectedIndex.name} ${mismatch}`
          );
        continue;
      }

      // MySQL/Drizzle may assign a different name to an equivalent implicit
      // unique index (for example, column.unique() versus an explicit index).
      // The safety contract is the uniqueness and ordered column set, not the
      // cosmetic identifier chosen for that index.
      const equivalentIndex = actualTable.indexes.find(
        index =>
          !matchedActualIndexes.has(index.name) &&
          compareIndex(expectedIndex, index) === null
      );
      if (!equivalentIndex) {
        errors.push(
          `Missing index: ${expectedTable.name}.${expectedIndex.name}`
        );
        continue;
      }
      matchedActualIndexes.add(equivalentIndex.name);
    }
    for (const actualIndex of actualTable.indexes) {
      if (!matchedActualIndexes.has(actualIndex.name))
        warnings.push(
          `Unexpected index: ${expectedTable.name}.${actualIndex.name}`
        );
    }
  }

  for (const actualTable of actual.tables) {
    if (
      !expectedTables.has(actualTable.name) &&
      ![LEDGER_TABLE, "__drizzle_migrations"].includes(actualTable.name)
    ) {
      warnings.push(`Unexpected table: ${actualTable.name}`);
    }
  }
  return { errors, warnings };
}

/**
 * Compares immutable baseline contracts without compatibility aliases. Unlike
 * diffSchemaContracts, equivalent index definitions under a different name and
 * every unexpected table remain fatal strict verification failures.
 */
export function diffExactSchemaContracts(
  expected: SchemaContract,
  actual: SchemaContract
): ContractDiff {
  const diff = diffSchemaContracts(expected, actual);
  const errors = [...diff.errors];
  const warnings: string[] = [];
  for (const warning of diff.warnings) {
    if (warning.startsWith("Unexpected column:")) {
      errors.push(warning.replace("Unexpected column:", "Unexpected exact column:"));
    }
  }
  const expectedTables = new Map(expected.tables.map(table => [table.name, table]));
  const actualTables = new Map(actual.tables.map(table => [table.name, table]));

  for (const expectedTable of expected.tables) {
    const actualTable = actualTables.get(expectedTable.name);
    if (!actualTable) continue;
    const actualIndexes = new Map(actualTable.indexes.map(index => [index.name, index]));
    const expectedIndexes = new Set(expectedTable.indexes.map(index => index.name));
    for (const expectedIndex of expectedTable.indexes) {
      const actualIndex = actualIndexes.get(expectedIndex.name);
      if (!actualIndex) {
        errors.push(`Missing exact index: ${expectedTable.name}.${expectedIndex.name}`);
        continue;
      }
      const mismatch = compareIndex(expectedIndex, actualIndex);
      if (mismatch) {
        errors.push(`Exact index drift: ${expectedTable.name}.${expectedIndex.name} ${mismatch}`);
      }
    }
    for (const actualIndex of actualTable.indexes) {
      if (!expectedIndexes.has(actualIndex.name)) {
        errors.push(`Unexpected exact index: ${expectedTable.name}.${actualIndex.name}`);
      }
    }
  }
  for (const actualTable of actual.tables) {
    if (
      !expectedTables.has(actualTable.name) &&
      ![LEDGER_TABLE, "__drizzle_migrations"].includes(actualTable.name)
    ) {
      errors.push(`Unexpected exact table: ${actualTable.name}`);
    }
  }
  return {
    errors: [...new Set(errors)],
    warnings: [...new Set(warnings)],
  };
}

/**
 * Downgrade only explicitly declared, checksum-validated, forward-only schema
 * changes to warnings. All other contract errors remain blocking.
 */
export function downgradeProposedMissingIndexErrors(
  diff: ContractDiff,
  manifest: MigrationManifest
): ContractDiff {
  const proposedIndexes = new Map<string, ForwardMigration>();
  const proposedColumnTypes = new Map<
    string,
    { migration: ForwardMigration; baselineType: string; targetType: string }
  >();
  for (const migration of manifest.migrations) {
    if (!migration.proposedOnly) continue;
    for (const index of migration.verifierAllowMissingIndexes ?? []) {
      proposedIndexes.set(`${index.table}.${index.index}`, migration);
    }
    for (const column of migration.verifierAllowPendingColumnTypes ?? []) {
      proposedColumnTypes.set(`${column.table}.${column.column}`, {
        migration,
        baselineType: normalizeMySqlType(column.baselineType),
        targetType: normalizeMySqlType(column.targetType),
      });
    }
  }

  const errors: string[] = [];
  const warnings = [...diff.warnings];
  for (const error of diff.errors) {
    const indexMatch = /^Missing index: ([^.]+)\.(.+)$/.exec(error);
    const indexMigration = indexMatch
      ? proposedIndexes.get(`${indexMatch[1]}.${indexMatch[2]}`)
      : undefined;
    const typeMatch =
      /^Column type drift: ([^.]+)\.([^ ]+) is (.+), expected (.+)$/.exec(
        error
      );
    const allowedType = typeMatch
      ? proposedColumnTypes.get(`${typeMatch[1]}.${typeMatch[2]}`)
      : undefined;
    const typeMigration =
      typeMatch &&
      allowedType &&
      normalizeMySqlType(typeMatch[3]) === allowedType.baselineType &&
      normalizeMySqlType(typeMatch[4]) === allowedType.targetType
        ? allowedType.migration
        : undefined;
    const migration = indexMigration ?? typeMigration;
    if (!migration) {
      errors.push(error);
      continue;
    }
    warnings.push(
      `Pending proposed migration ${migration.version} (${migration.tag}): ${error}`
    );
  }
  return { errors, warnings };
}

export function planForwardMigrations(
  manifest: MigrationManifest,
  rows: LedgerRow[]
): ForwardMigration[] {
  const baseline = rows.find(row => row.version === manifest.baseline.version);
  if (!baseline || baseline.status !== "applied") {
    throw new Error(
      `Baseline ${manifest.baseline.version} has not been adopted.`
    );
  }
  if (baseline.tag !== manifest.baseline.tag) {
    throw new Error(
      `Baseline ${manifest.baseline.version} tag does not match the manifest.`
    );
  }
  for (const row of rows) {
    if (row.status !== "applied")
      throw new Error(
        `Migration ${row.version} is ${row.status}; manual recovery is required.`
      );
    if (row.version < manifest.baseline.version) {
      throw new Error(
        `Forward ledger contains unexpected pre-baseline version ${row.version}.`
      );
    }
    if (row.version === manifest.baseline.version) continue;
    const declared = manifest.migrations.find(
      migration => migration.version === row.version
    );
    if (!declared)
      throw new Error(
        `Database contains unknown migration version ${row.version}.`
      );
    if (declared.sha256 !== row.checksum)
      throw new Error(
        `Applied migration ${row.version} checksum does not match the manifest.`
      );
    if (declared.tag !== row.tag) {
      throw new Error(
        `Applied migration ${row.version} tag does not match the manifest.`
      );
    }
  }
  const applied = new Set(
    rows.filter(row => row.status === "applied").map(row => row.version)
  );
  let foundPending = false;
  for (const migration of manifest.migrations) {
    if (!applied.has(migration.version)) foundPending = true;
    if (
      foundPending &&
      applied.has(migration.version) &&
      !migration.standaloneApply
    ) {
      throw new Error(
        `Applied migration ${migration.version} appears after a gap in the forward ledger.`
      );
    }
  }
  return manifest.migrations.filter(
    migration => !applied.has(migration.version)
  );
}

/**
 * Resolve a single manifest migration for the deliberately separate
 * backup-gated application flow. This is intentionally unavailable for
 * unapproved, destructive, unknown, or already-ledgered migrations.
 */
export function planApprovedStandaloneMigration(
  manifest: MigrationManifest,
  rows: LedgerRow[],
  targetTag: string
): ForwardMigration {
  planForwardMigrations(manifest, rows);
  const migration = manifest.migrations.find(
    candidate => candidate.tag === targetTag
  );
  if (!migration) {
    throw new Error(`Unknown standalone migration target: ${targetTag}.`);
  }
  if (!migration.standaloneApply) {
    throw new Error(
      `Migration ${migration.version} (${migration.tag}) is not approved for standalone application.`
    );
  }
  if (rows.some(row => row.version === migration.version)) {
    throw new Error(
      `Migration ${migration.version} (${migration.tag}) is already present in the migration ledger.`
    );
  }
  return migration;
}

export function resolveRepoPath(relativePath: string): string {
  return path.resolve(REPO_ROOT, relativePath);
}
