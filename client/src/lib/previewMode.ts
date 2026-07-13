// Owner preview mode — lets the site owner bypass all paywalls for testing.
// Activate by visiting: /preview?key=d200f5c012ca384309b488e742d725e0
// Deactivate by visiting: /preview?disable=1

const PREVIEW_KEY = "d200f5c012ca384309b488e742d725e0";
const STORAGE_KEY = "echelon_preview_mode";

export function isPreviewModeActive(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEY) === "1";
  } catch {
    return false;
  }
}

export function enablePreviewMode() {
  try {
    localStorage.setItem(STORAGE_KEY, "1");
  } catch {
    // ignore
  }
}

export function disablePreviewMode() {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}

export { PREVIEW_KEY };
