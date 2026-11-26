import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const quizShell = readFileSync(
  resolve(process.cwd(), "client/src/components/QuizShell.tsx"),
  "utf8",
);

describe("study-note delivery", () => {
  it("retries a notes deep link when the live overview payload arrives", () => {
    const notesEffect = quizShell.slice(
      quizShell.indexOf("// Course-workspace deep links"),
      quizShell.indexOf("const toggleBookmarkMutation"),
    );

    expect(notesEffect).toContain("}, [currentPath, moduleOverviews, selectedModule]);");
    expect(notesEffect).not.toContain("Study notes are being prepared for this course.");
  });
});
