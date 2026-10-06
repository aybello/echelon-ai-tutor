import type { ReactNode } from "react";

/** Original Echelon hero, retaining the newer course-finder entry point. */
export default function CoursePathHero({ children }: { children?: ReactNode }) {
  return (
    <div className="course-path-hero">
      <h1 className="landing-hero-reveal landing-hero-reveal-1">
        Pass Your Operator Exam.<br />
        <span>Advance Your Career.</span>
      </h1>
      <p className="course-path-intro landing-hero-reveal landing-hero-reveal-2">
        Practice questions, timed mocks, study notes, and AI-powered explanations
        for Canadian water and wastewater certification.
      </p>
      {children}
    </div>
  );
}
