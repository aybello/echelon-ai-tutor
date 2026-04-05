// ProvinceBanner — "What province are you in?" prompt
// Appears at the top of the homepage on first visit.
// Selecting a province stores it in localStorage and reorders course recommendations.

import { PROVINCE_LIST, type ProvinceId } from "@/hooks/useProvince";

interface Props {
  onSelect: (id: ProvinceId) => void;
  onDismiss: () => void;
}

export default function ProvinceBanner({ onSelect, onDismiss }: Props) {
  return (
    <div style={{
      background: "linear-gradient(135deg, #0F172A 0%, #1E3A5F 100%)",
      borderBottom: "1px solid rgba(255,255,255,0.08)",
      padding: "14px 28px",
      display: "flex",
      alignItems: "center",
      gap: 16,
      flexWrap: "wrap",
      position: "relative",
      animation: "slideDown 0.35s ease both",
    }}>
      <style>{`
        @keyframes slideDown {
          from { opacity: 0; transform: translateY(-12px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .province-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 14px rgba(59,130,246,0.35) !important;
        }
      `}</style>

      {/* Label */}
      <div style={{ flexShrink: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: "#fff", marginBottom: 1 }}>
          📍 What province are you in?
        </div>
        <div style={{ fontSize: 11, color: "rgba(255,255,255,0.55)" }}>
          We'll show you the most relevant courses first.
        </div>
      </div>

      {/* Province buttons */}
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", flex: 1 }}>
        {PROVINCE_LIST.map(p => (
          <button
            key={p.id}
            className="province-btn"
            onClick={() => onSelect(p.id)}
            style={{
              padding: "8px 16px",
              borderRadius: 10,
              border: "1.5px solid rgba(255,255,255,0.18)",
              background: "rgba(255,255,255,0.08)",
              color: "#fff",
              fontSize: 12,
              fontWeight: 600,
              cursor: "pointer",
              fontFamily: "inherit",
              transition: "all 0.15s",
              display: "flex",
              alignItems: "center",
              gap: 6,
            }}
          >
            <span style={{ fontSize: 16 }}>{p.flag}</span>
            <span>{p.abbr}</span>
            <span style={{ fontSize: 10, color: "rgba(255,255,255,0.5)", fontWeight: 400 }}>
              {p.name}
            </span>
          </button>
        ))}
      </div>

      {/* Dismiss */}
      <button
        onClick={onDismiss}
        title="Dismiss"
        style={{
          background: "transparent",
          border: "none",
          color: "rgba(255,255,255,0.4)",
          fontSize: 18,
          cursor: "pointer",
          padding: "4px 8px",
          borderRadius: 6,
          lineHeight: 1,
          flexShrink: 0,
          fontFamily: "inherit",
          transition: "color 0.15s",
        }}
        onMouseEnter={e => (e.currentTarget.style.color = "rgba(255,255,255,0.8)")}
        onMouseLeave={e => (e.currentTarget.style.color = "rgba(255,255,255,0.4)")}
      >
        ✕
      </button>
    </div>
  );
}
