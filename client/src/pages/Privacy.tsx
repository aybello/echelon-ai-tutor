// Privacy & Security Page — Echelon Institute
// Phase 9: Trust, Credibility, and Enterprise Polish
import SiteNav from "@/components/SiteNav";
import { usePageMeta } from "@/hooks/usePageMeta";

const LOGO_URL =
  "https://d2xsxph8kpxj0f.cloudfront.net/310519663446228701/9KAR7mkGo7x7xavTEeEpiA/echelon-icon-v2_5c9ed3a7.webp";

export default function Privacy() {
  usePageMeta({
    title: "Privacy & Security — Echelon Institute",
    description: "How Echelon Institute collects, uses, and protects your personal information.",
    keywords: "privacy policy, data security, Echelon Institute",
  });

  return (
    <div style={{ fontFamily: "'Sora', sans-serif", background: "#F1F5F9", minHeight: "100vh" }}>
      <SiteNav currentPath="/privacy" />
      <div style={{ maxWidth: 720, margin: "0 auto", padding: "48px 24px 120px" }}>

        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: 48 }}>
          <img src={LOGO_URL} alt="Echelon Institute" style={{ height: 48, width: "auto", marginBottom: 20 }} />
          <h1 style={{ fontSize: 30, fontWeight: 900, color: "#0F172A", margin: "0 0 10px", letterSpacing: "-0.02em" }}>
            Privacy & Security
          </h1>
          <p style={{ fontSize: 14, color: "#94A3B8", margin: 0 }}>Last updated: August 28, 2026</p>
        </div>

        <LegalSection title="1. Who We Are">
          <p>Echelon Institute is an independent exam preparation platform serving water and wastewater operators in Canada and the United States. We are not a certifying authority.</p>
          <p>Privacy contact: <a href="mailto:abello@echeloninstitute.ca?subject=Privacy%20Request" style={{ color: "#3B82F6" }}>abello@echeloninstitute.ca</a>. We respond to access, correction, and complaint requests within a reasonable period.</p>
        </LegalSection>

        <LegalSection title="2. Information We Collect">
          <p>We collect the following information when you use Echelon:</p>
          <ul>
            <li><strong>Email address</strong> — used to identify your account, restore access, and send purchase receipts and study reminders.</li>
            <li><strong>Payment information</strong> — processed entirely by Stripe. Echelon never stores your credit card number, CVV, or full payment details.</li>
            <li><strong>Practice and training activity</strong> — questions answered, accuracy, confidence ratings, bookmarks, activity type, verified active-study duration, and session dates. Used to power your study plan, readiness score, and training-hours record.</li>
            <li><strong>Exam date</strong> — if you choose to enter it, used to calculate your countdown and pace recommendations.</li>
            <li><strong>Device, browser, IP, and security-event information</strong> — used to secure accounts, prevent abuse, and diagnose service problems.</li>
          </ul>
        </LegalSection>

        <LegalSection title="3. How We Use Your Information">
          <ul>
            <li>To provide access to the courses you purchased.</li>
            <li>To personalize your study plan, readiness score, and AI tutor responses.</li>
            <li>To send purchase receipts, access restoration links, and study reminders.</li>
            <li>To help team managers track operator progress (Teams plan only).</li>
            <li>To detect and prevent fraud and abuse.</li>
          </ul>
          <p>We do not sell your personal information to third parties.</p>
        </LegalSection>

        <LegalSection title="4. Data Storage and Security">
          <ul>
            <li>Information may be processed or stored in Canada, the United States, or another country where a service provider operates. It may therefore be subject to the laws of that jurisdiction.</li>
            <li>Passwords are never stored — we use magic links and OTP codes for authentication.</li>
            <li>All connections are encrypted via HTTPS/TLS.</li>
            <li>Payment processing is handled by Stripe, which is PCI DSS Level 1 certified.</li>
            <li>Access tokens are short-lived and signed with a server-side secret.</li>
          </ul>
        </LegalSection>

        <LegalSection title="5. AI Tutor and Data">
          <p>When you use the AI Tutor, your questions and the AI's responses are stored to provide conversation memory within your session. Session summaries are stored to improve future tutor responses for your account. Your conversations are not used to train public AI models.</p>
        </LegalSection>

        <LegalSection title="6. Teams and Organizational Data">
          <p>If an employer or utility provides your access, authorized managers can see course activation, practice activity, verified active-study time, session dates and durations, readiness indicators, weak-topic summaries, exam dates you enter, and exam outcomes recorded in the platform. A manager or ORO may sign an immutable training-record snapshot, which remains available to the operator. Managers do not receive the text of private AI Tutor conversations or individual answer content. Some records may need to be retained for contractual, training-record, security, legal, or aggregate reporting purposes after a deletion request.</p>
        </LegalSection>

        <LegalSection title="7. Your Rights">
          <ul>
            <li><strong>Access:</strong> Request a copy of the data we hold about you.</li>
            <li><strong>Correction:</strong> Request correction of inaccurate data.</li>
            <li><strong>Deletion:</strong> Request deletion of your account and associated data.</li>
            <li><strong>Portability:</strong> Download or request an export of your practice and training-hours history.</li>
          </ul>
          <p>To exercise a right or make a privacy complaint, email <a href="mailto:abello@echeloninstitute.ca?subject=Privacy%20Request" style={{ color: "#3B82F6" }}>abello@echeloninstitute.ca</a>. We may need to verify your identity. If you are not satisfied with our response, you may contact the Office of the Privacy Commissioner of Canada or the applicable provincial/state regulator.</p>
        </LegalSection>

        <LegalSection title="8. Cookies">
          <p>Echelon uses cookies to maintain your session after signing in. We do not use advertising or tracking cookies. You can clear cookies at any time from your browser settings or from the <a href="/account" style={{ color: "#3B82F6" }}>Account page</a>.</p>
        </LegalSection>

        <LegalSection title="9. Service Providers, Retention, and Transfers">
          <p>We use service providers for payment processing, hosting and database infrastructure, email delivery, analytics, error monitoring, and AI functionality. They may process only the information needed to provide their service under their own contractual and legal obligations.</p>
          <p>Account, purchase, and learning records are retained while an account or institutional relationship is active and afterward only as reasonably needed for access restoration, contractual reporting, security, tax, dispute, and legal obligations. Authentication codes are short-lived. We periodically review records that no longer have a business or legal purpose for deletion or de-identification.</p>
        </LegalSection>

        <LegalSection title="10. Marketing Communications">
          <p>Transactional messages such as receipts, access links, security notices, and service communications are necessary to provide the platform. Promotional messages are sent only where permitted by law and include an unsubscribe method. You can opt out of promotional or study-reminder emails without losing course access.</p>
        </LegalSection>

        <LegalSection title="11. Changes to This Policy">
          <p>We may update this policy from time to time. Material changes will be communicated by email to active subscribers. The "last updated" date at the top of this page reflects the most recent revision.</p>
        </LegalSection>

        <div style={{ marginTop: 48, padding: "20px 24px", background: "#fff", borderRadius: 12, border: "1px solid #E2E8F0", textAlign: "center" }}>
          <p style={{ color: "#64748B", fontSize: 13, margin: "0 0 8px" }}>Questions about privacy or data handling?</p>
          <a href="mailto:abello@echeloninstitute.ca?subject=Privacy%20Question" style={{ color: "#3B82F6", fontWeight: 700, fontSize: 13 }}>Email abello@echeloninstitute.ca →</a>
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
