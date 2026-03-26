// ECHELON AI TUTOR — StepSolution Component
// Design: Numbered steps with monospace code blocks + tip callout

import { Step } from "@/lib/questions";

interface Props {
  steps: Step[];
  tip: string;
}

export default function StepSolution({ steps, tip }: Props) {
  return (
    <div style={{ marginTop: 14, animation: "fadeUp 0.3s ease both" }}>
      <div
        style={{
          fontSize: 10,
          fontWeight: 700,
          color: "#0F766E",
          letterSpacing: "0.1em",
          marginBottom: 8,
        }}
      >
        📐 STEP-BY-STEP SOLUTION
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {steps.map((s, i) => (
          <div
            key={i}
            style={{ display: "flex", gap: 10, alignItems: "flex-start" }}
          >
            <div
              style={{
                width: 24,
                height: 24,
                borderRadius: "50%",
                background: "#0F766E",
                color: "#fff",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 10,
                fontWeight: 800,
                flexShrink: 0,
                marginTop: 2,
              }}
            >
              {i + 1}
            </div>
            <div
              style={{
                background: "#F0FDF4",
                borderRadius: 8,
                padding: "8px 12px",
                flex: 1,
                border: "1px solid #BBF7D0",
              }}
            >
              <div
                style={{
                  fontSize: 9,
                  fontWeight: 700,
                  color: "#059669",
                  marginBottom: 3,
                  letterSpacing: "0.08em",
                }}
              >
                {s.l.toUpperCase()}
              </div>
              <div
                style={{
                  fontSize: 12,
                  color: "#064E3B",
                  fontFamily: "'JetBrains Mono', 'Fira Code', 'Courier New', monospace",
                  fontWeight: 600,
                }}
              >
                {s.c}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Tip callout */}
      <div
        style={{
          marginTop: 10,
          background: "#EFF6FF",
          borderRadius: 8,
          padding: "10px 12px",
          borderLeft: "3px solid #2563EB",
        }}
      >
        <span style={{ fontSize: 9, fontWeight: 700, color: "#1D4ED8" }}>
          💡 TIP{"  "}
        </span>
        <span style={{ fontSize: 11, color: "#1E3A5F", lineHeight: 1.6 }}>
          {tip}
        </span>
      </div>
    </div>
  );
}
