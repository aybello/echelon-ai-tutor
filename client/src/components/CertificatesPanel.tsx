import { useMemo, useRef, useState } from "react";
import { Link } from "wouter";
import { Download, FileText, Pencil, Plus, RotateCw, Search, Trash2, Upload } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  CERTIFICATE_TYPES,
  guessCertificateCsvMapping,
  parseCsv,
  validateCertificateCsv,
  CERTIFICATE_ALERT_THRESHOLDS,
  CERTIFICATE_STATUS_LABELS,
  type CertificateStatusBand,
} from "@shared/certificates";
import { toast } from "sonner";

interface CertificatesPanelProps {
  orgId: number;
}

const BAND_COLORS: Record<CertificateStatusBand, string> = {
  expired: "bg-red-100 text-red-700",
  within30: "bg-orange-100 text-orange-700",
  within90: "bg-yellow-100 text-yellow-800",
  current: "bg-green-100 text-green-700",
};

const BAND_LABELS: Record<CertificateStatusBand, string> = {
  expired: "Expired",
  within30: "30 days or less",
  within90: "90 days or less",
  current: "Current",
};

type CertificateRow = {
  id: number;
  version: number;
  operatorName: string;
  certificateLabel: string;
  certificateNumber: string;
  issuedAt: Date | string | null;
  expiresAt: Date | string;
  daysUntilExpiry: number;
  statusBand: CertificateStatusBand;
  courseKey: string | null;
  coursePath: string | null;
  operatorMemberId: number | null;
  rosterReviewStatus: string;
  followUpOwner: string | null;
  followUpStatus: string;
};

