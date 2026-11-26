// Province selection keeps the existing IDs, storage and recommendation callbacks.
import { X } from "lucide-react";
import { PROVINCE_LIST, type ProvinceId } from "@/hooks/useProvince";
import "./ProvinceBanner.css";

interface Props {
  onSelect: (id: ProvinceId) => void;
  onDismiss: () => void;
}

export default function ProvinceBanner({ onSelect, onDismiss }: Props) {
  return (
    <div className="province-banner">
      <div className="province-banner-inner">
        <span className="province-banner-label">Your province</span>
        <div className="province-banner-options" role="group" aria-label="Choose your province">
          {PROVINCE_LIST.map(p => (
            <button key={p.id} type="button" className="province-btn" onClick={() => onSelect(p.id)} title={p.name} aria-label={p.name}>
              <span className="province-code">{p.abbr}</span>
              <span className="province-name-full">{p.name}</span>
            </button>
          ))}
        </div>
        <button type="button" className="province-banner-dismiss" onClick={onDismiss} aria-label="Dismiss province selection" title="Dismiss">
          <X size={17} aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}
