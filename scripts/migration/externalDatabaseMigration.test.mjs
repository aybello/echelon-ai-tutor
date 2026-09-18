import assert from "node:assert/strict";
import test from "node:test";
import { createHash } from "node:crypto";
import {
  allColumnsOrder,
  digestRows,
  mysqlClientDefaults,
  parseMySqlUrl,
  quoteIdentifier,
  sortedTableNames,
  updateRowsDigest,
} from "../lib/externalDatabaseMigration.mjs";

test("database URLs fail closed for missing or invalid TLS", () => {
  assert.throws(
    () => parseMySqlUrl("mysql://user:pass@example.com:25060/echelon?ssl-mode=DISABLED"),
    /unsupported ssl-mode/
  );
  assert.throws(
    () => parseMySqlUrl("mysql://user:pass@example.com:25060/echelon", { requireTls: true }),
    /require TLS/
  );
  const config = parseMySqlUrl(
    "mysql://user:pass@example.com:25060/echelon?ssl-mode=VERIFY_IDENTITY",
    { caCertificate: "-----BEGIN CERTIFICATE-----\nvalid\n-----END CERTIFICATE-----", requireTls: true }
  );
  assert.equal(config.host, "example.com");
  assert.equal(config.port, 25060);
  assert.equal(config.database, "echelon");
  assert.equal(config.ssl.rejectUnauthorized, true);
  assert.match(config.ssl.ca, /BEGIN CERTIFICATE/);
  assert.equal(config.dateStrings, true);
  assert.equal(config.bigNumberStrings, true);
});

test("source URLs encoded with strict ssl JSON are certificate verified", () => {
  const config = parseMySqlUrl(
    "mysql://user:pass@source.example.com:4000/echelon?ssl=%7B%22rejectUnauthorized%22%3Atrue%7D",
    { requireTls: true }
  );
  assert.equal(config.ssl.rejectUnauthorized, true);
});

test("mixed-case ssl=true URLs remain certificate verified", () => {
  const config = parseMySqlUrl(
    "mysql://user:pass@source.example.com:4000/echelon?ssl=TrUe",
    { requireTls: true }
  );
  assert.equal(config.ssl.rejectUnauthorized, true);
});

test("external MySQL client defaults pin certificate verification", () => {
  const defaults = mysqlClientDefaults(
    "mysql://user:pass@example.com:25060/echelon?ssl-mode=VERIFY_IDENTITY",
    { caPath: "/private/ca.crt", requireTls: true }
  );
  assert.match(defaults, /^ssl-mode=VERIFY_CA$/m);
  assert.match(defaults, /^ssl-ca=\/private\/ca\.crt$/m);
  assert.doesNotMatch(defaults, /ssl-mode=DISABLED/);
});

test("clone helpers reject unsafe identifiers and generate stable table ordering", () => {
  assert.throws(() => quoteIdentifier("users; DROP TABLE users"), /only letters/);
  assert.deepEqual(sortedTableNames(["zebra", "alpha"]), ["alpha", "zebra"]);
  assert.equal(allColumnsOrder(["id", "createdAt"]), "`id`, `createdAt`");
});

test("row digests are stable across object-key ordering and incremental pages", () => {
  const left = [{ b: 2, a: 1 }, { a: 3, b: null }];
  const right = [{ a: 1, b: 2 }, { b: null, a: 3 }];
  assert.equal(digestRows(left), digestRows(right));

  const incremental = updateRowsDigest(
    updateRowsDigest(createHash("sha256"), [left[0]]),
    [left[1]]
  ).digest("hex");
  assert.equal(incremental, digestRows(left));
});
