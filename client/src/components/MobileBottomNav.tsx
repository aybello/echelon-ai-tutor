import { Link, useLocation } from "wouter";

const ITEMS = [
  { label: "Home", href: "/", icon: "🏠" },
  { label: "Courses", href: "/pricing", icon: "📚" },
  { label: "Formulas", href: "/formulas", icon: "📐" },
  { label: "My Passes", href: "/account", icon: "🎫" },
];

export default function MobileBottomNav() {
  const [path] = useLocation();

  // Hide on quiz/exam pages where the sticky action bar would conflict
  const hideOnPaths = ["/quiz", "/mock", "/exam"];
  const shouldHide = hideOnPaths.some(p => path.includes(p));
  if (shouldHide) return null;

  return (
    <nav
      style={{
        position: "fixed",
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 50,
        background: "#0F172A",
        borderTop: "1px solid #1E293B",
        paddingBottom: "env(safe-area-inset-bottom)",
      }}
      className="echelon-mobile-bottom-nav"
    >
      {ITEMS.map(it => {
        const active = path === it.href;
        return (
          <Link
            key={it.href}
            href={it.href}
            style={{
              flex: 1,
              textAlign: "center",
              padding: "8px 0",
              color: active ? "#38BDF8" : "#94A3B8",
              fontSize: 10,
              fontWeight: 600,
              textDecoration: "none",
              fontFamily: "'Sora', sans-serif",
            }}
          >
            <div style={{ fontSize: 18 }}>{it.icon}</div>
            {it.label}
          </Link>
        );
      })}
    </nav>
  );
}
