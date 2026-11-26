import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

describe("repository licence metadata", () => {
  it("does not advertise MIT rights for the source-available product", () => {
    const packageJson = JSON.parse(fs.readFileSync(path.resolve(process.cwd(), "package.json"), "utf8"));
    const notice = fs.readFileSync(path.resolve(process.cwd(), "NOTICE.md"), "utf8");
    expect(packageJson.private).toBe(true);
    expect(packageJson.license).toBe("UNLICENSED");
    const plainNotice = notice.replace(/\*\*/g, "");
    expect(plainNotice).toContain("source-available, not open source");
  });
});
