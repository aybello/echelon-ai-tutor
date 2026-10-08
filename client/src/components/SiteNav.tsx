import { useEffect, useRef, useState, type ReactNode } from "react";
import { Link, useSearch } from "wouter";
import {
  BookOpen, ChevronDown, CircleUserRound, FileCheck2, FlaskConical,
  Gauge, GraduationCap, LayoutDashboard, Menu, MessageCircleQuestion,
  NotebookTabs, Sigma, Sparkles, X, Zap,
} from "lucide-react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { getActiveWorkspaceTab, getCourseForPath, getCourseWorkspaceTabs, getMobileWorkspaceTabs } from "@/lib/courseNavigation";
import { buildPricingHref, courseProvinceHref, signInHref } from "@shared/funnelNavigation";
import { resolveCourseKey } from "@shared/courseRegistry";
import { readUSStudyContext, usCatalogueHref } from "@shared/usStudyContext";

export const ECHELON_LOGO_URL = "https://d2xsxph8kpxj0f.cloudfront.net/310519663446228701/9KAR7mkGo7x7xavTEeEpiA/echelon-icon-v2_5c9ed3a7.webp";

export const NAV_LINKS = [
  { label: "Courses", href: "/#courses" },
  { label: "309A Electrician", href: "/electrician-309a" },
  { label: "Process Guides", href: "/guides" },
  { label: "WPI", href: "/wpi" },
  { label: "US", href: "/us" },
  { label: "Pricing", href: "/pricing" },
  { label: "Jobs", href: "/jobs" },
  { label: "Blog", href: "/blog" },
  { label: "About", href: "/about" },
];

const RESOURCE_LINKS = [
  { label: "Continuing education", href: "/continuing-education", description: "Ontario operator learning paths" },
  { label: "Study guides", href: "/guides", description: "Water and wastewater process guides" },
  { label: "Equipment Lab", href: "/equipment-lab", description: "Explore equipment and process flow" },
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
  const search = useSearch();
  const progressCourseKey = currentPath.split("?")[0] === "/dashboard" ? new URLSearchParams(search).get("course") : null;
  const course = getCourseForPath(currentPath) ?? (progressCourseKey ? resolveCourseKey(progressCourseKey) : undefined);
  const learningMode = variant === "learning" || (variant === "auto" && !!course);
  const isSignedIn = authenticatedOverride ?? (isAuthenticated || !!dashboardMe.data?.email);
  const destination = `${currentPath.split("?")[0]}${search ? `?${search}` : ""}`;
  const accountHref = isSignedIn ? "/account" : signInHref(destination);
  const courseProvince = new URLSearchParams(search).get("province");
  const usContext = readUSStudyContext(search);
  // A dedicated US course is always a US context. A shared WPI course only
  // counts as US when the learner actually carries US study context, so a
  // Canadian learner never sees US framing.
  const isDedicatedUSCourse = course?.examFamily === "us-wpi";
  const isSharedUSCourse = course?.examFamily === "western" && usContext.isUS;
  const isUSCourse = isDedicatedUSCourse || isSharedUSCourse;
  const dashboardHref = course ? courseProvinceHref(`/dashboard?course=${encodeURIComponent(course.courseKey)}`, course.courseKey, courseProvince, search) : "/dashboard";
  const pricingHref = course ? buildPricingHref(course.courseKey, courseProvince, search) : "/pricing";
  const workspaceTabs = course ? getCourseWorkspaceTabs(course).map(tab => ({ ...tab, href: courseProvinceHref(tab.href, course.courseKey, courseProvince, search) })) : [];
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
        <Link href={isUSCourse ? "/us" : "/"} className="echelon-brand" aria-label="Echelon Institute home">
          <img src={ECHELON_LOGO_URL} alt="Echelon Institute logo" width={42} height={40} />
          <span className="echelon-brand-copy">
            <strong>{brandName}</strong>
            <small>{course?.courseKey === "electrician-309a" ? "309A electrician exam prep" : "Operator certification prep"}</small>
          </span>
        </Link>

        <div className="echelon-desktop-links">
          {learningMode ? <Link href="/account" className="echelon-nav-link">My courses</Link> : <>
          <Link href="/#courses" className={`echelon-nav-link${isPathActive(currentPath, "/") ? " is-active" : ""}`}>Courses</Link>
          <Link href="/electrician-309a" className={`echelon-nav-link${isPathActive(currentPath, "/electrician-309a") ? " is-active" : ""}`}>309A Electrician</Link>
          <Link href="/wpi" className={`echelon-nav-link${isPathActive(currentPath, "/wpi") ? " is-active" : ""}`}>WPI</Link>
          <Link href="/us" className={`echelon-nav-link${isPathActive(currentPath, "/us") ? " is-active" : ""}`}>US</Link>
          <Link href={pricingHref} className={`echelon-nav-link${isPathActive(currentPath, "/pricing") ? " is-active" : ""}`}>Pricing</Link>
          <ResourcesMenu currentPath={currentPath} />
          </>}
          <Link href="/jobs" className={`echelon-nav-link${isPathActive(currentPath, "/jobs") ? " is-active" : ""}`} aria-current={isPathActive(currentPath, "/jobs") ? "page" : undefined}>Jobs</Link>
          <Link href="/blog" className={`echelon-nav-link${isPathActive(currentPath, "/blog") ? " is-active" : ""}`} aria-current={isPathActive(currentPath, "/blog") ? "page" : undefined}>Blog</Link>
        </div>

        <div className="echelon-nav-actions">
          {rightSlot}
          <Link href={dashboardHref} className="echelon-dashboard-link">
            <LayoutDashboard size={16} aria-hidden="true" />
            <span>Dashboard</span>
          </Link>
          <Link href={accountHref} className="echelon-account-link">
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
            {course.courseKey === "electrician-309a" ? <Zap size={16} aria-hidden="true" /> : <FlaskConical size={16} aria-hidden="true" />}
            <span>{course.shortName}</span>
            <small>{isDedicatedUSCourse
              ? `${usContext.state?.name ?? "United States"} / US Class I`
              : isSharedUSCourse
                ? `${usContext.state?.name ?? "US"} / Shared WPI`
                : course.examFamily === "western" ? "WPI / Western Canada" : "Ontario"}</small>
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
                <a key={item.href} href={item.href === "/pricing" ? pricingHref : item.href === "/#courses" && isUSCourse ? usCatalogueHref(usContext.state?.code) : item.href} className={isPathActive(currentPath, item.href) ? "is-active" : ""}>{item.label}</a>
              ))}
            </div>
            <div className="echelon-mobile-resources">
              <span>Study resources</span>
              {RESOURCE_LINKS.map((item) => <Link key={item.href} href={item.href}>{item.label}</Link>)}
            </div>
            <div className="echelon-mobile-actions">
              <Link href={dashboardHref}><LayoutDashboard size={17} /> Dashboard</Link>
              <Link href={accountHref}><CircleUserRound size={17} /> {isSignedIn ? "My account" : "Sign in"}</Link>
            </div>
          </div>
        </>
      )}
    </header>
  );
}
