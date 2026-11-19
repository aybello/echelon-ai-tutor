import { Link, useSearch } from "wouter";
import { useEffect, useRef, useState, type FormEvent, type ReactNode } from "react";
import {
  ArrowRight,
  BookOpen,
  Calculator,
  Check,
  ChevronRight,
  ClipboardCheck,
  Gamepad2,
  GraduationCap,
  MapPin,
  MessageSquareText,
  Play,
} from "lucide-react";
import LandingNav from "@/components/LandingNav";
import { ECHELON_LOGO_URL } from "@/components/SiteNav";
import CoursePathHero from "@/components/CoursePathHero";
import StepSolution from "@/components/StepSolution";
import CourseFinder from "@/components/CourseFinder";
import TrustedOrganizations from "@/components/TrustedOrganizations";
import NationalWaitlistModal from "@/components/NationalWaitlistModal";
import ProvinceBanner from "@/components/ProvinceBanner";
import { usePageMeta } from "@/hooks/usePageMeta";
import { useStructuredData } from "@/hooks/useStructuredData";
import { landingPageSchemas } from "@/lib/structuredData";
import { customers } from "@/lib/trustedOrganizations";
import { trpc } from "@/lib/trpc";
import { getAnonymousAnalyticsId } from "@/lib/anonymousAnalytics";
import { getMarketingAttribution } from "@/lib/marketingAnalytics";
import { useProvince, type ProvinceId } from "@/hooks/useProvince";
import { useAuth } from "@/_core/hooks/useAuth";
import { INDIVIDUAL_REFUND_SUMMARY, REFUND_CONTACT_EMAIL } from "@shared/refundPolicy";
import type { ExamFamily } from "@shared/courseRegistry";
import { CEU_COURSES } from "@shared/ceuCourses";
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
    <aside className="homepage-workspace" aria-label="Example worked solution from the study tools">
      <div className="homepage-workspace-topbar">
        <div className="homepage-workspace-product"><img className="homepage-workspace-logo" src={ECHELON_LOGO_URL} alt="" /><span>Echelon Institute</span></div>
        <span className="homepage-preview-badge">Example</span>
      </div>
      <div className="homepage-workspace-body">
        <span className="homepage-workspace-eyebrow">Worked calculation · Water Class I</span>
        <h2>Practice. Learn. Improve.</h2>
        <div className="homepage-example-question">
          <span>Flow rate conversion</span>
          <p>A plant treats 25 L/s. What is the daily flow in m³/d?</p>
          <strong>Answer: 2,160 m³/d</strong>
        </div>
        <StepSolution
          steps={[
            { l: "Relationship", c: "Q (m³/d) = Q (L/s) × 86.4" },
            { l: "Substitution", c: "Q = 25 × 86.4" },
            { l: "Result", c: "2,160 m³/d" },
          ]}
          tip="1 L/s = 86.4 m³/d."
        />
        <Link href="/formulas" className="homepage-example-link">Explore the formula library <ArrowRight size={15} aria-hidden="true" /></Link>
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
  usePageMeta({
    title: "AI-Powered Exam Prep for Skilled Trades",
    description: "AI-powered exam prep for the skilled-trades workforce, starting with water and wastewater. Canadian courses and supported US preparation, plus free Ontario 309A practice and mock exams.",
    keywords: "skilled trades exam prep, AI-powered exam prep, Ontario 309A electrician, water operator exam prep, OIT exam, wastewater certification, operator practice questions, WPI exam prep, water quality analyst, ABC certification",
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
              <div className="homepage-customer-proof">
                <span>Used by operators at</span>
                <div className="homepage-customer-names">{customers.map((organization) => <strong key={organization.slug}>{organization.name}</strong>)}</div>
              </div>
              <div className="homepage-hero-actions">
                <a className="homepage-primary-button" href="#find-course">Find your course <ArrowRight size={18} aria-hidden="true" /></a>
                <Link href="/teams" className="homepage-secondary-button">Explore team plans <ArrowRight size={17} aria-hidden="true" /></Link>
                <button ref={previewTriggerRef} type="button" className="homepage-preview-button" aria-expanded={showOitPreviewChoice} aria-controls="oit-preview-choice" onClick={() => setShowOitPreviewChoice((value) => !value)}>
                  <Play size={14} fill="currentColor" aria-hidden="true" /> Try 15 free questions (OIT)
                </button>
              </div>
              <p className="homepage-hero-note">Choose your province, system and level. No account required to start the OIT free preview.</p>
              <p className="homepage-preview-inclusions">For new learners, the free OIT preview includes 15 practice questions, 50 flashcards, 30 mock questions and 3 AI Tutor messages.</p>
              {showOitPreviewChoice && <PreviewChoice onClose={closePreviewChoice} />}
            </CoursePathHero>
          </div>
          <div className="homepage-hero-visual">
            <StudyWorkspacePreview />
          </div>
        </section>

        <TrustedOrganizations />

        <section id="tools" className="homepage-section homepage-tools-section" aria-labelledby="homepage-tools-title">
          <div className="homepage-section-heading homepage-section-heading-left">
            <span className="homepage-kicker">More than a question bank</span>
            <h2 id="homepage-tools-title">Learn it. Practise it. Put it to the test.</h2>
            <p>Ask the AI tutor to explain a difficult concept. Practise with games, flashcards and questions, then test yourself under exam conditions. Keep developing your skills with self-paced continuing education. Choose your course for its available tools.</p>
          </div>
          <div className="homepage-tool-grid">
            <ToolCard icon={<MessageSquareText size={21} aria-hidden="true" />} title="AI tutor: get unstuck" description="Ask follow-up questions and work through concepts and calculations. Try the tutor in Water OIT practice." href="/quiz" />
            <ToolCard icon={<Gamepad2 size={21} aria-hidden="true" />} title="Interactive learning games" description="Match processes, spot mistakes and practise cause and effect. Explore the Water OIT games." href="/courses/oit/interactive" />
            <ToolCard icon={<BookOpen size={21} aria-hidden="true" />} title="Practice with explanations" description="Understand why an answer is right, not just whether you got it right. Try the Water OIT preview." href="/quiz" />
            <ToolCard icon={<Calculator size={21} aria-hidden="true" />} title="Work through the maths" description="Follow worked examples and keep the formulas behind the answer in reach." href="/formulas" />
            <ToolCard icon={<ClipboardCheck size={21} aria-hidden="true" />} title="Rehearse the exam" description="Practise pacing and review your results. Start with the Water OIT timed mock preview." href="/oit-mock" />
            <ToolCard icon={<GraduationCap size={21} aria-hidden="true" />} title="Continuing education courses" description={`${CEU_COURSES.length} self-paced operator courses with lessons, saved progress and final assessments. Explore non-credit pilot learning beyond exam prep.`} href="/continuing-education" />
          </div>
          <p className="homepage-hero-note">Six game modes turn revision into active practice. Water OIT and Ontario Class 1 Water also include five deeper games, from Calculation Ladder to Exam Escape Room. Flashcards, study notes and progress tools are available through your course workspace. Continuing education courses are non-credit pilots; no approved CEUs, accreditation or regulatory recognition are awarded.</p>
        </section>

        <section className="homepage-proof-strip" aria-label="Echelon platform facts">
          <div><strong>AI tutoring</strong><span>explanations you can ask questions about</span></div>
          <div><strong>Interactive practice</strong><span>learn by solving, not just reading</span></div>
          <div><strong>Canada + U.S.</strong><span>course-specific certification preparation</span></div>
          <div><strong>Continuing education</strong><span>{CEU_COURSES.length} self-paced non-credit pilot courses</span></div>
        </section>

        <section id="courses" className="homepage-finder-section" aria-label="Find your certification course">
          <span id="find-course" className="homepage-anchor-target" aria-hidden="true" />
          <div className="homepage-finder-intro"><span className="homepage-kicker"><MapPin size={14} aria-hidden="true" /> Course matching</span><p>Start with the exact route that fits where you write your exam.</p></div>
          <CourseFinder initialProvince={province} onCourseSelected={recordCourseBrowse} />
          <button type="button" className="homepage-waitlist-link" onClick={() => setNationalWaitlistOpen(true)}>Need a course path that is not listed? Join the update list <ArrowRight size={15} aria-hidden="true" /></button>
        </section>

        <section id="teams" className="homepage-team-section" aria-labelledby="homepage-team-title">
          <div className="homepage-team-content">
            <span className="homepage-kicker">For utilities and employers</span>
            <h2 id="homepage-team-title">See who is practising. Know where to support them.</h2>
            <p>Give each operator a structured path to their next exam. Review individual assessment sessions, results and topic gaps so training conversations start with evidence, not guesswork.</p>
            <Link href="/teams" className="homepage-primary-button">Explore team training <ArrowRight size={17} aria-hidden="true" /></Link>
          </div>
          <div className="homepage-team-preview" aria-label="Illustrative team training overview">
            <div><span>Team training overview</span><small>Illustrative preview</small></div>
            <dl><div><dt>Participation</dt><dd>Assessment activity</dd></div><div><dt>Performance</dt><dd>Results by learner</dd></div><div><dt>Support</dt><dd>Topic gaps</dd></div></dl>
            <p><Check size={15} aria-hidden="true" /> Follow each assigned operator's preparation in one place.</p>
          </div>
        </section>

        <section id="faq" className="homepage-section homepage-faq-section" aria-labelledby="homepage-faq-title">
          <div className="homepage-section-heading"><span className="homepage-kicker">Before you start</span><h2 id="homepage-faq-title">A few useful answers.</h2></div>
          <div className="homepage-faq-list">
            <FaqItem question="Can I try a course before I buy?" answer="Yes. Paid operator courses include a free practice preview without an account or credit card. Ontario 309A practice and mock exams are free." />
            <FaqItem question="How does course access work?" answer="For paid operator courses, an Individual Exam Pass provides 12 months of access to one selected course from successful payment, or access can come through an assigned team licence. Ontario 309A practice and mock exams are free." />
            <FaqItem question="Do the questions match the real exam?" answer="The question banks are designed around relevant exam blueprints and reviewed through Echelon's content-quality process. Echelon is an independent preparation provider; confirm current requirements with your certifying authority." />
            <FaqItem question="What is included in a course?" answer="Echelon brings together practice questions with explanations, AI tutoring, timed mock exams, flashcards, study notes, formulas and progress tracking. Interactive learning games add another way to practise. Open your course to see its available tools; Ontario 309A currently offers free practice and mock exams. Continuing education courses offer separate self-paced non-credit pilot learning and do not award approved CEUs or regulatory recognition. The pricing page confirms paid-course inclusions and access before checkout." />
            <FaqItem question="Can I get a refund?" answer={`${INDIVIDUAL_REFUND_SUMMARY} Email ${REFUND_CONTACT_EMAIL} with your purchase email and Stripe receipt.`} />
          </div>
        </section>

        <BlogPreviewSection />
        <ContactSection />
      </main>

      <footer className="homepage-footer">
        <div className="homepage-footer-main">
          <div className="homepage-footer-brand"><img className="homepage-footer-logo" src={ECHELON_LOGO_URL} alt="Echelon Institute logo" /><div><strong>Echelon Institute</strong><p>AI-powered exam preparation, interactive learning and continuing education for the skilled-trades workforce, starting with water and wastewater.</p></div></div>
          <div className="homepage-footer-links">
            <div><strong>Explore</strong><Link href="/#find-course">Find your course</Link><Link href="/continuing-education">Continuing education</Link><Link href="/guides">Study guides</Link><Link href="/formulas">Formula library</Link></div>
            <div><strong>Teams</strong><Link href="/teams">Team training</Link><Link href="/partnerships">Partnerships</Link><Link href="/jobs">Jobs</Link></div>
            <div><strong>Support</strong><Link href="/about">About Echelon</Link><Link href="/refund">Refund policy</Link><Link href="/privacy">Privacy</Link><Link href="/terms">Terms</Link></div>
          </div>
        </div>
        <div className="homepage-footer-bottom"><span>© {new Date().getFullYear()} Echelon Institute. All rights reserved.</span><span>Independent preparation provider. Confirm current requirements with your certifying authority. Not affiliated with MOECP, OWWCO, EOCP, WPI, ABC, or any state certifying authority.</span></div>
      </footer>
    </div>
  );
}
