import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation } from "wouter";
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  BrainCircuit,
  CheckCircle2,
  ChevronRight,
  Clock3,
  Droplets,
  Gauge,
  Play,
  RotateCcw,
  ShieldCheck,
  Sparkles,
  Waves,
  XCircle,
  Zap,
} from "lucide-react";
import SiteNav from "@/components/SiteNav";
import { trpc } from "@/lib/trpc";
import { usePageMeta } from "@/hooks/usePageMeta";

type Telemetry = {
  label: string;
  value: string;
  unit: string;
  status: "normal" | "warning" | "critical";
  trend: number[];
};

type Choice = {
  id: string;
  label: string;
  rationale: string;
  points: number;
  consequence: string;
};

type ScenarioStepId = "source-shift" | "filter-breakthrough" | "disinfection-risk" | "confirmation" | "stabilize";

type ScenarioStep = {
  id: ScenarioStepId;
  time: string;
  title: string;
  briefing: string;
  alarm: string;
  focusNode: number;
  telemetry: Telemetry[];
  choices: Choice[];
};

type DecisionRecord = {
  stepId: ScenarioStepId;
  choiceId: string;
  stepTitle: string;
  choiceLabel: string;
  consequence: string;
  points: number;
};

type Debrief = {
  summary: string;
  strengths: string[];
  improvements: string[];
  nextDrill: string;
  generatedBy: "gpt-5.6" | "rules-engine";
};

