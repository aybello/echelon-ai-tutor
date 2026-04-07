// Echelon Institute — Homepage / Landing Page
// Design: Bold, modern SaaS — feels like the product itself
// Audience: Canadian water/wastewater operators seeking certification

import { Link } from "wouter";
import { useState, useRef } from "react";
import { motion, useInView, useReducedMotion } from "framer-motion";
import NotifyModal from "@/components/NotifyModal";
import NationalWaitlistModal from "@/components/NationalWaitlistModal";
import { usePageMeta } from "@/hooks/usePageMeta";
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
              <p style={{ fontSize: 13, color: "#94A3B8", margin: "6px 0 0" }}>Mon–Fri, 9am–5pm ET</p>
            </div>
            <div style={{ background: "#FFFFFF", borderRadius: 16, padding: "24px", border: "1px solid #E2E8F0" }}>
              <div style={{ fontSize: 28, marginBottom: 12 }}>✉️</div>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#64748B", letterSpacing: "0.06em", marginBottom: 6 }}>EMAIL</div>
              <a href="mailto:abello@echeloninstitute.ca" style={{ fontSize: 15, fontWeight: 700, color: "#1D4ED8", textDecoration: "none", wordBreak: "break-all" }}>abello@echeloninstitute.ca</a>
              <p style={{ fontSize: 13, color: "#94A3B8", margin: "6px 0 0" }}>We reply within 1 business day</p>
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
                  <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#64748B", marginBottom: 6, letterSpacing: "0.05em" }}>SUBJECT</label>
                  <select
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
    price: 79,
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
    price: 149,
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
    price: 199,
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
    price: 349,
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
    price: 499,
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
    price: 79,
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
    price: 149,
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
    price: 199,
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
    price: 349,
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
    price: 499,
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
    questions: 300,
    description: "Complete preparation for the Ontario Water Quality Analyst certification under O. Reg. 128/04. Covers sampling protocols, analytical methods, QA/QC programs, chain of custody, and regulatory reporting for accredited drinking water labs. 300 questions across 10 modules.",
    topics: ["Sampling Techniques & Chain of Custody", "Analytical Methods & Lab Equipment", "QA/QC Programs & Method Validation", "O. Reg. 128/04 Requirements", "Regulatory Reporting & Documentation"],
    badge: "Single Certification",
    badgeColor: "#7C3AED",
    color: "#6D28D9",
    bg: "#FAF5FF",
    border: "#DDD6FE",
    comingSoon: false,
    price: 179,
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
    price: 149,
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
    description: "Advanced WPI Class II Water Treatment prep. Covers advanced treatment processes, system design, lab monitoring, source water management, and regulatory compliance. 501 questions across 5 modules.",
    topics: ["Advanced Treatment Processes", "System Design & Hydraulics", "Lab Monitoring & QC", "Source Water Management", "Regulatory Compliance"],
    badge: "WPI",
    badgeColor: "#0E7490",
    color: "#0E7490",
    bg: "#ECFEFF",
    border: "#A5F3FC",
    comingSoon: false,
    price: 199,
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
    price: 349,
    productKey: "wpi-class3-water",
    quizHref: "/wpi-class3-water",
    mockHref: "/wpi-class3-water-mock",
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
    price: 499,
    productKey: "wpi-class4-water",
    quizHref: "/wpi-class4-water",
    mockHref: "/wpi-class4-water-mock",
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
    price: 149,
    productKey: "wpi-class1-wastewater",
    quizHref: "/wpi-class1-wastewater",
    mockHref: "/wpi-class1-wastewater-mock",
  },
  {
    code: "WPI-WW2",
    title: "WPI Class II Wastewater",
    subtitle: "WPI Wastewater Treatment — Class II",
    duration: "6–8 weeks",
    questions: 501,
    description: "Advanced WPI Class II Wastewater Treatment prep. Covers biological nutrient removal, sludge management, advanced lab analysis, and process optimization. 501 questions across 8 modules.",
    topics: ["Biological Nutrient Removal", "Sludge Processing & Dewatering", "SRT & SVI Calculations", "Advanced Lab Analysis", "Process Optimization"],
    badge: "WPI",
    badgeColor: "#0F766E",
    color: "#0F766E",
    bg: "#F0FDFA",
    border: "#99F6E4",
    comingSoon: false,
    price: 199,
    productKey: "wpi-class2-wastewater",
    quizHref: "/wpi-class2-wastewater",
    mockHref: "/wpi-class2-wastewater-mock",
  },
  {
    code: "WPI-WW3",
    title: "WPI Class III Wastewater",
    subtitle: "WPI Wastewater Treatment — Class III",
    duration: "8–10 weeks",
    questions: 502,
    description: "Senior-level WPI Class III Wastewater Treatment prep. Covers advanced BNR, membrane bioreactors, industrial pretreatment, advanced biosolids, and regulatory compliance. 502 questions across 8 modules.",
    topics: ["Advanced BNR & MBR", "Industrial Pretreatment", "Advanced Biosolids Management", "Regulatory Compliance", "Emergency Response"],
    badge: "WPI",
    badgeColor: "#1D4ED8",
    color: "#1D4ED8",
    bg: "#EFF6FF",
    border: "#BFDBFE",
    comingSoon: false,
    price: 349,
    productKey: "wpi-class3-wastewater",
    quizHref: "/wpi-class3-wastewater",
    mockHref: "/wpi-class3-wastewater-mock",
  },
  {
    code: "WPI-WW4",
    title: "WPI Class IV Wastewater",
    subtitle: "WPI Wastewater Treatment — Class IV",
    duration: "10–12 weeks",
    questions: 502,
    description: "Chief operator-level WPI Class IV Wastewater Treatment prep. The highest WPI wastewater certification. Covers advanced process control, BNR & resource recovery, plant management, and strategic regulatory compliance. 502 questions across 7 modules.",
    topics: ["Advanced Process Control", "BNR & Resource Recovery", "Plant Management & Leadership", "Regulatory Compliance", "Emergency Response"],
    badge: "WPI",
    badgeColor: "#6D28D9",
    color: "#6D28D9",
    bg: "#F5F3FF",
    border: "#DDD6FE",
    comingSoon: false,
    price: 499,
    productKey: "wpi-class4-wastewater",
    quizHref: "/wpi-class4-wastewater",
    mockHref: "/wpi-class4-wastewater-mock",
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
    icon: "⚙️",
    title: "Pumping Systems Module",
    description: "Live pump curves, cavitation toggle, series/parallel configurations. The most technical module on the exam, made visual.",
    color: "#D97706",
    href: "/pumping",
  },
  {
    icon: "🧮",
    title: "Math Practice Hub",
    description: "800+ calculation questions across all 18 courses — filtered to math-only, with step-by-step solutions and exam tips. Master every formula before exam day.",
    color: "#7C3AED",
    href: "/math-practice",
  },
  {
    icon: "🧪",
    title: "Chemical Feed Calculator",
    description: "Real-time dosing calculations for chlorine, alum, lime, and fluoride. Know the formula and the answer.",
    color: "#DC2626",
    href: "/chem-calc",
  },
  {
    icon: "📐",
    title: "Formula Sheet",
    description: "33 Ontario operator exam formulas with worked examples and exam tips. CT values, SVI, pump power, and more.",
    color: "#0E7490",
    href: "/formulas",
  },
  {
    icon: "🔬",
    title: "WQA Formula Sheet",
    description: "30+ formulas for the Ontario Water Quality Analyst exam — unit conversions, alkalinity, CT values, Langelier Index, QA/QC, and O. Reg. 169/03 limits.",
    color: "#7C3AED",
    href: "/formulas-wqa",
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
  { value: "8,500+", label: "Practice Questions" },
  { value: "19", label: "Certification Courses" },
  { value: "5", label: "Specialization Tracks" },
  { value: "Free", label: "OIT Access" },
];

