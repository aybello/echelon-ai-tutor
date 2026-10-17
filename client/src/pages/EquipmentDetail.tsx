import GuideStudyRecording from "@/components/GuideStudyRecording";
import { Suspense, lazy, useCallback, useState } from "react";
import { useLocation } from "wouter";
import {
  ArrowRight,
  Box,
  Calculator,
  Eye,
  Info,
  Layers3,
  Monitor,
  Pause,
  Play,
  RotateCcw,
  Sparkles,
  TriangleAlert,
} from "lucide-react";
import ErrorBoundary from "@/components/ErrorBoundary";
import SiteNav from "@/components/SiteNav";
import { usePageMeta } from "@/hooks/usePageMeta";
import { supportsWebGL2 } from "@/lib/webglSupport";
import type {
  EquipmentDefinition,
  EquipmentView,
} from "@shared/equipmentRegistry";

const EquipmentThreeStage = lazy(
  () => import("@/components/EquipmentThreeStage")
);

const VIEW_OPTIONS: { id: EquipmentView; label: string; icon: typeof Eye }[] = [
  { id: "isometric", label: "Orbit", icon: Eye },
  { id: "top", label: "Top", icon: Layers3 },
  { id: "cutaway", label: "Cutaway", icon: RotateCcw },
  { id: "exploded", label: "Exploded", icon: Sparkles },
];

type Lens = "operator" | "exam";
type Units = "metric" | "us";

