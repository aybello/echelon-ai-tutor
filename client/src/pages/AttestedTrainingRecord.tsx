import { FileCheck2, LogIn, Printer, ShieldCheck } from "lucide-react";
import { Link, useParams } from "wouter";
import SiteNav from "@/components/SiteNav";
import { usePageMeta } from "@/hooks/usePageMeta";
import { trpc } from "@/lib/trpc";

const authorityLabels: Record<string, string> = {
  oro: "Overall Responsible Operator (ORO)",
  oro_authorized_designate: "ORO-authorized designate",
  oro_manager_or_supervisor: "Manager or supervisor of the ORO",
  oro_authorized_training_coordinator: "Training coordinator authorized by the ORO",
  manager_acknowledgement: "Manager acknowledgement only",
};

function hours(seconds: number) {
  return `${(Math.max(0, seconds) / 3600).toFixed(2)} h`;
}

export default function AttestedTrainingRecord() {
  const { reportId = "" } = useParams<{ reportId: string }>();
  usePageMeta({ title: "Signed Training Record — Echelon Institute", description: "Immutable Echelon training-hours record." });
  const report = trpc.training.attestedReport.useQuery({ reportId }, { retry: false, enabled: !!reportId });

  if (report.isLoading) {
    return <div className="min-h-screen bg-slate-50"><SiteNav currentPath={`/training-hours/records/${reportId}`} /><main className="mx-auto max-w-5xl px-5 py-20 text-slate-600">Loading signed record…</main></div>;
  }

  if (report.isError || !report.data) {
    return <div className="min-h-screen bg-slate-50"><SiteNav currentPath={`/training-hours/records/${reportId}`} /><main className="mx-auto max-w-xl px-5 py-20 text-center"><LogIn className="mx-auto mb-5 h-10 w-10 text-blue-700" /><h1 className="text-2xl font-black">Signed record unavailable</h1><p className="mt-3 text-slate-600">Sign in as the operator or the current team manager to open this record.</p><Link href={`/account?next=/training-hours/records/${reportId}`} className="mt-6 inline-flex rounded-xl bg-blue-700 px-5 py-3 font-bold text-white">Sign in</Link></main></div>;
  }

  const { snapshot, digestSha256 } = report.data;
  const isOjtAttestation = snapshot.attestationKind === "ojt_attestation";
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <SiteNav currentPath={`/training-hours/records/${reportId}`} />
      <style>{`@media print { nav,.signed-record-actions{display:none!important}.signed-record{box-shadow:none!important;border:0!important}body{background:#fff!important} }`}</style>
      <main className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
        <div className="signed-record-actions mb-6 flex flex-wrap items-center justify-between gap-3">
          <Link href="/training-hours" className="text-sm font-bold text-blue-700">← Training hours</Link>
          <button onClick={() => window.print()} className="inline-flex items-center gap-2 rounded-xl bg-blue-700 px-4 py-2.5 text-sm font-bold text-white"><Printer className="h-4 w-4" />Save signed PDF</button>
        </div>

        <article className="signed-record rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <header className="border-b border-slate-200 pb-6">
            <div className="flex items-start justify-between gap-4">
              <div><div className="text-xs font-extrabold uppercase tracking-[0.18em] text-blue-700">Immutable training record</div><h1 className="mt-2 text-3xl font-black">{snapshot.operatorName || snapshot.operatorEmail}</h1><p className="mt-1 text-sm text-slate-600">{snapshot.operatorEmail} · {snapshot.courseName}</p></div>
              <ShieldCheck className="h-9 w-9 shrink-0 text-emerald-700" />
            </div>
            <p className="mt-4 text-sm text-slate-600">Record period: {new Date(snapshot.periodStart).toLocaleDateString()} – {new Date(snapshot.periodEnd).toLocaleDateString()} · Signed {new Date(snapshot.signedAt).toLocaleString()}</p>
          </header>

          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            <div className="rounded-xl bg-blue-50 p-5"><div className="text-xs font-bold uppercase text-blue-700">Platform-recorded study time</div><div className="mt-2 text-3xl font-black">{hours(snapshot.summary.activeSeconds)}</div></div>
            <div className="rounded-xl bg-emerald-50 p-5"><div className="text-xs font-bold uppercase text-emerald-700">Supervisor-review duration</div><div className="mt-2 text-3xl font-black">{hours(snapshot.summary.supervisorReview.supervisorReviewSeconds)}</div><p className="mt-1 text-[11px] text-emerald-900">7-hour daily cap and quarter-hour floor applied</p></div>
            <div className="rounded-xl bg-slate-50 p-5"><div className="text-xs font-bold uppercase text-slate-500">Study sessions</div><div className="mt-2 text-3xl font-black">{snapshot.summary.sessionCount}</div></div>
          </div>

          <section className={`mt-6 rounded-xl border p-5 ${isOjtAttestation ? "border-emerald-200 bg-emerald-50" : "border-amber-200 bg-amber-50"}`}>
            <h2 className="flex items-center gap-2 font-extrabold"><FileCheck2 className="h-5 w-5" />{isOjtAttestation ? "OJT supervisor attestation" : "Manager acknowledgement"}</h2>
            <p className="mt-2 text-sm leading-relaxed">{snapshot.statement}</p>
            <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
              <div><dt className="font-bold">Signed by</dt><dd>{snapshot.signedByName}, {snapshot.signedRole}</dd></div>
              <div><dt className="font-bold">Signing authority</dt><dd>{authorityLabels[snapshot.signerAuthority]}</dd></div>
              <div><dt className="font-bold">Training provider</dt><dd>{snapshot.providerName}</dd></div>
              <div><dt className="font-bold">Instructor / trainer</dt><dd>{snapshot.instructorName} · {snapshot.instructorContact}</dd></div>
            </dl>
          </section>

          <section className="mt-6"><h2 className="text-lg font-extrabold">Learning objectives</h2><p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-slate-700">{snapshot.learningObjectives}</p></section>

          <section className="mt-6"><h2 className="text-lg font-extrabold">Daily supervisor-review calculation</h2><div className="mt-3 overflow-x-auto"><table className="w-full min-w-[560px] text-left text-sm"><thead><tr className="border-b text-xs uppercase text-slate-500"><th className="py-2">Date</th><th className="text-right">Platform time</th><th className="text-right">After daily cap</th><th className="text-right">Review duration</th></tr></thead><tbody>{snapshot.summary.supervisorReview.days.map((day) => <tr key={day.date} className="border-b border-slate-100"><td className="py-2">{day.date}</td><td className="text-right">{hours(day.platformRecordedSeconds)}</td><td className="text-right">{hours(day.cappedSeconds)}</td><td className="text-right font-bold">{hours(day.supervisorReviewSeconds)}</td></tr>)}</tbody></table></div></section>

          <section className="mt-6"><h2 className="text-lg font-extrabold">Session appendix ({snapshot.sessions.length})</h2><div className="mt-3 overflow-x-auto"><table className="w-full min-w-[680px] text-left text-sm"><thead><tr className="border-b text-xs uppercase text-slate-500"><th className="py-2">Date and time</th><th>Activity</th><th>Topic</th><th className="text-right">Duration</th></tr></thead><tbody>{snapshot.sessions.map((session) => <tr key={session.sessionKey} className="border-b border-slate-100"><td className="py-2">{new Date(session.startedAt).toLocaleString()}</td><td>{session.activityType.replaceAll("_", " ")}</td><td>{session.topic || "—"}</td><td className="text-right font-bold">{Math.round(session.activeSeconds / 60)} min</td></tr>)}</tbody></table></div></section>

          <footer className="mt-8 border-t border-slate-200 pt-5 text-xs leading-relaxed text-slate-500"><p>This record is frozen from the activity reviewed at signing; later study does not change it. Platform-recorded time is not automatically Director Approved continuing education or CEU credit.</p><p className="mt-2 break-all font-mono">Record {snapshot.reportId} · SHA-256 {digestSha256}</p></footer>
        </article>
      </main>
    </div>
  );
}
