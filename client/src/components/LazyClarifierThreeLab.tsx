import { lazy } from "react";

type ClarifierSurface = "guide" | "equipment";

function retryAfterChunkFailure(surface: ClarifierSurface): boolean {
  if (surface !== "equipment" || typeof window === "undefined") return false;
  const retryKey = `echelon_clarifier_chunk_retry_${surface}`;
  try {
    if (window.sessionStorage.getItem(retryKey)) return false;
    window.sessionStorage.setItem(retryKey, "1");
    window.location.reload();
    return true;
  } catch {
    return false;
  }
}

/**
 * Load the optional 3D learning model with a bounded wait. Callers must create
 * their own React.lazy wrapper so a rejected import in one route cannot be
 * cached by React and disable the other surface for the rest of the SPA session.
 * Browsers can also cache a failed ES-module fetch. The Process Guide retains
 * its immediate labelled-diagram fallback, while Equipment Lab receives one
 * guarded full-page retry because it is the dedicated 3D learning surface.
 */
export const loadClarifierThreeLab = (surface: ClarifierSurface) => {
  let timeoutId: ReturnType<typeof setTimeout> | undefined;
  const timeoutError = new Error("The interactive 3D model took too long to load.");
  const timeout = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => reject(timeoutError), 12_000);
  });
  const retryKey = `echelon_clarifier_chunk_retry_${surface}`;
  return Promise.race([surface === "equipment" ? import("./EquipmentClarifierThreeLab") : import("./ClarifierThreeLab"), timeout])
    .then(module => {
      try { window.sessionStorage.removeItem(retryKey); } catch { /* Storage may be disabled; the model is still usable. */ }
      return module;
    })
    .catch(error => {
      if (error === timeoutError) throw error;
      if (retryAfterChunkFailure(surface)) return new Promise<never>(() => undefined);
      throw error;
    })
    .finally(() => clearTimeout(timeoutId));
};

export const createLazyClarifierThreeLab = (surface: ClarifierSurface) => lazy(() => loadClarifierThreeLab(surface));
