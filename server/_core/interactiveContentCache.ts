import type { RequestHandler } from "express";

/** Mount at /api/trpc before any middleware that can terminate the request. */
export const interactiveContentNoStore: RequestHandler = (req, res, next) => {
  // Match the last path segment as the tRPC Express adapter does, then decode
  // before splitting batches. URLSearchParams also preserves recognizable
  // procedure names when a different batch member has malformed encoding.
  const segment = req.path.slice(req.path.lastIndexOf("/") + 1);
  const escaped = segment.replace(/\+/g, "%2B").replace(/&/g, "%26");
  const decoded = new URLSearchParams(`path=${escaped}`).get("path") ?? "";
  if (decoded.split(",").some(path => path === "interactive.getContent" || path === "quiz.getInteractiveQuestions")) {
    res.setHeader("Cache-Control", "private, no-store");
  }
  next();
};
