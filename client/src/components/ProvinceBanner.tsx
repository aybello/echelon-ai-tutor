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
      padding: "10px 16px",
    }}>
      <style>{`
        @keyframes slideDown {
          from { opacity: 0; transform: translateY(-8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .province-banner-inner {
          animation: slideDown 0.3s ease both;
          display: flex;
          align-items: center;
          gap: 10px;
          max-width: 860px;
          margin: 0 auto;
        }
        .province-btn {
          transition: background 0.12s, border-color 0.12s, transform 0.12s;
          flex: 1;
          min-width: 0;
        }
        .province-btn:hover {
          background: rgba(255,255,255,0.14) !important;
          border-color: rgba(255,255,255,0.35) !important;
          transform: translateY(-1px);
        }
        .province-name-full {
          display: inline;
        }
        @media (max-width: 520px) {
          .province-name-full {
            display: none;
          }
          .province-btn {
            padding: 7px 10px !important;
          }
        }
      `}</style>

      <div className="province-banner-inner">
        {/* Label */}
        <div style={{ flexShrink: 0, whiteSpace: "nowrap" }}>
          <span style={{ fontSize: 12, fontWeight: 600, color: "rgba(255,255,255,0.6)" }}>
            📍 <span className="province-name-full">Your province?</span>
          </span>
        </div>

        {/* Province buttons — flex row, each takes equal space */}
        <div style={{ display: "flex", gap: 6, flex: 1, alignItems: "center" }}>
          {PROVINCE_LIST.map(p => (
            <button
              key={p.id}
              className="province-btn"
              onClick={() => onSelect(p.id)}
              title={p.name}
              style={{
                padding: "6px 10px",
                borderRadius: 20,
                border: "1px solid rgba(0,0,0,0.12)",
                background: "rgba(255,255,255,0.07)",
                color: "#fff",
                fontSize: 12,
                fontWeight: 600,
                cursor: "pointer",
                fontFamily: "inherit",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 5,
                whiteSpace: "nowrap",
                overflow: "hidden",
              }}
            >
              <span style={{ fontSize: 14, lineHeight: 1, flexShrink: 0 }}>{p.flag}</span>
              <span style={{ flexShrink: 0 }}>{p.abbr}</span>
              <span className="province-name-full" style={{ fontSize: 10, color: "rgba(255,255,255,0.45)", fontWeight: 400 }}>
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
