import { ArrowRight, BookOpen, Target } from "lucide-react";
import "./StudyWorkspace.css";

export default function StudyHomeCard({ course, title, description, href, actionLabel = "Continue studying", secondaryHref, weeklyGoal }: {
  course: string; title: string; description: string; href: string; actionLabel?: string;
  secondaryHref?: string; weeklyGoal?: number | null;
}) {
  return <section className="study-home-card" aria-label="Your next study step">
    <div className="study-home-copy"><span className="workspace-eyebrow"><Target size={15} /> Your next step</span>
      <p className="study-home-course">{course}</p><h2>{title}</h2><p>{description}</p>
      {weeklyGoal ? <small>Weekly goal: {weeklyGoal} questions</small> : null}
    </div>
    <div className="study-home-actions"><a className="workspace-primary" href={href}>{actionLabel} <ArrowRight size={18} /></a>
      {secondaryHref && <a className="workspace-text-link" href={secondaryHref}><BookOpen size={16} /> Start a Quick 10</a>}
    </div>
  </section>;
}
