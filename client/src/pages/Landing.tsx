import { Link, useSearch } from "wouter";
import { useEffect, useRef, useState, type FormEvent, type ReactNode } from "react";
import {
  ArrowRight,
  BookOpen,
  Calculator,
  Check,
  ChevronRight,
  ClipboardCheck,
  GraduationCap,
  MapPin,
  MessageSquareText,
  Play,
} from "lucide-react";
import LandingNav from "@/components/LandingNav";
import { ECHELON_LOGO_URL } from "@/components/SiteNav";
import CoursePathHero from "@/components/CoursePathHero";
import CourseFinder from "@/components/CourseFinder";
import NationalWaitlistModal from "@/components/NationalWaitlistModal";
import ProvinceBanner from "@/components/ProvinceBanner";
import { usePageMeta } from "@/hooks/usePageMeta";
import { useStructuredData } from "@/hooks/useStructuredData";
import { landingPageSchemas } from "@/lib/structuredData";
import { trpc } from "@/lib/trpc";
import { getAnonymousAnalyticsId } from "@/lib/anonymousAnalytics";
import { getMarketingAttribution } from "@/lib/marketingAnalytics";
import { useProvince, type ProvinceId } from "@/hooks/useProvince";
import { useAuth } from "@/_core/hooks/useAuth";
import { INDIVIDUAL_REFUND_SUMMARY, REFUND_CONTACT_EMAIL } from "@shared/refundPolicy";
import type { ExamFamily } from "@shared/courseRegistry";
import { useGeoRegion } from "@/hooks/useGeoRegion";
import "./Landing.css";

function PreviewChoice({ onClose }: { onClose: () => void }) {
  return (
    <div id="oit-preview-choice" className="homepage-preview-choice" aria-label="Choose an OIT practice preview">
      <div className="homepage-preview-choice-heading">
        <div>
          <span className="homepage-kicker">Choose a preview</span>
          <strong>Which operator path would you like to explore?</strong>
        </div>
        <button type="button" onClick={onClose} aria-label="Close practice preview options">Close</button>
      </div>
      <div className="homepage-preview-choice-grid">
        <Link href="/quiz" className="homepage-preview-path">
          <BookOpen size={18} aria-hidden="true" />
          <span><strong>Water OIT</strong><small>Start with 15 free questions</small></span>
          <ChevronRight size={17} aria-hidden="true" />
        </Link>
        <Link href="/oit-ww" className="homepage-preview-path">
          <GraduationCap size={18} aria-hidden="true" />
          <span><strong>Wastewater OIT</strong><small>Start with 15 free questions</small></span>
          <ChevronRight size={17} aria-hidden="true" />
        </Link>
      </div>
    </div>
  );
}

function StudyWorkspacePreview() {
  return (
    <aside className="homepage-workspace" aria-label="Illustrative OIT Water study workspace preview">
      <div className="homepage-workspace-topbar">
        <div className="homepage-workspace-product"><img className="homepage-workspace-logo" src={ECHELON_LOGO_URL} alt="Echelon Institute logo" /><span>Echelon Institute</span></div>
        <span className="homepage-preview-badge">Preview</span>
      </div>
      <div className="homepage-workspace-body">
        <div className="homepage-workspace-title-row">
          <div>
            <span className="homepage-workspace-eyebrow">OIT Water</span>
            <h2>Your study workspace</h2>
          </div>
          <span className="homepage-workspace-status"><span aria-hidden="true" /> Ready to study</span>
        </div>
        <div className="homepage-workspace-grid">
          <section className="homepage-readiness" aria-label="Illustrative readiness by topic">
            <div className="homepage-panel-heading"><span>Readiness by topic</span><strong>Illustrative</strong></div>
            {[
              ["Treatment fundamentals", "78%", 78],
              ["Calculations", "62%", 62],
              ["Safety & regulations", "84%", 84],
            ].map(([label, value, width]) => (
              <div className="homepage-readiness-row" key={label as string}>
                <div><span>{label}</span><strong>{value}</strong></div>
                <span className="homepage-progress-track"><span style={{ width: `${width}%` }} /></span>
              </div>
            ))}
          </section>
          <section className="homepage-question-card" aria-label="Illustrative worked question">
            <div className="homepage-question-card-top"><span>Worked question</span><span>Calculation</span></div>
            <p>A plant treats 4.2 ML/day. What should you check before calculating contact time?</p>
            <div className="homepage-answer-choice"><span>A</span><strong>Confirm the flow units and basin volume.</strong></div>
            <div className="homepage-explanation"><Calculator size={16} aria-hidden="true" /><span><strong>Step 1.</strong> Confirm the flow units and basin volume. The worked solution then shows the conversion before applying the formula.</span></div>
          </section>
        </div>
        <div className="homepage-workspace-tools" aria-label="Available study modes">
          <div><BookOpen size={16} aria-hidden="true" /><span><strong>Practice</strong><small>Target weak topics</small></span></div>
          <div><Calculator size={16} aria-hidden="true" /><span><strong>Math</strong><small>Work step by step</small></span></div>
          <div><ClipboardCheck size={16} aria-hidden="true" /><span><strong>Mock exam</strong><small>Build exam stamina</small></span></div>
        </div>
      </div>
    </aside>
  );
}

