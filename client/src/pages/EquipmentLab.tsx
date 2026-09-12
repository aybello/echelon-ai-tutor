import { lazy, Suspense, useState } from "react";
import { useLocation } from "wouter";
import { ArrowRight, Beaker, BookOpenCheck, Box, GraduationCap, Layers3, Monitor, ScanLine } from "lucide-react";
import ClarifierLab from "@/components/ClarifierLab";
import ErrorBoundary from "@/components/ErrorBoundary";

const ClarifierThreeLab = lazy(() => import("@/components/ClarifierThreeLab"));
import SiteNav from "@/components/SiteNav";
import { usePageMeta } from "@/hooks/usePageMeta";

export default function EquipmentLab() {
  const [, navigate] = useLocation();
  const [renderMode, setRenderMode] = useState<"three" | "diagram">("three");
  usePageMeta({
    title: "Equipment Lab | Echelon Institute",
    description: "Explore wastewater equipment with Echelon’s interactive circular clarifier learning lab.",
    noindex: true,
  });

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900">
      <SiteNav currentPath="/equipment-lab" />
      <main>
        <section className="border-b border-slate-200 bg-[linear-gradient(135deg,#061827_0%,#0B3551_58%,#0E7490_100%)] px-4 py-12 text-white sm:py-16">
          <div className="mx-auto max-w-7xl">
            <div className="grid items-end gap-8 lg:grid-cols-[1fr_320px]">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full border border-sky-300/30 bg-sky-300/10 px-3 py-1.5 text-xs font-bold uppercase tracking-[0.18em] text-sky-200">
                  <Layers3 size={14} /> Echelon Equipment Lab
                </div>
                <h1 className="mt-5 max-w-4xl text-4xl font-black tracking-tight sm:text-5xl">Learn the equipment behind the process.</h1>
                <p className="mt-4 max-w-2xl text-base leading-7 text-slate-200 sm:text-lg">
                  Explore a circular clarifier as an operator would: see how flow moves, inspect the equipment, and connect each component to the process decisions that protect effluent quality.
                </p>
              </div>
              <div className="grid grid-cols-3 gap-2 rounded-2xl border border-white/10 bg-white/5 p-3 backdrop-blur-sm">
                {[
                  { icon: Beaker, label: "Equipment", value: "01" },
                  { icon: GraduationCap, label: "Stages", value: "04" },
                  { icon: BookOpenCheck, label: "Parts", value: "07" },
                ].map(({ icon: Icon, label, value }) => (
                  <div key={label} className="rounded-xl bg-slate-950/30 p-3">
                    <Icon size={17} className="text-sky-200" />
                    <p className="mt-4 text-xl font-black">{value}</p>
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-300">{label}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 py-8 sm:py-10">
          <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-sky-700">Module 01</p>
              <h2 className="mt-1 text-2xl font-black tracking-tight text-slate-900">Circular clarifier</h2>
            </div>
            <button onClick={() => navigate("/wastewater")} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 transition-colors hover:border-slate-400 hover:bg-slate-50">
              Wastewater process guide <ArrowRight size={15} />
            </button>
          </div>
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
            <div className="flex items-center gap-2 text-sm text-slate-600"><ScanLine size={17} className="text-sky-700" /> <span><strong className="text-slate-900">Choose your view:</strong> use the 3D model for exploration or the diagram for a schematic walkthrough.</span></div>
            <div className="flex rounded-xl border border-slate-200 bg-slate-50 p-1" role="group" aria-label="Equipment Lab render mode">
              <button onClick={() => setRenderMode("three")} aria-pressed={renderMode === "three"} className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-bold ${renderMode === "three" ? "bg-slate-900 text-white" : "text-slate-600"}`}><Box size={14} /> 3D model</button>
              <button onClick={() => setRenderMode("diagram")} aria-pressed={renderMode === "diagram"} className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-bold ${renderMode === "diagram" ? "bg-slate-900 text-white" : "text-slate-600"}`}><Monitor size={14} /> Diagram view</button>
            </div>
          </div>
          {renderMode === "three" ? (
            <Suspense fallback={<div className="flex min-h-[440px] items-center justify-center rounded-3xl border border-slate-200 bg-white p-8 text-sm font-semibold text-slate-600">Preparing the interactive 3D model…</div>}>
              <ErrorBoundary fallback={<div className="rounded-3xl border border-amber-200 bg-amber-50 p-8 text-center text-sm leading-6 text-amber-950">The interactive 3D model could not start in this browser. The accessible <strong>Diagram view</strong> remains available above.</div>}>
                <ClarifierThreeLab onStudyLink={() => navigate("/wastewater")} />
              </ErrorBoundary>
            </Suspense>
          ) : <ClarifierLab onStudyLink={() => navigate("/wastewater")} />}
        </section>

        <section className="border-t border-slate-200 bg-white px-4 py-10">
          <div className="mx-auto flex max-w-7xl flex-col justify-between gap-5 rounded-3xl border border-slate-200 bg-slate-50 p-6 sm:flex-row sm:items-center">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-400">Build your operating picture</p>
              <h2 className="mt-1 text-xl font-black text-slate-900">Study the process, then practise the decisions.</h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">Use the wastewater guide for the process sequence, then move into the relevant Class 1 practice bank when you are ready.</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button onClick={() => navigate("/wastewater")} className="rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-bold text-white transition-colors hover:bg-slate-800">Study wastewater</button>
              <button onClick={() => navigate("/class1-ww")} className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 transition-colors hover:border-slate-500">Class 1 practice</button>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
