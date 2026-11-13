import type { RequestHandler } from "express";

export const DATABASE_CUTOVER_MODE_ENV = "DATABASE_CUTOVER_MODE";
export const DATABASE_CUTOVER_FREEZE_VALUE = "freeze";
const SAFE_READ_PATHS = new Set(["/api/cutover/status", "/api/health"]);
const CUTOVER_CHALLENGE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function databaseWritesFrozen(environment = process.env): boolean {
  return environment[DATABASE_CUTOVER_MODE_ENV] === DATABASE_CUTOVER_FREEZE_VALUE;
}

export function cutoverStatusChallenge(value: unknown): string | null {
  return typeof value === "string" && CUTOVER_CHALLENGE.test(value) ? value : null;
}

/**
 * During the final external-database clone, reject every mutation before it can
 * reach Stripe, OAuth, tRPC, scheduled jobs, or any direct Express handler.
 * The explicit read allowlist prevents legacy state-changing GET handlers from
 * bypassing the fence during the snapshot window.
 */
export function databaseCutoverWriteFreeze(): RequestHandler {
  return (req, res, next) => {
    const normalizedPath = req.path.replace(/\/+$/, "") || "/";
    const isSafeRead =
      (req.method === "GET" || req.method === "HEAD") &&
      SAFE_READ_PATHS.has(normalizedPath);
    if (!databaseWritesFrozen() || isSafeRead) {
      return next();
    }
    res.set("Retry-After", "300");
    return res.status(503).json({
      error: "Echelon is completing a short database maintenance window. Please try again shortly.",
      code: "DATABASE_CUTOVER_WRITE_FREEZE",
    });
  };
}
