import { Link, useLocation, useSearch } from "wouter";
import { usePageMeta } from "@/hooks/usePageMeta";
import USPageLayout, { USHero } from "@/components/USPageLayout";
import { getStateByCode, US_STATE_CONFIGS, US_STREAMS, sharedUSCourses, matchedUSCourses, usCourseHref } from "@/lib/stateConfig";

export default function USCourses() {
  const search = useSearch();
  const [, navigate] = useLocation();
  const query = new URLSearchParams(search);
  const requestedState = query.get("state");
  const state = getStateByCode(requestedState);
  const stream = US_STREAMS.find(item => item.key === query.get("stream"));
  const invalidState = !!requestedState && !state;
  const courses = invalidState ? [] : state ? matchedUSCourses(state, stream?.key) : sharedUSCourses(stream?.key);
  usePageMeta({ title: "US Shared WPI Courses | Echelon Institute", description: "Choose shared WPI water and wastewater exam preparation. Filter by your state to see confirmed program matches, with local exam limits explained." });
  const select = (key: "state" | "stream", value: string) => {
    const next = new URLSearchParams(search);
    if (value) next.set(key, value); else next.delete(key);
    navigate(`/us/courses${next.size ? `?${next}` : ""}`);
  };
  return <USPageLayout>
    <USHero title="Shared WPI operator courses">
      <p>Practice, mock exams and flashcards in four streams, from WPI Class I to Class IV. These are shared WPI study tools, not a separate course for every state.</p>
      <p>Choose your state to see only the streams and class levels with a confirmed shared exam route. A provider name alone does not prove your exam is the standardized version.</p>
      <div className="us-filters">
        <label>State<select value={state?.code ?? (invalidState ? "invalid" : "")} onChange={event => select("state", event.target.value)}>
          <option value="">Shared catalogue, no state match selected</option>
          {invalidState && <option value="invalid">Unrecognized state</option>}
          {Object.values(US_STATE_CONFIGS).map(item => <option key={item.code} value={item.code}>{item.name}</option>)}
        </select></label>
        <label>Certification stream<select value={stream?.key ?? ""} onChange={event => select("stream", event.target.value)}>
          <option value="">All streams</option>{US_STREAMS.map(item => <option key={item.key} value={item.key}>{item.label}</option>)}
        </select></label>
      </div>
    </USHero>
    <main className="us-main">
      {state ? <div className="us-notice"><h2>{state.name}: confirmed shared routes</h2><p>Only confirmed standardized WPI programs and class matches are shown below. State-specific rules and any other streams need separate preparation.</p><Link href={`/us/states/${state.slug}`} className="us-action us-action-secondary">View {state.name} exam details</Link></div>
        : <div className="us-notice"><h2>Check your state before buying</h2><p>The catalogue below is shared WPI preparation. It does not mean every state, grade or certification program uses these exams.</p><Link href="/us/states" className="us-action">Find your state</Link></div>}
      {courses.length === 0 && <div className="us-empty" role="status">{invalidState ? "That state is not recognized. Choose a state from the list." : "No confirmed shared course match for this selection. Check the state page for official sources and dedicated-course needs."}</div>}
      {US_STREAMS.filter(item => courses.some(course => course.track === item.key)).map(item => <section key={item.key} className="us-course-section">
        <h2>{item.label}</h2>
        <div className="us-card-grid">{courses.filter(course => course.track === item.key).map(course => <article key={course.courseKey} className="us-card" data-course-key={course.courseKey}>
          <span className="us-badge">Shared WPI preparation</span><h3>{course.displayName}</h3>
          <p>{state ? `Confirmed ${state.name} program match. Review the local class names on the state page.` : "Confirm your authority's exam version and local class before choosing this course."}</p>
          <div className="us-actions">
            <Link href={usCourseHref(course, "practice", state?.code)!} className="us-action">Practice Quiz</Link>
            <Link href={usCourseHref(course, "mock", state?.code)!} className="us-action us-action-secondary">Mock Exam</Link>
            {course.flashcardPath && <Link href={usCourseHref(course, "flashcards", state?.code)!} className="us-action us-action-secondary">Flashcards</Link>}
          </div>
        </article>)}</div>
      </section>)}
      <section className="us-notice"><h2>Need a state-specific course?</h2><p>Customized and unique state exams are listed separately. Dedicated courses are not available yet and are not being sold as shared WPI preparation.</p><Link href="/us/states" className="us-action us-action-secondary">Check state-specific needs</Link></section>
    </main>
  </USPageLayout>;
}
