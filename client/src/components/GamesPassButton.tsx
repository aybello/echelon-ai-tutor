import { Link } from "wouter";
import { useCourseGamesHref } from "@/lib/useCourseGames";

/** "Play games" button for a course row on the Account page. Renders nothing until the course has enough games. */
export default function GamesPassButton({ courseKey }: { courseKey: string }) {
  const href = useCourseGamesHref(courseKey);
  if (!href) return null;
  return (
    <Link href={href}>
      <span className="pass-btn" style={{ background: "#FFF7ED", color: "#C2410C" }}>🎮 Play games</span>
    </Link>
  );
}
