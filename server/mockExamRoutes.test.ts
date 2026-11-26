import { readFileSync, readdirSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { getCourseByKey } from "../shared/courseRegistry";

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
  it("routes every purchase-gate exit surface through practicePath", () => {
    // Asserts the rule rather than a fixed count: adding a legitimate new exit
    // surface should not fail this test, but routing one to anything other than
    // practicePath should.
    const allBackPaths = shellSource.match(/backPath=\{[^}]+\}/g) ?? [];
    expect(allBackPaths.length).toBeGreaterThan(0);
    expect(new Set(allBackPaths)).toEqual(new Set(["backPath={practicePath}"]));
    expect(shellSource).not.toContain("backPath={backPath}");
  });

  it("gives every active mock exam a registered practice return route and keeps inactive courses un-routed", () => {
    expect(mockExamFiles.length).toBeGreaterThan(30);

    for (const filename of mockExamFiles) {
      const source = readFileSync(resolve(pagesDir, filename), "utf8");
      const practicePath = source.match(/practicePath="([^"]+)"/)?.[1];
      const productKey = source.match(/productKey="([^"]+)"/)?.[1];
      const course = productKey ? getCourseByKey(productKey) : undefined;

      expect(practicePath, `${filename} must declare practicePath`).toBeTruthy();
      expect(productKey, `${filename} must declare productKey`).toBeTruthy();
      expect(course, `${filename} productKey ${productKey} must resolve to a governed course`).toBeDefined();
      const shouldBeRegistered = course!.isActive;
      expect(
        registeredRoutes.has(practicePath!),
        shouldBeRegistered
          ? `${filename} practicePath ${practicePath} must be registered in App.tsx`
          : `${filename} belongs to inactive course ${productKey} and must not be registered in App.tsx`,
      ).toBe(shouldBeRegistered);
    }
  });

  it("uses the same practice route for intro, active-exam exit, and results", () => {
    expect(shellSource).toContain('<Link href={practicePath}');
    expect(shellSource).toContain("window.location.href = practicePath");
  });
});
