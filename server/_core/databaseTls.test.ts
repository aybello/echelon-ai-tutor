import { describe, expect, it } from "vitest";
import { databasePoolOptions } from "./databaseTls";

const externalUrl = "mysql://user:password@db.example.com:25060/echelon?ssl-mode=VERIFY_IDENTITY";
const certificate = "-----BEGIN CERTIFICATE-----\\ncertificate-body\\n-----END CERTIFICATE-----";

describe("databasePoolOptions", () => {
  it("creates a certificate-verified TLS pool for an external MySQL URL", () => {
    const options = databasePoolOptions(externalUrl, {
      caCertificate: certificate,
      requireTls: true,
    });

    expect(options).toMatchObject({
      host: "db.example.com",
      port: 25060,
      user: "user",
      password: "password",
      database: "echelon",
      ssl: {
        rejectUnauthorized: true,
      },
      dateStrings: true,
      bigNumberStrings: true,
    });
    expect(options.ssl).toMatchObject({
      ca: "-----BEGIN CERTIFICATE-----\ncertificate-body\n-----END CERTIFICATE-----\n",
    });
    expect(options).not.toHaveProperty("uri");
  });

  it("fails closed for unencrypted remote URLs, incomplete verification, and unsupported parameters", () => {
    expect(() => databasePoolOptions("mysql://user:pass@db.example.com/echelon")).toThrow(/must request TLS/);
    expect(() => databasePoolOptions(externalUrl, { requireTls: true })).toThrow(/DATABASE_SSL_CA/);
    expect(() => databasePoolOptions(`${externalUrl}&timezone=Z`, { caCertificate: certificate })).toThrow(/unsupported query/);
    expect(() => databasePoolOptions("not-a-url")).toThrow(/invalid/);
  });

  it("supports the current platform TLS URL without weakening verification", () => {
    const options = databasePoolOptions(
      "mysql://user:pass@managed.example.com:4000/echelon?ssl=%7B%22rejectUnauthorized%22%3Atrue%7D"
    );
    expect(options.ssl).toMatchObject({ rejectUnauthorized: true });
    expect(options).not.toHaveProperty("uri");
  });
});
