/**
 * Teams.tsx — Public "Echelon for Teams" buy page.
 *
 * Features:
 *  - Seat slider / number input (1–500)
 *  - Live volume pricing display (per-seat and total)
 *  - Province selector (Ontario / Western Canada)
 *  - Org name + manager email form fields
 *  - "Get a Quote" CTA for 50+ seats (mailto link)
 *  - Stripe Checkout redirect via trpc.stripe.createTeamCheckout
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
import { Building2, Users, CheckCircle2, ChevronRight, Zap, Shield, BarChart3 } from "lucide-react";

// ── Volume pricing ────────────────────────────────────────────────────────────

interface PriceTier {
  min: number;
  max: number | null;
  unitCents: number;
  label: string;
}

const PRICE_TIERS: PriceTier[] = [
  { min: 1,   max: 24,  unitCents: 27900, label: "1–24 seats" },
  { min: 25,  max: 49,  unitCents: 23900, label: "25–49 seats" },
  { min: 50,  max: 99,  unitCents: 19900, label: "50–99 seats" },
  { min: 100, max: null, unitCents: 16900, label: "100+ seats" },
];

function getTier(seats: number): PriceTier {
  return (
    PRICE_TIERS.find(t => seats >= t.min && (t.max === null || seats <= t.max)) ??
    PRICE_TIERS[0]
  );
}

function formatCAD(cents: number): string {
  return new Intl.NumberFormat("en-CA", {
    style: "currency",
    currency: "CAD",
    maximumFractionDigits: 0,
  }).format(cents / 100);
}

// ── Feature list ─────────────────────────────────────────────────────────────

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

// ── Component ─────────────────────────────────────────────────────────────────

export default function Teams() {
  const [seats, setSeats] = useState(10);
  const [province, setProvince] = useState<"ontario" | "western">("ontario");
  const [orgName, setOrgName] = useState("");
  const [managerEmail, setManagerEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const tier = useMemo(() => getTier(seats), [seats]);
  const totalCents = tier.unitCents * seats;
  const isLarge = seats >= 50;

  const createCheckout = trpc.stripe.createTeamCheckout.useMutation();

  const handleSeatsChange = (val: string) => {
    const n = parseInt(val, 10);
    if (!isNaN(n) && n >= 1 && n <= 500) setSeats(n);
  };

  const handleCheckout = async () => {
    if (!orgName.trim()) {
      toast.error("Please enter your organization name.");
      return;
    }
    if (!managerEmail.trim() || !managerEmail.includes("@")) {
      toast.error("Please enter a valid manager email.");
      return;
    }
    setLoading(true);
    try {
      const result = await createCheckout.mutateAsync({
        orgName: orgName.trim(),
        province,
        seats,
        managerEmail: managerEmail.trim().toLowerCase(),
        origin: window.location.origin,
      });
      if (result.url) {
        window.location.href = result.url;
      }
    } catch (err: any) {
      toast.error("Could not start checkout", { description: err.message ?? "Please try again." });
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0f1a] text-white">
      {/* Nav */}
      <nav className="border-b border-white/10 px-6 py-4 flex items-center justify-between max-w-6xl mx-auto">
        <Link href="/">
          <span className="text-xl font-bold tracking-tight text-white cursor-pointer">
            Echelon<span className="text-blue-400"> Institute</span>
          </span>
        </Link>
        <div className="flex items-center gap-4">
          <Link href="/dashboard">
            <Button variant="ghost" size="sm" className="text-white/70 hover:text-white">
              Student Login
            </Button>
          </Link>
          <Link href="/team">
            <Button variant="ghost" size="sm" className="text-white/70 hover:text-white">
              Manager Login
            </Button>
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-6xl mx-auto px-6 pt-16 pb-12 text-center">
        <Badge className="mb-4 bg-blue-500/20 text-blue-300 border-blue-500/30 hover:bg-blue-500/20">
          <Building2 className="w-3 h-3 mr-1" />
          Echelon for Teams
        </Badge>
        <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">
          Train your entire crew.<br />
          <span className="text-blue-400">Track every operator.</span>
        </h1>
        <p className="text-lg text-white/60 max-w-2xl mx-auto">
          One team plan gives every operator at your utility full All-Access to Echelon's
          question banks, AI Tutor, and progress tracking. You get a manager dashboard
          to see who's ready and who needs attention.
        </p>
      </section>

      {/* Main grid */}
      <section className="max-w-6xl mx-auto px-6 pb-20 grid md:grid-cols-2 gap-10 items-start">

        {/* Left: Pricing calculator */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-8 space-y-6">
          <div>
            <h2 className="text-xl font-semibold mb-1">Configure your plan</h2>
            <p className="text-white/50 text-sm">Volume discounts apply automatically.</p>
          </div>

          {/* Province */}
          <div className="space-y-2">
            <Label className="text-white/80">Province / Region</Label>
            <Select value={province} onValueChange={v => setProvince(v as "ontario" | "western")}>
              <SelectTrigger className="bg-white/5 border-white/20 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-[#0f1929] border-white/20 text-white">
                <SelectItem value="ontario">Ontario (EOCP)</SelectItem>
                <SelectItem value="western">Western Canada (WPI)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Seats */}
          <div className="space-y-2">
            <Label className="text-white/80">Number of seats</Label>
            <div className="flex items-center gap-3">
              <Input
                type="number"
                min={1}
                max={500}
                value={seats}
                onChange={e => handleSeatsChange(e.target.value)}
                className="bg-white/5 border-white/20 text-white w-28"
              />
              <span className="text-white/50 text-sm">operators</span>
            </div>
            {/* Quick-select buttons */}
            <div className="flex gap-2 flex-wrap pt-1">
              {[5, 10, 25, 50, 100].map(n => (
                <button
                  key={n}
                  onClick={() => setSeats(n)}
                  className={`px-3 py-1 rounded-full text-xs border transition-colors ${
                    seats === n
                      ? "bg-blue-500 border-blue-500 text-white"
                      : "border-white/20 text-white/50 hover:border-white/40 hover:text-white/80"
                  }`}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>

          {/* Pricing display */}
          <div className="bg-white/5 rounded-xl p-5 space-y-3 border border-white/10">
            <div className="flex items-center justify-between">
              <span className="text-white/60 text-sm">Per seat / year</span>
              <span className="text-2xl font-bold text-blue-300">{formatCAD(tier.unitCents)}</span>
            </div>
            <div className="flex items-center justify-between border-t border-white/10 pt-3">
              <span className="text-white/60 text-sm">Total / year ({seats} seats)</span>
              <span className="text-2xl font-bold text-white">{formatCAD(totalCents)}</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-white/40">
              <span className="inline-block w-2 h-2 rounded-full bg-green-400" />
              {tier.label} pricing applies
            </div>
          </div>

          {/* Volume pricing table */}
          <div className="space-y-1">
            <p className="text-xs text-white/40 uppercase tracking-wider mb-2">Volume tiers</p>
            {PRICE_TIERS.map(t => (
              <div
                key={t.label}
                className={`flex justify-between text-sm px-3 py-2 rounded-lg transition-colors ${
                  t === tier ? "bg-blue-500/20 text-blue-200" : "text-white/50"
                }`}
              >
                <span>{t.label}</span>
                <span className="font-medium">{formatCAD(t.unitCents)} / seat</span>
              </div>
            ))}
          </div>

          {/* Org details */}
          <div className="space-y-3 pt-2 border-t border-white/10">
            <div className="space-y-2">
              <Label className="text-white/80">Organization name</Label>
              <Input
                placeholder="e.g. Utilities Kingston"
                value={orgName}
                onChange={e => setOrgName(e.target.value)}
                className="bg-white/5 border-white/20 text-white placeholder:text-white/30"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-white/80">Manager email</Label>
              <Input
                type="email"
                placeholder="you@utility.ca"
                value={managerEmail}
                onChange={e => setManagerEmail(e.target.value)}
                className="bg-white/5 border-white/20 text-white placeholder:text-white/30"
              />
              <p className="text-xs text-white/40">
                You'll use this email to log in to the manager dashboard.
              </p>
            </div>
          </div>

          {/* CTA */}
          {isLarge ? (
            <div className="space-y-3">
              <a
                href={`mailto:hello@echeloninstitute.ca?subject=Team Plan Quote - ${seats} seats&body=Hi,%0A%0AWe're interested in a ${seats}-seat All-Access team plan for ${province === "ontario" ? "Ontario (EOCP)" : "Western Canada (WPI)"}. Our organization is ${orgName || "[org name]"}.%0A%0APlease send us a quote.%0A%0AThanks`}
                className="block"
              >
                <Button className="w-full bg-blue-600 hover:bg-blue-500 text-white h-12 text-base font-semibold">
                  Get a Quote
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </a>
              <p className="text-xs text-center text-white/40">
                For 50+ seats we offer custom invoicing and onboarding support.
              </p>
            </div>
          ) : (
            <Button
              onClick={handleCheckout}
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-500 text-white h-12 text-base font-semibold"
            >
              {loading ? "Redirecting to checkout..." : `Start ${seats}-seat plan — ${formatCAD(totalCents)}/yr`}
              {!loading && <ChevronRight className="w-4 h-4 ml-1" />}
            </Button>
          )}
        </div>

        {/* Right: Features + social proof */}
        <div className="space-y-8">
          {/* Feature list */}
          <div>
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Zap className="w-5 h-5 text-blue-400" />
              Everything included
            </h3>
            <ul className="space-y-3">
              {FEATURES.map(f => (
                <li key={f} className="flex items-start gap-3 text-white/70">
                  <CheckCircle2 className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                  <span>{f}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Manager dashboard preview card */}
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6 space-y-4">
            <div className="flex items-center gap-2 text-white/80">
              <BarChart3 className="w-5 h-5 text-blue-400" />
              <span className="font-medium">Manager Dashboard</span>
            </div>
            <p className="text-white/50 text-sm">
              See every operator's readiness score, last activity, and exam date at a glance.
              Get early-warning alerts for operators who are stalled or at risk before their exam.
            </p>
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: "Avg Readiness", value: "78%", color: "text-green-400" },
                { label: "Active This Week", value: "12 / 15", color: "text-blue-400" },
                { label: "On Track to Pass", value: "9", color: "text-green-400" },
                { label: "Needs Attention", value: "3", color: "text-yellow-400" },
              ].map(card => (
                <div key={card.label} className="bg-white/5 rounded-xl p-3">
                  <div className={`text-xl font-bold ${card.color}`}>{card.value}</div>
                  <div className="text-xs text-white/40 mt-0.5">{card.label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Security note */}
          <div className="flex items-start gap-3 text-white/50 text-sm">
            <Shield className="w-5 h-5 text-white/30 flex-shrink-0 mt-0.5" />
            <span>
              Secure checkout via Stripe. Annual billing. Cancel or adjust seats at any time
              through the manager dashboard. Invoice billing available for 50+ seats.
            </span>
          </div>

          {/* Already have a team plan */}
          <div className="text-sm text-white/40">
            Already purchased?{" "}
            <Link href="/team">
              <span className="text-blue-400 hover:text-blue-300 cursor-pointer underline underline-offset-2">
                Sign in to your manager dashboard
              </span>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
