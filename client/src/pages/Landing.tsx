import { Link, useSearch } from "wouter";
import { useEffect, useRef, useState, type FormEvent } from "react";
import {
  ArrowRight,
  BookOpen,
  Check,
  ChevronRight,
  ClipboardCheck,
  Gamepad2,
  GraduationCap,
  MessageSquareText,
  Play,
} from "lucide-react";
import LandingNav from "@/components/LandingNav";
import { ECHELON_LOGO_URL } from "@/components/SiteNav";
import CoursePathHero from "@/components/CoursePathHero";
import HomepageProductDemo from "@/components/HomepageProductDemo";
import HomepageCourseDiscovery from "@/components/HomepageCourseDiscovery";
import TrustedOrganizations from "@/components/TrustedOrganizations";
import NationalWaitlistModal from "@/components/NationalWaitlistModal";
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

  const { province: storedProvince } = useProvince();
  const search = useSearch();
  const routeProvince = new URLSearchParams(search).get("province")?.toLowerCase();
  const province: ProvinceId | null = routeProvince === "on" || routeProvince === "bc" || routeProvince === "ab" || routeProvince === "sk" || routeProvince === "mb" || routeProvince === "ns" ? routeProvince : storedProvince;
  const { isAuthenticated } = useAuth();
  const dashboardMe = trpc.dashboardAuth.me.useQuery(undefined, { retry: false, staleTime: 5 * 60 * 1000 });
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
      <main>
        <section className="homepage-hero" aria-labelledby="homepage-hero-title">
          <div className="homepage-hero-copy">
            <CoursePathHero>
              <div className="homepage-hero-actions">
                <a className="homepage-primary-button" href="#find-course">Find your course <ArrowRight size={18} aria-hidden="true" /></a>
                <Link href="/teams" className="homepage-secondary-button">Train your team <ArrowRight size={17} aria-hidden="true" /></Link>
              </div>
              <p className="homepage-hero-note">For your next exam. For the skills beyond it.</p>
            </CoursePathHero>
          </div>
          <div className="homepage-hero-visual">
            <HomepageProductDemo />
          </div>
        </section>

        <TrustedOrganizations />

        <section id="courses" className="homepage-finder-section" aria-label="Find your certification course">
          <span id="find-course" className="homepage-anchor-target" aria-hidden="true" />
          <HomepageCourseDiscovery initialProvince={province} onCourseSelected={recordCourseBrowse} />
          <div className="homepage-preview-entry">
            <button ref={previewTriggerRef} type="button" className="homepage-preview-button" aria-expanded={showOitPreviewChoice} aria-controls="oit-preview-choice" onClick={() => setShowOitPreviewChoice((value) => !value)}>
              <Play size={14} fill="currentColor" aria-hidden="true" /> New to the field? Try a free OIT preview
            </button>
            {showOitPreviewChoice && <>
              <PreviewChoice onClose={closePreviewChoice} />
              <p className="homepage-preview-inclusions">For new learners, the free OIT preview includes 15 practice questions, 50 flashcards, 30 mock questions and 3 AI Tutor messages. No account required to start.</p>
            </>}
          </div>
          <button type="button" className="homepage-waitlist-link" onClick={() => setNationalWaitlistOpen(true)}>Need a course path that is not listed? Join the update list <ArrowRight size={15} aria-hidden="true" /></button>
        </section>

        <section id="tools" className="homepage-section homepage-tools-section" aria-labelledby="homepage-tools-title">
          <div className="homepage-section-heading homepage-section-heading-left">
            <span className="homepage-kicker">More than a question bank</span>
            <h2 id="homepage-tools-title">Learn it. Practise it. Put it to the test.</h2>
            <p>One learning journey, from the concept that will not click to the question you can work through on your own.</p>
          </div>
          <div className="homepage-learning-stages">
            <article className="homepage-learning-stage">
              <div className="homepage-stage-top"><MessageSquareText size={24} aria-hidden="true" /><span>01 / Understand</span></div>
              <h3>Get past the part that stops you.</h3>
              <p>Ask the AI tutor follow-up questions. Break down calculations with worked solutions, then revisit the concepts in study notes and flashcards.</p>
              <ul><li>AI explanations you can question</li><li>Step-by-step calculation support</li><li>Study notes, formulas and flashcards</li></ul>
              <a href="#find-course" className="homepage-text-link">Find your learning workspace <ArrowRight size={16} aria-hidden="true" /></a>
            </article>
            <article className="homepage-learning-stage homepage-learning-stage-featured">
              <div className="homepage-stage-top"><Gamepad2 size={24} aria-hidden="true" /><span>02 / Practise by doing</span></div>
              <h3>Do more than read the answer.</h3>
              <p>Match processes, find the flaw and work through cause and effect. Interactive learning games turn concepts into decisions you make yourself.</p>
              <ul><li>Six active-revision game modes</li><li>Feedback that explains the answer</li><li>Deeper calculation and process challenges</li></ul>
              <Link href="/courses/oit/interactive" className="homepage-text-link">Explore Water OIT games <ArrowRight size={16} aria-hidden="true" /></Link>
            </article>
            <article className="homepage-learning-stage">
              <div className="homepage-stage-top"><ClipboardCheck size={24} aria-hidden="true" /><span>03 / Rehearse the exam</span></div>
              <h3>Find the gaps before exam day.</h3>
              <p>Practise with explanations, work against the clock in timed mock exams and use your results to decide what to study next.</p>
              <ul><li>Course-specific practice questions</li><li>Timed mock exams and review</li><li>Results and progress tracking</li></ul>
              <a href="#find-course" className="homepage-text-link">Choose your exam preparation <ArrowRight size={16} aria-hidden="true" /></a>
            </article>
          </div>
          <p className="homepage-availability-note">Tools vary by course. Water OIT and Ontario Class 1 Water also include five deeper games, from Calculation Ladder to Exam Escape Room. Ontario 309A offers free practice and mock exams, not interactive games.</p>
        </section>

        <section id="continuing-education" className="homepage-section homepage-education" aria-labelledby="homepage-education-title">
          <div className="homepage-education-copy">
            <span className="homepage-kicker"><GraduationCap size={17} aria-hidden="true" /> Continuing education</span>
            <h2 id="homepage-education-title">Your learning does not end at the exam.</h2>
            <p>{CEU_COURSES.length} self-paced operator courses. Build your understanding with structured lessons, saved progress and final assessments.</p>
            <Link href="/continuing-education" className="homepage-primary-button">Browse {CEU_COURSES.length} courses <ArrowRight size={17} aria-hidden="true" /></Link>
            <p className="homepage-education-disclosure">Available now as non-credit pilot courses. No approved CEUs, accreditation or regulatory recognition are awarded.</p>
          </div>
          <div className="homepage-education-subjects" aria-label="Examples from the continuing education catalogue">
            {CEU_COURSES.filter(course => ["ceu-basic-hydraulics", "ceu-chlorination-principles", "ceu-supervisor-essentials"].includes(course.key)).map(course => (
              <Link key={course.key} href={`/continuing-education/${course.key}`} className="homepage-education-course">
                <BookOpen size={21} aria-hidden="true" /><span><small>Self-paced operator learning</small><strong>{course.shortTitle}</strong><span>Lessons · Saved progress · Final assessment</span></span><ArrowRight size={18} aria-hidden="true" />
              </Link>
            ))}
          </div>
        </section>

        <section id="teams" className="homepage-team-section" aria-labelledby="homepage-team-title">
          <div className="homepage-team-content">
            <span className="homepage-kicker">For utilities and employers</span>
            <h2 id="homepage-team-title">See who is practising. Know where to support them.</h2>
            <p>Give each operator a structured path to their next exam. Review individual assessment sessions, results and topic gaps so training conversations start with evidence, not guesswork.</p>
            <div className="homepage-employer-actions"><Link href="/teams" className="homepage-primary-button">Explore team training <ArrowRight size={17} aria-hidden="true" /></Link><a href="mailto:abello@echeloninstitute.ca?subject=Employer%20training%20enquiry" className="homepage-text-link">Enquire about team training <ArrowRight size={16} aria-hidden="true" /></a></div>
          </div>
          <div className="homepage-team-preview" aria-label="Illustrative team training overview">
            <div><span>Team training overview</span><small>Illustrative preview</small></div>
            <dl><div><dt>Organize</dt><dd>Assign operator licences</dd></div><div><dt>Follow</dt><dd>Individual assessment activity</dd></div><div><dt>Support</dt><dd>Results and topic gaps</dd></div></dl>
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