const SCENARIO_STEPS: ScenarioStep[] = [
  {
    id: "source-shift",
    time: "02:14",
    title: "The source water changes",
    briefing: "A severe rain cell has crossed the watershed. Raw-water turbidity is rising quickly, but finished water remains within the plant's operating envelope.",
    alarm: "HIGH RATE OF CHANGE: RAW TURBIDITY",
    focusNode: 0,
    telemetry: [
      { label: "Raw turbidity", value: "28.4", unit: "NTU", status: "critical", trend: [3, 5, 8, 13, 19, 28] },
      { label: "Filtered turbidity", value: "0.18", unit: "NTU", status: "normal", trend: [0.12, 0.12, 0.13, 0.15, 0.16, 0.18] },
      { label: "Plant flow", value: "18.2", unit: "ML/d", status: "normal", trend: [18, 18, 18, 18, 18, 18] },
      { label: "Free chlorine", value: "1.12", unit: "mg/L", status: "normal", trend: [1.18, 1.16, 1.15, 1.14, 1.13, 1.12] },
    ],
    choices: [
      { id: "verify-optimize", label: "Verify the raw-water reading, run a jar test and adjust coagulation from the validated result", rationale: "Confirm the signal and respond to the changed source-water chemistry before downstream performance deteriorates.", points: 20, consequence: "The reading is confirmed. The optimized coagulant dose strengthens floc formation before the load reaches filtration." },
      { id: "dose-blind", label: "Immediately double the coagulant dose", rationale: "A larger dose might compensate for the turbidity spike.", points: 8, consequence: "Filtered water holds temporarily, but the unverified dose depresses pH and increases sludge loading." },
      { id: "wait", label: "Wait for finished-water turbidity to alarm", rationale: "Finished water is currently compliant, so no action is required yet.", points: 0, consequence: "The untreated load advances through the plant and consumes the response time available to operators." },
    ],
  },
  {
    id: "filter-breakthrough",
    time: "02:31",
    title: "Filter 2 begins to break through",
    briefing: "The source-water response helped, but Filter 2 is deteriorating faster than the other filters. Its effluent turbidity and headloss are both climbing.",
    alarm: "FILTER 2 TURBIDITY HIGH-HIGH",
    focusNode: 2,
    telemetry: [
      { label: "Filter 2 effluent", value: "0.42", unit: "NTU", status: "critical", trend: [0.16, 0.18, 0.21, 0.28, 0.35, 0.42] },
      { label: "Filter 2 headloss", value: "2.7", unit: "m", status: "warning", trend: [1.2, 1.4, 1.7, 2, 2.4, 2.7] },
      { label: "Combined effluent", value: "0.24", unit: "NTU", status: "warning", trend: [0.14, 0.15, 0.17, 0.19, 0.22, 0.24] },
      { label: "Clearwell level", value: "74", unit: "%", status: "normal", trend: [77, 77, 76, 75, 74, 74] },
    ],
    choices: [
      { id: "isolate-filter", label: "Remove Filter 2 from service, preserve the sample and verify performance on the remaining filters", rationale: "Contain a localized breakthrough while maintaining a documented verification chain.", points: 20, consequence: "The breakthrough is isolated. Combined-filter turbidity stabilizes while the team starts a controlled backwash and inspection." },
      { id: "backwash-all", label: "Backwash every filter immediately", rationale: "Reset the entire filtration stage before conditions worsen.", points: 6, consequence: "The plant loses too much filtration capacity at once and clearwell storage begins falling rapidly." },
      { id: "reduce-alarm", label: "Raise the alarm threshold so nuisance alarms stop", rationale: "The high reading may be a temporary storm artifact.", points: 0, consequence: "The process deviation continues without containment and the operator loses a critical warning barrier." },
    ],
  },
  {
    id: "disinfection-risk",
    time: "02:47",
    title: "Disinfection margin narrows",
    briefing: "The plant is hydraulically stable, but chlorine demand has increased and the clearwell residual is declining. Contact-time margin is now uncertain.",
    alarm: "LOW DISINFECTION RESIDUAL",
    focusNode: 3,
    telemetry: [
      { label: "Clearwell residual", value: "0.32", unit: "mg/L", status: "critical", trend: [0.96, 0.81, 0.67, 0.53, 0.41, 0.32] },
      { label: "Clearwell level", value: "68", unit: "%", status: "normal", trend: [74, 73, 72, 70, 69, 68] },
      { label: "Plant pH", value: "7.3", unit: "pH", status: "normal", trend: [7.4, 7.4, 7.3, 7.3, 7.3, 7.3] },
      { label: "Distribution residual", value: "0.61", unit: "mg/L", status: "warning", trend: [0.82, 0.79, 0.74, 0.69, 0.65, 0.61] },
    ],
    choices: [
      { id: "ct-verify", label: "Verify analyser accuracy, calculate the current CT margin and make a controlled dose adjustment", rationale: "Treat the residual as part of a disinfection barrier, not as a standalone number.", points: 20, consequence: "The analyser is valid. A controlled adjustment restores residual while the CT check confirms the barrier remains intact." },
      { id: "maximum-dose", label: "Set the chlorine feed to maximum output", rationale: "Restore residual as quickly as possible.", points: 7, consequence: "Residual recovers, but the uncontrolled response creates an avoidable high-chlorine condition downstream." },
      { id: "trust-downstream", label: "Take no action because distribution residual is still measurable", rationale: "The distribution system still contains a disinfectant residual.", points: 0, consequence: "Clearwell residual continues falling and the plant approaches loss of verified disinfection performance." },
    ],
  },
  {
    id: "confirmation",
    time: "03:06",
    title: "A verification result arrives",
    briefing: "A retained combined-effluent sample confirms the turbidity excursion. Operations are stable, but the event now requires a formal escalation and evidence trail.",
    alarm: "BARRIER DEVIATION CONFIRMED",
    focusNode: 4,
    telemetry: [
      { label: "Finished turbidity", value: "0.31", unit: "NTU", status: "warning", trend: [0.18, 0.22, 0.27, 0.34, 0.33, 0.31] },
      { label: "Free chlorine", value: "0.78", unit: "mg/L", status: "normal", trend: [0.32, 0.41, 0.54, 0.66, 0.73, 0.78] },
      { label: "Distribution pressure", value: "486", unit: "kPa", status: "normal", trend: [489, 488, 487, 487, 486, 486] },
      { label: "Open critical alarms", value: "1", unit: "alarm", status: "warning", trend: [1, 2, 3, 3, 2, 1] },
    ],
    choices: [
      { id: "escalate-document", label: "Initiate the facility's escalation protocol, preserve records and continue verification sampling", rationale: "Escalate through the approved emergency plan while protecting the evidence needed for regulatory review.", points: 20, consequence: "The incident is formally controlled. Notifications, samples, operator actions and instrument checks are preserved in one defensible timeline." },
      { id: "log-later", label: "Continue monitoring and complete the incident log at the end of the shift", rationale: "The immediate process risk has passed, so paperwork can wait.", points: 6, consequence: "The plant remains stable, but delayed escalation creates gaps in the official response record." },
      { id: "delete-alarm", label: "Acknowledge and delete the alarm because the readings are recovering", rationale: "Closing the alarm returns the control room to normal operation.", points: 0, consequence: "The event loses its auditable trail and the organization cannot demonstrate when the deviation was recognized or controlled." },
    ],
  },
  {
    id: "stabilize",
    time: "03:28",
    title: "Move from response to recovery",
    briefing: "Raw-water conditions are improving. The treatment barriers are stable and leadership asks when the incident can be closed.",
    alarm: "RECOVERY GATE AVAILABLE",
    focusNode: 3,
    telemetry: [
      { label: "Raw turbidity", value: "16.2", unit: "NTU", status: "warning", trend: [28, 27, 25, 22, 19, 16] },
      { label: "Filtered turbidity", value: "0.16", unit: "NTU", status: "normal", trend: [0.31, 0.27, 0.23, 0.2, 0.18, 0.16] },
      { label: "Free chlorine", value: "0.84", unit: "mg/L", status: "normal", trend: [0.54, 0.62, 0.71, 0.78, 0.82, 0.84] },
      { label: "Open critical alarms", value: "0", unit: "alarms", status: "normal", trend: [3, 3, 2, 1, 1, 0] },
    ],
    choices: [
      { id: "recovery-gate", label: "Hold the recovery state until verification criteria are met, then conduct a documented after-action review", rationale: "Recovery is a controlled phase with evidence-based exit criteria and organizational learning.", points: 20, consequence: "The plant closes the event with verified stability, a complete timeline and clear actions for the next extreme-weather event." },
      { id: "normal-now", label: "Return immediately to normal setpoints and staffing", rationale: "The major alarms have cleared and the process looks stable.", points: 7, consequence: "The plant recovers, but rapid normalization reduces monitoring during the period when rebound effects are still possible." },
      { id: "keep-emergency", label: "Keep emergency settings indefinitely", rationale: "Conservative operation is safer after a serious event.", points: 3, consequence: "The plant remains safe but accumulates chemical, residual and filter-loading problems from an unnecessarily prolonged emergency state." },
    ],
  },
];

