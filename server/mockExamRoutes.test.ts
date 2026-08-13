import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const mockExamReturnRoutes = [
  ["Class1WastewaterMockExam.tsx", "/class1-ww"],
  ["Class2WaterMockExam.tsx", "/class2-water"],
  ["Class2WastewaterMockExam.tsx", "/class2-ww"],
  ["Class3WaterMockExam.tsx", "/class3-water"],
  ["Class3WastewaterMockExam.tsx", "/class3-ww"],
  ["Class4WaterMockExam.tsx", "/class4-water"],
  ["Class4WastewaterMockExam.tsx", "/class4-ww"],
] as const;

const registeredCourseRoutes = new Set([
  "/class1-ww",
  "/class2-water",
  "/class2-ww",
  "/class3-water",
  "/class3-ww",
  "/class4-water",
  "/class4-ww",
]);

describe("Ontario mock-exam purchase-gate return routes", () => {
  it("uses a registered course route for every repaired gate", () => {
    expect(mockExamReturnRoutes.every(([, route]) => registeredCourseRoutes.has(route))).toBe(true);
  });

  it("configures each affected page to return to its valid practice course", () => {
    for (const [filename, route] of mockExamReturnRoutes) {
      const source = readFileSync(resolve(process.cwd(), "client/src/pages", filename), "utf8");
      expect(source).toContain(`backPath="${route}"`);
      expect(source).not.toContain('backPath="/ontario"');
    }
  });
});
