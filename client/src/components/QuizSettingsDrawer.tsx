/**
 * QuizSettingsDrawer — slide-in settings panel for quiz configuration.
 * Triggered by the "Quiz Settings" button next to QuizModeBar.
 * Allows users to set: session size, difficulty filter, and timed mode.
 * Rendered via createPortal so it always overlays correctly.
 */
import { useState } from "react";
import { createPortal } from "react-dom";

export type DifficultyFilter = "all" | "easy" | "medium" | "hard";

export interface QuizSettings {
  sessionSize: number;
  difficulty: DifficultyFilter;
  timedMode: boolean;
  timedSeconds: number; // seconds per question (only used when timedMode=true)
}

export const DEFAULT_QUIZ_SETTINGS: QuizSettings = {
  sessionSize: 15,
  difficulty: "all",
  timedMode: false,
  timedSeconds: 60,
};

interface QuizSettingsDrawerProps {
  settings: QuizSettings;
  onApply: (settings: QuizSettings) => void;
  onClose: () => void;
  totalQuestions?: number;
}

const SESSION_SIZE_OPTIONS = [10, 15, 20, 30, 50];
const DIFFICULTY_OPTIONS: { value: DifficultyFilter; label: string; color: string; icon: string }[] = [
  { value: "all",    label: "All Levels",  color: "#1D4ED8", icon: "📚" },
  { value: "easy",   label: "Easy",        color: "#059669", icon: "🟢" },
  { value: "medium", label: "Medium",      color: "#D97706", icon: "🟡" },
  { value: "hard",   label: "Hard",        color: "#DC2626", icon: "🔴" },
];
const TIMED_OPTIONS = [30, 45, 60, 90, 120];

