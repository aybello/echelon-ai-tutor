/**
 * Teams.tsx — Public "Echelon for Teams" buy page.
 * Clean white premium theme — bold blue/teal hero, white body, Stripe-style.
 */

import { useState, useMemo } from "react";
import {
  type TeamStreamTier,
  TEAM_BASE_PRICE,
  TEAM_STREAM_TIER_LABELS,
  TEAM_STREAM_TIER_DESCRIPTIONS,
  TEAM_VOLUME_TIERS,
  getTeamVolumeTier,
  getTeamSeatPriceCents,
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
  "Manager dashboard with readiness metrics",
  "Exam date tracking and reminders",
  "Progress-tracked flashcards",
  "Proactive email nudges for inactive operators",
  "Annual renewal — operator access can be deactivated and restored without losing progress",
];

export default function Teams() {
  const [location] = useLocation();
  const [seats, setSeats] = useState(10);
  const [province, setProvince] = useState<"ontario" | "western">("ontario");
  const [tier, setTier] = useState<TeamStreamTier>("all-access");
  const [orgName, setOrgName] = useState("");
  const [managerEmail, setManagerEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const volumeTier = useMemo(() => getTeamVolumeTier(seats), [seats]);
  const seatPriceCents = useMemo(() => getTeamSeatPriceCents(province, tier, seats), [province, tier, seats]);
  const totalCents = useMemo(() => getTeamTotalPriceCents(province, tier, seats), [province, tier, seats]);
  const basePriceCents = TEAM_BASE_PRICE[province as "ontario" | "western"]?.[tier] ?? 34900;
  const createCheckout = trpc.stripe.createTeamCheckout.useMutation();

  const handleSeatsChange = (val: string) => {
    const n = parseInt(val, 10);
    if (!isNaN(n) && n >= 1 && n <= 500) setSeats(n);
  };

  const handleCheckout = async () => {
    if (!orgName.trim()) { toast.error("Please enter your organization name."); return; }
    if (!managerEmail.trim() || !managerEmail.includes("@")) { toast.error("Please enter a valid manager email."); return; }
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
              color: "#1D4ED8", border: "1.5px solid #1D4ED8",
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
        className="px-6 pt-16 pb-24 text-center relative overflow-hidden"
        style={{ background: "linear-gradient(135deg, #1D4ED8 0%, #0E7490 100%)" }}
      >
        <div style={{
          position: "absolute", inset: 0, pointerEvents: "none",
          backgroundImage: "radial-gradient(circle at 1px 1px, rgba(255,255,255,0.07) 1px, transparent 0)",
          backgroundSize: "32px 32px",
        }} />
        <div className="relative max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-2 mb-5 px-4 py-1.5 rounded-full text-sm font-semibold bg-white/15 text-white border border-white/25">
            <Building2 className="w-3.5 h-3.5" />
            Echelon for Teams
          </div>
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-5 text-white">
            Train your entire crew.<br />
            <span className="text-cyan-200">Track every operator.</span>
          </h1>
          <p className="text-lg text-blue-100 max-w-2xl mx-auto leading-relaxed">
            One team plan gives every operator at your utility access to Echelon's
            question banks, AI Tutor, and progress tracking. You get a manager dashboard
            to see who is ready and who needs attention.
          </p>
          <div className="flex flex-wrap justify-center gap-10 mt-10">
            {[
            { icon: <Users className="w-4 h-4" />, value: "25", label: "Operators at Utilities Kingston" },
            { icon: <Award className="w-4 h-4" />, value: "105", label: "Five-star ratings" },
            { icon: <TrendingUp className="w-4 h-4" />, value: "18,885", label: "Questions answered" },
            ].map((stat: { icon: React.ReactNode; value: string; label: string }) => (
              <div key={stat.label} className="flex items-center gap-2 text-white/80">
                <span className="text-cyan-200">{stat.icon}</span>
                <span className="font-bold text-white text-lg">{stat.value}</span>
                <span className="text-sm">{stat.label}</span>
              </div>
            ))}
          </div>
          {/* Trust badge */}
          <div className="mt-8 flex justify-center">
            <div className="flex items-center gap-3 bg-white/10 border border-white/20 rounded-full px-5 py-2.5 backdrop-blur-sm">
              <span className="text-yellow-300 text-sm">★★★★★</span>
              <span className="text-white/90 text-sm font-medium">Trusted by <span className="font-bold text-white">Utilities Kingston</span></span>
            </div>
          </div>
        </div>
      </section>

      {/* Main grid — white/slate body */}
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

          {/* Tier selector */}
          <div className="space-y-2">
            <Label className="text-gray-700 font-medium">Certification stream</Label>
            <div className="grid grid-cols-5 gap-1.5">
              {(["stream-water","stream-wastewater","stream-water-dist","stream-wastewater-coll","all-access"] as TeamStreamTier[]).map(t => (
                <button
                  key={t}
                  onClick={() => setTier(t)}
                  className={`px-2 py-2 rounded-lg text-xs font-semibold border transition-all ${
                    tier === t
                      ? "text-white border-transparent shadow-md"
                      : "border-gray-200 text-gray-600 hover:border-blue-400 hover:text-blue-700 bg-white"
                  }`}
                  style={tier === t ? { background: "linear-gradient(135deg, #1D4ED8, #0E7490)" } : {}}
                >
                  {t === "all-access" ? "All Streams" : TEAM_STREAM_TIER_LABELS[t]}
                </button>
              ))}
            </div>
            <p className="text-xs text-gray-500 pt-1">{TEAM_STREAM_TIER_DESCRIPTIONS[tier]}</p>
          </div>

          {/* Seats */}
          <div className="space-y-2">
            <Label className="text-gray-700 font-medium">Number of annual operator licences</Label>
            <p className="text-xs text-gray-500 -mt-1">Each annual licence covers one operator during the contract year. Operator access can be deactivated and restored without losing progress, but assigning a different employee uses another annual licence.</p>
            <div className="flex items-center gap-3">
              <Input
                type="number"
                min={1}
                max={500}
                value={seats}
                onChange={e => handleSeatsChange(e.target.value)}
                className="border-gray-300 text-gray-900 w-28"
              />
              <span className="text-gray-500 text-sm">operators</span>
            </div>
            <div className="flex gap-2 flex-wrap pt-1">
              {[5, 10, 25, 50, 100].map(n => (
                <button
                  key={n}
                  onClick={() => setSeats(n)}
                  className={`px-3 py-1 rounded-full text-xs font-semibold border transition-all ${
                    seats === n
                      ? "text-white border-transparent"
                      : "border-gray-200 text-gray-500 hover:border-blue-400 hover:text-blue-700"
                  }`}
                  style={seats === n ? { background: "linear-gradient(135deg, #1D4ED8, #0E7490)" } : {}}
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
                  style={t === volumeTier ? { background: "linear-gradient(135deg, #EFF6FF, #ECFDF5)", color: "#1D4ED8" } : {}}
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
            style={{ background: loading ? "#94A3B8" : "linear-gradient(135deg, #1D4ED8, #0E7490)" }}
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
              See every operator's readiness score, last activity, and exam date at a glance.
              Get early-warning alerts for operators who are stalled or at risk before their exam.
            </p>
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: "Avg Readiness", value: "78%", color: "text-cyan-300" },
                { label: "Active This Week", value: "12 / 15", color: "text-sky-300" },
                { label: "Approaching Ready", value: "9", color: "text-emerald-300" },
                { label: "Needs Attention", value: "3", color: "text-amber-300" },
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
            <span>Secure checkout via Stripe. Annual billing. Cancel or adjust seats at any time through the manager dashboard.</span>
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
    </div>
  );
}
