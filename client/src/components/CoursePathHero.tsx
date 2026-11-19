import type { ReactNode } from "react";

/** Homepage positioning while retaining the existing course-finder entry point. */
export default function CoursePathHero({ children }: { children?: ReactNode }) {
  return (
    <div className="course-path-hero">
      <span className="homepage-kicker">AI-powered exam prep for skilled trades</span>
      <h1 id="homepage-hero-title" className="landing-hero-reveal landing-hero-reveal-1">
        Understand the material. <span>Be ready for the exam.</span>
      </h1>
      <p className="course-path-intro landing-hero-reveal landing-hero-reveal-2">
        AI-powered exam prep, interactive learning and continuing education for the skilled-trades workforce across Canada and the United States, starting with water and wastewater. Understand complex concepts, practise by doing and keep building your skills beyond the exam.
      </p>
      {children}
    </div>
  );
}
