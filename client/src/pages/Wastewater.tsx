// Echelon Process v2 — Wastewater Treatment Process Visualizer
// Design: Professional SaaS — Clean Dark-Accent (Sora, blue/teal brand)
// Mirrors the drinking water Process page structure exactly

import { useState } from "react";
import { Link } from "wouter";
import { WW_STEPS, WW_LABEL_INFO, type WastewaterStep } from "@/lib/wastewaterData";
import { WWDiagramFor } from "@/components/WastewaterDiagrams";
import SiteNav from "@/components/SiteNav";

function WQCard({ quality, color }: { quality: Record<string, string>; color: string }) {
  return (
    <div style={{ background: "#F8FAFC", borderRadius: 12, padding: "14px 16px", border: "1px solid #E5E7EB" }}>
      <div style={{ fontSize: 10, fontWeight: 700, color: "#94A3B8", letterSpacing: "0.1em", marginBottom: 10 }}>
        🧪 WATER QUALITY AT THIS STAGE
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
        {Object.entries(quality).map(([k, v]) => (
          <div key={k} style={{ background: "#fff", borderRadius: 8, padding: "8px 10px", border: "1px solid #F1F5F9" }}>
            <div style={{ fontSize: 9, fontWeight: 700, color: "#94A3B8", textTransform: "uppercase", marginBottom: 2 }}>{k}</div>
            <div style={{ fontSize: 11, fontWeight: 600, color }}>{v}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function FlowMap({ active, onSelect }: { active: WastewaterStep; onSelect: (s: WastewaterStep) => void }) {
  return (
    <div style={{ overflowX: "auto", paddingBottom: 4 }}>
      <div style={{ display: "flex", alignItems: "center", minWidth: 900, padding: "4px" }}>
        {WW_STEPS.map((s, i) => (
          <div key={s.id} style={{ display: "flex", alignItems: "center", flexShrink: 0 }}>
            <button
              onClick={() => onSelect(s)}
              style={{
                flexShrink: 0,
                width: 114,
                padding: "12px 6px",
                borderRadius: 14,
                border: `2px solid ${active?.id === s.id ? s.color : "#E5E7EB"}`,
                background: active?.id === s.id ? s.bg : "#fff",
                boxShadow: active?.id === s.id ? `0 4px 16px ${s.color}30` : "0 1px 4px rgba(0,0,0,0.05)",
                cursor: "pointer",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 3,
                fontFamily: "inherit",
                transition: "all 0.2s",
              }}
            >
              <span style={{ fontSize: 22 }}>{s.icon}</span>
              <div style={{
                fontSize: 10, fontWeight: 700,
                color: active?.id === s.id ? s.color : "#0F172A",
                textAlign: "center", lineHeight: 1.3,
              }}>{s.label}</div>
              <div style={{ fontSize: 9, color: "#94A3B8", textAlign: "center", lineHeight: 1.3 }}>{s.shortDesc}</div>
            </button>
            {i < WW_STEPS.length - 1 && (
              <div style={{ flexShrink: 0, display: "flex", alignItems: "center" }}>
                <div style={{ width: 12, height: 2, background: "#E5E7EB" }} />
                <svg width={10} height={14} viewBox="0 0 10 14">
                  <polygon points="0,2 8,7 0,12" fill={active?.id === WW_STEPS[i + 1]?.id ? "#7C3AED" : "#CBD5E1"} />
                </svg>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export default function Wastewater() {
  const [activeStep, setActiveStep] = useState<WastewaterStep>(WW_STEPS[0]);
  const [activeLabel, setActiveLabel] = useState<string | null>(null);
  const [view, setView] = useState<"learn" | "overview">("learn");

  const labelDesc = activeLabel ? (WW_LABEL_INFO[activeLabel] || null) : null;

  const handleLabelClick = (id: string | null) => {
    setActiveLabel(prev => prev === id ? null : id);
  };

  const handleStepSelect = (step: WastewaterStep) => {
    setActiveStep(step);
    setActiveLabel(null);
  };

  const stepIdx = WW_STEPS.findIndex(s => s.id === activeStep.id);

  return (
    <div style={{ minHeight: "100vh", background: "#F1F5F9", fontFamily: "'Sora', sans-serif" }}>
      <style>{`
        @keyframes flow    { 0%{stroke-dashoffset:30} 100%{stroke-dashoffset:0} }
        @keyframes ping    { 0%{r:8;opacity:0.8} 100%{r:18;opacity:0} }
        @keyframes fadeUp  { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
        @media (max-width: 640px) {
          .ww-main { padding: 16px 14px 60px !important; }
          .ww-step-grid { grid-template-columns: 1fr !important; }
          .ww-view-toggles { padding: 10px 14px !important; }
        }
      `}</style>

      <SiteNav currentPath="/wastewater" />

      {/* ── VIEW TOGGLES ── */}
      <div className="ww-view-toggles" style={{ background: "#fff", borderBottom: "1px solid #E5E7EB", padding: "10px 28px", display: "flex", gap: 6 }}>
        {([["learn", "🔬 Step Explorer"], ["overview", "📋 Full Overview"]] as const).map(([v, l]) => (
          <button key={v} onClick={() => setView(v)} style={{
            padding: "7px 16px", borderRadius: 8,
            border: `1px solid ${view === v ? "#7C3AED" : "#E5E7EB"}`,
            background: view === v ? "#F5F3FF" : "transparent",
            color: view === v ? "#7C3AED" : "#64748B",
            fontSize: 11, fontWeight: 600, cursor: "pointer", fontFamily: "inherit",
            transition: "all 0.15s",
          }}>{l}</button>
        ))}
      </div>

      {/* ── MAIN ── */}
      <div className="ww-main" style={{ padding: "24px 28px 60px", maxWidth: 1200, margin: "0 auto" }}>

        {/* Flow map */}
        <div style={{
          background: "#fff", borderRadius: 16, padding: "20px", marginBottom: 20,
          boxShadow: "0 2px 12px rgba(0,0,0,0.05)", border: "1px solid #E5E7EB",
        }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: "#94A3B8", letterSpacing: "0.1em", marginBottom: 14 }}>
            WASTEWATER TREATMENT PROCESS — CLICK ANY STEP TO EXPLORE
          </div>
          <FlowMap active={activeStep} onSelect={handleStepSelect} />
        </div>

        {/* ── STEP EXPLORER ── */}
        {view === "learn" && (
          <div key={activeStep.id} style={{ animation: "fadeUp 0.35s ease both" }}>
            <div className="ww-step-grid" style={{ display: "grid", gridTemplateColumns: "1fr 380px", gap: 20 }}>

              {/* LEFT */}
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

                {/* Diagram card */}
                <div style={{
                  background: "#fff", borderRadius: 16, padding: "24px",
                  boxShadow: "0 2px 12px rgba(0,0,0,0.06)",
                  border: `1px solid ${activeStep.color}25`,
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
                    <div style={{
                      width: 42, height: 42, borderRadius: 10, background: activeStep.bg,
                      display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22,
                    }}>{activeStep.icon}</div>
                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <span style={{
                          fontSize: 10, fontWeight: 700, color: activeStep.color,
                          background: activeStep.bg, padding: "3px 8px", borderRadius: 20,
                        }}>STEP {activeStep.num}</span>
                        <span style={{ fontSize: 10, color: "#94A3B8" }}>{activeStep.equipment}</span>
                      </div>
                      <div style={{ fontSize: 18, fontWeight: 800, color: "#0F172A", marginTop: 2 }}>
                        {activeStep.label}
                      </div>
                    </div>
                  </div>

                  {/* Instruction banner */}
                  <div style={{
                    background: activeStep.bg, borderRadius: 10, padding: "10px 14px",
                    marginBottom: 16, display: "flex", alignItems: "center", gap: 8,
                  }}>
                    <span style={{ fontSize: 16 }}>👆</span>
                    <div>
                      <div style={{ fontSize: 11, fontWeight: 700, color: activeStep.color }}>
                        Interactive Diagram
                      </div>
                      <div style={{ fontSize: 10, color: "#64748B" }}>
                        Click the labelled buttons on the diagram to learn about each component
                      </div>
                    </div>
                  </div>

                  {/* SVG diagram */}
                  <WWDiagramFor
                    stepId={activeStep.id}
                    color={activeStep.color}
                    active={activeLabel}
                    onClick={handleLabelClick}
                  />

                  {/* Label info popup */}
                  {activeLabel && labelDesc && (
                    <div style={{
                      marginTop: 14, background: activeStep.bg, borderRadius: 12,
                      padding: "14px 16px", border: `1px solid ${activeStep.color}40`,
                      animation: "fadeUp 0.25s ease both",
                    }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 6 }}>
                        <div style={{ fontSize: 12, fontWeight: 800, color: activeStep.color }}>
                          📍 Component Detail
                        </div>
                        <button onClick={() => setActiveLabel(null)} style={{
                          background: "none", border: "none", cursor: "pointer",
                          color: "#94A3B8", fontSize: 18, lineHeight: 1,
                        }}>×</button>
                      </div>
                      <div style={{ fontSize: 12, color: "#374151", lineHeight: 1.7 }}>{labelDesc}</div>
                    </div>
                  )}
                  {activeLabel && !labelDesc && (
                    <div style={{
                      marginTop: 14, background: "#F1F5F9", borderRadius: 12,
                      padding: "12px 16px", border: "1px solid #E5E7EB",
                      animation: "fadeUp 0.25s ease both",
                    }}>
                      <div style={{ fontSize: 11, color: "#64748B" }}>
                        Detailed description coming soon for this component.
                      </div>
                    </div>
                  )}
                </div>

                {/* Water quality card */}
                <WQCard quality={activeStep.waterQuality} color={activeStep.color} />
              </div>

              {/* RIGHT */}
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>

                {/* Description */}
                <div style={{
                  background: "#fff", borderRadius: 16, padding: "22px",
                  boxShadow: "0 2px 12px rgba(0,0,0,0.06)", border: "1px solid #E5E7EB",
                }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: "#94A3B8", letterSpacing: "0.1em", marginBottom: 10 }}>
                    WHAT HAPPENS HERE
                  </div>
                  <div style={{ fontSize: 13, color: "#374151", lineHeight: 1.75 }}>{activeStep.fullDesc}</div>
                </div>

                {/* Key exam points */}
                <div style={{
                  background: "#fff", borderRadius: 16, padding: "22px",
                  boxShadow: "0 2px 12px rgba(0,0,0,0.06)", border: "1px solid #E5E7EB",
                }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: "#94A3B8", letterSpacing: "0.1em", marginBottom: 12 }}>
                    ⚡ KEY EXAM POINTS
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {activeStep.keyPoints.map((pt, i) => (
                      <div key={i} style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                        <div style={{
                          width: 20, height: 20, borderRadius: "50%", background: activeStep.bg,
                          border: `2px solid ${activeStep.color}`, display: "flex", alignItems: "center",
                          justifyContent: "center", fontSize: 9, fontWeight: 800,
                          color: activeStep.color, flexShrink: 0, marginTop: 1,
                        }}>{i + 1}</div>
                        <div style={{ fontSize: 12, color: "#374151", lineHeight: 1.55 }}>{pt}</div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Ontario Regulation */}
                <div style={{
                  background: "#F5F3FF", borderRadius: 14, padding: "16px 18px",
                  border: "1px solid #DDD6FE", borderLeft: "4px solid #7C3AED",
                }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: "#7C3AED", letterSpacing: "0.1em", marginBottom: 6 }}>
                    📋 ONTARIO REGULATION
                  </div>
                  <div style={{ fontSize: 11, color: "#3B0764", lineHeight: 1.65 }}>{activeStep.regulation}</div>
                </div>

                {/* Prev / Next */}
                <div style={{ display: "flex", gap: 10 }}>
                  <button
                    onClick={() => stepIdx > 0 && handleStepSelect(WW_STEPS[stepIdx - 1])}
                    disabled={stepIdx === 0}
                    style={{
                      flex: 1, padding: "11px", borderRadius: 10, border: "1px solid #E5E7EB",
                      background: "#fff", color: "#374151", fontSize: 12, fontWeight: 600,
                      cursor: stepIdx === 0 ? "not-allowed" : "pointer",
                      opacity: stepIdx === 0 ? 0.4 : 1, fontFamily: "inherit", transition: "all 0.15s",
                    }}
                  >← Previous</button>
                  <button
                    onClick={() => stepIdx < WW_STEPS.length - 1 && handleStepSelect(WW_STEPS[stepIdx + 1])}
                    disabled={stepIdx === WW_STEPS.length - 1}
                    style={{
                      flex: 1, padding: "11px", borderRadius: 10, border: "none",
                      background: stepIdx === WW_STEPS.length - 1 ? "#E5E7EB" : "linear-gradient(135deg,#7C3AED,#BE185D)",
                      color: stepIdx === WW_STEPS.length - 1 ? "#94A3B8" : "#fff",
                      fontSize: 12, fontWeight: 700,
                      cursor: stepIdx === WW_STEPS.length - 1 ? "not-allowed" : "pointer",
                      fontFamily: "inherit", transition: "all 0.15s",
                    }}
                  >Next Step →</button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── FULL OVERVIEW ── */}
        {view === "overview" && (
          <div style={{ animation: "fadeUp 0.35s ease both" }}>
            <div style={{
              background: "#fff", borderRadius: 16, padding: "28px",
              boxShadow: "0 2px 12px rgba(0,0,0,0.06)", border: "1px solid #E5E7EB",
            }}>
              <div style={{ fontSize: 14, fontWeight: 800, color: "#0F172A", marginBottom: 22 }}>
                Complete Wastewater Treatment Process — Ontario
              </div>
              {WW_STEPS.map((s, i) => (
                <div key={s.id}>
                  <div style={{
                    display: "grid", gridTemplateColumns: "48px 1fr 1fr 200px",
                    gap: 16, alignItems: "start", padding: "20px 0",
                    borderBottom: i < WW_STEPS.length - 1 ? "1px solid #F1F5F9" : "none",
                  }}>
                    <div style={{
                      width: 44, height: 44, borderRadius: 12, background: s.bg,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      border: `2px solid ${s.color}50`, fontSize: 22,
                    }}>{s.icon}</div>
                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                        <span style={{
                          fontSize: 10, fontWeight: 700, color: s.color,
                          background: s.bg, padding: "2px 8px", borderRadius: 20,
                        }}>STEP {s.num}</span>
                        <span style={{ fontSize: 13, fontWeight: 800, color: "#0F172A" }}>{s.label}</span>
                      </div>
                      <div style={{ fontSize: 11, color: "#64748B", lineHeight: 1.6 }}>{s.fullDesc}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: 10, fontWeight: 700, color: "#94A3B8", marginBottom: 8, letterSpacing: "0.08em" }}>
                        KEY POINTS
                      </div>
                      {s.keyPoints.slice(0, 3).map((p, pi) => (
                        <div key={pi} style={{ fontSize: 11, color: "#374151", marginBottom: 5, display: "flex", gap: 6 }}>
                          <span style={{ color: s.color, fontWeight: 700 }}>›</span>{p}
                        </div>
                      ))}
                    </div>
                    <div>
                      <div style={{ fontSize: 11, fontWeight: 700, color: s.color, marginBottom: 6 }}>
                        BOD: {s.waterQuality.BOD ?? s.waterQuality["BOD"] ?? "—"}
                      </div>
                      <button
                        onClick={() => { handleStepSelect(s); setView("learn"); }}
                        style={{
                          padding: "6px 14px", borderRadius: 8, border: `1px solid ${s.color}40`,
                          background: s.bg, color: s.color, fontSize: 10, fontWeight: 700,
                          cursor: "pointer", fontFamily: "inherit", transition: "all 0.15s",
                        }}
                      >Explore →</button>
                    </div>
                  </div>
                  {i < WW_STEPS.length - 1 && (
                    <div style={{ padding: "2px 0 2px 20px", display: "flex", alignItems: "center", gap: 4 }}>
                      <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#CBD5E1" }} />
                      <div style={{ width: 1, height: 14, background: "#E5E7EB", marginLeft: 4 }} />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
