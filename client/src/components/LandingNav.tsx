import { useLocation } from "wouter";
import type { ReactNode } from "react";
import SiteNav from "@/components/SiteNav";

interface LandingNavProps {
  isAuthenticated?: boolean;
  currentPath?: string;
  rightSlot?: ReactNode;
}

/** Marketing pages now share the same global navigation as the learning product. */
export default function LandingNav({ isAuthenticated, currentPath, rightSlot }: LandingNavProps) {
  const [location] = useLocation();
  return (
    <SiteNav
      currentPath={currentPath ?? location}
      variant="marketing"
      authenticatedOverride={isAuthenticated}
      rightSlot={rightSlot}
    />
  );
}