const PROCESS_NODES = ["Raw intake", "Coagulation", "Filtration", "Clearwell", "Distribution"];

function Sparkline({ values, status }: { values: number[]; status: Telemetry["status"] }) {
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const W = 96, H = 44;
  const pts = values.map((v, i) => [Math.round((i / (values.length - 1)) * W), Math.round(H - 4 - ((v - min) / range) * (H - 10))] as [number, number]);
  const linePath = pts.map((p, i) => `${i === 0 ? "M" : "L"}${p[0]},${p[1]}`).join(" ");
  const areaPath = `${linePath} L${W},${H} L0,${H} Z`;
  const colour = status === "critical" ? "#fb7185" : status === "warning" ? "#fbbf24" : "#2dd4bf";
  const gradId = `sg-${status}`;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="h-11 w-24" role="img" aria-label="Recent value trend">
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={colour} stopOpacity="0.35" />
          <stop offset="100%" stopColor={colour} stopOpacity="0.02" />
        </linearGradient>
      </defs>
      <path d={areaPath} fill={`url(#${gradId})`} />
      <path d={linePath} fill="none" stroke={colour} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      {pts[pts.length - 1] && <circle cx={pts[pts.length - 1][0]} cy={pts[pts.length - 1][1]} r="3" fill={colour} />}
    </svg>
  );
}

function ScoreRing({ score, size = 132 }: { score: number; size?: number }) {
  const radius = 52;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;
  return (
    <div className="relative grid place-items-center" style={{ width: size, height: size }}>
      <svg viewBox="0 0 120 120" className="absolute inset-0 -rotate-90">
        <circle cx="60" cy="60" r={radius} fill="none" stroke="#334155" strokeWidth="8" />
        <circle cx="60" cy="60" r={radius} fill="none" stroke="#2dd4bf" strokeWidth="8" strokeLinecap="round" strokeDasharray={circumference} strokeDashoffset={offset} className="transition-all duration-700" />
      </svg>
      <div className="text-center">
        <div className="text-3xl font-black text-white">{score}</div>
        <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-300">Command score</div>
      </div>
    </div>
  );
}

