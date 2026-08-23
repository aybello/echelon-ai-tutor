import { readFile } from "node:fs/promises";
import { describe, expect, it } from "vitest";
import {
  buildExpectedSchemaContract,
  downgradeProposedMissingIndexErrors,
  diffSchemaContracts,
  findDestructiveSql,
  loadManifest,
  loadSchemaContract,
  mysqlNonUniqueToUnique,
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
    expect(manifest.migrations).toEqual([
      expect.objectContaining({
        version: 53,
        tag: "0053_question_governance",
        adoptIfCurrentSchemaMatches: true,
      }),
      expect.objectContaining({
        version: 54,
        tag: "0054_add_stripe_event_log_status_idx",
        proposedOnly: true,
      }),
      expect.objectContaining({
        version: 55,
        tag: "0055_add_team_flex_orders_org_status_idx",
        proposedOnly: true,
      }),
      expect.objectContaining({
        version: 56,
        tag: "0056_certification_bank_governance",
        proposedOnly: true,
      }),
      expect.objectContaining({
        version: 57,
        tag: "0057_governance_and_journey_identity",
        proposedOnly: true,
      }),
    ]);
    const baseline = await loadSchemaContract(manifest.baseline.contract);
    const baselineRaw = await readFile(
      resolveRepoPath(manifest.baseline.contract),
      "utf8"
    );
    expect(sha256(baselineRaw)).toBe(manifest.baseline.sha256);
    expect(baseline.tables.find(table => table.name === "stripe_event_log")?.indexes).not.toContainEqual({
      name: "stripe_event_log_status_idx", unique: false, columns: ["status"],
    });
    expect(baseline.tables.find(table => table.name === "team_flex_orders")?.indexes).not.toContainEqual({
      name: "team_flex_orders_org_status_idx", unique: false, columns: ["organizationId", "status"],
    });
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

  it("exports a metadata-only baseline contract with no data rows or customer values", async () => {
    const manifest = await loadManifest();
    const baseline = await loadSchemaContract(manifest.baseline.contract);
    const serialized = stableContractJson(baseline);

    expect(baseline).toMatchObject({ formatVersion: 1 });
    expect(baseline.tables.every(table => Object.keys(table).every(key => ["name", "columns", "indexes"].includes(key)))).toBe(true);
    expect(serialized).not.toMatch(/"rows"\s*:/);
    expect(serialized).not.toMatch(/"values"\s*:/);
    expect(serialized).not.toMatch(/@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/);
  });

  it("models the reconciled production subscriptions and compatibility columns", () => {
    const tables = new Map(buildExpectedSchemaContract().tables.map(table => [table.name, table]));
    expect(tables.get("subscriptions")?.columns).toEqual(expect.arrayContaining([
      { name: "tier", type: "enum('class1','class2','class3','class4','all-access')", nullable: false, autoIncrement: false },
      { name: "province", type: "enum('ontario','western')", nullable: false, autoIncrement: false },
      { name: "status", type: "enum('active','cancelled','past_due','unpaid','expired')", nullable: false, autoIncrement: false },
      { name: "stripeSubscriptionId", type: "varchar(128)", nullable: false, autoIncrement: false },
      { name: "currentPeriodStart", type: "timestamp", nullable: false, autoIncrement: false },
      { name: "updatedAt", type: "timestamp", nullable: false, autoIncrement: false },
    ]));
    expect(tables.get("organizations")?.columns).toContainEqual({
      name: "stream", type: "varchar(32)", nullable: true, autoIncrement: false,
    });
  });

  it("declares every reconciled production index and both proposed missing indexes", () => {
    const tables = new Map(buildExpectedSchemaContract().tables.map(table => [table.name, table]));
    expect(tables.get("exam_dates")?.indexes).toContainEqual({
      name: "exam_dates_org_member_idx", unique: false, columns: ["orgId", "organizationMemberId", "courseKey", "examDate"],
    });
    expect(tables.get("exam_results")?.indexes).toEqual(expect.arrayContaining([
      { name: "exam_results_session_unique_idx", unique: true, columns: ["sessionId"] },
      { name: "idx_exam_results_user", unique: false, columns: ["userId"] },
    ]));
    expect(tables.get("team_flex_orders")?.indexes).toEqual(expect.arrayContaining([
      { name: "team_flex_orders_org_status_idx", unique: false, columns: ["organizationId", "status"] },
      { name: "idx_flex_orders_org", unique: false, columns: ["organizationId"] },
      { name: "idx_flex_orders_status", unique: false, columns: ["status"] },
      { name: "uk_stripe_pi", unique: true, columns: ["stripePaymentIntentId"] },
    ]));
    expect(tables.get("stripe_event_log")?.indexes).toContainEqual({
      name: "stripe_event_log_status_idx", unique: false, columns: ["status"],
    });
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

  it("prohibits destructive migrations from being adopted from current schema state", async () => {
    const manifest = await loadManifest();
    expect(manifest.migrations.every(migration => !(migration.adoptIfCurrentSchemaMatches && migration.proposedOnly))).toBe(true);
    expect(manifest.migrations.filter(migration => migration.proposedOnly).every(migration => !migration.allowDestructive)).toBe(true);
  });

  it("normalizes legacy integer widths without corrupting tinyint types", () => {
    expect(normalizeMySqlType("int(11)")).toBe("int");
    expect(normalizeMySqlType("bigint(20)")).toBe("bigint");
    expect(normalizeMySqlType("tinyint(1)")).toBe("tinyint(1)");
    expect(normalizeMySqlType("boolean")).toBe("tinyint(1)");
  });

  it("normalizes MySQL NON_UNIQUE values returned as different driver types", () => {
    for (const value of [0, "0", 0n, Buffer.from("0")]) {
      expect(mysqlNonUniqueToUnique(value)).toBe(true);
    }
    for (const value of [1, "1", 1n, Buffer.from("1")]) {
      expect(mysqlNonUniqueToUnique(value)).toBe(false);
    }
  });

  it("fails closed on an unexpected MySQL NON_UNIQUE value", () => {
    for (const value of [2, "yes", null, undefined]) {
      expect(() => mysqlNonUniqueToUnique(value)).toThrow(/NON_UNIQUE/);
    }
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

  it("keeps a genuine verifier blocker fatal while downgrading only declared proposed indexes", async () => {
    const manifest = await loadManifest();
    const diff = downgradeProposedMissingIndexErrors({
      errors: [
        "Missing index: stripe_event_log.stripe_event_log_status_idx",
        "Column type drift: subscriptions.tier is varchar(32), expected enum('class1','class2','class3','class4','all-access')",
      ],
      warnings: [],
    }, manifest);

    expect(diff.errors).toEqual([
      "Column type drift: subscriptions.tier is varchar(32), expected enum('class1','class2','class3','class4','all-access')",
    ]);
    expect(diff.warnings).toEqual([
      expect.stringContaining("Pending proposed migration 54"),
    ]);
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
