import { describe, expect, it } from "vitest";
import { buildDataExplorerCsv, escapeDataExplorerCsvCell } from "./dataExplorerCsv";

describe("Data Explorer CSV export", () => {
  it.each(["=SUM(1,1)", "+1+1", "-1+1", "@SUM(A1:A2)", "  =1+1", "\t=1+1"])(
    "neutralizes spreadsheet formula input beginning with %p",
    value => {
      expect(escapeDataExplorerCsvCell(value)).toContain(`'${value}`);
    },
  );

  it("escapes delimiters and quotes after neutralizing formula input", () => {
    expect(escapeDataExplorerCsvCell('=HYPERLINK("https://example.test")'))
      .toBe("\"'=HYPERLINK(\"\"https://example.test\"\")\"");
  });

  it("builds a bounded page export with protected spreadsheet cells", () => {
    expect(buildDataExplorerCsv([{ name: "Example", comment: "=1+1" }]))
      .toBe("name,comment\nExample,'=1+1");
  });
});
