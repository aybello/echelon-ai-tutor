import { describe, expect, it } from "vitest";
import { jobBoardConnectionOptions } from "./jobBoardDatabase";

const certificate = "-----BEGIN CERTIFICATE-----\ntest\n-----END CERTIFICATE-----";
const external = {
  DATABASE_CUTOVER_USE_EXTERNAL_TARGET: "true",
  DATABASE_CUTOVER_TARGET_DATABASE: "active_app",
  EXTERNAL_DATABASE_URL: "mysql://worker:secret@db.example/staging?ssl-mode=REQUIRED",
  EXTERNAL_DATABASE_CA: certificate,
  DATABASE_URL: "mysql://legacy:legacy@127.0.0.1/legacy",
};

describe("job board active database", () => {
  it("uses the designated active store rather than the legacy DATABASE_URL", () => {
    expect(jobBoardConnectionOptions(external)).toMatchObject({
      host: "db.example",
      database: "active_app",
      user: "worker",
      timezone: "Z",
      ssl: { ca: certificate + "\n", rejectUnauthorized: true },
    });
  });
  it("does not silently fall back if protected external settings are missing", () => {
    expect(() => jobBoardConnectionOptions({ ...external, EXTERNAL_DATABASE_CA: undefined })).toThrow("protected URL and CA");
    expect(() => jobBoardConnectionOptions({ ...external, DATABASE_CUTOVER_TARGET_DATABASE: undefined })).toThrow("final database name");
  });
  it("blocks manual ingestion during a maintenance freeze", () => {
    expect(() => jobBoardConnectionOptions({ ...external, DATABASE_CUTOVER_MODE: "freeze" })).toThrow("maintenance");
  });
  it("retains the ordinary local test target when cutover is off", () => {
    const result = jobBoardConnectionOptions({ DATABASE_URL: "mysql://test:test@localhost/local_test" });
    expect(result).toMatchObject({ host: "localhost", database: "local_test" });
    expect(result.ssl).toBeUndefined();
    expect(result).not.toHaveProperty("connectionLimit");
  });
  it("fails closed for an unconfigured or unverified remote store", () => {
    expect(() => jobBoardConnectionOptions({})).toThrow("not configured");
    expect(() => jobBoardConnectionOptions({ DATABASE_URL: "mysql://test:test@remote.example/db" })).toThrow("must request TLS");
  });
});
