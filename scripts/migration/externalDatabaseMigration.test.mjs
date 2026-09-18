import assert from "node:assert/strict";
import test from "node:test";
import {
  allColumnsOrder,
  digestRows,
  mysqlClientDefaults,
  parseMySqlUrl,
  quoteIdentifier,
  sortedTableNames,
} from "../lib/externalDatabaseMigration.mjs";

test("external target configuration requires TLS and a PEM CA", () => {
  assert.throws(
    () => parseMySqlUrl("mysql://user:pass@example.com:25060/echelon", { requireTls: true }),
    /require TLS/
  );
  assert.throws(
    () => parseMySqlUrl("mysql://user:pass@example.com:25060/echelon?ssl-mode=REQUIRED", { requireTls: true }),
    /PEM CA/
  );
  const config = parseMySqlUrl(
    "mysql://user:pass@example.com:25060/echelon?ssl-mode=REQUIRED",
    { caCertificate: "-----BEGIN CERTIFICATE-----\nvalid\n-----END CERTIFICATE-----", requireTls: true }
  );
  assert.equal(config.host, "example.com");
  assert.equal(config.port, 25060);
  assert.equal(config.database, "echelon");
  assert.equal(config.ssl.rejectUnauthorized, true);
});

test("external MySQL client defaults pin certificate verification", () => {
  const defaults = mysqlClientDefaults(
    "mysql://user:pass@example.com:25060/echelon?ssl-mode=REQUIRED",
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

test("row digests are stable across object-key ordering", () => {
  const left = [{ b: 2, a: 1 }, { a: 3, b: null }];
  const right = [{ a: 1, b: 2 }, { b: null, a: 3 }];
  assert.equal(digestRows(left), digestRows(right));
});
