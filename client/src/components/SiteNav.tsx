/**
 * SiteNav — Shared sticky navigation bar with mobile hamburger drawer.
 * Used across all tool pages for consistent navigation.
 *
 * Usage:
 *   <SiteNav currentPath="/quiz" />
 */
import { useState, useEffect } from "react";
import type { ReactNode } from "react";
import { Link } from "wouter";

export const NAV_LINKS = [
  { label: "🏠 Home",          href: "/" },
  { label: "📝 OIT Practice",  href: "/quiz" },
  { label: "📋 OIT Mock Exam",  href: "/oit-mock" },
  { label: "💧 C1 Water Practice", href: "/class1-water" },
  { label: "📋 C1 Water Mock",    href: "/class1-water-mock" },
  { label: "📐 C1 Water Formulas", href: "/formulas-water1" },
  { label: "💧 C2 Water Practice", href: "/class2-water" },
  { label: "📋 C2 Water Mock",    href: "/class2-water-mock" },
  { label: "📐 C2 Water Formulas", href: "/formulas-water2" },
  { label: "🦠 C1 WW Practice",   href: "/class1-ww" },
  { label: "📋 C1 WW Mock",       href: "/class1-ww-mock" },
  { label: "📐 C1 WW Formulas",   href: "/formulas-ww1" },
  { label: "♻️ C2 WW Practice",   href: "/class2-ww" },
  { label: "📋 C2 WW Mock",       href: "/class2-ww-mock" },
  { label: "📐 C2 WW Formulas",   href: "/formulas-ww2" },
  { label: "💧 C3 Water Practice", href: "/class3-water" },
  { label: "📋 C3 Water Mock",     href: "/class3-water-mock" },
  { label: "📐 C3 Water Formulas", href: "/formulas-water3" },
  { label: "💧 C4 Water Practice", href: "/class4-water" },
  { label: "📋 C4 Water Mock",     href: "/class4-water-mock" },
  { label: "📐 C4 Water Formulas", href: "/formulas-water4" },
  { label: "🏭 C3 WW Practice",   href: "/class3-ww" },
  { label: "📋 C3 WW Mock",       href: "/class3-ww-mock" },
  { label: "📐 C3 WW Formulas",   href: "/formulas-ww3" },
  { label: "🏭 C4 WW Practice",   href: "/class4-ww" },
  { label: "📋 C4 WW Mock",       href: "/class4-ww-mock" },
  { label: "📐 C4 WW Formulas",   href: "/formulas-ww4" },
  { label: "🧪 WQA Practice",   href: "/wqa" },
  { label: "🔬 WQA Mock Exam",  href: "/wqa-mock" },
  { label: "📐 WQA Formulas",   href: "/formulas-wqa" },
  // WPI (BC / AB / SK / MB)
  { label: "🌊 WPI C1 Water Practice", href: "/wpi-class1-water" },
  { label: "📋 WPI C1 Water Mock",     href: "/wpi-class1-water-mock" },
  { label: "📐 WPI C1 Water Formulas", href: "/formulas-wpi-class1" },
  { label: "🌊 WPI C2 Water Practice", href: "/wpi-class2-water" },
  { label: "📋 WPI C2 Water Mock",     href: "/wpi-class2-water-mock" },
  { label: "📐 WPI C2 Water Formulas", href: "/formulas-wpi-class2" },
  { label: "🌊 WPI C3 Water Practice", href: "/wpi-class3-water" },
  { label: "📋 WPI C3 Water Mock",     href: "/wpi-class3-water-mock" },
  { label: "📐 WPI C3 Water Formulas", href: "/formulas-wpi-class3" },
  { label: "🌊 WPI C4 Water Practice", href: "/wpi-class4-water" },
  { label: "📋 WPI C4 Water Mock",     href: "/wpi-class4-water-mock" },
  { label: "📐 WPI C4 Water Formulas", href: "/formulas-wpi-class4" },
  { label: "🌊 WPI C1 WW Practice",    href: "/wpi-class1-wastewater" },
  { label: "📋 WPI C1 WW Mock",        href: "/wpi-class1-wastewater-mock" },
  { label: "📐 WPI C1 WW Formulas",    href: "/formulas-wpi-class1-ww" },
  { label: "🌊 WPI C2 WW Practice",    href: "/wpi-class2-wastewater" },
  { label: "📋 WPI C2 WW Mock",        href: "/wpi-class2-wastewater-mock" },
  { label: "📐 WPI C2 WW Formulas",    href: "/formulas-wpi-class2-ww" },
  { label: "🌊 WPI C3 WW Practice",    href: "/wpi-class3-wastewater" },
  { label: "📋 WPI C3 WW Mock",        href: "/wpi-class3-wastewater-mock" },
  { label: "📐 WPI C3 WW Formulas",    href: "/formulas-wpi-class3-ww" },
  { label: "🏛️ WPI C4 WW Practice",    href: "/wpi-class4-wastewater" },
  { label: "📋 WPI C4 WW Mock",        href: "/wpi-class4-wastewater-mock" },
  { label: "📐 WPI C4 WW Formulas",    href: "/formulas-wpi-class4-ww" },
  { label: "🌊 WPI Overview",         href: "/wpi" },
  { label: "📐 Formulas",      href: "/formulas" },
  { label: "🏭 Process Guide", href: "/process" },
  { label: "♻️ Wastewater",    href: "/wastewater" },
  { label: "⚙️ Pumping",       href: "/pumping" },
  { label: "🎛️ Instrumentation", href: "/instrumentation" },
  { label: "🧮 Math Practice", href: "/math-practice" },
  { label: "🧪 Chem Calc",     href: "/chem-calc" },
  { label: "🔬 Lab",           href: "/lab" },
  { label: "🗺️ Career Map",    href: "/career" },
  { label: "📋 Mock Exam",     href: "/mock-exam" },
  { label: "ℹ️ About",         href: "/about" },
  { label: "🎫 My Passes",      href: "/account" },
];

