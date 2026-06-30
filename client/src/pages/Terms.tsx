// Terms of Use Page — Echelon Institute
// Phase 9: Trust, Credibility, and Enterprise Polish
import SiteNav from "@/components/SiteNav";
import { usePageMeta } from "@/hooks/usePageMeta";

const LOGO_URL =
  "https://d2xsxph8kpxj0f.cloudfront.net/310519663446228701/9KAR7mkGo7x7xavTEeEpiA/echelon-icon-v2_5c9ed3a7.webp";

export default function Terms() {
  usePageMeta({
    title: "Terms of Use — Echelon Institute",
    description: "Terms and conditions for using the Echelon Institute exam preparation platform.",
    keywords: "terms of use, terms and conditions, Echelon Institute",
  });

  return (
    <div style={{ fontFamily: "'Sora', sans-serif", background: "#F1F5F9", minHeight: "100vh" }}>
      <SiteNav currentPath="/terms" />
      <div style={{ maxWidth: 720, margin: "0 auto", padding: "48px 24px 120px" }}>

        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: 48 }}>
          <img src={LOGO_URL} alt="Echelon Institute" style={{ height: 48, width: "auto", marginBottom: 20 }} />
          <h1 style={{ fontSize: 30, fontWeight: 900, color: "#0F172A", margin: "0 0 10px", letterSpacing: "-0.02em" }}>
            Terms of Use
          </h1>
          <p style={{ fontSize: 14, color: "#94A3B8", margin: 0 }}>Last updated: June 30, 2026</p>
        </div>

        <LegalSection title="1. Acceptance of Terms">
          <p>By accessing or using Echelon Institute ("Echelon", "we", "us"), you agree to be bound by these Terms of Use. If you do not agree, do not use the platform.</p>
        </LegalSection>

        <LegalSection title="2. Description of Service">
          <p>Echelon Institute is an independent exam preparation platform for Canadian water and wastewater operators. We provide practice questions, mock exams, AI-powered tutoring, flashcards, and study resources.</p>
          <p><strong>Echelon is not affiliated with, endorsed by, or the official certifying body for any provincial or national certification program, including EOCP (Ontario) or WPI (Western Canada).</strong> Official exams are administered by your provincial authority.</p>
        </LegalSection>

        <LegalSection title="3. Accounts and Access">
          <ul>
            <li>Access is tied to the email address used at checkout. You are responsible for keeping your email address accurate.</li>
            <li>You may restore access on any device by entering your purchase email on the Account page.</li>
            <li>You may not share, sell, or transfer your access to another person.</li>
            <li>One-time passes grant lifetime access to a single exam type. Subscriptions grant access for the duration of the active billing period.</li>
          </ul>
        </LegalSection>

        <LegalSection title="4. Acceptable Use">
          <p>You agree not to:</p>
          <ul>
            <li>Reproduce, distribute, or resell any content from Echelon without written permission.</li>
            <li>Use automated tools to scrape, extract, or bulk-download questions or content.</li>
            <li>Attempt to reverse-engineer, bypass, or circumvent access controls.</li>
            <li>Use the AI Tutor to generate content for commercial purposes outside of your own exam preparation.</li>
            <li>Impersonate another user or misrepresent your identity.</li>
          </ul>
        </LegalSection>

        <LegalSection title="5. Intellectual Property">
          <p>All content on Echelon — including questions, explanations, flashcards, study notes, and AI-generated responses — is the property of Echelon Institute or its licensors. You may use the content solely for personal exam preparation. No content may be reproduced or distributed without written permission.</p>
        </LegalSection>

        <LegalSection title="6. Payments and Refunds">
          <p>All payments are processed by Stripe. Prices are in Canadian dollars (CAD) and include applicable taxes where required.</p>
          <p><strong>Refund policy:</strong> We offer a 7-day refund for first-time purchases if you have not completed more than 50 questions. To request a refund, email <a href="mailto:support@echeloninstitute.ca" style={{ color: "#3B82F6" }}>support@echeloninstitute.ca</a> with your purchase email and Stripe receipt.</p>
          <p>Subscriptions auto-renew annually unless cancelled before the renewal date. You can cancel at any time from your Account page.</p>
        </LegalSection>

        <LegalSection title="7. Disclaimer of Warranties">
          <p>Echelon is provided "as is" without warranties of any kind. We do not guarantee that use of Echelon will result in passing any certification exam. Exam content and formats may change; we strive to keep our question bank current but cannot guarantee it reflects the most recent exam syllabus at all times.</p>
        </LegalSection>

        <LegalSection title="8. Limitation of Liability">
          <p>To the maximum extent permitted by law, Echelon Institute shall not be liable for any indirect, incidental, special, or consequential damages arising from your use of the platform. Our total liability to you shall not exceed the amount you paid for your current subscription or pass in the 12 months preceding the claim.</p>
        </LegalSection>

        <LegalSection title="9. Governing Law">
          <p>These Terms are governed by the laws of the Province of Ontario, Canada. Any disputes shall be resolved in the courts of Ontario.</p>
        </LegalSection>

        <LegalSection title="10. Changes to These Terms">
          <p>We may update these Terms from time to time. Material changes will be communicated by email to active subscribers. Continued use of Echelon after changes constitutes acceptance of the updated Terms.</p>
        </LegalSection>

        <LegalSection title="11. Contact">
          <p>Questions about these Terms? Email <a href="mailto:support@echeloninstitute.ca" style={{ color: "#3B82F6" }}>support@echeloninstitute.ca</a>.</p>
        </LegalSection>
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
