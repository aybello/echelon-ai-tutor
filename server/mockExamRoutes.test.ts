import { readFileSync, readdirSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const pagesDir = resolve(process.cwd(), "client/src/pages");
const shellSource = readFileSync(
  resolve(process.cwd(), "client/src/components/MockExamShell.tsx"),
  "utf8",
);
const appSource = readFileSync(resolve(process.cwd(), "client/src/App.tsx"), "utf8");
const registeredRoutes = new Set(
  Array.from(appSource.matchAll(/path=\{?"([^"]+)"/g), match => match[1]),
);
const mockExamFiles = readdirSync(pagesDir)
  .filter(filename => filename.endsWith("MockExam.tsx"))
  .sort();

describe("mock-exam navigation", () => {
  it("uses practicePath for both purchase-gate exit surfaces", () => {
    expect(shellSource.match(/backPath=\{practicePath\}/g)).toHaveLength(2);
    expect(shellSource).not.toContain("backPath={backPath}");
  });

  it("gives every mock exam a registered practice return route", () => {
    expect(mockExamFiles.length).toBeGreaterThan(30);

    for (const filename of mockExamFiles) {
      const source = readFileSync(resolve(pagesDir, filename), "utf8");
      const practicePath = source.match(/practicePath="([^"]+)"/)?.[1];

      expect(practicePath, `${filename} must declare practicePath`).toBeTruthy();
      expect(
        registeredRoutes.has(practicePath!),
        `${filename} practicePath ${practicePath} must be registered in App.tsx`,
      ).toBe(true);
    }
  });

  it("uses the same practice route for intro, active-exam exit, and results", () => {
    expect(shellSource).toContain('<Link href={practicePath}');
    expect(shellSource).toContain("window.location.href = practicePath");
  });
});
