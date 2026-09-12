import { lazy, Suspense, useState } from "react";
import { useLocation } from "wouter";
import { ArrowRight, Box, Info, Monitor } from "lucide-react";
import ClarifierLab from "@/components/ClarifierLab";
import ErrorBoundary from "@/components/ErrorBoundary";
import SiteNav from "@/components/SiteNav";
import { usePageMeta } from "@/hooks/usePageMeta";

const ClarifierThreeLab = lazy(() => import("@/components/ClarifierThreeLab"));

export default function EquipmentLab() {
  const [, navigate] = useLocation();
  const [renderMode, setRenderMode] = useState<"three" | "diagram">("three");
  const [aboutOpen, setAboutOpen] = useState(false);
  usePageMeta({
    title: "Equipment Lab | Echelon Institute",
    description: "Explore wastewater equipment with Echelon’s interactive circular clarifier learning lab.",
    noindex: true,
  });

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900">
      <SiteNav currentPath="/equipment-lab" />
      <main className="mx-auto max-w-[1280px] px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
        <section className="flex flex-wrap items-end justify-between gap-5 border-b border-slate-200 pb-6">
          <div className="max-w-2xl">
            <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-teal-700">Equipment Lab · Module 01</p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-900 sm:text-[32px] sm:leading-9">Inside a circular clarifier</h1>
            <p className="mt-2 text-sm leading-6 text-slate-600 sm:text-base">Inspect the equipment, follow the conceptual separation sequence, and connect each assembly to operator decisions that protect effluent quality.</p>
            {aboutOpen && <p id="model-description" className="mt-3 border-l-2 border-teal-700 pl-3 text-sm leading-6 text-slate-600">This is a generalized learning illustration, not manufacturer CAD, a hydraulic simulation, a site-specific drawing, a maintenance procedure, or a calibrated training simulator. Flow paths, motion, and separation distances are illustrative.</p>}
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <button onClick={() => setAboutOpen((value) => !value)} aria-expanded={aboutOpen} aria-controls="model-description" className="inline-flex min-h-10 items-center gap-2 text-sm font-semibold text-slate-600 underline decoration-slate-300 underline-offset-4 transition-colors hover:text-slate-900 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-teal-700">About this model <Info size={15} aria-hidden="true" /></button>
            <button onClick={() => navigate("/wastewater")} className="inline-flex min-h-10 items-center gap-2 rounded-md border border-slate-300 bg-white px-3 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700">Wastewater process guide <ArrowRight size={15} aria-hidden="true" /></button>
          </div>
        </section>

        <section className="mt-6" aria-labelledby="clarifier-heading">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-500">Circular clarifier · centre feed</p>
              <h2 id="clarifier-heading" className="mt-1 text-lg font-semibold text-slate-900">Explore the assembly</h2>
            </div>
            <div className="flex rounded-md border border-slate-300 bg-white p-1" role="group" aria-label="Equipment Lab render mode">
              <button onClick={() => setRenderMode("three")} aria-pressed={renderMode === "three"} className={`inline-flex min-h-9 items-center gap-1.5 rounded px-3 text-xs font-semibold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700 ${renderMode === "three" ? "bg-slate-900 text-white" : "text-slate-600 hover:bg-slate-100"}`}><Box size={14} aria-hidden="true" /> 3D model</button>
              <button onClick={() => setRenderMode("diagram")} aria-pressed={renderMode === "diagram"} className={`inline-flex min-h-9 items-center gap-1.5 rounded px-3 text-xs font-semibold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700 ${renderMode === "diagram" ? "bg-slate-900 text-white" : "text-slate-600 hover:bg-slate-100"}`}><Monitor size={14} aria-hidden="true" /> Diagram view</button>
            </div>
          </div>

          {renderMode === "three" ? (
            <Suspense fallback={<div className="flex min-h-[360px] items-center justify-center rounded-xl border border-slate-300 bg-white p-8 text-sm font-semibold text-slate-600">Preparing the interactive 3D model…</div>}>
              <ErrorBoundary fallback={<div className="rounded-xl border border-amber-200 bg-amber-50 p-6 text-sm leading-6 text-amber-950">The interactive 3D model could not start in this browser. Select the persistent <strong>Diagram view</strong> control above for the accessible schematic.</div>}>
                <ClarifierThreeLab onStudyLink={() => navigate("/wastewater")} />
              </ErrorBoundary>
            </Suspense>
          ) : <ClarifierLab onStudyLink={() => navigate("/wastewater")} />}
        </section>

        <section className="mt-8 flex flex-wrap items-center justify-between gap-4 border-t border-slate-200 py-6">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-500">Continue learning</p>
            <p className="mt-1 text-sm text-slate-600">Move from this conceptual model to the wastewater process guide and related Class 1 practice.</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <button onClick={() => navigate("/wastewater")} className="min-h-10 rounded-md bg-slate-900 px-4 text-sm font-semibold text-white transition-colors hover:bg-slate-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700">Study wastewater</button>
            <button onClick={() => navigate("/class1-ww")} className="min-h-10 rounded-md border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700">Class 1 practice</button>
          </div>
        </section>
      </main>
    </div>
  );
}
