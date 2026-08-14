/**
 * Teams.tsx — Public "Echelon for Teams" buy page.
 * Clean white premium theme — bold blue/teal hero, white body, Stripe-style.
 */

import { useState, useMemo } from "react";
import {
  type TeamStreamTier,
  TEAM_BASE_PRICE,
  TEAM_VOLUME_TIERS,
  getTeamVolumeTier,
  getTeamEffectiveSeatPriceCents,
  getTeamEffectiveDiscountPct,
  getTeamSavingsCents,
  getTeamTotalPriceCents,
  formatTeamPriceCAD,
} from "@shared/teamPricing";
import { trpc } from "@/lib/trpc";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useLocation, Link } from "wouter";
import SiteNav from "@/components/SiteNav";
import { Building2, CheckCircle2, Zap, Shield, BarChart3, Users, TrendingUp, Award } from "lucide-react";

const FEATURES = [
  "Complete question bank for your selected stream",
  "AI Tutor with personalized coaching",
  "Progress dashboard per operator",
  "Manager dashboard with estimated study metrics",
  "Exam date tracking and reminders",
  "Progress-tracked flashcards",
  "Proactive email nudges for inactive operators",
  "Annual renewal — operator access can be deactivated and restored without losing progress",
];

import { FlexOrderBuilder } from "@/components/FlexOrderBuilder";

