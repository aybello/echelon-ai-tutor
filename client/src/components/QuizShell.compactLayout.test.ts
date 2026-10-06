import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const source = readFileSync(resolve(process.cwd(), "client/src/components/QuizShell.tsx"), "utf8");

describe("QuizShell compact workspace layout", () => {
  it("wraps module controls while keeping mode controls compact", () => {
    expect(source).toContain(".qs-module-pills-row { flex-wrap: wrap !important; overflow-x: visible !important;");
    expect(source).toContain(".qs-module-pills-row { display: flex !important; gap: 5px !important; overflow-x: visible !important; flex-wrap: wrap !important;");
    expect(source).toContain(".qs-mode-bar-wrap { flex-wrap: nowrap !important; overflow-x: auto !important;");
    expect(source).toContain(".qs-mode-card-desc { display: none; }");
    expect(source).toContain(".qs-header-actions { display: none !important; }");
    expect(source).toContain(".qs-course-subtitle { display: none !important; }");
  });
});
