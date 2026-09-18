import { describe, expect, it } from "vitest";
import { databasePoolOptions } from "./databaseTls";

const externalUrl = "mysql://user:password@db.example.com:25060/echelon?ssl-mode=REQUIRED";
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
    });
    expect(options.ssl).toMatchObject({
      ca: "-----BEGIN CERTIFICATE-----\ncertificate-body\n-----END CERTIFICATE-----\n",
    });
    expect(options).not.toHaveProperty("uri");
  });

  it("fails closed when certificate-verified TLS is incomplete", () => {
    expect(() => databasePoolOptions("mysql://user:pass@db.example.com/echelon", {
      requireTls: true,
      caCertificate: certificate,
    })).toThrow(/must request TLS/);
    expect(() => databasePoolOptions(externalUrl, { requireTls: true })).toThrow(/DATABASE_SSL_CA/);
  });

  it("retains the current managed-database connection behavior until cutover", () => {
    const options = databasePoolOptions("mysql://user:pass@managed.example.com/echelon?ssl=true");
    expect(options).toMatchObject({ uri: "mysql://user:pass@managed.example.com/echelon?ssl=true" });
    expect(options.ssl).toBeUndefined();
  });
});
