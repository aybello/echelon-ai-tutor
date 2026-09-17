import { useMemo, useState } from "react";
import { Link, useLocation } from "wouter";
import { Building2, CheckCircle2, ShieldCheck, Users } from "lucide-react";
import {
  type TeamStreamTier,
  TEAM_STREAM_TIER_DESCRIPTIONS,
  TEAM_STREAM_TIER_LABELS,
  TEAM_VOLUME_TIERS,
  formatTeamPriceCAD,
  getTeamBasePriceCents,
  getTeamEffectiveDiscountPct,
  getTeamEffectiveSeatPriceCents,
  getTeamSavingsCents,
  getTeamTotalPriceCents,
  getTeamVolumeTier,
} from "@shared/teamPricing";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import SiteNav from "@/components/SiteNav";
import { FlexOrderBuilder } from "@/components/FlexOrderBuilder";

const ANNUAL_TIERS: TeamStreamTier[] = [
  "stream-water",
  "stream-wastewater",
  "stream-water-dist",
  "stream-wastewater-coll",
  "all-access",
];

const FEATURES = [
  "Released question banks, mock exams, flashcards, and AI Tutor access",
  "Manager dashboard for licence assignment and operator progress",
  "Named-operator licensing with practical onboarding controls",
  "Graduated volume pricing calculated before checkout",
];

