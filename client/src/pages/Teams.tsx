/**
 * Teams.tsx — Public "Echelon for Teams" buy page.
 * Light theme — matches the rest of the Echelon Institute site.
 */

import { useState, useMemo } from "react";
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
import { Link } from "wouter";
import { Building2, CheckCircle2, ChevronRight, Zap, Shield, BarChart3 } from "lucide-react";

// ── Pricing ───────────────────────────────────────────────────────────────────

const ALL_ACCESS_BASE: Record<string, number> = {
  ontario: 34900,
  western: 44900,
};

interface VolumeTier {
  min: number;
  max: number | null;
  discountPct: number;
  label: string;
}

const VOLUME_TIERS: VolumeTier[] = [
  { min: 1,  max: 4,    discountPct: 0,  label: "1-4 seats" },
  { min: 5,  max: 9,    discountPct: 10, label: "5-9 seats" },
  { min: 10, max: 24,   discountPct: 15, label: "10-24 seats" },
  { min: 25, max: null, discountPct: 20, label: "25+ seats" },
];

function getVolumeTier(seats: number): VolumeTier {
  return (
    VOLUME_TIERS.find(t => seats >= t.min && (t.max === null || seats <= t.max)) ??
    VOLUME_TIERS[0]
  );
}

function getSeatPriceCents(province: string, seats: number): number {
  const base = ALL_ACCESS_BASE[province] ?? 34900;
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
  "Full All-Access question bank (all exam levels)",
  "AI Tutor with personalized coaching",
  "Progress dashboard per operator",
  "Manager dashboard with readiness metrics",
  "Exam date tracking and reminders",
  "Flashcard spaced-repetition system",
  "Proactive email nudges for inactive operators",
  "Annual renewal with seat flexibility",
];

