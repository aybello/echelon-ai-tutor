import { useState, useMemo, useEffect, useRef } from "react";
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
  Trophy,
  Waves,
  XCircle,
  Zap,
} from "lucide-react";
import SiteNav from "@/components/SiteNav";
import { trpc } from "@/lib/trpc";
import { usePageMeta } from "@/hooks/usePageMeta";
import { useGuestSession } from "@/hooks/useGuestSession";
import { RadialGauge, AlarmPanel, ProcessFlowDiagram, TelemetryTicker, PlantStateBars, ScadaHeader } from "@/components/ScadaPanel";
import { FeedbackPanel, EmailCapturePanel } from "@/components/CommandFeedback";
import {
  ALL_SCENARIOS,
  getScenarioStepAtIndex,
  type ScenarioMeta,
  type Choice,
  type JudgmentRubric,
} from "@shared/commandScenarios";

type DecisionRecord = {
  stepId: string;
  choiceId: string;
  stepTitle: string;
  choiceLabel: string;
  consequence: string;
  points: number;
  operatorResponse?: string;
  judgmentRubric?: JudgmentRubric;
  evaluationRationale?: string;
};

type Debrief = {
  summary: string;
  strengths: string[];
  improvements: string[];
  nextDrill: string;
  generatedBy: "gpt-5.6" | "rules-engine";
  verification: {
    verified: true;
    label: string;
    attempts: number;
  };
  commandScore: number;
  optimalCalls: number;
  totalSteps: number;
  runSaved: boolean;
};

function Sparkline({ values, status }: { values: number[]; status: "normal" | "warning" | "critical" }) {
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

function ScoreRing({ score, size = 180 }: { score: number; size?: number }) {
  const radius = 72;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;
  const colour = score >= 80 ? "#2dd4bf" : score >= 60 ? "#60a5fa" : "#f59e0b";
  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative grid place-items-center" style={{ width: size, height: size }}>
        <svg viewBox="0 0 160 160" className="absolute inset-0 -rotate-90">
          <circle cx="80" cy="80" r={radius} fill="none" stroke="#1e293b" strokeWidth="10" />
          <circle cx="80" cy="80" r={radius} fill="none" stroke={colour} strokeWidth="10" strokeLinecap="round" strokeDasharray={circumference} strokeDashoffset={offset} className="transition-all duration-700" />
        </svg>
        <div className="text-center">
          <div className="text-5xl font-black text-white leading-none">{score}</div>
          <div className="mt-1 text-xs font-bold text-slate-400">/ 100</div>
        </div>
      </div>
      <div className="text-xs font-black uppercase tracking-[0.2em] text-slate-300">Command Score</div>
    </div>
  );
}

function ScenarioCard({ scenario, onSelect }: { scenario: ScenarioMeta; onSelect: () => void }) {
  return (
    <button
      onClick={onSelect}
      className="group w-full rounded-2xl border border-slate-700 bg-slate-800/70 p-5 text-left transition hover:border-teal-400/50 hover:bg-teal-400/[.04]"
    >
      <div className="mb-3 flex items-start justify-between gap-3">
        <span className="rounded-full border border-teal-400/30 bg-teal-400/10 px-3 py-1 text-[10px] font-black uppercase tracking-[.14em] text-teal-300">
          {scenario.badge}
        </span>
        <ChevronRight className="mt-0.5 h-4 w-4 shrink-0 text-slate-500 transition-transform group-hover:translate-x-1 group-hover:text-teal-300" />
      </div>
      <h3 className="text-base font-black text-white">{scenario.title}</h3>
      <p className="mt-1.5 text-xs leading-5 text-slate-400">{scenario.subtitle}</p>
      <div className="mt-4 flex items-center gap-3 text-[10px] text-slate-400">
        <span className="flex items-center gap-1"><Clock3 className="h-3 w-3" />{scenario.durationLabel}</span>
        <span className="flex items-center gap-1"><Play className="h-3 w-3" />{scenario.steps.length} decisions</span>
      </div>
    </button>
  );
}

