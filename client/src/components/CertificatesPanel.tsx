import { useMemo, useRef, useState } from "react";
import { Link } from "wouter";
import { Pencil, Plus, RotateCw, Trash2, Upload } from "lucide-react";
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
};

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
      invalidate();
    },
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

  const rows = (listQuery.data ?? []) as CertificateRow[];
  const summary = summaryQuery.data;

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
              { label: "Operators tracked", value: summary.operatorsTracked },
              { label: "Expiring in 90 days", value: summary.expiringWithin90 },
              { label: "Expiring in 30 days", value: summary.expiringWithin30 },
              { label: "Expired", value: summary.expired },
            ].map(stat => (
              <div
                key={stat.label}
                className="rounded-lg border bg-slate-50 px-4 py-3"
              >
                <div className="text-2xl font-bold">{stat.value}</div>
                <div className="text-xs text-slate-600">{stat.label}</div>
              </div>
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
                    onChange={e =>
                      setMapping(m => ({
                        ...m,
                        [field]: Number(e.target.value),
                      }))
                    }
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
          </div>
        )}

        {listQuery.isLoading ? (
          <p className="text-sm text-slate-500">Loading certificates…</p>
        ) : listQuery.isError ? (
          <p className="text-sm text-red-600">
            Could not load the certificate register.
          </p>
        ) : rows.length === 0 ? (
          <p className="text-sm text-slate-500">
            No certificates tracked yet. Add them one at a time, or import the
            spreadsheet your team already keeps.
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
                {rows.map(row => (
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
    </Card>
  );
}