// Grouped sections for the mobile drawer
const DRAWER_SECTIONS = [
  {
    key: "oit",
    label: "OIT — Operator in Training",
    color: "#60A5FA",
    links: [
      { label: "Practice Questions", href: "/quiz" },
      { label: "Mock Exam", href: "/oit-mock" },
      { label: "Formulas", href: "/formulas" },
    ],
  },
  {
    key: "ontario-water",
    label: "Ontario Water",
    color: "#34D399",
    links: [
      { label: "Class 1 Practice", href: "/class1-water" },
      { label: "Class 1 Mock", href: "/class1-water-mock" },
      { label: "Class 2 Practice", href: "/class2-water" },
      { label: "Class 2 Mock", href: "/class2-water-mock" },
      { label: "Class 3 Practice", href: "/class3-water" },
      { label: "Class 3 Mock", href: "/class3-water-mock" },
      { label: "Class 4 Practice", href: "/class4-water" },
      { label: "Class 4 Mock", href: "/class4-water-mock" },
    ],
  },
  {
    key: "ontario-ww",
    label: "Ontario Wastewater",
    color: "#A78BFA",
    links: [
      { label: "Class 1 Practice", href: "/class1-ww" },
      { label: "Class 1 Mock", href: "/class1-ww-mock" },
      { label: "Class 2 Practice", href: "/class2-ww" },
      { label: "Class 2 Mock", href: "/class2-ww-mock" },
      { label: "Class 3 Practice", href: "/class3-ww" },
      { label: "Class 3 Mock", href: "/class3-ww-mock" },
      { label: "Class 4 Practice", href: "/class4-ww" },
      { label: "Class 4 Mock", href: "/class4-ww-mock" },
    ],
  },
  {
    key: "wpi",
    label: "WPI — BC / AB / SK / MB",
    color: "#38BDF8",
    links: [
      { label: "WPI Overview", href: "/wpi" },
      { label: "C1 Water Practice", href: "/wpi-class1-water" },
      { label: "C2 Water Practice", href: "/wpi-class2-water" },
      { label: "C1 WW Practice", href: "/wpi-class1-wastewater" },
      { label: "C2 WW Practice", href: "/wpi-class2-wastewater" },
    ],
  },
  {
    key: "wqa",
    label: "WQA — Water Quality Analyst",
    color: "#FCD34D",
    links: [
      { label: "Practice Questions", href: "/wqa" },
      { label: "Mock Exam", href: "/wqa-mock" },
      { label: "Formulas", href: "/formulas-wqa" },
    ],
  },
  {
    key: "guides",
    label: "Study Guides & Tools",
    color: "#FB923C",
    links: [
      { label: "💧 Process Guide", href: "/process" },
      { label: "♻️ Wastewater Guide", href: "/wastewater" },
      { label: "📐 Formulas", href: "/formulas" },
      { label: "🗺️ Career Map", href: "/career" },
      { label: "🎫 My Passes", href: "/account" },
    ],
  },
];

