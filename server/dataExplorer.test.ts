import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { getTableColumns, getTableName, isTable } from "drizzle-orm";
import { describe, expect, it, vi } from "vitest";
import * as schema from "../drizzle/schema";
import { adminRouter } from "./routers/admin";
import {
  DATA_EXPLORER_DATASETS,
  buildDataExplorerStatements,
  formatDataExplorerValue,
  getDataExplorerColumnClassification,
  getDataExplorerDataset,
  isDataExplorerProtectedColumn,
  publicDataExplorerCatalog,
  readDataExplorerPage,
} from "./dataExplorer";
import { DATA_EXPLORER_COLUMN_CLASSIFICATIONS } from "./dataExplorerColumns";

function createCaller(role: "admin" | "user" | null) {
  return adminRouter.createCaller({
    req: {} as never,
    res: {} as never,
    user: role ? { id: 1, role } as never : null,
    studentEmail: null,
  });
}

describe("admin Data Explorer catalog", () => {
  it("classifies every schema table and every schema column explicitly", () => {
    const schemaTables = Object.values(schema)
      .filter(isTable)
      .map(table => ({
        tableName: getTableName(table as any),
        columns: Object.values(getTableColumns(table as any)).map((column: any) => column.name).sort(),
      }));
    const schemaTableByName = new Map(schemaTables.map(table => [table.tableName, table]));

    expect(new Set(DATA_EXPLORER_DATASETS.map(dataset => dataset.tableName)).size)
      .toBe(DATA_EXPLORER_DATASETS.length);
    expect([...DATA_EXPLORER_DATASETS.map(dataset => dataset.tableName)].sort())
      .toEqual([...schemaTableByName.keys()].sort());
    expect(Object.keys(DATA_EXPLORER_COLUMN_CLASSIFICATIONS).sort())
      .toEqual(DATA_EXPLORER_DATASETS.map(dataset => dataset.key).sort());

    for (const dataset of DATA_EXPLORER_DATASETS) {
      const classification = getDataExplorerColumnClassification(dataset);
      const expected = schemaTableByName.get(dataset.tableName);
      expect(expected, `${dataset.key} must map to a Drizzle table`).toBeDefined();
      const classifiedColumns = [...classification.readable, ...classification.restricted].sort();
      expect(new Set(classifiedColumns).size, `${dataset.key} must not classify a column twice`)
        .toBe(classifiedColumns.length);
      expect(classifiedColumns, `${dataset.key} must classify every current schema column`)
        .toEqual(expected!.columns);
      expect(classification.readable).toContain(dataset.orderBy);
    }
  });

  it("omits every protected schema column from every generated statement", () => {
    for (const dataset of DATA_EXPLORER_DATASETS) {
      const classification = getDataExplorerColumnClassification(dataset);
      const statements = buildDataExplorerStatements(dataset, 0, 5_000);
      expect(statements.visibleColumns).toEqual([...classification.readable]);
      expect(statements.rowsSql).toContain(`FROM \`${dataset.tableName}\``);
      expect(statements.rowsSql).toContain("LIMIT 100 OFFSET 0");
      expect(statements.rowsSql).not.toMatch(/\b(?:SHOW\s+COLUMNS|INSERT|UPDATE|DELETE|DROP|ALTER)\b/i);
      for (const restrictedColumn of classification.restricted) {
        expect(statements.visibleColumns).not.toContain(restrictedColumn);
        expect(statements.rowsSql).not.toContain(`\`${restrictedColumn}\``);
      }
    }

    for (const dataset of DATA_EXPLORER_DATASETS) {
      const classification = getDataExplorerColumnClassification(dataset);
      for (const protectedColumn of [...classification.readable, ...classification.restricted]) {
        if (isDataExplorerProtectedColumn(protectedColumn)) {
          expect(classification.restricted, `${dataset.key}.${protectedColumn} must be restricted`)
            .toContain(protectedColumn);
        }
      }
    }

    const implementation = readFileSync(resolve(process.cwd(), "server/dataExplorer.ts"), "utf8");
    expect(implementation).not.toContain("SHOW COLUMNS");
  });

  it("redacts sensitive nested values and formats unusual runtime values safely", () => {
    const nested = formatDataExplorerValue({
      metadata: {
        stripePaymentIntentId: "provider-value",
        token: "token-value",
        allowed: "shown",
      },
    });
    expect(nested).toContain('"stripePaymentIntentId":"[redacted]"');
    expect(nested).toContain('"token":"[redacted]"');
    expect(nested).toContain('"allowed":"shown"');
    expect(formatDataExplorerValue('{"authorization":"value","other":1}'))
      .toContain('"authorization":"[redacted]"');
    expect(formatDataExplorerValue("provider returned pi_1234567890abcdef and token=secret-value"))
      .toBe("provider returned [redacted] and [redacted]");
    expect(formatDataExplorerValue('{"otherwise":"pi_1234567890abcdef"}'))
      .toContain('"otherwise":"[redacted]"');
    expect(formatDataExplorerValue(12n)).toBe("12");
    expect(formatDataExplorerValue(undefined)).toBeNull();
  });

  it.each(["acct", "ch", "cs", "cus", "evt", "in", "pi", "pm", "price", "prod", "re", "seti", "sub", "tok"])(
    "redacts the %s provider identifier family from plain text and neutral-key JSON",
    prefix => {
      const identifier = `${prefix}_exampleprovideridentifier`;
      expect(formatDataExplorerValue(`record=${identifier}`)).not.toContain(identifier);
      expect(formatDataExplorerValue(JSON.stringify({ neutral: identifier }))).not.toContain(identifier);
    },
  );

  it("executes catalog-backed pages through typed Drizzle SQL and serializes only allowlisted columns", async () => {
    const execute = vi.fn()
      .mockResolvedValueOnce([[{ total: "1" }]])
      .mockResolvedValueOnce([[{
        id: 1,
        email: "learner@example.test",
        stripePaymentIntentId: "provider-identifier",
      }]]);
    const dataset = getDataExplorerDataset("purchases");
    expect(dataset).not.toBeNull();

    const page = await readDataExplorerPage({ execute } as never, dataset!, 1, 25);

    expect(execute).toHaveBeenCalledTimes(2);
    expect(execute.mock.calls[0][0]).toHaveProperty("getSQL");
    expect(page.rows[0]).toMatchObject({ id: 1, email: "learner@example.test" });
    expect(page.rows[0]).not.toHaveProperty("stripePaymentIntentId");
  });

  it("fails closed for unknown datasets and enforces admin-only access", async () => {
    expect(getDataExplorerDataset("purchases; DROP TABLE users")).toBeNull();
    await expect(createCaller(null).getDataExplorerCatalog())
      .rejects.toMatchObject({ code: "FORBIDDEN" });
    await expect(createCaller("user").getDataExplorerCatalog())
      .rejects.toMatchObject({ code: "FORBIDDEN" });
    await expect(createCaller(null).getDataExplorerPage({ datasetKey: "purchases", page: 1, pageSize: 25 }))
      .rejects.toMatchObject({ code: "FORBIDDEN" });
    await expect(createCaller("user").getDataExplorerPage({ datasetKey: "purchases", page: 1, pageSize: 25 }))
      .rejects.toMatchObject({ code: "FORBIDDEN" });

    const adminCaller = createCaller("admin");
    await expect(adminCaller.getDataExplorerPage({ datasetKey: "not-a-dataset", page: 1, pageSize: 25 }))
      .rejects.toMatchObject({ code: "BAD_REQUEST" });
    await expect(adminCaller.getDataExplorerPage({ datasetKey: "purchases", page: 0, pageSize: 25 }))
      .rejects.toMatchObject({ code: "BAD_REQUEST" });
    await expect(adminCaller.getDataExplorerPage({ datasetKey: "purchases", page: 1, pageSize: 101 }))
      .rejects.toMatchObject({ code: "BAD_REQUEST" });
  });

  it("publishes only the static restricted columns for each dataset", () => {
    const catalog = publicDataExplorerCatalog();
    expect(catalog.find(dataset => dataset.key === "magic-links")?.restrictedColumns)
      .toContain("tokenHash");
    expect(catalog.find(dataset => dataset.key === "purchases")?.restrictedColumns)
      .toEqual(expect.arrayContaining(["stripeSessionId", "stripePaymentIntentId"]));
    expect(catalog.find(dataset => dataset.key === "purchase-email-outbox")?.restrictedColumns)
      .toEqual(expect.arrayContaining(["payload", "leaseToken"]));
    expect(catalog.find(dataset => dataset.key === "trigger-logs")?.restrictedColumns)
      .toEqual(expect.arrayContaining(["emailSubject", "emailBodyPreview"]));
  });
});
