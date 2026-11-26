import type { ReactNode } from "react";

/** Homepage positioning while retaining the existing course-finder entry point. */
export default function CoursePathHero({ children }: { children?: ReactNode }) {
  return (
    <div className="course-path-hero">
      <span className="homepage-kicker">AI-powered exam prep for skilled trades</span>
      <h1 id="homepage-hero-title" className="landing-hero-reveal landing-hero-reveal-1">
        Learn the material. <span>Build skills that last.</span>
      </h1>
      <p className="course-path-intro landing-hero-reveal landing-hero-reveal-2">
        AI-powered exam prep, interactive learning and continuing education for the skilled-trades workforce. Start with water and wastewater courses in Canada and the United States.
      </p>
      {children}
    </div>
  );
}