interface SiteNavProps {
  currentPath: string;
  /** Override the brand name shown (defaults to "Echelon Institute") */
  brandName?: string;
  /** Optional content to render on the right side of the nav bar (e.g. action buttons) */
  rightSlot?: ReactNode;
}

/** Returns the 5-6 most contextually relevant desktop nav links for the current path. */
function getContextualPrimary(currentPath: string): string[] {
  // WPI Water pages
  if (currentPath.startsWith("/wpi-class1-water")) return ["/wpi-class1-water", "/wpi-class1-water-mock", "/formulas-wpi-class1", "/wpi", "/career", "/account"];
  if (currentPath.startsWith("/wpi-class2-water")) return ["/wpi-class2-water", "/wpi-class2-water-mock", "/formulas-wpi-class2", "/wpi", "/career", "/account"];
  if (currentPath.startsWith("/wpi-class3-water")) return ["/wpi-class3-water", "/wpi-class3-water-mock", "/formulas-wpi-class3", "/wpi", "/career", "/account"];
  if (currentPath.startsWith("/wpi-class4-water")) return ["/wpi-class4-water", "/wpi-class4-water-mock", "/formulas-wpi-class4", "/wpi", "/career", "/account"];
  // WPI Wastewater pages
  if (currentPath.startsWith("/wpi-class1-wastewater")) return ["/wpi-class1-wastewater", "/wpi-class1-wastewater-mock", "/formulas-wpi-class1-ww", "/wpi", "/career", "/account"];
  if (currentPath.startsWith("/wpi-class2-wastewater")) return ["/wpi-class2-wastewater", "/wpi-class2-wastewater-mock", "/formulas-wpi-class2-ww", "/wpi", "/career", "/account"];
  if (currentPath.startsWith("/wpi-class3-wastewater")) return ["/wpi-class3-wastewater", "/wpi-class3-wastewater-mock", "/formulas-wpi-class3-ww", "/wpi", "/career", "/account"];
  if (currentPath.startsWith("/wpi-class4-wastewater")) return ["/wpi-class4-wastewater", "/wpi-class4-wastewater-mock", "/formulas-wpi-class4-ww", "/wpi", "/career", "/account"];
  // WPI landing
  if (currentPath === "/wpi") return ["/wpi-class1-water", "/wpi-class1-wastewater", "/wpi", "/career", "/pricing", "/account"];
  // Ontario Water pages
  if (currentPath.startsWith("/class1-water")) return ["/class1-water", "/class1-water-mock", "/formulas-water1", "/career", "/pricing", "/account"];
  if (currentPath.startsWith("/class2-water")) return ["/class2-water", "/class2-water-mock", "/formulas-water2", "/career", "/pricing", "/account"];
  if (currentPath.startsWith("/class3-water")) return ["/class3-water", "/class3-water-mock", "/formulas-water3", "/career", "/pricing", "/account"];
  if (currentPath.startsWith("/class4-water")) return ["/class4-water", "/class4-water-mock", "/formulas-water4", "/career", "/pricing", "/account"];
  // Ontario Wastewater pages
  if (currentPath.startsWith("/class1-ww")) return ["/class1-ww", "/class1-ww-mock", "/formulas-ww1", "/career", "/pricing", "/account"];
  if (currentPath.startsWith("/class2-ww")) return ["/class2-ww", "/class2-ww-mock", "/formulas-ww2", "/career", "/pricing", "/account"];
  if (currentPath.startsWith("/class3-ww")) return ["/class3-ww", "/class3-ww-mock", "/formulas-ww3", "/career", "/pricing", "/account"];
  if (currentPath.startsWith("/class4-ww")) return ["/class4-ww", "/class4-ww-mock", "/formulas-ww4", "/career", "/pricing", "/account"];
  // OIT pages
  if (currentPath === "/quiz" || currentPath === "/oit-mock") return ["/quiz", "/oit-mock", "/formulas", "/career", "/pricing", "/account"];
  if (currentPath === "/oit-ww" || currentPath === "/oit-ww-mock") return ["/oit-ww", "/oit-ww-mock", "/formulas-ww1", "/career", "/pricing", "/account"];
  // WQA pages
  if (currentPath.startsWith("/wqa")) return ["/wqa", "/wqa-mock", "/formulas-wqa", "/career", "/pricing", "/account"];
  // Formula / tool pages
  if (currentPath.startsWith("/formulas")) return ["/formulas", "/quiz", "/career", "/pricing", "/about", "/account"];
  if (currentPath === "/instrumentation") return ["/instrumentation", "/pumping", "/process", "/formulas", "/career", "/account"];
  if (currentPath === "/career") return ["/career", "/quiz", "/formulas", "/pricing", "/about", "/account"];
  if (currentPath === "/pricing") return ["/pricing", "/quiz", "/formulas", "/career", "/about", "/account"];
  if (currentPath === "/account") return ["/account", "/quiz", "/formulas", "/career", "/pricing", "/about"];
  // Default (home, about, tools etc.)
  return ["/quiz", "/formulas", "/career", "/pricing", "/about", "/account"];
}

