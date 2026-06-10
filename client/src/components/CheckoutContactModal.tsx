// CheckoutContactModal — collects name, email, and phone before redirecting to Stripe
// Shown as an overlay modal when the user clicks any "Buy Now" / "Get Full Access" button.
// All three fields are required; the form validates before calling the Stripe mutation.

import { useState } from "react";
import { createPortal } from "react-dom";

interface CheckoutContactModalProps {
  /** Product display name shown in the heading */
  productName: string;
  /** Price label, e.g. "CA$49" */
  priceLabel?: string;
  /** Pre-filled email (from auth or localStorage) — user can still edit */
  prefillEmail?: string;
  /** Called when the user submits valid contact info */
  onSubmit: (contact: { name: string; email: string; phone: string }) => void;
  /** Called when the user closes/dismisses the modal */
  onClose: () => void;
  /** Whether the parent is currently loading (Stripe redirect in progress) */
  isLoading?: boolean;
}

function formatPhone(raw: string): string {
  // Strip everything except digits and leading +
  const cleaned = raw.replace(/[^\d+]/g, "");
  return cleaned;
}

function validatePhone(val: string): boolean {
  const digits = val.replace(/\D/g, "");
  return digits.length >= 10;
}

function validateEmail(val: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val.trim());
}

export default function CheckoutContactModal({
  productName,
  priceLabel,
  prefillEmail = "",
  onSubmit,
  onClose,
  isLoading = false,
}: CheckoutContactModalProps) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState(prefillEmail);
  const [phone, setPhone] = useState("");
  const [errors, setErrors] = useState<{ name?: string; email?: string; phone?: string }>({});

  function validate(): boolean {
    const newErrors: { name?: string; email?: string; phone?: string } = {};
    if (!name.trim()) newErrors.name = "Please enter your full name.";
    if (!email.trim()) {
      newErrors.email = "Please enter your email address.";
    } else if (!validateEmail(email)) {
      newErrors.email = "Please enter a valid email address.";
    }
    if (!phone.trim()) {
      newErrors.phone = "Please enter your phone number.";
    } else if (!validatePhone(phone)) {
      newErrors.phone = "Please enter a valid phone number (at least 10 digits).";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    onSubmit({ name: name.trim(), email: email.trim().toLowerCase(), phone: formatPhone(phone) });
  }

  const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: "11px 14px",
    borderRadius: 10,
    border: "1.5px solid #CBD5E1",
    fontSize: 14,
    fontFamily: "'Sora', sans-serif",
    color: "#FFFFFF",
    background: "#FAFBFC",
    outline: "none",
    boxSizing: "border-box",
    transition: "border-color 0.15s",
  };

  const errorStyle: React.CSSProperties = {
    fontSize: 12,
    color: "#DC2626",
    marginTop: 4,
    textAlign: "left",
  };

  const labelStyle: React.CSSProperties = {
    display: "block",
    fontSize: 12,
    fontWeight: 700,
    color: "#374151",
    marginBottom: 5,
    textAlign: "left",
    letterSpacing: "0.03em",
  };

  const modal = (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(15,23,42,0.80)",
        backdropFilter: "blur(6px)",
        zIndex: 10000,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "20px 16px",
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        style={{
          background: "#fff",
          borderRadius: 20,
          padding: "36px 32px 28px",
          maxWidth: 460,
          width: "100%",
          boxShadow: "0 32px 80px rgba(0,0,0,0.30)",
          position: "relative",
          fontFamily: "'Sora', sans-serif",
        }}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          aria-label="Close"
          style={{
            position: "absolute",
            top: 14,
            right: 14,
            width: 32,
            height: 32,
            borderRadius: "50%",
            background: "#FFFFFF",
            border: "1px solid #E2E8F0",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            fontSize: 15,
            color: "#64748B",
            lineHeight: 1,
            padding: 0,
          }}
        >
          ✕
        </button>

        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: 24 }}>
          <div
            style={{
              width: 52,
              height: 52,
              borderRadius: "50%",
              background: "linear-gradient(135deg, #1D4ED8 0%, #0EA5E9 100%)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 14px",
              fontSize: 22,
            }}
          >
            🔐
          </div>
          <h2
            style={{
              fontSize: 20,
              fontWeight: 900,
              color: "#FFFFFF",
              margin: "0 0 6px",
              letterSpacing: "-0.4px",
            }}
          >
            Almost there!
          </h2>
          <p style={{ color: "#64748B", fontSize: 13, lineHeight: 1.6, margin: 0 }}>
            Enter your contact info to proceed to secure checkout for{" "}
            <strong style={{ color: "#1D4ED8" }}>{productName}</strong>
            {priceLabel ? ` (${priceLabel})` : ""}.
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} noValidate>
          {/* Full Name */}
          <div style={{ marginBottom: 14 }}>
            <label style={labelStyle}>FULL NAME *</label>
            <input
              type="text"
              placeholder="Jane Smith"
              value={name}
              onChange={(e) => setName(e.target.value)}
              style={{
                ...inputStyle,
                borderColor: errors.name ? "#DC2626" : "#94A3B8",
              }}
              autoComplete="name"
              disabled={isLoading}
            />
            {errors.name && <p style={errorStyle}>{errors.name}</p>}
          </div>

          {/* Email */}
          <div style={{ marginBottom: 14 }}>
            <label style={labelStyle}>EMAIL ADDRESS *</label>
            <input
              type="email"
              placeholder="jane@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={{
                ...inputStyle,
                borderColor: errors.email ? "#DC2626" : "#94A3B8",
              }}
              autoComplete="email"
              disabled={isLoading}
            />
            {errors.email && <p style={errorStyle}>{errors.email}</p>}
          </div>

          {/* Phone */}
          <div style={{ marginBottom: 20 }}>
            <label style={labelStyle}>PHONE NUMBER *</label>
            <input
              type="tel"
              placeholder="+1 (416) 555-0123"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              style={{
                ...inputStyle,
                borderColor: errors.phone ? "#DC2626" : "#94A3B8",
              }}
              autoComplete="tel"
              disabled={isLoading}
            />
            {errors.phone && <p style={errorStyle}>{errors.phone}</p>}
            <p style={{ fontSize: 11, color: "#64748B", marginTop: 4, textAlign: "left" }}>
              Used to send your access confirmation — no spam, ever.
            </p>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={isLoading}
            style={{
              width: "100%",
              padding: "13px 0",
              borderRadius: 10,
              background: isLoading
                ? "#93C5FD"
                : "linear-gradient(135deg, #1D4ED8, #0E7490)",
              color: "#fff",
              border: "none",
              fontSize: 15,
              fontWeight: 800,
              cursor: isLoading ? "not-allowed" : "pointer",
              fontFamily: "inherit",
              letterSpacing: "0.01em",
            }}
          >
            {isLoading ? "Redirecting to checkout…" : "Continue to Secure Checkout →"}
          </button>

          <p style={{ fontSize: 11, color: "#64748B", marginTop: 8, textAlign: "center" }}>
            🔒 Secure checkout via Stripe · One-time payment · No subscription
          </p>
        </form>
      </div>
    </div>
  );

  return createPortal(modal, document.body);
}
