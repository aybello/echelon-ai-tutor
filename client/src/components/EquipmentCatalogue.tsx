import { useMemo, useState } from "react";
import { ArrowRight, Search, X } from "lucide-react";
import EquipmentDiagram from "./EquipmentDiagram";
import { equipmentCatalogue, EQUIPMENT_STREAM_LABELS, filterEquipmentCatalogue } from "@shared/equipmentCatalogue";
import type { EquipmentStream } from "@shared/equipmentRegistry";

function ClarifierPreview() {
  return <svg viewBox="0 0 720 400" className="h-full w-full" aria-hidden="true">
    <ellipse cx="360" cy="215" rx="172" ry="128" fill="#e2e8f0" stroke="#94a3b8" strokeWidth="12" />
    <ellipse cx="360" cy="205" rx="154" ry="110" fill="#bae6fd" stroke="#0f766e" strokeWidth="3" />
    <ellipse cx="360" cy="205" rx="130" ry="89" fill="none" stroke="#38bdf8" strokeWidth="4" strokeDasharray="8 6" />
    <path d="M190 205H360L485 258" stroke="#64748b" strokeWidth="12" fill="none" />
    <ellipse cx="360" cy="205" rx="30" ry="22" fill="#f8fafc" stroke="#0f766e" strokeWidth="5" />
    <path d="M360 74V167M514 205H615" stroke="#0369a1" strokeWidth="10" />
    <path d="m350 144 10 15 10-15M589 195l16 10-16 10" fill="none" stroke="#0369a1" strokeWidth="5" />
  </svg>;
}

export default function EquipmentCatalogue() {
  const [query, setQuery] = useState("");
  const [stream, setStream] = useState<EquipmentStream | "all">("all");
  const items = useMemo(equipmentCatalogue, []);
  const filtered = useMemo(() => filterEquipmentCatalogue(items, query, stream), [items, query, stream]);
  return <section aria-labelledby="equipment-library-heading" className="mb-10">
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div className="max-w-2xl">
        <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-teal-700">Interactive equipment library</p>
        <h1 id="equipment-library-heading" className="mt-2 text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">Equipment Lab</h1>
        <p className="mt-3 text-base leading-7 text-slate-600">Look inside the equipment. Select its components, follow the flow and connect what you see to operator decisions and exam calculations.</p>
      </div>
      <p className="rounded-md border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700">{items.length} learning modules</p>
    </div>
    <div className="mt-6 rounded-xl border border-slate-200 bg-white p-4 sm:p-5">
      <div className="relative">
        <Search size={18} aria-hidden="true" className="pointer-events-none absolute left-3 top-3.5 text-slate-500" />
        <label htmlFor="equipment-search" className="sr-only">Search equipment, components or topics</label>
        <input id="equipment-search" type="search" value={query} onChange={event => setQuery(event.target.value)} placeholder="Search equipment or topics, such as pumps or disinfection" className="min-h-11 w-full rounded-lg border border-slate-300 bg-slate-50 py-2.5 pl-10 pr-3 text-sm text-slate-900 placeholder:text-slate-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700" />
      </div>
      <div className="mt-3 flex flex-wrap gap-2" role="group" aria-label="Equipment stream">
        {(["all", ...Object.keys(EQUIPMENT_STREAM_LABELS)] as (EquipmentStream | "all")[]).map(id => {
          const count = id === "all" ? items.length : items.filter(item => item.stream === id).length;
          return <button key={id} type="button" onClick={() => setStream(id)} aria-pressed={stream === id} className={`min-h-11 rounded-lg border px-3 py-2 text-xs font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700 ${stream === id ? "border-teal-800 bg-teal-800 text-white" : "border-slate-200 bg-white text-slate-600 hover:border-teal-300 hover:bg-teal-50"}`}>
            {id === "all" ? "All equipment" : EQUIPMENT_STREAM_LABELS[id]} <span className={stream === id ? "ml-1 text-teal-100" : "ml-1 text-slate-400"}>{count}</span>
          </button>;
        })}
      </div>
    </div>
    <p role="status" aria-live="polite" className="mt-4 text-sm text-slate-500">Showing {filtered.length} of {items.length} modules</p>
    {filtered.length > 0 ? <div className="mt-3 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {filtered.map(item => <a key={item.id} href={item.href} className="group flex flex-col overflow-hidden rounded-xl border border-slate-200 bg-white transition-colors hover:border-teal-400 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700">
        <div className="relative h-44 border-b border-slate-100 bg-slate-50" aria-hidden="true">
          {item.definition ? <EquipmentDiagram equipment={item.definition} compact /> : <ClarifierPreview />}
          <span className="absolute left-3 top-3 rounded border border-slate-200 bg-white/95 px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-slate-600">Module {item.moduleNumber}</span>
        </div>
        <div className="flex flex-1 flex-col p-4">
          <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-teal-700">{EQUIPMENT_STREAM_LABELS[item.stream]}</p>
          <h2 className="mt-2 text-base font-semibold leading-6 text-slate-900">{item.title}</h2>
          <p className="mt-2 flex-1 text-sm leading-6 text-slate-600">{item.summary}</p>
          <span className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-teal-800">Explore equipment <ArrowRight size={15} aria-hidden="true" /></span>
        </div>
      </a>)}
    </div> : <div className="mt-3 rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center">
      <p className="font-semibold text-slate-900">No equipment matches this search</p>
      <p className="mt-2 text-sm text-slate-600">Try another equipment name or choose a different stream.</p>
      <button type="button" onClick={() => { setQuery(""); setStream("all"); }} className="mt-4 inline-flex min-h-11 items-center gap-2 rounded-md border border-slate-300 px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700"><X size={15} aria-hidden="true" /> Clear filters</button>
    </div>}
  </section>;
}
