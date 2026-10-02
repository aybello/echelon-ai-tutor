import type { ReactNode } from "react";

/** Decorative process illustration; the study guides retain their instructional diagrams. */
export default function CoursePathHero({ children }: { children?: ReactNode }) {
  return (
    <section className="course-path-hero">
      <div>
        <p className="workspace-eyebrow">
          <span className="course-path-kicker" /> For water & wastewater
          operators
        </p>
        <h1>
          Confidence starts with <em>understanding.</em>
        </h1>
        <p>
          Make every study session count. Find your certification path, practise
          with purpose, and understand the reasoning behind each answer.
        </p>
        <div className="course-path-note">
          <span>YOUR NEXT CHAPTER</span>
          <p>Start with your exam. Build from there.</p>
        </div>
        {children}
      </div>
      <div className="course-path-art" aria-hidden="true">
        <svg viewBox="0 0 420 330" fill="none">
          <defs>
            <linearGradient id="course-path-water" x1="0" y1="0" x2="1" y2="1">
              <stop stopColor="#dae8e7" />
              <stop offset="1" stopColor="#9fbabf" />
            </linearGradient>
          </defs>
          <path d="M35 236 213 143 394 239 213 333Z" fill="#e6e9e4" />
          <path
            d="M35 226 213 133 394 229 213 323Z"
            fill="#f3f4ef"
            stroke="#bfcac7"
          />
          <g stroke="#d3ddda">
            <path d="m80 202 180 96M124 180l180 96M168 157l180 96M79 249l180-94M123 273l180-95M167 296l180-95" />
          </g>
          <path
            d="m47 210 59-31 62 32 66-34 54 28 61-32"
            stroke="#a58961"
            strokeWidth="5"
            strokeLinejoin="round"
          />
          <g stroke="#547b86" strokeWidth="1.5">
            <path
              d="M103 112v78c0 23 87 23 87 0v-78"
              fill="url(#course-path-water)"
            />
            <ellipse cx="146.5" cy="112" rx="43.5" ry="22" fill="#f0f5f1" />
            <ellipse
              cx="146.5"
              cy="143"
              rx="43.5"
              ry="22"
              fill="#83aeb7"
              fillOpacity=".55"
            />
            <path
              d="M246 142v74c0 22 89 22 89 0v-74"
              fill="url(#course-path-water)"
            />
            <ellipse cx="290.5" cy="142" rx="44.5" ry="22" fill="#f0f5f1" />
            <ellipse
              cx="290.5"
              cy="171"
              rx="44.5"
              ry="22"
              fill="#83aeb7"
              fillOpacity=".55"
            />
            <path d="m125 108 21-11 22 11-22 11Z" fill="#dfe7e3" />
            <path d="M146 99v88m-33-1 33 17 33-17m-63-69v66m60-66v66M263 141l28-14 28 14-28 14ZM290 128v83" />
          </g>
          <path
            d="m58 132 33-18M334 191l40-21"
            stroke="#a58961"
            strokeWidth="5"
          />
          <path
            d="M63 95V53h79M339 116V78h-82"
            stroke="#8ca29f"
            strokeDasharray="3 5"
          />
          <circle cx="62" cy="95" r="3" fill="#8ca29f" />
          <circle cx="339" cy="116" r="3" fill="#8ca29f" />
          <path
            d="m148 43 7 10-7 10M253 68l-7 10 7 10"
            stroke="#a58961"
            strokeWidth="1.5"
          />
        </svg>
        <span>SEE THE PROCESS. UNDERSTAND THE WHY.</span>
      </div>
    </section>
  );
}
