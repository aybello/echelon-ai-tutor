// Echelon Career Map — Multi-Province Operator Career Path & Salary Map
// Design: Professional SaaS — Clean Dark-Accent (Sora, blue/teal brand)
// Views: Career Ladder | Salary Chart | Timeline | Employers

import { useState, useMemo } from "react";
import { usePageMeta } from "@/hooks/usePageMeta";
import SiteNav from "@/components/SiteNav";
import {
  TRACKS, PROVINCES,
  fmtSalary, fmtHr,
  type CertLevel, type ProvinceData,
} from "@/lib/careerDataProvinces";

// ── SALARY BAR ──────────────────────────────────────────────────────────────
function SalaryBar({ min, max, color, maxScale = 130000 }: {
  min: number; max: number; color: string; maxScale?: number;
}) {
  const leftPct  = (min / maxScale) * 100;
  const widthPct = ((max - min) / maxScale) * 100;
  return (
    <div style={{ position: "relative", height: 8, background: "#E5E7EB", borderRadius: 99, margin: "4px 0" }}>
      <div style={{
        position: "absolute", left: `${leftPct}%`, width: `${widthPct}%`,
        height: "100%", background: color, borderRadius: 99, opacity: 0.85,
      }} />
    </div>
  );
}

// ── LEVEL CARD ───────────────────────────────────────────────────────────────
function LevelCard({ level, active, onClick, track }: {
  level: CertLevel; active: CertLevel | null;
  onClick: (l: CertLevel | null) => void; track: string;
}) {
  const isActive   = active?.id === level.id;
  const isRelevant = level.tracks.includes(track === "all" ? level.tracks[0] : track);

  return (
    <div
      onClick={() => onClick(isActive ? null : level)}
      style={{
        background: "#fff",
        borderRadius: 14,
        padding: "16px 18px",
        border: `2px solid ${isActive ? level.color : "#E5E7EB"}`,
        boxShadow: isActive ? `0 6px 24px ${level.color}30` : "0 1px 4px rgba(0,0,0,0.05)",
        opacity: track !== "all" && !isRelevant ? 0.35 : 1,
        cursor: "pointer",
        transition: "all 0.2s",
      }}
      onMouseEnter={e => { if (!isActive) (e.currentTarget as HTMLDivElement).style.transform = "translateY(-3px)"; }}
      onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.transform = "translateY(0)"; }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
        <div style={{
          width: 40, height: 40, borderRadius: 10, background: level.bg,
          display: "flex", alignItems: "center", justifyContent: "center",
          border: `2px solid ${level.color}40`, fontSize: 20, flexShrink: 0,
        }}>{level.icon}</div>
        <div>
          <div style={{ fontSize: 9, fontWeight: 700, color: level.color, letterSpacing: "0.1em" }}>
            {level.years} experience
          </div>
          <div style={{ fontSize: 13, fontWeight: 800, color: "#0F172A" }}>{level.label}</div>
        </div>
      </div>

      <div style={{ marginBottom: 10 }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
          <span style={{ fontSize: 10, color: "#94A3B8", fontWeight: 600 }}>SALARY RANGE</span>
          <span style={{ fontSize: 10, color: "#94A3B8" }}>per hour</span>
        </div>
        <div style={{ fontSize: 16, fontWeight: 800, color: level.color, marginBottom: 4 }}>
          {fmtHr(level.hourly.min)} – {fmtHr(level.hourly.max)}
        </div>
        <SalaryBar min={level.annual.min} max={level.annual.max} color={level.color} />
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 3 }}>
          <span style={{ fontSize: 9, color: "#94A3B8" }}>{fmtSalary(level.annual.min)}/yr</span>
          <span style={{ fontSize: 9, color: "#94A3B8" }}>{fmtSalary(level.annual.max)}/yr</span>
        </div>
      </div>

      <div style={{
        fontSize: 10, color: level.color, fontWeight: 600,
        padding: "6px 10px", background: level.bg, borderRadius: 8,
      }}>{level.canOperate}</div>

      {isActive && (
        <div style={{ marginTop: 8, fontSize: 9, color: level.color, fontWeight: 700, display: "flex", alignItems: "center", gap: 4 }}>
          <span>▼</span> Click again to collapse
        </div>
      )}
    </div>
  );
}

