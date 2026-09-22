import type { MySql2Database } from "drizzle-orm/mysql2";
import { sql } from "drizzle-orm";
import { DATA_EXPLORER_COLUMN_CLASSIFICATIONS } from "./dataExplorerColumns";

export type ExplorerCategory =
  | "Accounts"
  | "Commerce"
  | "Teams"
  | "Learning"
  | "Content"
  | "Feedback"
  | "Operations"
  | "Recovery";

export interface DataExplorerDataset {
  key: string;
  tableName: string;
  label: string;
  description: string;
  category: ExplorerCategory;
  orderBy: string;
}

/**
 * The browser can select only a named dataset from this immutable application
 * catalog. Table and column identifiers are never accepted from the request.
 */
export const DATA_EXPLORER_DATASETS: readonly DataExplorerDataset[] = [
  { key: "users", tableName: "users", label: "Users", description: "Learner and administrator accounts", category: "Accounts", orderBy: "updatedAt" },
  { key: "student-profiles", tableName: "student_profiles", label: "Student profiles", description: "Learner progress snapshots", category: "Accounts", orderBy: "updatedAt" },
  { key: "learner-onboarding", tableName: "learner_onboarding", label: "Learner onboarding", description: "Course onboarding and diagnostic readiness", category: "Accounts", orderBy: "updatedAt" },
  { key: "exam-dates", tableName: "exam_dates", label: "Exam dates", description: "Learner exam date plans", category: "Accounts", orderBy: "updatedAt" },
  { key: "magic-links", tableName: "magic_links", label: "Magic link audit", description: "Passwordless access lifecycle without token hashes", category: "Accounts", orderBy: "createdAt" },
  { key: "dashboard-otps", tableName: "dashboard_otps", label: "Dashboard OTP audit", description: "Dashboard sign-in code lifecycle without code hashes", category: "Accounts", orderBy: "createdAt" },
  { key: "email-otp-codes", tableName: "email_otp_codes", label: "Email OTP audit", description: "Email code lifecycle without code hashes", category: "Accounts", orderBy: "createdAt" },

  { key: "purchases", tableName: "purchases", label: "Purchases", description: "Individual course pass purchases and access terms", category: "Commerce", orderBy: "createdAt" },
  { key: "subscriptions", tableName: "subscriptions", label: "Subscriptions", description: "Recurring and organization-managed subscriptions", category: "Commerce", orderBy: "updatedAt" },
  { key: "purchase-email-outbox", tableName: "purchase_email_outbox", label: "Purchase email outbox", description: "Receipt delivery status without message payloads", category: "Commerce", orderBy: "createdAt" },
  { key: "stripe-event-log", tableName: "stripe_event_log", label: "Stripe event ledger", description: "Webhook processing status without payment identifiers", category: "Commerce", orderBy: "createdAt" },

  { key: "organizations", tableName: "organizations", label: "Organizations", description: "Team account contracts and capacity", category: "Teams", orderBy: "createdAt" },
  { key: "organization-members", tableName: "organization_members", label: "Organization members", description: "Managers and operator seats", category: "Teams", orderBy: "assignedAt" },
  { key: "organization-term-usage", tableName: "organization_term_operator_usage", label: "Annual team usage", description: "Annual licence usage ledger", category: "Teams", orderBy: "firstActivatedAt" },
  { key: "team-flex-orders", tableName: "team_flex_orders", label: "Teams Flex orders", description: "Course-specific licence orders", category: "Teams", orderBy: "createdAt" },
  { key: "team-flex-order-items", tableName: "team_flex_order_items", label: "Teams Flex order items", description: "Course and term line items", category: "Teams", orderBy: "createdAt" },
  { key: "team-flex-licences", tableName: "team_flex_licences", label: "Teams Flex licences", description: "Operator invitations, activation, and expiry", category: "Teams", orderBy: "createdAt" },
  { key: "team-flex-extensions", tableName: "team_flex_extensions", label: "Teams Flex extensions", description: "90-day retake extensions", category: "Teams", orderBy: "createdAt" },
  { key: "on-the-job-training", tableName: "on_the_job_training_records", label: "On-the-job training", description: "Manager-recorded practical training", category: "Teams", orderBy: "updatedAt" },
  { key: "training-attestations", tableName: "training_attestations", label: "Training attestations", description: "Signed training review records", category: "Teams", orderBy: "signedAt" },
  { key: "exam-outcomes", tableName: "exam_outcomes", label: "Exam outcomes", description: "Reported certification outcomes", category: "Teams", orderBy: "recordedAt" },

  { key: "learning-activity-sessions", tableName: "learning_activity_sessions", label: "Learning activity sessions", description: "Platform-recorded study activity", category: "Learning", orderBy: "createdAt" },
  { key: "question-attempts", tableName: "question_attempts", label: "Question attempts", description: "Learner answer attempts", category: "Learning", orderBy: "createdAt" },
  { key: "exam-results", tableName: "exam_results", label: "Mock exam results", description: "Completed mock exam outcomes", category: "Learning", orderBy: "createdAt" },
  { key: "diagnostic-sessions", tableName: "diagnostic_sessions", label: "Diagnostic sessions", description: "Starting readiness assessments", category: "Learning", orderBy: "completedAt" },
  { key: "flashcard-progress", tableName: "flashcard_progress", label: "Flashcard progress", description: "Legacy flashcard progress records", category: "Learning", orderBy: "updatedAt" },
  { key: "flashcard-progress-state", tableName: "flashcard_progress_state", label: "Flashcard progress state", description: "Current course-wide flashcard state", category: "Learning", orderBy: "id" },
  { key: "flashcard-progress-operations", tableName: "flashcard_progress_operations", label: "Flashcard operation ledger", description: "Idempotent flashcard operation records", category: "Learning", orderBy: "createdAt" },
  { key: "bookmarks", tableName: "bookmarks", label: "Bookmarks", description: "Learner question bookmarks", category: "Learning", orderBy: "createdAt" },
  { key: "qotd-completions", tableName: "qotd_completions", label: "Question of the Day", description: "Daily question completions", category: "Learning", orderBy: "createdAt" },
  { key: "ai-chat-sessions", tableName: "ai_chat_sessions", label: "AI tutor sessions", description: "Tutor session summaries and usage", category: "Learning", orderBy: "sessionEnd" },

  { key: "questions", tableName: "questions", label: "Question bank", description: "Water and wastewater question content", category: "Content", orderBy: "id" },
  { key: "question-bank-meta", tableName: "question_bank_meta", label: "Question bank metadata", description: "Published bank counts and versions", category: "Content", orderBy: "bankKey" },
  { key: "question-content-snapshots", tableName: "question_content_snapshots", label: "Question snapshots", description: "Before-images for controlled content releases", category: "Content", orderBy: "capturedAt" },
  { key: "module-overviews", tableName: "module_overviews", label: "Module overviews", description: "Course study guide content", category: "Content", orderBy: "id" },
  { key: "certification-bank-versions", tableName: "certification_bank_versions", label: "Certification bank versions", description: "Versioned certification release boundaries", category: "Content", orderBy: "createdAt" },
  { key: "certification-sources", tableName: "certification_sources", label: "Certification sources", description: "Content rights and source records", category: "Content", orderBy: "verifiedAt" },
  { key: "certification-blueprint-tasks", tableName: "certification_blueprint_tasks", label: "Certification blueprint tasks", description: "Versioned task allocations", category: "Content", orderBy: "id" },
  { key: "certification-questions", tableName: "certification_questions", label: "Certification questions", description: "Original versioned certification questions", category: "Content", orderBy: "updatedAt" },
  { key: "certification-content-reviews", tableName: "certification_content_reviews", label: "Certification reviews", description: "Immutable editorial and technical reviews", category: "Content", orderBy: "reviewedAt" },
  { key: "certification-import-runs", tableName: "certification_import_runs", label: "Certification import runs", description: "Certification content import audit", category: "Content", orderBy: "createdAt" },
  { key: "certification-diagrams", tableName: "certification_diagrams", label: "Certification diagrams", description: "Diagram metadata and status", category: "Content", orderBy: "id" },
  { key: "certification-flashcards", tableName: "certification_flashcards", label: "Certification flashcards", description: "Versioned certification flashcards", category: "Content", orderBy: "id" },
  { key: "certification-module-notes", tableName: "certification_module_notes", label: "Certification module notes", description: "Versioned module study notes", category: "Content", orderBy: "id" },
  { key: "changelog", tableName: "changelog", label: "Changelog", description: "Published platform updates", category: "Content", orderBy: "sortOrder" },
  { key: "blog-posts", tableName: "blog_posts", label: "Blog posts", description: "SEO content and publishing state", category: "Content", orderBy: "updatedAt" },
  { key: "job-postings", tableName: "job_postings", label: "Job postings", description: "Operator job board listings", category: "Content", orderBy: "lastSeenAt" },

  { key: "user-feedback", tableName: "user_feedback", label: "User feedback", description: "Ratings and feedback responses", category: "Feedback", orderBy: "createdAt" },
  { key: "question-error-reports", tableName: "question_error_reports", label: "Question error reports", description: "Reported question issues", category: "Feedback", orderBy: "createdAt" },
  { key: "trial-emails", tableName: "trial_emails", label: "Trial email signups", description: "Free question-bank unlocks", category: "Feedback", orderBy: "createdAt" },
  { key: "waitlist", tableName: "waitlist", label: "Waitlist", description: "Course waitlist requests", category: "Feedback", orderBy: "createdAt" },
  { key: "contact-submissions", tableName: "contact_submissions", label: "Contact submissions", description: "Website contact inquiries", category: "Feedback", orderBy: "createdAt" },
  { key: "command-feedback", tableName: "command_feedback", label: "Command feedback", description: "Incident-command feedback", category: "Feedback", orderBy: "createdAt" },
  { key: "command-email-capture", tableName: "command_email_capture", label: "Command email capture", description: "Incident-command lead captures", category: "Feedback", orderBy: "createdAt" },

  { key: "product-analytics-events", tableName: "product_analytics_events", label: "Product analytics", description: "Privacy-preserving product event log", category: "Operations", orderBy: "occurredAt" },
  { key: "trigger-logs", tableName: "trigger_logs", label: "Trigger logs", description: "Proactive learner email delivery log", category: "Operations", orderBy: "sentAt" },
  { key: "scheduled-work", tableName: "scheduled_work", label: "Scheduled work", description: "Managed job and delivery ledger", category: "Operations", orderBy: "createdAt" },
  { key: "command-drill-queue", tableName: "command_drill_queue", label: "Command drill queue", description: "Incident command drill work queue", category: "Operations", orderBy: "queuedAt" },
  { key: "command-run-history", tableName: "command_run_history", label: "Command run history", description: "Incident command execution history", category: "Operations", orderBy: "completedAt" },

  { key: "customer-recovery-evidence", tableName: "customer_recovery_evidence", label: "Recovery evidence", description: "Evidence-bound historical recovery review", category: "Recovery", orderBy: "updatedAt" },
  { key: "customer-recovery-batches", tableName: "customer_recovery_batches", label: "Recovery batches", description: "Authorized historic recovery batch audit", category: "Recovery", orderBy: "createdAt" },
  { key: "customer-recovery-import-items", tableName: "customer_recovery_import_items", label: "Recovery import items", description: "Evidence-to-output recovery mapping", category: "Recovery", orderBy: "createdAt" },
] as const;

