/**
 * Echelon for Teams — clean-launch holding page.
 *
 * Organization plans promise multi-course access. They stay unavailable until
 * the rebuilt course library supports the advertised organization offering.
 */

import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Building2 } from "lucide-react";
import SiteNav from "@/components/SiteNav";
import NotifyModal from "@/components/NotifyModal";

export default function Teams() {
  const [location] = useLocation();
  const [showLaunchNotify, setShowLaunchNotify] = useState(false);

  return (
    <div className="min-h-screen bg-slate-50 text-gray-900">
      <SiteNav currentPath={location} />
      <section
        className="relative overflow-hidden px-6 pb-16 pt-12 text-center"
        style={{ background: "linear-gradient(135deg, #1E3A5F 0%, #0E7490 100%)" }}
      >
        <div className="relative mx-auto max-w-3xl">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/15 px-4 py-1.5 text-sm font-semibold text-white">
            <Building2 className="h-3.5 w-3.5" />
            Echelon for Teams
          </div>
          <h1 className="mb-4 text-3xl font-bold tracking-tight text-white md:text-5xl">
            Teams access is being rebuilt for the clean launch.
          </h1>
          <p className="mx-auto max-w-2xl text-base leading-relaxed text-blue-100">
            We are restoring the course library and will reopen organization plans only when the full verified offering is ready.
            We will not sell a multi-stream plan before it can deliver the promised access.
          </p>
        </div>
      </section>

      <main className="mx-auto max-w-4xl px-6 py-14">
        <div className="grid items-stretch gap-6 md:grid-cols-[1.2fr_0.8fr]">
          <section className="rounded-2xl border border-slate-200 bg-white p-7 text-left shadow-sm">
            <p className="mb-3 text-sm font-semibold text-teal-700">CURRENTLY AVAILABLE</p>
            <h2 className="mb-3 text-2xl font-bold text-slate-900">
              All released Individual Exam Passes are live.
            </h2>
            <p className="mb-6 leading-relaxed text-slate-600">
              Individual learners can purchase any of 35 released water and wastewater courses today, backed by 19,024 learner-ready questions. The 500-question Ontario 309A bank is also available as a free beta.
              Organization pricing stays paused until the full multi-course offering and current team terms are ready.
            </p>
            <Link
              href="/pricing"
              className="inline-flex items-center justify-center rounded-xl px-5 py-3 text-sm font-bold text-white no-underline"
              style={{ background: "linear-gradient(135deg, #1D4ED8, #0E7490)" }}
            >
              View Individual Exam Passes
            </Link>
          </section>

          <aside className="rounded-2xl border border-cyan-100 p-7" style={{ background: "linear-gradient(135deg, #EFF6FF, #ECFDF5)" }}>
            <h2 className="mb-3 text-xl font-bold text-slate-900">Join the Teams launch list</h2>
            <p className="mb-5 text-sm leading-relaxed text-slate-600">
              Tell us you are interested. We will contact you when the verified multi-course team offering reopens. No checkout or payment is taken today.
            </p>
            <button
              type="button"
              onClick={() => setShowLaunchNotify(true)}
              className="w-full rounded-xl px-4 py-3 text-sm font-bold text-white"
              style={{ background: "linear-gradient(135deg, #1E3A5F, #0E7490)" }}
            >
              Notify me about Teams
            </button>
            <p className="mb-0 mt-4 text-xs text-slate-500">
              For current team training needs, email{" "}
              <a className="font-semibold text-teal-700" href="mailto:abello@echeloninstitute.ca?subject=Echelon%20Teams%20Launch">
                abello@echeloninstitute.ca
              </a>.
            </p>
          </aside>
        </div>
      </main>

      {showLaunchNotify && (
        <NotifyModal
          courseCode="ECHELON-TEAMS-LAUNCH"
          courseTitle="Echelon Teams"
          onClose={() => setShowLaunchNotify(false)}
        />
      )}
    </div>
  );
}
