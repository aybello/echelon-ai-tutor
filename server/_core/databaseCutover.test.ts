import { describe, expect, it } from "vitest";
import {
  DATABASE_CUTOVER_FREEZE_VALUE,
  DATABASE_CUTOVER_MODE_ENV,
  cutoverStatusChallenge,
  databaseCutoverWriteFreeze,
  databaseWritesFrozen,
} from "./databaseCutover";

function request(method: string, path = "/") {
  return { method, path } as any;
}

function response() {
  const values: Record<string, string> = {};
  let statusCode: number | undefined;
  let body: unknown;
  return {
    values,
    get statusCode() { return statusCode; },
    get body() { return body; },
    set(key: string, value: string) { values[key] = value; return this; },
    status(code: number) { statusCode = code; return this; },
    json(value: unknown) { body = value; return this; },
  };
}

describe("database cutover write freeze", () => {
  it("recognizes only the explicit freeze mode", () => {
    expect(databaseWritesFrozen({ [DATABASE_CUTOVER_MODE_ENV]: DATABASE_CUTOVER_FREEZE_VALUE })).toBe(true);
    expect(databaseWritesFrozen({ [DATABASE_CUTOVER_MODE_ENV]: "preview" })).toBe(false);
    expect(databaseWritesFrozen({})).toBe(false);
  });

  it("accepts only UUID-shaped status challenges", () => {
    expect(cutoverStatusChallenge("550e8400-e29b-41d4-a716-446655440000")).toBe("550e8400-e29b-41d4-a716-446655440000");
    expect(cutoverStatusChallenge("not-a-challenge")).toBeNull();
    expect(cutoverStatusChallenge("x".repeat(10_000))).toBeNull();
    expect(cutoverStatusChallenge(["550e8400-e29b-41d4-a716-446655440000"])).toBeNull();
  });

  it("allows only explicit read-only checks while frozen", () => {
    const previous = process.env[DATABASE_CUTOVER_MODE_ENV];
    process.env[DATABASE_CUTOVER_MODE_ENV] = DATABASE_CUTOVER_FREEZE_VALUE;
    const middleware = databaseCutoverWriteFreeze();

    try {
      const readResponse = response();
      let readNext = false;
      middleware(request("GET", "/api/cutover/status"), readResponse as any, () => { readNext = true; });
      expect(readNext).toBe(true);
      expect(readResponse.statusCode).toBeUndefined();

      const trailingStatusResponse = response();
      let trailingStatusNext = false;
      middleware(request("GET", "/api/cutover/status/"), trailingStatusResponse as any, () => { trailingStatusNext = true; });
      expect(trailingStatusNext).toBe(true);

      const healthResponse = response();
      let healthNext = false;
      middleware(request("HEAD", "/api/health"), healthResponse as any, () => { healthNext = true; });
      expect(healthNext).toBe(true);

      const writeResponse = response();
      let writeNext = false;
      middleware(request("POST"), writeResponse as any, () => { writeNext = true; });
      expect(writeNext).toBe(false);
      expect(writeResponse.statusCode).toBe(503);
      expect(writeResponse.values["Retry-After"]).toBe("300");
      expect(writeResponse.body).toMatchObject({ code: "DATABASE_CUTOVER_WRITE_FREEZE" });

      const legacyGetResponse = response();
      let legacyGetNext = false;
      middleware(request("GET", "/api/unsubscribe-reminder"), legacyGetResponse as any, () => { legacyGetNext = true; });
      expect(legacyGetNext).toBe(false);
      expect(legacyGetResponse.statusCode).toBe(503);

      const oauthGetResponse = response();
      let oauthGetNext = false;
      middleware(request("GET", "/api/oauth/callback"), oauthGetResponse as any, () => { oauthGetNext = true; });
      expect(oauthGetNext).toBe(false);
      expect(oauthGetResponse.statusCode).toBe(503);
    } finally {
      if (previous === undefined) delete process.env[DATABASE_CUTOVER_MODE_ENV];
      else process.env[DATABASE_CUTOVER_MODE_ENV] = previous;
    }
  });
});