const DATASET_BY_KEY = new Map(DATA_EXPLORER_DATASETS.map(dataset => [dataset.key, dataset]));
const EXPLORER_MAX_PAGE_SIZE = 100;
const CELL_CHARACTER_LIMIT = 10_000;
/**
 * Any schema column whose identifier indicates credentials, provider data, a
 * delivery payload, an operational diagnostic, or a private artifact must be
 * placed in the static restricted list. Tests enforce this for every table.
 */
export const DATA_EXPLORER_PROTECTED_COLUMN_NAME = /(token|hash|sha\d+|checksum|digest|stripe|payload|metadata|secret|password|credential|authorization|error|subject|body|preview|url|reference|snapshot|json|guest|archive|backup|artifact|path)/i;
export const DATA_EXPLORER_UNSAFE_FREE_TEXT_COLUMNS = new Set([
  "notes", "comment", "message", "details", "description", "reviewNote",
  "content", "question", "questionText", "options", "explanation", "steps",
  "tip", "front", "back", "subjectSummary", "summary", "resourcesSurfaced",
]);

export function isDataExplorerProtectedColumn(column: string): boolean {
  return DATA_EXPLORER_PROTECTED_COLUMN_NAME.test(column)
    || DATA_EXPLORER_UNSAFE_FREE_TEXT_COLUMNS.has(column);
}