function ToolCard({ icon, title, description, href }: { icon: ReactNode; title: string; description: string; href: string }) {
  return (
    <Link href={href} className="homepage-tool-card">
      <span className="homepage-tool-icon">{icon}</span>
      <span><strong>{title}</strong><small>{description}</small></span>
      <ArrowRight size={17} aria-hidden="true" />
    </Link>
  );
}

function FaqItem({ question, answer }: { question: string; answer: string }) {
  const [open, setOpen] = useState(false);
  return (
    <article className="homepage-faq-item">
      <h3><button type="button" onClick={() => setOpen((value) => !value)} aria-expanded={open}>
        <span>{question}</span><span aria-hidden="true" className={open ? "is-open" : ""}>+</span>
      </button></h3>
      {open && <p>{answer}</p>}
    </article>
  );
}

function BlogPreviewSection() {
  const { data: allPosts } = trpc.blog.listPosts.useQuery();
  const posts = (allPosts ?? []).slice(0, 3);
  if (posts.length === 0) return null;

  return (
    <section className="homepage-section homepage-blog-section" aria-labelledby="homepage-blog-title">
      <div className="homepage-section-heading">
        <span className="homepage-kicker">From the resource library</span>
        <h2 id="homepage-blog-title">Built for the work behind the exam.</h2>
        <p>Clear, practical study guides for water and wastewater operators.</p>
      </div>
      <div className="homepage-blog-grid">
        {posts.map((post: { slug: string; title: string; excerpt: string; tags: string | null; readingTimeMinutes: number }) => (
          <Link key={post.slug} href={`/blog/${post.slug}`} className="homepage-blog-card">
            <span>{post.tags?.split(",")[0]?.trim() || "Study guide"}</span>
            <h3>{post.title}</h3>
            <p>{post.excerpt.slice(0, 150)}{post.excerpt.length > 150 ? "…" : ""}</p>
            <small>{post.readingTimeMinutes} min read <ArrowRight size={14} aria-hidden="true" /></small>
          </Link>
        ))}
      </div>
      <Link href="/blog" className="homepage-text-link">Explore all study guides <ArrowRight size={16} aria-hidden="true" /></Link>
    </section>
  );
}