export default function Teams() {
  const [planType, setPlanType] = useState<"annual" | "flex">("annual");
  const [location] = useLocation();
  const [seats, setSeats] = useState(5);
  const [seatInput, setSeatInput] = useState("5");
  const [province, setProvince] = useState<"ontario" | "western">("ontario");
  const tier: TeamStreamTier = "all-access"; // Annual Plan is always all-access at CA$399
  const [orgName, setOrgName] = useState("");
  const [managerEmail, setManagerEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const volumeTier = useMemo(() => getTeamVolumeTier(seats), [seats]);
  const seatPriceCents = useMemo(() => getTeamEffectiveSeatPriceCents(province, tier, seats), [province, seats]);
  const totalCents = useMemo(() => getTeamTotalPriceCents(province, tier, seats), [province, seats]);
  const basePriceCents = 39900; // CA$399 unified price
  const createCheckout = trpc.stripe.createTeamCheckout.useMutation();

  const handleSeatsChange = (val: string) => setSeatInput(val);
  const commitSeats = () => {
    const n = parseInt(seatInput, 10);
    if (!isNaN(n) && n >= 5 && n <= 500) {
      setSeats(n);
      setSeatInput(String(n));
    } else {
      setSeatInput(String(seats));
    }
  };

  const handleCheckout = async () => {
    if (!orgName.trim()) { toast.error("Please enter your organization name."); return; }
    if (!managerEmail.trim() || !managerEmail.includes("@")) { toast.error("Please enter a valid manager email."); return; }
    if (seats < 5) { toast.error("Annual All-Access requires a minimum of 5 operators."); return; }
    setLoading(true);
    try {
      const result = await createCheckout.mutateAsync({
        orgName: orgName.trim(),
        province,
        tier,
        seats,
        managerEmail: managerEmail.trim().toLowerCase(),
      });
      if (result.url) window.location.href = result.url;
    } catch (err: any) {
      toast.error("Could not start checkout", { description: err.message ?? "Please try again." });
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-gray-900">
      <SiteNav
        currentPath={location}
        rightSlot={
          <a
            href="/account"
            style={{
              padding: "8px 16px", borderRadius: 10,
              background: "transparent",
              color: "#1E3A5F", border: "1.5px solid #1E3A5F",
              fontSize: 13, fontWeight: 700,
              cursor: "pointer", fontFamily: "inherit", whiteSpace: "nowrap",
              textDecoration: "none", display: "inline-block",
            }}
          >
            Sign In
          </a>
        }
      />

      {/* Hero — bold gradient band */}
      <section
        className="px-6 pt-10 pb-14 text-center relative overflow-hidden"
        style={{ background: "linear-gradient(135deg, #1E3A5F 0%, #0E7490 100%)" }}
      >
        <div style={{
          position: "absolute", inset: 0, pointerEvents: "none",
          backgroundImage: "radial-gradient(circle at 1px 1px, rgba(255,255,255,0.07) 1px, transparent 0)",
          backgroundSize: "32px 32px",
        }} />
        <div className="relative max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-2 mb-3 px-4 py-1.5 rounded-full text-sm font-semibold bg-white/15 text-white border border-white/25">
            <Building2 className="w-3.5 h-3.5" />
            Echelon for Teams
          </div>
          <h1 className="text-3xl md:text-5xl font-bold tracking-tight mb-3 text-white">
            Train your entire crew.<br />
            <span className="text-cyan-200">Track every operator.</span>
          </h1>
          <p className="text-base text-blue-100 max-w-2xl mx-auto leading-relaxed">
            One team plan gives every operator at your utility access to Echelon's
            question banks, AI Tutor, and progress tracking. You get a manager dashboard
            to see who is ready and who needs attention.
          </p>
          <div className="flex flex-wrap justify-center gap-6 mt-6">
            {[
            { icon: <Users className="w-4 h-4" />, value: "Annual All-Access", label: "every stream and level" },
            { icon: <Award className="w-4 h-4" />, value: "Course Passes", label: "3, 6, or 12 months" },
            { icon: <TrendingUp className="w-4 h-4" />, value: "Team dashboard", label: "study progress and readiness" },
            ].map((stat: { icon: React.ReactNode; value: string; label: string }) => (
              <div key={stat.label} className="flex items-center gap-2 text-white/80">
                <span className="text-cyan-200">{stat.icon}</span>
                <span className="font-bold text-white text-lg">{stat.value}</span>
                <span className="text-sm">{stat.label}</span>
              </div>
            ))}
          </div>
          {/* Product positioning */}
          <div className="mt-4 flex justify-center">
            <div className="flex items-center gap-3 bg-white/10 border border-white/20 rounded-full px-5 py-2.5 backdrop-blur-sm">
              <Shield className="w-4 h-4 text-cyan-200" aria-hidden="true" />
              <span className="text-white/90 text-sm font-medium">Built for <span className="font-bold text-white">utility training teams</span></span>
            </div>
          </div>
        </div>
      </section>

      {/* Main grid — white/slate body */}
      {/* ── Plan Type Chooser ─── */}
      <div className="max-w-4xl mx-auto px-6 pt-16 pb-8">
        <h2 className="text-center text-2xl font-bold text-gray-900 mb-2">Choose Your Plan Type</h2>
        <p className="text-center text-gray-500 mb-8">Select the option that fits your team's certification needs.</p>
        <div className="grid md:grid-cols-2 gap-5">
          <button
            onClick={() => setPlanType("annual")}
            className={`relative text-left p-6 rounded-2xl border-2 transition-all duration-200 ${
              planType === "annual"
                ? "border-[#1E3A5F] bg-[#EFF6FF] shadow-lg shadow-[#1E3A5F20]"
                : "border-gray-200 bg-white hover:border-gray-300 hover:shadow-md"
            }`}
          >
            {planType === "annual" && (
              <div className="absolute top-4 right-4 w-6 h-6 bg-[#1E3A5F] rounded-full flex items-center justify-center">
                <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
              </div>
            )}
            <div className="text-lg font-bold text-gray-900 mb-1">Annual Plan</div>
            <p className="text-sm text-gray-500 leading-relaxed">Every course, every stream. One price per operator per year. Best for ongoing training programs.</p>
            <div className="mt-3 text-xs font-semibold text-[#1E3A5F] bg-blue-100 inline-block px-2.5 py-1 rounded-full">CA$399/operator/year · 5-seat minimum</div>
          </button>
          <button
            onClick={() => setPlanType("flex")}
            className={`relative text-left p-6 rounded-2xl border-2 transition-all duration-200 ${
              planType === "flex"
                ? "border-teal-600 bg-teal-50 shadow-lg shadow-teal-100"
                : "border-gray-200 bg-white hover:border-gray-300 hover:shadow-md"
            }`}
          >
            {planType === "flex" && (
              <div className="absolute top-4 right-4 w-6 h-6 bg-teal-600 rounded-full flex items-center justify-center">
                <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
              </div>
            )}
            <div className="text-lg font-bold text-gray-900 mb-1">Course Passes</div>
            <p className="text-sm text-gray-500 leading-relaxed">Buy specific courses for specific operators. 3, 6, or 12 month terms. Best for targeted exam prep cohorts.</p>
            <div className="mt-3 text-xs font-semibold text-teal-700 bg-teal-100 inline-block px-2.5 py-1 rounded-full">Price shown by course and term</div>
          </button>
        </div>
      </div>

      {planType === "flex" ? (
        <div className="max-w-xl mx-auto px-6 pb-16">
          <FlexOrderBuilder />
        </div>
      ) : (

      <section className="max-w-6xl mx-auto px-6 py-16 grid md:grid-cols-2 gap-10 items-start">

        {/* Left: Pricing calculator */}
        <div className="bg-white rounded-2xl p-8 space-y-6 shadow-xl border border-gray-100">
          <div>
            <h2 className="text-xl font-bold mb-1 text-gray-900">Configure your plan</h2>
            <p className="text-gray-500 text-sm">Volume discounts apply automatically.</p>
          </div>

          {/* Province */}
          <div className="space-y-2">
            <Label className="text-gray-700 font-medium">Province / Region</Label>
            <Select value={province} onValueChange={v => setProvince(v as "ontario" | "western")}>
              <SelectTrigger className="border-gray-300 text-gray-900 bg-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ontario">Ontario (MOECP / OWWCO)</SelectItem>
                <SelectItem value="western">Western Canada (WPI)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* All-Access badge */}
          <div className="rounded-xl px-4 py-3 bg-gradient-to-r from-blue-50 to-teal-50 border border-blue-100">
            <p className="text-sm font-semibold text-blue-800">All-Access — Every stream, every level</p>
            <p className="text-xs text-gray-500 mt-0.5">Water Treatment, Wastewater Treatment, Water Distribution, Wastewater Collection — all 4 streams, Class 1–4.</p>
          </div>

          {/* Seats */}
          <div className="space-y-2">
            <Label className="text-gray-700 font-medium">Number of annual operator licences</Label>
            <p className="text-xs text-gray-500 -mt-1">Each annual licence covers one operator during the contract year. Minimum 5 operators. Operator access can be deactivated and restored without losing progress.</p>
            <div className="flex items-center gap-3">
              <Input
                type="number"
                min={5}
                max={500}
                value={seatInput}
                onChange={e => handleSeatsChange(e.target.value)}
                onBlur={commitSeats}
                onKeyDown={e => { if (e.key === "Enter") commitSeats(); }}
                className="border-gray-300 text-gray-900 w-28"
              />
              <span className="text-gray-500 text-sm">operators</span>
            </div>
            <div className="flex gap-2 flex-wrap pt-1">
              {[5, 10, 25, 50, 100].map(n => (
                <button
                  key={n}
                  onClick={() => { setSeats(n); setSeatInput(String(n)); }}
                  className={`px-3 py-1 rounded-full text-xs font-semibold border transition-all ${
                    seats === n
                      ? "text-white border-transparent"
                      : "border-gray-200 text-gray-500 hover:border-blue-400 hover:text-[#1E3A5F]"
                  }`}
                  style={seats === n ? { background: "linear-gradient(135deg, #1E3A5F, #0E7490)" } : {}}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>

          {/* Pricing display */}
          <div className="rounded-xl p-5 space-y-3" style={{ background: "linear-gradient(135deg, #EFF6FF 0%, #ECFDF5 100%)", border: "1px solid #BFDBFE" }}>
            <div className="flex items-center justify-between">
              <span className="text-gray-600 text-sm">Per operator licence / year</span>
              <span className="text-2xl font-bold" style={{ color: "#0E7490" }}>{formatTeamPriceCAD(seatPriceCents)}</span>
            </div>
            <div className="flex items-center justify-between border-t border-blue-100 pt-3">
              <span className="text-gray-600 text-sm">Total / year ({seats} annual licences)</span>
              <span className="text-2xl font-bold text-gray-900">{formatTeamPriceCAD(totalCents)}</span>
            </div>
            {volumeTier.discountPct > 0 ? (
              <div className="flex items-center gap-2 text-xs font-semibold text-teal-700">
                <span className="inline-block w-2 h-2 rounded-full bg-teal-500" />
                {volumeTier.discountPct}% volume discount applied ({volumeTier.label})
              </div>
            ) : (
              <div className="flex items-center gap-2 text-xs text-gray-400">
                <span className="inline-block w-2 h-2 rounded-full bg-gray-300" />
                Volume discounts begin at 10 licences and are calculated automatically.
              </div>
            )}
          </div>

          {/* Volume pricing table */}
          <div className="space-y-1">
            <p className="text-xs text-gray-400 uppercase tracking-wider font-semibold mb-2">Volume discounts</p>
            {TEAM_VOLUME_TIERS.map(t => {
              const discountedCents = Math.round(basePriceCents * (1 - t.discountPct / 100));
              return (
                <div
                  key={t.label}
                  className={`flex justify-between text-sm px-3 py-2 rounded-lg transition-colors ${
                    t === volumeTier ? "font-semibold" : "text-gray-500"
                  }`}
                  style={t === volumeTier ? { background: "linear-gradient(135deg, #EFF6FF, #ECFDF5)", color: "#1E3A5F" } : {}}
                >
                  <span>{t.label}{t.discountPct > 0 ? ` (${t.discountPct}% off)` : ""}</span>
                  <span>{formatTeamPriceCAD(discountedCents)} / seat / yr</span>
                </div>
              );
            })}
          </div>

          {/* Org details */}
          <div className="space-y-3 pt-2 border-t border-gray-100">
            <div className="space-y-2">
              <Label className="text-gray-700 font-medium">Organization name</Label>
              <Input
                placeholder="e.g. Utilities Kingston"
                value={orgName}
                onChange={e => setOrgName(e.target.value)}
                className="border-gray-300 text-gray-900 placeholder:text-gray-400"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-gray-700 font-medium">Manager email</Label>
              <Input
                type="email"
                placeholder="you@utility.ca"
                value={managerEmail}
                onChange={e => setManagerEmail(e.target.value)}
                className="border-gray-300 text-gray-900 placeholder:text-gray-400"
              />
              <p className="text-xs text-gray-400">You will use this email to log in to the manager dashboard.</p>
            </div>
          </div>

          {/* CTA */}
          <button
            onClick={handleCheckout}
            disabled={loading}
            className="w-full py-4 text-base font-bold text-white rounded-xl transition-all active:scale-[0.98] disabled:opacity-60 shadow-lg hover:shadow-xl hover:opacity-95"
            style={{ background: loading ? "#94A3B8" : "linear-gradient(135deg, #1E3A5F, #0E7490)" }}
          >
            {loading ? "Redirecting to checkout..." : `Start ${seats}-seat plan — ${formatTeamPriceCAD(totalCents)}/yr`}
          </button>
        </div>

        {/* Right: Features + social proof */}
        <div className="space-y-6">
          {/* Everything included */}
          <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 space-y-4">
            <h3 className="text-lg font-bold flex items-center gap-2 text-gray-900">
              <Zap className="w-5 h-5 text-teal-600" />
              Everything included
            </h3>
            <ul className="space-y-3">
              {FEATURES.map(f => (
                <li key={f} className="flex items-start gap-3 text-gray-600">
                  <CheckCircle2 className="w-5 h-5 text-teal-500 flex-shrink-0 mt-0.5" />
                  <span>{f}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Manager dashboard preview — dark accent card */}
          <div
            className="rounded-2xl p-6 space-y-4 text-white shadow-lg"
            style={{ background: "linear-gradient(135deg, #1E3A5F 0%, #0E7490 100%)" }}
          >
            <div className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-cyan-300" />
              <span className="font-bold">Manager Dashboard</span>
            </div>
            <p className="text-blue-100 text-sm">
              See every operator's estimated study score, last activity, and exam date at a glance. Estimates are not official pass predictions.
              Get early-warning alerts for operators who are stalled or at risk before their exam.
            </p>
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: "Active Last Month", value: "15 / 19", color: "text-cyan-300" },
                { label: "Questions Answered", value: "2,771", color: "text-sky-300" },
                { label: "Courses Studied", value: "10", color: "text-emerald-300" },
                { label: "Operators", value: "19", color: "text-amber-300" },
              ].map(card => (
                <div key={card.label} className="rounded-xl p-3 bg-white/10 border border-white/10">
                  <div className={`text-xl font-bold ${card.color}`}>{card.value}</div>
                  <div className="text-xs text-blue-200 mt-0.5">{card.label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Security note */}
          <div className="flex items-start gap-3 text-gray-400 text-sm">
            <Shield className="w-5 h-5 text-gray-300 flex-shrink-0 mt-0.5" />
            <span>Secure checkout via Stripe. Your receipt and paid invoice are emailed automatically. Annual billing; cancel or adjust seats through the manager dashboard.</span>
          </div>

          <div className="text-sm text-gray-400">
            Already purchased?{" "}
            <Link href="/account">
              <span className="font-semibold cursor-pointer underline underline-offset-2" style={{ color: "#0E7490" }}>
                Sign in to your dashboard
              </span>
            </Link>
          </div>
        </div>
      </section>
      )}
    </div>
  );
}