export function getDataExplorerDataset(key: string): DataExplorerDataset | null {
  return DATASET_BY_KEY.get(key) ?? null;
}

function quoteIdentifier(identifier: string): string {
  return `\`${identifier.replace(/`/g, "``")}\``;
}

export function getDataExplorerColumnClassification(dataset: DataExplorerDataset) {
  const classification = DATA_EXPLORER_COLUMN_CLASSIFICATIONS[dataset.key];
  if (!classification) {
    throw new Error(`Data Explorer dataset ${dataset.key} has no column classification.`);
  }
  if (!classification.readable.length) {
    throw new Error(`Data Explorer dataset ${dataset.key} has no readable columns.`);
  }
  if (!classification.readable.includes(dataset.orderBy)) {
    throw new Error(`Data Explorer dataset ${dataset.key} must allow its configured sort column.`);
  }
  return classification;
}

const EMBEDDED_SENSITIVE_KEY = /(?:api[_-]?key|authorization|credential|password|secret|token|stripe[a-z0-9_-]*id|payload)/i;
const EMBEDDED_SENSITIVE_VALUE_PATTERNS = [
  /\b(?:acct|ba|bt|card|cashbal|ch|coupon|cs|cus|dp|evt|fee|file|in|invoiceitem|issfr|link|mandate|pi|pm|po|price|prod|promo|quote|re|refund|seti|si|sk|source|sub|tax|tok|tr|transfer)_[A-Za-z0-9_]+\b/g,
  /\bsk_(?:live|test)_[A-Za-z0-9_]+\b/g,
  /\b(?:token|secret|password|authorization)\s*[:=]\s*[^\s,;]+/gi,
  /\b[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}\b/g,
] as const;