function ContactSection() {
  const [form, setForm] = useState({ name: "", email: "", subject: "", message: "" });
  const [fieldErrors, setFieldErrors] = useState({ name: "", email: "", subject: "", message: "" });
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");
  const sendContact = trpc.contact.send.useMutation({
    onSuccess: () => setSubmitted(true),
    onError: (err) => setError(err.message || "We could not send that message. Please try again."),
  });

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    const nextErrors = {
      name: form.name.trim() ? "" : "Enter your name.",
      email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim()) ? "" : "Enter a valid email address.",
      subject: form.subject ? "" : "Choose a topic.",
      message: form.message.trim().length >= 10 ? "" : "Enter at least 10 characters so we can help.",
    };
    setFieldErrors(nextErrors);
    if (Object.values(nextErrors).some(Boolean)) {
      return;
    }
    sendContact.mutate(form);
  };

  const updateField = (field: keyof typeof form, value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
    setFieldErrors((current) => ({ ...current, [field]: "" }));
  };

  return (
    <section id="contact" className="homepage-section homepage-contact-section" aria-labelledby="homepage-contact-title">
      <div className="homepage-contact-copy">
        <span className="homepage-kicker">Talk to Echelon</span>
        <h2 id="homepage-contact-title">Questions about your course or team?</h2>
        <p>Get help with a certification path, course access, or team training. We reply within one business day.</p>
        <a href="mailto:abello@echeloninstitute.ca" className="homepage-text-link">abello@echeloninstitute.ca <ArrowRight size={16} aria-hidden="true" /></a>
      </div>
      <div className="homepage-contact-card">
        {submitted ? (
          <div className="homepage-contact-success"><Check size={25} aria-hidden="true" /><h3>Message received</h3><p>Thank you. We will reply within one business day.</p><button type="button" onClick={() => { setSubmitted(false); setForm({ name: "", email: "", subject: "", message: "" }); }}>Send another message</button></div>
        ) : (
          <form onSubmit={submit} noValidate>
            <div className="homepage-contact-row">
              <label>Name<input value={form.name} onChange={(event) => updateField("name", event.target.value)} autoComplete="name" aria-invalid={Boolean(fieldErrors.name)} aria-describedby={fieldErrors.name ? "contact-name-error" : undefined} />{fieldErrors.name && <span id="contact-name-error" className="homepage-field-error">{fieldErrors.name}</span>}</label>
              <label>Email<input value={form.email} onChange={(event) => updateField("email", event.target.value)} type="email" autoComplete="email" aria-invalid={Boolean(fieldErrors.email)} aria-describedby={fieldErrors.email ? "contact-email-error" : undefined} />{fieldErrors.email && <span id="contact-email-error" className="homepage-field-error">{fieldErrors.email}</span>}</label>
            </div>
            <label>How can we help?<select value={form.subject} onChange={(event) => updateField("subject", event.target.value)} aria-invalid={Boolean(fieldErrors.subject)} aria-describedby={fieldErrors.subject ? "contact-subject-error" : undefined}><option value="">Select a topic</option><option value="Course Question">Course question</option><option value="Certification Help">Certification help</option><option value="Technical Support">Technical support</option><option value="Billing & Payments">Billing and payments</option><option value="Partnership Inquiry">Partnership inquiry</option><option value="Other">Other</option></select>{fieldErrors.subject && <span id="contact-subject-error" className="homepage-field-error">{fieldErrors.subject}</span>}</label>
            <label>Message <small>At least 10 characters</small><textarea value={form.message} onChange={(event) => updateField("message", event.target.value)} rows={4} aria-invalid={Boolean(fieldErrors.message)} aria-describedby={fieldErrors.message ? "contact-message-error" : undefined} />{fieldErrors.message && <span id="contact-message-error" className="homepage-field-error">{fieldErrors.message}</span>}</label>
            {error && <p role="alert" className="homepage-contact-error">{error}</p>}
            <button type="submit" className="homepage-primary-button" disabled={sendContact.isPending}>{sendContact.isPending ? "Sending…" : "Send message"}<ArrowRight size={17} aria-hidden="true" /></button>
          </form>
        )}
      </div>
    </section>
  );
}

