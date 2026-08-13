import { useLocation } from "wouter";
import SiteNav from "@/components/SiteNav";

interface LandingNavProps {
  isAuthenticated?: boolean;
  currentPath?: string;
}

/** Marketing pages now share the same global navigation as the learning product. */
export default function LandingNav({ isAuthenticated, currentPath }: LandingNavProps) {
  const [location] = useLocation();
  return (
    <SiteNav
      currentPath={currentPath ?? location}
      variant="marketing"
      authenticatedOverride={isAuthenticated}
    />
  );
}
