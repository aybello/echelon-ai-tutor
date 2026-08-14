import { readFile } from "node:fs/promises";
import { describe, expect, it } from "vitest";
import {
  buildExpectedSchemaContract,
  diffSchemaContracts,
  findDestructiveSql,
  loadManifest,
  loadSchemaContract,
  normalizeMySqlType,
  planForwardMigrations,
  resolveRepoPath,
  sha256,
  stableContractJson,
  splitMigrationStatements,
  validateManifest,
  type MigrationManifest,
  type SchemaContract,
} from "../scripts/db/migrationSafety";

describe("forward-only migration safety", () => {
  it("keeps the committed manifest valid and complete", async () => {
    const manifest = await loadManifest();
    await expect(validateManifest(manifest)).resolves.toEqual([]);
    expect(manifest.baseline.version).toBe(52);
    const baseline = await loadSchemaContract(manifest.baseline.contract);
    const baselineRaw = await readFile(
      resolveRepoPath(manifest.baseline.contract),
      "utf8"
    );
    expect(sha256(baselineRaw)).toBe(manifest.baseline.sha256);
    if (manifest.migrations.length === 0) {
      expect(stableContractJson(buildExpectedSchemaContract())).toBe(
        stableContractJson(baseline)
      );
    }
  });

  it("builds a current schema contract containing the deployed activation tables", () => {
    const contract = buildExpectedSchemaContract();
    const tables = new Map(contract.tables.map(table => [table.name, table]));
    expect(tables.has("learner_onboarding")).toBe(true);
    expect(tables.has("diagnostic_sessions")).toBe(true);
    expect(
      tables
        .get("team_flex_orders")
        ?.columns.some(column => column.name === "totalPaidCents")
    ).toBe(true);
  });

  it("detects destructive SQL unless a manifest explicitly allows it", () => {
    expect(
      findDestructiveSql(
        "ALTER TABLE users DROP COLUMN legacy;\nTRUNCATE audit_log;"
      )
    ).toEqual(["DROP COLUMN", "TRUNCATE"]);
    expect(
      findDestructiveSql(
        "-- DROP TABLE users\nALTER TABLE users ADD COLUMN safe int;"
      )
    ).toEqual([]);
    expect(
      findDestructiveSql("ALTER TABLE users DROP INDEX email_idx;")
    ).toEqual(["DROP INDEX OR KEY"]);
  });

  it("normalizes legacy integer widths without corrupting tinyint types", () => {
    expect(normalizeMySqlType("int(11)")).toBe("int");
    expect(normalizeMySqlType("bigint(20)")).toBe("bigint");
    expect(normalizeMySqlType("tinyint(1)")).toBe("tinyint(1)");
    expect(normalizeMySqlType("boolean")).toBe("tinyint(1)");
  });

  it("splits only at explicit Drizzle statement boundaries", () => {
    expect(
      splitMigrationStatements(
        "CREATE TABLE a (id int);\n--> statement-breakpoint\nALTER TABLE a ADD name text;"
      )
    ).toEqual(["CREATE TABLE a (id int);", "ALTER TABLE a ADD name text;"]);
  });

  it("reports missing and incompatible schema objects", () => {
    const expected: SchemaContract = {
      formatVersion: 1,
      tables: [
        {
          name: "orders",
          columns: [
            { name: "id", type: "int", nullable: false, autoIncrement: true },
          ],
          indexes: [{ name: "PRIMARY", unique: true, columns: ["id"] }],
        },
      ],
    };
    const actual: SchemaContract = {
      formatVersion: 1,
      tables: [
        {
          name: "orders",
          columns: [
            {
              name: "id",
              type: "bigint",
              nullable: true,
              autoIncrement: false,
            },
          ],
          indexes: [],
        },
      ],
    };
    const diff = diffSchemaContracts(expected, actual);
    expect(diff.errors).toEqual(
      expect.arrayContaining([
        expect.stringContaining("Column type drift"),
        expect.stringContaining("Column nullability drift"),
        expect.stringContaining("Column auto-increment drift"),
        expect.stringContaining("Missing index"),
      ])
    );
  });

  it("accepts equivalent index definitions with different MySQL names", () => {
    const expected: SchemaContract = {
      formatVersion: 1,
      tables: [
        {
          name: "diagnostic_sessions",
          columns: [],
          indexes: [
            {
              name: "diagnostic_sessions_sessionId_unique",
              unique: true,
              columns: ["sessionId"],
            },
          ],
        },
      ],
    };
    const actual: SchemaContract = {
      formatVersion: 1,
      tables: [
        {
          name: "diagnostic_sessions",
          columns: [],
          indexes: [
            {
              name: "diagnostic_sessions_session_idx",
              unique: true,
              columns: ["sessionId"],
            },
          ],
        },
      ],
    };

    expect(diffSchemaContracts(expected, actual)).toEqual({
      errors: [],
      warnings: [],
    });
  });

  it("refuses modified checksums and failed ledger states", () => {
    const migrationSql = "ALTER TABLE orders ADD COLUMN reference varchar(64);";
    const manifest: MigrationManifest = {
      formatVersion: 1,
      baseline: {
        version: 52,
        tag: "0052_activation_outcomes",
        contract: "unused",
        sha256: "unused",
      },
      migrations: [
        {
          version: 53,
          tag: "0053_order_reference",
          file: "drizzle/0053_order_reference.sql",
          sha256: sha256(migrationSql),
        },
      ],
    };
    expect(
      planForwardMigrations(manifest, [
        {
          version: 52,
          tag: "0052_activation_outcomes",
          checksum: "baseline",
          status: "applied",
        },
      ])
    ).toHaveLength(1);
    expect(() =>
      planForwardMigrations(manifest, [
        {
          version: 52,
          tag: "0052_activation_outcomes",
          checksum: "baseline",
          status: "applied",
        },
        {
          version: 53,
          tag: "0053_order_reference",
          checksum: "modified",
          status: "applied",
        },
      ])
    ).toThrow(/checksum/);
    expect(() =>
      planForwardMigrations(manifest, [
        {
          version: 52,
          tag: "0052_activation_outcomes",
          checksum: "baseline",
          status: "applied",
        },
        {
          version: 53,
          tag: "0053_order_reference",
          checksum: sha256(migrationSql),
          status: "failed",
        },
      ])
    ).toThrow(/manual recovery/);
  });

  it("refuses out-of-order applied migrations", () => {
    const manifest: MigrationManifest = {
      formatVersion: 1,
      baseline: {
        version: 52,
        tag: "0052_activation_outcomes",
        contract: "unused",
        sha256: "unused",
      },
      migrations: [
        {
          version: 53,
          tag: "0053_first",
          file: "drizzle/0053_first.sql",
          sha256: "first",
        },
        {
          version: 54,
          tag: "0054_second",
          file: "drizzle/0054_second.sql",
          sha256: "second",
        },
      ],
    };
    expect(() =>
      planForwardMigrations(manifest, [
        {
          version: 52,
          tag: "0052_activation_outcomes",
          checksum: "baseline",
          status: "applied",
        },
        {
          version: 54,
          tag: "0054_second",
          checksum: "second",
          status: "applied",
        },
      ])
    ).toThrow(/after a gap/);
  });
});
