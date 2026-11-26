import React from "react";

export type ProductStateProps = {
  title: string;
  description: string;
  action?: { label: string; href?: string; onClick?: () => void };
  supportCode?: string;
};

export function ProductErrorState({ title, description, action, supportCode }: ProductStateProps) {
  return (
    <div style={{
      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
      padding: "48px 24px", textAlign: "center", maxWidth: 480, margin: "0 auto",
    }}>
      <div style={{ fontSize: 40, marginBottom: 16 }}>⚠️</div>
      <h3 style={{ fontSize: 18, fontWeight: 700, color: "#0F172A", marginBottom: 8 }}>{title}</h3>
      <p style={{ fontSize: 14, color: "#64748B", lineHeight: 1.6, marginBottom: 20 }}>{description}</p>
      {action && (
        action.href ? (
          <a
            href={action.href}
            style={{
              display: "inline-block", padding: "10px 20px", borderRadius: 8,
              background: "#0047AB", color: "#fff", fontWeight: 600, fontSize: 14,
              textDecoration: "none",
            }}
          >
            {action.label}
          </a>
        ) : (
          <button
            onClick={action.onClick}
            style={{
              padding: "10px 20px", borderRadius: 8, background: "#0047AB",
              color: "#fff", fontWeight: 600, fontSize: 14, border: "none", cursor: "pointer",
            }}
          >
            {action.label}
          </button>
        )
      )}
      {supportCode && (
        <p style={{ fontSize: 11, color: "#94A3B8", marginTop: 16 }}>
          Support code: <code style={{ fontFamily: "monospace" }}>{supportCode}</code>
        </p>
      )}
    </div>
  );
}

export function ProductEmptyState({ title, description, action }: ProductStateProps) {
  return (
    <div style={{
      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
      padding: "48px 24px", textAlign: "center", maxWidth: 480, margin: "0 auto",
    }}>
      <div style={{ fontSize: 40, marginBottom: 16 }}>📭</div>
      <h3 style={{ fontSize: 18, fontWeight: 700, color: "#0F172A", marginBottom: 8 }}>{title}</h3>
      <p style={{ fontSize: 14, color: "#64748B", lineHeight: 1.6, marginBottom: 20 }}>{description}</p>
      {action && (
        action.href ? (
          <a
            href={action.href}
            style={{
              display: "inline-block", padding: "10px 20px", borderRadius: 8,
              background: "#0047AB", color: "#fff", fontWeight: 600, fontSize: 14,
              textDecoration: "none",
            }}
          >
            {action.label}
          </a>
        ) : (
          <button
            onClick={action.onClick}
            style={{
              padding: "10px 20px", borderRadius: 8, background: "#0047AB",
              color: "#fff", fontWeight: 600, fontSize: 14, border: "none", cursor: "pointer",
            }}
          >
            {action.label}
          </button>
        )
      )}
    </div>
  );
}

export function ProductLoadingState({ label }: { label: string }) {
  return (
    <div style={{
      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
      padding: "48px 24px", textAlign: "center",
    }}>
      <div style={{
        width: 36, height: 36, borderRadius: "50%",
        border: "3px solid #E2E8F0", borderTopColor: "#0047AB",
        animation: "spin 0.8s linear infinite", marginBottom: 16,
      }} />
      <p style={{ fontSize: 14, color: "#64748B" }}>{label}</p>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
