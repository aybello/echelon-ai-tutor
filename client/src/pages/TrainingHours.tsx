import { Download, FileCheck2, LogIn, Printer } from "lucide-react";
import { Link } from "wouter";
import SiteNav from "@/components/SiteNav";
import { trpc } from "@/lib/trpc";
import { usePageMeta } from "@/hooks/usePageMeta";

function formatHours(seconds: number): string {
  return `${(Math.max(0, seconds) / 3600).toFixed(2)} h`;
}

function downloadCsv(csv: string, filename: string) {
  const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

export default function TrainingHours() {
  usePageMeta({ title: "My Training Hours — Echelon Institute", description: "Your verified active study record." });
  const summary = trpc.training.mySummary.useQuery(undefined, { retry: false });
  const csv = trpc.training.myCsv.useQuery(undefined, { enabled: false });

  const exportCsv = async () => {
    const result = await csv.refetch();
    if (result.data) downloadCsv(result.data.csv, result.data.filename);
  };

  if (summary.isLoading) {
    return <div className="min-h-screen bg-slate-50"><SiteNav currentPath="/training-hours" /><div className="mx-auto max-w-5xl px-5 py-20 text-slate-600">Loading your verified record…</div></div>;
  }

  if (summary.isError || !summary.data) {
    return (
      <div className="min-h-screen bg-slate-50">
        <SiteNav currentPath="/training-hours" />
        <main className="mx-auto max-w-xl px-5 py-20 text-center">
          <LogIn className="mx-auto mb-5 h-10 w-10 text-blue-700" />
          <h1 className="text-3xl font-extrabold text-slate-900">Verify your email to view your record</h1>
          <p className="mt-3 text-slate-600">Your training-hours record remains available even after a course licence ends.</p>
          <Link href="/account?next=/training-hours" className="mt-7 inline-flex rounded-xl bg-blue-700 px-5 py-3 font-bold text-white">Sign in or restore access</Link>
        </main>
      </div>
    );
  }

  const data = summary.data;
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <SiteNav currentPath="/training-hours" />
      <style>{`@media print { .training-hours-actions, nav, details { display:none!important; } .training-record { box-shadow:none!important; border:0!important; } body { background:#fff!important; } }`}</style>
      <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <div className="mb-7 flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="text-xs font-extrabold uppercase tracking-[0.18em] text-blue-700">Echelon-verified study activity</div>
            <h1 className="mt-2 text-3xl font-black">My Training Hours</h1>
            <p className="mt-2 max-w-2xl text-sm text-slate-600">A concise record of active time while you studied. Dates and individual session durations are available in the optional detail section below.</p>
          </div>
          <div className="training-hours-actions flex gap-2">
            <button onClick={() => window.print()} className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-bold"><Printer className="h-4 w-4" />Save PDF</button>
            <button onClick={exportCsv} disabled={csv.isFetching} className="inline-flex items-center gap-2 rounded-xl bg-blue-700 px-4 py-2.5 text-sm font-bold text-white"><Download className="h-4 w-4" />{csv.isFetching ? "Preparing…" : "CSV detail"}</button>
          </div>
        </div>

        <section className="training-record rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="rounded-xl bg-blue-50 p-5"><div className="text-xs font-bold uppercase text-blue-700">Verified active time</div><div className="mt-2 text-3xl font-black">{formatHours(data.activeSeconds)}</div></div>
            <div className="rounded-xl bg-slate-50 p-5"><div className="text-xs font-bold uppercase text-slate-500">Study sessions</div><div className="mt-2 text-3xl font-black">{data.sessionCount}</div></div>
            <div className="rounded-xl bg-slate-50 p-5"><div className="text-xs font-bold uppercase text-slate-500">Record period</div><div className="mt-2 text-sm font-bold">{new Date(data.from).toLocaleDateString()} – {new Date(data.to).toLocaleDateString()}</div></div>
          </div>

          <h2 className="mt-8 text-lg font-extrabold">By assigned course</h2>
          {data.byCourse.length === 0 ? <p className="mt-3 rounded-xl bg-amber-50 p-4 text-sm text-amber-900">No verified sessions are recorded yet. Timing starts automatically during your next signed-in study session.</p> : (
            <div className="mt-3 divide-y divide-slate-100 rounded-xl border border-slate-200">
              {data.byCourse.map((course) => <div key={course.courseKey} className="flex items-center justify-between gap-4 p-4"><div><div className="font-bold">{course.courseName}</div><div className="text-xs text-slate-500">{course.sessionCount} sessions</div></div><div className="text-lg font-black text-blue-800">{formatHours(course.activeSeconds)}</div></div>)}
            </div>
          )}

          <h2 className="mt-8 text-lg font-extrabold">Activity mix</h2>
          <div className="mt-3 flex flex-wrap gap-2">{data.byActivity.map((activity) => <span key={activity.activityType} className="rounded-full bg-slate-100 px-3 py-1.5 text-sm font-semibold">{activity.label}: {formatHours(activity.activeSeconds)}</span>)}</div>

          {data.attestations.length > 0 && <div className="mt-8"><h2 className="flex items-center gap-2 text-lg font-extrabold"><FileCheck2 className="h-5 w-5 text-emerald-700" />Manager-attested records</h2><div className="mt-3 space-y-2">{data.attestations.map((record) => <div key={record.reportId} className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm"><div className="font-bold">{record.operatorName || record.operatorEmail} · {formatHours(record.verifiedActiveSeconds)}</div><div className="mt-1 text-emerald-900">{record.providerName} · Instructor: {record.instructorName} ({record.instructorContact})</div><div className="mt-1 text-emerald-900">Signed by {record.signedByName} ({record.signedRole}) on {new Date(record.signedAt).toLocaleDateString()}</div><div className="mt-1 font-mono text-[10px] text-slate-500">Record {record.reportId} · SHA-256 {record.digestSha256}</div></div>)}</div></div>}
        </section>

        <details className="mt-6 rounded-2xl border border-slate-200 bg-white p-5">
          <summary className="cursor-pointer font-extrabold">Session dates and durations ({data.sessions.length})</summary>
          <p className="mt-2 text-xs text-slate-500">This appendix is optional so the normal report stays short.</p>
          <div className="mt-4 overflow-x-auto"><table className="w-full min-w-[680px] text-left text-sm"><thead><tr className="border-b text-xs uppercase text-slate-500"><th className="py-2">Date</th><th>Course</th><th>Activity</th><th>Topic</th><th className="text-right">Duration</th></tr></thead><tbody>{data.sessions.map((session) => <tr key={session.sessionKey} className="border-b border-slate-100"><td className="py-3">{new Date(session.startedAt).toLocaleString()}</td><td>{session.courseKey}</td><td>{session.activityType.replaceAll("_", " ")}</td><td>{session.topic || "—"}</td><td className="text-right font-bold">{Math.round(session.activeSeconds / 60)} min</td></tr>)}</tbody></table></div>
        </details>

        <p className="mt-5 text-xs leading-relaxed text-slate-500">This record shows Echelon-verified active study time. Whether time qualifies as on-the-job training or continuing-education credit is decided by the employer and applicable regulator; a manager/ORO should attest the record before it is submitted for that purpose.</p>
      </main>
    </div>
  );
}
