#!/usr/bin/env node
/**
 * Private historical-payment recovery normalizer.
 *
 * Default mode is dry-run only: it reads a CSV outside the repository and
 * writes a non-sensitive manifest. It never prints customer emails, payment
 * IDs, amounts per customer, or raw CSV rows. Staging requires an explicit
 * approval token and records evidence only; it never creates purchases,
 * subscriptions, accounts, or access rights.
 *
 * Usage:
 *   node scripts/recovery/normalizeStripeRecoveryExport.mjs --input /private/stripe.csv --manifest /private/stripe-manifest.json
 *
 * Controlled evidence staging:
 *   RECOVERY_EVIDENCE_APPROVED=STAGE_VERIFIED_STRIPE_EXPORT \
 *   RECOVERY_PRIVATE_ARCHIVE_REF='gdrive:private-folder/export-sha256' \
 *   DATABASE_URL='mysql://…' \
 *   node scripts/recovery/normalizeStripeRecoveryExport.mjs --input /private/stripe.csv --manifest /private/stripe-manifest.json --stage
 */
import { createHash } from "node:crypto";
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import mysql from "mysql2/promise";

const APPROVAL = "STAGE_VERIFIED_STRIPE_EXPORT";

function parseArgs(argv) {
  const args = { stage: false };
  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];
    if (token === "--stage") args.stage = true;
    else if (token === "--input") args.input = argv[++i];
    else if (token === "--manifest") args.manifest = argv[++i];
    else throw new Error(`Unknown argument: ${token}`);
  }
  if (!args.input || !args.manifest) throw new Error("Both --input and --manifest are required.");
  return args;
}

/** Minimal RFC 4180 parser sufficient for Stripe's quoted CSV exports. */
export function parseCsv(text) {
  const rows = [];
  let row = [];
  let value = "";
  let quoted = false;
  for (let i = 0; i < text.length; i += 1) {
    const char = text[i];
    const next = text[i + 1];
    if (char === '"' && quoted && next === '"') { value += '"'; i += 1; continue; }
    if (char === '"') { quoted = !quoted; continue; }
    if (char === "," && !quoted) { row.push(value); value = ""; continue; }
    if ((char === "\n" || char === "\r") && !quoted) {
      if (char === "\r" && next === "\n") i += 1;
      row.push(value);
      if (row.some(cell => cell.length > 0)) rows.push(row);
      row = []; value = ""; continue;
    }
    value += char;
  }
  row.push(value);
  if (row.some(cell => cell.length > 0)) rows.push(row);
  if (!rows.length) throw new Error("The export is empty.");
  return rows;
}

function canonicalHeader(value) {
  return value.toLowerCase().replace(/[^a-z0-9]/g, "");
}

function findField(headers, candidates) {
  for (const candidate of candidates) {
    const index = headers.findIndex(header => header === candidate);
    if (index >= 0) return index;
  }
  return -1;
}

function valueAt(row, index) {
  return index >= 0 ? (row[index] ?? "").trim() : "";
}

function parseAmountMinor(raw) {
  const cleaned = raw.replace(/[^0-9.-]/g, "");
  if (!cleaned) return 0;
  const amount = Number(cleaned);
  if (!Number.isFinite(amount)) return 0;
  return Math.round(amount * 100);
}

function normalizeStatus(raw) {
  const value = raw.toLowerCase();
  if (/(succeeded|paid|successful|complete)/.test(value)) return "succeeded";
  if (/refund/.test(value)) return "refunded";
  if (/(dispute|chargeback)/.test(value)) return "disputed";
  return "unknown";
}

function normalizeEmail(email) {
  return email.trim().toLowerCase();
}