export default function Teams() {
  const [location] = useLocation();
  const [planType, setPlanType] = useState<"annual" | "flex">("annual");
  const [region, setRegion] = useState<"ontario" | "western">("ontario");
  const [tier, setTier] = useState<TeamStreamTier>("all-access");
  const [seats, setSeats] = useState(5);
  const [seatInput, setSeatInput] = useState("5");
  const [organizationName, setOrganizationName] = useState("");
  const [managerEmail, setManagerEmail] = useState("");

  const createTeamCheckout = trpc.stripe.createTeamCheckout.useMutation({
    onSuccess: (result) => { if (result.url) window.location.href = result.url; },
    onError: (error) => toast.error(error.message),
  });

  const volumeTier = useMemo(() => getTeamVolumeTier(seats), [seats]);
  const basePrice = getTeamBasePriceCents(region, tier);
  const annualTotal = getTeamTotalPriceCents(region, tier, seats);
  const averageSeatPrice = getTeamEffectiveSeatPriceCents(region, tier, seats);
  const effectiveDiscount = getTeamEffectiveDiscountPct(region, tier, seats);
  const savings = getTeamSavingsCents(region, tier, seats);

  const commitSeats = () => {
    const nextSeats = Number.parseInt(seatInput, 10);
    if (!Number.isInteger(nextSeats) || nextSeats < 5 || nextSeats > 500) {
      setSeatInput(String(seats));
      toast.error("Annual Teams plans require 5 to 500 operator licences.");
      return;
    }
    setSeats(nextSeats);
    setSeatInput(String(nextSeats));
  };

  const startAnnualCheckout = () => {
    if (!organizationName.trim()) return toast.error("Enter your organization name.");
    if (!managerEmail.trim() || !managerEmail.includes("@")) return toast.error("Enter a valid manager email.");
    createTeamCheckout.mutate({
      orgName: organizationName.trim(),
      province: region,
      tier,
      seats,
      managerEmail: managerEmail.trim().toLowerCase(),
    });
  };

  return (
    <div className="min-h-screen bg-slate-50 text-gray-900">
      <SiteNav currentPath={location} />
      <section className="relative overflow-hidden px-6 pb-14 pt-12 text-center" style={{ background: "linear-gradient(135deg, #1E3A5F 0%, #0E7490 100%)" }}>
        <div className="pointer-events-none absolute inset-0 opacity-70" style={{ backgroundImage: "radial-gradient(circle at 1px 1px, rgba(255,255,255,0.11) 1px, transparent 0)", backgroundSize: "32px 32px" }} />
        <div className="relative mx-auto max-w-4xl">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/15 px-4 py-1.5 text-sm font-semibold text-white"><Building2 className="h-3.5 w-3.5" />Echelon for Teams</div>
          <h1 className="mb-4 text-3xl font-bold tracking-tight text-white md:text-5xl">Train your crew. Track every operator.</h1>
          <p className="mx-auto max-w-2xl text-base leading-relaxed text-blue-100">Choose targeted, course-specific preparation for a current exam or an annual stream plan for your workforce. Every new sale is backed by the released question-bank library.</p>
          <div className="mt-6 flex flex-wrap justify-center gap-5 text-sm text-blue-50">
            <span className="inline-flex items-center gap-2"><Users className="h-4 w-4 text-cyan-200" />Named operator licences</span>
            <span className="inline-flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-cyan-200" />Stripe checkout and paid invoice</span>
          </div>
        </div>
      </section>

      <main className="mx-auto max-w-6xl px-6 py-12">
        <section className="mx-auto mb-10 max-w-4xl">
          <h2 className="text-center text-2xl font-bold text-slate-900">Choose the right team product</h2>
          <p className="mt-2 text-center text-sm text-slate-600">Annual plans support ongoing workforce development. Flex is for a defined exam-prep cohort.</p>
          <div className="mt-6 grid gap-5 md:grid-cols-2">
            <button type="button" onClick={() => setPlanType("annual")} className={`relative rounded-2xl border-2 p-6 text-left transition ${planType === "annual" ? "border-blue-900 bg-blue-50 shadow-lg shadow-blue-100" : "border-slate-200 bg-white hover:border-slate-300"}`}>
              <div className="text-lg font-bold text-slate-950">Teams Annual</div>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">Year-round access for a named operator across one stream or all streams. Best for workforce training programs.</p>
              <div className="mt-4 inline-flex rounded-full bg-blue-100 px-3 py-1 text-xs font-bold text-blue-900">From CA$449 per operator / year · 5-seat minimum</div>
            </button>
            <button type="button" onClick={() => setPlanType("flex")} className={`relative rounded-2xl border-2 p-6 text-left transition ${planType === "flex" ? "border-teal-700 bg-teal-50 shadow-lg shadow-teal-100" : "border-slate-200 bg-white hover:border-slate-300"}`}>
              <div className="text-lg font-bold text-slate-950">Teams Flex</div>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">Course-specific licences for named operators. Combine 3- and 6-month licences in one order.</p>
              <div className="mt-4 inline-flex rounded-full bg-teal-100 px-3 py-1 text-xs font-bold text-teal-800">From CA$39 per operator · one-time payment</div>
            </button>
          </div>
        </section>

        {planType === "flex" ? <section className="mx-auto max-w-2xl"><FlexOrderBuilder /></section> : <section className="grid items-start gap-8 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="rounded-2xl border border-slate-200 bg-white p-7 shadow-xl shadow-slate-200/50">
            <h2 className="text-xl font-bold text-slate-900">Configure an annual plan</h2>
            <p className="mt-1 text-sm text-slate-600">One annual licence is assigned to one named operator. Licences have a five-seat minimum and renew yearly until cancelled.</p>
            <div className="mt-6 space-y-5">
              <div><Label>Province or region</Label><Select value={region} onValueChange={(value) => setRegion(value as "ontario" | "western")}><SelectTrigger className="mt-2"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="ontario">Ontario (MOECP / OWWCO)</SelectItem><SelectItem value="western">Western Canada (WPI)</SelectItem></SelectContent></Select></div>
              <div><Label>Annual access scope</Label><div className="mt-2 grid gap-2 sm:grid-cols-2">{ANNUAL_TIERS.map((annualTier) => <button key={annualTier} type="button" onClick={() => setTier(annualTier)} className={`rounded-xl border p-3 text-left transition ${tier === annualTier ? "border-blue-700 bg-blue-50 ring-1 ring-blue-700" : "border-slate-200 hover:border-slate-300"}`}><div className="flex items-center justify-between gap-2"><span className="text-sm font-bold text-slate-900">{TEAM_STREAM_TIER_LABELS[annualTier]}</span><span className="text-sm font-bold text-teal-700">{formatTeamPriceCAD(getTeamBasePriceCents(region, annualTier))}</span></div><p className="mt-1 text-xs leading-relaxed text-slate-500">{TEAM_STREAM_TIER_DESCRIPTIONS[annualTier]}</p></button>)}</div></div>
              <div><Label>Annual operator licences</Label><p className="mt-1 text-xs text-slate-500">Graduated discounts apply only to licences in each volume band.</p><div className="mt-2 flex items-center gap-3"><Input type="number" min={5} max={500} value={seatInput} onChange={(event) => setSeatInput(event.target.value)} onBlur={commitSeats} onKeyDown={(event) => { if (event.key === "Enter") commitSeats(); }} className="w-28" /><span className="text-sm text-slate-500">named operators</span></div><div className="mt-3 flex flex-wrap gap-2">{[5, 10, 25, 50, 100].map((count) => <button key={count} type="button" onClick={() => { setSeats(count); setSeatInput(String(count)); }} className={`rounded-full border px-3 py-1 text-xs font-semibold ${seats === count ? "border-blue-900 bg-blue-900 text-white" : "border-slate-200 text-slate-600 hover:border-blue-300"}`}>{count}</button>)}</div></div>
              <div className="rounded-xl border border-blue-100 bg-gradient-to-br from-blue-50 to-teal-50 p-5"><div className="flex justify-between gap-5"><span className="text-sm text-slate-600">Average per operator / year</span><span className="text-xl font-bold text-teal-700">{formatTeamPriceCAD(averageSeatPrice)}</span></div><div className="mt-3 flex justify-between gap-5 border-t border-blue-100 pt-3"><span className="text-sm font-medium text-slate-700">Total before tax ({seats} licences)</span><span className="text-xl font-bold text-slate-900">{formatTeamPriceCAD(annualTotal)}</span></div>{savings > 0 && <p className="mt-3 text-xs font-semibold text-teal-700">Blended discount: {effectiveDiscount}% · you save {formatTeamPriceCAD(savings)} against list price.</p>}</div>
              <div className="space-y-1"><p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Volume pricing</p>{TEAM_VOLUME_TIERS.map((band) => <div key={band.label} className={`flex justify-between rounded-lg px-3 py-2 text-sm ${band === volumeTier ? "bg-blue-50 font-semibold text-blue-950" : "text-slate-600"}`}><span>{band.label}{band.discountPct ? ` · ${band.discountPct}% off those licences` : " · list price"}</span><span>{formatTeamPriceCAD(Math.round(basePrice * (1 - band.discountPct / 100)))}/yr</span></div>)}</div>
              <div className="grid gap-4 sm:grid-cols-2"><div><Label>Organization name</Label><Input value={organizationName} onChange={(event) => setOrganizationName(event.target.value)} placeholder="e.g. Utility name" className="mt-2" /></div><div><Label>Manager email</Label><Input type="email" value={managerEmail} onChange={(event) => setManagerEmail(event.target.value)} placeholder="manager@utility.ca" className="mt-2" /></div></div>
              <Button onClick={startAnnualCheckout} disabled={createTeamCheckout.isPending} className="h-12 w-full bg-gradient-to-r from-blue-900 to-teal-700 text-base font-bold text-white hover:opacity-95">{createTeamCheckout.isPending ? "Opening secure checkout…" : `Start ${seats}-seat ${TEAM_STREAM_TIER_LABELS[tier]} plan — ${formatTeamPriceCAD(annualTotal)}/year`}</Button>
            </div>
          </div>
          <aside className="space-y-5"><div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"><h3 className="text-lg font-bold text-slate-900">Annual plan includes</h3><ul className="mt-4 space-y-3">{FEATURES.map((feature) => <li key={feature} className="flex gap-3 text-sm leading-relaxed text-slate-600"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-teal-600" />{feature}</li>)}</ul></div><div className="rounded-2xl border border-cyan-100 bg-cyan-50 p-6"><h3 className="text-base font-bold text-slate-900">Need a specific exam only?</h3><p className="mt-2 text-sm leading-relaxed text-slate-600">Use Teams Flex to buy 3- or 6-month Course Passes for the exact operators and courses in your cohort. Retake Extensions are available once per activated Course Pass.</p><Button variant="outline" onClick={() => setPlanType("flex")} className="mt-4 border-teal-600 text-teal-800 hover:bg-teal-100">Build a Flex order</Button></div><p className="px-1 text-xs leading-relaxed text-slate-500">Historical customer recovery is handled separately and is not changed by any new Team or Flex order.</p></aside>
        </section>}
        <div className="mt-10 text-center text-sm text-slate-600">Buying for one learner? <Link href="/pricing" className="font-semibold text-teal-700">View permanent Individual Exam Passes</Link>.</div>
      </main>
    </div>
  );
}