export default function Teams() {
  const [seats, setSeats] = useState(10);
  const [province, setProvince] = useState<"ontario" | "western">("ontario");
  const [orgName, setOrgName] = useState("");
  const [managerEmail, setManagerEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const volumeTier = useMemo(() => getVolumeTier(seats), [seats]);
  const seatPriceCents = useMemo(() => getSeatPriceCents(province, seats), [province, seats]);
  const totalCents = seatPriceCents * seats;
  const individualPriceCents = ALL_ACCESS_BASE[province] ?? 34900;
  const isLarge = seats >= 50;

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
        tier: "all-access" as const,
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
    <div className="min-h-screen bg-white text-gray-900">
      {/* Nav */}
      <nav className="border-b border-gray-200 px-6 py-4 flex items-center justify-between max-w-6xl mx-auto">
        <Link href="/">
          <span className="text-xl font-bold tracking-tight cursor-pointer">
            Echelon<span className="text-blue-600"> Institute</span>
          </span>
        </Link>
        <div className="flex items-center gap-4">
          <Link href="/dashboard">
            <Button variant="ghost" size="sm" className="text-gray-500 hover:text-gray-900">Student Login</Button>
          </Link>
          <Link href="/team">
            <Button variant="ghost" size="sm" className="text-gray-500 hover:text-gray-900">Manager Login</Button>
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-6xl mx-auto px-6 pt-16 pb-12 text-center">
        <Badge className="mb-4 bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-50">
          <Building2 className="w-3 h-3 mr-1" />
          Echelon for Teams
        </Badge>
        <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4 text-gray-900">
          Train your entire crew.<br />
          <span className="text-blue-600">Track every operator.</span>
        </h1>
        <p className="text-lg text-gray-500 max-w-2xl mx-auto">
          One team plan gives every operator at your utility full All-Access to Echelon's
          question banks, AI Tutor, and progress tracking. You get a manager dashboard
          to see who is ready and who needs attention.
        </p>
      </section>

      {/* Main grid */}
      <section className="max-w-6xl mx-auto px-6 pb-20 grid md:grid-cols-2 gap-10 items-start">

        {/* Left: Pricing calculator */}
        <div className="bg-white border border-gray-200 rounded-2xl p-8 space-y-6 shadow-sm">
          <div>
            <h2 className="text-xl font-semibold mb-1 text-gray-900">Configure your plan</h2>
            <p className="text-gray-500 text-sm">Volume discounts apply automatically.</p>
          </div>

          {/* Province */}
          <div className="space-y-2">
            <Label className="text-gray-700">Province / Region</Label>
            <Select value={province} onValueChange={v => setProvince(v as "ontario" | "western")}>
              <SelectTrigger className="border-gray-300 text-gray-900 bg-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ontario">Ontario (EOCP)</SelectItem>
                <SelectItem value="western">Western Canada (WPI)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* All-Access badge */}
          <div className="flex items-center gap-3 bg-blue-50 border border-blue-200 rounded-xl px-4 py-3">
            <CheckCircle2 className="w-5 h-5 text-blue-600 flex-shrink-0" />
            <div>
              <p className="text-sm font-semibold text-blue-900">All-Access Plan</p>
              <p className="text-xs text-blue-600">Every certification level included - Class 1 through 4 + All-Access tracks</p>
            </div>
          </div>

          {/* Seats */}
          <div className="space-y-2">
            <Label className="text-gray-700">Number of seats</Label>
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
                  className={`px-3 py-1 rounded-full text-xs border transition-colors ${
                    seats === n
                      ? "bg-blue-600 border-blue-600 text-white"
                      : "border-gray-300 text-gray-500 hover:border-gray-400 hover:text-gray-700"
                  }`}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>

          {/* Pricing display */}
          <div className="bg-gray-50 rounded-xl p-5 space-y-3 border border-gray-200">
            <div className="flex items-center justify-between">
              <span className="text-gray-500 text-sm">Per seat / year</span>
              <span className="text-2xl font-bold text-blue-600">{formatCAD(seatPriceCents)}</span>
            </div>
            <div className="flex items-center justify-between border-t border-gray-200 pt-3">
              <span className="text-gray-500 text-sm">Total / year ({seats} seats)</span>
              <span className="text-2xl font-bold text-gray-900">{formatCAD(totalCents)}</span>
            </div>
            {volumeTier.discountPct > 0 ? (
              <div className="flex items-center gap-2 text-xs text-green-600">
                <span className="inline-block w-2 h-2 rounded-full bg-green-500" />
                {volumeTier.discountPct}% volume discount applied ({volumeTier.label})
              </div>
            ) : (
              <div className="flex items-center gap-2 text-xs text-gray-400">
                <span className="inline-block w-2 h-2 rounded-full bg-gray-300" />
                Add 5+ seats to unlock volume discounts
              </div>
            )}
          </div>

          {/* Volume pricing table */}
          <div className="space-y-1">
            <p className="text-xs text-gray-400 uppercase tracking-wider mb-2">Volume discounts</p>
            {VOLUME_TIERS.map(t => {
              const discountedCents = Math.round(individualPriceCents * (1 - t.discountPct / 100));
              return (
                <div
                  key={t.label}
                  className={`flex justify-between text-sm px-3 py-2 rounded-lg transition-colors ${
                    t === volumeTier ? "bg-blue-50 text-blue-700 font-medium" : "text-gray-500"
                  }`}
                >
                  <span>{t.label}{t.discountPct > 0 ? ` (${t.discountPct}% off)` : ""}</span>
                  <span>{formatCAD(discountedCents)} / seat / yr</span>
                </div>
              );
            })}
          </div>

          {/* Org details */}
          <div className="space-y-3 pt-2 border-t border-gray-200">
            <div className="space-y-2">
              <Label className="text-gray-700">Organization name</Label>
              <Input
                placeholder="e.g. Utilities Kingston"
                value={orgName}
                onChange={e => setOrgName(e.target.value)}
                className="border-gray-300 text-gray-900 placeholder:text-gray-400"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-gray-700">Manager email</Label>
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
          {isLarge ? (
            <div className="space-y-3">
              <a
                href={`mailto:hello@echeloninstitute.ca?subject=Team Plan Quote - ${seats} seats&body=Hi,%0A%0AWe are interested in a ${seats}-seat All-Access team plan for ${province === "ontario" ? "Ontario (EOCP)" : "Western Canada (WPI)"}. Our organization is ${orgName || "[org name]"}.%0A%0APlease send us a quote.%0A%0AThanks`}
                className="block"
              >
                <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white h-12 text-base font-semibold">
                  Get a Quote <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </a>
              <p className="text-xs text-center text-gray-400">For 50+ seats we offer custom invoicing and onboarding support.</p>
            </div>
          ) : (
            <Button
              onClick={handleCheckout}
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white h-12 text-base font-semibold"
            >
              {loading ? "Redirecting to checkout..." : `Start ${seats}-seat plan - ${formatCAD(totalCents)}/yr`}
              {!loading && <ChevronRight className="w-4 h-4 ml-1" />}
            </Button>
          )}
        </div>

        {/* Right: Features + social proof */}
        <div className="space-y-8">
          <div>
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2 text-gray-900">
              <Zap className="w-5 h-5 text-blue-600" />
              Everything included
            </h3>
            <ul className="space-y-3">
              {FEATURES.map(f => (
                <li key={f} className="flex items-start gap-3 text-gray-600">
                  <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                  <span>{f}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Manager dashboard preview card */}
          <div className="bg-gray-50 border border-gray-200 rounded-2xl p-6 space-y-4">
            <div className="flex items-center gap-2 text-gray-700">
              <BarChart3 className="w-5 h-5 text-blue-600" />
              <span className="font-medium">Manager Dashboard</span>
            </div>
            <p className="text-gray-500 text-sm">
              See every operator's readiness score, last activity, and exam date at a glance.
              Get early-warning alerts for operators who are stalled or at risk before their exam.
            </p>
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: "Avg Readiness", value: "78%", color: "text-green-600" },
                { label: "Active This Week", value: "12 / 15", color: "text-blue-600" },
                { label: "On Track to Pass", value: "9", color: "text-green-600" },
                { label: "Needs Attention", value: "3", color: "text-amber-600" },
              ].map(card => (
                <div key={card.label} className="bg-white rounded-xl p-3 border border-gray-200">
                  <div className={`text-xl font-bold ${card.color}`}>{card.value}</div>
                  <div className="text-xs text-gray-400 mt-0.5">{card.label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Security note */}
          <div className="flex items-start gap-3 text-gray-400 text-sm">
            <Shield className="w-5 h-5 text-gray-300 flex-shrink-0 mt-0.5" />
            <span>
              Secure checkout via Stripe. Annual billing. Cancel or adjust seats at any time
              through the manager dashboard. Invoice billing available for 50+ seats.
            </span>
          </div>

          <div className="text-sm text-gray-400">
            Already purchased?{" "}
            <Link href="/team">
              <span className="text-blue-600 hover:text-blue-700 cursor-pointer underline underline-offset-2">
                Sign in to your manager dashboard
              </span>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