export function normalizeStripeRows(csvText) {
  const [headerRow, ...body] = parseCsv(csvText);
  const headers = headerRow.map(canonicalHeader);
  const fields = {
    paymentIntent: findField(headers, ["paymentintentid", "paymentintent", "id"]),
    checkoutSession: findField(headers, ["checkoutsessionid", "checkoutsession"]),
    customer: findField(headers, ["customerid", "customer"]),
    email: findField(headers, ["customeremail", "email", "billingemail"]),
    name: findField(headers, ["customername", "name", "billingname"]),
    amount: findField(headers, ["amount", "amountpaid", "amounttotal"]),
    currency: findField(headers, ["currency"]),
    status: findField(headers, ["status", "paymentstatus"]),
    created: findField(headers, ["createdutc", "created", "createddate"]),
  };
  if (fields.email < 0) throw new Error("The Stripe export must include a customer email column.");
  if (fields.paymentIntent < 0 && fields.checkoutSession < 0) {
    throw new Error("The Stripe export must include a payment intent or checkout session identifier column.");
  }

  const rejectedRows = [];
  const records = [];
  for (let rowIndex = 0; rowIndex < body.length; rowIndex += 1) {
    const row = body[rowIndex];
    const email = valueAt(row, fields.email);
    const paymentIntent = valueAt(row, fields.paymentIntent);
    const checkoutSession = valueAt(row, fields.checkoutSession);
    if (!email || (!paymentIntent && !checkoutSession)) { rejectedRows.push(rowIndex + 2); continue; }
    const status = normalizeStatus(valueAt(row, fields.status));
    const sourceEvidenceKey = paymentIntent ? `stripe:payment:${paymentIntent}` : `stripe:checkout:${checkoutSession}`;
    const createdRaw = valueAt(row, fields.created);
    const paymentCreatedAt = createdRaw && !Number.isNaN(Date.parse(createdRaw)) ? new Date(createdRaw) : null;
    records.push({
      sourceEvidenceKey,
      sourceType: paymentIntent ? "stripe_payment" : "stripe_checkout",
      stripePaymentIntentId: paymentIntent || null,
      stripeCheckoutSessionId: checkoutSession || null,
      stripeCustomerId: valueAt(row, fields.customer) || null,
      customerEmail: email,
      normalizedEmail: normalizeEmail(email),
      customerName: valueAt(row, fields.name) || null,
      amountMinor: parseAmountMinor(valueAt(row, fields.amount)),
      currency: (valueAt(row, fields.currency) || "cad").toLowerCase().slice(0, 3),
      paymentStatus: status,
      paymentCreatedAt,
    });
  }
  return { records, rejectedRows, headers: headerRow };
}

export function manifestFor(records, rejectedRows, sha256) {
  const byStatus = Object.fromEntries(["succeeded", "refunded", "disputed", "unknown"].map(status => [status, 0]));
  for (const record of records) byStatus[record.paymentStatus] += 1;
  return {
    generatedAt: new Date().toISOString(),
    sourceSha256: sha256,
    totalRowsAccepted: records.length,
    totalRowsRejected: rejectedRows.length,
    rejectedSourceRowNumbers: rejectedRows,
    paymentStatusCounts: byStatus,
    safety: {
      containsCustomerIdentifiers: false,
      grantsEntitlements: false,
      createsPurchasesOrSubscriptions: false,
      requiresSeparateApprovalBeforeStaging: true,
      requiresSeparateApprovalBeforeAnyEntitlementImport: true,
    },
  };
}

async function stageRecords(records, archiveRef) {
  if (process.env.RECOVERY_EVIDENCE_APPROVED !== APPROVAL) {
    throw new Error("Evidence staging requires RECOVERY_EVIDENCE_APPROVED=STAGE_VERIFIED_STRIPE_EXPORT.");
  }
  if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is required for controlled evidence staging.");
  if (!archiveRef || archiveRef.length < 12) throw new Error("RECOVERY_PRIVATE_ARCHIVE_REF must identify the private source archive.");
  const connection = await mysql.createConnection(process.env.DATABASE_URL);
  try {
    let inserted = 0;
    let alreadyPresent = 0;
    for (const record of records) {
      const [result] = await connection.execute(
        `INSERT IGNORE INTO customer_recovery_evidence
          (sourceEvidenceKey, sourceType, sourceArchiveRef, stripePaymentIntentId, stripeCheckoutSessionId, stripeCustomerId,
           customerEmail, normalizedEmail, customerName, amountMinor, currency, paymentStatus, paymentCreatedAt, reviewStatus)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'staged')`,
        [record.sourceEvidenceKey, record.sourceType, archiveRef, record.stripePaymentIntentId, record.stripeCheckoutSessionId,
          record.stripeCustomerId, record.customerEmail, record.normalizedEmail, record.customerName, record.amountMinor,
          record.currency, record.paymentStatus, record.paymentCreatedAt],
      );
      if (result.affectedRows === 1) inserted += 1;
      else alreadyPresent += 1;
    }
    return { inserted, alreadyPresent };
  } finally {
    await connection.end();
  }
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const inputPath = resolve(args.input);
  const manifestPath = resolve(args.manifest);
  const csv = await readFile(inputPath, "utf8");
  const sha256 = createHash("sha256").update(csv).digest("hex");
  const { records, rejectedRows } = normalizeStripeRows(csv);
  const manifest = manifestFor(records, rejectedRows, sha256);
  await mkdir(dirname(manifestPath), { recursive: true, mode: 0o700 });
  await writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`, { mode: 0o600 });
  if (!args.stage) {
    console.log(JSON.stringify({ mode: "dry-run", accepted: records.length, rejected: rejectedRows.length, manifest: manifestPath }));
    return;
  }
  const result = await stageRecords(records, process.env.RECOVERY_PRIVATE_ARCHIVE_REF);
  console.log(JSON.stringify({ mode: "staged-evidence-only", accepted: records.length, rejected: rejectedRows.length, ...result, manifest: manifestPath }));
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(error => { console.error(error instanceof Error ? error.message : error); process.exitCode = 1; });
}
