import { describe, expect, it } from "vitest";
import { activeDatabaseSettings } from "./db";

describe("active database settings", () => {
  it("keeps the current database unless the explicit cutover flag is enabled", () => {
    expect(activeDatabaseSettings({ DATABASE_URL: "mysql://user:pass@current.example/echelon" } as NodeJS.ProcessEnv)).toMatchObject({
      connectionString: "mysql://user:pass@current.example/echelon",
      label: "current database",
      requireTls: false,
    });
  });

  it("requires a protected CA and a designated final database when external routing is enabled", () => {
    expect(() => activeDatabaseSettings({
      DATABASE_CUTOVER_USE_EXTERNAL_TARGET: "true",
      EXTERNAL_DATABASE_URL: "mysql://user:pass@external.example/echelon",
    } as NodeJS.ProcessEnv)).toThrow(/protected URL and CA certificate/);

    expect(() => activeDatabaseSettings({
      DATABASE_CUTOVER_USE_EXTERNAL_TARGET: "true",
      EXTERNAL_DATABASE_URL: "mysql://user:pass@external.example/echelon",
      EXTERNAL_DATABASE_CA: "-----BEGIN CERTIFICATE-----\nvalid\n-----END CERTIFICATE-----",
    } as NodeJS.ProcessEnv)).toThrow(/designated final database name/);

    expect(activeDatabaseSettings({
      DATABASE_CUTOVER_USE_EXTERNAL_TARGET: "true",
      DATABASE_URL: "mysql://user:pass@current.example/echelon",
      EXTERNAL_DATABASE_URL: "mysql://user:pass@external.example/echelon",
      EXTERNAL_DATABASE_CA: "-----BEGIN CERTIFICATE-----\nvalid\n-----END CERTIFICATE-----",
      DATABASE_CUTOVER_TARGET_DATABASE: "echelon_cutover_final",
    } as NodeJS.ProcessEnv)).toMatchObject({
      connectionString: "mysql://user:pass@external.example/echelon_cutover_final",
      caCertificate: "-----BEGIN CERTIFICATE-----\nvalid\n-----END CERTIFICATE-----",
      label: "external MySQL",
      requireTls: true,
    });
  });
});