export default function EquipmentDetail({
  equipment,
}: {
  equipment: EquipmentDefinition;
}) {
  const [, navigate] = useLocation();
  const [available, setAvailable] = useState(supportsWebGL2);
  const [renderMode, setRenderMode] = useState<"three" | "diagram">(
    available ? "three" : "diagram"
  );
  const showFallback = useCallback(() => {
    setAvailable(false);
    setRenderMode("diagram");
  }, []);

  const [aboutOpen, setAboutOpen] = useState(false);
  const [view, setView] = useState<EquipmentView>("cutaway");
  const [activePart, setActivePart] = useState(equipment.parts[0].id);
  const [lens, setLens] = useState<Lens>("operator");
  const [flowing, setFlowing] = useState(true);
  const [units, setUnits] = useState<Units>("metric");

  usePageMeta({
    title: equipment.seo.title,
    description: equipment.seo.description,
  });

  const part =
    equipment.parts.find(p => p.id === activePart) ?? equipment.parts[0];
  const hasUsExamples = equipment.formulas.some(f => f.workedUs);

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900">
      <SiteNav currentPath={`/equipment-lab/${equipment.slug}`} />
      <main className="mx-auto max-w-[1280px] px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
        <GuideStudyRecording
          topic={`Equipment Lab: ${equipment.shortTitle}`}
        />

        {/* ── Header ──────────────────────────────────────────────── */}
        <section className="flex flex-wrap items-end justify-between gap-5 border-b border-slate-200 pb-6">
          <div className="max-w-2xl">
            <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-teal-700">
              Equipment Lab · Module {equipment.moduleNumber}
            </p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-900 sm:text-[32px] sm:leading-9">
              {equipment.seo.h1}
            </h1>
            <p className="mt-2 text-sm leading-6 text-slate-600 sm:text-base">
              {equipment.summary}
            </p>
            {aboutOpen && (
              <p
                id="model-description"
                className="mt-3 border-l-2 border-teal-700 pl-3 text-sm leading-6 text-slate-600"
              >
                This is a generalized learning illustration, not manufacturer
                CAD, a hydraulic simulation, a site-specific drawing, a
                maintenance procedure, or a calibrated training simulator. Flow
                paths, motion, and separation distances are illustrative. Always
                follow your plant's own procedures and your provincial
                authority's requirements.
              </p>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => setAboutOpen(v => !v)}
              aria-expanded={aboutOpen}
              aria-controls="model-description"
              className="inline-flex min-h-10 items-center gap-2 text-sm font-semibold text-slate-600 underline decoration-slate-300 underline-offset-4 transition-colors hover:text-slate-900 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-teal-700"
            >
              About this model <Info size={15} aria-hidden="true" />
            </button>
            <button
              onClick={() => navigate(equipment.guideRoute)}
              className="inline-flex min-h-10 items-center gap-2 rounded-md border border-slate-300 bg-white px-3 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700"
            >
              Process guide <ArrowRight size={15} aria-hidden="true" />
            </button>
          </div>
        </section>

        {/* ── Model + inspector ───────────────────────────────────── */}
        <section className="mt-6" aria-labelledby="equipment-heading">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-500">
                {equipment.title} · {equipment.eyebrow}
              </p>
              <h2
                id="equipment-heading"
                className="mt-1 text-lg font-semibold text-slate-900"
              >
                Explore the assembly
              </h2>
            </div>
            <div
              className="flex rounded-md border border-slate-300 bg-white p-1"
              role="group"
              aria-label="Equipment Lab render mode"
            >
              <button
                disabled={!available}
                onClick={() => setRenderMode("three")}
                aria-pressed={renderMode === "three"}
                className={`inline-flex min-h-9 items-center gap-1.5 rounded px-3 text-xs font-semibold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700 ${renderMode === "three" ? "bg-slate-900 text-white" : "text-slate-600 hover:bg-slate-100"}`}
              >
                <Box size={14} aria-hidden="true" /> 3D model
              </button>
              <button
                onClick={() => setRenderMode("diagram")}
                aria-pressed={renderMode === "diagram"}
                className={`inline-flex min-h-9 items-center gap-1.5 rounded px-3 text-xs font-semibold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700 ${renderMode === "diagram" ? "bg-slate-900 text-white" : "text-slate-600 hover:bg-slate-100"}`}
              >
                <Monitor size={14} aria-hidden="true" /> Diagram view
              </button>
            </div>
          </div>

          {!available && (
            <p
              role="status"
              className="mb-4 rounded-md bg-amber-50 p-3 text-sm text-amber-950"
            >
              3D is unavailable in this browser. The labelled component list
              below covers the same material.
            </p>
          )}

          <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_340px]">
            {/* Stage */}
            <div className="overflow-hidden rounded-xl border border-slate-300 bg-white">
              {renderMode === "three" ? (
                <Suspense
                  fallback={
                    <div className="flex min-h-[360px] items-center justify-center p-8 text-sm font-semibold text-slate-600">
                      Preparing the interactive 3D model...
                    </div>
                  }
                >
                  <ErrorBoundary
                    onError={showFallback}
                    fallback={
                      <div className="flex min-h-[360px] items-center justify-center p-8 text-sm text-slate-600">
                        Use the Diagram view to continue.
                      </div>
                    }
                  >
                    <EquipmentThreeStage
                      equipment={equipment}
                      view={view}
                      activePart={activePart}
                      onSelectPart={setActivePart}
                      flowing={flowing}
                      onUnavailable={showFallback}
                    />
                  </ErrorBoundary>
                </Suspense>
              ) : (
                <div className="min-h-[360px] p-5">
                  <p className="text-sm font-semibold text-slate-900">
                    Process sequence
                  </p>
                  <ol className="mt-3 space-y-3">
                    {equipment.stages.map(stage => (
                      <li key={stage.id} className="flex gap-3">
                        <span
                          className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-bold text-white"
                          style={{ background: stage.accent }}
                        >
                          {stage.step}
                        </span>
                        <span>
                          <span className="block text-sm font-semibold text-slate-900">
                            {stage.title}
                          </span>
                          <span className="block text-sm leading-6 text-slate-600">
                            {stage.description}
                          </span>
                        </span>
                      </li>
                    ))}
                  </ol>
                </div>
              )}

              {/* View + motion controls */}
              {renderMode === "three" && (
                <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 px-4 py-3">
                  <div
                    className="flex flex-wrap gap-1"
                    role="group"
                    aria-label="Camera view"
                  >
                    {VIEW_OPTIONS.map(option => {
                      const Icon = option.icon;
                      return (
                        <button
                          key={option.id}
                          onClick={() => setView(option.id)}
                          aria-pressed={view === option.id}
                          className={`inline-flex min-h-9 items-center gap-1.5 rounded px-2.5 text-xs font-semibold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700 ${view === option.id ? "bg-slate-900 text-white" : "text-slate-600 hover:bg-slate-100"}`}
                        >
                          <Icon size={13} aria-hidden="true" /> {option.label}
                        </button>
                      );
                    })}
                  </div>
                  <button
                    onClick={() => setFlowing(v => !v)}
                    aria-pressed={flowing}
                    className="inline-flex min-h-9 items-center gap-1.5 rounded border border-slate-300 px-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700"
                  >
                    {flowing ? (
                      <>
                        <Pause size={13} aria-hidden="true" /> Pause flow
                      </>
                    ) : (
                      <>
                        <Play size={13} aria-hidden="true" /> Resume flow
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>

            {/* Inspector */}
            <aside className="rounded-xl border border-slate-300 bg-white p-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-500">
                Components
              </p>
              <div className="mt-2 grid grid-cols-2 gap-1.5">
                {equipment.parts.map(p => (
                  <button
                    key={p.id}
                    onClick={() => setActivePart(p.id)}
                    aria-pressed={activePart === p.id}
                    className={`rounded-lg border px-2.5 py-2 text-left text-xs font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700 ${
                      activePart === p.id
                        ? "border-slate-900 bg-slate-900 text-white"
                        : "border-slate-200 text-slate-600 hover:border-slate-400 hover:bg-slate-50"
                    }`}
                  >
                    <span
                      className="mr-1.5 inline-block h-2 w-2 rounded-full align-middle"
                      style={{ background: p.color }}
                      aria-hidden="true"
                    />
                    {p.label}
                  </button>
                ))}
              </div>

              <div className="mt-4 border-t border-slate-200 pt-3">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="text-sm font-semibold text-slate-900">
                    {part.label}
                  </h3>
                  <div
                    className="flex rounded border border-slate-300 p-0.5"
                    role="group"
                    aria-label="Explanation lens"
                  >
                    {(["operator", "exam"] as Lens[]).map(id => (
                      <button
                        key={id}
                        onClick={() => setLens(id)}
                        aria-pressed={lens === id}
                        className={`rounded px-2 py-1 text-[11px] font-semibold capitalize focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700 ${lens === id ? "bg-slate-900 text-white" : "text-slate-600 hover:bg-slate-100"}`}
                      >
                        {id}
                      </button>
                    ))}
                  </div>
                </div>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  {part.function}
                </p>
                <p className="mt-2 rounded-md bg-slate-50 p-2.5 text-sm leading-6 text-slate-700">
                  {lens === "operator" ? part.operatorLens : part.examConnection}
                </p>
              </div>
            </aside>
          </div>
        </section>

        {/* ── Worked calculations ─────────────────────────────────── */}
        <section className="mt-10" aria-labelledby="calculations-heading">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-500">
                Exam calculations
              </p>
              <h2
                id="calculations-heading"
                className="mt-1 flex items-center gap-2 text-lg font-semibold text-slate-900"
              >
                <Calculator size={18} aria-hidden="true" /> Formulas broken down
              </h2>
            </div>
            {hasUsExamples && (
              <div
                className="flex rounded-md border border-slate-300 bg-white p-1"
                role="group"
                aria-label="Unit system"
              >
                <button
                  onClick={() => setUnits("metric")}
                  aria-pressed={units === "metric"}
                  className={`min-h-9 rounded px-3 text-xs font-semibold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700 ${units === "metric" ? "bg-slate-900 text-white" : "text-slate-600 hover:bg-slate-100"}`}
                >
                  Metric (Canada)
                </button>
                <button
                  onClick={() => setUnits("us")}
                  aria-pressed={units === "us"}
                  className={`min-h-9 rounded px-3 text-xs font-semibold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700 ${units === "us" ? "bg-slate-900 text-white" : "text-slate-600 hover:bg-slate-100"}`}
                >
                  US units
                </button>
              </div>
            )}
          </div>

          <div className="mt-4 grid gap-4 md:grid-cols-2">
            {equipment.formulas.map(f => {
              const showUs = units === "us" && f.workedUs;
              const worked = showUs ? f.workedUs! : f.worked;
              const expression =
                showUs && f.expressionUs ? f.expressionUs : f.expression;
              return (
                <article
                  key={f.id}
                  className="rounded-xl border border-slate-300 bg-white p-4"
                >
                  <h3 className="text-sm font-semibold text-slate-900">
                    {f.name}
                  </h3>
                  <p className="mt-2 rounded-md bg-slate-900 px-3 py-2 font-mono text-[13px] text-white">
                    {expression}
                  </p>
                  <dl className="mt-3 space-y-1.5">
                    {f.terms.map(t => (
                      <div key={t.symbol} className="flex gap-2 text-xs">
                        <dt className="w-28 shrink-0 font-mono font-semibold text-slate-900">
                          {t.symbol}
                        </dt>
                        <dd className="text-slate-600">
                          {units === "us" && t.meaningUs ? t.meaningUs : t.meaning}{" "}
                          <span className="text-slate-400">
                            (
                            {units === "us" && t.unitsUs ? t.unitsUs : t.units})
                          </span>
                        </dd>
                      </div>
                    ))}
                  </dl>
                  <div className="mt-3 border-t border-slate-200 pt-3">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Worked example
                    </p>
                    <p className="mt-1 text-sm leading-6 text-slate-600">
                      {worked.scenario}
                    </p>
                    <p className="mt-2 rounded-md bg-slate-50 px-3 py-2 font-mono text-xs leading-5 text-slate-700">
                      {worked.substitution}
                    </p>
                    <p className="mt-2 text-sm font-semibold text-teal-800">
                      {worked.result}
                    </p>
                    <p className="mt-2 text-sm leading-6 text-slate-600">
                      {f.interpretation}
                    </p>
                  </div>
                </article>
              );
            })}
          </div>
        </section>

        {/* ── Troubleshooting ─────────────────────────────────────── */}
        <section className="mt-10" aria-labelledby="symptoms-heading">
          <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-500">
            Reading the process
          </p>
          <h2
            id="symptoms-heading"
            className="mt-1 flex items-center gap-2 text-lg font-semibold text-slate-900"
          >
            <TriangleAlert size={18} aria-hidden="true" /> What operators see
            and what it means
          </h2>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            {equipment.symptoms.map(s => (
              <article
                key={s.id}
                className="rounded-xl border border-slate-300 bg-white p-4"
              >
                <h3 className="text-sm font-semibold text-slate-900">
                  {s.observation}
                </h3>
                <p className="mt-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Likely causes
                </p>
                <ul className="mt-1 list-disc space-y-1 pl-5 text-sm leading-6 text-slate-600">
                  {s.likelyCauses.map(c => (
                    <li key={c}>{c}</li>
                  ))}
                </ul>
                <p className="mt-3 rounded-md bg-slate-50 p-2.5 text-sm leading-6 text-slate-700">
                  {s.examPoint}
                </p>
              </article>
            ))}
          </div>
        </section>

        {/* ── Reference reading (also the crawlable content) ──────── */}
        <section className="mt-10" aria-labelledby="reference-heading">
          <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-500">
            Reference
          </p>
          <h2
            id="reference-heading"
            className="mt-1 text-lg font-semibold text-slate-900"
          >
            {equipment.title} explained
          </h2>
          <div className="mt-4 grid gap-5 md:grid-cols-2">
            {equipment.seo.sections.map(section => (
              <article key={section.heading}>
                <h3 className="text-sm font-semibold text-slate-900">
                  {section.heading}
                </h3>
                {section.paragraphs.map((text, i) => (
                  <p
                    key={i}
                    className="mt-2 text-sm leading-6 text-slate-600"
                  >
                    {text}
                  </p>
                ))}
              </article>
            ))}
          </div>

          <h3 className="mt-8 text-sm font-semibold text-slate-900">
            Common questions
          </h3>
          <dl className="mt-3 divide-y divide-slate-200 border-t border-slate-200">
            {equipment.seo.faq.map(item => (
              <div key={item.question} className="py-3">
                <dt className="text-sm font-semibold text-slate-900">
                  {item.question}
                </dt>
                <dd className="mt-1 text-sm leading-6 text-slate-600">
                  {item.answer}
                </dd>
              </div>
            ))}
          </dl>
        </section>

        {/* ── Continue ────────────────────────────────────────────── */}
        <section className="mt-8 flex flex-wrap items-center justify-between gap-4 border-t border-slate-200 py-6">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-500">
              Continue learning
            </p>
            <p className="mt-1 text-sm text-slate-600">
              Move from this model to the full process guide and related
              practice questions.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => navigate(equipment.guideRoute)}
              className="min-h-10 rounded-md bg-slate-900 px-4 text-sm font-semibold text-white transition-colors hover:bg-slate-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700"
            >
              Open the process guide
            </button>
            <button
              onClick={() => navigate(equipment.practiceRoute)}
              className="min-h-10 rounded-md border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700"
            >
              Practice questions
            </button>
          </div>
        </section>
      </main>
    </div>
  );
}
