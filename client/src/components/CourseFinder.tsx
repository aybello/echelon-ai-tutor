import { useEffect, useId, useState } from "react";
import { ArrowRight, BookOpen, MapPin } from "lucide-react";
import { FINDER_PROVINCES, FINDER_TRACKS, getFinderCourses, getFinderLevelLabel } from "@/lib/courseFinder";
import "./StudyWorkspace.css";

export default function CourseFinder({ initialProvince }: { initialProvince?: string | null }) {
  const id = useId();
  const [province, setProvince] = useState(initialProvince ?? "");
  const [track, setTrack] = useState("");
  const [courseKey, setCourseKey] = useState("");
  useEffect(() => { setProvince(initialProvince ?? ""); setTrack(""); setCourseKey(""); }, [initialProvince]);
  const courses = getFinderCourses(province, track);
  const course = courses.find(item => item.courseKey === courseKey);
  const availableTracks = FINDER_TRACKS.filter(item => getFinderCourses(province, item.id).length > 0);
  return <section className="course-finder" aria-labelledby={`${id}-title`}>
    <div className="course-finder-heading"><span className="workspace-eyebrow"><MapPin size={14} /> Your certification path</span>
      <h2 id={`${id}-title`}>Find your course</h2><p>Choose where you write your exam, your system and your level.</p></div>
    <div className="course-finder-fields">
      <label htmlFor={`${id}-province`}><span>1. Province</span><select id={`${id}-province`} value={province} onChange={event => { setProvince(event.target.value); setTrack(""); setCourseKey(""); }}>
        <option value="">Select your province</option>{FINDER_PROVINCES.map(item => <option key={item.id} value={item.id}>{item.label}</option>)}
      </select></label>
      <label htmlFor={`${id}-track`}><span>2. System</span><select id={`${id}-track`} value={track} disabled={!province} onChange={event => { setTrack(event.target.value); setCourseKey(""); }}>
        <option value="">Select your system</option>{availableTracks.map(item => <option key={item.id} value={item.id}>{item.label}</option>)}
      </select></label>
      <label htmlFor={`${id}-course`}><span>3. Level</span><select id={`${id}-course`} value={courseKey} disabled={!track} onChange={event => setCourseKey(event.target.value)}>
        <option value="">Select your level</option>{courses.map(item => <option key={item.courseKey} value={item.courseKey}>{getFinderLevelLabel(item)}</option>)}
      </select></label>
    </div>
    <div className="course-finder-result" aria-live="polite">
      {course ? <><div><strong><BookOpen size={17} /> {course.displayName}</strong><p>{province === "on" ? "Ontario exam preparation" : "WPI exam preparation"} · Practice, mock exams and study tools</p></div>
        <a className="workspace-primary" href={course.quizPath}>Try this course <ArrowRight size={17} /></a><a className="workspace-text-link" href="/pricing">View access plans</a></>
        : <p>Select all three options to open the right course. You can try practice questions before buying.</p>}
    </div>
    <div className="course-finder-other"><a href="/us">Looking for a US exam?</a><a href="/electrician-309a">Ontario 309A electrician</a><a href="/teams">Training a team?</a></div>
  </section>;
}
