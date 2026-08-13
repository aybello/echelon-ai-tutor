import type { RequestHandler } from "express";
import {
  aiTutorLimiter,
  authLimiter,
  commandDebriefLimiter,
  contactLimiter,
  generalLimiter,
} from "./rateLimit";

export type TrpcRateLimitPolicy =
  | "ai"
  | "auth"
  | "command_debrief"
  | "contact"
  | "general";

function extractProcedures(rawUrl: string): string[] {
  const path = rawUrl.split("?", 1)[0] ?? "";
  const marker = "/api/trpc/";
  const markerIndex = path.indexOf(marker);
  const procedurePath = markerIndex >= 0
    ? path.slice(markerIndex + marker.length)
    : path.replace(/^\/+/, "");

  try {
    return decodeURIComponent(procedurePath)
      .split(",")
      .map(value => value.trim())
      .filter(Boolean);
  } catch {
    return procedurePath.split(",").map(value => value.trim()).filter(Boolean);
  }
}

function isProcedure(procedure: string, namespace: string): boolean {
  return procedure === namespace || procedure.startsWith(`${namespace}.`);
}

/**
 * Select the strictest applicable policy for a normal or batched tRPC URL.
 * tRPC procedures use dotted names (for example tutor.chat), which Express
 * mount prefixes do not reliably match as path segments.
 */
export function getTrpcRateLimitPolicy(rawUrl: string): TrpcRateLimitPolicy {
  const procedures = extractProcedures(rawUrl);

  if (procedures.some(procedure =>
    procedure === "incidentCommand.debrief" ||
    procedure === "incidentCommand.evaluateJudgment"
  )) return "command_debrief";

  if (procedures.some(procedure =>
    isProcedure(procedure, "tutor") || isProcedure(procedure, "incidentCommand")
  )) return "ai";

  if (procedures.some(procedure => isProcedure(procedure, "contact"))) return "contact";

  if (procedures.some(procedure =>
    isProcedure(procedure, "auth") ||
    isProcedure(procedure, "dashboardAuth") ||
    isProcedure(procedure, "magicLink") ||
    isProcedure(procedure, "emailOtp")
  )) return "auth";

  return "general";
}

const limiterByPolicy: Record<TrpcRateLimitPolicy, RequestHandler> = {
  ai: aiTutorLimiter,
  auth: authLimiter,
  command_debrief: commandDebriefLimiter,
  contact: contactLimiter,
  general: generalLimiter,
};

export const trpcRateLimitDispatcher: RequestHandler = (req, res, next) => {
  const policy = getTrpcRateLimitPolicy(req.originalUrl || req.url);
  return limiterByPolicy[policy](req, res, next);
};
