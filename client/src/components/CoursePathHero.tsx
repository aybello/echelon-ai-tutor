import type { ReactNode } from "react";

/** Homepage hero copy while retaining the existing course-finder entry point. */
export default function CoursePathHero({ children }: { children?: ReactNode }) {
  return (
    <div className="course-path-hero">
      <span className="homepage-kicker">Operator certification preparation</span>
      <h1 id="homepage-hero-title" className="landing-hero-reveal landing-hero-reveal-1">
        Prepare with confidence for your <span>operator exam.</span>
      </h1>
      <p className="course-path-intro landing-hero-reveal landing-hero-reveal-2">
        Practice questions, worked calculations and timed mock exams for water and wastewater certification across Canada and the United States.
      </p>
      {children}
    </div>
  );
}
