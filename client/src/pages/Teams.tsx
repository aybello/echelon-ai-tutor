/**
 * Teams.tsx — Public "Echelon for Teams" buy page.
 * Dark premium theme — matches the Echelon Institute landing page.
 */

import { useState, useMemo } from "react";
import type { TeamStreamTier } from "../../../server/stripe/subscriptionProducts";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
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
import { Building2, CheckCircle2, ChevronRight, Zap, Shield, BarChart3, Users, TrendingUp, Award } from "lucide-react";

// ── Pricing ───────────────────────────────────────────────────────────────────
// Mirrors TEAM_BASE_PRICE in server/stripe/subscriptionProducts.ts — keep in sync
const TEAM_BASE_PRICE_CLIENT: Record<string, Record<TeamStreamTier, number>> = {
  ontario: {
    "stream-water":           27900,
    "stream-wastewater":      27900,
    "stream-water-dist":      27900,
    "stream-wastewater-coll": 27900,
    "all-access":             34900,
  },
  western: {
    "stream-water":           34900,
    "stream-wastewater":      34900,
    "stream-water-dist":      34900,
    "stream-wastewater-coll": 34900,
    "all-access":             44900,
  },
};

const STREAM_TIER_LABELS: Record<TeamStreamTier, string> = {
  "stream-water":           "Water Treatment",
  "stream-wastewater":      "Wastewater Treatment",
  "stream-water-dist":      "Water Distribution",
  "stream-wastewater-coll": "Wastewater Collection",
  "all-access":             "All Streams",
};

const STREAM_TIER_DESCRIPTIONS: Record<TeamStreamTier, string> = {
  "stream-water":           "Water treatment — entry level through Class 4",
  "stream-wastewater":      "Wastewater treatment — entry level through Class 4",
  "stream-water-dist":      "Water distribution — entry level through Class 4",
  "stream-wastewater-coll": "Wastewater collection — entry level through Class 4",
  "all-access":             "All four streams, every level",
};

interface VolumeTier {
  min: number;
  max: number | null;
  discountPct: number;
  label: string;
}

const VOLUME_TIERS: VolumeTier[] = [
  { min: 1,  max: 9,    discountPct: 0,  label: "1-9 seats" },
  { min: 10, max: 24,   discountPct: 10, label: "10-24 seats" },
  { min: 25, max: 49,   discountPct: 15, label: "25-49 seats" },
  { min: 50, max: null, discountPct: 20, label: "50+ seats" },
];

function getVolumeTier(seats: number): VolumeTier {
  return (
    VOLUME_TIERS.find(t => seats >= t.min && (t.max === null || seats <= t.max)) ??
    VOLUME_TIERS[0]
  );
}

function getSeatPriceCents(province: string, tier: TeamStreamTier, seats: number): number {
  const base = TEAM_BASE_PRICE_CLIENT[province]?.[tier] ?? 34900;
  const vt = getVolumeTier(seats);
  return Math.round(base * (1 - vt.discountPct / 100));
}

function formatCAD(cents: number): string {
  return new Intl.NumberFormat("en-CA", {
    style: "currency",
    currency: "CAD",
    maximumFractionDigits: 0,
  }).format(cents / 100);
}

