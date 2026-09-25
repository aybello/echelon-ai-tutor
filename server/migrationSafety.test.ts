import { readFile } from "node:fs/promises";
import { describe, expect, it } from "vitest";
import {
  buildExpectedSchemaContract,
  downgradeProposedMissingIndexErrors,
  diffExactSchemaContracts,
  diffSchemaContracts,
  findDestructiveSql,
  loadManifest,
  loadSchemaContract,
  mysqlNonUniqueToUnique,
  normalizeMySqlType,
  planApprovedStandaloneMigration,
  planForwardMigrations,
  resolveRepoPath,
  selectAdoptableForwardMigrations,
  sha256,
  stableContractJson,
  splitMigrationStatements,
  validateBaselineEmbeddedMigration,
  validateManifest,
  type MigrationManifest,
  type SchemaContract,
} from "../scripts/db/migrationSafety";
import {
  assertDisposableResetTarget,
  createdTablesFromMigrationSql,
  postBaselineTables,
} from "../scripts/db/resetForwardMigrationRehearsal";

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
        baselineEmbedded: true,
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
        tag: "0057_add_analytics_anonymous_hash",
        proposedOnly: true,
      }),
      expect.objectContaining({
        version: 58,
        tag: "0058_job_source_association",
        proposedOnly: true,
      }),
      expect.objectContaining({
        version: 59,
        tag: "0059_on_the_job_training_records",
        proposedOnly: true,
      }),
      expect.objectContaining({
        version: 60,
        tag: "0060_training_hours_records",
        proposedOnly: true,
      }),
      expect.objectContaining({
        version: 61,
        tag: "0061_correct_oit_guide",
        proposedOnly: true,
      }),
      expect.objectContaining({
        version: 62,
        tag: "0062_purchase_email_outbox",
        proposedOnly: true,
        standaloneApply: { tables: ["purchase_email_outbox"] },
      }),
      expect.objectContaining({
        version: 63,
        tag: "0063_question_content_snapshots",
        proposedOnly: true,
        standaloneApply: { tables: ["question_content_snapshots"] },
      }),
      expect.objectContaining({ version: 64, tag: "0064_flashcard_progress_operations", proposedOnly: true,
        standaloneApply: { tables: ["flashcard_progress_state", "flashcard_progress_operations"] } }),
      expect.objectContaining({ version: 65, tag: "0065_scheduled_work", proposedOnly: true, standaloneApply: { tables: ["scheduled_work"] } }),
      expect.objectContaining({ version: 66, tag: "0066_exam_dates_unique", proposedOnly: true, standaloneApply: { tables: ["exam_dates"] } }),
      expect.objectContaining({ version: 67, tag: "0067_customer_recovery_evidence", proposedOnly: true, standaloneApply: { tables: ["customer_recovery_evidence"] } }),
      expect.objectContaining({ version: 68, tag: "0068_customer_recovery_classification", proposedOnly: true }),
      expect.objectContaining({ version: 69, tag: "0069_team_flex_extension_verified_email", proposedOnly: true, standaloneApply: { tables: ["team_flex_extensions"] } }),
      expect.objectContaining({ version: 70, tag: "0070_organization_recovery_audit", proposedOnly: true, standaloneApply: { tables: ["customer_recovery_batches", "customer_recovery_import_items"] } }),
      expect.objectContaining({ version: 71, tag: "0071_organization_recovery_importer_hardening", proposedOnly: true, standaloneApply: expect.objectContaining({ tables: ["customer_recovery_batches", "customer_recovery_import_items"], requireEmptyTables: ["customer_recovery_batches", "customer_recovery_import_items"] }) }),
      expect.objectContaining({ version: 72, tag: "0072_ceu_learning_records", proposedOnly: true, standaloneApply: { tables: ["ceu_learning_records", "ceu_learning_daily_time"] } }),
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
    expect(baseline.tables.find(table => table.name === "questions")).toMatchObject({
      columns: expect.arrayContaining([
        { name: "sourceTitle", type: "varchar(255)", nullable: true, autoIncrement: false },
        { name: "sourceReference", type: "varchar(512)", nullable: true, autoIncrement: false },
        { name: "sourceUrl", type: "varchar(1024)", nullable: true, autoIncrement: false },
        { name: "blueprintObjective", type: "varchar(255)", nullable: true, autoIncrement: false },
        { name: "reviewStatus", type: "enum('unreviewed','in_review','approved','rejected')", nullable: false, autoIncrement: false },
        { name: "reviewedBy", type: "varchar(320)", nullable: true, autoIncrement: false },
        { name: "reviewedAt", type: "timestamp", nullable: true, autoIncrement: false },
      ]),
      indexes: expect.arrayContaining([
        { name: "question_review_status_idx", unique: false, columns: ["reviewStatus"] },
        { name: "question_bank_review_status_idx", unique: false, columns: ["bankKey", "reviewStatus"] },
      ]),
    });
    if (manifest.migrations.length === 0) {
      expect(stableContractJson(buildExpectedSchemaContract())).toBe(
        stableContractJson(baseline)
      );
    }
  });

  it("permits later current-schema adoption declarations outside exact-baseline replay", async () => {
    const manifest = await loadManifest();
    const unsafeManifest = structuredClone(manifest);
    const laterMigration = unsafeManifest.migrations.find(
      entry => entry.version === 54
    );
    if (!laterMigration) throw new Error("Missing migration 54 test fixture.");
    delete laterMigration.proposedOnly;
    laterMigration.adoptIfCurrentSchemaMatches = true;

    await expect(validateManifest(unsafeManifest)).resolves.toEqual([]);
  });

  it("leaves later current-schema-adoptable migrations pending from an exact baseline", () => {
    const prefix: MigrationManifest["migrations"] = [
      {
        version: 53,
        tag: "0053_embedded",
        file: "drizzle/0053_embedded.sql",
        sha256: "a".repeat(64),
        adoptIfCurrentSchemaMatches: true,
        baselineEmbedded: true,
      },
      {
        version: 54,
        tag: "0054_current_schema_only",
        file: "drizzle/0054_current_schema_only.sql",
        sha256: "b".repeat(64),
        adoptIfCurrentSchemaMatches: true,
      },
    ];

    expect(
      selectAdoptableForwardMigrations(true, prefix).map(entry => entry.version)
    ).toEqual([53]);
    expect(
      selectAdoptableForwardMigrations(false, prefix).map(entry => entry.version)
    ).toEqual([53, 54]);
  });

  it("builds a current schema contract containing the deployed activation tables", () => {
    const contract = buildExpectedSchemaContract();
    const tables = new Map(contract.tables.map(table => [table.name, table]));
    expect(tables.has("learner_onboarding")).toBe(true);
    expect(tables.has("diagnostic_sessions")).toBe(true);
    expect(tables.has("learning_activity_sessions")).toBe(true);
    expect(tables.has("training_attestations")).toBe(true);
    expect(tables.get("training_attestations")?.columns).toEqual(expect.arrayContaining([
      { name: "snapshotJson", type: "mediumtext", nullable: false, autoIncrement: false },
      { name: "platformRecordedSeconds", type: "int", nullable: false, autoIncrement: false },
      { name: "supervisorReviewSeconds", type: "int", nullable: false, autoIncrement: false },
    ]));
    expect(
      tables
        .get("team_flex_orders")
        ?.columns.some(column => column.name === "totalPaidCents")
    ).toBe(true);
  });

  it("resets all declared forward objects and verifies an exact baseline before CI adoption", async () => {
    const workflow = await readFile(resolveRepoPath(".github/workflows/quality.yml"), "utf8");
    const resetHelper = await readFile(
      resolveRepoPath("scripts/db/resetForwardMigrationRehearsal.ts"),
      "utf8"
    );
    const baselineRehearsals = [
      ...workflow.matchAll(
        /REHEARSAL_RESET_APPROVED=RESET_DISPOSABLE_REHEARSAL\s+\\\s*\n\s+DATABASE_URL=mysql:\/\/root:root@127\.0\.0\.1:3306\/(echelon_(?:upgrade|standalone)_ci)\s+\\\s*\n\s+pnpm db:reset-forward-rehearsal[\s\S]*?pnpm db:migrate:verify-baseline[\s\S]*?pnpm db:migrate:adopt/g
      ),
    ];
    expect(baselineRehearsals.map(match => match[1])).toEqual([
      "echelon_upgrade_ci",
      "echelon_standalone_ci",
    ]);
    const manifest = await loadManifest();
    expect(resetHelper).toContain("Refusing reset outside an approved disposable rehearsal database");
    expect(resetHelper).toContain("migration.version <= manifest.baseline.version");
    expect(resetHelper).toContain("createdTablesFromMigrationSql(sql)");
    expect(resetHelper).toContain("splitMigrationStatements(sql)");
    expect(resetHelper).toContain("DROP TABLE IF EXISTS ${tables.map");
    expect(resetHelper).toContain("purchaserUserId int NOT NULL");
    expect(resetHelper).toContain("SET FOREIGN_KEY_CHECKS=0");
    expect(resetHelper).toContain("SET FOREIGN_KEY_CHECKS=1");
    expect(manifest.migrations.some(entry => entry.proposedOnly)).toBe(true);
  });

  it("limits reset helpers to explicitly approved loopback rehearsal targets", async () => {
    const previousApproval = process.env.REHEARSAL_RESET_APPROVED;
    process.env.REHEARSAL_RESET_APPROVED = "RESET_DISPOSABLE_REHEARSAL";
    try {
      expect(() =>
        assertDisposableResetTarget("mysql://user:pass@127.0.0.1:3306/echelon_upgrade_ci")
      ).not.toThrow();
      expect(() =>
        assertDisposableResetTarget("mysql://user:pass@example.com:3306/echelon_upgrade_ci")
      ).toThrow("loopback MySQL host");
      expect(() =>
        assertDisposableResetTarget("mysql://user:pass@127.0.0.1:3306/echelon_production")
      ).toThrow("approved disposable rehearsal database");
    } finally {
      if (previousApproval === undefined) delete process.env.REHEARSAL_RESET_APPROVED;
      else process.env.REHEARSAL_RESET_APPROVED = previousApproval;
    }

    await expect(postBaselineTables()).resolves.toEqual(expect.arrayContaining([
      "customer_recovery_batches",
      "customer_recovery_import_items",
      "purchase_email_outbox",
    ]));
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

  it("proves every 0053 schema addition is already represented in baseline 52", async () => {
    const manifest = await loadManifest();
    const baseline = await loadSchemaContract(manifest.baseline.contract);
    const migration = manifest.migrations.find(entry => entry.version === 53);
    expect(migration?.baselineEmbedded).toBe(true);
    const sql = await readFile(resolveRepoPath(migration?.file ?? ""), "utf8");
    expect(
      validateBaselineEmbeddedMigration(
        sql,
        baseline,
        migration?.file ?? "missing migration"
      )
    ).toEqual([]);
  });

  it("refuses to mark an embedded migration when an added baseline object differs", () => {
    const contract: SchemaContract = {
      formatVersion: 1,
      tables: [
        {
          name: "questions",
          columns: [
            { name: "sourceTitle", type: "varchar(64)", nullable: true, autoIncrement: false },
          ],
          indexes: [],
        },
      ],
    };
    expect(
      validateBaselineEmbeddedMigration(
        "ALTER TABLE questions ADD COLUMN sourceTitle varchar(255);",
        contract,
        "drizzle/0053_question_governance.sql"
      )
    ).toEqual([
      "drizzle/0053_question_governance.sql baseline column type does not match questions.sourceTitle.",
    ]);
  });

  it("refuses unrecognized clauses in an embedded migration", () => {
    const contract: SchemaContract = {
      formatVersion: 1,
      tables: [
        {
          name: "questions",
          columns: [
            { name: "sourceTitle", type: "varchar(255)", nullable: true, autoIncrement: false },
          ],
          indexes: [],
        },
      ],
    };
    expect(
      validateBaselineEmbeddedMigration(
        "ALTER TABLE questions ADD COLUMN sourceTitle varchar(255), MODIFY COLUMN id bigint NOT NULL;",
        contract,
        "drizzle/0053_question_governance.sql"
      )
    ).toEqual([
      "drizzle/0053_question_governance.sql contains an unrecognized baselineEmbedded ALTER clause: MODIFY COLUMN id bigint NOT NULL.",
    ]);
  });

  it("refuses unmodelled embedded column attributes outside the pinned 0053 default", () => {
    const contract: SchemaContract = {
      formatVersion: 1,
      tables: [
        {
          name: "questions",
          columns: [
            { name: "sourceTitle", type: "varchar(255)", nullable: true, autoIncrement: false },
          ],
          indexes: [],
        },
      ],
    };
    expect(
      validateBaselineEmbeddedMigration(
        "ALTER TABLE questions ADD COLUMN sourceTitle varchar(255) DEFAULT 'unexpected';",
        contract,
        "drizzle/0053_question_governance.sql"
      )
    ).toEqual([
      "drizzle/0053_question_governance.sql contains unmodelled column attributes on questions.sourceTitle: DEFAULT 'unexpected'.",
    ]);
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
    expect(tables.get("exam_dates")?.indexes).toContainEqual({
      name: "exam_dates_email_product_unique", unique: true, columns: ["email", "productKey"],
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
    expect(diffExactSchemaContracts(expected, actual)).toEqual({
      errors: [
        "Missing exact index: diagnostic_sessions.diagnostic_sessions_sessionId_unique",
        "Unexpected exact index: diagnostic_sessions.diagnostic_sessions_session_idx",
      ],
      warnings: [],
    });
  });

  it("excludes only recognized migration metadata from strict baseline table drift", () => {
    const expected: SchemaContract = { formatVersion: 1, tables: [] };
    const actual: SchemaContract = {
      formatVersion: 1,
      tables: [
        { name: "echelon_schema_migrations", columns: [], indexes: [] },
        { name: "__drizzle_migrations", columns: [], indexes: [] },
        { name: "unrecognized_artifact", columns: [], indexes: [] },
      ],
    };
    expect(diffExactSchemaContracts(expected, actual)).toEqual({
      errors: ["Unexpected exact table: unrecognized_artifact"],
      warnings: [],
    });
  });

  it("treats a post-baseline column as an exact baseline error", () => {
    const expected: SchemaContract = {
      formatVersion: 1,
      tables: [{ name: "orders", columns: [], indexes: [] }],
    };
    const actual: SchemaContract = {
      formatVersion: 1,
      tables: [
        {
          name: "orders",
          columns: [
            {
              name: "unexpected_forward_column",
              type: "int",
              nullable: true,
              autoIncrement: false,
            },
          ],
          indexes: [],
        },
      ],
    };

    expect(diffExactSchemaContracts(expected, actual)).toEqual({
      errors: ["Unexpected exact column: orders.unexpected_forward_column"],
      warnings: [],
    });
  });

  it("keeps 0069 pending until forward replay changes purchaserUserId to nullable", async () => {
    const manifest = await loadManifest();
    const baseline = await loadSchemaContract(manifest.baseline.contract);
    const migration = manifest.migrations.find(entry => entry.version === 69);
    const baselineColumn = baseline.tables
      .find(table => table.name === "team_flex_extensions")
      ?.columns.find(column => column.name === "purchaserUserId");
    const targetColumn = buildExpectedSchemaContract().tables
      .find(table => table.name === "team_flex_extensions")
      ?.columns.find(column => column.name === "purchaserUserId");
    const sql = await readFile(resolveRepoPath(migration?.file ?? ""), "utf8");

    expect(migration?.proposedOnly).toBe(true);
    expect(migration?.baselineEmbedded).toBeUndefined();
    expect(baselineColumn).toMatchObject({ type: "int", nullable: false });
    expect(targetColumn).toMatchObject({ type: "int", nullable: true });
    const statements = splitMigrationStatements(sql);
    expect(statements).toHaveLength(1);
    expect(statements[0]).toContain(
      "MODIFY COLUMN `purchaserUserId` int NULL"
    );
  });

  it("keeps a genuine verifier blocker fatal while downgrading only declared proposed indexes", async () => {
    const manifest = await loadManifest();
    const diff = downgradeProposedMissingIndexErrors({
      errors: [
        "Missing index: stripe_event_log.stripe_event_log_status_idx",
        "Column type drift: job_postings.sourceType is enum('rss','scraper'), expected enum('rss','scraper','association')",
        "Column type drift: subscriptions.tier is varchar(32), expected enum('class1','class2','class3','class4','all-access')",
      ],
      warnings: [],
    }, manifest);

    expect(diff.errors).toEqual([
      "Column type drift: subscriptions.tier is varchar(32), expected enum('class1','class2','class3','class4','all-access')",
    ]);
    expect(diff.warnings).toEqual([
      expect.stringContaining("Pending proposed migration 54"),
      expect.stringContaining("Pending proposed migration 58"),
    ]);
  });

  it("does not excuse an undeclared or reversed column type change", async () => {
    const manifest = await loadManifest();
    const diff = downgradeProposedMissingIndexErrors(
      {
        errors: [
          "Column type drift: job_postings.sourceType is varchar(64), expected enum('rss','scraper','association')",
          "Column type drift: job_postings.sourceType is enum('rss','scraper','association'), expected enum('rss','scraper')",
          "Column nullability drift: team_flex_extensions.purchaserUserId nullable=false, expected true",
        ],
        warnings: [],
      },
      manifest
    );

    expect(diff.errors).toHaveLength(3);
    expect(diff.warnings).toEqual([]);
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

  it("permits only the explicitly declared additive outbox migration to be applied across a pending gap", async () => {
    const manifest = await loadManifest();
    const rows = [
      {
        version: 52,
        tag: "0052_activation_outcomes",
        checksum: manifest.baseline.sha256,
        status: "applied" as const,
      },
      ...manifest.migrations
        .filter(migration => migration.version <= 58)
        .map(migration => ({
          version: migration.version,
          tag: migration.tag,
          checksum: migration.sha256,
          status: "applied" as const,
        })),
    ];

    expect(
      planApprovedStandaloneMigration(
        manifest,
        rows,
        "0062_purchase_email_outbox"
      )
    ).toMatchObject({
      version: 62,
      standaloneApply: { tables: ["purchase_email_outbox"] },
    });
    expect(() =>
      planApprovedStandaloneMigration(
        manifest,
        rows,
        "0059_on_the_job_training_records"
      )
    ).toThrow(/not approved for standalone/);
    expect(() =>
      planApprovedStandaloneMigration(manifest, rows, "0063_unknown")
    ).toThrow(/Unknown standalone migration target/);
  });

  it("keeps generic forward planning safe after the explicitly allowed standalone migration is ledgered", async () => {
    const manifest = await loadManifest();
    const rows = [
      {
        version: 52,
        tag: "0052_activation_outcomes",
        checksum: manifest.baseline.sha256,
        status: "applied" as const,
      },
      ...manifest.migrations
        .filter(migration => migration.version <= 58 || migration.version === 62)
        .map(migration => ({
          version: migration.version,
          tag: migration.tag,
          checksum: migration.sha256,
          status: "applied" as const,
        })),
    ];

    expect(
      planForwardMigrations(manifest, rows).map(migration => migration.version)
    ).toEqual([59, 60, 61, 63, 64, 65, 66, 67, 68, 69, 70, 71, 72]);
  });
});


describe("migration statement execution", () => {
  it("parses every migration declared in the manifest", async () => {
    const manifest = await loadManifest();
    for (const migration of manifest.migrations) {
      const sql = await readFile(resolveRepoPath(migration.file), "utf8");
      expect(() => splitMigrationStatements(sql)).not.toThrow();
      expect(splitMigrationStatements(sql)).not.toHaveLength(0);
    }
  });

  it("delivers each table as one separately executable statement", async () => {
    const statements = splitMigrationStatements(await readFile("drizzle/0064_flashcard_progress_operations.sql", "utf8"));
    expect(statements).toHaveLength(2);
    for (const statement of statements) expect(statement.match(/CREATE TABLE/g)).toHaveLength(1);
  });

  it("splits the recovery audit migration even without Drizzle delimiters", async () => {
    const statements = splitMigrationStatements(
      await readFile("drizzle/0070_organization_recovery_audit.sql", "utf8")
    );
    expect(statements).toHaveLength(2);
    expect(statements[0]).toContain("customer_recovery_batches");
    expect(statements[1]).toContain("customer_recovery_import_items");
    for (const statement of statements) {
      expect(statement.match(/CREATE TABLE/g)).toHaveLength(1);
    }
  });

  it("splits the follow-up recovery hardening migration into both ALTER statements", async () => {
    const statements = splitMigrationStatements(
      await readFile("drizzle/0071_organization_recovery_importer_hardening.sql", "utf8")
    );
    expect(statements).toHaveLength(2);
    expect(statements[0]).toContain("customer_recovery_batches");
    expect(statements[1]).toContain("customer_recovery_import_items");
    for (const statement of statements) {
      expect(statement.match(/ALTER TABLE/g)).toHaveLength(1);
    }
  });

  it("keeps Drizzle breakpoints as hard boundaries even without a prior semicolon", () => {
    expect(
      splitMigrationStatements(
        "CREATE TABLE first_table (id int)\n--> statement-breakpoint\nCREATE TABLE second_table (id int);"
      )
    ).toEqual([
      "CREATE TABLE first_table (id int)",
      "CREATE TABLE second_table (id int);",
    ]);
  });

  it("does not discard a valid double-hyphen identifier as a comment", () => {
    expect(splitMigrationStatements("--identifier;\nSELECT 2;")).toEqual([
      "--identifier;",
      "SELECT 2;",
    ]);
  });

  it("recognizes statement breakpoints only outside quotes and comments", () => {
    expect(
      splitMigrationStatements(
        "/* comment\n--> statement-breakpoint\n*/\nSELECT 'literal\n--> statement-breakpoint\nvalue';\n--> statement-breakpoint\nSELECT 2;"
      )
    ).toEqual([
      "/* comment\n--> statement-breakpoint\n*/\nSELECT 'literal\n--> statement-breakpoint\nvalue';",
      "SELECT 2;",
    ]);
  });

  it("does not infer rehearsal reset tables from comments or string literals", () => {
    expect(
      createdTablesFromMigrationSql(
        "-- CREATE TABLE comment_target (id int);\nSELECT 'CREATE TABLE literal_target (id int)';\nCREATE TABLE real_target (id int);"
      )
    ).toEqual(["real_target"]);
  });

  it("does not split semicolons inside valid MySQL literals or comments", () => {
    const statements = splitMigrationStatements(
      "-- a comment;\nINSERT INTO `semi;identifier` VALUES ('single;quote', \"double;quote\");\n# another comment;\n/* block; comment */\nUPDATE records SET note = 'done;';"
    );
    expect(statements).toEqual([
      "-- a comment;\nINSERT INTO `semi;identifier` VALUES ('single;quote', \"double;quote\");",
      "# another comment;\n/* block; comment */\nUPDATE records SET note = 'done;';",
    ]);
  });

  it("recognizes MySQL double-hyphen comments only when whitespace follows", () => {
    expect(
      splitMigrationStatements("SELECT 1--not_a_comment; SELECT 2;")
    ).toEqual(["SELECT 1--not_a_comment;", "SELECT 2;"]);
    expect(
      splitMigrationStatements("SELECT 1; -- a real comment;\nSELECT 2;")
    ).toEqual(["SELECT 1;", "-- a real comment;\nSELECT 2;"]);
  });

  it("handles odd and even backslash runs before quotes", () => {
    expect(
      splitMigrationStatements("SELECT 'even\\\\'; SELECT 2;")
    ).toEqual([
      "SELECT 'even\\\\';",
      "SELECT 2;",
    ]);
    expect(
      splitMigrationStatements("SELECT 'odd\\'escaped'; SELECT 3;")
    ).toEqual(["SELECT 'odd\\'escaped';", "SELECT 3;"]);
  });

  it("fails closed on unterminated migration literals and block comments", () => {
    expect(() => splitMigrationStatements("SELECT 'unterminated;")).toThrow(
      "Unterminated quoted string"
    );
    expect(() => splitMigrationStatements("/* unterminated;")).toThrow(
      "Unterminated block comment"
    );
    expect(() => splitMigrationStatements("/*/ SELECT 1;")).toThrow(
      "Unterminated block comment"
    );
  });

  it("fails closed on executable MySQL comments", () => {
    expect(() => splitMigrationStatements("/*!40101 SET @legacy = 1; */")).toThrow(
      "Executable MySQL comments are not supported"
    );
  });
});
