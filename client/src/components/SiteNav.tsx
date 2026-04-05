/**
 * SiteNav — Shared sticky navigation bar with mobile hamburger drawer.
 * Used across all tool pages for consistent navigation.
 *
 * Usage:
 *   <SiteNav currentPath="/quiz" />
 */
import { useState } from "react";
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
  { label: "🧮 Math Practice", href: "/math-practice" },
  { label: "🧪 Chem Calc",     href: "/chem-calc" },
  { label: "🔬 Lab",           href: "/lab" },
  { label: "🗺️ Career Map",    href: "/career" },
  { label: "📋 Mock Exam",     href: "/mock-exam" },
  { label: "ℹ️ About",         href: "/about" },
  { label: "🎫 My Passes",      href: "/account" },
];

interface SiteNavProps {
  currentPath: string;
  /** Override the brand name shown (defaults to "Echelon Institute") */
  brandName?: string;
  /** Optional content to render on the right side of the nav bar (e.g. action buttons) */
  rightSlot?: ReactNode;
}

export default function SiteNav({ currentPath, brandName = "Echelon Institute", rightSlot }: SiteNavProps) {
  const [open, setOpen] = useState(false);

  // Primary nav links shown in desktop bar (subset to avoid overflow)
  const PRIMARY = ["/quiz", "/class1-water", "/formulas", "/career", "/about", "/account"];

  return (
    <>
      <style>{`
        @media (max-width: 640px) {
          .site-nav-desktop { display: none !important; }
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
          aria-expanded={open}
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

      {/* Drawer overlay */}
      {open && (
        <div
          onClick={() => setOpen(false)}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.5)",
            zIndex: 198,
          }}
        />
      )}

      {/* Drawer panel */}
      <div style={{
        position: "fixed",
        top: 56,
        right: 0,
        width: 260,
        bottom: 0,
        background: "#0F172A",
        borderLeft: "1px solid rgba(255,255,255,0.1)",
        zIndex: 199,
        transform: open ? "translateX(0)" : "translateX(100%)",
        transition: "transform 0.25s cubic-bezier(0.4,0,0.2,1)",
        overflowY: "auto",
        padding: "16px 0 32px",
      }}>
        {/* Drawer brand header */}
        <div style={{
          padding: "12px 20px 16px",
          borderBottom: "1px solid rgba(255,255,255,0.08)",
          marginBottom: 8,
          display: "flex",
          alignItems: "center",
          gap: 10,
        }}>
          <img
            src="https://d2xsxph8kpxj0f.cloudfront.net/310519663446228701/9KAR7mkGo7x7xavTEeEpiA/echelon-icon-v2_37a8727b.png"
            alt="Echelon Institute logo"
            style={{ height: 36, width: "auto", filter: "brightness(0) invert(1)" }}
          />
          <div>
            <div style={{ fontFamily: "'Sora', sans-serif", fontWeight: 800, fontSize: 15, color: "#FFFFFF", letterSpacing: "-0.02em", lineHeight: 1.2 }}>
              {brandName}
            </div>
            <div style={{ fontSize: 10, color: "rgba(255,255,255,0.4)", marginTop: 2 }}>
              Canadian Water &amp; Wastewater
            </div>
          </div>
        </div>

        {NAV_LINKS.map((l, i) => {
          // Insert WPI section header before the first WPI link
          const isWpiStart = l.href === "/wpi-class1-water";
          return (
            <>
              {isWpiStart && (
                <div key="wpi-header" style={{
                  padding: "10px 20px 6px",
                  marginTop: 4,
                  borderTop: "1px solid rgba(255,255,255,0.08)",
                  fontSize: 10,
                  fontWeight: 700,
                  color: "#38BDF8",
                  letterSpacing: "0.1em",
                  textTransform: "uppercase" as const,
                }}>
                  🌊 WPI — BC / AB / SK / MB
                </div>
              )}
              <Link key={l.href} href={l.href}>
                <div
                  onClick={() => setOpen(false)}
              style={{
                padding: "12px 20px",
                color: currentPath === l.href ? "#60A5FA" : "rgba(255,255,255,0.8)",
                fontSize: 14,
                fontWeight: currentPath === l.href ? 700 : 400,
                cursor: "pointer",
                background: currentPath === l.href ? "rgba(96,165,250,0.08)" : "transparent",
                borderLeft: currentPath === l.href ? "3px solid #60A5FA" : "3px solid transparent",
                transition: "background 0.15s",
              }}
              onMouseEnter={e => {
                if (currentPath !== l.href) (e.currentTarget as HTMLDivElement).style.background = "rgba(255,255,255,0.05)";
              }}
              onMouseLeave={e => {
                if (currentPath !== l.href) (e.currentTarget as HTMLDivElement).style.background = "transparent";
              }}
            >
              {l.label}
            </div>
          </Link>
            </>
          );
        })}


        <div style={{ padding: "16px 20px 0", marginTop: 8, borderTop: "1px solid rgba(255,255,255,0.08)" }}>
          <Link href="/quiz">
            <button
              onClick={() => setOpen(false)}
              style={{
                width: "100%",
                padding: "12px",
                borderRadius: 10,
                border: "none",
                background: "linear-gradient(135deg, #1D4ED8, #0F766E)",
                color: "#fff",
                fontSize: 13,
                fontWeight: 700,
                cursor: "pointer",
                fontFamily: "inherit",
              }}
            >
              Start Practising →
            </button>
          </Link>
        </div>
      </div>
    </>
  );
}
