// Refund Policy Page — Echelon Institute
// Phase 9: Trust, Credibility, and Enterprise Polish
import SiteNav from "@/components/SiteNav";
import { usePageMeta } from "@/hooks/usePageMeta";
import { Link } from "wouter";

const LOGO_URL =
  "https://d2xsxph8kpxj0f.cloudfront.net/310519663446228701/9KAR7mkGo7x7xavTEeEpiA/echelon-icon-v2_5c9ed3a7.webp";

export default function Refund() {
  usePageMeta({
    title: "Refund Policy — Echelon Institute",
    description: "Echelon Institute's refund and cancellation policy for practice passes and subscriptions.",
    keywords: "refund policy, cancellation, Echelon Institute",
  });

  return (
    <div style={{ fontFamily: "'Sora', sans-serif", background: "#F1F5F9", minHeight: "100vh" }}>
      <SiteNav currentPath="/refund" />
      <div style={{ maxWidth: 720, margin: "0 auto", padding: "48px 24px 120px" }}>

        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: 48 }}>
          <img src={LOGO_URL} alt="Echelon Institute" style={{ height: 48, width: "auto", marginBottom: 20 }} />
          <h1 style={{ fontSize: 30, fontWeight: 900, color: "#0F172A", margin: "0 0 10px", letterSpacing: "-0.02em" }}>
            Refund Policy
          </h1>
          <p style={{ fontSize: 14, color: "#94A3B8", margin: 0 }}>Last updated: June 30, 2026</p>
        </div>

        {/* Quick summary */}
        <div style={{ background: "linear-gradient(135deg, #EFF6FF, #F0FDF4)", border: "1px solid #BFDBFE", borderRadius: 14, padding: "24px 28px", marginBottom: 32 }}>
          <h2 style={{ fontSize: 16, fontWeight: 800, color: "#1D4ED8", margin: "0 0 12px" }}>Quick Summary</h2>
          <ul style={{ fontSize: 14, color: "#334155", lineHeight: 1.8, margin: 0, paddingLeft: 20 }}>
            <li><strong>One-time passes:</strong> 7-day refund window, up to 50 questions completed.</li>
            <li><strong>Subscriptions:</strong> Cancel anytime; access continues until end of billing period. No prorated refunds.</li>
            <li><strong>Teams plans:</strong> Contact us within 7 days of purchase for a refund if no seats have been activated.</li>
            <li><strong>How to request:</strong> Email <a href="mailto:support@echeloninstitute.ca" style={{ color: "#3B82F6" }}>support@echeloninstitute.ca</a> with your purchase email and Stripe receipt.</li>
          </ul>
        </div>

        <LegalSection title="One-Time Practice Passes">
          <p>We offer a full refund on one-time practice passes if:</p>
          <ul>
            <li>The refund request is made within <strong>7 days</strong> of the original purchase date.</li>
            <li>You have completed <strong>fewer than 50 questions</strong> on the pass.</li>
          </ul>
          <p>Refunds are processed to the original payment method within 5–10 business days via Stripe.</p>
          <p>If you purchased the wrong exam type by mistake, we can transfer your purchase to the correct exam type instead of issuing a refund — just email us.</p>
        </LegalSection>

        <LegalSection title="Annual Subscriptions">
          <p>Subscriptions auto-renew annually. You may cancel at any time from your <Link href="/account"><span style={{ color: "#3B82F6", cursor: "pointer" }}>Account page</span></Link> using the "Manage Subscription" link. After cancellation:</p>
          <ul>
            <li>Your access continues until the end of the current billing period.</li>
            <li>You will not be charged at the next renewal date.</li>
            <li>No prorated refunds are issued for the remaining days of the current period.</li>
          </ul>
          <p><strong>Exception:</strong> If you cancel within 48 hours of an annual renewal charge and have not used the platform since the renewal, contact us and we will issue a full refund of the renewal charge.</p>
        </LegalSection>

        <LegalSection title="Teams Plans">
          <p>Teams plan purchases are eligible for a full refund within 7 days of purchase if no seats have been activated (i.e., no operators have been assigned to seats). Once seats are activated, the purchase is non-refundable.</p>
          <p>If you need to reduce the number of seats mid-term, contact us and we will work with you on a solution.</p>
        </LegalSection>

        <LegalSection title="Non-Refundable Situations">
          <ul>
            <li>Refund requests made after the 7-day window.</li>
            <li>Passes where more than 50 questions have been completed.</li>
            <li>Subscription renewals where the platform has been used after the renewal date.</li>
            <li>Purchases made through promotional pricing or discount codes (unless otherwise stated).</li>
          </ul>
        </LegalSection>

        <LegalSection title="How to Request a Refund">
          <p>Email <a href="mailto:support@echeloninstitute.ca?subject=Refund%20Request" style={{ color: "#3B82F6" }}>support@echeloninstitute.ca</a> with:</p>
          <ul>
            <li>Your purchase email address.</li>
            <li>Your Stripe receipt or order number.</li>
            <li>A brief description of the reason for your refund request.</li>
          </ul>
          <p>We aim to respond within 1 business day and process approved refunds within 5–10 business days.</p>
        </LegalSection>

        <div style={{ marginTop: 48, padding: "20px 24px", background: "#fff", borderRadius: 12, border: "1px solid #E2E8F0", textAlign: "center" }}>
          <p style={{ color: "#64748B", fontSize: 13, margin: "0 0 8px" }}>Questions about refunds?</p>
          <a href="mailto:support@echeloninstitute.ca?subject=Refund%20Question" style={{ color: "#3B82F6", fontWeight: 700, fontSize: 13 }}>Email support@echeloninstitute.ca →</a>
        </div>
      </div>
    </div>
  );
}

function LegalSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 32, background: "#fff", borderRadius: 12, border: "1px solid #E2E8F0", padding: "24px 28px" }}>
      <h2 style={{ fontSize: 16, fontWeight: 800, color: "#0F172A", margin: "0 0 14px" }}>{title}</h2>
      <div style={{ fontSize: 14, color: "#475569", lineHeight: 1.8 }}>
        {children}
      </div>
    </div>
  );
}
