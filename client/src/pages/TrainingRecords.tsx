import { useEffect, useMemo, useState } from "react";
import { Link, useLocation } from "wouter";
import { toast } from "sonner";
import {
  ArrowLeft,
  BookOpenCheck,
  CheckCircle2,
  ChevronDown,
  ClipboardList,
  ExternalLink,
  FilePlus2,
  Loader2,
  Printer,
  ShieldCheck,
  Trash2,
  Users,
} from "lucide-react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import SiteNav from "@/components/SiteNav";

type TrainingRecordView = "manager" | "operator";

type TrainingRecordsProps = { view: TrainingRecordView };

const OWWCO_TRAINING_GUIDANCE_URL = "https://www.ontario.ca/page/training-requirements-drinking-water-operators";

const PRINT_STYLES = `
  .ojt-print-shell { font-family: Arial, sans-serif; color: #0f172a; }
  .ojt-print-only { display: none; }
  @media print {
    @page { size: portrait; margin: 12mm; }
    body { background: #fff !important; }
    body * { visibility: hidden !important; }
    .ojt-print-shell, .ojt-print-shell * { visibility: visible !important; }
    .ojt-print-shell { position: absolute; inset: 0; width: 100%; background: #fff !important; }
    .ojt-print-only { display: block !important; }
    .ojt-hide-on-print { display: none !important; }
    .ojt-record-card, .ojt-evidence-card { box-shadow: none !important; break-inside: avoid; }
    .ojt-evidence-card { display: none !important; }
    .ojt-record-table { font-size: 10px !important; }
  }
`;

function dateKey(date: Date) {
  return date.toISOString().slice(0, 10);
}

function firstDayOfYear() {
  return `${new Date().getFullYear()}-01-01`;
}

function displayDate(value: string | Date) {
  return new Date(value).toLocaleDateString("en-CA", { year: "numeric", month: "short", day: "numeric" });
}

function hoursLabel(hours: number) {
  return `${hours.toFixed(hours % 1 === 0 ? 0 : 2)} hour${hours === 1 ? "" : "s"}`;
}

function TrainingRecordHeader({
  view,
  title,
  subtitle,
}: {
  view: TrainingRecordView;
  title: string;
  subtitle: string;
}) {
  const [, navigate] = useLocation();
  return (
    <header className="ojt-hide-on-print border-b border-slate-200 bg-white">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-4 py-4 sm:px-6">
        <div className="flex min-w-0 items-center gap-3">
          <button
            className="rounded-lg border border-slate-200 p-2 text-slate-500 transition-colors hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
            onClick={() => navigate(view === "manager" ? "/team" : "/dashboard")}
            aria-label="Return to dashboard"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div>
            <div className="text-xs font-semibold uppercase tracking-[0.14em] text-blue-700">Echelon Institute</div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900">{title}</h1>
            <p className="text-sm text-slate-500">{subtitle}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-xs text-slate-500">
          {view === "manager" ? <Users className="h-4 w-4 text-blue-600" /> : <BookOpenCheck className="h-4 w-4 text-blue-600" />}
          {view === "manager" ? "Manager access" : "Operator access"}
        </div>
      </div>
    </header>
  );
}

function Guardrail({ compact = false }: { compact?: boolean }) {
  return (
    <div className={`ojt-hide-on-print rounded-xl border border-blue-100 bg-blue-50 ${compact ? "p-3" : "p-4"}`}>
      <div className="flex gap-3">
        <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-blue-700" />
        <div className="min-w-0">
          <p className="text-sm font-semibold text-blue-950">Supervisor-reviewed training record</p>
          <p className="mt-1 text-xs leading-relaxed text-blue-800">
            Echelon Institute does not award OJT or CEU credit. Use this record only after a qualified supervisor confirms the facilitated learning event, its objectives, and its relevance to the operator’s duties. Ontario guidance also limits OJT claims to seven hours per day.
          </p>
          <a className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-blue-700 underline underline-offset-2 hover:text-blue-950" href={OWWCO_TRAINING_GUIDANCE_URL} target="_blank" rel="noreferrer">
            Review Ontario OJT guidance <ExternalLink className="h-3 w-3" />
          </a>
        </div>
      </div>
    </div>
  );
}

function LoadingRecord() {
  return (
    <div className="flex min-h-[45vh] items-center justify-center gap-3 text-sm text-slate-500">
      <Loader2 className="h-5 w-5 animate-spin text-blue-600" /> Preparing training record…
    </div>
  );
}

