import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const coursePage = readFileSync(
  resolve(import.meta.dirname, "ContinuingEducationCourse.tsx"),
  "utf8",
);

describe("ContinuingEducationCourse assessment boundaries", () => {
  it("locks final assessment responses after the preview result is submitted", () => {
    expect(coursePage).toContain("disabled={examSubmitted}");
  });

  it("keeps the preview-result boundary explicit", () => {
    expect(coursePage).toContain("This result is private to this browser session");
    expect(coursePage).toContain("It does not issue a CEU, credential, certificate");
  });
});
