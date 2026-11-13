import { useState } from "react";
import { trpc } from "@/lib/trpc";

/**
 * Asks a new buyer for their exam date on the purchase confirmation page.
 *
 * The study reminder engine emails learners 30, 14, 7 and 1 day before their
 * exam, but only if a date is on file. This is the moment a learner is most
 * willing to give one, so it sits here instead of inside the dashboard.
 *
 * Skipping is always one click and costs nothing. The date can be set later
 * from the dashboard.
 */
interface Props {
  sessionId: string;
}

function toInputDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export default function PurchaseExamDatePrompt({ sessionId }: Props) {
  const [value, setValue] = useState("");
  const [dismissed, setDismissed] = useState(false);
  const [message, setMessage] = useState("");
  const save = trpc.stripe.saveExamDate.useMutation();

  if (dismissed) return null;

  const today = new Date();
  const farthest = new Date(today.getTime() + 730 * 24 * 60 * 60 * 1000);

  if (save.data && (save.data.status === "saved" || save.data.status === "already_set")) {
    return (
      <div className="learner-purchase-date" role="status" style={{ background: "#F0FDF4", border: "1px solid #BBF7D0", borderRadius: 12, padding: "14px 16px", marginBottom: 16, textAlign: "left" }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: "#15803D" }}>
          {save.data.status === "saved" ? "Your exam date is saved." : "You already have an exam date on file."}
        </div>
        <p style={{ fontSize: 12, color: "#475569", margin: "4px 0 0", lineHeight: 1.5 }}>
          We will send you study reminders as it gets closer. You can change the date any time from your dashboard.
        </p>
      </div>
    );
  }

  const submit = () => {
    if (!value) {
      setMessage("Pick your exam date first, or skip for now.");
      return;
    }
    setMessage("");
    save.mutate({ sessionId, examDate: value });
  };

  const serverReason =
    save.data?.status === "invalid_date" ? save.data.reason
    : save.data?.status === "purchase_not_found" || save.data?.status === "unavailable"
      ? "We could not save that just now. You can add your exam date from your dashboard."
      : save.isError ? "We could not save that just now. You can add your exam date from your dashboard." : "";

  return (
    <div className="learner-purchase-date" style={{ background: "#EFF6FF", border: "1px solid #BFDBFE", borderRadius: 12, padding: "16px", marginBottom: 16, textAlign: "left" }}>
      <div style={{ fontSize: 12, fontWeight: 700, color: "#1D4ED8", marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.06em" }}>
        Stay on track
      </div>
      <label htmlFor="purchase-exam-date" style={{ display: "block", fontSize: 13, color: "#0F172A", fontWeight: 600, margin: "0 0 6px" }}>
        When is your exam?
      </label>
      <p style={{ fontSize: 12, color: "#475569", margin: "0 0 10px", lineHeight: 1.5 }}>
        Give us the date and we will email you a study reminder 30, 14, 7 and 1 day before.
      </p>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        <input
          id="purchase-exam-date"
          type="date"
          value={value}
          min={toInputDate(today)}
          max={toInputDate(farthest)}
          onChange={(e) => setValue(e.target.value)}
          style={{ flex: "1 1 160px", padding: "9px 10px", borderRadius: 8, border: "1.5px solid #CBD5E1", fontSize: 14, fontFamily: "inherit", color: "#0F172A", background: "#fff" }}
        />
        <button
          type="button"
          onClick={submit}
          disabled={save.isPending}
          style={{ padding: "9px 16px", borderRadius: 8, border: "none", background: "#1D4ED8", color: "#fff", fontSize: 13, fontWeight: 700, cursor: save.isPending ? "wait" : "pointer", fontFamily: "inherit" }}
        >
          {save.isPending ? "Saving…" : "Save my date"}
        </button>
      </div>
      {(message || serverReason) && (
        <p role="alert" style={{ fontSize: 12, color: "#B45309", margin: "8px 0 0" }}>{message || serverReason}</p>
      )}
      <button
        type="button"
        onClick={() => setDismissed(true)}
        style={{ marginTop: 10, padding: 0, background: "none", border: "none", color: "#64748B", fontSize: 12, cursor: "pointer", textDecoration: "underline", fontFamily: "inherit" }}
      >
        I do not have a date yet
      </button>
    </div>
  );
}