export default function QuizSettingsDrawer({
  settings,
  onApply,
  onClose,
  totalQuestions,
}: QuizSettingsDrawerProps) {
  const [local, setLocal] = useState<QuizSettings>({ ...settings });

  function handleApply() {
    onApply(local);
    onClose();
  }

  const drawer = (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: "fixed",
          inset: 0,
          background: "rgba(15,23,42,0.55)",
          backdropFilter: "blur(4px)",
          zIndex: 9998,
        }}
      />
      {/* Drawer panel */}
      <div
        style={{
          position: "fixed",
          top: 0,
          right: 0,
          bottom: 0,
          width: "min(380px, 100vw)",
          background: "#fff",
          zIndex: 9999,
          boxShadow: "-8px 0 40px rgba(0,0,0,0.18)",
          display: "flex",
          flexDirection: "column",
          fontFamily: "'Sora', sans-serif",
          overflowY: "auto",
        }}
      >
        {/* Header */}
        <div style={{
          padding: "20px 20px 16px",
          borderBottom: "1.5px solid #E2E8F0",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          background: "linear-gradient(135deg, #1D4ED8 0%, #0E7490 100%)",
          color: "#fff",
        }}>
          <div>
            <div style={{ fontSize: 16, fontWeight: 800, letterSpacing: "-0.3px" }}>⚙️ Quiz Settings</div>
            <div style={{ fontSize: 12, opacity: 0.8, marginTop: 2 }}>
              Customise your study session
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              width: 32, height: 32, borderRadius: "50%",
              background: "rgba(255,255,255,0.2)", border: "1px solid rgba(255,255,255,0.3)",
              color: "#fff", cursor: "pointer", fontSize: 15,
              display: "flex", alignItems: "center", justifyContent: "center",
            }}
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: "20px", flex: 1, display: "flex", flexDirection: "column", gap: 24 }}>

          {/* Session Size */}
          <section>
            <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 10 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#374151", letterSpacing: "0.04em", textTransform: "uppercase" }}>
                Session Size
              </div>
              {totalQuestions != null && (
                <div style={{ fontSize: 12, color: "#64748B", fontWeight: 600 }}>
                  {Math.min(local.sessionSize, totalQuestions).toLocaleString()} of {totalQuestions.toLocaleString()} available
                </div>
              )}
            </div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {SESSION_SIZE_OPTIONS.map(size => {
                const active = local.sessionSize === size;
                return (
                  <button
                    key={size}
                    onClick={() => setLocal(s => ({ ...s, sessionSize: size }))}
                    style={{
                      padding: "8px 16px",
                      borderRadius: 10,
                      border: active ? "2px solid #1D4ED8" : "1.5px solid #E2E8F0",
                      background: active ? "#EFF6FF" : "#F8FAFC",
                      color: active ? "#1D4ED8" : "#374151",
                      fontSize: 13,
                      fontWeight: active ? 800 : 600,
                      cursor: "pointer",
                      fontFamily: "inherit",
                      transition: "all 0.12s",
                    }}
                  >
                    {size} Qs
                  </button>
                );
              })}
            </div>

          </section>

          {/* Difficulty Filter */}
          <section>
            <div style={{ fontSize: 13, fontWeight: 700, color: "#374151", marginBottom: 10, letterSpacing: "0.04em", textTransform: "uppercase" }}>
              Difficulty Filter
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {DIFFICULTY_OPTIONS.map(opt => {
                const active = local.difficulty === opt.value;
                return (
                  <button
                    key={opt.value}
                    onClick={() => setLocal(s => ({ ...s, difficulty: opt.value }))}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                      padding: "10px 14px",
                      borderRadius: 10,
                      border: active ? `2px solid ${opt.color}` : "1.5px solid #E2E8F0",
                      background: active ? `${opt.color}12` : "#F8FAFC",
                      color: active ? opt.color : "#374151",
                      fontSize: 13,
                      fontWeight: active ? 800 : 600,
                      cursor: "pointer",
                      fontFamily: "inherit",
                      textAlign: "left",
                      transition: "all 0.12s",
                    }}
                  >
                    <span style={{ fontSize: 16 }}>{opt.icon}</span>
                    <span>{opt.label}</span>
                    {active && (
                      <span style={{
                        marginLeft: "auto",
                        width: 18, height: 18,
                        borderRadius: "50%",
                        background: opt.color,
                        color: "#fff",
                        fontSize: 11,
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontWeight: 800,
                      }}>✓</span>
                    )}
                  </button>
                );
              })}
            </div>
          </section>

          {/* Timed Mode */}
          <section>
            <div style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: 10,
            }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#374151", letterSpacing: "0.04em", textTransform: "uppercase" }}>
                Timed Mode
              </div>
              {/* Toggle */}
              <button
                onClick={() => setLocal(s => ({ ...s, timedMode: !s.timedMode }))}
                style={{
                  width: 44, height: 24,
                  borderRadius: 12,
                  background: local.timedMode ? "#1D4ED8" : "#CBD5E1",
                  border: "none",
                  cursor: "pointer",
                  position: "relative",
                  transition: "background 0.2s",
                  padding: 0,
                }}
              >
                <div style={{
                  position: "absolute",
                  top: 3,
                  left: local.timedMode ? 23 : 3,
                  width: 18, height: 18,
                  borderRadius: "50%",
                  background: "#fff",
                  transition: "left 0.2s",
                  boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
                }} />
              </button>
            </div>
            {local.timedMode && (
              <div>
                <div style={{ fontSize: 12, color: "#64748B", marginBottom: 8 }}>
                  Seconds per question
                </div>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  {TIMED_OPTIONS.map(secs => {
                    const active = local.timedSeconds === secs;
                    return (
                      <button
                        key={secs}
                        onClick={() => setLocal(s => ({ ...s, timedSeconds: secs }))}
                        style={{
                          padding: "7px 14px",
                          borderRadius: 10,
                          border: active ? "2px solid #0E7490" : "1.5px solid #E2E8F0",
                          background: active ? "#ECFEFF" : "#F8FAFC",
                          color: active ? "#0E7490" : "#374151",
                          fontSize: 12,
                          fontWeight: active ? 800 : 600,
                          cursor: "pointer",
                          fontFamily: "inherit",
                          transition: "all 0.12s",
                        }}
                      >
                        {secs}s
                      </button>
                    );
                  })}
                </div>
                <div style={{ fontSize: 11, color: "#94A3B8", marginTop: 6 }}>
                  ⏱ A countdown timer will appear on each question
                </div>
              </div>
            )}
            {!local.timedMode && (
              <div style={{ fontSize: 12, color: "#94A3B8" }}>
                Practice at your own pace — no time pressure
              </div>
            )}
          </section>
        </div>

        {/* Footer */}
        <div style={{
          padding: "16px 20px",
          borderTop: "1.5px solid #E2E8F0",
          display: "flex",
          gap: 10,
        }}>
          <button
            onClick={onClose}
            style={{
              flex: 1,
              padding: "11px 0",
              borderRadius: 10,
              border: "1.5px solid #E2E8F0",
              background: "#F8FAFC",
              color: "#374151",
              fontSize: 13,
              fontWeight: 700,
              cursor: "pointer",
              fontFamily: "inherit",
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleApply}
            style={{
              flex: 2,
              padding: "11px 0",
              borderRadius: 10,
              border: "none",
              background: "linear-gradient(135deg, #1D4ED8, #0E7490)",
              color: "#fff",
              fontSize: 13,
              fontWeight: 800,
              cursor: "pointer",
              fontFamily: "inherit",
            }}
          >
            Apply Settings →
          </button>
        </div>
      </div>
    </>
  );

  return createPortal(drawer, document.body);
}
