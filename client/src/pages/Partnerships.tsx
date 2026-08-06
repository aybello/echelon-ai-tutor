// Echelon Institute — Partnerships Page
// For utility managers, training coordinators, and institutional partners

import { useState } from "react";
import LandingNav from "@/components/LandingNav";
import { usePageMeta } from "@/hooks/usePageMeta";
import { useAuth } from "@/_core/hooks/useAuth";

const PARTNER_TYPES = [
  {
    icon: "🏭",
    title: "Municipal Utilities",
    body: "Assign courses to your operators, track certification progress, and ensure your team meets regulatory requirements. Bulk seat pricing available for teams of 5 or more.",
  },
  {
    icon: "🎓",
    title: "Training Providers",
    body: "Supplement your in-person or online training programs with Echelon's question banks and AI tutor. White-label and co-branded options available for established training organizations.",
  },
  {
    icon: "🏛️",
    title: "Colleges & Universities",
    body: "Integrate Echelon into environmental technology, civil engineering, or water resources programs. Student group pricing and curriculum alignment support available.",
  },
  {
    icon: "🤝",
    title: "Industry Associations",
    body: "Partner with Echelon to offer discounted access to your members. We work with OWWCO, EOCP, AWWOA, and other provincial bodies to ensure content alignment.",
  },
];

const BENEFITS = [
  { stat: "18,876+", label: "Practice questions across 36 courses" },
  { stat: "5", label: "Provinces supported (ON, BC, AB, SK, MB)" },
  { stat: "4", label: "WPI streams (Water, Wastewater, Distribution, Collection)" },
  { stat: "AI", label: "Tutor with confidence scoring and pattern detection" },
];

