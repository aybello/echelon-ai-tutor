/**
 * ExamDateTracker — optional per-pass exam countdown widget.
 * Shows days remaining, a readiness ring, and a date picker.
 * Fully optional: users can skip or remove their exam date at any time.
 */
import { useState } from "react";
import { trpc } from "@/lib/trpc";

interface Props {
  email: string;
  productKey: string;
  productLabel: string;
  color: string;
}

function getDaysUntil(dateStr: string): number {
  const exam = new Date(dateStr);
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  exam.setHours(0, 0, 0, 0);
  return Math.ceil((exam.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

function formatExamDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-CA", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function getUrgencyColor(days: number): string {
  if (days <= 7) return "#EF4444";
  if (days <= 14) return "#F59E0B";
  if (days <= 30) return "#3B82F6";
  return "#22C55E";
}

function getUrgencyLabel(days: number): string {
  if (days < 0) return "Exam passed";
  if (days === 0) return "Exam is today!";
  if (days === 1) return "1 day to go — you've got this!";
  if (days <= 7) return `${days} days — final push!`;
  if (days <= 14) return `${days} days — stay consistent`;
  if (days <= 30) return `${days} days — good pace`;
  return `${days} days — plenty of time`;
}

export default function ExamDateTracker({ email, productKey, productLabel, color }: Props) {
  const [showPicker, setShowPicker] = useState(false);
  const [dateInput, setDateInput] = useState("");
  const [saving, setSaving] = useState(false);

  const utils = trpc.useUtils();

  const getExamDate = trpc.examDate.get.useQuery(
    { email, productKey },
    { enabled: !!email && !!productKey, staleTime: 60_000 }
  );

  const setExamDate = trpc.examDate.set.useMutation({
    onSuccess: () => {
      utils.examDate.get.invalidate({ email, productKey });
      setShowPicker(false);
      setSaving(false);
    },
    onError: () => setSaving(false),
  });

  const removeExamDate = trpc.examDate.remove.useMutation({
    onSuccess: () => {
      utils.examDate.get.invalidate({ email, productKey });
    },
  });

  const examDate = getExamDate.data?.examDate;
  const days = examDate ? getDaysUntil(examDate) : null;
  const urgencyColor = days !== null ? getUrgencyColor(days) : color;

  const handleSave = () => {
    if (!dateInput) return;
    setSaving(true);
    setExamDate.mutate({ email, productKey, examDate: dateInput });
  };

  // Minimum date = tomorrow
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const minDate = tomorrow.toISOString().split("T")[0];

  // If they have an exam date set
  if (examDate && days !== null) {
    return (
      <div style={{
        marginTop: 8,
        padding: "10px 14px",
        background: "rgba(15,23,42,0.6)",
        border: `1px solid ${urgencyColor}33`,
        borderRadius: 10,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 10,
        flexWrap: "wrap",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{
            width: 36, height: 36, borderRadius: 8,
            background: `${urgencyColor}20`,
            border: `2px solid ${urgencyColor}`,
            display: "flex", alignItems: "center", justifyContent: "center",
            flexShrink: 0,
          }}>
            <span style={{ fontSize: 16 }}>📅</span>
          </div>
          <div>
            <div style={{ fontSize: 12, fontWeight: 800, color: urgencyColor }}>
              {getUrgencyLabel(days)}
            </div>
            <div style={{ fontSize: 11, color: "#64748B", marginTop: 1 }}>
              {days >= 0 ? formatExamDate(examDate) : "Exam date passed"}
            </div>
          </div>
        </div>
        <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
          <button
            onClick={() => { setDateInput(""); setShowPicker(true); }}
            style={{ fontSize: 11, color: "#94A3B8", background: "rgba(30,41,59,0.8)", border: "1px solid #334155", borderRadius: 6, padding: "4px 10px", cursor: "pointer", fontFamily: "inherit", fontWeight: 600 }}
          >
            Change
          </button>
          <button
            onClick={() => removeExamDate.mutate({ email, productKey })}
            style={{ fontSize: 11, color: "#64748B", background: "none", border: "none", cursor: "pointer", fontFamily: "inherit" }}
          >
            ✕
          </button>
        </div>

        {/* Date picker inline when changing */}
        {showPicker && (
          <div style={{ width: "100%", display: "flex", gap: 8, alignItems: "center", marginTop: 4 }}>
            <input
              type="date"
              value={dateInput}
              min={minDate}
              onChange={e => setDateInput(e.target.value)}
              style={{
                flex: 1, background: "#0F172A", border: "1.5px solid #334155",
                borderRadius: 8, padding: "7px 12px", fontSize: 13, color: "#F1F5F9",
                fontFamily: "inherit", outline: "none",
              }}
            />
            <button
              onClick={handleSave}
              disabled={!dateInput || saving}
              style={{
                padding: "7px 16px", borderRadius: 8, border: "none",
                background: color, color: "#fff", fontSize: 12, fontWeight: 700,
                cursor: dateInput && !saving ? "pointer" : "not-allowed", fontFamily: "inherit",
                opacity: !dateInput ? 0.5 : 1,
              }}
            >
              {saving ? "Saving…" : "Save"}
            </button>
            <button
              onClick={() => setShowPicker(false)}
              style={{ fontSize: 11, color: "#64748B", background: "none", border: "none", cursor: "pointer", fontFamily: "inherit" }}
            >
              Cancel
            </button>
          </div>
        )}
      </div>
    );
  }

  // No exam date set yet — show subtle prompt
  if (showPicker) {
    return (
      <div style={{
        marginTop: 8,
        padding: "12px 14px",
        background: "rgba(15,23,42,0.6)",
        border: "1px solid #334155",
        borderRadius: 10,
      }}>
        <div style={{ fontSize: 12, color: "#94A3B8", marginBottom: 8, fontWeight: 600 }}>
          📅 When is your {productLabel} exam?
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <input
            type="date"
            value={dateInput}
            min={minDate}
            onChange={e => setDateInput(e.target.value)}
            style={{
              flex: 1, background: "#0F172A", border: "1.5px solid #334155",
              borderRadius: 8, padding: "7px 12px", fontSize: 13, color: "#F1F5F9",
              fontFamily: "inherit", outline: "none",
            }}
          />
          <button
            onClick={handleSave}
            disabled={!dateInput || saving}
            style={{
              padding: "7px 16px", borderRadius: 8, border: "none",
              background: color, color: "#fff", fontSize: 12, fontWeight: 700,
              cursor: dateInput && !saving ? "pointer" : "not-allowed", fontFamily: "inherit",
              opacity: !dateInput ? 0.5 : 1,
            }}
          >
            {saving ? "Saving…" : "Set Date"}
          </button>
          <button
            onClick={() => setShowPicker(false)}
            style={{ fontSize: 11, color: "#64748B", background: "none", border: "none", cursor: "pointer", fontFamily: "inherit" }}
          >
            Skip
          </button>
        </div>
        <div style={{ fontSize: 11, color: "#475569", marginTop: 6 }}>
          We'll show you a countdown and send study reminders. Optional — you can remove it anytime.
        </div>
      </div>
    );
  }

  // Collapsed prompt
  return (
    <button
      onClick={() => setShowPicker(true)}
      style={{
        marginTop: 8,
        display: "flex", alignItems: "center", gap: 6,
        background: "none", border: "1px dashed #334155",
        borderRadius: 8, padding: "6px 12px",
        fontSize: 11, color: "#475569", cursor: "pointer",
        fontFamily: "inherit", fontWeight: 600,
        transition: "border-color 0.15s, color 0.15s",
      }}
      onMouseEnter={e => { (e.target as HTMLElement).style.borderColor = "#64748B"; (e.target as HTMLElement).style.color = "#94A3B8"; }}
      onMouseLeave={e => { (e.target as HTMLElement).style.borderColor = "#334155"; (e.target as HTMLElement).style.color = "#475569"; }}
    >
      📅 Set exam date for countdown &amp; reminders
    </button>
  );
}