function csvCell(value: unknown): string {
  let text = String(value ?? "");
  if (/^[\u0000-\u001f]*[=+\-@]/.test(text)) text = `'${text}`;
  return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

function saveTextFile(text: string, filename: string, type = "text/csv;charset=utf-8") {
  const url = URL.createObjectURL(new Blob([text], { type }));
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

function formatDate(value: Date | string | null): string {
  if (!value) return "—";
  const date = value instanceof Date ? value : new Date(value);
  return date.toLocaleDateString("en-CA", {
    year: "numeric",
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });
}

function toDateInputValue(value: Date | string | null): string {
  if (!value) return "";
  const date = value instanceof Date ? value : new Date(value);
  return date.toISOString().slice(0, 10);
}

interface CertFormState {
  operatorName: string;
  operatorEmail: string;
  certificateType: string;
  certificateNumber: string;
  issuedAt: string;
  expiresAt: string;
}

const EMPTY_FORM: CertFormState = {
  operatorName: "",
  operatorEmail: "",
  certificateType: "oit",
  certificateNumber: "",
  issuedAt: "",
  expiresAt: "",
};

export function CertificatesPanel({ orgId }: CertificatesPanelProps) {
  const utils = trpc.useUtils();
  const listQuery = trpc.certificates.list.useQuery(
    { orgId },
    { retry: false }
  );
  const summaryQuery = trpc.certificates.summary.useQuery(
    { orgId },
    { retry: false }
  );
  const membersQuery = trpc.org.listMembers.useQuery(
    { orgId },
    { retry: false }
  );

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<CertificateRow | null>(null);
  const [form, setForm] = useState<CertFormState>(EMPTY_FORM);
  const [renewing, setRenewing] = useState<CertificateRow | null>(null);
  const [renewExpiry, setRenewExpiry] = useState("");
  const [renewIssued, setRenewIssued] = useState("");
  const [confirmRemove, setConfirmRemove] = useState<{
    id: number;
    expectedVersion: number;
  } | null>(null);

  const [csvText, setCsvText] = useState<string | null>(null);
  const [csvHeaders, setCsvHeaders] = useState<string[]>([]);
  const [csvPreview, setCsvPreview] = useState<ReturnType<typeof validateCertificateCsv> | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [followUpOwner, setFollowUpOwner] = useState("");
  const [followUpStatus, setFollowUpStatus] = useState<"open" | "in_progress" | "resolved">("open");
  const [rosterReviewStatus, setRosterReviewStatus] = useState<"needs_review" | "reviewed_unmatched">("needs_review");
  const [workflowRow, setWorkflowRow] = useState<CertificateRow | null>(null);
  const [mapping, setMapping] = useState<{
    operatorName: number;
    certificateType: number;
    certificateNumber: number;
    expiresAt: number;
    issuedAt: number | -1;
  }>({
    operatorName: 0,
    certificateType: 1,
    certificateNumber: 2,
    expiresAt: 3,
    issuedAt: -1,
  });
  const fileRef = useRef<HTMLInputElement>(null);
  const csvReadGeneration = useRef(0);

  const invalidate = () => {
    void utils.certificates.list.invalidate({ orgId });
    void utils.certificates.summary.invalidate({ orgId });
  };

  const createMutation = trpc.certificates.create.useMutation({
    onSuccess: () => {
      toast.success("Certificate added.");
      setFormOpen(false);
      setForm(EMPTY_FORM);
      invalidate();
    },
    onError: error => toast.error(error.message),
  });

  const updateMutation = trpc.certificates.update.useMutation({
    onSuccess: () => {
      toast.success("Certificate updated.");
      setEditing(null);
      invalidate();
    },
    onError: error => toast.error(error.message),
  });

  const removeMutation = trpc.certificates.remove.useMutation({
    onSuccess: () => {
      toast.success("Certificate removed.");
      setConfirmRemove(null);
      invalidate();
    },
    onError: error => toast.error(error.message),
  });

  const renewMutation = trpc.certificates.renew.useMutation({
    onSuccess: result => {
      toast.success(
        result.coursePath
          ? `Renewed. Renewal prep course: ${result.certificateLabel} — open it from the row's course link.`
          : "Certificate renewed."
      );
      setRenewing(null);
      invalidate();
    },
    onError: error => toast.error(error.message),
  });

  const importMutation = trpc.certificates.importCsv.useMutation({
    onSuccess: result => {
      if (result.failures.length === 0) {
        toast.success(
          `Imported ${result.imported} certificate${result.imported === 1 ? "" : "s"}.`
        );
      } else {
        toast.warning(
          `Imported ${result.imported}. ${result.failures.length} row${result.failures.length === 1 ? "" : "s"} failed: ` +
            result.failures
              .map(f => `Row ${f.rowNumber}: ${f.reason}`)
              .join(" ")
        );
      }
      setCsvText(null);
      setCsvPreview(null);
      invalidate();
    },
    onError: error => toast.error(error.message),
  });

  const workflowMutation = trpc.certificates.setWorkflow.useMutation({
    onSuccess: () => { toast.success("Manager follow-up saved."); setWorkflowRow(null); invalidate(); },
    onError: error => toast.error(error.message),
  });
  const auditQuery = trpc.certificates.audit.useQuery(
    { orgId, id: workflowRow?.id ?? 0 },
    { enabled: workflowRow !== null, retry: false }
  );
  const evidenceQuery = trpc.certificates.evidence.useQuery(
    { orgId, id: workflowRow?.id ?? 0 },
    { enabled: workflowRow !== null, retry: false }
  );
  const uploadEvidenceMutation = trpc.certificates.uploadEvidence.useMutation({
    onSuccess: () => { toast.success("Evidence uploaded. It remains unverified until a manager reviews it."); void evidenceQuery.refetch(); void auditQuery.refetch(); },
    onError: error => toast.error(error.message),
  });
  const reviewEvidenceMutation = trpc.certificates.reviewEvidence.useMutation({
    onSuccess: () => { toast.success("Evidence marked manager-reviewed."); void evidenceQuery.refetch(); void auditQuery.refetch(); },
    onError: error => toast.error(error.message),
  });

  // org.listMembers returns the org's operator roster (no managers).
  const operators = useMemo(
    () =>
      (membersQuery.data ?? []).filter(m => m.status === "assigned") as Array<{
        email: string;
        name: string | null;
      }>,
    [membersQuery.data]
  );

  const openAdd = () => {
    setForm(EMPTY_FORM);
    setFormOpen(true);
  };

  const openEdit = (row: CertificateRow) => {
    setForm({
      operatorName: row.operatorName,
      operatorEmail: "",
      certificateType:
        CERTIFICATE_TYPES.find(t => t.label === row.certificateLabel)?.key ??
        "oit",
      certificateNumber: row.certificateNumber,
      issuedAt: toDateInputValue(row.issuedAt),
      expiresAt: toDateInputValue(row.expiresAt),
    });
    setEditing(row);
  };

  const submitForm = () => {
    if (
      !form.operatorName.trim() ||
      !form.certificateNumber.trim() ||
      !form.expiresAt
    ) {
      toast.error(
        "Operator name, certificate number, and expiry date are required."
      );
      return;
    }
    if (editing) {
      updateMutation.mutate({
        orgId,
        id: editing.id,
        expectedVersion: editing.version,
        operatorName: form.operatorName,
        certificateType: form.certificateType,
        certificateNumber: form.certificateNumber,
        issuedAt: form.issuedAt ? new Date(`${form.issuedAt}T00:00:00Z`) : null,
        expiresAt: new Date(`${form.expiresAt}T00:00:00Z`),
      });
    } else {
      createMutation.mutate({
        orgId,
        operatorName: form.operatorName,
        ...(form.operatorEmail ? { operatorEmail: form.operatorEmail } : {}),
        certificateType: form.certificateType,
        certificateNumber: form.certificateNumber,
        issuedAt: form.issuedAt ? new Date(`${form.issuedAt}T00:00:00Z`) : null,
        expiresAt: new Date(`${form.expiresAt}T00:00:00Z`),
      });
    }
  };

  const onCsvFile = async (file: File) => {
    const generation = ++csvReadGeneration.current;
    setCsvText(null);
    setCsvHeaders([]);
    try {
      const text = await file.text();
      if (generation !== csvReadGeneration.current) return;
      const rows = parseCsv(text);
      const headers = rows[0] ?? [];
      setCsvHeaders(headers);
      const guessed = guessCertificateCsvMapping(headers);
      setMapping({
        operatorName: guessed.operatorName ?? 0,
        certificateType: guessed.certificateType ?? 1,
        certificateNumber: guessed.certificateNumber ?? 2,
        expiresAt: guessed.expiresAt ?? 3,
        issuedAt: guessed.issuedAt ?? -1,
      });
      setCsvText(text);
      setCsvPreview(validateCertificateCsv(text, {
        operatorName: guessed.operatorName ?? 0,
        certificateType: guessed.certificateType ?? 1,
        certificateNumber: guessed.certificateNumber ?? 2,
        expiresAt: guessed.expiresAt ?? 3,
        ...(guessed.issuedAt != null && guessed.issuedAt >= 0 ? { issuedAt: guessed.issuedAt } : {}),
      }));
    } catch (error) {
      if (generation !== csvReadGeneration.current) return;
      toast.error(
        error instanceof Error ? error.message : "Could not read this CSV file."
      );
    }
  };

  const submitImport = () => {
    if (!csvText) return;
    importMutation.mutate({
      orgId,
      csvText,
      mapping: {
        operatorName: mapping.operatorName,
        certificateType: mapping.certificateType,
        certificateNumber: mapping.certificateNumber,
        expiresAt: mapping.expiresAt,
        ...(mapping.issuedAt >= 0 ? { issuedAt: mapping.issuedAt } : {}),
      },
    });
  };

  const refreshPreview = (nextMapping = mapping) => {
    if (!csvText) return;
    try {
      const canonicalMapping = {
        operatorName: nextMapping.operatorName,
        certificateType: nextMapping.certificateType,
        certificateNumber: nextMapping.certificateNumber,
        expiresAt: nextMapping.expiresAt,
        ...(nextMapping.issuedAt >= 0 ? { issuedAt: nextMapping.issuedAt } : {}),
      };
      setCsvPreview(validateCertificateCsv(csvText, canonicalMapping));
    } catch (error) {
      setCsvPreview(null);
      toast.error(error instanceof Error ? error.message : "Could not validate this CSV.");
    }
  };

  const downloadTemplate = () => saveTextFile("Operator name,Certificate type,Certificate number,Expiry date,Issue date (optional)\nAva Chen,Class 1 Water Treatment,ON-1001,2027-03-31,2022-04-01\n", "echelon-certificate-import-template.csv");

  const uploadEvidence = async (file: File) => {
    if (!workflowRow) return;
    if (!(["application/pdf", "image/png", "image/jpeg"] as string[]).includes(file.type) || file.size > 5 * 1024 * 1024) {
      toast.error("Evidence must be a PDF, PNG, or JPEG no larger than 5 MB.");
      return;
    }
    const bytes = new Uint8Array(await file.arrayBuffer());
    let binary = "";
    for (const byte of bytes) binary += String.fromCharCode(byte);
    uploadEvidenceMutation.mutate({ orgId, id: workflowRow.id, fileName: file.name, contentType: file.type as "application/pdf" | "image/png" | "image/jpeg", dataBase64: btoa(binary) });
  };

  const rows = (listQuery.data ?? []) as CertificateRow[];
  const summary = summaryQuery.data;
  const visibleRows = rows.filter(row => {
    const matchesStatus = statusFilter === "all" || (statusFilter === "action" ? row.statusBand !== "current" || (!row.operatorMemberId && row.rosterReviewStatus !== "reviewed_unmatched") || row.rosterReviewStatus === "needs_review" : statusFilter === "unmatched" ? !row.operatorMemberId : statusFilter === "within90" ? row.statusBand === "within30" || row.statusBand === "within90" : row.statusBand === statusFilter);
    const haystack = `${row.operatorName} ${row.certificateLabel} ${row.certificateNumber}`.toLowerCase();
    return matchesStatus && haystack.includes(search.trim().toLowerCase());
  });
  const errorCsv = csvPreview?.failures.length ? ["Row,Original values,Failure reason", ...csvPreview.failures.map(f => [f.rowNumber, f.raw.join(" | "), f.reason].map(csvCell).join(","))].join("\n") : "";
  const blankCsvRows = csvText ? parseCsv(csvText).slice(1).filter(row => row.every(cell => cell.trim() === "")).length : 0;
  const exportRows = ["Operator,Certificate,Number,Issue date,Expiry date,Status,Link state,Follow-up owner,Follow-up status", ...visibleRows.map(row => [row.operatorName, row.certificateLabel, row.certificateNumber, formatDate(row.issuedAt), formatDate(row.expiresAt), BAND_LABELS[row.statusBand], row.operatorMemberId ? "Exact roster match" : "Unmatched — review needed", row.followUpOwner ?? "", row.followUpStatus].map(csvCell).join(","))].join("\n");

  const formFields = (
    <div className="space-y-3">
      {!editing && (
        <div>
          <label className="text-sm font-medium">Operator (from roster)</label>
          <select
            className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
            value={form.operatorEmail}
            onChange={e => {
              const member = operators.find(m => m.email === e.target.value);
              setForm(f => ({
                ...f,
                operatorEmail: e.target.value,
                operatorName: member?.name ?? f.operatorName,
              }));
            }}
          >
            <option value="">Not on the roster / type the name</option>
            {operators.map(m => (
              <option key={m.email} value={m.email}>
                {m.name ? `${m.name} (${m.email})` : m.email}
              </option>
            ))}
          </select>
        </div>
      )}
      <div>
        <label className="text-sm font-medium">
          Operator name (as on the certificate)
        </label>
        <Input
          className="mt-1"
          value={form.operatorName}
          onChange={e => setForm(f => ({ ...f, operatorName: e.target.value }))}
        />
      </div>
      <div>
        <label className="text-sm font-medium">Certificate type</label>
        <select
          className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
          value={form.certificateType}
          onChange={e =>
            setForm(f => ({ ...f, certificateType: e.target.value }))
          }
        >
          {CERTIFICATE_TYPES.map(t => (
            <option key={t.key} value={t.key}>
              {t.label}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="text-sm font-medium">Certificate number</label>
        <Input
          className="mt-1"
          value={form.certificateNumber}
          onChange={e =>
            setForm(f => ({ ...f, certificateNumber: e.target.value }))
          }
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-sm font-medium">Issue date (optional)</label>
          <Input
            className="mt-1"
            type="date"
            value={form.issuedAt}
            onChange={e => setForm(f => ({ ...f, issuedAt: e.target.value }))}
          />
        </div>
        <div>
          <label className="text-sm font-medium">Expiry date</label>
          <Input
            className="mt-1"
            type="date"
            value={form.expiresAt}
            onChange={e => setForm(f => ({ ...f, expiresAt: e.target.value }))}
          />
        </div>
      </div>
    </div>
  );

  return (
    <Card className="mt-6">
      <CardHeader>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <CardTitle>Licence Expiry Tracking</CardTitle>
            <p className="mt-1 text-sm text-slate-600">
              Your operators' provincial certificates and when they expire.
              Managers and operators are emailed at 90, 60, 30, and 7 days
              before expiry, and on the expiry date.
            </p>
          </div>
          <div className="flex gap-2">
            <Button type="button" variant="ghost" onClick={downloadTemplate}>
              <Download className="mr-2 h-4 w-4" /> CSV template
            </Button>
            <Button type="button" variant="outline" onClick={() => { saveTextFile(exportRows, `certificate-register-${new Date().toISOString().slice(0, 10)}.csv`); }}>
              <Download className="mr-2 h-4 w-4" /> Export register
            </Button>
            <Button type="button" variant="outline" onClick={() => window.print()}>
              <FileText className="mr-2 h-4 w-4" /> Print / PDF
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => fileRef.current?.click()}
            >
              <Upload className="mr-2 h-4 w-4" /> Import spreadsheet (CSV)
            </Button>
            <input
              ref={fileRef}
              type="file"
              accept=".csv,text/csv"
              className="hidden"
              onChange={e => {
                const file = e.target.files?.[0];
                if (file) void onCsvFile(file);
                e.target.value = "";
              }}
            />
            <Button type="button" onClick={openAdd}>
              <Plus className="mr-2 h-4 w-4" /> Add certificate
            </Button>
          </div>
        </div>
        {summary && (
          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              { label: "Operators tracked", value: summary.operatorsTracked, filter: "all" },
              { label: "Expiring in 90 days", value: summary.expiringWithin90, filter: "within90" },
              { label: "Expiring in 30 days", value: summary.expiringWithin30, filter: "within30" },
              { label: "Expired", value: summary.expired, filter: "expired" },
            ].map(stat => (
              <button
                key={stat.label}
                type="button"
                onClick={() => setStatusFilter(stat.filter)}
                className="rounded-lg border bg-slate-50 px-4 py-3"
              >
                <div className="text-2xl font-bold">{stat.value}</div>
                <div className="text-xs text-slate-600">{stat.label}</div>
              </button>
            ))}
          </div>
        )}
      </CardHeader>
      <CardContent>
        {csvText && (
          <div className="mb-4 rounded-lg border border-blue-200 bg-blue-50 p-4">
            <p className="text-sm font-medium">
              Match your spreadsheet columns, then import.
            </p>
            <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
              {(
                [
                  ["operatorName", "Operator name"],
                  ["certificateType", "Certificate type"],
                  ["certificateNumber", "Certificate number"],
                  ["expiresAt", "Expiry date"],
                  ["issuedAt", "Issue date (optional)"],
                ] as const
              ).map(([field, label]) => (
                <div key={field}>
                  <label className="text-xs font-medium text-slate-600">
                    {label}
                  </label>
                  <select
                    className="mt-1 w-full rounded-md border px-2 py-1.5 text-sm"
                    value={mapping[field]}
                    onChange={e => {
                      const nextMapping = { ...mapping, [field]: Number(e.target.value) };
                      setMapping(nextMapping);
                      refreshPreview(nextMapping);
                    }}
                  >
                    {field === "issuedAt" && (
                      <option value={-1}>Not in my sheet</option>
                    )}
                    {csvHeaders.map((header, i) => (
                      <option key={i} value={i}>
                        {header || `Column ${i + 1}`}
                      </option>
                    ))}
                  </select>
                </div>
              ))}
            </div>
            <div className="mt-3 flex gap-2">
              <Button
                type="button"
                size="sm"
                onClick={submitImport}
                disabled={importMutation.isPending}
              >
                {importMutation.isPending
                  ? "Importing…"
                  : "Import certificates"}
              </Button>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={() => setCsvText(null)}
              >
                Cancel
              </Button>
            </div>
            <p className="mt-2 text-xs text-slate-600">
              Rows that cannot be imported are reported back with the reason —
              nothing is silently dropped.
            </p>
            {csvPreview && (
              <div className="mt-3 rounded border bg-white p-3 text-xs">
                <div className="flex flex-wrap gap-4 font-medium">
                  <span>{csvPreview.validRows.length + csvPreview.failures.length + blankCsvRows} parsed rows</span>
                  <span>{blankCsvRows} blank rows</span>
                  <span>{csvPreview.validRows.length} likely valid</span>
                  <span>{csvPreview.failures.length} validation failures</span>
                </div>
                {csvPreview.failures.length > 0 && <div className="mt-2 max-h-32 overflow-auto text-red-700">
                  {csvPreview.failures.map(f => <div key={f.rowNumber}>Row {f.rowNumber}: {f.reason}</div>)}
                  <Button className="mt-2" type="button" size="sm" variant="outline" onClick={() => saveTextFile(errorCsv, `certificate-import-errors-${new Date().toISOString().slice(0, 10)}.csv`)}>Download error CSV</Button>
                </div>}
              </div>
            )}
          </div>
        )}

        <div className="mb-4 flex flex-wrap items-center gap-2 border-b pb-4">
          <div className="relative min-w-[220px] flex-1">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-slate-400" />
            <Input aria-label="Search certificate register" className="pl-8" placeholder="Search operator, certificate, or number" value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <select aria-label="Filter certificate register" className="rounded-md border px-3 py-2 text-sm" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
            <option value="all">All records</option><option value="action">Action needed</option><option value="unmatched">Unmatched roster</option><option value="expired">Expired</option><option value="within30">30 days or less</option><option value="within90">90 days or less</option><option value="current">Current</option>
          </select>
          <span className="text-xs text-slate-500">Alerts: {CERTIFICATE_ALERT_THRESHOLDS.join(", ")} days before expiry</span>
        </div>
        {visibleRows.some(row => row.statusBand !== "current" || !row.operatorMemberId || row.rosterReviewStatus === "needs_review") && (
          <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm">
            <strong>Manager action queue:</strong> {visibleRows.filter(row => row.statusBand !== "current" || !row.operatorMemberId || row.rosterReviewStatus === "needs_review").length} record(s) need attention. This is an operational queue, not a compliance determination.
          </div>
        )}

        {listQuery.isLoading ? (
          <p className="text-sm text-slate-500">Loading certificates…</p>
        ) : listQuery.isError ? (
          <p className="text-sm text-red-600">
            Could not load the certificate register.
          </p>
        ) : visibleRows.length === 0 ? (
          <p className="text-sm text-slate-500">
            {rows.length === 0 ? "No certificates tracked yet. Add them one at a time, or import the spreadsheet your team already keeps." : "No records match the current search or filter."}
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-xs uppercase tracking-wide text-slate-500">
                  <th className="py-2 pr-3">Operator</th>
                  <th className="py-2 pr-3">Certificate</th>
                  <th className="py-2 pr-3">Number</th>
                  <th className="py-2 pr-3">Expiry</th>
                  <th className="py-2 pr-3">Status</th>
                  <th className="py-2 pr-3">Renewal prep</th>
                  <th className="py-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {visibleRows.map(row => (
                  <tr key={row.id} className="border-b last:border-0">
                    <td className="py-2 pr-3 font-medium">
                      {row.operatorName}
                    </td>
                    <td className="py-2 pr-3">{row.certificateLabel}</td>
                    <td className="py-2 pr-3">{row.certificateNumber}</td>
                    <td className="py-2 pr-3">
                      {formatDate(row.expiresAt)}
                      <span className="text-slate-500">
                        {" "}
                        (
                        {row.daysUntilExpiry < 0
                          ? `${Math.abs(row.daysUntilExpiry)}d ago`
                          : `${row.daysUntilExpiry}d left`}
                        )
                      </span>
                    </td>
                    <td className="py-2 pr-3">
                      <Badge className={BAND_COLORS[row.statusBand]}>
                        {BAND_LABELS[row.statusBand]}
                      </Badge>
                      <div className="mt-1 text-xs text-slate-500">{row.operatorMemberId ? "Exact roster match" : "Unmatched — review needed"}</div>
                    </td>
                    <td className="py-2 pr-3">
                      {row.coursePath ? (
                        <Link
                          href={row.coursePath}
                          className="text-blue-700 underline"
                        >
                          Open course
                        </Link>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="py-2">
                      <div className="flex gap-1">
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setRenewing(row);
                            setRenewExpiry("");
                            setRenewIssued("");
                          }}
                        >
                          <RotateCw className="mr-1 h-3.5 w-3.5" /> Renew
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          onClick={() => openEdit(row)}
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button type="button" size="sm" variant="outline" onClick={() => { setWorkflowRow(row); setFollowUpOwner(row.followUpOwner ?? ""); setFollowUpStatus((row.followUpStatus as typeof followUpStatus) || "open"); setRosterReviewStatus(row.rosterReviewStatus === "reviewed_unmatched" ? "reviewed_unmatched" : "needs_review"); }}>
                          Follow-up
                        </Button>
                        {confirmRemove?.id === row.id ? (
                          <Button
                            type="button"
                            size="sm"
                            variant="destructive"
                            onClick={() =>
                              removeMutation.mutate({
                                orgId,
                                id: confirmRemove.id,
                                expectedVersion: confirmRemove.expectedVersion,
                              })
                            }
                          >
                            Confirm remove
                          </Button>
                        ) : (
                          <Button
                            type="button"
                            size="sm"
                            variant="ghost"
                            onClick={() =>
                              setConfirmRemove({
                                id: row.id,
                                expectedVersion: row.version,
                              })
                            }
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>

      <Dialog
        open={formOpen || editing !== null}
        onOpenChange={open => {
          if (!open) {
            setFormOpen(false);
            setEditing(null);
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editing ? "Edit certificate" : "Add certificate"}
            </DialogTitle>
            <DialogDescription>
              Record an operator's provincial certificate so expiry alerts can
              be sent before it lapses.
            </DialogDescription>
          </DialogHeader>
          {formFields}
          <DialogFooter>
            <Button
              type="button"
              onClick={submitForm}
              disabled={createMutation.isPending || updateMutation.isPending}
            >
              {editing ? "Save changes" : "Add certificate"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={renewing !== null}
        onOpenChange={open => {
          if (!open) setRenewing(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Mark renewed</DialogTitle>
            <DialogDescription>
              {renewing
                ? `${renewing.operatorName} — ${renewing.certificateLabel} (No. ${renewing.certificateNumber}). Enter the new expiry date from the renewed certificate; the alert cycle restarts from it.`
                : ""}
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium">
                New issue date (optional)
              </label>
              <Input
                className="mt-1"
                type="date"
                value={renewIssued}
                onChange={e => setRenewIssued(e.target.value)}
              />
            </div>
            <div>
              <label className="text-sm font-medium">New expiry date</label>
              <Input
                className="mt-1"
                type="date"
                value={renewExpiry}
                onChange={e => setRenewExpiry(e.target.value)}
              />
            </div>
          </div>
          {renewing?.coursePath && (
            <p className="text-sm text-slate-600">
              Renewal prep:{" "}
              <Link
                href={renewing.coursePath}
                className="text-blue-700 underline"
              >
                open the matching Echelon course
              </Link>{" "}
              for {renewing.operatorName.split(" ")[0]}'s renewal study.
            </p>
          )}
          <DialogFooter>
            <Button
              type="button"
              disabled={!renewExpiry || renewMutation.isPending}
              onClick={() =>
                renewing &&
                renewMutation.mutate({
                  orgId,
                  id: renewing.id,
                  expectedVersion: renewing.version,
                  expiresAt: new Date(`${renewExpiry}T00:00:00Z`),
                  ...(renewIssued
                    ? { issuedAt: new Date(`${renewIssued}T00:00:00Z`) }
                    : {}),
                })
              }
            >
              Save renewal
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={workflowRow !== null} onOpenChange={open => { if (!open) setWorkflowRow(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Manager follow-up</DialogTitle>
            <DialogDescription>
              {workflowRow ? `${workflowRow.operatorName} — ${workflowRow.certificateLabel}` : ""}. Roster links are exact-match only; reviewing an unmatched name does not create an operator account link.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <label className="text-sm font-medium">Follow-up owner (optional)</label>
              <Input className="mt-1" value={followUpOwner} onChange={e => setFollowUpOwner(e.target.value)} placeholder="Manager or team name" />
            </div>
            <div>
              <label className="text-sm font-medium">Follow-up status</label>
              <select id="certificate-follow-up-status" className="mt-1 w-full rounded-md border px-3 py-2 text-sm" value={followUpStatus} onChange={e => setFollowUpStatus(e.target.value as typeof followUpStatus)}>
                <option value="open">Open</option><option value="in_progress">In progress</option><option value="resolved">Resolved</option>
              </select>
            </div>
            {!workflowRow?.operatorMemberId && <div>
              <label className="text-sm font-medium">Roster review</label>
              <select id="certificate-roster-review" className="mt-1 w-full rounded-md border px-3 py-2 text-sm" value={rosterReviewStatus} onChange={e => setRosterReviewStatus(e.target.value as typeof rosterReviewStatus)}>
                <option value="needs_review">Needs review</option><option value="reviewed_unmatched">Reviewed — remains unmatched</option>
              </select>
            </div>}
            <div className="rounded-md border bg-slate-50 p-3">
              <div className="text-sm font-medium">Certificate evidence</div>
              <p className="mt-1 text-xs text-slate-600">Store a PDF or image copy. Manager-reviewed means reviewed by your team, not authenticated by the issuer.</p>
              <Input className="mt-2" type="file" accept="application/pdf,image/png,image/jpeg" disabled={uploadEvidenceMutation.isPending} onChange={e => { const file = e.target.files?.[0]; if (file) void uploadEvidence(file); e.currentTarget.value = ""; }} />
              <div className="mt-2 space-y-1 text-xs">
                {(evidenceQuery.data ?? []).map((e: any) => <div key={e.id} className="flex items-center justify-between gap-2"><span>{e.fileName} {e.reviewedAt ? "• manager-reviewed" : "• awaiting review"}</span>{!e.reviewedAt && <Button type="button" size="sm" variant="outline" onClick={() => reviewEvidenceMutation.mutate({ orgId, evidenceId: e.id })}>Mark reviewed</Button>}</div>)}
              </div>
            </div>
            <div className="rounded-md border p-3">
              <div className="text-sm font-medium">Change history</div>
              <div className="mt-2 max-h-24 space-y-1 overflow-auto text-xs text-slate-600">{(auditQuery.data ?? []).map((entry: any) => <div key={entry.id}>{formatDate(entry.createdAt)} · {entry.action}</div>)}</div>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" disabled={workflowMutation.isPending} onClick={() => {
              if (!workflowRow) return;
              workflowMutation.mutate({ orgId, id: workflowRow.id, expectedVersion: workflowRow.version, followUpOwner: followUpOwner || null, followUpStatus, ...(!workflowRow.operatorMemberId ? { rosterReviewStatus } : {}) });
            }}>Save follow-up</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
