/**
 * Operator licence (certificate) expiry tracking — shared contracts and pure
 * logic used by the manager dashboard, the operator view, the CSV importer,
 * and the daily threshold alert job.
 *
 * A "certificate" here is the operator's provincial regulatory credential
 * (for example an Ontario Class 2 Water Treatment certificate issued under
 * O. Reg. 128/04). It is NOT an Echelon Course Pass: team_flex_licences track
 * Echelon seat access windows and are a separate system.
 */

export interface CertificateTypeDefinition {
  /** Stored value in certificates.certificateType. */
  key: string;
  /** Human-readable label shown in dashboards and emails. */
  label: string;
  /** Echelon course that prepares the operator to renew this certificate. */
  courseKey: string;
}

const CLASS_LEVELS = [1, 2, 3, 4] as const;

function classTypes(
  streamKey: string,
  streamLabel: string,
  courseKeyForLevel: (level: number) => string
): CertificateTypeDefinition[] {
  return CLASS_LEVELS.map(level => ({
    key: `class-${level}-${streamKey}`,
    label: `Class ${level} ${streamLabel}`,
    courseKey: courseKeyForLevel(level),
  }));
}

export const CERTIFICATE_TYPES: CertificateTypeDefinition[] = [
  { key: "oit", label: "Operator-in-Training (OIT)", courseKey: "oit" },
  ...classTypes("water-treatment", "Water Treatment", n => `class${n}-water`),
  ...classTypes(
    "water-distribution",
    "Water Distribution and Supply",
    n => `class${n}-water-dist`
  ),
  ...classTypes(
    "wastewater-treatment",
    "Wastewater Treatment",
    n => `class${n}-ww`
  ),
  ...classTypes(
    "wastewater-collection",
    "Wastewater Collection",
    n => `class${n}-wastewater-coll`
  ),
  {
    key: "water-quality-analyst",
    label: "Water Quality Analyst",
    courseKey: "wqa",
  },
];

const TYPE_BY_KEY = new Map(CERTIFICATE_TYPES.map(t => [t.key, t]));

const LEGACY_TYPE_ALIASES = new Map(
  CLASS_LEVELS.map(level => [
    `class${level}-wastewater`,
    `class-${level}-wastewater-treatment`,
  ])
);

export function certificateTypeByKey(
  key: string
): CertificateTypeDefinition | null {
  return TYPE_BY_KEY.get(key) ?? null;
}

export function isCertificateTypeKey(key: string): boolean {
  return TYPE_BY_KEY.has(key);
}

export function courseKeyForCertificateType(key: string): string | null {
  return TYPE_BY_KEY.get(key)?.courseKey ?? null;
}

export function certificateTypeLabel(key: string): string {
  return TYPE_BY_KEY.get(key)?.label ?? key;
}