// ── DETAIL PANEL ─────────────────────────────────────────────────────────────
function DetailPanel({ level, province }: { level: CertLevel | null; province: ProvinceData }) {
  if (!level) return (
    <div style={{
      background: "#fff", borderRadius: 16, padding: "32px", textAlign: "center",
      border: "1px solid #E5E7EB", height: "100%", display: "flex",
      flexDirection: "column", alignItems: "center", justifyContent: "center",
    }}>
      <div style={{ fontSize: 48, marginBottom: 16 }}>👆</div>
      <div style={{ fontSize: 14, fontWeight: 700, color: "#0F172A", marginBottom: 8 }}>
        Select a certification level
      </div>
      <div style={{ fontSize: 12, color: "#94A3B8", lineHeight: 1.6, maxWidth: 280 }}>
        Click any level on the left to see full details — requirements, salary data, what facilities you can operate, and which Echelon course to take.
      </div>
    </div>
  );

  const careerEarnings = ((level.annual.min + level.annual.max) / 2) * 35;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14, animation: "popIn 0.3s ease both" }}>
      {/* Gradient header */}
      <div style={{
        background: `linear-gradient(135deg,${level.color},${level.color}cc)`,
        borderRadius: 16, padding: "22px 24px", color: "#fff",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
          <div style={{ fontSize: 32 }}>{level.icon}</div>
          <div>
            <div style={{ fontSize: 10, opacity: 0.8, letterSpacing: "0.1em", marginBottom: 2 }}>
              {province.name.toUpperCase()} CERTIFICATION
            </div>
            <div style={{ fontSize: 20, fontWeight: 800 }}>{level.label}</div>
            <div style={{ fontSize: 12, opacity: 0.85 }}>{level.years} of experience required</div>
          </div>
        </div>
        <div className="career-detail-metrics" style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
          {[
            { l: "Hourly Range",    v: `${fmtHr(level.hourly.min)}–${fmtHr(level.hourly.max)}` },
            { l: "Annual Range",   v: `${fmtSalary(level.annual.min)}–${fmtSalary(level.annual.max)}` },
            { l: "35-yr Earnings", v: `~${fmtSalary(careerEarnings)}` },
          ].map((s, i) => (
            <div key={i} style={{ background: "rgba(255,255,255,0.15)", borderRadius: 10, padding: "10px 12px" }}>
              <div style={{ fontSize: 9, opacity: 0.8, marginBottom: 3 }}>{s.l}</div>
              <div style={{ fontSize: 14, fontWeight: 800 }}>{s.v}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Career insight */}
      <div style={{ background: level.bg, borderRadius: 14, padding: "16px 18px", border: `1px solid ${level.color}30` }}>
        <div style={{ fontSize: 10, fontWeight: 700, color: level.color, letterSpacing: "0.1em", marginBottom: 6 }}>
          💡 CAREER INSIGHT
        </div>
        <div style={{ fontSize: 12, color: "#374151", lineHeight: 1.7 }}>{level.insight}</div>
      </div>

      {/* Requirements */}
      <div style={{ background: "#fff", borderRadius: 14, padding: "18px", border: "1px solid #E5E7EB" }}>
        <div style={{ fontSize: 10, fontWeight: 700, color: "#94A3B8", letterSpacing: "0.1em", marginBottom: 12 }}>
          ✅ REQUIREMENTS
        </div>
        {level.requirements.map((r, i) => (
          <div key={i} style={{ display: "flex", gap: 10, marginBottom: 8, alignItems: "flex-start" }}>
            <div style={{
              width: 20, height: 20, borderRadius: "50%", background: level.bg,
              border: `2px solid ${level.color}`, display: "flex", alignItems: "center",
              justifyContent: "center", fontSize: 9, fontWeight: 800, color: level.color, flexShrink: 0,
            }}>{i + 1}</div>
            <div style={{ fontSize: 12, color: "#374151", lineHeight: 1.5 }}>{r}</div>
          </div>
        ))}
      </div>

      {/* Info grid */}
      <div className="career-detail-info" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        {[
          { l: "Certification Body", v: level.certBody,    icon: "🏛️", highlight: false },
          { l: "Key Regulation",     v: level.regulation,  icon: "📋", highlight: false },
          { l: "Echelon Course",     v: level.examCourse,  icon: "📚", highlight: true  },
          { l: "Next Step",          v: level.nextStep,    icon: "➡️", highlight: false },
        ].map((item, i) => (
          <div key={i} style={{
            background: item.highlight ? `${level.color}10` : "#F8FAFC",
            borderRadius: 12, padding: "12px 14px",
            border: item.highlight ? `1.5px solid ${level.color}40` : "1px solid #F1F5F9",
          }}>
            <div style={{ fontSize: 9, fontWeight: 700, color: "#94A3B8", marginBottom: 4 }}>
              {item.icon} {item.l.toUpperCase()}
            </div>
            <div style={{ fontSize: 11, fontWeight: 600, color: item.highlight ? level.color : "#374151", lineHeight: 1.4 }}>
              {item.v}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── SALARY CHART ─────────────────────────────────────────────────────────────
function SalaryChart({ province }: { province: ProvinceData }) {
  const mainLevels = province.levels.filter(l => l.id !== "wqa");
  const wqa        = province.levels.find(l => l.id === "wqa");
  const maxSalary  = 130000;

  const BarRow = ({ l }: { l: CertLevel }) => (
    <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
      <div style={{ width: 70, fontSize: 11, fontWeight: 700, color: l.color, textAlign: "right", flexShrink: 0 }}>
        {l.short}
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ position: "relative", height: 28, background: "#F1F5F9", borderRadius: 99 }}>
          <div style={{
            position: "absolute",
            left: `${(l.annual.min / maxSalary) * 100}%`,
            width: `${((l.annual.max - l.annual.min) / maxSalary) * 100}%`,
            height: "100%",
            background: `linear-gradient(90deg,${l.color}80,${l.color})`,
            borderRadius: 99,
          }} />
        </div>
      </div>
      <div style={{ width: 160, flexShrink: 0 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: l.color }}>
          {fmtSalary(l.annual.min)} – {fmtSalary(l.annual.max)}
        </div>
        <div style={{ fontSize: 9, color: "#94A3B8" }}>{fmtHr(l.hourly.min)} – {fmtHr(l.hourly.max)}/hr</div>
      </div>
    </div>
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ background: "#fff", borderRadius: 16, padding: "24px", border: "1px solid #E5E7EB" }}>
        <div style={{ fontSize: 13, fontWeight: 800, color: "#0F172A", marginBottom: 4 }}>
          Salary Progression — {province.name} Water/Wastewater Operators
        </div>
        <div style={{ fontSize: 11, color: "#94A3B8", marginBottom: 20 }}>
          Based on Job Bank, Indeed.ca, and industry data (2025)
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {mainLevels.map(l => <BarRow key={l.id} l={l} />)}
          {wqa && (
            <div style={{ borderTop: "1px solid #F1F5F9", paddingTop: 14, marginTop: 4 }}>
              <div style={{ fontSize: 9, fontWeight: 700, color: "#94A3B8", marginBottom: 10, letterSpacing: "0.1em" }}>
                SPECIALIST PATH
              </div>
              <BarRow l={wqa} />
            </div>
          )}
        </div>
        {/* Scale */}
        <div style={{
          display: "flex", justifyContent: "space-between", marginTop: 12,
          paddingTop: 8, borderTop: "1px solid #F1F5F9", paddingLeft: 84,
        }}>
          {[0, 30000, 60000, 90000, 120000].map(v => (
            <span key={v} style={{ fontSize: 9, color: "#CBD5E1" }}>{v === 0 ? "$0" : fmtSalary(v)}</span>
          ))}
        </div>
      </div>

      {/* Data source note */}
      <div style={{ background: "#EFF6FF", borderRadius: 14, padding: "16px 20px", border: "1px solid #BFDBFE" }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: "#1D4ED8", marginBottom: 8 }}>📊 Data Sources & Notes</div>
        <div style={{ fontSize: 11, color: "#374151", lineHeight: 1.7 }}>
          Salary data sourced from <strong>Government of Canada Job Bank (2025)</strong>, <strong>Indeed.ca (2025)</strong>,{" "}
          <strong>Glassdoor (2025)</strong>, and provincial collective agreements where available. Rates reflect typical municipal employment ranges — private sector and non-union employers may vary. Additional pay for certification premiums, on-call, and overtime is not included. All rates are in Canadian dollars.
        </div>
      </div>
    </div>
  );
}

// ── CAREER TIMELINE ──────────────────────────────────────────────────────────
function CareerTimeline({ onSelect, selected, province }: {
  onSelect: (l: CertLevel | null) => void;
  selected: CertLevel | null;
  province: ProvinceData;
}) {
  const mainLevels = province.levels.filter(l => l.id !== "wqa");
  const wqaLevel   = province.levels.find(l => l.id === "wqa");

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ background: "#fff", borderRadius: 16, padding: "24px", border: "1px solid #E5E7EB" }}>
        <div style={{ fontSize: 13, fontWeight: 800, color: "#0F172A", marginBottom: 4 }}>
          Typical Career Timeline
        </div>
        <div style={{ fontSize: 11, color: "#94A3B8", marginBottom: 24 }}>
          Water & Wastewater Track — {province.name} (years of experience)
        </div>

        <div style={{ position: "relative" }}>
          {/* Gradient line */}
          <div style={{
            position: "absolute", top: 20, left: 20, right: 20, height: 3,
            background: "linear-gradient(90deg,#64748B,#0369A1,#0F766E,#7C3AED,#B45309)",
            borderRadius: 99, zIndex: 0,
          }} />
          {/* Nodes */}
          <div style={{ display: "flex", justifyContent: "space-between", position: "relative", zIndex: 1, marginBottom: 32 }}>
            {mainLevels.map(l => (
              <div
                key={l.id}
                onClick={() => onSelect(selected?.id === l.id ? null : l)}
                style={{ display: "flex", flexDirection: "column", alignItems: "center", cursor: "pointer" }}
              >
                <div style={{
                  width: 42, height: 42, borderRadius: "50%",
                  background: selected?.id === l.id ? l.color : l.bg,
                  border: `3px solid ${l.color}`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 18, transition: "all 0.2s",
                  boxShadow: selected?.id === l.id ? `0 4px 14px ${l.color}50` : "none",
                }}>{l.icon}</div>
              </div>
            ))}
          </div>
          {/* Year labels */}
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            {mainLevels.map(l => (
              <div key={l.id} style={{ textAlign: "center", width: 80 }}>
                <div style={{ fontSize: 11, fontWeight: 800, color: l.color }}>{l.short}</div>
                <div style={{ fontSize: 9, color: "#94A3B8" }}>{l.years}</div>
                <div style={{ fontSize: 10, fontWeight: 700, color: "#0F172A", marginTop: 2 }}>
                  {fmtHr(l.hourly.min)}–{fmtHr(l.hourly.max)}
                </div>
                <div style={{ fontSize: 9, color: "#94A3B8" }}>per hour</div>
              </div>
            ))}
          </div>
        </div>

        {/* Salary jump callouts */}
        <div className="career-salary-jumps" style={{ marginTop: 20, display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 8 }}>
          {province.salaryJumps.map((j, i) => (
            <div key={i} style={{
              background: "#F8FAFC", borderRadius: 10, padding: "10px",
              textAlign: "center", border: "1px solid #E5E7EB",
            }}>
              <div style={{ fontSize: 9, color: "#94A3B8", marginBottom: 3 }}>{j.from}</div>
              <div style={{ fontSize: 18, fontWeight: 800, color: "#059669" }}>{j.jump}</div>
              <div style={{ fontSize: 9, color: "#64748B" }}>{j.note}</div>
            </div>
          ))}
        </div>
      </div>

      {/* WQA specialist path — only for Ontario */}
      {wqaLevel && (
        <div style={{ background: "#fff", borderRadius: 16, padding: "24px", border: "1px solid #E5E7EB" }}>
          <div style={{ fontSize: 13, fontWeight: 800, color: "#0F172A", marginBottom: 4 }}>🔬 Specialist Path — Water Quality Analyst (WQA)</div>
          <div style={{ fontSize: 11, color: "#94A3B8", marginBottom: 16 }}>Distinct from plant operations — laboratory-focused certification under O. Reg. 128/04</div>
          <div className="career-salary-details" style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 12 }}>
            {[
              { label: "Entry", years: "0–1 yr", salary: "$26–$30/hr", note: "Lab Technician / Junior Analyst" },
              { label: "Intermediate", years: "2–4 yr", salary: "$30–$35/hr", note: "Senior Analyst / QA Coordinator" },
              { label: "Senior", years: "5+ yr", salary: "$35–$38/hr", note: "Lab Manager / Quality Manager" },
            ].map((step, i) => (
              <div key={i} style={{ background: "#FAF5FF", borderRadius: 12, padding: "14px", border: "1px solid #DDD6FE" }}>
                <div style={{ fontSize: 9, fontWeight: 700, color: "#7C3AED", letterSpacing: "0.1em", marginBottom: 4 }}>{step.label.toUpperCase()}</div>
                <div style={{ fontSize: 12, fontWeight: 800, color: "#0F172A", marginBottom: 2 }}>{step.salary}</div>
                <div style={{ fontSize: 10, color: "#64748B", marginBottom: 4 }}>{step.years}</div>
                <div style={{ fontSize: 9, color: "#7C3AED", fontWeight: 600 }}>{step.note}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Selected detail */}
      {selected && (
        <div style={{ animation: "popIn 0.3s ease both" }}>
          <DetailPanel level={selected} province={province} />
        </div>
      )}

      {/* Lifetime earnings */}
      <div style={{ background: "#fff", borderRadius: 16, padding: "24px", border: "1px solid #E5E7EB" }}>
        <div style={{ fontSize: 13, fontWeight: 800, color: "#0F172A", marginBottom: 4 }}>
          Lifetime Earnings Potential
        </div>
        <div style={{ fontSize: 11, color: "#94A3B8", marginBottom: 16 }}>
          Estimated career earnings by certification level (35-year career, mid-range salary)
        </div>
        <div className="career-timeline-nodes" style={{ display: "grid", gridTemplateColumns: "repeat(5,1fr)", gap: 10 }}>
          {mainLevels.map(l => {
            const mid    = (l.annual.min + l.annual.max) / 2;
            const career = mid * (35 - l.yearsNum);
            return (
              <div key={l.id} style={{
                background: l.bg, borderRadius: 12, padding: "16px 12px",
                textAlign: "center", border: `1px solid ${l.color}30`,
              }}>
                <div style={{ fontSize: 20, marginBottom: 6 }}>{l.icon}</div>
                <div style={{ fontSize: 10, fontWeight: 700, color: l.color, marginBottom: 4 }}>{l.short}</div>
                <div style={{ fontSize: 16, fontWeight: 800, color: l.color, marginBottom: 2 }}>
                  ${Math.round(career / 1000000 * 10) / 10}M
                </div>
                <div style={{ fontSize: 9, color: "#94A3B8" }}>est. career total</div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ── EMPLOYERS SECTION ────────────────────────────────────────────────────────
function EmployersSection({ province }: { province: ProvinceData }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ background: "#fff", borderRadius: 16, padding: "24px", border: "1px solid #E5E7EB" }}>
        <div style={{ fontSize: 13, fontWeight: 800, color: "#0F172A", marginBottom: 4 }}>
          Who Hires {province.name} Operators
        </div>
        <div style={{ fontSize: 11, color: "#94A3B8", marginBottom: 16 }}>Key employers across the province</div>
        <div className="career-employers-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
          {province.employers.map((e, i) => (
            <div key={i} style={{
              background: "#F8FAFC", borderRadius: 12, padding: "14px",
              border: `1px solid ${e.color}20`,
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
                <div style={{ width: 8, height: 8, borderRadius: "50%", background: e.color }} />
                <span style={{
                  fontSize: 9, fontWeight: 700, color: e.color,
                  background: e.color + "15", padding: "2px 6px", borderRadius: 20,
                }}>{e.type}</span>
              </div>
              <div style={{ fontSize: 11, fontWeight: 700, color: "#0F172A", marginBottom: 4 }}>{e.name}</div>
              <div style={{ fontSize: 10, color: "#64748B", marginBottom: 3 }}>{e.size}</div>
              <div style={{ fontSize: 9, color: "#94A3B8", lineHeight: 1.4 }}>{e.note}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Job market outlook */}
      <div style={{ background: "#F0FDF4", borderRadius: 14, padding: "18px 20px", border: "1px solid #BBF7D0" }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: "#059669", marginBottom: 12 }}>
          🌱 Job Market Outlook — {province.name} Water Sector
        </div>
        <div className="career-job-market-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          {province.jobMarket.map((item, i) => (
            <div key={i} style={{ background: "#fff", borderRadius: 10, padding: "12px 14px" }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: "#059669", marginBottom: 4 }}>{item.title}</div>
              <div style={{ fontSize: 11, color: "#374151", lineHeight: 1.55 }}>{item.desc}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── PROVINCE SELECTOR ────────────────────────────────────────────────────────
function ProvinceSelector({ selected, onChange }: {
  selected: string;
  onChange: (id: string) => void;
}) {
  return (
    <div style={{
      background: "#fff", borderBottom: "1px solid #E5E7EB",
      padding: "10px 28px", display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap",
    }}>
      <span style={{ fontSize: 11, fontWeight: 700, color: "#94A3B8", letterSpacing: "0.08em", flexShrink: 0 }}>
        PROVINCE
      </span>
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
        {PROVINCES.map(p => (
          <button
            key={p.id}
            onClick={() => onChange(p.id)}
            style={{
              padding: "7px 14px", borderRadius: 8,
              border: `1px solid ${selected === p.id ? "#1D4ED8" : "#E5E7EB"}`,
              background: selected === p.id ? "#EFF6FF" : "transparent",
              color: selected === p.id ? "#1D4ED8" : "#64748B",
              fontSize: 11, fontWeight: 600, cursor: "pointer", fontFamily: "inherit",
              transition: "all 0.15s",
            }}
          >
            {p.flag} {p.abbr}
          </button>
        ))}
      </div>
      <div style={{ fontSize: 10, color: "#94A3B8", marginLeft: "auto" }}>
        {PROVINCES.find(p => p.id === selected)?.certBody}
      </div>
    </div>
  );
}

// ── MAIN PAGE ────────────────────────────────────────────────────────────────
type ViewType = "ladder" | "chart" | "timeline" | "employers";

export default function CareerMap() {
  usePageMeta({
    title: "Canadian Operator Career Map — OIT to Class 4",
    description: "Explore the full Canadian water and wastewater operator career path from OIT to Class 4 across Ontario, BC, Alberta, Saskatchewan, and Manitoba. Salary ranges, employer landscape, certification timelines.",
    path: "/career",
  });
  // Read ?province=bc from URL, fall back to localStorage, then default to "on"
  const initialProvince = useMemo(() => {
    const params = new URLSearchParams(window.location.search);
    const urlProvince = params.get("province");
    if (urlProvince && ["on","bc","ab","sk","mb"].includes(urlProvince)) return urlProvince;
    try {
      const stored = localStorage.getItem("echelon_province");
      if (stored && ["on","bc","ab","sk","mb"].includes(stored)) return stored;
    } catch { /* ignore */ }
    return "on";
  }, []);
  const [selected,   setSelected]   = useState<CertLevel | null>(null);
  const [track,      setTrack]      = useState("all");
  const [view,       setView]       = useState<ViewType>("ladder");
  const [provinceId, setProvinceId] = useState(initialProvince);

  const province = PROVINCES.find(p => p.id === provinceId) ?? PROVINCES[0];

  // Reset selected level when province changes (levels have different IDs)
  const handleProvinceChange = (id: string) => {
    setProvinceId(id);
    setSelected(null);
  };

  const VIEWS: [ViewType, string][] = [
    ["ladder",    "🪜 Career Ladder"],
    ["chart",     "📊 Salary Chart"],
    ["timeline",  "⏱ Timeline"],
    ["employers", "🏢 Employers"],
  ];

  // Filter levels for the ladder (WQA is a specialist path, shown separately)
  const mainLevels    = province.levels.filter(l => l.id !== "wqa");
  const specialistLevel = province.levels.find(l => l.id === "wqa");

  return (
    <div style={{ minHeight: "100vh", background: "#F1F5F9", fontFamily: "'Sora', sans-serif" }}>
      <style>{`
        @keyframes fadeUp { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }
        @keyframes popIn  { from{opacity:0;transform:scale(0.92)} to{opacity:1;transform:scale(1)} }
        .fade { animation: fadeUp 0.4s ease both; }
        @media (max-width: 768px) {
          .career-salary-jumps { grid-template-columns: repeat(2,1fr) !important; }
          .career-timeline-nodes { grid-template-columns: repeat(3,1fr) !important; }
          .career-employers-grid { grid-template-columns: 1fr 1fr !important; }
        }
        @media (max-width: 640px) {
          .career-content { padding: 16px 14px 60px !important; }
          .career-hero-stats { grid-template-columns: repeat(2,1fr) !important; gap: 10px !important; }
          .career-ladder-grid { grid-template-columns: 1fr !important; }
          .career-salary-jumps { grid-template-columns: repeat(2,1fr) !important; }
          .career-salary-details { grid-template-columns: 1fr !important; }
          .career-timeline-nodes { grid-template-columns: repeat(2,1fr) !important; }
          .career-employers-grid { grid-template-columns: 1fr !important; }
          .career-job-market-grid { grid-template-columns: 1fr !important; }
          .career-detail-metrics { grid-template-columns: 1fr 1fr !important; }
          .career-detail-info { grid-template-columns: 1fr !important; }
          .career-view-toggles { padding: 10px 14px !important; }
        }
      `}</style>

      <SiteNav currentPath="/career" />

      {/* ── PROVINCE SELECTOR ── */}
      <ProvinceSelector selected={provinceId} onChange={handleProvinceChange} />

      {/* ── VIEW TOGGLES ── */}
      <div className="career-view-toggles" style={{ background: "#fff", borderBottom: "1px solid #E5E7EB", padding: "10px 28px", display: "flex", gap: 6, flexWrap: "wrap" }}>
        {VIEWS.map(([v, l]) => (
          <button key={v} onClick={() => setView(v)} style={{
            padding: "7px 14px", borderRadius: 8,
            border: `1px solid ${view === v ? "#1D4ED8" : "#E5E7EB"}`,
            background: view === v ? "#EFF6FF" : "transparent",
            color: view === v ? "#1D4ED8" : "#64748B",
            fontSize: 11, fontWeight: 600, cursor: "pointer", fontFamily: "inherit",
            transition: "all 0.15s",
          }}>{l}</button>
        ))}
      </div>

      {/* ── CONTENT ── */}
      <div className="career-content" style={{ padding: "24px 28px 60px", maxWidth: 1200, margin: "0 auto" }}>

        {/* Hero stats */}
        <div className="fade career-hero-stats" style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 14, marginBottom: 20 }}>
          {province.heroStats.map((s, i) => (
            <div key={i} style={{
              background: "#fff", borderRadius: 14, padding: "18px 20px",
              border: "1px solid #E5E7EB", borderTop: `3px solid ${s.color}`,
              boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
            }}>
              <div style={{ fontSize: 22, marginBottom: 8 }}>{s.icon}</div>
              <div style={{ fontSize: 22, fontWeight: 800, color: s.color, marginBottom: 4 }}>{s.value}</div>
              <div style={{ fontSize: 10, color: "#94A3B8", fontWeight: 600 }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* ── CAREER LADDER ── */}
        {view === "ladder" && (
          <div className="fade">
            {/* Track filter */}
            <div style={{
              background: "#fff", borderRadius: 14, padding: "16px 20px",
              marginBottom: 16, border: "1px solid #E5E7EB",
              display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap",
            }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: "#94A3B8", letterSpacing: "0.08em" }}>
                FILTER BY TRACK
              </span>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {([["all", "All Tracks", "#374151"], ...TRACKS.map(t => [t.id, `${t.icon} ${t.label.split(" ")[0]}`, t.color])] as [string, string, string][]).map(([id, label, color]) => (
                  <button key={id} onClick={() => setTrack(id)} style={{
                    padding: "6px 14px", borderRadius: 20,
                    border: `1.5px solid ${track === id ? color : "#E5E7EB"}`,
                    background: track === id ? color + "15" : "transparent",
                    color: track === id ? color : "#64748B",
                    fontSize: 10, fontWeight: 700, cursor: "pointer", fontFamily: "inherit",
                    transition: "all 0.15s",
                  }}>{label}</button>
                ))}
              </div>
            </div>

            <div className="career-ladder-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1.2fr", gap: 20 }}>
              {/* Left — certification cards */}
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: "#94A3B8", letterSpacing: "0.1em", marginBottom: 4 }}>
                  CLICK ANY LEVEL TO SEE FULL DETAILS
                </div>
                {/* Main ladder */}
                {mainLevels.map((l, i, arr) => (
                  <div key={l.id}>
                    <LevelCard level={l} active={selected} onClick={setSelected} track={track} />
                    {i < arr.length - 1 && (
                      <div style={{ display: "flex", justifyContent: "center", padding: "4px 0" }}>
                        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
                          <div style={{ width: 2, height: 10, background: "#E5E7EB" }} />
                          <div style={{ fontSize: 9, color: "#94A3B8", fontWeight: 600 }}>
                            {i === 0 ? "1 yr exp" : i === 1 ? "2 yr exp" : i === 2 ? "3 yr exp" : "3 yr exp"}
                          </div>
                          <div style={{ width: 2, height: 10, background: "#E5E7EB" }} />
                        </div>
                      </div>
                    )}
                  </div>
                ))}
                {/* WQA specialist — Ontario only */}
                {specialistLevel && (
                  <div style={{ borderTop: "1px dashed #E5E7EB", paddingTop: 14, marginTop: 4 }}>
                    <div style={{ fontSize: 9, fontWeight: 700, color: "#94A3B8", letterSpacing: "0.1em", marginBottom: 8 }}>
                      SPECIALIST PATH
                    </div>
                    <LevelCard level={specialistLevel} active={selected} onClick={setSelected} track={track} />
                  </div>
                )}
              </div>

              {/* Right — detail panel */}
              <div>
                <DetailPanel level={selected} province={province} />
              </div>
            </div>
          </div>
        )}

        {/* ── SALARY CHART ── */}
        {view === "chart" && (
          <div className="fade">
            <SalaryChart province={province} />
          </div>
        )}

        {/* ── TIMELINE ── */}
        {view === "timeline" && (
          <div className="fade">
            <CareerTimeline onSelect={setSelected} selected={selected} province={province} />
          </div>
        )}

        {/* ── EMPLOYERS ── */}
        {view === "employers" && (
          <div className="fade">
            <EmployersSection province={province} />
          </div>
        )}
      </div>
    </div>
  );
}
