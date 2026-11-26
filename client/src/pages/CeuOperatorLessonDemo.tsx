import { useMemo, useState } from "react";
import { Link } from "wouter";
import {
  ArrowLeft,
  ArrowRight,
  BarChart3,
  Check,
  ChevronRight,
  CircleHelp,
  ClipboardCheck,
  Droplets,
  Eye,
  Gauge,
  Layers3,
  MapPin,
  Play,
  Radio,
  ShieldCheck,
  TimerReset,
  Waves,
} from "lucide-react";
import SiteNav from "@/components/SiteNav";
import { usePageMeta } from "@/hooks/usePageMeta";
import "./CeuOperatorLessonDemo.css";

type DecisionId = "isolate" | "diagnose" | "dose" | "escalate";

const MODULES = [
  "Read the process",
  "Set operating limits",
  "Diagnose a filter trend",
  "Choose the first move",
  "Verify the outcome",
  "Document the shift",
] as const;

const DECISIONS: Array<{
  id: DecisionId;
  title: string;
  detail: string;
  status: "best" | "caution" | "risk";
  feedback: string;
}> = [
  {
    id: "isolate",
    title: "Take Filter 2 offline immediately",
    detail: "Remove the filter before comparing the operating evidence.",
    status: "caution",
    feedback:
      "Removing a filter may be necessary later, but the trend shown here does not yet establish a breakthrough or unsafe condition. Use the evidence first so the response matches the cause.",
  },
  {
    id: "diagnose",
    title: "Compare the filter trend, then inspect the filter",
    detail: "Check influent quality, differential pressure and the physical condition of Filter 2.",
    status: "best",
    feedback:
      "Best first move. The effluent change is real, but headloss is stable. Compare upstream conditions and inspect the filter before changing a process variable or taking capacity offline.",
  },
  {
    id: "dose",
    title: "Increase coagulant dose now",
    detail: "Adjust a plant-wide chemical setting based on the Filter 2 result.",
    status: "risk",
    feedback:
      "Do not make a chemical change from one downstream value alone. First establish whether the condition is isolated to this filter or begins upstream.",
  },
  {
    id: "escalate",
    title: "Call the regulator before acting",
    detail: "Escalate the condition before gathering more operating evidence.",
    status: "caution",
    feedback:
      "Escalate according to the operating plan when required. For this training scenario, the immediate next step is to verify the condition and follow the documented response pathway.",
  },
];

function ProcessMap() {
  return (
    <svg
      className="ceu-demo-process-map"
      viewBox="0 0 580 130"
      role="img"
      aria-label="Simplified water treatment process showing filters as the current focus"
    >
      <path className="ceu-demo-flow" d="M92 66 H150 M228 66 H286 M364 66 H422 M500 66 H548" />
      <g className="ceu-demo-node">
        <rect x="10" y="39" width="82" height="54" rx="10" />
        <path d="M38 64c7-13 17-13 24 0-7 13-17 13-24 0Z" />
        <text x="51" y="112" textAnchor="middle">Raw water</text>
      </g>
      <g className="ceu-demo-node">
        <rect x="150" y="39" width="78" height="54" rx="10" />
        <path d="M177 52h24M177 65h24M177 78h24" />
        <text x="189" y="112" textAnchor="middle">Clarifier</text>
      </g>
      <g className="ceu-demo-node">
        <rect x="286" y="39" width="78" height="54" rx="10" />
        <path d="M302 77h46M306 64h38M311 52h28" />
        <text x="325" y="112" textAnchor="middle">Filters</text>
      </g>
      <g className="ceu-demo-node ceu-demo-node-active">
        <rect x="422" y="39" width="78" height="54" rx="10" />
        <path d="M437 77h48M442 65h38M447 53h28" />
        <circle cx="489" cy="48" r="7" />
        <text x="461" y="112" textAnchor="middle">Filter 2</text>
      </g>
      <g className="ceu-demo-node">
        <rect x="548" y="39" width="26" height="54" rx="10" />
        <path d="M561 51v30" />
      </g>
    </svg>
  );
}

