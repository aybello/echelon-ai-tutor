import { useState } from "react";
import { Gamepad2, X } from "lucide-react";
import { Link } from "wouter";
import { useCourseGamesHref } from "@/lib/useCourseGames";
import { readGamesNewSeen, writeGamesNewSeen } from "@/lib/courseGames";

/** Dashboard card that points learners to the games for their current course. Hidden until the course has enough games. */
export default function GamesCard({ courseKey, courseName }: { courseKey: string | undefined; courseName?: string }) {
  const href = useCourseGamesHref(courseKey);
  const [seen, setSeen] = useState(readGamesNewSeen);
  if (!href) return null;
  const open = () => { writeGamesNewSeen(); setSeen(true); };
  return (
    <section aria-label="Games" className="mb-6 flex items-center gap-3 rounded-2xl border border-border bg-card p-4 shadow-sm sm:p-5">
      <Gamepad2 size={28} aria-hidden="true" className="shrink-0 text-primary" />
      <div className="min-w-0 flex-1">
        <p className="text-base font-bold leading-tight">
          Play games{!seen && <span className="ml-2 rounded-full bg-primary px-2 py-0.5 align-middle text-xs font-semibold text-primary-foreground">New</span>}
        </p>
        <p className="text-sm text-muted-foreground">Short games to practise{courseName ? ` ${courseName}` : ""} in a different way.</p>
      </div>
      <Link href={href} onClick={open} className="inline-flex min-h-11 shrink-0 items-center rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground hover:opacity-90">Play</Link>
      {!seen && (
        <button type="button" aria-label="Dismiss the New label" onClick={open} className="inline-flex min-h-11 min-w-11 shrink-0 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted">
          <X size={16} aria-hidden="true" />
        </button>
      )}
    </section>
  );
}
