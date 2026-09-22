/**
 * Prevent spreadsheet applications from interpreting untrusted database values
 * as formulas when an administrator opens a Data Explorer export.
 */
export function escapeDataExplorerCsvCell(value: unknown): string {
  let text = String(value ?? "");
  if (/^[\t\r\n ]*[=+\-@]/.test(text)) text = `'${text}`;
  return text.includes(",") || text.includes('"') || text.includes("\n")
    ? `"${text.replace(/"/g, '""')}"`
    : text;
}

export function buildDataExplorerCsv(rows: Record<string, unknown>[]): string {
  if (!rows.length) return "";
  const headers = Object.keys(rows[0]);
  return [
    headers.map(escapeDataExplorerCsvCell).join(","),
    ...rows.map(row => headers.map(header => escapeDataExplorerCsvCell(row[header])).join(",")),
  ].join("\n");
}
