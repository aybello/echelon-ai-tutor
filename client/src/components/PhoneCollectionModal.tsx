/**
 * PhoneCollectionModal — mandatory phone number collection.
 * Shown to any authenticated user whose `phone` field is null.
 * Cannot be dismissed — the user must submit a valid phone number to proceed.
 */
import { useState } from "react";
import { trpc } from "@/lib/trpc";

interface Props {
  onComplete: () => void;
}

export default function PhoneCollectionModal({ onComplete }: Props) {
  const [phone, setPhone] = useState("");
  const [error, setError] = useState("");
  const utils = trpc.useUtils();

  const updatePhone = trpc.auth.updatePhone.useMutation({
    onSuccess: () => {
      utils.auth.me.invalidate();
      onComplete();
    },
    onError: (err) => {
      setError(err.message || "Something went wrong. Please try again.");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    const cleaned = phone.replace(/\s/g, "");
    if (cleaned.length < 7) {
      setError("Please enter a valid phone number.");
      return;
    }
    updatePhone.mutate({ phone: cleaned });
  };

  return (
    /* Full-screen overlay — no click-outside dismiss */
    <>
    <style>{`
      @media (max-width: 480px) {
        .pcm-card { padding: 28px 20px !important; border-radius: 16px !important; }
        .pcm-overlay { align-items: flex-end !important; padding: 0 !important; }
        .pcm-card-wrap { border-radius: 20px 20px 0 0 !important; max-width: 100% !important; width: 100% !important; }
      }
    `}</style>
    <div
      className="pcm-overlay"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        background: "rgba(15, 23, 42, 0.85)",
        backdropFilter: "blur(6px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "20px",
        fontFamily: "'Sora', sans-serif",
      }}
    >
      <div
        className="pcm-card-wrap"
        style={{
          background: "#FFFFFF",
          border: "1px solid rgba(0,0,0,0.09)",
          borderRadius: 20,
          padding: "40px 36px",
          width: "100%",
          maxWidth: 420,
          boxShadow: "0 24px 64px rgba(0,0,0,0.5)",
        }}
      >
        {/* Icon */}
        <div
          style={{
            width: 56,
            height: 56,
            borderRadius: 16,
            background: "linear-gradient(135deg, #1D4ED8, #0F766E)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 26,
            marginBottom: 20,
          }}
        >
          📱
        </div>

        {/* Heading */}
        <h2
          style={{
            fontSize: 22,
            fontWeight: 800,
            color: "#F8FAFC",
            margin: "0 0 8px",
          }}
        >
          One quick step
        </h2>
        <p
          style={{
            fontSize: 14,
            color: "#64748B",
            margin: "0 0 28px",
            lineHeight: 1.6,
          }}
        >
          We need your phone number to send you important updates about your
          course access and exam prep resources.
        </p>

        {/* Form */}
        <form onSubmit={handleSubmit}>
          <label
            style={{
              display: "block",
              fontSize: 12,
              fontWeight: 700,
              color: "#64748B",
              letterSpacing: "0.06em",
              textTransform: "uppercase",
              marginBottom: 8,
            }}
          >
            Phone Number
          </label>
          <input
            type="tel"
            value={phone}
            onChange={(e) => {
              setPhone(e.target.value);
              setError("");
            }}
            placeholder="+1 (416) 555-0100"
            autoFocus
            required
            style={{
              width: "100%",
              padding: "12px 16px",
              borderRadius: 12,
              border: error
                ? "1.5px solid #F87171"
                : "1.5px solid rgba(0,0,0,0.10)",
              background: "rgba(255,255,255,0.05)",
              color: "#F8FAFC",
              fontSize: 15,
              fontFamily: "inherit",
              outline: "none",
              boxSizing: "border-box",
              transition: "border-color 0.15s",
            }}
            onFocus={(e) =>
              (e.currentTarget.style.borderColor = "rgba(56,189,248,0.6)")
            }
            onBlur={(e) =>
              (e.currentTarget.style.borderColor = error
                ? "#F87171"
                : "rgba(0,0,0,0.10)")
            }
          />

          {error && (
            <p
              style={{
                fontSize: 12,
                color: "#F87171",
                margin: "8px 0 0",
              }}
            >
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={updatePhone.isPending || phone.trim().length < 7}
            style={{
              marginTop: 20,
              width: "100%",
              padding: "14px",
              borderRadius: 12,
              border: "none",
              background:
                updatePhone.isPending || phone.trim().length < 7
                  ? "#E2E8F0"
                  : "linear-gradient(135deg, #1D4ED8, #0F766E)",
              color:
                updatePhone.isPending || phone.trim().length < 7
                  ? "#E2E8F0"
                  : "#fff",
              fontSize: 15,
              fontWeight: 700,
              cursor:
                updatePhone.isPending || phone.trim().length < 7
                  ? "not-allowed"
                  : "pointer",
              fontFamily: "inherit",
              transition: "all 0.15s",
            }}
          >
            {updatePhone.isPending ? "Saving..." : "Continue →"}
          </button>
        </form>

        <p
          style={{
            fontSize: 11,
            color: "#64748B",
            marginTop: 16,
            textAlign: "center",
            lineHeight: 1.5,
          }}
        >
          Your number is kept private and only used for account communications.
        </p>
      </div>
    </div>
    </>
  );
}
