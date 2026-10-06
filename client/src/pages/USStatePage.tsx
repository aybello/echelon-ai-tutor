import { Link, useParams } from "wouter";
import { usePageMeta } from "@/hooks/usePageMeta";
import USPageLayout, { USHero } from "@/components/USPageLayout";
import { getStateBySlug, US_STREAMS, US_RESEARCH_CHECKED_DATE, matchedUSCourses, usCourseHref, usProgramLabel } from "@/lib/stateConfig";

export default function USStatePage() {
  const params = useParams<{ slug: string }>();
  const state = getStateBySlug(params.slug ?? "");
  usePageMeta({ title: state ? `${state.name} Operator Exam Routes | Echelon Institute` : "State Not Found | Echelon Institute", description: state ? `Check ${state.name} water and wastewater exam programs, official sources and confirmed shared WPI course matches. State-specific courses are listed separately.` : "The requested state page does not exist.", noindex: !state });
  if (!state) return <USPageLayout><main className="us-main"><h1>State Not Found</h1><Link href="/us/states" className="us-action">View all states</Link></main></USPageLayout>;
  return <USPageLayout>
    <USHero title={`${state.name} operator exam preparation`}>
      <span className="us-badge">{state.code} · Source check: {US_RESEARCH_CHECKED_DATE}</span>
      <p>Choose your certification stream first. We link shared WPI courses only where the standardized exam and class match are confirmed. Other programs need separate preparation.</p>
      <Link href={`/us/courses?state=${state.code}`} className="us-action">View confirmed shared courses</Link>
    </USHero>
    <main className="us-main">
      <div className="us-notice"><h2>Confirm your exact exam</h2><p>Local grade names may not match WPI class numbers. Your authority sets eligibility, rules, exam dates, passing requirements and calculator policies. A WPI course is not a state-approved licence or a guarantee of complete exam coverage.</p></div>
      {US_STREAMS.map(stream => {
        const program = state.programs.find(item => item.stream === stream.key)!;
        const courses = matchedUSCourses(state, stream.key);
        return <section key={stream.key} className="us-card us-program" data-program={stream.key}>
          <span className="us-badge">{usProgramLabel(program)}</span><h2>{stream.label}</h2>
          {program.authorityName && <p><strong>Program authority:</strong> {program.authorityName}</p>}
          <p><strong>Local levels:</strong> {program.localLevels || "Not confirmed"}</p>
          <p>{program.note}</p>
          {program.authorityUrl && <a href={program.authorityUrl} target="_blank" rel="noopener noreferrer">Official program information</a>}
          {courses.length > 0 ? <div className="us-card-grid" style={{ marginTop: 22 }}>{courses.map(course => <article key={course.courseKey} className="us-card" data-course-key={course.courseKey}>
            <h3>{course.displayName}</h3><div className="us-actions">
              <Link href={usCourseHref(course, "practice", state.code)!} className="us-action">Practice</Link>
              <Link href={usCourseHref(course, "mock", state.code)!} className="us-action us-action-secondary">Mock Exam</Link>
              {course.flashcardPath && <Link href={usCourseHref(course, "flashcards", state.code)!} className="us-action us-action-secondary">Flashcards</Link>}
            </div>
          </article>)}</div> : <p><strong>No state-matched course is linked for this stream yet.</strong> {program.examSystem === "not-offered" ? "Check with the authority about the certification path for your role." : "We need a verified local course or class mapping before presenting one as a match."}</p>}
          {program.sources.length > 0 && <details><summary>Sources and exam scope</summary><ul>{program.sources.map((source, index) => <li key={`${source.url}-${index}`}><a href={source.url} target="_blank" rel="noopener noreferrer">{source.title}</a><p>{source.evidence}</p></li>)}</ul></details>}
        </section>;
      })}
      {state.dedicatedCourseNeeds.length > 0 && <section className="us-card us-program"><h2>Dedicated course research</h2><p>These needs are separate from the shared WPI courses. Dedicated prep is not available or being sold yet.</p><ul>{state.dedicatedCourseNeeds.map(item => <li key={item}>{item}</li>)}</ul></section>}
      {state.limits.length > 0 && <section className="us-card us-program"><h2>What still needs confirmation</h2><ul>{state.limits.map(item => <li key={item}>{item}</li>)}</ul></section>}
      <Link href="/us/states" className="us-action us-action-secondary">Back to all states</Link>
    </main>
  </USPageLayout>;
}
