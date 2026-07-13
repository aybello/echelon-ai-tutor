// useProvince — persists the user's selected province in localStorage
// Returns the current province ID, a setter, and whether the prompt has been dismissed

import { useState, useEffect } from "react";

export type ProvinceId = "on" | "bc" | "ab" | "sk" | "mb";

export interface ProvinceInfo {
  id: ProvinceId;
  name: string;
  abbr: string;
  flag: string;
  track: "ontario" | "wpi"; // which course track to show first
}

export const PROVINCE_LIST: ProvinceInfo[] = [
  { id: "on", name: "Ontario",        abbr: "ON", flag: "🍁", track: "ontario" },
  { id: "bc", name: "British Columbia", abbr: "BC", flag: "🌲", track: "wpi"     },
  { id: "ab", name: "Alberta",         abbr: "AB", flag: "🌾", track: "wpi"     },
  { id: "sk", name: "Saskatchewan",    abbr: "SK", flag: "🌻", track: "wpi"     },
  { id: "mb", name: "Manitoba",        abbr: "MB", flag: "🦌", track: "wpi"     },
];

const STORAGE_KEY = "echelon_province";
const DISMISSED_KEY = "echelon_province_dismissed";

export function useProvince() {
  const [province, setProvinceState] = useState<ProvinceId | null>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return (stored as ProvinceId) ?? null;
    } catch {
      return null;
    }
  });

  const [dismissed, setDismissedState] = useState<boolean>(() => {
    try {
      return localStorage.getItem(DISMISSED_KEY) === "true";
    } catch {
      return false;
    }
  });

  const setProvince = (id: ProvinceId) => {
    setProvinceState(id);
    setDismissedState(true);
    try {
      localStorage.setItem(STORAGE_KEY, id);
      localStorage.setItem(DISMISSED_KEY, "true");
    } catch { /* ignore */ }
  };

  const dismiss = () => {
    setDismissedState(true);
    try {
      localStorage.setItem(DISMISSED_KEY, "true");
    } catch { /* ignore */ }
  };

  const reset = () => {
    setProvinceState(null);
    setDismissedState(false);
    try {
      localStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem(DISMISSED_KEY);
    } catch { /* ignore */ }
  };

  const provinceInfo = PROVINCE_LIST.find(p => p.id === province) ?? null;

  // Show prompt if not dismissed and no province selected
  const showPrompt = !dismissed && province === null;

  return { province, provinceInfo, setProvince, dismiss, reset, showPrompt };
}