export default function IncidentCommand() {
  usePageMeta({
    title: "Echelon Command | Adaptive Water Operator Incident Simulator",
    description: "Practice critical drinking-water incident decisions in an adaptive control-room simulation.",
    noindex: true,
  });

  const [location] = useLocation();
  const [mode, setMode] = useState<"intro" | "live" | "debrief">("intro");
  const [stepIndex, setStepIndex] = useState(0);
  const [selectedChoice, setSelectedChoice] = useState<Choice | null>(null);
  const [decisions, setDecisions] = useState<DecisionRecord[]>([]);
  const [debrief, setDebrief] = useState<Debrief | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [queuedDrill, setQueuedDrill] = useState<string | null>(null);
  const [drillQueued, setDrillQueued] = useState(false);
  const clockRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const debriefMutation = trpc.incidentCommand.debrief.useMutation();
  const queueDrillMutation = trpc.incidentCommand.queueDrill.useMutation({
    onSuccess: () => { setDrillQueued(true); },
  });
  const { data: queuedDrillData } = trpc.incidentCommand.getQueuedDrill.useQuery(undefined, {
    retry: false,
  });

  const step = SCENARIO_STEPS[stepIndex];
  const score = useMemo(() => decisions.reduce((sum, decision) => sum + decision.points, 0), [decisions]);
  const commandScore = Math.round((score / (SCENARIO_STEPS.length * 20)) * 100);
  const plantState = useMemo(() => {
    const missedControl = decisions.reduce((sum, decision) => sum + (20 - decision.points), 0);
    const filtrationPenalty = decisions[1] ? (20 - decisions[1].points) * 1.8 : 0;
    const recoveryPenalty = decisions[4] ? (20 - decisions[4].points) * 0.7 : 0;
    const recordPenalty = decisions[3] ? (20 - decisions[3].points) * 3.4 : 0;

    return [
      { label: "Barrier integrity", value: Math.max(12, Math.round(100 - missedControl * 0.9)) },
      { label: "Operating reserve", value: Math.max(15, Math.round(88 - filtrationPenalty - recoveryPenalty)) },
      { label: "Record integrity", value: Math.max(8, Math.round(100 - recordPenalty)) },
    ];
  }, [decisions]);

  // Parse step base time ("02:14" → seconds) and tick from there
  const stepBaseSeconds = useMemo(() => {
    const [h, m] = (SCENARIO_STEPS[stepIndex]?.time ?? "02:14").split(":").map(Number);
    return h * 3600 + m * 60;
  }, [stepIndex]);

  useEffect(() => {
    if (mode !== "live") {
      if (clockRef.current) clearInterval(clockRef.current);
      return;
    }
    setElapsedSeconds(stepBaseSeconds);
    clockRef.current = setInterval(() => {
      setElapsedSeconds(prev => prev + 1);
    }, 1000);
    return () => {
      if (clockRef.current) clearInterval(clockRef.current);
    };
  }, [mode, stepIndex, stepBaseSeconds]);

  const clockDisplay = useMemo(() => {
    const h = Math.floor(elapsedSeconds / 3600).toString().padStart(2, "0");
    const m = Math.floor((elapsedSeconds % 3600) / 60).toString().padStart(2, "0");
    const s = (elapsedSeconds % 60).toString().padStart(2, "0");
    return `${h}:${m}:${s}`;
  }, [elapsedSeconds]);

  const begin = () => {
    setMode("live");
    setStepIndex(0);
    setSelectedChoice(null);
    setDecisions([]);
    setDebrief(null);
    setElapsedSeconds(0);
    setDrillQueued(false);
  };

  const choose = (choice: Choice) => {
    if (selectedChoice) return;
    setSelectedChoice(choice);
    setDecisions(current => [...current, {
      stepId: step.id,
      choiceId: choice.id,
      stepTitle: step.title,
      choiceLabel: choice.label,
      consequence: choice.consequence,
      points: choice.points,
    }]);
  };

  const continueScenario = async () => {
    if (!selectedChoice) return;
    if (stepIndex < SCENARIO_STEPS.length - 1) {
      setStepIndex(index => index + 1);
      setSelectedChoice(null);
      return;
    }

    const finalDecisions = decisions;
    const result = await debriefMutation.mutateAsync({
      decisions: finalDecisions.map(decision => ({ stepId: decision.stepId, choiceId: decision.choiceId })),
    });
    setDebrief(result);
    setMode("debrief");
  };

  if (mode === "intro") {
    return (
      <div className="min-h-screen text-white" style={{ fontFamily: "'Sora', sans-serif", background: "linear-gradient(135deg, #0F172A 0%, #1E3A5F 50%, #0E7490 100%)" }}>
        <SiteNav currentPath={location} brandName="Echelon Command" />
        <style>{`@keyframes commandPulse{0%,100%{opacity:.38;transform:scale(1)}50%{opacity:.9;transform:scale(1.08)}} .command-grid{background-image:linear-gradient(rgba(45,212,191,.12) 1px,transparent 1px),linear-gradient(90deg,rgba(45,212,191,.12) 1px,transparent 1px);background-size:32px 32px}`}</style>
        <main className="command-grid relative min-h-[calc(100vh-64px)] overflow-hidden">
          <div className="absolute left-[12%] top-24 h-72 w-72 rounded-full bg-blue-500/30 blur-[100px]" />
          <div className="absolute bottom-10 right-[8%] h-80 w-80 rounded-full bg-teal-400/25 blur-[110px]" />
          <div className="relative mx-auto grid max-w-7xl gap-12 px-5 py-14 lg:grid-cols-[1.08fr_.92fr] lg:items-center lg:py-20">
            <section>
              <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-teal-400/30 bg-teal-400/10 px-4 py-2 text-xs font-bold uppercase tracking-[0.18em] text-teal-300">
                <span className="h-2 w-2 animate-pulse rounded-full bg-teal-300" />
                Build Week simulation
              </div>
              <h1 className="max-w-4xl text-5xl font-black leading-[1.02] tracking-[-0.04em] sm:text-6xl lg:text-7xl">
                You cannot learn incident command from a question bank.
              </h1>
              <p className="mt-7 max-w-2xl text-lg leading-8 text-slate-300">
                Step into a live drinking-water control room. Read the plant, contain a treatment-barrier failure and defend every decision in a GPT-5.6 after-action review.
              </p>
              {queuedDrillData && (
                <div className="mt-7 inline-flex max-w-xl items-start gap-3 rounded-xl border border-teal-400/30 bg-teal-400/[.08] px-5 py-4">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-teal-300" />
                  <div>
                    <div className="text-xs font-black uppercase tracking-[.14em] text-teal-300">Queued drill</div>
                    <div className="mt-0.5 text-sm text-white">{queuedDrillData.drillName}</div>
                  </div>
                </div>
              )}
              <div className="mt-9 flex flex-col gap-3 sm:flex-row">
                <button onClick={begin} className="group inline-flex items-center justify-center gap-3 rounded-xl bg-teal-400 px-6 py-4 text-sm font-black text-slate-950 shadow-[0_0_40px_rgba(45,212,191,.2)] transition hover:bg-teal-300">
                  Enter the control room
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </button>
                <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 px-5 py-4 text-sm text-slate-300">
                  <Clock3 className="h-4 w-4 text-blue-300" />
                  8-minute scenario
                </div>
              </div>
              <div className="mt-10 grid max-w-2xl grid-cols-3 gap-3">
                {[
                  ["5", "critical decisions"],
                  ["20+", "live signals"],
                  ["1", "AI debrief"],
                ].map(([value, label]) => (
                  <div key={label} className="rounded-xl border border-white/10 bg-white/[.04] p-4">
                    <div className="text-2xl font-black text-white">{value}</div>
                    <div className="mt-1 text-xs text-slate-300">{label}</div>
                  </div>
                ))}
              </div>
            </section>

            <section className="relative">
              <div className="absolute -inset-5 rounded-[2rem] border border-teal-400/10 bg-teal-400/[.03]" />
              <div className="relative overflow-hidden rounded-2xl border border-slate-600 bg-slate-700/90 shadow-2xl">
                <div className="flex items-center justify-between border-b border-slate-600 px-5 py-4">
                  <div className="flex items-center gap-3">
                    <div className="grid h-9 w-9 place-items-center rounded-lg bg-rose-500/15 text-rose-300"><AlertTriangle className="h-5 w-5" /></div>
                    <div>
                      <div className="text-xs font-black uppercase tracking-[.16em] text-slate-300">Cedar Ridge WTP</div>
                      <div className="text-sm font-bold">Storm response active</div>
                    </div>
                  </div>
                  <span className="rounded-full bg-rose-500/15 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-rose-300">Priority 1</span>
                </div>
                <div className="p-5">
                  <div className="mb-5 flex items-center justify-between text-xs text-slate-300"><span>Process overview</span><span>02:47:18</span></div>
                  <div className="grid grid-cols-5 items-center gap-2">
                    {PROCESS_NODES.map((node, index) => (
                      <div key={node} className="relative flex flex-col items-center gap-2 text-center">
                        {index < PROCESS_NODES.length - 1 && <div className="absolute left-[60%] top-5 h-px w-[80%] bg-gradient-to-r from-teal-400/70 to-blue-400/20" />}
                        <div className={`relative z-10 grid h-10 w-10 place-items-center rounded-full border ${index === 2 ? "border-rose-400 bg-rose-400/20 text-rose-200" : "border-teal-400/40 bg-teal-400/10 text-teal-300"}`}>
                          {index === 0 ? <Waves className="h-4 w-4" /> : index === 4 ? <Droplets className="h-4 w-4" /> : <Gauge className="h-4 w-4" />}
                        </div>
                        <span className="text-[9px] font-bold text-slate-300">{node}</span>
                      </div>
                    ))}
                  </div>
                  <div className="mt-6 grid grid-cols-2 gap-3">
                    {[
                      ["Filter 2 effluent", "0.42 NTU", "critical"],
                      ["Clearwell residual", "0.32 mg/L", "critical"],
                      ["Plant flow", "18.2 ML/d", "normal"],
                      ["Distribution", "486 kPa", "normal"],
                    ].map(([label, value, status]) => (
                      <div key={label} className="rounded-xl border border-slate-600 bg-slate-700/60 p-4">
                        <div className="text-[10px] text-slate-300">{label}</div>
                        <div className={`mt-2 text-lg font-black ${status === "critical" ? "text-rose-300" : "text-teal-300"}`}>{value}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </section>
          </div>
        </main>
      </div>
    );
  }

  if (mode === "debrief" && debrief) {
    return (
      <div className="min-h-screen text-white" style={{ fontFamily: "'Sora', sans-serif", background: "linear-gradient(135deg, #0F172A 0%, #1E3A5F 50%, #0E7490 100%)" }}>
      <SiteNav currentPath={location} brandName="Echelon Command" />
      <main className="mx-auto max-w-7xl px-5 py-10">
          <div className="mb-8 flex flex-col justify-between gap-5 md:flex-row md:items-end">
            <div>
              <div className="mb-3 flex items-center gap-2 text-xs font-black uppercase tracking-[.18em] text-teal-300"><ShieldCheck className="h-4 w-4" /> Incident contained</div>
              <h1 className="text-4xl font-black tracking-tight sm:text-5xl">After-action review</h1>
              <p className="mt-3 max-w-2xl text-slate-300">Cedar Ridge WTP, extreme-rain treatment-barrier event</p>
            </div>
            <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-xs text-slate-300">
              <Sparkles className="h-4 w-4 text-violet-300" />
              {debrief.generatedBy === "gpt-5.6" ? "Personalized by GPT-5.6" : "Offline evaluation mode"}
            </div>
          </div>

          <div className="grid gap-5 lg:grid-cols-[340px_1fr]">
            <section className="rounded-2xl border border-slate-700 bg-slate-800 p-6">
              <div className="flex justify-center"><ScoreRing score={commandScore} /></div>
              <div className="mt-6 grid grid-cols-2 gap-3">
                <div className="rounded-xl bg-slate-800 p-4"><div className="text-2xl font-black text-teal-300">{decisions.filter(d => d.points === 20).length}/5</div><div className="mt-1 text-[10px] uppercase tracking-wider text-slate-300">Optimal calls</div></div>
                <div className="rounded-xl bg-slate-800 p-4"><div className="text-2xl font-black text-blue-300">74 min</div><div className="mt-1 text-[10px] uppercase tracking-wider text-slate-300">Simulated time</div></div>
              </div>
              <button onClick={begin} className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-teal-400 px-4 py-3 text-sm font-black text-slate-950 shadow-[0_0_20px_rgba(45,212,191,.25)] transition hover:bg-teal-300 active:scale-[.97]"><RotateCcw className="h-4 w-4" /> Run scenario again</button>
            </section>

            <section className="space-y-5">
              <div className="rounded-2xl border border-violet-400/20 bg-gradient-to-br from-violet-500/10 to-blue-500/5 p-6">
                <div className="mb-3 flex items-center gap-2 text-xs font-black uppercase tracking-[.16em] text-violet-300"><BrainCircuit className="h-4 w-4" /> Command assessment</div>
                <p className="text-lg leading-8 text-slate-100">{debrief.summary}</p>
              </div>
              <div className="grid gap-5 md:grid-cols-2">
                <div className="rounded-2xl border border-teal-400/20 bg-teal-400/[.05] p-6">
                  <h2 className="mb-4 flex items-center gap-2 font-black text-teal-200"><CheckCircle2 className="h-5 w-5" /> What you protected</h2>
                  <ul className="space-y-3">{debrief.strengths.map(item => <li key={item} className="flex gap-3 text-sm leading-6 text-slate-300"><span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-teal-300" />{item}</li>)}</ul>
                </div>
                <div className="rounded-2xl border border-amber-400/20 bg-amber-400/[.05] p-6">
                  <h2 className="mb-4 flex items-center gap-2 font-black text-amber-200"><Zap className="h-5 w-5" /> Where to sharpen</h2>
                  <ul className="space-y-3">{debrief.improvements.map(item => <li key={item} className="flex gap-3 text-sm leading-6 text-slate-300"><span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-300" />{item}</li>)}</ul>
                </div>
              </div>
              <div className="flex flex-col justify-between gap-4 rounded-2xl border border-slate-700 bg-slate-800 p-6 sm:flex-row sm:items-center">
                <div><div className="text-xs font-black uppercase tracking-[.16em] text-slate-300">Recommended next drill</div><div className="mt-2 text-lg font-bold text-white">{debrief.nextDrill}</div></div>
                <button
                  onClick={() => {
                    setQueuedDrill(debrief.nextDrill);
                    queueDrillMutation.mutate({ drillName: debrief.nextDrill });
                  }}
                  className={`inline-flex items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-black transition ${
                    drillQueued
                      ? "bg-teal-600 text-white cursor-default"
                      : "bg-blue-600 text-white hover:bg-blue-500"
                  }`}
                  disabled={drillQueued}
                >
                  {drillQueued ? <><CheckCircle2 className="h-4 w-4" /> Drill queued</> : <>Queue simulation <ChevronRight className="h-4 w-4" /></>}
                </button>
              </div>
            </section>
          </div>

          <section className="mt-6 overflow-hidden rounded-2xl border border-slate-700 bg-slate-800">
            <div className="border-b border-slate-700 px-6 py-4"><h2 className="font-black">Decision timeline</h2></div>
            <div className="divide-y divide-slate-800">
              {decisions.map((decision, index) => (
                <div key={decision.stepId} className="grid gap-3 px-6 py-5 md:grid-cols-[60px_1fr_110px] md:items-center">
                  <div className="text-xs font-black text-slate-300">{SCENARIO_STEPS[index].time}</div>
                  <div><div className="text-sm font-bold text-white">{decision.choiceLabel}</div><div className="mt-1 text-xs leading-5 text-slate-300">{decision.consequence}</div></div>
                  <div className={`text-right text-sm font-black ${decision.points === 20 ? "text-teal-300" : decision.points >= 6 ? "text-amber-300" : "text-rose-300"}`}>{decision.points}/20</div>
                </div>
              ))}
            </div>
          </section>
                    <div className="mt-8 flex flex-col items-center gap-4 rounded-2xl border border-teal-400/20 bg-teal-400/[.06] px-6 py-8 text-center">
            <RotateCcw className="h-8 w-8 text-teal-300" />
            <div>
              <div className="text-lg font-black text-white">Ready for another run?</div>
              <div className="mt-1 text-sm text-slate-300">Each scenario is identical — but your decisions shape the outcome.</div>
            </div>
            <button onClick={begin} className="inline-flex items-center gap-2 rounded-xl bg-teal-400 px-8 py-3 text-sm font-black text-slate-950 shadow-[0_0_30px_rgba(45,212,191,.3)] transition hover:bg-teal-300 active:scale-[.97]"><RotateCcw className="h-4 w-4" /> Run scenario again</button>
          </div>
          <p className="mt-5 text-center text-[11px] text-slate-600">Training simulation only. Follow approved facility procedures and governing requirements during real incidents.</p>
        </main>
      </div>
    );
  }
  return (
          <div className="min-h-screen text-white" style={{ fontFamily: "'Sora', sans-serif", background: "linear-gradient(135deg, #0F172A 0%, #1E3A5F 50%, #0E7490 100%)" }}>
      <SiteNav currentPath={location} brandName="Echelon Command" />
      <main className="mx-auto max-w-[1500px] px-4 py-5">
        <header className="mb-4 flex flex-col justify-between gap-4 rounded-2xl border border-slate-700 bg-slate-800 px-5 py-4 lg:flex-row lg:items-center">
          <div className="flex items-center gap-4">
            <div className="grid h-11 w-11 place-items-center rounded-xl bg-rose-500/15 text-rose-300"><AlertTriangle className="h-5 w-5" /></div>
            <div><div className="flex items-center gap-2"><h1 className="font-black">Cedar Ridge WTP</h1><span className="rounded-full bg-rose-500/15 px-2 py-1 text-[9px] font-black uppercase tracking-wider text-rose-300">Incident active</span></div><p className="mt-1 text-xs text-slate-300">Extreme-rain treatment-barrier response</p></div>
          </div>
          <div className="flex flex-wrap items-center gap-4 text-xs">
            <div><span className="text-slate-300">Scenario time</span><div className="mt-1 font-mono font-black text-white tabular-nums">{clockDisplay}</div></div>
            <div><span className="text-slate-300">Decision</span><div className="mt-1 font-black text-white">{stepIndex + 1} of {SCENARIO_STEPS.length}</div></div>
            <div className="min-w-28"><span className="text-slate-300">Command score</span><div className="mt-1 flex items-center gap-2"><div className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-800"><div className="h-full rounded-full bg-teal-400 transition-all" style={{ width: `${commandScore}%` }} /></div><span className="font-black text-teal-300">{commandScore}</span></div></div>
          </div>
        </header>

        <div className="grid gap-4 lg:grid-cols-[1.2fr_.8fr]">
          <div className="space-y-4">
            <section className="rounded-2xl border border-slate-700 bg-slate-800 p-5">
              <div className="mb-5 flex items-center justify-between"><div><div className="text-[10px] font-black uppercase tracking-[.18em] text-slate-300">Live plant topology</div><div className="mt-1 text-sm font-bold">Treatment barriers</div></div><div className="flex items-center gap-2 text-[10px] text-teal-300"><span className="h-2 w-2 animate-pulse rounded-full bg-teal-300" /> telemetry streaming</div></div>
              <div className="grid grid-cols-5 items-start gap-2">
                {PROCESS_NODES.map((node, index) => {
                  const active = index === step.focusNode;
                  const completed = index < step.focusNode;
                  return <div key={node} className="relative flex flex-col items-center text-center">
                    {index < 4 && <div className={`absolute left-[60%] top-6 h-[2px] w-[80%] ${completed ? "bg-teal-400" : "bg-slate-700"}`} />}
                    <div className={`relative z-10 grid h-12 w-12 place-items-center rounded-full border-2 transition-all ${active ? "border-rose-400 bg-rose-400/20 text-rose-200 shadow-[0_0_25px_rgba(251,113,133,.25)]" : completed ? "border-teal-400 bg-teal-400/15 text-teal-300" : "border-slate-700 bg-slate-800 text-slate-300"}`}>{active ? <Activity className="h-5 w-5" /> : index === 0 ? <Waves className="h-5 w-5" /> : index === 4 ? <Droplets className="h-5 w-5" /> : <Gauge className="h-5 w-5" />}</div>
                    <span className={`mt-3 text-[10px] font-bold ${active ? "text-white" : "text-slate-300"}`}>{node}</span>
                  </div>;
                })}
              </div>
            </section>

            <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
              {step.telemetry.map(item => (
                <div key={item.label} className={`rounded-2xl border bg-slate-800 p-4 ${item.status === "critical" ? "border-rose-400/40" : item.status === "warning" ? "border-amber-400/30" : "border-slate-700"}`}>
                  <div className="flex items-start justify-between gap-2"><div className="text-[10px] font-bold text-slate-300">{item.label}</div><span className={`mt-1 h-2 w-2 rounded-full ${item.status === "critical" ? "animate-pulse bg-rose-400" : item.status === "warning" ? "bg-amber-400" : "bg-teal-400"}`} /></div>
                  <div className="mt-3 flex items-end justify-between gap-2"><div><span className={`text-2xl font-black ${item.status === "critical" ? "text-rose-300" : item.status === "warning" ? "text-amber-300" : "text-white"}`}>{item.value}</span><span className="ml-1 text-[10px] text-slate-300">{item.unit}</span></div><Sparkline values={item.trend} status={item.status} /></div>
                </div>
              ))}
            </section>

            <section className="rounded-2xl border border-slate-700 bg-slate-800 p-5">
              <div className="mb-4 flex items-start gap-4">
                <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-blue-500/15 text-blue-300"><BrainCircuit className="h-5 w-5" /></div>
                <div><div className="text-[10px] font-black uppercase tracking-[.18em] text-blue-300">Command decision {stepIndex + 1}</div><h2 className="mt-1 text-xl font-black">{step.title}</h2><p className="mt-2 text-sm leading-6 text-slate-300">{step.briefing}</p></div>
              </div>
              <div className="mb-4 rounded-xl border border-rose-400/20 bg-rose-400/[.06] px-4 py-3 text-xs font-black tracking-wide text-rose-200"><AlertTriangle className="mr-2 inline h-4 w-4" /> {step.alarm}</div>
              <div className="space-y-3">
                {step.choices.map((choice, index) => {
                  const chosen = selectedChoice?.id === choice.id;
                  const disabled = Boolean(selectedChoice && !chosen);
                  return <button key={choice.id} disabled={Boolean(selectedChoice)} onClick={() => choose(choice)} className={`group w-full rounded-xl border p-4 text-left transition ${chosen ? choice.points === 20 ? "border-teal-400 bg-teal-400/10" : choice.points > 0 ? "border-amber-400 bg-amber-400/10" : "border-rose-400 bg-rose-400/10" : disabled ? "border-slate-700 bg-slate-800/50 opacity-40" : "border-slate-700 bg-slate-800/70 hover:border-blue-400 hover:bg-blue-400/[.05]"}`}>
                    <div className="flex items-start gap-3"><div className={`grid h-7 w-7 shrink-0 place-items-center rounded-lg text-xs font-black ${chosen ? "bg-white text-slate-950" : "bg-slate-800 text-slate-300 group-hover:bg-blue-500 group-hover:text-white"}`}>{chosen ? choice.points === 20 ? <CheckCircle2 className="h-4 w-4" /> : <XCircle className="h-4 w-4" /> : String.fromCharCode(65 + index)}</div><div><div className="text-sm font-bold leading-6 text-slate-100">{choice.label}</div><div className="mt-1 text-xs leading-5 text-slate-300">{choice.rationale}</div></div></div>
                  </button>;
                })}
              </div>
              {selectedChoice && <div className={`mt-4 rounded-xl border p-4 ${selectedChoice.points === 20 ? "border-teal-400/30 bg-teal-400/[.06]" : selectedChoice.points > 0 ? "border-amber-400/30 bg-amber-400/[.06]" : "border-rose-400/30 bg-rose-400/[.06]"}`}><div className="flex items-start justify-between gap-4"><div><div className="text-[10px] font-black uppercase tracking-[.16em] text-slate-300">Plant consequence</div><p className="mt-2 text-sm leading-6 text-slate-200">{selectedChoice.consequence}</p></div><span className={`shrink-0 rounded-full px-3 py-1 text-xs font-black ${selectedChoice.points === 20 ? "bg-teal-400/15 text-teal-200" : selectedChoice.points > 0 ? "bg-amber-400/15 text-amber-200" : "bg-rose-400/15 text-rose-200"}`}>+{selectedChoice.points}</span></div><button onClick={continueScenario} disabled={debriefMutation.isPending} className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-white px-4 py-3 text-sm font-black text-slate-950 transition hover:bg-slate-200 disabled:opacity-60">{debriefMutation.isPending ? "Generating GPT-5.6 review..." : stepIndex === SCENARIO_STEPS.length - 1 ? "Generate after-action review" : "Advance incident"}<ChevronRight className="h-4 w-4" /></button></div>}
            </section>
          </div>

          <aside className="space-y-4">
            <section className="rounded-2xl border border-slate-700 bg-slate-800 p-5">
              <div className="mb-4 flex items-center justify-between"><h2 className="text-sm font-black">Live plant state</h2><span className="text-[10px] text-slate-300">consequence model</span></div>
              <div className="space-y-4">
                {plantState.map(item => {
                  const colour = item.value >= 75 ? "bg-teal-400" : item.value >= 50 ? "bg-amber-400" : "bg-rose-400";
                  const textColour = item.value >= 75 ? "text-teal-300" : item.value >= 50 ? "text-amber-300" : "text-rose-300";
                  return <div key={item.label}><div className="mb-2 flex items-center justify-between text-[11px]"><span className="font-bold text-slate-300">{item.label}</span><span className={`font-black ${textColour}`}>{item.value}%</span></div><div className="h-1.5 overflow-hidden rounded-full bg-slate-800"><div className={`h-full rounded-full transition-all duration-500 ${colour}`} style={{ width: `${item.value}%` }} /></div></div>;
                })}
              </div>
              <p className="mt-4 text-[10px] leading-5 text-slate-300">Every decision changes treatment-barrier protection, available operating capacity or the defensibility of the incident record.</p>
            </section>
            <section className="rounded-2xl border border-slate-700 bg-slate-800 p-5">
              <div className="mb-4 flex items-center justify-between"><h2 className="text-sm font-black">Incident timeline</h2><span className="text-[10px] text-slate-300">live record</span></div>
              <div className="space-y-4">
                <div className="flex gap-3"><div className="flex flex-col items-center"><span className="mt-1 h-2.5 w-2.5 rounded-full bg-rose-400" /><span className="mt-1 h-full w-px bg-slate-800" /></div><div className="pb-2"><div className="text-[10px] font-black text-slate-300">02:14</div><div className="mt-1 text-xs font-bold text-slate-200">Extreme rainfall response initiated</div></div></div>
                {decisions.map((decision, index) => <div key={decision.stepId} className="flex gap-3"><div className="flex flex-col items-center"><span className={`mt-1 h-2.5 w-2.5 rounded-full ${decision.points === 20 ? "bg-teal-400" : decision.points > 0 ? "bg-amber-400" : "bg-rose-400"}`} /><span className="mt-1 h-full w-px bg-slate-800" /></div><div className="pb-2"><div className="text-[10px] font-black text-slate-300">{SCENARIO_STEPS[index].time}</div><div className="mt-1 text-xs font-bold leading-5 text-slate-200">{decision.choiceLabel}</div><div className="mt-1 line-clamp-2 text-[10px] leading-4 text-slate-300">{decision.consequence}</div></div></div>)}
                {decisions.length < SCENARIO_STEPS.length && <div className="flex gap-3"><div className="mt-1 h-2.5 w-2.5 animate-pulse rounded-full bg-blue-400" /><div><div className="text-[10px] font-black text-blue-300">{step.time}</div><div className="mt-1 text-xs font-bold text-slate-300">Awaiting operator decision</div></div></div>}
              </div>
            </section>
            <section className="rounded-2xl border border-blue-400/20 bg-blue-400/[.05] p-5">
              <div className="flex items-center gap-2 text-xs font-black uppercase tracking-[.16em] text-blue-300"><Sparkles className="h-4 w-4" /> Adaptive review</div>
              <p className="mt-3 text-xs leading-6 text-slate-300">GPT-5.6 will evaluate the complete chain of decisions, including what you prioritized, what you verified and how your choices changed the plant.</p>
            </section>
            <section className="rounded-2xl border border-slate-700 bg-slate-800 p-5">
              <div className="flex items-center gap-2 text-xs font-black text-slate-300"><ShieldCheck className="h-4 w-4 text-teal-300" /> Training boundary</div>
              <p className="mt-2 text-[11px] leading-5 text-slate-300">This simulator teaches decision structure. Real operators must follow their facility emergency plan, approved procedures and governing requirements.</p>
            </section>
          </aside>
        </div>
      </main>
    </div>
  );
}
