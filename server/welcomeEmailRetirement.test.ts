import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

function source(path: string): string {
  return readFileSync(resolve(process.cwd(), path), "utf8");
}

describe("retired purchase welcome-email system", () => {
  it("keeps the worker, callback, and obsolete repair path out of the application", () => {
    expect(source("server/_core/index.ts")).not.toContain("/api/scheduled/welcome-email");
    expect(source("drizzle/schema.ts")).not.toContain("welcomeEmailSentAt");
    expect(source("drizzle/README.md")).not.toContain("db:repair-welcome-email-column");
    expect(source("package.json")).not.toContain("db:repair-welcome-email-column");
  });

  it("does not remove the archived historical migration", () => {
    expect(source("drizzle/0028_glossy_lord_hawal.sql")).toContain(
      "ADD `welcomeEmailSentAt` timestamp",
    );
  });
});
