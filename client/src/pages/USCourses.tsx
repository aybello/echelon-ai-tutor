import { Link, useLocation, useSearch } from "wouter";
import { usePageMeta } from "@/hooks/usePageMeta";
import USPageLayout, { USHero } from "@/components/USPageLayout";
import { getStateByCode, US_STATE_CONFIGS, US_STREAMS, getUSProgramCoverage, sharedUSCourses, matchedUSCourses, usCourseHref } from "@/lib/stateConfig";

export default function USCourses() {
  const search = useSearch();
  const [, navigate] = useLocation();
  const query = new URLSearchParams(search);
  const requestedState = query.get("state");
  const state = getStateByCode(requestedState);
  const stream = US_STREAMS.find(item => item.key === query.get("stream"));
  const invalidState = !!requestedState && !state;
  const courses = invalidState ? [] : state ? matchedUSCourses(state, stream?.key) : sharedUSCourses(stream?.key);
  const texasClassD = state?.code === "TX" ? courses.find(course => course.courseKey === "us-texas-class-d-water") : undefined;
  const streamCourses = courses.filter(course => course.courseKey !== "us-texas-class-d-water");
  const statePrograms = state ? state.programs.filter(program => !stream || program.stream === stream.key) : [];
  const coveragePrograms = statePrograms.map(program => ({
    program,
    streamLabel: US_STREAMS.find(item => item.key === program.stream)?.label ?? program.stream,
    coverage: getUSProgramCoverage(program),
  }));
  const directPrograms = coveragePrograms.filter(item => item.coverage.kind === "wpi-direct");
  const mixedPrograms = coveragePrograms.filter(item => item.coverage.kind === "state-with-wpi-component");
  const unavailablePrograms = coveragePrograms.filter(item => item.coverage.kind === "state-specific");
  usePageMeta({ title: "US Operator Exam Courses | Echelon Institute", description: "Dedicated US Class I water treatment and water distribution courses in US customary units, plus shared WPI preparation for other streams and class levels." });
  const select = (key: "state" | "stream", value: string) => {
    const next = new URLSearchParams(search);
    if (value) next.set(key, value); else next.delete(key);
    navigate(`/us/courses${next.size ? `?${next}` : ""}`);
  };
  return <USPageLayout>
    <USHero title="US operator exam courses">
      <p>Dedicated US Class I courses in water treatment and water distribution, written to the WPI Class 1 Need-to-Know Criteria in US customary units. Other streams and class levels use our shared WPI study tools.</p>
      <p>Choose your state to see the streams and class levels with a confirmed exam route. Course content is standardized exam material and does not cover a state's own rules.</p>
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
      {state ? <div className="us-notice" data-state-coverage="source-backed"><h2>{state.name}: source-backed course routes</h2><p>Only confirmed standardized WPI programs and class matches are shown below. State-specific rules and any other streams need separate preparation.</p><ul className="us-coverage-summary"><li><strong>WPI Direct:</strong> {directPrograms.length} {stream ? "selected stream" : "stream(s)"}</li><li><strong>State program + WPI component:</strong> {mixedPrograms.length} {stream ? "selected stream" : "stream(s)"}</li><li><strong>State-specific / no shared course:</strong> {unavailablePrograms.length} {stream ? "selected stream" : "stream(s)"}</li></ul>{coveragePrograms.map(({ program, streamLabel, coverage }) => <p key={program.stream} className="us-coverage-note" data-program-coverage={coverage.kind}><strong>{streamLabel} · {coverage.label}.</strong> {coverage.note}</p>)}<Link href={`/us/states/${state.slug}`} className="us-action us-action-secondary">View {state.name} exam details</Link></div>
        : <div className="us-notice"><h2>Check your state before buying</h2><p>The catalogue below covers standardized exam content. It does not mean every state, grade or certification program uses these exams.</p><Link href="/us/states" className="us-action">Find your state</Link></div>}
      {courses.length === 0 && <div className="us-empty" role="status">{invalidState ? "That state is not recognized. Choose a state from the list." : state ? "No source-backed shared course is available for this state and stream. Check the state page for official sources and state-specific course needs." : "No confirmed shared course match for this selection. Check the state page for official sources and dedicated-course needs."}</div>}
      {texasClassD && <section className="us-course-section">
        <h2>Texas Class D Water</h2>
        <div className="us-card-grid"><article className="us-card" data-course-key="us-texas-class-d-water">
          <span className="us-badge">Texas-specific preparation</span><h3>Texas Class D Water</h3>
          <p>Covers Texas water treatment and water distribution. Includes 120 original questions based on the public TCEQ Class D topic scope, worked calculation steps, AI Tutor support and a timed mock exam. Echelon is an independent preparation provider and is not endorsed by TCEQ.</p>
          <div className="us-actions">
            <Link href={usCourseHref(texasClassD, "practice", state?.code)!} className="us-action">Practice Quiz</Link>
            <Link href={usCourseHref(texasClassD, "mock", state?.code)!} className="us-action us-action-secondary">Mock Exam</Link>
            <Link href={usCourseHref(texasClassD, "flashcards", state?.code)!} className="us-action us-action-secondary">Flashcards</Link>
          </div>
        </article></div>
      </section>}
      {US_STREAMS.filter(item => streamCourses.some(course => course.track === item.key)).map(item => <section key={item.key} className="us-course-section">
        <h2>{item.label}</h2>
        <div className="us-card-grid">{streamCourses.filter(course => course.track === item.key).map(course => <article key={course.courseKey} className="us-card" data-course-key={course.courseKey}>
          <span className="us-badge">{course.examFamily === "us-wpi" ? "Dedicated US Class I course" : "Shared WPI preparation"}</span><h3>{course.displayName}</h3>
          <p>{course.examFamily === "us-wpi"
            ? "Written to the WPI Class 1 Need-to-Know Criteria in US customary units, with cited public sources and worked calculation steps."
            : state ? `Confirmed ${state.name} program match. Review the local class names on the state page.` : "Confirm your authority's exam version and local class before choosing this course."}</p>
          <div className="us-actions">
            <Link href={usCourseHref(course, "practice", state?.code)!} className="us-action">Practice Quiz</Link>
            <Link href={usCourseHref(course, "mock", state?.code)!} className="us-action us-action-secondary">Mock Exam</Link>
            {course.flashcardPath && <Link href={usCourseHref(course, "flashcards", state?.code)!} className="us-action us-action-secondary">Flashcards</Link>}
          </div>
        </article>)}</div>
      </section>)}
      <section className="us-notice"><h2>Need a state-specific course?</h2><p>Our dedicated US Class I courses cover standardized exam content in US customary units. Texas Class D Water preparation is listed separately for Texas learners. These courses do not replace state eligibility or licensing requirements.</p><Link href="/us/states" className="us-action us-action-secondary">Check state-specific needs</Link></section>
    </main>
  </USPageLayout>;
}
