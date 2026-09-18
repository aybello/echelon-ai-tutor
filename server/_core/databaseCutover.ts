import type { RequestHandler } from "express";

export const DATABASE_CUTOVER_MODE_ENV = "DATABASE_CUTOVER_MODE";
export const DATABASE_CUTOVER_FREEZE_VALUE = "freeze";

export function databaseWritesFrozen(environment = process.env): boolean {
  return environment[DATABASE_CUTOVER_MODE_ENV] === DATABASE_CUTOVER_FREEZE_VALUE;
}

/**
 * During the final external-database clone, reject every mutation before it can
 * reach Stripe, OAuth, tRPC, scheduled jobs, or any direct Express handler.
 * GET and HEAD remain available so the public site and health endpoint can be
 * checked while application writes are frozen.
 */
export function databaseCutoverWriteFreeze(): RequestHandler {
  return (req, res, next) => {
    if (!databaseWritesFrozen() || req.method === "GET" || req.method === "HEAD") {
      return next();
    }
    res.set("Retry-After", "300");
    return res.status(503).json({
      error: "Echelon is completing a short database maintenance window. Please try again shortly.",
      code: "DATABASE_CUTOVER_WRITE_FREEZE",
    });
  };
}
