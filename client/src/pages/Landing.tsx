// Echelon Institute — Homepage / Landing Page
// Design: Bold, modern SaaS — feels like the product itself
// Audience: Canadian water/wastewater operators seeking certification

import { Link } from "wouter";
import { useState, useRef, useEffect } from "react";
import { motion, useInView, useReducedMotion } from "framer-motion";
import NotifyModal from "@/components/NotifyModal";
import NationalWaitlistModal from "@/components/NationalWaitlistModal";
import { usePageMeta } from "@/hooks/usePageMeta";
import { useStructuredData } from "@/hooks/useStructuredData";
import { landingPageSchemas } from "@/lib/structuredData";
import { trpc } from "@/lib/trpc";
import ProvinceBanner from "@/components/ProvinceBanner";
import { useProvince, type ProvinceId } from "@/hooks/useProvince";
import { useAuth } from "@/_core/hooks/useAuth";
import { FadeUp, FadeIn, SlideLeft, StaggerContainer, StaggerItem } from "@/components/animations";
import { useCountUp } from "@/hooks/useCountUp";
import React from "react";

// Animated stat component using count-up hook
function AnimatedStat({ value, suffix = "", label }: { value: number; suffix?: string; label: string }) {
  const { ref, count } = useCountUp(value, 1600);
  return (
    <div>
      <span ref={ref} style={{ fontSize: 32, fontWeight: 800, color: "#0F172A", letterSpacing: "-0.03em", fontFamily: "Sora, sans-serif", display: "block" }}>
        {count.toLocaleString()}{suffix}
      </span>
      <div style={{ fontSize: 13, color: "#64748B", fontWeight: 500, marginTop: 2 }}>{label}</div>
    </div>
  );
}

function FaqItem({ q, a, isLast }: { q: string; a: string; isLast?: boolean }) {
  const [open, setOpen] = useState(false);
  return (
    <div
      style={{
        borderTop: "1px solid #E2E8F0",
        borderBottom: isLast ? "1px solid #E2E8F0" : "none",
      }}
    >
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          width: "100%",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "20px 0",
          background: "transparent",
          border: "none",
          cursor: "pointer",
          textAlign: "left",
          fontFamily: "inherit",
          gap: 16,
        }}
      >
        <span style={{ fontSize: 15, fontWeight: 700, color: "#0F172A", lineHeight: 1.4 }}>{q}</span>
        <span style={{
          fontSize: 20,
          color: "#1D4ED8",
          fontWeight: 400,
          flexShrink: 0,
          transform: open ? "rotate(45deg)" : "rotate(0deg)",
          transition: "transform 0.2s ease",
          display: "inline-block",
          lineHeight: 1,
        }}>+</span>
      </button>
      {open && (
        <div style={{ paddingBottom: 20, fontSize: 14, color: "#475569", lineHeight: 1.7 }}>
          {a}
        </div>
      )}
    </div>
  );
}

function BlogPreviewSection() {
  const { data: allPosts } = trpc.blog.listPosts.useQuery();
  const posts = (allPosts ?? []).slice(0, 3);

  if (posts.length === 0) return null;

  return (
    <section style={{ background: "#F8FAFC", padding: "80px 24px", borderTop: "1px solid #E2E8F0" }}>
      <div style={{ maxWidth: 1100, margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: 48 }}>
          <div style={{ display: "inline-block", background: "#DBEAFE", color: "#1D4ED8", fontSize: 12, fontWeight: 700, letterSpacing: "0.08em", padding: "6px 14px", borderRadius: 20, marginBottom: 16 }}>FROM THE BLOG</div>
          <h2 style={{ fontSize: "clamp(24px, 4vw, 36px)", fontWeight: 800, color: "#0F172A", margin: "0 0 12px", fontFamily: "Sora, sans-serif", letterSpacing: "-0.02em" }}>Study Guides for Canadian Operators</h2>
          <p style={{ fontSize: 16, color: "#64748B", maxWidth: 520, margin: "0 auto" }}>Free in-depth articles covering exam content, regulations, and career advice for water and wastewater operators.</p>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 24, marginBottom: 40 }}>
          {posts.map((post: { slug: string; title: string; excerpt: string; tags: string | null; readingTimeMinutes: number }) => (
            <Link key={post.slug} href={`/blog/${post.slug}`}>
              <div style={{
                background: "#FFFFFF",
                border: "1px solid #E2E8F0",
                borderRadius: 12,
                padding: "28px 24px",
                cursor: "pointer",
                transition: "box-shadow 0.2s",
                height: "100%",
                display: "flex",
                flexDirection: "column",
              }}
              onMouseEnter={e => (e.currentTarget.style.boxShadow = "0 8px 24px rgba(0,0,0,0.10)")}
              onMouseLeave={e => (e.currentTarget.style.boxShadow = "none")}
              >
                {post.tags && (
                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 12 }}>
                    {post.tags.split(",").slice(0, 2).map((tag: string) => (
                      <span key={tag} style={{ background: "#EFF6FF", color: "#1D4ED8", fontSize: 11, fontWeight: 600, padding: "3px 10px", borderRadius: 20, letterSpacing: "0.04em" }}>{tag.trim()}</span>
                    ))}
                  </div>
                )}
                <h3 style={{ fontSize: 17, fontWeight: 700, color: "#0F172A", margin: "0 0 10px", lineHeight: 1.4, fontFamily: "Sora, sans-serif", flex: 1 }}>{post.title}</h3>
                <p style={{ fontSize: 14, color: "#64748B", margin: "0 0 16px", lineHeight: 1.6 }}>{post.excerpt.slice(0, 120)}{post.excerpt.length > 120 ? "..." : ""}</p>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: "auto" }}>
                  <span style={{ fontSize: 12, color: "#94A3B8" }}>{post.readingTimeMinutes} min read</span>
                  <span style={{ fontSize: 13, color: "#1D4ED8", fontWeight: 600 }}>Read article →</span>
                </div>
              </div>
            </Link>
          ))}
        </div>

        <div style={{ textAlign: "center" }}>
          <Link href="/blog">
            <button style={{
              background: "#1D4ED8",
              color: "#FFFFFF",
              border: "none",
              borderRadius: 8,
              padding: "12px 28px",
              fontSize: 15,
              fontWeight: 600,
              cursor: "pointer",
              fontFamily: "Sora, sans-serif",
            }}>View All Articles</button>
          </Link>
        </div>
      </div>
    </section>
  );
}

