import { z } from "zod";

export const productPulseSubmitInputSchema = z.object({
  courseKey: z.string().trim().min(1).max(64),
  pagePath: z.string().trim().min(1).max(256),
  source: z.enum(["dashboard", "quick10", "practice"]),
  response: z.enum(["found_what_needed", "got_stuck", "suggestion"]),
  comment: z.string().trim().max(2000).optional().default(""),
});

export const productPulseListInputSchema = z.object({
  limit: z.number().int().min(1).max(500).default(200),
  page: z.number().int().min(1).max(1_000_000).default(1),
  response: z.enum(["all", "found_what_needed", "got_stuck", "suggestion"]).default("all"),
});
