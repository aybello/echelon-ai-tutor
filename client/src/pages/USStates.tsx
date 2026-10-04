import { useState } from "react";
import { Link } from "wouter";
import { usePageMeta } from "@/hooks/usePageMeta";
import USPageLayout, { USHero } from "@/components/USPageLayout";
import { US_STATE_CONFIGS, isSharedProgram } from "@/lib/stateConfig";

export default function USStates() {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  usePageMeta({ title: "US Operator Exam Routes by State | Echelon Institute", description: "Find your state and certification stream. Check official sources, confirmed shared WPI preparation and state-specific course needs." });
  const states = Object.values(US_STATE_CONFIGS).filter(state => {
    const hasShared = state.programs.some(isSharedProgram);
    const hasDedicated = state.programs.some(program => ["wpi-customized", "state-specific", "mixed"].includes(program.examSystem));
    const needle = search.trim().toLowerCase();
    const matchesSearch = !needle || [state.name, state.code, ...state.programs.map(program => program.authorityName)].some(value => value.toLowerCase().includes(needle));
    return matchesSearch && (filter === "all" || (filter === "shared" && hasShared) || (filter === "dedicated" && hasDedicated));
  });
  return <USPageLayout>
    <USHero title="Find your state">
      <span className="us-badge">50 state pages, not 50-state course coverage</span>
      <p>Exam systems can differ between water treatment, distribution, wastewater treatment and collection within the same state. Select a state to see each program's sources and course match.</p>
      <div className="us-filters">
        <label>Search states or authorities<input type="search" placeholder="State name, abbreviation or authority" value={search} onChange={event => setSearch(event.target.value)} /></label>
        <label>Show states<select value={filter} onChange={event => setFilter(event.target.value)}>
          <option value="all">All states</option><option value="shared">With a confirmed shared WPI route</option><option value="dedicated">With state-specific or customized exams</option>
        </select></label>
      </div>
    </USHero>
    <main className="us-main">
      <p role="status">{states.length} states shown. Open a state to check the exact stream and class.</p>
      <div className="us-card-grid">{states.map(state => <Link key={state.code} href={`/us/states/${state.slug}`} className="us-card us-state-card">
        <span className="us-code">{state.code}</span><strong>{state.name}</strong>
        <small>{state.programs.some(isSharedProgram) ? "Confirmed shared WPI route for selected programs" : "Check local exam requirements"}</small>
        {state.programs.some(program => ["wpi-customized", "state-specific", "mixed"].includes(program.examSystem)) && <small>Dedicated preparation needed for selected programs</small>}
      </Link>)}</div>
      {states.length === 0 && <p className="us-empty">No states match. Clear the search or choose another filter.</p>}
    </main>
  </USPageLayout>;
}