type CourseType = (typeof WATER_COURSES)[number] | (typeof WASTEWATER_COURSES)[number] | (typeof WQA_COURSES)[number] | (typeof WPI_WATER_COURSES)[number] | (typeof WPI_WASTEWATER_COURSES)[number];

function CourseCard({ course }: { course: CourseType }) {
  const [expanded, setExpanded] = useState(false);
  const [notifyOpen, setNotifyOpen] = useState(false);
  const createSession = trpc.stripe.createCheckoutSession.useMutation({
    onSuccess: (data) => { if (data.url) window.open(data.url, '_blank'); },
    onError: () => alert("Something went wrong. Please try again."),
  });
  function handleGetPass() {
    const pk = (course as any).productKey;
    if (!pk) return;
    createSession.mutate({ productKey: pk, origin: window.location.origin });
  }
  return (
    <div
      className="course-card"
      style={{
        background: "#FFFFFF",
        border: `1.5px solid ${course.border}`,
        borderRadius: 16,
        padding: "24px",
        position: "relative",
        transition: "box-shadow 0.2s, transform 0.2s",
        cursor: "pointer",
      }}
      onMouseEnter={e => {
        (e.currentTarget as HTMLDivElement).style.boxShadow = "0 8px 32px rgba(0,0,0,0.10)";
        (e.currentTarget as HTMLDivElement).style.transform = "translateY(-2px)";
      }}
      onMouseLeave={e => {
        (e.currentTarget as HTMLDivElement).style.boxShadow = "none";
        (e.currentTarget as HTMLDivElement).style.transform = "translateY(0)";
      }}
    >
      {course.badge && (
        <div style={{
          position: "absolute", top: 16, right: 16,
          background: course.badgeColor, color: "#fff",
          fontSize: 10, fontWeight: 700, padding: "3px 10px", borderRadius: 20,
          letterSpacing: "0.05em", textTransform: "uppercase",
        }}>
          {course.badge}
        </div>
      )}
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
        <span style={{
          background: course.bg, color: course.color,
          fontSize: 10, fontWeight: 700, padding: "3px 10px", borderRadius: 6,
          letterSpacing: "0.05em", textTransform: "uppercase",
        }}>
          {course.code}
        </span>
        <span style={{ color: "#94A3B8", fontSize: 11 }}>{course.duration}</span>
      </div>
      <h3 style={{ fontSize: 18, fontWeight: 700, color: "#0F172A", margin: "0 0 2px 0", fontFamily: "Sora, sans-serif" }}>
        {course.title}
      </h3>
      <p style={{ fontSize: 12, color: course.color, fontWeight: 600, margin: "0 0 10px 0" }}>{course.subtitle}</p>
      <p style={{ fontSize: 13, color: "#475569", lineHeight: 1.6, margin: "0 0 16px 0" }}>{course.description}</p>

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16, flexWrap: "wrap", gap: 8 }}>
        <div>
          <span style={{ fontSize: 26, fontWeight: 800, color: "#0F172A", fontFamily: "Sora, sans-serif" }}>CA${(course as any).price}</span>
          <span style={{ fontSize: 12, color: "#94A3B8", marginLeft: 4 }}>CAD</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 6, background: "#F8FAFC", borderRadius: 8, padding: "6px 12px" }}>
          <span style={{ fontSize: 11, color: "#64748B" }}>📝 {course.questions} questions</span>
        </div>
      </div>

      <button
        onClick={() => setExpanded(!expanded)}
        style={{
          width: "100%", padding: "8px", borderRadius: 8,
          border: `1px solid ${course.border}`, background: "transparent",
          color: course.color, fontSize: 12, fontWeight: 600,
          cursor: "pointer", marginBottom: 12, fontFamily: "inherit",
          transition: "background 0.15s",
        }}
      >
        {expanded ? "▲ Hide Topics" : "▼ View Topics"}
      </button>

      {expanded && (
        <ul style={{ margin: "0 0 16px 0", padding: "0 0 0 16px" }}>
          {course.topics.map(t => (
            <li key={t} style={{ fontSize: 12, color: "#475569", marginBottom: 4 }}>{t}</li>
          ))}
        </ul>
      )}

      {course.comingSoon ? (
        <button
          onClick={() => setNotifyOpen(true)}
          style={{
            width: "100%", padding: "12px",
            background: "linear-gradient(135deg, #7C3AED, #6D28D9)",
            color: "#fff", border: "none", borderRadius: 10,
            fontSize: 13, fontWeight: 700, cursor: "pointer",
            fontFamily: "inherit", transition: "opacity 0.15s",
          }}
        >
          🔔 Notify Me When Available
        </button>
      ) : (
        <>
          {/* Get Pass — direct Stripe checkout */}
          {(course as any).productKey && (
            <button
              onClick={handleGetPass}
              disabled={createSession.isPending}
              style={{
                width: "100%", padding: "12px",
                background: createSession.isPending ? "#93C5FD" : "linear-gradient(135deg, #1D4ED8, #0E7490)",
                color: "#fff", border: "none", borderRadius: 10,
                fontSize: 13, fontWeight: 700,
                cursor: createSession.isPending ? "not-allowed" : "pointer",
                fontFamily: "inherit", marginBottom: 8,
              }}
            >
              {createSession.isPending ? "Redirecting…" : `Get Pass — CA$${(course as any).price} →`}
            </button>
          )}
          <Link href={(course as any).quizHref ?? (course.code === "OIT-WW" ? "/oit-ww" : course.code === "CL1-WW" ? "/class1-ww" : course.code === "CL2-WW" ? "/class2-ww" : course.code === "CL1-W" ? "/class1-water" : course.code === "CL2-W" ? "/class2-water" : course.code === "CL3-W" ? "/class3-water" : course.code === "CL3-WW" ? "/class3-ww" : course.code === "CL4-W" ? "/class4-water" : course.code === "CL4-WW" ? "/class4-ww" : course.code === "WQA" ? "/wqa" : "/quiz")}>
            <button style={{
              width: "100%", padding: "10px",
              background: "transparent",
              color: course.color, border: `1.5px solid ${course.color}`,
              borderRadius: 10,
              fontSize: 12, fontWeight: 700, cursor: "pointer",
              fontFamily: "inherit", transition: "opacity 0.15s",
            }}>
              Start Studying →
            </button>
          </Link>
          {(course.code === "OIT-W" || course.code === "OIT-WW") && (
            <Link href={course.code === "OIT-WW" ? "/oit-ww-mock" : "/oit-mock"}>
              <button style={{
                width: "100%", padding: "10px",
                background: "transparent",
                color: course.color, border: `1.5px solid ${course.color}`,
                borderRadius: 10, fontSize: 12, fontWeight: 700,
                cursor: "pointer", fontFamily: "inherit",
                marginTop: 8, transition: "all 0.15s",
              }}>
                📋 Timed Mock Exam
              </button>
            </Link>
          )}

          {(course.code === "CL1-W" || course.code === "CL1-WW" || course.code === "CL2-WW" || course.code === "CL2-W" || course.code === "CL3-W" || course.code === "CL3-WW" || course.code === "CL4-W" || course.code === "CL4-WW" || course.code === "WQA" || (course as any).mockHref) && (
            <Link href={(course as any).mockHref ?? (course.code === "WQA" ? "/wqa-mock" : course.code === "CL1-WW" ? "/class1-ww-mock" : course.code === "CL2-WW" ? "/class2-ww-mock" : course.code === "CL2-W" ? "/class2-water-mock" : course.code === "CL3-W" ? "/class3-water-mock" : course.code === "CL3-WW" ? "/class3-ww-mock" : course.code === "CL4-W" ? "/class4-water-mock" : course.code === "CL4-WW" ? "/class4-ww-mock" : "/class1-water-mock")}>
              <button style={{
                width: "100%", padding: "10px",
                background: "transparent",
                color: course.color, border: `1.5px solid ${course.color}`,
                borderRadius: 10, fontSize: 12, fontWeight: 700,
                cursor: "pointer", fontFamily: "inherit",
                marginTop: 8, transition: "all 0.15s",
              }}>
                📋 Timed Mock Exam
              </button>
            </Link>
          )}

          {/* Flashcard button — shown for courses with a flashcard page */}
          {(course as any).flashcardHref && (
            <Link href={(course as any).flashcardHref}>
              <button style={{
                width: "100%", padding: "10px",
                background: "transparent",
                color: "#0F766E", border: "1.5px solid #0F766E",
                borderRadius: 10, fontSize: 12, fontWeight: 700,
                cursor: "pointer", fontFamily: "inherit",
                marginTop: 8, transition: "all 0.15s",
              }}>
                🃏 Flashcards
              </button>
            </Link>
          )}

        </>
      )}

      {notifyOpen && (
        <NotifyModal
          courseCode={course.code}
          courseTitle={course.title}
          onClose={() => setNotifyOpen(false)}
        />
      )}
    </div>
  );
}

