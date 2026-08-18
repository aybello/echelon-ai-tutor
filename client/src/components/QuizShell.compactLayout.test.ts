import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const source = readFileSync(resolve(process.cwd(), "client/src/components/QuizShell.tsx"), "utf8");

describe("QuizShell compact workspace layout", () => {
  it("keeps module and mode controls in compact horizontal rows", () => {
    expect(source).toContain(".qs-module-pills-row { flex-wrap: nowrap !important; overflow-x: auto !important;");
    expect(source).toContain(".qs-mode-bar-wrap { flex-wrap: nowrap !important; overflow-x: auto !important;");
    expect(source).toContain(".qs-mode-card-desc { display: none; }");
    expect(source).toContain(".qs-header-actions { display: none !important; }");
    expect(source).toContain(".qs-course-subtitle { display: none !important; }");
  });
});