const FEATURES = [
  "Complete question bank for your selected stream",
  "AI Tutor with personalized coaching",
  "Progress dashboard per operator",
  "Manager dashboard with readiness metrics",
  "Exam date tracking and reminders",
  "Flashcard spaced-repetition system",
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

  const volumeTier = useMemo(() => getVolumeTier(seats), [seats]);
  const seatPriceCents = useMemo(() => getSeatPriceCents(province, tier, seats), [province, tier, seats]);
  const totalCents = seatPriceCents * seats;
  const individualPriceCents = TEAM_BASE_PRICE_CLIENT[province]?.[tier] ?? 34900;
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
        origin: window.location.origin,
      });
      if (result.url) window.location.href = result.url;
    } catch (err: any) {
      toast.error("Could not start checkout", { description: err.message ?? "Please try again." });
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen text-white" style={{ background: "linear-gradient(135deg, #0F172A 0%, #1E3A5F 50%, #0E7490 100%)" }}>
      {/* Subtle dot grid overlay */}
      <div style={{
        position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0,
        backgroundImage: "radial-gradient(circle at 1px 1px, rgba(255,255,255,0.04) 1px, transparent 0)",
        backgroundSize: "40px 40px",
      }} />

      <div style={{ position: "relative", zIndex: 1 }}>
        <SiteNav
          currentPath={location}
          rightSlot={
            <a
              href="/account"
              className="text-sm font-semibold bg-white/10 hover:bg-white/20 text-white border border-white/20 px-4 py-1.5 rounded-lg transition-colors"
            >
              Sign In
            </a>
          }
        />

        {/* Hero */}
        <section className="max-w-6xl mx-auto px-6 pt-16 pb-12 text-center">
          <div className="inline-flex items-center gap-2 mb-5 px-4 py-1.5 rounded-full text-sm font-semibold border border-teal-400/30 bg-teal-400/10 text-teal-300">
            <Building2 className="w-3.5 h-3.5" />
            Echelon for Teams
          </div>
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-5 text-white">
            Train your entire crew.<br />
            <span style={{ background: "linear-gradient(90deg, #38BDF8, #34D399)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
              Track every operator.
            </span>
          </h1>
          <p className="text-lg text-slate-300 max-w-2xl mx-auto leading-relaxed">
            One team plan gives every operator at your utility access to Echelon's
            question banks, AI Tutor, and progress tracking. You get a manager dashboard
            to see who is ready and who needs attention.
          </p>

          {/* Stats row */}
          <div className="flex flex-wrap justify-center gap-8 mt-10 mb-2">
            {[
              { icon: <Users className="w-4 h-4" />, value: "500+", label: "Operators trained" },
              { icon: <TrendingUp className="w-4 h-4" />, value: "84%", label: "First-attempt pass rate" },
              { icon: <Award className="w-4 h-4" />, value: "36", label: "Courses available" },
            ].map(stat => (
              <div key={stat.label} className="flex items-center gap-2 text-slate-300">
                <span className="text-teal-400">{stat.icon}</span>
                <span className="font-bold text-white">{stat.value}</span>
                <span className="text-sm">{stat.label}</span>
              </div>
            ))}
          </div>
        </section>

        {/* Main grid */}
        <section className="max-w-6xl mx-auto px-6 pb-20 grid md:grid-cols-2 gap-10 items-start">

          {/* Left: Pricing calculator */}
          <div className="rounded-2xl p-8 space-y-6 border border-white/10" style={{ background: "rgba(15,23,42,0.7)", backdropFilter: "blur(12px)" }}>
            <div>
              <h2 className="text-xl font-semibold mb-1 text-white">Configure your plan</h2>
              <p className="text-slate-400 text-sm">Volume discounts apply automatically.</p>
            </div>

            {/* Province */}
            <div className="space-y-2">
              <Label className="text-slate-300">Province / Region</Label>
              <Select value={province} onValueChange={v => setProvince(v as "ontario" | "western")}>
                <SelectTrigger className="border-white/20 text-white bg-white/5 hover:bg-white/10">
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
              <Label className="text-slate-300">Certification stream</Label>
              <div className="grid grid-cols-5 gap-1.5">
                {(["stream-water","stream-wastewater","stream-water-dist","stream-wastewater-coll","all-access"] as TeamStreamTier[]).map(t => (
                  <button
                    key={t}
                    onClick={() => setTier(t)}
                    className={`px-2 py-2 rounded-lg text-xs font-semibold border transition-all ${
                      tier === t
                        ? "border-teal-400 text-white"
                        : "border-white/20 text-slate-400 hover:border-teal-400/50 hover:text-slate-200 bg-white/5"
                    }`}
                    style={tier === t ? { background: "linear-gradient(135deg, #0E7490, #0891B2)" } : {}}
                  >
                    {t === "all-access" ? "All Streams" : STREAM_TIER_LABELS[t]}
                  </button>
                ))}
              </div>
              <p className="text-xs text-slate-500 pt-1">{STREAM_TIER_DESCRIPTIONS[tier]}</p>
            </div>

            {/* Seats */}
            <div className="space-y-2">
              <Label className="text-slate-300">Number of annual operator licences</Label>
              <p className="text-xs text-slate-500 -mt-1">Each annual licence covers one operator during the contract year. Operator access can be deactivated and restored without losing progress, but assigning a different employee uses another annual licence.</p>
              <div className="flex items-center gap-3">
                <Input
                  type="number"
                  min={1}
                  max={500}
                  value={seats}
                  onChange={e => handleSeatsChange(e.target.value)}
                  className="border-white/20 text-white bg-white/5 w-28 placeholder:text-slate-500"
                />
                <span className="text-slate-400 text-sm">operators</span>
              </div>
              <div className="flex gap-2 flex-wrap pt-1">
                {[5, 10, 25, 50, 100].map(n => (
                  <button
                    key={n}
                    onClick={() => setSeats(n)}
                    className={`px-3 py-1 rounded-full text-xs border transition-all ${
                      seats === n
                        ? "border-teal-400 text-white"
                        : "border-white/20 text-slate-400 hover:border-white/40 hover:text-slate-200 bg-white/5"
                    }`}
                    style={seats === n ? { background: "linear-gradient(135deg, #0E7490, #0891B2)" } : {}}
                  >
                    {n}
                  </button>
                ))}
              </div>
            </div>

            {/* Pricing display */}
            <div className="rounded-xl p-5 space-y-3 border border-teal-400/20" style={{ background: "rgba(14,116,144,0.15)" }}>
              <div className="flex items-center justify-between">
                <span className="text-slate-400 text-sm">Per operator licence / year</span>
                <span className="text-2xl font-bold text-teal-300">{formatCAD(seatPriceCents)}</span>
              </div>
              <div className="flex items-center justify-between border-t border-white/10 pt-3">
                <span className="text-slate-400 text-sm">Total / year ({seats} annual licences)</span>
                <span className="text-2xl font-bold text-white">{formatCAD(totalCents)}</span>
              </div>
              {volumeTier.discountPct > 0 ? (
                <div className="flex items-center gap-2 text-xs text-teal-400">
                  <span className="inline-block w-2 h-2 rounded-full bg-teal-400" />
                  {volumeTier.discountPct}% volume discount applied ({volumeTier.label})
                </div>
              ) : (
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <span className="inline-block w-2 h-2 rounded-full bg-slate-600" />
                  Volume discounts begin at 10 licences and are calculated automatically.
                </div>
              )}
            </div>

            {/* Volume pricing table */}
            <div className="space-y-1">
              <p className="text-xs text-slate-500 uppercase tracking-wider mb-2">Volume discounts</p>
              {VOLUME_TIERS.map(t => {
                const discountedCents = Math.round(individualPriceCents * (1 - t.discountPct / 100));
                return (
                  <div
                    key={t.label}
                    className={`flex justify-between text-sm px-3 py-2 rounded-lg transition-colors ${
                      t === volumeTier
                        ? "text-teal-300 font-medium"
                        : "text-slate-500"
                    }`}
                    style={t === volumeTier ? { background: "rgba(14,116,144,0.2)" } : {}}
                  >
                    <span>{t.label}{t.discountPct > 0 ? ` (${t.discountPct}% off)` : ""}</span>
                    <span>{formatCAD(discountedCents)} / seat / yr</span>
                  </div>
                );
              })}
            </div>

            {/* Org details */}
            <div className="space-y-3 pt-2 border-t border-white/10">
              <div className="space-y-2">
                <Label className="text-slate-300">Organization name</Label>
                <Input
                  placeholder="e.g. Utilities Kingston"
                  value={orgName}
                  onChange={e => setOrgName(e.target.value)}
                  className="border-white/20 text-white bg-white/5 placeholder:text-slate-500"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-slate-300">Manager email</Label>
                <Input
                  type="email"
                  placeholder="you@utility.ca"
                  value={managerEmail}
                  onChange={e => setManagerEmail(e.target.value)}
                  className="border-white/20 text-white bg-white/5 placeholder:text-slate-500"
                />
                <p className="text-xs text-slate-500">You will use this email to log in to the manager dashboard.</p>
              </div>
            </div>

            {/* CTA */}
            <button
              onClick={handleCheckout}
              disabled={loading}
              className="w-full h-12 text-base font-bold text-white rounded-xl transition-all active:scale-[0.98] disabled:opacity-60"
              style={{ background: loading ? "#475569" : "linear-gradient(135deg, #2563EB, #0E7490)" }}
            >
              {loading ? "Redirecting to checkout..." : `Start ${seats}-seat plan — ${formatCAD(totalCents)}/yr`}
            </button>
          </div>

          {/* Right: Features + social proof */}
          <div className="space-y-8">
            {/* Everything included */}
            <div className="rounded-2xl p-6 border border-white/10 space-y-4" style={{ background: "rgba(15,23,42,0.5)", backdropFilter: "blur(8px)" }}>
              <h3 className="text-lg font-semibold flex items-center gap-2 text-white">
                <Zap className="w-5 h-5 text-teal-400" />
                Everything included
              </h3>
              <ul className="space-y-3">
                {FEATURES.map(f => (
                  <li key={f} className="flex items-start gap-3 text-slate-300">
                    <CheckCircle2 className="w-5 h-5 text-teal-400 flex-shrink-0 mt-0.5" />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Manager dashboard preview card */}
            <div className="rounded-2xl p-6 border border-white/10 space-y-4" style={{ background: "rgba(15,23,42,0.5)", backdropFilter: "blur(8px)" }}>
              <div className="flex items-center gap-2 text-white">
                <BarChart3 className="w-5 h-5 text-teal-400" />
                <span className="font-semibold">Manager Dashboard</span>
              </div>
              <p className="text-slate-400 text-sm">
                See every operator's readiness score, last activity, and exam date at a glance.
                Get early-warning alerts for operators who are stalled or at risk before their exam.
              </p>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: "Avg Readiness", value: "78%", color: "text-teal-400" },
                  { label: "Active This Week", value: "12 / 15", color: "text-sky-400" },
                  { label: "On Track to Pass", value: "9", color: "text-teal-400" },
                  { label: "Needs Attention", value: "3", color: "text-amber-400" },
                ].map(card => (
                  <div key={card.label} className="rounded-xl p-3 border border-white/10" style={{ background: "rgba(255,255,255,0.05)" }}>
                    <div className={`text-xl font-bold ${card.color}`}>{card.value}</div>
                    <div className="text-xs text-slate-500 mt-0.5">{card.label}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Security note */}
            <div className="flex items-start gap-3 text-slate-500 text-sm">
              <Shield className="w-5 h-5 text-slate-600 flex-shrink-0 mt-0.5" />
              <span>
                Secure checkout via Stripe. Annual billing. Cancel or adjust seats at any time
                through the manager dashboard.
              </span>
            </div>

            <div className="text-sm text-slate-500">
              Already purchased?{" "}
              <Link href="/account">
                <span className="text-teal-400 hover:text-teal-300 cursor-pointer underline underline-offset-2">
                  Sign in to your dashboard
                </span>
              </Link>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
