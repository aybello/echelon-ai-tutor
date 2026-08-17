import { useEffect, useRef, useState, type ReactNode } from "react";
import { Link } from "wouter";
import {
  BookOpen, ChevronDown, CircleUserRound, FileCheck2, FlaskConical,
  Gauge, GraduationCap, LayoutDashboard, Menu, MessageCircleQuestion,
  NotebookTabs, Sigma, Sparkles, X,
} from "lucide-react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { getActiveWorkspaceTab, getCourseForPath, getCourseWorkspaceTabs, getMobileWorkspaceTabs } from "@/lib/courseNavigation";
import { resolveCourseKey } from "@shared/courseRegistry";

const LOGO_URL = "https://d2xsxph8kpxj0f.cloudfront.net/310519663446228701/9KAR7mkGo7x7xavTEeEpiA/echelon-icon-v2_5c9ed3a7.webp";

export const NAV_LINKS = [
  { label: "Courses", href: "/#courses" },
  { label: "Electrician Preview", href: "/electrician-309a-demo" },
  { label: "Process Guides", href: "/guides" },
  { label: "WPI", href: "/wpi" },
  { label: "US", href: "/us" },
  { label: "Pricing", href: "/pricing" },
  { label: "About", href: "/about" },
];

const RESOURCE_LINKS = [
  { label: "Study guides", href: "/guides", description: "Water and wastewater process guides" },
  { label: "Formula library", href: "/formulas", description: "Operator formulas and calculations" },
  { label: "Career map", href: "/career", description: "Plan your certification path" },
  { label: "Echelon Command", href: "/command", description: "Incident response practice" },
];

const tabIcons = {
  practice: BookOpen,
  mock: FileCheck2,
  flashcards: GraduationCap,
  notes: NotebookTabs,
  formulas: Sigma,
  tutor: Sparkles,
  progress: Gauge,
};

interface SiteNavProps {
  currentPath: string;
  brandName?: string;
  rightSlot?: ReactNode;
  variant?: "auto" | "marketing" | "learning";
  authenticatedOverride?: boolean;
}

function isPathActive(currentPath: string, href: string): boolean {
  const current = currentPath.split("?")[0];
  if (href.startsWith("/#")) return current === "/";
  return href === "/" ? current === "/" : current === href || current.startsWith(`${href}/`);
}

