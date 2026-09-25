import { useMemo, useState } from "react";
import { Link } from "wouter";
import { Check, ChevronDown, ClipboardCheck, Clock3, FileCheck2, GraduationCap, ShieldCheck } from "lucide-react";
import SiteNav from "@/components/SiteNav";
import { trpc } from "@/lib/trpc";
import { usePageMeta } from "@/hooks/usePageMeta";
import { CEU_COURSES, type CeuCourse } from "@shared/ceuCourses";
import "./ContinuingEducation.css";

function minutesToHours(minutes: number) {
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  if (hours === 0) return `${remainingMinutes} min`;
  if (remainingMinutes === 0) return `${hours} ${hours === 1 ? "hour" : "hours"}`;
  return `${hours} ${hours === 1 ? "hour" : "hours"} ${remainingMinutes} min`;
}

function CourseInterestForm({ course, onClose }: { course: CeuCourse; onClose: () => void }) {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const joinWaitlist = trpc.waitlist.join.useMutation({
    onSuccess: (result) => {
      setMessage(result.alreadyRegistered ? "This email is already registered for updates." : "You are on the course update list.");
    },
    onError: (error) => setError(error.message || "We could not save your request. Please try again."),
  });

  return (
    <div className="ceu-modal-backdrop" role="presentation" onMouseDown={onClose}>
      <section className="ceu-modal" role="dialog" aria-modal="true" aria-labelledby="ceu-interest-title" onMouseDown={(event) => event.stopPropagation()}>
        <button type="button" className="ceu-modal-close" onClick={onClose} aria-label="Close request form">Close</button>
        <p className="ceu-eyebrow">Course updates</p>
        <h2 id="ceu-interest-title">{course.shortTitle}</h2>
        <p>Receive one email when the course has a confirmed launch and review status. No CEU value or approval is claimed today.</p>
        {message ? (
          <div className="ceu-form-message" role="status">{message}</div>
        ) : (
          <form onSubmit={(event) => {
            event.preventDefault();
            setError("");
            joinWaitlist.mutate({ email: email.trim(), courseCode: course.interestCode, courseTitle: course.title });
          }}>
            {error && <p role="alert">{error}</p>}
            <label htmlFor={`ceu-email-${course.key}`}>Work email</label>
            <input id={`ceu-email-${course.key}`} type="email" required value={email} onChange={(event) => setEmail(event.target.value)} placeholder="operator@example.ca" />
            <button type="submit" disabled={joinWaitlist.isPending}>{joinWaitlist.isPending ? "Saving request" : "Request updates"}</button>
          </form>
        )}
      </section>
    </div>
  );
}

function CourseCard({ course, selected, onSelect, onRequestUpdates }: { course: CeuCourse; selected: boolean; onSelect: () => void; onRequestUpdates: () => void }) {
  const streamLabel = course.stream === "drinking_water" ? "Ontario drinking water" : "Ontario wastewater";
  return (
    <article className={`ceu-course-card ${course.stream === "wastewater" ? "is-wastewater" : ""}`}>
      <div className="ceu-course-topline">
        <span>{streamLabel}</span>
        <span><Clock3 size={15} aria-hidden="true" /> Planned {course.plannedContactHours} contact hours</span>
      </div>
      <div className="ceu-course-heading">
        <div>
          <h2>{course.title}</h2>
          <p>{course.audience}</p>
        </div>
        <div className="ceu-approval-badge"><ShieldCheck size={16} aria-hidden="true" /> {course.statusLabel}</div>
      </div>
      <p className="ceu-course-status">{course.statusDescription}</p>
      <div className="ceu-course-actions">
        <Link href={`/continuing-education/${course.key}`} className="ceu-preview-link">Open pilot course</Link>
        <button type="button" className="ceu-outline-button" aria-expanded={selected} onClick={onSelect}>
          {selected ? "Hide course outline" : "Review course outline"}
          <ChevronDown size={17} aria-hidden="true" className={selected ? "is-open" : ""} />
        </button>
        <button type="button" className="ceu-interest-button" onClick={onRequestUpdates}>{course.ctaLabel}</button>
      </div>
      {selected && (
        <div className="ceu-outline" aria-label={`${course.title} course outline`}>
          <div className="ceu-outline-column">
            <p className="ceu-outline-label">Learning outcomes</p>
            <ul className="ceu-check-list">
              {course.outcomes.map((outcome) => <li key={outcome}><Check size={16} aria-hidden="true" />{outcome}</li>)}
            </ul>
          </div>
          <div className="ceu-outline-column ceu-modules">
            <p className="ceu-outline-label">{course.modules.length}-module timetable</p>
            <ol>
              {course.modules.map((module) => (
                <li key={module.number}>
                  <div><span>Module {module.number}</span><strong>{module.title}</strong></div>
                  <time>{minutesToHours(module.durationMinutes)}</time>
                  <p>{module.summary}</p>
                </li>
              ))}
            </ol>
          </div>
          <div className="ceu-completion">
            <div><ClipboardCheck size={20} aria-hidden="true" /><p className="ceu-outline-label">Planned completion evidence</p></div>
            <ul>{course.completionRequirements.map((requirement) => <li key={requirement}>{requirement}</li>)}</ul>
          </div>
          <p className="ceu-disclosure">{course.publicDisclosure}</p>
        </div>
      )}
    </article>
  );
}

