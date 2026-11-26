import { useId, useState, type KeyboardEvent } from "react";
import type { ExamFamily } from "@shared/courseRegistry";
import CourseFinder from "./CourseFinder";
import "./HomepageCourseDiscovery.css";

export type HomepageCourseDiscoveryProps = {
  initialProvince?: string | null;
  onProvinceSelected?: (province: string) => void;
  onCourseSelected?: (selection: { courseKey: string; examFamily: ExamFamily }) => void;
};

const COUNTRIES = [
  { id: "canada", label: "Canada" },
  { id: "us", label: "United States" },
] as const;

type Country = (typeof COUNTRIES)[number]["id"];

export default function HomepageCourseDiscovery({
  initialProvince,
  onProvinceSelected,
  onCourseSelected,
}: HomepageCourseDiscoveryProps) {
  const id = useId();
  const [country, setCountry] = useState<Country>("canada");

  const handleCountryKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const index = COUNTRIES.findIndex(item => item.id === country);
    let nextIndex: number;
    switch (event.key) {
      case "ArrowRight":
        nextIndex = (index + 1) % COUNTRIES.length;
        break;
      case "ArrowLeft":
        nextIndex = (index + COUNTRIES.length - 1) % COUNTRIES.length;
        break;
      case "Home":
        nextIndex = 0;
        break;
      case "End":
        nextIndex = COUNTRIES.length - 1;
        break;
      default:
        return;
    }
    event.preventDefault();
    setCountry(COUNTRIES[nextIndex].id);
    event.currentTarget.querySelectorAll<HTMLButtonElement>('[role="tab"]')[nextIndex]?.focus();
  };

  return (
    <div className="homepage-course-discovery">
      <h2 className="homepage-course-discovery__title">Find your course</h2>
      <p className="homepage-course-discovery__intro">Choose where you write your exam. Our 35 standard Ontario and WPI course banks each include 1,000+ practice questions. Other course totals vary.</p>
      <div
        className="homepage-course-discovery__countries"
        role="tablist"
        aria-label="Exam country"
        onKeyDown={handleCountryKeyDown}
      >
        {COUNTRIES.map(item => (
          <button
            key={item.id}
            type="button"
            role="tab"
            id={`${id}-${item.id}-tab`}
            aria-controls={`${id}-${item.id}-panel`}
            aria-selected={country === item.id}
            tabIndex={country === item.id ? 0 : -1}
            onClick={() => setCountry(item.id)}
          >
            {item.label}
          </button>
        ))}
      </div>

      {/* Keep the original finder mounted: country tabs never rewrite its URL or callbacks. */}
      <div
        className="homepage-course-discovery__panel"
        role="tabpanel"
        id={`${id}-canada-panel`}
        aria-labelledby={`${id}-canada-tab`}
        hidden={country !== "canada"}
        tabIndex={0}
      >
        <CourseFinder initialProvince={initialProvince} onProvinceSelected={onProvinceSelected} onCourseSelected={onCourseSelected} />
        <div className="homepage-course-discovery__trade">
          <div>
            <strong>Ontario 309A electrician</strong>
            <p>A different trade? Explore free practice and mock exams.</p>
          </div>
          <a href="/electrician-309a">Free 309A practice &amp; mock exams <span aria-hidden="true">→</span></a>
        </div>
      </div>

      <div
        className="homepage-course-discovery__panel homepage-course-discovery__us"
        role="tabpanel"
        id={`${id}-us-panel`}
        aria-labelledby={`${id}-us-tab`}
        hidden={country !== "us"}
        tabIndex={0}
      >
        <h3>Preparing for a U.S. operator exam?</h3>
        <p>Find supported water and wastewater exam preparation by state.</p>
        <a className="homepage-course-discovery__us-link" href="/us">
          Find U.S. exam prep <span aria-hidden="true">→</span>
        </a>
      </div>

      <div className="homepage-course-discovery__team">
        <a href="/teams">Training a team?</a>
      </div>
    </div>
  );
}