export default function Landing() {
  usePageMeta({
    title: "Water Operator Exam Prep",
    description: "Practice questions, AI Tutor & formula sheet for Canadian water and wastewater operator certification exams.",
    keywords: "water operator exam, OIT exam prep, wastewater certification, operator practice questions",
    path: "/",
  });
  const { province, provinceInfo, showPrompt, setProvince, dismiss } = useProvince();
  const { isAuthenticated } = useAuth();
  const updateProvinceMutation = trpc.auth.updateProvince.useMutation();
  // Default active track based on province: WPI for western provinces, ontario water for ON
  const defaultTrack = (province === "bc" || province === "ab" || province === "sk" || province === "mb") ? "wpi-water" : "water";
  const [activeTrack, setActiveTrack] = useState<"water" | "wastewater" | "wqa" | "wpi-water" | "wpi-wastewater">(defaultTrack);
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
    { label: "Study Tools", href: "#tools" },
    { label: "WPI 🌊", href: "/wpi" },
    { label: "Pricing", href: "/pricing" },
    { label: "Formulas", href: "/formulas" },
    { label: "Career Map", href: careerMapHref },
    { label: "About", href: "#about" },
    { label: "Contact", href: "/#contact" },
  ];

  return (
    <div style={{ fontFamily: "Sora, Nunito, sans-serif", background: "#F8FAFC", minHeight: "100vh" }}>
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
          .landing-track-toggle { flex-direction: column !important; width: 100% !important; }
          .landing-track-toggle button { width: 100% !important; text-align: center; }
          .landing-footer-links { flex-wrap: wrap !important; gap: 12px !important; justify-content: center !important; }
          .landing-hero-btns { flex-direction: column !important; align-items: stretch !important; }
          .landing-hero-btns a, .landing-hero-btns button { width: 100% !important; box-sizing: border-box; }
          .landing-session-complete-pad { padding: 32px 20px !important; }
          .contact-grid { grid-template-columns: 1fr !important; }
          .contact-info-row { flex-direction: row !important; flex-wrap: wrap !important; gap: 12px !important; }
          .contact-info-card { flex: 1 1 140px !important; }
          .contact-form-grid { grid-template-columns: 1fr !important; }
          .landing-whats-new { flex-direction: column !important; gap: 12px !important; }
          .landing-whats-new-btn { width: 100% !important; text-align: center !important; }
          .landing-course-section { padding: 48px 16px !important; }
        }
        @media (min-width: 641px) {
          .landing-hamburger { display: none !important; }
          .landing-mobile-drawer { display: none !important; }
        }
      `}</style>

      {/* ── Navigation ── */}
      <nav style={{
        background: "#FFFFFF",
        borderBottom: "1px solid #E2E8F0",
        padding: "0 24px",
        position: "sticky", top: 0, zIndex: 100,
        display: "flex", alignItems: "center", justifyContent: "space-between",
        height: 64,
        gap: 12,
      }}>
        {/* Brand */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
          <img
            src="https://d2xsxph8kpxj0f.cloudfront.net/310519663446228701/9KAR7mkGo7x7xavTEeEpiA/echelon-icon-v2_37a8727b.png"
            alt="Echelon Institute"
            style={{ height: 44, width: "auto" }}
          />
          <div>
            <div style={{ fontSize: 15, fontWeight: 800, color: "#0F172A", letterSpacing: "-0.02em" }}>Echelon Institute</div>
            <div style={{ fontSize: 10, color: "#64748B", fontWeight: 500, marginTop: -2 }}>Canadian Water & Wastewater Operator Certification</div>
          </div>
        </div>

        {/* Desktop nav links */}
        <div className="landing-nav-links" style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "nowrap" }}>
          {NAV_LINKS.map(item => (
            <a key={item.label} href={item.href} style={{
              padding: "6px 14px", borderRadius: 8,
              color: "#475569", fontSize: 13, fontWeight: 600,
              textDecoration: "none", transition: "color 0.15s", whiteSpace: "nowrap",
            }}>
              {item.label}
            </a>
          ))}
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
      {/* Province context indicator — shown after province is selected */}
      {!showPrompt && province && provinceInfo && (
        <div style={{
          background: "#F8FAFC",
          borderBottom: "1px solid #E5E7EB",
          padding: "8px 24px",
          display: "flex",
          alignItems: "center",
          gap: 8,
          fontSize: 12,
          color: "#64748B",
        }}>
          <span style={{ fontSize: 14 }}>{provinceInfo.flag}</span>
          <span>Showing courses for <strong style={{ color: "#0F172A" }}>{provinceInfo.name}</strong></span>
          <button
            onClick={() => {
              // Reset province so banner shows again
              try { localStorage.removeItem("echelon_province"); localStorage.removeItem("echelon_province_dismissed"); } catch {}
              window.location.reload();
            }}
            style={{
              marginLeft: 8,
              background: "transparent",
              border: "1px solid #E5E7EB",
              borderRadius: 6,
              padding: "2px 10px",
              fontSize: 11,
              color: "#94A3B8",
              cursor: "pointer",
              fontFamily: "inherit",
            }}
          >
            Change
          </button>
        </div>
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

      {/* Mobile nav drawer */}
      <div
        className="landing-mobile-drawer"
        style={{
          position: "fixed",
          top: 64, right: 0,
          width: 260, bottom: 0,
          background: "#FFFFFF",
          borderLeft: "1px solid #E2E8F0",
          zIndex: 99,
          transform: mobileNavOpen ? "translateX(0)" : "translateX(100%)",
          transition: "transform 0.25s cubic-bezier(0.4,0,0.2,1)",
          overflowY: "auto",
          padding: "16px 0 32px",
        }}
      >
        <div style={{ padding: "0 20px 12px", borderBottom: "1px solid #F1F5F9", marginBottom: 8 }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: "#94A3B8", letterSpacing: "0.1em", textTransform: "uppercase" }}>
            Navigation
          </div>
        </div>
        {NAV_LINKS.map(item => (
          <a
            key={item.label}
            href={item.href}
            onClick={() => setMobileNavOpen(false)}
            style={{
              display: "block",
              padding: "13px 20px",
              color: "#0F172A",
              fontSize: 14,
              fontWeight: 600,
              textDecoration: "none",
              borderLeft: "3px solid transparent",
              transition: "background 0.15s",
            }}
          >
            {item.label}
          </a>
        ))}
        <div style={{ padding: "16px 20px 0", marginTop: 8, borderTop: "1px solid #F1F5F9" }}>
          <Link href="/quiz">
            <button
              onClick={() => setMobileNavOpen(false)}
              style={{
                width: "100%", padding: "12px",
                borderRadius: 10, border: "none",
                background: "linear-gradient(135deg, #1D4ED8, #0E7490)",
                color: "#fff", fontSize: 13, fontWeight: 700,
                cursor: "pointer", fontFamily: "inherit",
              }}
            >
              Try Free OIT Practice →
            </button>
          </Link>
        </div>
        {/* Tool links in drawer */}
        <div style={{ padding: "16px 20px 0", marginTop: 8, borderTop: "1px solid #F1F5F9" }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: "#94A3B8", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 10 }}>
            Study Tools
          </div>
          {[
            { label: "📝 OIT Practice Quiz", href: "/quiz" },
            { label: "📐 Formula Sheet", href: "/formulas" },
            { label: "🏭 Drinking Water Process", href: "/process" },
            { label: "♻️ Wastewater Process", href: "/wastewater" },
            { label: "⚙️ Pumping Systems", href: "/pumping" },
            { label: "🧮 Math Practice Hub", href: "/math-practice" },
            { label: "🧪 Chemical Calculator", href: "/chem-calc" },
            { label: "🔬 Lab & Sampling", href: "/lab" },
            { label: "🗺️ Career Map", href: "/career" },
            { label: "📋 Mock Exam", href: "/mock-exam" },
            { label: "🌊 WPI Overview (BC/AB/SK/MB)", href: "/wpi" },
            { label: "🌊 WPI Class I Practice", href: "/wpi-class1-water" },
            { label: "🌊 WPI Class II Practice", href: "/wpi-class2-water" },
            { label: "🃏 OIT Flashcards", href: "/oit-water-flashcards" },
          ].map(item => (
            <Link key={item.href} href={item.href}>
              <div
                onClick={() => setMobileNavOpen(false)}
                style={{
                  padding: "10px 0",
                  color: "#475569",
                  fontSize: 13,
                  fontWeight: 500,
                  cursor: "pointer",
                  borderBottom: "1px solid #F8FAFC",
                }}
              >
                {item.label}
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* ── Hero ── */}
      <section style={{
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
              src="https://d2xsxph8kpxj0f.cloudfront.net/310519663446228701/9KAR7mkGo7x7xavTEeEpiA/echelon-icon-v2_37a8727b.png"
              alt="Echelon Institute"
              style={{ height: 120, width: "auto", filter: "brightness(0) invert(1)" }}
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
            Adaptive practice questions, module study notes, 400+ flashcards, interactive process guides, and an AI tutor available 24/7.
          </motion.p>

          {/* Province-aware hero CTA */}
          {(() => {
            const isWestern = province === "bc" || province === "ab" || province === "sk" || province === "mb";
            const ctaHref = isWestern ? "/wpi-class1-water" : "/quiz";
            const ctaLabel = isWestern ? `Try Free WPI Class I Practice →` : "Try Free OIT Practice →";
            return (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: "easeOut", delay: 0.7 }}
            className="landing-hero-btns" style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
            <Link href={ctaHref}>
              <button style={{
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
        </div>
      </section>

      {/* ── Wave Divider ── */}
      <div style={{ lineHeight: 0, background: "#FFFFFF" }}>
        <svg viewBox="0 0 1440 60" xmlns="http://www.w3.org/2000/svg" style={{ display: "block", width: "100%" }}>
          <path d="M0,30 C360,60 1080,0 1440,30 L1440,0 L0,0 Z" fill="#0F172A" />
        </svg>
      </div>

      {/* ── Stats Bar ── */}
      <section style={{
        background: "#FFFFFF",
        borderBottom: "1px solid #E2E8F0",
        padding: "28px 24px",
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
            <AnimatedStat value={8500} suffix="+" label="Practice Questions" />
          </StaggerItem>
          <StaggerItem>
            <AnimatedStat value={19} label="Certification Courses" />
          </StaggerItem>
          <StaggerItem>
            <AnimatedStat value={5} label="Specialization Tracks" />
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
      <div style={{ padding: "32px 24px 0", maxWidth: 1200, margin: "0 auto" }}>
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
            Five certification tracks — Ontario Water (5 levels), Ontario Wastewater (5 levels), WQA, plus WPI Water (Class I–IV) and WPI Wastewater (Class I–IV) for BC, AB, SK, and MB operators. Every course includes hundreds of practice questions and full AI Tutor access.
          </p>

          {/* Track Toggle */}
          <div
            className="landing-track-toggle"
            style={{
              display: "inline-flex", background: "#F1F5F9", borderRadius: 12, padding: 4, gap: 4,
            }}
          >
            <button
              onClick={() => setActiveTrack("water")}
              style={{
                padding: "10px 20px", borderRadius: 10, border: "none",
                background: activeTrack === "water" ? "#1D4ED8" : "transparent",
                color: activeTrack === "water" ? "#fff" : "#64748B",
                fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: "inherit",
                transition: "all 0.2s", whiteSpace: "nowrap",
              }}
            >
              💧 Water Treatment
            </button>
            <button
              onClick={() => setActiveTrack("wastewater")}
              style={{
                padding: "10px 20px", borderRadius: 10, border: "none",
                background: activeTrack === "wastewater" ? "#059669" : "transparent",
                color: activeTrack === "wastewater" ? "#fff" : "#64748B",
                fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: "inherit",
                transition: "all 0.2s", whiteSpace: "nowrap",
              }}
            >
              ♻️ Wastewater
            </button>
            <button
              onClick={() => setActiveTrack("wqa")}
              style={{
                padding: "10px 20px", borderRadius: 10, border: "none",
                background: activeTrack === "wqa" ? "#7C3AED" : "transparent",
                color: activeTrack === "wqa" ? "#fff" : "#64748B",
                fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: "inherit",
                transition: "all 0.2s", whiteSpace: "nowrap",
              }}
            >
              🔬 WQA
            </button>
            <button
              onClick={() => setActiveTrack("wpi-water")}
              style={{
                padding: "10px 20px", borderRadius: 10, border: "none",
                background: activeTrack === "wpi-water" ? "#0369A1" : "transparent",
                color: activeTrack === "wpi-water" ? "#fff" : "#64748B",
                fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: "inherit",
                transition: "all 0.2s", whiteSpace: "nowrap",
              }}
            >
              🏔️ WPI Water
            </button>
            <button
              onClick={() => setActiveTrack("wpi-wastewater")}
              style={{
                padding: "10px 20px", borderRadius: 10, border: "none",
                background: activeTrack === "wpi-wastewater" ? "#B45309" : "transparent",
                color: activeTrack === "wpi-wastewater" ? "#fff" : "#64748B",
                fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: "inherit",
                transition: "all 0.2s", whiteSpace: "nowrap",
              }}
            >
              🌿 WPI Wastewater
            </button>
          </div>
        </div>
        </FadeUp>

        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
          gap: 24,
        }}>
          {(activeTrack === "water" ? WATER_COURSES : activeTrack === "wastewater" ? WASTEWATER_COURSES : activeTrack === "wpi-water" ? WPI_WATER_COURSES : activeTrack === "wpi-wastewater" ? WPI_WASTEWATER_COURSES : WQA_COURSES).map(course => (
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
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
            gap: 20,
          }}>
            {FEATURES.map(f => (
              <StaggerItem key={f.title}>
              <Link key={f.title} href={f.href}>
                <div style={{
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
                  <div style={{
                    width: 48, height: 48, borderRadius: 12,
                    background: `${f.color}22`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 24, marginBottom: 16,
                  }}>
                    {f.icon}
                  </div>
                  <h3 style={{ fontSize: 16, fontWeight: 700, color: "#FFFFFF", margin: "0 0 8px 0" }}>{f.title}</h3>
                  <p style={{ fontSize: 13, color: "rgba(255,255,255,0.6)", lineHeight: 1.6, margin: "0 0 14px 0" }}>{f.description}</p>
                  <div style={{ fontSize: 11, fontWeight: 700, color: f.color }}>Open →</div>
                </div>
              </Link>
              </StaggerItem>
            ))}
          </div>
          </StaggerContainer>
        </div>
      </section>

      {/* ── About Section ── */}
      <section id="about" style={{ background: "#0F172A", padding: "72px 24px" }}>
        <div style={{ maxWidth: 960, margin: "0 auto" }}>

          {/* Header */}
          <FadeUp>
          <div style={{ textAlign: "center", marginBottom: 52 }}>
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
            <p style={{ fontSize: 15, color: "rgba(255,255,255,0.55)", maxWidth: 620, margin: "0 auto", lineHeight: 1.75 }}>
              Canada's water and wastewater sector is one of the most regulated and technically demanding in the country.
              The only study resources available were dense government manuals, expensive in-person courses built on decade-old slides,
              and American exam apps that referenced the wrong regulations entirely. Echelon was built to fix that.
            </p>
          </div>
          </FadeUp>

          {/* Two-column: story + timeline */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 24, marginBottom: 48 }}>

            {/* Story card */}
            <div style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 16, padding: "28px 24px" }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: "#60A5FA", letterSpacing: "0.08em", textTransform: "uppercase" as const, marginBottom: 14 }}>The Curriculum</div>
              <p style={{ fontSize: 14, color: "rgba(255,255,255,0.7)", lineHeight: 1.8, margin: "0 0 16px" }}>
                Every question is mapped to each province's regulatory framework. Every visual module lets you see and interact with real treatment processes — not just read about them.
              </p>
              <p style={{ fontSize: 14, color: "rgba(255,255,255,0.7)", lineHeight: 1.8, margin: 0 }}>
                The AI Tutor is trained on Canadian regulatory content and can explain why a CT value matters, how to calculate a chlorine dose for a specific flow rate, or what provincial regulations require for turbidity monitoring.
              </p>
              <div style={{ marginTop: 20, paddingTop: 20, borderTop: "1px solid rgba(255,255,255,0.08)", fontSize: 12, color: "rgba(255,255,255,0.4)" }}>
                Curriculum based on O. Reg. 170/03 · 128/04 · 129/04 · OWWCO · EOCP
              </div>
            </div>

            {/* Timeline */}
            <div style={{ display: "flex", flexDirection: "column" as const, gap: 16 }}>
              {[
                { year: "2025", title: "The Gap Identified", body: "Ay Bello, an Environmental Engineer (EIT) and Master's student in Digital Transformation at the University of Ottawa, identified a clear gap — operators were studying for technically demanding exams with resources that hadn't evolved in decades." },
                { year: "Early 2026", title: "Built from Scratch", body: "Interactive SVG process diagrams, an adaptive practice engine, an AI tutor with confidence scoring and pattern detection, and a career path map based on real 2025 OCWA data." },
                { year: "2026", title: "Platform Launched", body: "500+ OIT practice questions, 10 study modules, process diagrams for drinking water and wastewater, pumping systems, lab and sampling, and a formula reference — launching in Ontario with BC and Alberta coming next." },
              ].map((item, i) => (
                <div key={i} style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 14, padding: "18px 20px", display: "flex", gap: 16, alignItems: "flex-start" }}>
                  <div style={{ flexShrink: 0, background: "linear-gradient(135deg, #1D4ED8, #0F766E)", borderRadius: 8, padding: "4px 10px", fontSize: 10, fontWeight: 800, color: "#fff", whiteSpace: "nowrap" as const }}>{item.year}</div>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: "#fff", marginBottom: 4 }}>{item.title}</div>
                    <p style={{ fontSize: 12, color: "rgba(255,255,255,0.55)", lineHeight: 1.7, margin: 0 }}>{item.body}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Values row */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16 }}>
            {[
              { icon: "🍁", title: "Canada-First", body: "Every question, regulation, and process description is specific to each province's framework. No American content repurposed for Canadian exams." },
              { icon: "🧠", title: "Understand, Don't Memorize", body: "The AI Tutor explains the why behind every answer — CT values, dosing calculations, turbidity monitoring requirements." },
              { icon: "📈", title: "Career-Long Learning", body: "From OIT through Class 4. Content that grows with your career and supports every certification level." },
            ].map(v => (
              <div key={v.title} style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 14, padding: "22px 20px" }}>
                <div style={{ fontSize: 28, marginBottom: 10 }}>{v.icon}</div>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#fff", marginBottom: 8 }}>{v.title}</div>
                <p style={{ fontSize: 12, color: "rgba(255,255,255,0.55)", lineHeight: 1.7, margin: 0 }}>{v.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Coming Soon: BC & Alberta ── */}
      <section style={{
        background: "#0F172A",
        borderTop: "1px solid rgba(255,255,255,0.06)",
        padding: "72px 24px",
      }}>
        <div style={{ maxWidth: 960, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 48 }}>
            <div style={{
              display: "inline-flex", alignItems: "center", gap: 8,
              background: "rgba(52,211,153,0.12)",
              border: "1px solid rgba(52,211,153,0.3)",
              borderRadius: 20, padding: "5px 16px", marginBottom: 18,
            }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: "#34D399", letterSpacing: "0.08em", textTransform: "uppercase" as const }}>✓ Now Live Nationally</span>
            </div>
            <h2 style={{ fontSize: "clamp(22px, 3vw, 36px)", fontWeight: 800, color: "#FFFFFF", letterSpacing: "-0.02em", margin: "0 0 14px 0" }}>
              WPI Exam Prep Now Available
            </h2>
            <p style={{ fontSize: 16, color: "rgba(255,255,255,0.55)", maxWidth: 600, margin: "0 auto" }}>
              BC, Alberta, Saskatchewan, and Manitoba operators can now practice with our WPI-aligned question banks.
              Over 4,000 questions across 8 WPI courses — Class I–IV Water and Class I–IV Wastewater — all live now.
            </p>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 16, marginBottom: 48 }}>
            {[
              {
                flag: "🏔️",
                province: "British Columbia",
                certBody: "EOCP",
                operators: "~4,200 certified operators",
                color: "#0891B2",
                colorBg: "rgba(8,145,178,0.1)",
                colorBorder: "rgba(8,145,178,0.25)",
              },
              {
                flag: "🛢️",
                province: "Alberta",
                certBody: "AWWOA",
                operators: "~2,071 certified operators",
                color: "#7C3AED",
                colorBg: "rgba(124,58,237,0.1)",
                colorBorder: "rgba(124,58,237,0.25)",
              },
              {
                flag: "🌾",
                province: "Saskatchewan",
                certBody: "SAHO",
                operators: "~800 certified operators",
                color: "#D97706",
                colorBg: "rgba(217,119,6,0.1)",
                colorBorder: "rgba(217,119,6,0.25)",
              },
              {
                flag: "🦬",
                province: "Manitoba",
                certBody: "MWWA",
                operators: "~600 certified operators",
                color: "#059669",
                colorBg: "rgba(5,150,105,0.1)",
                colorBorder: "rgba(5,150,105,0.25)",
              },
            ].map(p => (
              <div key={p.province} style={{
                background: p.colorBg,
                border: `1px solid ${p.colorBorder}`,
                borderRadius: 16, padding: "24px 20px",
                position: "relative" as const,
              }}>
                <div style={{
                  position: "absolute" as const, top: 14, right: 14,
                  background: "rgba(52,211,153,0.15)",
                  borderRadius: 8, padding: "3px 10px",
                  fontSize: 10, fontWeight: 700, color: "#34D399",
                  letterSpacing: "0.06em", textTransform: "uppercase" as const,
                }}>✓ Live</div>
                <div style={{ fontSize: 28, marginBottom: 10 }}>{p.flag}</div>
                <h3 style={{ fontSize: 16, fontWeight: 800, color: "#FFFFFF", margin: "0 0 4px 0" }}>{p.province}</h3>
                <div style={{ fontSize: 12, fontWeight: 600, color: p.color, marginBottom: 12 }}>{p.certBody} — WPI Exams</div>
                <div style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", marginBottom: 16 }}>{p.operators}</div>
                <a href="/wpi-class1-water" style={{ textDecoration: "none" }}>
                  <button
                    style={{
                      padding: "8px 16px", borderRadius: 8,
                      background: p.colorBorder,
                      border: `1px solid ${p.colorBorder}`,
                      color: p.color, fontSize: 12, fontWeight: 700,
                      cursor: "pointer", fontFamily: "inherit",
                    }}
                  >
                    Start Class I Practice →
                  </button>
                </a>
              </div>
            ))}
          </div>

          <div style={{ textAlign: "center" }}>
            <p style={{ fontSize: 14, color: "rgba(255,255,255,0.45)", marginBottom: 20 }}>
              All WPI question banks are aligned with the WPI Need-to-Know Criteria.
              Class I–IV Water and Class I–IV Wastewater — all 8 levels are now live.
            </p>
            <a href="/pricing" style={{ textDecoration: "none" }}>
              <button
                style={{
                  padding: "12px 32px", borderRadius: 10,
                  background: "linear-gradient(135deg, #0891B2, #7C3AED)",
                  color: "#fff", border: "none", fontSize: 14, fontWeight: 700,
                  cursor: "pointer", fontFamily: "inherit",
                  boxShadow: "0 4px 20px rgba(8,145,178,0.3)",
                }}
              >
                View WPI Pricing →
              </button>
            </a>
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
          <button style={{
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

      {/* ── Contact Section ── */}
      <ContactSection />

      {/* ── Footer ── */}
      <footer style={{
        background: "#0F172A",
        borderTop: "1px solid rgba(255,255,255,0.08)",
        padding: "32px 24px",
        textAlign: "center",
      }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10, marginBottom: 12 }}>
          <img
            src="https://d2xsxph8kpxj0f.cloudfront.net/310519663446228701/9KAR7mkGo7x7xavTEeEpiA/echelon-icon-v2_37a8727b.png"
            alt="Echelon Institute"
            style={{ height: 36, width: "auto", filter: "brightness(0) invert(1)" }}
          />
          <span style={{ fontSize: 14, fontWeight: 700, color: "#FFFFFF" }}>Echelon Institute</span>
        </div>
        <p style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", margin: "0 0 16px 0" }}>
          Canada's AI-powered exam prep platform for water and wastewater operators.
        </p>
        <div className="landing-footer-links" style={{ display: "flex", justifyContent: "center", gap: 24, flexWrap: "wrap" }}>
          {[
            { label: "AI Tutor Quiz", href: "/quiz" },
            { label: "Formula Sheet", href: "/formulas" },
            { label: "Drinking Water", href: "/process" },
            { label: "Wastewater", href: "/wastewater" },
            { label: "Career Map", href: "/career" },
            { label: "Pumping Systems", href: "/pumping" },
            { label: "Lab & Sampling", href: "/lab" },
            { label: "Flashcards", href: "/oit-water-flashcards" },
            { label: "Contact", href: "/#contact" },
          ].map(link => (
            <Link key={link.label} href={link.href}>
              <span style={{ fontSize: 12, color: "rgba(255,255,255,0.5)", cursor: "pointer", textDecoration: "none" }}>
                {link.label}
              </span>
            </Link>
          ))}
        </div>
      </footer>
    </div>
  );
}
