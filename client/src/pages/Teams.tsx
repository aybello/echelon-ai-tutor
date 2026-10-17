import { useMemo, useState } from "react";
import { useLocation } from "wouter";
import { Building2, CheckCircle2, ShieldCheck, Users, FileText, FlaskConical } from "lucide-react";
import {
  type TeamStreamTier,
  type TeamRegion,
  TEAM_REGION_LABELS,
  TEAM_REGION_VALUES,
  isTeamRegion,
  getTeamStreamDescription,
  getTeamStreamLabel,
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
import { getAnonymousAnalyticsId } from "@/lib/anonymousAnalytics";
import { getMarketingAttribution } from "@/lib/marketingAnalytics";
import { readCheckoutJurisdiction } from "@/lib/checkoutJurisdiction";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import SiteNav from "@/components/SiteNav";
import { FlexOrderBuilder } from "@/components/FlexOrderBuilder";
import { MUNICIPAL_CALLBACK_NOTICE } from "@shared/municipalCallback";

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

/**
 * A manager who already chose a province should not have to find it again on
 * the team page. Nova Scotia and the western provinces share the WPI exam
 * family but stay distinct regions, because Nova Scotia certifies a narrower
 * set of distribution and collection classes.
 */
function readSavedTeamRegion(): TeamRegion {
  if (typeof window === "undefined") return "ontario";
  const jurisdiction = readCheckoutJurisdiction(window.location.search);
  if (jurisdiction === "NS") return "nova-scotia";
  if (jurisdiction && jurisdiction !== "ON") return "western";
  return "ontario";
}

export default function Teams() {
  const [location] = useLocation();
  const [planType, setPlanType] = useState<"annual" | "flex">("annual");
  const [region, setRegion] = useState<TeamRegion>(() => readSavedTeamRegion());
  const [tier, setTier] = useState<TeamStreamTier>("all-access");
  const [seats, setSeats] = useState(5);
  const [seatInput, setSeatInput] = useState("5");
  const [organizationName, setOrganizationName] = useState("");
  const [managerEmail, setManagerEmail] = useState("");
  const [inquiryOpen, setInquiryOpen] = useState<"quote" | "pilot" | null>(null);
  const [contactName, setContactName] = useState("");
  const [inquiryNotes, setInquiryNotes] = useState("");
  const [callbackPhone, setCallbackPhone] = useState("");
  const [callbackRequested, setCallbackRequested] = useState(false);
  const [preferredCallbackTime, setPreferredCallbackTime] = useState("");
  const [inquirySaved, setInquirySaved] = useState(false);
  const [requestKey, setRequestKey] = useState(() => crypto.randomUUID());
  const [honeypot, setHoneypot] = useState("");
  const [requestReceipt, setRequestReceipt] = useState<number | null>(null);
  const [confirmedBeforeTaxCents, setConfirmedBeforeTaxCents] = useState<number | null>(null);
  const sendInquiry = trpc.municipal.request.useMutation({
    onSuccess: data => {
      setRequestReceipt(data.receiptId);
      setConfirmedBeforeTaxCents(data.annualTotalBeforeTaxCents);
      setInquirySaved(true);
      toast.success("Request #" + data.receiptId + " received for staff review.");
    },
    onError: error => toast.error(error.message),
  });
  const requestInquiry = () => {
    if (!inquiryOpen || !organizationName.trim() || !contactName.trim() || !managerEmail.includes("@")) {
      return toast.error("Enter your organization, contact name and valid email.");
    }
    const common = {
      requestKey,
      name: contactName.trim(),
      email: managerEmail.trim(),
      organization: organizationName.trim().slice(0,128),
      region,
      notes: inquiryNotes.trim(),
      website: honeypot,
      phone: callbackPhone.trim(),
      callbackRequested,
      preferredCallbackTime: preferredCallbackTime.trim(),
    };
    if (inquiryOpen === "quote") {
      sendInquiry.mutate({ ...common, kind: "quote", tier, seats });
    } else {
      sendInquiry.mutate({ ...common, kind: "pilot" });
    }
  };

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
      analyticsContext: {
        ...getMarketingAttribution("/teams"),
        province: region,
        visitorId: getAnonymousAnalyticsId(),
      },
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

        {planType === "flex" ? <section className="mx-auto max-w-2xl"><FlexOrderBuilder initialRegion={region} /></section> : <section className="grid items-start gap-8 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="rounded-2xl border border-slate-200 bg-white p-7 shadow-xl shadow-slate-200/50">
            <h2 className="text-xl font-bold text-slate-900">Configure an annual plan</h2>
            <p className="mt-1 text-sm text-slate-600">One annual licence is assigned to one named operator. Licences have a five-seat minimum and renew yearly until cancelled.</p>
            <div className="mt-6 space-y-5">
              <div><Label>Province or region</Label><Select value={region} onValueChange={(value) => { if (isTeamRegion(value)) setRegion(value); }}><SelectTrigger className="mt-2"><SelectValue /></SelectTrigger><SelectContent>{TEAM_REGION_VALUES.map((teamRegion) => <SelectItem key={teamRegion} value={teamRegion}>{TEAM_REGION_LABELS[teamRegion]}</SelectItem>)}</SelectContent></Select>{region === "nova-scotia" && <p className="mt-2 text-xs leading-relaxed text-slate-500">Nova Scotia operators prepare with the shared WPI exam content. The province certifies Water Treatment and Wastewater Treatment Classes I to IV, and Water Distribution and Wastewater Collection Classes I to III.</p>}</div>
              <div><Label>Annual access scope</Label><div className="mt-2 grid gap-2 sm:grid-cols-2">{ANNUAL_TIERS.map((annualTier) => <button key={annualTier} type="button" onClick={() => setTier(annualTier)} className={`rounded-xl border p-3 text-left transition ${tier === annualTier ? "border-blue-700 bg-blue-50 ring-1 ring-blue-700" : "border-slate-200 hover:border-slate-300"}`}><div className="flex items-center justify-between gap-2"><span className="text-sm font-bold text-slate-900">{getTeamStreamLabel(region, annualTier)}</span><span className="text-sm font-bold text-teal-700">{formatTeamPriceCAD(getTeamBasePriceCents(region, annualTier))}</span></div><p className="mt-1 text-xs leading-relaxed text-slate-500">{getTeamStreamDescription(region, annualTier)}</p></button>)}</div></div>
              <div><Label>Annual operator licences</Label><p className="mt-1 text-xs text-slate-500">Graduated discounts apply only to licences in each volume band.</p><div className="mt-2 flex items-center gap-3"><Input type="number" min={5} max={500} value={seatInput} onChange={(event) => setSeatInput(event.target.value)} onBlur={commitSeats} onKeyDown={(event) => { if (event.key === "Enter") commitSeats(); }} className="w-28" /><span className="text-sm text-slate-500">named operators</span></div><div className="mt-3 flex flex-wrap gap-2">{[5, 10, 25, 50, 100].map((count) => <button key={count} type="button" onClick={() => { setSeats(count); setSeatInput(String(count)); }} className={`rounded-full border px-3 py-1 text-xs font-semibold ${seats === count ? "border-blue-900 bg-blue-900 text-white" : "border-slate-200 text-slate-600 hover:border-blue-300"}`}>{count}</button>)}</div></div>
              <div className="rounded-xl border border-blue-100 bg-gradient-to-br from-blue-50 to-teal-50 p-5"><div className="flex justify-between gap-5"><span className="text-sm text-slate-600">Average per operator / year</span><span className="text-xl font-bold text-teal-700">{formatTeamPriceCAD(averageSeatPrice)}</span></div><div className="mt-3 flex justify-between gap-5 border-t border-blue-100 pt-3"><span className="text-sm font-medium text-slate-700">Total before tax ({seats} licences)</span><span className="text-xl font-bold text-slate-900">{formatTeamPriceCAD(annualTotal)}</span></div>{savings > 0 && <p className="mt-3 text-xs font-semibold text-teal-700">Blended discount: {effectiveDiscount}% · you save {formatTeamPriceCAD(savings)} against list price.</p>}</div>

              <div className="flex flex-wrap gap-2">
                <Button type="button" variant="outline" onClick={() => {setInquirySaved(false);setRequestReceipt(null);setConfirmedBeforeTaxCents(null);setRequestKey(crypto.randomUUID());setInquiryOpen("quote");}}><FileText className="mr-2 h-4 w-4" /> Request official quote / PO</Button>
                <Button type="button" variant="outline" onClick={() => {setInquirySaved(false);setRequestReceipt(null);setConfirmedBeforeTaxCents(null);setRequestKey(crypto.randomUUID());setInquiryOpen("pilot");}}><FlaskConical className="mr-2 h-4 w-4" /> Request 3-operator pilot</Button>
              </div>
              <p className="text-xs text-slate-500">Requests are manually reviewed. No automatic invoices or pilot entitlements are issued.</p>
              <div className="space-y-1"><p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Volume pricing</p>{TEAM_VOLUME_TIERS.map((band) => <div key={band.label} className={`flex justify-between rounded-lg px-3 py-2 text-sm ${band === volumeTier ? "bg-blue-50 font-semibold text-blue-950" : "text-slate-600"}`}><span>{band.label}{band.discountPct ? ` · ${band.discountPct}% off those licences` : " · list price"}</span><span>{formatTeamPriceCAD(Math.round(basePrice * (1 - band.discountPct / 100)))}/yr</span></div>)}</div>
              <div className="grid gap-4 sm:grid-cols-2"><div><Label>Organization name</Label><Input value={organizationName} onChange={(event) => setOrganizationName(event.target.value)} placeholder="e.g. Utility name" className="mt-2" /></div><div><Label>Manager email</Label><Input type="email" value={managerEmail} onChange={(event) => setManagerEmail(event.target.value)} placeholder="e.g. operations manager email" className="mt-2" /></div></div>
              <Button onClick={startAnnualCheckout} disabled={createTeamCheckout.isPending} className="h-12 w-full bg-gradient-to-r from-blue-900 to-teal-700 text-base font-bold text-white hover:opacity-95">{createTeamCheckout.isPending ? "Opening secure checkout…" : `Start ${seats}-seat ${getTeamStreamLabel(region, tier)} plan — ${formatTeamPriceCAD(annualTotal)}/year`}</Button>
            </div>
          </div>
          <aside className="space-y-5"><div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"><h3 className="text-lg font-bold text-slate-900">Annual plan includes</h3><ul className="mt-4 space-y-3">{FEATURES.map((feature) => <li key={feature} className="flex gap-3 text-sm leading-relaxed text-slate-600"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-teal-600" />{feature}</li>)}</ul></div><div className="rounded-2xl border border-cyan-100 bg-cyan-50 p-6"><h3 className="text-base font-bold text-slate-900">Need a specific exam only?</h3><p className="mt-2 text-sm leading-relaxed text-slate-600">Use Teams Flex to buy 3- or 6-month Course Passes for the exact operators and courses in your cohort. Retake Extensions are available once per activated Course Pass.</p><Button variant="outline" onClick={() => setPlanType("flex")} className="mt-4 border-teal-600 text-teal-800 hover:bg-teal-100">Build a Flex order</Button></div><p className="px-1 text-xs leading-relaxed text-slate-500">Historical customer recovery is handled separately and is not changed by any new Team or Flex order.</p></aside>
        </section>}
        <div className="mt-10 text-center text-sm text-slate-600">Training one operator? Flex Course Passes are available for a single operator with supervisor reporting. Annual plans have a five-seat minimum.</div>

      </main>
      {inquiryOpen && <Dialog open onOpenChange={open => { if (!open) setInquiryOpen(null); }}>
        <DialogContent className="w-[calc(100vw-2rem)] max-w-lg max-h-[90vh] overflow-y-auto bg-white">
        <style>{`@media print {
          @page { size: A4; margin: 16mm; }
          body * { visibility: hidden !important; }
          .municipal-pricing-summary, .municipal-pricing-summary * { visibility: visible !important; }
          .municipal-pricing-summary { position: fixed !important; inset: 0; width: 100%; padding: 24px; background: white !important; border: 0 !important; }
          .municipal-print-hidden { display: none !important; }
        }`}</style>
        <DialogHeader>
          <DialogTitle>{inquiryOpen === "quote" ? "Municipal quotation request" : "14-day three-operator evaluation request"}</DialogTitle>
          <DialogDescription>Send a nonbinding request to Echelon Institute for staff review. No operator access or payment is created.</DialogDescription>
        </DialogHeader>
          {inquirySaved ? <div className="mt-4 space-y-4">
              <p className="text-sm">Request #{requestReceipt ?? "—"} received for staff review. No access or invoice has been issued.</p>
              {inquiryOpen === "quote" && confirmedBeforeTaxCents !== null && (
                <div className="municipal-pricing-summary rounded-lg border border-slate-200 bg-white p-5 text-sm">
                  <div className="text-base font-bold text-slate-900">Echelon Institute — Municipal Pricing Estimate</div>
                  <p className="mt-1 text-slate-600">Request reference: #{requestReceipt} · Status: Pending review</p>
                  <div className="mt-4 space-y-1">
                    <p>Organization: {organizationName}</p>
                    <p>Region: {TEAM_REGION_LABELS[region]}</p>
                    <p>Requested product: {getTeamStreamLabel(region, tier)}</p>
                    <p>Named annual operator licences: {seats}</p>
                    <p className="pt-2 font-semibold">Annual amount before applicable taxes: {formatTeamPriceCAD(confirmedBeforeTaxCents)}</p>
                  </div>
                  <p className="mt-4 border-t pt-3 text-xs text-slate-600">
                    For budgeting only. This is NOT a signed or binding quotation, purchase order, invoice, proof of payment, or promise of entitlement.
                    Taxes, procurement terms, and payment method require confirmation from Echelon Institute.
                  </p>
                  <Button type="button" className="municipal-print-hidden mt-3" variant="outline" onClick={() => window.print()}>Print / Save PDF summary</Button>
                </div>
              )}
            </div> :
            <form className="mt-4 space-y-3" onSubmit={event => {event.preventDefault();requestInquiry();}}>
              <div><Label>Organization</Label><Input required maxLength={200} value={organizationName} onChange={e=>setOrganizationName(e.target.value)} /></div>
              <div><Label>Contact name</Label><Input required maxLength={100} value={contactName} onChange={e=>setContactName(e.target.value)} /></div>
              <div><Label>Work email</Label><Input required type="email" maxLength={320} value={managerEmail} onChange={e=>setManagerEmail(e.target.value)} /></div>
              <div><Label htmlFor="callback-phone">Phone for a callback (optional)</Label><Input id="callback-phone" type="tel" autoComplete="tel" maxLength={32} value={callbackPhone} onChange={e=>setCallbackPhone(e.target.value)} /></div>
              <label className="flex items-start gap-2 text-sm text-slate-600"><input type="checkbox" checked={callbackRequested} onChange={e=>setCallbackRequested(e.target.checked)} className="mt-1" />{MUNICIPAL_CALLBACK_NOTICE}</label>
              {callbackRequested && <div><Label htmlFor="callback-time">Preferred callback time and time zone (optional)</Label><Input id="callback-time" maxLength={120} value={preferredCallbackTime} onChange={e=>setPreferredCallbackTime(e.target.value)} placeholder="e.g. weekdays 9–11 a.m. Eastern" /></div>}
              {inquiryOpen === "quote" && <p className="rounded-lg bg-slate-50 p-3 text-sm">{seats} annual {getTeamStreamLabel(region,tier)} seats: {formatTeamPriceCAD(annualTotal)} before tax (indicative, not a formal quote).</p>}
              <div><Label>Requirements (optional)</Label><textarea maxLength={500} rows={3} className="w-full rounded-lg border p-2" value={inquiryNotes} onChange={e=>setInquiryNotes(e.target.value)} /></div>
              <div className="hidden" aria-hidden="true"><label htmlFor="request-website">Website (leave blank)</label><input id="request-website" type="text" tabIndex={-1} autoComplete="off" value={honeypot} onChange={e=>setHoneypot(e.target.value)} /></div>
              <Button type="submit" disabled={sendInquiry.isPending}>{sendInquiry.isPending ? "Submitting…" : "Submit request"}</Button>
            </form>}
          <Button className="mt-3" type="button" variant="ghost" onClick={()=>setInquiryOpen(null)}>Close</Button>
        </DialogContent>
      </Dialog>}
    </div>
  );
}
