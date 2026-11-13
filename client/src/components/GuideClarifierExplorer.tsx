import { Suspense, useCallback, useState } from "react";
import { Box, ChevronUp } from "lucide-react";
import ErrorBoundary from "./ErrorBoundary";
import { createLazyClarifierThreeLab } from "./LazyClarifierThreeLab";
import { supportsWebGL2 } from "@/lib/webglSupport";

// Keep this lazy wrapper route-local. A guide chunk failure must never persist
// into Equipment Lab after the learner navigates there in the same SPA session.
const GuideClarifierThreeLab = createLazyClarifierThreeLab("guide");

/** Opt-in 3D keeps the ordinary guide lightweight and its diagram usable. */
export default function GuideClarifierExplorer() {
  const [open, setOpen] = useState(false);
  const [unavailable, setUnavailable] = useState(false);
  const showDiagram = useCallback(() => {
    setUnavailable(true);
    setOpen(false);
  }, []);
  const toggle = () => {
    if (open) setOpen(false);
    else if (supportsWebGL2()) setOpen(true);
    else showDiagram();
  };

  return (
    <section aria-labelledby="guide-clarifier-heading" className="mb-5 min-w-0 rounded-2xl border border-teal-200 bg-white p-4 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="max-w-2xl">
          <p className="text-xs font-semibold uppercase tracking-wide text-teal-700">Step 4 · Explore the equipment</p>
          <h2 id="guide-clarifier-heading" className="mt-1 text-xl font-bold text-slate-900">See how a secondary clarifier works</h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">Follow mixed liquor from the aeration tank into the feedwell, inspect the settling zone and find where clarified water and settled sludge leave.</p>
        </div>
        <button onClick={toggle} disabled={unavailable} aria-expanded={open} aria-controls="guide-clarifier-model"
          className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-teal-800 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700 disabled:bg-slate-200 disabled:text-slate-600">
          {open ? <ChevronUp size={18} aria-hidden="true" /> : <Box size={18} aria-hidden="true" />}
          {unavailable ? "3D unavailable" : open ? "Close 3D model" : "Explore in 3D"}
        </button>
      </div>
      {unavailable && <p role="status" className="mt-4 rounded-lg bg-amber-50 p-3 text-sm text-amber-950">The 3D model could not open. Continue with the interactive diagram and lesson below.</p>}
      <div id="guide-clarifier-model" hidden={!open}>
        {open && <>
          <p className="my-4 text-sm leading-6 text-slate-600">Try Cutaway to look inside, then Exploded to separate the numbered parts. Select a part to read its purpose and exam connection. This conceptual model is not to scale; use the diagram below to follow the RAS and WAS routes.</p>
          <Suspense fallback={<p role="status" className="rounded-lg bg-slate-50 p-8 text-sm text-slate-600">Loading the 3D clarifier… You can continue reading below.</p>}>
            <ErrorBoundary onError={showDiagram} fallback={<p className="text-sm text-slate-600">The interactive diagram remains available below.</p>}>
              <GuideClarifierThreeLab onUnavailable={showDiagram} />
            </ErrorBoundary>
          </Suspense>
          <p className="mt-4 text-sm leading-6 text-slate-600"><strong>Connect it to the process:</strong> settled sludge is returned to aeration as RAS to maintain the microbial population. Excess sludge leaves as WAS for sludge processing. The clarifier separates solids; it does not replace biological treatment.</p>
        </>}
      </div>
    </section>
  );
}