export default function Partnerships() {
  usePageMeta({
    title: "Partnerships — Echelon Institute | Utility & Institutional Partners",
    description: "Partner with Echelon Institute to provide AI-powered water and wastewater operator exam prep to your team, students, or members. Bulk pricing, white-label, and curriculum integration available.",
  });

  const { isAuthenticated } = useAuth({ lazy: true });
  const [form, setForm] = useState({ name: "", org: "", email: "", type: "", message: "" });
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await fetch(`mailto:abello@echeloninstitute.ca?subject=Partnership Inquiry from ${encodeURIComponent(form.org)}&body=${encodeURIComponent(`Name: ${form.name}\nOrganization: ${form.org}\nEmail: ${form.email}\nType: ${form.type}\n\n${form.message}`)}`);
    } catch { /* ignore */ }
    // Send via mailto as fallback
    window.location.href = `mailto:abello@echeloninstitute.ca?subject=${encodeURIComponent(`Partnership Inquiry — ${form.org}`)}&body=${encodeURIComponent(`Name: ${form.name}\nOrganization: ${form.org}\nEmail: ${form.email}\nPartnership type: ${form.type}\n\nMessage:\n${form.message}`)}`;
    setSubmitted(true);
    setSubmitting(false);
  };

  return (
    <div style={{ background: "#F8FAFC", minHeight: "100vh", fontFamily: "'Sora', sans-serif" }}>
      <LandingNav isAuthenticated={isAuthenticated} currentPath="/partnerships" />

      {/* Hero */}
      <section style={{
        background: "linear-gradient(135deg, #0F172A 0%, #1E3A5F 100%)",
        padding: "80px 24px 72px",
        textAlign: "center",
      }}>
        <div style={{ maxWidth: 720, margin: "0 auto" }}>
          <div style={{
            display: "inline-block",
            background: "rgba(96,165,250,0.12)",
            border: "1px solid rgba(96,165,250,0.25)",
            borderRadius: 20,
            padding: "6px 16px",
            fontSize: 12,
            fontWeight: 700,
            color: "#60A5FA",
            letterSpacing: "0.08em",
            textTransform: "uppercase" as const,
            marginBottom: 24,
          }}>
            Partnerships
          </div>
          <h1 style={{
            fontSize: "clamp(28px, 5vw, 44px)",
            fontWeight: 900,
            color: "#FFFFFF",
            margin: "0 0 20px",
            lineHeight: 1.15,
            letterSpacing: "-0.02em",
          }}>
            Train Your Team.<br />Meet Your Compliance Goals.
          </h1>
          <p style={{
            fontSize: 17,
            color: "rgba(255,255,255,0.72)",
            lineHeight: 1.75,
            margin: "0 auto 36px",
            maxWidth: 560,
          }}>
            Echelon Institute partners with utilities, training providers, colleges, and industry associations to deliver AI-powered exam prep at scale.
          </p>
          <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" as const }}>
            <a href="/teams" style={{
              background: "#3B82F6",
              color: "#fff",
              padding: "12px 28px",
              borderRadius: 10,
              fontWeight: 700,
              fontSize: 15,
              textDecoration: "none",
              display: "inline-block",
            }}>
              View Team Pricing
            </a>
            <a href="#contact" style={{
              background: "rgba(255,255,255,0.1)",
              color: "#fff",
              padding: "12px 28px",
              borderRadius: 10,
              fontWeight: 700,
              fontSize: 15,
              textDecoration: "none",
              border: "1px solid rgba(255,255,255,0.2)",
              display: "inline-block",
            }}>
              Contact Us
            </a>
          </div>
        </div>
      </section>

      {/* Stats strip */}
      <section style={{ background: "#fff", borderBottom: "1px solid #E2E8F0", padding: "32px 24px" }}>
        <div style={{
          maxWidth: 900,
          margin: "0 auto",
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
          gap: 24,
          textAlign: "center",
        }}>
          {BENEFITS.map((b) => (
            <div key={b.label}>
              <div style={{ fontSize: 28, fontWeight: 900, color: "#1D4ED8", marginBottom: 4 }}>{b.stat}</div>
              <div style={{ fontSize: 13, color: "#64748B", lineHeight: 1.5 }}>{b.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Partner types */}
      <section style={{ padding: "72px 24px", maxWidth: 960, margin: "0 auto" }}>
        <h2 style={{ fontSize: 26, fontWeight: 800, color: "#0F172A", margin: "0 0 12px", letterSpacing: "-0.01em" }}>
          Who We Work With
        </h2>
        <p style={{ fontSize: 15, color: "#64748B", margin: "0 0 40px", lineHeight: 1.7 }}>
          We work with organizations across the water sector to make certification prep accessible and effective.
        </p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 20 }}>
          {PARTNER_TYPES.map((p) => (
            <div key={p.title} style={{
              background: "#fff",
              border: "1px solid #E2E8F0",
              borderRadius: 16,
              padding: "28px 24px",
              boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
            }}>
              <div style={{ fontSize: 32, marginBottom: 14 }}>{p.icon}</div>
              <div style={{ fontSize: 15, fontWeight: 700, color: "#0F172A", marginBottom: 10 }}>{p.title}</div>
              <p style={{ fontSize: 13, color: "#475569", lineHeight: 1.75, margin: 0 }}>{p.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* What partners get */}
      <section style={{ background: "#0F172A", padding: "72px 24px" }}>
        <div style={{ maxWidth: 860, margin: "0 auto" }}>
          <h2 style={{ fontSize: 26, fontWeight: 800, color: "#fff", margin: "0 0 12px", letterSpacing: "-0.01em" }}>
            What Partners Get
          </h2>
          <p style={{ fontSize: 15, color: "rgba(255,255,255,0.55)", margin: "0 0 40px", lineHeight: 1.7 }}>
            Every partnership includes access to the full Echelon platform with dedicated support.
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 16 }}>
            {[
              { icon: "📊", title: "Team Dashboard", body: "Assign courses, track completion rates, and monitor certification readiness across your entire team." },
              { icon: "💰", title: "Bulk Seat Pricing", body: "Significant discounts for teams of 5 or more. Custom pricing for large utilities and training organizations." },
              { icon: "🎯", title: "Content Alignment", body: "We align course content to your provincial regulatory framework and exam body requirements." },
              { icon: "🤝", title: "Dedicated Support", body: "A dedicated account manager for onboarding, training, and ongoing support throughout your partnership." },
              { icon: "📋", title: "Compliance Reporting", body: "Export operator progress reports for regulatory audits and internal compliance documentation." },
              { icon: "🔧", title: "Custom Integration", body: "API access and LMS integration available for established training providers and educational institutions." },
            ].map((item) => (
              <div key={item.title} style={{
                background: "rgba(255,255,255,0.05)",
                border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: 14,
                padding: "22px 20px",
              }}>
                <div style={{ fontSize: 24, marginBottom: 10 }}>{item.icon}</div>
                <div style={{ fontSize: 14, fontWeight: 700, color: "#fff", marginBottom: 8 }}>{item.title}</div>
                <p style={{ fontSize: 13, color: "rgba(255,255,255,0.6)", lineHeight: 1.7, margin: 0 }}>{item.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact form */}
      <section id="contact" style={{ padding: "72px 24px", maxWidth: 640, margin: "0 auto" }}>
        <h2 style={{ fontSize: 26, fontWeight: 800, color: "#0F172A", margin: "0 0 12px", letterSpacing: "-0.01em" }}>
          Get in Touch
        </h2>
        <p style={{ fontSize: 15, color: "#64748B", margin: "0 0 36px", lineHeight: 1.7 }}>
          Tell us about your organization and what you are looking for. We will respond within one business day.
        </p>

        {submitted ? (
          <div style={{
            background: "#F0FDF4",
            border: "1px solid #BBF7D0",
            borderRadius: 14,
            padding: "32px 28px",
            textAlign: "center",
          }}>
            <div style={{ fontSize: 40, marginBottom: 16 }}>✅</div>
            <div style={{ fontSize: 18, fontWeight: 700, color: "#15803D", marginBottom: 8 }}>Message sent</div>
            <p style={{ fontSize: 14, color: "#166534", margin: 0 }}>
              Your email client should have opened with a pre-filled message. If not, email us directly at{" "}
              <a href="mailto:abello@echeloninstitute.ca" style={{ color: "#15803D" }}>abello@echeloninstitute.ca</a>.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column" as const, gap: 16 }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              <div>
                <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 6 }}>
                  Your Name *
                </label>
                <input
                  required
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Jane Smith"
                  style={{
                    width: "100%", padding: "10px 14px", borderRadius: 8,
                    border: "1px solid #D1D5DB", fontSize: 14, outline: "none",
                    boxSizing: "border-box" as const,
                  }}
                />
              </div>
              <div>
                <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 6 }}>
                  Organization *
                </label>
                <input
                  required
                  type="text"
                  value={form.org}
                  onChange={(e) => setForm({ ...form, org: e.target.value })}
                  placeholder="Kingston Utilities"
                  style={{
                    width: "100%", padding: "10px 14px", borderRadius: 8,
                    border: "1px solid #D1D5DB", fontSize: 14, outline: "none",
                    boxSizing: "border-box" as const,
                  }}
                />
              </div>
            </div>
            <div>
              <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 6 }}>
                Work Email *
              </label>
              <input
                required
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="jane@utility.ca"
                style={{
                  width: "100%", padding: "10px 14px", borderRadius: 8,
                  border: "1px solid #D1D5DB", fontSize: 14, outline: "none",
                  boxSizing: "border-box" as const,
                }}
              />
            </div>
            <div>
              <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 6 }}>
                Partnership Type
              </label>
              <select
                value={form.type}
                onChange={(e) => setForm({ ...form, type: e.target.value })}
                style={{
                  width: "100%", padding: "10px 14px", borderRadius: 8,
                  border: "1px solid #D1D5DB", fontSize: 14, outline: "none",
                  background: "#fff", boxSizing: "border-box" as const,
                }}
              >
                <option value="">Select a type…</option>
                <option value="Municipal Utility">Municipal Utility</option>
                <option value="Training Provider">Training Provider</option>
                <option value="College or University">College or University</option>
                <option value="Industry Association">Industry Association</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <div>
              <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 6 }}>
                Message *
              </label>
              <textarea
                required
                value={form.message}
                onChange={(e) => setForm({ ...form, message: e.target.value })}
                placeholder="Tell us about your team size, certification goals, and what you are looking for in a partnership…"
                rows={5}
                style={{
                  width: "100%", padding: "10px 14px", borderRadius: 8,
                  border: "1px solid #D1D5DB", fontSize: 14, outline: "none",
                  resize: "vertical" as const, boxSizing: "border-box" as const,
                }}
              />
            </div>
            <button
              type="submit"
              disabled={submitting}
              style={{
                background: "#1D4ED8",
                color: "#fff",
                padding: "13px 28px",
                borderRadius: 10,
                fontWeight: 700,
                fontSize: 15,
                border: "none",
                cursor: submitting ? "not-allowed" : "pointer",
                opacity: submitting ? 0.7 : 1,
              }}
            >
              {submitting ? "Sending…" : "Send Partnership Inquiry"}
            </button>
            <p style={{ fontSize: 12, color: "#9CA3AF", margin: 0, textAlign: "center" as const }}>
              Or email us directly at{" "}
              <a href="mailto:abello@echeloninstitute.ca" style={{ color: "#1D4ED8" }}>abello@echeloninstitute.ca</a>
            </p>
          </form>
        )}
      </section>

      {/* Footer */}
      <footer style={{ background: "#0F172A", padding: "32px 24px", textAlign: "center" }}>
        <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 13, margin: 0 }}>
          © 2026 Echelon Institute ·{" "}
          <a href="/privacy" style={{ color: "rgba(255,255,255,0.5)", textDecoration: "none" }}>Privacy</a>
          {" · "}
          <a href="/terms" style={{ color: "rgba(255,255,255,0.5)", textDecoration: "none" }}>Terms</a>
          {" · "}
          <a href="/about" style={{ color: "rgba(255,255,255,0.5)", textDecoration: "none" }}>About</a>
        </p>
      </footer>
    </div>
  );
}
