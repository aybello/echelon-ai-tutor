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
  { label: "📐 Formulas",      href: "/formulas" },
  { label: "🏭 Process Guide", href: "/process" },
  { label: "♻️ Wastewater",    href: "/wastewater" },
  { label: "⚙️ Pumping",       href: "/pumping" },
  { label: "🧪 Chem Calc",     href: "/chem-calc" },
  { label: "🔬 Lab",           href: "/lab" },
  { label: "🗺️ Career Map",    href: "/career" },
  { label: "📋 Mock Exam",     href: "/mock-exam" },
  { label: "ℹ️ About",         href: "/about" },
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
  const PRIMARY = ["/quiz", "/formulas", "/career", "/about"];

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
            fontFamily: "'Sora', sans-serif",
            fontWeight: 800,
            fontSize: 17,
            color: "#FFFFFF",
            cursor: "pointer",
            letterSpacing: "-0.02em",
            whiteSpace: "nowrap",
          }}>
            {brandName}
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
        <div style={{
          padding: "0 20px 12px",
          borderBottom: "1px solid rgba(255,255,255,0.08)",
          marginBottom: 8,
        }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.35)", letterSpacing: "0.1em", textTransform: "uppercase" }}>
            Navigation
          </div>
        </div>

        {NAV_LINKS.map(l => (
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
        ))}

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
              Start Free OIT Practice →
            </button>
          </Link>
        </div>
      </div>
    </>
  );
}
