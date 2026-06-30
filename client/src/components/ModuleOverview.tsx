/**
 * ModuleOverview — Study note panel shown above the question card
 * when a specific module is selected in the quiz.
 *
 * Auto-expands when first shown (defaultExpanded=true).
 * Renders: intro paragraph, key concept cards, optional table, and exam tips.
 */

import { useState } from "react";
import type { ModuleOverview } from "@/lib/questionTypes";

// Normalise legacy `keyTopics: string[]` shape into `keyPoints` so the component
// never crashes on distribution/collection banks that were seeded with the old schema.
function normaliseOverview(overview: ModuleOverview & { keyTopics?: string[] }): ModuleOverview {
  if (overview.keyPoints) return overview as ModuleOverview;
  const topics: string[] = (overview as any).keyTopics ?? [];
  return {
    ...overview,
    keyPoints: topics.map(t => ({ heading: t, body: "" })),
    examTips: (overview as any).examTips ?? [],
  };
}

interface ModuleOverviewProps {
  overview: ModuleOverview;
  moduleName: string;
  moduleColor?: string;
  moduleBg?: string;
  moduleIcon?: string;
  defaultExpanded?: boolean;
}

export default function ModuleOverviewPanel({
  overview,
  moduleName,
  moduleColor = "#0369A1",
  moduleBg = "#DBEAFE",
  moduleIcon = "📚",
  defaultExpanded = true,
}: ModuleOverviewProps) {
  const [expanded, setExpanded] = useState(defaultExpanded);
  // Normalise legacy keyTopics shape so we never crash on old-schema banks
  overview = normaliseOverview(overview as any);

  return (
    <div style={{
      background: "#fff",
      borderRadius: 14,
      marginBottom: 16,
      border: `1.5px solid ${moduleColor}33`,
      overflow: "hidden",
      fontFamily: "'Sora', sans-serif",
      boxShadow: expanded ? `0 2px 12px ${moduleColor}18` : "none",
    }}>
      {/* ── Header / toggle ── */}
      <button
        onClick={() => setExpanded(v => !v)}
        style={{
          width: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "14px 18px",
          background: moduleBg,
          border: "none",
          cursor: "pointer",
          fontFamily: "inherit",
          gap: 10,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{
            background: moduleColor,
            color: "#fff",
            borderRadius: 8,
            padding: "4px 10px",
            fontSize: 15,
            lineHeight: 1,
          }}>
            {moduleIcon}
          </span>
          <div style={{ textAlign: "left" }}>
            <div style={{ fontSize: 13, fontWeight: 800, color: moduleColor }}>
              📖 Module Overview — {moduleName}
            </div>
            <div style={{ fontSize: 11, color: "#64748B", marginTop: 1 }}>
              {expanded ? "Click to collapse" : "Key concepts, formulas & exam tips — read before you start"}
            </div>
          </div>
        </div>
        <span style={{
          fontSize: 18,
          color: moduleColor,
          transform: expanded ? "rotate(180deg)" : "rotate(0deg)",
          transition: "transform 0.2s ease",
          flexShrink: 0,
        }}>
          ▾
        </span>
      </button>

      {/* ── Expanded content ── */}
      {expanded && (
        <div style={{ padding: "20px 18px 18px" }}>

          {/* Intro */}
          <p style={{ fontSize: 14, color: "#334155", lineHeight: 1.7, marginBottom: 18, marginTop: 0 }}>
            {overview.intro}
          </p>

          {/* Formula hint */}
          {overview.formulaHint && (
            <div style={{
              background: "#F0FDF4",
              border: "1.5px solid #86EFAC",
              borderRadius: 10,
              padding: "10px 14px",
              marginBottom: 18,
              fontSize: 13,
              color: "#166534",
              fontWeight: 700,
            }}>
              🧮 Key Formula: {overview.formulaHint}
            </div>
          )}

          {/* Key points */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 12, marginBottom: 18 }}>
            {overview.keyPoints.map((kp, i) => (
              <div key={i} style={{
                background: "#F8FAFC",
                borderRadius: 10,
                padding: "12px 14px",
                borderLeft: `3px solid ${moduleColor}`,
              }}>
                <div style={{ fontSize: 12, fontWeight: 800, color: moduleColor, marginBottom: 5 }}>
                  {kp.heading}
                </div>
                <div style={{ fontSize: 13, color: "#475569", lineHeight: 1.6 }}>
                  {kp.body}
                </div>
              </div>
            ))}
          </div>

          {/* Optional table */}
          {overview.tableHeadings && overview.tableRows && (
            <div style={{ overflowX: "auto", marginBottom: 18 }}>
              <table style={{
                width: "100%",
                borderCollapse: "collapse",
                fontSize: 12,
                fontFamily: "inherit",
              }}>
                <thead>
                  <tr style={{ background: moduleBg }}>
                    {overview.tableHeadings.map((h, i) => (
                      <th key={i} style={{
                        padding: "8px 12px",
                        textAlign: "left",
                        color: moduleColor,
                        fontWeight: 800,
                        borderBottom: `2px solid ${moduleColor}33`,
                        whiteSpace: "nowrap",
                      }}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {overview.tableRows.map((row, ri) => (
                    <tr key={ri} style={{ borderBottom: "1px solid #E2E8F0" }}>
                      {row.map((cell, ci) => (
                        <td key={ci} style={{
                          padding: "8px 12px",
                          color: ci === 0 ? "#0F172A" : "#475569",
                          fontWeight: ci === 0 ? 700 : 400,
                          verticalAlign: "top",
                        }}>
                          {cell}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Exam tips */}
          <div style={{
            background: "#FFFBEB",
            border: "1.5px solid #FCD34D",
            borderRadius: 10,
            padding: "12px 14px",
          }}>
            <div style={{ fontSize: 12, fontWeight: 800, color: "#92400E", marginBottom: 8 }}>
              ⚡ Watch for on the exam:
            </div>
            <ul style={{ margin: 0, paddingLeft: 18 }}>
              {overview.examTips.map((tip, i) => (
                <li key={i} style={{ fontSize: 12, color: "#78350F", lineHeight: 1.6, marginBottom: 3 }}>
                  {tip}
                </li>
              ))}
            </ul>
          </div>

        </div>
      )}
    </div>
  );
}