function ResourcesMenu({ currentPath, onNavigate }: { currentPath: string; onNavigate?: () => void }) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const active = RESOURCE_LINKS.some((item) => isPathActive(currentPath, item.href));

  useEffect(() => {
    const close = (event: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  return (
    <div className="echelon-resources" ref={rootRef}>
      <button className={`echelon-nav-link${active ? " is-active" : ""}`} onClick={() => setOpen((value) => !value)} aria-expanded={open}>
        Resources <ChevronDown size={14} aria-hidden="true" />
      </button>
      {open && (
        <div className="echelon-resources-menu">
          {RESOURCE_LINKS.map((item) => (
            <Link key={item.href} href={item.href} className="echelon-resource-link" onClick={() => { setOpen(false); onNavigate?.(); }}>
              <span>{item.label}</span>
              <small>{item.description}</small>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

export default function SiteNav({
  currentPath,
  brandName = "Echelon Institute",
  rightSlot,
  variant = "auto",
  authenticatedOverride,
}: SiteNavProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [mobileToolsOpen, setMobileToolsOpen] = useState(false);
  const { isAuthenticated } = useAuth({ lazy: true });
  const dashboardMe = trpc.dashboardAuth.me.useQuery(undefined, { retry: false, staleTime: 5 * 60 * 1000 });
  const progressCourseKey = currentPath.split("?")[0] === "/dashboard" && typeof window !== "undefined"
    ? new URLSearchParams(window.location.search).get("course")
    : null;
  const course = getCourseForPath(currentPath) ?? (progressCourseKey ? resolveCourseKey(progressCourseKey) : undefined);
  const learningMode = variant === "learning" || (variant === "auto" && !!course);
  const isSignedIn = authenticatedOverride ?? (isAuthenticated || !!dashboardMe.data?.email);
  const workspaceTabs = course ? getCourseWorkspaceTabs(course) : [];
  const { primaryTabs: mobilePrimaryTabs, secondaryTabs: mobileSecondaryTabs } = getMobileWorkspaceTabs(workspaceTabs);
  const activeTab = course ? getActiveWorkspaceTab(currentPath, course) : null;

  useEffect(() => {
    setMenuOpen(false);
    setMobileToolsOpen(false);
  }, [currentPath]);

  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [menuOpen]);

  return (
    <header className={`echelon-site-header${learningMode ? " is-learning" : ""}`}>
      <nav className="echelon-global-nav" aria-label="Global navigation">
        <Link href="/" className="echelon-brand" aria-label="Echelon Institute home">
          <img src={LOGO_URL} alt="" width={42} height={40} />
          <span className="echelon-brand-copy">
            <strong>{brandName}</strong>
            <small>Operator certification prep</small>
          </span>
        </Link>

        <div className="echelon-desktop-links">
          <Link href="/#courses" className={`echelon-nav-link${isPathActive(currentPath, "/") ? " is-active" : ""}`}>Courses</Link>
          <Link href="/electrician-309a-demo" className={`echelon-nav-link${isPathActive(currentPath, "/electrician-309a-demo") ? " is-active" : ""}`}>Electrician Preview</Link>
          <Link href="/wpi" className={`echelon-nav-link${isPathActive(currentPath, "/wpi") ? " is-active" : ""}`}>WPI</Link>
          <Link href="/us" className={`echelon-nav-link${isPathActive(currentPath, "/us") ? " is-active" : ""}`}>US</Link>
          <Link href="/pricing" className={`echelon-nav-link${isPathActive(currentPath, "/pricing") ? " is-active" : ""}`}>Pricing</Link>
          <ResourcesMenu currentPath={currentPath} />
        </div>

        <div className="echelon-nav-actions">
          {rightSlot}
          <Link href="/dashboard" className="echelon-dashboard-link">
            <LayoutDashboard size={16} aria-hidden="true" />
            <span>Dashboard</span>
          </Link>
          <Link href="/account" className="echelon-account-link">
            <CircleUserRound size={17} aria-hidden="true" />
            <span>{isSignedIn ? "My account" : "Sign in"}</span>
          </Link>
          <button className="echelon-menu-button" onClick={() => setMenuOpen((value) => !value)} aria-expanded={menuOpen} aria-label={menuOpen ? "Close navigation menu" : "Open navigation menu"}>
            {menuOpen ? <X size={21} /> : <Menu size={21} />}
          </button>
        </div>
      </nav>

      {course && (
        <div className="echelon-course-bar">
          <div className="echelon-course-identity">
            <FlaskConical size={16} aria-hidden="true" />
            <span>{course.shortName}</span>
            <small>{course.examFamily === "western" ? "WPI / Western Canada" : "Ontario"}</small>
          </div>
          <nav className="echelon-course-tabs echelon-course-tabs-desktop" aria-label={`${course.displayName} study tools`}>
            {workspaceTabs.map((tab) => {
              const Icon = tabIcons[tab.kind];
              return (
                <a key={tab.kind} href={tab.href} className={`echelon-course-tab${activeTab === tab.kind ? " is-active" : ""}`} aria-current={activeTab === tab.kind ? "page" : undefined}>
                  <Icon size={15} aria-hidden="true" />
                  <span>{tab.label}</span>
                </a>
              );
            })}
          </nav>
          <nav className="echelon-course-tabs-mobile" aria-label={`${course.displayName} mobile study tools`}>
            {mobilePrimaryTabs.map((tab) => {
              const Icon = tabIcons[tab.kind];
              return (
                <a key={tab.kind} href={tab.href} className={`echelon-mobile-course-tab${activeTab === tab.kind ? " is-active" : ""}`} aria-current={activeTab === tab.kind ? "page" : undefined}>
                  <Icon size={13} aria-hidden="true" />
                  <span>{tab.label}</span>
                </a>
              );
            })}
            {mobileSecondaryTabs.length > 0 && (
              <div className="echelon-mobile-tools">
                <button
                  type="button"
                  className={`echelon-mobile-course-tab echelon-mobile-tools-trigger${mobileSecondaryTabs.some((tab) => tab.kind === activeTab) ? " is-active" : ""}`}
                  onClick={() => setMobileToolsOpen((open) => !open)}
                  aria-expanded={mobileToolsOpen}
                  aria-label="More study tools"
                >
                  <span>More</span>
                  <ChevronDown size={13} aria-hidden="true" />
                </button>
                {mobileToolsOpen && (
                  <div className="echelon-mobile-tools-menu">
                    {mobileSecondaryTabs.map((tab) => {
                      const Icon = tabIcons[tab.kind];
                      return (
                        <a key={tab.kind} href={tab.href} className={`echelon-mobile-tool-link${activeTab === tab.kind ? " is-active" : ""}`} aria-current={activeTab === tab.kind ? "page" : undefined}>
                          <Icon size={15} aria-hidden="true" />
                          <span>{tab.label}</span>
                        </a>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </nav>
        </div>
      )}

      {menuOpen && (
        <>
          <button className="echelon-menu-backdrop" onClick={() => setMenuOpen(false)} aria-label="Close navigation menu" />
          <div className="echelon-mobile-menu">
            <div className="echelon-mobile-menu-heading">
              <div><strong>Explore Echelon</strong><span>Everything you need, in one place.</span></div>
              <MessageCircleQuestion size={20} aria-hidden="true" />
            </div>
            <div className="echelon-mobile-links">
              {NAV_LINKS.map((item) => (
                <a key={item.href} href={item.href} className={isPathActive(currentPath, item.href) ? "is-active" : ""}>{item.label}</a>
              ))}
            </div>
            <div className="echelon-mobile-resources">
              <span>Study resources</span>
              {RESOURCE_LINKS.map((item) => <Link key={item.href} href={item.href}>{item.label}</Link>)}
            </div>
            <div className="echelon-mobile-actions">
              <Link href="/dashboard"><LayoutDashboard size={17} /> Dashboard</Link>
              <Link href="/account"><CircleUserRound size={17} /> {isSignedIn ? "My account" : "Sign in"}</Link>
            </div>
          </div>
        </>
      )}
    </header>
  );
}