function normalizeTypeText(raw: string): string {
  return raw
    .toLowerCase()
    .replace(/[_\s]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

/**
 * Resolves free-text certificate type values (as found in municipal
 * spreadsheets) to a stored certificate type key. Accepts the stored key,
 * the display label, the matching Echelon course key, and the common short
 * forms "OIT" and "WQA". Returns null when nothing matches.
 */
export function resolveCertificateType(raw: string): string | null {
  const normalized = normalizeTypeText(raw.trim());
  if (!normalized) return null;
  if (TYPE_BY_KEY.has(normalized)) return normalized;
  const legacyAlias = LEGACY_TYPE_ALIASES.get(normalized);
  if (legacyAlias) return legacyAlias;
  for (const type of CERTIFICATE_TYPES) {
    if (normalizeTypeText(type.label) === normalized) return type.key;
    if (normalizeTypeText(type.courseKey) === normalized) return type.key;
  }
  if (normalized === "operator-in-training" || normalized === "oit")
    return "oit";
  if (normalized === "wqa" || normalized === "water-quality-analyst")
    return "water-quality-analyst";
  return null;
}

// ── Expiry status ────────────────────────────────────────────────────────────

export type CertificateStatusBand =
  "expired" | "within30" | "within90" | "current";

const DAY_MS = 24 * 60 * 60 * 1000;

/** Whole days from `now` until `expiresAt`, compared on UTC calendar days. */
export function daysUntilExpiry(expiresAt: Date, now: Date): number {
  const start = Date.UTC(
    now.getUTCFullYear(),
    now.getUTCMonth(),
    now.getUTCDate()
  );
  const end = Date.UTC(
    expiresAt.getUTCFullYear(),
    expiresAt.getUTCMonth(),
    expiresAt.getUTCDate()
  );
  return Math.round((end - start) / DAY_MS);
}

export function statusBandForDays(days: number): CertificateStatusBand {
  if (days < 0) return "expired";
  if (days <= 30) return "within30";
  if (days <= 90) return "within90";
  return "current";
}

export function statusBandForExpiry(
  expiresAt: Date,
  now: Date
): CertificateStatusBand {
  return statusBandForDays(daysUntilExpiry(expiresAt, now));
}

export const CERTIFICATE_STATUS_LABELS: Record<CertificateStatusBand, string> =
  {
    expired: "Expired",
    within30: "30 days or less",
    within90: "90 days or less",
    current: "Current",
  };

export interface CertificateSummary {
  /** Distinct operators with at least one certificate on file. */
  operatorsTracked: number;
  expiringWithin90: number;
  expiringWithin30: number;
  expired: number;
}

/**
 * Summary counts for the manager dashboard. `operatorKey` identifies the
 * operator (user id when known, otherwise the normalized name) so the
 * operators-tracked count is a distinct-operator count, not a row count.
 */
export function summarizeCertificates(
  rows: Array<{ operatorKey: string; expiresAt: Date }>,
  now: Date
): CertificateSummary {
  const operators = new Set<string>();
  let expiringWithin90 = 0;
  let expiringWithin30 = 0;
  let expired = 0;
  for (const row of rows) {
    operators.add(row.operatorKey);
    const band = statusBandForExpiry(row.expiresAt, now);
    if (band === "expired") expired += 1;
    else if (band === "within30") {
      expiringWithin30 += 1;
      expiringWithin90 += 1;
    } else if (band === "within90") expiringWithin90 += 1;
  }
  return {
    operatorsTracked: operators.size,
    expiringWithin90,
    expiringWithin30,
    expired,
  };
}

// ── Alert thresholds ─────────────────────────────────────────────────────────

/** Days-before-expiry thresholds at which alert emails are sent. 0 = expiry day. */
export const CERTIFICATE_ALERT_THRESHOLDS = [90, 60, 30, 7, 0] as const;
export type CertificateAlertThreshold =
  (typeof CERTIFICATE_ALERT_THRESHOLDS)[number];

/**
 * The alert threshold a certificate crosses today, or null when today is not
 * a threshold day for it. The alert job runs daily, so each threshold is
 * crossed exactly once; the certificate_alerts log makes re-runs idempotent.
 */
export function dueAlertThreshold(
  days: number
): CertificateAlertThreshold | null {
  return (CERTIFICATE_ALERT_THRESHOLDS as readonly number[]).includes(days)
    ? (days as CertificateAlertThreshold)
    : null;
}

// ── CSV import ───────────────────────────────────────────────────────────────

/** Column indexes into each CSV row, chosen by the manager at import time. */
export interface CertificateCsvMapping {
  operatorName: number;
  certificateType: number;
  certificateNumber: number;
  expiresAt: number;
  /** Optional issue-date column. */
  issuedAt?: number;
}

export interface CertificateCsvRow {
  /** 1-based spreadsheet row number (the header is row 1). */
  rowNumber: number;
  operatorName: string;
  certificateType: string;
  certificateNumber: string;
  issuedAt: Date | null;
  expiresAt: Date;
}

export interface CertificateCsvFailure {
  rowNumber: number;
  /** The raw cell values of the row, for the report back to the manager. */
  raw: string[];
  reason: string;
}

export const CERTIFICATE_CSV_LIMITS = {
  maxChars: 1_000_000,
  maxRows: 5_000,
  maxColumns: 32,
  maxFieldChars: 200,
} as const;

export interface CertificateCsvValidation {
  validRows: CertificateCsvRow[];
  failures: CertificateCsvFailure[];
}

/** Parses CSV text into rows of cells, handling quoted fields and CRLF. */
export function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let state: "field-start" | "unquoted" | "quoted" | "after-quote" =
    "field-start";
  const input = text.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  const finishField = () => {
    row.push(cell);
    cell = "";
    state = "field-start";
  };
  const finishRow = () => {
    finishField();
    rows.push(row);
    row = [];
  };
  for (let i = 0; i < input.length; i += 1) {
    const ch = input[i];
    if (state === "quoted") {
      if (ch === '"') {
        if (input[i + 1] === '"') {
          cell += '"';
          i += 1;
        } else state = "after-quote";
      } else cell += ch;
      continue;
    }
    if (state === "after-quote") {
      if (ch === ",") finishField();
      else if (ch === "\n") finishRow();
      else if (!/\s/.test(ch))
        throw new Error("CSV contains characters after a closing quote.");
      continue;
    }
    if (state === "field-start") {
      if (ch === '"') state = "quoted";
      else if (ch === ",") finishField();
      else if (ch === "\n") finishRow();
      else {
        cell += ch;
        state = "unquoted";
      }
    } else {
      if (ch === '"')
        throw new Error("CSV contains a quote inside an unquoted field.");
      if (ch === ",") finishField();
      else if (ch === "\n") finishRow();
      else cell += ch;
    }
  }
  if (state === "quoted")
    throw new Error("CSV contains an unclosed quoted field.");
  if (
    state === "after-quote" ||
    state === "unquoted" ||
    cell.length > 0 ||
    row.length > 0
  )
    finishRow();
  while (rows.length > 0 && rows[rows.length - 1].every(c => c.trim() === ""))
    rows.pop();
  return rows;
}

/**
 * Parses a spreadsheet date cell. Accepts ISO dates (2027-03-31), ISO
 * datetimes, and North American M/D/YYYY forms. Returns a UTC-midnight Date
 * for date-only values, or null when the value cannot be parsed.
 */
export function parseCertificateDate(raw: string): Date | null {
  const value = raw.trim();
  if (!value) return null;
  const isoDate = /^(\d{4})-(\d{2})-(\d{2})(?:$|T)/.exec(value);
  const strictUtcDate = (
    year: number,
    month: number,
    day: number
  ): Date | null => {
    if (year < 1970 || year > 9999 || month < 1 || month > 12 || day < 1)
      return null;
    const parsed = new Date(Date.UTC(year, month - 1, day));
    return parsed.getUTCFullYear() === year &&
      parsed.getUTCMonth() === month - 1 &&
      parsed.getUTCDate() === day
      ? parsed
      : null;
  };
  if (isoDate) {
    if (
      !strictUtcDate(Number(isoDate[1]), Number(isoDate[2]), Number(isoDate[3]))
    )
      return null;
    if (
      value.includes("T") &&
      !/T\d{2}:\d{2}:\d{2}(?:Z|[+-]\d{2}:\d{2})$/.test(value)
    )
      return null;
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }
  const slashDate = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(value);
  if (slashDate)
    return strictUtcDate(
      Number(slashDate[3]),
      Number(slashDate[1]),
      Number(slashDate[2])
    );
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:Z|[+-]\d{2}:\d{2})$/.test(value))
    return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