export default function ContinuingEducation() {
  usePageMeta({
    title: "Ontario Operator Continuing Education Courses | Echelon Institute",
    description: "Explore Echelon Institute's applied pilot courses for Ontario drinking-water and wastewater operators.",
  });
  const [selectedCourseKey, setSelectedCourseKey] = useState<string>(CEU_COURSES[0].key);
  const [interestCourseKey, setInterestCourseKey] = useState<string | null>(null);
  const selectedCourse = useMemo(() => CEU_COURSES.find((course) => course.key === selectedCourseKey), [selectedCourseKey]);
  const interestCourse = useMemo(() => CEU_COURSES.find((course) => course.key === interestCourseKey), [interestCourseKey]);

  return (
    <div className="ceu-page">
      <SiteNav currentPath="/continuing-education" variant="marketing" />
      <main>
        <section className="ceu-hero">
          <div className="ceu-hero-copy">
            <p className="ceu-eyebrow">Echelon Institute professional learning</p>
            <h1>Structured learning paths for the operators who keep systems running.</h1>
            <p className="ceu-hero-summary">Ten pilot courses combine practical operating cases, calculations, instructor discussion and reviewed learning records. Three flagship courses are planned for ten hours each; focused courses are planned for three or four hours.</p>
            <div className="ceu-hero-facts">
              <span><Clock3 size={17} aria-hidden="true" /> 3–10 planned learning hours</span>
              <span><GraduationCap size={17} aria-hidden="true" /> 4–6 practical modules per course</span>
              <span><FileCheck2 size={17} aria-hidden="true" /> Saved work and instructor review</span>
            </div>
          </div>
          <aside className="ceu-hero-panel">
            <p>Public status</p>
            <strong>Pilot curriculum · review pending</strong>
            <span>Duration requires a timed pilot. These courses do not award approved CEUs, accreditation or regulatory recognition.</span>
          </aside>
        </section>

        <section className="ceu-catalogue" aria-labelledby="ceu-catalogue-title">
          <div className="ceu-section-heading">
            <p className="ceu-eyebrow">Course catalogue</p>
            <h2 id="ceu-catalogue-title">Choose the operational capability you want to strengthen.</h2>
            <p>Every course uses fictional scenarios and general operating principles. Facilitated delivery includes instructor engagement, verified participation, assessment and a course evaluation. Reading a page alone does not complete a course.</p>
          </div>
          <div className="ceu-course-list">
            {CEU_COURSES.map((course) => (
              <CourseCard
                key={course.key}
                course={course}
                selected={selectedCourse?.key === course.key}
                onSelect={() => setSelectedCourseKey((current) => current === course.key ? "" : course.key)}
                onRequestUpdates={() => setInterestCourseKey(course.key)}
              />
            ))}
          </div>
        </section>

        <section className="ceu-delivery-grid" aria-labelledby="ceu-delivery-title">
          <div className="ceu-section-heading">
            <p className="ceu-eyebrow">Built for documented delivery</p>
            <h2 id="ceu-delivery-title">A course is more than a recording.</h2>
          </div>
          <div className="ceu-delivery-cards">
            <article><ClipboardCheck size={22} aria-hidden="true" /><h3>Active learning</h3><p>Applied data work, scenarios, knowledge checks, and instructor-led discussion create evidence beyond passive viewing.</p></article>
            <article><FileCheck2 size={22} aria-hidden="true" /><h3>Completion evidence</h3><p>Saved practical work, assessment results, instructor feedback and verified participation form the pilot learning record.</p></article>
            <article><ShieldCheck size={22} aria-hidden="true" /><h3>Approval discipline</h3><p>Drinking-water courses follow the Director-approval route. Wastewater courses follow the OWWCO course-value review route.</p></article>
          </div>
        </section>

        <section className="ceu-regulatory-note">
          <div>
            <p className="ceu-eyebrow">How the Ontario review paths differ</p>
            <h2>Approval status is earned through the applicable review process.</h2>
          </div>
          <div className="ceu-note-copy">
            <p>Ontario drinking-water continuing-education courses must be reviewed through the Director-approval process before they can be presented as Director approved. Wastewater-only courses can be reviewed by OWWCO for course length or CEU value, but they are not Director approved for drinking-water renewal.</p>
            <p><a href="https://www.ontario.ca/page/director-approved-drinking-water-continuing-education-guide-training-providers" target="_blank" rel="noreferrer">Read the Ontario training-provider guide</a><span aria-hidden="true"> · </span><a href="https://owwco.ca/training-providers/" target="_blank" rel="noreferrer">Read OWWCO training-provider requirements</a></p>
          </div>
        </section>
      </main>
      {interestCourse && <CourseInterestForm course={interestCourse} onClose={() => setInterestCourseKey(null)} />}
    </div>
  );
}
