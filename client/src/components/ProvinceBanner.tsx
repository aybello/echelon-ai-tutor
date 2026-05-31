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
      background: "rgba(15,23,42,0.97)",
      borderBottom: "1px solid rgba(255,255,255,0.07)",
      padding: "10px 20px",
      display: "flex",
      alignItems: "center",
      gap: 12,
      justifyContent: "center",
    }}>
      <style>{`
        @keyframes slideDown {
          from { opacity: 0; transform: translateY(-8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .province-banner-wrap {
          animation: slideDown 0.3s ease both;
          display: flex;
          align-items: center;
          gap: 12;
          width: 100%;
          max-width: 860px;
          justify-content: space-between;
        }
        .province-btn {
          transition: background 0.12s, border-color 0.12s, transform 0.12s;
          position: relative;
        }
        .province-btn:hover {
          background: rgba(255,255,255,0.14) !important;
          border-color: rgba(255,255,255,0.35) !important;
          transform: translateY(-1px);
        }
        .province-btn .tooltip {
          display: none;
          position: absolute;
          bottom: calc(100% + 6px);
          left: 50%;
          transform: translateX(-50%);
          background: #1E293B;
          color: #fff;
          font-size: 11px;
          font-weight: 600;
          padding: 4px 10px;
          border-radius: 6px;
          white-space: nowrap;
          pointer-events: none;
          border: 1px solid rgba(255,255,255,0.1);
          z-index: 10;
        }
        .province-btn:hover .tooltip {
          display: block;
        }
      `}</style>

      <div className="province-banner-wrap">
        {/* Label */}
        <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
          <span style={{ fontSize: 13, color: "rgba(255,255,255,0.5)" }}>📍</span>
          <span style={{ fontSize: 12, fontWeight: 600, color: "rgba(255,255,255,0.7)", whiteSpace: "nowrap" }}>
            Your province?
          </span>
        </div>

        {/* Province buttons */}
        <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
          {PROVINCE_LIST.map(p => (
            <button
              key={p.id}
              className="province-btn"
              onClick={() => onSelect(p.id)}
              title={p.name}
              style={{
                padding: "5px 12px",
                borderRadius: 20,
                border: "1px solid rgba(255,255,255,0.15)",
                background: "rgba(255,255,255,0.07)",
                color: "#fff",
                fontSize: 12,
                fontWeight: 600,
                cursor: "pointer",
                fontFamily: "inherit",
                display: "flex",
                alignItems: "center",
                gap: 5,
                whiteSpace: "nowrap",
              }}
            >
              <span style={{ fontSize: 14, lineHeight: 1 }}>{p.flag}</span>
              <span>{p.abbr}</span>
              <span style={{ fontSize: 10, color: "rgba(255,255,255,0.45)", fontWeight: 400 }}>{p.name}</span>
              <div className="tooltip">{p.name}</div>
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
            color: "rgba(255,255,255,0.3)",
            fontSize: 14,
            cursor: "pointer",
            padding: "4px 6px",
            borderRadius: 4,
            lineHeight: 1,
            flexShrink: 0,
            fontFamily: "inherit",
            transition: "color 0.12s",
          }}
          onMouseEnter={e => (e.currentTarget.style.color = "rgba(255,255,255,0.7)")}
          onMouseLeave={e => (e.currentTarget.style.color = "rgba(255,255,255,0.3)")}
        >
          ✕
        </button>
      </div>
    </div>
  );
}