/**
 * Validates parsed CSV rows against the manager's column mapping. The first
 * row of the sheet is treated as a header and skipped. Every data row is
 * either returned as a valid certificate row or reported as a failure with a
 * reason — rows are never silently dropped.
 */
export function validateCertificateCsv(
  csvText: string,
  mapping: CertificateCsvMapping
): CertificateCsvValidation {
  if (csvText.length > CERTIFICATE_CSV_LIMITS.maxChars)
    throw new Error("CSV is too large.");
  const rows = parseCsv(csvText);
  if (rows.length > CERTIFICATE_CSV_LIMITS.maxRows + 1)
    throw new Error("CSV has too many rows.");
  if (rows.some(row => row.length > CERTIFICATE_CSV_LIMITS.maxColumns))
    throw new Error("CSV has too many columns.");
  if (
    rows.some(row =>
      row.some(cell => cell.length > CERTIFICATE_CSV_LIMITS.maxFieldChars)
    )
  )
    throw new Error("CSV field is too long.");
  const header = rows[0] ?? [];
  const requiredIndexes = [
    mapping.operatorName,
    mapping.certificateType,
    mapping.certificateNumber,
    mapping.expiresAt,
  ];
  if (
    requiredIndexes.some(
      index => !Number.isInteger(index) || index < 0 || index >= header.length
    )
  )
    throw new Error("CSV mapping points outside the header.");
  if (
    mapping.issuedAt != null &&
    (mapping.issuedAt < 0 || mapping.issuedAt >= header.length)
  )
    throw new Error("Issue-date mapping points outside the header.");
  const validRows: CertificateCsvRow[] = [];
  const failures: CertificateCsvFailure[] = [];
  const cellAt = (row: string[], index: number | undefined): string =>
    index == null ? "" : (row[index] ?? "").trim();

  rows.forEach((row, index) => {
    const rowNumber = index + 1;
    if (index === 0) return; // header row
    if (row.every(c => c.trim() === "")) return; // blank line, not a failure

    const operatorName = cellAt(row, mapping.operatorName);
    if (operatorName.length > 200) {
      failures.push({
        rowNumber,
        raw: row,
        reason: "Operator name is too long.",
      });
      return;
    }
    if (!operatorName) {
      failures.push({ rowNumber, raw: row, reason: "Missing operator name." });
      return;
    }
    const typeRaw = cellAt(row, mapping.certificateType);
    const certificateType = resolveCertificateType(typeRaw);
    if (!certificateType) {
      failures.push({
        rowNumber,
        raw: row,
        reason: `Unrecognized certificate type "${typeRaw}".`,
      });
      return;
    }
    const certificateNumber = cellAt(row, mapping.certificateNumber);
    if (certificateNumber.length > 100) {
      failures.push({
        rowNumber,
        raw: row,
        reason: "Certificate number is too long.",
      });
      return;
    }
    if (!certificateNumber) {
      failures.push({
        rowNumber,
        raw: row,
        reason: "Missing certificate number.",
      });
      return;
    }
    const expiresRaw = cellAt(row, mapping.expiresAt);
    const expiresAt = parseCertificateDate(expiresRaw);
    if (!expiresAt) {
      failures.push({
        rowNumber,
        raw: row,
        reason: `Unparseable expiry date "${expiresRaw}".`,
      });
      return;
    }
    let issuedAt: Date | null = null;
    if (mapping.issuedAt != null) {
      const issuedRaw = cellAt(row, mapping.issuedAt);
      if (issuedRaw) {
        issuedAt = parseCertificateDate(issuedRaw);
        if (!issuedAt) {
          failures.push({
            rowNumber,
            raw: row,
            reason: `Unparseable issue date "${issuedRaw}".`,
          });
          return;
        }
        if (issuedAt.getTime() > expiresAt.getTime()) {
          failures.push({
            rowNumber,
            raw: row,
            reason: "Issue date must be on or before expiry date.",
          });
          return;
        }
      }
    }
    validRows.push({
      rowNumber,
      operatorName,
      certificateType,
      certificateNumber,
      issuedAt,
      expiresAt,
    });
  });

  return { validRows, failures };
}

/**
 * Best-effort column mapping from a header row, so the import UI can
 * pre-select the mapping a municipal spreadsheet most likely uses. Returns
 * null for any field whose header is not recognized.
 */
export function guessCertificateCsvMapping(headerRow: string[]): {
  operatorName: number | null;
  certificateType: number | null;
  certificateNumber: number | null;
  expiresAt: number | null;
  issuedAt: number | null;
} {
  const find = (patterns: RegExp[]): number | null => {
    for (let i = 0; i < headerRow.length; i += 1) {
      const header = headerRow[i].trim().toLowerCase();
      if (patterns.some(p => p.test(header))) return i;
    }
    return null;
  };
  return {
    operatorName: find([/operator/, /name/, /employee/]),
    certificateType: find([/type/, /class/, /certificate/, /licen[cs]e/]),
    certificateNumber: find([/number/, /no\.?$/, /#/]),
    expiresAt: find([/expir/, /renewal/]),
    issuedAt: find([/issue/, /issued/]),
  };
}
