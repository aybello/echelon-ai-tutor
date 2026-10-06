import { useId } from "react";
import { useLocation, useSearch } from "wouter";
import { ArrowRight, BookOpen, MapPin } from "lucide-react";
import { FINDER_PROVINCES, FINDER_TRACKS, getFinderCourses, getFinderLevelLabel, getFinderTrackLabel } from "@/lib/courseFinder";
import { buildPricingHref, courseProvinceHref, funnelProvince } from "@shared/funnelNavigation";
import "./StudyWorkspace.css";

export default function CourseFinder({ initialProvince }: { initialProvince?: string | null }) {
  const id = useId();
  const [location, navigate] = useLocation();
  const search = useSearch();
  const params = new URLSearchParams(search);
  const province = funnelProvince(params.get("province"))?.toLowerCase()
    ?? (FINDER_PROVINCES.some(item => item.id === initialProvince) ? initialProvince! : "");
  const availableTracks = FINDER_TRACKS.filter(item => getFinderCourses(province, item.id).length > 0);
  const requestedCourseKey = params.get("product") ?? "";
  const requestedTrack = params.get("track");
  const track = availableTracks.find(item => item.id === requestedTrack)?.id
    ?? availableTracks.find(item => getFinderCourses(province, item.id).some(course => course.courseKey === requestedCourseKey))?.id
    ?? "";
  const courses = getFinderCourses(province, track);
  const course = courses.find(item => item.courseKey === requestedCourseKey);
  const courseKey = course?.courseKey ?? "";
  const choose = (nextProvince: string, nextTrack = "", nextCourse = "") => {
    const next = new URLSearchParams();
    const validProvince = funnelProvince(nextProvince);
    if (validProvince) next.set("province", validProvince);
    if (nextTrack) next.set("track", nextTrack);
    if (nextCourse) next.set("product", nextCourse);
    navigate(`${location.split("?")[0]}${next.size ? `?${next}` : ""}`);
  };
  return <section className="course-finder" aria-labelledby={`${id}-title`}>
    <div className="course-finder-heading"><span className="workspace-eyebrow"><MapPin size={14} /> Your certification path</span>
      <h2 id={`${id}-title`}>Find your course</h2><p>Choose where you write your exam, your system and your level.</p></div>
    <div className="course-finder-fields">
      <label htmlFor={`${id}-province`}><span>1. Province</span><select id={`${id}-province`} value={province} onChange={event => choose(event.target.value)}>
        <option value="">Select your province</option>{FINDER_PROVINCES.map(item => <option key={item.id} value={item.id}>{item.label}</option>)}
      </select></label>
      <label htmlFor={`${id}-track`}><span>2. System</span><select id={`${id}-track`} value={track} disabled={!province} onChange={event => choose(province, event.target.value)}>
        <option value="">Select your system</option>{availableTracks.map(item => <option key={item.id} value={item.id}>{getFinderTrackLabel(province, item.id)}</option>)}
      </select></label>
      <label htmlFor={`${id}-course`}><span>3. Level</span><select id={`${id}-course`} value={courseKey} disabled={!track} onChange={event => choose(province, track, event.target.value)}>
        <option value="">Select your level</option>{courses.map(item => <option key={item.courseKey} value={item.courseKey}>{getFinderLevelLabel(item)}</option>)}
      </select></label>
    </div>
    <div className="course-finder-result" aria-live="polite">
      {course ? <><div><strong><BookOpen size={17} /> {course.displayName}</strong><p>{province === "on" ? "Ontario exam preparation" : "WPI exam preparation"} · Practice, mock exams and study tools</p></div>
        <a className="workspace-primary" href={courseProvinceHref(course.quizPath, course.courseKey, province)}>Try this course <ArrowRight size={17} /></a><a className="workspace-text-link" href={buildPricingHref(course.courseKey, province)}>View access plans</a></>
        : <p>Select all three options to open the right course. You can try practice questions before buying.</p>}
    </div>
    <div className="course-finder-other"><a href="/us">Looking for a US exam?</a><a href="/electrician-309a">Ontario 309A electrician</a><a href="/teams">Training a team?</a></div>
  </section>;
}
