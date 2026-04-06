/**
 * MobileBottomNav — Fixed bottom navigation bar for mobile devices.
 * Only visible on screens ≤ 640px. Provides quick access to the four
 * most important destinations: Home, Courses, Formulas, and AI Tutor.
 *
 * Usage:
 *   <MobileBottomNav currentPath="/quiz" />
 */

import { Link } from "wouter";

interface MobileBottomNavProps {
  currentPath: string;
}

interface NavItem {
  href: string;
  label: string;
  icon: string;
  /** Additional paths that should highlight this tab */
  matchPaths?: string[];
}

const NAV_ITEMS: NavItem[] = [
  {
    href: "/",
    label: "Home",
    icon: "🏠",
    matchPaths: ["/", "/about", "/career", "/pricing", "/wpi"],
  },
  {
    href: "/quiz",
    label: "Courses",
    icon: "📚",
    matchPaths: [
      "/quiz", "/class1", "/class2", "/class3", "/class4",
      "/class1-water", "/class1-ww", "/class2-water", "/class2-ww",
      "/class3-water", "/class3-ww", "/class4-water", "/class4-ww",
      "/wpi-class1", "/wpi-class2", "/wpi-class3", "/wpi-class4",
      "/oit-mock", "/class1-mock", "/wqa", "/wqa-mock",
    ],
  },
  {
    href: "/formulas",
    label: "Formulas",
    icon: "📐",
    matchPaths: [
      "/formulas", "/formulas-wqa", "/formulas-ww1", "/formulas-ww2",
      "/formulas-ww3", "/formulas-ww4", "/formulas-water1", "/formulas-water2",
      "/formulas-water3", "/formulas-water4", "/formulas-wpi-class1",
      "/formulas-wpi-class1-ww", "/formulas-wpi-class2", "/formulas-wpi-class2-ww",
      "/formulas-wpi-class3", "/formulas-wpi-class3-ww", "/formulas-wpi-class4",
      "/formulas-wpi-class4-ww", "/chem-calc", "/lab",
    ],
  },
  {
    href: "/quiz",
    label: "AI Tutor",
    icon: "🤖",
    // AI Tutor is embedded in the quiz — this tab navigates to the quiz
    // and highlights when the user is on any quiz page
    matchPaths: [],
  },
];

function isActive(item: NavItem, currentPath: string): boolean {
  if (item.href === currentPath) return true;
  if (item.matchPaths) {
    return item.matchPaths.some(p => currentPath === p || currentPath.startsWith(p + "-") || currentPath.startsWith(p + "/"));
  }
  return false;
}

export default function MobileBottomNav({ currentPath }: MobileBottomNavProps) {
  return (
    <>
      <style>{`
        .mobile-bottom-nav {
          display: none;
        }
        @media (max-width: 640px) {
          .mobile-bottom-nav {
            display: flex;
            position: fixed;
            bottom: 0;
            left: 0;
            right: 0;
            z-index: 300;
            background: #0F172A;
            border-top: 1px solid rgba(255,255,255,0.1);
            padding: 8px 0 env(safe-area-inset-bottom, 8px);
            justify-content: space-around;
            align-items: center;
          }
          .mobile-bottom-nav-item {
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 3px;
            padding: 4px 12px;
            border-radius: 10px;
            text-decoration: none;
            cursor: pointer;
            touch-action: manipulation;
            min-width: 56px;
            transition: background 0.15s;
          }
          .mobile-bottom-nav-item:active {
            background: rgba(255,255,255,0.08);
          }
          .mobile-bottom-nav-icon {
            font-size: 20px;
            line-height: 1;
          }
          .mobile-bottom-nav-label {
            font-size: 10px;
            font-weight: 600;
            font-family: 'Sora', sans-serif;
            letter-spacing: 0.02em;
            color: rgba(255,255,255,0.5);
            white-space: nowrap;
          }
          .mobile-bottom-nav-item.active .mobile-bottom-nav-label {
            color: #60A5FA;
          }
          .mobile-bottom-nav-item.active .mobile-bottom-nav-icon {
            filter: drop-shadow(0 0 6px rgba(96,165,250,0.6));
          }
          /* Active indicator dot */
          .mobile-bottom-nav-dot {
            width: 4px;
            height: 4px;
            border-radius: 50%;
            background: #60A5FA;
            margin-top: 1px;
          }
          /* Spacer to push content above the fixed nav bar */
          .mobile-bottom-nav-spacer {
            display: block;
            height: 72px;
            width: 100%;
            flex-shrink: 0;
          }
        }
      `}</style>
      {/* Spacer that pushes page content above the fixed bottom nav */}
      <div className="mobile-bottom-nav-spacer" />
      <nav className="mobile-bottom-nav" aria-label="Mobile navigation">
        {NAV_ITEMS.map((item) => {
          const active = isActive(item, currentPath);
          return (
            <Link key={item.label} href={item.href}>
              <div className={`mobile-bottom-nav-item${active ? " active" : ""}`}>
                <span className="mobile-bottom-nav-icon">{item.icon}</span>
                <span className="mobile-bottom-nav-label">{item.label}</span>
                {active && <div className="mobile-bottom-nav-dot" />}
              </div>
            </Link>
          );
        })}
      </nav>
    </>
  );
}