function HistoryPanel({ authenticated, guestId }: { authenticated: boolean; guestId: string }) {
  const { data: history, isLoading } = trpc.incidentCommand.getMyHistory.useQuery(
    { guestId: authenticated ? undefined : guestId },
    { retry: false },
  );
  const { data: leaderboard } = trpc.incidentCommand.getLeaderboard.useQuery(undefined, { retry: false });
  const [tab, setTab] = useState<"history" | "leaderboard">(authenticated ? "history" : "leaderboard");

  return (
    <div className="rounded-2xl border border-slate-700 bg-slate-800/60 overflow-hidden">
      <div className="flex border-b border-slate-700">
        {(["history", "leaderboard"] as const).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 py-3 text-xs font-black uppercase tracking-[.14em] transition ${tab === t ? "bg-slate-800 text-teal-300" : "text-slate-500 hover:text-slate-300"}`}
          >
            {t === "history" ? "My Runs" : "Leaderboard"}
          </button>
        ))}
      </div>

      {tab === "history" && (
        <div className="divide-y divide-slate-800">
          {isLoading && <div className="p-5 text-center text-xs text-slate-400">Loading…</div>}
          {!isLoading && (!history || history.length === 0) && (
            <div className="p-5 text-center text-xs text-slate-400">No runs yet. Complete a scenario to see your history.</div>
          )}
          {history?.map(run => (
            <div key={run.id} className="flex items-center justify-between gap-3 px-5 py-3">
              <div className="min-w-0">
                <div className="truncate text-xs font-bold text-white">{run.scenarioTitle}</div>
                <div className="mt-0.5 text-[10px] text-slate-400">
                  {run.optimalCalls}/{run.totalSteps} optimal · {new Date(run.completedAt).toLocaleDateString()}
                </div>
              </div>
              <div className={`shrink-0 text-lg font-black ${run.commandScore >= 80 ? "text-teal-300" : run.commandScore >= 60 ? "text-blue-300" : "text-amber-300"}`}>
                {run.commandScore}
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === "leaderboard" && (
        <div className="divide-y divide-slate-800">
          {!leaderboard || leaderboard.length === 0 ? (
            <div className="p-5 text-center text-xs text-slate-400">No runs recorded yet. Be the first on the board.</div>
          ) : (
            leaderboard.map(entry => (
              <div key={entry.key} className="flex items-center gap-3 px-5 py-3">
                <div className={`w-7 shrink-0 text-center text-xs font-black ${entry.rank === 1 ? "text-amber-300" : entry.rank === 2 ? "text-slate-300" : entry.rank === 3 ? "text-amber-600" : "text-slate-500"}`}>
                  {entry.rank === 1 ? "🥇" : entry.rank === 2 ? "🥈" : entry.rank === 3 ? "🥉" : `#${entry.rank}`}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-xs font-bold text-white">{entry.displayName}</div>
                  <div className="mt-0.5 text-[10px] text-slate-400">{entry.totalRuns} run{entry.totalRuns !== 1 ? "s" : ""}</div>
                </div>
                <div className={`shrink-0 text-lg font-black ${entry.bestScore >= 80 ? "text-teal-300" : entry.bestScore >= 60 ? "text-blue-300" : "text-amber-300"}`}>
                  {entry.bestScore}
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}

export default function IncidentCommand() {
  usePageMeta({
    title: "Echelon Command | Adaptive Water Operator Incident Simulator",
    description: "Practice real water treatment incident decisions in an interactive control-room simulation.",
    noindex: true,
  });

  const [location] = useLocation();
  const [mode, setMode] = useState<"intro" | "alerting" | "live" | "debrief">("intro");
  const [selectedScenario, setSelectedScenario] = useState<ScenarioMeta>(ALL_SCENARIOS[0]);
  const [stepIndex, setStepIndex] = useState(0);
  const [selectedChoice, setSelectedChoice] = useState<Choice | null>(null);
  const [decisions, setDecisions] = useState<DecisionRecord[]>([]);
  const [debrief, setDebrief] = useState<Debrief | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [totalElapsed, setTotalElapsed] = useState(0);
  const [drillQueued, setDrillQueued] = useState(false);
  const [judgmentResponse, setJudgmentResponse] = useState("");
  const [judgmentDegraded, setJudgmentDegraded] = useState(false);
  const [stepCountdown, setStepCountdown] = useState(90);
  const [alertingProgress, setAlertingProgress] = useState(0);
  const clockRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeRef = useRef<number>(0);
  const STEP_DEADLINE_SECONDS = 90;

  const { data: me } = trpc.auth.me.useQuery(undefined, { retry: false });
  const { data: accessIdentity } = trpc.access.auditMyEntitlements.useQuery(undefined, { retry: false });
  const isAuthenticated = Boolean(me || (accessIdentity && accessIdentity.identityType !== "anonymous"));
  const { guestId, displayName: guestDisplayName } = useGuestSession();
  const debriefMutation = trpc.incidentCommand.debrief.useMutation();
  const judgmentMutation = trpc.incidentCommand.evaluateJudgment.useMutation();
  const queueDrillMutation = trpc.incidentCommand.queueDrill.useMutation({
    onSuccess: () => { setDrillQueued(true); },
  });
  const { data: queuedDrillData } = trpc.incidentCommand.getQueuedDrill.useQuery(
    { guestId: isAuthenticated ? undefined : guestId },
    { retry: false },
  );
  const utils = trpc.useUtils();

  const step = getScenarioStepAtIndex(selectedScenario, stepIndex, decisions.map(decision => decision.choiceId))!;
  const commandScore = useMemo(() => {
    const score = decisions.reduce((sum, d) => sum + d.points, 0);
    return Math.round((score / (selectedScenario.steps.length * 20)) * 100);
  }, [decisions, selectedScenario.steps.length]);

  const plantState = useMemo(() => {
    const missedControl = decisions.reduce((sum, d) => sum + (20 - d.points), 0);
    const filtrationPenalty = decisions[1] ? (20 - decisions[1].points) * 1.8 : 0;
    const recoveryPenalty = decisions[decisions.length - 1] ? (20 - decisions[decisions.length - 1].points) * 0.7 : 0;
    const recordPenalty = decisions[decisions.length - 2] ? (20 - decisions[decisions.length - 2].points) * 3.4 : 0;
    return [
      { label: "Safety barriers", value: Math.max(12, Math.round(100 - missedControl * 0.9)) },
      { label: "Operating reserve", value: Math.max(15, Math.round(88 - filtrationPenalty - recoveryPenalty)) },
      { label: "Record integrity", value: Math.max(8, Math.round(100 - recordPenalty)) },
    ];
  }, [decisions]);

  const stepBaseSeconds = useMemo(() => {
    const [h, m] = (step?.time ?? "02:14").split(":").map(Number);
    return h * 3600 + m * 60;
  }, [step?.time]);

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

  // Countdown timer per step (90 seconds)
  useEffect(() => {
    if (mode !== "live" || selectedChoice) {
      if (countdownRef.current) clearInterval(countdownRef.current);
      return;
    }
    setStepCountdown(STEP_DEADLINE_SECONDS);
    countdownRef.current = setInterval(() => {
      setStepCountdown(prev => Math.max(0, prev - 1));
    }, 1000);
    return () => {
      if (countdownRef.current) clearInterval(countdownRef.current);
    };
  }, [mode, stepIndex, selectedChoice]);

  const clockDisplay = useMemo(() => {
    const h = Math.floor(elapsedSeconds / 3600).toString().padStart(2, "0");
    const m = Math.floor((elapsedSeconds % 3600) / 60).toString().padStart(2, "0");
    const s = (elapsedSeconds % 60).toString().padStart(2, "0");
    return `${h}:${m}:${s}`;
  }, [elapsedSeconds]);

  const begin = (scenario?: ScenarioMeta) => {
    const s = scenario ?? selectedScenario;
    setSelectedScenario(s);
    setMode("alerting");
    setAlertingProgress(0);
    setStepIndex(0);
    setSelectedChoice(null);
    setDecisions([]);
    setDebrief(null);
    setElapsedSeconds(0);
    setTotalElapsed(0);
    setDrillQueued(false);
    setJudgmentResponse("");
    setJudgmentDegraded(false);
    setStepCountdown(STEP_DEADLINE_SECONDS);
    startTimeRef.current = Date.now();
    // Alerting animation: 3 seconds then go live
    let progress = 0;
    const alertInterval = setInterval(() => {
      progress += 2;
      setAlertingProgress(progress);
      if (progress >= 100) {
        clearInterval(alertInterval);
        setMode("live");
      }
    }, 60); // 60ms * 50 steps = 3 seconds
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

  const submitJudgment = async () => {
    if (!step.judgment || selectedChoice || judgmentMutation.isPending) return;
    const response = judgmentResponse.trim();
    if (response.length < step.judgment.minCharacters) return;
    const result = await judgmentMutation.mutateAsync({
      scenarioId: selectedScenario.id,
      stepId: step.id,
      response,
    });
    if (result.mode === "degraded") {
      setJudgmentDegraded(true);
      return;
    }
    const choice = step.choices.find(candidate => candidate.id === result.choiceId);
    if (!choice) return;
    setSelectedChoice(choice);
    setDecisions(current => [...current, {
      stepId: step.id,
      choiceId: choice.id,
      stepTitle: step.title,
      choiceLabel: choice.label,
      consequence: choice.consequence,
      points: choice.points,
      operatorResponse: response,
      judgmentRubric: result.rubric,
      evaluationRationale: result.rationale,
    }]);
  };

  const continueScenario = async () => {
    if (!selectedChoice) return;
    if (stepIndex < selectedScenario.steps.length - 1) {
      setStepIndex(index => index + 1);
      setSelectedChoice(null);
      setJudgmentResponse("");
      setJudgmentDegraded(false);
      setStepCountdown(STEP_DEADLINE_SECONDS);
      return;
    }

    const elapsed = Math.round((Date.now() - startTimeRef.current) / 1000);
    setTotalElapsed(elapsed);

    const finalDecisions = [...decisions];
    const result = await debriefMutation.mutateAsync({
      decisions: finalDecisions.map(d => ({
        stepId: d.stepId,
        choiceId: d.choiceId,
      })),
      scenarioId: selectedScenario.id,
      elapsedSeconds: elapsed,
      guestId: isAuthenticated ? undefined : guestId,
      displayName: isAuthenticated ? undefined : guestDisplayName,
    });
    setDebrief(result);
    setMode("debrief");
    if (result.runSaved) {
      utils.incidentCommand.getMyHistory.invalidate();
      utils.incidentCommand.getLeaderboard.invalidate();
    }
  };

  // ─── INTRO ──────────────────────────────────────────────────────────────────
  // ─── ALERTING (INCIDENT DETECTED animation) ─────────────────────────────────
  if (mode === "alerting") {
    return (
      <div className="flex min-h-screen items-center justify-center" style={{ fontFamily: "'Sora', sans-serif", background: "#060B14" }}>
        <style>{`
          @keyframes alertFlash { 0%,100%{opacity:1} 50%{opacity:.3} }
          @keyframes alertScan { 0%{transform:translateX(-100%)} 100%{transform:translateX(100%)} }
          @keyframes alertPulse { 0%,100%{box-shadow:0 0 40px rgba(239,68,68,.3)} 50%{box-shadow:0 0 80px rgba(239,68,68,.6)} }
        `}</style>
        <div className="relative flex flex-col items-center gap-6 text-center" style={{ animation: "alertPulse 1.5s ease-in-out infinite" }}>
          <div className="relative">
            <AlertTriangle className="h-20 w-20 text-rose-500" style={{ animation: "alertFlash .8s ease-in-out infinite" }} />
          </div>
          <div>
            <div className="text-[10px] font-black uppercase tracking-[.3em] text-rose-400" style={{ animation: "alertFlash 1.2s ease-in-out infinite" }}>⚠ INCIDENT DETECTED</div>
            <h1 className="mt-3 text-3xl font-black tracking-tight text-white sm:text-4xl">{selectedScenario.title}</h1>
            <p className="mt-2 text-sm text-slate-400">{selectedScenario.facilityName} · {selectedScenario.incidentLabel}</p>
          </div>
          <div className="mt-4 w-64">
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-800">
              <div className="h-full rounded-full bg-rose-500 transition-all duration-75" style={{ width: `${alertingProgress}%` }} />
            </div>
            <div className="mt-2 text-[9px] font-bold uppercase tracking-[.2em] text-slate-500">Initializing control room...</div>
          </div>
        </div>
      </div>
    );
  }

  if (mode === "intro") {
    return (
      <div className="min-h-screen text-white" style={{ fontFamily: "'Sora', sans-serif", background: "linear-gradient(135deg, #0F172A 0%, #1E3A5F 50%, #0E7490 100%)" }}>
        <SiteNav currentPath={location} brandName="Echelon Command" />
        <style>{`@keyframes commandPulse{0%,100%{opacity:.38;transform:scale(1)}50%{opacity:.9;transform:scale(1.08)}} .command-grid{background-image:linear-gradient(rgba(45,212,191,.12) 1px,transparent 1px),linear-gradient(90deg,rgba(45,212,191,.12) 1px,transparent 1px);background-size:32px 32px}`}</style>
        <main className="command-grid relative min-h-[calc(100vh-64px)] overflow-hidden">
          <div className="absolute left-[12%] top-24 h-72 w-72 rounded-full bg-blue-500/30 blur-[100px]" />
          <div className="absolute bottom-10 right-[8%] h-80 w-80 rounded-full bg-teal-400/25 blur-[110px]" />
          <div className="relative mx-auto max-w-7xl px-5 py-14 lg:py-20">
            {/* Hero */}
            <div className="mb-12 grid gap-12 lg:grid-cols-[1.08fr_.92fr] lg:items-start">
              <section>
                <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-teal-400/30 bg-teal-400/10 px-4 py-2 text-xs font-bold uppercase tracking-[0.18em] text-teal-300">
                  <span className="h-2 w-2 animate-pulse rounded-full bg-teal-300" />
                  Incident simulator
                </div>
                <h1 className="max-w-4xl text-5xl font-black leading-[1.02] tracking-[-0.04em] sm:text-6xl lg:text-7xl">
                  You cannot learn incident command from a question bank.
                </h1>
                <p className="mt-7 max-w-2xl text-lg leading-8 text-slate-300">
                  Step into a live control room. Read the instruments, respond to a real treatment problem, and defend every decision in a GPT-5.6 after-action review.
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
                <div className="mt-10 grid max-w-2xl grid-cols-3 gap-3">
                  {[
                    ["12", "scenarios"],
                    ["60+", "live signals"],
                    ["1", "AI debrief"],
                  ].map(([value, label]) => (
                    <div key={label} className="rounded-xl border border-white/10 bg-white/[.04] p-4">
                      <div className="text-2xl font-black text-white">{value}</div>
                      <div className="mt-1 text-xs text-slate-300">{label}</div>
                    </div>
                  ))}
                </div>
              </section>

              {/* Score history / leaderboard */}
              <section className="space-y-3">
                <div className="text-xs font-black uppercase tracking-[.16em] text-slate-400">Operator performance</div>
                <HistoryPanel authenticated={isAuthenticated} guestId={guestId} />
              </section>
            </div>

            {/* Scenario selector */}
            <div className="mb-4 text-xs font-black uppercase tracking-[.18em] text-slate-400">Choose a scenario</div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {ALL_SCENARIOS.map(scenario => (
                <ScenarioCard
                  key={scenario.id}
                  scenario={scenario}
                  onSelect={() => begin(scenario)}
                />
              ))}
            </div>
          </div>
        </main>
      </div>
    );
  }

  // ─── DEBRIEF ─────────────────────────────────────────────────────────────────
  if (mode === "debrief" && debrief) {
    return (
      <div className="min-h-screen text-white" style={{ fontFamily: "'Sora', sans-serif", background: "linear-gradient(135deg, #0F172A 0%, #1E3A5F 50%, #0E7490 100%)" }}>
        <SiteNav currentPath={location} brandName="Echelon Command" />
        <main className="mx-auto max-w-7xl px-5 py-10">
          <div className="mb-8 flex flex-col justify-between gap-5 md:flex-row md:items-end">
            <div>
              <div className="mb-3 flex items-center gap-2 text-xs font-black uppercase tracking-[.18em] text-teal-300"><ShieldCheck className="h-4 w-4" /> Incident contained</div>
              <h1 className="text-4xl font-black tracking-tight sm:text-5xl">After-action review</h1>
              <p className="mt-3 max-w-2xl text-slate-300">{selectedScenario.facilityName} · {selectedScenario.subtitle}</p>
            </div>
            <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-xs text-slate-300">
              <Sparkles className="h-4 w-4 text-violet-300" />
              {debrief.generatedBy === "gpt-5.6" ? `${debrief.verification.label} · GPT-5.6` : debrief.verification.label}
            </div>
          </div>

          <div className="grid gap-5 lg:grid-cols-[340px_1fr]">
            <section className="rounded-2xl border border-slate-700 bg-slate-800 p-6">
              <div className="flex justify-center"><ScoreRing score={debrief.commandScore} /></div>
              <div className="mt-6 grid grid-cols-2 gap-3">
                <div className="rounded-xl bg-slate-800 p-4"><div className="text-2xl font-black text-teal-300">{debrief.optimalCalls}/{debrief.totalSteps}</div><div className="mt-1 text-[10px] uppercase tracking-wider text-slate-300">Optimal calls</div></div>
                <div className="rounded-xl bg-slate-800 p-4"><div className="text-2xl font-black text-blue-300">{Math.round(totalElapsed / 60)} min</div><div className="mt-1 text-[10px] uppercase tracking-wider text-slate-300">Real time</div></div>
              </div>
              <button onClick={() => begin()} className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-teal-400 px-4 py-3 text-sm font-black text-slate-950 shadow-[0_0_20px_rgba(45,212,191,.25)] transition hover:bg-teal-300 active:scale-[.97]"><RotateCcw className="h-4 w-4" /> Run scenario again</button>
              <button onClick={() => setMode("intro")} className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border border-slate-700 bg-slate-800 px-4 py-3 text-sm font-bold text-slate-300 transition hover:border-teal-400/40 hover:text-white active:scale-[.97]">Choose another scenario</button>
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
                  onClick={() => { queueDrillMutation.mutate({ drillName: debrief.nextDrill, guestId: isAuthenticated ? undefined : guestId }); }}
                  className={`inline-flex items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-black transition ${drillQueued ? "bg-teal-600 text-white cursor-default" : "bg-blue-600 text-white hover:bg-blue-500"}`}
                  disabled={drillQueued}
                >
                  {drillQueued ? <><CheckCircle2 className="h-4 w-4" /> Drill queued</> : <>Queue simulation <ChevronRight className="h-4 w-4" /></>}
                </button>
              </div>
            </section>
          </div>

          <section className="mt-6 overflow-hidden rounded-2xl border border-slate-700 bg-slate-800">
            <div className="border-b border-slate-700 px-6 py-4 flex items-center justify-between">
              <h2 className="font-black">Score breakdown</h2>
              <div className="flex items-center gap-4 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-teal-400" /> Optimal</span>
                <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-amber-400" /> Partial</span>
                <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-rose-400" /> Unsafe</span>
              </div>
            </div>
            <div className="divide-y divide-slate-700/50">
              {decisions.map((decision, index) => {
                const color = decision.points === 20 ? "teal" : decision.points >= 6 ? "amber" : "rose";
                return (
                  <div key={decision.stepId} className="relative px-6 py-5">
                    <div className={`absolute left-0 top-0 h-full w-1 ${color === "teal" ? "bg-teal-400" : color === "amber" ? "bg-amber-400" : "bg-rose-400"}`} />
                    <div className="grid gap-3 md:grid-cols-[60px_1fr_120px] md:items-start">
                      <div className="flex flex-col items-center gap-1">
                        <span className="text-xs font-black text-slate-300">{getScenarioStepAtIndex(selectedScenario, index, decisions.map(item => item.choiceId))?.time}</span>
                        <span className={`text-[9px] font-black uppercase ${color === "teal" ? "text-teal-400" : color === "amber" ? "text-amber-400" : "text-rose-400"}`}>Step {index + 1}</span>
                      </div>
                      <div>
                        <div className="text-sm font-bold text-white">{decision.stepTitle}</div>
                        <div className="mt-1 text-xs leading-5 text-slate-300">{decision.choiceLabel}</div>
                        <div className={`mt-2 rounded-lg px-3 py-2 text-xs leading-5 ${color === "teal" ? "bg-teal-400/[.06] text-teal-100" : color === "amber" ? "bg-amber-400/[.06] text-amber-100" : "bg-rose-400/[.06] text-rose-100"}`}>{decision.consequence}</div>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <div className={`rounded-full px-3 py-1 text-sm font-black ${color === "teal" ? "bg-teal-400/15 text-teal-200" : color === "amber" ? "bg-amber-400/15 text-amber-200" : "bg-rose-400/15 text-rose-200"}`}>+{decision.points}</div>
                        <div className="h-1.5 w-20 overflow-hidden rounded-full bg-slate-700">
                          <div className={`h-full rounded-full ${color === "teal" ? "bg-teal-400" : color === "amber" ? "bg-amber-400" : "bg-rose-400"}`} style={{ width: `${(decision.points / 20) * 100}%` }} />
                        </div>
                        <span className="text-[9px] text-slate-500">{decision.points}/20 pts</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="border-t border-slate-700 px-6 py-4 flex items-center justify-between">
              <span className="text-sm font-bold text-slate-300">Total earned</span>
              <span className="text-lg font-black text-white">{decisions.reduce((s, d) => s + d.points, 0)} / {decisions.length * 20}</span>
            </div>
          </section>

          {/* Feedback & Email Capture */}
          <div className="mt-6 space-y-3">
            <FeedbackPanel scenarioId={selectedScenario.id} guestId={guestId} />
            <EmailCapturePanel guestId={guestId} />
          </div>

          <div className="mt-8 flex flex-col items-center gap-4 rounded-2xl border border-teal-400/20 bg-teal-400/[.06] px-6 py-8 text-center">
            <RotateCcw className="h-8 w-8 text-teal-300" />
            <div>
              <div className="text-lg font-black text-white">Ready for another run?</div>
              <div className="mt-1 text-sm text-slate-300">Try a different scenario or run this one again to improve your score.</div>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <button onClick={() => begin()} className="inline-flex items-center gap-2 rounded-xl bg-teal-400 px-8 py-3 text-sm font-black text-slate-950 shadow-[0_0_30px_rgba(45,212,191,.3)] transition hover:bg-teal-300 active:scale-[.97]"><RotateCcw className="h-4 w-4" /> Run again</button>
              <button onClick={() => setMode("intro")} className="inline-flex items-center gap-2 rounded-xl border border-teal-400/30 bg-teal-400/10 px-8 py-3 text-sm font-black text-teal-300 transition hover:bg-teal-400/20 active:scale-[.97]"><ArrowRight className="h-4 w-4" /> All scenarios</button>
            </div>
          </div>
          <p className="mt-5 text-center text-[11px] text-slate-600">Training simulation only. Follow approved facility procedures and governing requirements during real incidents.</p>
        </main>
      </div>
    );
  }

  // ─── LIVE ────────────────────────────────────────────────────────────────────
  const scadaAlarms = (() => {
    const alarms: { id: string; severity: "critical" | "warning" | "info"; message: string; time: string }[] = [];
    step.telemetry.forEach(t => {
      if (t.status === "critical") alarms.push({ id: `alarm-${t.label}`, severity: "critical", message: `${t.label} at ${t.value} ${t.unit} — exceeds limit`, time: step.time });
      else if (t.status === "warning") alarms.push({ id: `warn-${t.label}`, severity: "warning", message: `${t.label} trending high (${t.value} ${t.unit})`, time: step.time });
    });
    if (alarms.length === 0) alarms.push({ id: "info-nominal", severity: "info", message: "All readings normal", time: step.time });
    return alarms;
  })();

  // Pick top 4 telemetry items for radial gauges
  const gaugeItems = step.telemetry.slice(0, 4);

  return (
    <div className="min-h-screen text-white" style={{ fontFamily: "'Sora', sans-serif", background: "#060B14" }}>
      <SiteNav currentPath={location} brandName="Echelon Command" />
      {/* Scanline overlay for CRT effect */}
      <style>{`
        .scada-scanline { background: repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,255,200,0.015) 2px, rgba(0,255,200,0.015) 4px); pointer-events: none; position: fixed; inset: 0; z-index: 1; }
        .scada-grid { background-image: linear-gradient(rgba(45,212,191,.04) 1px, transparent 1px), linear-gradient(90deg, rgba(45,212,191,.04) 1px, transparent 1px); background-size: 24px 24px; }
        @keyframes scadaBlink { 0%,100%{opacity:1} 50%{opacity:.4} }
      `}</style>
      <div className="scada-scanline" />
      <main className="scada-grid relative mx-auto max-w-[1600px] px-3 py-4" style={{ zIndex: 2 }}>
        <ScadaHeader
          facilityName={selectedScenario.facilityName}
          incidentLabel={selectedScenario.incidentLabel}
          clockDisplay={clockDisplay}
          stepIndex={stepIndex}
          totalSteps={selectedScenario.steps.length}
          commandScore={commandScore}
          countdown={stepCountdown}
          countdownMax={STEP_DEADLINE_SECONDS}
          onBack={() => setMode("intro")}
        />

        <div className="grid gap-3 lg:grid-cols-[1fr_320px]">
          {/* LEFT COLUMN — main operational view */}
          <div className="space-y-3">
            {/* Process flow diagram */}
            <ProcessFlowDiagram nodes={selectedScenario.processNodes} focusNode={step.focusNode} decisions={decisions} />

            {/* Radial gauges row */}
            <div className="grid grid-cols-2 gap-2 lg:grid-cols-4">
              {gaugeItems.map(item => (
                <div key={item.label} className={`flex justify-center rounded-xl border p-3 ${item.status === "critical" ? "border-rose-500/40 bg-rose-500/[.04]" : item.status === "warning" ? "border-amber-400/30 bg-amber-400/[.03]" : "border-slate-700 bg-[#0B1120]"}`}>
                  <RadialGauge value={parseFloat(String(item.value)) || 0} max={(parseFloat(String(item.value)) || 50) * 2} label={item.label} unit={item.unit} status={item.status} size={110} />
                </div>
              ))}
            </div>

            {/* Telemetry ticker (all items) */}
            <TelemetryTicker items={step.telemetry} />

            <section className="rounded-2xl border border-slate-700 bg-slate-800 p-5">
              <div className="mb-4 flex items-start gap-4">
                <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-blue-500/15 text-blue-300"><BrainCircuit className="h-5 w-5" /></div>
                <div><div className="text-[10px] font-black uppercase tracking-[.18em] text-blue-300">Command decision {stepIndex + 1}</div><h2 className="mt-1 text-xl font-black">{step.title}</h2><p className="mt-2 text-sm leading-6 text-slate-300">{step.briefing}</p></div>
              </div>
              <div className="mb-4 rounded-xl border border-rose-400/20 bg-rose-400/[.06] px-4 py-3 text-xs font-black tracking-wide text-rose-200"><AlertTriangle className="mr-2 inline h-4 w-4" /> {step.alarm}</div>
              {step.judgment && !selectedChoice && !judgmentDegraded && (
                <div className="rounded-2xl border border-violet-400/30 bg-violet-400/[.06] p-5">
                  <div className="mb-2 flex items-center gap-2 text-xs font-black uppercase tracking-[.16em] text-violet-200"><Sparkles className="h-4 w-4" /> GPT-5.6 judgment turn</div>
                  <p className="mb-4 text-sm leading-6 text-slate-200">{step.judgment.prompt}</p>
                  <textarea
                    value={judgmentResponse}
                    onChange={event => setJudgmentResponse(event.target.value)}
                    placeholder={step.judgment.placeholder}
                    maxLength={1200}
                    rows={5}
                    className="w-full resize-y rounded-xl border border-slate-600 bg-slate-950/50 p-4 text-sm leading-6 text-white outline-none transition placeholder:text-slate-500 focus:border-violet-400"
                  />
                  <div className="mt-3 flex items-center justify-between gap-4">
                    <span className="text-[10px] text-slate-400">{judgmentResponse.trim().length}/1200 characters</span>
                    <button
                      onClick={submitJudgment}
                      disabled={judgmentResponse.trim().length < step.judgment.minCharacters || judgmentMutation.isPending}
                      className="inline-flex items-center gap-2 rounded-xl bg-violet-500 px-5 py-3 text-sm font-black text-white transition hover:bg-violet-400 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      {judgmentMutation.isPending ? "Interpreting judgment..." : "Commit judgment"}<ArrowRight className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              )}
              {judgmentDegraded && !selectedChoice && (
                <div className="mb-3 rounded-xl border border-amber-400/30 bg-amber-400/[.08] p-4 text-sm leading-6 text-amber-100">
                  <div className="font-black">AI judgment is temporarily unavailable</div>
                  <p className="mt-1 text-xs text-amber-100/80">Pick the closest action below to continue.</p>
                </div>
              )}
              <div className={`space-y-3 ${step.judgment && !judgmentDegraded && !selectedChoice ? "hidden" : ""}`}>
                {step.choices.map((choice, index) => {
                  const chosen = selectedChoice?.id === choice.id;
                  const disabled = Boolean(selectedChoice && !chosen);
                  return <button key={choice.id} disabled={Boolean(selectedChoice)} onClick={() => choose(choice)} className={`group w-full rounded-xl border p-4 text-left transition ${chosen ? choice.points === 20 ? "border-teal-400 bg-teal-400/10" : choice.points > 0 ? "border-amber-400 bg-amber-400/10" : "border-rose-400 bg-rose-400/10" : disabled ? "border-slate-700 bg-slate-800/50 opacity-40" : "border-slate-700 bg-slate-800/70 hover:border-blue-400 hover:bg-blue-400/[.05]"}`}>
                    <div className="flex items-start gap-3"><div className={`grid h-7 w-7 shrink-0 place-items-center rounded-lg text-xs font-black ${chosen ? "bg-white text-slate-950" : "bg-slate-800 text-slate-300 group-hover:bg-blue-500 group-hover:text-white"}`}>{chosen ? choice.points === 20 ? <CheckCircle2 className="h-4 w-4" /> : <XCircle className="h-4 w-4" /> : String.fromCharCode(65 + index)}</div><div><div className="text-sm font-bold leading-6 text-slate-100">{choice.label}</div><div className="mt-1 text-xs leading-5 text-slate-300">{choice.rationale}</div></div></div>
                  </button>;
                })}
              </div>
              {selectedChoice && <div className={`mt-4 rounded-xl border p-4 ${selectedChoice.points === 20 ? "border-teal-400/30 bg-teal-400/[.06]" : selectedChoice.points > 0 ? "border-amber-400/30 bg-amber-400/[.06]" : "border-rose-400/30 bg-rose-400/[.06]"}`}>
                <div className="flex items-start justify-between gap-4"><div><div className="text-[10px] font-black uppercase tracking-[.16em] text-slate-300">Plant consequence</div><p className="mt-2 text-sm leading-6 text-slate-200">{selectedChoice.consequence}</p></div><span className={`shrink-0 rounded-full px-3 py-1 text-xs font-black ${selectedChoice.points === 20 ? "bg-teal-400/15 text-teal-200" : selectedChoice.points > 0 ? "bg-amber-400/15 text-amber-200" : "bg-rose-400/15 text-rose-200"}`}>+{selectedChoice.points}</span></div>
                {decisions[decisions.length - 1]?.judgmentRubric && (
                  <div className="mt-4 rounded-xl border border-violet-400/20 bg-violet-400/[.06] p-4">
                    <div className="text-[10px] font-black uppercase tracking-[.16em] text-violet-200">GPT-5.6 interpretation</div>
                    <div className="mt-3 grid grid-cols-2 gap-2 text-[10px]">
                      {Object.entries(decisions[decisions.length - 1].judgmentRubric!).map(([key, met]) => <div key={key} className={`rounded-lg px-3 py-2 font-bold ${met ? "bg-teal-400/10 text-teal-200" : "bg-slate-900/50 text-slate-400"}`}>{met ? "✓" : "○"} {key.replace(/([A-Z])/g, " $1").toLowerCase()}</div>)}
                    </div>
                    <p className="mt-3 text-xs leading-5 text-slate-300">{decisions[decisions.length - 1].evaluationRationale}</p>
                  </div>
                )}
                <button onClick={continueScenario} disabled={debriefMutation.isPending} className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-white px-4 py-3 text-sm font-black text-slate-950 transition hover:bg-slate-200 disabled:opacity-60">{debriefMutation.isPending ? "Generating and verifying review..." : stepIndex === selectedScenario.steps.length - 1 ? "Generate after-action review" : "Advance incident"}<ChevronRight className="h-4 w-4" /></button>
              </div>}
            </section>
          </div>

          {/* RIGHT COLUMN — operational panels */}
          <aside className="space-y-3">
            {/* Alarm register */}
            <AlarmPanel alarms={scadaAlarms} />

            {/* Plant state / barrier integrity */}
            <PlantStateBars items={plantState} />

            {/* Incident timeline */}
            <div className="rounded-xl border border-slate-700 bg-[#0B1120] p-3">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-[9px] font-black uppercase tracking-[.16em] text-slate-400">Incident timeline</span>
                <span className="text-[8px] font-mono text-slate-500">live record</span>
              </div>
              <div className="max-h-[200px] space-y-3 overflow-y-auto scrollbar-thin">
                <div className="flex gap-2">
                  <div className="flex flex-col items-center"><span className="mt-1 h-2 w-2 rounded-full bg-rose-400" /><span className="mt-1 h-full w-px bg-slate-800" /></div>
                  <div className="pb-1.5"><div className="text-[8px] font-mono text-slate-500">{selectedScenario.steps[0]?.time}</div><div className="mt-0.5 text-[10px] font-bold text-slate-300">{selectedScenario.incidentLabel} initiated</div></div>
                </div>
                {decisions.map((decision, index) => (
                  <div key={decision.stepId} className="flex gap-2">
                    <div className="flex flex-col items-center"><span className={`mt-1 h-2 w-2 rounded-full ${decision.points === 20 ? "bg-teal-400" : decision.points > 0 ? "bg-amber-400" : "bg-rose-400"}`} /><span className="mt-1 h-full w-px bg-slate-800" /></div>
                    <div className="pb-1.5"><div className="text-[8px] font-mono text-slate-500">{getScenarioStepAtIndex(selectedScenario, index, decisions.map(d => d.choiceId))?.time}</div><div className="mt-0.5 text-[10px] font-bold leading-4 text-slate-200">{decision.choiceLabel}</div></div>
                  </div>
                ))}
                {decisions.length < selectedScenario.steps.length && (
                  <div className="flex gap-2">
                    <div className="mt-1 h-2 w-2 animate-pulse rounded-full bg-blue-400" />
                    <div><div className="text-[8px] font-mono text-blue-300">{step.time}</div><div className="mt-0.5 text-[10px] font-bold text-slate-400">Awaiting operator decision</div></div>
                  </div>
                )}
              </div>
            </div>

            {/* GPT-5.6 adaptive review info */}
            <div className="rounded-xl border border-blue-400/20 bg-blue-400/[.04] p-3">
              <div className="flex items-center gap-2 text-[9px] font-black uppercase tracking-[.16em] text-blue-300"><Sparkles className="h-3 w-3" /> GPT-5.6 review</div>
              <p className="mt-2 text-[10px] leading-5 text-slate-400">Adaptive after-action review will evaluate your full decision chain upon completion.</p>
            </div>

            {/* Training boundary */}
            <div className="rounded-xl border border-slate-700 bg-[#0B1120] p-3">
              <div className="flex items-center gap-2 text-[9px] font-black text-slate-400"><ShieldCheck className="h-3 w-3 text-teal-400" /> Training boundary</div>
              <p className="mt-1.5 text-[9px] leading-4 text-slate-500">Simulator only. Follow your facility ERP and governing requirements.</p>
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
}
