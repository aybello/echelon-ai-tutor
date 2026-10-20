import { readFileSync, readdirSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const pagesDir = resolve(process.cwd(), "client/src/pages");
const mockFiles = readdirSync(pagesDir)
  .filter(filename => filename.endsWith("MockExam.tsx"))
  .sort();
const shellSource = readFileSync(
  resolve(process.cwd(), "client/src/components/MockExamShell.tsx"),
  "utf8"
);
const electricianRouterSource = readFileSync(
  resolve(process.cwd(), "server/routers/electricianReviewRouter.ts"),
  "utf8"
);

function sourceFor(filename: string) {
  return readFileSync(resolve(pagesDir, filename), "utf8");
}

describe("mock exam presentation integrity", () => {
  it("keeps answer keys and explanations out of every mock page before a signed submission", () => {
    expect(mockFiles.length).toBe(40);
    expect(shellSource).not.toMatch(/\bquestionPool\b/);

    for (const filename of mockFiles) {
      const source = sourceFor(filename);
      expect(
        source,
        `${filename} must not request the key-bearing practice question endpoint`
      ).not.toMatch(/\buseQuestionBank\s*\(/);
      expect(
        source,
        `${filename} must not request the key-bearing 309A practice endpoint`
      ).not.toMatch(/\buseElectrician309ABank\s*\(/);
      expect(
        source,
        `${filename} must not pass a browser question pool to the mock shell`
      ).not.toMatch(/\bquestionPool\s*=/);
      expect(
        source,
        `${filename} must not map answer keys into browser mock data`
      ).not.toMatch(
        /\bcorrect\s*:\s*q\.(?:correctIndex|correct|correctAnswer)/
      );
      expect(
        source,
        `${filename} must not map explanations into browser mock data`
      ).not.toMatch(/\bexplanation\s*:\s*q\.explanation/);
    }

    expect(electricianRouterSource).toContain("get309ABetaMetadata");
    expect(electricianRouterSource).toContain(".select({ total: count() })");
    expect(electricianRouterSource).not.toContain(
      "get309ABetaMetadata: publicProcedure.query(async ({ ctx"
    );
    const metadataProcedure = electricianRouterSource
      .split("get309ABetaMetadata:")[1]
      ?.split("get309ABetaPractice:")[0];
    expect(metadataProcedure).toBeDefined();
    expect(metadataProcedure).not.toMatch(
      /certificationQuestions\.(?:question|options|correctIndex|explanation|steps|tip)/
    );
  });

  it("does not advertise a two-hour timer for mock exams issued with the standard three-hour duration", () => {
    for (const filename of mockFiles) {
      const source = sourceFor(filename);
      expect(
        source,
        `${filename} must not describe a two-hour timer when the server issues three hours`
      ).not.toMatch(/2-hour timer/i);
    }
  });
});