function ContactSection() {
  const [form, setForm] = useState({ name: "", email: "", subject: "", message: "" });
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  const sendContact = trpc.contact.send.useMutation({
    onSuccess: () => setSubmitted(true),
    onError: (err) => setError(err.message || "Failed to send. Please try again."),
  });

  const validateField = (name: string, value: string): string => {
    switch (name) {
      case "name": return value.trim() ? "" : "Name is required";
      case "email": return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim()) ? "" : "Please enter a valid email address";
      case "subject": return value.trim() ? "" : "Please select a subject";
      case "message": return value.trim().length >= 10 ? "" : value.trim() ? "Message must be at least 10 characters" : "Message is required";
      default: return "";
    }
  };

  const handleChange = (name: string, value: string) => {
    setForm(f => ({ ...f, [name]: value }));
    if (touched[name]) {
      setFieldErrors(prev => ({ ...prev, [name]: validateField(name, value) }));
    }
  };

  const handleBlur = (name: string) => {
    setTouched(prev => ({ ...prev, [name]: true }));
    setFieldErrors(prev => ({ ...prev, [name]: validateField(name, form[name as keyof typeof form]) }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    // Validate all fields
    const allTouched = { name: true, email: true, subject: true, message: true };
    setTouched(allTouched);
    const errors = {
      name: validateField("name", form.name),
      email: validateField("email", form.email),
      subject: validateField("subject", form.subject),
      message: validateField("message", form.message),
    };
    setFieldErrors(errors);
    if (Object.values(errors).some(e => e)) return;
    sendContact.mutate(form);
  };

  return (
    <section id="contact" style={{ background: "#F1F5F9", padding: "80px 24px" }}>
      <div style={{ maxWidth: 1100, margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: 48 }}>
          <div style={{ display: "inline-block", background: "#DBEAFE", color: "#1D4ED8", fontSize: 12, fontWeight: 700, letterSpacing: "0.08em", padding: "6px 14px", borderRadius: 20, marginBottom: 16 }}>CONTACT US</div>
          <h2 style={{ fontSize: "clamp(24px, 3vw, 36px)", fontWeight: 800, color: "#0F172A", margin: "0 0 12px", letterSpacing: "-0.02em" }}>Get in Touch</h2>
          <p style={{ fontSize: 16, color: "#64748B", margin: 0, maxWidth: 480, marginLeft: "auto", marginRight: "auto" }}>Have a question about a course, certification, or your account? We're here to help.</p>
        </div>

        <div className="contact-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1.6fr", gap: 40, alignItems: "start" }}>
          {/* Contact info */}
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            <div style={{ background: "#FFFFFF", borderRadius: 16, padding: "24px", border: "1px solid #E2E8F0" }}>
              <div style={{ fontSize: 28, marginBottom: 12 }}>📞</div>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#64748B", letterSpacing: "0.06em", marginBottom: 6 }}>PHONE</div>
              <a href="tel:+12897881885" style={{ fontSize: 20, fontWeight: 800, color: "#0F172A", textDecoration: "none" }}>289-788-1885</a>
              <p style={{ fontSize: 13, color: "#64748B", margin: "6px 0 0" }}>Mon–Fri, 9am–5pm ET</p>
            </div>
            <div style={{ background: "#FFFFFF", borderRadius: 16, padding: "24px", border: "1px solid #E2E8F0" }}>
              <div style={{ fontSize: 28, marginBottom: 12 }}>✉️</div>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#64748B", letterSpacing: "0.06em", marginBottom: 6 }}>EMAIL</div>
              <a href="mailto:abello@echeloninstitute.ca" style={{ fontSize: 15, fontWeight: 700, color: "#1D4ED8", textDecoration: "none", wordBreak: "break-all" }}>abello@echeloninstitute.ca</a>
              <p style={{ fontSize: 13, color: "#64748B", margin: "6px 0 0" }}>We reply within 1 business day</p>
            </div>
            <div style={{ background: "linear-gradient(135deg, #1D4ED8, #0E7490)", borderRadius: 16, padding: "24px", color: "#fff" }}>
              <div style={{ fontSize: 13, fontWeight: 700, letterSpacing: "0.06em", marginBottom: 8, opacity: 0.8 }}>QUICK LINKS</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {[
                  { label: "View Pricing", href: "/pricing" },
                  { label: "Browse Courses", href: "#courses" },
                  { label: "Formula Sheets", href: "/formulas" },
                ].map(l => (
                  <a key={l.label} href={l.href} style={{ fontSize: 14, color: "rgba(255,255,255,0.85)", textDecoration: "none", fontWeight: 600 }}>{l.label} →</a>
                ))}
              </div>
            </div>
          </div>

          {/* Contact form */}
          <div style={{ background: "#FFFFFF", borderRadius: 20, padding: "36px", border: "1px solid #E2E8F0", boxShadow: "0 4px 24px rgba(0,0,0,0.06)" }}>
            {submitted ? (
              <div style={{ textAlign: "center", padding: "40px 20px" }}>
                <div style={{ fontSize: 52, marginBottom: 16 }}>✅</div>
                <h3 style={{ fontSize: 22, fontWeight: 800, color: "#0F172A", margin: "0 0 8px" }}>Message Sent!</h3>
                <p style={{ fontSize: 15, color: "#64748B", margin: "0 0 24px" }}>We'll get back to you within 1 business day.</p>
                <button
                  onClick={() => { setSubmitted(false); setForm({ name: "", email: "", subject: "", message: "" }); }}
                  style={{ padding: "10px 24px", borderRadius: 10, background: "#EFF6FF", color: "#1D4ED8", border: "1px solid #BFDBFE", fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}
                >Send Another Message</button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 18 }}>
                <h3 style={{ fontSize: 18, fontWeight: 800, color: "#0F172A", margin: "0 0 4px" }}>Send Us a Message</h3>
                <div className="contact-form-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                  <div>
                    <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#64748B", marginBottom: 6, letterSpacing: "0.05em" }}>YOUR NAME</label>
                    <input
                      type="text"
                      value={form.name}
                      onChange={e => handleChange("name", e.target.value)}
                      onBlur={() => handleBlur("name")}
                      placeholder="Jane Smith"
                      style={{ width: "100%", padding: "10px 14px", borderRadius: 10, border: `1.5px solid ${fieldErrors.name ? "#DC2626" : "#E2E8F0"}`, fontSize: 14, fontFamily: "inherit", outline: "none", boxSizing: "border-box", color: "#0F172A" }}
                    />
                    {fieldErrors.name && <p style={{ margin: "4px 0 0", fontSize: 12, color: "#DC2626" }}>{fieldErrors.name}</p>}
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#64748B", marginBottom: 6, letterSpacing: "0.05em" }}>EMAIL ADDRESS</label>
                    <input
                      type="email"
                      value={form.email}
                      onChange={e => handleChange("email", e.target.value)}
                      onBlur={() => handleBlur("email")}
                      placeholder="jane@example.com"
                      style={{ width: "100%", padding: "10px 14px", borderRadius: 10, border: `1.5px solid ${fieldErrors.email ? "#DC2626" : "#E2E8F0"}`, fontSize: 14, fontFamily: "inherit", outline: "none", boxSizing: "border-box", color: "#0F172A" }}
                    />
                    {fieldErrors.email && <p style={{ margin: "4px 0 0", fontSize: 12, color: "#DC2626" }}>{fieldErrors.email}</p>}
                  </div>
                </div>
                <div>
                  <label htmlFor="contact-subject-select" style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#64748B", marginBottom: 6, letterSpacing: "0.05em" }}>SUBJECT</label>
                  <select
                    id="contact-subject-select"
                    value={form.subject}
                    onChange={e => handleChange("subject", e.target.value)}
                    onBlur={() => handleBlur("subject")}
                    style={{ width: "100%", padding: "10px 14px", borderRadius: 10, border: `1.5px solid ${fieldErrors.subject ? "#DC2626" : "#E2E8F0"}`, fontSize: 14, fontFamily: "inherit", outline: "none", boxSizing: "border-box", color: form.subject ? "#0F172A" : "#94A3B8", background: "#fff" }}
                  >
                    <option value="" disabled>Select a topic...</option>
                    <option value="Course Question">Course Question</option>
                    <option value="Certification Help">Certification Help</option>
                    <option value="Technical Support">Technical Support</option>
                    <option value="Billing & Payments">Billing & Payments</option>
                    <option value="Partnership Inquiry">Partnership Inquiry</option>
                    <option value="Other">Other</option>
                  </select>
                  {fieldErrors.subject && <p style={{ margin: "4px 0 0", fontSize: 12, color: "#DC2626" }}>{fieldErrors.subject}</p>}
                </div>
                <div>
                  <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#64748B", marginBottom: 6, letterSpacing: "0.05em" }}>MESSAGE</label>
                  <textarea
                    value={form.message}
                    onChange={e => handleChange("message", e.target.value)}
                    onBlur={() => handleBlur("message")}
                    placeholder="Tell us how we can help..."
                    rows={5}
                    style={{ width: "100%", padding: "10px 14px", borderRadius: 10, border: `1.5px solid ${fieldErrors.message ? "#DC2626" : "#E2E8F0"}`, fontSize: 14, fontFamily: "inherit", outline: "none", resize: "vertical", boxSizing: "border-box", color: "#0F172A" }}
                  />
                  {fieldErrors.message && <p style={{ margin: "4px 0 0", fontSize: 12, color: "#DC2626" }}>{fieldErrors.message}</p>}
                </div>
                {error && <p style={{ margin: 0, fontSize: 13, color: "#DC2626", fontWeight: 600 }}>{error}</p>}
                <button
                  type="submit"
                  disabled={sendContact.isPending}
                  style={{ padding: "14px 28px", borderRadius: 12, background: sendContact.isPending ? "#94A3B8" : "linear-gradient(135deg, #1D4ED8, #0E7490)", color: "#fff", border: "none", fontSize: 15, fontWeight: 800, cursor: sendContact.isPending ? "not-allowed" : "pointer", fontFamily: "inherit" }}
                >
                  {sendContact.isPending ? "Sending..." : "Send Message →"}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

const WATER_COURSES = [
  {
    code: "OIT-W",
    title: "Water OIT",
    subtitle: "Operator-in-Training",
    duration: "4–6 weeks",
    questions: 500,
    description: "Foundation course covering basic water treatment principles, safety, and Ontario regulations. Your first step toward certification.",
    topics: ["Water Sources & Quality", "Basic Treatment Processes", "O. Reg. 170/03", "Safety & First Aid", "Basic Math & Calculations"],
    badge: "Most Popular",
    badgeColor: "#2563EB",
    color: "#1D4ED8",
    bg: "#EFF6FF",
    border: "#BFDBFE",
    price: 49,
    productKey: "oit",
    flashcardHref: "/oit-water-flashcards",
  },
  {
    code: "CL1-W",
    title: "Water Class 1",
    subtitle: "Class 1 Certification",
    duration: "6–8 weeks",
    questions: 500,
    description: "Covers coagulation, flocculation, sedimentation, filtration, and disinfection in depth. Prepares you for the OWWCO Class 1 exam.",
    topics: ["Coagulation & Flocculation", "Sedimentation & Filtration", "Chlorination & CT Values", "O. Reg. 128/04", "Process Control Basics"],
    badge: null,
    color: "#0369A1",
    bg: "#F0F9FF",
    border: "#BAE6FD",
    price: 99,
    productKey: "class1-water",
    flashcardHref: "/class1-water-flashcards",
  },
  {
    code: "CL2-W",
    title: "Water Class 2",
    subtitle: "Class 2 Certification",
    duration: "8–10 weeks",
    questions: 500,
    description: "Advanced process control, chemical handling, hydraulics, and troubleshooting for mid-career operators.",
    topics: ["Advanced Hydraulics", "Chemical Feed Systems", "Process Troubleshooting", "SCADA Fundamentals", "Regulatory Compliance"],
    badge: "Available Now",
    badgeColor: "#16A34A",
    color: "#0E7490",
    bg: "#ECFEFF",
    border: "#A5F3FC",
    price: 149,
    productKey: "class2-water",
    flashcardHref: "/class2-water-flashcards",
  },
  {
    code: "CL3-W",
    title: "Water Class 3",
    subtitle: "Class 3 Certification",
    duration: "10–12 weeks",
    questions: 500,
    description: "Application-level exam prep for Class 3 Water Treatment. LSI, CT values, membranes, lime softening, SCADA, and advanced process control.",
    topics: ["Advanced Treatment Process", "Membrane & Softening", "Lab Analysis & SUVA", "Equipment O&M", "Source Water & Safety"],
    badge: "New",
    badgeColor: "#1E40AF",
    price: 249,
    productKey: "class3-water",
    flashcardHref: "/class3-water-flashcards",
    color: "#1E40AF",
    bg: "#EFF6FF",
    border: "#BFDBFE",
    comingSoon: false,
  },
  {
    code: "CL4-W",
    title: "Water Class 4",
    subtitle: "Class 4 Certification",
    duration: "12–14 weeks",
    questions: 500,
    description: "The highest certification level. Full system management, regulatory compliance, and strategic operations leadership.",
    topics: ["Full System Management", "Regulatory Leadership", "Advanced Troubleshooting", "Capital & Budget Planning", "Class 4 Exam Prep"],
    badge: "New",
    badgeColor: "#6D28D9",
    price: 299,
    productKey: "class4-water",
    flashcardHref: "/class4-water-flashcards",
    color: "#6D28D9",
    bg: "#F5F3FF",
    border: "#DDD6FE",
    comingSoon: false,
  },
];
const WASTEWATER_COURSES = [
  {
    code: "OIT-WW",
    title: "Wastewater OIT",
    subtitle: "Operator-in-Training",
    duration: "4–6 weeks",
    questions: 500,
    description: "Introduction to wastewater collection, treatment principles, and Ontario regulations. Start your wastewater career here.",
    topics: ["Wastewater Characteristics", "Collection Systems", "Basic Treatment Processes", "O. Reg. 129/04", "Safety Fundamentals"],
    badge: "Most Popular",
    badgeColor: "#059669",
    color: "#065F46",
    bg: "#ECFDF5",
    border: "#A7F3D0",
    price: 49,
    productKey: "oit-ww",
    flashcardHref: "/oit-ww-flashcards",
  },
  {
    code: "CL1-WW",
    title: "Wastewater Class 1",
    subtitle: "Class 1 Certification",
    duration: "6–8 weeks",
    questions: 500,
    description: "Primary and secondary treatment, activated sludge basics, and effluent quality standards.",
    topics: ["Primary Clarification", "Activated Sludge Process", "BOD & TSS Control", "Effluent Standards", "Basic Lab Testing"],
    badge: null,
    color: "#047857",
    bg: "#F0FDF4",
    border: "#BBF7D0",
    price: 99,
    productKey: "class1-ww",
    flashcardHref: "/class1-ww-flashcards",
  },
  {
    code: "CL2-WW",
    title: "Wastewater Class 2",
    subtitle: "Class 2 Certification",
    duration: "8–10 weeks",
    questions: 500,
    description: "Advanced biological treatment, nutrient removal, sludge management, and process troubleshooting.",
    topics: ["Nutrient Removal (BNR)", "Sludge Processing & Dewatering", "SRT & SVI Calculations", "Advanced Lab Analysis", "Process Optimization"],
    badge: "New",
    badgeColor: "#0F766E",
    color: "#0F766E",
    bg: "#F0FDFA",
    border: "#99F6E4",
    price: 149,
    productKey: "class2-ww",
    flashcardHref: "/class2-ww-flashcards",
  },
  {
    code: "CL3-WW",
    title: "Wastewater Class 3",
    subtitle: "Class 3 Certification",
    duration: "10–12 weeks",
    questions: 500,
    description: "Large-scale wastewater system management, advanced process control, and regulatory leadership.",
    topics: ["Large System Operations", "Advanced Process Control", "Regulatory Reporting", "Staff & Budget Management", "Emergency Planning"],
    badge: "New",
    badgeColor: "#0E7490",
    color: "#0E7490",
    bg: "#ECFEFF",
    border: "#A5F3FC",
    comingSoon: false,
    price: 249,
    productKey: "class3-ww",
    flashcardHref: "/class3-ww-flashcards",
  },
  {
    code: "CL4-WW",
    title: "Wastewater Class 4",
    subtitle: "Class 4 Certification",
    duration: "12–14 weeks",
    questions: 500,
    description: "The pinnacle of wastewater certification. Strategic operations, capital planning, and full regulatory compliance.",
    topics: ["Full System Leadership", "Capital & Infrastructure Planning", "Advanced Troubleshooting", "Regulatory Compliance", "Class 4 Exam Mastery"],
    badge: "New",
    badgeColor: "#6D28D9",
    price: 299,
    productKey: "class4-ww",
    flashcardHref: "/class4-ww-flashcards",
    color: "#6D28D9",
    bg: "#F5F3FF",
    border: "#DDD6FE",
    comingSoon: false,
  },
];
const WQA_COURSES = [
  {
    code: "WQA",
    title: "Water Quality Analyst",
    subtitle: "Ontario WQA Certification Prep",
    duration: "6–8 weeks",
    questions: 500,
    description: "Complete preparation for the Ontario Water Quality Analyst certification under O. Reg. 128/04. Covers sampling protocols, analytical methods, QA/QC programs, chain of custody, and regulatory reporting for accredited drinking water labs. 500 questions across 10 modules.",
    topics: ["Sampling Techniques & Chain of Custody", "Analytical Methods & Lab Equipment", "QA/QC Programs & Method Validation", "O. Reg. 128/04 Requirements", "Regulatory Reporting & Documentation"],
    badge: "Single Certification",
    badgeColor: "#7C3AED",
    color: "#6D28D9",
    bg: "#FAF5FF",
    border: "#DDD6FE",
    comingSoon: false,
    price: 149,
    productKey: "wqa",
    flashcardHref: "/wqa-flashcards",
  },
];

const WPI_WATER_COURSES = [
  {
    code: "WPI-W1",
    title: "WPI Class I Water",
    subtitle: "WPI Water Treatment — Class I",
    duration: "4–6 weeks",
    questions: 503,
    description: "Comprehensive WPI Class I Water Treatment prep aligned with WPI Need-to-Know Criteria. Covers coagulation, filtration, disinfection, distribution, and regulations. Recognized by EOCP (BC), AWWOA (AB), SAHO (SK), and MWWA (MB).",
    topics: ["Coagulation & Flocculation", "Filtration & Sedimentation", "Disinfection & CT Values", "Distribution Systems", "Regulations & Safety"],
    badge: "WPI",
    badgeColor: "#0369A1",
    color: "#0369A1",
    bg: "#F0F9FF",
    border: "#BAE6FD",
    comingSoon: false,
    price: 99,
    province: "wpi" as const,
    productKey: "wpi-class1-water",
    flashcardHref: "/wpi-class1-water-flashcards",
    quizHref: "/wpi-class1-water",
    mockHref: "/wpi-class1-water-mock",
  },
  {
    code: "WPI-W2",
    title: "WPI Class II Water",
    subtitle: "WPI Water Treatment — Class II",
    duration: "6–8 weeks",
    questions: 501,
    description: "Advanced WPI Class II Water Treatment prep. Covers advanced treatment processes, system design, lab monitoring, source water management, and regulatory compliance. 500 questions across 5 modules.",
    topics: ["Advanced Treatment Processes", "System Design & Hydraulics", "Lab Monitoring & QC", "Source Water Management", "Regulatory Compliance"],
    badge: "WPI",
    badgeColor: "#0E7490",
    color: "#0E7490",
    bg: "#ECFEFF",
    border: "#A5F3FC",
    comingSoon: false,
    price: 149,
    province: "wpi" as const,
    productKey: "wpi-class2-water",
    flashcardHref: "/wpi-class2-water-flashcards",
    quizHref: "/wpi-class2-water",
    mockHref: "/wpi-class2-water-mock",
  },
  {
    code: "WPI-W3",
    title: "WPI Class III Water",
    subtitle: "WPI Water Treatment — Class III",
    duration: "8–10 weeks",
    questions: 502,
    description: "Senior-level WPI Class III Water Treatment prep. Covers advanced process optimization, membrane systems, chemical handling, emergency response, and senior operator responsibilities.",
    topics: ["Advanced Process Optimization", "Membrane & Advanced Treatment", "Chemical Handling & Safety", "Emergency Response", "Senior Operator Responsibilities"],
    badge: "WPI",
    badgeColor: "#1E40AF",
    color: "#1E40AF",
    bg: "#EFF6FF",
    border: "#BFDBFE",
    comingSoon: false,
    price: 249,
    province: "wpi" as const,
    productKey: "wpi-class3-water",
    quizHref: "/wpi-class3-water",
    mockHref: "/wpi-class3-water-mock",
    flashcardHref: "/wpi-class3-water-flashcards",
  },
  {
    code: "WPI-W4",
    title: "WPI Class IV Water",
    subtitle: "WPI Water Treatment — Class IV",
    duration: "10–12 weeks",
    questions: 501,
    description: "Chief operator-level WPI Class IV Water Treatment prep. The highest WPI water certification. Covers system-wide management, capital planning, advanced regulatory compliance, and strategic operations.",
    topics: ["System-Wide Management", "Capital & Infrastructure Planning", "Advanced Regulatory Compliance", "Strategic Operations", "Class IV Exam Mastery"],
    badge: "WPI",
    badgeColor: "#4C1D95",
    color: "#4C1D95",
    bg: "#F5F3FF",
    border: "#DDD6FE",
    comingSoon: false,
    price: 299,
    province: "wpi" as const,
    productKey: "wpi-class4-water",
    quizHref: "/wpi-class4-water",
    mockHref: "/wpi-class4-water-mock",
    flashcardHref: "/wpi-class4-water-flashcards",
  },
];

const WPI_WATER_DIST_COURSES = [
  {
    code: "WPI-D1",
    title: "WPI Class I Water Distribution",
    subtitle: "WPI Water Distribution — Class I",
    duration: "3–4 weeks",
    questions: 150,
    description: "WPI Class I Water Distribution prep aligned with WPI Need-to-Know Criteria. Covers distribution system basics, pipe materials, pressure and flow, water quality maintenance, and regulations. Recognized by EOCP (BC), AWWOA (AB), SAHO (SK), and MWWA (MB).",
    topics: ["Pipe Materials & Fittings", "Pressure & Flow Basics", "Chlorine Residual Maintenance", "Valve & Hydrant Operation", "Regulations & Safety"],
    badge: "WPI",
    badgeColor: "#0369A1",
    color: "#0369A1",
    bg: "#E0F2FE",
    border: "#BAE6FD",
    comingSoon: false,
    price: 99,
    province: "wpi" as const,
    productKey: "wpi-class1-water-dist",
    quizHref: "/wpi-class1-water-dist",
    mockHref: "/wpi-class1-water-dist-mock",
    flashcardHref: "/wpi-class1-water-dist-flashcards",
  },
  {
    code: "WPI-D2",
    title: "WPI Class II Water Distribution",
    subtitle: "WPI Water Distribution — Class II",
    duration: "4–6 weeks",
    questions: 136,
    description: "WPI Class II Water Distribution prep. Covers hydraulic analysis, pressure zone design, water quality management, cross-connection control, and regulatory compliance. 500 questions. Recognized by EOCP (BC), AWWOA (AB), SAHO (SK), and MWWA (MB).",
    topics: ["Hydraulic Analysis", "Pressure Zone Design", "Water Quality Management", "Cross-Connection Control", "Regulatory Compliance"],
    badge: "WPI",
    badgeColor: "#0F766E",
    color: "#0F766E",
    bg: "#F0FDFA",
    border: "#99F6E4",
    comingSoon: false,
    price: 149,
    province: "wpi" as const,
    productKey: "wpi-class2-water-dist",
    quizHref: "/wpi-class2-water-dist",
    mockHref: "/wpi-class2-water-dist-mock",
    flashcardHref: "/wpi-class2-water-dist-flashcards",
  },
  {
    code: "WPI-D3",
    title: "WPI Class III Water Distribution",
    subtitle: "WPI Water Distribution — Class III",
    duration: "6–8 weeks",
    questions: 150,
    description: "Senior-level WPI Class III Water Distribution prep. Covers advanced hydraulic modeling, transmission main design, multi-zone systems, SCADA, and senior operator responsibilities. Recognized by EOCP (BC), AWWOA (AB), SAHO (SK), and MWWA (MB).",
    topics: ["Advanced Hydraulic Modeling", "Transmission Main Design", "Multi-Zone Systems", "SCADA & Automation", "Senior Operator Responsibilities"],
    badge: "WPI",
    badgeColor: "#1E40AF",
    color: "#1E40AF",
    bg: "#EFF6FF",
    border: "#BFDBFE",
    comingSoon: false,
    price: 249,
    province: "wpi" as const,
    productKey: "wpi-class3-water-dist",
    quizHref: "/wpi-class3-water-dist",
    mockHref: "/wpi-class3-water-dist-mock",
    flashcardHref: "/wpi-class3-water-dist-flashcards",
  },
  {
    code: "WPI-D4",
    title: "WPI Class IV Water Distribution",
    subtitle: "WPI Water Distribution — Class IV",
    duration: "8–10 weeks",
    questions: 150,
    description: "Chief operator-level WPI Class IV Water Distribution prep. The highest WPI distribution certification. Covers large-scale system management, asset management, advanced water quality, DWQMS, and strategic regulatory compliance. Recognized by EOCP (BC), AWWOA (AB), SAHO (SK), and MWWA (MB).",
    topics: ["Large-Scale System Management", "Asset Management", "Advanced Water Quality", "DWQMS Implementation", "Strategic Regulatory Compliance"],
    badge: "WPI",
    badgeColor: "#4C1D95",
    color: "#4C1D95",
    bg: "#F5F3FF",
    border: "#DDD6FE",
    comingSoon: false,
    price: 299,
    province: "wpi" as const,
    productKey: "wpi-class4-water-dist",
    quizHref: "/wpi-class4-water-dist",
    mockHref: "/wpi-class4-water-dist-mock",
    flashcardHref: "/wpi-class4-water-dist-flashcards",
  },
];

const WPI_WATER_COLL_COURSES = [
  {
    code: "WPI-C1",
    title: "WPI Class I Wastewater Collection",
    subtitle: "WPI Wastewater Collection — Class I",
    duration: "3–4 weeks",
    questions: 500,
    description: "WPI Class I Wastewater Collection prep aligned with WPI Need-to-Know Criteria. Covers gravity sewer basics, pipe materials, lift station fundamentals, H₂S safety, and regulations. Recognized by EOCP (BC), AWWOA (AB), SAHO (SK), and MWWA (MB).",
    topics: ["Gravity Sewer Basics", "Pipe Materials & Joints", "Lift Station Fundamentals", "H₂S Safety", "Regulations & Safety"],
    badge: "WPI",
    badgeColor: "#065F46",
    color: "#065F46",
    bg: "#ECFDF5",
    border: "#A7F3D0",
    comingSoon: false,
    price: 99,
    province: "wpi" as const,
    productKey: "wpi-class1-water-coll",
    quizHref: "/wpi-class1-water-coll",
    mockHref: "/wpi-class1-water-coll-mock",
    flashcardHref: "/wpi-class1-water-coll-flashcards",
  },
  {
    code: "WPI-C2",
    title: "WPI Class II Wastewater Collection",
    subtitle: "WPI Wastewater Collection — Class II",
    duration: "4–6 weeks",
    questions: 504,
    description: "WPI Class II Wastewater Collection prep. Covers hydraulic analysis, sewer system design, inflow & infiltration control, force mains, and regulatory compliance. Recognized by EOCP (BC), AWWOA (AB), SAHO (SK), and MWWA (MB).",
    topics: ["Hydraulic Analysis", "Sewer System Design", "Inflow & Infiltration", "Force Main Operations", "Regulatory Compliance"],
    badge: "WPI",
    badgeColor: "#047857",
    color: "#047857",
    bg: "#F0FDF4",
    border: "#BBF7D0",
    comingSoon: false,
    price: 149,
    province: "wpi" as const,
    productKey: "wpi-class2-water-coll",
    quizHref: "/wpi-class2-water-coll",
    mockHref: "/wpi-class2-water-coll-mock",
    flashcardHref: "/wpi-class2-water-coll-flashcards",
  },
  {
    code: "WPI-C3",
    title: "WPI Class III Wastewater Collection",
    subtitle: "WPI Wastewater Collection — Class III",
    duration: "6–8 weeks",
    questions: 504,
    description: "Senior-level WPI Class III Wastewater Collection prep. Covers advanced collection system management, CSO/SSO control, trenchless rehabilitation, SCADA, and senior operator responsibilities. Recognized by EOCP (BC), AWWOA (AB), SAHO (SK), and MWWA (MB).",
    topics: ["CSO/SSO Control", "Trenchless Rehabilitation", "Advanced System Management", "SCADA & Automation", "Senior Operator Responsibilities"],
    badge: "WPI",
    badgeColor: "#065F46",
    color: "#065F46",
    bg: "#ECFDF5",
    border: "#6EE7B7",
    comingSoon: false,
    price: 249,
    province: "wpi" as const,
    productKey: "wpi-class3-water-coll",
    quizHref: "/wpi-class3-water-coll",
    mockHref: "/wpi-class3-water-coll-mock",
    flashcardHref: "/wpi-class3-water-coll-flashcards",
  },
  {
    code: "WPI-C4",
    title: "WPI Class IV Wastewater Collection",
    subtitle: "WPI Wastewater Collection — Class IV",
    duration: "8–10 weeks",
    questions: 504,
    description: "Chief operator-level WPI Class IV Wastewater Collection prep. The highest WPI collection certification. Covers large-scale collection system management, asset management, advanced I/I control, CMMS, and strategic regulatory compliance. Recognized by EOCP (BC), AWWOA (AB), SAHO (SK), and MWWA (MB).",
    topics: ["Large-Scale System Management", "Asset Management & CMMS", "Advanced I/I Control", "DWQMS & Regulatory Compliance", "Emergency Response"],
    badge: "WPI",
    badgeColor: "#14532D",
    color: "#14532D",
    bg: "#F0FDF4",
    border: "#86EFAC",
    comingSoon: false,
    price: 299,
    province: "wpi" as const,
    productKey: "wpi-class4-water-coll",
    quizHref: "/wpi-class4-water-coll",
    mockHref: "/wpi-class4-water-coll-mock",
    flashcardHref: "/wpi-class4-water-coll-flashcards",
  },
];

const WPI_WASTEWATER_COURSES = [
  {
    code: "WPI-WW1",
    title: "WPI Class I Wastewater",
    subtitle: "WPI Wastewater Treatment — Class I",
    duration: "4–6 weeks",
    questions: 501,
    description: "WPI Class I Wastewater Treatment prep aligned with WPI Need-to-Know Criteria. Covers primary and secondary treatment, activated sludge basics, effluent quality, and regulations. Recognized by EOCP, AWWOA, SAHO, and MWWA.",
    topics: ["Primary Clarification", "Activated Sludge Basics", "BOD & TSS Control", "Effluent Standards", "Regulations & Safety"],
    badge: "WPI",
    badgeColor: "#B45309",
    color: "#B45309",
    bg: "#FFFBEB",
    border: "#FDE68A",
    comingSoon: false,
    price: 99,
    province: "wpi" as const,
    productKey: "wpi-class1-wastewater",
    quizHref: "/wpi-class1-wastewater",
    mockHref: "/wpi-class1-wastewater-mock",
    flashcardHref: "/wpi-class1-wastewater-flashcards",
  },
  {
    code: "WPI-WW2",
    title: "WPI Class II Wastewater",
    subtitle: "WPI Wastewater Treatment — Class II",
    duration: "6–8 weeks",
    questions: 501,
    description: "Advanced WPI Class II Wastewater Treatment prep. Covers biological nutrient removal, sludge management, advanced lab analysis, and process optimization. 500 questions across 8 modules.",
    topics: ["Biological Nutrient Removal", "Sludge Processing & Dewatering", "SRT & SVI Calculations", "Advanced Lab Analysis", "Process Optimization"],
    badge: "WPI",
    badgeColor: "#0F766E",
    color: "#0F766E",
    bg: "#F0FDFA",
    border: "#99F6E4",
    comingSoon: false,
    price: 149,
    province: "wpi" as const,
    productKey: "wpi-class2-wastewater",
    quizHref: "/wpi-class2-wastewater",
    mockHref: "/wpi-class2-wastewater-mock",
    flashcardHref: "/wpi-class2-wastewater-flashcards",
  },
  {
    code: "WPI-WW3",
    title: "WPI Class III Wastewater",
    subtitle: "WPI Wastewater Treatment — Class III",
    duration: "8–10 weeks",
    questions: 502,
    description: "Senior-level WPI Class III Wastewater Treatment prep. Covers advanced BNR, membrane bioreactors, industrial pretreatment, advanced biosolids, and regulatory compliance. 500 questions across 8 modules.",
    topics: ["Advanced BNR & MBR", "Industrial Pretreatment", "Advanced Biosolids Management", "Regulatory Compliance", "Emergency Response"],
    badge: "WPI",
    badgeColor: "#1D4ED8",
    color: "#1D4ED8",
    bg: "#EFF6FF",
    border: "#BFDBFE",
    comingSoon: false,
    price: 249,
    province: "wpi" as const,
    productKey: "wpi-class3-wastewater",
    quizHref: "/wpi-class3-wastewater",
    mockHref: "/wpi-class3-wastewater-mock",
    flashcardHref: "/wpi-class3-wastewater-flashcards",
  },
  {
    code: "WPI-WW4",
    title: "WPI Class IV Wastewater",
    subtitle: "WPI Wastewater Treatment — Class IV",
    duration: "10–12 weeks",
    questions: 502,
    description: "Chief operator-level WPI Class IV Wastewater Treatment prep. The highest WPI wastewater certification. Covers advanced process control, BNR & resource recovery, plant management, and strategic regulatory compliance. 500 questions across 7 modules.",
    topics: ["Advanced Process Control", "BNR & Resource Recovery", "Plant Management & Leadership", "Regulatory Compliance", "Emergency Response"],
    badge: "WPI",
    badgeColor: "#6D28D9",
    color: "#6D28D9",
    bg: "#F5F3FF",
    border: "#DDD6FE",
    comingSoon: false,
    price: 299,
    province: "wpi" as const,
    productKey: "wpi-class4-wastewater",
    quizHref: "/wpi-class4-wastewater",
    mockHref: "/wpi-class4-wastewater-mock",
    flashcardHref: "/wpi-class4-wastewater-flashcards",
  },
];

const FEATURES = [
  {
    icon: "🤖",
    title: "AI Tutor",
    description: "Ask anything, get instant expert answers. The AI Tutor knows Ontario regulations, process chemistry, and exam strategy.",
    color: "#2563EB",
    href: "/quiz",
  },
  {
    icon: "🎯",
    title: "Adaptive Practice",
    description: "The engine learns your weak spots and serves targeted questions. Study smarter, not longer.",
    color: "#7C3AED",
    href: "/quiz",
  },
  {
    icon: "🏭",
    title: "Interactive Process Guides",
    description: "Click through animated treatment plant diagrams. See how every component works — not just read about it.",
    color: "#059669",
    href: "/process",
  },
  {
    icon: "🧠",
    title: "Math Practice Hub",
    description: "800+ calculation questions across all 18 courses — filtered to math-only, with step-by-step solutions and exam tips. Master every formula before exam day.",
    color: "#7C3AED",
    href: "/math-practice",
  },
  {
    icon: "📐",
    title: "Formula Sheet",
    description: "33 Ontario operator exam formulas with worked examples and exam tips. CT values, SVI, pump power, and more.",
    color: "#0E7490",
    href: "/formulas",
  },
  {
    icon: "🗺️",
    title: "Career Map",
    description: "See your full career path — OIT to Class 4 — with salary ranges, employer landscape, and certification timelines.",
    color: "#1D4ED8",
    href: "/career",
  },
  {
    icon: "🃏",
    title: "Flashcards",
    description: "400+ concept cards per course — flip to reveal answers, filter by module, and track your progress as you master key definitions and processes.",
    color: "#0F766E",
    href: "/oit-water-flashcards",
  },
  {
    icon: "📖",
    title: "Module Study Notes",
    description: "Condensed study notes for every module — key concepts, process tables, formulas, and exam tips. Read before you practice, not just after you get it wrong.",
    color: "#B45309",
    href: "/quiz",
  },
];

const STATS = [
  { value: "15,000+", label: "Practice Questions" },
  { value: "27", label: "Certification Courses" },
  { value: "6", label: "Specialization Tracks" },
  { value: "Free", label: "OIT Access" },
];

type CourseType = (typeof WATER_COURSES)[number] | (typeof WASTEWATER_COURSES)[number] | (typeof WQA_COURSES)[number] | (typeof WPI_WATER_COURSES)[number] | (typeof WPI_WASTEWATER_COURSES)[number] | (typeof WPI_WATER_DIST_COURSES)[number] | (typeof WPI_WATER_COLL_COURSES)[number];

function CourseCard({ course }: { course: CourseType }) {
  const [notifyOpen, setNotifyOpen] = useState(false);
  const quizHref = (course as any).quizHref ?? (
    course.code === "OIT-WW" ? "/oit-ww" :
    course.code === "CL1-WW" ? "/class1-ww" :
    course.code === "CL2-WW" ? "/class2-ww" :
    course.code === "CL1-W" ? "/class1-water" :
    course.code === "CL2-W" ? "/class2-water" :
    course.code === "CL3-W" ? "/class3-water" :
    course.code === "CL3-WW" ? "/class3-ww" :
    course.code === "CL4-W" ? "/class4-water" :
    course.code === "CL4-WW" ? "/class4-ww" :
    course.code === "WQA" ? "/wqa" : "/quiz"
  );
  const isWpiCourse = (course as any).province === "wpi";
  const subFromPrice = isWpiCourse ? "CA$149/yr" : "CA$99/yr";
  const pricingHref = isWpiCourse ? "/pricing?tab=western" : "/pricing";
  return (
    <>
      <div
        className="course-card"
        style={{
          background: "#FFFFFF",
          border: `1.5px solid ${course.border}`,
          borderRadius: 16,
          overflow: "hidden",
          position: "relative",
          transition: "box-shadow 0.2s, transform 0.2s",
          display: "flex",
          flexDirection: "column",
        }}
        onMouseEnter={e => {
          (e.currentTarget as HTMLDivElement).style.boxShadow = "0 8px 32px rgba(0,0,0,0.10)";
          (e.currentTarget as HTMLDivElement).style.transform = "translateY(-3px)";
        }}
        onMouseLeave={e => {
          (e.currentTarget as HTMLDivElement).style.boxShadow = "none";
          (e.currentTarget as HTMLDivElement).style.transform = "translateY(0)";
        }}
      >
        {/* Coloured top accent bar */}
        <div style={{ height: 4, background: course.color, flexShrink: 0 }} />

        {/* Card body */}
        <div style={{ padding: "20px 20px 0", flex: 1, display: "flex", flexDirection: "column" }}>

          {/* Header row: code tag + question count + badge */}
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
            <span style={{
              background: course.bg, color: course.color,
              fontSize: 10, fontWeight: 700, padding: "3px 9px", borderRadius: 6,
              letterSpacing: "0.06em", textTransform: "uppercase", flexShrink: 0,
            }}>
              {course.code}
            </span>
            <span style={{ fontSize: 11, color: "#94A3B8", flexShrink: 0 }}>{course.duration}</span>
            <span style={{ flex: 1 }} />
            <span style={{
              fontSize: 11, fontWeight: 600, color: course.color,
              background: course.bg, borderRadius: 6, padding: "2px 8px", flexShrink: 0,
            }}>
              {course.questions} Q
            </span>
            {course.badge && (
              <span style={{
                background: course.badgeColor, color: "#fff",
                fontSize: 9, fontWeight: 700, padding: "3px 8px", borderRadius: 20,
                letterSpacing: "0.05em", textTransform: "uppercase", flexShrink: 0,
              }}>
                {course.badge}
              </span>
            )}
          </div>

          {/* Title + subtitle */}
          <h3 style={{ fontSize: 17, fontWeight: 800, color: "#0F172A", margin: "0 0 3px", fontFamily: "Sora, sans-serif", lineHeight: 1.3 }}>
            {course.title}
          </h3>
          <p style={{ fontSize: 12, color: course.color, fontWeight: 600, margin: "0 0 10px" }}>{course.subtitle}</p>

          {/* Description */}
          <p style={{ fontSize: 13, color: "#475569", lineHeight: 1.6, margin: "0 0 14px" }}>{course.description}</p>

          {/* Topic pills */}
          <div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginBottom: 16 }}>
            {course.topics.map(t => (
              <span key={t} style={{
                fontSize: 11, color: course.color, background: course.bg,
                borderRadius: 20, padding: "3px 9px", fontWeight: 500,
              }}>{t}</span>
            ))}
          </div>

          {/* Spacer pushes CTA to bottom */}
          <div style={{ flex: 1 }} />

          {/* Subscription line */}
          {(course as any).productKey && (
            <div style={{
              display: "flex", alignItems: "center", justifyContent: "space-between",
              borderTop: "1px solid #F1F5F9", paddingTop: 12, marginBottom: 12,
            }}>
              <div>
                <span style={{ fontSize: 12, fontWeight: 700, color: "#1D4ED8" }}>Included in subscription</span>
                <span style={{ fontSize: 11, color: "#94A3B8", display: "block", marginTop: 1 }}>from {subFromPrice}</span>
              </div>
              {!course.comingSoon && (
                <span style={{
                  fontSize: 11, fontWeight: 600, color: "#15803D",
                  background: "#F0FDF4", border: "1px solid #86EFAC",
                  borderRadius: 6, padding: "3px 8px",
                }}>15 free ✓</span>
              )}
            </div>
          )}
        </div>

        {/* CTA footer */}
        <div style={{ padding: "0 20px 20px" }}>
          {course.comingSoon ? (
            <button
              onClick={() => setNotifyOpen(true)}
              style={{
                width: "100%", padding: "12px",
                background: "linear-gradient(135deg, #7C3AED, #6D28D9)",
                color: "#fff", border: "none", borderRadius: 10,
                fontSize: 13, fontWeight: 700, cursor: "pointer",
                fontFamily: "inherit",
              }}
            >
              🔔 Notify Me When Available
            </button>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <Link href={quizHref}>
                <button className="btn-pulse" style={{
                  width: "100%", padding: "12px",
                  background: course.color,
                  color: "#fff", border: "none", borderRadius: 10,
                  fontSize: 13, fontWeight: 700, cursor: "pointer",
                  fontFamily: "inherit",
                }}>
                  Start Studying →
                </button>
              </Link>
              {(course as any).productKey && (
                <Link href={pricingHref}>
                  <button style={{
                    width: "100%", padding: "9px",
                    background: "transparent",
                    color: "#64748B", border: "1px solid #E2E8F0",
                    borderRadius: 10, fontSize: 12, fontWeight: 600,
                    cursor: "pointer", fontFamily: "inherit",
                  }}>
                    View Plans →
                  </button>
                </Link>
              )}
            </div>
          )}
        </div>
      </div>

      {notifyOpen && (
        <NotifyModal
          courseCode={course.code}
          courseTitle={course.title}
          onClose={() => setNotifyOpen(false)}
        />
      )}
    </>
  );
}

