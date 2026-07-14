import { useState } from "react";
import { Link } from "wouter";
import { usePageMeta } from "@/hooks/usePageMeta";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { US_STATE_CONFIGS, FEATURED_US_STATES, type USStateCode, type USStateConfig } from "@/lib/stateConfig";

const REGION_GROUPS: { label: string; states: USStateCode[] }[] = [
  {
    label: "Midwest",
    states: ["IA", "MN", "WI", "MI", "IN", "OH", "MO", "ND", "SD", "NE", "KS"],
  },
  {
    label: "Northeast",
    states: ["ME", "NH", "VT", "MA", "RI", "CT", "NJ", "DE", "MD", "PA", "WV"],
  },
  {
    label: "South",
    states: ["VA", "NC", "SC", "GA", "AL", "MS", "AR", "OK", "LA", "KY", "TN"],
  },
  {
    label: "West",
    states: ["WA", "OR", "ID", "MT", "WY", "CO", "UT", "NV", "AZ", "NM", "AK", "HI"],
  },
];

export default function USStates() {
  usePageMeta({
    title: "US Water Operator Certification by State | ABC/WPI Exam Prep — Echelon Institute",
    description:
      "Find water and wastewater operator certification exam prep for your state. Echelon covers all 45 states that use the ABC/WPI standardized exam system.",
  });

  const [search, setSearch] = useState("");

  const allStates: USStateConfig[] = Object.values(US_STATE_CONFIGS) as USStateConfig[];
  const searchResults = search.trim()
    ? allStates.filter(
        s =>
          s.name.toLowerCase().includes(search.toLowerCase()) ||
          s.code.toLowerCase().includes(search.toLowerCase()) ||
          s.certBodyAbbr.toLowerCase().includes(search.toLowerCase())
      )
    : null;

  return (
    <div className="min-h-screen bg-[#0a0f1a] text-white">
      {/* Nav */}
      <nav className="border-b border-white/10 bg-[#0a0f1a]/95 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/us">
            <span className="text-xl font-bold text-white cursor-pointer">
              ← Echelon US
            </span>
          </Link>
          <Link href="/us/courses">
            <Button size="sm" className="bg-blue-600 hover:bg-blue-500 text-white">
              Start Studying →
            </Button>
          </Link>
        </div>
      </nav>

      <div className="max-w-5xl mx-auto px-4 py-16">
        {/* Header */}
        <div className="text-center mb-12">
          <Badge className="mb-4 bg-blue-500/10 text-blue-400 border-blue-500/20">
            45 States Covered
          </Badge>
          <h1 className="text-4xl font-bold mb-4">Find Your State</h1>
          <p className="text-white/60 max-w-xl mx-auto">
            Echelon Institute covers all US states that use the ABC/WPI standardized exam.
            Select your state to see your certifying authority and start practicing.
          </p>
        </div>

        {/* Search */}
        <div className="max-w-md mx-auto mb-12">
          <Input
            placeholder="Search by state name, abbreviation, or agency..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="bg-white/10 border-white/20 text-white placeholder:text-white/40 text-center"
          />
        </div>

        {/* Search results */}
        {searchResults && (
          <div className="mb-12">
            {searchResults.length === 0 ? (
              <div className="text-center text-white/50 py-8">
                No states found matching "{search}"
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {searchResults.map(state => (
                  <StateCard key={state.code} state={state} />
                ))}
              </div>
            )}
          </div>
        )}

        {/* Featured states */}
        {!searchResults && (
          <>
            <div className="mb-10">
              <h2 className="text-lg font-semibold text-white/70 mb-4 uppercase tracking-wider text-sm">
                Most Popular
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
                {FEATURED_US_STATES.map(code => {
                  const state: USStateConfig = US_STATE_CONFIGS[code];
                  return (
                    <Link key={code} href={`/us/states/${state.slug}`}>
                      <div className="bg-blue-500/10 border border-blue-500/20 hover:border-blue-400/40 hover:bg-blue-500/15 rounded-lg p-3 text-center cursor-pointer transition-all group">
                        <div className="text-sm font-bold text-blue-400 group-hover:text-blue-300">
                          {state.code}
                        </div>
                        <div className="text-xs text-white/60 mt-0.5 truncate">{state.name}</div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>

            {/* By region */}
            {REGION_GROUPS.map(region => (
              <div key={region.label} className="mb-10">
                <h2 className="text-lg font-semibold text-white/70 mb-4 uppercase tracking-wider text-sm">
                  {region.label}
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {region.states
                  .filter(code => US_STATE_CONFIGS[code as USStateCode])
                  .map(code => (
                    <StateCard key={code} state={US_STATE_CONFIGS[code as USStateCode]} />
                    ))}
                </div>
              </div>
            ))}
          </>
        )}

        {/* States not covered */}
        <div className="mt-12 bg-amber-500/5 border border-amber-500/20 rounded-xl p-6">
          <h3 className="font-semibold text-amber-400 mb-2">
            California, Texas, Florida, and New York
          </h3>
          <p className="text-white/60 text-sm leading-relaxed">
            These four states use their own state-specific exam systems (SWRCB, TCEQ, FDEP, and
            NYSDOH respectively) rather than the ABC/WPI standardized exam. Echelon does not
            currently offer prep for these state-specific exams, but we are working on it.
          </p>
        </div>
      </div>
    </div>
  );
}

function StateCard({ state }: { state: USStateConfig }) {
  return (
    <Link href={`/us/states/${state.slug}`}>
      <div className="bg-white/5 border border-white/10 hover:border-blue-500/30 hover:bg-blue-500/5 rounded-xl p-4 cursor-pointer transition-all group">
        <div className="flex items-center justify-between mb-2">
          <span className="text-lg font-bold text-white group-hover:text-blue-400 transition-colors">
            {state.code}
          </span>
          <Badge className="bg-blue-500/10 text-blue-400 border-blue-500/20 text-xs">
            WPI
          </Badge>
        </div>
        <div className="text-sm font-medium text-white/80 mb-1">{state.name}</div>
        <div className="text-xs text-white/40">{state.certBodyAbbr}</div>
      </div>
    </Link>
  );
}
