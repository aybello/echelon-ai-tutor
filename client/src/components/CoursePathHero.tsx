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
        Turn complex material into clear explanations, interactive practice and a focused study routine. AI tutoring, learning games and exam preparation for the skilled-trades workforce across Canada and the United States, starting with water and wastewater.
      </p>
      {children}
    </div>
  );
}
