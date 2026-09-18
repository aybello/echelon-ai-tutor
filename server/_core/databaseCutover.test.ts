import { describe, expect, it } from "vitest";
import {
  DATABASE_CUTOVER_FREEZE_VALUE,
  DATABASE_CUTOVER_MODE_ENV,
  databaseCutoverWriteFreeze,
  databaseWritesFrozen,
} from "./databaseCutover";

function request(method: string) {
  return { method } as any;
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

  it("allows read checks but rejects all writes while frozen", () => {
    const previous = process.env[DATABASE_CUTOVER_MODE_ENV];
    process.env[DATABASE_CUTOVER_MODE_ENV] = DATABASE_CUTOVER_FREEZE_VALUE;
    const middleware = databaseCutoverWriteFreeze();

    try {
      const readResponse = response();
      let readNext = false;
      middleware(request("GET"), readResponse as any, () => { readNext = true; });
      expect(readNext).toBe(true);
      expect(readResponse.statusCode).toBeUndefined();

      const writeResponse = response();
      let writeNext = false;
      middleware(request("POST"), writeResponse as any, () => { writeNext = true; });
      expect(writeNext).toBe(false);
      expect(writeResponse.statusCode).toBe(503);
      expect(writeResponse.values["Retry-After"]).toBe("300");
      expect(writeResponse.body).toMatchObject({ code: "DATABASE_CUTOVER_WRITE_FREEZE" });
    } finally {
      if (previous === undefined) delete process.env[DATABASE_CUTOVER_MODE_ENV];
      else process.env[DATABASE_CUTOVER_MODE_ENV] = previous;
    }
  });
});
