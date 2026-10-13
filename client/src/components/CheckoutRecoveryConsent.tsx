import { CHECKOUT_RECOVERY_NOTICE } from "@shared/checkoutRecoveryConsent";

export default function CheckoutRecoveryConsent({
  checked,
  onChange,
  disabled = false,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <label
      style={{
        display: "flex",
        gap: 8,
        alignItems: "flex-start",
        textAlign: "left",
        margin: "12px 0",
        color: "#475569",
        fontSize: 12,
        lineHeight: 1.5,
      }}
    >
      <input
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={event => onChange(event.target.checked)}
        style={{ marginTop: 3, flexShrink: 0 }}
      />
      <span>
        {CHECKOUT_RECOVERY_NOTICE} Echelon Institute ·{" "}
        <a href="/privacy" target="_blank" rel="noopener noreferrer">
          Privacy policy
        </a>{" "}
        · abello@echeloninstitute.ca
      </span>
    </label>
  );
}
