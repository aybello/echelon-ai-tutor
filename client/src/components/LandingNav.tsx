// Shared navigation bar used by Landing page and WPI Landing page
// Keeps consistent nav across all public-facing pages

import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";

interface LandingNavProps {
  isAuthenticated?: boolean;
  currentPath?: string;
}

const NAV_LINKS = [
  { label: "Courses", href: "/#courses" },
  { label: "WPI 🌊", href: "/wpi" },
  { label: "Pricing", href: "/pricing" },
  { label: "About", href: "/about" },
  { label: "FAQ", href: "/#faq" },
];

const RESOURCES_LINKS = [
  { label: "📐 Formulas", href: "/formulas" },
  { label: "🗺️ Career Map", href: "/career" },
  { label: "🏭 Study Tools", href: "/#tools" },
  { label: "✉️ Contact", href: "/#contact" },
];

export default function LandingNav({ isAuthenticated = false, currentPath }: LandingNavProps) {
  const [location] = useLocation();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [resourcesOpen, setResourcesOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  const activePath = currentPath ?? location;

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <>
      <style>{`
        @media (max-width: 640px) {
          .lnav-links { display: none !important; }
          .lnav-cta { display: none !important; }
          .lnav-hamburger { display: flex !important; }
        }
        @media (min-width: 641px) {
          .lnav-hamburger { display: none !important; }
          .lnav-mobile-drawer { display: none !important; }
        }
      `}</style>

      {/* ── Desktop / Sticky Nav ── */}
      <nav style={{
        background: "#FFFFFF",
        borderBottom: scrolled ? "1px solid transparent" : "1px solid #E2E8F0",
        boxShadow: scrolled ? "0 4px 20px rgba(0,0,0,0.10)" : "none",
        padding: "0 24px",
        position: "sticky", top: 0, zIndex: 100,
        display: "flex", alignItems: "center", justifyContent: "space-between",
        height: 64,
        gap: 12,
        transition: "box-shadow 0.25s ease, border-color 0.25s ease",
        fontFamily: "'Sora', sans-serif",
      }}>
        {/* Brand */}
        <Link href="/">
          <div style={{ display: "flex", alignItems: "center", gap: 10, flexShrink: 0, cursor: "pointer", textDecoration: "none" }}>
            <img
              src="https://d2xsxph8kpxj0f.cloudfront.net/310519663446228701/9KAR7mkGo7x7xavTEeEpiA/echelon-icon-v2_5c9ed3a7.webp"
              alt="Echelon Institute"
              width={46}
              height={44}
              style={{ height: 44, width: 46 }}
            />
            <div>
              <div style={{ fontSize: 15, fontWeight: 800, color: "#0F172A", letterSpacing: "-0.02em" }}>Echelon Institute</div>
              <div style={{ fontSize: 10, color: "#64748B", fontWeight: 500, marginTop: -2 }}>Canadian Water & Wastewater Operator Certification</div>
            </div>
          </div>
        </Link>

        {/* Desktop nav links */}
        <div className="lnav-links" style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "nowrap" }}>
          {NAV_LINKS.map(item => {
            // Match exact path or hash-anchor pages (treat /#courses as active on /)
            const isActive = item.href === activePath ||
              (item.href.startsWith("/#") && activePath === "/") ||
              (item.href !== "/" && activePath.startsWith(item.href));
            return (
              <a key={item.label} href={item.href}
                style={{
                  padding: "6px 14px",
                  borderRadius: "8px 8px 0 0",
                  color: isActive ? "#1D4ED8" : "#475569",
                  fontSize: 13, fontWeight: isActive ? 700 : 600,
                  textDecoration: "none",
                  transition: "color 0.15s, background 0.15s",
                  whiteSpace: "nowrap",
                  borderBottom: isActive ? "2px solid #1D4ED8" : "2px solid transparent",
                  background: isActive ? "rgba(29,78,216,0.05)" : "transparent",
                }}
                onMouseEnter={e => { if (!isActive) { e.currentTarget.style.color = "#1D4ED8"; e.currentTarget.style.background = "rgba(29,78,216,0.06)"; } }}
                onMouseLeave={e => { if (!isActive) { e.currentTarget.style.color = "#475569"; e.currentTarget.style.background = "transparent"; } }}
              >
                {item.label}
              </a>
            );
          })}

          {/* My Passes link */}
          {(() => {
            const isActive = activePath === "/account";
            return (
              <a href="/account"
                style={{
                  padding: "6px 14px",
                  borderRadius: "8px 8px 0 0",
                  color: isActive ? "#1D4ED8" : "#475569",
                  fontSize: 13, fontWeight: isActive ? 700 : 600,
                  textDecoration: "none",
                  transition: "color 0.15s, background 0.15s",
                  whiteSpace: "nowrap",
                  borderBottom: isActive ? "2px solid #1D4ED8" : "2px solid transparent",
                  background: isActive ? "rgba(29,78,216,0.05)" : "transparent",
                }}
                onMouseEnter={e => { if (!isActive) { e.currentTarget.style.color = "#1D4ED8"; e.currentTarget.style.background = "rgba(29,78,216,0.06)"; } }}
                onMouseLeave={e => { if (!isActive) { e.currentTarget.style.color = "#475569"; e.currentTarget.style.background = "transparent"; } }}
              >
                🎫 My Passes
              </a>
            );
          })()}

          {/* Resources dropdown */}
          <div style={{ position: "relative" }}>
            <button
              onClick={() => setResourcesOpen(o => !o)}
              onBlur={() => setTimeout(() => setResourcesOpen(false), 150)}
              onMouseEnter={e => { e.currentTarget.style.color = "#1D4ED8"; e.currentTarget.style.background = "rgba(29,78,216,0.06)"; }}
              onMouseLeave={e => { e.currentTarget.style.color = "#475569"; e.currentTarget.style.background = "transparent"; }}
              style={{
                padding: "6px 14px", borderRadius: 8,
                color: "#475569", fontSize: 13, fontWeight: 600,
                background: "transparent", border: "none",
                cursor: "pointer", fontFamily: "inherit", whiteSpace: "nowrap",
                display: "flex", alignItems: "center", gap: 4,
                transition: "color 0.15s, background 0.15s",
              }}
            >
              Resources <span style={{ fontSize: 9, opacity: 0.6 }}>{resourcesOpen ? "▲" : "▼"}</span>
            </button>
            {resourcesOpen && (
              <div style={{
                position: "absolute", top: "calc(100% + 6px)", left: 0,
                background: "#FFFFFF", border: "1px solid #E2E8F0",
                borderRadius: 10, boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
                minWidth: 180, zIndex: 200, padding: "6px 0",
              }}>
                {RESOURCES_LINKS.map(item => (
                  <a key={item.href} href={item.href}
                    onClick={() => setResourcesOpen(false)}
                    style={{
                      display: "block", padding: "9px 16px",
                      fontSize: 13, color: "#334155", fontWeight: 500,
                      textDecoration: "none",
                    }}
                    onMouseEnter={e => (e.currentTarget.style.background = "#F8FAFC")}
                    onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                  >
                    {item.label}
                  </a>
                ))}
              </div>
            )}
          </div>

          {/* CTA button(s) */}
          {isAuthenticated ? (
            <Link href="/dashboard">
              <button style={{
                padding: "8px 20px", borderRadius: 10,
                background: "linear-gradient(135deg, #1D4ED8, #0E7490)",
                color: "#fff", border: "none", fontSize: 13, fontWeight: 700,
                cursor: "pointer", fontFamily: "inherit", whiteSpace: "nowrap",
              }}>
                📊 Dashboard
              </button>
            </Link>
          ) : (
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <Link href="/team/login">
                <button style={{
                  padding: "8px 16px", borderRadius: 10,
                  background: "transparent",
                  color: "#475569", border: "1.5px solid #CBD5E1", fontSize: 13, fontWeight: 600,
                  cursor: "pointer", fontFamily: "inherit", whiteSpace: "nowrap",
                }}>
                  🏢 Team Login
                </button>
              </Link>
              <Link href="/account">
                <button style={{
                  padding: "8px 16px", borderRadius: 10,
                  background: "transparent",
                  color: "#1D4ED8", border: "1.5px solid #1D4ED8", fontSize: 13, fontWeight: 700,
                  cursor: "pointer", fontFamily: "inherit", whiteSpace: "nowrap",
                }}>
                  Sign In
                </button>
              </Link>
              <Link href="/quiz">
                <button style={{
                  padding: "8px 20px", borderRadius: 10,
                  background: "linear-gradient(135deg, #1D4ED8, #0E7490)",
                  color: "#fff", border: "none", fontSize: 13, fontWeight: 700,
                  cursor: "pointer", fontFamily: "inherit", whiteSpace: "nowrap",
                }}>
                  Try Free →
                </button>
              </Link>
            </div>
          )}
        </div>

        {/* Hamburger button — mobile only */}
        <button
          className="lnav-hamburger"
          onClick={() => setMobileNavOpen(o => !o)}
          aria-label="Open menu"
          style={{
            display: "none",
            background: "transparent",
            border: "1px solid #E2E8F0",
            borderRadius: 8,
            color: "#0F172A",
            fontSize: 18,
            cursor: "pointer",
            padding: "5px 10px",
            lineHeight: 1,
            flexShrink: 0,
          }}
        >
          {mobileNavOpen ? "✕" : "☰"}
        </button>
      </nav>

      {/* Mobile overlay */}
      {mobileNavOpen && (
        <div
          onClick={() => setMobileNavOpen(false)}
          style={{
            position: "fixed", inset: 0,
            background: "rgba(0,0,0,0.4)",
            zIndex: 98,
          }}
        />
      )}

      {/* Mobile nav drawer */}
      <div
        className="lnav-mobile-drawer"
        style={{
          position: "fixed",
          top: 64, left: 0, right: 0,
          background: "#FFFFFF",
          borderBottom: "1px solid #E2E8F0",
          boxShadow: "0 8px 32px rgba(0,0,0,0.15)",
          zIndex: 99,
          transform: mobileNavOpen ? "translateY(0)" : "translateY(calc(-100% - 64px))",
          transition: "transform 0.25s cubic-bezier(0.4,0,0.2,1)",
          fontFamily: "'Sora', sans-serif",
        }}
      >
        {/* Quick action tiles */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr 1fr 1fr",
          gap: 8,
          padding: "12px 16px 10px",
          borderBottom: "1px solid #F1F5F9",
        }}>
          {[
            isAuthenticated
              ? { label: "📊 Dashboard", href: "/dashboard", accent: true }
              : { label: "🔑 Sign In", href: "/account", accent: "purple" },
            { label: "📝 Try Free", href: "/quiz", accent: isAuthenticated ? false : true },
            { label: "🏢 Team Login", href: "/team/login", accent: false },
            { label: "💰 Pricing", href: "/pricing", accent: false },
          ].map(tile => (
            <Link key={tile.href} href={tile.href}>
              <div
                onClick={() => setMobileNavOpen(false)}
                style={{
                  padding: "10px 6px",
                  borderRadius: 10,
                  background: tile.accent === true ? "linear-gradient(135deg, #1D4ED8, #0E7490)" : tile.accent === "purple" ? "linear-gradient(135deg, #7C3AED, #1D4ED8)" : "#F8FAFC",
                  border: tile.accent ? "none" : "1px solid #E2E8F0",
                  color: tile.accent ? "#fff" : "#0F172A",
                  fontSize: 11,
                  fontWeight: 700,
                  textAlign: "center" as const,
                  cursor: "pointer",
                  lineHeight: 1.3,
                }}
              >
                {tile.label}
              </div>
            </Link>
          ))}
        </div>

        {/* Nav link pills */}
        <div style={{
          display: "flex",
          overflowX: "auto",
          gap: 0,
          borderBottom: "1px solid #F1F5F9",
          scrollbarWidth: "none" as const,
        }}>
          {NAV_LINKS.map(item => {
            const isMobileActive = item.href === activePath ||
              (item.href.startsWith("/#") && activePath === "/") ||
              (item.href !== "/" && activePath.startsWith(item.href));
            return (
              <a
                key={item.label}
                href={item.href}
                onClick={() => setMobileNavOpen(false)}
                style={{
                  flexShrink: 0,
                  padding: "11px 14px",
                  color: isMobileActive ? "#1D4ED8" : "#475569",
                  fontSize: 12,
                  fontWeight: isMobileActive ? 700 : 600,
                  textDecoration: "none",
                  whiteSpace: "nowrap",
                  borderBottom: isMobileActive ? "2px solid #1D4ED8" : "2px solid transparent",
                }}
              >
                {item.label}
              </a>
            );
          })}
        </div>

        {/* Study tools 2-col grid */}
        <div style={{ padding: "8px 12px" }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: "#64748B", letterSpacing: "0.1em", textTransform: "uppercase", padding: "4px 4px 6px" }}>Study Tools</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2 }}>
            {[
              { label: "📝 OIT Practice Quiz", href: "/quiz" },
              { label: "📐 Formula Sheet", href: "/formulas" },
              { label: "🏭 Drinking Water Process", href: "/process" },
              { label: "♻️ Wastewater Process", href: "/wastewater" },
              { label: "🚰 Distribution Guide", href: "/distribution-guide" },
              { label: "🔩 Collection Guide", href: "/collection-guide" },
              { label: "⚙️ Pumping Systems", href: "/pumping" },
              { label: "🧠 Math Practice Hub", href: "/math-practice" },
              { label: "🌊 WPI Overview", href: "/wpi" },
              { label: "🃏 OIT Flashcards", href: "/oit-water-flashcards" },
            ].map(item => (
              <Link key={item.href} href={item.href}>
                <div
                  onClick={() => setMobileNavOpen(false)}
                  style={{
                    padding: "8px 10px",
                    borderRadius: 8,
                    color: "#475569",
                    fontSize: 12,
                    fontWeight: 500,
                    cursor: "pointer",
                  }}
                >
                  {item.label}
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Footer row */}
        <div style={{
          display: "flex",
          gap: 16,
          padding: "8px 16px 14px",
          borderTop: "1px solid #F1F5F9",
          flexWrap: "wrap",
        }}>
          {[
            { label: isAuthenticated ? "🎫 My Passes" : "🔑 Sign In / My Passes", href: "/account" },
            { label: "💰 Pricing", href: "/pricing" },
            { label: "ℹ️ About", href: "/about" },
            { label: "❓ FAQ", href: "/#faq" },
          ].map(l => (
            <a
              key={l.href}
              href={l.href}
              onClick={() => setMobileNavOpen(false)}
              style={{
                fontSize: 12,
                color: "#64748B",
                fontWeight: 500,
                textDecoration: "none",
                cursor: "pointer",
              }}
            >
              {l.label}
            </a>
          ))}
        </div>
      </div>
    </>
  );
}
