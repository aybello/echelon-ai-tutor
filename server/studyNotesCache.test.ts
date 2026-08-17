import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const questionBankHook = readFileSync(
  resolve(process.cwd(), "client/src/hooks/useQuestionBank.ts"),
  "utf8",
);
const quizShell = readFileSync(
  resolve(process.cwd(), "client/src/components/QuizShell.tsx"),
  "utf8",
);

describe("study-note delivery", () => {
  it("refreshes study notes even when a learner has a cached question bank", () => {
    expect(questionBankHook).toContain(
      "Notes are maintained independently from questions. Always refresh them:",
    );
    expect(questionBankHook).toContain("enabled: true,");
    expect(questionBankHook).toContain(
      "overviews = (overviewsQuery.data as Record<string, ModuleOverview> | null) ?? cached.overviews;",
    );
  });

  it("retries a notes deep link when the live overview payload arrives", () => {
    const notesEffect = quizShell.slice(
      quizShell.indexOf("// Course-workspace deep links"),
      quizShell.indexOf("const toggleBookmarkMutation"),
    );

    expect(notesEffect).toContain("}, [currentPath, moduleOverviews, selectedModule]);");
    expect(notesEffect).not.toContain("Study notes are being prepared for this course.");
  });
});