function redactSensitiveText(value: string): string {
  return EMBEDDED_SENSITIVE_VALUE_PATTERNS.reduce(
    (text, pattern) => text.replace(pattern, "[redacted]"),
    value,
  );
}

function redactStructuredValue(value: unknown, seen = new WeakSet<object>()): unknown {
  if (value === null || value === undefined) return value;
  if (typeof value === "string") return redactSensitiveText(value);
  if (typeof value !== "object") return value;
  if (value instanceof Date) return value.toISOString();
  if (Buffer.isBuffer(value)) return `[binary ${value.length} bytes]`;
  if (seen.has(value)) return "[circular value]";
  seen.add(value);
  if (Array.isArray(value)) return value.map(item => redactStructuredValue(item, seen));
  return Object.fromEntries(Object.entries(value).map(([key, nestedValue]) => [
    key,
    EMBEDDED_SENSITIVE_KEY.test(key) ? "[redacted]" : redactStructuredValue(nestedValue, seen),
  ]));
}

export function formatDataExplorerValue(value: unknown): string | number | boolean | null {
  if (value === null || value === undefined) return null;
  if (typeof value === "string") {
    const sanitized = redactSensitiveText(value);
    const trimmed = sanitized.trim();
    if ((trimmed.startsWith("{") || trimmed.startsWith("[")) && trimmed.length > 1) {
      try {
        return formatDataExplorerValue(JSON.parse(trimmed));
      } catch {
        // Non-JSON text stays intact. The selected column is already allowlisted.
      }
    }
    return sanitized.length > CELL_CHARACTER_LIMIT
      ? `${sanitized.slice(0, CELL_CHARACTER_LIMIT)}…`
      : sanitized;
  }
  if (typeof value === "number" || typeof value === "boolean") return value;
  if (typeof value === "bigint") return value.toString();
  let stringified: string;
  try {
    stringified = JSON.stringify(redactStructuredValue(value));
  } catch {
    return "[unserializable structured value]";
  }
  if (stringified === undefined) return "[unsupported structured value]";
  return stringified.length > CELL_CHARACTER_LIMIT
    ? `${stringified.slice(0, CELL_CHARACTER_LIMIT)}…`
    : stringified;
}