export default function TrainingRecords({ view }: TrainingRecordsProps) {
  const [, navigate] = useLocation();
  const isManager = view === "manager";
  const [startDate, setStartDate] = useState(firstDayOfYear);
  const [endDate, setEndDate] = useState(() => dateKey(new Date()));
  const [selectedMemberId, setSelectedMemberId] = useState<number | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [form, setForm] = useState({
    sessionDate: dateKey(new Date()),
    topics: "",
    learningObjectives: "",
    providerName: "",
    providerPhone: "",
    durationHours: "1",
    structuredLearningConfirmed: false,
  });
  const utils = trpc.useUtils();
  const operatorsQuery = trpc.trainingRecords.listManagerOperators.useQuery(undefined, { enabled: isManager, retry: false });

  useEffect(() => {
    if (!isManager || selectedMemberId || !operatorsQuery.data?.operators.length) return;
    const activeOperator = operatorsQuery.data.operators.find(operator => operator.status === "assigned");
    setSelectedMemberId((activeOperator ?? operatorsQuery.data.operators[0]).id);
  }, [isManager, operatorsQuery.data, selectedMemberId]);

  const managerInput = useMemo(
    () => selectedMemberId ? { memberId: selectedMemberId, startDate, endDate } : undefined,
    [selectedMemberId, startDate, endDate],
  );
  const managerReportQuery = trpc.trainingRecords.managerReport.useQuery(managerInput!, {
    enabled: isManager && !!managerInput,
    retry: false,
  });
  const operatorReportQuery = trpc.trainingRecords.myReport.useQuery({ startDate, endDate }, {
    enabled: !isManager,
    retry: false,
  });
  const reportQuery = isManager ? managerReportQuery : operatorReportQuery;
  const report = reportQuery.data;

  const createRecord = trpc.trainingRecords.create.useMutation({
    onSuccess: () => {
      toast.success("Training record saved for supervisor review.");
      setCreateOpen(false);
      setForm({ sessionDate: dateKey(new Date()), topics: "", learningObjectives: "", providerName: "", providerPhone: "", durationHours: "1", structuredLearningConfirmed: false });
      if (managerInput) utils.trainingRecords.managerReport.invalidate(managerInput);
    },
    onError: error => toast.error(error.message),
  });
  const deleteRecord = trpc.trainingRecords.delete.useMutation({
    onSuccess: () => {
      toast.success("Training record removed.");
      if (managerInput) utils.trainingRecords.managerReport.invalidate(managerInput);
    },
    onError: error => toast.error(error.message),
  });

  const handlePrint = () => {
    if (!report) return;
    const originalTitle = document.title;
    document.title = `${report.operator.name ?? report.operator.email} — OJT Training Record`;
    const restoreTitle = () => {
      document.title = originalTitle;
      window.removeEventListener("afterprint", restoreTitle);
    };
    window.addEventListener("afterprint", restoreTitle);
    window.print();
  };

  const handleCreate = () => {
    if (!selectedMemberId) return;
    const durationHours = Number(form.durationHours);
    if (!Number.isFinite(durationHours) || durationHours < 0.25 || durationHours > 7) {
      toast.error("Enter a duration from 0.25 to 7 hours.");
      return;
    }
    if (!form.structuredLearningConfirmed) {
      toast.error("Confirm the learning event was structured and facilitator-led before saving.");
      return;
    }
    createRecord.mutate({
      memberId: selectedMemberId,
      sessionDate: form.sessionDate,
      topics: form.topics,
      learningObjectives: form.learningObjectives,
      providerName: form.providerName,
      providerPhone: form.providerPhone || undefined,
      durationHours,
      structuredLearningConfirmed: true,
    });
  };

  if (isManager && operatorsQuery.isLoading) {
    return <><TrainingRecordHeader view={view} title="Training Records" subtitle="Prepare a supervisor-reviewed OJT record for each operator." /><LoadingRecord /></>;
  }
  if (isManager && !operatorsQuery.data?.operators.length) {
    return (
      <div className="min-h-screen bg-slate-50">
        <TrainingRecordHeader view={view} title="Training Records" subtitle="Prepare a supervisor-reviewed OJT record for each operator." />
        <main className="mx-auto max-w-3xl px-4 py-10 sm:px-6"><div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center shadow-sm"><Users className="mx-auto h-10 w-10 text-slate-300" /><h2 className="mt-4 text-lg font-semibold text-slate-900">No operators are available</h2><p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-slate-500">Assign an operator seat before creating a training record. Records are intentionally scoped to operators in your organization.</p><Button className="mt-5 bg-blue-600 hover:bg-blue-700" onClick={() => navigate("/team")}>Return to team dashboard</Button></div></main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <style>{PRINT_STYLES}</style>
      {!isManager && <SiteNav currentPath="/training-record" />}
      <TrainingRecordHeader
        view={view}
        title={isManager ? "Operator Training Records" : "My Training Record"}
        subtitle={isManager ? "Document structured, facilitated training before supervisor sign-off." : "View the training records your organization has prepared for supervisor review."}
      />

      <main className="ojt-print-shell mx-auto max-w-6xl px-4 py-7 sm:px-6 sm:py-9">
        <div className="ojt-hide-on-print mb-6"><Guardrail /></div>

        {isManager && (
          <section className="ojt-hide-on-print mb-6 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div className="grid w-full grid-cols-1 gap-3 sm:grid-cols-3 lg:max-w-3xl">
                <div className="space-y-1.5"><Label htmlFor="operator">Operator</Label><div className="relative"><select id="operator" value={selectedMemberId ?? ""} onChange={event => setSelectedMemberId(Number(event.target.value))} className="h-10 w-full appearance-none rounded-md border border-slate-200 bg-white px-3 pr-9 text-sm text-slate-700 outline-none ring-offset-background focus:ring-2 focus:ring-blue-600 focus:ring-offset-2">{operatorsQuery.data?.operators.map(operator => <option key={operator.id} value={operator.id}>{operator.name ?? operator.email} {operator.name ? `(${operator.email})` : ""}{operator.status !== "assigned" ? " — revoked" : ""}</option>)}</select><ChevronDown className="pointer-events-none absolute right-3 top-3 h-4 w-4 text-slate-400" /></div></div>
                <div className="space-y-1.5"><Label htmlFor="startDate">From</Label><Input id="startDate" type="date" value={startDate} max={endDate} onChange={event => setStartDate(event.target.value)} /></div>
                <div className="space-y-1.5"><Label htmlFor="endDate">To</Label><Input id="endDate" type="date" value={endDate} min={startDate} max={dateKey(new Date())} onChange={event => setEndDate(event.target.value)} /></div>
              </div>
              <Button className="bg-blue-600 hover:bg-blue-700" onClick={() => setCreateOpen(true)} disabled={!selectedMemberId}><FilePlus2 className="mr-1.5 h-4 w-4" />Add training record</Button>
            </div>
          </section>
        )}

        {!isManager && (
          <section className="ojt-hide-on-print mb-6 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end"><div className="space-y-1.5"><Label htmlFor="operator-start">From</Label><Input id="operator-start" type="date" value={startDate} max={endDate} onChange={event => setStartDate(event.target.value)} /></div><div className="space-y-1.5"><Label htmlFor="operator-end">To</Label><Input id="operator-end" type="date" value={endDate} min={startDate} max={dateKey(new Date())} onChange={event => setEndDate(event.target.value)} /></div></div>
          </section>
        )}

        {reportQuery.isLoading ? <LoadingRecord /> : reportQuery.error ? (
          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6 text-center"><ClipboardList className="mx-auto h-9 w-9 text-amber-500" /><h2 className="mt-3 font-semibold text-amber-950">Training record unavailable</h2><p className="mx-auto mt-1 max-w-lg text-sm text-amber-800">{reportQuery.error.message}</p>{!isManager && <Link href="/dashboard"><Button variant="outline" className="mt-4">Return to dashboard</Button></Link>}</div>
        ) : report ? (
          <>
            <section className="ojt-record-card overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className="border-b border-slate-200 bg-gradient-to-r from-slate-950 to-blue-950 px-5 py-5 text-white sm:px-7">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div><div className="text-xs font-semibold uppercase tracking-[0.16em] text-blue-200">Echelon Institute · supervisor-reviewed record</div><h2 className="mt-1 text-2xl font-bold tracking-tight">On-the-Job Practical Training</h2><p className="mt-1 text-sm text-blue-100">{report.organization.name} · {displayDate(report.range.startDate)} to {displayDate(report.range.endDate)}</p></div>
                  <div className="ojt-hide-on-print flex flex-wrap gap-2"><Button size="sm" className="bg-white text-blue-800 hover:bg-blue-50" onClick={handlePrint}><Printer className="mr-1.5 h-4 w-4" />Print / Save PDF</Button></div>
                </div>
              </div>
              <div className="grid gap-3 border-b border-slate-200 bg-slate-50 px-5 py-4 text-sm sm:grid-cols-3 sm:px-7"><div><p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Operator</p><p className="mt-1 font-semibold text-slate-900">{report.operator.name ?? report.operator.email}</p><p className="text-xs text-slate-500">{report.operator.name ? report.operator.email : ""}</p></div><div><p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Training period</p><p className="mt-1 font-medium text-slate-800">{displayDate(report.range.startDate)} — {displayDate(report.range.endDate)}</p></div><div><p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Supervisor-entered hours</p><p className="mt-1 text-xl font-bold text-blue-700">{hoursLabel(report.totalHours)}</p></div></div>

              <div className="overflow-x-auto px-5 py-5 sm:px-7"><table className="ojt-record-table w-full min-w-[760px] border-collapse text-left text-sm"><thead><tr className="border-b-2 border-slate-300 text-[11px] font-semibold uppercase tracking-wider text-slate-500"><th className="w-[11%] px-2 py-2.5">Date</th><th className="w-[27%] px-2 py-2.5">Topic(s) / event</th><th className="w-[24%] px-2 py-2.5">Learning objectives</th><th className="w-[21%] px-2 py-2.5">Provider / instructor</th><th className="w-[9%] px-2 py-2.5 text-right">Hours</th>{isManager && <th className="ojt-hide-on-print w-[8%] px-2 py-2.5" />}</tr></thead><tbody>{report.records.map(record => <tr key={record.id} className="border-b border-slate-100 align-top"><td className="px-2 py-3 text-xs font-medium text-slate-700">{displayDate(record.sessionDate)}</td><td className="px-2 py-3"><p className="font-medium text-slate-900">{record.topics}</p><p className="mt-1 text-xs text-slate-500">{record.courseLabel}</p></td><td className="px-2 py-3 text-xs leading-relaxed text-slate-600">{record.learningObjectives}</td><td className="px-2 py-3"><p className="text-xs font-medium text-slate-800">{record.providerName}</p>{record.providerPhone && <p className="mt-1 text-xs text-slate-500">{record.providerPhone}</p>}</td><td className="px-2 py-3 text-right text-sm font-bold text-slate-800">{record.durationHours.toFixed(record.durationHours % 1 === 0 ? 0 : 2)}</td>{isManager && <td className="ojt-hide-on-print px-2 py-3 text-right"><button className="rounded-md p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600" aria-label="Remove training record" onClick={() => { if (window.confirm("Remove this training record?")) deleteRecord.mutate({ id: record.id }); }} disabled={deleteRecord.isPending}><Trash2 className="h-3.5 w-3.5" /></button></td>}</tr>)}{report.records.length === 0 && <tr><td colSpan={isManager ? 6 : 5} className="px-2 py-10 text-center text-sm text-slate-500"><ClipboardList className="mx-auto mb-2 h-7 w-7 text-slate-300" />No supervisor-entered training records fall in this period.</td></tr>}</tbody><tfoot><tr className="border-t-2 border-slate-300"><td colSpan={4} className="px-2 py-3 text-right text-xs font-semibold uppercase tracking-wider text-slate-600">Total hours</td><td className="px-2 py-3 text-right text-base font-bold text-blue-700">{report.totalHours.toFixed(report.totalHours % 1 === 0 ? 0 : 2)}</td>{isManager && <td className="ojt-hide-on-print" />}</tr></tfoot></table></div>
              <div className="ojt-print-only border-t border-slate-200 px-7 py-5"><p className="text-xs leading-relaxed text-slate-600">This document is a training record prepared for supervisor review. The operator and authorized supervisor are responsible for confirming accuracy, eligibility, and any required submission under applicable rules.</p><div className="mt-10 grid grid-cols-2 gap-10 text-sm"><div><div className="border-b border-slate-500 pb-1" /><p className="mt-2 text-xs text-slate-600">Signature of operator · Name of operator</p></div><div><div className="border-b border-slate-500 pb-1" /><p className="mt-2 text-xs text-slate-600">Signature of supervisor · Title</p></div></div></div>
            </section>

            <section className="ojt-evidence-card ojt-hide-on-print mt-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6"><div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between"><div><div className="flex items-center gap-2"><BookOpenCheck className="h-5 w-5 text-blue-600" /><h2 className="font-semibold text-slate-900">Supporting Echelon Institute study activity</h2></div><p className="mt-1 max-w-3xl text-sm leading-relaxed text-slate-500">This shows platform study activity in the selected period. It is supporting context only; it is not automatically assigned a duration and does not by itself establish OJT eligibility.</p></div><div className="rounded-lg bg-slate-100 px-3 py-2 text-center"><div className="text-lg font-bold text-slate-900">{report.activity.reduce((total, day) => total + day.questionCount, 0).toLocaleString()}</div><div className="text-[11px] font-medium uppercase tracking-wide text-slate-500">questions answered</div></div></div><div className="mt-5 overflow-x-auto"><table className="w-full min-w-[600px] text-left text-sm"><thead><tr className="border-b border-slate-200 text-[11px] font-semibold uppercase tracking-wider text-slate-500"><th className="px-2 py-2">Study date</th><th className="px-2 py-2">Course</th><th className="px-2 py-2">Topics reviewed</th><th className="px-2 py-2 text-right">Questions</th></tr></thead><tbody>{report.activity.map((activity, index) => <tr key={`${activity.date}-${activity.courseKey ?? index}`} className="border-b border-slate-100"><td className="px-2 py-2.5 text-xs font-medium text-slate-700">{displayDate(activity.date)}</td><td className="px-2 py-2.5 text-xs text-slate-600">{activity.courseLabel}</td><td className="px-2 py-2.5 text-xs text-slate-600">{activity.topics.join(", ") || "—"}</td><td className="px-2 py-2.5 text-right text-xs font-semibold text-slate-800">{activity.questionCount}</td></tr>)}{report.activity.length === 0 && <tr><td colSpan={4} className="px-2 py-8 text-center text-sm text-slate-500">No Echelon Institute practice activity is recorded in this period.</td></tr>}</tbody></table></div></section>
          </>
        ) : null}
      </main>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl"><DialogHeader><DialogTitle>Add a training record</DialogTitle><DialogDescription>Complete this only for a structured, facilitator-led event that the supervisor has reviewed for relevance and documentation.</DialogDescription></DialogHeader><div className="grid gap-4 py-2 sm:grid-cols-2"><div className="space-y-1.5"><Label htmlFor="sessionDate">Training session date</Label><Input id="sessionDate" type="date" value={form.sessionDate} max={dateKey(new Date())} onChange={event => setForm(current => ({ ...current, sessionDate: event.target.value }))} /></div><div className="space-y-1.5"><Label htmlFor="durationHours">Duration (hours)</Label><Input id="durationHours" type="number" inputMode="decimal" min="0.25" max="7" step="0.25" value={form.durationHours} onChange={event => setForm(current => ({ ...current, durationHours: event.target.value }))} /></div><div className="space-y-1.5 sm:col-span-2"><Label htmlFor="topics">Topic(s) of training / course name</Label><Textarea id="topics" rows={3} placeholder="For example: Facilitated review of pump-station operating procedures and emergency response." value={form.topics} onChange={event => setForm(current => ({ ...current, topics: event.target.value }))} /></div><div className="space-y-1.5 sm:col-span-2"><Label htmlFor="objectives">Documented learning objectives</Label><Textarea id="objectives" rows={3} placeholder="What the operator will know or be able to do after the session." value={form.learningObjectives} onChange={event => setForm(current => ({ ...current, learningObjectives: event.target.value }))} /></div><div className="space-y-1.5"><Label htmlFor="providerName">Training provider / instructor</Label><Input id="providerName" value={form.providerName} onChange={event => setForm(current => ({ ...current, providerName: event.target.value }))} /></div><div className="space-y-1.5"><Label htmlFor="providerPhone">Provider contact (if external)</Label><Input id="providerPhone" type="tel" value={form.providerPhone} onChange={event => setForm(current => ({ ...current, providerPhone: event.target.value }))} /></div><label className="flex cursor-pointer items-start gap-3 rounded-xl border border-blue-100 bg-blue-50 p-3 sm:col-span-2"><input className="mt-0.5 h-4 w-4 accent-blue-600" type="checkbox" checked={form.structuredLearningConfirmed} onChange={event => setForm(current => ({ ...current, structuredLearningConfirmed: event.target.checked }))} /><span className="text-xs leading-relaxed text-blue-900">I confirm that this is a structured, facilitator-led learning event with documented objectives. The supervisor will verify whether it qualifies under the applicable requirements before it is claimed.</span></label></div><DialogFooter><Button variant="outline" onClick={() => setCreateOpen(false)}>Cancel</Button><Button className="bg-blue-600 hover:bg-blue-700" onClick={handleCreate} disabled={createRecord.isPending}>{createRecord.isPending ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : <CheckCircle2 className="mr-1.5 h-4 w-4" />}{createRecord.isPending ? "Saving…" : "Save record"}</Button></DialogFooter></DialogContent>
      </Dialog>
    </div>
  );
}
