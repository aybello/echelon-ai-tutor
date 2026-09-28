export const MANUS_PREVIEW_FRAME_ANCESTORS = [
  "'self'",
  "https://manus.im",
  "https://*.manus.im",
  "https://*.manus.computer",
] as const;

/**
 * Production pages must never be framed. The managed development preview is
 * intentionally embedded in Manus Studio, so it needs only the Manus preview
 * origins while NODE_ENV is development.
 */
export function frameAncestorsForEnvironment(nodeEnv = process.env.NODE_ENV): string[] {
  return nodeEnv === "development"
    ? [...MANUS_PREVIEW_FRAME_ANCESTORS]
    : ["'none'"];
}