export default function Landing() {
  usePageMeta({
    title: "Water & Wastewater Operator Exam Prep",
    description: "Canada's exam prep for water & wastewater operators. 15,000+ practice questions, AI tutor, mock exams, and process guides. Free OIT access.",
    keywords: "water operator exam prep, OIT exam, wastewater certification Canada, operator practice questions, EOCP exam, WPI exam prep, water quality analyst",
    path: "/",
  });
  useStructuredData(landingPageSchemas);
  const { province, provinceInfo, showPrompt, setProvince, dismiss } = useProvince();
  // Eager auth load so admin role is available immediately on the homepage.
  // auth.me fires on mount — this ensures the Admin button appears without
  // needing to visit a quiz page first.
  const { isAuthenticated, logout: oauthLogout, user } = useAuth();
  const isAdmin = user?.role === "admin";
  const dashboardMe = trpc.dashboardAuth.me.useQuery(undefined, { retry: false, staleTime: 5 * 60 * 1000 });
  const dashboardLogout = trpc.dashboardAuth.logout.useMutation();
  const utils = trpc.useUtils();
  // User is signed in if either OAuth or email OTP session is active
  const isSignedIn = isAuthenticated || !!dashboardMe.data?.email;

  const handleLogout = async () => {
    if (dashboardMe.data?.email) {
      await dashboardLogout.mutateAsync();
      await utils.dashboardAuth.me.invalidate();
    }
    if (isAuthenticated) {
      oauthLogout();
    }
    // Clear all course access from localStorage
    try {
      localStorage.removeItem("echelon_trial_unlocked");
      localStorage.removeItem("echelon_trial_email");
      localStorage.removeItem("echelon_subscription_email");
      localStorage.removeItem("echelon_access_token");
      localStorage.removeItem("echelon_subscription_exam_types");
      localStorage.removeItem("echelon_purchased_products");
    } catch { /* ignore */ }
    window.location.href = "/";
  };

  const updateProvinceMutation = trpc.auth.updateProvince.useMutation();
  // Default active track based on province: WPI for western provinces, ontario water for ON
  const defaultTrack = (province === "bc" || province === "ab" || province === "sk" || province === "mb") ? "wpi-water" : "water";
  // Restore tab from URL hash so browser back-button returns to the correct tab
  const validTracks = ["water", "wastewater", "wqa", "wpi-water", "wpi-wastewater", "wpi-dist", "wpi-coll"] as const;
  // Top-level tab: 'wpi' is the parent for all 4 WPI sub-tracks
  type TopTab = "water" | "wastewater" | "wqa" | "wpi";
  type WpiSubTab = "wpi-water" | "wpi-wastewater" | "wpi-dist" | "wpi-coll";
  type Track = typeof validTracks[number];
  const getInitialTrack = (): Track => {
    const hash = window.location.hash.replace("#", "");
    if (validTracks.includes(hash as Track)) return hash as Track;
    return defaultTrack as Track;
  };
  const [activeTrack, setActiveTrackRaw] = useState<Track>(getInitialTrack);
  const setActiveTrack = (track: Track) => {
    setActiveTrackRaw(track);
    // Update URL hash without triggering a scroll or navigation
    window.history.replaceState(null, "", `/#${track}`);
  };
  // Derive top-level tab from active track
  const isWpiTrack = (t: Track): t is WpiSubTab => t.startsWith("wpi-");
  const activeTopTab: TopTab = isWpiTrack(activeTrack) ? "wpi" : (activeTrack as TopTab);
  // WPI sub-tab: default to wpi-water when entering WPI parent tab
  const activeWpiSub: WpiSubTab = isWpiTrack(activeTrack) ? activeTrack : "wpi-water";
  const handleTopTab = (tab: TopTab) => {
    if (tab === "wpi") {
      setActiveTrack(activeWpiSub);
    } else {
      setActiveTrack(tab as Track);
    }
  };
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [nationalWaitlistOpen, setNationalWaitlistOpen] = useState(false);
  const [nationalWaitlistProvince, setNationalWaitlistProvince] = useState("");

  const handleProvinceSelect = (id: ProvinceId) => {
    setProvince(id);
    // Persist to DB if logged in
    if (isAuthenticated) {
      updateProvinceMutation.mutate({ province: id });
    }
    // Switch track to match province
    if (id === "bc" || id === "ab" || id === "sk" || id === "mb") {
      setActiveTrack("wpi-water");
    } else {
      setActiveTrack("water");
    }
  };

  const careerMapHref = province ? `/career?province=${province}` : "/career";
  const NAV_LINKS = [
    { label: "Courses", href: "#courses" },
    { label: "WPI 🌊", href: "/wpi" },
    { label: "Pricing", href: "/pricing" },
    { label: "Blog", href: "/blog" },
    { label: "Jobs", href: "/jobs" },
    { label: "About", href: "/about" },
    { label: "FAQ", href: "/#faq" },
  ];
  const RESOURCES_LINKS = [
    { label: "📐 Formulas", href: "/formulas" },
    { label: "🗺️ Career Map", href: careerMapHref },
    { label: "🏭 Study Tools", href: "#tools" },
    { label: "✉️ Contact", href: "/#contact" },
  ];
  const [resourcesOpen, setResourcesOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // ── Silent DB warm-up on landing page mount ───────────────────────────────
  // New visitors have no localStorage cache. Fire a background prefetch to OIT
  // (the most common entry point) so TiDB is warm before the user clicks
  // "Try Free Practice". The result is discarded — this is purely a warm-up.
  useEffect(() => {
    // Only prefetch if there is no cached OIT bank already
    const hasCache = !!localStorage.getItem("echelon_qbank_v2_oit");
    if (hasCache) return;
    // Fire and forget — ignore result
    utils.quiz.getRandomQuestions.prefetch({ bankKey: "oit", limit: 5 }).catch(() => {});
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div style={{ fontFamily: "'Sora', sans-serif", background: "#F8FAFC", minHeight: "100vh" }}>
      {nationalWaitlistOpen && (
        <NationalWaitlistModal
          defaultProvince={nationalWaitlistProvince}
          onClose={() => { setNationalWaitlistOpen(false); setNationalWaitlistProvince(""); }}
        />
      )}
      <style>{`
        @media (max-width: 640px) {
          .landing-nav-links { display: none !important; }
          .landing-nav-cta { display: none !important; }
          .landing-hamburger { display: flex !important; }
          .landing-stats-grid { grid-template-columns: repeat(2, 1fr) !important; }
          .landing-track-toggle { display: grid !important; grid-template-columns: repeat(2, 1fr) !important; width: 100% !important; flex-direction: unset !important; }
          .landing-track-toggle button { width: 100% !important; text-align: center; }
          .landing-footer-links { flex-wrap: wrap !important; gap: 12px !important; justify-content: center !important; }
          .landing-hero-btns { flex-direction: column !important; align-items: stretch !important; }
          .landing-hero-btns a, .landing-hero-btns button { width: 100% !important; box-sizing: border-box; }
          .landing-wpi-secondary-btns { display: grid !important; grid-template-columns: repeat(2, 1fr) !important; gap: 8px !important; width: 100% !important; }
          .landing-wpi-secondary-btns a { width: 100% !important; }
          .landing-wpi-secondary-btns button { width: 100% !important; font-size: 12px !important; padding: 10px 8px !important; }
          .landing-tools-grid { grid-template-columns: repeat(2, 1fr) !important; gap: 10px !important; }
          .landing-tools-grid .tool-card-desc { display: none !important; }
          .landing-tools-grid .tool-card-inner { padding: 16px 14px !important; }
          .landing-tools-grid .tool-card-icon { width: 36px !important; height: 36px !important; font-size: 18px !important; margin-bottom: 10px !important; border-radius: 8px !important; }
          .landing-tools-grid h3 { font-size: 13px !important; margin-bottom: 4px !important; }
          .landing-tools-grid .tool-card-cta { font-size: 10px !important; }
          .landing-course-grid { grid-template-columns: 1fr !important; gap: 16px !important; }
          .landing-track-toggle { gap: 4px !important; }
          .landing-track-toggle button { font-size: 11px !important; padding: 8px 10px !important; }
          .landing-session-complete-pad { padding: 32px 20px !important; }
          .contact-grid { grid-template-columns: 1fr !important; }
          .contact-info-row { flex-direction: row !important; flex-wrap: wrap !important; gap: 12px !important; }
          .contact-info-card { flex: 1 1 140px !important; }
          .contact-form-grid { grid-template-columns: 1fr !important; }
          .landing-whats-new { flex-direction: column !important; gap: 12px !important; }
          .landing-whats-new-btn { width: 100% !important; text-align: center !important; }
          .landing-course-section { padding: 48px 16px !important; }
          .landing-nav-subtitle { display: none !important; }
          .landing-hero-section { padding: 40px 16px 32px !important; }
          .landing-hero-section h1 { font-size: clamp(24px, 7vw, 40px) !important; }
          .landing-hero-section p { font-size: 14px !important; }
          .landing-province-banner { padding: 10px 12px !important; }
          .landing-province-banner button { font-size: 11px !important; padding: 5px 8px !important; }
        }
        @media (min-width: 641px) {
          .landing-hamburger { display: none !important; }
          .landing-mobile-drawer { display: none !important; }
        }
      `}</style>

      {/* ── Navigation ── */}
      <nav style={{
        background: "#FFFFFF",
        borderBottom: scrolled ? "1px solid transparent" : "1px solid #E2E8F0",
        boxShadow: scrolled ? "0 4px 20px rgba(0,0,0,0.10)" : "none",
        padding: "0 24px",
        position: "sticky", top: 0, zIndex: 100,
        display: "flex", alignItems: "center", justifyContent: "space-between",
        height: 64,
        gap: 12,
        transition: "box-shadow 0.25s ease, border-color 0.25s ease",
      }}>
        {/* Brand */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
          <img
            src="https://d2xsxph8kpxj0f.cloudfront.net/310519663446228701/9KAR7mkGo7x7xavTEeEpiA/echelon-icon-v2_5c9ed3a7.webp"
            alt="Echelon Institute"
            width={46}
            height={44}
            style={{ height: 44, width: 46 }}
          />
          <div>
            <div style={{ fontSize: 15, fontWeight: 800, color: "#0F172A", letterSpacing: "-0.02em" }}>Echelon Institute</div>
            <div className="landing-nav-subtitle" style={{ fontSize: 10, color: "#64748B", fontWeight: 500, marginTop: -2 }}>Canadian Water & Wastewater Operator Certification</div>
          </div>
        </div>

        {/* Desktop nav links */}
        <div className="landing-nav-links" style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "nowrap" }}>
          {NAV_LINKS.map(item => {
            const isActive = item.href === "/" ? location.pathname === "/" : location.pathname.startsWith(item.href.replace("#", ""));
            return (
              <a key={item.label} href={item.href}
                style={{
                  padding: "6px 14px",
                  borderRadius: "8px 8px 0 0",
                  color: isActive ? "#1D4ED8" : "#475569",
                  fontSize: 13, fontWeight: isActive ? 700 : 600,
                  textDecoration: "none",
                  transition: "color 0.15s, background 0.15s",
                  whiteSpace: "nowrap",
                  borderBottom: isActive ? "2px solid #1D4ED8" : "2px solid transparent",
                }}
                onMouseEnter={e => { if (!isActive) { e.currentTarget.style.color = "#1D4ED8"; e.currentTarget.style.background = "rgba(29,78,216,0.06)"; } }}
                onMouseLeave={e => { if (!isActive) { e.currentTarget.style.color = "#475569"; e.currentTarget.style.background = "transparent"; } }}
              >
                {item.label}
              </a>
            );
          })}
          {/* Resources dropdown */}
          <div style={{ position: "relative" }}>
            <button
              onClick={() => setResourcesOpen(o => !o)}
              onBlur={() => setTimeout(() => setResourcesOpen(false), 150)}
              onMouseEnter={e => { e.currentTarget.style.color = "#1D4ED8"; e.currentTarget.style.background = "rgba(29,78,216,0.06)"; }}
              onMouseLeave={e => { e.currentTarget.style.color = "#475569"; e.currentTarget.style.background = "transparent"; }}
              style={{
                padding: "6px 14px", borderRadius: 8,
                color: "#475569", fontSize: 13, fontWeight: 600,
                background: "transparent", border: "none",
                cursor: "pointer", fontFamily: "inherit", whiteSpace: "nowrap",
                display: "flex", alignItems: "center", gap: 4,
                transition: "color 0.15s, background 0.15s",
              }}
            >
              Resources <span style={{ fontSize: 9, opacity: 0.6 }}>{resourcesOpen ? "▲" : "▼"}</span>
            </button>
            {resourcesOpen && (
              <div style={{
                position: "absolute", top: "calc(100% + 6px)", left: 0,
                background: "#FFFFFF", border: "1px solid #E2E8F0",
                borderRadius: 10, boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
                minWidth: 180, zIndex: 200, padding: "6px 0",
              }}>
                {RESOURCES_LINKS.map(item => (
                  <a key={item.href} href={item.href}
                    onClick={() => setResourcesOpen(false)}
                    style={{
                      display: "block", padding: "9px 16px",
                      fontSize: 13, color: "#334155", fontWeight: 500,
                      textDecoration: "none",
                    }}
                    onMouseEnter={e => (e.currentTarget.style.background = "#F8FAFC")}
                    onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                  >
                    {item.label}
                  </a>
                ))}
              </div>
            )}
          </div>
          {isSignedIn ? (
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              {isAdmin && (
                <Link href="/admin">
                  <button style={{
                    padding: "8px 14px", borderRadius: 10,
                    background: "linear-gradient(135deg, #7C3AED, #4F46E5)",
                    color: "#fff", border: "none", fontSize: 13, fontWeight: 700,
                    cursor: "pointer", fontFamily: "inherit", whiteSpace: "nowrap",
                  }}>
                    🛡️ Admin
                  </button>
                </Link>
              )}
              <Link href="/dashboard">
                <button style={{
                  padding: "8px 20px", borderRadius: 10,
                  background: "linear-gradient(135deg, #1D4ED8, #0E7490)",
                  color: "#fff", border: "none", fontSize: 13, fontWeight: 700,
                  cursor: "pointer", fontFamily: "inherit", whiteSpace: "nowrap",
                }}>
                  📊 Dashboard
                </button>
              </Link>
              <button
                onClick={handleLogout}
                style={{
                  padding: "8px 16px", borderRadius: 10,
                  background: "transparent",
                  color: "#64748B", border: "1.5px solid #CBD5E1", fontSize: 13, fontWeight: 600,
                  cursor: "pointer", fontFamily: "inherit", whiteSpace: "nowrap",
                }}
              >
                Log Out
              </button>
            </div>
          ) : (
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <Link href="/login">
                <button style={{
                  padding: "8px 16px", borderRadius: 10,
                  background: "transparent",
                  color: "#1D4ED8", border: "1.5px solid #1D4ED8", fontSize: 13, fontWeight: 700,
                  cursor: "pointer", fontFamily: "inherit", whiteSpace: "nowrap",
                }}>
                  Sign In
                </button>
              </Link>
              <Link href="/quiz">
                <button style={{
                  padding: "8px 20px", borderRadius: 10,
                  background: "linear-gradient(135deg, #1D4ED8, #0E7490)",
                  color: "#fff", border: "none", fontSize: 13, fontWeight: 700,
                  cursor: "pointer", fontFamily: "inherit", whiteSpace: "nowrap",
                }}>
                  Try Free →
                </button>
              </Link>
            </div>
          )}
        </div>

        {/* Hamburger button — mobile only */}
        <button
          className="landing-hamburger"
          onClick={() => setMobileNavOpen(o => !o)}
          aria-label="Open menu"
          style={{
            display: "none", // overridden by media query
            background: "transparent",
            border: "1px solid #E2E8F0",
            borderRadius: 8,
            color: "#0F172A",
            fontSize: 18,
            cursor: "pointer",
            padding: "5px 10px",
            lineHeight: 1,
            flexShrink: 0,
          }}
        >
          {mobileNavOpen ? "✕" : "☰"}
        </button>
       </nav>
      {/* Province Banner — shown on first visit */}
      {showPrompt && (
        <ProvinceBanner onSelect={handleProvinceSelect} onDismiss={dismiss} />
      )}

      {/* Mobile nav drawer overlay */}
      {mobileNavOpen && (
        <div
          onClick={() => setMobileNavOpen(false)}
          style={{
            position: "fixed", inset: 0,
            background: "rgba(0,0,0,0.4)",
            zIndex: 98,
          }}
        />
      )}

      {/* Mobile nav drawer — compact drop-down, no scroll */}
      <div
        className="landing-mobile-drawer"
        style={{
          position: "fixed",
          top: 64,
          left: 0,
          right: 0,
          background: "#FFFFFF",
          borderBottom: "1px solid #E2E8F0",
          boxShadow: "0 8px 32px rgba(0,0,0,0.15)",
          zIndex: 99,
          transform: mobileNavOpen ? "translateY(0)" : "translateY(calc(-100% - 64px))",
          transition: "transform 0.25s cubic-bezier(0.4,0,0.2,1)",
        }}
      >
        {/* Quick action tiles */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr 1fr 1fr",
          gap: 8,
          padding: "12px 16px 10px",
          borderBottom: "1px solid #F1F5F9",
        }}>
          {isSignedIn ? (
            // Signed-in tiles: Dashboard, Try Free, Pricing, Log Out (+ Admin for admin users)
            <>
              {[
                { label: "📊 Dashboard", href: "/dashboard", accent: true },
                { label: "📝 Try Free", href: "/quiz", accent: false },
                { label: "💰 Pricing", href: "/pricing", accent: false },
                ...(isAdmin ? [{ label: "🛡️ Admin", href: "/admin", accent: false, adminStyle: true }] : []),
              ].map(tile => (
                <Link key={tile.href} href={tile.href}>
                  <div
                    onClick={() => setMobileNavOpen(false)}
                    style={{
                      padding: "10px 6px",
                      borderRadius: 10,
                      background: tile.accent ? "linear-gradient(135deg, #1D4ED8, #0E7490)" : "#F8FAFC",
                      border: tile.accent ? "none" : "1px solid #E2E8F0",
                      color: tile.accent ? "#fff" : "#0F172A",
                      fontSize: 11,
                      fontWeight: 700,
                      textAlign: "center" as const,
                      cursor: "pointer",
                      lineHeight: 1.3,
                    }}
                  >
                    {tile.label}
                  </div>
                </Link>
              ))}
              <div
                onClick={() => { setMobileNavOpen(false); handleLogout(); }}
                style={{
                  padding: "10px 6px",
                  borderRadius: 10,
                  background: "#FEF2F2",
                  border: "1px solid #FECACA",
                  color: "#DC2626",
                  fontSize: 11,
                  fontWeight: 700,
                  textAlign: "center" as const,
                  cursor: "pointer",
                  lineHeight: 1.3,
                }}
              >
                🚪 Log Out
              </div>
            </>
          ) : (
            // Not signed in tiles: Sign In, Try Free, Pricing, WPI
            <>
              {[
                { label: "🔑 Sign In", href: "/login", accent: "purple" },
                { label: "📝 Try Free", href: "/quiz", accent: true },
                { label: "💰 Pricing", href: "/pricing", accent: false },
                { label: "🌊 WPI", href: "/wpi", accent: false },
              ].map(tile => (
                <Link key={tile.href} href={tile.href}>
                  <div
                    onClick={() => setMobileNavOpen(false)}
                    style={{
                      padding: "10px 6px",
                      borderRadius: 10,
                      background: tile.accent === true ? "linear-gradient(135deg, #1D4ED8, #0E7490)" : tile.accent === "purple" ? "linear-gradient(135deg, #7C3AED, #1D4ED8)" : "#F8FAFC",
                      border: tile.accent ? "none" : "1px solid #E2E8F0",
                      color: tile.accent ? "#fff" : "#0F172A",
                      fontSize: 11,
                      fontWeight: 700,
                      textAlign: "center" as const,
                      cursor: "pointer",
                      lineHeight: 1.3,
                    }}
                  >
                    {tile.label}
                  </div>
                </Link>
              ))}
            </>
          )}
        </div>

        {/* Nav link pills */}
        <div style={{
          display: "flex",
          overflowX: "auto",
          gap: 0,
          borderBottom: "1px solid #F1F5F9",
          scrollbarWidth: "none" as const,
        }}>
          {NAV_LINKS.map(item => (
            <a
              key={item.label}
              href={item.href}
              onClick={() => setMobileNavOpen(false)}
              style={{
                flexShrink: 0,
                padding: "11px 14px",
                color: "#475569",
                fontSize: 12,
                fontWeight: 600,
                textDecoration: "none",
                whiteSpace: "nowrap",
                borderBottom: "2px solid transparent",
              }}
            >
              {item.label}
            </a>
          ))}
        </div>

        {/* Study tools 2-col grid */}
        <div style={{ padding: "8px 12px" }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: "#64748B", letterSpacing: "0.1em", textTransform: "uppercase", padding: "4px 4px 6px" }}>Study Tools</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2 }}>
            {[
              { label: "📝 OIT Practice Quiz", href: "/quiz" },
              { label: "📐 Formula Sheet", href: "/formulas" },
              { label: "🏭 Drinking Water Process", href: "/process" },
              { label: "♻️ Wastewater Process", href: "/wastewater" },
              { label: "🚰 Distribution Guide", href: "/distribution-guide" },
              { label: "🔩 Collection Guide", href: "/collection-guide" },
              { label: "⚙️ Pumping Systems", href: "/pumping" },
              { label: "🧠 Math Practice Hub", href: "/math-practice" },
              { label: "🌊 WPI Overview", href: "/wpi" },
              { label: "🃏 OIT Flashcards", href: "/oit-water-flashcards" },
            ].map(item => (
              <Link key={item.href} href={item.href}>
                <div
                  onClick={() => setMobileNavOpen(false)}
                  style={{
                    padding: "8px 10px",
                    borderRadius: 8,
                    color: "#475569",
                    fontSize: 12,
                    fontWeight: 500,
                    cursor: "pointer",
                  }}
                >
                  {item.label}
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Footer row */}
        <div style={{
          display: "flex",
          gap: 16,
          padding: "8px 16px 14px",
          borderTop: "1px solid #F1F5F9",
          flexWrap: "wrap",
        }}>
          {[
            { label: "🎫 My Passes", href: "/account" },
            { label: "💰 Pricing", href: "/pricing" },
            { label: "ℹ️ About", href: "/about" },
            { label: "❓ FAQ", href: "/#faq" },
          ].map(l => (
            <a
              key={l.href}
              href={l.href}
              onClick={() => setMobileNavOpen(false)}
              style={{
                fontSize: 12,
                color: "#64748B",
                fontWeight: 500,
                textDecoration: "none",
                cursor: "pointer",
              }}
            >
              {l.label}
            </a>
          ))}
        </div>
      </div>

      {/* ── Hero ── */}
      <section className="landing-hero-section" style={{
        background: "linear-gradient(135deg, #0F172A 0%, #1E3A5F 50%, #0E7490 100%)",
        padding: "80px 24px 100px",
        textAlign: "center",
        position: "relative",
        overflow: "hidden",
      }}>
        {/* Background grid pattern */}
        <div style={{
          position: "absolute", inset: 0,
          backgroundImage: "radial-gradient(circle at 1px 1px, rgba(255,255,255,0.05) 1px, transparent 0)",
          backgroundSize: "40px 40px",
          pointerEvents: "none",
        }} />

        <div style={{ position: "relative", maxWidth: 800, margin: "0 auto" }}>
          {/* Hero logo mark — floats down */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: "easeOut", delay: 0.1 }}
            style={{ display: "flex", justifyContent: "center", marginBottom: 20 }}
          >
            <img
              src="https://d2xsxph8kpxj0f.cloudfront.net/310519663446228701/9KAR7mkGo7x7xavTEeEpiA/echelon-icon-v2_5c9ed3a7.webp"
              alt="Echelon Institute"
              width={126}
              height={120}
              style={{ height: 120, width: 126, filter: "brightness(0) invert(1)" }}
            />
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: "easeOut", delay: 0.25 }}
            style={{
              display: "inline-flex", alignItems: "center", gap: 8,
              background: "rgba(255,255,255,0.1)", backdropFilter: "blur(8px)",
              borderRadius: 20, padding: "6px 16px", marginBottom: 24,
              border: "1px solid rgba(255,255,255,0.15)",
            }}
          >
            <span style={{ fontSize: 12 }}>🇨🇦</span>
            <span style={{ fontSize: 12, color: "rgba(255,255,255,0.85)", fontWeight: 600 }}>
              Built for Canadian Water & Wastewater Operators
            </span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: "easeOut", delay: 0.4 }}
            style={{
              fontSize: "clamp(28px, 5vw, 56px)",
              fontWeight: 800,
              color: "#FFFFFF",
              lineHeight: 1.15,
              letterSpacing: "-0.03em",
              margin: "0 0 20px 0",
            }}
          >
            Pass Your Operator Exam.<br />
            <span style={{ background: "linear-gradient(90deg, #38BDF8, #34D399)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
              Advance Your Career.
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, ease: "easeOut", delay: 0.55 }}
            style={{
              fontSize: "clamp(14px, 2vw, 18px)",
              color: "rgba(255,255,255,0.75)",
              lineHeight: 1.7,
              maxWidth: 600,
              margin: "0 auto 36px",
            }}
          >
            Canada's AI-powered exam prep platform for water and wastewater operators.
            Adaptive practice questions, module study notes, 500+ flashcards per course, interactive process guides, and an AI tutor available 24/7.
          </motion.p>

          {/* Province-aware hero CTA */}
          {(() => {
            const isWestern = province === "bc" || province === "ab" || province === "sk" || province === "mb";
            const ctaHref = isWestern ? "/wpi-class1-water" : "/quiz";
            const ctaLabel = isWestern ? `💧 Try WPI Water Treatment Free →` : "Try Free OIT Practice →";
            return (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: "easeOut", delay: 0.7 }}
            className="landing-hero-btns" style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
            <Link href={ctaHref} style={{ width: "100%" }}>
              <button className="btn-pulse" style={{
                padding: "14px 32px", borderRadius: 12,
                background: "linear-gradient(135deg, #2563EB, #0E7490)",
                color: "#fff", border: "none", fontSize: 15, fontWeight: 700,
                cursor: "pointer", fontFamily: "inherit",
                boxShadow: "0 4px 24px rgba(37,99,235,0.4)",
                width: "100%",
              }}>
                {ctaLabel}
              </button>
            </Link>
            {isWestern && (
              <div className="landing-wpi-secondary-btns" style={{ display: "flex", flexDirection: "column", gap: 8, width: "100%" }}>
                <Link href="/wpi-class1-water-dist" style={{ width: "100%" }}>
                  <button style={{
                    padding: "12px 24px", borderRadius: 12,
                    background: "rgba(3,105,161,0.18)", backdropFilter: "blur(8px)",
                    color: "#BAE6FD", border: "1px solid rgba(186,230,253,0.3)",
                    fontSize: 14, fontWeight: 600, cursor: "pointer", fontFamily: "inherit",
                    width: "100%",
                  }}>
                    🚰 Try WPI Distribution Free →
                  </button>
                </Link>
                <Link href="/wpi-class1-wastewater" style={{ width: "100%" }}>
                  <button style={{
                    padding: "12px 24px", borderRadius: 12,
                    background: "rgba(15,118,110,0.18)", backdropFilter: "blur(8px)",
                    color: "#99F6E4", border: "1px solid rgba(153,246,228,0.3)",
                    fontSize: 14, fontWeight: 600, cursor: "pointer", fontFamily: "inherit",
                    width: "100%",
                  }}>
                    ♻️ Try WPI Wastewater Free →
                  </button>
                </Link>
                <Link href="/wpi-class1-water-coll" style={{ width: "100%" }}>
                  <button style={{
                    padding: "12px 24px", borderRadius: 12,
                    background: "rgba(6,95,70,0.18)", backdropFilter: "blur(8px)",
                    color: "#6EE7B7", border: "1px solid rgba(110,231,183,0.3)",
                    fontSize: 14, fontWeight: 600, cursor: "pointer", fontFamily: "inherit",
                    width: "100%",
                  }}>
                    🔩 Try WPI Collection Free →
                  </button>
                </Link>
              </div>
            )}
            <Link href="/pricing" style={{ width: "100%" }}>
              <button style={{
                padding: "14px 32px", borderRadius: 12,
                background: "rgba(255,255,255,0.1)", backdropFilter: "blur(8px)",
                color: "#fff", border: "1px solid rgba(255,255,255,0.2)",
                fontSize: 15, fontWeight: 600, cursor: "pointer", fontFamily: "inherit",
                width: "100%",
              }}>
                View Pricing
              </button>
            </Link>
          </motion.div>
            );
          })()}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4, delay: 0.9 }}
            style={{ textAlign: "center", fontSize: 13, color: "rgba(255,255,255,0.7)", margin: "8px 0 0", fontWeight: 500 }}
          >
            🎁 First 15 questions free on every course — no account or credit card needed
          </motion.p>
        </div>
      </section>


      {/* ── Stats Bar ── */}
      <section style={{
        background: "#F1F5F9",
        borderBottom: "1px solid #E2E8F0",
        padding: "16px 24px",
      }}>
        <div
          className="landing-stats-grid"
          style={{
            maxWidth: 900, margin: "0 auto",
            display: "grid", gridTemplateColumns: "repeat(4, 1fr)",
            gap: 24, textAlign: "center",
          }}
        >
          <StaggerContainer style={{ display: "contents" } as React.CSSProperties}>
          <StaggerItem>
            <AnimatedStat value={15000} suffix="+" label="Practice Questions" />
          </StaggerItem>
          <StaggerItem>
            <AnimatedStat value={27} label="Certification Courses" />
          </StaggerItem>
          <StaggerItem>
            <AnimatedStat value={6} label="Specialization Tracks" />
          </StaggerItem>
          <StaggerItem>
            <div>
              <div style={{ fontSize: 32, fontWeight: 800, color: "#0F172A", letterSpacing: "-0.03em", fontFamily: "Sora, sans-serif" }}>Free</div>
              <div style={{ fontSize: 13, color: "#64748B", fontWeight: 500, marginTop: 2 }}>OIT Access</div>
            </div>
          </StaggerItem>
          </StaggerContainer>
        </div>
      </section>

      {/* ── What's New Banner ── */}
      <SlideLeft delay={0.1}>
      <div style={{ padding: "12px 24px 0", maxWidth: 1200, margin: "0 auto" }}>
        <div
          className="landing-whats-new"
          style={{
            background: "linear-gradient(135deg, #0F766E 0%, #0E7490 50%, #1D4ED8 100%)",
            borderRadius: 16,
            padding: "16px 24px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 16,
            flexWrap: "wrap",
            boxShadow: "0 4px 20px rgba(15,118,110,0.25)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <span style={{ background: "rgba(255,255,255,0.2)", borderRadius: 8, padding: "4px 10px", fontSize: 12, fontWeight: 700, color: "#fff", letterSpacing: "0.05em", whiteSpace: "nowrap" }}>NEW</span>
            <span style={{ fontSize: 15, fontWeight: 600, color: "#fff" }}>
              🏭 Class 4 Wastewater is now live — 500 questions, mock exam, formula sheet &amp; AI Tutor
            </span>
          </div>
          <a
            href="/class4-ww"
            className="landing-whats-new-btn"
            style={{
              background: "rgba(255,255,255,0.15)",
              border: "1.5px solid rgba(255,255,255,0.4)",
              borderRadius: 10,
              padding: "8px 18px",
              fontSize: 13,
              fontWeight: 700,
              color: "#fff",
              textDecoration: "none",
              whiteSpace: "nowrap",
              flexShrink: 0,
            }}
          >
            Start Studying →
          </a>
        </div>
      </div>
      </SlideLeft>


      {/* ── Course Catalogue ── */}
      <section id="courses" className="landing-course-section" style={{ padding: "72px 24px", maxWidth: 1200, margin: "0 auto" }}>
        <FadeUp>
        <div style={{ textAlign: "center", marginBottom: 48 }}>
          <h2 style={{ fontSize: "clamp(22px, 3vw, 36px)", fontWeight: 800, color: "#0F172A", letterSpacing: "-0.02em", margin: "0 0 12px 0" }}>
            Choose Your Certification Track
          </h2>
          <p style={{ fontSize: 16, color: "#64748B", maxWidth: 560, margin: "0 auto 32px" }}>
            Four certification tracks — Ontario Water, Ontario Wastewater, WQA, and WPI (BC, AB, SK, MB). The WPI track covers Water, Wastewater, Distribution, and Collection at Class I–IV. Every course includes 500+ practice questions and full AI Tutor access.
          </p>

          {/* Track Toggle — 4 top-level tabs */}
          <div
            className="landing-track-toggle"
            style={{
              display: "inline-flex", background: "#F1F5F9", borderRadius: 12, padding: 4, gap: 4,
            }}
          >
            <button
              onClick={() => handleTopTab("water")}
              style={{
                padding: "10px 20px", borderRadius: 10, border: "none",
                background: activeTopTab === "water" ? "#1D4ED8" : "transparent",
                color: activeTopTab === "water" ? "#fff" : "#64748B",
                fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: "inherit",
                transition: "all 0.2s", whiteSpace: "nowrap",
              }}
            >
              💧 Water Treatment
            </button>
            <button
              onClick={() => handleTopTab("wastewater")}
              style={{
                padding: "10px 20px", borderRadius: 10, border: "none",
                background: activeTopTab === "wastewater" ? "#059669" : "transparent",
                color: activeTopTab === "wastewater" ? "#fff" : "#64748B",
                fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: "inherit",
                transition: "all 0.2s", whiteSpace: "nowrap",
              }}
            >
              ♻️ Wastewater
            </button>
            <button
              onClick={() => handleTopTab("wqa")}
              style={{
                padding: "10px 20px", borderRadius: 10, border: "none",
                background: activeTopTab === "wqa" ? "#7C3AED" : "transparent",
                color: activeTopTab === "wqa" ? "#fff" : "#64748B",
                fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: "inherit",
                transition: "all 0.2s", whiteSpace: "nowrap",
              }}
            >
              🔬 WQA
            </button>
            <button
              onClick={() => handleTopTab("wpi")}
              style={{
                padding: "10px 20px", borderRadius: 10, border: "none",
                background: activeTopTab === "wpi" ? "#0369A1" : "transparent",
                color: activeTopTab === "wpi" ? "#fff" : "#64748B",
                fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: "inherit",
                transition: "all 0.2s", whiteSpace: "nowrap",
              }}
            >
              🌐 WPI
            </button>
          </div>

          {/* WPI sub-filter row — only visible when WPI parent tab is active */}
          {activeTopTab === "wpi" && (
            <div
              style={{
                display: "inline-flex", background: "#E0F2FE", borderRadius: 10, padding: 3, gap: 3,
                marginTop: 10,
              }}
            >
              {([
                { id: "wpi-water" as WpiSubTab, label: "🏔️ Water", activeColor: "#0369A1" },
                { id: "wpi-wastewater" as WpiSubTab, label: "🌿 Wastewater", activeColor: "#B45309" },
                { id: "wpi-dist" as WpiSubTab, label: "🚰 Distribution", activeColor: "#0369A1" },
                { id: "wpi-coll" as WpiSubTab, label: "🔩 Collection", activeColor: "#065F46" },
              ] as const).map(sub => (
                <button
                  key={sub.id}
                  onClick={() => setActiveTrack(sub.id)}
                  style={{
                    padding: "8px 16px", borderRadius: 8, border: "none",
                    background: activeWpiSub === sub.id ? sub.activeColor : "transparent",
                    color: activeWpiSub === sub.id ? "#fff" : "#0369A1",
                    fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "inherit",
                    transition: "all 0.2s", whiteSpace: "nowrap",
                  }}
                >
                  {sub.label}
                </button>
              ))}
            </div>
          )}
        </div>
        </FadeUp>

        <div className="landing-course-grid" style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
          gap: 24,
        }}>
          {(activeTrack === "water" ? WATER_COURSES : activeTrack === "wastewater" ? WASTEWATER_COURSES : activeTrack === "wpi-water" ? WPI_WATER_COURSES : activeTrack === "wpi-wastewater" ? WPI_WASTEWATER_COURSES : activeTrack === "wpi-dist" ? WPI_WATER_DIST_COURSES : activeTrack === "wpi-coll" ? WPI_WATER_COLL_COURSES : WQA_COURSES).map(course => (
            <CourseCard key={course.code} course={course} />
          ))}
        </div>
      </section>

      {/* ── Study Tools Feature Section ── */}
      <section id="tools" style={{
        background: "#0F172A",
        padding: "72px 24px",
      }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <FadeUp>
          <div style={{ textAlign: "center", marginBottom: 52 }}>
            <h2 style={{ fontSize: "clamp(22px, 3vw, 36px)", fontWeight: 800, color: "#FFFFFF", letterSpacing: "-0.02em", margin: "0 0 12px 0" }}>
              Every Tool You Need to Pass
            </h2>
            <p style={{ fontSize: 16, color: "rgba(255,255,255,0.6)", maxWidth: 500, margin: "0 auto" }}>
              Built specifically for Canadian operator exams — not generic quiz apps repurposed for water treatment.
            </p>
          </div>
          </FadeUp>

          <StaggerContainer>
          <div className="landing-tools-grid" style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
            gap: 20,
          }}>
            {FEATURES.map(f => (
              <StaggerItem key={f.title}>
              <Link key={f.title} href={f.href}>
                <div className="tool-card-inner" style={{
                  background: "rgba(255,255,255,0.05)",
                  border: "1px solid rgba(255,255,255,0.08)",
                  borderRadius: 16, padding: "28px 24px",
                  transition: "background 0.2s, transform 0.15s, box-shadow 0.15s",
                  cursor: "pointer",
                  height: "100%",
                }}
                  onMouseEnter={e => {
                    (e.currentTarget as HTMLDivElement).style.background = "rgba(255,255,255,0.10)";
                    (e.currentTarget as HTMLDivElement).style.transform = "translateY(-3px)";
                    (e.currentTarget as HTMLDivElement).style.boxShadow = `0 8px 28px ${f.color}30`;
                  }}
                  onMouseLeave={e => {
                    (e.currentTarget as HTMLDivElement).style.background = "rgba(255,255,255,0.05)";
                    (e.currentTarget as HTMLDivElement).style.transform = "translateY(0)";
                    (e.currentTarget as HTMLDivElement).style.boxShadow = "none";
                  }}
                >
                  <div className="tool-card-icon" style={{
                    width: 48, height: 48, borderRadius: 12,
                    background: `${f.color}22`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 24, marginBottom: 16,
                  }}>
                    {f.icon}
                  </div>
                  <h3 style={{ fontSize: 16, fontWeight: 700, color: "#FFFFFF", margin: "0 0 8px 0" }}>{f.title}</h3>
                  <p className="tool-card-desc" style={{ fontSize: 13, color: "rgba(255,255,255,0.6)", lineHeight: 1.6, margin: "0 0 14px 0" }}>{f.description}</p>
                  <div className="tool-card-cta" style={{ fontSize: 11, fontWeight: 700, color: f.color }}>Open →</div>
                </div>
              </Link>
              </StaggerItem>
            ))}
          </div>
          </StaggerContainer>
        </div>
      </section>

      {/* ── About Section (teaser — links to /about for full content) ── */}
      <section id="about" style={{ background: "#0F172A", padding: "72px 24px", scrollMarginTop: 80 }}>
        <div style={{ maxWidth: 860, margin: "0 auto" }}>

          {/* Teaser Header */}
          <FadeUp>
          <div style={{ textAlign: "center", marginBottom: 40 }}>
            <div style={{
              display: "inline-block",
              background: "rgba(96,165,250,0.12)",
              border: "1px solid rgba(96,165,250,0.25)",
              borderRadius: 20,
              padding: "5px 14px",
              fontSize: 11,
              fontWeight: 700,
              color: "#60A5FA",
              letterSpacing: "0.08em",
              textTransform: "uppercase" as const,
              marginBottom: 18,
            }}>About Echelon Institute</div>
            <h2 style={{ fontSize: "clamp(22px, 4vw, 36px)", fontWeight: 900, color: "#FFFFFF", margin: "0 0 16px", letterSpacing: "-0.02em" }}>
              Built by an Engineer<br />Who Knows What's Missing
            </h2>
            <p style={{ fontSize: 15, color: "rgba(255,255,255,0.6)", maxWidth: 620, margin: "0 auto 32px", lineHeight: 1.75 }}>
              Echelon Institute was built by an Environmental Engineer (EIT) who saw first-hand that Canada's water and wastewater operators were studying for technically demanding provincial exams with resources that hadn't evolved in decades. Every question is mapped to each province's regulatory framework. Every module is built for understanding, not memorization.
            </p>
            <Link href="/about">
              <button style={{
                padding: "12px 28px",
                borderRadius: 10,
                border: "1.5px solid rgba(96,165,250,0.4)",
                background: "rgba(96,165,250,0.08)",
                color: "#60A5FA",
                fontSize: 14,
                fontWeight: 700,
                cursor: "pointer",
                fontFamily: "inherit",
                letterSpacing: "0.01em",
              }}>
                Read our full story, values &amp; changelog →
              </button>
            </Link>
          </div>
          </FadeUp>


        </div>
      </section>

      {/* ── Coming Soon: BC & Alberta ── */}
      <section style={{
        background: "#0F172A",
        borderTop: "1px solid rgba(255,255,255,0.06)",
        padding: "72px 24px",
      }}>
        <div style={{ maxWidth: 1060, margin: "0 auto", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 56, alignItems: "center" }}>

          {/* Left — heading + stats + CTA */}
          <div>
            <div style={{
              display: "inline-flex", alignItems: "center", gap: 8,
              background: "rgba(52,211,153,0.12)",
              border: "1px solid rgba(52,211,153,0.3)",
              borderRadius: 20, padding: "5px 16px", marginBottom: 20,
            }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: "#34D399", letterSpacing: "0.08em", textTransform: "uppercase" as const }}>✓ Now Live Nationally</span>
            </div>
            <h2 style={{ fontSize: "clamp(24px, 3vw, 38px)", fontWeight: 800, color: "#FFFFFF", letterSpacing: "-0.02em", margin: "0 0 16px 0", lineHeight: 1.2 }}>
              WPI Exam Prep<br />Now Available
            </h2>
            <p style={{ fontSize: 15, color: "rgba(255,255,255,0.55)", lineHeight: 1.7, margin: "0 0 28px 0" }}>
              Over 8,000 questions across 16 WPI courses — Class I–IV Water and Class I–IV Wastewater — aligned with the WPI Need-to-Know Criteria.
            </p>
            <div style={{ display: "flex", gap: 28, marginBottom: 32 }}>
              <div>
                <div style={{ fontSize: 26, fontWeight: 800, color: "#FFFFFF" }}>8,000+</div>
                <div style={{ fontSize: 12, color: "rgba(255,255,255,0.45)", marginTop: 2 }}>Practice questions</div>
              </div>
              <div style={{ width: 1, background: "rgba(255,255,255,0.1)" }} />
              <div>
                <div style={{ fontSize: 26, fontWeight: 800, color: "#FFFFFF" }}>16</div>
                <div style={{ fontSize: 12, color: "rgba(255,255,255,0.45)", marginTop: 2 }}>WPI courses</div>
              </div>
              <div style={{ width: 1, background: "rgba(255,255,255,0.1)" }} />
              <div>
                <div style={{ fontSize: 26, fontWeight: 800, color: "#FFFFFF" }}>4</div>
                <div style={{ fontSize: 12, color: "rgba(255,255,255,0.45)", marginTop: 2 }}>Provinces covered</div>
              </div>
            </div>
            <a href="/wpi" style={{ textDecoration: "none" }}>
              <button
                style={{
                  padding: "12px 28px", borderRadius: 10,
                  background: "linear-gradient(135deg, #0891B2, #7C3AED)",
                  color: "#fff", border: "none", fontSize: 14, fontWeight: 700,
                  cursor: "pointer", fontFamily: "inherit",
                  boxShadow: "0 4px 20px rgba(8,145,178,0.3)",
                }}
              >
                Explore WPI Courses →
              </button>
            </a>
          </div>

          {/* Right — 2×2 province grid */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            {[
              {
                flag: "🏔️",
                province: "British Columbia",
                certBody: "EOCP",
                operators: "~4,200 operators",
                color: "#0891B2",
                colorBg: "rgba(8,145,178,0.1)",
                colorBorder: "rgba(8,145,178,0.25)",
              },
              {
                flag: "🛢️",
                province: "Alberta",
                certBody: "AWWOA",
                operators: "~2,071 operators",
                color: "#7C3AED",
                colorBg: "rgba(124,58,237,0.1)",
                colorBorder: "rgba(124,58,237,0.25)",
              },
              {
                flag: "🌾",
                province: "Saskatchewan",
                certBody: "SAHO",
                operators: "~800 operators",
                color: "#D97706",
                colorBg: "rgba(217,119,6,0.1)",
                colorBorder: "rgba(217,119,6,0.25)",
              },
              {
                flag: "🦬",
                province: "Manitoba",
                certBody: "MWWA",
                operators: "~600 operators",
                color: "#059669",
                colorBg: "rgba(5,150,105,0.1)",
                colorBorder: "rgba(5,150,105,0.25)",
              },
            ].map(p => (
              <div key={p.province} style={{
                background: p.colorBg,
                border: `1px solid ${p.colorBorder}`,
                borderRadius: 14, padding: "20px 18px",
                position: "relative" as const,
              }}>
                <div style={{
                  position: "absolute" as const, top: 12, right: 12,
                  background: "rgba(52,211,153,0.15)",
                  borderRadius: 6, padding: "2px 8px",
                  fontSize: 9, fontWeight: 700, color: "#34D399",
                  letterSpacing: "0.06em", textTransform: "uppercase" as const,
                }}>✓ Live</div>
                <div style={{ fontSize: 24, marginBottom: 8 }}>{p.flag}</div>
                <h3 style={{ fontSize: 14, fontWeight: 800, color: "#FFFFFF", margin: "0 0 3px 0" }}>{p.province}</h3>
                <div style={{ fontSize: 11, fontWeight: 600, color: p.color, marginBottom: 8 }}>{p.certBody} — WPI Exams</div>
                <div style={{ fontSize: 11, color: "rgba(255,255,255,0.5)" }}>{p.operators}</div>
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* ── CTA Banner ── */}
      <FadeUp>
      <section style={{
        background: "linear-gradient(135deg, #1D4ED8, #0E7490)",
        padding: "64px 24px",
        textAlign: "center",
      }}>
        <h2 style={{ fontSize: "clamp(20px, 3vw, 32px)", fontWeight: 800, color: "#FFFFFF", margin: "0 0 12px 0", letterSpacing: "-0.02em" }}>
          Start with the OIT — It's Free
        </h2>
        <p style={{ fontSize: 16, color: "rgba(255,255,255,0.8)", margin: "0 0 32px 0", maxWidth: 500, marginLeft: "auto", marginRight: "auto" }}>
          Try 500+ OIT practice questions across 10 modules with full AI Tutor access. No account required.
        </p>
        <Link href="/quiz">
          <button className="btn-pulse" style={{
            padding: "16px 40px", borderRadius: 12,
            background: "#FFFFFF", color: "#1D4ED8",
            border: "none", fontSize: 16, fontWeight: 800,
            cursor: "pointer", fontFamily: "inherit",
            boxShadow: "0 4px 24px rgba(0,0,0,0.2)",
          }}>
            Start Free OIT Practice →
          </button>
        </Link>
      </section>
      </FadeUp>

      {/* ── Testimonials Section ── */}
      <section style={{ background: "#FFFFFF", padding: "80px 24px" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <FadeUp>
          <div style={{ textAlign: "center", marginBottom: 48 }}>
            <div style={{ display: "inline-block", background: "#EFF6FF", color: "#1D4ED8", borderRadius: 20, padding: "4px 14px", fontSize: 12, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 12 }}>Student Stories</div>
            <h2 style={{ fontSize: 32, fontWeight: 900, color: "#0F172A", margin: "0 0 12px", letterSpacing: "-0.02em" }}>Operators Who Passed With Echelon</h2>
            <p style={{ fontSize: 16, color: "#64748B", maxWidth: 520, margin: "0 auto" }}>Real feedback from water and wastewater operators across Canada.</p>
          </div>
          </FadeUp>
          <div className="testimonials-grid" style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 24 }}>
            {[
              {
                quote: "The adaptive quiz engine kept drilling me on hydraulics until I actually understood it. Passed my Class 2 Water exam on the first attempt.",
                name: "Jordan T.",
                role: "Class 2 Water Operator — Ontario",
                initials: "JT",
                color: "#1D4ED8",
                bg: "#EFF6FF",
              },
              {
                quote: "I failed the OIT twice before finding Echelon. The AI Tutor explained *why* I was getting disinfection questions wrong, not just what the answer was.",
                name: "Priya S.",
                role: "OIT Certified — British Columbia",
                initials: "PS",
                color: "#0F766E",
                bg: "#F0FDFA",
              },
              {
                quote: "The WPI formula sheets alone were worth it. I had everything I needed for the Class III exam in one place, with worked examples.",
                name: "Marcus L.",
                role: "WPI Class III Water — Alberta",
                initials: "ML",
                color: "#7C3AED",
                bg: "#F5F3FF",
              },
              {
                quote: "500+ OIT questions with difficulty levels meant I could focus on the hard stuff. The mock exam format matched the real test closely.",
                name: "Aisha K.",
                role: "OIT Certified — Ontario",
                initials: "AK",
                color: "#B45309",
                bg: "#FFFBEB",
              },
              {
                quote: "I studied for my Class 1 Wastewater on my phone during lunch breaks. The mobile layout is clean and the questions are genuinely challenging.",
                name: "Devon R.",
                role: "Class 1 Wastewater Operator — Ontario",
                initials: "DR",
                color: "#065F46",
                bg: "#ECFDF5",
              },
              {
                quote: "The WQA practice bank covered every module from the exam blueprint. I felt prepared walking in — and I passed with 84%.",
                name: "Fatima O.",
                role: "Water Quality Analyst — Ontario",
                initials: "FO",
                color: "#BE185D",
                bg: "#FDF2F8",
              },
            ].map((t, i) => (
              <div key={i} style={{
                background: "#F8FAFC",
                borderRadius: 16,
                padding: "28px 24px",
                border: "1px solid #E2E8F0",
                display: "flex",
                flexDirection: "column",
                gap: 16,
              }}>
                {/* Stars */}
                <div style={{ display: "flex", gap: 2 }}>
                  {[0,1,2,3,4].map(s => (
                    <span key={s} style={{ color: "#F59E0B", fontSize: 14 }}>★</span>
                  ))}
                </div>
                {/* Quote */}
                <p style={{ fontSize: 14, color: "#334155", lineHeight: 1.7, margin: 0, fontStyle: "italic" }}>
                  "{t.quote}"
                </p>
                {/* Author */}
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: "auto" }}>
                  <div style={{
                    width: 38, height: 38, borderRadius: "50%",
                    background: t.bg, color: t.color,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 13, fontWeight: 800, flexShrink: 0,
                  }}>{t.initials}</div>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 800, color: "#0F172A" }}>{t.name}</div>
                    <div style={{ fontSize: 11, color: "#64748B" }}>{t.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
      <style>{`
        @media (max-width: 900px) { .testimonials-grid { grid-template-columns: repeat(2, 1fr) !important; } }
        @media (max-width: 600px) { .testimonials-grid { grid-template-columns: 1fr !important; } }
      `}</style>

      {/* ── FAQ Section ── */}
      <FadeUp>
      <section id="faq" style={{ background: "#F8FAFC", padding: "80px 24px", borderTop: "1px solid #E2E8F0", scrollMarginTop: 80 }}>
        <div style={{ maxWidth: 780, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 48 }}>
            <div style={{ display: "inline-block", background: "#EFF6FF", color: "#1D4ED8", borderRadius: 20, padding: "4px 14px", fontSize: 12, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 12 }}>FAQ</div>
            <h2 style={{ fontSize: 32, fontWeight: 900, color: "#0F172A", margin: "0 0 12px", letterSpacing: "-0.02em" }}>Frequently Asked Questions</h2>
            <p style={{ fontSize: 16, color: "#64748B", maxWidth: 520, margin: "0 auto" }}>Everything you need to know before you start studying.</p>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
            {[
              {
                q: "How does the subscription work?",
                a: "Echelon uses an annual subscription model. You subscribe to a class tier (Class 1 through Class 4, or All-Access) for your province, and you get full access to all courses in that tier for 12 months. Your subscription renews automatically each year — you can cancel anytime before the renewal date. Prefer to buy just one course? Individual practice passes are also available on the pricing page.",
              },
              {
                q: "Do the practice questions match the real exam?",
                a: "Yes. All questions are written by certified water and wastewater operators and aligned with OWWCO, EOCP, and provincial exam syllabi. Every calculation question includes a full step-by-step AI-explained solution.",
              },
              {
                q: "Which provinces are supported?",
                a: "Echelon covers all major Canadian provinces: Ontario (MOECP framework — OIT through Class 4, water and wastewater), British Columbia (EOCP / WPI), Alberta (AWWOA / WPI), Saskatchewan (SPEA / WPI), and Manitoba (WPCAM / WPI). Quebec support is in development.",
              },
              {
                q: "What is included with each course?",
                a: "Every course includes 500+ practice questions, a timed mock exam that simulates the real test, an AI Tutor that explains every answer in plain language, a formula sheet, 400+ flashcards, and a score history so you can track your progress over time.",
              },
              {
                q: "How is Echelon different from free study materials?",
                a: "Free materials give you content. Echelon gives you adaptive practice, instant AI explanations for every wrong answer, timed mock exams that simulate the real thing, and a score history that shows exactly where to focus. The difference is passing vs. re-booking.",
              },
              {
                q: "Can I try it before I buy?",
                a: "Yes. The OIT Water course is available to try for free — no account required. You get access to the full question bank and AI Tutor so you can see exactly what you are getting before you purchase any paid course.",
              },
              {
                q: "What payment methods do you accept?",
                a: "All major credit and debit cards (Visa, Mastercard, Amex) via Stripe's secure checkout. Your payment information is never stored on our servers.",
              },
              {
                q: "Can I get a refund?",
                a: "We offer a 7-day money-back guarantee if you are not satisfied. Email support@echeloninstitute.ca and we will make it right.",
              },
            ].map((faq, i, arr) => (
              <FaqItem key={faq.q} q={faq.q} a={faq.a} isLast={i === arr.length - 1} />
            ))}
          </div>
        </div>
      </section>
      </FadeUp>

      {/* ── From the Blog Section ── */}
      <BlogPreviewSection />

      {/* ── Contact Section ── */}
      <ContactSection />

      {/* ── Footer ── */}
      <footer style={{
        background: "#0F172A",
        borderTop: "1px solid rgba(255,255,255,0.08)",
        padding: "48px 24px 32px",
      }}>
        <div style={{ maxWidth: 960, margin: "0 auto" }}>

          {/* Top row: brand + review button */}
          <div style={{ display: "flex", flexWrap: "wrap", alignItems: "flex-start", justifyContent: "space-between", gap: 24, marginBottom: 36 }}>
            {/* Brand */}
            <div style={{ maxWidth: 320 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                <img
                  src="https://d2xsxph8kpxj0f.cloudfront.net/310519663446228701/9KAR7mkGo7x7xavTEeEpiA/echelon-icon-v2_5c9ed3a7.webp"
                  alt="Echelon Institute"
                  width={32}
                  height={30}
                  style={{ height: 30, width: 32, filter: "brightness(0) invert(1)" }}
                />
                <span style={{ fontSize: 15, fontWeight: 800, color: "#FFFFFF", letterSpacing: "-0.02em" }}>Echelon Institute</span>
              </div>
              <p style={{ fontSize: 13, color: "rgba(255,255,255,0.5)", margin: 0, lineHeight: 1.6 }}>
                Canada's AI-powered exam prep platform for water and wastewater operators.
              </p>
            </div>

            {/* Google Review CTA */}
            <a
              href="https://g.page/r/CWsjBbkUlS8rEBM/review"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                padding: "10px 20px",
                borderRadius: 8,
                background: "rgba(255,255,255,0.07)",
                border: "1px solid rgba(255,255,255,0.15)",
                color: "#FFF",
                fontSize: 13,
                fontWeight: 600,
                textDecoration: "none",
                cursor: "pointer",
                whiteSpace: "nowrap",
                alignSelf: "flex-start",
              }}
            >
              <span style={{ fontSize: 15 }}>⭐</span>
              Leave us a Google Review
            </a>
          </div>

          {/* Link columns */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: "8px 16px", marginBottom: 32 }}>
            {[
              { label: "Courses", links: [
                { label: "Drinking Water", href: "/process" },
                { label: "Wastewater", href: "/wastewater" },
                { label: "Distribution Guide", href: "/distribution-guide" },
                { label: "Collection Guide", href: "/collection-guide" },
                { label: "Pumping Systems", href: "/pumping" },
                { label: "Instrumentation", href: "/instrumentation" },
                { label: "Lab & Sampling", href: "/lab" },
              ]},
              { label: "Tools", links: [
                { label: "AI Tutor Quiz", href: "/quiz" },
                { label: "Formula Sheet", href: "/formulas" },
                { label: "Flashcards", href: "/oit-water-flashcards" },
                { label: "Career Map", href: "/career" },
              ]},
              { label: "Resources", links: [
                { label: "Blog", href: "/blog" },
                { label: "Jobs", href: "/jobs" },
                { label: "Career Map", href: "/career" },
              ]},
              { label: "Company", links: [
                { label: "About", href: "/about" },
                { label: "Pricing", href: "/pricing" },
                { label: "FAQ", href: "/#faq" },
                { label: "Contact", href: "/#contact" },
              ]},
            ].map(col => (
              <div key={col.label}>
                <div style={{ fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.35)", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 12 }}>{col.label}</div>
                {col.links.map(link => (
                  <Link key={link.label} href={link.href}>
                    <div style={{ fontSize: 13, color: "rgba(255,255,255,0.55)", cursor: "pointer", marginBottom: 8, lineHeight: 1.4 }}>
                      {link.label}
                    </div>
                  </Link>
                ))}
              </div>
            ))}
          </div>

          {/* Social links */}
          <div style={{ display: "flex", gap: 12, marginBottom: 28 }}>
            <a
              href="https://www.instagram.com/echelon.institute/"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: "inline-flex", alignItems: "center", gap: 7,
                padding: "8px 14px", borderRadius: 8,
                background: "rgba(255,255,255,0.06)",
                border: "1px solid rgba(255,255,255,0.12)",
                color: "rgba(255,255,255,0.65)", fontSize: 13, fontWeight: 500,
                textDecoration: "none", cursor: "pointer",
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/>
                <circle cx="12" cy="12" r="4"/>
                <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none"/>
              </svg>
              Instagram
            </a>
            <a
              href="https://www.linkedin.com/company/echeloninstitute/"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: "inline-flex", alignItems: "center", gap: 7,
                padding: "8px 14px", borderRadius: 8,
                background: "rgba(255,255,255,0.06)",
                border: "1px solid rgba(255,255,255,0.12)",
                color: "rgba(255,255,255,0.65)", fontSize: 13, fontWeight: 500,
                textDecoration: "none", cursor: "pointer",
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/>
                <rect x="2" y="9" width="4" height="12"/>
                <circle cx="4" cy="4" r="2"/>
              </svg>
              LinkedIn
            </a>
          </div>

          {/* Bottom bar */}
          <div style={{ borderTop: "1px solid rgba(255,255,255,0.07)", paddingTop: 20, display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
            <p style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", margin: 0 }}>
              © {new Date().getFullYear()} Echelon Institute. All rights reserved.
            </p>
            <p style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", margin: 0 }}>
              📍 1291 Gordon St, Guelph, ON N1L 0M5 &nbsp;·&nbsp; 📞 (289) 788-1885
            </p>
          </div>

        </div>
      </footer>

      {/* Fixed Admin shortcut — always visible, admin page handles auth */}
      <a
        href="/admin"
        style={{
          position: "fixed",
          bottom: 24,
          right: 24,
          zIndex: 9999,
          display: "flex",
          alignItems: "center",
          gap: 6,
          padding: "10px 18px",
          borderRadius: 12,
          background: "linear-gradient(135deg, #7C3AED, #4F46E5)",
          color: "#fff",
          fontSize: 13,
          fontWeight: 700,
          textDecoration: "none",
          boxShadow: "0 4px 20px rgba(124,58,237,0.45)",
          fontFamily: "inherit",
          whiteSpace: "nowrap",
        }}
      >
        🛡️ Admin
      </a>
    </div>
  );
}