export default function CeuOperatorLessonDemo() {
  const [selected, setSelected] = useState<DecisionId | null>(null);
  const [showEvidence, setShowEvidence] = useState(false);
  const choice = useMemo(
    () => DECISIONS.find(item => item.id === selected),
    [selected]
  );

  usePageMeta({
    title: "Operator lesson sample | Echelon Institute",
    description: "An interactive example of a visual Echelon operator learning lesson.",
    noindex: true,
  });

  return (
    <div className="ceu-demo-page">
      <SiteNav currentPath="/continuing-education" variant="marketing" />
      <main className="ceu-demo-shell">
        <header className="ceu-demo-topbar">
          <Link href="/continuing-education" className="ceu-demo-back">
            <ArrowLeft size={15} aria-hidden="true" />
            Course catalogue
          </Link>
          <div className="ceu-demo-format-note">
            <Play size={14} aria-hidden="true" />
            Format demonstration · no learning record is created
          </div>
        </header>

        <section className="ceu-demo-workspace" aria-label="Operator lesson demonstration">
          <aside className="ceu-demo-lesson-rail">
            <div className="ceu-demo-course-mark">
              <span>Operator academy</span>
              <strong>Water Treatment Process Control</strong>
            </div>
            <div className="ceu-demo-progress-block">
              <div>
                <span>Lesson 3 of 6</span>
                <strong>50% complete</strong>
              </div>
              <div className="ceu-demo-progress-track" aria-label="50 percent complete">
                <i />
              </div>
            </div>
            <nav aria-label="Sample course lessons" className="ceu-demo-module-list">
              {MODULES.map((module, index) => (
                <button
                  key={module}
                  type="button"
                  className={index === 2 ? "is-current" : index < 2 ? "is-complete" : ""}
                  aria-current={index === 2 ? "step" : undefined}
                >
                  <span>{index < 2 ? <Check size={13} aria-hidden="true" /> : index + 1}</span>
                  <strong>{module}</strong>
                  {index === 2 && <ChevronRight size={15} aria-hidden="true" />}
                </button>
              ))}
            </nav>
            <div className="ceu-demo-rail-footer">
              <TimerReset size={15} aria-hidden="true" />
              <span>7-hour course format<br />shown as a single lesson.</span>
            </div>
          </aside>

          <section className="ceu-demo-stage">
            <div className="ceu-demo-stage-heading">
              <div>
                <p className="ceu-demo-eyebrow">Scenario 03 · Filter performance</p>
                <h1>Filter 2 is showing a rising turbidity trend.</h1>
                <p>
                  Use the process view and the shift data to choose the right first operating move.
                </p>
              </div>
              <div className="ceu-demo-loop" aria-label="Learning loop, Diagnose step active">
                <span>Observe</span>
                <span className="is-active">Diagnose</span>
                <span>Decide</span>
                <span>Document</span>
              </div>
            </div>

            <section className="ceu-demo-scene" aria-label="Fictional treatment plant training scenario">
              <div className="ceu-demo-image">
                <div className="ceu-demo-image-overlay" />
                <div className="ceu-demo-image-copy">
                  <span><Radio size={14} aria-hidden="true" /> Training signal</span>
                  <strong>Filter 2: attention required</strong>
                  <small>Fictional operating values for this lesson</small>
                </div>
              </div>
              <div className="ceu-demo-signal-card">
                <span className="ceu-demo-signal-label">What changed</span>
                <strong>Effluent turbidity rose from 0.18 to 0.31 NTU in 20 minutes.</strong>
                <p>The rest of the plant is holding steady. Identify what you need to verify before you act.</p>
              </div>
            </section>

            <section className="ceu-demo-decision-area">
              <div className="ceu-demo-decision-heading">
                <div>
                  <p className="ceu-demo-eyebrow">Your decision</p>
                  <h2>What is your first move?</h2>
                </div>
                <span><CircleHelp size={15} aria-hidden="true" /> Choose one answer</span>
              </div>
              <div className="ceu-demo-decision-grid">
                {DECISIONS.map((decision, index) => (
                  <button
                    type="button"
                    key={decision.id}
                    onClick={() => setSelected(decision.id)}
                    className={`ceu-demo-decision${selected === decision.id ? " is-selected" : ""}`}
                    aria-pressed={selected === decision.id}
                  >
                    <span>{String.fromCharCode(65 + index)}</span>
                    <div>
                      <strong>{decision.title}</strong>
                      <small>{decision.detail}</small>
                    </div>
                  </button>
                ))}
              </div>
              {choice ? (
                <div className={`ceu-demo-feedback is-${choice.status}`} role="status">
                  {choice.status === "best" ? <ShieldCheck size={18} aria-hidden="true" /> : <Eye size={18} aria-hidden="true" />}
                  <div>
                    <strong>{choice.status === "best" ? "Strong operating sequence" : "Pause and verify"}</strong>
                    <p>{choice.feedback}</p>
                  </div>
                  <button type="button" onClick={() => setShowEvidence(value => !value)}>
                    {showEvidence ? "Hide evidence" : "Show the next evidence"}
                    <ArrowRight size={15} aria-hidden="true" />
                  </button>
                </div>
              ) : null}
              {showEvidence ? (
                <div className="ceu-demo-next-evidence">
                  <BarChart3 size={17} aria-hidden="true" />
                  <p><strong>Next evidence:</strong> Filter influent turbidity is steady, while Filter 2 differential pressure is also steady. The lesson now moves into a guided filter walkdown and condition check.</p>
                </div>
              ) : null}
            </section>
          </section>

          <aside className="ceu-demo-data-rail">
            <div className="ceu-demo-plant-card">
              <div className="ceu-demo-plant-heading">
                <span><MapPin size={15} aria-hidden="true" /> Plant view</span>
                <strong>Where is the condition?</strong>
              </div>
              <ProcessMap />
              <p><span className="ceu-demo-dot" /> Current lesson focus</p>
            </div>
            <div className="ceu-demo-reading-card">
              <p className="ceu-demo-eyebrow">Shift dashboard</p>
              <div>
                <span><Droplets size={15} aria-hidden="true" /> Filter 2 turbidity</span>
                <strong>0.31 <small>NTU</small></strong>
                <em>Rising</em>
              </div>
              <div>
                <span><Gauge size={15} aria-hidden="true" /> Differential pressure</span>
                <strong>1.42 <small>m</small></strong>
                <em className="is-neutral">Stable</em>
              </div>
              <div>
                <span><Waves size={15} aria-hidden="true" /> Filter run time</span>
                <strong>22.6 <small>h</small></strong>
                <em className="is-neutral">In range</em>
              </div>
            </div>
            <div className="ceu-demo-coach-card">
              <Layers3 size={17} aria-hidden="true" />
              <div>
                <strong>Why this format works</strong>
                <p>Every short lesson puts a process, a decision and feedback in the same view.</p>
              </div>
            </div>
            <div className="ceu-demo-footer-action">
              <ClipboardCheck size={16} aria-hidden="true" />
              <span>Next: guided filter walkdown</span>
            </div>
          </aside>
        </section>
      </main>
    </div>
  );
}
