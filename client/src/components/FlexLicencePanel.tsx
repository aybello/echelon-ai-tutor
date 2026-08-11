import { useMemo, useRef, useState } from "react";
import { Download, Plus, RotateCw, Trash2, Upload, UsersRound } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { courseKeyToLabel, resolveCourseKey } from "@shared/courseRegistry";
import { toast } from "sonner";

interface FlexLicencePanelProps {
  orgId: number;
}

interface BulkRow {
  clientRowId: string;
  operatorEmail: string;
  courseKey: string;
}

const STATUS_COLORS: Record<string, string> = {
  unused: "bg-gray-100 text-gray-700",
  invited: "bg-blue-100 text-blue-700",
  assigned: "bg-yellow-100 text-yellow-700",
  active: "bg-green-100 text-green-700",
  expired: "bg-red-100 text-red-700",
  revoked: "bg-red-200 text-red-800",
  suspended: "bg-orange-100 text-orange-700",
};

let rowSequence = 0;
function createRowId(): string {
  rowSequence += 1;
  return `bulk-${Date.now()}-${rowSequence}`;
}

function parseCsvLine(line: string): string[] {
  const fields: string[] = [];
  let field = "";
  let quoted = false;
  for (let index = 0; index < line.length; index += 1) {
    const character = line[index];
    if (character === '"') {
      if (quoted && line[index + 1] === '"') {
        field += '"';
        index += 1;
      } else {
        quoted = !quoted;
      }
    } else if ((character === "," || character === "\t") && !quoted) {
      fields.push(field.trim());
      field = "";
    } else {
      field += character;
    }
  }
  fields.push(field.trim());
  return fields;
}

function parseBulkRows(text: string, defaultCourseKey: string): BulkRow[] {
  const lines = text.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  if (lines.length === 1) {
    const singleLineFields = parseCsvLine(lines[0]);
    const emailList = singleLineFields.length > 1 && singleLineFields.every((field) => field.includes("@"))
      ? singleLineFields
      : (!lines[0].includes(",") && !lines[0].includes("\t") ? lines[0].split(/[;\s]+/).filter(Boolean) : null);
    if (emailList) return emailList.map((operatorEmail) => ({
      clientRowId: createRowId(), operatorEmail, courseKey: defaultCourseKey,
    }));
  }
  return lines.flatMap((line, index) => {
    const fields = parseCsvLine(line);
    if (index === 0 && fields[0]?.toLowerCase().includes("email")) return [];
    const operatorEmail = fields[0] ?? "";
    const importedCourse = fields[1] ?? defaultCourseKey;
    const courseKey = resolveCourseKey(importedCourse)?.courseKey ?? importedCourse;
    return operatorEmail ? [{ clientRowId: createRowId(), operatorEmail, courseKey }] : [];
  });
}

