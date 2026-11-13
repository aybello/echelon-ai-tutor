import { BookOpenCheck, BrainCircuit } from "lucide-react";

type TutorGuideMarkProps = {
  size?: number;
  color?: string;
  mode?: "tutor" | "analysis";
  className?: string;
};

/**
 * Echelon's consistent non-mascot visual mark for guided explanations and
 * performance-pattern analysis. It intentionally avoids a robot or emoji
 * treatment so the Tutor reads as a professional study tool.
 */
export function TutorGuideMark({
  size = 18,
  color = "currentColor",
  mode = "tutor",
  className,
}: TutorGuideMarkProps) {
  const Icon = mode === "analysis" ? BrainCircuit : BookOpenCheck;

  return (
    <Icon
      aria-hidden="true"
      className={className}
      color={color}
      focusable="false"
      size={size}
      strokeWidth={2.15}
    />
  );
}
