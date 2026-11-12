import { Link } from "wouter";
import { InteractiveDrill } from "@/components/InteractiveDrill";
import { usePageMeta } from "@/hooks/usePageMeta";
import { introductoryInteractiveDrills } from "@/lib/introductoryInteractiveDrills";
import "./InteractiveLearning.css";

export default function InteractiveLearning() {
  usePageMeta({
    title: "Interactive Learning Examples",
    description: "Try a few introductory interactive water and wastewater activities. These examples are not a course or question bank, and progress is not saved.",
    path: "/interactive-learning",
    noindex: true,
  });

  return (
    <div className="interactive-learning">
      <header className="interactive-learning__header">
        <div className="interactive-learning__header-inner">
          <Link href="/" className="interactive-learning__brand">Echelon Institute</Link>
          <Link href="/oit" className="interactive-learning__back">← OIT overview</Link>
        </div>
      </header>

      <div className="interactive-learning__content">
        <section className="interactive-learning__intro" aria-labelledby="interactive-learning-title">
          <p className="interactive-learning__eyebrow">A different way to practise</p>
          <h1 id="interactive-learning-title">Interactive learning, at your own pace.</h1>
          <p className="interactive-learning__description">
            Explore a few introductory examples using quick, interactive activities.
            Choose a mode and try it out.
          </p>
          <p className="interactive-learning__note">
            These are examples, not a course or question bank. Your answers and progress are not saved.
          </p>
        </section>

        <section className="interactive-learning__practice" aria-label="Introductory example activities">
          <div className="interactive-learning__section-heading">
            <div>
              <p className="interactive-learning__eyebrow">Try it out</p>
              <h2>Choose an activity</h2>
            </div>
            <p>Learn by doing, with feedback as you go.</p>
          </div>
          <InteractiveDrill examples={introductoryInteractiveDrills} />
        </section>
      </div>
    </div>
  );
}