function csvCell(value: unknown): string {
  const text = value == null ? "" : String(value);
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

export function FlexLicencePanel({ orgId }: FlexLicencePanelProps) {
  const [inviteEmail, setInviteEmail] = useState<Record<number, string>>({});
  const [invitingId, setInvitingId] = useState<number | null>(null);
  const [bulkOpen, setBulkOpen] = useState(false);
  const [bulkText, setBulkText] = useState("");
  const [bulkRows, setBulkRows] = useState<BulkRow[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const licencesQuery = trpc.teamFlex.listLicences.useQuery({ orgId });
  const inviteMutation = trpc.teamFlex.inviteLicence.useMutation({
    onSuccess: () => {
      toast.success("Invitation sent");
      licencesQuery.refetch();
      setInvitingId(null);
    },
    onError: (err) => toast.error(err.message),
  });
  const resendMutation = trpc.teamFlex.resendInvitation.useMutation({
    onSuccess: () => toast.success("Invitation resent"),
    onError: (err) => toast.error(err.message),
  });
  const cancelMutation = trpc.teamFlex.cancelInvitation.useMutation({
    onSuccess: () => {
      toast.success("Invitation cancelled");
      licencesQuery.refetch();
    },
    onError: (err) => toast.error(err.message),
  });
  const previewMutation = trpc.teamFlex.previewBulkOnboarding.useMutation({
    onError: (err) => toast.error(err.message),
  });
  const sendBulkMutation = trpc.teamFlex.bulkInviteLicences.useMutation({
    onSuccess: (data) => {
      if (!data.preview.valid) {
        toast.error("Fix the highlighted rows before sending invitations.");
        return;
      }
      const sent = data.results.filter((result) => result.invitationSent).length;
      const failed = data.results.length - sent;
      toast.success(`${sent} invitation${sent === 1 ? "" : "s"} sent${failed ? `; ${failed} failed and can be retried` : ""}.`);
      licencesQuery.refetch();
    },
    onError: (err) => toast.error(err.message),
  });

  const licences = licencesQuery.data ?? [];
  const courseOptions = useMemo(() => {
    const options = new Map<string, string>();
    for (const licence of licences) {
      const course = resolveCourseKey(licence.courseKey);
      const key = course?.courseKey ?? licence.courseKey;
      options.set(key, course?.displayName ?? courseKeyToLabel(key));
    }
    return Array.from(options.entries()).map(([key, label]) => ({ key, label })).sort((a, b) => a.label.localeCompare(b.label));
  }, [licences]);

  if (licences.length === 0) return null;

  const resetValidation = () => {
    previewMutation.reset();
    sendBulkMutation.reset();
  };
  const updateBulkRow = (clientRowId: string, patch: Partial<BulkRow>) => {
    setBulkRows((rows) => rows.map((row) => row.clientRowId === clientRowId ? { ...row, ...patch } : row));
    resetValidation();
  };
  const addBulkRow = () => {
    setBulkRows((rows) => [...rows, { clientRowId: createRowId(), operatorEmail: "", courseKey: courseOptions[0]?.key ?? "" }]);
    resetValidation();
  };
  const importText = (text: string) => {
    const parsed = parseBulkRows(text, courseOptions[0]?.key ?? "");
    if (parsed.length === 0) {
      toast.error("No operator rows were found.");
      return;
    }
    setBulkRows(parsed);
    resetValidation();
  };
  const openBulk = () => {
    setBulkOpen(true);
    if (bulkRows.length === 0) setBulkRows([{ clientRowId: createRowId(), operatorEmail: "", courseKey: courseOptions[0]?.key ?? "" }]);
  };
  const exportReport = () => {
    const headers = ["licence_id", "operator_email", "course", "term_months", "status", "invited_at", "activated_at", "access_ends_at", "activation_deadline"];
    const rows = licences.map((licence) => [
      licence.id, licence.invitedEmail, resolveCourseKey(licence.courseKey)?.courseKey ?? licence.courseKey,
      licence.termMonths, licence.status, licence.invitedAt ? new Date(licence.invitedAt).toISOString() : "",
      licence.activatedAt ? new Date(licence.activatedAt).toISOString() : "",
      licence.accessEndsAt ? new Date(licence.accessEndsAt).toISOString() : "",
      new Date(licence.activationDeadline).toISOString(),
    ]);
    const blob = new Blob([[headers, ...rows].map((row) => row.map(csvCell).join(",")).join("\n")], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `echelon-course-pass-onboarding-${new Date().toISOString().slice(0, 10)}.csv`;
    anchor.click();
    URL.revokeObjectURL(url);
  };
  const failedRows = sendBulkMutation.data?.results.filter((result) => !result.invitationSent) ?? [];
  const activePreview = sendBulkMutation.data?.preview ?? previewMutation.data;
  const retryFailed = () => {
    const failedIds = new Set(failedRows.map((row) => row.clientRowId));
    sendBulkMutation.mutate({ orgId, rows: bulkRows.filter((row) => failedIds.has(row.clientRowId)) });
  };

  return (
    <>
      <Card className="mt-6">
        <CardHeader className="gap-3 sm:flex-row sm:items-center sm:justify-between">
          <CardTitle className="flex flex-wrap items-center gap-2">
            <span>Course Passes</span>
            <Badge variant="outline" className="text-xs">
              {licences.filter((licence) => licence.status === "active").length} active / {licences.length} total
            </Badge>
          </CardTitle>
          <div className="flex flex-wrap gap-2">
            <Button size="sm" variant="outline" onClick={exportReport}><Download className="mr-1.5 h-4 w-4" />Export report</Button>
            <Button size="sm" onClick={openBulk}><UsersRound className="mr-1.5 h-4 w-4" />Bulk onboard</Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[820px] text-sm">
              <thead><tr className="border-b text-left text-muted-foreground">
                <th className="pb-2 pr-4">Course</th><th className="pb-2 pr-4">Term</th><th className="pb-2 pr-4">Status</th>
                <th className="pb-2 pr-4">Operator</th><th className="pb-2 pr-4">Access ends</th><th className="pb-2">Actions</th>
              </tr></thead>
              <tbody>{licences.map((licence) => (
                <tr key={licence.id} className="border-b last:border-0">
                  <td className="py-2 pr-4 font-medium">{courseKeyToLabel(licence.courseKey)}</td>
                  <td className="py-2 pr-4">{licence.termMonths}mo</td>
                  <td className="py-2 pr-4"><span className={`inline-block rounded px-2 py-0.5 text-xs font-medium ${STATUS_COLORS[licence.status] ?? "bg-gray-100"}`}>{licence.status}</span></td>
                  <td className="py-2 pr-4 text-muted-foreground">{licence.invitedEmail ?? (licence.operatorUserId ? `User #${licence.operatorUserId}` : "—")}</td>
                  <td className="py-2 pr-4 text-muted-foreground">{licence.accessEndsAt ? new Date(licence.accessEndsAt).toLocaleDateString() : "—"}</td>
                  <td className="py-2">
                    {licence.status === "unused" && (invitingId === licence.id ? (
                      <div className="flex items-center gap-1">
                        <Input type="email" placeholder="operator@email.com" className="h-7 w-44 text-xs" value={inviteEmail[licence.id] ?? ""} onChange={(event) => setInviteEmail((current) => ({ ...current, [licence.id]: event.target.value }))} />
                        <Button size="sm" className="h-7 text-xs" disabled={!inviteEmail[licence.id] || inviteMutation.isPending} onClick={() => inviteMutation.mutate({ licenceId: licence.id, operatorEmail: inviteEmail[licence.id] ?? "", orgId })}>Send</Button>
                        <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => setInvitingId(null)}>Cancel</Button>
                      </div>
                    ) : <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => setInvitingId(licence.id)}>Invite</Button>)}
                    {licence.status === "invited" && <div className="flex gap-1">
                      <Button size="sm" variant="ghost" className="h-7 text-xs" disabled={resendMutation.isPending} onClick={() => resendMutation.mutate({ licenceId: licence.id, orgId })}><RotateCw className="mr-1 h-3 w-3" />Resend</Button>
                      <Button size="sm" variant="ghost" className="h-7 text-xs text-red-600" onClick={() => cancelMutation.mutate({ licenceId: licence.id, orgId })}>Cancel</Button>
                    </div>}
                  </td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={bulkOpen} onOpenChange={setBulkOpen}>
        <DialogContent className="max-h-[92vh] w-[calc(100vw-2rem)] max-w-5xl overflow-y-auto overflow-x-hidden bg-white">
          <DialogHeader>
            <DialogTitle>Bulk onboard Course Pass operators</DialogTitle>
            <DialogDescription>Paste or upload the cohort, map every operator to a paid course licence, validate inventory, then send invitations as one controlled batch.</DialogDescription>
          </DialogHeader>

          <div className="space-y-5 py-2">
            <div className="grid gap-3 lg:grid-cols-[1fr_auto]">
              <Textarea value={bulkText} onChange={(event) => setBulkText(event.target.value)} placeholder={"operator1@utility.ca,wpi-class1-water-coll\noperator2@utility.ca,wpi-class2-water-coll"} rows={4} className="min-w-0 resize-none" />
              <div className="flex flex-wrap content-start gap-2 lg:w-52 lg:flex-col">
                <Button variant="outline" onClick={() => importText(bulkText)} disabled={!bulkText.trim()}><Plus className="mr-1.5 h-4 w-4" />Import pasted rows</Button>
                <Button variant="outline" onClick={() => fileInputRef.current?.click()}><Upload className="mr-1.5 h-4 w-4" />Upload CSV</Button>
                <input ref={fileInputRef} type="file" accept=".csv,text/csv,text/plain" className="hidden" onChange={async (event) => {
                  const file = event.target.files?.[0];
                  if (file) importText(await file.text());
                  event.target.value = "";
                }} />
                <Button variant="ghost" onClick={addBulkRow}><Plus className="mr-1.5 h-4 w-4" />Add blank row</Button>
              </div>
            </div>

            <div className="max-w-full overflow-x-auto rounded-lg border border-slate-200">
              <table className="min-w-[760px] w-full text-sm">
                <thead className="bg-slate-50 text-left text-slate-500"><tr><th className="p-3">#</th><th className="p-3">Operator email</th><th className="p-3">Course Pass</th><th className="p-3">Validation</th><th className="p-3"><span className="sr-only">Remove</span></th></tr></thead>
                <tbody>{bulkRows.map((row, index) => {
                  const validation = activePreview?.rows.find((result) => result.clientRowId === row.clientRowId);
                  const sendResult = sendBulkMutation.data?.results.find((result) => result.clientRowId === row.clientRowId);
                  return <tr key={row.clientRowId} className="border-t border-slate-100 align-top">
                    <td className="p-3 text-slate-400">{index + 1}</td>
                    <td className="p-3"><Input type="email" value={row.operatorEmail} onChange={(event) => updateBulkRow(row.clientRowId, { operatorEmail: event.target.value })} placeholder="operator@utility.ca" className="min-w-56" /></td>
                    <td className="p-3"><select value={row.courseKey} onChange={(event) => updateBulkRow(row.clientRowId, { courseKey: event.target.value })} className="h-9 min-w-64 rounded-md border border-input bg-transparent px-3 text-sm">
                      <option value="">Select course</option>{courseOptions.map((option) => <option key={option.key} value={option.key}>{option.label}</option>)}
                    </select></td>
                    <td className="p-3 text-xs">{sendResult ? <span className={sendResult.invitationSent ? "text-green-700" : "text-red-600"}>{sendResult.invitationSent ? "Invitation sent" : sendResult.error}</span> : validation ? <span className={validation.valid ? "text-green-700" : "text-red-600"}>{validation.valid ? `Ready · licence #${validation.licenceId}` : validation.error}</span> : <span className="text-slate-400">Not validated</span>}</td>
                    <td className="p-3"><Button size="icon" variant="ghost" aria-label={`Remove row ${index + 1}`} onClick={() => { setBulkRows((rows) => rows.filter((item) => item.clientRowId !== row.clientRowId)); resetValidation(); }}><Trash2 className="h-4 w-4 text-slate-400" /></Button></td>
                  </tr>;
                })}</tbody>
              </table>
            </div>

            {activePreview && <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2 text-sm"><span className="font-semibold text-slate-800">Inventory check</span><span className={activePreview.valid ? "text-green-700" : "text-red-600"}>{activePreview.valid ? `${activePreview.requested} rows ready` : "Cohort needs corrections"}</span></div>
              <div className="flex max-w-full gap-2 overflow-x-auto pb-1">{activePreview.inventory.map((item) => <Badge key={item.courseKey} variant="outline" className="shrink-0 bg-white">{item.courseName}: {item.unused} unused / {item.total}</Badge>)}</div>
            </div>}
          </div>

          <DialogFooter className="flex-col gap-2 sm:flex-row sm:justify-between">
            <div>{failedRows.length > 0 && <Button variant="outline" onClick={retryFailed} disabled={sendBulkMutation.isPending}><RotateCw className="mr-1.5 h-4 w-4" />Retry {failedRows.length} failed</Button>}</div>
            <div className="flex flex-wrap justify-end gap-2">
              <Button variant="ghost" onClick={() => setBulkOpen(false)}>Close</Button>
              <Button variant="outline" disabled={bulkRows.length === 0 || previewMutation.isPending} onClick={() => previewMutation.mutate({ orgId, rows: bulkRows })}>{previewMutation.isPending ? "Validating…" : "Validate cohort"}</Button>
              <Button disabled={!activePreview?.valid || sendBulkMutation.isPending || !!sendBulkMutation.data} onClick={() => sendBulkMutation.mutate({ orgId, rows: bulkRows })}>{sendBulkMutation.isPending ? "Sending…" : `Send ${bulkRows.length} invitations`}</Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
