import { useState } from "react";
import { trpc } from "@/lib/trpc";

interface Props {
  questionId: number;
  questionText: string;
  module: string;
  onClose: () => void;
}

const REPORT_TYPES = [
  { value: "wrong_answer", label: "Wrong correct answer marked" },
  { value: "wrong_calculation", label: "Calculation error in explanation" },
  { value: "unclear_question", label: "Question is unclear or ambiguous" },
  { value: "other", label: "Other issue" },
] as const;

type ReportType = typeof REPORT_TYPES[number]["value"];

export default function ReportErrorModal({ questionId, questionText, module, onClose }: Props) {
  const [reportType, setReportType] = useState<ReportType | "">("");
  const [details, setDetails] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  const reportMutation = trpc.question.reportError.useMutation({
    onSuccess: () => setSubmitted(true),
    onError: () => setError("Failed to submit — please try again."),
  });

  const handleSubmit = () => {
    if (!reportType) {
      setError("Please select an issue type.");
      return;
    }
    setError("");
    reportMutation.mutate({
      questionId,
      questionText,
      module,
      reportType: reportType as ReportType,
      details: details.trim() || undefined,
    });
  };

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.45)",
        zIndex: 200,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "20px",
      }}
    >
      <style>{`@keyframes popIn{from{transform:scale(0.92);opacity:0}to{transform:scale(1);opacity:1}}`}</style>
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: "#fff",
          borderRadius: 20,
          padding: "32px",
          maxWidth: 480,
          width: "100%",
          boxShadow: "0 20px 60px rgba(0,0,0,0.2)",
          animation: "popIn 0.2s ease both",
          fontFamily: "'Sora', sans-serif",
        }}
      >
        {submitted ? (
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>✅</div>
            <div style={{ fontSize: 18, fontWeight: 800, color: "#FFFFFF", marginBottom: 8 }}>
              Thanks for the report!
            </div>
            <div style={{ fontSize: 13, color: "#64748B", marginBottom: 24, lineHeight: 1.65 }}>
              We'll review Q{questionId} and fix any errors. Your feedback helps keep the question bank accurate.
            </div>
            <button
              onClick={onClose}
              style={{
                padding: "12px 32px",
                borderRadius: 12,
                border: "none",
                background: "linear-gradient(135deg, #1D4ED8, #0F766E)",
                color: "#fff",
                fontSize: 13,
                fontWeight: 700,
                cursor: "pointer",
                fontFamily: "inherit",
              }}
            >
              Close
            </button>
          </div>
        ) : (
          <>
            {/* Header */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
              <div>
                <div style={{ fontSize: 16, fontWeight: 800, color: "#FFFFFF", marginBottom: 4 }}>
                  🚩 Report a Question Error
                </div>
                <div style={{ fontSize: 11, color: "#64748B" }}>
                  Q{questionId} · {module}
                </div>
              </div>
              <button
                onClick={onClose}
                style={{
                  background: "none",
                  border: "none",
                  fontSize: 18,
                  color: "#64748B",
                  cursor: "pointer",
                  padding: "4px",
                  lineHeight: 1,
                }}
              >
                ✕
              </button>
            </div>

            {/* Question preview */}
            <div style={{
              background: "#FFFFFF",
              borderRadius: 10,
              padding: "12px 14px",
              marginBottom: 20,
              fontSize: 12,
              color: "#374151",
              lineHeight: 1.65,
              border: "1px solid #E2E8F0",
              maxHeight: 80,
              overflow: "hidden",
              WebkitMaskImage: "linear-gradient(to bottom, black 60%, transparent 100%)",
            }}>
              {questionText}
            </div>

            {/* Issue type */}
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: "#374151", marginBottom: 8 }}>
                What's the issue? <span style={{ color: "#DC2626" }}>*</span>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {REPORT_TYPES.map(rt => (
                  <label
                    key={rt.value}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                      padding: "10px 14px",
                      borderRadius: 10,
                      border: `2px solid ${reportType === rt.value ? "#1D4ED8" : "#94A3B8"}`,
                      background: reportType === rt.value ? "#EFF6FF" : "#F8FAFC",
                      cursor: "pointer",
                      transition: "all 0.15s",
                    }}
                  >
                    <input
                      type="radio"
                      name="reportType"
                      value={rt.value}
                      checked={reportType === rt.value}
                      onChange={() => { setReportType(rt.value); setError(""); }}
                      style={{ accentColor: "#1D4ED8" }}
                    />
                    <span style={{
                      fontSize: 12,
                      fontWeight: reportType === rt.value ? 700 : 500,
                      color: reportType === rt.value ? "#1D4ED8" : "#374151",
                    }}>
                      {rt.label}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {/* Optional details */}
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: "#374151", marginBottom: 6 }}>
                Additional details <span style={{ color: "#64748B", fontWeight: 400 }}>(optional)</span>
              </div>
              <textarea
                value={details}
                onChange={e => setDetails(e.target.value)}
                maxLength={500}
                placeholder="e.g. The correct answer should be 1000 L/s because Q = V × A = 2 × 0.5 = 1 m³/s..."
                style={{
                  width: "100%",
                  minHeight: 80,
                  padding: "10px 12px",
                  borderRadius: 10,
                  border: "1px solid #E2E8F0",
                  background: "#FFFFFF",
                  fontSize: 12,
                  color: "#374151",
                  fontFamily: "inherit",
                  resize: "vertical",
                  outline: "none",
                  boxSizing: "border-box",
                  lineHeight: 1.6,
                }}
              />
              <div style={{ fontSize: 10, color: "#64748B", textAlign: "right", marginTop: 2 }}>
                {details.length}/500
              </div>
            </div>

            {error && (
              <div style={{
                background: "#FEF2F2",
                borderRadius: 8,
                padding: "8px 12px",
                marginBottom: 12,
                fontSize: 11,
                color: "#DC2626",
                border: "1px solid #FECACA",
              }}>
                {error}
              </div>
            )}

            {/* Actions */}
            <div style={{ display: "flex", gap: 10 }}>
              <button
                onClick={onClose}
                style={{
                  flex: 1,
                  padding: "12px",
                  borderRadius: 12,
                  border: "1px solid #E2E8F0",
                  background: "transparent",
                  color: "#64748B",
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: "pointer",
                  fontFamily: "inherit",
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={reportMutation.isPending}
                style={{
                  flex: 2,
                  padding: "12px",
                  borderRadius: 12,
                  border: "none",
                  background: reportMutation.isPending ? "#94A3B8" : "linear-gradient(135deg, #1D4ED8, #0F766E)",
                  color: reportMutation.isPending ? "#E2E8F0" : "#fff",
                  fontSize: 13,
                  fontWeight: 700,
                  cursor: reportMutation.isPending ? "not-allowed" : "pointer",
                  fontFamily: "inherit",
                  transition: "all 0.15s",
                }}
              >
                {reportMutation.isPending ? "Submitting…" : "Submit Report"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