export interface DataExplorerPage {
  dataset: DataExplorerDataset & { restrictedColumns: string[] };
  columns: string[];
  rows: Record<string, string | number | boolean | null>[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  generatedAt: Date;
}

export function buildDataExplorerStatements(
  dataset: DataExplorerDataset,
  page: number,
  pageSize: number,
) {
  const classification = getDataExplorerColumnClassification(dataset);
  const visibleColumns = [...classification.readable];
  const selectedColumns = visibleColumns.map(quoteIdentifier).join(", ");
  const safePageSize = Math.min(Math.max(Math.floor(pageSize), 1), EXPLORER_MAX_PAGE_SIZE);
  const safePage = Math.max(Math.floor(page), 1);
  const offset = (safePage - 1) * safePageSize;
  const table = quoteIdentifier(dataset.tableName);
  const orderBy = quoteIdentifier(dataset.orderBy);

  return {
    countSql: `SELECT COUNT(*) AS total FROM ${table}`,
    // page and pageSize are integers clamped above before interpolation. Table,
    // column, and ordering identifiers all come from the server catalog.
    rowsSql: `SELECT ${selectedColumns} FROM ${table} ORDER BY ${orderBy} DESC LIMIT ${safePageSize} OFFSET ${offset}`,
    visibleColumns,
    page: safePage,
    pageSize: safePageSize,
  };
}

/** Executes only catalog-backed SELECT statements. It has no mutation path. */
export async function readDataExplorerPage(
  db: MySql2Database<Record<string, never>>,
  dataset: DataExplorerDataset,
  page: number,
  pageSize: number,
): Promise<DataExplorerPage> {
  const classification = getDataExplorerColumnClassification(dataset);
  const statements = buildDataExplorerStatements(dataset, page, pageSize);
  const [countRows] = await db.execute(sql.raw(statements.countSql));
  const total = Number((countRows as unknown as Array<{ total: number | string }>)[0]?.total ?? 0);
  const [rows] = await db.execute(sql.raw(statements.rowsSql));

  return {
    dataset: {
      key: dataset.key,
      tableName: dataset.tableName,
      label: dataset.label,
      description: dataset.description,
      category: dataset.category,
      orderBy: dataset.orderBy,
      restrictedColumns: [...classification.restricted],
    },
    columns: statements.visibleColumns,
    rows: (rows as unknown as Array<Record<string, unknown>>).map(row => Object.fromEntries(
      statements.visibleColumns.map(column => [column, formatDataExplorerValue(row[column])]),
    )),
    total,
    page: statements.page,
    pageSize: statements.pageSize,
    totalPages: Math.max(1, Math.ceil(total / statements.pageSize)),
    generatedAt: new Date(),
  };
}

export function publicDataExplorerCatalog() {
  return DATA_EXPLORER_DATASETS.map(dataset => ({
    key: dataset.key,
    tableName: dataset.tableName,
    label: dataset.label,
    description: dataset.description,
    category: dataset.category,
    restrictedColumns: [...getDataExplorerColumnClassification(dataset).restricted],
  }));
}