export default function SiteNav({ currentPath, brandName = "Echelon Institute", rightSlot }: SiteNavProps) {
  const [open, setOpen] = useState(false);
  const [expandedSection, setExpandedSection] = useState<string | null>(null);

  // Lock body scroll when drawer is open so the page behind doesn't scroll
  useEffect(() => {
    if (open) {
      const scrollY = window.scrollY;
      document.body.style.overflow = "hidden";
      document.body.style.position = "fixed";
      document.body.style.top = `-${scrollY}px`;
      document.body.style.width = "100%";
    } else {
      const scrollY = document.body.style.top;
      document.body.style.overflow = "";
      document.body.style.position = "";
      document.body.style.top = "";
      document.body.style.width = "";
      if (scrollY) window.scrollTo(0, -parseInt(scrollY || "0", 10));
    }
    return () => {
      document.body.style.overflow = "";
      document.body.style.position = "";
      document.body.style.top = "";
      document.body.style.width = "";
    };
  }, [open]);

  // Contextual primary links based on current page
  const PRIMARY = getContextualPrimary(currentPath);

  // Auto-expand the section that contains the current path
  const activeSection = DRAWER_SECTIONS.find(s => s.links.some(l => l.href === currentPath))?.key ?? null;

  const toggleSection = (key: string) => {
    setExpandedSection(prev => prev === key ? null : key);
  };

  return (
    <>
      <style>{`
        @media (max-width: 640px) {
          .site-nav-desktop { display: none !important; }
        }
        .drawer-section-link:hover {
          background: rgba(255,255,255,0.06) !important;
        }
      `}</style>
      <nav style={{
        background: "#0F172A",
        borderBottom: "1px solid rgba(255,255,255,0.08)",
        padding: "0 20px",
        height: 56,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        position: "sticky",
        top: 0,
        zIndex: 200,
        gap: 12,
      }}>
        {/* Brand */}
        <Link href="/">
          <span style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            cursor: "pointer",
            textDecoration: "none",
            flexShrink: 0,
          }}>
            <img
              src="https://d2xsxph8kpxj0f.cloudfront.net/310519663446228701/9KAR7mkGo7x7xavTEeEpiA/echelon-icon-v2_37a8727b.png"
              alt="Echelon Institute logo"
              style={{ height: 40, width: "auto", filter: "brightness(0) invert(1)" }}
            />
            <span style={{
              fontFamily: "'Sora', sans-serif",
              fontWeight: 800,
              fontSize: 17,
              color: "#FFFFFF",
              letterSpacing: "-0.02em",
              whiteSpace: "nowrap",
            }}>
              {brandName}
            </span>
          </span>
        </Link>

        {/* Desktop primary links */}
        <div style={{
          display: "flex",
          gap: 4,
          alignItems: "center",
          overflow: "hidden",
        }} className="site-nav-desktop">
          {NAV_LINKS.filter(l => PRIMARY.includes(l.href)).map(l => (
            <Link key={l.href} href={l.href}>
              <span style={{
                color: currentPath === l.href ? "#60A5FA" : "rgba(255,255,255,0.65)",
                fontSize: 12,
                fontWeight: currentPath === l.href ? 700 : 500,
                padding: "5px 12px",
                borderRadius: 7,
                cursor: "pointer",
                whiteSpace: "nowrap",
                background: currentPath === l.href ? "rgba(96,165,250,0.1)" : "transparent",
                transition: "color 0.15s, background 0.15s",
              }}>
                {l.label}
              </span>
            </Link>
          ))}
        </div>

        {/* Right slot (optional action buttons) */}
        {rightSlot && (
          <div style={{ display: "flex", gap: 8, alignItems: "center", flexShrink: 0 }}>
            {rightSlot}
          </div>
        )}

        {/* Hamburger */}
        <button
          onClick={() => setOpen(o => !o)}
          aria-label={open ? "Close menu" : "Open menu"}
          style={{
            background: "transparent",
            border: "1px solid rgba(255,255,255,0.15)",
            borderRadius: 8,
            color: "#fff",
            fontSize: 18,
            cursor: "pointer",
            padding: "5px 10px",
            lineHeight: 1,
            flexShrink: 0,
            transition: "background 0.15s",
          }}
          onMouseEnter={e => (e.currentTarget.style.background = "rgba(255,255,255,0.08)")}
          onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
        >
          {open ? "✕" : "☰"}
        </button>
      </nav>

      {/* Full-screen backdrop */}
      {open && (
        <div
          onClick={() => setOpen(false)}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.6)",
            zIndex: 198,
          }}
        />
      )}

      {/* Full-width drawer panel */}
      <div style={{
        position: "fixed",
        top: 56,
        left: 0,
        right: 0,
        bottom: 0,
        background: "#0F172A",
        zIndex: 199,
        transform: open ? "translateY(0)" : "translateY(-100%)",
        transition: "transform 0.28s cubic-bezier(0.4,0,0.2,1)",
        overflowY: "auto",
        display: "flex",
        flexDirection: "column",
      }}>
        {/* Quick actions row */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 10,
          padding: "16px 16px 12px",
          borderBottom: "1px solid rgba(255,255,255,0.08)",
        }}>
          <Link href="/quiz">
            <div onClick={() => setOpen(false)} style={{
              padding: "14px 12px",
              borderRadius: 12,
              background: "linear-gradient(135deg, #1D4ED8, #0E7490)",
              color: "#fff",
              fontSize: 13,
              fontWeight: 700,
              textAlign: "center",
              cursor: "pointer",
            }}>
              📝 OIT Practice
            </div>
          </Link>
          <Link href="/process">
            <div onClick={() => setOpen(false)} style={{
              padding: "14px 12px",
              borderRadius: 12,
              background: "rgba(255,255,255,0.07)",
              border: "1px solid rgba(255,255,255,0.12)",
              color: "#fff",
              fontSize: 13,
              fontWeight: 600,
              textAlign: "center",
              cursor: "pointer",
            }}>
              🏭 Process Guide
            </div>
          </Link>
          <Link href="/formulas">
            <div onClick={() => setOpen(false)} style={{
              padding: "14px 12px",
              borderRadius: 12,
              background: "rgba(255,255,255,0.07)",
              border: "1px solid rgba(255,255,255,0.12)",
              color: "#fff",
              fontSize: 13,
              fontWeight: 600,
              textAlign: "center",
              cursor: "pointer",
            }}>
              📐 Formulas
            </div>
          </Link>
          <Link href="/career">
            <div onClick={() => setOpen(false)} style={{
              padding: "14px 12px",
              borderRadius: 12,
              background: "rgba(255,255,255,0.07)",
              border: "1px solid rgba(255,255,255,0.12)",
              color: "#fff",
              fontSize: 13,
              fontWeight: 600,
              textAlign: "center",
              cursor: "pointer",
            }}>
              🗺️ Career Map
            </div>
          </Link>
        </div>

        {/* Collapsible sections */}
        <div style={{ flex: 1, overflowY: "auto", padding: "8px 0 32px" }}>
          {DRAWER_SECTIONS.map(section => {
            const isExpanded = expandedSection === section.key || activeSection === section.key;
            const hasActive = section.links.some(l => l.href === currentPath);
            return (
              <div key={section.key}>
                {/* Section header */}
                <button
                  onClick={() => toggleSection(section.key)}
                  style={{
                    width: "100%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "14px 20px",
                    background: hasActive ? "rgba(255,255,255,0.04)" : "transparent",
                    border: "none",
                    borderBottom: "1px solid rgba(255,255,255,0.06)",
                    cursor: "pointer",
                    fontFamily: "inherit",
                  }}
                >
                  <span style={{
                    fontSize: 13,
                    fontWeight: 700,
                    color: hasActive ? section.color : "rgba(255,255,255,0.85)",
                    letterSpacing: "-0.01em",
                  }}>
                    {section.label}
                  </span>
                  <span style={{
                    fontSize: 12,
                    color: "rgba(255,255,255,0.4)",
                    transform: isExpanded ? "rotate(180deg)" : "rotate(0deg)",
                    transition: "transform 0.2s",
                    display: "inline-block",
                  }}>▾</span>
                </button>

                {/* Section links */}
                {isExpanded && (
                  <div style={{ background: "rgba(0,0,0,0.2)" }}>
                    {section.links.map(link => (
                      <Link key={link.href} href={link.href}>
                        <div
                          className="drawer-section-link"
                          onClick={() => setOpen(false)}
                          style={{
                            padding: "12px 20px 12px 32px",
                            color: currentPath === link.href ? section.color : "rgba(255,255,255,0.65)",
                            fontSize: 14,
                            fontWeight: currentPath === link.href ? 700 : 400,
                            cursor: "pointer",
                            borderLeft: currentPath === link.href ? `3px solid ${section.color}` : "3px solid transparent",
                            background: currentPath === link.href ? "rgba(255,255,255,0.04)" : "transparent",
                            transition: "background 0.12s",
                          }}
                        >
                          {link.label}
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            );
          })}

          {/* Account / misc links */}
          <div style={{ padding: "16px 20px 0", marginTop: 8, borderTop: "1px solid rgba(255,255,255,0.08)", display: "flex", gap: 12, flexWrap: "wrap" }}>
            {[
              { label: "🎫 My Passes", href: "/account" },
              { label: "ℹ️ About", href: "/about" },
              { label: "💰 Pricing", href: "/pricing" },
            ].map(l => (
              <Link key={l.href} href={l.href}>
                <span
                  onClick={() => setOpen(false)}
                  style={{
                    fontSize: 13,
                    color: currentPath === l.href ? "#60A5FA" : "rgba(255,255,255,0.5)",
                    fontWeight: currentPath === l.href ? 700 : 400,
                    cursor: "pointer",
                  }}
                >
                  {l.label}
                </span>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