export default function Landing() {
  const { isUS } = useGeoRegion();
  usePageMeta({
    title: "Water & Wastewater Operator Exam Prep",
    description: isUS
      ? "Exam preparation for US water and wastewater operators. Practice questions, worked calculations, timed mock exams and study tools."
      : "Water and wastewater operator exam preparation. Start with 15 free questions and choose the certification path that fits your province and level.",
    keywords: "water operator exam prep, OIT exam, wastewater certification, operator practice questions, WPI exam prep, water quality analyst, ABC certification",
    path: "/",
  });
  useStructuredData(landingPageSchemas);

  const { province: storedProvince, showPrompt, setProvince, dismiss } = useProvince();
  const search = useSearch();
  const routeProvince = new URLSearchParams(search).get("province")?.toLowerCase();
  const province: ProvinceId | null = routeProvince === "on" || routeProvince === "bc" || routeProvince === "ab" || routeProvince === "sk" || routeProvince === "mb" || routeProvince === "ns" ? routeProvince : storedProvince;
  const { isAuthenticated } = useAuth();
  const dashboardMe = trpc.dashboardAuth.me.useQuery(undefined, { retry: false, staleTime: 5 * 60 * 1000 });
  const updateProvinceMutation = trpc.auth.updateProvince.useMutation();
  const trackCourseSelection = trpc.funnelAnalytics.track.useMutation();
  const isSignedIn = isAuthenticated || !!dashboardMe.data?.email;
  const [showOitPreviewChoice, setShowOitPreviewChoice] = useState(false);
  const [nationalWaitlistOpen, setNationalWaitlistOpen] = useState(false);
  const previewTriggerRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const encodedFragment = window.location.hash.slice(1);
    if (!encodedFragment) return;
    let fragment: string;
    try {
      fragment = decodeURIComponent(encodedFragment);
    } catch {
      return;
    }
    const target = document.getElementById(fragment);
    if (!target) return;
    requestAnimationFrame(() => target.scrollIntoView({ block: "start" }));
  }, []);

  const handleProvinceSelect = (id: ProvinceId) => {
    setProvince(id);
    if (isAuthenticated) updateProvinceMutation.mutate({ province: id });
  };

  const closePreviewChoice = () => {
    setShowOitPreviewChoice(false);
    requestAnimationFrame(() => previewTriggerRef.current?.focus());
  };

  const recordCourseBrowse = ({ courseKey, examFamily }: { courseKey: string; examFamily: ExamFamily }) => {
    // Selecting a course on the homepage is research, not purchase intent.
    // The pricing buy button remains the only product_selected emission.
    trackCourseSelection.mutate({
      event: "course_browsed",
      courseKey,
      surface: "course_card",
      visitorId: getAnonymousAnalyticsId(),
      ...getMarketingAttribution("/"),
      province: examFamily === "ontario" ? "ontario" : "western",
    });
  };

  return (
    <div className="echelon-homepage">
      {nationalWaitlistOpen && <NationalWaitlistModal defaultProvince="" onClose={() => setNationalWaitlistOpen(false)} />}
      <LandingNav
        isAuthenticated={isSignedIn}
        currentPath="/"
        rightSlot={<a className="homepage-get-started" href="#find-course">Get started <ArrowRight size={14} aria-hidden="true" /></a>}
      />
      {showPrompt && <ProvinceBanner onSelect={handleProvinceSelect} onDismiss={dismiss} />}

      <main>
        <section className="homepage-hero" aria-labelledby="homepage-hero-title">
          <div className="homepage-hero-copy">
            <CoursePathHero>
              <div className="homepage-hero-actions">
                <a className="homepage-primary-button" href="#find-course">Find your course <ArrowRight size={18} aria-hidden="true" /></a>
                <button ref={previewTriggerRef} type="button" className="homepage-secondary-button" aria-expanded={showOitPreviewChoice} aria-controls="oit-preview-choice" onClick={() => setShowOitPreviewChoice((value) => !value)}>
                  <Play size={16} fill="currentColor" aria-hidden="true" /> Try 15 free questions
                </button>
              </div>
              <p className="homepage-hero-note">Choose your province, system and level. No account required to start the free preview.</p>
              <p className="homepage-preview-inclusions">Free OIT preview includes 15 practice questions, 50 flashcards, 30 mock questions and 3 AI Tutor messages.</p>
              {showOitPreviewChoice && <PreviewChoice onClose={closePreviewChoice} />}
            </CoursePathHero>
          </div>
          <StudyWorkspacePreview />
        </section>

        <section className="homepage-proof-strip" aria-label="Echelon platform facts">
          <div><strong>39</strong><span>active course paths</span></div>
          <div><strong>15</strong><span>free questions to try</span></div>
          <div><strong>Canada + U.S.</strong><span>study contexts supported</span></div>
          <div><strong>Practice to mock</strong><span>one study workspace</span></div>
        </section>

        <section id="courses" className="homepage-finder-section" aria-label="Find your certification course">
          <span id="find-course" className="homepage-anchor-target" aria-hidden="true" />
          <div className="homepage-finder-intro"><span className="homepage-kicker"><MapPin size={14} aria-hidden="true" /> Course matching</span><p>Start with the exact route that fits where you write your exam.</p></div>
          <CourseFinder initialProvince={province} onCourseSelected={recordCourseBrowse} />
          <button type="button" className="homepage-waitlist-link" onClick={() => setNationalWaitlistOpen(true)}>Need a course path that is not listed? Join the update list <ArrowRight size={15} aria-hidden="true" /></button>
        </section>

        <section id="tools" className="homepage-section homepage-tools-section" aria-labelledby="homepage-tools-title">
          <div className="homepage-section-heading homepage-section-heading-left">
            <span className="homepage-kicker">A better way to study</span>
            <h2 id="homepage-tools-title">The tools that turn preparation into a routine.</h2>
            <p>Work through questions, calculations and exam conditions with the same course context carried through each study mode.</p>
          </div>
          <div className="homepage-tool-grid">
            <ToolCard icon={<BookOpen size={21} aria-hidden="true" />} title="Practice questions" description="Review course-specific questions and explanations." href="/quiz" />
            <ToolCard icon={<Calculator size={21} aria-hidden="true" />} title="Formula library" description="Keep core operator calculations in reach." href="/formulas" />
            <ToolCard icon={<ClipboardCheck size={21} aria-hidden="true" />} title="Mock exams" description="Build confidence under timed conditions." href="/oit-mock" />
            <ToolCard icon={<MessageSquareText size={21} aria-hidden="true" />} title="Study guides" description="Connect concepts to process and equipment." href="/guides" />
          </div>
        </section>

        <section id="teams" className="homepage-team-section" aria-labelledby="homepage-team-title">
          <div className="homepage-team-content">
            <span className="homepage-kicker">For utilities and employers</span>
            <h2 id="homepage-team-title">Keep operator learning visible without making training harder to manage.</h2>
            <p>Teams can give operators structured preparation while managers have a clear view of assigned learning and readiness.</p>
            <Link href="/teams" className="homepage-primary-button">Explore team training <ArrowRight size={17} aria-hidden="true" /></Link>
          </div>
          <div className="homepage-team-preview" aria-label="Illustrative team training overview">
            <div><span>Team training overview</span><small>Illustrative preview</small></div>
            <dl><div><dt>Assigned operators</dt><dd>8 / 10</dd></div><div><dt>Active this week</dt><dd>6</dd></div><div><dt>Study plans in progress</dt><dd>5</dd></div></dl>
            <p><Check size={15} aria-hidden="true" /> Course-specific learning paths for each assigned operator.</p>
          </div>
        </section>

        <section id="faq" className="homepage-section homepage-faq-section" aria-labelledby="homepage-faq-title">
          <div className="homepage-section-heading"><span className="homepage-kicker">Before you start</span><h2 id="homepage-faq-title">A few useful answers.</h2></div>
          <div className="homepage-faq-list">
            <FaqItem question="Can I try a course before I buy?" answer="Yes. Start from the homepage to try a free practice preview before you decide on course access." />
            <FaqItem question="How does course access work?" answer="Individuals purchase a twelve-month Exam Pass for one selected certification course after successful payment. Teams have separate access options for assigned operators." />
            <FaqItem question="Do the questions match the real exam?" answer="The question banks are designed around relevant exam blueprints and reviewed through Echelon's content-quality process. Echelon is an independent preparation provider; confirm current requirements with your certifying authority." />
            <FaqItem question="What is included in a course?" answer="Course inclusions and question totals vary. The pricing page lists the current question count, access term and study tools before checkout." />
            <FaqItem question="Can I get a refund?" answer={`${INDIVIDUAL_REFUND_SUMMARY} Email ${REFUND_CONTACT_EMAIL} with your purchase email and Stripe receipt.`} />
          </div>
        </section>

        <BlogPreviewSection />
        <ContactSection />
      </main>

      <footer className="homepage-footer">
        <div className="homepage-footer-main">
          <div className="homepage-footer-brand"><img className="homepage-footer-logo" src={ECHELON_LOGO_URL} alt="Echelon Institute logo" /><div><strong>Echelon Institute</strong><p>Operator certification preparation for water and wastewater professionals.</p></div></div>
          <div className="homepage-footer-links">
            <div><strong>Explore</strong><Link href="/#find-course">Find your course</Link><Link href="/guides">Study guides</Link><Link href="/formulas">Formula library</Link></div>
            <div><strong>Teams</strong><Link href="/teams">Team training</Link><Link href="/partnerships">Partnerships</Link><Link href="/jobs">Jobs</Link></div>
            <div><strong>Support</strong><Link href="/about">About Echelon</Link><Link href="/refund">Refund policy</Link><Link href="/privacy">Privacy</Link><Link href="/terms">Terms</Link></div>
          </div>
        </div>
        <div className="homepage-footer-bottom"><span>© {new Date().getFullYear()} Echelon Institute. All rights reserved.</span><span>Independent preparation provider. Confirm current requirements with your certifying authority. Not affiliated with MOECP, OWWCO, EOCP, WPI, ABC, or any state certifying authority.</span></div>
      </footer>
    </div>
  );
}
